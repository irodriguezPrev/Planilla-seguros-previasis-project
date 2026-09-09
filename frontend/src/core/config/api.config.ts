import { envConfig } from './env.config';

/**
 * Endpoints del Backend Express
 * Coinciden con las rutas montadas en backend/src/server/server.ts
 */
export const API_ENDPOINTS = {
  // Rutas base
  HEALTH: `${envConfig.apiUrl}/health`,
  
  // Módulo de Usuarios / Autenticación
  USERS: `${envConfig.apiUrl}/users`,
  USER_BY_ID: (id: number | string) => `${envConfig.apiUrl}/users/${id}`,
  USER_SOFT_DELETE: (id: number | string) => `${envConfig.apiUrl}/users/${id}`,
  USER_HARD_DELETE: (id: number | string) => `${envConfig.apiUrl}/users/delete/${id}`,
  
  // Autenticación / Credenciales
  AUTH_LOGIN: `${envConfig.apiUrl}/credential/login`,
  AUTH_REGISTER: `${envConfig.apiUrl}/credential/register`,
  AUTH_ME: `${envConfig.apiUrl}/credential/me`,
  
  // Módulos del Sistema (espejo de server.ts)
  AURA_RECORDS: `${envConfig.apiUrl}/aura_record`,
  CAREERS: `${envConfig.apiUrl}/career`,
  PLAYERS: `${envConfig.apiUrl}/player`,
  TOURNAMENTS: `${envConfig.apiUrl}/tournament`,
  TEAMS: `${envConfig.apiUrl}/team`,
  INSCRIPTIONS: `${envConfig.apiUrl}/inscription`,
  MATCHES: `${envConfig.apiUrl}/match`,
  SETS: `${envConfig.apiUrl}/set`,
  CREDENTIALS: `${envConfig.apiUrl}/credential`,
} as const;

export const API_TIMEOUT = 15000; // 15 segundos
