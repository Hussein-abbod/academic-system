import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Users, CheckCircle, XCircle, Activity, TrendingUp } from 'lucide-react';
import api from '../../utils/api';

const COLORS = {
  ACTIVE: '#3b82f6',    // blue
  COMPLETED: '#10b981', // green
  DROPPED: '#ef4444'    // red
};

const ProgressChart = () => {
  // Fetch enrollments
  const { data: enrollments = [], isLoading } = useQuery({
    queryKey: ['admin-enrollments'],
    queryFn: async () => {
      const response = await api.get('/admin/enrollments');
      return response.data;
    }
  });

  // Fetch courses for performance analysis
  const { data: courses = [] } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: async () => {
      const response = await api.get('/admin/courses');
      return response.data;
    }
  });

  // Process enrollment status distribution
  const statusData = React.useMemo(() => {
    const distribution = {
      ACTIVE: 0,
      COMPLETED: 0,
      DROPPED: 0
    };

    enrollments.forEach(enrollment => {
      if (distribution.hasOwnProperty(enrollment.status)) {
        distribution[enrollment.status]++;
      }
    });

    return Object.entries(distribution).map(([name, value]) => ({
      name,
      value,
      color: COLORS[name]
    }));
  }, [enrollments]);

  // Calculate statistics
  const stats = React.useMemo(() => {
    const total = enrollments.length;
    const completed = enrollments.filter(e => e.status === 'COMPLETED').length;
    const active = enrollments.filter(e => e.status === 'ACTIVE').length;
    const dropped = enrollments.filter(e => e.status === 'DROPPED').length;

    const completionRate = total > 0 ? (completed / total) * 100 : 0;
    
    return {
      total,
      completed,
      active,
      dropped,
      completionRate
    };
  }, [enrollments]);

  // Course performance (top 5 by completion rate)
  const coursePerformance = React.useMemo(() => {
    const courseStats = {};

    enrollments.forEach(enrollment => {
      if (!courseStats[enrollment.course_id]) {
        courseStats[enrollment.course_id] = {
          total: 0,
          completed: 0
        };
      }
      courseStats[enrollment.course_id].total++;
      if (enrollment.status === 'COMPLETED') {
        courseStats[enrollment.course_id].completed++;
      }
    });

    return Object.entries(courseStats)
      .map(([courseId, stats]) => {
        const course = courses.find(c => c.id === courseId);
        return {
          name: course?.name || 'Unknown',
          completionRate: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0,
          total: stats.total
        };
      })
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 5);
  }, [enrollments, courses]);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 dark:bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700 space-y-6">
      {/* Header */}
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Enrollment Overview</h2>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Total Enrollments</span>
          </div>
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
            {stats.total}
          </div>
        </div>

        <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-xs text-green-600 dark:text-green-400 font-medium">Completion Rate</span>
          </div>
          <div className="text-2xl font-bold text-green-700 dark:text-green-300">
            {stats.completionRate.toFixed(1)}%
          </div>
        </div>

        <div className="p-4 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border border-orange-200 dark:border-orange-800">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">Active</span>
          </div>
          <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
            {stats.active}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Enrollment Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Course Performance */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Top Courses by Completion</h3>
          <div className="space-y-3">
            {coursePerformance.length > 0 ? (
              coursePerformance.map((course, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700 dark:text-gray-300 truncate">
                      {course.name}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 ml-2">
                      {course.completionRate.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${course.completionRate}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {course.total} enrollment{course.total !== 1 ? 's' : ''}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                No course data available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressChart;
