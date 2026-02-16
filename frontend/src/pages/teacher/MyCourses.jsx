import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import { BookOpen, Calendar, Users } from 'lucide-react';

const MyCourses = () => {
  const { data: courses, isLoading } = useQuery({
    queryKey: ['teacher-courses'],
    queryFn: async () => {
      const response = await api.get('/teacher/courses');
      return response.data;
    },
  });

  const columns = [
    {
      header: 'Course Name',
      accessorKey: 'name',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg">
            <BookOpen size={18} />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{row.name}</p>
            <p className="text-xs text-gray-500 truncate max-w-[200px]">{row.description}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Level',
      accessorKey: 'level.name',
      cell: (row) => (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
          {row.level_name} 
          {/* Note: Backend might need to return level details or just level_id. 
              Assuming CourseResponse includes level_name or we fetch it. 
              The CourseResponse schema usually has level_id. 
              We might need to adjust backend to return level name or fetch levels.
              For now keeping simple. */}
        </span>
      ),
    },
    {
      header: 'Schedule',
      accessorKey: 'start_date',
      cell: (row) => (
        <div className="flex flex-col text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Calendar size={14} />
            {new Date(row.start_date).toLocaleDateString()}
          </span>
          <span className="text-xs">to {new Date(row.end_date).toLocaleDateString()}</span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'is_active',
      cell: (row) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          row.is_active 
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          {row.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  if (isLoading) return <div>Loading courses...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          My Courses
        </h1>
      </div>

      <Card>
        <Table 
            data={courses || []} 
            columns={columns} 
            searchable 
            searchKeys={['name']}
        />
      </Card>
    </div>
  );
};

export default MyCourses;
