import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  DollarSign, 
  TrendingUp, 
  AlertCircle,
  ArrowUpRight,
  Activity
} from 'lucide-react';
import api from '../../utils/api';
import RevenueChart from '../../components/dashboard/RevenueChart';
import ProgressChart from '../../components/dashboard/ProgressChart';

const Dashboard = () => {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await api.get('/admin/statistics/dashboard');
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 dark:border-gray-700"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent absolute top-0 left-0"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Failed to load dashboard statistics</p>
        </motion.div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Students',
      value: stats?.total_students || 0,
      icon: GraduationCap,
      gradient: 'from-blue-500 to-cyan-500',
      bgLight: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Total Teachers',
      value: stats?.total_teachers || 0,
      icon: Users,
      gradient: 'from-emerald-500 to-teal-500',
      bgLight: 'bg-emerald-50 dark:bg-emerald-900/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      title: 'Active Courses',
      value: stats?.active_courses || 0,
      icon: BookOpen,
      gradient: 'from-purple-500 to-pink-500',
      bgLight: 'bg-purple-50 dark:bg-purple-900/20',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      title: 'Total Revenue',
      value: `$${stats?.total_revenue?.toFixed(2) || '0.00'}`,
      icon: DollarSign,
      gradient: 'from-orange-500 to-red-500',
      bgLight: 'bg-orange-50 dark:bg-orange-900/20',
      iconColor: 'text-orange-600 dark:text-orange-400',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-2">
          Dashboard Overview
        </h1>
        <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Welcome back! Here's what's happening with your academy today.
        </p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            whileHover={{ y: -8, transition: { duration: 0.2 } }}
            className="group relative bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-slate-700 overflow-hidden"
          >
            {/* Gradient background on hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
            
            {/* Decorative circle */}
            <div className={`absolute -right-8 -top-8 w-32 h-32 bg-gradient-to-br ${card.gradient} opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500`}></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${card.bgLight} group-hover:scale-110 transition-transform duration-300`}>
                  <card.icon className={`w-6 h-6 ${card.iconColor}`} />
                </div>
                <div className="flex items-center gap-1 text-green-500 text-sm font-medium">
                  <TrendingUp className="w-4 h-4" />
                  <ArrowUpRight className="w-3 h-3" />
                </div>
              </div>
              
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                {card.title}
              </h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {card.value}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <RevenueChart />
        <ProgressChart />
      </motion.div>

      {/* Recent Enrollments */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-slate-700"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Recent Enrollments
          </h2>
          <Activity className="w-5 h-5 text-gray-400" />
        </div>
        
        {stats?.recent_enrollments && stats.recent_enrollments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-700">
                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Student
                  </th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Course
                  </th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Date
                  </th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_enrollments.map((enrollment, index) => (
                  <motion.tr
                    key={enrollment.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.6 + index * 0.05 }}
                    className="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors duration-200"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                          {enrollment.student_name?.charAt(0) || 'S'}
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {enrollment.student_name}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {enrollment.course_name}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(enrollment.enrollment_date).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        enrollment.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : enrollment.status === 'COMPLETED'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                      }`}>
                        {enrollment.status}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
              <GraduationCap className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400">No recent enrollments</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Dashboard;
