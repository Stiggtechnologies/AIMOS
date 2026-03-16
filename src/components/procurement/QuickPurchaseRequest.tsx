import React, { useState, useEffect } from 'react';
import { DollarSign, Upload, CircleAlert as AlertCircle, CircleCheck as CheckCircle2, Clock } from 'lucide-react';
import { procurementService } from '../../services/procurementService';
import type { BudgetCategory, PreferredVendor } from '../../services/procurementService';

interface QuickPurchaseRequestProps {
  clinicId?: string;
  onSuccess?: () => void;
}

export function QuickPurchaseRequest({ clinicId = '', onSuccess }: QuickPurchaseRequestProps) {
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [vendors, setVendors] = useState<PreferredVendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    category_id: '',
    vendor_id: '',
    vendor_name: '',
    item_description: '',
    quantity: 1,
    total_cost: 0,
    urgency_level: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
    justification: '',
  });

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (formData.category_id) {
      loadVendors(formData.category_id);
    }
  }, [formData.category_id]);

  const loadCategories = async () => {
    try {
      const data = await procurementService.getBudgetCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const loadVendors = async (categoryId: string) => {
    try {
      const data = await procurementService.getPreferredVendors(categoryId);
      setVendors(data);
    } catch (err) {
      console.error('Failed to load vendors:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Create purchase request
      const purchase = await procurementService.createPurchaseRequest({
        clinic_id: clinicId,
        ...formData,
      });

      // Auto-submit it
      await procurementService.submitPurchaseRequest(purchase.id);

      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        // Reset form
        setFormData({
          category_id: '',
          vendor_id: '',
          vendor_name: '',
          item_description: '',
          quantity: 1,
          total_cost: 0,
          urgency_level: 'normal',
          justification: '',
        });
        onSuccess?.();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit purchase request');
    } finally {
      setLoading(false);
    }
  };

  const selectedVendor = vendors.find(v => v.id === formData.vendor_id);

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
        <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-green-900 mb-2">
          Purchase Request Submitted!
        </h3>
        <p className="text-green-700">
          {formData.total_cost <= 150
            ? 'Auto-approved - you can proceed with the purchase'
            : 'Your manager will review and approve this request'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Quick Purchase Request</h2>
        <p className="mt-1 text-sm text-gray-600">
          Purchases under $150 are auto-approved
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category *
          </label>
          <select
            required
            value={formData.category_id}
            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select category...</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.category_name}
              </option>
            ))}
          </select>
        </div>

        {/* Vendor */}
        {formData.category_id && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vendor
            </label>
            <select
              value={formData.vendor_id}
              onChange={(e) => {
                const vendor = vendors.find(v => v.id === e.target.value);
                setFormData({
                  ...formData,
                  vendor_id: e.target.value,
                  vendor_name: vendor?.vendor_name || '',
                });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select vendor or enter custom...</option>
              {vendors.filter(v => v.is_preferred).map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.vendor_name} {vendor.discount_percent > 0 && `(${vendor.discount_percent}% discount)`}
                </option>
              ))}
              <option value="other">Other vendor (enter below)</option>
            </select>

            {selectedVendor && selectedVendor.is_preferred && (
              <p className="mt-1 text-sm text-green-600">
                Preferred vendor - {selectedVendor.discount_percent}% discount available
              </p>
            )}

            {formData.vendor_id === 'other' && (
              <input
                type="text"
                placeholder="Enter vendor name"
                value={formData.vendor_name}
                onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            )}
          </div>
        )}

        {/* Item Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            What are you purchasing? *
          </label>
          <input
            type="text"
            required
            placeholder="e.g., Printer paper, Resistance bands, Cleaning supplies"
            value={formData.item_description}
            onChange={(e) => setFormData({ ...formData, item_description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Quantity and Cost */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity
            </label>
            <input
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total Cost *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="number"
                required
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.total_cost || ''}
                onChange={(e) => setFormData({ ...formData, total_cost: parseFloat(e.target.value) || 0 })}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Auto-approval indicator */}
        {formData.total_cost > 0 && (
          <div className={`p-3 rounded-lg ${formData.total_cost <= 150 ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
            <div className="flex items-center gap-2">
              {formData.total_cost <= 150 ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-900">
                    Auto-approved - purchase immediately
                  </span>
                </>
              ) : (
                <>
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-900">
                    Requires manager approval
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Urgency */}
        {formData.total_cost > 150 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Urgency
            </label>
            <select
              value={formData.urgency_level}
              onChange={(e) => setFormData({ ...formData, urgency_level: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="low">Low - can wait</option>
              <option value="normal">Normal</option>
              <option value="high">High - needed soon</option>
              <option value="urgent">Urgent - needed now</option>
            </select>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Submitting...' : 'Submit Purchase Request'}
          </button>
        </div>
      </form>
    </div>
  );
}
