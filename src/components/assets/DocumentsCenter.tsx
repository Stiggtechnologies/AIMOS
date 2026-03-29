import { useState, useEffect } from 'react';
import { FileStack, FileText, Download, ExternalLink } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

export default function DocumentsCenter() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, [typeFilter]);

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
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>;

  const docTypes = ['manual', 'warranty', 'certificate', 'inspection_report', 'maintenance_log', 'purchase_order', 'invoice', 'photo', 'schematic', 'safety', 'other'];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <FileStack className="w-6 h-6 text-blue-400" />
          Documents Center
        </h1>
        <p className="text-slate-400 mt-1">Live data from Supabase asset_documents & standardization_groups</p>
      </div>

      <div className="flex gap-4">
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white">
          <option value="all">All Types</option>
          {docTypes.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
        </select>
        <span className="text-slate-400 py-2">{documents.length} documents</span>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-3 gap-4">
        {documents.map((doc) => (
          <div key={doc.id} className="bg-slate-800 rounded-lg border border-slate-700 p-4 hover:border-blue-500/50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-400" />
                <div>
                  <p className="font-medium text-white">{doc.title}</p>
                  <p className="text-xs text-slate-400">{doc.document_type}</p>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-slate-400">{doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : ''}</span>
              {doc.file_url && (
                <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-400 hover:text-blue-300">
                  <ExternalLink className="w-4 h-4" /> View
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {documents.length === 0 && (
        <p className="text-center text-slate-400 py-12">No documents found</p>
      )}

      {/* Standardization Groups */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
        <h2 className="text-lg font-semibold text-white mb-4">Standardization Groups ({groups.length})</h2>
        <div className="grid grid-cols-4 gap-3">
          {groups.map((group) => (
            <div key={group.id} className="bg-slate-900 rounded p-3">
              <p className="font-medium text-white text-sm">{group.group_name}</p>
              <p className="text-xs text-slate-400 mt-1">{group.category_id || 'No category'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
