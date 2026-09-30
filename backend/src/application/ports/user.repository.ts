import { User } from "../../domain/users/user";

export interface UserRepository {
  create(user: User): Promise<User>;
  findAll(): Promise<User[]>;
  existsByEmail(email: string): Promise<boolean>;
}
