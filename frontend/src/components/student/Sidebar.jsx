import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  LayoutDashboard, 
  BookOpen, 
  CreditCard, 
  LogOut, 
  ChevronLeft,
  GraduationCap
} from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { logout } = useAuth();
  
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/student' },
    { icon: BookOpen, label: 'My Learning', path: '/student/courses' },
    { icon: CreditCard, label: 'My Payments', path: '/student/payments' },
  ];

  return (
    <aside 
      className={`fixed top-0 left-0 z-40 h-screen transition-width duration-300 bg-white border-r border-gray-200 dark:bg-gray-800 dark:border-gray-700 ${
        isOpen ? 'w-64' : 'w-20'
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Logo Section */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
          <div className={`flex items-center gap-2 overflow-hidden ${!isOpen && 'justify-center'}`}>
            <div className="bg-gradient-to-tr from-green-500 to-emerald-600 text-white p-2 rounded-lg shrink-0">
              <GraduationCap size={24} />
            </div>
            {isOpen && (
              <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent whitespace-nowrap">
                Cosmic Student
              </span>
            )}
          </div>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className={`p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 lg:block hidden`}
          >
            <ChevronLeft size={20} className={`transition-transform duration-300 ${!isOpen && 'rotate-180'}`} />
          </button>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 px-3 py-4 overflow-y-auto">
          <ul className="space-y-2 font-medium">
            {menuItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/student'}
                  className={({ isActive }) => `
                    flex items-center p-3 rounded-lg group transition-colors relative overflow-hidden
                    ${isActive 
                      ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-600 dark:from-green-900/20 dark:to-emerald-900/20 dark:text-green-400' 
                      : 'text-gray-900 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  <item.icon size={22} className={`shrink-0 transition-colors ${isOpen ? 'mr-3' : 'mx-auto'}`} />
                  {isOpen && <span>{item.label}</span>}
                  
                  {/* Active Indicator Strip */}
                  <NavLink to={item.path} end={item.path === '/student'}>
                    {({ isActive }) => isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500 rounded-r-full" />
                    )}
                  </NavLink>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom Section */}
        <div className="px-3 py-4 border-t border-gray-200 dark:border-gray-700">
          <button 
            onClick={logout}
            className={`
              flex items-center w-full p-3 text-gray-900 rounded-lg dark:text-white hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors group
              ${!isOpen && 'justify-center'}
            `}
          >
            <LogOut size={22} className={`shrink-0 ${isOpen ? 'mr-3' : ''}`} />
            {isOpen && <span>Sign Out</span>}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
