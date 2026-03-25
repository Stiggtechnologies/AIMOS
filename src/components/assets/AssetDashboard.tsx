import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Building2, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign, 
  Wrench,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Plus,
  MoreVertical,
  QrCode,
  Camera,
  FileText,
  TrendingDown,
  Activity,
  Shield,
  Calendar
} from 'lucide-react';

// Types
interface Asset {
  id: string;
  asset_tag: string;
  name: string;
  description: string;
  clinic_id: string;
  clinic_name?: string;
  category_id: string;
  category_name?: string;
  manufacturer: string;
  model: string;
  purchase_cost: number;
  replacement_cost: number;
  condition_score: number;
  criticality: string;
  risk_rating: string;
  status: string;
  room_location: string;
  in_service_date: string;
  expected_replacement_date?: string;
}

interface AssetSummary {
  totalAssets: number;
  totalReplacementValue: number;
  totalBookValue: number;
  avgConditionScore: number;
  assetsDueReplacement: number;
  overdueMaintenance: number;
  highRiskAssets: number;
}

// Mock data
const mockAssets: Asset[] = [
  {
    id: '1',
    asset_tag: 'AIM-EDM-001-T001',
    name: 'Treatment Table',
    description: 'Electric height-adjustable treatment table',
    clinic_id: 'clinic-1',
    clinic_name: 'AIM Edmonton',
    category_id: 'cat-1',
    category_name: 'Clinical Equipment',
    manufacturer: 'Physiomed',
    model: 'ProTable 3000',
    purchase_cost: 8500,
    replacement_cost: 12000,
    condition_score: 8.5,
    criticality: 'high',
    risk_rating: 'low',
    status: 'active',
    room_location: 'Treatment Room 1',
    in_service_date: '2024-02-01'
  },
  {
    id: '2',
    asset_tag: 'AIM-EDM-001-T002',
    name: 'Treatment Table',
    description: 'Standard treatment table',
    clinic_id: 'clinic-1',
    clinic_name: 'AIM Edmonton',
    category_id: 'cat-1',
    category_name: 'Clinical Equipment',
    manufacturer: 'Physiomed',
    model: 'ProTable 2000',
    purchase_cost: 4500,
    replacement_cost: 6000,
    condition_score: 7.0,
    criticality: 'high',
    risk_rating: 'medium',
    status: 'active',
    room_location: 'Treatment Room 2',
    in_service_date: '2024-02-01'
  },
  {
    id: '3',
    asset_tag: 'AIM-EDM-001-S001',
    name: 'Shockwave Therapy',
    description: 'Radial shockwave device',
    clinic_id: 'clinic-1',
    clinic_name: 'AIM Edmonton',
    category_id: 'cat-1',
    category_name: 'Clinical Equipment',
    manufacturer: 'Storz',
    model: 'D-Actor 200',
    purchase_cost: 15000,
    replacement_cost: 22000,
    condition_score: 9.0,
    criticality: 'medium',
    risk_rating: 'low',
    status: 'active',
    room_location: 'Treatment Room 3',
    in_service_date: '2024-03-15'
  },
  {
    id: '4',
    asset_tag: 'AIM-EDM-001-L001',
    name: 'Laptop',
    description: 'Dell Latitude for front desk',
    clinic_id: 'clinic-1',
    clinic_name: 'AIM Edmonton',
    category_id: 'cat-2',
    category_name: 'IT & Digital',
    manufacturer: 'Dell',
    model: 'Latitude 5540',
    purchase_cost: 1200,
    replacement_cost: 1500,
    condition_score: 7.5,
    criticality: 'medium',
    risk_rating: 'low',
    status: 'active',
    room_location: 'Reception',
    in_service_date: '2024-01-20'
  },
  {
    id: '5',
    asset_tag: 'AIM-YYC-001-T001',
    name: 'Treatment Table',
    description: 'Electric treatment table',
    clinic_id: 'clinic-2',
    clinic_name: 'Calgary South',
    category_id: 'cat-1',
    category_name: 'Clinical Equipment',
    manufacturer: 'Physiomed',
    model: 'ProTable 3000',
    purchase_cost: 8500,
    replacement_cost: 12000,
    condition_score: 9.0,
    criticality: 'high',
    risk_rating: 'low',
    status: 'active',
    room_location: 'Treatment Room 1',
    in_service_date: '2025-06-15'
  },
  {
    id: '6',
    asset_tag: 'AIM-RD-001-T001',
    name: 'Treatment Table',
    description: 'Manual treatment table',
    clinic_id: 'clinic-3',
    clinic_name: 'Red Deer',
    category_id: 'cat-1',
    category_name: 'Clinical Equipment',
    manufacturer: 'Physiomed',
    model: 'BasicTable',
    purchase_cost: 2500,
    replacement_cost: 3500,
    condition_score: 6.0,
    criticality: 'high',
    risk_rating: 'high',
    status: 'active',
    room_location: 'Treatment Room 1',
    in_service_date: '2025-10-01',
    expected_replacement_date: '2026-06-01'
  }
];

