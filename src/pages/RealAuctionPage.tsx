import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaCoins, FaClock, FaTrophy } from 'react-icons/fa';
import Sidebar from '../components/Sidebar';
import { useLoading } from '../contexts/LoadingContext';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import type { Auction, AuctionLeaderboard } from '../services/api';
import { buildWebSocketUrl } from '../hooks/useWebSocket';

const RealAuctionPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { showLoading, hideLoading } = useLoading();
  const { refreshBalance, isAuthenticated } = useAuth();
  const isAuctionWsEnabled = import.meta.env.VITE_ENABLE_AUCTION_WS === 'true';

  const formatBid = (value: number | string | null | undefined) => {
    const numericValue = Number(value ?? 0);
    if (Number.isNaN(numericValue)) return '0';
    return numericValue.toLocaleString(undefined, { maximumFractionDigits: 0 });
  };

  // State for auction data
  const [auction, setAuction] = useState<Auction | null>(null);
  const [leaderboard, setLeaderboard] = useState<AuctionLeaderboard | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [extensionFlashMessage, setExtensionFlashMessage] = useState<string | null>(null);
  const [showTimeExtendedBadge, setShowTimeExtendedBadge] = useState(false);

  // Timer state
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Image state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // WebSocket state
  const [isConnected, setIsConnected] = useState(false);
  const wsErrorLoggedRef = useRef(false);

  // Fetch auction data
  const fetchAuctionData = async () => {
    if (!id || !isAuthenticated) {
      setIsLoading(false);
      setError(null);
      return;
    }
    
    try {
      setIsLoading(true);
      const auctionData = await apiService.getAuction(parseInt(id));
      setAuction(auctionData);
      
      // Fetch leaderboard
      const leaderboardData = await apiService.getAuctionLeaderboard(parseInt(id));
      setLeaderboard(leaderboardData);
      
      // Preload images
      if (auctionData.images && auctionData.images.length > 0) {
        const imagePromises = auctionData.images.map(src => {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = resolve;
            img.onerror = reject;
            img.src = src;
          });
        });
        
        await Promise.all(imagePromises);
        setImagesLoaded(true);
      }
      
    } catch (err) {
      console.error('Failed to fetch auction:', err);
      setError('Failed to load auction. Please try again.');
    } finally {
      setIsLoading(false);
      hideLoading();
    }
  };

  // Calculate time left
  useEffect(() => {
    if (!auction) return;

    const updateTimer = () => {
      const now = new Date();
      const endTime = new Date(auction.ends_at);
      const startTime = new Date(auction.starts_at);
      
      let targetTime: Date;
      
      if (auction.status === 'upcoming' || auction.status === 'active') {
        // If upcoming, show time until start
        if (now < startTime) {
          targetTime = startTime;
        } else {
          // If active, show time until end
          targetTime = endTime;
        }
      } else {
        // If ended, show 0
        targetTime = now;
      }

      const diff = targetTime.getTime() - now.getTime();
      
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

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [auction]);

  // WebSocket integration
  useEffect(() => {
    if (!isAuctionWsEnabled) return;
    if (!id) return;

    const auctionId = parseInt(id, 10);
    if (Number.isNaN(auctionId)) return;

    wsErrorLoggedRef.current = false;
    const wsUrl = buildWebSocketUrl(`/ws/auction/${auctionId}/`);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      wsErrorLoggedRef.current = false;
      setIsConnected(true);
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'new_bid' && data.auction_id === auctionId) {
          // Update current highest bid
          setAuction((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              current_highest_bid: data.amount,
              highest_bidder: data.user,
              bid_count: data.bid_count ?? ((prev.bid_count || 0) + 1),
              ends_at: data.new_end_time ?? prev.ends_at,
            };
          });

          if (data.auction_extended) {
            setShowTimeExtendedBadge(true);
            setExtensionFlashMessage(
              data.extension_message ||
              'A new highest bid placed 3 mins before the end will extend the auction by 3 min'
            );
          }
          
          // Refresh leaderboard
          fetchAuctionData();
          
          setSuccessMessage(`New bid placed: ${data.amount} coins by ${data.user}`);
          setTimeout(() => setSuccessMessage(null), 3000);
        } else if (data.type === 'auction_ended' && data.auction_id === auctionId) {
          // Auction ended
          setAuction((prev) => (prev ? { ...prev, status: 'ended' } : prev));
          
          setSuccessMessage(`Auction ended! Winner: ${data.winner.username} with ${data.winner.winning_bid} coins`);
          setTimeout(() => setSuccessMessage(null), 5000);
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
      setIsConnected(false);
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
  }, [id, isAuctionWsEnabled]);

  const sendMessage = (message: any) => {
    // This would be implemented if we needed to send messages
    // For now, we're only receiving updates
  };

  // Initialize
  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      setError(null);
      return;
    }

    showLoading();
    fetchAuctionData();
  }, [id, isAuthenticated]);

  // Image slideshow
  useEffect(() => {
    const displayImages = auction?.images && auction.images.length > 0
      ? auction.images
      : ['/ST Rina 1.jpg', '/ST Rina 2.jpg', '/ST Rina 3.jpg'];

    if (!imagesLoaded || displayImages.length <= 1) return;

    const slideshowTimer = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % displayImages.length);
    }, 5000);

    return () => clearInterval(slideshowTimer);
  }, [imagesLoaded, auction?.images]);

  // Place bid
  const handlePlaceBid = async () => {
    if (!isAuthenticated) {
      setError('Please sign in to place a bid.');
      navigate('/login');
      return;
    }

    if (!auction) return;
    
    const amount = parseInt(bidAmount);
    if (!amount || amount <= 0) {
      setError('Please enter a valid bid amount');
      return;
    }

    // Calculate minimum bid
    const currentHighest = auction.current_highest_bid || auction.minimum_bid;
    const minimumBid = currentHighest + 1; // Default increment is 1 coin
    
    if (amount < minimumBid) {
      setError(`Bid must be at least ${minimumBid} coins`);
      return;
    }

    try {
      showLoading();
      const result = await apiService.placeBid(auction.id, amount);
      await refreshBalance();

      if (result?.extension_applied) {
        setShowTimeExtendedBadge(true);
        setExtensionFlashMessage(
          result.extension_message ||
          'A new highest bid placed 3 mins before the end will extend the auction by 3 min'
        );
      }
      
      setSuccessMessage(`Bid placed successfully: ${amount} coins`);
      setBidAmount('');
      
      // Send WebSocket message to notify others
      sendMessage({
        type: 'place_bid',
        action: 'place_bid',
        auction_id: auction.id,
        amount: amount,
        user: 'Current User' // This would come from auth context
      });
      
      // Refresh data
      fetchAuctionData();
      
    } catch (err: any) {
      console.error('Failed to place bid:', err);
      setError(err.message || 'Failed to place bid. Please try again.');
    } finally {
      hideLoading();
    }
  };

  useEffect(() => {
    if (!extensionFlashMessage) return;
    const timer = setTimeout(() => setExtensionFlashMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [extensionFlashMessage]);

  if (isLoading) {
    return (
      <Sidebar>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading auction...</p>
          </div>
        </div>
      </Sidebar>
    );
  }

  if (!isAuthenticated) {
    return (
      <Sidebar>
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-700 mb-3">Please Login</h2>
            <p className="text-gray-600 mb-5">You need to be signed in to view and place auction bids.</p>
            <button
              onClick={() => navigate('/login')}
              className="bg-black text-white px-5 py-2 rounded-lg hover:bg-gray-800"
            >
              Go to Login
            </button>
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
            <div className="text-red-500 text-4xl mb-4">❌</div>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </Sidebar>
    );
  }

  if (!auction) {
    return (
      <Sidebar>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">Auction not found</p>
            <button
              onClick={() => navigate('/')}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mt-4"
            >
              Go Back
            </button>
          </div>
        </div>
      </Sidebar>
    );
  }

  const images = auction.images && auction.images.length > 0
    ? auction.images
    : ['/ST Rina 1.jpg', '/ST Rina 2.jpg', '/ST Rina 3.jpg'];

  return (
    <Sidebar>
      <div className="flex-1 overflow-auto">
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
                  alt={`${auction.title} ${index + 1}`}
                  loading="lazy"
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                    index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                  }`}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ))}
            </div>
            {/* Slideshow indicators */}
            {images.length > 1 && (
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
            )}
          </div>

          {/* Title and Description */}
          <h1 className="text-2xl md:text-4xl font-bold text-black mb-2 text-center">{auction.title}</h1>
          <p className="text-gray-600 mb-4 text-center">{auction.description}</p>

          {/* Status Badge */}
          <div className={`px-4 py-2 rounded-full mb-4 ${
            auction.status === 'active' ? 'bg-green-100 text-green-800' :
            auction.status === 'upcoming' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            <span className="font-semibold">{auction.status.toUpperCase()}</span>
          </div>

          {/* Timer */}
          <div className="bg-gradient-to-r from-black to-gray-900 text-white p-6 rounded-xl mb-6 w-full max-w-md lg:max-w-2xl shadow-2xl relative">
            {showTimeExtendedBadge && (
              <div className="absolute top-2 right-2 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs px-3 py-1 rounded-full font-bold animate-bounce shadow-lg border-2 border-white">
                ⏰ +3 min
              </div>
            )}
            <div className="flex items-center justify-center mb-4">
              <FaClock className="text-yellow-400 text-2xl mr-2" />
              <h3 className="text-lg font-semibold">
                {auction.status === 'upcoming' ? 'Starts in:' : auction.status === 'active' ? 'Ends in:' : 'Ended'}
              </h3>
            </div>
            <div className="flex justify-around">
              <div className="text-center">
                <div className="text-2xl font-bold">{timeLeft.days.toString().padStart(2, '0')}</div>
                <div className="text-xs text-gray-300">Days</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{timeLeft.hours.toString().padStart(2, '0')}</div>
                <div className="text-xs text-gray-300">Hours</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{timeLeft.minutes.toString().padStart(2, '0')}</div>
                <div className="text-xs text-gray-300">Minutes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{timeLeft.seconds.toString().padStart(2, '0')}</div>
                <div className="text-xs text-gray-300">Seconds</div>
              </div>
            </div>
          </div>

          {/* Current Bid Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-md lg:max-w-2xl mb-6">
            <div className="bg-white p-4 rounded-lg shadow text-center">
              <div className="text-2xl font-bold text-blue-600">{formatBid(auction.current_highest_bid || auction.minimum_bid)} <FaCoins className="inline text-amber-400" /></div>
              <div className="text-sm text-gray-600">Current Bid</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow text-center">
              <div className="text-2xl font-bold text-green-600">{auction.bid_count}</div>
              <div className="text-sm text-gray-600">Total Bids</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow text-center">
              <div className="text-2xl font-bold text-purple-600">{leaderboard?.top_bidders.length || 0}</div>
              <div className="text-sm text-gray-600">Top Bidders</div>
            </div>
          </div>

          {/* Place Bid Section */}
          <div className="w-full max-w-md lg:max-w-2xl mb-8">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold mb-4">Place Your Bid</h3>
              
              {successMessage && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                  {successMessage}
                </div>
              )}

              {extensionFlashMessage && (
                <div className="bg-gray-100 border border-gray-300 text-gray-800 px-4 py-3 rounded mb-4">
                  {extensionFlashMessage}
                </div>
              )}
              
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}
              
              <div className="flex gap-4">
                <input
                  type="number"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder={`Minimum: ${auction.current_highest_bid ? auction.current_highest_bid + 1 : auction.minimum_bid}`}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={auction.current_highest_bid ? auction.current_highest_bid + 1 : auction.minimum_bid}
                />
                <button
                  onClick={handlePlaceBid}
                  disabled={auction.status !== 'active'}
                  className={`px-6 py-2 rounded-lg font-semibold ${
                    auction.status === 'active'
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  } transition-colors`}
                >
                  {isAuthenticated ? 'Place Bid' : 'Sign In to Bid'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Minimum increment: 1 coin
              </p>
            </div>
          </div>

          {/* Bidding Leaderboard */}
          <div className="w-full max-w-md lg:max-w-2xl">
            <h3 className="text-lg font-semibold mb-4">Top Bidders</h3>
            <div className="space-y-3">
              {leaderboard?.top_bidders.map((bidder, index) => (
                <div
                  key={index}
                  className="flex items-center p-4 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-400 rounded-full mr-4 flex items-center justify-center shadow-md">
                    <span className="text-black font-bold">{bidder.user__username[0]}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{bidder.user__username}</p>
                      {index === 0 && (
                        <FaTrophy className="text-yellow-500 text-lg" title="Current Leader" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">Highest bid: {bidder.highest_bid} coins</p>
                    <p className="text-xs text-gray-500">Total bids: {bidder.total_bids}</p>
                  </div>
                </div>
              ))}
              {(!leaderboard?.top_bidders || leaderboard.top_bidders.length === 0) && (
                <div className="text-center py-4 text-gray-500">
                  No bids yet. Be the first to place a bid!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Sidebar>
  );
};

export default RealAuctionPage;