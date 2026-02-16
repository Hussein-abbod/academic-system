import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/teacher/Sidebar';
import Navbar from '../components/teacher/Navbar';

const TeacherLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-cosmic-darker">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div className={`transition-all duration-300 pt-16 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <Navbar />
        
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default TeacherLayout;
