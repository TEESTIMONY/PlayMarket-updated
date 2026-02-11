import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBars, FaTimes, FaPlus, FaSave } from 'react-icons/fa';
import UserManagement from '../components/admin/UserManagement';
import BountiesManagement from '../components/admin/BountiesManagement';
import AuctionManagement from '../components/admin/AuctionManagement';
import RedeemCodesManagement from '../components/admin/RedeemCodesManagement';

const AdminPage: React.FC = () => {
  const navigate = useNavigate();

  // Check for admin authentication on component mount
  useEffect(() => {
    const adminUsername = localStorage.getItem('admin_username');
    const adminPassword = localStorage.getItem('admin_password');

    if (!adminUsername || !adminPassword) {
      navigate('/admin-login');
    }
  }, [navigate]);
  const [activeTab, setActiveTab] = useState('users');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showActionButton, setShowActionButton] = useState(true);
  const bountiesRef = useRef<any>(null);
  const redeemRef = useRef<any>(null);
  const auctionRef = useRef<any>(null);

  const tabs = [
    { id: 'playmarket', label: 'Playmarket', title: 'Playmarket', actionLabel: '', actionIcon: '', component: null, isLink: true, path: '/' },
    { id: 'users', label: 'User Management', title: 'User Management', actionLabel: 'Add New User', actionIcon: 'FaPlus', component: UserManagement },
    { id: 'bounties', label: 'Bounties', title: 'Bounties Management', actionLabel: 'Add New Bounty', actionIcon: 'FaPlus', component: BountiesManagement },
    { id: 'auction', label: 'Auction', title: 'Auction Management', actionLabel: '', actionIcon: '', component: AuctionManagement },
    { id: 'redeem', label: 'Redeem Codes', title: 'Redeem Codes Management', actionLabel: 'Add New Code', actionIcon: 'FaPlus', component: RedeemCodesManagement },
  ];

  const activeTabData = tabs.find(tab => tab.id === activeTab) || tabs[0];
  const ActiveComponent = activeTabData.component || UserManagement;

  const handleTabClick = (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab?.isLink && tab.path) {
      navigate(tab.path);
      return;
    }
    setActiveTab(tabId);
    setIsSidebarOpen(false); // Close sidebar on mobile after selection
  };

  const handleActionClick = () => {
    if (activeTab === 'bounties' && bountiesRef.current) {
      bountiesRef.current.openModal();
    } else if (activeTab === 'auction' && auctionRef.current) {
      auctionRef.current.openModal();
    } else if (activeTab === 'redeem' && redeemRef.current) {
      redeemRef.current.openModal();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">

      {/* Sidebar */}
      <div className={`w-64 bg-white shadow-lg fixed lg:static inset-y-0 left-0 z-40 transform ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 transition-transform duration-300 ease-in-out`}>
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">Play Market Admin Panel</p>
        </div>
        <nav className="mt-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`w-full text-left px-6 py-3 hover:bg-gray-50 transition-colors ${
                activeTab === tab.id ? 'bg-blue-50 border-r-4 border-blue-500 text-blue-700' : 'text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 pt-4 pb-4 pl-4 pr-4 md:p-8 lg:ml-0">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8 md:mb-10">
          <div className="flex items-center space-x-3 lg:space-x-4">
            {/* Mobile Sidebar Toggle */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden bg-white p-2 rounded-md shadow-lg hover:bg-gray-50 transition-colors text-black"
            >
              {isSidebarOpen ? <FaTimes /> : <FaBars />}
            </button>
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-800">{activeTabData.title}</h2>
          </div>
          {activeTabData.actionLabel && showActionButton && (
            <button
              onClick={handleActionClick}
              className={`px-3 py-2 md:px-4 md:py-2 text-sm md:text-base rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'auction' ? 'bg-green text-white hover:bg-green-700' : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {activeTab === 'auction' ? <FaSave className="inline mr-1 md:mr-2" /> : <FaPlus className="inline mr-1 md:mr-2" />}
              <span className="hidden md:inline">{activeTabData.actionLabel}</span>
              <span className="md:hidden">{activeTab === 'auction' ? 'Save' : 'Add'}</span>
            </button>
          )}
        </div>

        {activeTab === 'bounties' ? (
          <BountiesManagement ref={bountiesRef} onActionButtonVisibilityChange={setShowActionButton} />
        ) : activeTab === 'auction' ? (
          <AuctionManagement ref={auctionRef} />
        ) : activeTab === 'redeem' ? (
          <RedeemCodesManagement ref={redeemRef} />
        ) : (
          <ActiveComponent />
        )}
      </div>
    </div>
  );
};

export default AdminPage;
