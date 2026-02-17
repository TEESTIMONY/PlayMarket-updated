import { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import { FaUser, FaCoins, FaShoppingCart, FaTrophy, FaHistory, FaCog, FaHome, FaGavel, FaExchangeAlt } from 'react-icons/fa';
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
  const [pointTransfers, setPointTransfers] = useState<any[]>([]);
  const [transferAmount, setTransferAmount] = useState<string>('');
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferSuccess, setTransferSuccess] = useState<string | null>(null);
  const [flashSuccessMessage, setFlashSuccessMessage] = useState<string | null>(null);
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
        const [claimsData, transactionsData, redeemData, balanceData, pointTransfersData] = await Promise.all([
          apiService.getUserClaims(),
          apiService.getUserTransactions(),
          apiService.getRedeemCodes(),
          apiService.getUserBalance(),
          apiService.getPointTransfers(),
        ]);
        
        setClaimsHistory(claimsData.results || []);
        setTransactions(transactionsData.transactions || []);
        setPointTransfers(pointTransfersData.transfers || []);
        setRedeemCodesHistory(redeemData.results?.filter(code => code.status === 'used') || []);
        
        // Set the balance from the separate balance endpoint
        if (balanceData && balanceData.balance !== undefined) {
          setUser((prev: any) => (prev ? { ...prev, balance: balanceData.balance } : prev));
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

  useEffect(() => {
    if (!flashSuccessMessage) return;

    const timeoutId = setTimeout(() => {
      setFlashSuccessMessage(null);
    }, 3200);

    return () => clearTimeout(timeoutId);
  }, [flashSuccessMessage]);

  const navigationItems = [
    { id: 'overview', name: 'Overview', icon: FaHome },
    { id: 'auctions', name: 'My Auctions', icon: FaGavel },
    { id: 'bounties', name: 'My Bounties', icon: FaTrophy },
    { id: 'transactions', name: 'Transactions', icon: FaHistory },
    { id: 'point-transfers', name: 'Point Transfers', icon: FaExchangeAlt },
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

  const refreshPointTransfers = async () => {
    try {
      const data = await apiService.getPointTransfers();
      setPointTransfers(data.transfers || []);
    } catch (err) {
      console.error('Failed to refresh point transfers', err);
    }
  };

  const handlePointTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError(null);
    setTransferSuccess(null);
    setFlashSuccessMessage(null);

    const parsedAmount = Number(transferAmount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setTransferError('Enter a valid amount greater than 0.');
      return;
    }

    try {
      setTransferLoading(true);
      const result = await apiService.createPointTransfer(parsedAmount);
      setTransferSuccess(`Transfer successful. Transfer ID: ${result.transfer_id}`);
      setFlashSuccessMessage(`✅ Coins received successfully! +${result?.transferred ?? parsedAmount} added to your balance.`);
      setTransferAmount('');

      if (result?.new_balance !== undefined) {
        setUser((prev: any) => (prev ? { ...prev, balance: result.new_balance } : prev));
      }

      await refreshPointTransfers();
    } catch (err: any) {
      const rawMessage = String(err?.message || '');
      const message =
        rawMessage.includes('TRANSFER_SERVICE_NOT_CONFIGURED')
          ? 'Point transfer service is not configured yet. Please contact admin to set PLAYENGINE_API_KEY on the backend.'
          : rawMessage.includes('INSUFFICIENT_BALANCE')
            ? 'Insufficient balance on PlayEngine.'
            : rawMessage.includes('USER_NOT_FOUND')
              ? 'User not found on PlayEngine.'
              : rawMessage.includes('INVALID_AMOUNT')
                ? 'Invalid amount. Please enter a value greater than 0.'
                : 'Transfer failed. Please try again.';
      setTransferError(message);
      setFlashSuccessMessage(null);
    } finally {
      setTransferLoading(false);
    }
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
      case 'point-transfers':
        return (
          <div className="space-y-6">
            {flashSuccessMessage && (
              <div className="fixed top-6 right-6 z-50 bg-green-100 border border-green-300 text-green-800 px-5 py-3 rounded-lg shadow-xl animate-pulse">
                {flashSuccessMessage}
              </div>
            )}

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-xl font-bold mb-6 text-gray-900 flex items-center">
                <FaExchangeAlt className="mr-3 text-gray-600" />
                Point Transfers
              </h2>

              <form onSubmit={handlePointTransferSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    readOnly
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Email is locked and always enforced by backend from your authenticated account.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Amount</label>
                  <input
                    type="number"
                    min="1"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter amount to transfer"
                    required
                  />
                </div>

                {transferError && (
                  <div className="bg-red-50 border border-red-200 text-red px-4 py-3 rounded-lg">
                    {transferError}
                  </div>
                )}

                {transferSuccess && (
                  <div className="bg-green-50 border border-green-200 text-green px-4 py-3 rounded-lg">
                    {transferSuccess}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={transferLoading}
                  className="bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  {transferLoading ? 'Processing...' : 'Transfer Points'}
                </button>
              </form>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-bold mb-4 text-gray-900">Transfer History</h3>
              {pointTransfers.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No point transfers yet</p>
              ) : (
                <div className="space-y-3">
                  {pointTransfers.map((tx, idx) => (
                    <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <p className="font-semibold text-gray-900">Amount: {tx.amount}</p>
                          <p className="text-sm font-medium text-gray-800">
                            Status:{' '}
                            <span className={tx.status === 'success' ? 'text-green-700' : 'text-red-700'}>
                              {tx.status === 'success' ? 'Successful' : 'Failed'}
                            </span>
                          </p>
                          <p className="text-sm text-gray-600">Transfer ID: {tx.transfer_id}</p>
                          <p className="text-sm text-gray-600">{new Date(tx.created_at).toLocaleString()}</p>
                          {tx.error && <p className="text-sm text-red-600">Error: {tx.error}</p>}
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            tx.status === 'success'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {tx.status === 'success' ? 'SUCCESSFUL' : 'FAILED'}
                        </span>
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
