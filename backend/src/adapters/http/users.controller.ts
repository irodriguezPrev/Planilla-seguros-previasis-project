import { Request, Response } from "express";
import { z } from "zod";
import { CreateUserUseCase, UserAlreadyExistsError } from "../../application/users/create-user.use-case";
import { ListUsersUseCase } from "../../application/users/list-users.use-case";

const createUserSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
});

export class UsersController {
  constructor(
    private readonly createUser: CreateUserUseCase,
    private readonly listUsers: ListUsersUseCase
  ) {}

  create = async (request: Request, response: Response): Promise<void> => {
    const result = createUserSchema.safeParse(request.body);
    if (!result.success) {
      response.status(400).json({ message: "Invalid request body", issues: result.error.issues });
      return;
    }
    try {
      const user = await this.createUser.execute(result.data);
      response.status(201).json({ data: user });
    } catch (error) {
      if (error instanceof UserAlreadyExistsError) {
        response.status(409).json({ message: error.message });
        return;
      }
      throw error;
    }
  };

  list = async (_request: Request, response: Response): Promise<void> => {
    const users = await this.listUsers.execute();
    response.status(200).json({ data: users });
  };
}
