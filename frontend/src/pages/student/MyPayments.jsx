import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import { CreditCard, Calendar, BookOpen } from 'lucide-react';

// Helper: calculate how many months have passed since enrollment.
// Month 2 only starts on the same day-of-month as enrollment (e.g. enrolled Feb 16 → month 2 starts March 16).
const getMonthsEnrolled = (enrollmentDateStr) => {
    const enrollmentDate = new Date(enrollmentDateStr);
    const now = new Date();
    let months =
        (now.getFullYear() - enrollmentDate.getFullYear()) * 12 +
        (now.getMonth() - enrollmentDate.getMonth());
    // If today is before the anniversary day, don't count this month yet
    if (now.getDate() < enrollmentDate.getDate()) {
        months -= 1;
    }
    months += 1; // the enrollment month itself (month 1)
    return months < 1 ? 1 : months;
};

const MyPayments = () => {
    // Fetch actual payment records
    const { data: payments = [], isLoading: isLoadingPayments } = useQuery({
        queryKey: ['student-payments'],
        queryFn: async () => {
            const response = await api.get('/student/payments');
            return response.data;
        },
    });

    // Fetch enrollments (course_price = monthly rate, enrollment_date needed for months calc)
    const { data: enrollments = [], isLoading: isLoadingEnrollments } = useQuery({
        queryKey: ['student-courses-payments'],
        queryFn: async () => {
            const response = await api.get(`/student/courses?t=${new Date().getTime()}`);
            return response.data;
        },
        staleTime: 0,
        refetchOnWindowFocus: true,
        refetchOnMount: true,
    });

    // Build per-enrollment financial breakdown (mirrors admin Payments.jsx logic)
    const enrollmentFinancials = React.useMemo(() => {
        return enrollments.map((enroll) => {
            const monthsEnrolled = getMonthsEnrolled(enroll.enrollment_date);
            const monthlyPrice = Number(enroll.course_price) || 0;
            const totalExpected = monthsEnrolled * monthlyPrice;

            const totalPaid = payments
                .filter(
                    (p) =>
                        p.enrollment_id === enroll.id && p.payment_status === 'PAID'
                )
                .reduce((sum, p) => sum + Number(p.amount), 0);

            const balance = Math.max(0, totalExpected - totalPaid);

            return {
                ...enroll,
                monthsEnrolled,
                monthlyPrice,
                totalExpected,
                totalPaid,
                balance,
            };
        });
    }, [enrollments, payments]);

    // Top-level summary across all enrollments
    const summary = React.useMemo(() => {
        const totalFees = enrollmentFinancials.reduce(
            (sum, e) => sum + e.totalExpected,
            0
        );
        const totalPaid = enrollmentFinancials.reduce(
            (sum, e) => sum + e.totalPaid,
            0
        );
        const remaining = Math.max(0, totalFees - totalPaid);
        const overpayment = Math.max(0, totalPaid - totalFees);
        return { totalFees, totalPaid, remaining, overpayment };
    }, [enrollmentFinancials]);

    const columns = [
        {
            header: 'Description',
            accessorKey: 'course_name',
            cell: (row) => (
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-lg">
                        <CreditCard size={18} />
                    </div>
                    <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                            {row.course_name || 'Tuition Payment'}
                        </p>
                        <p className="text-xs text-gray-500">REF: {row.id.substring(0, 8)}</p>
                    </div>
                </div>
            ),
        },
        {
            header: 'Amount',
            accessorKey: 'amount',
            cell: (row) => (
                <span className="font-medium text-gray-900 dark:text-white">
                    ${Number(row.amount).toFixed(2)}
                </span>
            ),
        },
        {
            header: 'Date',
            accessorKey: 'payment_date',
            cell: (row) => (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar size={14} />
                    {new Date(row.payment_date).toLocaleDateString()}
                </div>
            ),
        },
    ];

    if (isLoadingPayments || isLoadingEnrollments) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                Payment History
            </h1>

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-200 dark:border-slate-700 shadow-sm">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Fees Due</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        ${summary.totalFees.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Based on months enrolled × monthly rate</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-200 dark:border-slate-700 shadow-sm">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Paid</p>
                    <p className="text-2xl font-bold text-green-600">
                        ${summary.totalPaid.toFixed(2)}
                    </p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-200 dark:border-slate-700 shadow-sm">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        {summary.remaining > 0 ? 'Remaining Balance' : 'Excess Payment / Credit'}
                    </p>
                    <p className={`text-2xl font-bold ${summary.remaining > 0 ? 'text-red-600' : 'text-purple-600'}`}>
                        ${summary.remaining > 0
                            ? summary.remaining.toFixed(2)
                            : summary.overpayment.toFixed(2)}
                    </p>
                </div>
            </div>

            {/* Per-Course Breakdown */}
            {enrollmentFinancials.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                        Course Breakdown
                    </h2>
                    {enrollmentFinancials.map((enroll) => (
                        <div
                            key={enroll.id}
                            className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden"
                        >
                            {/* Course Header */}
                            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/40">
                                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                    <BookOpen size={18} />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 dark:text-white">
                                        {enroll.course_name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Enrolled:{' '}
                                        {new Date(enroll.enrollment_date).toLocaleDateString()} &bull;{' '}
                                        {enroll.monthsEnrolled} month{enroll.monthsEnrolled !== 1 ? 's' : ''}
                                    </p>
                                </div>
                            </div>

                            {/* Financial grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-5 py-4">
                                <div>
                                    <p className="text-xs text-gray-400 mb-0.5">Monthly Rate</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">
                                        ${enroll.monthlyPrice.toFixed(2)}/mo
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 mb-0.5">Total Expected</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">
                                        ${enroll.totalExpected.toFixed(2)}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {enroll.monthsEnrolled} × ${enroll.monthlyPrice.toFixed(2)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 mb-0.5">Paid</p>
                                    <p className="font-semibold text-green-600">
                                        ${enroll.totalPaid.toFixed(2)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 mb-0.5">Balance Due</p>
                                    <p className={`text-xl font-bold ${enroll.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        ${enroll.balance.toFixed(2)}
                                    </p>
                                    {enroll.balance > 0 && (
                                        <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-semibold">
                                            Overdue
                                        </span>
                                    )}
                                    {enroll.balance === 0 && (
                                        <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-semibold">
                                            Up to Date
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Payment Transaction History */}
            <div>
                <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Transaction History
                </h2>
                <Card>
                    <Table data={payments} columns={columns} />
                </Card>
            </div>
        </div>
    );
};

export default MyPayments;
