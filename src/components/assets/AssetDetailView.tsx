import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, MapPin, Wrench, FileText, Tag, DollarSign, Hash } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

function conditionScoreToLabel(score: number | null | undefined): string {
  if (score == null) return '—';
  if (score >= 9) return 'Excellent';
  if (score >= 7) return 'Good';
  if (score >= 5) return 'Fair';
  if (score >= 3) return 'Poor';
  return 'Critical';
}

interface Props {
  assetId: string;
  onBack: () => void;
}

export default function AssetDetailView({ assetId, onBack }: Props) {
  const [asset, setAsset] = useState<any>(null);
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (assetId) fetchAssetData(assetId);
  }, [assetId]);

  async function fetchAssetData(id: string) {
    try {
      const [assetRes, auditRes, docsRes] = await Promise.all([
        supabase.from('assets').select('*, asset_categories(name)').eq('id', id).maybeSingle(),
        supabase.from('asset_audit_log').select('*').eq('asset_id', id).order('created_at', { ascending: false }).limit(20),
        supabase.from('asset_documents').select('*').eq('asset_id', id).order('uploaded_at', { ascending: false })
      ]);
      if (assetRes.data) setAsset(assetRes.data);
      if (auditRes.data) setAuditLog(auditRes.data);
      if (docsRes.data) setDocuments(docsRes.data);
    } catch (error) {
      console.error('Error fetching asset:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  }

  if (!asset) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Register
        </button>
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-gray-500">Asset not found</div>
      </div>
    );
  }

  const conditionLabel = conditionScoreToLabel(asset.condition_score);

  const conditionBadgeCls =
    conditionLabel === 'Excellent' ? 'bg-emerald-100 text-emerald-700' :
    conditionLabel === 'Good'      ? 'bg-blue-100 text-blue-700' :
    conditionLabel === 'Fair'      ? 'bg-amber-100 text-amber-700' :
    conditionLabel === 'Poor'      ? 'bg-orange-100 text-orange-700' :
                                     'bg-red-100 text-red-700';

  const statusBadgeCls =
    asset.status === 'operational'    ? 'bg-emerald-100 text-emerald-700' :
    asset.status === 'maintenance'    ? 'bg-amber-100 text-amber-700' :
    asset.status === 'decommissioned' ? 'bg-gray-100 text-gray-600' :
                                        'bg-gray-100 text-gray-600';

  const metaFields = [
    { icon: <MapPin className="w-4 h-4 text-gray-400" />, label: 'Location', value: asset.room_location || '—' },
    { icon: <Wrench className="w-4 h-4 text-gray-400" />, label: 'Category', value: asset.asset_categories?.name || '—' },
    { icon: <Calendar className="w-4 h-4 text-gray-400" />, label: 'Warranty Expiry', value: asset.warranty_expiry_date ? new Date(asset.warranty_expiry_date).toLocaleDateString() : '—' },
    { icon: <DollarSign className="w-4 h-4 text-gray-400" />, label: 'Purchase Cost', value: asset.purchase_cost ? `$${asset.purchase_cost.toLocaleString()}` : '—' },
    { icon: <Tag className="w-4 h-4 text-gray-400" />, label: 'Manufacturer', value: asset.manufacturer || '—' },
    { icon: <Hash className="w-4 h-4 text-gray-400" />, label: 'Model', value: asset.model || '—' },
    { icon: <Hash className="w-4 h-4 text-gray-400" />, label: 'Serial Number', value: asset.serial_number || '—' },
    { icon: <DollarSign className="w-4 h-4 text-gray-400" />, label: 'Replacement Cost', value: asset.replacement_cost ? `$${asset.replacement_cost.toLocaleString()}` : '—' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Register
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{asset.name}</h1>
            <p className="text-gray-500 mt-1">{asset.asset_tag || 'No Asset Tag'}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${statusBadgeCls}`}>{asset.status || '—'}</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${conditionBadgeCls}`}>
              {conditionLabel} {asset.condition_score != null ? `(${asset.condition_score}/10)` : ''}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {metaFields.map(({ icon, label, value }) => (
            <div key={label} className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                {icon} {label}
              </div>
              <p className="text-sm font-medium text-gray-900">{value}</p>
            </div>
          ))}
        </div>

        {asset.description && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs font-medium text-gray-500 mb-1">Description</p>
            <p className="text-sm text-gray-700">{asset.description}</p>
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-500" />
          <h2 className="text-base font-semibold text-gray-900">Documents ({documents.length})</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {documents.map((doc) => (
            <div key={doc.id} className="px-6 py-4 hover:bg-gray-50">
              <p className="font-medium text-gray-900">{doc.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{doc.document_type || '—'} &middot; {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : ''}</p>
            </div>
          ))}
          {documents.length === 0 && <p className="px-6 py-8 text-center text-gray-400 text-sm">No documents uploaded yet</p>}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Activity Log ({auditLog.length})</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {auditLog.map((log) => (
            <div key={log.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">{log.action}</span>
                <span className="text-xs text-gray-500">{new Date(log.created_at).toLocaleString()}</span>
              </div>
              {log.notes && <p className="text-sm text-gray-500 mt-1">{log.notes}</p>}
            </div>
          ))}
          {auditLog.length === 0 && <p className="px-6 py-8 text-center text-gray-400 text-sm">No activity logged</p>}
        </div>
      </div>
    </div>
  );
}
