import React, { useState } from 'react';
import { 
  Building2, 
  Plus, 
  Upload, 
  Download, 
  FileSpreadsheet,
  CheckCircle, 
  Clock, 
  AlertTriangle,
  ChevronRight,
  Users,
  Calendar,
  DollarSign,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  QrCode
} from 'lucide-react';

// Types
interface AcquisitionBatch {
  id: string;
  clinic_name: string;
  seller_name: string;
  deal_name: string;
  closing_date: string;
  total_assets: number;
  completed_fields: number;
  high_risk_assets: number;
  status: 'draft' | 'in_progress' | 'approved';
}

interface IntakeAsset {
  id: string;
  name: string;
  category: string;
  serial_number: string;
  included_in_deal: boolean;
  condition_score: number;
  replacement_cost: number;
  missing_fields: string[];
  validated: boolean;
}

// Mock data
const mockBatches: AcquisitionBatch[] = [
  {
    id: '1',
    clinic_name: 'Mountain View Physio',
    seller_name: 'Dr. James Anderson',
    deal_name: 'Mountain View Acquisition',
    closing_date: '2026-04-01',
    total_assets: 45,
    completed_fields: 32,
    high_risk_assets: 3,
    status: 'in_progress'
  },
  {
    id: '2',
    clinic_name: 'Wellness Center Calgary',
    seller_name: 'Dr. Sarah Miller',
    deal_name: 'Wellness Center Deal',
    closing_date: '2026-03-15',
    total_assets: 62,
    completed_fields: 62,
    high_risk_assets: 5,
    status: 'approved'
  }
];

const mockIntakeAssets: IntakeAsset[] = [
  {
    id: '1',
    name: 'Electric Treatment Table',
    category: 'Clinical Equipment',
    serial_number: 'PM-PRO3-2024-001',
    included_in_deal: true,
    condition_score: 7.5,
    replacement_cost: 12000,
    missing_fields: [],
    validated: true
  },
  {
    id: '2',
    name: 'Shockwave Unit',
    category: 'Clinical Equipment',
    serial_number: '',
    included_in_deal: true,
    condition_score: 6.0,
    replacement_cost: 22000,
    missing_fields: ['serial_number', 'warranty'],
    validated: false
  },
  {
    id: '3',
    name: 'Dell Laptop',
    category: 'IT Equipment',
    serial_number: 'DL-5540-2024-1234',
    included_in_deal: true,
    condition_score: 8.0,
    replacement_cost: 1500,
    missing_fields: [],
    validated: true
  },
  {
    id: '4',
    name: 'Reception Desk',
    category: 'Furniture',
    serial_number: 'N/A',
    included_in_deal: false,
    condition_score: 5.0,
    replacement_cost: 8000,
    missing_fields: ['purchase_date', 'serial_number'],
    validated: false
  }
];

// Components
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    'draft': 'bg-gray-100 text-gray-800',
    'in_progress': 'bg-blue-100 text-blue-800',
    'approved': 'bg-green-100 text-green-800'
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100'}`}>
      {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
    </span>
  );
};

const ProgressBar: React.FC<{ current: number; total: number }> = ({ current, total }) => {
  const percent = Math.round((current / total) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-green-500 transition-all" style={{ width: `${percent}%` }} />
      </div>
      <span className="text-sm text-gray-600">{percent}%</span>
    </div>
  );
};

// Main Component
export const AcquisitionIntakeView: React.FC = () => {
  const [selectedBatch, setSelectedBatch] = useState<AcquisitionBatch | null>(null);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="text-indigo-600" />
              Acquisition Intake Center
            </h1>
            <p className="mt-2 text-gray-600">Create Day 0 asset baseline for newly acquired clinics</p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">
              <FileSpreadsheet size={18} />
              Bulk Import
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
              <Plus size={18} />
              New Intake
            </button>
          </div>
        </div>
      </div>

      {/* Active Batch Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {mockBatches.map(batch => (
          <div 
            key={batch.id} 
            className={`bg-white rounded-lg shadow p-5 cursor-pointer hover:shadow-md transition-shadow ${
              selectedBatch?.id === batch.id ? 'ring-2 ring-indigo-500' : ''
            }`}
            onClick={() => setSelectedBatch(batch)}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">{batch.clinic_name}</h3>
                <p className="text-sm text-gray-500">{batch.deal_name}</p>
              </div>
              <StatusBadge status={batch.status} />
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-600">{batch.total_assets}</p>
                <p className="text-xs text-gray-500">Total Assets</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{batch.high_risk_assets}</p>
                <p className="text-xs text-gray-500">High Risk</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{Math.round((batch.completed_fields/batch.total_assets)*100)}%</p>
                <p className="text-xs text-gray-500">Complete</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700">{batch.closing_date}</p>
                <p className="text-xs text-gray-500">Closing Date</p>
              </div>
            </div>
            
            <ProgressBar current={batch.completed_fields} total={batch.total_assets} />
            
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Users size={16} />
                <span>Seller: {batch.seller_name}</span>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </div>
          </div>
        ))}
      </div>

      {/* Intake Workflow */}
      <div className="bg-white rounded-lg shadow mb-6 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Intake Workflow</h2>
        <div className="flex items-center justify-between">
          {['Batch Created', 'Assets Imported', 'Walkthrough', 'Condition', 'Documents', 'Risks Review', 'Approved'].map((step, idx) => (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  idx < 2 ? 'bg-green-500 text-white' : idx === 2 ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {idx < 2 ? <CheckCircle size={20} /> : <span className="font-medium">{idx + 1}</span>}
                </div>
                <p className="text-xs mt-2 text-center max-w-[80px]">{step}</p>
              </div>
              {idx < 6 && (
                <div className={`flex-1 h-1 ${idx < 1 ? 'bg-green-500' : 'bg-gray-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Imported Assets Grid */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">
            {selectedBatch ? `${selectedBatch.clinic_name} - Imported Assets` : 'Select a batch to view assets'}
          </h2>
          {selectedBatch && (
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                <QrCode size={16} />
                Generate QR Tags
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                <Download size={16} />
                Export
              </button>
            </div>
          )}
        </div>
        
        {selectedBatch ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Serial #</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">In Deal</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Condition</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Replacement</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Missing</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {mockIntakeAssets.map(asset => (
                  <tr key={asset.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{asset.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{asset.category}</td>
                    <td className="px-4 py-3 font-mono text-sm text-gray-600">{asset.serial_number || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      {asset.included_in_deal ? (
                        <span className="text-green-600">✓ Yes</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-sm ${
                        asset.condition_score >= 7 ? 'bg-green-100 text-green-800' :
                        asset.condition_score >= 5 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {asset.condition_score}/10
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">${asset.replacement_cost.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      {asset.missing_fields.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {asset.missing_fields.map(f => (
                            <span key={f} className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-xs">
                              {f.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-green-600 text-sm">Complete</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {asset.validated ? (
                        <CheckCircle size={20} className="text-green-500 mx-auto" />
                      ) : (
                        <AlertTriangle size={20} className="text-orange-500 mx-auto" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Building2 size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">Select an acquisition batch to view imported assets</p>
          </div>
        )}

        {selectedBatch && (
          <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{mockIntakeAssets.filter(a => a.validated).length}</span> validated / <span className="font-medium">{mockIntakeAssets.length}</span> total
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                Save Progress
              </button>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                Approve Intake
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AcquisitionIntakeView;
