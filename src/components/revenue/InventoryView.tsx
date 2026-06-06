import { useState } from 'react';
import { Package, Plus, Search, TriangleAlert as AlertTriangle, TrendingDown, RefreshCw, ShoppingCart } from 'lucide-react';

const ITEMS = [
  { id: '1', name: 'Tensor Bandages (4")', sku: 'TB-004', category: 'Supplies', qty: 145, reorder: 50, unitCost: 2.50, status: 'ok' },
  { id: '2', name: 'Athletic Tape (1.5")', sku: 'AT-015', category: 'Supplies', qty: 32, reorder: 100, unitCost: 3.75, status: 'low' },
  { id: '3', name: 'Disposable Electrode Pads', sku: 'EP-001', category: 'Equipment', qty: 0, reorder: 200, unitCost: 0.45, status: 'out' },
  { id: '4', name: 'Resistance Bands (Set)', sku: 'RB-SET', category: 'Equipment', qty: 28, reorder: 15, unitCost: 18.00, status: 'ok' },
  { id: '5', name: 'Hydrocollator Packs (Med)', sku: 'HP-MED', category: 'Modalities', qty: 12, reorder: 20, unitCost: 22.00, status: 'low' },
  { id: '6', name: 'Foam Rollers (36")', sku: 'FR-036', category: 'Equipment', qty: 8, reorder: 5, unitCost: 35.00, status: 'ok' },
  { id: '7', name: 'Ultrasound Gel (5L)', sku: 'UG-5L', category: 'Supplies', qty: 6, reorder: 10, unitCost: 28.00, status: 'low' },
  { id: '8', name: 'TENS Electrode Leads', sku: 'TL-001', category: 'Modalities', qty: 15, reorder: 10, unitCost: 12.50, status: 'ok' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  ok: { label: 'In Stock', color: 'text-green-700', bg: 'bg-green-100' },
  low: { label: 'Low Stock', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  out: { label: 'Out of Stock', color: 'text-red-700', bg: 'bg-red-100' }
};

export default function InventoryView() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = ITEMS.filter(item => {
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) || item.sku.toLowerCase().includes(search.toLowerCase());
    const matchCat = !categoryFilter || item.category === categoryFilter;
    const matchStatus = !statusFilter || item.status === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  const categories = [...new Set(ITEMS.map(i => i.category))];
  const lowCount = ITEMS.filter(i => i.status === 'low').length;
  const outCount = ITEMS.filter(i => i.status === 'out').length;
  const totalValue = ITEMS.reduce((s, i) => s + (i.qty * i.unitCost), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inventory</h2>
          <p className="text-gray-600 mt-1">Clinic supply and equipment inventory management</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Order Supplies
          </button>
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="text-2xl font-bold text-blue-600">{ITEMS.length}</div>
          <div className="text-sm text-gray-600">SKUs Tracked</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-yellow-600">{lowCount}</div>
            <div className="text-sm text-gray-600">Low Stock</div>
          </div>
          <TrendingDown className="h-8 w-8 text-yellow-300" />
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-red-600">{outCount}</div>
            <div className="text-sm text-gray-600">Out of Stock</div>
          </div>
          <AlertTriangle className="h-8 w-8 text-red-300" />
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="text-2xl font-bold text-green-600">${totalValue.toLocaleString('en-CA', { minimumFractionDigits: 2 })}</div>
          <div className="text-sm text-gray-600">Inventory Value</div>
        </div>
      </div>

      {(lowCount > 0 || outCount > 0) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-yellow-800">Reorder Alert</div>
              <p className="text-sm text-yellow-700 mt-1">
                {outCount > 0 && `${outCount} item(s) are out of stock. `}
                {lowCount > 0 && `${lowCount} item(s) are below reorder threshold.`}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search items or SKUs..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="ok">In Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Item</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Qty</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Reorder At</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Unit Cost</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(item => {
                const cfg = STATUS_CONFIG[item.status];
                return (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{item.name}</div>
                      <div className="text-xs text-gray-500">SKU: {item.sku}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-700">{item.category}</td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-900">{item.qty}</td>
                    <td className="py-3 px-4 text-right text-gray-600">{item.reorder}</td>
                    <td className="py-3 px-4 text-right text-gray-600">${item.unitCost.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${cfg.bg} ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button className="flex items-center gap-1 px-3 py-1 border border-gray-300 text-gray-700 rounded text-xs hover:bg-gray-50 transition-colors ml-auto">
                        <RefreshCw className="h-3 w-3" />
                        Reorder
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
