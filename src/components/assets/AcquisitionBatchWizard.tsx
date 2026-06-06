import { useState, useEffect } from 'react';
import { X, Building2, Package, ClipboardList, CircleCheck as CheckCircle, ChevronRight, Plus, Trash2, TriangleAlert as AlertTriangle, TriangleAlert } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Props {
  onClose: () => void;
  onComplete: (batchId: string) => void;
}

type AssetRow = {
  id: string;
  asset_tag: string;
  name: string;
  manufacturer: string;
  model: string;
  serial_number: string;
  purchase_cost: string;
  condition_score: string;
  status: string;
  room_location: string;
  warranty_expiry_date: string;
  criticality: string;
  errors: Record<string, string>;
};

const STEPS = ['Batch Details', 'Asset Roster', 'Validate & Review', 'Complete'] as const;

function emptyRow(): AssetRow {
  return {
    id: crypto.randomUUID(),
    asset_tag: `AIM-${Math.floor(10000 + Math.random() * 90000)}`,
    name: '',
    manufacturer: '',
    model: '',
    serial_number: '',
    purchase_cost: '',
    condition_score: '6',
    status: 'active',
    room_location: '',
    warranty_expiry_date: '',
    criticality: 'medium',
    errors: {},
  };
}

function validateRow(row: AssetRow): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!row.asset_tag.trim()) errors.asset_tag = 'Required';
  if (!row.name.trim()) errors.name = 'Required';
  const score = parseFloat(row.condition_score);
  if (isNaN(score) || score < 1 || score > 10) errors.condition_score = '1–10';
  return errors;
}

