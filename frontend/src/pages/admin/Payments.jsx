import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, DollarSign, CreditCard, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../utils/api';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import { Input, Select, TextArea } from '../../components/ui/forms';

const Payments = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [formData, setFormData] = useState({
    enrollment_id: '',
    amount: '',
    payment_status: 'PENDING',
    notes: ''
  });

  const queryClient = useQueryClient();

  // Fetch payments
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['admin-payments'],
    queryFn: async () => {
      const response = await api.get('/admin/payments');
      return response.data;
    }
  });

  // Fetch enrollments for dropdown
  const { data: enrollments = [] } = useQuery({
    queryKey: ['admin-enrollments'],
    queryFn: async () => {
      const response = await api.get('/admin/enrollments');
      return response.data;
    }
  });

  // Fetch students
  const { data: students = [] } = useQuery({
    queryKey: ['admin-students'],
    queryFn: async () => {
      const response = await api.get('/admin/users?role=STUDENT');
      return response.data;
    }
  });

  // Fetch courses
  const { data: courses = [] } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: async () => {
      const response = await api.get('/admin/courses');
      return response.data;
    }
  });

  // Create payment mutation
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/admin/payments', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-payments']);
      toast.success('Payment recorded successfully!');
      setIsCreateModalOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to record payment');
    }
  });

  // Update payment mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/admin/payments/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-payments']);
      toast.success('Payment updated successfully!');
      setIsEditModalOpen(false);
      setSelectedPayment(null);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to update payment');
    }
  });

  const resetForm = () => {
    setFormData({
      enrollment_id: '',
      amount: '',
      payment_status: 'PENDING',
      notes: ''
    });
  };

  const handleCreate = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  const handleEdit = (payment) => {
    setSelectedPayment(payment);
    setFormData({
      enrollment_id: payment.enrollment_id,
      amount: payment.amount,
      payment_status: payment.payment_status,
      notes: payment.notes || ''
    });
    setIsEditModalOpen(true);
  };

  const handleSubmitCreate = (e) => {
    e.preventDefault();
    const submitData = { ...formData };
    if (!submitData.notes) delete submitData.notes;
    createMutation.mutate(submitData);
  };

  const handleSubmitEdit = (e) => {
    e.preventDefault();
    const submitData = { ...formData };
    delete submitData.enrollment_id; // Can't change enrollment
    if (!submitData.notes) delete submitData.notes;
    updateMutation.mutate({ id: selectedPayment.id, data: submitData });
  };

  // Get enrollment details
  const getEnrollmentDetails = (enrollmentId) => {
    const enrollment = enrollments.find(e => e.id === enrollmentId);
    if (!enrollment) return { studentName: 'Unknown', courseName: 'Unknown' };
    
    const student = students.find(s => s.id === enrollment.student_id);
    const course = courses.find(c => c.id === enrollment.course_id);
    
    return {
      studentName: student?.full_name || 'Unknown',
      courseName: course?.name || 'Unknown'
    };
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case 'PENDING':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
      case 'PARTIAL':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  };

  const columns = [
    {
      header: 'Student',
      accessorKey: 'enrollment_id',
      cell: (row) => {
        const details = getEnrollmentDetails(row.enrollment_id);
        return (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white font-semibold text-sm">
              {details.studentName.charAt(0).toUpperCase()}
            </div>
            <span className="font-medium text-gray-900 dark:text-white">
              {details.studentName}
            </span>
          </div>
        );
      }
    },
    {
      header: 'Course',
      accessorKey: 'course',
      cell: (row) => {
        const details = getEnrollmentDetails(row.enrollment_id);
        return (
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-purple-500" />
            <span className="text-gray-700 dark:text-gray-300">
              {details.courseName}
            </span>
          </div>
        );
      }
    },
    {
      header: 'Amount',
      accessorKey: 'amount',
      cell: (row) => (
        <div className="flex items-center gap-1">
          <DollarSign className="w-4 h-4 text-green-600" />
          <span className="font-semibold text-green-600 dark:text-green-400">
            {row.amount.toFixed(2)}
          </span>
        </div>
      )
    },
    {
      header: 'Status',
      accessorKey: 'payment_status',
      cell: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(row.payment_status)}`}>
          {row.payment_status}
        </span>
      )
    },
    {
      header: 'Payment Date',
      accessorKey: 'payment_date',
      cell: (row) => row.payment_date ? (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {new Date(row.payment_date).toLocaleDateString()}
        </span>
      ) : (
        <span className="text-gray-400 text-sm">Not paid</span>
      )
    },
    {
      header: 'Notes',
      accessorKey: 'notes',
      cell: (row) => row.notes ? (
        <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-xs block">
          {row.notes}
        </span>
      ) : (
        <span className="text-gray-400 text-sm">-</span>
      )
    },
    {
      header: 'Actions',
      accessorKey: 'actions',
      cell: (row) => (
        <button
          onClick={() => handleEdit(row)}
          className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-colors"
          title="Edit"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      )
    }
  ];

  // Calculate statistics
  const stats = {
    total: payments.reduce((sum, p) => sum + p.amount, 0),
    paid: payments.filter(p => p.payment_status === 'PAID').reduce((sum, p) => sum + p.amount, 0),
    pending: payments.filter(p => p.payment_status === 'PENDING').reduce((sum, p) => sum + p.amount, 0),
    partial: payments.filter(p => p.payment_status === 'PARTIAL').reduce((sum, p) => sum + p.amount, 0),
    count: {
      total: payments.length,
      paid: payments.filter(p => p.payment_status === 'PAID').length,
      pending: payments.filter(p => p.payment_status === 'PENDING').length,
      partial: payments.filter(p => p.payment_status === 'PARTIAL').length
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Payment Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track and manage student payments
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors"
        >
          <Plus className="w-5 h-5" />
          Record Payment
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm opacity-90">Total Revenue</div>
            <DollarSign className="w-5 h-5" />
          </div>
          <div className="text-3xl font-bold">${stats.total.toFixed(2)}</div>
          <div className="text-xs opacity-75 mt-1">{stats.count.total} payments</div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Paid</div>
          <div className="text-2xl font-bold text-green-600">${stats.paid.toFixed(2)}</div>
          <div className="text-xs text-gray-500 mt-1">{stats.count.paid} payments</div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Pending</div>
          <div className="text-2xl font-bold text-yellow-600">${stats.pending.toFixed(2)}</div>
          <div className="text-xs text-gray-500 mt-1">{stats.count.pending} payments</div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Partial</div>
          <div className="text-2xl font-bold text-orange-600">${stats.partial.toFixed(2)}</div>
          <div className="text-xs text-gray-500 mt-1">{stats.count.partial} payments</div>
        </div>
      </div>

      {/* Payments Table */}
      <Table
        data={payments}
        columns={columns}
        searchable
        searchKeys={['enrollment_id', 'amount']}
      />

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Record New Payment"
        size="md"
      >
        <PaymentForm
          formData={formData}
          setFormData={setFormData}
          enrollments={enrollments}
          students={students}
          courses={courses}
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
          setSelectedPayment(null);
          resetForm();
        }}
        title="Edit Payment"
        size="md"
      >
        <PaymentForm
          formData={formData}
          setFormData={setFormData}
          enrollments={enrollments}
          students={students}
          courses={courses}
          onSubmit={handleSubmitEdit}
          onCancel={() => {
            setIsEditModalOpen(false);
            setSelectedPayment(null);
            resetForm();
          }}
          isLoading={updateMutation.isPending}
          isEdit={true}
        />
      </Modal>
    </div>
  );
};

// PaymentForm component
const PaymentForm = ({ formData, setFormData, enrollments, students, courses, onSubmit, onCancel, isLoading, isEdit }) => {
  // Get enrollment label
  const getEnrollmentLabel = (enrollmentId) => {
    const enrollment = enrollments.find(e => e.id === enrollmentId);
    if (!enrollment) return 'Unknown';
    
    const student = students.find(s => s.id === enrollment.student_id);
    const course = courses.find(c => c.id === enrollment.course_id);
    
    return `${student?.full_name || 'Unknown'} - ${course?.name || 'Unknown'}`;
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Select
        label="Enrollment"
        required
        value={formData.enrollment_id}
        onChange={(e) => setFormData({ ...formData, enrollment_id: e.target.value })}
        options={[
          { value: '', label: 'Select Enrollment' },
          ...enrollments.map(enrollment => ({
            value: enrollment.id,
            label: getEnrollmentLabel(enrollment.id)
          }))
        ]}
        disabled={isEdit}
      />

      <Input
        label="Amount ($)"
        type="number"
        required
        value={formData.amount}
        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
        min="0"
        step="0.01"
        placeholder="0.00"
      />

      <Select
        label="Payment Status"
        required
        value={formData.payment_status}
        onChange={(e) => setFormData({ ...formData, payment_status: e.target.value })}
        options={[
          { value: 'PENDING', label: 'Pending' },
          { value: 'PAID', label: 'Paid' },
          { value: 'PARTIAL', label: 'Partial' }
        ]}
      />

      <TextArea
        label="Notes (optional)"
        value={formData.notes}
        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        placeholder="Additional notes about this payment..."
        rows={3}
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
          className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading && (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          )}
          {isLoading ? 'Saving...' : 'Save Payment'}
        </button>
      </div>
    </form>
  );
};

export default Payments;
