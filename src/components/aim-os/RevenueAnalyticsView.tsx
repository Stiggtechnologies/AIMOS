import { useState } from 'react';
import {
  DollarSign, TrendingUp, Activity, PieChart,
  Calendar, Download, Filter, BarChart3
} from 'lucide-react';

interface ServiceRevenue {
  code: string;
  name: string;
  percentage: number;
  visits: number;
  revenue: number;
  color: string;
}

export default function RevenueAnalyticsView() {
  const [selectedPeriod, setSelectedPeriod] = useState('current');

  const serviceBreakdown: ServiceRevenue[] = [
    { code: 'PT-REV', name: 'Physical Therapy', percentage: 59.36, visits: 1679, revenue: 200224.77, color: 'bg-blue-500' },
    { code: 'M-REV', name: 'Massage', percentage: 12.16, visits: 425, revenue: 41021.00, color: 'bg-green-500' },
    { code: 'MOT-REV', name: 'MOT', percentage: 10.88, visits: 270, revenue: 36705.00, color: 'bg-purple-500' },
    { code: 'SHOCKWAVE', name: 'Shockwave Therapy', percentage: 7.39, visits: 131, revenue: 24940.00, color: 'bg-amber-500' },
    { code: 'O-REV', name: 'Orthotics', percentage: 5.77, visits: 105, revenue: 19450.00, color: 'bg-cyan-500' },
    { code: 'Reports', name: 'Medical Reports', percentage: 1.60, visits: 129, revenue: 5396.48, color: 'bg-pink-500' },
    { code: 'K-REV', name: 'Kinesiologist', percentage: 0.66, visits: 25, revenue: 2221.72, color: 'bg-orange-500' },
    { code: 'X-REV', name: 'Misc. Products', percentage: 0.63, visits: 50, revenue: 2139.86, color: 'bg-slate-500' },
  ];

  const topPayors = [
    { name: 'WCB Alberta', visits: 892, amount: 145829.50, percentage: 43.2 },
    { name: 'Alberta Blue Cross', visits: 342, amount: 52341.25, percentage: 15.5 },
    { name: 'Sun Life', visits: 287, amount: 38920.00, percentage: 11.5 },
    { name: 'Intact Insurance', visits: 198, amount: 31450.75, percentage: 9.3 },
    { name: 'Manulife', visits: 156, amount: 24680.20, percentage: 7.3 },
    { name: 'Canada Life', visits: 134, amount: 21550.00, percentage: 6.4 },
    { name: 'Other', visits: 98, amount: 22549.63, percentage: 6.8 },
  ];

  const totalRevenue = 337321.33;
  const totalVisits = 2815;
  const avgRevenuePerVisit = totalRevenue / totalVisits;

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
          <h1 className="text-3xl font-bold text-gray-900">Revenue Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive revenue and service mix analysis</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="h-4 w-4 text-gray-600" />
            <span className="text-sm text-gray-700">Filter</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="h-4 w-4" />
            <span className="text-sm">Export</span>
          </button>
        </div>
      </div>

      <div className="flex items-center space-x-2 text-sm">
        <Calendar className="h-4 w-4 text-gray-500" />
        <span className="text-gray-600">Period: August 1, 2024 - July 31, 2025</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="h-8 w-8 opacity-80" />
            <TrendingUp className="h-5 w-5 opacity-80" />
          </div>
          <p className="text-sm opacity-90 mb-1">Total Revenue</p>
          <p className="text-3xl font-bold">{formatCurrency(totalRevenue)}</p>
          <p className="text-xs opacity-75 mt-2">12-month period</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Activity className="h-8 w-8 opacity-80" />
          </div>
          <p className="text-sm opacity-90 mb-1">Total Visits</p>
          <p className="text-3xl font-bold">{totalVisits.toLocaleString()}</p>
          <p className="text-xs opacity-75 mt-2">Patient encounters</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <BarChart3 className="h-8 w-8 opacity-80" />
          </div>
          <p className="text-sm opacity-90 mb-1">Avg Revenue/Visit</p>
          <p className="text-3xl font-bold">{formatCurrency(avgRevenuePerVisit)}</p>
          <p className="text-xs opacity-75 mt-2">Per patient encounter</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <PieChart className="h-8 w-8 opacity-80" />
          </div>
          <p className="text-sm opacity-90 mb-1">Service Lines</p>
          <p className="text-3xl font-bold">8</p>
          <p className="text-xs opacity-75 mt-2">Active revenue streams</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Revenue by Service Type</h2>
            <p className="text-sm text-gray-600 mt-1">Service line performance breakdown</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {serviceBreakdown.map((service) => (
                <div key={service.code} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${service.color}`}></div>
                      <span className="font-medium text-gray-900">{service.name}</span>
                    </div>
                    <span className="text-gray-600">{service.percentage.toFixed(2)}%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>{service.visits} visits</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(service.revenue)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${service.color}`}
                      style={{ width: `${service.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Top Payors</h2>
            <p className="text-sm text-gray-600 mt-1">Revenue by insurance provider</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Visits
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    %
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topPayors.map((payor, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{payor.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{payor.visits}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">{formatCurrency(payor.amount)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{payor.percentage.toFixed(1)}%</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Key Insights</h2>
          <p className="text-sm text-gray-600 mt-1">Strategic revenue analysis</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <h3 className="font-semibold text-blue-900 text-sm">Primary Revenue Driver</h3>
              </div>
              <p className="text-sm text-blue-800">
                Physical Therapy generates 59% of total revenue with 1,679 visits, making it the cornerstone service.
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                <h3 className="font-semibold text-green-900 text-sm">High-Value Services</h3>
              </div>
              <p className="text-sm text-green-800">
                Shockwave therapy shows strong revenue per visit at $190, indicating premium service positioning.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-amber-600 rounded-full"></div>
                <h3 className="font-semibold text-amber-900 text-sm">Payor Concentration</h3>
              </div>
              <p className="text-sm text-amber-800">
                WCB Alberta represents 43% of revenue, highlighting importance of maintaining strong workers comp relationships.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <PieChart className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-sm font-semibold text-blue-900 mb-2">About Revenue Analytics</h3>
            <p className="text-sm text-blue-800 leading-relaxed">
              This dashboard provides comprehensive insights into revenue streams, service line performance, and payor relationships.
              Use this data to identify growth opportunities, optimize service mix, and strengthen relationships with key insurance partners.
              The analytics help inform strategic decisions about resource allocation and service development.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
