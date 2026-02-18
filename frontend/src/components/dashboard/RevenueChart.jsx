import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { DollarSign, TrendingUp, CreditCard, Clock } from 'lucide-react';
import api from '../../utils/api';

const RevenueChart = () => {
  const [chartType, setChartType] = React.useState('line'); // 'line' or 'bar'

  // Fetch revenue statistics
  const { data: revenueData, isLoading } = useQuery({
    queryKey: ['admin-revenue-stats'],
    queryFn: async () => {
      const response = await api.get('/admin/statistics/revenue');
      return response.data;
    }
  });

  // Fetch payments for detailed analysis
  const { data: payments = [] } = useQuery({
    queryKey: ['admin-payments'],
    queryFn: async () => {
      const response = await api.get('/admin/payments');
      return response.data;
    }
  });

  // Process monthly revenue data
  const monthlyData = React.useMemo(() => {
    if (!payments.length) return [];

    const monthlyRevenue = {};
    const now = new Date();
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyRevenue[key] = { month: date.toLocaleDateString('en-US', { month: 'short' }), amount: 0 };
    }

    // Aggregate payments by month
    payments.forEach(payment => {
      if (payment.status === 'PAID' && payment.payment_date) {
        const date = new Date(payment.payment_date);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyRevenue[key]) {
          monthlyRevenue[key].amount += parseFloat(payment.amount);
        }
      }
    });

    return Object.values(monthlyRevenue);
  }, [payments]);

  // Calculate statistics
  const stats = React.useMemo(() => {
    const totalRevenue = payments
      .filter(p => p.status === 'PAID')
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);

    const pendingAmount = payments
      .filter(p => p.status === 'PENDING')
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);

    const thisMonth = new Date();
    const thisMonthRevenue = payments
      .filter(p => {
        if (p.status !== 'PAID' || !p.payment_date) return false;
        const paymentDate = new Date(p.payment_date);
        return paymentDate.getMonth() === thisMonth.getMonth() &&
               paymentDate.getFullYear() === thisMonth.getFullYear();
      })
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);

    const avgPayment = payments.length > 0 ? totalRevenue / payments.filter(p => p.status === 'PAID').length : 0;

    return {
      total: totalRevenue,
      thisMonth: thisMonthRevenue,
      pending: pendingAmount,
      average: avgPayment
    };
  }, [payments]);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 dark:bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Revenue Overview</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setChartType('line')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              chartType === 'line'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400'
            }`}
          >
            Line
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              chartType === 'bar'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400'
            }`}
          >
            Bar
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Total Revenue</span>
          </div>
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
            ${stats.total.toFixed(2)}
          </div>
        </div>

        <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-xs text-green-600 dark:text-green-400 font-medium">This Month</span>
          </div>
          <div className="text-2xl font-bold text-green-700 dark:text-green-300">
            ${stats.thisMonth.toFixed(2)}
          </div>
        </div>

        <div className="p-4 rounded-lg bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">Pending</span>
          </div>
          <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
            ${stats.pending.toFixed(2)}
          </div>
        </div>

        <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">Avg Payment</span>
          </div>
          <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
            ${stats.average.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line' ? (
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-slate-700" />
              <XAxis 
                dataKey="month" 
                className="text-xs text-gray-600 dark:text-gray-400"
              />
              <YAxis 
                className="text-xs text-gray-600 dark:text-gray-400"
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
                formatter={(value) => [`$${value.toFixed(2)}`, 'Revenue']}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="amount" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
                name="Revenue"
              />
            </LineChart>
          ) : (
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-slate-700" />
              <XAxis 
                dataKey="month" 
                className="text-xs text-gray-600 dark:text-gray-400"
              />
              <YAxis 
                className="text-xs text-gray-600 dark:text-gray-400"
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
                formatter={(value) => [`$${value.toFixed(2)}`, 'Revenue']}
              />
              <Legend />
              <Bar 
                dataKey="amount" 
                fill="#3b82f6" 
                radius={[8, 8, 0, 0]}
                name="Revenue"
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RevenueChart;
