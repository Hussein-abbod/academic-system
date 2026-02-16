import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Select from '../../components/ui/Select'; 
import { Users, Mail, BookOpen, GraduationCap } from 'lucide-react';

const MyStudents = () => {
    const [selectedCourse, setSelectedCourse] = useState('');

    // Fetch courses for the filter dropdown
    const { data: courses } = useQuery({
        queryKey: ['teacher-courses'],
        queryFn: async () => {
        const response = await api.get('/teacher/courses');
        return response.data;
        },
    });

    // Fetch students, optionally filtered by course
    const { data: enrollments, isLoading } = useQuery({
        queryKey: ['teacher-students', selectedCourse],
        queryFn: async () => {
        const params = selectedCourse ? { course_id: selectedCourse } : {};
        const response = await api.get('/teacher/students', { params });
        return response.data;
        },
    });

    const columns = [
        {
        header: 'Student Name',
        accessorKey: 'student.full_name',
        cell: (row) => (
            <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                {row.student_name.charAt(0)}
            </div>
            <div>
                <p className="font-medium text-gray-900 dark:text-white">{row.student_name}</p>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                <Mail size={12} />
                {row.student_email}
                </div>
            </div>
            </div>
        ),
        },
        {
        header: 'Enrolled Course',
        accessorKey: 'course.name',
        cell: (row) => (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <BookOpen size={16} />
            {row.course_name}
            </div>
        ),
        },
        {
        header: 'Enrollment Date',
        accessorKey: 'enrollment_date',
        cell: (row) => new Date(row.enrollment_date).toLocaleDateString(),
        },
        {
        header: 'Progress',
        accessorKey: 'current_progress',
        cell: (row) => (
            <div className="w-full max-w-[140px]">
            <div className="flex justify-between text-xs mb-1">
                <span>{row.current_progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                <div 
                className="bg-cosmic-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${row.current_progress}%` }}
                ></div>
            </div>
            </div>
        ),
        },
    ];

    if (isLoading) return <div>Loading students...</div>;

    const courseOptions = courses?.map(c => ({ value: c.id, label: c.name })) || [];

    return (
        <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            My Students
            </h1>
            
            <div className="w-full sm:w-64">
             {/* Using simple select for now if Select component is complex, 
                 but assuming standard HTML select tailored with Tailwind */}
            <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            >
                <option value="">All Courses</option>
                {courses?.map(course => (
                    <option key={course.id} value={course.id}>{course.name}</option>
                ))}
            </select>
            </div>
        </div>

        <Card>
            <Table 
                data={enrollments || []} 
                columns={columns} 
                searchable 
                searchKeys={['student_name', 'student_email']}
            />
        </Card>
        </div>
    );
};

export default MyStudents;