const mockSummary: AssetSummary = {
  totalAssets: 6,
  totalReplacementValue: 54500,
  totalBookValue: 38200,
  avgConditionScore: 7.8,
  assetsDueReplacement: 1,
  overdueMaintenance: 0,
  highRiskAssets: 1
};

// Components
const StatCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
}> = ({ title, value, subtitle, icon, color, trend }) => (
  <div className="bg-white rounded-lg shadow p-4 lg:p-5 border-l-4" style={{ borderLeftColor: color }}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl lg:text-3xl font-bold" style={{ color }}>{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
      <div className="text-2xl" style={{ color }}>{icon}</div>
    </div>
    {trend && (
      <div className={`flex items-center gap-1 mt-2 text-sm ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500'}`}>
        {trend === 'up' ? <TrendingUp size={16} /> : trend === 'down' ? <TrendingDown size={16} /> : null}
      </div>
    )}
  </div>
);

const ConditionBadge: React.FC<{ score: number }> = ({ score }) => {
  const getColor = () => {
    if (score >= 8) return 'bg-green-100 text-green-800';
    if (score >= 6) return 'bg-yellow-100 text-yellow-800';
    if (score >= 4) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getColor()}`}>
      {score}/10
    </span>
  );
};

const CriticalityBadge: React.FC<{ level: string }> = ({ level }) => {
  const styles: Record<string, string> = {
    'mission critical': 'bg-red-100 text-red-800',
    'high': 'bg-orange-100 text-orange-800',
    'medium': 'bg-blue-100 text-blue-800',
    'low': 'bg-gray-100 text-gray-800'
  };
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[level] || styles['low']}`}>
      {level.charAt(0).toUpperCase() + level.slice(1)}
    </span>
  );
};

const RiskBadge: React.FC<{ level: string }> = ({ level }) => {
  const styles: Record<string, string> = {
    'high': 'bg-red-100 text-red-700',
    'medium': 'bg-yellow-100 text-yellow-700',
    'low': 'bg-green-100 text-green-700'
  };
  
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${styles[level] || styles['low']}`}>
      {level.toUpperCase()}
    </span>
  );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    'active': 'bg-green-100 text-green-800',
    'in_repair': 'bg-yellow-100 text-yellow-800',
    'retired': 'bg-gray-100 text-gray-800',
    'spare': 'bg-blue-100 text-blue-800'
  };
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles['active']}`}>
      {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
    </span>
  );
};

// Asset Row Component
const AssetRow: React.FC<{ asset: Asset }> = ({ asset }) => (
  <tr className="hover:bg-gray-50 transition-colors">
    <td className="px-4 py-3">
      <div>
        <p className="font-mono text-sm font-medium text-gray-900">{asset.asset_tag}</p>
        <p className="text-xs text-gray-500">{asset.category_name}</p>
      </div>
    </td>
    <td className="px-4 py-3">
      <p className="font-medium text-gray-900">{asset.name}</p>
      <p className="text-xs text-gray-500">{asset.manufacturer} {asset.model}</p>
    </td>
    <td className="px-4 py-3">
      <p className="text-sm text-gray-900">{asset.clinic_name}</p>
      <p className="text-xs text-gray-500">{asset.room_location}</p>
    </td>
    <td className="px-4 py-3 text-right">
      <p className="text-sm font-medium text-gray-900">${asset.replacement_cost.toLocaleString()}</p>
      <p className="text-xs text-gray-500">Book: ${(asset.purchase_cost * 0.7).toLocaleString()}</p>
    </td>
    <td className="px-4 py-3 text-center">
      <ConditionBadge score={asset.condition_score} />
    </td>
    <td className="px-4 py-3 text-center">
      <CriticalityBadge level={asset.criticality} />
    </td>
    <td className="px-4 py-3 text-center">
      <RiskBadge level={asset.risk_rating} />
    </td>
    <td className="px-4 py-3 text-center">
      <StatusBadge status={asset.status} />
    </td>
    <td className="px-4 py-3 text-center">
      <button className="text-gray-400 hover:text-gray-600">
        <MoreVertical size={18} />
      </button>
    </td>
  </tr>
);

