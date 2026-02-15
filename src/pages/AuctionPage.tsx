import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCoins } from 'react-icons/fa';
import Sidebar from '../components/Sidebar';
import { useLoading } from '../contexts/LoadingContext';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import type { Auction, AuctionLeaderboard } from '../services/api';
import { buildWebSocketUrl } from '../hooks/useWebSocket';

const AuctionPage: React.FC = () => {
  const navigate = useNavigate();
  const { showLoading, hideLoading } = useLoading();
  const { refreshBalance, isAuthenticated } = useAuth();
  const isAuctionWsEnabled = import.meta.env.VITE_ENABLE_AUCTION_WS === 'true';

  const formatBid = (value: number | string | null | undefined) => {
    const numericValue = Number(value ?? 0);
    if (Number.isNaN(numericValue)) return '0';
    return numericValue.toLocaleString(undefined, { maximumFractionDigits: 0 });
  };

  // State for auction data from API
  const [auction, setAuction] = useState<Auction | null>(null);
  const [leaderboard, setLeaderboard] = useState<AuctionLeaderboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBidModal, setShowBidModal] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [bidError, setBidError] = useState<string | null>(null);
  const [bidSuccess, setBidSuccess] = useState<string | null>(null);
  const [extensionFlashMessage, setExtensionFlashMessage] = useState<string | null>(null);
  const [showTimeExtendedBadge, setShowTimeExtendedBadge] = useState(false);
  const [isSubmittingBid, setIsSubmittingBid] = useState(false);

  // Auction phase state
  const [auctionPhase, setAuctionPhase] = useState<'starting' | 'running' | 'ended'>('starting');

  // Separate time states for start and end
  const [startTimeLeft, setStartTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const [endTimeLeft, setEndTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Slideshow images from auction data
  const [images, setImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const wsErrorLoggedRef = useRef(false);

  // Start countdown timer
  useEffect(() => {
    if (auctionPhase !== 'starting') return;

    const timer = setInterval(() => {
      setStartTimeLeft((prev) => {
        let { days, hours, minutes, seconds } = prev;
        seconds--;
        if (seconds < 0) {
          seconds = 59;
          minutes--;
        }
        if (minutes < 0) {
          minutes = 59;
          hours--;
        }
        if (hours < 0) {
          hours = 23;
          days--;
        }
        if (days < 0) {
          // Switch to end phase when start timer reaches zero
          setAuctionPhase('running');
          if (auction?.ends_at) {
            calculateTimeLeft(new Date(auction.ends_at), setEndTimeLeft);
          }
          clearInterval(timer);
          return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        }
        return { days, hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [auctionPhase, auction?.ends_at]);

  // End countdown timer
  useEffect(() => {
    if (auctionPhase !== 'running') return;

    if (auction?.ends_at) {
      calculateTimeLeft(new Date(auction.ends_at), setEndTimeLeft);
    }

    const timer = setInterval(() => {
      setEndTimeLeft((prev) => {
        let { days, hours, minutes, seconds } = prev;
        seconds--;
        if (seconds < 0) {
          seconds = 59;
          minutes--;
        }
        if (minutes < 0) {
          minutes = 59;
          hours--;
        }
        if (hours < 0) {
          hours = 23;
          days--;
        }
        if (days < 0) {
          setAuctionPhase('ended');
          clearInterval(timer);
          return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        }
        return { days, hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [auctionPhase, auction?.ends_at]);

  // Combined loading state management for image preloading and Suspense coordination
  useEffect(() => {
    showLoading();
    setCurrentImageIndex(0);
    setImagesLoaded(false);
    setImageError(false);

    if (images.length === 0) {
      setImagesLoaded(true);
      return;
    }

    let isCancelled = false;

    const preloadImages = async () => {
      try {
        const imagePromises = images.map(src => {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = resolve;
            img.onerror = reject;
            img.src = src;
          });
        });

        await Promise.all(imagePromises);
        if (!isCancelled) setImagesLoaded(true);
      } catch (error) {
        console.warn('Some images failed to load:', error);
        if (!isCancelled) setImageError(true);
      }
    };

    preloadImages();

    return () => {
      isCancelled = true;
    };
  }, [images, showLoading]);

  useEffect(() => {
    // Ensure loading persists for at least 1.5 seconds to coordinate with Suspense
    const minimumLoadingTimer = setTimeout(() => {
      // Only hide loading if images are loaded (or we have an error)
      if (imagesLoaded || imageError) {
        hideLoading();
      }
    }, 1500);

    // Also check periodically if images are loaded to hide loading earlier if needed
    const checkImagesTimer = setInterval(() => {
      if (imagesLoaded || imageError) {
        hideLoading();
        clearInterval(checkImagesTimer);
      }
    }, 100);

    return () => {
      clearTimeout(minimumLoadingTimer);
      clearInterval(checkImagesTimer);
    };
  }, [imagesLoaded, imageError, hideLoading]);

  // Optimized slideshow effect with reduced frequency
  useEffect(() => {
    if (!imagesLoaded || images.length <= 1) return;

    const slideshowTimer = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000); // Change image every 5 seconds for better performance

    return () => clearInterval(slideshowTimer);
  }, [imagesLoaded, images.length]);

  // Fetch auction data from API
  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      setError(null);
      return;
    }

    const fetchAuctionData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch the current active auction
        const auctions = await apiService.getAuctions();
        const activeAuction = auctions.results.find(a => a.status === 'active') || 
                             auctions.results.find(a => a.status === 'upcoming') ||
                             auctions.results[0];

        if (activeAuction) {
          setAuction(activeAuction);
          
          // Set images from auction data
          const auctionImages = activeAuction.images && activeAuction.images.length > 0
            ? activeAuction.images
            : ['/ST Rina 1.jpg', '/ST Rina 2.jpg', '/ST Rina 3.jpg'];
          setImages(auctionImages);
          
          // Calculate time left
          const now = new Date();
          const startsAt = new Date(activeAuction.starts_at);
          const endsAt = new Date(activeAuction.ends_at);

          if (now < startsAt) {
            setAuctionPhase('starting');
            calculateTimeLeft(startsAt, setStartTimeLeft);
          } else if (now < endsAt) {
            setAuctionPhase('running');
            calculateTimeLeft(endsAt, setEndTimeLeft);
          } else {
            setAuctionPhase('ended');
          }

          // Fetch leaderboard
          const leaderboardData = await apiService.getAuctionLeaderboard(activeAuction.id);
          setLeaderboard([leaderboardData]);
        } else {
          setError('No active auction found');
        }
      } catch (err) {
        console.error('Error fetching auction data:', err);
        setError('Failed to load auction data');
      } finally {
        setLoading(false);
      }
    };

    fetchAuctionData();
  }, [isAuthenticated]);

  // Calculate time left for countdown
  const calculateTimeLeft = (targetDate: Date, setTimeLeft: React.Dispatch<React.SetStateAction<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>>) => {
    const now = new Date();
    const diff = targetDate.getTime() - now.getTime();

    if (diff <= 0) {
      setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    setTimeLeft({ days, hours, minutes, seconds });
  };

  // Handle WebSocket updates for real-time data
  useEffect(() => {
    if (!isAuctionWsEnabled) return;
    if (!auction?.id) return;

    const auctionId = auction.id;
    wsErrorLoggedRef.current = false;
    const wsUrl = buildWebSocketUrl(`/ws/auction/${auctionId}/`);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      wsErrorLoggedRef.current = false;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'new_bid' && data.auction_id === auctionId) {
          setAuction((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              current_highest_bid: data.current_highest_bid ?? data.amount ?? prev.current_highest_bid,
              highest_bidder: data.user ?? prev.highest_bidder,
              bid_count: data.bid_count ?? prev.bid_count,
              ends_at: data.new_end_time ?? prev.ends_at,
            };
          });

          if (data.auction_extended) {
            setShowTimeExtendedBadge(true);
            setExtensionFlashMessage(
              data.extension_message ||
              'A new highest bid placed 3 mins before the end will extend the auction by 3 min'
            );

            if (auctionPhase === 'running' && data.new_end_time) {
              calculateTimeLeft(new Date(data.new_end_time), setEndTimeLeft);
            }
          }
        }
        
        // Handle auction updates
        if (data.type === 'auction_update' && data.auction) {
          if (data.auction.id === auctionId) {
            setAuction(data.auction);
          }
        }
        
        // Handle bid updates
        if (data.type === 'bid_update' && data.leaderboard) {
          setLeaderboard(Array.isArray(data.leaderboard) ? data.leaderboard : [data.leaderboard]);
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };
    
    ws.onclose = (event) => {
      if (event.code !== 1000 && !wsErrorLoggedRef.current) {
        console.warn(`Auction WebSocket closed (code: ${event.code}). Real-time updates may be temporarily unavailable.`);
        wsErrorLoggedRef.current = true;
      }
    };
    
    ws.onerror = () => {
      if (!wsErrorLoggedRef.current) {
        console.warn('Auction WebSocket connection failed. Falling back to HTTP data updates.');
        wsErrorLoggedRef.current = true;
      }
    };
    
    return () => {
      ws.close();
    };
  }, [auction?.id, isAuctionWsEnabled]);

  const currentBid = auction ? (auction.current_highest_bid ?? auction.minimum_bid) : 0;
  const minimumNextBid = currentBid + 1;

  const openBidModal = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!auction || auctionPhase !== 'running') return;
    setBidError(null);
    setBidSuccess(null);
    setBidAmount(String(minimumNextBid));
    setShowBidModal(true);
  };

  const closeBidModal = () => {
    if (isSubmittingBid) return;
    setShowBidModal(false);
    setBidError(null);
  };

  const parseApiErrorMessage = (err: unknown) => {
    if (!(err instanceof Error)) {
      return 'Failed to place bid. Please check your amount and try again.';
    }

    const messageMatch = err.message.match(/message:\s*(\{.*\})$/s);
    if (!messageMatch) {
      return 'Failed to place bid. Please check your amount and try again.';
    }

    try {
      const parsed = JSON.parse(messageMatch[1]);
      if (parsed?.error) {
        return parsed.error as string;
      }
    } catch {
      // ignore parse failures and fall back below
    }

    return 'Failed to place bid. Please check your amount and try again.';
  };

  const syncPhaseFromAuction = (auctionData: Auction) => {
    const now = new Date();
    const startsAt = new Date(auctionData.starts_at);
    const endsAt = new Date(auctionData.ends_at);

    if (now < startsAt) {
      setAuctionPhase('starting');
      calculateTimeLeft(startsAt, setStartTimeLeft);
      return;
    }

    if (now < endsAt && auctionData.status !== 'ended' && auctionData.status !== 'cancelled') {
      setAuctionPhase('running');
      calculateTimeLeft(endsAt, setEndTimeLeft);
      return;
    }

    setAuctionPhase('ended');
    setEndTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  };

  const handleConfirmBid = async () => {
    if (!isAuthenticated) {
      setBidError('Please sign in to place a bid.');
      navigate('/login');
      return;
    }

    if (!auction) return;

    const amount = parseInt(bidAmount, 10);
    if (!amount || Number.isNaN(amount)) {
      setBidError('Please enter a valid bid amount.');
      return;
    }

    if (amount < minimumNextBid) {
      setBidError(`Bid must be at least ${minimumNextBid} coins.`);
      return;
    }

    setIsSubmittingBid(true);
    setBidError(null);

    try {
      const bidResponse = await apiService.placeBid(auction.id, amount);

      const [updatedAuction, updatedLeaderboard] = await Promise.all([
        apiService.getAuction(auction.id),
        apiService.getAuctionLeaderboard(auction.id),
        refreshBalance(),
      ]);

      setAuction(updatedAuction);
      setLeaderboard([updatedLeaderboard]);
      syncPhaseFromAuction(updatedAuction);
      setBidSuccess(`Bid of ${formatBid(amount)} coins placed successfully.`);

      if (bidResponse?.extension_applied) {
        setShowTimeExtendedBadge(true);
        setExtensionFlashMessage(
          bidResponse.extension_message ||
          'A new highest bid placed 3 mins before the end will extend the auction by 3 min'
        );
      }

      setShowBidModal(false);
      setBidAmount('');
    } catch (err) {
      console.error('Failed to place bid:', err);

      const apiMessage = parseApiErrorMessage(err);
      setBidError(apiMessage);

      if (
        apiMessage.toLowerCase().includes('not active') ||
        apiMessage.toLowerCase().includes('ended') ||
        apiMessage.toLowerCase().includes('not started')
      ) {
        try {
          const refreshedAuction = await apiService.getAuction(auction.id);
          setAuction(refreshedAuction);
          syncPhaseFromAuction(refreshedAuction);
        } catch (refreshErr) {
          console.warn('Failed to refresh auction status after bid error:', refreshErr);
        }
      }
    } finally {
      setIsSubmittingBid(false);
    }
  };

  useEffect(() => {
    if (!bidSuccess) return;
    const timer = setTimeout(() => setBidSuccess(null), 3500);
    return () => clearTimeout(timer);
  }, [bidSuccess]);

  useEffect(() => {
    if (!extensionFlashMessage) return;
    const timer = setTimeout(() => setExtensionFlashMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [extensionFlashMessage]);

  return (
    <Sidebar>
      <div className="flex-1 overflow-auto">
            {!isAuthenticated ? (
              <div className="flex items-center justify-center min-h-[60vh] px-4">
                <div className="text-center">
                  <h2 className="text-2xl text-gray-700 font-bold mb-3">Please Login</h2>
                  <p className="text-gray-600 mb-5">You need to be signed in to view and place auction bids.</p>
                  <button
                    onClick={() => navigate('/login')}
                    className="bg-black text-white px-5 py-2 rounded-lg hover:bg-gray-800"
                  >
                    Go to Login
                  </button>
                </div>
              </div>
            ) : (
              <>
            {/* Campaign Banner */}
            <div className="bg-red text-white py-2 px-4 shadow-lg animate-pulse border-2 border-red-700">
              <div className="flex items-center justify-between max-w-6xl mx-auto">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">🎯</span>
                  <div>
                    <p className="text-sm font-semibold">Complete Tasks & Earn Up to 200 Coins!</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/bounties')}
                  className="bg-white text-green px-4 py-1 rounded-20% text-xs font-semibold hover:bg-gray-100 transition-colors duration-200 shadow-lg"
                >
                  GO NOW {'>'}
                </button>
              </div>
            </div>

            {/* Auction Details */}
            <div className="flex flex-col items-center p-4 md:p-8">
        {/* Product Image Slideshow */}
        <div className="w-full max-w-md lg:max-w-2xl h-64 md:h-96 mb-4 rounded-xl shadow-xl overflow-hidden relative">
          <div className="relative w-full h-full">
            {images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`ST Rina ${index + 1}`}
                loading="lazy"
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                  index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                }`}
                onError={(e) => {
                  // Fallback for missing images
                  e.currentTarget.style.display = 'none';
                }}
              />
            ))}
          </div>
          {/* Slideshow indicators */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading auction data...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>{error}</p>
          </div>
        )}

        {/* Auction Content */}
        {auction && !loading && !error && (
          <>
            {bidSuccess && (
              <div className="w-full max-w-md lg:max-w-2xl bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                {bidSuccess}
              </div>
            )}

            {extensionFlashMessage && (
              <div className="w-full max-w-md lg:max-w-2xl bg-gray-100 border border-gray-300 text-gray-800 px-4 py-3 rounded mb-4">
                {extensionFlashMessage}
              </div>
            )}

            {/* Title and Description */}
            <h1 className="text-2xl md:text-4xl text-black mb-2 text-center">{auction.title}</h1>
            <p className="font-semibold text-black mb-4 text-center">{auction.description}</p>

            {/* Timer */}
            <div className="bg-gradient-to-r from-black to-gray-900 text-white p-6 rounded-xl mb-6 w-full max-w-md lg:max-w-2xl shadow-2xl animate-fade-in relative">
              {showTimeExtendedBadge && (
                <div className="absolute top-2 right-2 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs px-3 py-1 rounded-full font-bold animate-bounce shadow-lg border-2 border-white">
                  ⏰ +3 min
                </div>
              )}
              <p className="text-center text-gray-300 mb-4">
                {auctionPhase === 'starting' ? 'Auction starts in:' : auctionPhase === 'running' ? 'Auction ends in:' : 'Auction has ended'}
              </p>
              <div className="flex justify-around">
                {auctionPhase === 'starting' ? (
                  <>
                    <div className="text-center transform hover:scale-110 transition-transform duration-200">
                      <div className="text-3xl md:text-4xl font-bold animate-pulse">{startTimeLeft.days.toString().padStart(2, '0')}</div>
                      <div className="text-xs font-light">Days</div>
                    </div>
                    <div className="text-center transform hover:scale-110 transition-transform duration-200">
                      <div className="text-3xl md:text-4xl font-bold animate-pulse">{startTimeLeft.hours.toString().padStart(2, '0')}</div>
                      <div className="text-xs font-light">Hours</div>
                    </div>
                    <div className="text-center transform hover:scale-110 transition-transform duration-200">
                      <div className="text-3xl md:text-4xl font-bold animate-pulse">{startTimeLeft.minutes.toString().padStart(2, '0')}</div>
                      <div className="text-xs font-light">Minutes</div>
                    </div>
                    <div className="text-center transform hover:scale-110 transition-transform duration-200">
                      <div className="text-3xl md:text-4xl font-bold animate-pulse">{startTimeLeft.seconds.toString().padStart(2, '0')}</div>
                      <div className="text-xs font-light">Seconds</div>
                    </div>
                  </>
                ) : auctionPhase === 'running' ? (
                  <>
                    <div className="text-center transform hover:scale-110 transition-transform duration-200">
                      <div className="text-3xl md:text-4xl font-bold animate-pulse">{endTimeLeft.days.toString().padStart(2, '0')}</div>
                      <div className="text-xs font-light">Days</div>
                    </div>
                    <div className="text-center transform hover:scale-110 transition-transform duration-200">
                      <div className="text-3xl md:text-4xl font-bold animate-pulse">{endTimeLeft.hours.toString().padStart(2, '0')}</div>
                      <div className="text-xs font-light">Hours</div>
                    </div>
                    <div className="text-center transform hover:scale-110 transition-transform duration-200">
                      <div className="text-3xl md:text-4xl font-bold animate-pulse">{endTimeLeft.minutes.toString().padStart(2, '0')}</div>
                      <div className="text-xs font-light">Minutes</div>
                    </div>
                    <div className="text-center transform hover:scale-110 transition-transform duration-200">
                      <div className="text-3xl md:text-4xl font-bold animate-pulse">{endTimeLeft.seconds.toString().padStart(2, '0')}</div>
                      <div className="text-xs font-light">Seconds</div>
                    </div>
                  </>
                ) : (
                  <div className="text-center w-full">
                    <div className="text-3xl md:text-4xl font-bold text-red-500 animate-pulse">ENDED</div>
                    <div className="text-xs font-light text-gray-300 mt-2">Auction has concluded</div>
                  </div>
                )}
              </div>
            </div>

            {/* Latest Bid and Place Bid Button Side by Side */}
            <div className="flex flex-row gap-6 w-full max-w-md lg:max-w-2xl mb-8">
              {/* Latest Bid */}
              <div className="bg-gradient-to-r from-white to-gray-50 p-1 rounded-xl w-1/3 text-center shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200">
                <p className="text-black text-sm font-semibold mb-1">Current Bid</p>
                <p className="text-black font-bold text-lg animate-bounce">{formatBid(auction.current_highest_bid || auction.minimum_bid)} <FaCoins className="inline text-amber-400" /></p>
              </div>

              {/* Place a Bid Button */}
              <button className="bg-gradient-to-r from-black to-gray-800 text-white py-4 px-8 rounded-xl text-xl w-2/3 hover:from-gray-800 hover:to-black transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={openBidModal}
                      disabled={auctionPhase !== 'running'}>
                {!isAuthenticated
                  ? 'Sign In to Bid'
                  : auctionPhase === 'running'
                    ? 'Place a Bid'
                    : auctionPhase === 'starting'
                      ? 'Starting Soon'
                      : 'Auction Ended'}
              </button>
            </div>

            {/* Bidding Leaderboard */}
            <div className="w-full max-w-md lg:max-w-2xl space-y-3">
              {leaderboard.length > 0 && leaderboard[0]?.top_bidders ? (
                leaderboard[0].top_bidders.map((bidder, index) => (
                  <div
                    key={index}
                    className={`flex items-center p-4 ${index === 0 ? 'bg-gradient-to-r from-green-600 to-green-800 text-white shadow-green-300' : 'bg-gradient-to-r from-white to-gray-50 text-black'} rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-102 animate-slide-in`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-400 rounded-full mr-4 flex items-center justify-center shadow-md">
                      <span className="text-black font-bold">{bidder.user__username ? bidder.user__username[0] : 'U'}</span>
                    </div>
                    <div className={`flex-1 ${index === 0 ? 'bg-green-600 rounded-lg p-2' : ''}`}>
                      <p className={`font-semibold ${index === 0 ? 'text-black' : ''}`}>
                        {bidder.user__username || `User ${index + 1}`}
                      </p>
                      {index === 0 && <p className="text-xs bg-green text-white px-2 py-1 rounded-full inline-block mt-1">👑Current Winner</p>}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-black">{bidder.highest_bid} <FaCoins className="inline text-amber-400" /></p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No bids yet. Be the first to place a bid!
                </div>
              )}
            </div>
          </>
        )}

        {showBidModal && auction && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
            <div className="bg-white w-full max-w-md rounded-xl shadow-2xl p-6">
              <h3 className="text-xl font-bold text-black mb-4">Place Your Bid</h3>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Current bid</span>
                  <span className="font-semibold text-black">{formatBid(currentBid)} coins</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Minimum next bid</span>
                  <span className="font-semibold text-black">{formatBid(minimumNextBid)} coins</span>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Your bid amount</label>
                <input
                  type="number"
                  min={minimumNextBid}
                  step="1"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {bidError && (
                <div className="mb-4 bg-red border border-red text-red-700 px-3 py-2 rounded text-sm">
                  {bidError}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeBidModal}
                  disabled={isSubmittingBid}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBid}
                  disabled={isSubmittingBid}
                  className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-60"
                >
                  {isSubmittingBid ? 'Placing...' : 'Confirm Bid'}
                </button>
              </div>
            </div>
          </div>
        )}
            </div>
          </>
            )}
      </div>
    </Sidebar>
  );
};

export default AuctionPage;
