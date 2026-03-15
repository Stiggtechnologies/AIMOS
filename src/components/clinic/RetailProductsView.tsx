import React, { useState, useEffect } from 'react';
import { Package, DollarSign, CircleAlert as AlertCircle, Search, ShoppingCart } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Product {
  id: string;
  product_name: string;
  product_category: string;
  sku: string;
  retail_price: number;
  cost: number;
  recommended_for_conditions: string[];
  inventory?: {
    quantity_on_hand: number;
    reorder_point: number;
  };
}

export default function RetailProductsView() {
  const { profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useEffect(() => {
    loadProducts();
  }, [profile]);

  const loadProducts = async () => {
    try {
      setLoading(true);

      let clinicId: string | null = profile?.primary_clinic_id || null;

      if (!clinicId) {
        const clinicResult = await supabase
          .from('clinics')
          .select('id')
          .eq('is_active', true)
          .order('name')
          .limit(1)
          .maybeSingle();
        clinicId = clinicResult.data?.id || null;
      }

      if (!clinicId) return;

      const { data, error } = await supabase
        .from('product_catalog')
        .select(`
          *,
          product_inventory!inner(quantity_on_hand, reorder_point)
        `)
        .eq('product_inventory.clinic_id', clinicId)
        .eq('is_active', true);

      if (error) throw error;

      const formattedData = data?.map((product: any) => ({
        ...product,
        inventory: product.product_inventory?.[0]
      }));

      setProducts(formattedData || []);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', ...new Set(products.map(p => p.product_category))];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.product_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || product.product_category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalInventoryValue = products.reduce((sum, p) =>
    sum + (p.retail_price * (p.inventory?.quantity_on_hand || 0)), 0
  );

  const lowStockCount = products.filter(p =>
    (p.inventory?.quantity_on_hand || 0) <= (p.inventory?.reorder_point || 0)
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <Package className="w-7 h-7 text-blue-600" />
          Retail Products
        </h2>
        <p className="text-gray-600 mt-1">
          Manage inventory and sell rehab products to patients
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <Package className="w-5 h-5 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">{products.length}</span>
          </div>
          <div className="text-sm text-gray-600">Products in Catalog</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <span className="text-2xl font-bold text-gray-900">${totalInventoryValue.toFixed(0)}</span>
          </div>
          <div className="text-sm text-gray-600">Inventory Value</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <span className="text-2xl font-bold text-gray-900">{lowStockCount}</span>
          </div>
          <div className="text-sm text-gray-600">Low Stock Items</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === category
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredProducts.map((product) => {
            const stock = product.inventory?.quantity_on_hand || 0;
            const reorderPoint = product.inventory?.reorder_point || 0;
            const isLowStock = stock <= reorderPoint;

            return (
              <div key={product.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{product.product_name}</h3>
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                        {product.product_category}
                      </span>
                      {isLowStock && (
                        <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Low Stock
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 mb-3">SKU: {product.sku}</p>

                    {product.recommended_for_conditions && product.recommended_for_conditions.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {product.recommended_for_conditions.map((condition, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                          >
                            {condition}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Price:</span> ${product.retail_price.toFixed(2)}
                      </div>
                      <div>
                        <span className="font-medium">Cost:</span> ${product.cost?.toFixed(2) || '0.00'}
                      </div>
                      <div>
                        <span className="font-medium">Margin:</span>{' '}
                        {product.cost ? Math.round(((product.retail_price - product.cost) / product.retail_price) * 100) : 0}%
                      </div>
                      <div className={isLowStock ? 'text-orange-600 font-medium' : ''}>
                        <span className="font-medium">Stock:</span> {stock} units
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4" />
                      Sell
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredProducts.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium mb-2">No Products Found</p>
              <p className="text-sm">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
