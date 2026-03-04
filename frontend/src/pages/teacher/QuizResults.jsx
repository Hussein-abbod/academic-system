import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, BarChart2, User, CheckCircle, Clock, Award } from 'lucide-react';
import api from '../../utils/api';

function ScoreBadge({ percentage }) {
  if (percentage >= 80) return <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-semibold">{percentage}%</span>;
  if (percentage >= 60) return <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-semibold">{percentage}%</span>;
  return <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-semibold">{percentage}%</span>;
}

export default function QuizResults() {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const { data: quiz } = useQuery({
    queryKey: ['quiz-detail', quizId],
    queryFn: async () => (await api.get(`/teacher/quizzes/${quizId}`)).data
  });

  const { data: results = [], isLoading } = useQuery({
    queryKey: ['quiz-results', quizId],
    queryFn: async () => (await api.get(`/teacher/quizzes/${quizId}/results`)).data
  });

  const avg = results.filter(r => r.percentage != null).reduce((s, r) => s + r.percentage, 0) / (results.filter(r => r.percentage != null).length || 1);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/teacher/quizzes')}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart2 className="text-purple-500" size={22} />
            Quiz Results
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{quiz?.title}</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Submissions', value: results.length, icon: User, color: 'text-blue-500' },
          { label: 'Average Score', value: results.length ? `${avg.toFixed(1)}%` : 'N/A', icon: Award, color: 'text-purple-500' },
          { label: 'Total Points', value: quiz?.total_points || 0, icon: CheckCircle, color: 'text-emerald-500' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-3">
            <div className={`${s.color} bg-gray-100 dark:bg-gray-700 p-2.5 rounded-xl`}>
              <s.icon size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
          <BarChart2 size={40} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400">No submissions yet</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
              <tr>
                <th className="px-5 py-3 text-left">Student</th>
                <th className="px-5 py-3 text-left">Score</th>
                <th className="px-5 py-3 text-left">Grade</th>
                <th className="px-5 py-3 text-left">Attempt</th>
                <th className="px-5 py-3 text-left">Submitted</th>
                <th className="px-5 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {results.map((r, i) => (
                <motion.tr
                  key={r.submission_id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                        {r.student_name?.[0] || '?'}
                      </div>
                      {r.student_name}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-700 dark:text-gray-300">
                    {r.score != null ? `${r.score} / ${r.max_score}` : '—'}
                  </td>
                  <td className="px-5 py-3">
                    {r.percentage != null ? <ScoreBadge percentage={r.percentage} /> : '—'}
                  </td>
                  <td className="px-5 py-3 text-gray-500 dark:text-gray-400">#{r.attempt_number}</td>
                  <td className="px-5 py-3 text-gray-500 dark:text-gray-400">
                    {r.submitted_at ? new Date(r.submitted_at).toLocaleString() : '—'}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      r.status === 'SUBMITTED'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}>
                      {r.status === 'SUBMITTED' ? 'Submitted' : 'In Progress'}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
