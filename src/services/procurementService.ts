import { supabase } from '../lib/supabase';

export interface PurchaseRequest {
  id: string;
  clinic_id: string;
  requestor_id: string;
  category_id?: string;
  vendor_id?: string;
  vendor_name?: string;
  item_description: string;
  quantity: number;
  unit_price?: number;
  total_cost: number;
  urgency_level: 'low' | 'normal' | 'high' | 'urgent';
  justification?: string;
  receipt_url?: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'ordered' | 'delivered' | 'cancelled';
  submitted_at?: string;
  approved_at?: string;
  approved_by?: string;
  rejected_at?: string;
  rejected_by?: string;
  rejection_reason?: string;
  ordered_at?: string;
  delivered_at?: string;
  delivery_notes?: string;
  budget_year?: number;
  budget_month?: number;
  auto_approved: boolean;
  requires_executive_approval: boolean;
  created_at: string;
  updated_at: string;
}

export interface BudgetCategory {
  id: string;
  category_name: string;
  category_code: string;
  description?: string;
  is_active: boolean;
  display_order: number;
}

export interface PreferredVendor {
  id: string;
  vendor_name: string;
  vendor_code?: string;
  category_id?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  billing_terms?: string;
  account_number?: string;
  is_preferred: boolean;
  discount_percent: number;
  payment_terms_days: number;
  notes?: string;
  website?: string;
  is_active: boolean;
}

export interface ClinicBudgetAllocation {
  id: string;
  clinic_id: string;
  category_id: string;
  budget_year: number;
  budget_month: number;
  monthly_budget: number;
  amount_spent: number;
  amount_committed: number;
  remaining_budget: number;
  utilization_percent: number;
  notes?: string;
}

export interface PurchaseApproval {
  id: string;
  purchase_request_id: string;
  approver_id: string;
  approver_role: string;
  decision: 'approved' | 'rejected' | 'escalated' | 'pending';
  decision_notes?: string;
  approval_level: number;
  required_for_amount: number;
  decided_at: string;
}

export interface SpendAlert {
  id: string;
  clinic_id?: string;
  alert_type: 'budget_overrun' | 'spending_spike' | 'duplicate_purchase' | 'unusual_vendor' | 'missing_receipt' | 'budget_threshold';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  metric_value?: number;
  threshold_value?: number;
  category_id?: string;
  related_entity_type?: string;
  related_entity_id?: string;
  is_resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
  resolution_notes?: string;
  created_at: string;
}

export interface SpendingAuthorityRole {
  id: string;
  role_name: string;
  role_level: number;
  max_purchase_amount: number;
  requires_approval: boolean;
  auto_approve_under: number;
  description?: string;
}

class ProcurementService {
  // =====================================================
  // PURCHASE REQUESTS
  // =====================================================

  async createPurchaseRequest(data: {
    clinic_id: string;
    category_id?: string;
    vendor_id?: string;
    vendor_name?: string;
    item_description: string;
    quantity: number;
    unit_price?: number;
    total_cost: number;
    urgency_level?: 'low' | 'normal' | 'high' | 'urgent';
    justification?: string;
  }): Promise<PurchaseRequest> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const now = new Date();
    const purchaseData = {
      ...data,
      requestor_id: user.id,
      status: 'draft' as const,
      urgency_level: data.urgency_level || 'normal',
      budget_year: now.getFullYear(),
      budget_month: now.getMonth() + 1,
      auto_approved: false,
      requires_executive_approval: false,
    };

    const { data: purchase, error } = await supabase
      .from('purchase_requests')
      .insert([purchaseData])
      .select()
      .single();

