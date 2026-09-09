/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  /**
   * Proxy reverso para desarrollo local.
   * Todas las peticiones a /proxy-api/* se redirigen al backend Express,
   * eliminando problemas de CORS al mantener el mismo origen.
   */
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3004';
    return [
      // Proxy principal: /proxy-api/:path* → backend/api/:path*
      {
        source: '/proxy-api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
      // Proxy para Socket.IO (polling transport)
      {
        source: '/proxy-socket/:path*',
        destination: `${backendUrl}/socket.io/:path*`,
      },
    ];
  },

  /**
   * Headers CORS permisivos para desarrollo local.
   * Permite que el frontend en localhost:3000 acceda a recursos
   * sin restricciones durante el desarrollo.
   */
  async headers() {
    // Solo aplicar headers CORS permisivos en desarrollo
    if (process.env.NODE_ENV === 'production') {
      return [];
    }

    return [
      {
        // Aplicar a todas las rutas proxy
        source: '/proxy-api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, PATCH, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-Requested-With' },
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
        ],
      },
      {
        // Aplicar a rutas de socket
        source: '/proxy-socket/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
        ],
      },
    ];
  },
};

export default nextConfig;
