import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../../utils/api';
import Card from '../../components/ui/Card';
import { 
  BookOpen, 
  Users, 
  Clock, 
  Award,
  TrendingUp,
  Calendar
} from 'lucide-react';

const Dashboard = () => {
  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ['teacher-courses'],
    queryFn: async () => {
      const response = await api.get('/teacher/courses');
      return response.data;
    },
  });

  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['teacher-students'],
    queryFn: async () => {
      const response = await api.get('/teacher/students');
      return response.data;
    },
  });

  if (coursesLoading || studentsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 dark:border-gray-700"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-purple-500 border-r-transparent border-b-transparent border-l-transparent absolute top-0 left-0"></div>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: 'My Courses',
      value: courses?.length || 0,
      icon: BookOpen,
      gradient: 'from-purple-500 to-indigo-600',
      bgLight: 'bg-purple-50 dark:bg-purple-900/20',
      iconColor: 'text-purple-600 dark:text-purple-400',
      description: 'Active courses',
    },
    {
      title: 'Total Students',
      value: students?.length || 0,
      icon: Users,
      gradient: 'from-cyan-500 to-blue-600',
      bgLight: 'bg-cyan-50 dark:bg-cyan-900/20',
      iconColor: 'text-cyan-600 dark:text-cyan-400',
      description: 'Enrolled students',
    },
  ];

  // Get recent activity (last 5 students)
  const recentStudents = students?.slice(0, 5) || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-cyan-600 dark:from-purple-400 dark:to-cyan-400 bg-clip-text text-transparent mb-2">
          Teacher Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
          <Award className="w-4 h-4" />
          Manage your courses
        </p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stats.map((stat, index) => (
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
                  <TrendingUp className="w-3 h-3" />
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
        {/* Recent Students */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card title="Recent Students" hover={false}>
            {recentStudents.length > 0 ? (
              <div className="space-y-3">
                {recentStudents.map((student, index) => (
                  <motion.div
                    key={student.id || index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 + index * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors duration-200"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {student.student_name?.charAt(0) || 'S'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {student.student_name || 'Unknown Student'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {student.course_name || 'No course'}
                      </p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      student.status === 'ACTIVE' 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                    }`}>
                      {student.status || 'Active'}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">No students yet</p>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card title="Quick Actions" hover={false}>
            <div className="space-y-3">
              <motion.a
                href="/teacher/courses"
                whileHover={{ x: 4 }}
                className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 hover:from-purple-100 hover:to-indigo-100 dark:hover:from-purple-900/30 dark:hover:to-indigo-900/30 transition-all duration-200 group"
              >
                <div className="p-2 rounded-lg bg-white dark:bg-slate-700 shadow-sm">
                  <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">Manage Courses</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">View and edit your courses</p>
                </div>
                <TrendingUp className="w-4 h-4 text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
              </motion.a>

              <motion.a
                href="/teacher/students"
                whileHover={{ x: 4 }}
                className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 hover:from-cyan-100 hover:to-blue-100 dark:hover:from-cyan-900/30 dark:hover:to-blue-900/30 transition-all duration-200 group"
              >
                <div className="p-2 rounded-lg bg-white dark:bg-slate-700 shadow-sm">
                  <Users className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">View Students</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">View enrolled students</p>
                </div>
                <TrendingUp className="w-4 h-4 text-gray-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors" />
              </motion.a>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Course Overview */}
      {courses && courses.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card title="My Courses Overview" hover={false}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.slice(0, 6).map((course, index) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.6 + index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-800 border border-gray-200 dark:border-slate-600 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-600">
                      <BookOpen className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      course.is_active
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                    }`}>
                      {course.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-1">
                    {course.name}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
                    {course.description || 'No description'}
                  </p>

                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default Dashboard;
