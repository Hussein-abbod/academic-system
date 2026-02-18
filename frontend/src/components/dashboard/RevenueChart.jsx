import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { DollarSign, TrendingUp, Calendar, Filter } from 'lucide-react';
import api from '../../utils/api';
import Card from '../ui/Card';

const RevenueChart = () => {
  const [period, setPeriod] = useState('6m'); // '30d', '6m', '1y', 'all'

  // Fetch aggregated revenue data
  const { data: chartData = [], isLoading: isChartLoading } = useQuery({
    queryKey: ['admin-revenue-chart', period],
    queryFn: async () => {
      const response = await api.get('/admin/statistics/revenue-chart', {
        params: { period }
      });
      return response.data;
    }
  });

  // Fetch summary statistics (keep existing total/this month logic or move to backend)
  // For now, let's assume the dashboard parent component passes stats or we fetch them here
  // But to align with the request "enhance overview", we probably just want the chart here 
  // and maybe some quick stats derived from it or a separate call.
  // The original component had stats cards inside. Let's keep them but maybe simplify 
  // or fetch them from the main dashboard stats endpoint to avoid duplication if possible.
  // However, to keep this component self-contained as requested, we might want to fetch stats here too.
  // But the user request specifically asked to "enhance Revenue Overview", implies the chart+stats block.
  // Let's call the dashboard stats endpoint to get the summary numbers if we want to show them here,
  // OR just calculate totals from the returned chart data for the selected period?
  // No, totals should probably be overall.
  // Let's stick to the pattern: This component handles the Chart visualization.
  // The stats cards in the original code were useful. Let's keep them, but maybe fetch them via the dashboard stats endpoint
  // strictly for the "Total" values, or just calculate "Revenue in selected period".
  
  // Actually, the previous implementation fetched ALL payments to calculate stats.
  // We should probably rely on the dashboard stats for "Total Revenue" and "This Month".
  // But if we want to show stats specific to the chart range, we can calculate from chartData.
  
  const totalInPeriod = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.amount, 0);
  }, [chartData]);

  // We can also fetch the general stats separately if we want to show "All Time" vs "Selected Period"
  const { data: generalStats } = useQuery({
    queryKey: ['admin-revenue-stats-general'],
    queryFn: async () => {
      const response = await api.get('/admin/statistics/dashboard');
      return response.data;
    }
  });

  if (isChartLoading) {
    return (
      <Card className="h-96 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </Card>
    );
  }

  const formatCurrency = (value) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const formatDate = (dateStr) => {
    // dateStr is 'YYYY-MM'
    const [year, month] = dateStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-green-500" />
            Revenue Analysis
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Track financial performance over time
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-700/50 p-1 rounded-lg">
          {['30d', '6m', '1y', 'all'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                period === p
                  ? 'bg-white dark:bg-slate-600 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {p === '30d' ? '30 Days' : p === '6m' ? '6 Months' : p === '1y' ? '1 Year' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards for Selected Period */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-100 dark:border-green-800/30">
          <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1 flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Period Revenue
          </p>
          <h3 className="text-2xl font-bold text-green-700 dark:text-green-300">
            {formatCurrency(totalInPeriod)}
          </h3>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800/30">
          <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-1">
            <DollarSign className="w-3 h-3" /> Total All Time
          </p>
          <h3 className="text-2xl font-bold text-blue-700 dark:text-blue-300">
            {formatCurrency(generalStats?.total_revenue || 0)}
          </h3>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-900/20 dark:to-fuchsia-900/20 border border-purple-100 dark:border-purple-800/30">
          <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Monthly Average
          </p>
          <h3 className="text-2xl font-bold text-purple-700 dark:text-purple-300">
             {chartData.length > 0 
               ? formatCurrency(totalInPeriod / chartData.length) 
               : '$0.00'}
          </h3>
        </div>
      </div>

      {/* Chart */}
      <Card className="p-1">
        <div className="h-[300px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-slate-700" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                dy={10}
              />
              <YAxis 
                tickFormatter={(value) => `$${value}`}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6b7280' }}
              />
              <Tooltip 
                cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '3 3' }}
                contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}
                formatter={(value) => [formatCurrency(value), 'Revenue']}
                labelFormatter={(label) => formatDate(label)}
              />
              <Area 
                type="monotone" 
                dataKey="amount" 
                stroke="#10b981" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};

export default RevenueChart;
