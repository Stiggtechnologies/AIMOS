import { useState, useEffect } from 'react';
import { ClipboardList, TriangleAlert as AlertTriangle, Clock, CircleCheck as CheckCircle } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

interface Props {
  onNavigate?: (module: string, subModule: string) => void;
}

export default function WorkOrdersView({ onNavigate }: Props) {
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => { fetchWorkOrders(); }, [statusFilter]);

  async function fetchWorkOrders() {
    try {
      let query = supabase.from('work_orders').select('*, assets(name, asset_tag)').order('scheduled_date', { ascending: true });
      if (statusFilter !== 'all') query = query.eq('status', statusFilter);
      const { data, error } = await query.limit(50);
      if (error) throw error;
      setWorkOrders(data || []);
    } catch (err) {
      console.error('Error fetching work orders:', err);
      setWorkOrders([]);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  }

  const stats = {
    total: workOrders.length,
    pending: workOrders.filter((w: any) => w.status === 'pending').length,
    inProgress: workOrders.filter((w: any) => w.status === 'in_progress').length,
    scheduled: workOrders.filter((w: any) => w.status === 'scheduled').length,
    completed: workOrders.filter((w: any) => w.status === 'completed').length,
  };

  const priorityBadge = (p: string) => {
    const cls = p === 'critical' ? 'bg-red-100 text-red-700' : p === 'high' ? 'bg-orange-100 text-orange-700' : p === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600';
    return <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${cls}`}>{p || '—'}</span>;
  };

  const statusBadge = (s: string) => {
    const cls = s === 'completed' ? 'bg-emerald-100 text-emerald-700' : s === 'in_progress' ? 'bg-blue-100 text-blue-700' : s === 'scheduled' ? 'bg-sky-100 text-sky-700' : 'bg-gray-100 text-gray-600';
    return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${cls}`}>{s?.replace('_', ' ') || '—'}</span>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <ClipboardList className="w-6 h-6 text-blue-600" /> Work Orders
        </h1>
        <p className="text-gray-500 mt-1">Maintenance and repair work orders</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: 'Total', value: stats.total, icon: null, color: 'gray' },
          { label: 'Pending', value: stats.pending, icon: <Clock className="w-4 h-4" />, color: 'amber' },
          { label: 'In Progress', value: stats.inProgress, icon: <AlertTriangle className="w-4 h-4" />, color: 'blue' },
          { label: 'Scheduled', value: stats.scheduled, icon: null, color: 'sky' },
          { label: 'Completed', value: stats.completed, icon: <CheckCircle className="w-4 h-4" />, color: 'emerald' },
        ].map(({ label, value, icon, color }) => {
          const textColor = color === 'amber' ? 'text-amber-600' : color === 'blue' ? 'text-blue-600' : color === 'sky' ? 'text-sky-600' : color === 'emerald' ? 'text-emerald-600' : 'text-gray-900';
          const iconColor = color === 'amber' ? 'text-amber-500' : color === 'blue' ? 'text-blue-500' : color === 'sky' ? 'text-sky-500' : color === 'emerald' ? 'text-emerald-500' : 'text-gray-500';
          return (
            <div key={label} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className={`flex items-center gap-1.5 text-sm font-medium mb-2 ${iconColor}`}>
                {icon}{label}
              </div>
              <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3">WO #</th>
                <th className="px-4 py-3">Asset</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Scheduled</th>
                <th className="px-4 py-3">Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {workOrders.map((wo: any) => (
                <tr key={wo.id} className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => wo.asset_id && onNavigate?.('assets', `asset-detail:${wo.asset_id}`)}>
                  <td className="px-4 py-3 font-mono text-sm text-blue-600">{wo.work_order_number || '—'}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{wo.assets?.name || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 capitalize">{wo.type || '—'}</td>
                  <td className="px-4 py-3">{priorityBadge(wo.priority)}</td>
                  <td className="px-4 py-3">{statusBadge(wo.status)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{wo.scheduled_date ? new Date(wo.scheduled_date).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{wo.total_cost != null ? `$${wo.total_cost.toFixed(2)}` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {workOrders.length === 0 && <p className="px-6 py-10 text-center text-gray-500">No work orders found</p>}
        </div>
      </div>
    </div>
  );
}
