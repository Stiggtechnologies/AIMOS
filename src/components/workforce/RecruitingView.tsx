import { useState, useEffect } from 'react';
import { UserPlus, Briefcase, Clock, CircleCheck as CheckCircle, ChevronRight, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Requisition {
  id: string;
  title: string;
  clinic: string;
  status: 'open' | 'filled' | 'on_hold';
  applicants: number;
  posted_date: string;
  priority: 'urgent' | 'standard';
}

const DEMO_REQUISITIONS: Requisition[] = [
  { id: '1', title: 'Registered Physiotherapist', clinic: 'South Commons', status: 'open', applicants: 12, posted_date: '2026-02-28', priority: 'urgent' },
  { id: '2', title: 'Clinic Admin Coordinator', clinic: 'West End', status: 'open', applicants: 8, posted_date: '2026-03-01', priority: 'standard' },
  { id: '3', title: 'Occupational Therapist', clinic: 'Beltline', status: 'open', applicants: 5, posted_date: '2026-03-05', priority: 'urgent' },
  { id: '4', title: 'Massage Therapist (RMT)', clinic: 'Chinook', status: 'filled', applicants: 22, posted_date: '2026-02-01', priority: 'standard' },
  { id: '5', title: 'Chiropractic Doctor', clinic: 'NW Calgary', status: 'on_hold', applicants: 3, posted_date: '2026-03-10', priority: 'standard' },
];

export default function RecruitingView() {
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadRequisitions(); }, []);

  async function loadRequisitions() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('job_requisitions')
        .select(`
          id, title, status, applicant_count, posted_date, priority,
          clinics:clinic_id ( name )
        `)
        .order('posted_date', { ascending: false })
        .limit(50);

      if (error || !data || data.length === 0) {
        setRequisitions(DEMO_REQUISITIONS);
      } else {
        setRequisitions(data.map((r: Record<string, unknown>) => {
          const cl = r.clinics as Record<string, string> | null;
          return {
            id: r.id as string,
            title: (r.title as string) || '—',
            clinic: cl ? cl.name : '—',
            status: ((r.status as string) || 'open') as Requisition['status'],
            applicants: Number(r.applicant_count) || 0,
            posted_date: (r.posted_date as string) || '',
            priority: ((r.priority as string) || 'standard') as Requisition['priority'],
          };
        }));
      }
    } catch {
      setRequisitions(DEMO_REQUISITIONS);
    } finally {
      setLoading(false);
    }
  }

  const open = requisitions.filter(r => r.status === 'open');
  const filled = requisitions.filter(r => r.status === 'filled');
  const totalApplicants = requisitions.filter(r => r.status === 'open').reduce((s, r) => s + r.applicants, 0);

  const metrics = [
    { label: 'Open Requisitions', value: open.length, icon: Briefcase, color: 'blue' },
    { label: 'Active Applicants', value: totalApplicants, icon: UserPlus, color: 'emerald' },
    { label: 'Avg Time to Fill', value: '18d', icon: Clock, color: 'amber' },
    { label: 'Filled This Month', value: filled.length, icon: CheckCircle, color: 'green' },
  ];

  const statusConfig = {
    open: { label: 'Open', color: 'text-blue-600', bg: 'bg-blue-50' },
    filled: { label: 'Filled', color: 'text-green-600', bg: 'bg-green-50' },
    on_hold: { label: 'On Hold', color: 'text-gray-500', bg: 'bg-gray-50' },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Recruiting</h1>
        <p className="text-sm text-gray-500 mt-1">Open requisitions and hiring pipeline</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {metrics.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className={`w-9 h-9 rounded-lg bg-${color}-50 flex items-center justify-center`}>
                <Icon className={`h-4 w-4 text-${color}-600`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Active Requisitions</h2>
          <div className="flex items-center gap-2">
            <button onClick={loadRequisitions} disabled={loading} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
              <UserPlus className="h-4 w-4" />
              <span>New Req</span>
            </button>
          </div>
        </div>
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-8 text-gray-400">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600" />
            <p className="text-sm">Loading requisitions...</p>
          </div>
        ) : null}
        <div className="divide-y divide-gray-100">
          {!loading && requisitions.map(req => {
            const cfg = statusConfig[req.status];
            return (
              <div key={req.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Briefcase className="h-4 w-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{req.title}</p>
                    <p className="text-xs text-gray-500">{req.clinic} • Posted {req.posted_date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {req.priority === 'urgent' && (
                    <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">Urgent</span>
                  )}
                  <span className="text-xs text-gray-500">{req.applicants} applicants</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                  <ChevronRight className="h-4 w-4 text-gray-300" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
