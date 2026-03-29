import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, ChevronDown, ChevronUp, ExternalLink, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useAuth } from '@/auth';

// ─── MOCK DATA (Replace with live Supabase query when assets table is migrated) ───
const MOCK_ASSETS = [
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    name: 'Hydraulic Treatment Table #1',
    asset_id: 'AIM-HTT-001',
    category: 'Treatment Equipment',
    status: 'operational',
    condition: 'good',
    criticality: 'high',
    location: 'Clinic A - Room 3',
    manufacturer: 'Chattanooga',
    model: 'Intelliflex 3000',
    serial_number: 'CHF-2024-0042',
    purchase_date: '2022-03-15',
    warranty_expiry: '2025-03-15',
    replacement_date: '2028-03-15',
    replacement_cost: 45000,
    next_pm_date: '2026-04-15',
    assigned_staff: '2 active',
    utilization: 87,
  },
  {
    id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    name: 'Ultrasound Therapy Unit',
    asset_id: 'AIM-US-002',
    category: 'Diagnostic Equipment',
    status: 'operational',
    condition: 'good',
    criticality: 'high',
    location: 'Clinic A - Room 5',
    manufacturer: 'Therasonic',
    model: 'ProSound 500',
    serial_number: 'TSM-2023-0156',
    purchase_date: '2023-06-20',
    warranty_expiry: '2026-06-20',
    replacement_date: '2029-06-20',
    replacement_cost: 32000,
    next_pm_date: '2026-05-20',
    assigned_staff: '1 active',
    utilization: 72,
  },
  {
    id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
    name: 'Treadmill - Assessment',
    asset_id: 'AIM-TM-003',
    category: 'Assessment Equipment',
    status: 'maintenance',
    condition: 'fair',
    criticality: 'medium',
    location: 'Clinic B - Gym',
    manufacturer: 'Woodway',
    model: 'Steam 1500',
    serial_number: 'WCY-2021-0089',
    purchase_date: '2021-09-10',
    warranty_expiry: '2024-09-10',
    replacement_date: '2027-09-10',
    replacement_cost: 55000,
    next_pm_date: null,
    assigned_staff: '0 idle',
    utilization: 45,
  },
  {
    id: 'd4e5f6a7-b8c9-0123-def0-234567890123',
    name: 'TENS Unit Fleet (10)',
    asset_id: 'AIM-TN-004',
    category: 'Treatment Equipment',
    status: 'operational',
    condition: 'good',
    criticality: 'low',
    location: 'All Clinics',
    manufacturer: 'Empi',
    model: 'Focus 6000',
    serial_number: 'EMP-Fleet-10',
    purchase_date: '2023-01-05',
    warranty_expiry: '2026-01-05',
    replacement_date: '2028-01-05',
    replacement_cost: 15000,
    next_pm_date: '2026-04-30',
    assigned_staff: 'Multiple',
    utilization: 91,
  },
  {
    id: 'e5f6a7b8-c9d0-1234-ef01-345678901234',
    name: 'Chiropractic Adjustment Table',
    asset_id: 'AIM-CA-005',
    category: 'Treatment Equipment',
    status: 'operational',
    condition: 'excellent',
    criticality: 'high',
    location: 'Clinic C - Room 2',
    manufacturer: 'Leone',
    model: 'Prestige 500',
    serial_number: 'LNO-2024-0023',
    purchase_date: '2024-02-28',
    warranty_expiry: '2027-02-28',
    replacement_date: '2032-02-28',
    replacement_cost: 28000,
    next_pm_date: '2026-08-28',
    assigned_staff: '1 active',
    utilization: 68,
  },
  {
    id: 'f6a7b8c9-d0e1-2345-f012-456789012345',
    name: 'Ice Machine - Large',
    asset_id: 'AIM-IM-006',
    category: 'Support Equipment',
    status: 'decommissioned',
    condition: 'poor',
    criticality: 'low',
    location: 'Clinic A - Storage',
    manufacturer: ' Scotsman',
    model: 'Pro Series 1000',
    serial_number: 'SCN-2018-0012',
    purchase_date: '2018-07-15',
    warranty_expiry: '2021-07-15',
    replacement_date: '2025-07-15',
    replacement_cost: 8500,
    next_pm_date: null,
    assigned_staff: '0 retired',
    utilization: 0,
  },
];

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const styles = {
    operational: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    maintenance: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    decommissioned: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    surplus: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles] || styles.operational}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// Condition badge
function ConditionBadge({ condition }: { condition: string }) {
  const styles = {
    excellent: 'bg-emerald-500/20 text-emerald-400',
    good: 'bg-blue-500/20 text-blue-400',
    fair: 'bg-amber-500/20 text-amber-400',
    poor: 'bg-red-500/20 text-red-400',
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[condition as keyof typeof styles] || styles.good}`}>
      {condition.charAt(0).toUpperCase() + condition.slice(1)}
    </span>
  );
}

// Criticality badge
function CriticalityBadge({ criticality }: { criticality: string }) {
  const styles = {
    high: 'bg-red-500/20 text-red-400 border-red-500/30',
    medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    low: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  };
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium border ${styles[criticality as keyof typeof styles] || styles.low}`}>
      {criticality.charAt(0).toUpperCase() + criticality.slice(1)}
    </span>
  );
}