    if (error) throw error;
    return purchase;
  }

  async submitPurchaseRequest(id: string): Promise<PurchaseRequest> {
    const { data: purchase, error } = await supabase
      .from('purchase_requests')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return purchase;
  }

  async approvePurchaseRequest(
    id: string,
    notes?: string
  ): Promise<PurchaseRequest> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: purchase, error } = await supabase
      .from('purchase_requests')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: user.id,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Create approval record
    if (purchase) {
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      await supabase
        .from('purchase_approvals')
        .insert([{
          purchase_request_id: id,
          approver_id: user.id,
          approver_role: userProfile?.role || 'unknown',
          decision: 'approved',
          decision_notes: notes,
          approval_level: 1,
          required_for_amount: purchase.total_cost,
        }]);
    }

    return purchase;
  }

  async rejectPurchaseRequest(
    id: string,
    reason: string
  ): Promise<PurchaseRequest> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: purchase, error } = await supabase
      .from('purchase_requests')
      .update({
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        rejected_by: user.id,
        rejection_reason: reason,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return purchase;
  }

  async getPurchaseRequests(clinicId?: string): Promise<PurchaseRequest[]> {
    let query = supabase
      .from('purchase_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (clinicId) {
      query = query.eq('clinic_id', clinicId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getPurchaseRequest(id: string): Promise<PurchaseRequest> {
    const { data, error } = await supabase
      .from('purchase_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async updatePurchaseRequest(
    id: string,
    updates: Partial<PurchaseRequest>
  ): Promise<PurchaseRequest> {
    const { data, error } = await supabase
      .from('purchase_requests')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // =====================================================
  // BUDGET CATEGORIES
  // =====================================================

  async getBudgetCategories(): Promise<BudgetCategory[]> {
    const { data, error } = await supabase
      .from('budget_categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (error) throw error;
    return data || [];
  }

  // =====================================================
  // VENDORS
  // =====================================================

  async getPreferredVendors(categoryId?: string): Promise<PreferredVendor[]> {
    let query = supabase
      .from('preferred_vendors')
      .select('*')
      .eq('is_active', true);

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    query = query.order('is_preferred', { ascending: false })
      .order('vendor_name');

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async createVendor(vendor: Omit<PreferredVendor, 'id' | 'created_at' | 'updated_at'>): Promise<PreferredVendor> {
    const { data, error } = await supabase
      .from('preferred_vendors')
      .insert([vendor])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // =====================================================
  // BUDGET ALLOCATIONS
  // =====================================================

  async getClinicBudgetAllocations(
    clinicId: string,
    year?: number,
    month?: number
  ): Promise<ClinicBudgetAllocation[]> {
    const currentYear = year || new Date().getFullYear();
    const currentMonth = month || new Date().getMonth() + 1;

    const { data, error } = await supabase
      .from('clinic_budget_allocations')
      .select(`
        *,
        category:budget_categories(category_name, category_code)
      `)
      .eq('clinic_id', clinicId)
      .eq('budget_year', currentYear)
      .eq('budget_month', currentMonth);

    if (error) throw error;
    return data || [];
  }

  async createBudgetAllocation(allocation: {
    clinic_id: string;
    category_id: string;
    budget_year: number;
    budget_month: number;
    monthly_budget: number;
  }): Promise<ClinicBudgetAllocation> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('clinic_budget_allocations')
      .insert([{
        ...allocation,
        created_by: user?.id,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateBudgetAllocation(
    id: string,
    monthly_budget: number
  ): Promise<ClinicBudgetAllocation> {
    const { data, error } = await supabase
      .from('clinic_budget_allocations')
      .update({ monthly_budget })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // =====================================================
  // SPENDING AUTHORITY
  // =====================================================

  async getSpendingAuthorityRoles(): Promise<SpendingAuthorityRole[]> {
    const { data, error } = await supabase
      .from('spending_authority_roles')
      .select('*')
      .order('role_level');

    if (error) throw error;
    return data || [];
  }

  async getUserSpendingAuthority(userId: string): Promise<SpendingAuthorityRole | null> {
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (!userProfile) return null;

    const { data, error } = await supabase
      .from('spending_authority_roles')
      .select('*')
      .eq('role_name', userProfile.role)
      .single();

    if (error) return null;
    return data;
  }

  // =====================================================
  // SPEND ALERTS
  // =====================================================

  async getSpendAlerts(clinicId?: string, resolved?: boolean): Promise<SpendAlert[]> {
    let query = supabase
      .from('spend_alerts')
      .select('*')
      .order('created_at', { ascending: false });

    if (clinicId) {
      query = query.eq('clinic_id', clinicId);
    }

    if (resolved !== undefined) {
      query = query.eq('is_resolved', resolved);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async resolveSpendAlert(
    id: string,
    resolution_notes?: string
  ): Promise<SpendAlert> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('spend_alerts')
      .update({
        is_resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: user?.id,
        resolution_notes,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // =====================================================
  // ANALYTICS
  // =====================================================

  async getBudgetUtilizationSummary(clinicId: string) {
    const { data, error } = await supabase
      .from('clinic_budget_allocations')
      .select(`
        *,
        category:budget_categories(category_name, category_code)
      `)
      .eq('clinic_id', clinicId)
      .eq('budget_year', new Date().getFullYear())
      .eq('budget_month', new Date().getMonth() + 1);

    if (error) throw error;

    const summary = {
      total_budget: 0,
      total_spent: 0,
      total_committed: 0,
      total_remaining: 0,
      avg_utilization: 0,
      categories: data || [],
    };

    if (data) {
      data.forEach(allocation => {
        summary.total_budget += Number(allocation.monthly_budget);
        summary.total_spent += Number(allocation.amount_spent);
        summary.total_committed += Number(allocation.amount_committed);
        summary.total_remaining += Number(allocation.remaining_budget);
      });

      summary.avg_utilization = summary.total_budget > 0
        ? ((summary.total_spent + summary.total_committed) / summary.total_budget) * 100
        : 0;
    }

    return summary;
  }

  async getPurchaseRequestStats(clinicId?: string) {
    let query = supabase
      .from('purchase_requests')
      .select('status, total_cost');

    if (clinicId) {
      query = query.eq('clinic_id', clinicId);
    }

    const { data, error } = await query;
    if (error) throw error;

    const stats = {
      total: data?.length || 0,
      draft: 0,
      submitted: 0,
      approved: 0,
      rejected: 0,
      ordered: 0,
      delivered: 0,
      total_value: 0,
      approved_value: 0,
    };

    if (data) {
      data.forEach(request => {
        stats[request.status as keyof typeof stats]++;
        stats.total_value += Number(request.total_cost);
        if (request.status === 'approved' || request.status === 'ordered' || request.status === 'delivered') {
          stats.approved_value += Number(request.total_cost);
        }
      });
    }

    return stats;
  }
}

export const procurementService = new ProcurementService();
