import { useState, useEffect } from 'react';
import { PackagePlus, Building2, Plus, ChevronRight, Calendar, DollarSign, Package } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import AddAssetModal from './AddAssetModal';
import AcquisitionBatchWizard from './AcquisitionBatchWizard';

interface Props {
  onNavigate?: (module: string, subModule: string) => void;
}

export default function AcquisitionIntakeView({ onNavigate }: Props) {
  const [assets, setAssets] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBatchWizard, setShowBatchWizard] = useState(false);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    try {
      const [assetsRes, batchesRes] = await Promise.all([
        supabase
          .from('assets')
          .select('id, name, asset_tag, purchase_date, purchase_cost, supplier, manufacturer, model, status, acquisition_batch_id')
          .order('purchase_date', { ascending: false })
          .limit(50),
        supabase
          .from('acquisition_batches')
          .select('id, deal_name, seller_name, closing_date, intake_start_date, intake_completed_date, total_assets_imported, estimated_total_purchase_allocated_value')
          .order('created_at', { ascending: false })
          .limit(20),
      ]);
      setAssets(assetsRes.data || []);
      setBatches(batchesRes.data || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleAssetSaved = (assetId: string) => {
    setShowAddModal(false);
    fetchData();
    onNavigate?.('assets', `asset-detail:${assetId}`);
  };

  const handleBatchComplete = (batchId: string) => {
    setShowBatchWizard(false);
    fetchData();
    onNavigate?.('assets', 'register');
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  }

  const standaloneAssets = assets.filter(a => !a.acquisition_batch_id);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <PackagePlus className="w-6 h-6 text-blue-600" /> Acquisition & Intake
          </h1>
          <p className="text-gray-500 mt-1">Onboard new equipment, used purchases, and clinic acquisitions</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:border-blue-400 hover:text-blue-700 text-gray-700 text-sm font-medium rounded-lg transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Add Asset
          </button>
          <button onClick={() => setShowBatchWizard(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
            <Building2 className="w-4 h-4" /> Acquisition Batch
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total Assets</p>
          <p className="text-2xl font-bold text-gray-900">{assets.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Acquisition Batches</p>
          <p className="text-2xl font-bold text-gray-900">{batches.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Individual Purchases</p>
          <p className="text-2xl font-bold text-gray-900">{standaloneAssets.length}</p>
        </div>
      </div>

      {batches.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-gray-500" />
            <h2 className="text-base font-semibold text-gray-900">Acquisition Batches</h2>
            <span className="ml-auto text-xs text-gray-400">{batches.length} batches</span>
          </div>
          <div className="divide-y divide-gray-100">
            {batches.map(batch => (
              <div key={batch.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900 truncate">{batch.deal_name}</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                        batch.intake_completed_date
                          ? 'bg-emerald-100 text-emerald-700'
                          : batch.intake_start_date
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {batch.intake_completed_date ? 'Complete' : batch.intake_start_date ? 'In Progress' : 'Pending'}
                      </span>
                    </div>
                    {batch.seller_name && <p className="text-sm text-gray-500">From: {batch.seller_name}</p>}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      {batch.closing_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Closed {new Date(batch.closing_date).toLocaleDateString()}
                        </span>
                      )}
                      {batch.total_assets_imported > 0 && (
                        <span className="flex items-center gap-1">
                          <Package className="w-3 h-3" /> {batch.total_assets_imported} assets
                        </span>
                      )}
                      {batch.estimated_total_purchase_allocated_value && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" /> ${Number(batch.estimated_total_purchase_allocated_value).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigate?.('assets', 'register')}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium flex-shrink-0">
                    View Assets <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
          <Package className="w-4 h-4 text-gray-500" />
          <h2 className="text-base font-semibold text-gray-900">Recent Asset Intake</h2>
          <span className="ml-auto text-xs text-gray-400">{assets.length} total</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                <th className="px-6 py-3">Asset Tag</th>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Manufacturer</th>
                <th className="px-6 py-3">Purchase Date</th>
                <th className="px-6 py-3">Cost</th>
                <th className="px-6 py-3">Source</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {assets.map((asset) => (
                <tr key={asset.id} className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => onNavigate?.('assets', `asset-detail:${asset.id}`)}>
                  <td className="px-6 py-4 font-mono text-sm text-gray-600">{asset.asset_tag || '—'}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{asset.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{asset.manufacturer || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString() : '—'}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{asset.purchase_cost != null ? `$${Number(asset.purchase_cost).toLocaleString()}` : '—'}</td>
                  <td className="px-6 py-4">
                    {asset.acquisition_batch_id
                      ? <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">Acquisition</span>
                      : <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Purchase</span>
                    }
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      asset.status === 'operational' ? 'bg-emerald-100 text-emerald-700' :
                      asset.status === 'active' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>{asset.status || '—'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {assets.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <PackagePlus className="w-8 h-8 mb-3" />
              <p className="text-sm font-medium text-gray-600">No assets yet</p>
              <p className="text-xs mt-1">Use the buttons above to add your first asset or import an acquisition batch</p>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <AddAssetModal
          onClose={() => setShowAddModal(false)}
          onSaved={handleAssetSaved}
        />
      )}

      {showBatchWizard && (
        <AcquisitionBatchWizard
          onClose={() => setShowBatchWizard(false)}
          onComplete={handleBatchComplete}
        />
      )}
    </div>
  );
}
