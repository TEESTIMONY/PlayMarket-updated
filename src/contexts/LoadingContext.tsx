import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
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

  const incrementLoading = useCallback(() => {
    setLoadingCount(prev => prev + 1);
  }, []);

  const decrementLoading = useCallback(() => {
    setLoadingCount(prev => Math.max(0, prev - 1));
  }, []);
  
  const showLoading = useCallback(() => {
    incrementLoading();
  }, [incrementLoading]);

  const hideLoading = useCallback(() => {
    decrementLoading();
  }, [decrementLoading]);

  const contextValue = useMemo(
    () => ({
      isLoading,
      setIsLoading: (loading: boolean) => setLoadingCount(loading ? 1 : 0),
      showLoading,
      hideLoading,
      loadingCount,
      incrementLoading,
      decrementLoading,
    }),
    [isLoading, showLoading, hideLoading, loadingCount, incrementLoading, decrementLoading]
  );

  return (
    <LoadingContext.Provider value={contextValue}>
      {children}
    </LoadingContext.Provider>
  );
};
