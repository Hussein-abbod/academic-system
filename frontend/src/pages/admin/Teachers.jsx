import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, GraduationCap, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../utils/api';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { Input } from '../../components/ui/forms';

const Teachers = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone_number: '',
    role: 'TEACHER'
  });

  const queryClient = useQueryClient();

  // Fetch teachers
  const { data: teachers = [], isLoading } = useQuery({
    queryKey: ['admin-teachers'],
    queryFn: async () => {
      const response = await api.get('/admin/users?role=TEACHER');
      return response.data;
    }
  });

  // Fetch courses to show teacher assignments
  const { data: courses = [] } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: async () => {
      const response = await api.get('/admin/courses');
      return response.data;
    }
  });

  // Create teacher mutation
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/admin/users', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-teachers']);
      toast.success('Teacher created successfully!');
      setIsCreateModalOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to create teacher');
    }
  });

  // Update teacher mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/admin/users/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-teachers']);
      toast.success('Teacher updated successfully!');
      setIsEditModalOpen(false);
      setSelectedTeacher(null);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to update teacher');
    }
  });

  // Delete teacher mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/admin/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-teachers']);
      toast.success('Teacher deleted successfully!');
      setIsDeleteDialogOpen(false);
      setSelectedTeacher(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to delete teacher');
    }
  });

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      full_name: '',
      phone_number: '',
      role: 'TEACHER'
    });
  };

  const handleCreate = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  const handleEdit = (teacher) => {
    setSelectedTeacher(teacher);
    setFormData({
      email: teacher.email,
      password: '', // Don't populate password for security
      full_name: teacher.full_name,
      phone_number: teacher.phone_number || '',
      role: 'TEACHER'
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = (teacher) => {
    setSelectedTeacher(teacher);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmitCreate = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleSubmitEdit = (e) => {
    e.preventDefault();
    const submitData = { ...formData };
    if (!submitData.password) delete submitData.password;
    if (!submitData.phone_number) delete submitData.phone_number;
    delete submitData.role;
    updateMutation.mutate({ id: selectedTeacher.id, data: submitData });
  };

  const handleConfirmDelete = () => {
    deleteMutation.mutate(selectedTeacher.id);
  };

  // Get teacher's assigned courses
  const getTeacherCourses = (teacherId) => {
    return courses.filter(c => c.teacher_id === teacherId);
  };

  const columns = [
    {
      header: 'Teacher Name',
      accessorKey: 'full_name',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm">
            {row.full_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-white">{row.full_name}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{row.email}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Phone',
      accessorKey: 'phone_number',
      cell: (row) => row.phone_number || <span className="text-gray-400">N/A</span>
    },
    {
      header: 'Assigned Courses',
      accessorKey: 'courses',
      cell: (row) => {
        const teacherCourses = getTeacherCourses(row.id);
        const activeCourses = teacherCourses.filter(c => c.is_active);
        
        return (
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-purple-500" />
            <span className="font-medium">{teacherCourses.length}</span>
            {teacherCourses.length > 0 && (
              <span className="text-xs text-gray-500">
                ({activeCourses.length} active)
              </span>
            )}
          </div>
        );
      }
    },
    {
      header: 'Course Names',
      accessorKey: 'course_list',
      cell: (row) => {
        const teacherCourses = getTeacherCourses(row.id);
        
        if (teacherCourses.length === 0) {
          return <span className="text-gray-400 text-sm">No courses assigned</span>;
        }
        
        return (
          <div className="flex flex-wrap gap-1">
            {teacherCourses.slice(0, 2).map(course => (
              <span
                key={course.id}
                className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium"
              >
                {course.name}
              </span>
            ))}
            {teacherCourses.length > 2 && (
              <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium">
                +{teacherCourses.length - 2} more
              </span>
            )}
          </div>
        );
      }
    },
    {
      header: 'Status',
      accessorKey: 'is_active',
      cell: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.is_active 
            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
        }`}>
          {row.is_active ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      header: 'Actions',
      accessorKey: 'actions',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEdit(row)}
            className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-colors"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row)}
            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Teacher Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage teacher accounts and course assignments
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Teacher
        </button>
      </div>

      {/* Teachers Table */}
      <Table
        data={teachers}
        columns={columns}
        searchable
        searchKeys={['full_name', 'email']}
      />

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Teacher"
        size="md"
      >
        <TeacherForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmitCreate}
          onCancel={() => {
            setIsCreateModalOpen(false);
            resetForm();
          }}
          isLoading={createMutation.isPending}
          isEdit={false}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedTeacher(null);
          resetForm();
        }}
        title="Edit Teacher"
        size="md"
      >
        <TeacherForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmitEdit}
          onCancel={() => {
            setIsEditModalOpen(false);
            setSelectedTeacher(null);
            resetForm();
          }}
          isLoading={updateMutation.isPending}
          isEdit={true}
        />
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedTeacher(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Teacher"
        message={`Are you sure you want to delete "${selectedTeacher?.full_name}"? This will unassign them from all courses.`}
        confirmText="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

// TeacherForm component
const TeacherForm = ({ formData, setFormData, onSubmit, onCancel, isLoading, isEdit }) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <Input
      label="Full Name"
      required
      value={formData.full_name}
      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
      placeholder="e.g., Dr. Jane Smith"
    />

    <Input
      label="Email"
      type="email"
      required
      value={formData.email}
      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
      placeholder="teacher@example.com"
      disabled={isEdit}
    />

    <Input
      label={isEdit ? "Password (leave empty to keep current)" : "Password"}
      type="password"
      required={!isEdit}
      value={formData.password}
      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
      placeholder="••••••••"
    />

    <Input
      label="Phone Number"
      type="tel"
      value={formData.phone_number}
      onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
      placeholder="+1234567890"
    />

    <div className="flex justify-end gap-3 pt-4">
      <button
        type="button"
        onClick={onCancel}
        className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
        disabled={isLoading}
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={isLoading}
        className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {isLoading && (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        )}
        {isLoading ? 'Saving...' : 'Save Teacher'}
      </button>
    </div>
  </form>
);

export default Teachers;
