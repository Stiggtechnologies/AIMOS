import { supabase } from '../lib/supabase';

export interface Expense {
  id: string;
  clinic_id: string;
  employee_id: string;
  purchase_request_id?: string;
  vendor_id?: string;
  vendor_name: string;
  category_id?: string;
  expense_date: string;
  amount: number;
  description: string;
  payment_method: 'corporate_card' | 'vendor_invoice' | 'reimbursement' | 'petty_cash';
  receipt_url?: string;
  receipt_uploaded: boolean;
  card_transaction_id?: string;
  status: 'pending' | 'approved' | 'rejected' | 'reimbursed' | 'flagged';
  approved_at?: string;
  approved_by?: string;
  rejected_at?: string;
  rejected_by?: string;
  rejection_reason?: string;
  reimbursed_at?: string;
  reimbursement_amount?: number;
  budget_year?: number;
  budget_month?: number;
  is_personal_flag: boolean;
  is_duplicate_flag: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CorporateCard {
  id: string;
  card_holder_id: string;
  clinic_id?: string;
  card_last_four: string;
  card_nickname?: string;
  card_type: string;
  monthly_limit: number;
  transaction_limit: number;
  is_active: boolean;
  activation_date?: string;
  expiry_date?: string;
  notes?: string;
}

export interface CardTransaction {
  id: string;
  card_id: string;
  expense_id?: string;
  transaction_date: string;
  posted_date?: string;
  vendor_name: string;
  category_id?: string;
  amount: number;
  description?: string;
  receipt_url?: string;
  receipt_uploaded: boolean;
  reconciled: boolean;
  reconciled_at?: string;
  reconciled_by?: string;
  is_personal_flag: boolean;
  is_duplicate_flag: boolean;
  flagged_reason?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

class ExpenseService {
  // =====================================================
  // EXPENSES
  // =====================================================

  async createExpense(data: {
    clinic_id: string;
    vendor_name: string;
    category_id?: string;
    expense_date: string;
    amount: number;
    description: string;
    payment_method: 'corporate_card' | 'vendor_invoice' | 'reimbursement' | 'petty_cash';
    receipt_url?: string;
    card_transaction_id?: string;
  }): Promise<Expense> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const expenseDate = new Date(data.expense_date);
    const expenseData = {
      ...data,
      employee_id: user.id,
      receipt_uploaded: !!data.receipt_url,
      status: 'pending' as const,
      budget_year: expenseDate.getFullYear(),
      budget_month: expenseDate.getMonth() + 1,
      is_personal_flag: false,
      is_duplicate_flag: false,
    };

    const { data: expense, error } = await supabase
      .from('expenses')
      .insert([expenseData])
      .select()
      .single();

    if (error) throw error;
    return expense;
  }

