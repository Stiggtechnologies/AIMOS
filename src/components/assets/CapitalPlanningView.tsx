import React, { useState } from 'react';
import { 
  TrendingUp, 
  Building2, 
  DollarSign, 
  AlertTriangle, 
  Calendar,
  Package,
  BarChart3,
  ChevronRight,
  Filter,
  Download,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Wrench
} from 'lucide-react';

// Types
interface CapexForecastItem {
  month: string;
  amount: number;
  clinic: string;
  assets: string[];
}

interface ClinicCapex {
  clinic_id: string;
  clinic_name: string;
  total_replacement_value: number;
  top_assets: { name: string; cost: number }[];
  capex_12m: number;
  capex_24m: number;
  capex_36m: number;
  modernization_priority: 'low' | 'medium' | 'high';
}

interface RepairReplaceItem {
  asset_id: string;
  asset_name: string;
  asset_tag: string;
  clinic_name: string;
  repair_cost: number;
  replace_cost: number;
  recommendation: 'repair' | 'replace';
  reasoning: string;
}

interface StandardizationOpportunity {
  category: string;
  current_vendors: number;
  current_models: number;
  total_units: number;
  recommendation: string;
  estimated_savings: number;
}

// Mock data
const mockCapexForecast: CapexForecastItem[] = [
  { month: 'Apr 2026', amount: 15000, clinic: 'Red Deer', assets: ['Treatment Table'] },
  { month: 'May 2026', amount: 22000, clinic: 'Edmonton', assets: ['Shockwave Unit'] },
  { month: 'Jun 2026', amount: 8000, clinic: 'Calgary South', assets: ['Laptop Fleet'] },
  { month: 'Jul 2026', amount: 12000, clinic: 'Edmonton', assets: ['Treatment Table'] },
  { month: 'Aug 2026', amount: 35000, clinic: 'Red Deer', assets: ['Reception Buildout', 'Treatment Table'] },
  { month: 'Sep 2026', amount: 18000, clinic: 'Calgary South', assets: ['Network Equipment'] },
  { month: 'Oct 2026', amount: 25000, clinic: 'Edmonton', assets: ['Treadmill', 'Rehab Bike'] },
  { month: 'Nov 2026', amount: 5000, clinic: 'Fort McMurray', assets: ['IT Equipment'] },
  { month: 'Dec 2026', amount: 45000, clinic: 'Multiple', assets: ['Year-end upgrades'] },
  { month: 'Jan 2027', amount: 15000, clinic: 'Edmonton', assets: ['Treatment Table'] },
  { month: 'Feb 2027', amount: 28000, clinic: 'Calgary South', assets: ['HVAC'] },
  { month: 'Mar 2027', amount: 12000, clinic: 'Red Deer', assets: ['Equipment'] },
];

const mockClinicCapex: ClinicCapex[] = [
  {
    clinic_id: '1',
    clinic_name: 'AIM Edmonton',
    total_replacement_value: 45000,
    top_assets: [
      { name: 'Shockwave Unit', cost: 22000 },
      { name: 'Treatment Table', cost: 12000 },
      { name: 'Treadmill', cost: 6000 },
      { name: 'Rehab Bike', cost: 3000 },
      { name: 'Laptop', cost: 2000 }
    ],
    capex_12m: 85000,
    capex_24m: 150000,
    capex_36m: 220000,
    modernization_priority: 'medium'
  },
  {
    clinic_id: '2',
    clinic_name: 'Calgary South',
    total_replacement_value: 38000,
    top_assets: [
      { name: 'Network Equipment', cost: 18000 },
      { name: 'Treatment Table', cost: 12000 },
      { name: 'Laptop Fleet', cost: 5000 },
      { name: 'Security System', cost: 3000 }
    ],
    capex_12m: 62000,
    capex_24m: 95000,
    capex_36m: 145000,
    modernization_priority: 'high'
  },
  {
    clinic_id: '3',
    clinic_name: 'Red Deer',
    total_replacement_value: 52000,
    top_assets: [
      { name: 'Reception Buildout', cost: 20000 },
      { name: 'Treatment Table', cost: 12000 },
      { name: 'HVAC System', cost: 12000 },
      { name: 'Treatment Table 2', cost: 5000 }
    ],
    capex_12m: 95000,
    capex_24m: 180000,
    capex_36m: 280000,
    modernization_priority: 'high'
  }
];

