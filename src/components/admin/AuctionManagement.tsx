import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { FaSave, FaEdit } from 'react-icons/fa';

const AuctionManagement = forwardRef((_props, ref) => {
  const [auctionData, setAuctionData] = useState({
    title: '5-DAY MEAL PASS @ ST RINA',
    description: 'Because cooking is overrated and your gas deserves a break.',
    startDuration: { days: 2, hours: 5, minutes: 30, seconds: 0 },
    endDuration: { days: 8, hours: 11, minutes: 26, seconds: 0 },
    leaderboardSize: 5,
    images: ['/ST Rina 1.jpg', '/ST Rina 2.jpg', '/ST Rina 3.jpg']
  });

  const [showModal, setShowModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Expose openModal method to parent component
  useImperativeHandle(ref, () => ({
    openModal: () => setShowModal(true)
  }));

  // Optimized auto-rotate images with reduced frequency
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % auctionData.images.length);
    }, 6000); // Change image every 6 seconds for better performance

    return () => clearInterval(interval);
  }, [auctionData.images.length]);

  const handleInputChange = (field: string, value: string) => {
    setAuctionData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleStartDurationChange = (unit: string, value: number) => {
    setAuctionData(prev => ({
      ...prev,
      startDuration: { ...prev.startDuration, [unit]: value }
    }));
  };

  const handleEndDurationChange = (unit: string, value: number) => {
    setAuctionData(prev => ({
      ...prev,
      endDuration: { ...prev.endDuration, [unit]: value }
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
    // TODO: Upload to server and update images array
    console.log('Selected files:', files);
  };

  const handleSave = () => {
    // Validation: Ensure start time is before end time
    const startTotalMinutes = (auctionData.startDuration.days * 24 * 60) +
                             (auctionData.startDuration.hours * 60) +
                             auctionData.startDuration.minutes;
    const endTotalMinutes = (auctionData.endDuration.days * 24 * 60) +
                           (auctionData.endDuration.hours * 60) +
                           auctionData.endDuration.minutes;

    if (startTotalMinutes >= endTotalMinutes) {
      // alert('Error: Auction start time must be before the end time!');
      return;
    }

    // TODO: Save to backend
    console.log('Saving auction data:', auctionData);
    setShowModal(false);
    // alert('Auction settings saved successfully!');
  };

  return (
    <div>
      {/* Live Auction Display */}
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Auction Info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">{auctionData.title}</h2>
            <p className="text-gray-600 mb-4 text-sm md:text-base">{auctionData.description}</p>

            {/* Countdown Timer */}
            <div className="flex items-center justify-center md:justify-start space-x-2 md:space-x-4">
              <div className="text-center">
                <div className="text-xl md:text-2xl font-bold text-blue-600">{auctionData.endDuration.days.toString().padStart(2, '0')}</div>
                <div className="text-xs text-gray-500">DAYS</div>
              </div>
              <div className="text-center">
                <div className="text-xl md:text-2xl font-bold text-blue-600">{auctionData.endDuration.hours.toString().padStart(2, '0')}</div>
                <div className="text-xs text-gray-500">HOURS</div>
              </div>
              <div className="text-center">
                <div className="text-xl md:text-2xl font-bold text-blue-600">{auctionData.endDuration.minutes.toString().padStart(2, '0')}</div>
                <div className="text-xs text-gray-500">MIN</div>
              </div>
              <div className="text-center">
                <div className="text-xl md:text-2xl font-bold text-blue-600">{auctionData.endDuration.seconds.toString().padStart(2, '0')}</div>
                <div className="text-xs text-gray-500">SEC</div>
              </div>
            </div>
          </div>

          {/* Image Slideshow */}
          <div className="w-full md:w-48 h-32 md:h-32 relative overflow-hidden rounded-lg flex-shrink-0">
            {auctionData.images.map((image, index) => (
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
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
              {auctionData.images.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Edit Button */}
          <div className="md:ml-4 flex justify-center md:justify-start">
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 text-white px-3 py-2 md:px-4 md:py-2 rounded hover:bg-blue-700 transition-colors flex items-center text-sm md:text-base"
            >
              <FaEdit className="mr-1 md:mr-2" />
              <span className="hidden sm:inline">Edit Auction</span>
              <span className="sm:hidden">Edit</span>
            </button>
          </div>
        </div>
      </div>

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
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Days</label>
                      <input
                        type="number"
                        value={auctionData.startDuration.days}
                        onChange={(e) => handleStartDurationChange('days', parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Hours</label>
                      <input
                        type="number"
                        value={auctionData.startDuration.hours}
                        onChange={(e) => handleStartDurationChange('hours', parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                        min="0"
                        max="23"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Minutes</label>
                      <input
                        type="number"
                        value={auctionData.startDuration.minutes}
                        onChange={(e) => handleStartDurationChange('minutes', parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                        min="0"
                        max="59"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Seconds</label>
                      <input
                        type="number"
                        value={auctionData.startDuration.seconds}
                        onChange={(e) => handleStartDurationChange('seconds', parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                        min="0"
                        max="59"
                      />
                    </div>
                  </div>
                </div>

                {/* End Time */}
                <div>
                  <h5 className="text-md font-semibold mb-3 text-red">⏰ Auction End Time</h5>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Days</label>
                      <input
                        type="number"
                        value={auctionData.endDuration.days}
                        onChange={(e) => handleEndDurationChange('days', parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Hours</label>
                      <input
                        type="number"
                        value={auctionData.endDuration.hours}
                        onChange={(e) => handleEndDurationChange('hours', parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                        min="0"
                        max="23"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Minutes</label>
                      <input
                        type="number"
                        value={auctionData.endDuration.minutes}
                        onChange={(e) => handleEndDurationChange('minutes', parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                        min="0"
                        max="59"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Seconds</label>
                      <input
                        type="number"
                        value={auctionData.endDuration.seconds}
                        onChange={(e) => handleEndDurationChange('seconds', parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                        min="0"
                        max="59"
                      />
                    </div>
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
    </div>
  );
});

AuctionManagement.displayName = 'AuctionManagement';

export default AuctionManagement;
