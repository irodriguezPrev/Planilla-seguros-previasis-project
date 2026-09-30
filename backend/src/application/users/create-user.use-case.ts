import { randomUUID } from "node:crypto";
import { createUser, User } from "../../domain/users/user";
import { UserRepository } from "../ports/user.repository";

export interface CreateUserDTO {
  name: string;
  email: string;
}

export class UserAlreadyExistsError extends Error {
  constructor(email: string) {
    super(`A user with email ${email} already exists`);
    this.name = "UserAlreadyExistsError";
  }
}

export class CreateUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: CreateUserDTO): Promise<User> {
    const email = input.email.trim().toLowerCase();
    if (await this.userRepository.existsByEmail(email)) {
      throw new UserAlreadyExistsError(email);
    }
    const user = createUser({
      id: randomUUID(),
      name: input.name,
      email,
    });
    return this.userRepository.create(user);
  }
}
