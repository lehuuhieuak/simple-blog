'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { authQueryKeys } from '@/hooks/api/auth';
import { handleApiError, isAuthError } from '@/lib/api-error-handler';

interface User {
  id: number;
  email: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  const checkAuth = async () => {
    try {
      const userData = await apiClient.auth.getMe();
      setUser(userData);
    } catch (error) {
      console.error('Auth check failed:', handleApiError(error));
      setUser(null);
      // Clear invalid token only if it's an auth error
      if (isAuthError(error)) {
        localStorage.removeItem('auth-token');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.auth.login({ email, password });
      setUser(response.user);
      // Set user data in query cache
      queryClient.setQueryData(authQueryKeys.user, response.user);
      return { success: true };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  };

  const register = async (email: string, username: string, password: string) => {
    try {
      const response = await apiClient.auth.register({ email, username, password });
      setUser(response.user);
      // Set user data in query cache
      queryClient.setQueryData(authQueryKeys.user, response.user);
      return { success: true };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  };

  const logout = async () => {
    try {
      await apiClient.auth.logout();
    } catch (error) {
      console.error('Logout error:', handleApiError(error));
    } finally {
      setUser(null);
      // Clear all query cache on logout
      queryClient.clear();
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      checkAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}