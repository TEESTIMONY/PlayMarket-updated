import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy, useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoadingProvider, useLoading } from './contexts/LoadingContext';

// Lazy load pages for faster initial load
const AuctionPage = lazy(() => import('./pages/AuctionPage'));
const RedeemPage = lazy(() => import('./pages/RedeemPage'));
const BountiesPage = lazy(() => import('./pages/BountiesPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));

import './App.css'

// Enhanced loading component with proper coordination
const EnhancedLoadingFallback: React.FC = () => {
  const { isLoading } = useLoading();
  const [hasShownMinimumTime, setHasShownMinimumTime] = useState(false);

  useEffect(() => {
    // Ensure loading spinner shows for at least 2 seconds for better UX
    const timer = setTimeout(() => {
      setHasShownMinimumTime(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Show fallback if:
  // 1. We haven't shown the minimum time yet, OR
  // 2. The loading context indicates we're still loading
  if (!hasShownMinimumTime || isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return null;
};

function AppContent() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  return (
    <Router>
      <Suspense fallback={<EnhancedLoadingFallback />}>
        <Routes>
          <Route path="/" element={<AuctionPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin-login" element={<AdminLoginPage />} />
          <Route path="/bounties" element={<BountiesPage />} />
          <Route path="/redeem" element={<RedeemPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route
            path="/admin/super-secret-key"
            element={
              isLoading ? (
                <EnhancedLoadingFallback />
              ) : (isAuthenticated && isAdmin) ? (
                <AdminPage />
              ) : (
                <Navigate to="/admin-login" replace />
              )
            }
          />
        </Routes>
      </Suspense>
    </Router>
  );
}

function App() {
  return (
    <LoadingProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LoadingProvider>
  );
}

export default App
