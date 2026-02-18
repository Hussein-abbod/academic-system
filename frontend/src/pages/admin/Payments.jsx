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
  const { 
    data: payments = [], 
    isLoading: isLoadingPayments,
    isError: isPaymentsError,
    error: paymentsError
  } = useQuery({
    queryKey: ['admin-payments'],
    queryFn: async () => {
      console.log('Fetching payments...');
      const response = await api.get('/admin/payments');
      console.log('Payments fetched:', response.data);
      return response.data;
    }
  });

  // Fetch enrollments for dropdown
  const { 
    data: enrollments = [], 
    isLoading: isLoadingEnrollments 
  } = useQuery({
    queryKey: ['admin-enrollments'],
    queryFn: async () => {
      const response = await api.get('/admin/enrollments');
      console.log('Enrollments fetched:', response.data);
      return response.data;
    }
  });

  // Fetch students
  const { 
    data: students = [], 
    isLoading: isLoadingStudents 
  } = useQuery({
    queryKey: ['admin-students'],
    queryFn: async () => {
      const response = await api.get('/admin/users?role=STUDENT');
      console.log('Students fetched:', response.data);
      return response.data;
    }
  });

  // Fetch courses
  const { 
    data: courses = [], 
    isLoading: isLoadingCourses 
  } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: async () => {
      const response = await api.get('/admin/courses');
      console.log('Courses fetched:', response.data);
      return response.data;
    }
  });

  const isLoading = isLoadingPayments || isLoadingEnrollments || isLoadingStudents || isLoadingCourses;

  if (isPaymentsError) {
    console.error('Error fetching payments:', paymentsError);
    toast.error('Failed to load payments');
  }

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

  // Calculate enrollment summaries
  const enrollmentSummaries = React.useMemo(() => {
    if (!enrollments.length || !students.length || !courses.length) return [];

    return enrollments.map(enrollment => {
      const student = students.find(s => s.id === enrollment.student_id);
      const course = courses.find(c => c.id === enrollment.course_id);
      
      const courseFee = course ? course.price : 0;
      
      // Calculate total paid for this enrollment
      const totalPaid = payments
        .filter(p => p.enrollment_id === enrollment.id && p.payment_status === 'PAID')
        .reduce((sum, p) => sum + p.amount, 0);
      
      const remaining = Math.max(0, courseFee - totalPaid);
      
      let status = 'PENDING';
      if (remaining === 0 && courseFee > 0) status = 'PAID';
      else if (totalPaid > 0) status = 'PARTIAL';

      return {
        id: enrollment.id,
        enrollment_id: enrollment.id, // Keep for compatibility with actions
        studentName: student?.full_name || 'Unknown',
        courseName: course?.name || 'Unknown',
        courseFee,
        totalPaid,
        remaining,
        status,
        student_id: enrollment.student_id,
        course_id: enrollment.course_id
      };
    });
  }, [enrollments, students, courses, payments]);

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
      accessorKey: 'studentName',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white font-semibold text-sm">
            {row.studentName.charAt(0).toUpperCase()}
          </div>
          <span className="font-medium text-gray-900 dark:text-white">
            {row.studentName}
          </span>
        </div>
      )
    },
    {
      header: 'Course',
      accessorKey: 'courseName',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-purple-500" />
          <span className="text-gray-700 dark:text-gray-300">
            {row.courseName}
          </span>
        </div>
      )
    },
    {
      header: 'Total Fee',
      accessorKey: 'courseFee',
      cell: (row) => (
        <div className="flex items-center gap-1">
          <span className="font-medium text-gray-600 dark:text-gray-400">
            ${row.courseFee.toFixed(2)}
          </span>
        </div>
      )
    },
    {
      header: 'Paid',
      accessorKey: 'totalPaid',
      cell: (row) => (
        <div className="flex items-center gap-1">
          <span className="font-medium text-green-600 dark:text-green-400">
            ${row.totalPaid.toFixed(2)}
          </span>
        </div>
      )
    },
    {
      header: 'Remaining',
      accessorKey: 'remaining',
      cell: (row) => (
        <div className="flex items-center gap-1">
          <span className="font-semibold text-blue-600 dark:text-blue-400">
            ${row.remaining.toFixed(2)}
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
        <button
          onClick={() => {
             // Pre-fill form for this enrollment
             setFormData({
               enrollment_id: row.enrollment_id,
               amount: '',
               payment_status: 'PAID',
               notes: ''
             });
             setIsCreateModalOpen(true);
          }}
          disabled={row.remaining <= 0}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          title="Record Payment"
        >
          <DollarSign className="w-4 h-4" />
          Make Payment
        </button>
      )
    }
  ];

  // Calculate global stats from summaries
  const stats = React.useMemo(() => {
    return {
      totalRevenue: enrollmentSummaries.reduce((sum, item) => sum + item.totalPaid, 0),
      totalPending: enrollmentSummaries.reduce((sum, item) => sum + item.remaining, 0),
      fullyPaidCount: enrollmentSummaries.filter(item => item.status === 'PAID').length,
      partialCount: enrollmentSummaries.filter(item => item.status === 'PARTIAL').length
    };
  }, [enrollmentSummaries]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Payment Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track student enrollments and payment status
          </p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm opacity-90">Total Revenue</div>
            <DollarSign className="w-5 h-5" />
          </div>
          <div className="text-3xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
          <div className="text-xs opacity-75 mt-1">Collected across all courses</div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Outstanding Amount</div>
          <div className="text-2xl font-bold text-yellow-600">${stats.totalPending.toFixed(2)}</div>
          <div className="text-xs text-gray-500 mt-1">Pending payments</div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Fully Paid</div>
          <div className="text-2xl font-bold text-green-600">{stats.fullyPaidCount}</div>
          <div className="text-xs text-gray-500 mt-1">Enrollments completed</div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Partial</div>
          <div className="text-2xl font-bold text-orange-600">{stats.partialCount}</div>
          <div className="text-xs text-gray-500 mt-1">Enrollments in progress</div>
        </div>
      </div>

      {/* Enrollments Table */}
      <Table
        data={enrollmentSummaries}
        columns={columns}
        searchable
        searchKeys={['studentName', 'courseName']}
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
          payments={payments}
          onSubmit={handleSubmitCreate}
          onCancel={() => {
            setIsCreateModalOpen(false);
            resetForm();
          }}
          isLoading={createMutation.isPending}
        />
      </Modal>
    </div>
  );
};

