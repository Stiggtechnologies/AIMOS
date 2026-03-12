import React, { useState, useEffect } from 'react';
import { ShoppingCart, DollarSign, Package, Clock, CircleCheck as CheckCircle2, Circle as XCircle, TrendingUp } from 'lucide-react';
import { QuickPurchaseRequest } from './QuickPurchaseRequest';
import { procurementService } from '../../services/procurementService';
import type { PurchaseRequest, ClinicBudgetAllocation } from '../../services/procurementService';

interface ProcurementDashboardProps {
  clinicId: string;
}

export function ProcurementDashboard({ clinicId }: ProcurementDashboardProps) {
  const [view, setView] = useState<'overview' | 'new-request' | 'my-requests'>('overview');
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [budgetSummary, setBudgetSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [clinicId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [requestsData, budgetData] = await Promise.all([
        procurementService.getPurchaseRequests(clinicId),
        procurementService.getBudgetUtilizationSummary(clinicId),
      ]);

      setRequests(requestsData);
      setBudgetSummary(budgetData);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const myRequests = requests.filter(r => r.requestor_id === 'current-user-id'); // Replace with actual user ID

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'submitted').length,
    approved: requests.filter(r => r.status === 'approved').length,
    this_month_spending: requests
      .filter(r => r.status === 'approved' || r.status === 'ordered')
      .reduce((sum, r) => sum + Number(r.total_cost), 0),
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      ordered: 'bg-blue-100 text-blue-800',
      delivered: 'bg-green-100 text-green-800',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.draft}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
      case 'delivered':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'submitted':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <Package className="h-5 w-5 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Procurement</h1>
        <p className="text-gray-600">Purchase requests and expense management</p>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setView('overview')}
          className={`px-4 py-2 font-medium transition-colors ${
            view === 'overview'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setView('new-request')}
          className={`px-4 py-2 font-medium transition-colors ${
            view === 'new-request'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          New Request
        </button>
        <button
          onClick={() => setView('my-requests')}
          className={`px-4 py-2 font-medium transition-colors ${
            view === 'my-requests'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          My Requests
        </button>
      </div>

      {/* Overview */}
      {view === 'overview' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Month Spending</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    ${stats.this_month_spending.toLocaleString()}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Requests</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <ShoppingCart className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">{stats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Approved</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">{stats.approved}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>

          {/* Budget Overview */}
          {budgetSummary && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget Overview</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <p className="text-sm text-gray-600">Total Budget</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${budgetSummary.total_budget.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Spent</p>
                  <p className="text-2xl font-bold text-blue-600">
                    ${budgetSummary.total_spent.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Remaining</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${budgetSummary.total_remaining.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Budget Utilization Bar */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Budget Utilization</span>
                  <span className="font-medium">{budgetSummary.avg_utilization.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      budgetSummary.avg_utilization > 90
                        ? 'bg-red-600'
                        : budgetSummary.avg_utilization > 75
                        ? 'bg-yellow-600'
                        : 'bg-green-600'
                    }`}
                    style={{ width: `${Math.min(budgetSummary.avg_utilization, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-2">Quick Purchase</h3>
            <p className="text-sm text-blue-700 mb-4">
              Need something under $150? Get auto-approved instantly.
            </p>
            <button
              onClick={() => setView('new-request')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Create Purchase Request
            </button>
          </div>
        </div>
      )}

      {/* New Request */}
      {view === 'new-request' && (
        <QuickPurchaseRequest
          clinicId={clinicId}
          onSuccess={() => {
            setView('my-requests');
            loadData();
          }}
        />
      )}

      {/* My Requests */}
      {view === 'my-requests' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">My Purchase Requests</h2>
          </div>

          {requests.length === 0 ? (
            <div className="p-12 text-center">
              <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No purchase requests yet</h3>
              <p className="text-gray-600 mb-4">Create your first purchase request to get started</p>
              <button
                onClick={() => setView('new-request')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Create Request
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {requests.map((request) => (
                <div key={request.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      {getStatusIcon(request.status)}
                      <div>
                        <h3 className="font-semibold text-gray-900">{request.item_description}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {request.vendor_name && `from ${request.vendor_name}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        ${Number(request.total_cost).toLocaleString()}
                      </p>
                      {getStatusBadge(request.status)}
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-sm text-gray-600">
                    <span>Qty: {request.quantity}</span>
                    <span>Submitted: {new Date(request.created_at).toLocaleDateString()}</span>
                    {request.auto_approved && (
                      <span className="text-green-600 font-medium">Auto-approved</span>
                    )}
                  </div>

                  {request.status === 'rejected' && request.rejection_reason && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">
                        <span className="font-medium">Rejected:</span> {request.rejection_reason}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
