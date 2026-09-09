import { apiClient } from './api.client';
import { API_ENDPOINTS } from '@/core/config/api.config';
import { storage } from '@/core/utils/storage.utils';
import {
  LoginCredentials,
  RegisterCredentials,
  AuthResponseData,
} from '@/core/interfaces/auth.interfaces';
import { ApiResponse } from '@/core/interfaces/api.interfaces';
import { UserInterface } from '@/core/interfaces/user.interfaces';

export class AuthService {
  /**
   * Iniciar sesión en el backend
   */
  static async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponseData>> {
    const response = await apiClient.post<AuthResponseData>(
      API_ENDPOINTS.AUTH_LOGIN,
      credentials,
      { requiresAuth: false }
    );

    if (response.data?.token) {
      storage.setToken(response.data.token);
      if (response.data.user) {
        storage.setUser(response.data.user);
      }
    }

    return response;
  }

  /**
   * Registro de nuevo usuario
   */
  static async register(data: RegisterCredentials): Promise<ApiResponse<UserInterface>> {
    return apiClient.post<UserInterface>(API_ENDPOINTS.AUTH_REGISTER, data, {
      requiresAuth: false,
    });
  }

  /**
   * Obtener perfil del usuario autenticado
   */
  static async me(): Promise<ApiResponse<UserInterface>> {
    return apiClient.get<UserInterface>(API_ENDPOINTS.AUTH_ME);
  }

  /**
   * Cerrar sesión limpiando tokens locales
   */
  static logout(): void {
    storage.clearAuth();
  }
}

export default AuthService;