// PaymentForm component
const PaymentForm = ({ 
  formData, 
  setFormData, 
  enrollments, 
  students, 
  courses, 
  payments,
  onSubmit, 
  onCancel, 
  isLoading 
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [validationError, setValidationError] = useState('');

  // Initialize selected student from formData (if pre-filled)
  React.useEffect(() => {
    if (formData.enrollment_id) {
      const enrollment = enrollments.find(e => e.id === formData.enrollment_id);
      if (enrollment) {
        setSelectedStudentId(enrollment.student_id);
      }
    }
  }, [formData.enrollment_id, enrollments]);

  // Derived state for financial summary
  const selectedEnrollment = enrollments.find(e => e.id === formData.enrollment_id);
  const selectedCourse = selectedEnrollment ? courses.find(c => c.id === selectedEnrollment.course_id) : null;
  
  const courseFee = selectedCourse ? selectedCourse.price : 0;
  
  // Calculate already paid amount
  const alreadyPaid = React.useMemo(() => {
    if (!formData.enrollment_id) return 0;
    
    return payments
      .filter(p => 
        p.enrollment_id === formData.enrollment_id && 
        p.payment_status === 'PAID'
      )
      .reduce((sum, p) => sum + p.amount, 0);
  }, [payments, formData.enrollment_id]);

  const remainingBalance = Math.max(0, courseFee - alreadyPaid);

  // Validate amount against remaining balance
  React.useEffect(() => {
    if (formData.amount && parseFloat(formData.amount) > remainingBalance) {
      setValidationError(`Amount exceeds remaining balance of $${remainingBalance.toFixed(2)}`);
    } else {
      setValidationError('');
    }
  }, [formData.amount, remainingBalance]);

  // Filter enrollments for the selected student
  const studentEnrollments = React.useMemo(() => {
    if (!selectedStudentId) return [];
    return enrollments.filter(e => e.student_id === selectedStudentId);
  }, [selectedStudentId, enrollments]);

  // Get course name helper
  const getCourseName = (courseId) => {
    const course = courses.find(c => c.id === courseId);
    return course ? course.name : 'Unknown Course';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (parseFloat(formData.amount) > remainingBalance) {
      return; 
    }
    // Force status to PAID
    setFormData(prev => ({ ...prev, payment_status: 'PAID' }));
    onSubmit(e);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Student Selection */}
      <Select
        label="Student"
        required
        value={selectedStudentId}
        onChange={(e) => {
          setSelectedStudentId(e.target.value);
          setFormData({ ...formData, enrollment_id: '' });
        }}
        options={[
          { value: '', label: 'Select Student' },
          ...students.map(student => ({
            value: student.id,
            label: student.full_name
          }))
        ]}
      />

      {/* Course Selection (Filtered by Student) */}
      <Select
        label="Course"
        required
        value={formData.enrollment_id}
        onChange={(e) => setFormData({ ...formData, enrollment_id: e.target.value })}
        options={[
          { value: '', label: 'Select Course' },
          ...studentEnrollments.map(enrollment => ({
            value: enrollment.id,
            label: getCourseName(enrollment.course_id)
          }))
        ]}
        disabled={!selectedStudentId}
      />

      {/* Payment Summary */}
      {selectedCourse && (
        <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Total Course Fee:</span>
            <span className="font-semibold text-gray-900 dark:text-white">${courseFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Already Paid:</span>
            <span className="font-semibold text-green-600">${alreadyPaid.toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t border-gray-200 dark:border-slate-700 pt-2 mt-2">
            <span className="font-medium text-gray-900 dark:text-white">Remaining Balance:</span>
            <span className="font-bold text-blue-600">${remainingBalance.toFixed(2)}</span>
          </div>
        </div>
      )}

      <div className="space-y-1">
        <Input
          label="Payment Amount ($)"
          type="number"
          required
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          min="0"
          max={remainingBalance}
          step="0.01"
          placeholder="0.00"
          className={validationError ? "border-red-500 focus:ring-red-500" : ""}
        />
        {validationError && (
          <p className="text-xs text-red-500">{validationError}</p>
        )}
      </div>

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
          disabled={isLoading || !!validationError}
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
