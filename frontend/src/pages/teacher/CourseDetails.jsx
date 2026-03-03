import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
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
  ExternalLink,
  AlertCircle
} from 'lucide-react';

const CourseDetails = () => {
  const { id } = useParams();
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

  // Fetch quizzes
  const { data: quizzes, isLoading: quizzesLoading } = useQuery({
    queryKey: ['teacher-course-quizzes', id],
    queryFn: async () => {
      const response = await api.get(`/teacher/courses/${id}/quizzes`);
      return response.data;
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

  // Quiz Mutation
  const [newQuiz, setNewQuiz] = useState({ title: '', description: '', quiz_type: 'READING', link: '', due_date: '' });
  const createQuizMutation = useMutation({
    mutationFn: (quizData) => api.post(`/teacher/courses/${id}/quizzes`, quizData),
    onSuccess: () => {
      queryClient.invalidateQueries(['teacher-course-quizzes', id]);
      setNewQuiz({ title: '', description: '', quiz_type: 'READING', link: '', due_date: '' });
      alert('Quiz created successfully!');
    },
  });

  const handleCreateQuiz = (e) => {
    e.preventDefault();
    createQuizMutation.mutate(newQuiz);
  };

  const deleteQuizMutation = useMutation({
    mutationFn: (quizId) => api.delete(`/teacher/quizzes/${quizId}`),
    onSuccess: () => {
        queryClient.invalidateQueries(['teacher-course-quizzes', id]);
    }
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
                {quizzes?.map((quiz) => (
                    <Card key={quiz.id} className="relative">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    {quiz.title}
                                    <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                        {quiz.quiz_type}
                                    </span>
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">{quiz.description}</p>
                                <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                                    {quiz.due_date && (
                                        <span className="flex items-center gap-1">
                                            <Calendar size={14} />
                                            Due: {new Date(quiz.due_date).toLocaleDateString()}
                                        </span>
                                    )}
                                    {quiz.link && (
                                        <a href={quiz.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-purple-600 hover:underline">
                                            <ExternalLink size={14} />
                                            View Quiz
                                        </a>
                                    )}
                                </div>
                            </div>
                            <button 
                                onClick={() => deleteQuizMutation.mutate(quiz.id)}
                                className="text-red-500 hover:text-red-700 p-2"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </Card>
                ))}
                {(!quizzes || quizzes.length === 0) && (
                    <div className="text-center py-10 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                        <FileText className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                        <p className="text-gray-500">No quizzes created yet.</p>
                    </div>
                )}
            </div>
            <div>
                <Card title="Create New Quiz">
                    <form onSubmit={handleCreateQuiz} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                            <input 
                                type="text"
                                required
                                value={newQuiz.title}
                                onChange={(e) => setNewQuiz({...newQuiz, title: e.target.value})}
                                className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                            <select
                                value={newQuiz.quiz_type}
                                onChange={(e) => setNewQuiz({...newQuiz, quiz_type: e.target.value})}
                                className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600"
                            >
                                <option value="READING">Reading</option>
                                <option value="LISTENING">Listening</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Link (Microsoft Forms)</label>
                            <input 
                                type="url"
                                value={newQuiz.link}
                                onChange={(e) => setNewQuiz({...newQuiz, link: e.target.value})}
                                className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600"
                                placeholder="https://forms.office.com/..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
                            <input 
                                type="datetime-local"
                                value={newQuiz.due_date}
                                onChange={(e) => setNewQuiz({...newQuiz, due_date: e.target.value})}
                                className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                            <textarea
                                value={newQuiz.description}
                                onChange={(e) => setNewQuiz({...newQuiz, description: e.target.value})}
                                className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600"
                                rows="3"
                            ></textarea>
                        </div>
                        <button
                            type="submit"
                            disabled={createQuizMutation.isPending}
                            className="w-full py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                        >
                            {createQuizMutation.isPending ? 'Creating...' : 'Create Quiz'}
                        </button>
                    </form>
                </Card>
            </div>
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
