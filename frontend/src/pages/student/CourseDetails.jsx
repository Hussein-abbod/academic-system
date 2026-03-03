import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import Card from '../../components/ui/Card';
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  FileText, 
  CheckCircle,
  ExternalLink,
  ArrowLeft
} from 'lucide-react';

const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch course details
  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ['student-course', id],
    queryFn: async () => {
      const response = await api.get(`/student/courses/${id}`);
      return response.data;
    },
  });

  // Fetch quizzes
  const { data: quizzes, isLoading: quizzesLoading } = useQuery({
    queryKey: ['student-course-quizzes', id],
    queryFn: async () => {
      const response = await api.get(`/student/courses/${id}/quizzes`);
      return response.data;
    },
  });

  // Fetch attendance
  const { data: attendance, isLoading: attendanceLoading } = useQuery({
    queryKey: ['student-course-attendance', id],
    queryFn: async () => {
      const response = await api.get(`/student/courses/${id}/attendance`);
      return response.data;
    },
  });

  if (courseLoading) return <div>Loading...</div>;

  // Calculate attendance stats
  const totalClasses = attendance?.length || 0;
  const presentCount = attendance?.filter(a => a.status === 'PRESENT').length || 0;
  const absentCount = attendance?.filter(a => a.status === 'ABSENT').length || 0;
  const lateCount = attendance?.filter(a => a.status === 'LATE').length || 0;
  const attendanceRate = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;

  return (
    <div className="space-y-6">
      <button 
        onClick={() => navigate('/student/courses')}
        className="flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <ArrowLeft size={16} className="mr-1" /> Back to My Learning
      </button>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{course?.name}</h1>
          <p className="text-gray-500 dark:text-gray-400">{course?.description}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {['overview', 'quizzes', 'attendance'].map((tab) => (
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
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <Card title="Course Information">
                 <dl className="space-y-4">
                   <div className="flex items-center gap-3">
                     <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
                        <Calendar size={20} />
                     </div>
                     <div>
                        <p className="text-sm text-gray-500">Duration</p>
                        <p className="font-medium text-gray-900 dark:text-gray-200">
                            {new Date(course?.start_date).toLocaleDateString()} - {new Date(course?.end_date).toLocaleDateString()}
                        </p>
                     </div>
                   </div>
                   <div className="flex items-center gap-3">
                     <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                        <Clock size={20} />
                     </div>
                     <div>
                        <p className="text-sm text-gray-500">Schedule</p>
                        <p className="font-medium text-gray-900 dark:text-gray-200">
                            {course?.start_time} - {course?.end_time}
                        </p>
                     </div>
                   </div>
                 </dl>
             </Card>
             
             <Card title="My Progress">
                <div className="text-center py-6">
                    <div className="text-4xl font-bold text-purple-600 mb-2">{attendanceRate}%</div>
                    <p className="text-gray-500">Attendance Rate</p>
                </div>
             </Card>
           </div>
        )}

        {activeTab === 'quizzes' && (
          <div className="space-y-4">
            {quizzes?.map((quiz) => (
                <Card key={quiz.id} className="hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                {quiz.title}
                                <span className={`px-2 py-0.5 text-xs rounded-full ${
                                    quiz.quiz_type === 'READING' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                                }`}>
                                    {quiz.quiz_type}
                                </span>
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">{quiz.description}</p>
                            {quiz.due_date && (
                                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                                    <Clock size={12} /> Due: {new Date(quiz.due_date).toLocaleDateString()}
                                </p>
                            )}
                        </div>
                        {quiz.link && (
                            <a 
                                href={quiz.link} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 text-sm"
                            >
                                Start Quiz <ExternalLink size={14} />
                            </a>
                        )}
                    </div>
                </Card>
            ))}
             {(!quizzes || quizzes.length === 0) && (
                <div className="text-center py-12 text-gray-500">
                    No quizzes available for this course yet.
                </div>
            )}
          </div>
        )}

        {activeTab === 'attendance' && (
          <Card title="Attendance Record">
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                    <div className="text-2xl font-bold text-green-700">{presentCount}</div>
                    <div className="text-xs text-green-600">Present</div>
                </div>
                <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                    <div className="text-2xl font-bold text-red-700">{absentCount}</div>
                    <div className="text-xs text-red-600">Absent</div>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                    <div className="text-2xl font-bold text-yellow-700">{lateCount}</div>
                    <div className="text-xs text-yellow-600">Late</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div className="text-2xl font-bold text-gray-700">{totalClasses}</div>
                    <div className="text-xs text-gray-600">Total Classes</div>
                </div>
             </div>

             <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead>
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {attendance?.map((record) => (
                            <tr key={record.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                    {new Date(record.date).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                        record.status === 'PRESENT' ? 'bg-green-100 text-green-800' :
                                        record.status === 'ABSENT' ? 'bg-red-100 text-red-800' :
                                        record.status === 'LATE' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                        {record.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                    {record.notes || '-'}
                                </td>
                            </tr>
                        ))}
                         {(!attendance || attendance.length === 0) && (
                            <tr>
                                <td colSpan="3" className="px-6 py-4 text-center text-gray-500">No attendance records found.</td>
                            </tr>
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
