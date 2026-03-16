import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, TriangleAlert as AlertTriangle, DollarSign, Building2, Activity, Users, Target, ArrowUpRight, ArrowDownRight, MapPin, Zap, Brain, ChevronRight, ExternalLink, RefreshCw } from 'lucide-react';
import { enterpriseService } from '../../services/enterpriseService';
import { getActiveInitiatives, type Initiative } from '../../services/strategyOKRService';
import { launchService, type ClinicLaunch } from '../../services/launchService';
import { getFinancialAlerts } from '../../services/financialService';
import type { NetworkStats, RegionalPerformance, ClinicPerformance } from '../../types/enterprise';

interface ExecutiveCommandCenterProps {
  onNavigate: (module: string, subModule: string) => void;
}

interface ExecutiveAlert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  clinic?: string;
  metric?: string;
  action: string;
  timestamp: string;
}


export function ExecutiveCommandCenter({ onNavigate }: ExecutiveCommandCenterProps) {
  const [networkStats, setNetworkStats] = useState<NetworkStats | null>(null);
  const [regionalPerformance, setRegionalPerformance] = useState<RegionalPerformance[]>([]);
  const [clinicPerformance, setClinicPerformance] = useState<ClinicPerformance[]>([]);
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [launches, setLaunches] = useState<ClinicLaunch[]>([]);
  const [alerts, setAlerts] = useState<ExecutiveAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [stats, regions, clinics, activeInitiatives, allLaunches, financialAlerts] = await Promise.all([
        enterpriseService.getNetworkStats(),
        enterpriseService.getRegionalPerformance(),
        enterpriseService.getClinicPerformance(),
        getActiveInitiatives(),
        launchService.getAllLaunches(),
        getFinancialAlerts(undefined, 'open')
      ]);
      setNetworkStats(stats);
      setRegionalPerformance(regions);
      setClinicPerformance(clinics);
      setInitiatives(activeInitiatives.slice(0, 4));
      setLaunches(allLaunches.filter(l => ['planning', 'approved', 'in_progress', 'at_risk', 'delayed'].includes(l.status)).slice(0, 3));
      setAlerts(financialAlerts.slice(0, 5).map((a: any) => ({
        id: a.id,
        severity: a.severity === 'critical' ? 'critical' : a.severity === 'high' ? 'critical' : a.severity === 'medium' ? 'warning' : 'info',
        title: a.alert_type?.replace(/_/g, ' ') || 'Financial Alert',
        description: a.description || a.recommended_action || '',
        metric: a.metric_name,
        action: 'Review',
        timestamp: new Date(a.alert_date).toLocaleDateString()
      })));
    } catch (error) {
      console.error('Error loading executive data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  const redClinics = clinicPerformance.filter(c => c.performance_status === 'behind');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Executive Command Center</h1>
          <p className="text-sm text-gray-500 mt-1">Network-wide portfolio performance and strategic oversight</p>
        </div>
        <div className="flex items-center space-x-3">
          <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
            <option>All Regions</option>
            <option>GTA</option>
            <option>SWO</option>
            <option>EO</option>
            <option>NO</option>
            <option>AB</option>
          </select>
          <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
            <option>YTD 2026</option>
            <option>Q1 2026</option>
            <option>MTD</option>
            <option>Last 30 Days</option>
          </select>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* North Star KPIs - 6 max per spec */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="h-5 w-5 opacity-80" />
            <span className="flex items-center text-xs text-blue-100">
              <ArrowUpRight className="h-3 w-3 mr-0.5" />+8.2%
            </span>
          </div>
          <div className="text-2xl font-bold">{networkStats ? formatCurrency(networkStats.ytdRevenue) : '$0'}</div>
          <div className="text-xs text-blue-100 mt-0.5">YTD Revenue</div>
        </div>

        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <Target className="h-5 w-5 opacity-80" />
            <span className="flex items-center text-xs text-emerald-100">
              <ArrowUpRight className="h-3 w-3 mr-0.5" />+1.2%
            </span>
          </div>
          <div className="text-2xl font-bold">{networkStats?.avgMargin?.toFixed(1) || 0}%</div>
          <div className="text-xs text-emerald-100 mt-0.5">EBITDA Margin</div>
        </div>

        <div className="bg-gradient-to-br from-sky-600 to-sky-700 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="h-5 w-5 opacity-80" />
            <span className="flex items-center text-xs text-sky-100">
              <ArrowUpRight className="h-3 w-3 mr-0.5" />+5.4%
            </span>
          </div>
          <div className="text-2xl font-bold">7.2%</div>
          <div className="text-xs text-sky-100 mt-0.5">Same-Clinic Growth</div>
        </div>

        <div className="bg-gradient-to-br from-amber-600 to-amber-700 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <Activity className="h-5 w-5 opacity-80" />
            <span className="text-xs text-amber-100">Target: 85%</span>
          </div>
          <div className="text-2xl font-bold">{networkStats?.avgUtilization?.toFixed(1) || 0}%</div>
          <div className="text-xs text-amber-100 mt-0.5">Utilization</div>
        </div>

        <div className="bg-gradient-to-br from-rose-600 to-rose-700 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="h-5 w-5 opacity-80" />
            <span className="flex items-center text-xs text-rose-100">
              <ArrowDownRight className="h-3 w-3 mr-0.5" />-2 days
            </span>
          </div>
          <div className="text-2xl font-bold">38</div>
          <div className="text-xs text-rose-100 mt-0.5">AR Days</div>
        </div>

        <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <Users className="h-5 w-5 opacity-80" />
            <span className="text-xs text-teal-100">+12 this month</span>
          </div>
          <div className="text-2xl font-bold">72</div>
          <div className="text-xs text-teal-100 mt-0.5">NPS Score</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Critical Alerts & Red Clinics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <h2 className="font-semibold text-gray-900">Alerts & Risks</h2>
            </div>
            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
              {alerts.filter(a => a.severity === 'critical').length} critical
            </span>
          </div>
          <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
            {alerts.map(alert => (
              <div
                key={alert.id}
                className={`p-4 border-l-4 ${
                  alert.severity === 'critical' ? 'border-red-500 bg-red-50' :
                  alert.severity === 'warning' ? 'border-amber-500 bg-amber-50' :
                  'border-blue-500 bg-blue-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm text-gray-900">{alert.title}</p>
                    <p className="text-sm text-gray-600 mt-0.5">{alert.description}</p>
                  </div>
                  <span className="text-xs text-gray-500">{alert.timestamp}</span>
                </div>
                <button className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-700">
                  {alert.action} <ChevronRight className="h-3 w-3 inline" />
                </button>
              </div>
            ))}
            {redClinics.length > 0 && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-4 w-4 text-red-600" />
                    <span className="font-medium text-sm text-red-800">
                      {redClinics.length} clinic{redClinics.length !== 1 ? 's' : ''} behind target
                    </span>
                  </div>
                  <button
                    onClick={() => onNavigate('intelligence', 'clinic-performance')}
                    className="text-xs font-medium text-red-600 hover:text-red-700"
                  >
                    View All <ExternalLink className="h-3 w-3 inline" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Strategic Initiatives */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-amber-500" />
              <h2 className="font-semibold text-gray-900">Strategic Initiatives</h2>
            </div>
            <button
              onClick={() => onNavigate('strategy', 'initiatives')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View All
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {initiatives.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Target className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No active initiatives</p>
              </div>
            ) : initiatives.map(initiative => (
              <div key={initiative.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-sm text-gray-900">{initiative.title}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    initiative.status === 'in_progress' ? 'bg-emerald-100 text-emerald-700' :
                    initiative.status === 'planning' ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {initiative.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                  <span className="capitalize">{initiative.priority} priority</span>
                  {initiative.due_date && <span>Due: {new Date(initiative.due_date).toLocaleDateString()}</span>}
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      initiative.status === 'in_progress' ? 'bg-emerald-500' :
                      initiative.status === 'planning' ? 'bg-amber-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${initiative.percent_complete}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Expansion / Launch Pipeline */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-blue-500" />
              <h2 className="font-semibold text-gray-900">Expansion Pipeline</h2>
            </div>
            <button
              onClick={() => onNavigate('operations', 'launches')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View All
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {launches.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <MapPin className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No active launches</p>
              </div>
            ) : launches.map(launch => (
              <div key={launch.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-sm text-gray-900">{launch.launch_name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    launch.status === 'in_progress' ? 'bg-emerald-100 text-emerald-700' :
                    launch.status === 'at_risk' || launch.status === 'delayed' ? 'bg-amber-100 text-amber-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {launch.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                  <span>Target: {new Date(launch.target_open_date).toLocaleDateString()}</span>
                  {launch.approved_budget && (
                    <span>Budget: {formatCurrency(launch.actual_cost)} / {formatCurrency(launch.approved_budget)}</span>
                  )}
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${launch.overall_completion_pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Clinic League Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Clinic Performance League</h2>
          <div className="flex items-center space-x-3">
            <select className="px-2 py-1 border border-gray-200 rounded text-sm">
              <option>Sort by Revenue</option>
              <option>Sort by Utilization</option>
              <option>Sort by Margin</option>
              <option>Sort by Status</option>
            </select>
            <button
              onClick={() => onNavigate('intelligence', 'clinic-performance')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Full Analysis
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-500 uppercase tracking-wider bg-gray-50">
                <th className="px-4 py-3 text-left">Clinic</th>
                <th className="px-4 py-3 text-left">Region</th>
                <th className="px-4 py-3 text-right">MTD Revenue</th>
                <th className="px-4 py-3 text-right">Utilization</th>
                <th className="px-4 py-3 text-right">Rev/Visit</th>
                <th className="px-4 py-3 text-right">vs Target</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {clinicPerformance.slice(0, 10).map(clinic => (
                <tr key={clinic.clinic_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{clinic.clinic_name}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{clinic.region_name}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(clinic.mtd_revenue)}</td>
                  <td className="px-4 py-3 text-right">{clinic.utilization_rate.toFixed(1)}%</td>
                  <td className="px-4 py-3 text-right">${clinic.revenue_per_visit.toFixed(0)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={clinic.revenue_target_pct >= 100 ? 'text-emerald-600' : 'text-red-600'}>
                      {clinic.revenue_target_pct >= 100 ? '+' : ''}{(clinic.revenue_target_pct - 100).toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      clinic.performance_status === 'on_track' ? 'bg-emerald-100 text-emerald-700' :
                      clinic.performance_status === 'at_risk' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {clinic.performance_status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Insights Panel */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-6 text-white">
        <div className="flex items-center space-x-3 mb-4">
          <Brain className="h-6 w-6 text-blue-400" />
          <h2 className="font-semibold text-lg">AI Executive Insights</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-400">Opportunity</span>
            </div>
            <p className="text-sm mb-2">Shockwave therapy demand in GTA region is 40% above capacity. Consider expansion.</p>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Impact: +$180K/year</span>
              <span className="text-blue-400">87% confidence</span>
            </div>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-medium text-amber-400">Risk</span>
            </div>
            <p className="text-sm mb-2">3 clinics showing revenue decline pattern consistent with staff turnover risk.</p>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Potential loss: -$95K</span>
              <span className="text-blue-400">79% confidence</span>
            </div>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Zap className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-400">Recommendation</span>
            </div>
            <p className="text-sm mb-2">Reallocate marketing spend from low-performing channels to employer partnerships.</p>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">ROI improvement: +22%</span>
              <span className="text-blue-400">91% confidence</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