// Main Component
export const AssetDashboard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClinic, setFilterClinic] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredAssets = mockAssets.filter(asset => {
    if (searchTerm && !asset.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !asset.asset_tag.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filterClinic !== 'all' && asset.clinic_id !== filterClinic) return false;
    if (filterCategory !== 'all' && asset.category_id !== filterCategory) return false;
    if (filterStatus !== 'all' && asset.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="text-blue-600" />
              Asset Command Center
            </h1>
            <p className="mt-2 text-gray-600">Track, maintain, and optimize your clinic assets</p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">
              <QrCode size={18} />
              Scan QR
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus size={18} />
              Add Asset
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
        <StatCard 
          title="Total Assets" 
          value={mockSummary.totalAssets} 
          icon={<Package size={24} />}
          color="#3B82F6"
        />
        <StatCard 
          title="Replacement Value" 
          value={`$${(mockSummary.totalReplacementValue / 1000).toFixed(0)}K`}
          subtitle="Across all clinics"
          icon={<DollarSign size={24} />}
          color="#10B981"
        />
        <StatCard 
          title="Avg Condition" 
          value={mockSummary.avgConditionScore}
          subtitle="Out of 10"
          icon={<Activity size={24} />}
          color="#8B5CF6"
        />
        <StatCard 
          title="Due Replacement" 
          value={mockSummary.assetsDueReplacement}
          subtitle="Next 12 months"
          icon={<Calendar size={24} />}
          color="#F59E0B"
        />
        <StatCard 
          title="High Risk" 
          value={mockSummary.highRiskAssets}
          subtitle="Requires attention"
          icon={<AlertTriangle size={24} />}
          color="#EF4444"
        />
        <StatCard 
          title="Overdue PM" 
          value={mockSummary.overdueMaintenance}
          subtitle="Maintenance tasks"
          icon={<Wrench size={24} />}
          color="#EC4899"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <button className="flex items-center gap-3 p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-left">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <Building2 className="text-blue-600" size={20} />
          </div>
          <div>
            <p className="font-medium text-gray-900">Acquisitions</p>
            <p className="text-xs text-gray-500">Import new assets</p>
          </div>
        </button>
        <button className="flex items-center gap-3 p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-left">
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
            <Clock className="text-green-600" size={20} />
          </div>
          <div>
            <p className="font-medium text-gray-900">Inspections</p>
            <p className="text-xs text-gray-500">Condition checks</p>
          </div>
        </button>
        <button className="flex items-center gap-3 p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-left">
          <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
            <Wrench className="text-orange-600" size={20} />
          </div>
          <div>
            <p className="font-medium text-gray-900">Work Orders</p>
            <p className="text-xs text-gray-500">Maintenance tasks</p>
          </div>
        </button>
        <button className="flex items-center gap-3 p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-left">
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
            <Shield className="text-purple-600" size={20} />
          </div>
          <div>
            <p className="font-medium text-gray-900">AI Insights</p>
            <p className="text-xs text-gray-500">Smart recommendations</p>
          </div>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-4 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-500" />
            <select
              value={filterClinic}
              onChange={(e) => setFilterClinic(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Clinics</option>
              <option value="clinic-1">AIM Edmonton</option>
              <option value="clinic-2">Calgary South</option>
              <option value="clinic-3">Red Deer</option>
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="cat-1">Clinical Equipment</option>
              <option value="cat-2">IT & Digital</option>
              <option value="cat-3">Furniture</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="in_repair">In Repair</option>
              <option value="retired">Retired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Asset Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Value</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Condition</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Criticality</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Risk</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAssets.map(asset => (
                <AssetRow key={asset.id} asset={asset} />
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredAssets.length === 0 && (
          <div className="text-center py-12">
            <Package size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No assets found</p>
          </div>
        )}

        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {filteredAssets.length} of {mockAssets.length} assets
          </p>
          <div className="flex gap-2">
            <button className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900">Export</button>
            <button className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900">Print</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetDashboard;
