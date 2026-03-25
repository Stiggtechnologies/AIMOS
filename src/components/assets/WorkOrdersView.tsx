import React, { useState } from 'react';
import { 
  Wrench, 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  User,
  DollarSign,
  Calendar,
  Building2,
  Package,
  MoreVertical,
  Play,
  Pause,
  XCircle,
  FileText,
  ChevronRight
} from 'lucide-react';

// Types
interface WorkOrder {
  id: string;
  work_order_number: string;
  asset_id: string;
  asset_name: string;
  asset_tag: string;
  clinic_id: string;
  clinic_name: string;
  type: 'preventive' | 'corrective' | 'emergency';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  issue_description: string;
  requested_date: string;
  scheduled_date: string;
  completed_date: string | null;
  assigned_to: string;
  vendor_name: string;
  labor_cost: number;
  parts_cost: number;
  total_cost: number;
  downtime_hours: number;
}

interface WorkOrderStats {
  open: number;
  inProgress: number;
  overdue: number;
  completedThisMonth: number;
  totalCostThisMonth: number;
}

// Mock data
const mockWorkOrders: WorkOrder[] = [
  {
    id: '1',
    work_order_number: 'WO-2026-001',
    asset_id: '1',
    asset_name: 'Treatment Table',
    asset_tag: 'AIM-EDM-001-T001',
    clinic_id: 'clinic-1',
    clinic_name: 'AIM Edmonton',
    type: 'preventive',
    priority: 'medium',
    status: 'completed',
    issue_description: 'Annual service and calibration',
    requested_date: '2026-03-15',
    scheduled_date: '2026-03-20',
    completed_date: '2026-03-20',
    assigned_to: 'Mike Technician',
    vendor_name: 'Physiomed Service',
    labor_cost: 250,
    parts_cost: 100,
    total_cost: 350,
    downtime_hours: 0,
  },
  {
    id: '2',
    work_order_number: 'WO-2026-002',
    asset_id: '2',
    asset_name: 'Shockwave Therapy',
    asset_tag: 'AIM-EDM-001-S001',
    clinic_id: 'clinic-1',
    clinic_name: 'AIM Edmonton',
    type: 'corrective',
    priority: 'high',
    status: 'in_progress',
    issue_description: 'Handpiece not firing properly',
    requested_date: '2026-03-22',
    scheduled_date: '2026-03-25',
    completed_date: null,
    assigned_to: 'Mike Technician',
    vendor_name: 'Storz Service',
    labor_cost: 0,
    parts_cost: 0,
    total_cost: 0,
    downtime_hours: 0,
  },
  {
    id: '3',
    work_order_number: 'WO-2026-003',
    asset_id: '6',
    asset_name: 'Treatment Table',
    asset_tag: 'AIM-RD-001-T001',
    clinic_id: 'clinic-3',
    clinic_name: 'Red Deer',
    type: 'emergency',
    priority: 'critical',
    status: 'open',
    issue_description: 'Table motor failed completely - cannot adjust height',
    requested_date: '2026-03-24',
    scheduled_date: null,
    completed_date: null,
    assigned_to: null,
    vendor_name: null,
    labor_cost: 0,
    parts_cost: 0,
    total_cost: 0,
    downtime_hours: 0,
  },
  {
    id: '4',
    work_order_number: 'WO-2026-004',
    asset_id: '4',
    asset_name: 'Laptop',
    asset_tag: 'AIM-EDM-001-L001',
    clinic_id: 'clinic-1',
    clinic_name: 'AIM Edmonton',
    type: 'corrective',
    priority: 'low',
    status: 'open',
    issue_description: 'Battery not holding charge',
    requested_date: '2026-03-23',
    scheduled_date: '2026-03-28',
    completed_date: null,
    assigned_to: 'IT Support',
    vendor_name: null,
    labor_cost: 0,
    parts_cost: 0,
    total_cost: 0,
    downtime_hours: 0,
  },
  {
    id: '5',
    work_order_number: 'WO-2026-005',
    asset_id: '5',
    asset_name: 'Reception Chair',
    asset_tag: 'AIM-EDM-001-C001',
    clinic_id: 'clinic-1',
    clinic_name: 'AIM Edmonton',
    type: 'preventive',
    priority: 'low',
    status: 'completed',
    issue_description: 'Scheduled cleaning and inspection',
    requested_date: '2026-03-10',
    scheduled_date: '2026-03-15',
    completed_date: '2026-03-15',
    assigned_to: 'Cleaning Team',
    vendor_name: 'Internal',
    labor_cost: 50,
    parts_cost: 0,
    total_cost: 50,
    downtime_hours: 0,
  }
];

