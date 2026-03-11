import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/teacher/Sidebar';
import Navbar from '../components/teacher/Navbar';

const TeacherLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-cosmic-darker">
      {/* Mobile backdrop overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className={`transition-all duration-300 pt-16 ${sidebarOpen ? 'md:ml-64' : 'md:ml-20'}`}>
        <Navbar onToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default TeacherLayout;
