import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import { CreditCard, Calendar } from 'lucide-react';

const MyPayments = () => {
    // Fetch payments
    const { data: payments = [], isLoading: isLoadingPayments } = useQuery({
        queryKey: ['student-payments'],
        queryFn: async () => {
            const response = await api.get('/student/payments');
            return response.data;
        },
    });

    // Fetch enrollments (for course details and prices)
    const { data: enrollments = [], isLoading: isLoadingEnrollments } = useQuery({
        queryKey: ['student-courses-payments'], // Unique key to prevent sharing stale cache
        queryFn: async () => {
            // Add timestamp to prevent browser caching
            const response = await api.get(`/student/courses?t=${new Date().getTime()}`);
            return response.data;
        },
        staleTime: 0, 
        refetchOnWindowFocus: true,
        refetchOnMount: true
    });

    // Calculate Financial Summary
    const summary = React.useMemo(() => {
        // Calculate fees from enrollments (using flat fields)
        const totalFees = enrollments?.reduce((sum, enroll) => sum + (Number(enroll.course_price) || 0), 0) || 0;
        
        // Calculate paid amount from payments
        const totalPaid = payments?.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0) || 0;
        
        const remaining = Math.max(0, totalFees - totalPaid);
        const overpayment = Math.max(0, totalPaid - totalFees);

        return { totalFees, totalPaid, remaining, overpayment };
    }, [enrollments, payments]);

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
                    ${row.amount.toFixed(2)}
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
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Course Fees</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        ${summary.totalFees.toFixed(2)}
                    </p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-200 dark:border-slate-700 shadow-sm">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Paid</p>
                    <p className="text-2xl font-bold text-green-600">
                        ${summary.totalPaid.toFixed(2)}
                    </p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-200 dark:border-slate-700 shadow-sm">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        {summary.remaining > 0 ? "Remaining Balance" : "Excess Payment / Credit"}
                    </p>
                    <p className={`text-2xl font-bold ${summary.remaining > 0 ? "text-blue-600" : "text-purple-600"}`}>
                        ${summary.remaining > 0 ? summary.remaining.toFixed(2) : summary.overpayment.toFixed(2)}
                    </p>
                </div>
            </div>

            <Card>
                <Table 
                    data={payments} 
                    columns={columns} 
                />
            </Card>
        </div>
    );
};

export default MyPayments;
