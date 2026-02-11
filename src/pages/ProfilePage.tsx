import { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import { FaUser, FaCoins, FaShoppingCart, FaTrophy, FaHistory, FaCog, FaHome, FaGavel } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

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
  const { balance } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // User data from API
  const [user, setUser] = useState<any | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    email: ''
  });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [claimsHistory, setClaimsHistory] = useState<any[]>([]);
  const [redeemCodesHistory, setRedeemCodesHistory] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>(null);

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // First check if user is authenticated
        const jwtToken = localStorage.getItem('jwt_token');
        if (!jwtToken) {
          setError('Authentication required. Please log in first.');
          return;
        }
        
        const userData = await apiService.getProfile();
        setUser(userData);
        setEditForm({
          username: userData.username,
          email: userData.email
        });
        
        // Fetch additional profile data from individual endpoints
        const [claimsData, transactionsData, redeemData, balanceData] = await Promise.all([
          apiService.getUserClaims(),
          apiService.getUserTransactions(),
          apiService.getRedeemCodes(),
          apiService.getUserBalance()
        ]);
        
        setClaimsHistory(claimsData.results || []);
        setTransactions(transactionsData.transactions || []);
        setRedeemCodesHistory(redeemData.results?.filter(code => code.status === 'used') || []);
        
        // Set the balance from the separate balance endpoint
        if (balanceData && balanceData.balance !== undefined) {
          setUser(prev => ({ ...prev, balance: balanceData.balance }));
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('Failed to load user profile. Please log in first.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

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
  ];

  const handleEdit = () => {
    setIsEditing(!isEditing);
    if (isEditing) {
      // Save changes logic here
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
        if (loading) {
          return (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          );
        }

        if (error) {
          return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <p className="text-red-600 text-center">{error}</p>
            </div>
          );
        }

        if (!user) {
          return (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <p className="text-gray-600 text-center">No user data available. Please check the console for debug information.</p>
              <div className="mt-4 text-sm text-gray-700">
                <p>Debug info:</p>
                <ul className="list-disc list-inside">
                  <li>Loading: {loading.toString()}</li>
                  <li>Error: {error || 'None'}</li>
                  <li>JWT Token exists: {localStorage.getItem('jwt_token') ? 'Yes' : 'No'}</li>
                  <li>User state: {JSON.stringify(user)}</li>
                </ul>
              </div>
              <div className="mt-4 text-sm text-gray-700">
                <p>Console logs to check:</p>
                <ul className="list-disc list-inside">
                  <li>"Attempting to fetch profile data..."</li>
                  <li>"No JWT token found in localStorage" (if not logged in)</li>
                  <li>"JWT token found, making API request..." (if logged in)</li>
                  <li>"Profile data received: [data]" (if successful)</li>
                </ul>
              </div>
              <div className="mt-4 text-sm text-gray-700">
                <p>Next steps:</p>
                <ul className="list-disc list-inside">
                  <li>1. Check if you're logged in (look for JWT token in localStorage)</li>
                  <li>2. Check console for API error messages</li>
                  <li>3. Verify the backend API is running and accessible</li>
                  <li>4. Check if the API endpoint returns expected data structure</li>
                </ul>
              </div>
            </div>
          );
        }

        // Calculate bounties completed from claims if not available in user data
        const bountiesCompletedCount = user.bountiesCompleted || 
          (claimsHistory ? claimsHistory.filter(claim => claim.status === 'approved').length : 0);

        return (
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-white to-blue-50 rounded-xl shadow-lg p-6 border border-blue-100">
              <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-4 lg:space-y-0 lg:space-x-6">
                <div className="relative">
                  <div className="w-24 h-24 lg:w-32 lg:h-32 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
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
                  <span className="font-bold text-lg text-gray-900">${user.balance ? user.balance.toFixed(2) : '0.00'}</span>
                    </div>
                    <button
                      onClick={handleEdit}
                      className="bg-black hover:bg-gray-800 text-white px-6 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
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
                    <p className="text-black font-medium">Total Spent</p>
                    <p className="text-2xl font-bold text-gray-900">${user.totalSpent ? user.totalSpent.toFixed(2) : '0.00'}</p>
                  </div>
                  <FaCoins className="text-black text-3xl" />
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 shadow-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-black font-medium">Auctions Won</p>
                    <p className="text-2xl font-bold text-gray-900">{user.itemsWon || 0}</p>
                  </div>
                  <FaGavel className="text-black text-3xl" />
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-xl p-6 shadow-lg border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-black font-medium">Bounties Completed</p>
                    <p className="text-2xl font-bold text-gray-900">{bountiesCompletedCount}</p>
                    <p className="text-sm text-gray-600 mt-1">Total: {bountiesCompletedCount} bounties</p>
                  </div>
                  <FaTrophy className="text-black text-3xl" />
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

          </div>
        );
      case 'transactions':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-xl font-bold mb-6 text-gray-900 flex items-center">
                <FaHistory className="mr-3 text-gray-600" />
                Recent Transactions
              </h2>
              {transactions.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No transactions found</p>
              ) : (
                <div className="space-y-4">
                  {transactions.map((transaction, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-semibold text-gray-900">{transaction.description || 'Transaction'}</p>
                        <p className="text-sm text-gray-600">{new Date(transaction.date).toLocaleDateString()}</p>
                      </div>
                      <span className={`font-bold text-lg ${transaction.amount >= 0 ? 'text-green' : 'text-red'}`}>
                        {transaction.amount >= 0 ? '+' : ''}${transaction.amount?.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      case 'bounties':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-xl font-bold mb-6 text-gray-900 flex items-center">
                <FaTrophy className="mr-3 text-gray-600" />
                Bounty Claims History
              </h2>
              {claimsHistory.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No bounty claims found</p>
              ) : (
                <div className="space-y-4">
                  {claimsHistory
                    .filter(claim => claim.status === 'approved')
                    .map((claim, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-semibold text-gray-900">{claim.bounty_title}</p>
                          <p className="text-sm text-gray-600">Status: {claim.status}</p>
                          <p className="text-sm text-gray-600">{new Date(claim.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
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
    <Sidebar hideMobileIcons>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Page Content */}
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
                          ? 'bg-black text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Icon className="mr-2" />
                      {item.name}
                    </button>
                  );
                })}
              </div>

              {/* Mobile Scrollable Tabs */}
              <div className="md:hidden">
                <div className="flex overflow-x-auto space-x-2 pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`flex items-center px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                          activeTab === item.id
                            ? 'bg-black text-white flex-shrink-0'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 flex-shrink-0'
                        }`}
                      >
                        <Icon className="mr-2" />
                        {item.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Profile Content */}
            {renderTabContent()}
          </div>
        </div>
      </div>
    </Sidebar>
  );
};

export default ProfilePage;
