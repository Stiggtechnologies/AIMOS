import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Clock, DollarSign, Users, Building2, Activity, Brain, Bell, ArrowUpRight, ArrowDownRight, MoveHorizontal as MoreHorizontal, RefreshCw, Target, Calendar, FileText, Zap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { enterpriseService } from '../../services/enterpriseService';
import type { NetworkStats, RegionalPerformance, ClinicPerformance } from '../../types/enterprise';

interface CommandCenterProps {
  onNavigate: (module: string, subModule: string) => void;
}

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  time: string;
  action?: string;
}

interface Task {
  id: string;
  title: string;
  due: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress';
}

interface AIInsight {
  id: string;
  type: 'opportunity' | 'risk' | 'recommendation';
  title: string;
  impact: string;
  confidence: number;
}

export function CommandCenter({ onNavigate }: CommandCenterProps) {
  const { profile } = useAuth();
  const [networkStats, setNetworkStats] = useState<NetworkStats | null>(null);
  const [regionalPerformance, setRegionalPerformance] = useState<RegionalPerformance[]>([]);
  const [clinicPerformance, setClinicPerformance] = useState<ClinicPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const [alerts] = useState<Alert[]>([
    { id: '1', type: 'critical', title: 'Capacity Alert', message: 'AIM North is at 95% capacity for next week', time: '5m ago', action: 'View Schedule' },
    { id: '2', type: 'warning', title: 'Claims Pending', message: '12 WSIB claims approaching SLA deadline', time: '1h ago', action: 'Review Claims' },
    { id: '3', type: 'warning', title: 'Credential Expiring', message: '3 clinician certifications expire in 30 days', time: '2h ago', action: 'View Credentials' },
    { id: '4', type: 'info', title: 'New Referral Source', message: 'Dr. Smith referred 5 patients this week', time: '3h ago', action: 'View Details' }
  ]);

  const [tasks] = useState<Task[]>([
    { id: '1', title: 'Review Q1 financial report', due: 'Today', priority: 'high', status: 'pending' },
    { id: '2', title: 'Approve South Commons equipment order', due: 'Tomorrow', priority: 'medium', status: 'pending' },
    { id: '3', title: 'Complete regional director 1:1 prep', due: 'Mar 15', priority: 'medium', status: 'in_progress' },
    { id: '4', title: 'Sign off on new PT hire', due: 'Mar 16', priority: 'low', status: 'pending' }
  ]);

  const [insights] = useState<AIInsight[]>([
    { id: '1', type: 'opportunity', title: 'Shockwave therapy upsell potential', impact: '+$45K monthly revenue', confidence: 87 },
    { id: '2', type: 'risk', title: 'Burnout risk detected at AIM Central', impact: '3 clinicians flagged', confidence: 82 },
    { id: '3', type: 'recommendation', title: 'Optimize Tuesday scheduling', impact: '+12% utilization', confidence: 91 }
  ]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [stats, regions, clinics] = await Promise.all([
        enterpriseService.getNetworkStats(),
        enterpriseService.getRegionalPerformance(),
        enterpriseService.getClinicPerformance()
      ]);
      setNetworkStats(stats);
      setRegionalPerformance(regions);
      setClinicPerformance(clinics);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error loading command center data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const getAlertColor = (type: Alert['type']) => {
    switch (type) {
      case 'critical': return 'bg-red-50 border-red-200 text-red-800';
      case 'warning': return 'bg-amber-50 border-amber-200 text-amber-800';
      case 'info': return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'info': return <Bell className="h-5 w-5 text-blue-500" />;
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-amber-100 text-amber-700';
      case 'low': return 'bg-green-100 text-green-700';
    }
  };

  const getInsightIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'opportunity': return <TrendingUp className="h-5 w-5 text-emerald-500" />;
      case 'risk': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'recommendation': return <Zap className="h-5 w-5 text-blue-500" />;
    }
  };

  const getStatusColor = (status: ClinicPerformance['performance_status']) => {
    switch (status) {
      case 'on_track': return 'bg-emerald-100 text-emerald-700';
      case 'at_risk': return 'bg-amber-100 text-amber-700';
      case 'behind': return 'bg-red-100 text-red-700';
    }
  };

  const roleTitle = profile?.role === 'executive' ? 'Executive' :
                    profile?.role === 'clinic_manager' ? 'Clinic' :
                    profile?.role === 'clinician' ? 'Clinical' : 'Operations';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{roleTitle} Command Center</h1>
          <p className="text-sm text-gray-500 mt-1">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* North Star KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <DollarSign className="h-6 w-6 opacity-80" />
            <span className="flex items-center text-sm text-blue-100">
              <ArrowUpRight className="h-4 w-4 mr-1" />
              +8.2%
            </span>
          </div>
          <div className="text-3xl font-bold">{networkStats ? formatCurrency(networkStats.ytdRevenue) : '$0'}</div>
          <div className="text-sm text-blue-100 mt-1">YTD Revenue</div>
        </div>

        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <Activity className="h-6 w-6 opacity-80" />
            <span className="flex items-center text-sm text-emerald-100">
              <ArrowUpRight className="h-4 w-4 mr-1" />
              +2.1%
            </span>
          </div>
          <div className="text-3xl font-bold">{networkStats?.avgUtilization?.toFixed(1) || 0}%</div>
          <div className="text-sm text-emerald-100 mt-1">Avg Utilization</div>
        </div>

        <div className="bg-gradient-to-br from-amber-600 to-amber-700 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <Building2 className="h-6 w-6 opacity-80" />
            <span className="text-sm text-amber-100">
              {networkStats?.totalRegions || 0} regions
            </span>
          </div>
          <div className="text-3xl font-bold">{networkStats?.totalClinics || 0}</div>
          <div className="text-sm text-amber-100 mt-1">Active Clinics</div>
        </div>

        <div className="bg-gradient-to-br from-violet-600 to-violet-700 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <Users className="h-6 w-6 opacity-80" />
            <span className="flex items-center text-sm text-violet-100">
              <ArrowDownRight className="h-4 w-4 mr-1" />
              -0.5%
            </span>
          </div>
          <div className="text-3xl font-bold">{networkStats?.avgMargin?.toFixed(1) || 0}%</div>
          <div className="text-sm text-violet-100 mt-1">EBITDA Margin</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <h2 className="font-semibold text-gray-900">Active Alerts</h2>
              <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                {alerts.filter(a => a.type === 'critical').length}
              </span>
            </div>
            <button className="text-sm text-blue-600 hover:text-blue-700">View All</button>
          </div>
          <div className="divide-y divide-gray-50">
            {alerts.slice(0, 4).map(alert => (
              <div key={alert.id} className={`p-4 ${getAlertColor(alert.type)} border-l-4`}>
                <div className="flex items-start space-x-3">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">{alert.title}</p>
                      <span className="text-xs opacity-70">{alert.time}</span>
                    </div>
                    <p className="text-sm mt-0.5 opacity-80">{alert.message}</p>
                    {alert.action && (
                      <button className="text-xs font-medium mt-2 hover:underline">
                        {alert.action} &rarr;
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tasks Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              <h2 className="font-semibold text-gray-900">My Tasks</h2>
              <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                {tasks.length}
              </span>
            </div>
            <button className="text-sm text-blue-600 hover:text-blue-700">View All</button>
          </div>
          <div className="divide-y divide-gray-50">
            {tasks.map(task => (
              <div key={task.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{task.title}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">{task.due}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <MoreHorizontal className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insights Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-violet-500" />
              <h2 className="font-semibold text-gray-900">AI Insights</h2>
            </div>
            <button className="text-sm text-blue-600 hover:text-blue-700">View All</button>
          </div>
          <div className="divide-y divide-gray-50">
            {insights.map(insight => (
              <div key={insight.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start space-x-3">
                  {getInsightIcon(insight.type)}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{insight.title}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm text-emerald-600 font-medium">{insight.impact}</span>
                      <span className="text-xs text-gray-500">{insight.confidence}% confidence</span>
                    </div>
                    <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-violet-500 rounded-full"
                        style={{ width: `${insight.confidence}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Regional & Clinic Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Regional Performance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Regional Performance</h2>
            <button
              onClick={() => onNavigate('intelligence', 'clinic-performance')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View Details
            </button>
          </div>
          <div className="p-4">
            {regionalPerformance.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No regional data available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {regionalPerformance.slice(0, 5).map(region => (
                  <div key={region.region_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{region.region_name}</p>
                      <p className="text-sm text-gray-500">{region.clinic_count} clinics</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatCurrency(region.total_revenue)}</p>
                      <div className="flex items-center justify-end space-x-1">
                        {region.target_achievement_pct >= 100 ? (
                          <TrendingUp className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-500" />
                        )}
                        <span className={`text-sm ${region.target_achievement_pct >= 100 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {region.target_achievement_pct}% of target
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Clinic Performance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Clinic Performance</h2>
            <button
              onClick={() => onNavigate('operations', 'clinics')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View All
            </button>
          </div>
          <div className="overflow-x-auto">
            {clinicPerformance.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No clinic data available</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-3 text-left">Clinic</th>
                    <th className="px-4 py-3 text-right">Revenue</th>
                    <th className="px-4 py-3 text-right">Utilization</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {clinicPerformance.slice(0, 6).map(clinic => (
                    <tr key={clinic.clinic_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{clinic.clinic_name}</p>
                        <p className="text-xs text-gray-500">{clinic.region_name}</p>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatCurrency(clinic.mtd_revenue)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {clinic.utilization_rate.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(clinic.performance_status)}`}>
                          {clinic.performance_status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { icon: Calendar, label: 'View Schedule', action: () => onNavigate('operations', 'schedule') },
            { icon: FileText, label: 'Review Claims', action: () => onNavigate('revenue', 'claims') },
            { icon: Users, label: 'Staff Overview', action: () => onNavigate('operations', 'staff') },
            { icon: Target, label: 'OKR Progress', action: () => onNavigate('strategy', 'okrs') },
            { icon: TrendingUp, label: 'Analytics', action: () => onNavigate('intelligence', 'dashboard') },
            { icon: Brain, label: 'AI Assistant', action: () => onNavigate('command_center', 'ai-insights') }
          ].map((action, idx) => (
            <button
              key={idx}
              onClick={action.action}
              className="flex flex-col items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
            >
              <action.icon className="h-6 w-6 text-gray-600 group-hover:text-blue-600 mb-2" />
              <span className="text-sm text-gray-700 group-hover:text-gray-900">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