const mockStats: WorkOrderStats = {
  open: 2,
  inProgress: 1,
  overdue: 0,
  completedThisMonth: 2,
  totalCostThisMonth: 400
};

// Components
const StatCard: React.FC<{
  title: string;
  value: number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, subtitle, icon, color }) => (
  <div className="bg-white rounded-lg shadow p-4 border-l-4" style={{ borderLeftColor: color }}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold" style={{ color }}>{value}</p>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </div>
      <div className="text-2xl" style={{ color }}>{icon}</div>
    </div>
  </div>
);

const TypeBadge: React.FC<{ type: string }> = ({ type }) => {
  const styles: Record<string, string> = {
    'preventive': 'bg-green-100 text-green-800',
    'corrective': 'bg-orange-100 text-orange-800',
    'emergency': 'bg-red-100 text-red-800'
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[type] || 'bg-gray-100'}`}>
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </span>
  );
};

const PriorityBadge: React.FC<{ priority: string }> = ({ priority }) => {
  const styles: Record<string, string> = {
    'low': 'bg-gray-100 text-gray-700',
    'medium': 'bg-blue-100 text-blue-800',
    'high': 'bg-orange-100 text-orange-800',
    'critical': 'bg-red-100 text-red-800'
  };
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${styles[priority] || 'bg-gray-100'}`}>
      {priority.toUpperCase()}
    </span>
  );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    'open': 'bg-gray-100 text-gray-800',
    'in_progress': 'bg-blue-100 text-blue-800',
    'completed': 'bg-green-100 text-green-800',
    'cancelled': 'bg-red-100 text-red-800'
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100'}`}>
      {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
    </span>
  );
};

// Main Component
export const WorkOrdersView: React.FC = () => {
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOrders = mockWorkOrders.filter(wo => {
    if (filterStatus !== 'all' && wo.status !== filterStatus) return false;
    if (filterType !== 'all' && wo.type !== filterType) return false;
    if (filterPriority !== 'all' && wo.priority !== filterPriority) return false;
    if (searchTerm && !wo.asset_name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !wo.work_order_number.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Wrench className="text-orange-600" />
              Work Orders
            </h1>
            <p className="mt-2 text-gray-600">Manage maintenance activity across clinics</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
            <Plus size={18} />
            Create Work Order
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard 
          title="Open" 
          value={mockStats.open} 
          icon={<Clock size={24} />}
          color="#6B7280"
        />
        <StatCard 
          title="In Progress" 
          value={mockStats.inProgress} 
          icon={<Play size={24} />}
          color="#3B82F6"
        />
        <StatCard 
          title="Overdue" 
          value={mockStats.overdue} 
          icon={<AlertTriangle size={24} />}
          color="#EF4444"
        />
        <StatCard 
          title="Completed This Month" 
          value={mockStats.completedThisMonth} 
          icon={<CheckCircle size={24} />}
          color="#10B981"
        />
        <StatCard 
          title="Cost This Month" 
          value={mockStats.totalCostThisMonth}
          subtitle="CAD"
          icon={<DollarSign size={24} />}
          color="#8B5CF6"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-4 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search work orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">All Types</option>
              <option value="preventive">Preventive</option>
              <option value="corrective">Corrective</option>
              <option value="emergency">Emergency</option>
            </select>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Work Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">WO #</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clinic</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Priority</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned To</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cost</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredOrders.map(wo => (
                <tr key={wo.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm font-medium text-gray-900">{wo.work_order_number}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{wo.asset_name}</p>
                      <p className="text-xs text-gray-500">{wo.asset_tag}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-900">{wo.clinic_name}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <TypeBadge type={wo.type} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <PriorityBadge priority={wo.priority} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={wo.status} />
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-900">{wo.assigned_to || '-'}</p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {wo.total_cost > 0 ? `$${wo.total_cost.toLocaleString()}` : '-'}
                    </p>
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
        
        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <Wrench size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No work orders found</p>
          </div>
        )}

        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {filteredOrders.length} of {mockWorkOrders.length} work orders
          </p>
        </div>
      </div>
    </div>
  );
};

export default WorkOrdersView;
