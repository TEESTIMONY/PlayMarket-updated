import { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import { FaUser, FaCoins, FaShoppingCart, FaTrophy, FaHistory, FaCog, FaHome, FaGavel } from 'react-icons/fa';

interface User {
  id: string;
  username: string;
  email: string;
  balance: number;
  avatar?: string;
  joinDate: string;
  totalSpent: number;
  itemsWon: number;
  bountiesCompleted: number;
}

const ProfilePage = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Mock user data - in real app this would come from context/API
  const [user] = useState<User>({
    id: '1',
    username: 'PlayMarketUser',
    email: 'user@playmarket.com',
    balance: 1250.50,
    joinDate: '2024-01-15',
    totalSpent: 450.75,
    itemsWon: 8,
    bountiesCompleted: 12
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: user.username,
    email: user.email
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const navigationItems = [
    { id: 'overview', name: 'Overview', icon: FaHome },
    { id: 'auctions', name: 'My Auctions', icon: FaGavel },
    { id: 'bounties', name: 'My Bounties', icon: FaTrophy },
    { id: 'transactions', name: 'Transactions', icon: FaHistory },
    { id: 'settings', name: 'Settings', icon: FaCog },
  ];

  const handleEdit = () => {
    setIsEditing(!isEditing);
    if (isEditing) {
      // Save changes logic here
      console.log('Saving changes:', editForm);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };



  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-white to-blue-50 rounded-xl shadow-lg p-6 border border-blue-100">
              <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-4 lg:space-y-0 lg:space-x-6">
                <div className="relative">
                  <div className="w-24 h-24 lg:w-32 lg:h-32 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                    <FaUser className="text-white text-3xl lg:text-4xl" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
                <div className="flex-1 text-center lg:text-left">
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">{user.username}</h1>
                  <p className="text-gray-600 mb-3">Member since {new Date(user.joinDate).toLocaleDateString()}</p>
                  <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-3 sm:space-y-0 sm:space-x-6">
                    <div className="flex items-center space-x-2 bg-yellow-50 px-4 py-2 rounded-lg">
                      <FaCoins className="text-yellow" />
                      <span className="font-bold text-lg text-gray-900">${user.balance.toFixed(2)}</span>
                    </div>
                    <button
                      onClick={handleEdit}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                      {isEditing ? 'Save Changes' : 'Edit Profile'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-6 shadow-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green font-medium">Total Spent</p>
                    <p className="text-2xl font-bold text-gray-900">${user.totalSpent.toFixed(2)}</p>
                  </div>
                  <FaCoins className="text-green text-3xl" />
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 shadow-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 font-medium">Items Won</p>
                    <p className="text-2xl font-bold text-gray-900">{user.itemsWon}</p>
                  </div>
                  <FaShoppingCart className="text-blue-500 text-3xl" />
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-xl p-6 shadow-lg border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-600 font-medium">Bounties Completed</p>
                    <p className="text-2xl font-bold text-gray-900">{user.bountiesCompleted}</p>
                  </div>
                  <FaTrophy className="text-purple-500 text-3xl" />
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-xl font-bold mb-6 text-gray-900">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Username
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="username"
                      value={editForm.username}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  ) : (
                    <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-lg">{user.username}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      name="email"
                      value={editForm.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  ) : (
                    <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-lg">{user.email}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-xl font-bold mb-6 text-gray-900 flex items-center">
                <FaHistory className="mr-3 text-gray-600" />
                Recent Activity
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <FaShoppingCart className="text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Won Auction: "Rare Gaming Mouse"</p>
                      <p className="text-sm text-gray-600">2 days ago</p>
                    </div>
                  </div>
                  <span className="text-green font-bold text-lg">-$45.99</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                      <FaTrophy className="text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Completed Bounty: "Beta Testing"</p>
                      <p className="text-sm text-gray-600">1 week ago</p>
                    </div>
                  </div>
                  <span className="text-green font-bold text-lg">+$25.00</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <FaCoins className="text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Balance Top-up</p>
                      <p className="text-sm text-gray-600">2 weeks ago</p>
                    </div>
                  </div>
                  <span className="text-green font-bold text-lg">+$100.00</span>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🚧</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Coming Soon</h3>
              <p className="text-gray-600">This feature is under development.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <Sidebar>
      <div className="flex-1 overflow-auto p-4 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Profile Navigation Tabs */}
          <div className="mb-6 bg-white rounded-lg shadow-md p-4">
            {/* Desktop Tabs */}
            <div className="hidden md:flex flex-wrap gap-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                      activeTab === item.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className="mr-2" />
                    {item.name}
                  </button>
                );
              })}
            </div>

            {/* Mobile Dropdown */}
            <div className="md:hidden relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 flex items-center justify-between"
              >
                <div className="flex items-center">
                  {(() => {
                    const activeItem = navigationItems.find(item => item.id === activeTab);
                    const Icon = activeItem?.icon;
                    return (
                      <>
                        {Icon && <Icon className="mr-2 text-gray-600" />}
                        <span className="text-gray-900 font-medium">{activeItem?.name || 'Select'}</span>
                      </>
                    );
                  })()}
                </div>
                <span className={`transform transition-transform text-gray-500 ${isDropdownOpen ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>

              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 flex items-center hover:bg-gray-50 transition-colors ${
                          activeTab === item.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                        } ${item.id === navigationItems[navigationItems.length - 1].id ? '' : 'border-b border-gray-100'}`}
                      >
                        <Icon className="mr-3" />
                        <span>{item.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Profile Content */}
          {renderTabContent()}
        </div>
      </div>
    </Sidebar>
  );
};

export default ProfilePage;
