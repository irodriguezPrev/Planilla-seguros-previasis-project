/**
 * Interfaz de Usuario compatible con el modelo backend (backend/src/interfaces/example.interfaces.ts)
 */
export interface UserInterface {
  user_id?: number;
  name: string;
  password?: string;
  status: boolean;
  role: string;
  ci?: string;
  email?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export type CreateUserDto = Omit<UserInterface, 'user_id' | 'createdAt' | 'updatedAt'>;
export type UpdateUserDto = Partial<CreateUserDto>;

export default UserInterface;
