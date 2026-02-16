import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, User, BookOpen, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../utils/api';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { Input } from '../../components/ui/forms';

const Students = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone_number: '',
    role: 'STUDENT'
  });

  const queryClient = useQueryClient();

  // Fetch students
  const { data: students = [], isLoading } = useQuery({
    queryKey: ['admin-students'],
    queryFn: async () => {
      const response = await api.get('/admin/users?role=STUDENT');
      return response.data;
    }
  });

  // Fetch enrollments to show student progress
  const { data: enrollments = [] } = useQuery({
    queryKey: ['admin-enrollments'],
    queryFn: async () => {
      const response = await api.get('/admin/enrollments');
      return response.data;
    }
  });

  // Create student mutation
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/admin/users', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-students']);
      toast.success('Student created successfully!');
      setIsCreateModalOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to create student');
    }
  });

  // Update student mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/admin/users/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-students']);
      toast.success('Student updated successfully!');
      setIsEditModalOpen(false);
      setSelectedStudent(null);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to update student');
    }
  });

  // Delete student mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/admin/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-students']);
      toast.success('Student deleted successfully!');
      setIsDeleteDialogOpen(false);
      setSelectedStudent(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to delete student');
    }
  });

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      full_name: '',
      phone_number: '',
      role: 'STUDENT'
    });
  };

  const handleCreate = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  const handleEdit = (student) => {
    setSelectedStudent(student);
    setFormData({
      email: student.email,
      password: '', // Don't populate password for security
      full_name: student.full_name,
      phone_number: student.phone_number || '',
      role: 'STUDENT'
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = (student) => {
    setSelectedStudent(student);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmitCreate = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleSubmitEdit = (e) => {
    e.preventDefault();
    const submitData = { ...formData };
    if (!submitData.password) delete submitData.password; // Don't update password if empty
    if (!submitData.phone_number) delete submitData.phone_number;
    delete submitData.role; // Can't change role
    updateMutation.mutate({ id: selectedStudent.id, data: submitData });
  };

  const handleConfirmDelete = () => {
    deleteMutation.mutate(selectedStudent.id);
  };

  // Get student stats
  const getStudentStats = (studentId) => {
    const studentEnrollments = enrollments.filter(e => e.student_id === studentId);
    const activeCount = studentEnrollments.filter(e => e.status === 'ACTIVE').length;
    const completedCount = studentEnrollments.filter(e => e.status === 'COMPLETED').length;
    const avgProgress = studentEnrollments.length > 0
      ? studentEnrollments.reduce((sum, e) => sum + (e.current_progress || 0), 0) / studentEnrollments.length
      : 0;
    
    return { total: studentEnrollments.length, active: activeCount, completed: completedCount, avgProgress };
  };

  const columns = [
    {
      header: 'Student Name',
      accessorKey: 'full_name',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
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
      header: 'Enrollments',
      accessorKey: 'enrollments',
      cell: (row) => {
        const stats = getStudentStats(row.id);
        return (
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-500" />
            <span className="font-medium">{stats.total}</span>
            <span className="text-xs text-gray-500">
              ({stats.active} active, {stats.completed} completed)
            </span>
          </div>
        );
      }
    },
    {
      header: 'Avg Progress',
      accessorKey: 'progress',
      cell: (row) => {
        const stats = getStudentStats(row.id);
        return (
          <div className="flex items-center gap-2">
            <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${stats.avgProgress}%` }}
              />
            </div>
            <span className="text-sm font-medium">{Math.round(stats.avgProgress)}%</span>
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
            Student Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage student accounts and track progress
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Student
        </button>
      </div>

      {/* Students Table */}
      <Table
        data={students}
        columns={columns}
        searchable
        searchKeys={['full_name', 'email']}
      />

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Student"
        size="md"
      >
        <StudentForm
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
          setSelectedStudent(null);
          resetForm();
        }}
        title="Edit Student"
        size="md"
      >
        <StudentForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmitEdit}
          onCancel={() => {
            setIsEditModalOpen(false);
            setSelectedStudent(null);
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
          setSelectedStudent(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Student"
        message={`Are you sure you want to delete "${selectedStudent?.full_name}"? This will also affect their enrollments.`}
        confirmText="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

// StudentForm component
const StudentForm = ({ formData, setFormData, onSubmit, onCancel, isLoading, isEdit }) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <Input
      label="Full Name"
      required
      value={formData.full_name}
      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
      placeholder="e.g., John Doe"
    />

    <Input
      label="Email"
      type="email"
      required
      value={formData.email}
      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
      placeholder="student@example.com"
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
        className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {isLoading && (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        )}
        {isLoading ? 'Saving...' : 'Save Student'}
      </button>
    </div>
  </form>
);

export default Students;
