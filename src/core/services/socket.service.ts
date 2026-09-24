import { io, Socket } from 'socket.io-client';
import { envConfig } from '@/core/config/env.config';
import { storage } from '@/core/utils/storage.utils';
import {
  SocketServerToClientEvents,
  SocketClientToServerEvents,
} from '@/core/interfaces/socket.interfaces';

export type AppSocket = Socket<SocketServerToClientEvents, SocketClientToServerEvents>;

let socketInstance: AppSocket | null = null;

export class SocketService {
  /**
   * Obtiene o inicializa la conexión con el servidor Socket.IO
   */
  static getSocket(tokenOverride?: string): AppSocket {
    const token = tokenOverride || storage.getToken();

    if (!socketInstance || socketInstance.disconnected) {
      socketInstance = io(envConfig.socketUrl || window.location.origin, {
        auth: {
          token: token || '',
        },
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        transports: ['websocket', 'polling'],
        // En desarrollo: usar el proxy path de Next.js para polling
        ...(envConfig.isDev ? { path: '/proxy-socket/' } : {}),
      });
    } else if (token && socketInstance.auth) {
      (socketInstance.auth as any).token = token;
    }

    return socketInstance;
  }

  /**
   * Conectar socket si no está activo
   */
  static connect(token?: string): AppSocket {
    const socket = this.getSocket(token);
    if (!socket.connected) {
      socket.connect();
    }
    return socket;
  }

  /**
   * Desconectar socket
   */
  static disconnect(): void {
    if (socketInstance) {
      socketInstance.disconnect();
      socketInstance = null;
    }
  }

  /**
   * Aprobar un match (evento compatible con backend)
   */
  static approveMatch(matchId: number | string): void {
    if (socketInstance?.connected) {
      socketInstance.emit('approveMatch', { matchId });
    }
  }

  /**
   * Rechazar un match (evento compatible con backend)
   */
  static rejectMatch(matchId: number | string): void {
    if (socketInstance?.connected) {
      socketInstance.emit('rejectMatch', { matchId });
    }
  }
}

export default SocketService;
