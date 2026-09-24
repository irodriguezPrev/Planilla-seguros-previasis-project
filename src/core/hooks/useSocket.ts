'use client';

import { useEffect, useCallback } from 'react';
import { useSocketContext } from '@/features/context/SocketContext';

export const useSocket = () => {
  const { socket, isConnected, socketId, reconnect } = useSocketContext();

  const on = useCallback(
    (event: string, callback: (...args: any[]) => void) => {
      if (!socket) return;
      socket.on(event, callback);
      return () => {
        socket.off(event, callback);
      };
    },
    [socket]
  );

  const emit = useCallback(
    (event: string, data?: any) => {
      if (!socket || !isConnected) return;
      socket.emit(event, data);
    },
    [socket, isConnected]
  );

  return {
    socket,
    isConnected,
    socketId,
    reconnect,
    on,
    emit,
  };
};

export default useSocket;
