import { useState } from 'react';
import { Building2, Users, DollarSign, TrendingUp, AlertTriangle, MapPin, Activity, Clock, ArrowUpRight, ArrowDownRight, ChevronRight, UserMinus } from 'lucide-react';

interface RegionalOpsCommandCenterProps {
  onNavigate: (module: string, subModule: string) => void;
}

interface ClinicComparison {
  id: string;
  name: string;
  revenue: number;
  revenueVsTarget: number;
  utilization: number;
  arrivalRate: number;
  arDays: number;
  staffGaps: number;
  status: 'on_track' | 'at_risk' | 'behind';
}

interface StaffingEscalation {
  id: string;
  clinic: string;
  role: string;
  shift: string;
  date: string;
  urgency: 'critical' | 'high' | 'medium';
}

interface RegionalAction {
  id: string;
  title: string;
  clinic: string;
  assignedTo: string;
  dueDate: string;
  status: 'open' | 'in_progress' | 'completed';
}

export function RegionalOpsCommandCenter({ onNavigate }: RegionalOpsCommandCenterProps) {
  const [selectedRegion] = useState('Edmonton South');

  const [regionKPIs] = useState({
    totalRevenue: 2850000,
    revenueGrowth: 8.2,
    avgUtilization: 82.5,
    totalPatients: 4250,
    avgArrivalRate: 91.2,
    avgArDays: 38,
    clinicsOnTrack: 8,
    clinicsAtRisk: 2,
    clinicsBehind: 1
  });

  const [clinics] = useState<ClinicComparison[]>([
    { id: '1', name: 'AIM South Commons', revenue: 425000, revenueVsTarget: 105, utilization: 88, arrivalRate: 94, arDays: 32, staffGaps: 0, status: 'on_track' },
    { id: '2', name: 'AIM Windermere', revenue: 380000, revenueVsTarget: 98, utilization: 85, arrivalRate: 92, arDays: 35, staffGaps: 1, status: 'on_track' },
    { id: '3', name: 'AIM Sherwood Park', revenue: 355000, revenueVsTarget: 92, utilization: 79, arrivalRate: 88, arDays: 42, staffGaps: 2, status: 'at_risk' },
    { id: '4', name: 'AIM West Edmonton', revenue: 340000, revenueVsTarget: 88, utilization: 76, arrivalRate: 85, arDays: 48, staffGaps: 3, status: 'behind' },
    { id: '5', name: 'AIM Downtown', revenue: 290000, revenueVsTarget: 95, utilization: 82, arrivalRate: 90, arDays: 38, staffGaps: 0, status: 'on_track' },
    { id: '6', name: 'AIM Millwoods', revenue: 275000, revenueVsTarget: 97, utilization: 84, arrivalRate: 91, arDays: 36, staffGaps: 1, status: 'on_track' },
  ]);

  const [staffingEscalations] = useState<StaffingEscalation[]>([
    { id: '1', clinic: 'AIM West Edmonton', role: 'PT', shift: 'Morning', date: 'Tomorrow', urgency: 'critical' },
    { id: '2', clinic: 'AIM Sherwood Park', role: 'RMT', shift: 'Afternoon', date: 'Friday', urgency: 'high' },
    { id: '3', clinic: 'AIM West Edmonton', role: 'Front Desk', shift: 'All Day', date: 'Monday', urgency: 'high' },
  ]);

  const [actions] = useState<RegionalAction[]>([
    { id: '1', title: 'Review West Edmonton staffing plan', clinic: 'AIM West Edmonton', assignedTo: 'Maria Garcia', dueDate: 'Today', status: 'in_progress' },
    { id: '2', title: 'Address AR aging at Sherwood Park', clinic: 'AIM Sherwood Park', assignedTo: 'James Wilson', dueDate: 'This Week', status: 'open' },
    { id: '3', title: 'Utilization improvement coaching', clinic: 'AIM West Edmonton', assignedTo: 'Dr. Chen', dueDate: 'This Week', status: 'open' },
  ]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  const getStatusColor = (status: ClinicComparison['status']) => {
    const colors = {
      on_track: 'bg-emerald-100 text-emerald-700',
      at_risk: 'bg-amber-100 text-amber-700',
      behind: 'bg-red-100 text-red-700'
    };
    return colors[status];
  };

  const getHeatmapColor = (value: number, metric: 'utilization' | 'arrival' | 'ar') => {
    if (metric === 'ar') {
      if (value <= 35) return 'bg-emerald-100 text-emerald-700';
      if (value <= 42) return 'bg-amber-100 text-amber-700';
      return 'bg-red-100 text-red-700';
    }
    if (value >= 90) return 'bg-emerald-100 text-emerald-700';
    if (value >= 80) return 'bg-amber-100 text-amber-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Regional Operations</h1>
          <p className="text-sm text-gray-500 mt-1">Multi-clinic performance and coordination for {selectedRegion}</p>
        </div>
        <div className="flex items-center space-x-3">
          <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
            <option>Edmonton South</option>
            <option>Edmonton North</option>
            <option>Calgary</option>
            <option>Red Deer</option>
          </select>
          <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
            <option>MTD</option>
            <option>QTD</option>
            <option>YTD</option>
            <option>Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Region KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="h-5 w-5 opacity-80" />
            <span className="flex items-center text-xs text-blue-100">
              <ArrowUpRight className="h-3 w-3 mr-0.5" />+{regionKPIs.revenueGrowth}%
            </span>
          </div>
          <div className="text-2xl font-bold">{formatCurrency(regionKPIs.totalRevenue)}</div>
          <div className="text-xs text-blue-100 mt-0.5">Region Revenue</div>
        </div>

        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <Activity className="h-5 w-5 opacity-80" />
            <span className="text-xs text-emerald-100">Target: 85%</span>
          </div>
          <div className="text-2xl font-bold">{regionKPIs.avgUtilization}%</div>
          <div className="text-xs text-emerald-100 mt-0.5">Avg Utilization</div>
        </div>

        <div className="bg-gradient-to-br from-sky-600 to-sky-700 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <Users className="h-5 w-5 opacity-80" />
          </div>
          <div className="text-2xl font-bold">{regionKPIs.totalPatients.toLocaleString()}</div>
          <div className="text-xs text-sky-100 mt-0.5">Active Patients</div>
        </div>

        <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="h-5 w-5 opacity-80" />
          </div>
          <div className="text-2xl font-bold">{regionKPIs.avgArrivalRate}%</div>
          <div className="text-xs text-teal-100 mt-0.5">Arrival Rate</div>
        </div>

        <div className="bg-gradient-to-br from-amber-600 to-amber-700 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <Clock className="h-5 w-5 opacity-80" />
            <span className="flex items-center text-xs text-amber-100">
              <ArrowDownRight className="h-3 w-3 mr-0.5" />-2
            </span>
          </div>
          <div className="text-2xl font-bold">{regionKPIs.avgArDays}</div>
          <div className="text-xs text-amber-100 mt-0.5">AR Days</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center space-x-1 mb-2">
            <Building2 className="h-5 w-5 text-gray-400" />
          </div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full">{regionKPIs.clinicsOnTrack}</span>
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">{regionKPIs.clinicsAtRisk}</span>
            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">{regionKPIs.clinicsBehind}</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">Clinic Status</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Clinic Comparison Heatmap */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-blue-500" />
              <h2 className="font-semibold text-gray-900">Clinic Performance Comparison</h2>
            </div>
            <button
              onClick={() => onNavigate('intelligence', 'clinic-performance')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Full Analysis
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-500 uppercase tracking-wider bg-gray-50">
                  <th className="px-4 py-3 text-left">Clinic</th>
                  <th className="px-4 py-3 text-right">Revenue</th>
                  <th className="px-4 py-3 text-right">vs Target</th>
                  <th className="px-4 py-3 text-center">Util %</th>
                  <th className="px-4 py-3 text-center">Arrival %</th>
                  <th className="px-4 py-3 text-center">AR Days</th>
                  <th className="px-4 py-3 text-center">Gaps</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {clinics.map(clinic => (
                  <tr key={clinic.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{clinic.name}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(clinic.revenue)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={clinic.revenueVsTarget >= 100 ? 'text-emerald-600' : 'text-red-600'}>
                        {clinic.revenueVsTarget >= 100 ? '+' : ''}{clinic.revenueVsTarget - 100}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getHeatmapColor(clinic.utilization, 'utilization')}`}>
                        {clinic.utilization}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getHeatmapColor(clinic.arrivalRate, 'arrival')}`}>
                        {clinic.arrivalRate}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getHeatmapColor(clinic.arDays, 'ar')}`}>
                        {clinic.arDays}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {clinic.staffGaps > 0 ? (
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                          {clinic.staffGaps}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(clinic.status)}`}>
                        {clinic.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Staffing Escalations */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <UserMinus className="h-5 w-5 text-red-500" />
              <h2 className="font-semibold text-gray-900">Staffing Escalations</h2>
            </div>
            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
              {staffingEscalations.filter(e => e.urgency === 'critical').length} critical
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {staffingEscalations.map(esc => (
              <div key={esc.id} className={`p-4 border-l-4 ${
                esc.urgency === 'critical' ? 'border-red-500 bg-red-50' :
                esc.urgency === 'high' ? 'border-amber-500 bg-amber-50' :
                'border-blue-500 bg-blue-50'
              }`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm text-gray-900">{esc.clinic}</p>
                    <p className="text-sm text-gray-600">{esc.role} - {esc.shift}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{esc.date}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    esc.urgency === 'critical' ? 'bg-red-200 text-red-800' :
                    esc.urgency === 'high' ? 'bg-amber-200 text-amber-800' :
                    'bg-blue-200 text-blue-800'
                  }`}>
                    {esc.urgency}
                  </span>
                </div>
                <button className="mt-2 text-xs text-blue-600 font-medium hover:text-blue-700">
                  Assign Coverage <ChevronRight className="h-3 w-3 inline" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Queue */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h2 className="font-semibold text-gray-900">Regional Action Queue</h2>
          </div>
          <button className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
            + New Action
          </button>
        </div>
        <div className="divide-y divide-gray-50">
          {actions.map(action => (
            <div key={action.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
              <div className="flex items-center space-x-4">
                <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">{action.title}</p>
                  <p className="text-sm text-gray-500">{action.clinic} - {action.assignedTo}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-500">{action.dueDate}</span>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  action.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                  action.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {action.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
