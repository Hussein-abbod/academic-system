import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Sun, Moon, Menu } from 'lucide-react';
import NotificationDropdown from '../shared/NotificationDropdown';

const Navbar = ({ onToggle }) => {
  const { user } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <nav className="fixed top-0 right-0 z-30 w-full pl-0 md:pl-20 h-16 bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700 transition-all duration-300">
      <div className="h-full px-4 flex items-center justify-between">
        {/* Left Side */}
        <div className="flex items-center gap-3">
          {/* Hamburger — mobile only */}
          <button
            onClick={onToggle}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors md:hidden"
            title="Toggle menu"
          >
            <Menu size={22} />
          </button>
          <h1 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-white">
            Teacher Portal
          </h1>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <NotificationDropdown />

          <div className="flex items-center gap-2 ml-1 pl-2 border-l border-gray-200 dark:border-gray-700">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.full_name || 'Teacher'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
            </div>
            <Link
              to="/teacher/profile"
              title="My Profile"
              className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm hover:opacity-80 transition-opacity"
            >
              {user?.full_name?.charAt(0)?.toUpperCase() || 'T'}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
