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
  const [username, setUsername] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication state on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in
        const token = await user.getIdToken();
        localStorage.setItem('firebase_token', token);
        
        // Send token to backend to get JWT
        try {
          const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
          
          const response = await fetch(`${baseURL}/api/auth/login/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id_token: token }),
          });
          
          if (response.ok) {
            const data = await response.json();
            localStorage.setItem('jwt_token', data.token);
            setIsAuthenticated(true);
            setUsername(data.user.username);
            setEmail(data.user.email);
            
            // Fetch balance after authentication is fully established
            setTimeout(() => fetchBalance(), 100);
          } else {
            // Handle authentication error
            const errorText = await response.text();
            console.error('Authentication failed:', response.status, errorText);
            await handleLogout();
          }
        } catch (error) {
          console.error('Authentication error:', error);
          await handleLogout();
        }
      } else {
        // User is signed out
        setIsAuthenticated(false);
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
      const token = await user.getIdToken();
      
      localStorage.setItem('firebase_token', token);
      
      // Send token to backend to get JWT
      const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      
      const response = await fetch(`${baseURL}/api/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id_token: token }),
      });
      
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('jwt_token', data.token);
        setIsAuthenticated(true);
        setUsername(data.user.username);
        setEmail(data.user.email);
        
        // Fetch balance after authentication is fully established
        setTimeout(() => fetchBalance(), 100);
      } else {
        const errorText = await response.text();
        console.error('Google Sign-In failed:', response.status, errorText);
        throw new Error('Authentication failed');
      }
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