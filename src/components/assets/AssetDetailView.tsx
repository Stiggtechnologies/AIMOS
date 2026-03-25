import React, { useState } from 'react';
import { 
  Package, 
  Building2, 
  Wrench, 
  FileText, 
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Edit,
  Trash2,
  Download,
  Camera,
  ChevronLeft,
  ChevronRight,
  History,
  BarChart3,
  MapPin,
  User,
  Shield
} from 'lucide-react';

// Types
interface AssetDetail {
  id: string;
  asset_tag: string;
  name: string;
  description: string;
  clinic_id: string;
  clinic_name: string;
  category_name: string;
  manufacturer: string;
  model: string;
  serial_number: string;
  supplier: string;
  purchase_date: string;
  in_service_date: string;
  purchase_cost: number;
  installation_cost: number;
  book_value: number;
  replacement_cost: number;
  estimated_market_value: number;
  useful_life_months: number;
  expected_replacement_date: string;
  warranty_expiry_date: string;
  condition_score: number;
  condition_notes: string;
  criticality: string;
  risk_rating: string;
  status: string;
  room_location: string;
  ownership_type: string;
}

interface MaintenanceRecord {
  id: string;
  date: string;
  type: string;
  description: string;
  cost: number;
  vendor: string;
  status: string;
}

interface ConditionHistory {
  id: string;
  date: string;
  score: number;
  notes: string;
  assessed_by: string;
}

// Mock data
const mockAsset: AssetDetail = {
  id: '1',
  asset_tag: 'AIM-EDM-001-T001',
  name: 'Treatment Table',
  description: 'Electric height-adjustable treatment table with adjustable backrest and leg section',
  clinic_id: 'clinic-1',
  clinic_name: 'AIM Edmonton',
  category_name: 'Clinical Equipment',
  manufacturer: 'Physiomed',
  model: 'ProTable 3000',
  serial_number: 'PM-PRO3-2024-001234',
  supplier: 'Physiomed Canada',
  purchase_date: '2024-01-15',
  in_service_date: '2024-02-01',
  purchase_cost: 8500,
  installation_cost: 500,
  book_value: 6800,
  replacement_cost: 12000,
  estimated_market_value: 7500,
  useful_life_months: 84,
  expected_replacement_date: '2031-02-01',
  warranty_expiry_date: '2026-02-01',
  condition_score: 8.5,
  condition_notes: 'Excellent condition. Minor cosmetic wear on surface.',
  criticality: 'high',
  risk_rating: 'low',
  status: 'active',
  room_location: 'Treatment Room 1',
  ownership_type: 'owned'
};

const mockMaintenanceHistory: MaintenanceRecord[] = [
  {
    id: '1',
    date: '2024-06-15',
    type: 'Preventive',
    description: 'Annual service and calibration',
    cost: 350,
    vendor: 'Physiomed Service',
    status: 'completed'
  },
  {
    id: '2',
    date: '2024-12-20',
    type: 'Corrective',
    description: 'Motor replacement for height adjustment',
    cost: 450,
    vendor: 'Physiomed Service',
    status: 'completed'
  },
  {
    id: '3',
    date: '2025-06-10',
    type: 'Preventive',
    description: 'Semi-annual maintenance',
    cost: 300,
    vendor: 'Physiomed Service',
    status: 'completed'
  }
];

const mockConditionHistory: ConditionHistory[] = [
  { id: '1', date: '2024-02-01', score: 10.0, notes: 'New asset - pristine condition', assessed_by: 'System' },
  { id: '2', date: '2024-06-15', score: 9.5, notes: 'Excellent condition after first service', assessed_by: 'Technician' },
  { id: '3', date: '2024-12-20', score: 8.5, notes: 'Good condition, motor replaced', assessed_by: 'Technician' },
  { id: '4', date: '2025-06-10', score: 8.5, notes: 'Maintained well', assessed_by: 'Technician' }
];

