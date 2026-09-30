export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export interface CreateUserInput {
  id: string;
  name: string;
  email: string;
  createdAt?: Date;
}

export function createUser(input: CreateUserInput): User {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  if (!name) {
    throw new Error("User name is required");
  }
  if (!email) {
    throw new Error("User email is required");
  }
  return {
    id: input.id,
    name,
    email,
    createdAt: input.createdAt ?? new Date(),
  };
}