export default function AssetRegisterView() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    condition: 'all',
    criticality: 'all',
    category: 'all',
  });
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);

  // Unique categories for filter
  const categories = useMemo(() => {
    const cats = new Set(MOCK_ASSETS.map(a => a.category));
    return ['all', ...Array.from(cats)];
  }, []);

  // Filter and sort
  const filteredAssets = useMemo(() => {
    return MOCK_ASSETS.filter(asset => {
      const matchesSearch = search === '' || 
        asset.name.toLowerCase().includes(search.toLowerCase()) ||
        asset.asset_id.toLowerCase().includes(search.toLowerCase()) ||
        asset.location.toLowerCase().includes(search.toLowerCase()) ||
        asset.manufacturer.toLowerCase().includes(search.toLowerCase());
      
      const matchesStatus = filters.status === 'all' || asset.status === filters.status;
      const matchesCondition = filters.condition === 'all' || asset.condition === filters.condition;
      const matchesCriticality = filters.criticality === 'all' || asset.criticality === filters.criticality;
      const matchesCategory = filters.category === 'all' || asset.category === filters.category;
      
      return matchesSearch && matchesStatus && matchesCondition && matchesCriticality && matchesCategory;
    }).sort((a, b) => {
      const aVal = a[sortField as keyof typeof a] as string;
      const bVal = b[sortField as keyof typeof b] as string;
      const direction = sortDirection === 'asc' ? 1 : -1;
      return aVal.localeCompare(bVal) * direction;
    });
  }, [search, filters, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  return (
    <div className="h-full flex flex-col bg-slate-950">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-slate-800 bg-slate-900/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white">Asset Register</h1>
            <p className="text-sm text-slate-400 mt-1">
              Enterprise view of all physical assets • Data: <span className="text-amber-400">⚠️ Mock/Sample (assets table not migrated)</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm text-slate-400">Total Assets</p>
              <p className="text-2xl font-semibold text-white">{MOCK_ASSETS.length}</p>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="mt-4 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search assets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              showFilters ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>

          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span>Showing {filteredAssets.length} of {MOCK_ASSETS.length}</span>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="operational">Operational</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="decommissioned">Decommissioned</option>
                  <option value="surplus">Surplus</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Condition</label>
                <select
                  value={filters.condition}
                  onChange={(e) => setFilters({ ...filters, condition: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm"
                >
                  <option value="all">All Conditions</option>
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Criticality</label>
                <select
                  value={filters.criticality}
                  onChange={(e) => setFilters({ ...filters, criticality: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm"
                >
                  <option value="all">All Levels</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 z-10">
            <tr className="text-left text-xs text-slate-400 uppercase tracking-wider">
              <th 
                className="px-6 py-3 font-medium cursor-pointer hover:text-white"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-1">Asset Name <SortIcon field="name" /></div>
              </th>
              <th 
                className="px-6 py-3 font-medium cursor-pointer hover:text-white"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-1">Status <SortIcon field="status" /></div>
              </th>
              <th 
                className="px-6 py-3 font-medium cursor-pointer hover:text-white"
                onClick={() => handleSort('condition')}
              >
                <div className="flex items-center gap-1">Condition <SortIcon field="condition" /></div>
              </th>
              <th 
                className="px-6 py-3 font-medium cursor-pointer hover:text-white"
                onClick={() => handleSort('criticality')}
              >
                <div className="flex items-center gap-1">Criticality <SortIcon field="criticality" /></div>
              </th>
              <th className="px-6 py-3 font-medium">Location</th>
              <th className="px-6 py-3 font-medium">Manufacturer</th>
              <th 
                className="px-6 py-3 font-medium cursor-pointer hover:text-white"
                onClick={() => handleSort('replacement_date')}
              >
                <div className="flex items-center gap-1">Replacement Due <SortIcon field="replacement_date" /></div>
              </th>
              <th className="px-6 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredAssets.map((asset) => (
              <tr 
                key={asset.id}
                className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                onClick={() => navigate(`/assets/${asset.id}`)}
              >
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-white">{asset.name}</p>
                    <p className="text-xs text-slate-400">{asset.asset_id}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={asset.status} />
                </td>
                <td className="px-6 py-4">
                  <ConditionBadge condition={asset.condition} />
                </td>
                <td className="px-6 py-4">
                  <CriticalityBadge criticality={asset.criticality} />
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-slate-300">{asset.location}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-slate-300">{asset.manufacturer}</span>
                  <span className="text-xs text-slate-500 block">{asset.model}</span>
                </td>
                <td className="px-6 py-4">
                  {asset.replacement_date ? (
                    <span className={`text-sm ${new Date(asset.replacement_date) < new Date() ? 'text-red-400' : 'text-slate-300'}`}>
                      {new Date(asset.replacement_date).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="text-sm text-slate-500">—</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/assets/${asset.id}`); }}
                    className="p-2 hover:bg-slate-700 rounded transition-colors"
                    title="View Details"
                  >
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredAssets.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Search className="w-8 h-8 mb-3 opacity-50" />
            <p>No assets match your search criteria</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 border-t border-slate-800 px-6 py-3 bg-slate-900/50">
        <p className="text-xs text-slate-500">
          Asset Register • {filteredAssets.length} records shown • Data sourced from mock/Sample (Supabase assets table pending migration)
        </p>
      </div>
    </div>
  );
}