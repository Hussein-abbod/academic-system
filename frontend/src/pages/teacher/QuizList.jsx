import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Plus, ClipboardList, Edit, Trash2, Eye, CheckCircle,
  Clock, BookOpen, AlertCircle, BarChart2
} from 'lucide-react';
import api from '../../utils/api';

const statusColors = {
  DRAFT: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', label: 'Draft' },
  PUBLISHED: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', label: 'Published' },
};

export default function QuizList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: quizzes = [], isLoading } = useQuery({
    queryKey: ['teacher-quizzes'],
    queryFn: async () => {
      const res = await api.get('/teacher/quizzes');
      return res.data;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/teacher/quizzes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['teacher-quizzes']);
      toast.success('Quiz deleted');
    },
    onError: () => toast.error('Failed to delete quiz')
  });

  const publishMutation = useMutation({
    mutationFn: ({ id, action }) => api.post(`/teacher/quizzes/${id}/${action}`),
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries(['teacher-quizzes']);
      toast.success(action === 'publish' ? 'Quiz published!' : 'Quiz set to draft');
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Action failed')
  });

  const handleDelete = (quiz) => {
    if (window.confirm(`Delete "${quiz.title}"? This cannot be undone.`)) {
      deleteMutation.mutate(quiz.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ClipboardList className="text-purple-500" size={28} />
            My Quizzes
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Create and manage quizzes for your courses</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/teacher/quizzes/new')}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-purple-500/30 transition-all"
        >
          <Plus size={18} />
          Create New Quiz
        </motion.button>
      </div>

      {quizzes.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-600"
        >
          <ClipboardList size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400">No quizzes yet</h3>
          <p className="text-gray-400 dark:text-gray-500 mt-1 mb-6">Create your first quiz to get started</p>
          <button
            onClick={() => navigate('/teacher/quizzes/new')}
            className="px-6 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
          >
            <Plus size={16} className="inline mr-2" />
            Create Quiz
          </button>
        </motion.div>
      ) : (
        <div className="grid gap-4">
          {quizzes.map((quiz, i) => {
            const s = statusColors[quiz.status] || statusColors.DRAFT;
            return (
              <motion.div
                key={quiz.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:shadow-md transition-shadow"
              >
                {/* Icon */}
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                  <ClipboardList size={22} className="text-white" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">{quiz.title}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
                      {s.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
                    <span className="flex items-center gap-1">
                      <BookOpen size={13} />
                      {quiz.course_name || quiz.course_id}
                    </span>
                    <span className="flex items-center gap-1">
                      <ClipboardList size={13} />
                      {quiz.questions?.length || 0} questions · {quiz.total_points || 0} pts
                    </span>
                    {quiz.time_limit_minutes && (
                      <span className="flex items-center gap-1">
                        <Clock size={13} />
                        {quiz.time_limit_minutes} min
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {quiz.status === 'DRAFT' ? (
                    <button
                      onClick={() => publishMutation.mutate({ id: quiz.id, action: 'publish' })}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      <CheckCircle size={14} />
                      Publish
                    </button>
                  ) : (
                    <button
                      onClick={() => publishMutation.mutate({ id: quiz.id, action: 'unpublish' })}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                    >
                      <AlertCircle size={14} />
                      Unpublish
                    </button>
                  )}
                  <button
                    onClick={() => navigate(`/teacher/quizzes/${quiz.id}/results`)}
                    className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title="View Results"
                  >
                    <BarChart2 size={18} />
                  </button>
                  <button
                    onClick={() => navigate(`/teacher/quizzes/${quiz.id}/edit`)}
                    className="p-2 text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                    title="Edit Quiz"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(quiz)}
                    className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Delete Quiz"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
