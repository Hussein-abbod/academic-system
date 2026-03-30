import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import Card from '../../components/ui/Card';
import { BookOpen, Calendar, Clock, PlayCircle } from 'lucide-react';

const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const parseDays = (str) => (str ? str.split(',').filter(Boolean) : []);

// Format "09:00" → "9:00 AM"
const formatTime = (t) => {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
};

const ScheduleSection = ({ scheduleDays, startTime, endTime }) => {
  const days = parseDays(scheduleDays);
  const hasSchedule = days.length > 0 || startTime;

  if (!hasSchedule) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-400 italic">
        <Calendar size={13} />
        No schedule set
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Day pills */}
      {days.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {ALL_DAYS.map((d) => (
            <span
              key={d}
              className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
                days.includes(d)
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-transparent border-gray-200 dark:border-slate-600 text-gray-300 dark:text-slate-600'
              }`}
            >
              {d}
            </span>
          ))}
        </div>
      )}

      {/* Time range */}
      {startTime && (
        <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
          <Clock size={12} className="text-blue-500" />
          <span className="font-medium">
            {formatTime(startTime)}
            {endTime ? ` – ${formatTime(endTime)}` : ''}
          </span>
        </div>
      )}
    </div>
  );
};

const MyCourses = () => {
  const { data: enrollments, isLoading } = useQuery({
    queryKey: ['student-courses'],
    queryFn: async () => {
      const response = await api.get('/student/courses');
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
          Loading courses...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
        My Learning
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {enrollments?.map((enrollment) => (
          <Card key={enrollment.id} className="flex flex-col h-full hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl">
                <BookOpen size={24} />
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                enrollment.status === 'ACTIVE'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
              }`}>
                {enrollment.status}
              </span>
            </div>

            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 line-clamp-1">
              {enrollment.course_name}
            </h3>

            {/* Schedule Section */}
            <div className="mb-4 p-3 bg-gray-50 dark:bg-slate-700/40 rounded-xl border border-gray-100 dark:border-slate-700">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Calendar size={11} /> Schedule
              </p>
              <ScheduleSection
                scheduleDays={enrollment.schedule_days}
                startTime={enrollment.start_time}
                endTime={enrollment.end_time}
              />
            </div>

            <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <Calendar size={12}/>
                {new Date(enrollment.enrollment_date).toLocaleDateString()}
              </div>

              <a
                href={`/student/courses/${enrollment.course_id}`}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
              >
                Continue <PlayCircle size={16} />
              </a>
            </div>
          </Card>
        ))}

        {(!enrollments || enrollments.length === 0) && (
          <div className="col-span-full text-center py-12 text-gray-500">
            You are not enrolled in any courses yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCourses;
