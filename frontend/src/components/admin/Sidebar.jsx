import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  GraduationCap,
  UserCheck,
  CreditCard,
  Layers,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: BookOpen, label: 'Courses', path: '/admin/courses' },
    { icon: Users, label: 'Teachers', path: '/admin/teachers' },
    { icon: GraduationCap, label: 'Students', path: '/admin/students' },
    { icon: UserCheck, label: 'Enrollments', path: '/admin/enrollments' },
    { icon: CreditCard, label: 'Payments', path: '/admin/payments' },
    { icon: Layers, label: 'Levels', path: '/admin/levels' },
  ];

  return (
    <motion.aside
      initial={{ x: 0 }}
      animate={{ width: isOpen ? 256 : 80 }}
      transition={{ duration: 0.3 }}
      className="fixed left-0 top-0 h-screen bg-white dark:bg-cosmic-gray border-r border-gray-200 dark:border-gray-700 z-50"
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
        {isOpen ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cosmic-red rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">CA</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">Cosmic</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Academy</p>
            </div>
          </div>
        ) : (
          <div className="w-10 h-10 bg-cosmic-red rounded-lg flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-lg">CA</span>
          </div>
        )}
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -right-3 top-20 bg-white dark:bg-cosmic-gray border border-gray-200 dark:border-gray-700 rounded-full p-1 shadow-lg hover:bg-gray-50 dark:hover:bg-cosmic-dark transition-colors"
      >
        {isOpen ? (
          <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        )}
      </button>

      {/* Navigation */}
      <nav className="mt-6 px-3">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/admin'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 mb-2 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-cosmic-red text-white shadow-lg'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-cosmic-dark'
              }`
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {isOpen && <span className="font-medium">{item.label}</span>}
          </NavLink>
        ))}
      </nav>
    </motion.aside>
  );
};

export default Sidebar;
