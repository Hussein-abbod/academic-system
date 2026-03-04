import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ClipboardList, Clock, BookOpen, CheckCircle, AlertCircle, Lock, Play } from 'lucide-react';
import api from '../../utils/api';

function getQuizStatus(quiz) {
  const now = new Date();
  const open = quiz.open_date ? new Date(quiz.open_date) : null;
  const close = quiz.close_date ? new Date(quiz.close_date) : null;

  // Parse attempts from description hack
  const match = (quiz.description || '').match(/__attempts_used:(\d+)/);
  const attemptsUsed = match ? +match[1] : 0;

  if (attemptsUsed >= quiz.max_attempts) return { label: 'Completed', color: 'emerald', icon: CheckCircle, canStart: false };
  if (close && now > close) return { label: 'Closed', color: 'gray', icon: Lock, canStart: false };
  if (open && now < open) return { label: 'Upcoming', color: 'amber', icon: Clock, canStart: false };
  return { label: 'Available', color: 'blue', icon: Play, canStart: true, attemptsUsed };
}

const colorMap = {
  emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  gray: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

export default function Quizzes() {
  const navigate = useNavigate();

  const { data: quizzes = [], isLoading } = useQuery({
    queryKey: ['student-quizzes'],
    queryFn: async () => (await api.get('/student/quizzes')).data
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <ClipboardList className="text-green-500" size={28} />
          My Quizzes
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Complete your assigned quizzes</p>
      </div>

      {quizzes.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-600">
          <ClipboardList size={48} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400">No quizzes available yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Your teachers haven't published any quizzes</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {quizzes.map((quiz, i) => {
            const status = getQuizStatus(quiz);
            const StatusIcon = status.icon;
            const match = (quiz.description || '').match(/__attempts_used:(\d+)/);
            const attemptsUsed = match ? +match[1] : 0;
            const cleanDescription = (quiz.description || '').replace(/__attempts_used:\d+/, '').trim();

            return (
              <motion.div
                key={quiz.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 flex flex-col hover:shadow-md transition-shadow"
              >
                {/* Top */}
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                    <ClipboardList size={18} className="text-white" />
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${colorMap[status.color]}`}>
                    <StatusIcon size={11} />
                    {status.label}
                  </span>
                </div>

                {/* Info */}
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{quiz.title}</h3>
                {cleanDescription && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">{cleanDescription}</p>
                )}

                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-4 flex-wrap">
                  <span className="flex items-center gap-1">
                    <BookOpen size={12} />
                    {quiz.course_name || 'Course'}
                  </span>
                  <span className="flex items-center gap-1">
                    <ClipboardList size={12} />
                    {quiz.questions?.length || 0} questions · {quiz.total_points || 0} pts
                  </span>
                  {quiz.time_limit_minutes && (
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {quiz.time_limit_minutes} min
                    </span>
                  )}
                </div>

                {/* Attempts */}
                <div className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                  Attempts: {attemptsUsed} / {quiz.max_attempts}
                </div>

                {/* Button */}
                <div className="mt-auto">
                  {status.canStart ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate(`/student/quizzes/${quiz.id}/take`)}
                      className="w-full py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity text-sm flex items-center justify-center gap-2"
                    >
                      <Play size={15} />
                      {attemptsUsed > 0 ? 'Retake Quiz' : 'Start Quiz'}
                    </motion.button>
                  ) : (
                    <button
                      disabled
                      className="w-full py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 font-medium rounded-xl text-sm cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <StatusIcon size={15} />
                      {status.label}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
