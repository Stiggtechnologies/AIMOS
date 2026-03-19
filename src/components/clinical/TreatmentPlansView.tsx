import { useState, useEffect } from 'react';
import { FileText, Plus, Search, ChevronRight, Target, Calendar, Activity, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface TreatmentPlan {
  id: string;
  patient: string;
  condition: string;
  goals: number;
  completed: number;
  startDate: string;
  endDate: string;
  sessions: number;
  attended: number;
  status: string;
  clinician: string;
}

const DEMO_PLANS: TreatmentPlan[] = [
  { id: '1', patient: 'Jane Smith', condition: 'Lower Back Pain', goals: 3, completed: 1, startDate: '2026-02-15', endDate: '2026-04-15', sessions: 12, attended: 5, status: 'active', clinician: 'Dr. Chen' },
  { id: '2', patient: 'Mark Johnson', condition: 'Rotator Cuff Injury', goals: 4, completed: 4, startDate: '2025-12-01', endDate: '2026-03-01', sessions: 20, attended: 20, status: 'completed', clinician: 'Dr. Patel' },
  { id: '3', patient: 'Sara Lee', condition: 'ACL Rehabilitation', goals: 5, completed: 2, startDate: '2026-01-10', endDate: '2026-07-10', sessions: 30, attended: 10, status: 'active', clinician: 'Dr. Williams' },
  { id: '4', patient: 'Tom Brown', condition: 'Cervical Strain (MVA)', goals: 3, completed: 0, startDate: '2026-03-01', endDate: '2026-06-01', sessions: 16, attended: 2, status: 'active', clinician: 'Dr. Chen' },
];

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-700',
  paused: 'bg-yellow-100 text-yellow-800',
  cancelled: 'bg-red-100 text-red-700'
};

export default function TreatmentPlansView() {
  const [plans, setPlans] = useState<TreatmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => { loadPlans(); }, []);

  async function loadPlans() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('patient_treatment_plans')
        .select(`
          id, diagnosis, start_date, end_date, status, plan_details,
          patients:patient_id ( first_name, last_name ),
          user_profiles:provider_id ( first_name, last_name )
        `)
        .order('start_date', { ascending: false })
        .limit(50);

      if (error || !data || data.length === 0) {
        setPlans(DEMO_PLANS);
      } else {
        setPlans(data.map((r: Record<string, unknown>) => {
          const details = (r.plan_details as Record<string, unknown>) || {};
          const pt = r.patients as Record<string, string> | null;
          const prov = r.user_profiles as Record<string, string> | null;
          return {
            id: r.id as string,
            patient: pt ? `${pt.first_name} ${pt.last_name}` : 'Unknown',
            condition: (r.diagnosis as string) || '—',
            goals: Number(details.goals_total) || 3,
            completed: Number(details.goals_completed) || 0,
            startDate: (r.start_date as string) || '',
            endDate: (r.end_date as string) || '',
            sessions: Number(details.sessions_total) || 12,
            attended: Number(details.sessions_attended) || 0,
            status: (r.status as string) || 'active',
            clinician: prov ? `Dr. ${prov.last_name}` : '—',
          };
        }));
      }
    } catch {
      setPlans(DEMO_PLANS);
    } finally {
      setLoading(false);
    }
  }

  const filtered = plans.filter(p => {
    const matchSearch = !search || p.patient.toLowerCase().includes(search.toLowerCase()) || p.condition.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Treatment Plans</h2>
          <p className="text-gray-600 mt-1">Manage and track patient treatment plans</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadPlans}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
            <Plus className="h-4 w-4 mr-2" />
            New Plan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Plans', value: plans.length, color: 'text-blue-600' },
          { label: 'Active', value: plans.filter(p => p.status === 'active').length, color: 'text-green-600' },
          { label: 'Completed', value: plans.filter(p => p.status === 'completed').length, color: 'text-gray-600' },
          { label: 'Avg Adherence', value: plans.length > 0 ? `${Math.round(plans.reduce((sum, p) => sum + (p.sessions > 0 ? p.attended / p.sessions * 100 : 0), 0) / plans.length)}%` : '—', color: 'text-teal-600' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-sm text-gray-600 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by patient or condition..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="paused">Paused</option>
          </select>
        </div>

        {loading ? (
          <div className="flex flex-col items-center gap-3 py-12 text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <p className="text-sm">Loading treatment plans...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <FileText className="h-12 w-12 mx-auto mb-2 text-gray-200" />
            <p className="font-medium text-gray-500">No treatment plans found</p>
            <p className="text-xs mt-1">Adjust filters or create a new plan</p>
          </div>
        ) : null}

        <div className="space-y-3">
          {!loading && filtered.map(plan => {
            const adherencePct = Math.round((plan.attended / plan.sessions) * 100);
            const goalPct = Math.round((plan.completed / plan.goals) * 100);
            return (
              <div key={plan.id} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold text-gray-900">{plan.patient}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${STATUS_COLORS[plan.status]}`}>
                        {plan.status}
                      </span>
                    </div>
                    <div className="text-sm text-blue-700 font-medium mb-3">{plan.condition}</div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-600">
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          <Target className="h-3 w-3" />
                          Goals Progress
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                            <div className="h-1.5 rounded-full bg-teal-500" style={{ width: `${goalPct}%` }} />
                          </div>
                          <span>{plan.completed}/{plan.goals}</span>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          <Activity className="h-3 w-3" />
                          Session Adherence
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${adherencePct >= 70 ? 'bg-green-500' : 'bg-yellow-500'}`}
                              style={{ width: `${adherencePct}%` }}
                            />
                          </div>
                          <span>{plan.attended}/{plan.sessions}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(plan.startDate).toLocaleDateString()} – {new Date(plan.endDate).toLocaleDateString()}</span>
                      </div>
                      <div>Clinician: {plan.clinician}</div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 ml-4 flex-shrink-0" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
