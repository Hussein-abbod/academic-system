import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import { CreditCard, Calendar } from 'lucide-react';

const MyPayments = () => {
    const { data: payments, isLoading } = useQuery({
        queryKey: ['student-payments'],
        queryFn: async () => {
            const response = await api.get('/student/payments');
            return response.data;
        },
    });

    const columns = [
        {
            header: 'Description',
            accessorKey: 'enrollment_id', // Ideally we want course name here. PaymentResponse might need update or fetch.
            cell: (row) => (
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-lg">
                        <CreditCard size={18} />
                    </div>
                    <div>
                        <p className="font-medium text-gray-900 dark:text-white">Tuition Payment</p>
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
        {
            header: 'Status',
            accessorKey: 'payment_status',
            cell: (row) => {
                 const statusColors = {
                    'PAID': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                    'PENDING': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
                    'PARTIAL': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                    'OVERDUE': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                 };
                return (
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[row.payment_status] || 'bg-gray-100'}`}>
                        {row.payment_status}
                    </span>
                );
            },
        },
    ];

    if (isLoading) return <div>Loading payments...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                Payment History
            </h1>

            <Card>
                <Table 
                    data={payments || []} 
                    columns={columns} 
                />
            </Card>
        </div>
    );
};

export default MyPayments;
