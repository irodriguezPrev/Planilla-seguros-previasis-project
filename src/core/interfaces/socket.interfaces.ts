/**
 * Interfaces para eventos y estado de Socket.IO con el Backend Express
 */
export interface SocketServerToClientEvents {
  matchApproved: (data: { matchId: number | string }) => void;
  matchRejected: (data: { matchId: number | string }) => void;
  notification: (data: { title: string; message: string; type?: 'info' | 'success' | 'warning' | 'error' }) => void;
  [key: string]: (...args: any[]) => void;
}

export interface SocketClientToServerEvents {
  approveMatch: (data: { matchId: number | string }) => void;
  rejectMatch: (data: { matchId: number | string }) => void;
  [key: string]: (...args: any[]) => void;
}

export interface SocketState {
  isConnected: boolean;
  socketId: string | null;
  lastEvent: string | null;
}
