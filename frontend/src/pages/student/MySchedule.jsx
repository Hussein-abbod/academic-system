import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import { Calendar, Clock, BookOpen } from 'lucide-react';

const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const parseDays = (str) => (str ? str.split(',').filter(Boolean) : []);

const formatTime = (t) => {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
};

// Color per day index for variety
const DAY_COLORS = {
  Mon: 'bg-blue-500',
  Tue: 'bg-violet-500',
  Wed: 'bg-emerald-500',
  Thu: 'bg-orange-500',
  Fri: 'bg-pink-500',
  Sat: 'bg-teal-500',
  Sun: 'bg-red-500',
};

const MySchedule = () => {
  const { data: enrollments = [], isLoading } = useQuery({
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
            <Calendar className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>
        <p className="text-sm font-bold text-gray-500 dark:text-gray-400 tracking-wider uppercase animate-pulse">
          Loading Schedule...
        </p>
      </div>
    );
  }

  // Only active enrollments that have schedule info
  const scheduled = enrollments.filter((e) => e.status === 'ACTIVE');

  // Group courses by day for the weekly grid
  const byDay = {};
  ALL_DAYS.forEach((d) => { byDay[d] = []; });
  scheduled.forEach((enr) => {
    const days = parseDays(enr.schedule_days);
    days.forEach((d) => {
      if (byDay[d]) byDay[d].push(enr);
    });
  });

  const hasAnySchedule = scheduled.some(
    (e) => parseDays(e.schedule_days).length > 0 || e.start_time
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <Calendar className="text-green-500" size={26} />
          My Schedule
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Your weekly class schedule across all active courses
        </p>
      </div>

      {scheduled.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <BookOpen size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-lg">You have no active enrollments.</p>
        </div>
      ) : !hasAnySchedule ? (
        <div className="text-center py-16 text-gray-400">
          <Calendar size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-lg">No schedule has been set for your courses yet.</p>
        </div>
      ) : (
        <>
          {/* Weekly Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
            {ALL_DAYS.map((day) => (
              <div key={day} className="flex flex-col">
                {/* Day Header */}
                <div className={`${DAY_COLORS[day]} text-white text-center py-2 rounded-t-xl font-bold text-sm tracking-wide`}>
                  {day}
                </div>
                {/* Course Slots */}
                <div className="flex-1 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-b-xl p-2 space-y-2 min-h-[100px]">
                  {byDay[day].length === 0 ? (
                    <p className="text-xs text-gray-300 dark:text-slate-600 text-center pt-4 italic">—</p>
                  ) : (
                    byDay[day].map((enr) => (
                      <div
                        key={enr.id}
                        className="bg-white dark:bg-slate-700 rounded-lg p-2 border border-gray-100 dark:border-slate-600 shadow-sm"
                      >
                        <p className="text-xs font-semibold text-gray-800 dark:text-white leading-tight line-clamp-2">
                          {enr.course_name}
                        </p>
                        {enr.start_time && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                            <Clock size={10} className="text-green-500" />
                            {formatTime(enr.start_time)}
                            {enr.end_time && ` – ${formatTime(enr.end_time)}`}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Course List — all courses with full schedule detail */}
          <div>
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Course Details
            </h2>
            <div className="space-y-3">
              {scheduled.map((enr) => {
                const days = parseDays(enr.schedule_days);
                return (
                  <div
                    key={enr.id}
                    className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 shadow-sm"
                  >
                    {/* Course Icon + Name */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="p-2.5 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-xl shrink-0">
                        <BookOpen size={20} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 dark:text-white truncate">{enr.course_name}</p>
                        <p className="text-xs text-gray-400">Active</p>
                      </div>
                    </div>

                    {/* Days */}
                    <div className="flex flex-wrap gap-1 shrink-0">
                      {days.length > 0 ? (
                        ALL_DAYS.map((d) => (
                          <span
                            key={d}
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              days.includes(d)
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-100 dark:bg-slate-700 text-gray-300 dark:text-slate-500'
                            }`}
                          >
                            {d}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400 italic">No days set</span>
                      )}
                    </div>

                    {/* Time */}
                    <div className="shrink-0 min-w-[120px] text-right">
                      {enr.start_time ? (
                        <span className="flex items-center gap-1 justify-end text-sm font-medium text-gray-700 dark:text-gray-300">
                          <Clock size={14} className="text-green-500" />
                          {formatTime(enr.start_time)}
                          {enr.end_time && ` – ${formatTime(enr.end_time)}`}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 italic">No time set</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MySchedule;
