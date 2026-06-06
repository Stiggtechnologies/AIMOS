import { useState, useEffect } from 'react';
import { X, Package, DollarSign, MapPin, Info, ChevronRight, CircleCheck as CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type AcquisitionType = 'new_purchase' | 'used_purchase' | 'inherited';

interface Props {
  onClose: () => void;
  onSaved: (assetId: string) => void;
  acquisitionBatchId?: string;
  clinicId?: string;
}

const STEPS = ['Type & Identity', 'Purchase Details', 'Location & Status', 'Review'] as const;

const CRITICALITY_OPTIONS = ['low', 'medium', 'high', 'critical'] as const;
const STATUS_OPTIONS = ['active', 'operational', 'maintenance', 'inactive', 'decommissioned'] as const;
const OWNERSHIP_OPTIONS = ['owned', 'leased', 'borrowed'] as const;

function generateAssetTag(): string {
  const prefix = 'AIM';
  const num = Math.floor(10000 + Math.random() * 90000);
  return `${prefix}-${num}`;
}

export default function AddAssetModal({ onClose, onSaved, acquisitionBatchId, clinicId }: Props) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [clinics, setClinics] = useState<any[]>([]);

  const [form, setForm] = useState({
    acquisition_type: 'new_purchase' as AcquisitionType,
    asset_tag: generateAssetTag(),
    name: '',
    manufacturer: '',
    model: '',
    serial_number: '',
    supplier: '',
    category_id: '',
    sub_category: '',
    description: '',
    clinic_id: clinicId || '',
    room_location: '',
    purchase_date: '',
    purchase_cost: '',
    installation_cost: '',
    replacement_cost: '',
    warranty_expiry_date: '',
    in_service_date: '',
    useful_life_months: '60',
    condition_score: '7',
    condition_notes: '',
    criticality: 'medium' as typeof CRITICALITY_OPTIONS[number],
    status: 'active' as typeof STATUS_OPTIONS[number],
    ownership_type: 'owned' as typeof OWNERSHIP_OPTIONS[number],
  });

  useEffect(() => {
    supabase.from('asset_categories').select('id, name').order('name').then(({ data }) => setCategories(data || []));
    supabase.from('clinics').select('id, name').eq('status', 'active').order('name').then(({ data }) => setClinics(data || []));
  }, []);

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const canAdvance = () => {
    if (step === 0) return form.name.trim().length > 0 && form.asset_tag.trim().length > 0;
    if (step === 1) return true;
    if (step === 2) return form.clinic_id.length > 0;
    return true;
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const payload: any = {
        asset_tag: form.asset_tag.trim(),
        name: form.name.trim(),
        manufacturer: form.manufacturer || null,
        model: form.model || null,
        serial_number: form.serial_number || null,
        supplier: form.supplier || null,
        category_id: form.category_id || null,
        sub_category: form.sub_category || null,
        description: form.description || null,
        clinic_id: form.clinic_id,
        room_location: form.room_location || null,
        purchase_date: form.purchase_date || null,
        purchase_cost: form.purchase_cost ? parseFloat(form.purchase_cost) : null,
        installation_cost: form.installation_cost ? parseFloat(form.installation_cost) : null,
        replacement_cost: form.replacement_cost ? parseFloat(form.replacement_cost) : null,
        warranty_expiry_date: form.warranty_expiry_date || null,
        in_service_date: form.in_service_date || null,
        useful_life_months: parseInt(form.useful_life_months) || 60,
        condition_score: parseFloat(form.condition_score) || 7.0,
        condition_notes: form.condition_notes || null,
        criticality: form.criticality,
        status: form.status,
        ownership_type: form.ownership_type,
        acquisition_batch_id: acquisitionBatchId || null,
      };

      const { data, error: err } = await supabase.from('assets').insert(payload).select('id').single();
      if (err) throw err;
      onSaved(data.id);
    } catch (e: any) {
      setError(e.message || 'Failed to save asset');
    } finally {
      setSaving(false);
    }
  };

  const acquisitionLabel: Record<AcquisitionType, string> = {
    new_purchase: 'New Purchase',
    used_purchase: 'Used / Pre-owned Purchase',
    inherited: 'Inherited from Acquisition',
  };

  const acquisitionDescription: Record<AcquisitionType, string> = {
    new_purchase: 'Brand new equipment purchased from a vendor',
    used_purchase: 'Pre-owned equipment purchased on the open market or through a dealer',
    inherited: 'Equipment inherited as part of a clinic acquisition or M&A deal',
  };

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500';
  const labelCls = 'block text-xs font-medium text-gray-700 mb-1';
  const fieldCls = 'flex flex-col gap-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Add Asset</h2>
              <p className="text-xs text-gray-500">{STEPS[step]} — Step {step + 1} of {STEPS.length}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex gap-1">
            {STEPS.map((s, i) => (
              <div key={s} className="flex-1 flex items-center gap-1">
                <div className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? 'bg-blue-500' : 'bg-gray-200'}`} />
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {step === 0 && (
            <>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Acquisition Type</p>
                <div className="grid grid-cols-1 gap-2">
                  {(['new_purchase', 'used_purchase', 'inherited'] as AcquisitionType[]).map(t => (
                    <button key={t} onClick={() => set('acquisition_type', t)}
                      className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${form.acquisition_type === t ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <div className={`w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0 transition-colors ${form.acquisition_type === t ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`} />
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{acquisitionLabel[t]}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{acquisitionDescription[t]}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className={fieldCls}>
                  <label className={labelCls}>Asset Tag <span className="text-red-500">*</span></label>
                  <input value={form.asset_tag} onChange={e => set('asset_tag', e.target.value)} className={inputCls} placeholder="AIM-00001" />
                </div>
                <div className={fieldCls}>
                  <label className={labelCls}>Asset Name <span className="text-red-500">*</span></label>
                  <input value={form.name} onChange={e => set('name', e.target.value)} className={inputCls} placeholder="e.g. Treatment Table" />
                </div>
                <div className={fieldCls}>
                  <label className={labelCls}>Category</label>
                  <select value={form.category_id} onChange={e => set('category_id', e.target.value)} className={inputCls}>
                    <option value="">Select category...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className={fieldCls}>
                  <label className={labelCls}>Sub-category</label>
                  <input value={form.sub_category} onChange={e => set('sub_category', e.target.value)} className={inputCls} placeholder="e.g. Rehab Tables" />
                </div>
                <div className={fieldCls}>
                  <label className={labelCls}>Manufacturer</label>
                  <input value={form.manufacturer} onChange={e => set('manufacturer', e.target.value)} className={inputCls} placeholder="e.g. Hausmann" />
                </div>
                <div className={fieldCls}>
                  <label className={labelCls}>Model</label>
                  <input value={form.model} onChange={e => set('model', e.target.value)} className={inputCls} placeholder="e.g. 4800" />
                </div>
                <div className={fieldCls}>
                  <label className={labelCls}>Serial Number</label>
                  <input value={form.serial_number} onChange={e => set('serial_number', e.target.value)} className={inputCls} placeholder="Optional" />
                </div>
                <div className={fieldCls}>
                  <label className={labelCls}>Supplier / Vendor</label>
                  <input value={form.supplier} onChange={e => set('supplier', e.target.value)} className={inputCls} placeholder="e.g. Medline" />
                </div>
              </div>
              <div className={fieldCls}>
                <label className={labelCls}>Description</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)}
                  className={`${inputCls} resize-none h-20`} placeholder="Brief description of the asset..." />
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <p className="text-sm font-semibold text-gray-700">Purchase & Financial Details</p>
              </div>

              {form.acquisition_type === 'used_purchase' && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                  For used equipment, enter the price you paid. Set condition score to reflect actual state — not "like new".
                </div>
              )}
              {form.acquisition_type === 'inherited' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                  Enter the allocated value from the deal. If unknown, use estimated fair market value and note accordingly.
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className={fieldCls}>
                  <label className={labelCls}>Purchase / Allocated Cost ($)</label>
                  <input type="number" min="0" value={form.purchase_cost} onChange={e => set('purchase_cost', e.target.value)} className={inputCls} placeholder="0.00" />
                </div>
                <div className={fieldCls}>
                  <label className={labelCls}>Installation Cost ($)</label>
                  <input type="number" min="0" value={form.installation_cost} onChange={e => set('installation_cost', e.target.value)} className={inputCls} placeholder="0.00" />
                </div>
                <div className={fieldCls}>
                  <label className={labelCls}>Replacement Cost ($)</label>
                  <input type="number" min="0" value={form.replacement_cost} onChange={e => set('replacement_cost', e.target.value)} className={inputCls} placeholder="0.00" />
                </div>
                <div className={fieldCls}>
                  <label className={labelCls}>Useful Life (months)</label>
                  <input type="number" min="1" value={form.useful_life_months} onChange={e => set('useful_life_months', e.target.value)} className={inputCls} />
                </div>
                <div className={fieldCls}>
                  <label className={labelCls}>Purchase Date</label>
                  <input type="date" value={form.purchase_date} onChange={e => set('purchase_date', e.target.value)} className={inputCls} />
                </div>
                <div className={fieldCls}>
                  <label className={labelCls}>In-Service Date</label>
                  <input type="date" value={form.in_service_date} onChange={e => set('in_service_date', e.target.value)} className={inputCls} />
                </div>
                <div className={fieldCls}>
                  <label className={labelCls}>Warranty Expiry</label>
                  <input type="date" value={form.warranty_expiry_date} onChange={e => set('warranty_expiry_date', e.target.value)} className={inputCls} />
                </div>
                <div className={fieldCls}>
                  <label className={labelCls}>Ownership Type</label>
                  <select value={form.ownership_type} onChange={e => set('ownership_type', e.target.value)} className={inputCls}>
                    {OWNERSHIP_OPTIONS.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
                  </select>
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-4 h-4 text-gray-400" />
                <p className="text-sm font-semibold text-gray-700">Location & Condition</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className={fieldCls}>
                  <label className={labelCls}>Clinic <span className="text-red-500">*</span></label>
                  <select value={form.clinic_id} onChange={e => set('clinic_id', e.target.value)} className={inputCls}>
                    <option value="">Select clinic...</option>
                    {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className={fieldCls}>
                  <label className={labelCls}>Room / Location</label>
                  <input value={form.room_location} onChange={e => set('room_location', e.target.value)} className={inputCls} placeholder="e.g. Treatment Room 2" />
                </div>
                <div className={fieldCls}>
                  <label className={labelCls}>Status</label>
                  <select value={form.status} onChange={e => set('status', e.target.value)} className={inputCls}>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
                <div className={fieldCls}>
                  <label className={labelCls}>Criticality</label>
                  <select value={form.criticality} onChange={e => set('criticality', e.target.value)} className={inputCls}>
                    {CRITICALITY_OPTIONS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
                <div className={fieldCls}>
                  <label className={labelCls}>Condition Score (1–10)</label>
                  <input type="number" min="1" max="10" step="0.5" value={form.condition_score} onChange={e => set('condition_score', e.target.value)} className={inputCls} />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Condition Notes</label>
                  <textarea value={form.condition_notes} onChange={e => set('condition_notes', e.target.value)}
                    className={`${inputCls} resize-none h-20`}
                    placeholder="Note any visible wear, prior repairs, known issues..." />
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Info className="w-4 h-4 text-gray-400" />
                <p className="text-sm font-semibold text-gray-700">Review Before Saving</p>
              </div>
              <div className="bg-gray-50 rounded-xl border border-gray-200 divide-y divide-gray-200">
                {[
                  ['Type', acquisitionLabel[form.acquisition_type]],
                  ['Asset Tag', form.asset_tag],
                  ['Name', form.name],
                  ['Manufacturer / Model', [form.manufacturer, form.model].filter(Boolean).join(' ') || '—'],
                  ['Category', categories.find(c => c.id === form.category_id)?.name || '—'],
                  ['Clinic', clinics.find(c => c.id === form.clinic_id)?.name || '—'],
                  ['Location', form.room_location || '—'],
                  ['Purchase Cost', form.purchase_cost ? `$${parseFloat(form.purchase_cost).toLocaleString()}` : '—'],
                  ['Purchase Date', form.purchase_date || '—'],
                  ['In Service', form.in_service_date || '—'],
                  ['Warranty Expiry', form.warranty_expiry_date || '—'],
                  ['Condition Score', form.condition_score],
                  ['Status', form.status],
                  ['Criticality', form.criticality],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <span className="text-gray-500">{label}</span>
                    <span className="font-medium text-gray-900">{value}</span>
                  </div>
                ))}
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
              )}
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
              {saving ? 'Saving...' : 'Save Asset'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
