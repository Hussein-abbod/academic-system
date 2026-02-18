import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Layers, TrendingUp, Award } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../utils/api';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { Input, TextArea } from '../../components/ui/forms';

const Levels = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    order: 1,
    passing_score: 70
  });

  const queryClient = useQueryClient();

  // Fetch levels
  const { data: levels = [], isLoading } = useQuery({
    queryKey: ['admin-levels'],
    queryFn: async () => {
      const response = await api.get('/admin/levels');
      return response.data;
    }
  });

  // Fetch courses to count per level
  const { data: courses = [] } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: async () => {
      const response = await api.get('/admin/courses');
      return response.data;
    }
  });

  // Add course count to levels
  const levelsWithCourseCount = React.useMemo(() => {
    return levels.map(level => ({
      ...level,
      course_count: courses.filter(c => c.level_id === level.id).length
    }));
  }, [levels, courses]);

  // Create level mutation
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/admin/levels', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-levels']);
      toast.success('Level created successfully!');
      setIsCreateModalOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to create level');
    }
  });

  // Update level mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/admin/levels/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-levels']);
      toast.success('Level updated successfully!');
      setIsEditModalOpen(false);
      setSelectedLevel(null);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to update level');
    }
  });

  // Delete level mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/admin/levels/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-levels']);
      toast.success('Level deleted successfully!');
      setIsDeleteDialogOpen(false);
      setSelectedLevel(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to delete level');
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      order: 1,
      passing_score: 70
    });
  };

  const handleCreate = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  const handleEdit = (level) => {
    setSelectedLevel(level);
    setFormData({
      name: level.name,
      description: level.description || '',
      order: level.order,
      passing_score: level.passing_score || 70
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = (level) => {
    setSelectedLevel(level);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmitCreate = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleSubmitEdit = (e) => {
    e.preventDefault();
    updateMutation.mutate({ id: selectedLevel.id, data: formData });
  };

  const handleConfirmDelete = () => {
    deleteMutation.mutate(selectedLevel.id);
  };

  const columns = [
    {
      header: 'Order',
      accessorKey: 'order',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{row.order}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Level Name',
      accessorKey: 'name',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-500" />
          <span className="font-medium text-gray-900 dark:text-white">{row.name}</span>
        </div>
      )
    },
    {
      header: 'Description',
      accessorKey: 'description',
      cell: (row) => (
        <span className="text-gray-600 dark:text-gray-400 line-clamp-1">
          {row.description || 'No description'}
        </span>
      )
    },
    {
      header: 'Passing Score',
      accessorKey: 'passing_score',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-yellow-500" />
          <span className="font-medium">{row.passing_score || 'N/A'}%</span>
        </div>
      )
    },
    {
      header: 'Courses',
      accessorKey: 'course_count',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-500" />
          <span className="font-medium">{row.course_count || 0}</span>
        </div>
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

  // Calculate statistics
  const stats = {
    total: levels.length,
    totalCourses: courses.length,
    avgPassingScore: levels.length > 0 
      ? Math.round(levels.reduce((sum, l) => sum + (l.passing_score || 0), 0) / levels.length)
      : 0
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Level Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage course difficulty levels and progression
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Level
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Levels</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Courses</div>
          <div className="text-2xl font-bold text-blue-600">{stats.totalCourses}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Avg Passing Score</div>
          <div className="text-2xl font-bold text-green-600">{stats.avgPassingScore}%</div>
        </div>
      </div>

      {/* Levels Table */}
      <Table
        data={levelsWithCourseCount}
        columns={columns}
        searchable
        searchKeys={['name', 'description']}
      />

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Level"
        size="md"
      >
        <form onSubmit={handleSubmitCreate} className="space-y-4">
          <Input
            label="Level Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Beginner, Intermediate, Advanced"
            required
          />
          
          <TextArea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe this level..."
            rows={3}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Order"
              type="number"
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
              min="1"
              required
            />
            
            <Input
              label="Passing Score (%)"
              type="number"
              value={formData.passing_score}
              onChange={(e) => setFormData({ ...formData, passing_score: parseFloat(e.target.value) })}
              min="0"
              max="100"
              step="0.1"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsCreateModalOpen(false);
                resetForm();
              }}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Level'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedLevel(null);
          resetForm();
        }}
        title="Edit Level"
        size="md"
      >
        <form onSubmit={handleSubmitEdit} className="space-y-4">
          <Input
            label="Level Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Beginner, Intermediate, Advanced"
            required
          />
          
          <TextArea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe this level..."
            rows={3}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Order"
              type="number"
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
              min="1"
              required
            />
            
            <Input
              label="Passing Score (%)"
              type="number"
              value={formData.passing_score}
              onChange={(e) => setFormData({ ...formData, passing_score: parseFloat(e.target.value) })}
              min="0"
              max="100"
              step="0.1"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedLevel(null);
                resetForm();
              }}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50"
            >
              {updateMutation.isPending ? 'Updating...' : 'Update Level'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedLevel(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Level"
        message={
          selectedLevel?.course_count > 0
            ? `This level has ${selectedLevel.course_count} course(s) associated with it. Deleting it may affect those courses. Are you sure you want to continue?`
            : `Are you sure you want to delete "${selectedLevel?.name}"? This action cannot be undone.`
        }
        confirmText="Delete"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default Levels;
