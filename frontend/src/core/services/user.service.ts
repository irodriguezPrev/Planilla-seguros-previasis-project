import { apiClient } from './api.client';
import { API_ENDPOINTS } from '@/core/config/api.config';
import { ApiResponse } from '@/core/interfaces/api.interfaces';
import { UserInterface, CreateUserDto, UpdateUserDto } from '@/core/interfaces/user.interfaces';

export class UserService {
  /**
   * Obtener todos los usuarios (GET /api/users)
   */
  static async getAll(): Promise<ApiResponse<UserInterface[]>> {
    return apiClient.get<UserInterface[]>(API_ENDPOINTS.USERS);
  }

  /**
   * Obtener un usuario por ID (GET /api/users/:id)
   */
  static async getOne(id: number | string): Promise<ApiResponse<UserInterface>> {
    return apiClient.get<UserInterface>(API_ENDPOINTS.USER_BY_ID(id));
  }

  /**
   * Crear un nuevo usuario (POST /api/users)
   */
  static async create(userData: CreateUserDto): Promise<ApiResponse<UserInterface>> {
    return apiClient.post<UserInterface>(API_ENDPOINTS.USERS, userData);
  }

  /**
   * Actualizar usuario existente (PUT /api/users/:id)
   */
  static async update(id: number | string, userData: UpdateUserDto): Promise<ApiResponse<UserInterface>> {
    return apiClient.put<UserInterface>(API_ENDPOINTS.USER_BY_ID(id), userData);
  }

  /**
   * Eliminación lógica (soft delete) (DELETE /api/users/:id)
   */
  static async softDelete(id: number | string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(API_ENDPOINTS.USER_SOFT_DELETE(id));
  }

  /**
   * Eliminación física permanente (DELETE /api/users/delete/:id)
   */
  static async delete(id: number | string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(API_ENDPOINTS.USER_HARD_DELETE(id));
  }
}

export default UserService;
