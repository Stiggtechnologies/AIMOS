import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, MapPin, Wrench, FileText, Tag, DollarSign, Hash, Pencil, Plus, ExternalLink, ClipboardList, TriangleAlert as AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import EditAssetDrawer from './EditAssetDrawer';
import DocumentUploadModal from './DocumentUploadModal';
import CreateWorkOrderModal from './CreateWorkOrderModal';

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
  onNavigate?: (module: string, subModule: string) => void;
}

export default function AssetDetailView({ assetId, onBack, onNavigate }: Props) {
  const [asset, setAsset] = useState<any>(null);
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showDocUpload, setShowDocUpload] = useState(false);
  const [showCreateWO, setShowCreateWO] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'work-orders' | 'documents' | 'activity'>('overview');

  useEffect(() => {
    if (assetId) fetchAssetData(assetId);
  }, [assetId]);

  async function fetchAssetData(id: string) {
    setLoading(true);
    try {
      const [assetRes, auditRes, docsRes, woRes] = await Promise.all([
        supabase.from('assets').select('*, asset_categories(name)').eq('id', id).maybeSingle(),
        supabase.from('asset_audit_log').select('*').eq('asset_id', id).order('created_at', { ascending: false }).limit(30),
        supabase.from('asset_documents').select('*').eq('asset_id', id).order('uploaded_at', { ascending: false }),
        supabase.from('work_orders').select('*').eq('asset_id', id).order('created_at', { ascending: false }).limit(20),
      ]);
      if (assetRes.data) setAsset(assetRes.data);
      if (auditRes.data) setAuditLog(auditRes.data);
      if (docsRes.data) setDocuments(docsRes.data);
      if (woRes.data) setWorkOrders(woRes.data);
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
          <ArrowLeft className="w-4 h-4" /> Back
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
    asset.status === 'active'         ? 'bg-blue-100 text-blue-700' :
    asset.status === 'maintenance'    ? 'bg-amber-100 text-amber-700' :
    asset.status === 'decommissioned' ? 'bg-gray-100 text-gray-600' :
                                        'bg-gray-100 text-gray-600';

  const openWorkOrders = workOrders.filter(w => !['completed', 'cancelled'].includes(w.status));

  const statusBadgeWO = (s: string) => {
    const cls = s === 'completed' ? 'bg-emerald-100 text-emerald-700' : s === 'in_progress' ? 'bg-blue-100 text-blue-700' : s === 'scheduled' ? 'bg-sky-100 text-sky-700' : 'bg-gray-100 text-gray-600';
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{s?.replace('_', ' ')}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowCreateWO(true)}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 hover:border-gray-400 text-gray-700 text-sm font-medium rounded-lg transition-colors">
            <ClipboardList className="w-4 h-4" /> Work Order
          </button>
          <button onClick={() => setShowEdit(true)}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
            <Pencil className="w-4 h-4" /> Edit Asset
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-start justify-between mb-5 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{asset.name}</h1>
            <p className="text-gray-500 mt-0.5 font-mono text-sm">{asset.asset_tag || 'No Asset Tag'}</p>
            {asset.manufacturer && (
              <p className="text-sm text-gray-500 mt-1">{[asset.manufacturer, asset.model].filter(Boolean).join(' — ')}</p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${statusBadgeCls}`}>{asset.status || '—'}</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${conditionBadgeCls}`}>
              {conditionLabel} {asset.condition_score != null ? `(${asset.condition_score}/10)` : ''}
            </span>
          </div>
        </div>

        {openWorkOrders.length > 0 && (
          <div className="mb-5 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span className="text-sm text-amber-800 font-medium">{openWorkOrders.length} open work order{openWorkOrders.length !== 1 ? 's' : ''} on this asset</span>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {[
            { icon: <MapPin className="w-4 h-4 text-gray-400" />, label: 'Location', value: asset.room_location || '—' },
            { icon: <Wrench className="w-4 h-4 text-gray-400" />, label: 'Category', value: asset.asset_categories?.name || '—' },
            { icon: <Calendar className="w-4 h-4 text-gray-400" />, label: 'Warranty Expiry', value: asset.warranty_expiry_date ? new Date(asset.warranty_expiry_date).toLocaleDateString() : '—' },
            { icon: <DollarSign className="w-4 h-4 text-gray-400" />, label: 'Purchase Cost', value: asset.purchase_cost ? `$${Number(asset.purchase_cost).toLocaleString()}` : '—' },
            { icon: <Tag className="w-4 h-4 text-gray-400" />, label: 'Manufacturer', value: asset.manufacturer || '—' },
            { icon: <Hash className="w-4 h-4 text-gray-400" />, label: 'Model', value: asset.model || '—' },
            { icon: <Hash className="w-4 h-4 text-gray-400" />, label: 'Serial Number', value: asset.serial_number || '—' },
            { icon: <DollarSign className="w-4 h-4 text-gray-400" />, label: 'Replacement Cost', value: asset.replacement_cost ? `$${Number(asset.replacement_cost).toLocaleString()}` : '—' },
          ].map(({ icon, label, value }) => (
            <div key={label} className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">{icon} {label}</div>
              <p className="text-sm font-medium text-gray-900">{value}</p>
            </div>
          ))}
        </div>

        {asset.description && (
          <div className="mt-5 pt-5 border-t border-gray-200">
            <p className="text-xs font-medium text-gray-500 mb-1">Description</p>
            <p className="text-sm text-gray-700">{asset.description}</p>
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl">
        <div className="flex border-b border-gray-200 px-6">
          {([
            { key: 'overview', label: 'Overview' },
            { key: 'work-orders', label: `Work Orders (${workOrders.length})` },
            { key: 'documents', label: `Documents (${documents.length})` },
            { key: 'activity', label: 'Activity' },
          ] as const).map(({ key, label }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === key ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                ['Criticality', asset.criticality?.toUpperCase() || '—'],
                ['Ownership', asset.ownership_type || '—'],
                ['Useful Life', asset.useful_life_months ? `${asset.useful_life_months} months` : '—'],
                ['Purchase Date', asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString() : '—'],
                ['In Service', asset.in_service_date ? new Date(asset.in_service_date).toLocaleDateString() : '—'],
                ['Expected Replacement', asset.expected_replacement_date ? new Date(asset.expected_replacement_date).toLocaleDateString() : '—'],
                ['Installation Cost', asset.installation_cost ? `$${Number(asset.installation_cost).toLocaleString()}` : '—'],
                ['Book Value', asset.book_value ? `$${Number(asset.book_value).toLocaleString()}` : '—'],
                ['Condition Notes', asset.condition_notes || '—'],
              ].map(([l, v]) => (
                <div key={l} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-0.5">{l}</p>
                  <p className="text-sm font-medium text-gray-900 capitalize">{v}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'work-orders' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-gray-700">{workOrders.length} work orders</p>
                <button onClick={() => setShowCreateWO(true)}
                  className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium">
                  <Plus className="w-3.5 h-3.5" /> New Work Order
                </button>
              </div>
              {workOrders.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <ClipboardList className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">No work orders for this asset</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {workOrders.map(wo => (
                    <div key={wo.id} className="py-3 flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-blue-600">{wo.work_order_number}</span>
                          <span className="text-sm font-medium text-gray-900 capitalize">{wo.type?.replace('_', ' ')}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{wo.issue_description}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {statusBadgeWO(wo.status)}
                        {wo.total_cost != null && <span className="text-xs text-gray-500">${Number(wo.total_cost).toFixed(0)}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'documents' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-gray-700">{documents.length} documents</p>
                <button onClick={() => setShowDocUpload(true)}
                  className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium">
                  <Plus className="w-3.5 h-3.5" /> Add Document
                </button>
              </div>
              {documents.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <FileText className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">No documents uploaded</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {documents.map(doc => (
                    <div key={doc.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{doc.title}</p>
                          <p className="text-xs text-gray-500 capitalize">{doc.document_type?.replace(/_/g, ' ')} {doc.expiry_date ? `· Expires ${new Date(doc.expiry_date).toLocaleDateString()}` : ''}</p>
                        </div>
                      </div>
                      {doc.file_url && (
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium flex-shrink-0">
                          <ExternalLink className="w-3.5 h-3.5" /> View
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div>
              {auditLog.length === 0 ? (
                <p className="text-center py-8 text-gray-400 text-sm">No activity logged</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {auditLog.map(log => (
                    <div key={log.id} className="py-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">{log.action}</span>
                        <span className="text-xs text-gray-500">{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                      {log.field_changed && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {log.field_changed}: {log.old_value || '—'} → {log.new_value || '—'}
                        </p>
                      )}
                      {log.notes && <p className="text-xs text-gray-500 mt-0.5">{log.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showEdit && (
        <EditAssetDrawer
          assetId={assetId}
          onClose={() => setShowEdit(false)}
          onSaved={() => { setShowEdit(false); fetchAssetData(assetId); }}
        />
      )}

      {showDocUpload && (
        <DocumentUploadModal
          assetId={assetId}
          onClose={() => setShowDocUpload(false)}
          onSaved={() => { setShowDocUpload(false); fetchAssetData(assetId); }}
        />
      )}

      {showCreateWO && (
        <CreateWorkOrderModal
          preselectedAssetId={assetId}
          onClose={() => setShowCreateWO(false)}
          onSaved={() => { setShowCreateWO(false); fetchAssetData(assetId); }}
        />
      )}
    </div>
  );
}
