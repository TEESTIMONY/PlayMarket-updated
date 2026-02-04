import React, { useState, useEffect, memo } from 'react';
import { FaCoins } from 'react-icons/fa';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { useLoading } from '../contexts/LoadingContext';
import { apiService, type Bounty } from '../services/api';

const BountiesPage: React.FC = () => {
  const { isAuthenticated, refreshBalance } = useAuth();
  const { showLoading, hideLoading } = useLoading();
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBounty, setSelectedBounty] = useState<Bounty | null>(null);
  const [submission, setSubmission] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [claimingBounties, setClaimingBounties] = useState<Set<number>>(new Set());
  const [claimedBounties, setClaimedBounties] = useState<Set<number>>(new Set());
  const [inProgressBounties, setInProgressBounties] = useState<Set<number>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [flashMessage, setFlashMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [isPolling, setIsPolling] = useState(false);

  // Initialize bounties and user claims on component mount
  useEffect(() => {
    if (isAuthenticated) {
      // Initialize with mock data
      const initializeData = async () => {
        try {
          setLoading(true);
          const bountiesResponse = await apiService.getBounties();
          setBounties(bountiesResponse.results);
          
          const claimsResponse = await apiService.getUserClaims();
          const claimedBountyIds = new Set(claimsResponse.results.map(claim => claim.bounty));
          setClaimedBounties(claimedBountyIds);
          
          // Only refresh balance if it's been more than 30 seconds since last refresh
          const lastRefresh = localStorage.getItem('lastBalanceRefresh');
          const now = Date.now();
          if (!lastRefresh || now - parseInt(lastRefresh) > 30000) {
            refreshBalance();
          }
        } catch (err) {
          console.error('Error loading bounties data:', err);
          setError(err instanceof Error ? err.message : 'Failed to load bounties');
        } finally {
          setLoading(false);
        }
      };
      
      initializeData();
    }
  }, [isAuthenticated, refreshBalance]);

  // Ensure loading state coordination with Suspense
  useEffect(() => {
    if (loading) {
      showLoading();
    } else {
      hideLoading();
    }
  }, [loading]);

  const fetchBounties = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getBounties(undefined);
      setBounties(response.results);
    } catch (err) {
      console.error('Error fetching bounties:', err);
      setError(err instanceof Error ? err.message : 'Failed to load bounties');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserClaims = async () => {
    try {
      const response = await apiService.getUserClaims();
      // Extract bounty IDs from user's claims
      const claimedBountyIds = new Set(response.results.map(claim => claim.bounty));
      setClaimedBounties(claimedBountyIds);
      
      // Check for newly approved claims and show flash messages
      const approvedClaims = response.results.filter(claim => claim.status === 'approved');
      approvedClaims.forEach(claim => {
        showFlashMessage(`You received ${claim.bounty_reward} for completing "${claim.bounty_title}"!`, 'success');
      });
    } catch (err) {
      // Silently fail - claimed bounties will be tracked as user claims them
      console.warn('Failed to load user claims:', err);
    }
  };

  const showFlashMessage = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setFlashMessage({ message, type });
    setTimeout(() => {
      setFlashMessage(null);
    }, 5000); // Auto-hide after 5 seconds
  };

  const handleClaimBounty = async (bounty: Bounty) => {
    try {
      // Add this bounty to the in-progress set (user is working on it)
      setInProgressBounties(prev => new Set(prev).add(bounty.id));
      
      // Just open the submission form without creating a claim yet
      setSelectedBounty(bounty);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to claim bounty');
    }
  };

  const handleSubmitWork = async () => {
    if (!selectedBounty || !submission.trim()) return;

    try {
      setSubmitting(true);
      
      // First create the claim (since we didn't create it when user clicked "Claim")
      const claim = await apiService.claimBounty(selectedBounty.id);
      
      // Then submit the work
      await apiService.submitBounty(selectedBounty.id, submission);
      
      // Add to claimed bounties immediately
      const newClaimedBounties = new Set(claimedBounties);
      newClaimedBounties.add(selectedBounty.id);
      setClaimedBounties(newClaimedBounties);
      
      // Remove from in-progress bounties
      setInProgressBounties(prev => {
        const newSet = new Set(prev);
        newSet.delete(selectedBounty.id);
        return newSet;
      });
      
      // Update the bounties list to reflect the immediate change
      setBounties(prevBounties => 
        prevBounties.map(bounty => 
          bounty.id === selectedBounty.id 
            ? { ...bounty, claims_left: Math.max(0, bounty.claims_left - 1) }
            : bounty
        )
      );
      
      setShowSuccessModal(true);
      setSelectedBounty(null);
      setSubmission('');
      
      // Refresh user claims to ensure consistency
      await fetchUserClaims();
      
      // Refresh balance to show immediate update
      await refreshBalance();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to submit work');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Sidebar>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl text-gray-600 font-bold mb-4">Please Login</h2>
            <p className="text-gray-600">You need to be logged in to view bounties.</p>
          </div>
        </div>
      </Sidebar>
    );
  }

  // Loading skeleton component for better UX
  const LoadingSkeleton = () => (
    <div className="animate-pulse">
      <div className="bg-white rounded-xl shadow-lg p-3 border border-gray-200 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
            <div className="flex items-center gap-3">
              <div className="h-6 bg-gray-200 rounded w-16"></div>
              <div className="h-6 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
          <div className="h-10 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-lg p-3 border border-gray-200 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="h-5 bg-gray-200 rounded w-2/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/5 mb-3"></div>
            <div className="flex items-center gap-3">
              <div className="h-6 bg-gray-200 rounded w-16"></div>
              <div className="h-6 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
          <div className="h-10 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-lg p-3 border border-gray-200 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="h-5 bg-gray-200 rounded w-4/5 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
            <div className="flex items-center gap-3">
              <div className="h-6 bg-gray-200 rounded w-16"></div>
              <div className="h-6 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
          <div className="h-10 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Sidebar>
        <div className="flex-1 overflow-auto">
          <div className="p-4 md:p-8">
            <div className="h-8 bg-gray-200 rounded w-48 mb-6 animate-pulse"></div>
            <div className="max-w-4xl mx-auto space-y-4">
              <LoadingSkeleton />
            </div>
          </div>
        </div>
      </Sidebar>
    );
  }

  if (error) {
    return (
      <Sidebar>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4 text-red">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => fetchBounties(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Try Again
            </button>
          </div>
        </div>
      </Sidebar>
    );
  }


  const getStatusBadge = (bounty: Bounty) => {
    if (bounty.status === 'available' && bounty.claims_left > 0) {
      return (
        <span className="bg-green text-white text-xs px-2 py-1 rounded-full">
          {bounty.claims_left} Claims Left
        </span>
      );
    } else if (bounty.status === 'available' && bounty.time_left) {
      return (
        <span className="bg-yellow text-white text-xs px-2 py-1 rounded-full">
          Expires in {bounty.time_left} hours
        </span>
      );
    } else if (bounty.status === 'full') {
      return (
        <span className="bg-gray-500 text-white text-xs px-2 py-1 rounded-full">
          Full
        </span>
      );
    } else if (bounty.status === 'expired') {
      return (
        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
          Expired
        </span>
      );
    }
    return null;
  };

  const getClaimButton = (bounty: Bounty) => {
    // Check if this specific bounty is being claimed
    if (claimingBounties.has(bounty.id)) {
      return (
        <button className="bg-gray-500 text-white py-2 px-4 rounded-lg text-sm cursor-not-allowed" disabled>
          Claiming...
        </button>
      );
    }

    // Check if user has already claimed this bounty
    if (claimedBounties.has(bounty.id)) {
      return (
        <button className="bg-gray-400 text-white py-2 px-4 rounded-lg text-sm cursor-not-allowed opacity-50" disabled>
          Submitted
        </button>
      );
    }

    if (bounty.status === 'available' && bounty.claims_left > 0) {
      return (
        <button
          onClick={() => handleClaimBounty(bounty)}
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-4 rounded-lg text-sm hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-300"
        >
          Claim
        </button>
      );
    } else if (bounty.status === 'full') {
      return (
        <button className="bg-gray-500 text-white py-2 px-4 rounded-lg text-sm cursor-not-allowed" disabled>
          Full
        </button>
      );
    } else if (bounty.status === 'expired') {
      return (
        <button className="bg-red-500 text-white py-2 px-4 rounded-lg text-sm cursor-not-allowed" disabled>
          Expired
        </button>
      );
    }
    return null;
  };

  // Enhanced refresh function that checks user claims
  const handleRefresh = async () => {
    try {
      // Fetch fresh bounties data
      await fetchBounties(true);
      
      // Fetch user claims to check which bounties should be greyed out
      await fetchUserClaims();
      
      // Refresh balance to show any new rewards
      await refreshBalance();
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh data');
    }
  };

  if (selectedBounty) {
    return (
      <Sidebar>
        <div className="flex-1 overflow-auto">
          {/* Flash Message */}
          {flashMessage && (
            <div className={`fixed top-20 right-4 z-50 p-6 rounded-xl shadow-2xl transform transition-all duration-500 ease-in-out ${
              flashMessage.type === 'success' ? 'bg-gradient-to-r from-green-500 to-green-600 text-white animate-slide-down' : 
              flashMessage.type === 'error' ? 'bg-gradient-to-r from-red-500 to-red-600 text-white animate-slide-down' : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white animate-slide-down'
            }`}>
              <div className="flex items-center space-x-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  flashMessage.type === 'success' ? 'bg-green-700' : 
                  flashMessage.type === 'error' ? 'bg-red-700' : 'bg-blue-700'
                }`}>
                  {flashMessage.type === 'success' ? (
                    <span className="text-2xl">🎉</span>
                  ) : flashMessage.type === 'error' ? (
                    <span className="text-2xl">⚠️</span>
                  ) : (
                    <span className="text-2xl">💡</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-lg">{flashMessage.message}</p>
                  <p className="text-sm opacity-90 mt-1">
                    {flashMessage.type === 'success' ? 'Great job! Your reward has been added to your balance.' : 
                     flashMessage.type === 'error' ? 'Please try again or contact support if the issue persists.' : 
                     'Keep an eye on your balance for updates.'}
                  </p>
                </div>
                <button
                  onClick={() => setFlashMessage(null)}
                  className="ml-2 text-white hover:text-gray-200 transition-colors"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>
            </div>
          )}
          
          {/* Expanded Bounty View */}
          <div className="p-4 md:p-8 animate-fade-in">
            <div className="max-w-2xl mx-auto">
              <div className="animate-slide-in">
                {/* Bounty Title and Reward */}
                <div className="flex items-center justify-between mb-6 animate-slide-in" style={{ animationDelay: '0.1s' }}>
                <h1 className="text-2xl text-black hover:text-blue-600 transition-colors duration-300 text-center">{selectedBounty.title}</h1>
                  <div className="flex items-center bg-gradient-to-r from-yellow-100 to-yellow-200 px-4 py-2 rounded-xl">
                    <FaCoins className="text-amber-400 mr-2" />
                    <span className="font-bold text-xl text-black">{selectedBounty.reward}</span>
                  </div>
                </div>

                {/* Bounty Description */}
                <div className="mb-8 animate-slide-in" style={{ animationDelay: '0.2s' }}>
                  <h3 className="text-lg text-black mb-3">Description</h3>
                  <div className="text-gray-700 leading-relaxed bg-gradient-to-r from-gray-50 to-white p-4 rounded-lg border-2 border-gray-300 whitespace-pre-wrap break-words">
                    {selectedBounty.description}
                  </div>
                </div>
                {/* Submission Section */}
                <div className="animate-slide-in" style={{ animationDelay: '0.3s' }}>
                  <h3 className="text-lg text-black mb-2">Submission</h3>
                  <p className="text-gray-600 text-sm mb-3">Your submission will be reviewed and possibly approved</p>
                  <input
                    type="text"
                    value={submission}
                    onChange={(e) => setSubmission(e.target.value)}
                    placeholder="Enter your submission here"
                    className="w-full bg-gray-50 text-black border-2 border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 hover:shadow-md"
                  />

                  <button
                    onClick={handleSubmitWork}
                    disabled={submitting}
                    className="mt-6 w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-8 rounded-lg text-lg hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 hover:shadow-xl transition-all duration-300 shadow-lg active:scale-95 disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'SUBMIT'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Sidebar>
    );
  }

  // Memoized Bounty Card Component for better performance
  const BountyCard = memo(({ bounty, onClaim }: {
    bounty: Bounty;
    onClaim: (bounty: Bounty) => void;
  }) => (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200 p-3 border border-gray-200 relative">
      {/* Posted Time */}
      <div className="absolute top-3 right-3 text-xs text-gray-400">
        {bounty.posted_hours_ago}hrs ago
      </div>

      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg text-gray-900 mb-1 truncate">{bounty.title}</h3>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2 leading-relaxed">{bounty.description}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-amber-50 px-2 py-1 rounded-md">
                <FaCoins className="text-amber-500 mr-1.5 text-sm" />
                <span className="font-semibold text-gray-900 text-sm">{bounty.reward}</span>
              </div>
              {getStatusBadge(bounty)}
            </div>
          </div>
        </div>
        <div className="ml-4 flex-shrink-0">
          {getClaimButton(bounty)}
        </div>
      </div>
    </div>
  ));

  BountyCard.displayName = 'BountyCard';

  return (
    <>
      <Sidebar>
        <div className="flex-1 overflow-auto">

          {/* Campaign Banner */}
          <div className="bg-red text-white py-2 px-4 shadow-lg animate-pulse border-2 border-red-700">
            <div className="flex items-center justify-center max-w-6xl mx-auto">
              <div className="text-center">
                <p className="text-sm font-bold">Complete Tasks & Earn Up to 200 Coins!</p>
                <p className="text-xs opacity-90 mt-1">Start earning now - your rewards await!</p>
              </div>
            </div>
          </div>

          {/* Bounties Section */}
          <div className="p-4 md:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h1 className="text-3xl text-black text-left animate-fade-in">Bounties</h1>
                  <button
                    onClick={handleRefresh}
                    className="bg-gray-200 text-gray-700 py-1 px-3 rounded-md text-sm hover:bg-gray-300 hover:text-gray-900 transition-colors border border-gray-300"
                  >
                    Refresh
                  </button>
                </div>
            <div className="max-w-4xl mx-auto space-y-4">
              {bounties.map((bounty) => (
                <BountyCard
                  key={bounty.id}
                  bounty={bounty}
                  onClaim={handleClaimBounty}
                />
              ))}
            </div>
          </div>
        </div>
      </Sidebar>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-scale-in text-center">
            {/* Big Green Checkmark */}
            <div className="mb-6">
              <div className="w-24 h-24 bg-green rounded-full flex items-center justify-center mx-auto animate-bounce shadow-lg">
                <span className="text-4xl text-white font-bold">✓</span>
              </div>
            </div>

            {/* Success Text */}
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Submission Successful!</h2>
            <p className="text-gray-600 mb-6">
              Your bounty submission has been received and is now under review.
              You'll be notified once it's approved.
            </p>

            {/* Close Button */}
            <button
              onClick={() => setShowSuccessModal(false)}
              className="bg-gradient-to-r from-green to-green text-white py-3 px-8 rounded-xl text-lg hover:from-green-600 hover:to-green-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default BountiesPage;
