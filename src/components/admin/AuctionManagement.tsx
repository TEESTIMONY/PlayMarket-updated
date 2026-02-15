import React, { useState, useEffect, useImperativeHandle, forwardRef, useCallback, useMemo } from 'react';
import { FaSave, FaEdit, FaPlus, FaTrash, FaClock, FaImage, FaEye, FaPlay, FaStop, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { apiService } from '../../services/api';

interface TimeFieldProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  onDecrement: () => void;
  onIncrement: () => void;
}

const TimeField: React.FC<TimeFieldProps> = ({
  label,
  value,
  min = 0,
  max,
  onChange,
  onDecrement,
  onIncrement,
}) => {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onDecrement}
          className="w-8 h-8 rounded border border-gray-300 bg-gray-100 text-black hover:bg-gray-200 flex items-center justify-center"
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value) || 0)}
          className="auction-time-input w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
          min={min}
          max={max}
          step="1"
        />
        <button
          type="button"
          onClick={onIncrement}
          className="w-8 h-8 rounded border border-gray-300 bg-gray-100 text-black hover:bg-gray-200 flex items-center justify-center"
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
};

const AuctionManagement = forwardRef((_props, ref) => {
  const getInitialCreateAuctionData = () => ({
    title: '',
    description: '',
    minimum_bid: 100,
    startDuration: { days: 0, hours: 0, minutes: 0, seconds: 0 },
    endDuration: { days: 1, hours: 0, minutes: 0, seconds: 0 },
    leaderboardSize: 5,
    images: [] as string[],
    imageFiles: [] as File[]
  });

  const [auctions, setAuctions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAuction, setSelectedAuction] = useState<any | null>(null);
  const [auctionData, setAuctionData] = useState({
    title: '',
    description: '',
    minimum_bid: 100,
    startDuration: { days: 0, hours: 0, minutes: 0, seconds: 0 },
    endDuration: { days: 0, hours: 0, minutes: 0, seconds: 0 },
    leaderboardSize: 5,
    images: [] as string[]
  });
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [createAuctionData, setCreateAuctionData] = useState({
    ...getInitialCreateAuctionData()
  });
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Expose openModal method to parent component
  useImperativeHandle(ref, () => ({
    openModal: () => setShowModal(true),
    openCreateModal: () => setShowCreateModal(true)
  }));

  // Fetch auctions from API
  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        setLoading(true);
        const response = await apiService.getAuctions();
        setAuctions(response.results || response);
        setError(null);
      } catch (err) {
        console.error('Error fetching auctions:', err);
        setError('Failed to load auctions. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchAuctions();
  }, []);

  // Set default selected auction if none selected
  useEffect(() => {
    if (auctions.length > 0 && !selectedAuction) {
      setSelectedAuction(auctions[0]);
    }
  }, [auctions]);

  // Initialize auctionData when selectedAuction changes
  useEffect(() => {
    if (selectedAuction) {
      setAuctionData({
        title: selectedAuction.title || '',
        description: selectedAuction.description || '',
        minimum_bid: selectedAuction.minimum_bid || 100,
        startDuration: calculateDuration(selectedAuction.starts_at),
        endDuration: calculateDuration(selectedAuction.ends_at),
        leaderboardSize: 5,
        images: selectedAuction.images || []
      });
    }
  }, [selectedAuction]);

  // Memoized helper function to calculate duration from ISO date
  const calculateDuration = useCallback((isoDate: string) => {
    const now = new Date();
    const targetDate = new Date(isoDate);
    const diffMs = targetDate.getTime() - now.getTime();
    
    if (diffMs <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const diffSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    return {
      days: diffDays,
      hours: diffHours,
      minutes: diffMinutes,
      seconds: diffSeconds
    };
  }, []);

  // Memoized countdown calculation
  const countdown = useMemo(() => {
    if (!selectedAuction) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    return calculateDuration(selectedAuction.ends_at);
  }, [selectedAuction, calculateDuration]);

  // Optimized auto-rotate images with reduced frequency
  useEffect(() => {
    if (!selectedAuction || !selectedAuction.images || selectedAuction.images.length === 0) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % selectedAuction.images.length);
    }, 6000); // Change image every 6 seconds for better performance

    return () => clearInterval(interval);
  }, [selectedAuction]);

  const handleInputChange = (field: string, value: string) => {
    setAuctionData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getDurationMax = (unit: string) => {
    if (unit === 'hours') return 23;
    if (unit === 'minutes' || unit === 'seconds') return 59;
    return Number.MAX_SAFE_INTEGER;
  };

  const clampDurationValue = (unit: string, value: number) => {
    const safeValue = Number.isNaN(value) ? 0 : value;
    return Math.max(0, Math.min(getDurationMax(unit), safeValue));
  };

  const handleStartDurationChange = (unit: string, value: number) => {
    setAuctionData(prev => ({
      ...prev,
      startDuration: { ...prev.startDuration, [unit]: clampDurationValue(unit, value) }
    }));
  };

  const handleEndDurationChange = (unit: string, value: number) => {
    setAuctionData(prev => ({
      ...prev,
      endDuration: { ...prev.endDuration, [unit]: clampDurationValue(unit, value) }
    }));
  };

  const adjustStartDuration = (unit: string, delta: number) => {
    setAuctionData(prev => ({
      ...prev,
      startDuration: {
        ...prev.startDuration,
        [unit]: clampDurationValue(unit, (prev.startDuration as any)[unit] + delta),
      },
    }));
  };

  const adjustEndDuration = (unit: string, delta: number) => {
    setAuctionData(prev => ({
      ...prev,
      endDuration: {
        ...prev.endDuration,
        [unit]: clampDurationValue(unit, (prev.endDuration as any)[unit] + delta),
      },
    }));
  };

  const handleLeaderboardSizeChange = (value: number) => {
    setAuctionData(prev => ({
      ...prev,
      leaderboardSize: value
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      // Create URLs for the uploaded files
      const newImageUrls = files.map(file => URL.createObjectURL(file));
      
      // Update the auctionData with new images
      setAuctionData(prev => ({
        ...prev,
        images: [...prev.images, ...newImageUrls]
      }));
      
      // Reset the file input
      e.target.value = '';
    }
  };

  const durationToMs = (duration: { days: number; hours: number; minutes: number; seconds: number }) => {
    return (
      (duration.days * 24 * 60 * 60 * 1000) +
      (duration.hours * 60 * 60 * 1000) +
      (duration.minutes * 60 * 1000) +
      (duration.seconds * 1000)
    );
  };

  const handleSave = () => {
    // Validation: Ensure start time is before end time
    const startTotalMs = durationToMs(auctionData.startDuration);
    const endTotalMs = durationToMs(auctionData.endDuration);

    if (startTotalMs >= endTotalMs) {
      // alert('Error: Auction start time must be before the end time!');
      return;
    }

    // TODO: Save to backend
    setShowModal(false);
    // alert('Auction settings saved successfully!');
  };

  const handleCreateInputChange = (field: string, value: string) => {
    setCreateAuctionData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateStartDurationChange = (unit: string, value: number) => {
    setCreateAuctionData(prev => ({
      ...prev,
      startDuration: { ...prev.startDuration, [unit]: clampDurationValue(unit, value) }
    }));
  };

  const handleCreateEndDurationChange = (unit: string, value: number) => {
    setCreateAuctionData(prev => ({
      ...prev,
      endDuration: { ...prev.endDuration, [unit]: clampDurationValue(unit, value) }
    }));
  };

  const adjustCreateStartDuration = (unit: string, delta: number) => {
    setCreateAuctionData(prev => ({
      ...prev,
      startDuration: {
        ...prev.startDuration,
        [unit]: clampDurationValue(unit, (prev.startDuration as any)[unit] + delta),
      },
    }));
  };

  const adjustCreateEndDuration = (unit: string, delta: number) => {
    setCreateAuctionData(prev => ({
      ...prev,
      endDuration: {
        ...prev.endDuration,
        [unit]: clampDurationValue(unit, (prev.endDuration as any)[unit] + delta),
      },
    }));
  };

  const handleCreateLeaderboardSizeChange = (value: number) => {
    setCreateAuctionData(prev => ({
      ...prev,
      leaderboardSize: value
    }));
  };

  const handleCreateImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(file => file.type.startsWith('image/'));
    if (files.length > 0) {
      // Create URLs for the uploaded files
      const newImageUrls = files.map(file => URL.createObjectURL(file));
      
      // Update the createAuctionData with new images
      setCreateAuctionData(prev => ({
        ...prev,
        images: [...prev.images, ...newImageUrls],
        imageFiles: [...prev.imageFiles, ...files]
      }));
      
      // Reset the file input
      e.target.value = '';
    }
  };

  const handleRemoveCreateImage = (indexToRemove: number) => {
    setCreateAuctionData(prev => {
      const nextImages = [...prev.images];
      const removedImage = nextImages.splice(indexToRemove, 1)[0];

      if (removedImage?.startsWith('blob:')) {
        URL.revokeObjectURL(removedImage);
      }

      const nextFiles = [...prev.imageFiles];
      nextFiles.splice(indexToRemove, 1);

      return {
        ...prev,
        images: nextImages,
        imageFiles: nextFiles,
      };
    });
  };

  const handleCreateAuction = async () => {
    // Validation for create auction
    if (!createAuctionData.title.trim()) {
      alert('Please enter a title for the auction');
      return;
    }

    if (!createAuctionData.description.trim()) {
      alert('Please enter a description for the auction');
      return;
    }

    // Validation: Ensure start time is before end time
    const startTotalMs = durationToMs(createAuctionData.startDuration);
    const endTotalMs = durationToMs(createAuctionData.endDuration);

    if (startTotalMs >= endTotalMs) {
      alert('Error: Auction start time must be before the end time!');
      return;
    }

    if (createAuctionData.leaderboardSize < 1 || createAuctionData.leaderboardSize > 20) {
      alert('Leaderboard size must be between 1 and 20');
      return;
    }

    setIsCreating(true);
    
    try {
      // Calculate start and end times
      const now = new Date();
      const startTime = new Date(now.getTime() + startTotalMs);
      
      const endTime = new Date(now.getTime() + endTotalMs);

      // Prepare multipart auction data for API
      const auctionPayload = new FormData();
      auctionPayload.append('title', createAuctionData.title.trim());
      auctionPayload.append('description', createAuctionData.description.trim());
      auctionPayload.append('minimum_bid', String(createAuctionData.minimum_bid));
      auctionPayload.append('starts_at', startTime.toISOString());
      auctionPayload.append('ends_at', endTime.toISOString());

      createAuctionData.imageFiles.forEach((file) => {
        auctionPayload.append('images', file);
      });

      // Call API to create auction
      const result = await apiService.createAuction(auctionPayload);

      // Refresh auction list after creation
      const refreshed = await apiService.getAuctions();
      setAuctions(refreshed.results || refreshed);
      
      alert('Auction created successfully!');
      setShowCreateModal(false);
      
      createAuctionData.images.forEach((image) => {
        if (image.startsWith('blob:')) {
          URL.revokeObjectURL(image);
        }
      });

      // Reset form
      setCreateAuctionData(getInitialCreateAuctionData());
      
    } catch (error) {
      console.error('Error creating auction:', error);
      alert('Failed to create auction. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCloseCreateModal = () => {
    createAuctionData.images.forEach((image) => {
      if (image.startsWith('blob:')) {
        URL.revokeObjectURL(image);
      }
    });

    setShowCreateModal(false);
    setCreateAuctionData(getInitialCreateAuctionData());
  };

  const handleDeleteAuction = async (auctionId: number, auctionTitle: string) => {
    const confirmed = window.confirm(`Delete auction "${auctionTitle}"? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      await apiService.deleteAuction(auctionId);

      const refreshed = await apiService.getAuctions();
      const nextAuctions = refreshed.results || refreshed;
      setAuctions(nextAuctions);

      if (selectedAuction?.id === auctionId) {
        setSelectedAuction(nextAuctions.length > 0 ? nextAuctions[0] : null);
      }

      alert('Auction deleted successfully.');
    } catch (deleteError) {
      console.error('Error deleting auction:', deleteError);
      alert('Failed to delete auction. Please try again.');
    }
  };

  // Auction Card Component
  const AuctionCard = ({ auction }: { auction: any }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Auto-rotate images for this specific card
    useEffect(() => {
      if (!auction.images || auction.images.length === 0) {
        return;
      }

      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % auction.images.length);
      }, 6000);

      return () => clearInterval(interval);
    }, [auction.images]);

    const calculateDuration = (isoDate: string) => {
      const now = new Date();
      const targetDate = new Date(isoDate);
      const diffMs = targetDate.getTime() - now.getTime();
      
      if (diffMs <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const diffSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      return {
        days: diffDays,
        hours: diffHours,
        minutes: diffMinutes,
        seconds: diffSeconds
      };
    };

    const countdown = calculateDuration(auction.ends_at);

    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 hover:border-gray-300 transition-all">
        {/* Auction Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-semibold text-gray-800 text-lg">{auction.title}</h4>
            <span className={`px-2 py-1 text-xs rounded-full ${
              auction.status === 'active' ? 'bg-green-100 text-green-800' :
              auction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {auction.status}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-3">{auction.description}</p>
          
          {/* Countdown Timer */}
          <div className="flex items-center justify-center space-x-2 md:space-x-4 mb-3">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{countdown.days.toString().padStart(2, '0')}</div>
              <div className="text-xs text-gray-500">DAYS</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{countdown.hours.toString().padStart(2, '0')}</div>
              <div className="text-xs text-gray-500">HOURS</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{countdown.minutes.toString().padStart(2, '0')}</div>
              <div className="text-xs text-gray-500">MIN</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{countdown.seconds.toString().padStart(2, '0')}</div>
              <div className="text-xs text-gray-500">SEC</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <button
                onClick={() => handleDeleteAuction(auction.id, auction.title)}
                className="px-3 py-1 bg-red text-white rounded text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
            <div className="text-xs text-gray-500">
              Ends: {new Date(auction.ends_at).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Image Section */}
        <div className="p-4">
          <div className="w-full h-32 relative overflow-hidden rounded-lg mb-3">
            {auction.images && auction.images.map((image: string, index: number) => (
              <img
                key={index}
                src={image}
                alt={`Auction ${index + 1}`}
                loading="lazy"
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                  index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                }`}
              />
            ))}
            {auction.images && auction.images.length > 0 && (
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                {auction.images.map((_: any, index: number) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full ${
                      index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Image Info */}
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Auction Images</span>
            <span className="text-xs text-gray-500">
              {auction.images && auction.images.length > 0 ? auction.images.length : 0} image(s)
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Auction List Component
  const AuctionList = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-gray-500 font-semibold">All Auctions</h3>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors flex items-center text-sm"
        >
          <FaPlus className="mr-2" />
          Create New Auction
        </button>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="text-red-500 text-center py-4">{error}</div>
      ) : auctions.length === 0 ? (
        <div className="text-gray-500 text-center py-4">No auctions found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {auctions.map((auction) => (
            <AuctionCard key={auction.id} auction={auction} />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div>
      {/* Auction List */}
      <AuctionList />

      {/* Auction Settings Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto mx-4">
            <h3 className="text-xl font-bold mb-6">Edit Auction Settings</h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
              {/* Auction Details */}
              <div>
                <h4 className="text-lg font-semibold mb-4">Auction Details</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                    <input
                      type="text"
                      value={auctionData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={auctionData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Bid</label>
                    <input
                      type="number"
                      value={auctionData.minimum_bid}
                      onChange={(e) => handleInputChange('minimum_bid', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                      step="1"
                    />
                    <p className="text-xs text-gray-500 mt-1">Set the minimum starting bid for this auction</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Leaderboard Size</label>
                    <input
                      type="number"
                      value={auctionData.leaderboardSize}
                      onChange={(e) => handleLeaderboardSizeChange(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                      max="20"
                    />
                    <p className="text-xs text-gray-500 mt-1">Set the number of top bidders to display on the auction page (1-20)</p>
                  </div>
                </div>
              </div>

              {/* Timer Settings */}
              <div className="space-y-6">
                {/* Start Time */}
                <div>
                  <h5 className="text-md font-semibold mb-3 text-blue-600">🕐 Auction Start Time</h5>
                  <div className="grid grid-cols-2 gap-3">
                    <TimeField
                      label="Days"
                      value={auctionData.startDuration.days}
                      onChange={(value) => handleStartDurationChange('days', value)}
                      onDecrement={() => adjustStartDuration('days', -1)}
                      onIncrement={() => adjustStartDuration('days', 1)}
                    />
                    <TimeField
                      label="Hours"
                      value={auctionData.startDuration.hours}
                      max={23}
                      onChange={(value) => handleStartDurationChange('hours', value)}
                      onDecrement={() => adjustStartDuration('hours', -1)}
                      onIncrement={() => adjustStartDuration('hours', 1)}
                    />
                    <TimeField
                      label="Minutes"
                      value={auctionData.startDuration.minutes}
                      max={59}
                      onChange={(value) => handleStartDurationChange('minutes', value)}
                      onDecrement={() => adjustStartDuration('minutes', -1)}
                      onIncrement={() => adjustStartDuration('minutes', 1)}
                    />
                    <TimeField
                      label="Seconds"
                      value={auctionData.startDuration.seconds}
                      max={59}
                      onChange={(value) => handleStartDurationChange('seconds', value)}
                      onDecrement={() => adjustStartDuration('seconds', -1)}
                      onIncrement={() => adjustStartDuration('seconds', 1)}
                    />
                  </div>
                </div>

                {/* End Time */}
                <div>
                  <h5 className="text-md font-semibold mb-3 text-red">⏰ Auction End Time</h5>
                  <div className="grid grid-cols-2 gap-3">
                    <TimeField
                      label="Days"
                      value={auctionData.endDuration.days}
                      onChange={(value) => handleEndDurationChange('days', value)}
                      onDecrement={() => adjustEndDuration('days', -1)}
                      onIncrement={() => adjustEndDuration('days', 1)}
                    />
                    <TimeField
                      label="Hours"
                      value={auctionData.endDuration.hours}
                      max={23}
                      onChange={(value) => handleEndDurationChange('hours', value)}
                      onDecrement={() => adjustEndDuration('hours', -1)}
                      onIncrement={() => adjustEndDuration('hours', 1)}
                    />
                    <TimeField
                      label="Minutes"
                      value={auctionData.endDuration.minutes}
                      max={59}
                      onChange={(value) => handleEndDurationChange('minutes', value)}
                      onDecrement={() => adjustEndDuration('minutes', -1)}
                      onIncrement={() => adjustEndDuration('minutes', 1)}
                    />
                    <TimeField
                      label="Seconds"
                      value={auctionData.endDuration.seconds}
                      max={59}
                      onChange={(value) => handleEndDurationChange('seconds', value)}
                      onDecrement={() => adjustEndDuration('seconds', -1)}
                      onIncrement={() => adjustEndDuration('seconds', 1)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Image Management */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-4">Auction Images</h4>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload New Images</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-sm text-gray-500 mt-1">Select multiple images for the slideshow</p>
              </div>
              <div>
                <h5 className="text-md font-medium mb-2">Current Images</h5>
                <div className="grid grid-cols-3 gap-4">
                  {auctionData.images.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image}
                        alt={`Auction ${index + 1}`}
                        className="w-full h-32 object-cover rounded-md border"
                      />
                      <button className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600">
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 bg-green text-white rounded-md hover:opacity-90 transition-colors flex items-center"
              >
                <FaSave className="mr-2" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Auction Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto mx-4">
            <h3 className="text-xl font-bold mb-6">Create New Auction</h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
              {/* Auction Details */}
              <div>
                <h4 className="text-lg font-semibold mb-4">Auction Details</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                    <input
                      type="text"
                      value={createAuctionData.title}
                      onChange={(e) => handleCreateInputChange('title', e.target.value)}
                      placeholder="Enter auction title"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={createAuctionData.description}
                      onChange={(e) => handleCreateInputChange('description', e.target.value)}
                      placeholder="Enter auction description"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Bid</label>
                    <input
                      type="number"
                      value={createAuctionData.minimum_bid}
                      onChange={(e) => handleCreateInputChange('minimum_bid', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                      step="1"
                    />
                    <p className="text-xs text-gray-500 mt-1">Set the minimum starting bid for this auction</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Leaderboard Size</label>
                    <input
                      type="number"
                      value={createAuctionData.leaderboardSize}
                      onChange={(e) => handleCreateLeaderboardSizeChange(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                      max="20"
                    />
                    <p className="text-xs text-gray-500 mt-1">Set the number of top bidders to display on the auction page (1-20)</p>
                  </div>
                </div>
              </div>

              {/* Timer Settings */}
              <div className="space-y-6">
                {/* Start Time */}
                <div>
                  <h5 className="text-md font-semibold mb-3 text-blue-600">🕐 Auction Start Time</h5>
                  <div className="grid grid-cols-2 gap-3">
                    <TimeField
                      label="Days"
                      value={createAuctionData.startDuration.days}
                      onChange={(value) => handleCreateStartDurationChange('days', value)}
                      onDecrement={() => adjustCreateStartDuration('days', -1)}
                      onIncrement={() => adjustCreateStartDuration('days', 1)}
                    />
                    <TimeField
                      label="Hours"
                      value={createAuctionData.startDuration.hours}
                      max={23}
                      onChange={(value) => handleCreateStartDurationChange('hours', value)}
                      onDecrement={() => adjustCreateStartDuration('hours', -1)}
                      onIncrement={() => adjustCreateStartDuration('hours', 1)}
                    />
                    <TimeField
                      label="Minutes"
                      value={createAuctionData.startDuration.minutes}
                      max={59}
                      onChange={(value) => handleCreateStartDurationChange('minutes', value)}
                      onDecrement={() => adjustCreateStartDuration('minutes', -1)}
                      onIncrement={() => adjustCreateStartDuration('minutes', 1)}
                    />
                    <TimeField
                      label="Seconds"
                      value={createAuctionData.startDuration.seconds}
                      max={59}
                      onChange={(value) => handleCreateStartDurationChange('seconds', value)}
                      onDecrement={() => adjustCreateStartDuration('seconds', -1)}
                      onIncrement={() => adjustCreateStartDuration('seconds', 1)}
                    />
                  </div>
                </div>

                {/* End Time */}
                <div>
                  <h5 className="text-md font-semibold mb-3 text-red">⏰ Auction End Time</h5>
                  <div className="grid grid-cols-2 gap-3">
                    <TimeField
                      label="Days"
                      value={createAuctionData.endDuration.days}
                      onChange={(value) => handleCreateEndDurationChange('days', value)}
                      onDecrement={() => adjustCreateEndDuration('days', -1)}
                      onIncrement={() => adjustCreateEndDuration('days', 1)}
                    />
                    <TimeField
                      label="Hours"
                      value={createAuctionData.endDuration.hours}
                      max={23}
                      onChange={(value) => handleCreateEndDurationChange('hours', value)}
                      onDecrement={() => adjustCreateEndDuration('hours', -1)}
                      onIncrement={() => adjustCreateEndDuration('hours', 1)}
                    />
                    <TimeField
                      label="Minutes"
                      value={createAuctionData.endDuration.minutes}
                      max={59}
                      onChange={(value) => handleCreateEndDurationChange('minutes', value)}
                      onDecrement={() => adjustCreateEndDuration('minutes', -1)}
                      onIncrement={() => adjustCreateEndDuration('minutes', 1)}
                    />
                    <TimeField
                      label="Seconds"
                      value={createAuctionData.endDuration.seconds}
                      max={59}
                      onChange={(value) => handleCreateEndDurationChange('seconds', value)}
                      onDecrement={() => adjustCreateEndDuration('seconds', -1)}
                      onIncrement={() => adjustCreateEndDuration('seconds', 1)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Image Management */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-4">Auction Images</h4>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Images</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleCreateImageUpload}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-sm text-gray-500 mt-1">Select multiple images for the auction slideshow</p>
              </div>
              {createAuctionData.images.length > 0 && (
                <div>
                  <h5 className="text-md font-medium mb-2">Selected Images</h5>
                  <div className="grid grid-cols-3 gap-4">
                    {createAuctionData.images.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={image}
                          alt={`Auction ${index + 1}`}
                          className="w-full h-32 object-cover rounded-md border"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveCreateImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCloseCreateModal}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAuction}
                disabled={isCreating}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <FaPlus className="mr-2" />
                    Create Auction
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

AuctionManagement.displayName = 'AuctionManagement';

export default AuctionManagement;
