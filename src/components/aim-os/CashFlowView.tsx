import { useState } from 'react';
import {
  DollarSign, TrendingUp, TrendingDown, Calendar,
  ArrowUpCircle, ArrowDownCircle, Activity, AlertTriangle
} from 'lucide-react';

interface Transaction {
  date: string;
  description: string;
  type: 'credit' | 'debit';
  amount: number;
  category: string;
  balance: number;
}

export default function CashFlowView() {
  const [selectedMonth, setSelectedMonth] = useState('november-2025');

  const openingBalance = 7739.44;
  const closingBalance = 9062.09;
  const totalCredits = 31676.26;
  const totalDebits = 30353.61;
  const netCashFlow = totalCredits - totalDebits;

  const categoryBreakdown = [
    { category: 'Insurance Payments', amount: 15420.50, percentage: 48.7, color: 'bg-green-500' },
    { category: 'WCB Alberta', amount: 5011.96, percentage: 15.8, color: 'bg-blue-500' },
    { category: 'Direct Client Payments', amount: 4235.00, percentage: 13.4, color: 'bg-purple-500' },
    { category: 'Other Revenue', amount: 3008.80, percentage: 9.5, color: 'bg-cyan-500' },
  ];

  const expenseBreakdown = [
    { category: 'Rent & Occupancy', amount: 3950.10, percentage: 13.0, color: 'bg-red-500' },
    { category: 'Payroll', amount: 11213.97, percentage: 36.9, color: 'bg-orange-500' },
    { category: 'Credit Card Payments', amount: 900.00, percentage: 3.0, color: 'bg-amber-500' },
    { category: 'Software & Services', amount: 1069.60, percentage: 3.5, color: 'bg-pink-500' },
    { category: 'Banking Fees', amount: 208.60, percentage: 0.7, color: 'bg-gray-500' },
    { category: 'Other Operating', amount: 5011.34, percentage: 16.5, color: 'bg-slate-500' },
  ];

  const recentTransactions: Transaction[] = [
    { date: 'Nov 28', description: 'Moneris Settlement - MC', type: 'credit', amount: 993.50, category: 'Revenue', balance: 9097.49 },
    { date: 'Nov 28', description: 'Moneris Settlement - VI', type: 'credit', amount: 295.00, category: 'Revenue', balance: 8103.99 },
    { date: 'Nov 28', description: 'Royal Bank VISA Payment', type: 'debit', amount: 150.00, category: 'Expense', balance: 7587.28 },
    { date: 'Nov 27', description: 'AB Blue Cross Payment', type: 'credit', amount: 170.00, category: 'Insurance', balance: 7187.59 },
    { date: 'Nov 27', description: 'GroupSource Insurance', type: 'credit', amount: 120.00, category: 'Insurance', balance: 7770.28 },
    { date: 'Nov 26', description: 'Canada Life Payment', type: 'credit', amount: 373.25, category: 'Insurance', balance: 5769.19 },
    { date: 'Nov 25', description: 'GroupSource Insurance', type: 'credit', amount: 150.00, category: 'Insurance', balance: 6303.01 },
    { date: 'Nov 21', description: 'Manulife Payment', type: 'credit', amount: 94.50, category: 'Insurance', balance: 5216.76 },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cash Flow Management</h1>
          <p className="text-gray-600 mt-1">Real-time banking and cash position analysis</p>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-gray-400" />
          <span className="text-sm text-gray-600">November 1-28, 2025</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <ArrowUpCircle className="h-5 w-5 text-green-600" />
              <p className="text-sm text-gray-600">Total Inflows</p>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalCredits)}</p>
          <p className="text-xs text-gray-500 mt-1">106 credit transactions</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <ArrowDownCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm text-gray-600">Total Outflows</p>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalDebits)}</p>
          <p className="text-xs text-gray-500 mt-1">109 debit transactions</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-blue-600" />
              <p className="text-sm text-gray-600">Net Cash Flow</p>
            </div>
          </div>
          <p className={`text-2xl font-bold ${netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(netCashFlow)}
          </p>
          <div className="flex items-center mt-1">
            {netCashFlow >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
            )}
            <span className={`text-xs ${netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {((netCashFlow / totalCredits) * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-purple-600" />
              <p className="text-sm text-gray-600">Current Balance</p>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(closingBalance)}</p>
          <p className="text-xs text-gray-500 mt-1">As of Nov 28, 2025</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Revenue Sources</h2>
            <p className="text-sm text-gray-600 mt-1">Cash inflows by category</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {categoryBreakdown.map((item, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                      <span className="font-medium text-gray-900">{item.category}</span>
                    </div>
                    <span className="text-gray-600">{item.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900">{formatCurrency(item.amount)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${item.color}`}
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-red-50 to-orange-50 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Expense Categories</h2>
            <p className="text-sm text-gray-600 mt-1">Cash outflows breakdown</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {expenseBreakdown.map((item, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                      <span className="font-medium text-gray-900">{item.category}</span>
                    </div>
                    <span className="text-gray-600">{item.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900">{formatCurrency(item.amount)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${item.color}`}
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
          <p className="text-sm text-gray-600 mt-1">Latest banking activity</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentTransactions.map((txn, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {txn.date}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {txn.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      txn.type === 'credit'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {txn.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <span className={`font-semibold ${
                      txn.type === 'credit' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {txn.type === 'credit' ? '+' : '-'}{formatCurrency(txn.amount)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                    {formatCurrency(txn.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-amber-900 mb-2">Cash Flow Insights</h3>
            <ul className="text-sm text-amber-800 space-y-1">
              <li>• Strong positive cash flow of {formatCurrency(netCashFlow)} for the period</li>
              <li>• Insurance payments represent primary revenue source at 48.7%</li>
              <li>• Payroll represents largest expense category at 36.9% of outflows</li>
              <li>• Current balance is healthy with positive month-over-month growth</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
