import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('testuser');
  const [password, setPassword] = useState('password123');

  const handleLogin = () => {
    // Use the auth context to login
    login(username, password);
    navigate('/bounties'); // Redirect to bounties page
  };

  const handleGoogleSignIn = () => {
    // Mock Google sign-in - in real implementation, this would integrate with Google OAuth
    console.log('Google sign-in clicked');

    // Use the auth context to login with test credentials
    // In production, this would be replaced with actual Google OAuth
    login('testuser', 'password123');

    // Redirect to bounties page
    navigate('/bounties');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        {/* Abstract geometric doodles */}
        <svg className="absolute top-20 left-10 w-32 h-32" viewBox="0 0 100 100">
          <path d="M50 10 Q30 30 50 50 Q70 30 50 10" stroke="#1A1A1A" strokeWidth="1" fill="none"/>
          <circle cx="75" cy="25" r="8" stroke="#1A1A1A" strokeWidth="1" fill="none"/>
          <path d="M20 70 Q40 60 60 70 Q40 80 20 70" stroke="#1A1A1A" strokeWidth="1" fill="none"/>
        </svg>
        <svg className="absolute top-40 right-20 w-24 h-24" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="15" stroke="#1A1A1A" strokeWidth="1.5" fill="none"/>
          <path d="M20 20 Q50 10 80 20" stroke="#1A1A1A" strokeWidth="1" fill="none"/>
        </svg>
        <svg className="absolute bottom-32 left-16 w-28 h-28" viewBox="0 0 100 100">
          <path d="M10 50 Q25 25 50 50 Q75 25 90 50" stroke="#1A1A1A" strokeWidth="1" fill="none"/>
          <circle cx="25" cy="75" r="6" stroke="#1A1A1A" strokeWidth="1" fill="none"/>
        </svg>
        <svg className="absolute bottom-20 right-12 w-20 h-20" viewBox="0 0 100 100">
          <path d="M30 10 Q50 40 70 10" stroke="#1A1A1A" strokeWidth="1" fill="none"/>
          <circle cx="50" cy="70" r="10" stroke="#1A1A1A" strokeWidth="1" fill="none"/>
        </svg>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 relative z-10">
        <div className="w-full max-w-sm text-center">
          {/* Logo */}
          <div className="flex justify-center mb-12">
            <img
              src="/peGO.png"
              alt="PlayMarket Logo"
              className="h-16 w-auto"
            />
          </div>

          {/* Typography */}
          <div className="mb-16">
            <h1
              className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-4"
              style={{ fontFamily: "'Eras Bold ITC', sans-serif" }}
            >
              Welcome to Playmarket
            </h1>
            <p
              className="text-lg md:text-xl text-[#1A1A1A]/70"
              style={{ fontFamily: "'Eras Demi ITC', sans-serif" }}
            >
              Auction, Earn Coins,Win Prizes.
            </p>
          </div>

          {/* Action Button */}
          <div className="w-full">
            <button
              onClick={handleGoogleSignIn}
              className="w-full bg-[#1A1A1A] text-white py-4 px-8 rounded-full font-semibold text-lg hover:bg-[#1A1A1A]/90 transition-colors duration-200 flex items-center justify-center shadow-lg"
              style={{ fontFamily: "'Eras Demi ITC', sans-serif" }}
            >
              <svg className="w-6 h-6 mr-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </div>

          {/* Legal & Security Information */}
          <div className="w-full max-w-sm mt-12 space-y-4">
            {/* Secure Sign-in Badge */}
            <div className="flex items-center justify-center space-x-2 text-sm text-[#1A1A1A]/60">
              <svg className="w-4 h-4 text-green" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Secure sign-in with Google</span>
            </div>

            {/* Terms and Privacy */}
            <div className="text-center">
              <p className="text-xs text-[#1A1A1A]/50 leading-relaxed">
                By continuing, you agree to our{' '}
                <a href="#" className="text-[#1A1A1A] hover:text-[#1A1A1A]/80 font-medium underline underline-offset-1">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-[#1A1A1A] hover:text-[#1A1A1A]/80 font-medium underline underline-offset-1">
                  Privacy Policy
                </a>
              </p>
            </div>


            {/* Copyright */}
            <div className="text-center">
              <p className="text-xs text-[#1A1A1A]/30">
                © 2026 PlayMarket. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
