import React from 'react';
import { GoogleAuthProvider } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';

interface GoogleSignInButtonProps {
  className?: string;
  text?: string;
}

const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({ 
  className = '', 
  text = 'Sign in with Google' 
}) => {
  const { loginWithGoogle, isLoading } = useAuth();

  const handleGoogleSignIn = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error('Google Sign-In failed:', error);
      // You could show an error message to the user here
    }
  };

  return (
    <button
      onClick={handleGoogleSignIn}
      disabled={isLoading}
      className={`flex items-center justify-center gap-3 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${className}`}
    >
      <div className="w-5 h-5 bg-gradient-to-br from-blue-500 via-red-500 to-yellow-500 rounded-full flex items-center justify-center">
        <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none">
          <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.24 3.44-5.36 3.44-9.24 0-1.867-.133-3.8-.4-5.36H12.48z" fill="currentColor"/>
        </svg>
      </div>
      <span className="text-gray-700 font-medium">
        {isLoading ? 'Signing in...' : text}
      </span>
    </button>
  );
};

export default GoogleSignInButton;