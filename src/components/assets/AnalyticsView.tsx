import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  AlertTriangle,
  Activity,
  Building2,
  Package,
  Wrench,
  Calendar,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';

// Types
interface HealthTrend {
  month: string;
  avgScore: number;
}

interface MaintenanceTrend {
  month: string;
  preventive: number;
  corrective: number;
  emergency: number;
  cost: number;
}

interface AcquisitionRisk {
  batch_id: string;
  clinic_name: string;
  closing_date: string;
  total_assets: number;
  missing_records: number;
  high_risk_assets: number;
  hidden_capex: number;
  risk_score: number;
}

interface StandardizationAnalysis {
  category: string;
  vendors: { name: string; count: number }[];
  models: { name: string; count: number }[];
  total_units: number;
  standardization_score: number;
}

// Mock data
const mockHealthTrends: HealthTrend[] = [
  { month: 'Oct 2025', avgScore: 7.2 },
  { month: 'Nov 2025', avgScore: 7.4 },
  { month: 'Dec 2025', avgScore: 7.3 },
  { month: 'Jan 2026', avgScore: 7.5 },
  { month: 'Feb 2026', avgScore: 7.6 },
  { month: 'Mar 2026', avgScore: 7.8 },
];

const mockMaintenanceTrends: MaintenanceTrend[] = [
  { month: 'Oct 2025', preventive: 12, corrective: 4, emergency: 1, cost: 4500 },
  { month: 'Nov 2025', preventive: 15, corrective: 3, emergency: 2, cost: 5200 },
  { month: 'Dec 2025', preventive: 8, corrective: 5, emergency: 1, cost: 3800 },
  { month: 'Jan 2026', preventive: 18, corrective: 2, emergency: 0, cost: 6100 },
  { month: 'Feb 2026', preventive: 14, corrective: 4, emergency: 1, cost: 4900 },
  { month: 'Mar 2026', preventive: 16, corrective: 3, emergency: 1, cost: 5500 },
];

const mockAcquisitionRisks: AcquisitionRisk[] = [
  {
    batch_id: '1',
    clinic_name: 'Mountain View Physio',
    closing_date: '2026-04-01',
    total_assets: 45,
    missing_records: 18,
    high_risk_assets: 5,
    hidden_capex: 85000,
    risk_score: 72
  },
  {
    batch_id: '2',
    clinic_name: 'Wellness Center Calgary',
    closing_date: '2026-03-15',
    total_assets: 62,
    missing_records: 8,
    high_risk_assets: 3,
    hidden_capex: 35000,
    risk_score: 45
  }
];

const mockStandardization: StandardizationAnalysis[] = [
  {
    category: 'Treatment Tables',
    vendors: [
      { name: 'Physiomed', count: 8 },
      { name: 'DJO', count: 3 },
      { name: 'Rehab Care', count: 1 }
    ],
    models: [
      { name: 'ProTable 3000', count: 5 },
      { name: 'ProTable 2000', count: 3 },
      { name: 'Excel 2000', count: 3 },
      { name: 'BasicTable', count: 1 }
    ],
    total_units: 12,
    standardization_score: 42
  },
  {
    category: 'IT Equipment',
    vendors: [
      { name: 'Dell', count: 5 },
      { name: 'HP', count: 3 }
    ],
    models: [
      { name: 'Latitude 5540', count: 4 },
      { name: 'ProDesk 400', count: 3 },
      { name: 'Latitude 5440', count: 1 }
    ],
    total_units: 8,
    standardization_score: 63
  }
];

// Components
const StatCard: React.FC<{
  title: string;
  value: string;
  change?: string;
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, change, icon, color }) => (
  <div className="bg-white rounded-lg shadow p-4 border-l-4" style={{ borderLeftColor: color }}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold" style={{ color }}>{value}</p>
        {change && (
          <p className="text-xs text-gray-400">{change}</p>
        )}
      </div>
      <div className="text-2xl" style={{ color }}>{icon}</div>
    </div>
  </div>
);

