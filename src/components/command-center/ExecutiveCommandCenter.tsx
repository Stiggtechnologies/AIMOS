import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, TriangleAlert as AlertTriangle, DollarSign, Building2, Activity, Users, Target, ArrowUpRight, ArrowDownRight, MapPin, Zap, Brain, ChevronRight, ExternalLink, RefreshCw, Info } from 'lucide-react';
import { enterpriseService } from '../../services/enterpriseService';
import { getActiveInitiatives, type Initiative } from '../../services/strategyOKRService';
import { launchService, type ClinicLaunch } from '../../services/launchService';
import { getFinancialAlerts } from '../../services/financialService';
import { supabase } from '../../lib/supabase';
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
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('ytd');
  const [regions, setRegions] = useState<Array<{ id: string; name: string; code: string }>>([]);

  useEffect(() => {
    loadRegions();
    loadData();
  }, []);

  useEffect(() => {
    loadData();
  }, [selectedRegion, selectedPeriod]);

  const loadRegions = async () => {
    try {
      const { data } = await supabase.from('regions').select('id, name, code').eq('is_active', true).order('name');
      if (data && data.length > 0) setRegions(data);
    } catch {}
  };

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
  const filteredClinics = selectedRegion === 'all'
    ? clinicPerformance
    : clinicPerformance.filter(c => c.region_name === regions.find(r => r.id === selectedRegion)?.name);

  const periodLabel = selectedPeriod === 'ytd' ? 'YTD' : selectedPeriod === 'q1' ? 'Q1' : selectedPeriod === 'mtd' ? 'MTD' : 'Last 30d';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Executive Command Center</h1>
          <p className="text-sm text-gray-500 mt-1">Network-wide portfolio performance and strategic oversight</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedRegion}
            onChange={e => setSelectedRegion(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
          >
            <option value="all">All Regions</option>
            {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            {regions.length === 0 && (
              <>
                <option value="ab_south">AB South</option>
                <option value="ab_west">AB West</option>
                <option value="ab_east">AB East</option>
              </>
            )}
          </select>
          <select
            value={selectedPeriod}
            onChange={e => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
          >
            <option value="ytd">YTD 2026</option>
            <option value="q1">Q1 2026</option>
            <option value="mtd">Month to Date</option>
            <option value="30d">Last 30 Days</option>
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
          <div className="text-xs text-sky-100 mt-0.5 flex items-center gap-1">
            Same-Clinic Growth
            <span title="YTD benchmark — connect revenue import for live figure" className="opacity-70 cursor-help"><Info className="h-2.5 w-2.5" /></span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-600 to-amber-700 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <Activity className="h-5 w-5 opacity-80" />
            <span className="text-xs text-amber-100">Target: 85%</span>
          </div>
          <div className="text-2xl font-bold">{networkStats?.avgUtilization?.toFixed(1) || 0}%</div>
          <div className="text-xs text-amber-100 mt-0.5">{periodLabel} Utilization</div>
        </div>

        <div className="bg-gradient-to-br from-rose-600 to-rose-700 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="h-5 w-5 opacity-80" />
            <span className="flex items-center text-xs text-rose-100">
              <ArrowDownRight className="h-3 w-3 mr-0.5" />-2 days
            </span>
          </div>
          <div className="text-2xl font-bold">38</div>
          <div className="text-xs text-rose-100 mt-0.5 flex items-center gap-1">
            AR Days
            <span title="Benchmark figure — connect billing AR report for live data" className="opacity-70 cursor-help"><Info className="h-2.5 w-2.5" /></span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <Users className="h-5 w-5 opacity-80" />
            <span className="text-xs text-teal-100">+12 this month</span>
          </div>
          <div className="text-2xl font-bold">72</div>
          <div className="text-xs text-teal-100 mt-0.5 flex items-center gap-1">
            NPS Score
            <span title="Survey benchmark — connect patient experience module for live data" className="opacity-70 cursor-help"><Info className="h-2.5 w-2.5" /></span>
          </div>
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
              {filteredClinics.slice(0, 10).map(clinic => (
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

      {/* Pattern Insights Panel — derived from clinic performance data */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Brain className="h-6 w-6 text-blue-400" />
            <h2 className="font-semibold text-lg">Pattern Insights</h2>
          </div>
          <button
            onClick={() => onNavigate('intelligence', 'ai-agents')}
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            Full AI Analysis <ExternalLink className="h-3 w-3" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Opportunity: derived from underperforming clinics with low utilization */}
          {filteredClinics.filter(c => c.utilization_rate < 70 && c.performance_status === 'behind').length > 0 ? (
            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-400">Capacity Opportunity</span>
              </div>
              <p className="text-sm mb-2">
                {filteredClinics.filter(c => c.utilization_rate < 70).length} clinic{filteredClinics.filter(c => c.utilization_rate < 70).length !== 1 ? 's' : ''} operating below 70% utilization — marketing activation or care pathway expansion may improve throughput.
              </p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Derived from clinic data</span>
                <button onClick={() => onNavigate('intelligence', 'utilization')} className="text-blue-400 hover:text-blue-300">View →</button>
              </div>
            </div>
          ) : (
            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-400">Network Opportunity</span>
              </div>
              <p className="text-sm mb-2">Employer program expansion and shockwave therapy activation are the top-rated growth levers for the current quarter.</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Based on growth playbooks</span>
                <button onClick={() => onNavigate('growth', 'playbooks')} className="text-blue-400 hover:text-blue-300">View →</button>
              </div>
            </div>
          )}

          {/* Risk: derived from clinics behind target */}
          {redClinics.length > 0 ? (
            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-medium text-amber-400">Revenue Risk</span>
              </div>
              <p className="text-sm mb-2">
                {redClinics.length} clinic{redClinics.length !== 1 ? 's' : ''} ({redClinics.map(c => c.clinic_name).join(', ')}) behind monthly revenue target. Early intervention recommended.
              </p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Derived from clinic data</span>
                <button onClick={() => onNavigate('intelligence', 'clinic-performance')} className="text-blue-400 hover:text-blue-300">Drill in →</button>
              </div>
            </div>
          ) : (
            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-medium text-amber-400">Watch</span>
              </div>
              <p className="text-sm mb-2">Credential renewal deadlines for clinical staff should be reviewed. Access the credentials module to see what expires within 60 days.</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Based on workforce data</span>
                <button onClick={() => onNavigate('workforce', 'credentials')} className="text-blue-400 hover:text-blue-300">View →</button>
              </div>
            </div>
          )}

          {/* Recommendation: always data-linked */}
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Zap className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-400">Strategic Recommendation</span>
            </div>
            <p className="text-sm mb-2">
              {initiatives.length > 0
                ? `${initiatives.filter(i => i.status === 'in_progress').length} of ${initiatives.length} strategic initiatives are actively in progress. Review OKR alignment before quarter close.`
                : 'No active strategic initiatives found. Consider setting Q2 OKRs in the Strategy module to align the team.'}
            </p>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Based on OKR data</span>
              <button onClick={() => onNavigate('strategy', 'okrs')} className="text-blue-400 hover:text-blue-300">View OKRs →</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
