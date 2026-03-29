import { useState, useEffect } from 'react';
import { ClipboardList, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

// ─── FIELD MAPPING ────────────────────────────────────────────────────────────
// DB: assets.asset_tag ← UI: wo.assets.asset_id (was wrong join)
// DB: work_orders.assigned_to (UUID) ← joined auth.users full_name
// DB: work_orders.total_cost (computed) ← labor_cost + parts_cost

export default function WorkOrdersView() {
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchWorkOrders();
  }, [statusFilter]);

  async function fetchWorkOrders() {
    try {
      let query = supabase
        .from('work_orders')
        .select('*, assets(name, asset_tag), auth.users!assigned_to(full_name)')
        .order('scheduled_date', { ascending: true });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      setWorkOrders(data || []);
    } catch (error) {
      console.error('Error fetching work orders:', error);
      // Don't crash - show empty state
      setWorkOrders([]);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>;

  const stats = {
    total: workOrders.length,
    pending: workOrders.filter((w: any) => w.status === 'pending').length,
    scheduled: workOrders.filter((w: any) => w.status === 'scheduled').length,
    completed: workOrders.filter((w: any) => w.status === 'completed').length,
    inProgress: workOrders.filter((w: any) => w.status === 'in_progress').length,
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <ClipboardList className="w-6 h-6 text-blue-400" />
          Work Orders
        </h1>
        <p className="text-slate-400 mt-1">Live data from Supabase work_orders table</p>
      </div>

      <div className="flex gap-4">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white">
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="scheduled">Scheduled</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center gap-2 text-slate-400 text-sm">Total</div>
          <p className="text-3xl font-bold text-white mt-2">{stats.total}</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center gap-2 text-amber-400 text-sm"><Clock className="w-4 h-4" /> Pending</div>
          <p className="text-3xl font-bold text-amber-400 mt-2">{stats.pending}</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center gap-2 text-blue-400 text-sm"><AlertTriangle className="w-4 h-4" /> In Progress</div>
          <p className="text-3xl font-bold text-blue-400 mt-2">{stats.inProgress}</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center gap-2 text-purple-400 text-sm">Scheduled</div>
          <p className="text-3xl font-bold text-purple-400 mt-2">{stats.scheduled}</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center gap-2 text-emerald-400 text-sm"><CheckCircle className="w-4 h-4" /> Completed</div>
          <p className="text-3xl font-bold text-emerald-400 mt-2">{stats.completed}</p>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg border border-slate-700">
        <table className="w-full">
          <thead className="bg-slate-900">
            <tr className="text-left text-xs text-slate-400 uppercase">
              <th className="px-4 py-3">Work Order #</th>
              <th className="px-4 py-3">Asset</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Scheduled</th>
              <th className="px-4 py-3">Assigned To</th>
              <th className="px-4 py-3">Cost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {workOrders.map((wo: any) => (
              <tr key={wo.id} className="hover:bg-slate-700/50">
                <td className="px-4 py-3 font-mono text-sm text-blue-400">{wo.work_order_number || '—'}</td>
                <td className="px-4 py-3 text-white">{wo.assets?.name || '—'}</td>
                <td className="px-4 py-3 text-slate-300">{wo.type || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs ${
                    wo.priority === 'critical' ? 'bg-red-500/20 text-red-400' :
                    wo.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                    wo.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-slate-500/20 text-slate-400'
                  }`}>{wo.priority || '—'}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs ${
                    wo.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                    wo.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                    wo.status === 'scheduled' ? 'bg-purple-500/20 text-purple-400' :
                    'bg-slate-500/20 text-slate-400'
                  }`}>{wo.status || '—'}</span>
                </td>
                <td className="px-4 py-3 text-slate-300">{wo.scheduled_date ? new Date(wo.scheduled_date).toLocaleDateString() : '—'}</td>
                <td className="px-4 py-3 text-slate-300">{(wo as any).assigned_to_user?.full_name || 'Unassigned'}</td>
                <td className="px-4 py-3 text-white">${wo.total_cost?.toFixed(2) || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {workOrders.length === 0 && (
          <p className="p-8 text-center text-slate-400">No work orders found</p>
        )}
      </div>
    </div>
  );
}