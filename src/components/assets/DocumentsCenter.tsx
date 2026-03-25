import React, { useState } from 'react';
import { 
  FileText, 
  Upload, 
  Download, 
  Search, 
  Filter,
  Plus,
  MoreVertical,
  Eye,
  Trash2,
  File,
  Image,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  Building2
} from 'lucide-react';

// Types
interface AssetDocument {
  id: string;
  title: string;
  document_type: 'invoice' | 'manual' | 'warranty' | 'calibration' | 'certificate' | 'photo' | 'other';
  asset_id: string;
  asset_name: string;
  asset_tag: string;
  clinic_id: string;
  clinic_name: string;
  file_url: string;
  file_size: string;
  uploaded_by: string;
  uploaded_at: string;
}

interface MissingDocStats {
  missing_invoice: number;
  missing_manual: number;
  missing_warranty: number;
  missing_calibration: number;
}

// Mock data
const mockDocuments: AssetDocument[] = [
  {
    id: '1',
    title: 'Treatment Table Invoice',
    document_type: 'invoice',
    asset_id: '1',
    asset_name: 'Treatment Table',
    asset_tag: 'AIM-EDM-001-T001',
    clinic_id: 'clinic-1',
    clinic_name: 'AIM Edmonton',
    file_url: '/docs/invoice.pdf',
    file_size: '245 KB',
    uploaded_by: 'Sarah Chen',
    uploaded_at: '2024-02-01'
  },
  {
    id: '2',
    title: 'ProTable 3000 Manual',
    document_type: 'manual',
    asset_id: '1',
    asset_name: 'Treatment Table',
    asset_tag: 'AIM-EDM-001-T001',
    clinic_id: 'clinic-1',
    clinic_name: 'AIM Edmonton',
    file_url: '/docs/manual.pdf',
    file_size: '4.2 MB',
    uploaded_by: 'Michael Roberts',
    uploaded_at: '2024-02-05'
  },
  {
    id: '3',
    title: 'Shockwave Warranty Certificate',
    document_type: 'warranty',
    asset_id: '3',
    asset_name: 'Shockwave Therapy',
    asset_tag: 'AIM-EDM-001-S001',
    clinic_id: 'clinic-1',
    clinic_name: 'AIM Edmonton',
    file_url: '/docs/warranty.pdf',
    file_size: '128 KB',
    uploaded_by: 'Sarah Chen',
    uploaded_at: '2024-03-15'
  },
  {
    id: '4',
    title: 'Annual Calibration Certificate',
    document_type: 'certificate',
    asset_id: '3',
    asset_name: 'Shockwave Therapy',
    asset_tag: 'AIM-EDM-001-S001',
    clinic_id: 'clinic-1',
    clinic_name: 'AIM Edmonton',
    file_url: '/docs/calibration.pdf',
    file_size: '89 KB',
    uploaded_by: 'Technician',
    uploaded_at: '2024-12-01'
  },
  {
    id: '5',
    title: 'Treatment Room Photo',
    document_type: 'photo',
    asset_id: '2',
    asset_name: 'Treatment Table',
    asset_tag: 'AIM-EDM-001-T002',
    clinic_id: 'clinic-1',
    clinic_name: 'AIM Edmonton',
    file_url: '/docs/photo.jpg',
    file_size: '1.8 MB',
    uploaded_by: 'Jennifer Wilson',
    uploaded_at: '2024-11-20'
  }
];

const mockMissingStats: MissingDocStats = {
  missing_invoice: 3,
  missing_manual: 5,
  missing_warranty: 4,
  missing_calibration: 2
};

// Components
const DocTypeIcon: React.FC<{ type: string }> = ({ type }) => {
  const icons: Record<string, React.ReactNode> = {
    invoice: <FileSpreadsheet size={20} className="text-green-600" />,
    manual: <FileText size={20} className="text-blue-600" />,
    warranty: <FileText size={20} className="text-purple-600" />,
    calibration: <FileText size={20} className="text-orange-600" />,
    certificate: <FileText size={20} className="text-indigo-600" />,
    photo: <Image size={20} className="text-pink-600" />,
    other: <File size={20} className="text-gray-600" />
  };
  return icons[type] || icons.other;
};

const MissingBadge: React.FC<{ count: number; label: string }> = ({ count, label }) => (
  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${count > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
    {count > 0 ? (
      <AlertCircle size={18} className="text-red-500" />
    ) : (
      <CheckCircle size={18} className="text-green-500" />
    )}
    <span className="text-sm">
      <span className="font-bold">{count}</span> {label}
    </span>
  </div>
);

// Main Component
export const DocumentsCenter: React.FC = () => {
  const [filterType, setFilterType] = useState('all');
  const [filterClinic, setFilterClinic] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showMissingOnly, setShowMissingOnly] = useState(false);

  const filteredDocs = mockDocuments.filter(doc => {
    if (filterType !== 'all' && doc.document_type !== filterType) return false;
    if (filterClinic !== 'all' && doc.clinic_id !== filterClinic) return false;
    if (searchTerm && !doc.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !doc.asset_name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="text-cyan-600" />
              Documents Center
            </h1>
            <p className="mt-2 text-gray-600">Manage asset-linked documents and records</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700">
            <Upload size={18} />
            Upload Document
          </button>
        </div>
      </div>

      {/* Missing Documents Summary */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <h2 className="font-semibold text-gray-900 mb-3">Missing Required Documents</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MissingBadge count={mockMissingStats.missing_invoice} label="Invoices" />
          <MissingBadge count={mockMissingStats.missing_manual} label="Manuals" />
          <MissingBadge count={mockMissingStats.missing_warranty} label="Warranties" />
          <MissingBadge count={mockMissingStats.missing_calibration} label="Calibrations" />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-4 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-500" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500"
            >
              <option value="all">All Types</option>
              <option value="invoice">Invoice</option>
              <option value="manual">Manual</option>
              <option value="warranty">Warranty</option>
              <option value="calibration">Calibration</option>
              <option value="certificate">Certificate</option>
              <option value="photo">Photo</option>
            </select>
            <select
              value={filterClinic}
              onChange={(e) => setFilterClinic(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500"
            >
              <option value="all">All Clinics</option>
              <option value="clinic-1">AIM Edmonton</option>
              <option value="clinic-2">Calgary South</option>
              <option value="clinic-3">Red Deer</option>
            </select>
          </div>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Document</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clinic</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uploaded</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Size</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredDocs.map(doc => (
                <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <DocTypeIcon type={doc.document_type} />
                      <div>
                        <p className="font-medium text-gray-900">{doc.title}</p>
                        <p className="text-xs text-gray-500">by {doc.uploaded_by}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{doc.asset_name}</p>
                      <p className="text-xs text-gray-500">{doc.asset_tag}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{doc.clinic_name}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs capitalize">
                      {doc.document_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{doc.uploaded_at}</td>
                  <td className="px-4 py-3 text-right text-sm text-gray-600">{doc.file_size}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button className="p-1 text-gray-400 hover:text-blue-600" title="Preview">
                        <Eye size={18} />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-green-600" title="Download">
                        <Download size={18} />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-red-600" title="Delete">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredDocs.length === 0 && (
          <div className="text-center py-12">
            <FileText size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No documents found</p>
          </div>
        )}

        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {filteredDocs.length} of {mockDocuments.length} documents
          </p>
        </div>
      </div>
    </div>
  );
};

export default DocumentsCenter;
