import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaCoins, FaBars, FaTimes, FaUser } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { balance, balanceLoading } = useAuth();

  const pages = [
    { name: 'Auction', key: 'auction', path: '/' },
    { name: 'Bounties', key: 'bounties', path: '/bounties' },
    { name: 'Redeem', key: 'redeem', path: '/redeem' },
    { name: 'Profile', key: 'profile', path: '/profile' },
  ];

  const currentPage = location.pathname === '/' ? 'auction' : location.pathname.slice(1);

  const handlePageClick = (path: string) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  return (
    <header className="bg-white bg-opacity-96 p-5 flex items-center shadow-lg border-b border-gray-200 animate-fade-in relative">
      {/* Left Container - Hamburger Menu */}
      <div className="flex items-center z-10">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden bg-white p-2 rounded-md shadow-lg hover:bg-gray-50 transition-colors text-black"
        >
          {isMenuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* Center Container - Logo (Absolutely Centered) */}
      <div className="absolute left-1/2 transform -translate-x-1/2 z-20">
        <img
          src="/peGO.png"
          alt="PlayMarket Logo"
          className="h-10 hover:scale-105 transition-transform duration-200 cursor-pointer"
          onClick={() => handlePageClick('/')}
        />
      </div>

      {/* Right Container - Navigation, Coin & User Icon */}
      <div className="flex items-center space-x-4 ml-auto z-10">
        {/* Web Navigation */}
        <nav className="hidden md:flex space-x-6 mr-4">
          {pages.map((page) => (
            <button
              key={page.key}
              onClick={() => handlePageClick(page.path)}
              className={`text-lg transition-all duration-200 hover:scale-110 ${
                currentPage === page.key ? 'text-red font-semibold' : 'text-black hover:text-red'
              }`}
            >
              {page.name}
            </button>
          ))}
        </nav>

        {/* Profile Button */}
        <button
          onClick={() => handlePageClick('/profile')}
          className={`p-2 rounded-full transition-all duration-200 hover:scale-110 ${
            currentPage === 'profile'
              ? 'bg-blue-100 text-blue-600 shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          title="Profile"
        >
          <FaUser className="text-lg" />
        </button>

        {/* Coin Balance */}
        <div className="flex items-center bg-gradient-to-r from-yellow-100 to-yellow-200 px-4 py-2 rounded-full shadow-md hover:shadow-lg transition-shadow duration-200">
          <FaCoins className="text-amber-400 mr-2 animate-bounce text-xl" />
          <span className="text-black font-bold text-lg">
            {balanceLoading ? (
              <span className="animate-pulse">...</span>
            ) : balance !== null ? (
              balance
            ) : (
              '0'
            )}
          </span>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-gradient-to-b from-white via-gray-50 to-gray-100 border border-gray-200 shadow-2xl backdrop-blur-sm md:hidden animate-slide-in z-50 rounded-b-xl">
          <nav className="flex flex-col py-3">
            {pages.map((page, index) => (
              <button
                key={page.key}
                onClick={() => handlePageClick(page.path)}
                className={`text-left px-6 py-4 text-lg transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-700 transform hover:translate-x-2 ${
                  currentPage === page.key
                    ? 'text-red font-semibold bg-gradient-to-r from-red-50 to-pink-50 border-r-4 border-red-500 shadow-sm'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {page.name}
              </button>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
