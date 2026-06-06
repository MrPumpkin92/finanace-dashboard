import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import { useAnalytics } from '../hooks/useApi';
import { formatCurrency, formatDate } from '../utils/formatting';

const monthLabel = (month: string): string => {
  const [year, m] = month.split('-');
  const date = new Date(Number(year), Number(m) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
};

const KpiCard: React.FC<{
  label: string;
  value: string;
  accent: string;
  sub?: string;
}> = ({ label, value, accent, sub }) => (
  <div className="card">
    <p className="text-sm text-gray-400 mb-2">{label}</p>
    <p className={`text-3xl font-bold ${accent}`}>{value}</p>
    {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
  </div>
);

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm shadow-lg">
      {label && <p className="text-gray-300 mb-1">{label}</p>}
      {payload.map((entry: any) => (
        <p key={entry.name} style={{ color: entry.color || entry.fill }}>
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const { data, isLoading, error } = useAnalytics(12);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="text-4xl mb-2 animate-pulse">📊</div>
          <p className="text-gray-400">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card bg-red-900/20 border-red-700 p-8 text-center">
        <p className="text-red-400 mb-2">❌ Could not load analytics</p>
        <p className="text-gray-400 text-sm">
          Make sure the backend is running on port 5000 (npm run dev).
        </p>
      </div>
    );
  }

  const { kpis, monthlyTrend, categoryBreakdown, recentTransactions } = data;
  const isEmpty = kpis.transactionCount === 0;

  const trendData = monthlyTrend.map((m) => ({ ...m, label: monthLabel(m.month) }));
  const topCategories = categoryBreakdown.slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">💰 Dashboard</h1>
        <p className="text-gray-400">
          Income, spending, and savings at a glance — across the last 12 months.
        </p>
      </div>

      {isEmpty && (
        <div className="card bg-blue-900/20 border-blue-700 p-6">
          <p className="text-blue-300 font-medium mb-1">No transactions yet</p>
          <p className="text-gray-400 text-sm">
            Add transactions on the Transactions page, import a bank CSV, or run{' '}
            <code className="text-blue-300">npm run db:seed:demo</code> to load sample data.
          </p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard
          label="Total Income"
          value={formatCurrency(kpis.totalIncome)}
          accent="text-green-400"
        />
        <KpiCard
          label="Total Expenses"
          value={formatCurrency(kpis.totalExpenses)}
          accent="text-red-400"
        />
        <KpiCard
          label="Net Savings"
          value={formatCurrency(kpis.netSavings)}
          accent={kpis.netSavings >= 0 ? 'text-emerald-400' : 'text-red-400'}
        />
        <KpiCard
          label="Savings Rate"
          value={`${kpis.savingsRate}%`}
          accent={kpis.savingsRate >= 0 ? 'text-emerald-400' : 'text-red-400'}
          sub={`${kpis.transactionCount} transactions`}
        />
      </div>

      {/* Monthly Trend */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">📈 Monthly Income vs. Expenses</h2>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="label" stroke="#9ca3af" fontSize={12} />
            <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `$${v}`} />
            <Tooltip content={<ChartTooltip />} />
            <Legend />
            <Area
              type="monotone"
              dataKey="income"
              name="Income"
              stroke="#22c55e"
              fill="url(#incomeFill)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="expenses"
              name="Expenses"
              stroke="#ef4444"
              fill="url(#expenseFill)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">🧾 Top Expense Categories</h2>
          {topCategories.length === 0 ? (
            <p className="text-gray-500 text-sm">No expenses recorded yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={topCategories}
                layout="vertical"
                margin={{ top: 0, right: 16, left: 20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                <XAxis type="number" stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `$${v}`} />
                <YAxis
                  type="category"
                  dataKey="categoryName"
                  stroke="#9ca3af"
                  fontSize={12}
                  width={90}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: '#ffffff10' }} />
                <Bar dataKey="total" name="Spent" radius={[0, 4, 4, 0]}>
                  {topCategories.map((entry) => (
                    <Cell key={entry.categoryName} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">🕑 Recent Transactions</h2>
          {recentTransactions.length === 0 ? (
            <p className="text-gray-500 text-sm">Nothing here yet.</p>
          ) : (
            <ul className="divide-y divide-gray-700">
              {recentTransactions.map((tx) => (
                <li key={tx.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{tx.description}</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(tx.date)} · {tx.categoryName || 'Uncategorized'}
                    </p>
                  </div>
                  <span
                    className={`font-semibold ${
                      tx.type === 'income' ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '−'}
                    {formatCurrency(tx.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
