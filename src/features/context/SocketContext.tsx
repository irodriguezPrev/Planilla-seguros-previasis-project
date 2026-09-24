'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppSocket, SocketService } from '@/core/services/socket.service';
import { useAuthContext } from './AuthContext';

interface SocketContextType {
  socket: AppSocket | null;
  isConnected: boolean;
  socketId: string | null;
  reconnect: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isAuthenticated } = useAuthContext();
  const [socket, setSocket] = useState<AppSocket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [socketId, setSocketId] = useState<string | null>(null);

  useEffect(() => {
    // Si no está autenticado o no hay token, desconectar
    if (!isAuthenticated || !token) {
      if (socket) {
        SocketService.disconnect();
        setSocket(null);
        setIsConnected(false);
        setSocketId(null);
      }
      return;
    }

    const sock = SocketService.connect(token);
    setSocket(sock);

    const onConnect = () => {
      setIsConnected(true);
      setSocketId(sock.id || null);
    };

    const onDisconnect = () => {
      setIsConnected(false);
      setSocketId(null);
    };

    sock.on('connect', onConnect);
    sock.on('disconnect', onDisconnect);

    if (sock.connected) {
      setIsConnected(true);
      setSocketId(sock.id || null);
    }

    return () => {
      sock.off('connect', onConnect);
      sock.off('disconnect', onDisconnect);
    };
  }, [token, isAuthenticated]);

  const reconnect = () => {
    if (token) {
      const sock = SocketService.connect(token);
      setSocket(sock);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected, socketId, reconnect }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocketContext = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketContext debe usarse dentro de un SocketProvider');
  }
  return context;
};
