import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCoins } from 'react-icons/fa';
import Sidebar from '../components/Sidebar';
import { useLoading } from '../contexts/LoadingContext';

const AuctionPage: React.FC = () => {
  const navigate = useNavigate();
  const { showLoading, hideLoading } = useLoading();

  // Hardcoded data for demo
  const auctionTitle = '5-DAY MEAL PASS @ ST RINA';
  const auctionDescription = 'Because cooking is overrated and your gas deserves a break.';
  const latestBid = 119;

  // Auction phase state
  const [auctionPhase, setAuctionPhase] = useState<'starting' | 'running'>('starting');

  // Separate time states for start and end
  const [startTimeLeft, setStartTimeLeft] = useState({
    days: 2,
    hours: 5,
    minutes: 30,
    seconds: 0,
  });

  const [endTimeLeft, setEndTimeLeft] = useState({
    days: 8,
    hours: 11,
    minutes: 26,
    seconds: 0,
  });

  // Slideshow images for ST Rina
  const images = [
    '/ST Rina 1.jpg',
    '/ST Rina 2.jpg',
    '/ST Rina 3.jpg'
  ];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

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
          clearInterval(timer);
        }
        return { days, hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [auctionPhase]);

  // End countdown timer
  useEffect(() => {
    if (auctionPhase !== 'running') return;

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
        if (days < 0) clearInterval(timer);
        return { days, hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [auctionPhase]);

  // Combined loading state management for image preloading and Suspense coordination
  useEffect(() => {
    showLoading();
    
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
        setImagesLoaded(true);
      } catch (error) {
        console.warn('Some images failed to load:', error);
        setImageError(true);
      }
    };

    // Start image preloading
    preloadImages();
    
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
  }, [imagesLoaded, imageError]);

  // Optimized slideshow effect with reduced frequency
  useEffect(() => {
    if (!imagesLoaded) return;

    const slideshowTimer = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000); // Change image every 5 seconds for better performance

    return () => clearInterval(slideshowTimer);
  }, [imagesLoaded]);

  const bids = [
    { user: 'USER 1', amount: 119, isWinner: true },
    { user: 'USER 3', amount: 118 },
    { user: 'USER 4', amount: 117 },
    { user: 'USER 2', amount: 116 },
    { user: 'USER 6', amount: 115 },
  ];

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

        {/* Title and Description */}
        <h1 className="text-2xl md:text-4xl text-black mb-2 text-center">{auctionTitle}</h1>
        <p className="font-semibold text-black mb-4 text-center">{auctionDescription}</p>

        {/* Timer */}
        <div className="bg-gradient-to-r from-black to-gray-900 text-white p-6 rounded-xl mb-6 w-full max-w-md lg:max-w-2xl shadow-2xl animate-fade-in relative">
          <div className="absolute top-2 right-2 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs px-3 py-1 rounded-full font-bold animate-bounce shadow-lg border-2 border-white">
            ⏰ +3 min
          </div>
          <p className="text-center text-gray-300 mb-4">
            {auctionPhase === 'starting' ? 'Auction starts in:' : 'Auction ends in:'}
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
            ) : (
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
            )}
          </div>
        </div>

        {/* Latest Bid and Place Bid Button Side by Side */}
        <div className="flex flex-row gap-6 w-full max-w-md lg:max-w-2xl mb-8">
          {/* Latest Bid */}
          <div className="bg-gradient-to-r from-white to-gray-50 p-1 rounded-xl w-1/3 text-center shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200">
            <p className="text-black text-sm font-semibold mb-1">Latest Bid</p>
            <p className="text-black font-bold text-lg animate-bounce">{latestBid} <FaCoins className="inline text-amber-400" /></p>
          </div>

          {/* Place a Bid Button */}
          <button className="bg-gradient-to-r from-black to-gray-800 text-white py-4 px-8 rounded-xl text-xl w-2/3 hover:from-gray-800 hover:to-black transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95">
          Place a Bid
          </button>
        </div>

              {/* Bidding Leaderboard */}
              <div className="w-full max-w-md lg:max-w-2xl space-y-3">
                {bids.map((bid, index) => (
                  <div
                    key={index}
                    className={`flex items-center p-4 ${bid.isWinner ? 'bg-gradient-to-r from-green-600 to-green-800 text-white shadow-green-300' : 'bg-gradient-to-r from-white to-gray-50 text-black'} rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-102 animate-slide-in`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-400 rounded-full mr-4 flex items-center justify-center shadow-md">
                      <span className="text-black font-bold">{bid.user[0]}</span>
                    </div>
                    <div className={`flex-1 ${bid.isWinner ? 'bg-green-600 rounded-lg p-2' : ''}`}>
                      <p className={`font-semibold ${bid.isWinner ? 'text-black' : ''}`}>{bid.user}</p>
                      {bid.isWinner && <p className="text-xs bg-green text-white px-2 py-1 rounded-full inline-block mt-1">👑Current Winner</p>}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-black">{bid.amount} <FaCoins className="inline text-amber-400" /></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
    </Sidebar>
  );
};

export default AuctionPage;
