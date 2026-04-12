import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, UserCheck, BookOpen, TrendingUp, Bot } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../utils/api';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';

import { Input, Select } from '../../components/ui/forms';
import SearchableSelect from '../../components/ui/SearchableSelect';

const Enrollments = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [aiFormData, setAiFormData] = useState({
    student_id: '',
    level: 'BASIC',
    daily_minutes_limit: 60,
    monthly_fee: 0
  });
  const [formData, setFormData] = useState({
    student_id: '',
    course_id: '',
    status: 'ACTIVE'
  });

  const queryClient = useQueryClient();

  // Fetch ai subscriptions to enable auto-filling form
  const { data: aiSubscriptions = [] } = useQuery({
    queryKey: ['admin-ai-subscriptions'],
    queryFn: async () => {
      const response = await api.get('/admin/ai-advisor/subscriptions');
      return response.data;
    }
  });

  // Fetch enrollments
  const { data: rawEnrollments = [], isLoading } = useQuery({
    queryKey: ['admin-enrollments'],
    queryFn: async () => {
      const response = await api.get('/admin/enrollments');
      return response.data;
    }
  });

  // Fetch students for dropdown
  const { data: students = [] } = useQuery({
    queryKey: ['admin-students'],
    queryFn: async () => {
      const response = await api.get('/admin/users?role=STUDENT');
      return response.data;
    }
  });

  // Fetch courses for dropdown
  const { data: courses = [] } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: async () => {
      const response = await api.get('/admin/courses');
      return response.data;
    }
  });

  // Add computed fields for search (only when students and courses are loaded)
  const enrollments = React.useMemo(() => {
    if (!students.length || !courses.length) return rawEnrollments;
    
    const standardEnrollments = rawEnrollments.map(enrollment => {
      const student = students.find(s => s.id === enrollment.student_id);
      const course = courses.find(c => c.id === enrollment.course_id);
      
      return {
        ...enrollment,
        student_name: student?.full_name || 'Unknown',
        course_name: course?.name || 'Unknown',
        isAi: false
      };
    });

    const aiEnrollments = aiSubscriptions.filter(sub => sub.is_active).map(sub => {
      const student = students.find(s => s.id === sub.student_id);
      return {
        id: `ai_${sub.student_id}`,
        student_id: sub.student_id,
        course_id: 'AI_ADVISOR',
        status: 'ACTIVE',
        student_name: student?.full_name || 'Unknown',
        course_name: 'AI Advisor',
        isAi: true
      };
    });

    return [...standardEnrollments, ...aiEnrollments];
  }, [rawEnrollments, students, courses, aiSubscriptions]);

  // Create enrollment mutation
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/admin/enrollments', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-enrollments']);
      toast.success('Student enrolled successfully!');
      setIsCreateModalOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to enroll student');
    }
  });

  // Update enrollment mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/admin/enrollments/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-enrollments']);
      toast.success('Enrollment updated successfully!');
      setIsEditModalOpen(false);
      setSelectedEnrollment(null);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to update enrollment');
    }
  });

  // Revoke AI mutation
  const aiUnsubscribeMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/admin/ai-advisor/unsubscribe/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-ai-subscriptions']);
      queryClient.invalidateQueries(['admin-students']);
      toast.success('AI Access revoked successfully!');
      setIsAiModalOpen(false);
      resetAiForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to revoke AI access');
    }
  });

  const handleAiRevoke = () => {
    if (aiFormData.student_id) {
       aiUnsubscribeMutation.mutate(aiFormData.student_id);
    }
  };

  // Assign AI mutation
  const assignAiMutation = useMutation({
    mutationFn: async (data) => {
      const { student_id, ...payload } = data;
      const response = await api.post(`/admin/ai-advisor/subscribe/${student_id}`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-students']);
      toast.success('AI Advisor assigned successfully!');
      setIsAiModalOpen(false);
      resetAiForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to assign AI Advisor');
    }
  });



  const resetForm = () => {
    setFormData({
      student_id: '',
      course_id: '',
      status: 'ACTIVE'
    });
  };

  const resetAiForm = () => {
    setAiFormData({
      student_id: '',
      level: 'BASIC',
      daily_minutes_limit: 60,
      monthly_fee: 0
    });
  };

  const handleCreate = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  const handleAiCreate = () => {
    resetAiForm();
    setIsAiModalOpen(true);
  };

  const handleEdit = (enrollment) => {
    setSelectedEnrollment(enrollment);
    setFormData({
      student_id: enrollment.student_id,
      course_id: enrollment.course_id,
      status: enrollment.status
    });
    setIsEditModalOpen(true);
  };



  const handleSubmitCreate = (e) => {
    e.preventDefault();
    // Backend only accepts student_id and course_id for creation
    const submitData = {
      student_id: formData.student_id,
      course_id: formData.course_id
    };
    createMutation.mutate(submitData);
  };

  const handleSubmitEdit = (e) => {
    e.preventDefault();
    // Backend only accepts status for updates (progress removed)
    const submitData = {
      status: formData.status
    };
    updateMutation.mutate({ id: selectedEnrollment.id, data: submitData });
  };

  const handleSubmitAiCreate = (e) => {
    e.preventDefault();
    assignAiMutation.mutate(aiFormData);
  };



  // Get student name
  const getStudentName = (studentId) => {
    const student = students.find(s => s.id === studentId);
    return student?.full_name || 'Unknown';
  };

  // Get course name
  const getCourseName = (courseId) => {
    const course = courses.find(c => c.id === courseId);
    return course?.name || 'Unknown';
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
      case 'COMPLETED':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case 'DROPPED':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  };

  const columns = [
    {
      header: 'Student',
      accessorKey: 'student_id',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-blue-500" />
          <span className="font-medium text-gray-900 dark:text-white">
            {getStudentName(row.student_id)}
          </span>
        </div>
      )
    },
    {
      header: 'Course',
      accessorKey: 'course_name',
      cell: (row) => (
        <div className="flex items-center gap-2">
          {row.isAi ? <Bot className="w-5 h-5 text-indigo-500" /> : <BookOpen className="w-4 h-4 text-purple-500" />}
          <span className={`text-gray-700 dark:text-gray-300 ${row.isAi ? 'font-bold' : ''}`}>
            {row.course_name}
          </span>
        </div>
      )
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(row.status)}`}>
          {row.status}
        </span>
      )
    },
    {
      header: 'Actions',
      accessorKey: 'actions',
      cell: (row) => (
        <div className="flex items-center gap-2">
          {row.isAi ? (
            <button
              onClick={() => {
                 const existingSub = aiSubscriptions.find(s => s.student_id === row.student_id);
                 if (existingSub) {
                   setAiFormData({
                     student_id: row.student_id,
                     level: existingSub.level,
                     daily_minutes_limit: existingSub.daily_minutes_limit,
                     monthly_fee: existingSub.monthly_fee
                   });
                   setIsAiModalOpen(true);
                 }
              }}
              className="p-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 transition-colors"
              title="Edit AI Subscription"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => handleEdit(row)}
              className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-colors"
              title="Edit"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )
    }
  ];

  // Calculate statistics
  const stats = {
    total: enrollments.length,
    active: enrollments.filter(e => e.status === 'ACTIVE').length,
    completed: enrollments.filter(e => e.status === 'COMPLETED').length,
    dropped: enrollments.filter(e => e.status === 'DROPPED').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Enrollment Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage student enrollments and track progress
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleAiCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
          >
            <Bot className="w-5 h-5" />
            Assign AI Advisor
          </button>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            <Plus className="w-5 h-5" />
            Enroll Student
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Enrollments</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active</div>
          <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Completed</div>
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Dropped</div>
          <div className="text-2xl font-bold text-red-600">{stats.dropped}</div>
        </div>
      </div>

      {/* Enrollments Table */}
      <Table
        data={enrollments}
        columns={columns}
        searchable
        searchKeys={['student_name', 'course_name', 'status']}
      />

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Enroll Student in Course"
        size="md"
      >
        <EnrollmentForm
          formData={formData}
          setFormData={setFormData}
          students={students}
          courses={courses}
          enrollments={enrollments} // Pass enrollments to filtering logic
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
          setSelectedEnrollment(null);
          resetForm();
        }}
        title="Edit Enrollment"
        size="md"
      >
        <EnrollmentForm
          formData={formData}
          setFormData={setFormData}
          students={students}
          courses={courses}
          onSubmit={handleSubmitEdit}
          onCancel={() => {
            setIsEditModalOpen(false);
            setSelectedEnrollment(null);
            resetForm();
          }}
          isLoading={updateMutation.isPending}
          isEdit={true}
        />
      </Modal>

      {/* AI Advisor Modal */}
      <Modal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        title="Assign AI Advisor"
        size="md"
      >
        <AiAdvisorForm
          formData={aiFormData}
          setFormData={setAiFormData}
          students={students}
          aiSubscriptions={aiSubscriptions}
          onSubmit={handleSubmitAiCreate}
          onRevoke={handleAiRevoke}
          isRevoking={aiUnsubscribeMutation.isPending}
          onCancel={() => {
            setIsAiModalOpen(false);
            resetAiForm();
          }}
          isLoading={assignAiMutation.isPending}
        />
      </Modal>


    </div>
  );
};

// EnrollmentForm component
const EnrollmentForm = ({ formData, setFormData, students, courses, enrollments = [], onSubmit, onCancel, isLoading, isEdit }) => {
  
  // Filter courses that the selected student is already enrolled in
  const availableCourses = React.useMemo(() => {
    if (isEdit || !formData.student_id) return courses;
    
    const enrolledCourseIds = enrollments
      .filter(e => e.student_id === formData.student_id)
      .map(e => e.course_id);
      
    return courses.filter(course => !enrolledCourseIds.includes(course.id));
  }, [courses, enrollments, formData.student_id, isEdit]);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {!isEdit && (
        <>
          <SearchableSelect
            label="Student"
            required
            value={formData.student_id}
            onChange={(value) => setFormData({ ...formData, student_id: value, course_id: '' })}
            options={students.map(student => ({ value: student.id, label: student.full_name }))}
            placeholder="Select or search student..."
          />

          <Select
            label="Course"
            required
            value={formData.course_id}
            onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
            options={[
              { value: '', label: 'Select Course' },
              ...availableCourses.map(course => ({ value: course.id, label: course.name }))
            ]}
            disabled={!formData.student_id}
          />
        </>
      )}

      {isEdit && (
        <Select
          label="Status"
          required
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          options={[
            { value: 'ACTIVE', label: 'Active' },
            { value: 'COMPLETED', label: 'Completed' },
            { value: 'DROPPED', label: 'Dropped' }
          ]}
        />
      )}

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
          {isLoading ? 'Saving...' : (isEdit ? 'Update Enrollment' : 'Enroll Student')}
        </button>
      </div>
    </form>
  );
};

const AiAdvisorForm = ({ formData, setFormData, students, aiSubscriptions = [], onSubmit, onRevoke, onCancel, isLoading, isRevoking }) => {
  const handleStudentChange = (studentId) => {
    const existingSub = aiSubscriptions.find(sub => sub.student_id === studentId);
    if (existingSub) {
      setFormData({
        ...formData,
        student_id: studentId,
        level: existingSub.level,
        daily_minutes_limit: existingSub.daily_minutes_limit,
        monthly_fee: existingSub.monthly_fee
      });
    } else {
      setFormData({
        ...formData,
        student_id: studentId,
        level: 'BASIC',
        daily_minutes_limit: 60,
        monthly_fee: 0
      });
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <SearchableSelect
        label="Student"
        required
        value={formData.student_id}
        onChange={handleStudentChange}
        options={students.map(student => ({ value: student.id, label: student.full_name }))}
        placeholder="Select or search student..."
      />

      {formData.student_id && aiSubscriptions.some(sub => sub.student_id === formData.student_id && sub.is_active) && (
         <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm rounded-lg border border-indigo-100 dark:border-indigo-800 flex items-center gap-2">
           <Bot className="w-5 h-5 shrink-0" />
           <span>This student already has an active AI Advisor subscription. Submitting this will update their settings!</span>
         </div>
      )}

      <Select
        label="Proficiency Level"
        required
        value={formData.level}
        onChange={(e) => setFormData({ ...formData, level: e.target.value })}
        options={[
          { value: 'BASIC', label: 'Basic' },
          { value: 'INTERMEDIATE', label: 'Intermediate' },
          { value: 'ADVANCED', label: 'Advanced' }
        ]}
      />

      <Input
        label="Daily Minutes Limit"
        type="number"
        required
        min="10"
        max="300"
        value={formData.daily_minutes_limit}
        onChange={(e) => setFormData({ ...formData, daily_minutes_limit: parseInt(e.target.value) })}
      />

      <Input
        label="Monthly Fee ($)"
        type="number"
        required
        min="0"
        step="0.01"
        value={formData.monthly_fee}
        onChange={(e) => setFormData({ ...formData, monthly_fee: parseFloat(e.target.value) })}
      />

      <div className="flex justify-between pt-4">
        {formData.student_id && aiSubscriptions.some(sub => sub.student_id === formData.student_id && sub.is_active) ? (
          <button
            type="button"
            onClick={onRevoke}
            disabled={isRevoking}
            className="px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 transition-colors"
          >
            {isRevoking ? 'Revoking...' : 'Revoke Access'}
          </button>
        ) : (
          <div></div>
        )}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            disabled={isLoading || isRevoking}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || isRevoking}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            {isLoading ? 'Saving...' : 'Assign AI Advisor'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default Enrollments;