const mockRepairReplace: RepairReplaceItem[] = [
  {
    asset_id: '1',
    asset_name: 'Treatment Table',
    asset_tag: 'AIM-RD-001-T001',
    clinic_name: 'Red Deer',
    repair_cost: 2500,
    replace_cost: 12000,
    recommendation: 'replace',
    reasoning: 'Age 90% of useful life + maintenance costs exceed 20% of replacement'
  },
  {
    asset_id: '2',
    asset_name: 'Laptop',
    asset_tag: 'AIM-EDM-001-L001',
    clinic_name: 'Edmonton',
    repair_cost: 400,
    replace_cost: 1500,
    recommendation: 'repair',
    reasoning: 'Battery replacement cheaper than full replacement'
  }
];

const mockStandardization: StandardizationOpportunity[] = [
  {
    category: 'Treatment Tables',
    current_vendors: 3,
    current_models: 4,
    total_units: 12,
    recommendation: 'Standardize on Physiomed ProTable 3000 across network',
    estimated_savings: 24000
  },
  {
    category: 'Laptops',
    current_vendors: 2,
    current_models: 3,
    total_units: 8,
    recommendation: 'Standardize Dell Latitude 5540 for all front desk',
    estimated_savings: 5000
  },
  {
    category: 'Network Equipment',
    current_vendors: 2,
    current_models: 2,
    total_units: 6,
    recommendation: 'Consolidate to Ubiquiti UniFi across all clinics',
    estimated_savings: 8000
  }
];

// Components
const StatCard: React.FC<{
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  trend?: 'up' | 'down';
}> = ({ title, value, subtitle, icon, color, trend }) => (
  <div className="bg-white rounded-lg shadow p-4 border-l-4" style={{ borderLeftColor: color }}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold" style={{ color }}>{value}</p>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </div>
      <div className="flex flex-col items-end">
        <div className="text-2xl" style={{ color }}>{icon}</div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {trend}
          </div>
        )}
      </div>
    </div>
  </div>
);

