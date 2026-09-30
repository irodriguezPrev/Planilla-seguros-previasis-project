import { UserRepository } from "../../application/ports/user.repository";
import { User } from "../../domain/users/user";

export class InMemoryUserRepository implements UserRepository {
  private users = new Map<string, User>();

  async create(user: User): Promise<User> {
    this.users.set(user.id, user);
    return user;
  }

  async findAll(): Promise<User[]> {
    return [...this.users.values()];
  }

  async existsByEmail(email: string): Promise<boolean> {
    return [...this.users.values()].some((user) => user.email === email);
  }
}
