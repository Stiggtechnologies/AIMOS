import { useState } from 'react';
import { FileText, Plus, Search, ChevronRight, Target, Calendar, Activity, CircleCheck as CheckCircle } from 'lucide-react';

const PLANS = [
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
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = PLANS.filter(p => {
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
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
          <Plus className="h-4 w-4 mr-2" />
          New Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Plans', value: PLANS.length, color: 'text-blue-600' },
          { label: 'Active', value: PLANS.filter(p => p.status === 'active').length, color: 'text-green-600' },
          { label: 'Completed', value: PLANS.filter(p => p.status === 'completed').length, color: 'text-gray-600' },
          { label: 'Avg Adherence', value: `${Math.round(PLANS.reduce((sum, p) => sum + (p.attended / p.sessions * 100), 0) / PLANS.length)}%`, color: 'text-teal-600' },
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

        <div className="space-y-3">
          {filtered.map(plan => {
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
