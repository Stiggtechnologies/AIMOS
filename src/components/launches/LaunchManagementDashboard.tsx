import { useState, useEffect } from 'react';
import { Rocket, Plus, TriangleAlert as AlertTriangle, Clock, TrendingUp, Users, Calendar, ChevronRight, Building2 } from 'lucide-react';
import { launchService, type ClinicLaunch } from '../../services/launchService';

interface LaunchManagementDashboardProps {
  onNavigate?: (module: string, subModule: string) => void;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  planning: { label: 'Planning', color: 'bg-gray-100 text-gray-700', dot: 'bg-gray-400' },
  approved: { label: 'Approved', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-400' },
  in_progress: { label: 'Active', color: 'bg-blue-100 text-blue-800', dot: 'bg-blue-500' },
  at_risk: { label: 'At Risk', color: 'bg-red-100 text-red-800', dot: 'bg-red-500' },
  delayed: { label: 'Delayed', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800', dot: 'bg-green-500' },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400' },
  on_hold: { label: 'On Hold', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400' },
};

const TYPE_LABELS: Record<string, string> = {
  greenfield: 'New Clinic',
  acquisition: 'Acquisition',
  partner_90day: 'EPC / Partner',
  satellite: 'Satellite',
  partner: 'Partner',
};

const TYPE_BADGE_COLORS: Record<string, string> = {
  greenfield: 'bg-blue-100 text-blue-700',
  acquisition: 'bg-amber-100 text-amber-700',
  partner_90day: 'bg-emerald-100 text-emerald-700',
  satellite: 'bg-gray-100 text-gray-600',
  partner: 'bg-teal-100 text-teal-700',
};

function daysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

export default function LaunchManagementDashboard({ onNavigate }: LaunchManagementDashboardProps) {
  const [launches, setLaunches] = useState<ClinicLaunch[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    launchService.getAllLaunches()
      .then(data => setLaunches(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = launches.filter(l => !statusFilter || l.status === statusFilter);
  const activeCount = launches.filter(l => l.status === 'in_progress' || l.status === 'approved').length;
  const atRiskCount = launches.filter(l => l.status === 'at_risk' || l.status === 'delayed').length;

  const handleOpenDetail = (launch: ClinicLaunch) => {
    if (onNavigate) {
      onNavigate('operations', `launch-detail:${launch.id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Launch Command Center</h2>
          <p className="text-gray-600 mt-1">CRE — Clinic Replication Engine · All active clinic launches</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
          <Plus className="h-4 w-4 mr-2" />
          New Launch
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Launches', value: activeCount, color: 'text-blue-600', icon: <Rocket className="h-5 w-5 text-blue-400" /> },
          { label: 'At Risk / Delayed', value: atRiskCount, color: 'text-red-600', icon: <AlertTriangle className="h-5 w-5 text-red-400" /> },
          { label: 'Total Launches', value: launches.length, color: 'text-gray-900', icon: <Building2 className="h-5 w-5 text-gray-400" /> },
          { label: 'Completed', value: launches.filter(l => l.status === 'completed').length, color: 'text-green-700', icon: <TrendingUp className="h-5 w-5 text-green-400" /> },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">{s.icon}<span className={`text-2xl font-bold ${s.color}`}>{s.value}</span></div>
            <div className="text-sm text-gray-600">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-gray-900">Launch Projects</h3>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">All Status</option>
            <option value="in_progress">Active</option>
            <option value="planning">Planning</option>
            <option value="approved">Approved</option>
            <option value="at_risk">At Risk</option>
            <option value="delayed">Delayed</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Rocket className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No launches found</p>
            <p className="text-sm mt-1">Click "New Launch" to create the first clinic launch</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(launch => {
              const sc = STATUS_CONFIG[launch.status] ?? STATUS_CONFIG['planning'];
              const typeLabel = TYPE_LABELS[launch.launch_plan_type ?? ''] ?? launch.launch_plan_type ?? 'Launch';
              const typeBadge = TYPE_BADGE_COLORS[launch.launch_plan_type ?? ''] ?? 'bg-gray-100 text-gray-600';
              const isEpc = launch.launch_plan_type === 'partner_90day';
              const daysLeft = daysUntil(launch.target_open_date);
              const budgetPct = launch.approved_budget ? Math.round((launch.actual_cost / launch.approved_budget) * 100) : 0;

              return (
                <div
                  key={launch.id}
                  onClick={() => handleOpenDetail(launch)}
                  className={`border rounded-lg p-5 cursor-pointer transition-all hover:shadow-md ${isEpc ? 'border-emerald-200 hover:border-emerald-400 bg-emerald-50/30' : 'border-gray-200 hover:border-blue-300'}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Building2 className={`h-5 w-5 ${isEpc ? 'text-emerald-500' : 'text-gray-400'}`} />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900">{launch.launch_name}</span>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${sc.color}`}>{sc.label}</span>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${typeBadge}`}>{typeLabel}</span>
                          {launch.is_partner_clinic && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-teal-100 text-teal-700">Partner</span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Target: {new Date(launch.target_open_date).toLocaleDateString()}
                          </span>
                          <span className={daysLeft < 0 ? 'text-red-600 font-medium' : daysLeft < 14 ? 'text-amber-600 font-medium' : ''}>
                            {daysLeft > 0 ? `${daysLeft} days away` : `${Math.abs(daysLeft)} days overdue`}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {launch.launch_code}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div>
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Overall Progress</span>
                        <span className={`font-semibold ${launch.overall_completion_pct >= 85 ? 'text-green-700' : launch.overall_completion_pct >= 60 ? 'text-amber-700' : 'text-red-700'}`}>
                          {launch.overall_completion_pct.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${launch.overall_completion_pct >= 85 ? 'bg-green-500' : launch.overall_completion_pct >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${launch.overall_completion_pct}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Budget</span>
                        <span>{launch.approved_budget ? `$${(launch.actual_cost / 1000).toFixed(0)}K / $${(launch.approved_budget / 1000).toFixed(0)}K` : 'N/A'}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${budgetPct > 90 ? 'bg-red-500' : budgetPct > 70 ? 'bg-amber-500' : 'bg-blue-500'}`}
                          style={{ width: `${Math.min(budgetPct, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Users className="h-3.5 w-3.5" />
                      <span>Owner: {launch.launch_owner_role || 'Unassigned'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="font-medium text-gray-700">Phase:</span>
                    <span>{(launch.current_phase ?? 'phase_0').replace('phase_', 'Phase ').replace(/_/g, ' ')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
