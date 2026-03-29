import { useState, useEffect } from 'react';
import { FileStack, FileText, ExternalLink } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

const DOC_TYPES = ['manual','warranty','certificate','inspection_report','maintenance_log','purchase_order','invoice','photo','schematic','safety','other'];

export default function DocumentsCenter() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => { fetchData(); }, [typeFilter]);

  async function fetchData() {
    try {
      const [docsRes, groupsRes] = await Promise.all([
        typeFilter === 'all'
          ? supabase.from('asset_documents').select('*').order('uploaded_at', { ascending: false }).limit(100)
          : supabase.from('asset_documents').select('*').eq('document_type', typeFilter).order('uploaded_at', { ascending: false }),
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

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <FileStack className="w-6 h-6 text-blue-600" /> Documents Center
        </h1>
        <p className="text-gray-500 mt-1">{documents.length} document{documents.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="flex items-center gap-3">
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          <option value="all">All Types</option>
          {DOC_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      {documents.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <div key={doc.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{doc.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 capitalize">{doc.document_type?.replace(/_/g, ' ')}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-gray-400">{doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : ''}</span>
                {doc.file_url && (
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
                    <ExternalLink className="w-3 h-3" /> View
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg flex flex-col items-center justify-center py-16 text-gray-400">
          <FileStack className="w-10 h-10 mb-3" />
          <p className="text-sm">No documents found</p>
        </div>
      )}

      {groups.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-base font-semibold text-gray-900">Standardization Groups ({groups.length})</h2>
          </div>
          <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {groups.map((group) => (
              <div key={group.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                <p className="font-medium text-gray-900 text-sm">{group.group_name}</p>
                <p className="text-xs text-gray-500 mt-1">{group.category_id || 'No category'}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
