import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';
import { jwtDecode } from 'jwt-decode';
import { apiService } from '../services/api';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

interface AuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  username: string | null;
  email: string | null;
  balance: number | null;
  balanceLoading: boolean;
  isLoading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
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

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const exchangeFirebaseToken = async (idToken: string) => {
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

    const response = await fetch(`${baseURL}/api/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id_token: idToken }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Authentication failed (${response.status}): ${errorText}`);
    }

    return response.json();
  };

  // Check authentication state on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in
        const token = await user.getIdToken(true);
        localStorage.setItem('firebase_token', token);
        
        // Send token to backend to get JWT
        try {
          const data = await exchangeFirebaseToken(token);
          localStorage.setItem('jwt_token', data.token);
          setIsAuthenticated(true);
          setIsAdmin(Boolean(data?.user?.is_admin));
          setUsername(data.user.username);
          setEmail(data.user.email);

          // Fetch balance after authentication is fully established
          setTimeout(() => fetchBalance(), 100);
        } catch (error) {
          console.error('Authentication error:', error);
          await handleLogout();
        }
      } else {
        // User is signed out
        setIsAuthenticated(false);
        setIsAdmin(false);
        setUsername(null);
        setEmail(null);
        setBalance(null);
        localStorage.removeItem('firebase_token');
        localStorage.removeItem('jwt_token');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch balance when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchBalance();
    }
  }, [isAuthenticated]);

  const fetchBalance = async () => {
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

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const token = await user.getIdToken(true);
      
      localStorage.setItem('firebase_token', token);

      const data = await exchangeFirebaseToken(token);
      localStorage.setItem('jwt_token', data.token);
      setIsAuthenticated(true);
      setIsAdmin(Boolean(data?.user?.is_admin));
      setUsername(data.user.username);
      setEmail(data.user.email);

      // Fetch balance after authentication is fully established
      setTimeout(() => fetchBalance(), 100);
    } catch (error) {
      console.error('Google Sign-In error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsAuthenticated(false);
      setIsAdmin(false);
      setUsername(null);
      setEmail(null);
      setBalance(null);
      localStorage.removeItem('firebase_token');
      localStorage.removeItem('jwt_token');
    } catch (error) {
      console.error('Logout error:', error);
    }
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

  const value: AuthContextType = {
    isAuthenticated,
    isAdmin,
    username,
    email,
    balance,
    balanceLoading,
    isLoading,
    loginWithGoogle,
    logout: handleLogout,
    refreshBalance,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};