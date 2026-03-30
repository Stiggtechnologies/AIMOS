import { useState, useEffect, useMemo } from 'react';
import { ClipboardList, TriangleAlert as AlertTriangle, Clock, CircleCheck as CheckCircle, Plus, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import CreateWorkOrderModal from './CreateWorkOrderModal';
import WorkOrderDetailDrawer from './WorkOrderDetailDrawer';

interface Props {
  onNavigate?: (module: string, subModule: string) => void;
}

const priorityBadge = (p: string) => {
  const cls = p === 'critical' ? 'bg-red-100 text-red-700' : p === 'high' ? 'bg-orange-100 text-orange-700' : p === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600';
  return <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${cls}`}>{p || '—'}</span>;
};

const statusBadge = (s: string) => {
  const cls =
    s === 'completed'  ? 'bg-emerald-100 text-emerald-700' :
    s === 'in_progress' ? 'bg-blue-100 text-blue-700' :
    s === 'scheduled'  ? 'bg-sky-100 text-sky-700' :
    s === 'on_hold'    ? 'bg-amber-100 text-amber-700' :
    s === 'cancelled'  ? 'bg-red-100 text-red-700' :
    'bg-gray-100 text-gray-600';
  return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${cls}`}>{s?.replace('_', ' ') || '—'}</span>;
};

export default function WorkOrdersView({ onNavigate }: Props) {
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedWO, setSelectedWO] = useState<string | null>(null);

  useEffect(() => { fetchWorkOrders(); }, [statusFilter]);

  async function fetchWorkOrders() {
    setLoading(true);
    try {
      let query = supabase
        .from('work_orders')
        .select('*, assets(name, asset_tag, room_location)')
        .order('scheduled_date', { ascending: true });
      if (statusFilter !== 'all') query = query.eq('status', statusFilter);
      const { data, error } = await query.limit(100);
      if (error) throw error;
      setWorkOrders(data || []);
    } catch (err) {
      console.error('Error fetching work orders:', err);
      setWorkOrders([]);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    if (!s) return workOrders;
    return workOrders.filter(wo =>
      wo.work_order_number?.toLowerCase().includes(s) ||
      wo.assets?.name?.toLowerCase().includes(s) ||
      wo.vendor_name?.toLowerCase().includes(s) ||
      wo.type?.toLowerCase().includes(s)
    );
  }, [workOrders, search]);

  const stats = {
    total: workOrders.length,
    pending: workOrders.filter(w => w.status === 'pending').length,
    inProgress: workOrders.filter(w => w.status === 'in_progress').length,
    scheduled: workOrders.filter(w => w.status === 'scheduled').length,
    completed: workOrders.filter(w => w.status === 'completed').length,
  };

  const isOverdue = (wo: any) =>
    wo.scheduled_date && wo.status !== 'completed' && wo.status !== 'cancelled' &&
    new Date(wo.scheduled_date) < new Date();

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <ClipboardList className="w-6 h-6 text-blue-600" /> Work Orders
          </h1>
          <p className="text-gray-500 mt-1">Maintenance, repairs, and inspections</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm flex-shrink-0">
          <Plus className="w-4 h-4" /> New Work Order
        </button>
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
              <div className={`flex items-center gap-1.5 text-sm font-medium mb-2 ${iconColor}`}>{icon}{label}</div>
              <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search work orders..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <span className="text-xs text-gray-400 ml-auto">{filtered.length} work orders</span>
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
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3">Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((wo) => (
                <tr key={wo.id}
                  className={`hover:bg-gray-50 transition-colors cursor-pointer ${isOverdue(wo) ? 'bg-red-50/40' : ''}`}
                  onClick={() => setSelectedWO(wo.id)}>
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm text-blue-600">{wo.work_order_number || '—'}</span>
                    {isOverdue(wo) && <span className="ml-1.5 text-xs text-red-600 font-medium">Overdue</span>}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 text-sm">{wo.assets?.name || '—'}</p>
                    {wo.assets?.room_location && <p className="text-xs text-gray-500">{wo.assets.room_location}</p>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 capitalize">{wo.type?.replace('_', ' ') || '—'}</td>
                  <td className="px-4 py-3">{priorityBadge(wo.priority)}</td>
                  <td className="px-4 py-3">{statusBadge(wo.status)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{wo.scheduled_date ? new Date(wo.scheduled_date).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{wo.vendor_name || '—'}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{wo.total_cost != null ? `$${Number(wo.total_cost).toFixed(2)}` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <ClipboardList className="w-8 h-8 mb-3" />
              <p className="text-sm">No work orders found</p>
              <button onClick={() => setShowCreate(true)} className="mt-3 text-xs text-blue-600 hover:text-blue-700 font-medium">Create your first work order</button>
            </div>
          )}
        </div>
      </div>

      {showCreate && (
        <CreateWorkOrderModal
          onClose={() => setShowCreate(false)}
          onSaved={() => { setShowCreate(false); fetchWorkOrders(); }}
        />
      )}

      {selectedWO && (
        <WorkOrderDetailDrawer
          workOrderId={selectedWO}
          onClose={() => setSelectedWO(null)}
          onUpdated={fetchWorkOrders}
        />
      )}
    </div>
  );
}
