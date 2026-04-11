import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, Menu } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import ThemeToggle from '../ui/ThemeToggle';
import { toast } from 'sonner';

const Navbar = ({ onToggle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <nav className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors md:hidden"
          title="Toggle menu"
        >
          <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <h2 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-white">
          Admin Dashboard
        </h2>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <ThemeToggle />

        <div className="flex items-center gap-2 md:gap-3 pl-2 md:pl-4 border-l border-gray-200 dark:border-gray-700">
          <div className="hidden md:block text-right">
            <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.full_name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{user?.role}</p>
          </div>

          <Link
            to="/admin/profile"
            title="My Profile"
            className="w-9 h-9 md:w-10 md:h-10 bg-speakup-red rounded-full flex items-center justify-center text-white font-bold text-sm hover:opacity-80 transition-opacity"
          >
            {user?.full_name?.charAt(0)?.toUpperCase() || 'A'}
          </Link>

          <button
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