  async getExpenses(filters?: {
    clinicId?: string;
    employeeId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Expense[]> {
    let query = supabase
      .from('expenses')
      .select('*')
      .order('expense_date', { ascending: false });

    if (filters?.clinicId) {
      query = query.eq('clinic_id', filters.clinicId);
    }

    if (filters?.employeeId) {
      query = query.eq('employee_id', filters.employeeId);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.startDate) {
      query = query.gte('expense_date', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('expense_date', filters.endDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getExpense(id: string): Promise<Expense> {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async approveExpense(id: string): Promise<Expense> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('expenses')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: user.id,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async rejectExpense(id: string, reason: string): Promise<Expense> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('expenses')
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
    return data;
  }

  async markAsReimbursed(id: string, amount: number): Promise<Expense> {
    const { data, error } = await supabase
      .from('expenses')
      .update({
        status: 'reimbursed',
        reimbursed_at: new Date().toISOString(),
        reimbursement_amount: amount,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async flagExpense(id: string, reason: string, isPersonal: boolean = false): Promise<Expense> {
    const { data, error } = await supabase
      .from('expenses')
      .update({
        status: 'flagged',
        is_personal_flag: isPersonal,
        notes: reason,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // =====================================================
  // CORPORATE CARDS
  // =====================================================

  async getCorporateCards(cardHolderId?: string): Promise<CorporateCard[]> {
    let query = supabase
      .from('corporate_cards')
      .select('*')
      .eq('is_active', true);

    if (cardHolderId) {
      query = query.eq('card_holder_id', cardHolderId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async createCorporateCard(card: {
    card_holder_id: string;
    clinic_id?: string;
    card_last_four: string;
    card_nickname?: string;
    monthly_limit: number;
    transaction_limit: number;
  }): Promise<CorporateCard> {
    const { data, error } = await supabase
      .from('corporate_cards')
      .insert([{
        ...card,
        card_type: 'visa',
        is_active: true,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateCorporateCard(
    id: string,
    updates: Partial<CorporateCard>
  ): Promise<CorporateCard> {
    const { data, error } = await supabase
      .from('corporate_cards')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deactivateCorporateCard(id: string): Promise<CorporateCard> {
    const { data, error } = await supabase
      .from('corporate_cards')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // =====================================================
  // CARD TRANSACTIONS
  // =====================================================

  async getCardTransactions(filters?: {
    cardId?: string;
    reconciled?: boolean;
    startDate?: string;
    endDate?: string;
  }): Promise<CardTransaction[]> {
    let query = supabase
      .from('card_transactions')
      .select('*')
      .order('transaction_date', { ascending: false });

    if (filters?.cardId) {
      query = query.eq('card_id', filters.cardId);
    }

    if (filters?.reconciled !== undefined) {
      query = query.eq('reconciled', filters.reconciled);
    }

    if (filters?.startDate) {
      query = query.gte('transaction_date', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('transaction_date', filters.endDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async createCardTransaction(transaction: {
    card_id: string;
    transaction_date: string;
    vendor_name: string;
    amount: number;
    description?: string;
  }): Promise<CardTransaction> {
    const { data, error } = await supabase
      .from('card_transactions')
      .insert([{
        ...transaction,
        receipt_uploaded: false,
        reconciled: false,
        is_personal_flag: false,
        is_duplicate_flag: false,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async reconcileTransaction(
    id: string,
    expenseId: string
  ): Promise<CardTransaction> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('card_transactions')
      .update({
        expense_id: expenseId,
        reconciled: true,
        reconciled_at: new Date().toISOString(),
        reconciled_by: user?.id,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async flagCardTransaction(
    id: string,
    reason: string,
    isPersonal: boolean = false,
    isDuplicate: boolean = false
  ): Promise<CardTransaction> {
    const { data, error } = await supabase
      .from('card_transactions')
      .update({
        is_personal_flag: isPersonal,
        is_duplicate_flag: isDuplicate,
        flagged_reason: reason,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // =====================================================
  // ANALYTICS & REPORTING
  // =====================================================

  async getExpenseSummary(clinicId: string, year: number, month: number) {
    const { data, error } = await supabase
      .from('expenses')
      .select('status, amount, payment_method, category_id')
      .eq('clinic_id', clinicId)
      .eq('budget_year', year)
      .eq('budget_month', month);

    if (error) throw error;

    const summary = {
      total_expenses: 0,
      total_amount: 0,
      approved_amount: 0,
      pending_amount: 0,
      reimbursement_amount: 0,
      by_payment_method: {
        corporate_card: 0,
        vendor_invoice: 0,
        reimbursement: 0,
        petty_cash: 0,
      },
      by_status: {
        pending: 0,
        approved: 0,
        rejected: 0,
        reimbursed: 0,
        flagged: 0,
      },
    };

    if (data) {
      data.forEach(expense => {
        summary.total_expenses++;
        summary.total_amount += Number(expense.amount);

        if (expense.status === 'approved') {
          summary.approved_amount += Number(expense.amount);
        } else if (expense.status === 'pending') {
          summary.pending_amount += Number(expense.amount);
        } else if (expense.status === 'reimbursed') {
          summary.reimbursement_amount += Number(expense.amount);
        }

        summary.by_payment_method[expense.payment_method] += Number(expense.amount);
        summary.by_status[expense.status]++;
      });
    }

    return summary;
  }

  async getUnreconciledTransactions(cardId?: string): Promise<CardTransaction[]> {
    let query = supabase
      .from('card_transactions')
      .select('*')
      .eq('reconciled', false)
      .order('transaction_date', { ascending: false });

    if (cardId) {
      query = query.eq('card_id', cardId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getMissingReceipts(clinicId?: string): Promise<Expense[]> {
    let query = supabase
      .from('expenses')
      .select('*')
      .eq('receipt_uploaded', false)
      .eq('payment_method', 'corporate_card')
      .gte('amount', 50)
      .order('expense_date', { ascending: false });

    if (clinicId) {
      query = query.eq('clinic_id', clinicId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getCardUtilization(cardId: string, year: number, month: number) {
    const { data: card } = await supabase
      .from('corporate_cards')
      .select('monthly_limit')
      .eq('id', cardId)
      .single();

    const { data: transactions } = await supabase
      .from('card_transactions')
      .select('amount')
      .eq('card_id', cardId)
      .gte('transaction_date', `${year}-${month.toString().padStart(2, '0')}-01`)
      .lt('transaction_date', `${year}-${(month + 1).toString().padStart(2, '0')}-01`);

    const totalSpent = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    const monthlyLimit = Number(card?.monthly_limit || 0);

    return {
      cardId,
      year,
      month,
      monthly_limit: monthlyLimit,
      total_spent: totalSpent,
      remaining: monthlyLimit - totalSpent,
      utilization_percent: monthlyLimit > 0 ? (totalSpent / monthlyLimit) * 100 : 0,
    };
  }
}

export const expenseService = new ExpenseService();
