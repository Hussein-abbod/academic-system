import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  User,
  ClipboardList,
  Calendar,
  X
} from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { logout } = useAuth();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/teacher' },
    { icon: BookOpen, label: 'My Courses', path: '/teacher/courses' },
    { icon: Calendar, label: 'My Schedule', path: '/teacher/schedule' },
    { icon: Users, label: 'My Students', path: '/teacher/students' },
    { icon: ClipboardList, label: 'Quizzes', path: '/teacher/quizzes' },
    { icon: User, label: 'Profile', path: '/teacher/profile' },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-[100dvh] bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300
        ${isOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0 md:w-20'}
      `}
    >
      <div className="flex flex-col h-full overflow-hidden">
        {/* Logo Section */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 min-w-0">
            <div className="bg-gradient-to-tr from-purple-500 to-indigo-600 text-white p-2 rounded-lg shrink-0">
              <GraduationCap size={24} />
            </div>
            {isOpen && (
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent whitespace-nowrap">
                Cosmic Teacher
              </span>
            )}
          </div>

          {/* X on mobile, Chevron on desktop */}
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

        {/* Navigation Menu */}
        <div className="flex-1 px-3 py-4 overflow-y-auto">
          <ul className="space-y-2 font-medium">
            {menuItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/teacher'}
                  onClick={() => { if (window.innerWidth < 768) setIsOpen(false); }}
                  className={({ isActive }) => `
                    flex items-center p-3 rounded-lg group transition-colors relative overflow-hidden
                    ${isActive
                      ? 'bg-gradient-to-r from-cosmic-50 to-purple-50 text-cosmic-600 dark:from-cosmic-900/20 dark:to-purple-900/20 dark:text-cosmic-400'
                      : 'text-gray-900 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  <item.icon size={22} className={`shrink-0 transition-colors ${isOpen ? 'mr-3' : 'mx-auto'}`} />
                  {isOpen && <span className="whitespace-nowrap">{item.label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom Section */}
        <div className="px-3 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={logout}
            className={`flex items-center w-full p-3 text-gray-900 rounded-lg dark:text-white hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors group ${!isOpen && 'justify-center'}`}
          >
            <LogOut size={22} className={`shrink-0 ${isOpen ? 'mr-3' : ''}`} />
            {isOpen && <span className="whitespace-nowrap">Sign Out</span>}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