const RiskScoreBadge: React.FC<{ score: number }> = ({ score }) => {
  const getColor = () => {
    if (score < 30) return 'bg-green-100 text-green-800';
    if (score < 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getColor()}`}>
      {score}/100
    </span>
  );
};

// Main Component
export const AnalyticsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'health' | 'maintenance' | 'acquisition' | 'standardization'>('health');

  const tabs = [
    { id: 'health', label: 'Asset Health', icon: Activity },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
    { id: 'acquisition', label: 'Acquisition Risk', icon: Building2 },
    { id: 'standardization', label: 'Standardization', icon: Package }
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="text-teal-600" />
              Analytics
            </h1>
            <p className="mt-2 text-gray-600">Deep analysis and insights across AIM assets</p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">
              <RefreshCw size={18} />
              Refresh
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">
              <Download size={18} />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-4">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-teal-500 text-teal-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Asset Health Tab */}
          {activeTab === 'health' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Current Health Score" value="7.8/10" change="+0.3 from last month" icon={<Activity size={24} />} color="#10B981" />
                <StatCard title="Healthy Assets" value="68%" change="+5% from last month" icon={<TrendingUp size={24} />} color="#22C55E" />
                <StatCard title="Watchlist Assets" value="22%" change="-2% from last month" icon={<AlertTriangle size={24} />} color="#F59E0B" />
                <StatCard title="Critical Assets" value="10%" change="-3% from last month" icon={<TrendingDown size={24} />} color="#EF4444" />
              </div>

              <div className="bg-white rounded-lg border p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Health Score Trend</h3>
                <div className="h-64 flex items-end justify-around gap-2">
                  {mockHealthTrends.map((item, idx) => (
                    <div key={idx} className="flex flex-col items-center flex-1">
                      <div 
                        className="w-full bg-teal-500 rounded-t hover:bg-teal-600 transition-colors"
                        style={{ height: `${item.avgScore * 10}%` }}
                      />
                      <p className="text-xs text-gray-500 mt-2">{item.month}</p>
                      <p className="text-xs font-medium">{item.avgScore}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg border p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Health by Clinic</h3>
                  <div className="space-y-3">
                    {['AIM Edmonton', 'Calgary South', 'Red Deer'].map((clinic, idx) => (
                      <div key={clinic} className="flex items-center gap-3">
                        <div className="w-24 text-sm text-gray-600">{clinic}</div>
                        <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-teal-500" style={{ width: `${[82, 75, 71][idx]}%` }} />
                        </div>
                        <div className="w-12 text-sm font-medium text-right">{[82, 75, 71][idx]}%</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-lg border p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Health by Category</h3>
                  <div className="space-y-3">
                    {['Clinical Equipment', 'IT & Digital', 'Furniture', 'Facility Systems'].map((cat, idx) => (
                      <div key={cat} className="flex items-center gap-3">
                        <div className="w-32 text-sm text-gray-600">{cat}</div>
                        <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-teal-500" style={{ width: `${[85, 78, 72, 68][idx]}%` }} />
                        </div>
                        <div className="w-12 text-sm font-medium text-right">{[85, 78, 72, 68][idx]}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Maintenance Tab */}
          {activeTab === 'maintenance' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Work Orders" value="98" change="+12% this month" icon={<Wrench size={24} />} color="#3B82F6" />
                <StatCard title="PM Compliance" value="94%" change="+2% from target" icon={<Calendar size={24} />} color="#10B981" />
                <StatCard title="Emergency Ratio" value="6%" change="-3% from last month" icon={<AlertTriangle size={24} />} color="#F59E0B" />
                <StatCard title="Maintenance Cost" value="$35K" change="YTD" icon={<DollarSign size={24} />} color="#8B5CF6" />
              </div>

              <div className="bg-white rounded-lg border p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Maintenance Costs Over Time</h3>
                <div className="h-64 flex items-end justify-around gap-2">
                  {mockMaintenanceTrends.map((item, idx) => (
                    <div key={idx} className="flex flex-col items-center flex-1">
                      <div className="w-full flex gap-1 items-end" style={{ height: `${(item.cost / 7000) * 100}%` }}>
                        <div className="flex-1 bg-green-400 rounded-t" title="Preventive" style={{ height: `${(item.preventive / 20) * 100}%` }} />
                        <div className="flex-1 bg-orange-400 rounded-t" title="Corrective" style={{ height: `${(item.corrective / 10) * 100}%` }} />
                        <div className="flex-1 bg-red-400 rounded-t" title="Emergency" style={{ height: `${(item.emergency / 3) * 100}%` }} />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">{item.month}</p>
                    </div>
                  ))}
                </div>
                <div className="flex justify-center gap-6 mt-4">
                  <span className="flex items-center gap-2 text-xs"><div className="w-3 h-3 bg-green-400 rounded" /> Preventive</span>
                  <span className="flex items-center gap-2 text-xs"><div className="w-3 h-3 bg-orange-400 rounded" /> Corrective</span>
                  <span className="flex items-center gap-2 text-xs"><div className="w-3 h-3 bg-red-400 rounded" /> Emergency</span>
                </div>
              </div>
            </div>
          )}

          {/* Acquisition Risk Tab */}
          {activeTab === 'acquisition' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Batches" value="2" icon={<Building2 size={24} />} color="#3B82F6" />
                <StatCard title="Inherited Assets" value="107" icon={<Package size={24} />} color="#8B5CF6" />
                <StatCard title="Missing Records" value="26" icon={<AlertTriangle size={24} />} color="#F59E0B" />
                <StatCard title="Hidden Capex" value="$120K" icon={<DollarSign size={24} />} color="#EF4444" />
              </div>

              <div className="bg-white rounded-lg border overflow-hidden">
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-gray-900">Acquisition Risk Analysis</h3>
                </div>
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Clinic</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Assets</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Missing Records</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">High Risk</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Hidden Capex</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Risk Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {mockAcquisitionRisks.map(batch => (
                      <tr key={batch.batch_id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{batch.clinic_name}</td>
                        <td className="px-4 py-3 text-right">{batch.total_assets}</td>
                        <td className="px-4 py-3 text-right">{batch.missing_records}</td>
                        <td className="px-4 py-3 text-right">{batch.high_risk_assets}</td>
                        <td className="px-4 py-3 text-right font-medium">${batch.hidden_capex.toLocaleString()}</td>
                        <td className="px-4 py-3 text-center">
                          <RiskScoreBadge score={batch.risk_score} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Standardization Tab */}
          {activeTab === 'standardization' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard title="Standardization Score" value="52%" change="+8% this quarter" icon={<Package size={24} />} color="#10B981" />
                <StatCard title="Potential Savings" value="$37K" icon={<DollarSign size={24} />} color="#8B5CF6" />
                <StatCard title="Opportunities" value="3" icon={<TrendingUp size={24} />} color="#3B82F6" />
              </div>

              <div className="space-y-4">
                {mockStandardization.map((item, idx) => (
                  <div key={idx} className="bg-white rounded-lg border p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">{item.category}</h3>
                        <p className="text-sm text-gray-500">{item.total_units} units across network</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        item.standardization_score >= 70 ? 'bg-green-100 text-green-800' :
                        item.standardization_score >= 40 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        Score: {item.standardization_score}%
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Vendors ({item.vendors.length})</p>
                        <div className="space-y-2">
                          {item.vendors.map((v, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              <div className="w-2 h-2 rounded-full bg-purple-400" />
                              <span className="flex-1">{v.name}</span>
                              <span className="text-gray-500">{v.count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Models ({item.models.length})</p>
                        <div className="space-y-2">
                          {item.models.map((m, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              <div className="w-2 h-2 rounded-full bg-teal-400" />
                              <span className="flex-1">{m.name}</span>
                              <span className="text-gray-500">{m.count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;
