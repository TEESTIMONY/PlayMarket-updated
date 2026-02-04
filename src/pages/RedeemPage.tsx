import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const RedeemPage: React.FC = () => {
  const [redeemCode, setRedeemCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState<{ type: 'success' | 'error'; title: string; message: string; coins?: number } | null>(null);
  const { refreshBalance } = useAuth();

  const handleSubmit = async () => {
    if (!redeemCode.trim()) {
      setModalContent({
        type: 'error',
        title: 'Invalid Input',
        message: 'Please enter a redeem code'
      });
      setShowModal(true);
      return;
    }

    setIsLoading(true);

    try {
      const result = await apiService.redeemCode(redeemCode.trim().toUpperCase());

      // Refresh balance immediately after successful redemption
      await refreshBalance();

      setModalContent({
        type: 'success',
        title: 'Code-redeem Successful!',
        message: result.message,
        coins: result.coins
      });
      setShowModal(true);
      setRedeemCode(''); // Clear the input on success
    } catch (error) {
      let errorMessage = 'Failed to redeem code. Please try again.';
      let errorTitle = 'Code-redeem Failed';

      if (error instanceof Error) {
        // Map HTTP status codes to user-friendly messages
        if (error.message.includes('400') || error.message.includes('Bad Request')) {
          errorMessage = 'Invalid request. Please check your code and try again.';
        } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          errorMessage = 'You are not authorized. Please log in and try again.';
        } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
          errorMessage = 'Access denied. You don\'t have permission to redeem codes.';
        } else if (error.message.includes('404') || error.message.includes('Not Found')) {
          errorMessage = 'Code not found. Please check the code and try again.';
        } else if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
          errorMessage = 'Server error. Please try again later.';
        } else if (error.message.includes('already been used')) {
          errorMessage = 'This code has already been redeemed.';
          errorTitle = 'Code Already Used';
        } else if (error.message.includes('not valid')) {
          errorMessage = 'This code is invalid or has expired.';
          errorTitle = 'Invalid Code';
        } else if (error.message) {
          // Use the API error message if it's user-friendly
          errorMessage = error.message;
        }
      }

      setModalContent({
        type: 'error',
        title: errorTitle,
        message: errorMessage
      });
      setShowModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSubmit();
    }
  };

  return (
    <Sidebar>
      <div className="flex-1 overflow-auto">
        {/* Redeem Section */}
        <div className="flex flex-col items-center justify-center p-4 md:p-8 min-h-full">
          {/* Title */}
          <h1 className="text-2xl md:text-3xl text-black mb-4 text-center animate-fade-in">Redeem</h1>

          {/* Prompt Text */}
          <p className="text-gray-700 text-center mb-6 text-sm animate-fade-in">
            Enter the secret code and hope for some coins
          </p>

          {/* Input Field */}
          <div className="w-full max-w-md mb-6">
            <input
              type="text"
              placeholder="Enter redeem code"
              value={redeemCode}
              onChange={(e) => setRedeemCode(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            className="w-full bg-white text-black border-2 border-gray-300 rounded-xl px-4 py-3 text-center text-base focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isLoading || !redeemCode.trim()}
            className="bg-gradient-to-r from-black to-gray-800 text-white py-3 px-6 rounded-xl text-lg w-full max-w-md hover:from-gray-800 hover:to-black transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                REDEEMING...
              </div>
            ) : (
              'SUBMIT'
            )}
          </button>
        </div>
      </div>

      {/* Redemption Result Modal */}
      {showModal && modalContent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4 md:p-6">
          <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full">
            <div className="text-center">
              {/* Icon */}
              <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-4 ${
                modalContent.type === 'success'
                  ? 'bg-green'
                  : 'bg-red'
              }`}>
                {modalContent.type === 'success' ? (
                  <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>

              {/* Title */}
              <h3 className={`text-xl font-bold mb-2 ${
                modalContent.type === 'success' ? 'text-green' : 'text-red'
              }`}>
                {modalContent.title}
              </h3>

              {/* Message */}
              <p className="text-gray-600 mb-6 text-center">
                {modalContent.message}
              </p>

              {/* Coins Display for Success */}
              {modalContent.type === 'success' && modalContent.coins && (
                <div className="bg-yellow-50 border border-yellow rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-center">
                    <span className="text-2xl mr-2">🪙</span>
                    <span className="text-xl font-bold text-yellow">+{modalContent.coins} Coins</span>
                  </div>
                  <p className="text-sm text-yellow mt-1">Added to your balance!</p>
                </div>
              )}

              {/* Close Button */}
              <button
                onClick={() => {
                  setShowModal(false);
                  setModalContent(null);
                }}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  modalContent.type === 'success'
                    ? 'bg-green hover:bg-green text-white'
                    : 'bg-red hover:bg-red text-white'
                }`}
              >
                {modalContent.type === 'success' ? 'Awesome!' : 'Try Again'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Sidebar>
  );
};

export default RedeemPage;
