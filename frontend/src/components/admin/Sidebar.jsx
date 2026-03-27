import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  GraduationCap,
  UserCheck,
  CreditCard,
  User,
  ChevronLeft,
  ChevronRight,
  LogOut,
  X
} from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { logout } = useAuth();
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: BookOpen, label: 'Courses', path: '/admin/courses' },
    { icon: Users, label: 'Teachers', path: '/admin/teachers' },
    { icon: GraduationCap, label: 'Students', path: '/admin/students' },
    { icon: UserCheck, label: 'Enrollments', path: '/admin/enrollments' },
    { icon: CreditCard, label: 'Payments', path: '/admin/payments' },
    { icon: User, label: 'Profile', path: '/admin/profile' },
  ];

  return (
    <aside
      className={`fixed left-0 top-0 h-[100dvh] bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-40 transition-all duration-300 flex flex-col
        ${isOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0 md:w-20'}
      `}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-cosmic-red rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-lg">CA</span>
          </div>
          {isOpen && (
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white whitespace-nowrap">Cosmic</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Academy</p>
            </div>
          )}
        </div>

        {/* Close button: X on mobile, chevron on desktop */}
        <button
          onClick={() => setIsOpen(false)}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 md:hidden"
        >
          <X size={20} />
        </button>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 hidden md:flex items-center"
        >
          {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 mt-6 px-3 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/admin'}
            onClick={() => { if (window.innerWidth < 768) setIsOpen(false); }}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 mb-2 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-cosmic-red text-white shadow-lg'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {isOpen && <span className="font-medium whitespace-nowrap">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Sign Out */}
      <div className="px-3 py-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={logout}
          className={`flex items-center w-full px-3 py-3 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors ${!isOpen && 'justify-center'}`}
        >
          <LogOut className={`w-5 h-5 flex-shrink-0 ${isOpen ? 'mr-3' : ''}`} />
          {isOpen && <span className="font-medium whitespace-nowrap">Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
