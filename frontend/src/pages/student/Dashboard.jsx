import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../../utils/api';
import Card from '../../components/ui/Card';
import { 
  BookOpen, 
  CheckCircle, 
  Target,
  Sparkles,
  Clock,
  Award,
  ArrowRight
} from 'lucide-react';

const Dashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['student-dashboard'],
    queryFn: async () => {
      const response = await api.get('/student/dashboard');
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 animate-in fade-in duration-500">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-indigo-100 dark:border-indigo-900/20 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin"></div>
          <div className="absolute">
            <BookOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>
        <p className="text-sm font-bold text-gray-500 dark:text-gray-400 tracking-wider uppercase animate-pulse">
          Loading Dashboard...
        </p>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Active Courses',
      value: stats?.active_courses || 0,
      icon: BookOpen,
      gradient: 'from-indigo-500 to-purple-600',
      bgLight: 'bg-indigo-50 dark:bg-indigo-900/20',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      description: 'Currently enrolled',
    },
    {
      title: 'Completed',
      value: stats?.completed_courses || 0,
      icon: CheckCircle,
      gradient: 'from-teal-500 to-emerald-600',
      bgLight: 'bg-teal-50 dark:bg-teal-900/20',
      iconColor: 'text-teal-600 dark:text-teal-400',
      description: 'Finished courses',
    },
    {
      title: 'Balance Due',
      value: `$${stats?.financials?.balance?.toFixed(2) || '0.00'}`,
      icon: Award,
      gradient: 'from-orange-500 to-pink-600',
      bgLight: 'bg-orange-50 dark:bg-orange-900/20',
      iconColor: 'text-orange-600 dark:text-orange-400',
      description: 'Courses & AI fees',
      highlight: true
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
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-pink-600 dark:from-indigo-400 dark:to-pink-400 bg-clip-text text-transparent mb-2">
          Student Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Welcome back! Continue your learning journey
        </p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            whileHover={{ y: -8, transition: { duration: 0.2 } }}
            className="group relative bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-slate-700 overflow-hidden"
          >
            {/* Animated gradient background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
            
            {/* Decorative elements */}
            <div className={`absolute -right-8 -top-8 w-40 h-40 bg-gradient-to-br ${stat.gradient} opacity-10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-500`}></div>
            
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {stat.title}
                </p>
                <h3 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  {stat.value}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  {stat.description}
                </p>
              </div>
              
              <div className={`p-4 rounded-2xl ${stat.bgLight} group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className={`w-8 h-8 ${stat.iconColor}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions - Moved to first column since Progress is gone */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="lg:col-span-2" 
        >
          <Card title="Quick Actions" hover={false}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.a
                href="/student/courses"
                whileHover={{ x: 4 }}
                className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 hover:from-indigo-100 hover:to-purple-100 dark:hover:from-indigo-900/30 dark:hover:to-purple-900/30 transition-all duration-200 group"
              >
                <div className="p-2 rounded-lg bg-white dark:bg-slate-700 shadow-sm">
                  <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">My Learning</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Continue where you left off</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
              </motion.a>

              <motion.a
                href="/student/payments"
                whileHover={{ x: 4 }}
                className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 hover:from-pink-100 hover:to-rose-100 dark:hover:from-pink-900/30 dark:hover:to-rose-900/30 transition-all duration-200 group"
              >
                <div className="p-2 rounded-lg bg-white dark:bg-slate-700 shadow-sm">
                  <Award className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">My Payments</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">View payment history</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors" />
              </motion.a>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
