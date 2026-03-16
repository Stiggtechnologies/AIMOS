import { useState } from 'react';
import { UserPlus, Briefcase, Clock, CircleCheck as CheckCircle, Circle as XCircle, TrendingUp, ChevronRight } from 'lucide-react';

interface Requisition {
  id: string;
  title: string;
  clinic: string;
  status: 'open' | 'filled' | 'on_hold';
  applicants: number;
  posted_date: string;
  priority: 'urgent' | 'standard';
}

const REQUISITIONS: Requisition[] = [
  { id: '1', title: 'Registered Physiotherapist', clinic: 'South Commons', status: 'open', applicants: 12, posted_date: '2026-02-28', priority: 'urgent' },
  { id: '2', title: 'Clinic Admin Coordinator', clinic: 'West End', status: 'open', applicants: 8, posted_date: '2026-03-01', priority: 'standard' },
  { id: '3', title: 'Occupational Therapist', clinic: 'Beltline', status: 'open', applicants: 5, posted_date: '2026-03-05', priority: 'urgent' },
  { id: '4', title: 'Massage Therapist (RMT)', clinic: 'Chinook', status: 'filled', applicants: 22, posted_date: '2026-02-01', priority: 'standard' },
  { id: '5', title: 'Chiropractic Doctor', clinic: 'NW Calgary', status: 'on_hold', applicants: 3, posted_date: '2026-03-10', priority: 'standard' },
];

export default function RecruitingView() {
  const [activeTab, setActiveTab] = useState<'open' | 'pipeline' | 'filled'>('open');

  const open = REQUISITIONS.filter(r => r.status === 'open');
  const filled = REQUISITIONS.filter(r => r.status === 'filled');

  const metrics = [
    { label: 'Open Requisitions', value: open.length, icon: Briefcase, color: 'blue' },
    { label: 'Active Applicants', value: 28, icon: UserPlus, color: 'emerald' },
    { label: 'Avg Time to Fill', value: '18d', icon: Clock, color: 'amber' },
    { label: 'Filled This Month', value: 3, icon: CheckCircle, color: 'green' },
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
          <button className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
            <UserPlus className="h-4 w-4" />
            <span>New Req</span>
          </button>
        </div>
        <div className="divide-y divide-gray-100">
          {REQUISITIONS.map(req => {
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
