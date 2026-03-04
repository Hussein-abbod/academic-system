import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '../../utils/api';
import Card from '../../components/ui/Card';
import { 
  BookOpen, 
  Users, 
  Calendar, 
  Clock, 
  FileText, 
  CheckCircle, 
  Plus, 
  Trash2,
  Edit2,
  BarChart2,
  AlertCircle,
  ClipboardList,
  Send,
  Lock
} from 'lucide-react';

const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const queryClient = useQueryClient();

  // Fetch course details
  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ['teacher-course', id],
    queryFn: async () => {
      const response = await api.get(`/teacher/courses/${id}`);
      return response.data;
    },
  });

  // Fetch students enrolled in this course
  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['teacher-course-students', id],
    queryFn: async () => {
      const response = await api.get('/teacher/students', { params: { course_id: id } });
      return response.data;
    },
  });

  // Fetch quizzes for this course from the new internal quiz system
  const { data: quizzes = [], isLoading: quizzesLoading } = useQuery({
    queryKey: ['teacher-quizzes-course', id],
    queryFn: async () => {
      const response = await api.get('/teacher/quizzes');
      return response.data.filter(q => q.course_id === id);
    },
  });

  // Fetch attendance (default current date)
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const { data: attendance, isLoading: attendanceLoading } = useQuery({
    queryKey: ['teacher-course-attendance', id, attendanceDate],
    queryFn: async () => {
      const response = await api.get(`/teacher/courses/${id}/attendance`, { params: { date: attendanceDate } });
      return response.data;
    },
  });

  // Quiz mutations
  const deleteQuizMutation = useMutation({
    mutationFn: (quizId) => api.delete(`/teacher/quizzes/${quizId}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['teacher-quizzes-course', id]);
      toast.success('Quiz deleted');
    },
    onError: () => toast.error('Failed to delete quiz'),
  });

  const publishQuizMutation = useMutation({
    mutationFn: (quizId) => api.post(`/teacher/quizzes/${quizId}/publish`),
    onSuccess: () => {
      queryClient.invalidateQueries(['teacher-quizzes-course', id]);
      toast.success('Quiz published!');
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Publish failed'),
  });

  // Attendance Mutation
  const markAttendanceMutation = useMutation({
    mutationFn: (data) => api.post('/teacher/attendance', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['teacher-course-attendance', id, attendanceDate]);
      toast.success('Attendance recorded!');
    },
    onError: (error) => {
      const detail = error?.response?.data?.detail;
      // FastAPI 422 errors return detail as an array of validation error objects
      let msg;
      if (Array.isArray(detail)) {
        msg = detail.map((d) => d.msg || JSON.stringify(d)).join(', ');
      } else if (typeof detail === 'string') {
        msg = detail;
      } else {
        msg = 'Failed to record attendance. Make sure this course is assigned to your teacher account.';
      }
      toast.error(msg);
    },
  });

  const handleMarkAttendance = (studentId, attendanceStatus) => {
    if (!studentId) {
      toast.error('Cannot record attendance: student ID is missing.');
      return;
    }
    markAttendanceMutation.mutate({
      course_id: id,
      student_id: studentId,
      status: attendanceStatus,
      date: attendanceDate,
    });
  };

  if (courseLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{course?.name}</h1>
          <p className="text-gray-500 dark:text-gray-400">{course?.description}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar size={16} />
          {course?.start_time} - {course?.end_time}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {['overview', 'students', 'quizzes', 'attendance'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm capitalize
                ${activeTab === tab
                  ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
           <Card title="Course Overview">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                 <h3 className="text-lg font-medium mb-2">Details</h3>
                 <dl className="space-y-2">
                   <div className="flex justify-between">
                     <dt className="text-gray-500">Capacity</dt>
                     <dd className="font-medium">{course?.capacity}</dd>
                   </div>
                   <div className="flex justify-between">
                     <dt className="text-gray-500">Price</dt>
                     <dd className="font-medium">${course?.price}</dd>
                   </div>
                   <div className="flex justify-between">
                     <dt className="text-gray-500">Dates</dt>
                     <dd className="font-medium">{new Date(course?.start_date).toLocaleDateString()} - {new Date(course?.end_date).toLocaleDateString()}</dd>
                   </div>
                 </dl>
               </div>
               <div>
                 <h3 className="text-lg font-medium mb-2">Quick Stats</h3>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg text-center">
                        <Users className="w-6 h-6 mx-auto mb-1 text-purple-600" />
                        <div className="text-2xl font-bold">{students?.length || 0}</div>
                        <div className="text-xs text-gray-500">Students</div>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
                        <FileText className="w-6 h-6 mx-auto mb-1 text-blue-600" />
                        <div className="text-2xl font-bold">{quizzes?.length || 0}</div>
                        <div className="text-xs text-gray-500">Quizzes</div>
                    </div>
                 </div>
               </div>
             </div>
           </Card>
        )}

        {activeTab === 'students' && (
          <Card title="Enrolled Students">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {students?.map((enrollment) => (
                    <tr key={enrollment.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {enrollment.student_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {enrollment.student_email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {enrollment.current_progress}%
                      </td>
                    </tr>
                  ))}
                  {(!students || students.length === 0) && (
                    <tr>
                        <td colSpan="3" className="px-6 py-4 text-center text-gray-500">No students enrolled yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {activeTab === 'quizzes' && (
          <div className="space-y-4">
            {/* Header with Create button */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <ClipboardList size={20} className="text-purple-500" />
                Course Quizzes
              </h2>
              <button
                onClick={() => navigate('/teacher/quizzes/new', { state: { prefill_course_id: id } })}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium rounded-xl hover:opacity-90 transition shadow-md"
              >
                <Plus size={16} /> Create Quiz
              </button>
            </div>

            {quizzesLoading && <p className="text-gray-400 text-sm">Loading quizzes…</p>}

            {!quizzesLoading && quizzes.length === 0 && (
              <div className="text-center py-14 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                <ClipboardList size={40} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">No quizzes yet</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Click "Create Quiz" to add one for this course</p>
              </div>
            )}

            {quizzes.map((quiz) => (
              <div key={quiz.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-base truncate">{quiz.title}</h3>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        quiz.status === 'PUBLISHED'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}>
                        {quiz.status === 'PUBLISHED' ? '● Published' : '○ Draft'}
                      </span>
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        {quiz.quiz_type}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-2">
                      <span>{quiz.questions?.length || 0} questions</span>
                      <span>{quiz.total_points || 0} pts</span>
                      {quiz.time_limit_minutes && <span>{quiz.time_limit_minutes} min</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {quiz.status !== 'PUBLISHED' && (
                      <button
                        onClick={() => publishQuizMutation.mutate(quiz.id)}
                        disabled={publishQuizMutation.isPending}
                        title="Publish"
                        className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 transition-colors"
                      >
                        <Send size={15} />
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/teacher/quizzes/${quiz.id}/results`)}
                      title="View Results"
                      className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900/20 transition-colors"
                    >
                      <BarChart2 size={15} />
                    </button>
                    <button
                      onClick={() => navigate(`/teacher/quizzes/${quiz.id}/edit`)}
                      title="Edit"
                      className="p-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-600 dark:bg-purple-900/20 transition-colors"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Delete this quiz? This cannot be undone.')) {
                          deleteQuizMutation.mutate(quiz.id);
                        }
                      }}
                      title="Delete"
                      className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 dark:bg-red-900/20 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'attendance' && (
          <Card>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium">Daily Attendance</h3>
                <input 
                    type="date" 
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600"
                />
            </div>
            
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead>
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {(!students || students.length === 0) ? (
                            <tr>
                                <td colSpan="3" className="px-6 py-10 text-center">
                                    <div className="flex flex-col items-center gap-2 text-gray-400">
                                        <AlertCircle size={32} />
                                        <p className="text-sm">No students enrolled in this course yet.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            students.map((student) => {
                                const record = attendance?.find(
                                    (a) => a.student_id === student.student_id
                                );
                                const isPending = markAttendanceMutation.isPending;
                                return (
                                    <tr key={student.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                            {student.student_name || '—'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {record ? (
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                    record.status === 'PRESENT' ? 'bg-green-100 text-green-800' :
                                                    record.status === 'ABSENT'  ? 'bg-red-100 text-red-800' :
                                                    record.status === 'LATE'    ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {record.status}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 text-sm italic">Not recorded</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleMarkAttendance(student.student_id, 'PRESENT')}
                                                    disabled={isPending}
                                                    className={`p-1 rounded transition-colors disabled:opacity-40 ${
                                                        record?.status === 'PRESENT'
                                                            ? 'bg-green-200 ring-2 ring-green-400'
                                                            : 'bg-green-50 hover:bg-green-100'
                                                    }`}
                                                    title="Present"
                                                >
                                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                                </button>
                                                <button
                                                    onClick={() => handleMarkAttendance(student.student_id, 'ABSENT')}
                                                    disabled={isPending}
                                                    className={`p-1 rounded transition-colors disabled:opacity-40 ${
                                                        record?.status === 'ABSENT'
                                                            ? 'bg-red-200 ring-2 ring-red-400'
                                                            : 'bg-red-50 hover:bg-red-100'
                                                    }`}
                                                    title="Absent"
                                                >
                                                    <AlertCircle className="w-5 h-5 text-red-600" />
                                                </button>
                                                <button
                                                    onClick={() => handleMarkAttendance(student.student_id, 'LATE')}
                                                    disabled={isPending}
                                                    className={`p-1 rounded transition-colors disabled:opacity-40 ${
                                                        record?.status === 'LATE'
                                                            ? 'bg-yellow-200 ring-2 ring-yellow-400'
                                                            : 'bg-yellow-50 hover:bg-yellow-100'
                                                    }`}
                                                    title="Late"
                                                >
                                                    <Clock className="w-5 h-5 text-yellow-600" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CourseDetails;
