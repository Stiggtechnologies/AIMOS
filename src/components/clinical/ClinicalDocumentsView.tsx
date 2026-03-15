import { useState } from 'react';
import { FileStack, Plus, Search, Download, Eye, Filter, FileText, Upload, Calendar, User } from 'lucide-react';

const DOCUMENTS = [
  { id: '1', title: 'Initial Assessment Report', patient: 'Jane Smith', type: 'Assessment', format: 'PDF', size: '245 KB', date: '2026-03-14', clinician: 'Dr. Chen', status: 'final' },
  { id: '2', title: 'Treatment Plan - ACL Protocol', patient: 'Sara Lee', type: 'Treatment Plan', format: 'PDF', size: '180 KB', date: '2026-03-12', clinician: 'Dr. Williams', status: 'final' },
  { id: '3', title: 'MVA Progress Note', patient: 'Tom Brown', type: 'Progress Note', format: 'PDF', size: '95 KB', date: '2026-03-11', clinician: 'Dr. Chen', status: 'draft' },
  { id: '4', title: 'Discharge Summary', patient: 'Mark Johnson', type: 'Discharge', format: 'PDF', size: '310 KB', date: '2026-03-10', clinician: 'Dr. Patel', status: 'final' },
  { id: '5', title: 'Functional Capacity Evaluation', patient: 'Carlos Reyes', type: 'FCE', format: 'PDF', size: '520 KB', date: '2026-03-08', clinician: 'Dr. Williams', status: 'final' },
  { id: '6', title: 'Insurance Report', patient: 'Linda Evans', type: 'Insurance', format: 'DOCX', size: '142 KB', date: '2026-03-07', clinician: 'Dr. Patel', status: 'final' },
];

const TYPE_COLORS: Record<string, string> = {
  'Assessment': 'bg-blue-100 text-blue-800',
  'Treatment Plan': 'bg-teal-100 text-teal-800',
  'Progress Note': 'bg-green-100 text-green-800',
  'Discharge': 'bg-gray-100 text-gray-700',
  'FCE': 'bg-orange-100 text-orange-800',
  'Insurance': 'bg-yellow-100 text-yellow-800'
};

export default function ClinicalDocumentsView() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const filtered = DOCUMENTS.filter(d => {
    const matchSearch = !search || d.title.toLowerCase().includes(search.toLowerCase()) || d.patient.toLowerCase().includes(search.toLowerCase());
    const matchType = !typeFilter || d.type === typeFilter;
    return matchSearch && matchType;
  });

  const docTypes = [...new Set(DOCUMENTS.map(d => d.type))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Clinical Documents</h2>
          <p className="text-gray-600 mt-1">Patient documentation library and reports</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </button>
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
            <Plus className="h-4 w-4 mr-2" />
            New Document
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="text-2xl font-bold text-blue-600">{DOCUMENTS.length}</div>
          <div className="text-sm text-gray-600">Total Documents</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="text-2xl font-bold text-green-600">{DOCUMENTS.filter(d => d.status === 'final').length}</div>
          <div className="text-sm text-gray-600">Finalized</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="text-2xl font-bold text-yellow-600">{DOCUMENTS.filter(d => d.status === 'draft').length}</div>
          <div className="text-sm text-gray-600">Drafts</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents or patients..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            {docTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Document</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Patient</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Clinician</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(doc => (
                <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      <div>
                        <div className="font-medium text-gray-900">{doc.title}</div>
                        <div className="text-xs text-gray-500">{doc.format} · {doc.size}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1 text-gray-700">
                      <User className="h-3.5 w-3.5 text-gray-400" />
                      {doc.patient}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${TYPE_COLORS[doc.type] ?? 'bg-gray-100 text-gray-700'}`}>
                      {doc.type}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Calendar className="h-3.5 w-3.5 text-gray-400" />
                      {new Date(doc.date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-700">{doc.clinician}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 text-xs rounded-full capitalize ${doc.status === 'final' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-700'}`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors">
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
