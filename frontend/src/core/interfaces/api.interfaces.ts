/**
 * Formato estándar de respuesta del backend Express:
 * { message: string, data?: T }
 */
export interface ApiResponse<T = any> {
  message: string;
  data?: T;
  status?: number;
}

export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]> | string[];
}

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
  requiresAuth?: boolean;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
