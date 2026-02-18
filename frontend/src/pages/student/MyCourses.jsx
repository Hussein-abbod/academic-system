import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import Card from '../../components/ui/Card';
import { BookOpen, Calendar, Clock, PlayCircle } from 'lucide-react';

const MyCourses = () => {
  const { data: enrollments, isLoading } = useQuery({
    queryKey: ['student-courses'],
    queryFn: async () => {
      const response = await api.get('/student/courses');
      return response.data;
    },
  });

  if (isLoading) return <div>Loading courses...</div>;

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

            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-1">
              {enrollment.course_name}
            </h3>
            


            <div className="space-y-4">
              <div className="relative pt-1 space-y-2">
                {/* Progress bar removed */}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                 <div className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar size={12}/>
                    {new Date(enrollment.enrollment_date).toLocaleDateString()}
                 </div>
                 
                 <button className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1">
                    Continue <PlayCircle size={16} />
                 </button>
              </div>
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
