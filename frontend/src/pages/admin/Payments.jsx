import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { Plus, DollarSign, CreditCard, Calendar, User, ChevronRight, X } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../utils/api';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import { Input, Select, TextArea } from '../../components/ui/forms';

// Helper to calculate month difference
const differenceInMonths = (d1, d2) => {
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  let months = (date1.getFullYear() - date2.getFullYear()) * 12;
  months -= date2.getMonth();
  months += date1.getMonth();
  return months <= 0 ? 0 : months;
};

const SEARCH_KEYS = ['studentName'];

const Payments = () => {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [maxAmount, setMaxAmount] = useState(0);
  
  const [formData, setFormData] = useState({
    enrollment_id: '',
    amount: '',
    payment_status: 'PENDING',
    notes: ''
  });

  const queryClient = useQueryClient();

  // Fetch Data
  const { data: payments = [], isLoading: pLoading } = useQuery({
    queryKey: ['admin-payments'],
    queryFn: async () => (await api.get('/admin/payments')).data
  });

  const { data: enrollments = [], isLoading: eLoading } = useQuery({
    queryKey: ['admin-enrollments'],
    queryFn: async () => (await api.get('/admin/enrollments')).data
  });

  const { data: students = [], isLoading: sLoading } = useQuery({
    queryKey: ['admin-students'],
    queryFn: async () => (await api.get('/admin/users?role=STUDENT')).data
  });

  const { data: courses = [], isLoading: cLoading } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: async () => (await api.get('/admin/courses')).data
  });

  const isLoading = pLoading || eLoading || sLoading || cLoading;

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data) => (await api.post('/admin/payments', data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-payments']);
      toast.success('Payment recorded successfully!');
      setIsPaymentModalOpen(false);
      resetForm();
    },
    onError: (error) => toast.error(error.response?.data?.detail || 'Failed to record payment')
  });

  const resetForm = () => {
    setFormData({ enrollment_id: '', amount: '', payment_status: 'PENDING', notes: '' });
  };

  // --- Logic: Calculate Financials per Enrollment ---
  const enrollmentFinancials = useMemo(() => {
    if (!Array.isArray(enrollments) || !enrollments.length || !Array.isArray(courses) || !courses.length || !Array.isArray(students) || !students.length || !Array.isArray(payments)) return [];

    return enrollments.map(enrollment => {
      const course = courses.find(c => c.id === enrollment.course_id);
      const student = students.find(s => s.id === enrollment.student_id);
      
      if (!course || !student) return null;

      // 1. Calculate Months Enrolled
      // Enrollment date to Now
      // If enrolled today, count as 1 month due immediately (or 0 if postpaid, assuming prepaid here: 1st month due on signup)
      const enrollmentDate = new Date(enrollment.enrollment_date);
      const now = new Date();
      
      // Logic: Months passed since enrollment + 1 for current month
      const monthsEnrolled = differenceInMonths(now, enrollmentDate) + 1;
      
      // 2. Calculate Total Expected
      const monthlyPrice = course.price; // Reusing price field
      const totalExpected = monthsEnrolled * monthlyPrice;

      // 3. Calculate Total Paid
      const totalPaid = payments
        .filter(p => p.enrollment_id === enrollment.id && p.payment_status === 'PAID')
        .reduce((sum, p) => sum + p.amount, 0);

      const balance = totalExpected - totalPaid;
      
      let status = 'UP TO DATE';
      if (balance > 0) status = 'OVERDUE';
      if (balance > monthlyPrice) status = 'SERIOUSLY OVERDUE'; // More than 1 month behind

      return {
        ...enrollment,
        studentName: student.full_name || 'Unknown Student',
        courseName: course.name || 'Unknown Course',
        monthlyPrice,
        enrollmentDate,
        monthsEnrolled,
        totalExpected,
        totalPaid,
        balance: isNaN(balance) ? 0 : balance,
        status,
        course // Include course object for details
      };
    }).filter(Boolean);
  }, [enrollments, courses, students, payments]);

  // Group by Student for the Main Table
  const studentSummaries = useMemo(() => {
    const map = new Map();
    
    enrollmentFinancials.forEach(item => {
      if (!map.has(item.student_id)) {
        map.set(item.student_id, {
          student_id: item.student_id,
          studentName: item.studentName,
          totalCourses: 0,
          totalBalance: 0,
          status: 'GOOD',
          enrollments: []
        });
      }
      const summary = map.get(item.student_id);
      summary.totalCourses += 1;
      summary.totalBalance += item.balance;
      summary.enrollments.push(item);
      
      // If any course is overdue, mark student as overdue
      if (item.balance > 0) summary.status = 'OWING';
    });
    
    return Array.from(map.values());
  }, [enrollmentFinancials]);

  // --- Handlers ---
  const handleViewDetails = (studentId) => {
    setSelectedStudentId(studentId);
    setShowDetailModal(true);
  };

  const handleMakePayment = (enrollment) => {
    setFormData(prev => ({ ...prev, enrollment_id: enrollment.id, payment_status: 'PAID', amount: '' }));
    setMaxAmount(enrollment.balance);
    setIsPaymentModalOpen(true);
  };

  // --- Table Columns ---
  const columns = [
    {
      header: 'Student',
      accessorKey: 'studentName',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
            {(row.studentName || '?').charAt(0)}
          </div>
          <div>
            <div className="font-semibold text-gray-900 dark:text-white">{row.studentName}</div>
            <div className="text-xs text-gray-500">{row.totalCourses} Active Courses</div>
          </div>
        </div>
      )
    },
    {
      header: 'Total Balance Due',
      accessorKey: 'totalBalance',
      cell: (row) => (
        <span className={`font-bold ${row.totalBalance > 0 ? 'text-red-500' : 'text-green-500'}`}>
          ${(row.totalBalance || 0).toFixed(2)}
        </span>
      )
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
          row.totalBalance > 0 
            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' 
            : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
        }`}>
          {row.totalBalance > 0 ? 'Payment Due' : 'Up to Date'}
        </span>
      )
    },
    {
      header: '',
      id: 'actions',
      cell: (row) => (
        <button
          onClick={() => handleViewDetails(row.student_id)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors font-bold"
        >
          &gt;
        </button>
      )
    }
  ];

  if (isLoading) return <div className="p-8 text-center">Loading payments...</div>;

  const selectedStudentSummary = studentSummaries.find(s => s.student_id === selectedStudentId);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payment Management</h1>
          <p className="text-gray-500 dark:text-gray-400">Monthly subscription tracking</p>
        </div>
      </div>

      <Table 
        data={studentSummaries} 
        columns={columns} 
        searchable 
        searchKeys={SEARCH_KEYS} 
      />
      {/* 
      <div className="p-4 bg-gray-100 rounded">
        DEBUG: Found {studentSummaries.length} students.
        <pre>{JSON.stringify(studentSummaries.slice(0, 1), null, 2)}</pre>
      </div>
      */}

      {/* Student Details Modal */}
      {showDetailModal && selectedStudentSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            
            {/* Header */}
            <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-start bg-gray-50 dark:bg-slate-900/50">
              <div className="flex items-center gap-4">
                 <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    {selectedStudentSummary.studentName.charAt(0)}
                 </div>
                 <div>
                   <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedStudentSummary.studentName}</h2>
                   <div className="flex gap-2 mt-1">
                     <span className="px-2 py-0.5 rounded text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                       Student
                     </span>
                     {selectedStudentSummary.totalBalance > 0 && (
                       <span className="px-2 py-0.5 rounded text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-bold">
                         OWING ${selectedStudentSummary.totalBalance.toFixed(2)}
                       </span>
                     )}
                   </div>
                 </div>
              </div>
              <button 
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors font-bold"
              >
                ✕
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {selectedStudentSummary.enrollments.map((enr) => (
                <CoursePaymentCard 
                  key={enr.id} 
                  enrollment={enr} 
                  payments={payments} 
                  onMakePayment={handleMakePayment} 
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Record Payment"
        size="md"
      >
        <PaymentForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate({ ...formData, payment_status: 'PAID' });
          }}
          onCancel={() => setIsPaymentModalOpen(false)}
          isLoading={createMutation.isPending}
          maxAmount={maxAmount}
        />
      </Modal>

    </div>
  );
};

// Course Payment Card Component
const CoursePaymentCard = ({ enrollment, payments, onMakePayment }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Filter payments for this specific enrollment
  const coursePayments = payments
    .filter(p => p.enrollment_id === enrollment.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return (
    <div className="bg-gray-50 dark:bg-slate-700/30 rounded-xl border border-gray-200 dark:border-slate-600 overflow-hidden transition-all duration-200">
      
      {/* Course Header - Always Visible */}
      <div 
        className="p-4 border-b border-gray-200 dark:border-slate-600 flex justify-between items-center bg-white dark:bg-slate-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-750 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400 font-bold">
            {isExpanded ? '▼' : '▶'}
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">{enrollment.courseName}</h3>
            {!isExpanded && (
              <p className="text-xs text-gray-500">
                 Monthly: ${enrollment.monthlyPrice}/mo • Balance: <span className={enrollment.balance > 0 ? 'text-red-500 font-bold' : 'text-green-500'}>${enrollment.balance.toFixed(2)}</span>
              </p>
            )}
            {isExpanded && (
               <p className="text-xs text-gray-500">Enrolled: {enrollment.enrollmentDate.toLocaleDateString()}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           {/* Summary in header when collapsed */}
           {!isExpanded && (
              <div className="text-right">
                <span className={`px-2 py-1 rounded text-xs font-bold ${enrollment.balance > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  {enrollment.balance > 0 ? 'Due' : 'Paid'}
                </span>
              </div>
           )}
           
           {/* Detailed header info when expanded */}
           {isExpanded && (
             <div className="text-right">
                <div className="text-sm text-gray-500">Monthly Fee</div>
                <div className="font-bold text-gray-900 dark:text-white">${enrollment.monthlyPrice}/mo</div>
             </div>
           )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Financial Breakdown */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-gray-500 mb-1">Duration</div>
              <div className="text-xl font-semibold text-gray-900 dark:text-white">{enrollment.monthsEnrolled} Months</div>
              <div className="text-xs text-gray-400">Since enrollment</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Total Expected</div>
              <div className="text-xl font-semibold text-gray-900 dark:text-white">${enrollment.totalExpected.toFixed(2)}</div>
              <div className="text-xs text-gray-400">{enrollment.monthsEnrolled} x ${enrollment.monthlyPrice}</div>
            </div>
             <div>
              <div className="text-sm text-gray-500 mb-1">Balance Due</div>
              <div className={`text-2xl font-bold ${enrollment.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                ${enrollment.balance.toFixed(2)}
              </div>
              <button 
                 onClick={(e) => {
                   e.stopPropagation();
                   onMakePayment(enrollment);
                 }}
                 className="mt-2 text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors w-full flex items-center justify-center gap-2 shadow-sm"
              >
                $ Pay Now
              </button>
            </div>
          </div>

          {/* Payment History for this Course */}
          <div className="px-6 pb-6">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 uppercase tracking-wider">Payment History</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
               {coursePayments.length === 0 ? (
                 <div className="text-sm text-gray-400 italic p-2 text-center bg-gray-50 dark:bg-slate-800 rounded">No payments recorded yet.</div>
               ) : (
                 coursePayments.map(pay => (
                   <div key={pay.id} className="flex justify-between items-center p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700 shadow-sm gap-4">
                      {/* Date */}
                      <div className="flex items-center gap-3 shrink-0">
                         <div className={`w-2 h-2 rounded-full ${pay.payment_status === 'PAID' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                         <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                           {new Date(pay.created_at).toLocaleDateString()}
                         </span>
                      </div>
                      
                      {/* Notes - Middle */}
                      <div className="flex-1 px-4 text-center">
                        {pay.notes && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 italic truncate block" title={pay.notes}>
                                {pay.notes}
                            </span>
                        )}
                      </div>

                      {/* Amount */}
                      <div className="font-bold text-gray-900 dark:text-white shrink-0">
                        ${pay.amount}
                      </div>
                   </div>
                 ))
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Simple Payment Form
const PaymentForm = ({ formData, setFormData, onSubmit, onCancel, isLoading, maxAmount }) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <Input
      label={`Amount ($) Max ${maxAmount.toFixed(2)}`}
      type="number"
      required
      value={formData.amount}
      onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
      min="0.01" 
      max={maxAmount}
      step="0.01"
      autoFocus
    />
    <TextArea
      label="Notes"
      value={formData.notes}
      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
      placeholder="e.g. September Payment"
    />
    <div className="flex justify-end gap-3 pt-4">
      <button
        type="button"
        onClick={onCancel}
        className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 dark:text-gray-300"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={isLoading || (formData.amount > maxAmount)}
        className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Saving...' : 'Record Payment'}
      </button>
    </div>
  </form>
);

export default Payments;
