import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { apiService } from '../services/api';

interface AuthContextType {
  isAuthenticated: boolean;
  username: string | null;
  balance: number | null;
  balanceLoading: boolean;
  login: (username: string, password: string) => void;
  logout: () => void;
  refreshBalance: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
// testtttt

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const storedUsername = localStorage.getItem('username');
    const storedPassword = localStorage.getItem('password');

    if (storedUsername && storedPassword) {
      setIsAuthenticated(true);
      setUsername(storedUsername);
    }
  }, []);

  // Separate effect for balance management when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Fetch real balance from API
      const fetchBalance = async () => {
        setBalanceLoading(true);
        try {
          const response = await apiService.getUserBalance();
          setBalance(response.balance);
          localStorage.setItem('lastBalanceRefresh', Date.now().toString());
        } catch (error) {
          console.error('Failed to refresh balance:', error);
          // Keep existing balance or set to 0 if API fails
          setBalance(prev => prev || 0);
        } finally {
          setBalanceLoading(false);
        }
      };
      fetchBalance();
    }
  }, [isAuthenticated]);

  const login = (username: string, password: string) => {
    // In a real app, this would validate credentials with the server
    // For now, we'll just mock authentication
    localStorage.setItem('username', username);
    localStorage.setItem('password', password);
    setIsAuthenticated(true);
    setUsername(username);
    
    // Store credentials for API authentication
    localStorage.setItem('token', btoa(`${username}:${password}`));
  };

  const refreshBalance = async () => {
    if (!isAuthenticated) return;
    
    setBalanceLoading(true);
    try {
      const response = await apiService.getUserBalance();
      setBalance(response.balance);
      localStorage.setItem('lastBalanceRefresh', Date.now().toString());
    } catch (error) {
      console.error('Failed to refresh balance:', error);
      // Keep existing balance or set to 0 if API fails
      setBalance(prev => prev || 0);
    } finally {
      setBalanceLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('username');
    localStorage.removeItem('password');
    localStorage.removeItem('admin_username');
    localStorage.removeItem('admin_password');
    setIsAuthenticated(false);
    setUsername(null);
    setBalance(null);
  };

  const value: AuthContextType = {
    isAuthenticated,
    username,
    balance,
    balanceLoading,
    login,
    logout,
    refreshBalance,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};