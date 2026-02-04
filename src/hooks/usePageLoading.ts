import { useEffect } from 'react';
import { useLoading } from '../contexts/LoadingContext';

/**
 * Custom hook for managing page-level loading states
 * Ensures coordinated loading between Suspense and page content
 */
export const usePageLoading = (isLoading: boolean, dependencies: any[] = []) => {
  const { showLoading, hideLoading } = useLoading();

  useEffect(() => {
    if (isLoading) {
      showLoading();
    } else {
      // Add a small delay to prevent flickering
      const timer = setTimeout(() => {
        hideLoading();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading, ...dependencies]);
};