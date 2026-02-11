import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaCoins, FaBars, FaTimes, FaHome, FaGavel, FaGift, FaUser, FaSignOutAlt, FaSignInAlt } from 'react-icons/fa';
import { FaWhatsapp, FaTwitter, FaInstagram } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  children: React.ReactNode;
  hideMobileIcons?: boolean;
}

const Sidebar: React.FC<SidebarProps> = React.memo(({ children, hideMobileIcons = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, balance, balanceLoading, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = useMemo(() => [
    { id: 'auction', name: 'Auctions', icon: FaGavel, path: '/' },
    { id: 'bounties', name: 'Bounties', icon: FaGift, path: '/bounties' },
    { id: 'redeem', name: 'Redeem', icon: FaHome, path: '/redeem' },
    { id: 'profile', name: 'Profile', icon: FaUser, path: '/profile' },
  ], []);

  const currentPage = useMemo(() =>
    location.pathname === '/' ? 'auction' : location.pathname.slice(1),
    [location.pathname]
  );

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        {/* Desktop Sidebar */}
        <div className={`w-72 bg-white shadow-xl fixed lg:static inset-y-0 left-0 z-40 transform ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 transition-transform duration-200 ease-out flex flex-col`}
        style={{ willChange: 'transform' }}>
          {/* Logo Section */}
          <div className="p-8 pb-6">
            <div className="flex justify-center">
              <img
                src="/peGO.png"
                alt="PlayMarket Logo"
                loading="lazy"
                width="150"
                height="150"
                style={{ maxWidth: '150px', height: 'auto' }}
                className="h-12 w-auto"
              />
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 px-6">
            <div className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item.path)}
                    className={`w-full text-center px-4 py-4 rounded-lg transition-all duration-200 font-medium text-lg ${
                      isActive
                        ? 'bg-red text-white'
                        : 'text-red bg-white hover:bg-red-50 hover:text-red-600'
                    }`}
                  >
                    <Icon className="inline mr-4 text-xl" />
                    {item.name}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Auth Button */}
          <div className="px-6 pb-6">
            {isAuthenticated ? (
              <button
                onClick={handleSignOut}
                className="w-full bg-red hover:bg-red-600 text-white font-semibold py-4 px-4 rounded-full transition-colors duration-200 text-lg shadow-md"
              >
                <FaSignOutAlt className="inline mr-3" />
                Sign Out
              </button>
            ) : (
              <button
                onClick={() => handleNavigation('/login')}
                className="w-full bg-green hover:bg-blue-700 text-white font-semibold py-4 px-4 rounded-full transition-colors duration-200 text-lg shadow-md"
              >
                <FaSignInAlt className="inline mr-3" />
                Login
              </button>
            )}
          </div>

          {/* Social Icons */}
          <div className="px-6 pb-8">
            <div className="flex justify-center space-x-6">
              <button className="p-3 text-red-500 hover:text-red-600 bg-black transition-colors duration-200 rounded-full hover:bg-red-50">
                <FaWhatsapp className="text-2xl" />
              </button>
              <button className="p-3 text-red-500 hover:text-red-600 bg-black transition-colors duration-200 rounded-full hover:bg-red-50">
                <FaTwitter className="text-2xl" />
              </button>
              <button className="p-3 text-red-500 hover:text-red-600 bg-black transition-colors duration-200 rounded-full hover:bg-red-50">
                <FaInstagram className="text-2xl" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center p-4 bg-white shadow-sm border-b border-gray-200 relative">
            {/* Left: Hamburger Menu */}
            <div className="flex items-center z-10">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-black"
              >
                {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
              </button>
            </div>

            {/* Center: Logo (Absolutely Centered) */}
            <div className="absolute left-1/2 transform -translate-x-1/2 z-20">
              <img
                src="/peGO.png"
                alt="PlayMarket Logo"
                className="h-8 w-auto hover:scale-105 transition-transform duration-200 cursor-pointer"
                onClick={() => handleNavigation('/')}
                loading="lazy"
              />
            </div>

            {/* Right: Coin Balance + Profile Icon */}
            {!hideMobileIcons && (
              <div className="flex items-center space-x-3 ml-auto z-10">
                {/* Coin Balance */}
                <div className="flex items-center bg-gradient-to-r from-yellow-100 to-yellow-200 px-3 py-1 rounded-full shadow-md hover:shadow-lg transition-shadow duration-200">
                  <FaCoins className="text-amber-400 mr-1 text-sm" />
                  <span className="text-black font-bold text-sm">
                    {balanceLoading ? (
                      <span className="animate-pulse">...</span>
                    ) : balance !== null ? (
                      balance
                    ) : (
                      '0'
                    )}
                  </span>
                </div>

                {/* Profile Button */}
                <button
                  onClick={() => handleNavigation('/profile')}
                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  title="Profile"
                >
                  <FaUser className="text-gray-600" />
                </button>
              </div>
            )}
          </div>

          {/* Page Content */}
          {children}
        </div>
      </div>
    </div>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;
