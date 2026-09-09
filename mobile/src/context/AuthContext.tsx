import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authStorage } from '../storage/authStorage';
import { authApi } from '../api/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  demoLogin: () => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = await authStorage.getToken();
        const storedUser = await authStorage.getUser();

        if (storedToken) {
          setToken(storedToken);
          if (storedUser) {
            setUser(storedUser);
          }
          // Verify with backend
          try {
            const res = await authApi.getMe();
            setUser(res.user);
            await authStorage.saveUser(res.user);
          } catch (e) {
            console.log('Session expired or offline fallback:', e);
          }
        }
      } catch (e) {
        console.error('Error restoring auth state:', e);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    setUser(res.user);
    setToken(res.token);
    await authStorage.saveToken(res.token);
    await authStorage.saveUser(res.user);
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await authApi.register({ name, email, password });
    setUser(res.user);
    setToken(res.token);
    await authStorage.saveToken(res.token);
    await authStorage.saveUser(res.user);
  };

  const demoLogin = async () => {
    await login('demo@moviemind.ai', 'password123');
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await authStorage.clear();
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    authStorage.saveUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        demoLogin,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
