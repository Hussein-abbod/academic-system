import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../utils/api';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { Input, Select, TextArea, Checkbox } from '../../components/ui/forms';

const Courses = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    level_id: '',
    teacher_id: '',
    capacity: 20,
    start_date: '',
    end_date: '',
    price: 0,
    is_active: true
  });

  const queryClient = useQueryClient();

  // Fetch courses
  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: async () => {
      const response = await api.get('/admin/courses');
      return response.data;
    }
  });

  // Fetch levels for dropdown
  const { data: levels = [] } = useQuery({
    queryKey: ['levels'],
    queryFn: async () => {
      const response = await api.get('/admin/levels');
      return response.data;
    }
  });

  // Fetch teachers for dropdown
  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const response = await api.get('/admin/users?role=TEACHER');
      return response.data;
    }
  });

  // Create course mutation
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/admin/courses', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-courses']);
      toast.success('Course created successfully!');
      setIsCreateModalOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to create course');
    }
  });

  // Update course mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/admin/courses/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-courses']);
      toast.success('Course updated successfully!');
      setIsEditModalOpen(false);
      setSelectedCourse(null);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to update course');
    }
  });

  // Delete course mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/admin/courses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-courses']);
      toast.success('Course deleted successfully!');
      setIsDeleteDialogOpen(false);
      setSelectedCourse(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to delete course');
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      level_id: '',
      teacher_id: '',
      capacity: 20,
      start_date: '',
      end_date: '',
      price: 0,
      is_active: true
    });
  };

  const handleCreate = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  const handleEdit = (course) => {
    setSelectedCourse(course);
    setFormData({
      name: course.name,
      description: course.description || '',
      level_id: course.level_id,
      teacher_id: course.teacher_id || '',
      capacity: course.capacity,
      start_date: course.start_date || '',
      end_date: course.end_date || '',
      price: course.price,
      is_active: course.is_active
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = (course) => {
    setSelectedCourse(course);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmitCreate = (e) => {
    e.preventDefault();
    const submitData = { ...formData };
    if (!submitData.teacher_id) delete submitData.teacher_id;
    if (!submitData.start_date) delete submitData.start_date;
    if (!submitData.end_date) delete submitData.end_date;
    createMutation.mutate(submitData);
  };

  const handleSubmitEdit = (e) => {
    e.preventDefault();
    const submitData = { ...formData };
    if (!submitData.teacher_id) delete submitData.teacher_id;
    if (!submitData.start_date) delete submitData.start_date;
    if (!submitData.end_date) delete submitData.end_date;
    updateMutation.mutate({ id: selectedCourse.id, data: submitData });
  };

  const handleConfirmDelete = () => {
    deleteMutation.mutate(selectedCourse.id);
  };

  const columns = [
    {
      header: 'Course Name',
      accessorKey: 'name',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blue-500" />
          <span className="font-medium">{row.name}</span>
        </div>
      )
    },
    {
      header: 'Level',
      accessorKey: 'level.name',
      cell: (row) => (
        <span className="px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium">
          {row.level?.name || 'N/A'}
        </span>
      )
    },
    {
      header: 'Teacher',
      accessorKey: 'teacher_id',
      cell: (row) => {
        const teacher = teachers.find(t => t.id === row.teacher_id);
        return teacher ? teacher.full_name : <span className="text-gray-400">Not assigned</span>;
      }
    },
    {
      header: 'Capacity',
      accessorKey: 'capacity',
      cell: (row) => <span>{row.capacity} students</span>
    },
    {
      header: 'Price',
      accessorKey: 'price',
      cell: (row) => <span className="font-semibold text-green-600 dark:text-green-400">${row.price}</span>
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
            Course Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage all courses and assign teachers
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Course
        </button>
      </div>

      {/* Courses Table */}
      <Table
        data={courses}
        columns={columns}
        searchable
        searchKeys={['name', 'level.name']}
      />

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Course"
        size="lg"
      >
        <CourseForm
          formData={formData}
          setFormData={setFormData}
          levels={levels}
          teachers={teachers}
          onSubmit={handleSubmitCreate}
          onCancel={() => {
            setIsCreateModalOpen(false);
            resetForm();
          }}
          isLoading={createMutation.isPending}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedCourse(null);
          resetForm();
        }}
        title="Edit Course"
        size="lg"
      >
        <CourseForm
          formData={formData}
          setFormData={setFormData}
          levels={levels}
          teachers={teachers}
          onSubmit={handleSubmitEdit}
          onCancel={() => {
            setIsEditModalOpen(false);
            setSelectedCourse(null);
            resetForm();
          }}
          isLoading={updateMutation.isPending}
        />
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedCourse(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Course"
        message={`Are you sure you want to delete "${selectedCourse?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

// CourseForm component moved outside to prevent re-creation on every render
const CourseForm = ({ formData, setFormData, levels, teachers, onSubmit, onCancel, isLoading }) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <Input
      label="Course Name"
      required
      value={formData.name}
      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      placeholder="e.g., Introduction to Python"
    />

    <TextArea
      label="Description"
      value={formData.description}
      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
      placeholder="Course description..."
      rows={3}
    />

    <div className="grid grid-cols-2 gap-4">
      <Select
        label="Level"
        required
        value={formData.level_id}
        onChange={(e) => setFormData({ ...formData, level_id: e.target.value })}
        options={[
          { value: '', label: 'Select Level' },
          ...levels.map(level => ({ value: level.id, label: level.name }))
        ]}
      />

      <Select
        label="Teacher"
        value={formData.teacher_id}
        onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
        options={[
          { value: '', label: 'Not assigned' },
          ...teachers.map(teacher => ({ value: teacher.id, label: teacher.full_name }))
        ]}
      />
    </div>

    <div className="grid grid-cols-2 gap-4">
      <Input
        label="Capacity"
        type="number"
        required
        value={formData.capacity}
        onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
        min="1"
      />

      <Input
        label="Price ($)"
        type="number"
        required
        value={formData.price}
        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
        min="0"
        step="0.01"
      />
    </div>

    <div className="grid grid-cols-2 gap-4">
      <Input
        label="Start Date"
        type="date"
        value={formData.start_date}
        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
      />

      <Input
        label="End Date"
        type="date"
        value={formData.end_date}
        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
      />
    </div>

    <Checkbox
      label="Active"
      checked={formData.is_active}
      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
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
        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {isLoading && (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        )}
        {isLoading ? 'Saving...' : 'Save Course'}
      </button>
    </div>
  </form>
);


export default Courses;
