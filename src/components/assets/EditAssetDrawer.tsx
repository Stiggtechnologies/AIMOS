import { useState, useEffect } from 'react';
import { X, Save, Pencil } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Props {
  assetId: string;
  onClose: () => void;
  onSaved: () => void;
}

const STATUS_OPTIONS = ['active', 'operational', 'maintenance', 'inactive', 'decommissioned'] as const;
const CRITICALITY_OPTIONS = ['low', 'medium', 'high', 'critical'] as const;
const OWNERSHIP_OPTIONS = ['owned', 'leased', 'borrowed'] as const;

export default function EditAssetDrawer({ assetId, onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [clinics, setClinics] = useState<any[]>([]);
  const [tab, setTab] = useState<'identity' | 'financial' | 'lifecycle'>('identity');

  const [form, setForm] = useState({
    name: '',
    asset_tag: '',
    manufacturer: '',
    model: '',
    serial_number: '',
    supplier: '',
    category_id: '',
    sub_category: '',
    description: '',
    clinic_id: '',
    room_location: '',
    status: 'active',
    criticality: 'medium',
    condition_score: '7',
    condition_notes: '',
    ownership_type: 'owned',
    purchase_date: '',
    in_service_date: '',
    purchase_cost: '',
    installation_cost: '',
    replacement_cost: '',
    warranty_expiry_date: '',
    expected_replacement_date: '',
    useful_life_months: '60',
  });

  useEffect(() => {
    Promise.all([
      supabase.from('asset_categories').select('id, name').order('name'),
      supabase.from('clinics').select('id, name').eq('status', 'active').order('name'),
      supabase.from('assets').select('*').eq('id', assetId).maybeSingle(),
    ]).then(([cats, cls, assetRes]) => {
      setCategories(cats.data || []);
      setClinics(cls.data || []);
      if (assetRes.data) {
        const a = assetRes.data;
        setForm({
          name: a.name || '',
          asset_tag: a.asset_tag || '',
          manufacturer: a.manufacturer || '',
          model: a.model || '',
          serial_number: a.serial_number || '',
          supplier: a.supplier || '',
          category_id: a.category_id || '',
          sub_category: a.sub_category || '',
          description: a.description || '',
          clinic_id: a.clinic_id || '',
          room_location: a.room_location || '',
          status: a.status || 'active',
          criticality: a.criticality || 'medium',
          condition_score: a.condition_score?.toString() || '7',
          condition_notes: a.condition_notes || '',
          ownership_type: a.ownership_type || 'owned',
          purchase_date: a.purchase_date || '',
          in_service_date: a.in_service_date || '',
          purchase_cost: a.purchase_cost?.toString() || '',
          installation_cost: a.installation_cost?.toString() || '',
          replacement_cost: a.replacement_cost?.toString() || '',
          warranty_expiry_date: a.warranty_expiry_date || '',
          expected_replacement_date: a.expected_replacement_date || '',
          useful_life_months: a.useful_life_months?.toString() || '60',
        });
      }
      setLoading(false);
    });
  }, [assetId]);

  const set = (f: string, v: string) => setForm(e => ({ ...e, [f]: v }));

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const update: any = {
        name: form.name.trim(),
        asset_tag: form.asset_tag.trim(),
        manufacturer: form.manufacturer || null,
        model: form.model || null,
        serial_number: form.serial_number || null,
        supplier: form.supplier || null,
        category_id: form.category_id || null,
        sub_category: form.sub_category || null,
        description: form.description || null,
        clinic_id: form.clinic_id || null,
        room_location: form.room_location || null,
        status: form.status,
        criticality: form.criticality,
        condition_score: parseFloat(form.condition_score) || null,
        condition_notes: form.condition_notes || null,
        ownership_type: form.ownership_type,
        purchase_date: form.purchase_date || null,
        in_service_date: form.in_service_date || null,
        purchase_cost: form.purchase_cost ? parseFloat(form.purchase_cost) : null,
        installation_cost: form.installation_cost ? parseFloat(form.installation_cost) : null,
        replacement_cost: form.replacement_cost ? parseFloat(form.replacement_cost) : null,
        warranty_expiry_date: form.warranty_expiry_date || null,
        expected_replacement_date: form.expected_replacement_date || null,
        useful_life_months: parseInt(form.useful_life_months) || 60,
        updated_at: new Date().toISOString(),
      };
      const { error: err } = await supabase.from('assets').update(update).eq('id', assetId);
      if (err) throw err;

      await supabase.from('asset_audit_log').insert({
        asset_id: assetId,
        action: 'Updated',
        notes: 'Asset details updated via Edit form',
      });

      onSaved();
    } catch (e: any) {
      setError(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500';
  const labelCls = 'block text-xs font-medium text-gray-700 mb-1';

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-full max-w-lg bg-white shadow-2xl flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <Pencil className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Edit Asset</h2>
              <p className="text-xs text-gray-500">{form.name || 'Loading...'}</p>
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
        ) : (
          <>
            <div className="px-6 pt-4 flex-shrink-0">
              <div className="flex border-b border-gray-200">
                {(['identity', 'financial', 'lifecycle'] as const).map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${tab === t ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    {t === 'identity' ? 'Identity & Location' : t === 'financial' ? 'Financial' : 'Lifecycle'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {tab === 'identity' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Asset Name</label>
                      <input value={form.name} onChange={e => set('name', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Asset Tag</label>
                      <input value={form.asset_tag} onChange={e => set('asset_tag', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Manufacturer</label>
                      <input value={form.manufacturer} onChange={e => set('manufacturer', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Model</label>
                      <input value={form.model} onChange={e => set('model', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Serial Number</label>
                      <input value={form.serial_number} onChange={e => set('serial_number', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Supplier</label>
                      <input value={form.supplier} onChange={e => set('supplier', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Category</label>
                      <select value={form.category_id} onChange={e => set('category_id', e.target.value)} className={inputCls}>
                        <option value="">None</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Sub-category</label>
                      <input value={form.sub_category} onChange={e => set('sub_category', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Clinic</label>
                      <select value={form.clinic_id} onChange={e => set('clinic_id', e.target.value)} className={inputCls}>
                        <option value="">Select...</option>
                        {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Room / Location</label>
                      <input value={form.room_location} onChange={e => set('room_location', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Status</label>
                      <select value={form.status} onChange={e => set('status', e.target.value)} className={inputCls}>
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Criticality</label>
                      <select value={form.criticality} onChange={e => set('criticality', e.target.value)} className={inputCls}>
                        {CRITICALITY_OPTIONS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Condition Score (1–10)</label>
                      <input type="number" min="1" max="10" step="0.5" value={form.condition_score} onChange={e => set('condition_score', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Ownership</label>
                      <select value={form.ownership_type} onChange={e => set('ownership_type', e.target.value)} className={inputCls}>
                        {OWNERSHIP_OPTIONS.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Condition Notes</label>
                    <textarea value={form.condition_notes} onChange={e => set('condition_notes', e.target.value)}
                      className={`${inputCls} resize-none h-20`} />
                  </div>
                  <div>
                    <label className={labelCls}>Description</label>
                    <textarea value={form.description} onChange={e => set('description', e.target.value)}
                      className={`${inputCls} resize-none h-20`} />
                  </div>
                </>
              )}

              {tab === 'financial' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Purchase Cost ($)</label>
                    <input type="number" min="0" value={form.purchase_cost} onChange={e => set('purchase_cost', e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Installation Cost ($)</label>
                    <input type="number" min="0" value={form.installation_cost} onChange={e => set('installation_cost', e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Replacement Cost ($)</label>
                    <input type="number" min="0" value={form.replacement_cost} onChange={e => set('replacement_cost', e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Purchase Date</label>
                    <input type="date" value={form.purchase_date} onChange={e => set('purchase_date', e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>In-Service Date</label>
                    <input type="date" value={form.in_service_date} onChange={e => set('in_service_date', e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Supplier</label>
                    <input value={form.supplier} onChange={e => set('supplier', e.target.value)} className={inputCls} />
                  </div>
                </div>
              )}

              {tab === 'lifecycle' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Useful Life (months)</label>
                    <input type="number" min="1" value={form.useful_life_months} onChange={e => set('useful_life_months', e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Warranty Expiry</label>
                    <input type="date" value={form.warranty_expiry_date} onChange={e => set('warranty_expiry_date', e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Expected Replacement Date</label>
                    <input type="date" value={form.expected_replacement_date} onChange={e => set('expected_replacement_date', e.target.value)} className={inputCls} />
                  </div>
                </div>
              )}

              {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end flex-shrink-0">
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
