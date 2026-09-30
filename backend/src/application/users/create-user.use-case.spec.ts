import { describe, expect, it } from "vitest";
import { CreateUserUseCase, UserAlreadyExistsError } from "./create-user.use-case";
import { InMemoryUserRepository } from "../../infrastructure/persistence/in-memory-user.repository";

describe("CreateUserUseCase", () => {
  it("creates a normalized user", async () => {
    const useCase = new CreateUserUseCase(new InMemoryUserRepository());
    const user = await useCase.execute({ name: " Ada Lovelace ", email: "ADA@EXAMPLE.COM" });
    expect(user.name).toBe("Ada Lovelace");
    expect(user.email).toBe("ada@example.com");
    expect(user.id).toEqual(expect.any(String));
  });

  it("rejects duplicated emails", async () => {
    const useCase = new CreateUserUseCase(new InMemoryUserRepository());
    const input = { name: "Ada Lovelace", email: "ada@example.com" };
    await useCase.execute(input);
    await expect(useCase.execute(input)).rejects.toBeInstanceOf(UserAlreadyExistsError);
  });
});