export default function AcquisitionBatchWizard({ onClose, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [clinics, setClinics] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [batchId, setBatchId] = useState<string | null>(null);

  const [batch, setBatch] = useState({
    clinic_id: '',
    deal_name: '',
    seller_name: '',
    closing_date: '',
    intake_start_date: new Date().toISOString().slice(0, 10),
    estimated_total_purchase_allocated_value: '',
    notes: '',
  });

  const [rows, setRows] = useState<AssetRow[]>([emptyRow()]);

  useEffect(() => {
    supabase.from('clinics').select('id, name').eq('status', 'active').order('name').then(({ data }) => setClinics(data || []));
    supabase.from('asset_categories').select('id, name').order('name').then(({ data }) => setCategories(data || []));
  }, []);

  const setB = (field: string, value: string) => setBatch(b => ({ ...b, [field]: value }));

  const updateRow = (id: string, field: keyof AssetRow, value: string) =>
    setRows(rs => rs.map(r => r.id === id ? { ...r, [field]: value, errors: { ...r.errors, [field]: '' } } : r));

  const addRow = () => setRows(rs => [...rs, emptyRow()]);
  const removeRow = (id: string) => setRows(rs => rs.filter(r => r.id !== id));

  const canAdvanceBatch = () => batch.clinic_id && batch.deal_name.trim();
  const canAdvanceRoster = () => rows.length > 0 && rows.every(r => r.name.trim() && r.asset_tag.trim());

  const validateAll = () => {
    const validated = rows.map(r => ({ ...r, errors: validateRow(r) }));
    setRows(validated);
    return validated.every(r => Object.keys(r.errors).length === 0);
  };

  const handleSave = async () => {
    if (!validateAll()) return;
    setSaving(true);
    setError('');
    try {
      const { data: batchData, error: batchErr } = await supabase
        .from('acquisition_batches')
        .insert({
          clinic_id: batch.clinic_id,
          deal_name: batch.deal_name.trim(),
          seller_name: batch.seller_name.trim() || null,
          closing_date: batch.closing_date || null,
          intake_start_date: batch.intake_start_date || null,
          estimated_total_purchase_allocated_value: batch.estimated_total_purchase_allocated_value
            ? parseFloat(batch.estimated_total_purchase_allocated_value) : null,
          notes: batch.notes || null,
          total_assets_imported: rows.length,
        })
        .select('id')
        .single();
      if (batchErr) throw batchErr;

      const assets = rows.map(r => ({
        asset_tag: r.asset_tag.trim(),
        name: r.name.trim(),
        manufacturer: r.manufacturer || null,
        model: r.model || null,
        serial_number: r.serial_number || null,
        purchase_cost: r.purchase_cost ? parseFloat(r.purchase_cost) : null,
        condition_score: parseFloat(r.condition_score) || 6.0,
        status: r.status,
        room_location: r.room_location || null,
        warranty_expiry_date: r.warranty_expiry_date || null,
        criticality: r.criticality,
        clinic_id: batch.clinic_id,
        acquisition_batch_id: batchData.id,
        ownership_type: 'owned',
      }));

      const { error: assetsErr } = await supabase.from('assets').insert(assets);
      if (assetsErr) throw assetsErr;

      setBatchId(batchData.id);
      setStep(3);
    } catch (e: any) {
      setError(e.message || 'Failed to save batch');
    } finally {
      setSaving(false);
    }
  };

  const errCount = rows.filter(r => Object.keys(r.errors).length > 0).length;

  const inputCls = 'w-full px-2.5 py-1.5 border border-gray-300 rounded-md text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500';
  const labelCls = 'block text-xs font-medium text-gray-700 mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Acquisition Batch Onboarding</h2>
              <p className="text-xs text-gray-500">Import assets from a clinic acquisition or bulk deal</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex gap-2">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
                  i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {i < step ? <CheckCircle className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-blue-700' : i < step ? 'text-emerald-700' : 'text-gray-400'}`}>{s}</span>
                {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 ${i < step ? 'bg-emerald-300' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 0 && (
            <div className="space-y-5 max-w-lg">
              <div>
                <p className="text-sm font-semibold text-gray-800 mb-4">Deal & Batch Information</p>
                <div className="space-y-4">
                  <div>
                    <label className={labelCls}>Clinic <span className="text-red-500">*</span></label>
                    <select value={batch.clinic_id} onChange={e => setB('clinic_id', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                      <option value="">Select the clinic receiving these assets...</option>
                      {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Deal / Batch Name <span className="text-red-500">*</span></label>
                    <input value={batch.deal_name} onChange={e => setB('deal_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. South Commons Acquisition — Jan 2026" />
                  </div>
                  <div>
                    <label className={labelCls}>Seller / Previous Owner</label>
                    <input value={batch.seller_name} onChange={e => setB('seller_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. Smith Physiotherapy" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Closing Date</label>
                      <input type="date" value={batch.closing_date} onChange={e => setB('closing_date', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className={labelCls}>Intake Start Date</label>
                      <input type="date" value={batch.intake_start_date} onChange={e => setB('intake_start_date', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Total Allocated Purchase Value ($)</label>
                    <input type="number" min="0" value={batch.estimated_total_purchase_allocated_value} onChange={e => setB('estimated_total_purchase_allocated_value', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Total value allocated to assets in the deal" />
                  </div>
                  <div>
                    <label className={labelCls}>Notes</label>
                    <textarea value={batch.notes} onChange={e => setB('notes', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-20"
                      placeholder="Notes about the acquisition, deal terms, special conditions..." />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Asset Roster</p>
                  <p className="text-xs text-gray-500 mt-0.5">{rows.length} asset{rows.length !== 1 ? 's' : ''} — enter each piece of equipment being transferred</p>
                </div>
                <button onClick={addRow}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Add Row
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr className="text-left text-gray-500 font-medium">
                      <th className="px-3 py-2.5 w-28">Asset Tag</th>
                      <th className="px-3 py-2.5 w-44">Name *</th>
                      <th className="px-3 py-2.5 w-28">Manufacturer</th>
                      <th className="px-3 py-2.5 w-24">Model</th>
                      <th className="px-3 py-2.5 w-28">Serial #</th>
                      <th className="px-3 py-2.5 w-24">Cost ($)</th>
                      <th className="px-3 py-2.5 w-16">Cond.</th>
                      <th className="px-3 py-2.5 w-24">Status</th>
                      <th className="px-3 py-2.5 w-24">Room</th>
                      <th className="px-3 py-2.5 w-28">Warranty Exp.</th>
                      <th className="px-3 py-2.5 w-24">Criticality</th>
                      <th className="px-3 py-2.5 w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rows.map(row => (
                      <tr key={row.id} className={Object.keys(row.errors).length > 0 ? 'bg-red-50/50' : ''}>
                        <td className="px-3 py-2">
                          <input value={row.asset_tag} onChange={e => updateRow(row.id, 'asset_tag', e.target.value)}
                            className={`${inputCls} ${row.errors.asset_tag ? 'border-red-400' : ''}`} />
                          {row.errors.asset_tag && <p className="text-red-500 text-xs mt-0.5">{row.errors.asset_tag}</p>}
                        </td>
                        <td className="px-3 py-2">
                          <input value={row.name} onChange={e => updateRow(row.id, 'name', e.target.value)}
                            className={`${inputCls} ${row.errors.name ? 'border-red-400' : ''}`} placeholder="Asset name" />
                          {row.errors.name && <p className="text-red-500 text-xs mt-0.5">{row.errors.name}</p>}
                        </td>
                        <td className="px-3 py-2"><input value={row.manufacturer} onChange={e => updateRow(row.id, 'manufacturer', e.target.value)} className={inputCls} /></td>
                        <td className="px-3 py-2"><input value={row.model} onChange={e => updateRow(row.id, 'model', e.target.value)} className={inputCls} /></td>
                        <td className="px-3 py-2"><input value={row.serial_number} onChange={e => updateRow(row.id, 'serial_number', e.target.value)} className={inputCls} /></td>
                        <td className="px-3 py-2"><input type="number" value={row.purchase_cost} onChange={e => updateRow(row.id, 'purchase_cost', e.target.value)} className={inputCls} /></td>
                        <td className="px-3 py-2">
                          <input type="number" min="1" max="10" step="0.5" value={row.condition_score} onChange={e => updateRow(row.id, 'condition_score', e.target.value)}
                            className={`${inputCls} ${row.errors.condition_score ? 'border-red-400' : ''}`} />
                        </td>
                        <td className="px-3 py-2">
                          <select value={row.status} onChange={e => updateRow(row.id, 'status', e.target.value)} className={inputCls}>
                            {['active', 'operational', 'maintenance', 'inactive'].map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                        <td className="px-3 py-2"><input value={row.room_location} onChange={e => updateRow(row.id, 'room_location', e.target.value)} className={inputCls} placeholder="Room" /></td>
                        <td className="px-3 py-2"><input type="date" value={row.warranty_expiry_date} onChange={e => updateRow(row.id, 'warranty_expiry_date', e.target.value)} className={inputCls} /></td>
                        <td className="px-3 py-2">
                          <select value={row.criticality} onChange={e => updateRow(row.id, 'criticality', e.target.value)} className={inputCls}>
                            {['low', 'medium', 'high', 'critical'].map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <button onClick={() => removeRow(row.id)} className="p-1 hover:bg-red-100 rounded transition-colors" disabled={rows.length === 1}>
                            <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-500">
                <ClipboardList className="w-4 h-4" />
                <span>Tip: Add one row per piece of equipment. You can edit details after import.</span>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Batch Summary</p>
                  <div className="space-y-2 text-sm">
                    {[
                      ['Deal', batch.deal_name],
                      ['Seller', batch.seller_name || '—'],
                      ['Clinic', clinics.find(c => c.id === batch.clinic_id)?.name || '—'],
                      ['Closing', batch.closing_date || '—'],
                      ['Intake Start', batch.intake_start_date || '—'],
                      ['Total Value', batch.estimated_total_purchase_allocated_value ? `$${parseFloat(batch.estimated_total_purchase_allocated_value).toLocaleString()}` : '—'],
                    ].map(([l, v]) => (
                      <div key={l} className="flex justify-between">
                        <span className="text-gray-500">{l}</span>
                        <span className="font-medium text-gray-900">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Asset Summary</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Assets</span>
                      <span className="font-bold text-gray-900">{rows.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Cost</span>
                      <span className="font-medium text-gray-900">${rows.reduce((s, r) => s + (parseFloat(r.purchase_cost) || 0), 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Critical Items</span>
                      <span className="font-medium text-orange-600">{rows.filter(r => r.criticality === 'critical').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Avg. Condition</span>
                      <span className="font-medium text-gray-900">{(rows.reduce((s, r) => s + (parseFloat(r.condition_score) || 0), 0) / rows.length).toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Validation Errors</span>
                      <span className={`font-bold ${errCount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{errCount}</span>
                    </div>
                  </div>
                </div>
              </div>

              {errCount > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                  <TriangleAlert className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-800">Validation errors found</p>
                    <p className="text-sm text-red-700 mt-0.5">{errCount} row{errCount !== 1 ? 's have' : ' has'} missing or invalid data. Click "Validate" to highlight issues.</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>
              )}

              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr className="text-left text-gray-500 font-medium">
                      <th className="px-3 py-2">Tag</th>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Manufacturer</th>
                      <th className="px-3 py-2">Cost</th>
                      <th className="px-3 py-2">Cond.</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Criticality</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rows.map(row => {
                      const hasErr = Object.keys(row.errors).length > 0;
                      return (
                        <tr key={row.id} className={hasErr ? 'bg-red-50' : ''}>
                          <td className="px-3 py-2 font-mono">{row.asset_tag}</td>
                          <td className="px-3 py-2 font-medium">{row.name || <span className="text-red-500 italic">Missing</span>}</td>
                          <td className="px-3 py-2 text-gray-600">{row.manufacturer || '—'}</td>
                          <td className="px-3 py-2">{row.purchase_cost ? `$${parseFloat(row.purchase_cost).toLocaleString()}` : '—'}</td>
                          <td className="px-3 py-2">{row.condition_score}</td>
                          <td className="px-3 py-2 capitalize">{row.status}</td>
                          <td className="px-3 py-2 capitalize">{row.criticality}</td>
                          <td className="px-3 py-2">{hasErr && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
                <CheckCircle className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Acquisition Complete</h3>
              <p className="text-gray-500 mb-2">{rows.length} asset{rows.length !== 1 ? 's' : ''} from <strong>{batch.deal_name}</strong> have been onboarded.</p>
              <p className="text-sm text-gray-400 mb-8">All assets are now visible in the Asset Register and linked to this acquisition batch.</p>
              <div className="flex gap-3">
                <button onClick={() => batchId && onComplete(batchId)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
                  <Package className="w-4 h-4" /> View Assets
                </button>
                <button onClick={onClose}
                  className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors">
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {step < 3 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 flex-shrink-0">
            <button onClick={step === 0 ? onClose : () => setStep(s => s - 1)}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
              {step === 0 ? 'Cancel' : 'Back'}
            </button>
            <div className="flex items-center gap-3">
              {step === 1 && (
                <span className="text-xs text-gray-500">{rows.length} asset{rows.length !== 1 ? 's' : ''} in roster</span>
              )}
              {step === 2 ? (
                <div className="flex items-center gap-2">
                  <button onClick={validateAll}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors">
                    Validate
                  </button>
                  <button onClick={handleSave} disabled={saving || errCount > 0}
                    className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors">
                    {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    {saving ? 'Importing...' : `Import ${rows.length} Assets`}
                  </button>
                </div>
              ) : (
                <button onClick={() => setStep(s => s + 1)}
                  disabled={step === 0 ? !canAdvanceBatch() : !canAdvanceRoster()}
                  className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors">
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
