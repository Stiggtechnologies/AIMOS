import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Wrench, AlertTriangle, FileText } from 'lucide-react';
import { useAuth } from '@/auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// ─── FIELD MAPPING ────────────────────────────────────────────────────────────
// DB: room_location ← UI: location
// DB: asset_tag ← UI: asset_id
// DB: condition_score (numeric) ← UI: condition (text)
// DB: warranty_expiry_date ← UI: warranty_expiry

function conditionScoreToLabel(score: number | null | undefined): string {
  if (score == null) return '—';
  if (score >= 9) return 'excellent';
  if (score >= 7) return 'good';
  if (score >= 5) return 'fair';
  if (score >= 3) return 'poor';
  return 'critical';
}

// ─── LIVE DATA ────────────────────────────────────────────────────────────────
// Queries: assets, asset_audit_log, asset_documents

export default function AssetDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [asset, setAsset] = useState<any>(null);
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchAssetData(id);
  }, [id]);

  async function fetchAssetData(assetId: string) {
    try {
      const [assetRes, auditRes, docsRes] = await Promise.all([
        supabase.from('assets').select('*, asset_categories(name)').eq('id', assetId).single(),
        supabase.from('asset_audit_log').select('*').eq('asset_id', assetId).order('created_at', { ascending: false }).limit(20),
        supabase.from('asset_documents').select('*').eq('asset_id', assetId).order('uploaded_at', { ascending: false })
      ]);

      if (assetRes.data) setAsset(assetRes.data);
      if (auditRes.data) setAuditLog(auditRes.data);
      if (docsRes.data) setDocuments(docsRes.data || []);
    } catch (error) {
      console.error('Error fetching asset:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>;
  if (!asset) return <div className="p-6 text-slate-400">Asset not found</div>;

  const conditionLabel = conditionScoreToLabel(asset.condition_score);

  return (
    <div className="p-6 space-y-6">
      <button onClick={() => navigate('/assets/register')} className="flex items-center gap-2 text-slate-400 hover:text-white">
        <ArrowLeft className="w-4 h-4" /> Back to Register
      </button>

      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{asset.name}</h1>
            <p className="text-slate-400 mt-1">{asset.asset_tag || 'No Tag'}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            asset.status === 'operational' ? 'bg-emerald-500/20 text-emerald-400' :
            asset.status === 'maintenance' ? 'bg-amber-500/20 text-amber-400' :
            'bg-slate-500/20 text-slate-400'
          }`}>{asset.status || '—'}</span>
        </div>

        <div className="grid grid-cols-4 gap-6 mt-6">
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-xs text-slate-400">Location</p>
              <p className="text-white">{asset.room_location || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Wrench className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-xs text-slate-400">Category</p>
              <p className="text-white">{asset.asset_categories?.name || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-xs text-slate-400">Condition</p>
              <p className="text-white">{conditionLabel} ({asset.condition_score ?? '—'})</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-xs text-slate-400">Warranty Expiry</p>
              <p className="text-white">{asset.warranty_expiry_date ? new Date(asset.warranty_expiry_date).toLocaleDateString() : '—'}</p>
            </div>
          </div>
        </div>

        {/* Extended info grid */}
        <div className="grid grid-cols-4 gap-6 mt-6 pt-6 border-t border-slate-700">
          <div>
            <p className="text-xs text-slate-400">Manufacturer</p>
            <p className="text-white">{asset.manufacturer || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Model</p>
            <p className="text-white">{asset.model || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Serial Number</p>
            <p className="text-white">{asset.serial_number || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Purchase Cost</p>
            <p className="text-white">{asset.purchase_cost ? `$${asset.purchase_cost.toLocaleString()}` : '—'}</p>
          </div>
        </div>
      </div>

      {/* Documents */}
      <div className="bg-slate-800 rounded-lg border border-slate-700">
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <FileText className="w-5 h-5" /> Documents ({documents.length})
          </h2>
        </div>
        <div className="divide-y divide-slate-700">
          {documents.map((doc) => (
            <div key={doc.id} className="p-4 hover:bg-slate-700/50">
              <p className="text-white">{doc.title}</p>
              <p className="text-xs text-slate-400">{doc.document_type || '—'} • {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : ''}</p>
            </div>
          ))}
          {documents.length === 0 && <p className="p-4 text-slate-400 text-center">No documents uploaded yet</p>}
        </div>
      </div>

      {/* Audit Log */}
      <div className="bg-slate-800 rounded-lg border border-slate-700">
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Activity Log ({auditLog.length})</h2>
        </div>
        <div className="divide-y divide-slate-700">
          {auditLog.map((log) => (
            <div key={log.id} className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-white">{log.action}</span>
                <span className="text-xs text-slate-400">{new Date(log.created_at).toLocaleString()}</span>
              </div>
              {log.notes && <p className="text-sm text-slate-400 mt-1">{log.notes}</p>}
            </div>
          ))}
          {auditLog.length === 0 && <p className="p-4 text-slate-400 text-center">No activity logged</p>}
        </div>
      </div>
    </div>
  );
}