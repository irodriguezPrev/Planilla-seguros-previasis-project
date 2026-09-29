/**
 * Variables de entorno centralizadas y tipadas.
 * 
 * El navegador usa una ruta del mismo origen y Next.js la reenvía
 * internamente a Express.
 */
const isDev = process.env.NODE_ENV !== 'production';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '/backend-api';

export const envConfig = {
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'Previasis',
  appEnv: process.env.NEXT_PUBLIC_APP_ENV || 'development',
  backendUrl,
  apiUrl: process.env.NEXT_PUBLIC_API_URL || `${backendUrl}/api`,
  socketUrl: isDev
    ? '' // Ruta relativa — mismo origen en desarrollo
    : (process.env.NEXT_PUBLIC_SOCKET_URL || backendUrl),
  isDev,
  isProd: !isDev,
};

export default envConfig;

