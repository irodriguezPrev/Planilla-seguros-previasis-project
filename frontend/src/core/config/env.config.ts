/**
 * Variables de entorno centralizadas y tipadas.
 * 
 * En desarrollo local, las peticiones API y Socket pasan por el proxy
 * de Next.js (rutas relativas /proxy-api y /proxy-socket) para evitar
 * problemas de CORS al mantener el mismo origen.
 * 
 * En producción, se usan las URLs absolutas del backend.
 */
const isDev = process.env.NODE_ENV !== 'production';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3004';

export const envConfig = {
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'Previasis',
  appEnv: process.env.NEXT_PUBLIC_APP_ENV || 'development',
  backendUrl,
  // En desarrollo: ruta relativa al proxy de Next.js → evita CORS
  // En producción: URL absoluta al backend
  apiUrl: isDev
    ? '/proxy-api'
    : (process.env.NEXT_PUBLIC_API_URL || `${backendUrl}/api`),
  socketUrl: isDev
    ? '' // Ruta relativa — mismo origen en desarrollo
    : (process.env.NEXT_PUBLIC_SOCKET_URL || backendUrl),
  isDev,
  isProd: !isDev,
};

export default envConfig;