// Tab components
const InfoTab: React.FC<{ asset: AssetDetail }> = ({ asset }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900 border-b pb-2">Basic Information</h3>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Asset Tag</p>
          <p className="font-medium font-mono">{asset.asset_tag}</p>
        </div>
        <div>
          <p className="text-gray-500">Category</p>
          <p className="font-medium">{asset.category_name}</p>
        </div>
        <div>
          <p className="text-gray-500">Manufacturer</p>
          <p className="font-medium">{asset.manufacturer}</p>
        </div>
        <div>
          <p className="text-gray-500">Model</p>
          <p className="font-medium">{asset.model}</p>
        </div>
        <div>
          <p className="text-gray-500">Serial Number</p>
          <p className="font-medium font-mono">{asset.serial_number}</p>
        </div>
        <div>
          <p className="text-gray-500">Supplier</p>
          <p className="font-medium">{asset.supplier}</p>
        </div>
      </div>
    </div>
    
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900 border-b pb-2">Location & Assignment</h3>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Clinic</p>
          <p className="font-medium flex items-center gap-2">
            <Building2 size={16} className="text-blue-500" />
            {asset.clinic_name}
          </p>
        </div>
        <div>
          <p className="text-gray-500">Room</p>
          <p className="font-medium flex items-center gap-2">
            <MapPin size={16} className="text-gray-400" />
            {asset.room_location}
          </p>
        </div>
        <div>
          <p className="text-gray-500">Ownership</p>
          <p className="font-medium">{asset.ownership_type}</p>
        </div>
        <div>
          <p className="text-gray-500">Status</p>
          <span className="inline-flex px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
            {asset.status}
          </span>
        </div>
      </div>
    </div>
    
    <div className="space-y-4 lg:col-span-2">
      <h3 className="font-semibold text-gray-900 border-b pb-2">Description</h3>
      <p className="text-sm text-gray-600">{asset.description}</p>
    </div>
  </div>
);

