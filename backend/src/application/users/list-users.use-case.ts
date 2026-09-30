import { User } from "../../domain/users/user";
import { UserRepository } from "../ports/user.repository";

export class ListUsersUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  execute(): Promise<User[]> {
    return this.userRepository.findAll();
  }
}
