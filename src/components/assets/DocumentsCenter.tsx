import { useState, useEffect } from 'react';
import { FileStack, FileText, ExternalLink, Plus, Calendar, TriangleAlert as AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import DocumentUploadModal from './DocumentUploadModal';

const DOC_TYPES = ['manual','warranty','certificate','inspection_report','maintenance_log','purchase_order','invoice','photo','schematic','safety','calibration','other'];

interface Props {
  onNavigate?: (module: string, subModule: string) => void;
}

export default function DocumentsCenter({ onNavigate }: Props) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => { fetchData(); }, [typeFilter]);

  async function fetchData() {
    try {
      const [docsRes, groupsRes] = await Promise.all([
        typeFilter === 'all'
          ? supabase.from('asset_documents').select('*, assets(name, asset_tag)').order('uploaded_at', { ascending: false }).limit(100)
          : supabase.from('asset_documents').select('*, assets(name, asset_tag)').eq('document_type', typeFilter).order('uploaded_at', { ascending: false }),
        supabase.from('standardization_groups').select('*').order('created_at', { ascending: false })
      ]);
      if (docsRes.data) setDocuments(docsRes.data);
      if (groupsRes.data) setGroups(groupsRes.data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }

  const today = new Date();
  const thirtyDays = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  const expiringSoon = documents.filter(d => d.expiry_date && new Date(d.expiry_date) <= thirtyDays && new Date(d.expiry_date) >= today);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <FileStack className="w-6 h-6 text-blue-600" /> Documents Center
          </h1>
          <p className="text-gray-500 mt-1">{documents.length} document{documents.length !== 1 ? 's' : ''} across all assets</p>
        </div>
        <button onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm flex-shrink-0">
          <Plus className="w-4 h-4" /> Add Document
        </button>
      </div>

      {expiringSoon.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">{expiringSoon.length} document{expiringSoon.length !== 1 ? 's' : ''} expiring within 30 days</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {expiringSoon.map(d => (
                <span key={d.id} className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                  {d.title} — {new Date(d.expiry_date).toLocaleDateString()}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          <option value="all">All Types</option>
          {DOC_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
        </select>
        <span className="text-xs text-gray-400">{documents.length} results</span>
      </div>

      {documents.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => {
            const isExpired = doc.expiry_date && new Date(doc.expiry_date) < today;
            const isExpiringSoon = doc.expiry_date && new Date(doc.expiry_date) <= thirtyDays && !isExpired;
            return (
              <div key={doc.id}
                className={`bg-white border rounded-xl p-4 hover:shadow-sm transition-all ${
                  isExpired ? 'border-red-200' : isExpiringSoon ? 'border-amber-200' : 'border-gray-200 hover:border-blue-300'
                } ${doc.asset_id ? 'cursor-pointer' : ''}`}
                onClick={() => doc.asset_id && onNavigate?.('assets', `asset-detail:${doc.asset_id}`)}>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isExpired ? 'bg-red-50' : isExpiringSoon ? 'bg-amber-50' : 'bg-blue-50'
                  }`}>
                    <FileText className={`w-5 h-5 ${isExpired ? 'text-red-600' : isExpiringSoon ? 'text-amber-600' : 'text-blue-600'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate text-sm">{doc.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 capitalize">{doc.document_type?.replace(/_/g, ' ')}</p>
                    {doc.assets?.name && <p className="text-xs text-gray-400 mt-0.5 truncate">{doc.assets.name}</p>}
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : ''}</span>
                    {doc.expiry_date && (
                      <span className={`flex items-center gap-0.5 text-xs font-medium ${
                        isExpired ? 'text-red-600' : isExpiringSoon ? 'text-amber-600' : 'text-gray-400'
                      }`}>
                        <Calendar className="w-3 h-3" />
                        {isExpired ? 'Expired' : `Exp. ${new Date(doc.expiry_date).toLocaleDateString()}`}
                      </span>
                    )}
                  </div>
                  {doc.file_url && (
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium flex-shrink-0">
                      <ExternalLink className="w-3 h-3" /> View
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl flex flex-col items-center justify-center py-16 text-gray-400">
          <FileStack className="w-10 h-10 mb-3" />
          <p className="text-sm font-medium text-gray-600">No documents found</p>
          <button onClick={() => setShowUpload(true)} className="mt-3 text-xs text-blue-600 hover:text-blue-700 font-medium">Add your first document</button>
        </div>
      )}

      {groups.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-base font-semibold text-gray-900">Standardization Groups ({groups.length})</h2>
          </div>
          <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {groups.map((group) => (
              <div key={group.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                <p className="font-medium text-gray-900 text-sm">{group.group_name}</p>
                {group.standard_target_model && <p className="text-xs text-gray-500 mt-1">Target: {group.standard_target_model}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {showUpload && (
        <DocumentUploadModal
          onClose={() => setShowUpload(false)}
          onSaved={() => { setShowUpload(false); fetchData(); }}
        />
      )}
    </div>
  );
}
