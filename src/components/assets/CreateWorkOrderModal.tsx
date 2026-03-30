import { useState, useEffect } from 'react';
import { X, ClipboardList, ChevronRight, CircleCheck as CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Props {
  onClose: () => void;
  onSaved: () => void;
  preselectedAssetId?: string;
}

const STEPS = ['Asset & Type', 'Schedule & Assign', 'Review'] as const;

const WO_TYPES = ['preventive', 'corrective', 'emergency', 'inspection', 'upgrade', 'other'] as const;
const PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;
const STATUSES = ['pending', 'scheduled', 'in_progress'] as const;

export default function CreateWorkOrderModal({ onClose, onSaved, preselectedAssetId }: Props) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [assets, setAssets] = useState<any[]>([]);
  const [clinics, setClinics] = useState<any[]>([]);

  const [form, setForm] = useState({
    asset_id: preselectedAssetId || '',
    clinic_id: '',
    type: 'corrective' as typeof WO_TYPES[number],
    priority: 'medium' as typeof PRIORITIES[number],
    status: 'pending' as typeof STATUSES[number],
    issue_description: '',
    scheduled_date: '',
    requested_date: new Date().toISOString().slice(0, 10),
    vendor_name: '',
    labor_cost: '',
    parts_cost: '',
    downtime_hours: '',
  });

  useEffect(() => {
    supabase.from('assets').select('id, name, asset_tag, clinic_id').order('name').then(({ data }) => setAssets(data || []));
    supabase.from('clinics').select('id, name').eq('status', 'active').order('name').then(({ data }) => setClinics(data || []));
  }, []);

  useEffect(() => {
    if (form.asset_id) {
      const asset = assets.find(a => a.id === form.asset_id);
      if (asset?.clinic_id) setForm(f => ({ ...f, clinic_id: asset.clinic_id }));
    }
  }, [form.asset_id, assets]);

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const canAdvance = () => {
    if (step === 0) return form.asset_id && form.type && form.priority && form.issue_description.trim();
    return true;
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const payload: any = {
        asset_id: form.asset_id,
        clinic_id: form.clinic_id || null,
        type: form.type,
        priority: form.priority,
        status: form.status,
        issue_description: form.issue_description.trim(),
        requested_date: form.requested_date || null,
        scheduled_date: form.scheduled_date || null,
        vendor_name: form.vendor_name || null,
        labor_cost: form.labor_cost ? parseFloat(form.labor_cost) : null,
        parts_cost: form.parts_cost ? parseFloat(form.parts_cost) : null,
        downtime_hours: form.downtime_hours ? parseFloat(form.downtime_hours) : null,
      };
      const { error: err } = await supabase.from('work_orders').insert(payload);
      if (err) throw err;
      onSaved();
    } catch (e: any) {
      setError(e.message || 'Failed to create work order');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500';
  const labelCls = 'block text-xs font-medium text-gray-700 mb-1';
  const fieldCls = 'flex flex-col gap-1';

  const priorityColors: Record<string, string> = {
    low: 'border-gray-200 bg-white', medium: 'border-amber-200 bg-amber-50',
    high: 'border-orange-200 bg-orange-50', critical: 'border-red-200 bg-red-50',
  };
  const selectedAsset = assets.find(a => a.id === form.asset_id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">New Work Order</h2>
              <p className="text-xs text-gray-500">{STEPS[step]} — Step {step + 1} of {STEPS.length}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <div key={i} className={`flex-1 h-1.5 rounded-full transition-colors ${i <= step ? 'bg-blue-500' : 'bg-gray-200'}`} />
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {step === 0 && (
            <>
              <div className={fieldCls}>
                <label className={labelCls}>Asset <span className="text-red-500">*</span></label>
                <select value={form.asset_id} onChange={e => set('asset_id', e.target.value)} className={inputCls}>
                  <option value="">Select asset...</option>
                  {assets.map(a => <option key={a.id} value={a.id}>{a.name} {a.asset_tag ? `(${a.asset_tag})` : ''}</option>)}
                </select>
              </div>

              <div>
                <label className={labelCls}>Work Order Type <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-3 gap-2">
                  {WO_TYPES.map(t => (
                    <button key={t} onClick={() => set('type', t)}
                      className={`px-3 py-2 rounded-lg border text-xs font-medium capitalize transition-all ${form.type === t ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                      {t.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelCls}>Priority <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-4 gap-2">
                  {PRIORITIES.map(p => (
                    <button key={p} onClick={() => set('priority', p)}
                      className={`px-3 py-2 rounded-lg border text-xs font-medium capitalize transition-all ${form.priority === p ? `${priorityColors[p]} border-current` : 'border-gray-200 text-gray-600 hover:border-gray-300'} ${form.priority === p && p === 'critical' ? 'text-red-700 border-red-500' : form.priority === p && p === 'high' ? 'text-orange-700 border-orange-500' : form.priority === p && p === 'medium' ? 'text-amber-700 border-amber-500' : ''}`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className={fieldCls}>
                <label className={labelCls}>Issue Description <span className="text-red-500">*</span></label>
                <textarea value={form.issue_description} onChange={e => set('issue_description', e.target.value)}
                  className={`${inputCls} resize-none h-24`} placeholder="Describe the issue or maintenance needed..." />
              </div>

              <div className={fieldCls}>
                <label className={labelCls}>Initial Status</label>
                <select value={form.status} onChange={e => set('status', e.target.value)} className={inputCls}>
                  {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className={fieldCls}>
                  <label className={labelCls}>Requested Date</label>
                  <input type="date" value={form.requested_date} onChange={e => set('requested_date', e.target.value)} className={inputCls} />
                </div>
                <div className={fieldCls}>
                  <label className={labelCls}>Scheduled Date</label>
                  <input type="date" value={form.scheduled_date} onChange={e => set('scheduled_date', e.target.value)} className={inputCls} />
                </div>
                <div className={fieldCls}>
                  <label className={labelCls}>Vendor / Contractor</label>
                  <input value={form.vendor_name} onChange={e => set('vendor_name', e.target.value)} className={inputCls} placeholder="e.g. Acme Repairs" />
                </div>
                <div className={fieldCls}>
                  <label className={labelCls}>Clinic</label>
                  <select value={form.clinic_id} onChange={e => set('clinic_id', e.target.value)} className={inputCls}>
                    <option value="">Auto (from asset)</option>
                    {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className={fieldCls}>
                  <label className={labelCls}>Estimated Labor Cost ($)</label>
                  <input type="number" min="0" value={form.labor_cost} onChange={e => set('labor_cost', e.target.value)} className={inputCls} placeholder="0.00" />
                </div>
                <div className={fieldCls}>
                  <label className={labelCls}>Estimated Parts Cost ($)</label>
                  <input type="number" min="0" value={form.parts_cost} onChange={e => set('parts_cost', e.target.value)} className={inputCls} placeholder="0.00" />
                </div>
                <div className={fieldCls}>
                  <label className={labelCls}>Expected Downtime (hours)</label>
                  <input type="number" min="0" step="0.5" value={form.downtime_hours} onChange={e => set('downtime_hours', e.target.value)} className={inputCls} placeholder="0" />
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-700 mb-2">Review Work Order</p>
              <div className="bg-gray-50 rounded-xl border border-gray-200 divide-y divide-gray-200">
                {[
                  ['Asset', selectedAsset ? `${selectedAsset.name}${selectedAsset.asset_tag ? ` (${selectedAsset.asset_tag})` : ''}` : '—'],
                  ['Type', form.type.replace('_', ' ')],
                  ['Priority', form.priority],
                  ['Status', form.status.replace('_', ' ')],
                  ['Issue', form.issue_description || '—'],
                  ['Scheduled', form.scheduled_date || '—'],
                  ['Vendor', form.vendor_name || '—'],
                  ['Labor Cost', form.labor_cost ? `$${parseFloat(form.labor_cost).toLocaleString()}` : '—'],
                  ['Parts Cost', form.parts_cost ? `$${parseFloat(form.parts_cost).toLocaleString()}` : '—'],
                  ['Estimated Total', (form.labor_cost || form.parts_cost) ? `$${(parseFloat(form.labor_cost || '0') + parseFloat(form.parts_cost || '0')).toLocaleString()}` : '—'],
                ].map(([l, v]) => (
                  <div key={l} className="flex items-start justify-between px-4 py-2.5 text-sm gap-4">
                    <span className="text-gray-500 flex-shrink-0">{l}</span>
                    <span className="font-medium text-gray-900 text-right capitalize">{v}</span>
                  </div>
                ))}
              </div>
              {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 flex-shrink-0">
          <button onClick={step === 0 ? onClose : () => setStep(s => s - 1)}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
            {step === 0 ? 'Cancel' : 'Back'}
          </button>
          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={!canAdvance()}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
              {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {saving ? 'Creating...' : 'Create Work Order'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
