import { UserInterface } from './user.interfaces';

export interface LoginCredentials {
  name?: string;
  email?: string;
  ci?: string;
  password?: string;
}

export interface RegisterCredentials {
  name: string;
  password?: string;
  role?: string;
  status?: boolean;
  ci?: string;
  email?: string;
}

export interface AuthTokenPayload {
  user_id?: number;
  ci?: string;
  role?: string;
  name?: string;
  exp?: number;
  iat?: number;
}

export interface AuthResponseData {
  token: string;
  user: UserInterface;
}

export interface AuthState {
  user: UserInterface | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
