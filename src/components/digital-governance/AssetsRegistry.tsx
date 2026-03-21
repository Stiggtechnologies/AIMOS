import { useState, useEffect } from 'react';
import { Database, Plus, Filter, Search, Shield, CircleCheck as CheckCircle2, CircleAlert as AlertCircle, ExternalLink, CreditCard as Edit, Calendar } from 'lucide-react';
import {
  getDigitalAssets,
  createDigitalAsset,
  updateDigitalAsset,
  type DigitalAsset,
} from '../../services/digitalGovernanceService';

export default function AssetsRegistry() {
  const [assets, setAssets] = useState<DigitalAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filters, setFilters] = useState({
    asset_type: '',
    vendor: '',
    audit_status: '',
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadAssets();
  }, [filters]);

  async function loadAssets() {
    try {
      setLoading(true);
      const data = await getDigitalAssets(filters.asset_type ? { asset_type: filters.asset_type } : undefined);
      setAssets(data);
    } catch (error) {
      console.error('Error loading assets:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      searchTerm === '' ||
      asset.asset_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.vendor.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesVendor = filters.vendor === '' || asset.vendor === filters.vendor;
    const matchesAuditStatus = filters.audit_status === '' || asset.audit_status === filters.audit_status;

    return matchesSearch && matchesVendor && matchesAuditStatus;
  });

  const uniqueVendors = Array.from(new Set(assets.map((a) => a.vendor))).sort();
  const uniqueTypes = Array.from(new Set(assets.map((a) => a.asset_type))).sort();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Database className="w-8 h-8 text-blue-600" />
            Assets Registry
          </h1>
          <p className="text-gray-600 mt-1">Manage all digital assets and credentials</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Asset
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={filters.asset_type}
            onChange={(e) => setFilters({ ...filters, asset_type: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            {uniqueTypes.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>

          <select
            value={filters.vendor}
            onChange={(e) => setFilters({ ...filters, vendor: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Vendors</option>
            {uniqueVendors.map((vendor) => (
              <option key={vendor} value={vendor}>
                {vendor}
              </option>
            ))}
          </select>

          <select
            value={filters.audit_status}
            onChange={(e) => setFilters({ ...filters, audit_status: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Audit Status</option>
            <option value="compliant">Compliant</option>
            <option value="needs_review">Needs Review</option>
            <option value="non_compliant">Non-Compliant</option>
            <option value="pending">Pending</option>
          </select>

          {(filters.asset_type || filters.vendor || filters.audit_status || searchTerm) && (
            <button
              onClick={() => {
                setFilters({ asset_type: '', vendor: '', audit_status: '' });
                setSearchTerm('');
              }}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Assets Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading assets...</p>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="p-12 text-center">
            <Database className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">No assets found</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 text-blue-600 hover:text-blue-700"
            >
              Add your first asset
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Asset Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Primary Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    MFA
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Audit Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Audit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{asset.asset_name}</span>
                        {asset.is_critical && (
                          <span title="Critical asset"><Shield className="w-4 h-4 text-red-600" /></span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {asset.asset_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{asset.vendor}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {asset.primary_owner_name || 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {asset.mfa_enabled ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          asset.audit_status === 'compliant'
                            ? 'bg-green-100 text-green-800'
                            : asset.audit_status === 'needs_review'
                            ? 'bg-yellow-100 text-yellow-800'
                            : asset.audit_status === 'non_compliant'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {asset.audit_status || 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {asset.last_audit_date ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(asset.last_audit_date).toLocaleDateString()}
                        </div>
                      ) : (
                        'Never'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            /* TODO: Open detail modal */
                          }}
                          className="text-blue-600 hover:text-blue-700"
                          title="View details"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            /* TODO: Open edit modal */
                          }}
                          className="text-gray-600 hover:text-gray-700"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>{filteredAssets.length}</strong> assets shown •{' '}
          <strong>{filteredAssets.filter((a) => !a.mfa_enabled).length}</strong> without MFA •{' '}
          <strong>{filteredAssets.filter((a) => a.audit_status === 'needs_review').length}</strong> need audit
        </p>
      </div>
    </div>
  );
}
