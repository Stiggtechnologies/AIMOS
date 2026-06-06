import { useState, useEffect } from 'react';
import { X, FileText, Upload, CircleCheck as CheckCircle, Link } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Props {
  assetId?: string;
  onClose: () => void;
  onSaved: () => void;
}

const DOC_TYPES = [
  'manual', 'warranty', 'certificate', 'inspection_report', 'maintenance_log',
  'purchase_order', 'invoice', 'photo', 'schematic', 'safety', 'calibration', 'other',
] as const;

export default function DocumentUploadModal({ assetId, onClose, onSaved }: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [assets, setAssets] = useState<any[]>([]);

  const [form, setForm] = useState({
    asset_id: assetId || '',
    title: '',
    document_type: 'manual' as typeof DOC_TYPES[number],
    file_url: '',
    expiry_date: '',
    notes: '',
    version: '1',
  });

  useEffect(() => {
    if (!assetId) {
      supabase.from('assets').select('id, name, asset_tag').order('name').then(({ data }) => setAssets(data || []));
    }
  }, [assetId]);

  const set = (f: string, v: string) => setForm(e => ({ ...e, [f]: v }));

  const handleSave = async () => {
    if (!form.title.trim() || !form.file_url.trim()) {
      setError('Title and URL are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload: any = {
        asset_id: form.asset_id || null,
        title: form.title.trim(),
        document_type: form.document_type,
        file_url: form.file_url.trim(),
        expiry_date: form.expiry_date || null,
        version: parseInt(form.version) || 1,
        status: 'active',
        uploaded_at: new Date().toISOString(),
      };
      const { error: err } = await supabase.from('asset_documents').insert(payload);
      if (err) throw err;
      onSaved();
    } catch (e: any) {
      setError(e.message || 'Failed to save document');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500';
  const labelCls = 'block text-xs font-medium text-gray-700 mb-1';
  const needsExpiry = ['warranty', 'certificate', 'calibration', 'inspection_report'].includes(form.document_type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Add Document</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 overflow-y-auto">
          {!assetId && (
            <div>
              <label className={labelCls}>Asset (optional)</label>
              <select value={form.asset_id} onChange={e => set('asset_id', e.target.value)} className={inputCls}>
                <option value="">Not linked to a specific asset</option>
                {assets.map(a => <option key={a.id} value={a.id}>{a.name} {a.asset_tag ? `(${a.asset_tag})` : ''}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className={labelCls}>Document Title <span className="text-red-500">*</span></label>
            <input value={form.title} onChange={e => set('title', e.target.value)} className={inputCls} placeholder="e.g. Treatment Table Manual v2" />
          </div>

          <div>
            <label className={labelCls}>Document Type</label>
            <div className="grid grid-cols-3 gap-1.5">
              {DOC_TYPES.map(t => (
                <button key={t} onClick={() => set('document_type', t)}
                  className={`px-2 py-1.5 rounded-lg border text-xs font-medium capitalize transition-all ${form.document_type === t ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                  {t.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelCls}>
              <span className="flex items-center gap-1"><Link className="w-3.5 h-3.5" /> File URL <span className="text-red-500">*</span></span>
            </label>
            <input value={form.file_url} onChange={e => set('file_url', e.target.value)} className={inputCls}
              placeholder="https://drive.google.com/..." />
            <p className="text-xs text-gray-400 mt-1">Link to Google Drive, Dropbox, SharePoint, or any hosted file URL</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {needsExpiry && (
              <div>
                <label className={labelCls}>Expiry Date</label>
                <input type="date" value={form.expiry_date} onChange={e => set('expiry_date', e.target.value)} className={inputCls} />
              </div>
            )}
            <div>
              <label className={labelCls}>Version</label>
              <input type="number" min="1" value={form.version} onChange={e => set('version', e.target.value)} className={inputCls} />
            </div>
          </div>

          {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
            {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Document'}
          </button>
        </div>
      </div>
    </div>
  );
}