// Main Component
export const CapitalPlanningView: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'12' | '24' | '36'>('12');
  const [filterClinic, setFilterClinic] = useState('all');

  const totalCapex12m = mockCapexForecast.slice(0, 12).reduce((sum, item) => sum + item.amount, 0);
  const totalCapex24m = mockCapexForecast.slice(0, 24).reduce((sum, item) => sum + item.amount, 0);
  const totalCapex36m = mockCapexForecast.slice(0, 36).reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="text-purple-600" />
              Capital Planning
            </h1>
            <p className="mt-2 text-gray-600">Forecast replacement and modernization investment across AIM</p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">
              <Download size={18} />
              Export
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              <Plus size={18} />
              Create Capex Plan
            </button>
          </div>
        </div>
      </div>

      {/* Timeframe Toggle */}
      <div className="bg-white rounded-lg shadow mb-4 p-2 inline-flex">
        {(['12', '24', '36'] as const).map((tf, idx) => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              timeframe === tf 
                ? 'bg-purple-600 text-white' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tf} Months
            {idx === 0 && ` ($${(totalCapex12m / 1000).toFixed(0)}K)`}
            {idx === 1 && ` ($${(totalCapex24m / 1000).toFixed(0)}K)`}
            {idx === 2 && ` ($${(totalCapex36m / 1000).toFixed(0)}K)`}
          </button>
        ))}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard 
          title="12-Month Capex" 
          value={`$${(totalCapex12m / 1000).toFixed(0)}K`}
          subtitle="Planned + projected"
          icon={<DollarSign size={24} />}
          color="#8B5CF6"
          trend="up"
        />
        <StatCard 
          title="24-Month Capex" 
          value={`$${(totalCapex24m / 1000).toFixed(0)}K`}
          icon={<Calendar size={24} />}
          color="#3B82F6"
        />
        <StatCard 
          title="36-Month Capex" 
          value={`$${(totalCapex36m / 1000).toFixed(0)}K`}
          icon={<BarChart3 size={24} />}
          color="#10B981"
        />
        <StatCard 
          title="Highest Exposure" 
          value="Red Deer"
          subtitle="$280K over 3 years"
          icon={<Building2 size={24} />}
          color="#EF4444"
        />
        <StatCard 
          title="Replace Now" 
          value="3 Assets"
          subtitle="Urgent action required"
          icon={<AlertTriangle size={24} />}
          color="#F59E0B"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Capex Forecast Chart */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Replacement Forecast</h2>
          <div className="h-64 flex items-end justify-around gap-2">
            {mockCapexForecast.slice(0, 12).map((item, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-purple-500 rounded-t hover:bg-purple-600 transition-colors"
                  style={{ height: `${(item.amount / 50000) * 100}%` }}
                  title={`${item.month}: $${item.amount.toLocaleString()}`}
                />
                <p className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-center whitespace-nowrap">
                  {item.month.split(' ')[0]}
                </p>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-6 mt-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 bg-purple-500 rounded" />
              Monthly Replacement
            </span>
          </div>
        </div>

        {/* Repair vs Replace */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Repair vs Replace</h2>
          <div className="space-y-3">
            {mockRepairReplace.map((item, idx) => (
              <div key={idx} className={`p-3 rounded-lg border ${item.recommendation === 'replace' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{item.asset_name}</p>
                    <p className="text-xs text-gray-500">{item.clinic_name} • {item.asset_tag}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    item.recommendation === 'replace' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {item.recommendation === 'replace' ? 'Replace' : 'Repair'}
                  </span>
                </div>
                <div className="flex justify-between mt-2 text-xs">
                  <span className="text-gray-600">Repair: ${item.repair_cost}</span>
                  <span className="text-gray-600">Replace: ${item.replace_cost}</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">{item.reasoning}</p>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-lg">
            View All Candidates →
          </button>
        </div>
      </div>

      {/* Capex by Clinic */}
      <div className="bg-white rounded-lg shadow mt-6">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Capex by Clinic</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clinic</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Replacement Value</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">12-Month Capex</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">24-Month Capex</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">36-Month Capex</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Modernization Priority</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {mockClinicCapex.map(clinic => (
                <tr key={clinic.clinic_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{clinic.clinic_name}</td>
                  <td className="px-4 py-3 text-right">${clinic.total_replacement_value.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-medium text-purple-600">${clinic.capex_12m.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">${clinic.capex_24m.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">${clinic.capex_36m.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      clinic.modernization_priority === 'high' ? 'bg-red-100 text-red-800' :
                      clinic.modernization_priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {clinic.modernization_priority.charAt(0).toUpperCase() + clinic.modernization_priority.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button className="text-purple-600 hover:text-purple-800 text-sm font-medium">
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Standardization Opportunities */}
      <div className="bg-white rounded-lg shadow mt-6">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Standardization Opportunities</h2>
          <span className="text-sm text-green-600 flex items-center gap-1">
            <TrendingUp size={16} />
            Potential savings: $37K
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
          {mockStandardization.map((opp, idx) => (
            <div key={idx} className="bg-purple-50 rounded-lg p-4 border border-purple-100">
              <h3 className="font-semibold text-gray-900">{opp.category}</h3>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-600">{opp.current_vendors} vendors</span>
                <span className="text-gray-600">{opp.current_models} models</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">{opp.recommendation}</p>
              <p className="text-lg font-bold text-green-600 mt-2">Save ${opp.estimated_savings.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CapitalPlanningView;