const FinancialTab: React.FC<{ asset: AssetDetail }> = ({ asset }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-blue-50 rounded-lg p-4 text-center">
        <DollarSign className="mx-auto text-blue-600 mb-2" size={24} />
        <p className="text-xs text-blue-600 uppercase">Purchase Cost</p>
        <p className="text-xl font-bold text-blue-900">${asset.purchase_cost.toLocaleString()}</p>
      </div>
      <div className="bg-green-50 rounded-lg p-4 text-center">
        <DollarSign className="mx-auto text-green-600 mb-2" size={24} />
        <p className="text-xs text-green-600 uppercase">Current Book Value</p>
        <p className="text-xl font-bold text-green-900">${asset.book_value.toLocaleString()}</p>
      </div>
      <div className="bg-orange-50 rounded-lg p-4 text-center">
        <DollarSign className="mx-auto text-orange-600 mb-2" size={24} />
        <p className="text-xs text-orange-600 uppercase">Replacement Cost</p>
        <p className="text-xl font-bold text-orange-900">${asset.replacement_cost.toLocaleString()}</p>
      </div>
      <div className="bg-purple-50 rounded-lg p-4 text-center">
        <DollarSign className="mx-auto text-purple-600 mb-2" size={24} />
        <p className="text-xs text-purple-600 uppercase">Market Value</p>
        <p className="text-xl font-bold text-purple-900">${asset.estimated_market_value.toLocaleString()}</p>
      </div>
    </div>
    
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900 border-b pb-2">Financial Details</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Purchase Date</p>
            <p className="font-medium">{asset.purchase_date}</p>
          </div>
          <div>
            <p className="text-gray-500">In Service Date</p>
            <p className="font-medium">{asset.in_service_date}</p>
          </div>
          <div>
            <p className="text-gray-500">Installation Cost</p>
            <p className="font-medium">${asset.installation_cost.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-500">Useful Life</p>
            <p className="font-medium">{asset.useful_life_months} months</p>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900 border-b pb-2">Replacement Planning</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Expected Replacement</p>
            <p className="font-medium text-orange-600">{asset.expected_replacement_date}</p>
          </div>
          <div>
            <p className="text-gray-500">Warranty Expires</p>
            <p className="font-medium">{asset.warranty_expiry_date}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const ConditionTab: React.FC<{ asset: AssetDetail; history: ConditionHistory[] }> = ({ asset, history }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-gray-500">Current Condition</p>
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            asset.condition_score >= 8 ? 'bg-green-100 text-green-800' :
            asset.condition_score >= 6 ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {asset.condition_score}/10
          </span>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full ${asset.condition_score >= 8 ? 'bg-green-500' : asset.condition_score >= 6 ? 'bg-yellow-500' : 'bg-red-500'}`}
            style={{ width: `${asset.condition_score * 10}%` }}
          />
        </div>
      </div>
      
      <div className="bg-white rounded-lg border p-4">
        <p className="text-sm text-gray-500 mb-2">Criticality</p>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          asset.criticality === 'high' ? 'bg-orange-100 text-orange-800' :
          asset.criticality === 'medium' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {asset.criticality.charAt(0).toUpperCase() + asset.criticality.slice(1)}
        </span>
      </div>
      
      <div className="bg-white rounded-lg border p-4">
        <p className="text-sm text-gray-500 mb-2">Risk Rating</p>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          asset.risk_rating === 'high' ? 'bg-red-100 text-red-800' :
          asset.risk_rating === 'medium' ? 'bg-yellow-100 text-yellow-800' :
          'bg-green-100 text-green-800'
        }`}>
          {asset.risk_rating.toUpperCase()}
        </span>
      </div>
    </div>
    
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900 border-b pb-2">Condition History</h3>
      <div className="space-y-3">
        {history.map((record, idx) => (
          <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-bold">{record.score}</span>
              </div>
              <div>
                <p className="text-sm font-medium">{record.date}</p>
                <p className="text-xs text-gray-500">{record.notes}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">by {record.assessed_by}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const MaintenanceTab: React.FC<{ records: MaintenanceRecord[] }> = ({ records }) => (
  <div className="space-y-4">
    <div className="flex justify-between items-center">
      <h3 className="font-semibold text-gray-900">Maintenance History</h3>
      <button className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
        <Wrench size={16} />
        New Work Order
      </button>
    </div>
    
    <div className="space-y-3">
      {records.map((record) => (
        <div key={record.id} className="bg-white border rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  record.type === 'Preventive' ? 'bg-green-100 text-green-800' :
                  record.type === 'Corrective' ? 'bg-orange-100 text-orange-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {record.type}
                </span>
                <span className="text-sm text-gray-500">{record.date}</span>
              </div>
              <p className="font-medium text-gray-900">{record.description}</p>
              <p className="text-sm text-gray-500">Vendor: {record.vendor}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-900">${record.cost.toLocaleString()}</p>
              <span className="text-xs text-green-600 flex items-center justify-end gap-1">
                <CheckCircle size={12} />
                Completed
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
    
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex justify-between text-sm">
        <span className="text-gray-500">Total Maintenance Cost (YTD)</span>
        <span className="font-bold text-gray-900">${records.reduce((sum, r) => sum + r.cost, 0).toLocaleString()}</span>
      </div>
    </div>
  </div>
);

// Main Component
export const AssetDetailView: React.FC = () => {
  const [activeTab, setActiveTab] = useState('info');
  
  const tabs = [
    { id: 'info', label: 'Information', icon: Package },
    { id: 'financial', label: 'Financial', icon: DollarSign },
    { id: 'condition', label: 'Condition', icon: BarChart3 },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
    { id: 'documents', label: 'Documents', icon: FileText }
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <Building2 size={16} />
              <span>{mockAsset.clinic_name}</span>
              <ChevronRight size={16} />
              <span>Assets</span>
              <ChevronRight size={16} />
              <span className="text-gray-900">{mockAsset.asset_tag}</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Package className="text-blue-600" />
              {mockAsset.name}
            </h1>
            <p className="mt-1 text-gray-600">{mockAsset.manufacturer} {mockAsset.model}</p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">
              <Camera size={18} />
              Add Photo
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">
              <Edit size={18} />
              Edit
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Download size={18} />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {mockAsset.risk_rating === 'high' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="text-red-600 mt-0.5" size={20} />
          <div>
            <p className="font-medium text-red-900">High Risk Asset</p>
            <p className="text-sm text-red-700">This asset requires attention. Review condition and maintenance history.</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-4">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'info' && <InfoTab asset={mockAsset} />}
          {activeTab === 'financial' && <FinancialTab asset={mockAsset} />}
          {activeTab === 'condition' && <ConditionTab asset={mockAsset} history={mockConditionHistory} />}
          {activeTab === 'maintenance' && <MaintenanceTab records={mockMaintenanceHistory} />}
          {activeTab === 'documents' && (
            <div className="text-center py-12">
              <FileText size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No documents uploaded yet</p>
              <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Upload Document
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssetDetailView;
