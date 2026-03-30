import { useState, useEffect } from 'react';
import { X, ClipboardList, Save, CircleCheck as CheckCircle, Clock, Wrench, TriangleAlert as AlertTriangle, DollarSign, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Props {
  workOrderId: string;
  onClose: () => void;
  onUpdated: () => void;
}

const STATUS_OPTIONS = ['pending', 'scheduled', 'in_progress', 'on_hold', 'completed', 'cancelled'] as const;
const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'critical'] as const;

const statusColors: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-700',
  scheduled: 'bg-sky-100 text-sky-700',
  in_progress: 'bg-blue-100 text-blue-700',
  on_hold: 'bg-amber-100 text-amber-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
};

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

export default function WorkOrderDetailDrawer({ workOrderId, onClose, onUpdated }: Props) {
  const [wo, setWo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'details' | 'costs' | 'resolution'>('details');

  const [edits, setEdits] = useState({
    status: '',
    priority: '',
    scheduled_date: '',
    vendor_name: '',
    labor_cost: '',
    parts_cost: '',
    downtime_hours: '',
    root_cause: '',
    resolution_notes: '',
    completed_date: '',
  });

  useEffect(() => {
    fetchWO();
  }, [workOrderId]);

  async function fetchWO() {
    setLoading(true);
    const { data } = await supabase
      .from('work_orders')
      .select('*, assets(name, asset_tag, room_location)')
      .eq('id', workOrderId)
      .maybeSingle();
    if (data) {
      setWo(data);
      setEdits({
        status: data.status || 'pending',
        priority: data.priority || 'medium',
        scheduled_date: data.scheduled_date?.slice(0, 10) || '',
        vendor_name: data.vendor_name || '',
        labor_cost: data.labor_cost?.toString() || '',
        parts_cost: data.parts_cost?.toString() || '',
        downtime_hours: data.downtime_hours?.toString() || '',
        root_cause: data.root_cause || '',
        resolution_notes: data.resolution_notes || '',
        completed_date: data.completed_date?.slice(0, 10) || '',
      });
    }
    setLoading(false);
  }

  const set = (f: string, v: string) => setEdits(e => ({ ...e, [f]: v }));

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const update: any = {
        status: edits.status,
        priority: edits.priority,
        scheduled_date: edits.scheduled_date || null,
        vendor_name: edits.vendor_name || null,
        labor_cost: edits.labor_cost ? parseFloat(edits.labor_cost) : null,
        parts_cost: edits.parts_cost ? parseFloat(edits.parts_cost) : null,
        downtime_hours: edits.downtime_hours ? parseFloat(edits.downtime_hours) : null,
        root_cause: edits.root_cause || null,
        resolution_notes: edits.resolution_notes || null,
        completed_date: edits.status === 'completed' ? (edits.completed_date || new Date().toISOString().slice(0, 10)) : null,
        updated_at: new Date().toISOString(),
      };
      const { error: err } = await supabase.from('work_orders').update(update).eq('id', workOrderId);
      if (err) throw err;
      onUpdated();
      fetchWO();
    } catch (e: any) {
      setError(e.message || 'Failed to update work order');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500';
  const labelCls = 'block text-xs font-medium text-gray-700 mb-1';

  const totalCost = (parseFloat(edits.labor_cost || '0') + parseFloat(edits.parts_cost || '0')) || wo?.total_cost;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-full max-w-lg bg-white shadow-2xl flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">{wo?.work_order_number || 'Work Order'}</h2>
              <p className="text-xs text-gray-500">{wo?.assets?.name || '—'} {wo?.assets?.asset_tag ? `· ${wo.assets.asset_tag}` : ''}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : !wo ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Work order not found</div>
        ) : (
          <>
            <div className="px-6 pt-4 flex-shrink-0">
              <div className="flex items-center gap-2 mb-4">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusColors[wo.status] || 'bg-gray-100 text-gray-600'}`}>{wo.status?.replace('_', ' ')}</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${priorityColors[wo.priority] || 'bg-gray-100 text-gray-600'}`}>{wo.priority}</span>
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 capitalize">{wo.type?.replace('_', ' ')}</span>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-xs font-medium text-gray-500 mb-1">Issue Description</p>
                <p className="text-sm text-gray-800">{wo.issue_description || '—'}</p>
              </div>

              <div className="flex border-b border-gray-200 mb-1">
                {(['details', 'costs', 'resolution'] as const).map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${tab === t ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    {t === 'details' ? 'Details' : t === 'costs' ? 'Costs & Time' : 'Resolution'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {tab === 'details' && (
                <>
                  <div>
                    <label className={labelCls}>Status</label>
                    <div className="grid grid-cols-3 gap-2">
                      {STATUS_OPTIONS.map(s => (
                        <button key={s} onClick={() => set('status', s)}
                          className={`px-2 py-1.5 rounded-lg border text-xs font-medium capitalize transition-all ${edits.status === s ? (statusColors[s] || 'bg-blue-50 text-blue-700 border-blue-300') + ' border-current' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                          {s.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Priority</label>
                    <div className="grid grid-cols-4 gap-2">
                      {PRIORITY_OPTIONS.map(p => (
                        <button key={p} onClick={() => set('priority', p)}
                          className={`px-2 py-1.5 rounded-lg border text-xs font-medium capitalize transition-all ${edits.priority === p ? (priorityColors[p] || '') + ' border-current' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Scheduled Date</label>
                      <input type="date" value={edits.scheduled_date} onChange={e => set('scheduled_date', e.target.value)} className={inputCls} />
                    </div>
                    {edits.status === 'completed' && (
                      <div>
                        <label className={labelCls}>Completed Date</label>
                        <input type="date" value={edits.completed_date} onChange={e => set('completed_date', e.target.value)} className={inputCls} />
                      </div>
                    )}
                    <div>
                      <label className={labelCls}>Vendor / Contractor</label>
                      <input value={edits.vendor_name} onChange={e => set('vendor_name', e.target.value)} className={inputCls} placeholder="Name or company" />
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-1.5 text-sm">
                    {wo.assets?.room_location && <div className="flex gap-2"><span className="text-gray-500">Location:</span><span>{wo.assets.room_location}</span></div>}
                    {wo.requested_date && <div className="flex gap-2"><span className="text-gray-500">Requested:</span><span>{new Date(wo.requested_date).toLocaleDateString()}</span></div>}
                    {wo.created_at && <div className="flex gap-2"><span className="text-gray-500">Created:</span><span>{new Date(wo.created_at).toLocaleDateString()}</span></div>}
                  </div>
                </>
              )}

              {tab === 'costs' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Labor Cost ($)</label>
                      <input type="number" min="0" value={edits.labor_cost} onChange={e => set('labor_cost', e.target.value)} className={inputCls} placeholder="0.00" />
                    </div>
                    <div>
                      <label className={labelCls}>Parts Cost ($)</label>
                      <input type="number" min="0" value={edits.parts_cost} onChange={e => set('parts_cost', e.target.value)} className={inputCls} placeholder="0.00" />
                    </div>
                    <div>
                      <label className={labelCls}>Downtime (hours)</label>
                      <input type="number" min="0" step="0.5" value={edits.downtime_hours} onChange={e => set('downtime_hours', e.target.value)} className={inputCls} placeholder="0" />
                    </div>
                  </div>
                  {totalCost > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
                      <DollarSign className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-blue-600 font-medium">Total Cost</p>
                        <p className="text-2xl font-bold text-blue-700">${Number(totalCost).toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {tab === 'resolution' && (
                <>
                  <div>
                    <label className={labelCls}>Root Cause</label>
                    <textarea value={edits.root_cause} onChange={e => set('root_cause', e.target.value)}
                      className={`${inputCls} resize-none h-24`} placeholder="What caused the issue?" />
                  </div>
                  <div>
                    <label className={labelCls}>Resolution Notes</label>
                    <textarea value={edits.resolution_notes} onChange={e => set('resolution_notes', e.target.value)}
                      className={`${inputCls} resize-none h-28`} placeholder="What was done to resolve the issue? Parts replaced, steps taken..." />
                  </div>
                  {wo.root_cause && edits.root_cause === wo.root_cause && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs font-medium text-gray-500 mb-1">Saved Root Cause</p>
                      <p className="text-sm text-gray-700">{wo.root_cause}</p>
                    </div>
                  )}
                </>
              )}

              {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                {wo.total_cost != null && (
                  <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> Total: ${Number(wo.total_cost).toFixed(2)}</span>
                )}
              </div>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
                {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
