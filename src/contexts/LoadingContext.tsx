import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface LoadingContextType {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  showLoading: () => void;
  hideLoading: () => void;
  loadingCount: number;
  incrementLoading: () => void;
  decrementLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

interface LoadingProviderProps {
  children: ReactNode;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const [loadingCount, setLoadingCount] = useState(0);
  const isLoading = loadingCount > 0;

  const incrementLoading = () => setLoadingCount(prev => prev + 1);
  const decrementLoading = () => setLoadingCount(prev => Math.max(0, prev - 1));
  
  const showLoading = () => incrementLoading();
  const hideLoading = () => decrementLoading();

  return (
    <LoadingContext.Provider value={{ 
      isLoading, 
      setIsLoading: (loading) => setLoadingCount(loading ? 1 : 0),
      showLoading, 
      hideLoading,
      loadingCount,
      incrementLoading,
      decrementLoading
    }}>
      {children}
    </LoadingContext.Provider>
  );
};
