'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { UserInterface } from '@/core/interfaces/user.interfaces';
import { LoginCredentials, RegisterCredentials } from '@/core/interfaces/auth.interfaces';
import { AuthService } from '@/core/services/auth.service';
import { storage } from '@/core/utils/storage.utils';

interface AuthContextType {
  user: UserInterface | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterCredentials) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserInterface | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const initAuth = useCallback(() => {
    try {
      const storedToken = storage.getToken();
      const storedUser = storage.getUser<UserInterface>();

      if (storedToken) {
        setToken(storedToken);
        if (storedUser) {
          setUser(storedUser);
        }
      }
    } catch (e) {
      console.error('Error al inicializar sesión:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const res = await AuthService.login(credentials);
      if (res.data?.token) {
        setToken(res.data.token);
        if (res.data.user) {
          setUser(res.data.user);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterCredentials) => {
    setIsLoading(true);
    try {
      await AuthService.register(data);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    AuthService.logout();
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await AuthService.me();
      if (res.data) {
        setUser(res.data);
        storage.setUser(res.data);
      }
    } catch (err) {
      console.error('Error refrescando usuario:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext debe usarse dentro de un AuthProvider');
  }
  return context;
};
