import React from 'react';

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">💰 Dashboard</h1>
        <p className="text-gray-400">Welcome to your finance dashboard</p>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-gray-400 mb-2">Total Accounts</p>
          <p className="text-3xl font-bold">1</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-400 mb-2">This Month</p>
          <p className="text-3xl font-bold">—</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-400 mb-2">All-Time</p>
          <p className="text-3xl font-bold">—</p>
        </div>
      </div>

      {/* Getting Started */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">🚀 Getting Started</h2>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <span className="text-2xl">1️⃣</span>
            <div>
              <p className="font-medium">Add Your First Transaction</p>
              <p className="text-sm text-gray-400">Go to the Transactions page and add income or expenses</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-2xl">2️⃣</span>
            <div>
              <p className="font-medium">Import CSV Data</p>
              <p className="text-sm text-gray-400">Bulk upload transactions from a CSV file</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-2xl">3️⃣</span>
            <div>
              <p className="font-medium">View Analytics</p>
              <p className="text-sm text-gray-400">Check the Report page for Power BI insights</p>
            </div>
          </li>
        </ul>
      </div>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-bold mb-2">📋 Transactions</h3>
          <p className="text-sm text-gray-400">Track income and expenses with categories, notes, and bulk imports</p>
        </div>
        <div className="card">
          <h3 className="font-bold mb-2">📊 Reports</h3>
          <p className="text-sm text-gray-400">Visualize spending patterns and trends with Power BI analytics</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
