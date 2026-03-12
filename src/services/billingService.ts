import { supabase } from '../lib/supabase';

export interface Invoice {
  id: string;
  patient_id: string;
  patient_name: string;
  clinic_id: string;
  appointment_id?: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  subtotal: number;
  tax: number;
  total: number;
  amount_paid: number;
  balance: number;
  status: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled';
  line_items: InvoiceLineItem[];
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  service_code?: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Payment {
  id: string;
  invoice_id: string;
  patient_id: string;
  amount: number;
  payment_method: 'cash' | 'card' | 'direct_billing' | 'e-transfer' | 'other';
  payment_date: string;
  reference_number?: string;
  notes?: string;
}

export interface InsuranceClaim {
  id: string;
  patient_id: string;
  invoice_id: string;
  carrier: string;
  policy_number: string;
  claim_number: string;
  claim_date: string;
  service_date: string;
  amount_claimed: number;
  amount_approved?: number;
  amount_paid?: number;
  status: 'draft' | 'submitted' | 'pending' | 'approved' | 'partial' | 'rejected';
  submission_type: 'electronic' | 'manual';
  rejection_reason?: string;
}

export interface BillingReport {
  period: string;
  total_billed: number;
  total_collected: number;
  total_outstanding: number;
  collection_rate: number;
  insurance_pending: number;
  patient_balance: number;
  top_services: { service: string; count: number; revenue: number }[];
}

class BillingService {
  /**
   * Generate invoice number in format: INV-YYYYMM-XXXX
   */
  private generateInvoiceNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `INV-${year}${month}-${random}`;
  }

  /**
   * Create invoice for appointment
   */
  async createInvoice(
    clinicId: string,
    patientId: string,
    appointmentId: string,
    lineItems: Omit<InvoiceLineItem, 'id'>[]
  ): Promise<{ success: boolean; invoiceId?: string; error?: string }> {
    try {
      // Calculate totals
      const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
      const tax = subtotal * 0.05; // 5% GST (adjust based on province)
      const total = subtotal + tax;

      const invoiceNumber = this.generateInvoiceNumber();
      const invoiceDate = new Date().toISOString().split('T')[0];
      const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]; // 30 days

      // Create invoice record
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          clinic_id: clinicId,
          patient_id: patientId,
          appointment_id: appointmentId,
          invoice_number: invoiceNumber,
          invoice_date: invoiceDate,
          due_date: dueDate,
          subtotal,
          tax,
          total,
          amount_paid: 0,
          balance: total,
          status: 'draft',
          created_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (invoiceError) {
        return { success: false, error: invoiceError.message };
      }

      // Create line items
      const itemsToInsert = lineItems.map(item => ({
        invoice_id: invoice.id,
        description: item.description,
        service_code: item.service_code,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total,
      }));

      const { error: itemsError } = await supabase
        .from('invoice_line_items')
        .insert(itemsToInsert);

      if (itemsError) {
        return { success: false, error: itemsError.message };
      }

      return { success: true, invoiceId: invoice.id };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Record payment against invoice
   */
  async recordPayment(
    invoiceId: string,
    amount: number,
    paymentMethod: Payment['payment_method'],
    referenceNumber?: string,
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get invoice details
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('patient_id, amount_paid, total, balance')
        .eq('id', invoiceId)
        .single();

      if (invoiceError || !invoice) {
        return { success: false, error: 'Invoice not found' };
      }

      // Record payment
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          invoice_id: invoiceId,
          patient_id: invoice.patient_id,
          amount,
          payment_method: paymentMethod,
          payment_date: new Date().toISOString(),
          reference_number: referenceNumber,
          notes,
        });

      if (paymentError) {
        return { success: false, error: paymentError.message };
      }

      // Update invoice
      const newAmountPaid = invoice.amount_paid + amount;
      const newBalance = invoice.total - newAmountPaid;
      const newStatus =
        newBalance <= 0 ? 'paid' :
        newAmountPaid > 0 ? 'partial' :
        invoice.status;

      const { error: updateError } = await supabase
        .from('invoices')
        .update({
          amount_paid: newAmountPaid,
          balance: newBalance,
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoiceId);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Submit insurance claim
   */
  async submitInsuranceClaim(
    patientId: string,
    invoiceId: string,
    carrier: string,
    policyNumber: string,
    serviceDate: string,
    amountClaimed: number,
    submissionType: 'electronic' | 'manual' = 'electronic'
  ): Promise<{ success: boolean; claimId?: string; error?: string }> {
    try {
      const claimNumber = `CLM-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const { data: claim, error } = await supabase
        .from('insurance_claims')
        .insert({
          patient_id: patientId,
          invoice_id: invoiceId,
          carrier,
          policy_number: policyNumber,
          claim_number: claimNumber,
          claim_date: new Date().toISOString().split('T')[0],
          service_date: serviceDate,
          amount_claimed: amountClaimed,
          status: submissionType === 'electronic' ? 'submitted' : 'draft',
          submission_type: submissionType,
        })
        .select('id')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      // If electronic submission, integrate with EDI/API here
      if (submissionType === 'electronic') {
        console.log('[BillingService] Electronic claim submission:', {
          carrier,
          claimNumber,
          amount: amountClaimed,
        });
        // TODO: Integrate with insurance carrier API
      }

      return { success: true, claimId: claim.id };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update claim status (e.g., when response received from carrier)
   */
  async updateClaimStatus(
    claimId: string,
    status: InsuranceClaim['status'],
    amountApproved?: number,
    amountPaid?: number,
    rejectionReason?: string
  ): Promise<boolean> {
    const { error } = await supabase
      .from('insurance_claims')
      .update({
        status,
        amount_approved: amountApproved,
        amount_paid: amountPaid,
        rejection_reason: rejectionReason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', claimId);

    return !error;
  }

  /**
   * Generate receipt for payment
   */
  async generateReceipt(paymentId: string): Promise<{
    receipt_number: string;
    patient_name: string;
    amount: number;
    payment_method: string;
    payment_date: string;
    clinic_name: string;
    invoice_number: string;
  } | null> {
    const { data: payment, error } = await supabase
      .from('payments')
      .select(`
        id,
        amount,
        payment_method,
        payment_date,
        reference_number,
        invoices(
          invoice_number,
          patients(first_name, last_name),
          clinics(name)
        )
      `)
      .eq('id', paymentId)
      .single();

    if (error || !payment) {
      return null;
    }

    const receiptNumber = `RCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    return {
      receipt_number: receiptNumber,
      patient_name: `${payment.invoices.patients.first_name} ${payment.invoices.patients.last_name}`,
      amount: payment.amount,
      payment_method: payment.payment_method,
      payment_date: payment.payment_date,
      clinic_name: payment.invoices.clinics.name,
      invoice_number: payment.invoices.invoice_number,
    };
  }

  /**
   * Get billing report for a period
   */
  async getBillingReport(
    clinicId: string,
    startDate: string,
    endDate: string
  ): Promise<BillingReport> {
    // Fetch invoices for period
    const { data: invoices } = await supabase
      .from('invoices')
      .select('total, amount_paid, balance, status, invoice_line_items(description, total)')
      .eq('clinic_id', clinicId)
      .gte('invoice_date', startDate)
      .lte('invoice_date', endDate);

    const totalBilled = invoices?.reduce((sum, inv) => sum + inv.total, 0) || 0;
    const totalCollected = invoices?.reduce((sum, inv) => sum + inv.amount_paid, 0) || 0;
    const totalOutstanding = invoices?.reduce((sum, inv) => sum + inv.balance, 0) || 0;

    // Get insurance claims pending
    const { data: claims } = await supabase
      .from('insurance_claims')
      .select('amount_claimed')
      .eq('status', 'pending')
      .gte('claim_date', startDate)
      .lte('claim_date', endDate);

    const insurancePending = claims?.reduce((sum, c) => sum + c.amount_claimed, 0) || 0;

    // Top services
    const serviceMap = new Map<string, { count: number; revenue: number }>();
    invoices?.forEach(inv => {
      inv.invoice_line_items?.forEach((item: any) => {
        const existing = serviceMap.get(item.description) || { count: 0, revenue: 0 };
        serviceMap.set(item.description, {
          count: existing.count + 1,
          revenue: existing.revenue + item.total,
        });
      });
    });

    const topServices = Array.from(serviceMap.entries())
      .map(([service, data]) => ({ service, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      period: `${startDate} to ${endDate}`,
      total_billed: totalBilled,
      total_collected: totalCollected,
      total_outstanding: totalOutstanding,
      collection_rate: totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 0,
      insurance_pending: insurancePending,
      patient_balance: totalOutstanding - insurancePending,
      top_services: topServices,
    };
  }

  /**
   * Get outstanding invoices for patient
   */
  async getPatientOutstandingInvoices(patientId: string): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        invoice_date,
        due_date,
        subtotal,
        tax,
        total,
        amount_paid,
        balance,
        status,
        patients(first_name, last_name)
      `)
      .eq('patient_id', patientId)
      .in('status', ['sent', 'partial', 'overdue'])
      .order('due_date', { ascending: true });

    if (error || !data) {
      return [];
    }

    return data.map(inv => ({
      id: inv.id,
      patient_id: patientId,
      patient_name: `${inv.patients.first_name} ${inv.patients.last_name}`,
      clinic_id: '', // Would need to include in query
      invoice_number: inv.invoice_number,
      invoice_date: inv.invoice_date,
      due_date: inv.due_date,
      subtotal: inv.subtotal,
      tax: inv.tax,
      total: inv.total,
      amount_paid: inv.amount_paid,
      balance: inv.balance,
      status: inv.status,
      line_items: [],
    }));
  }

  /**
   * Send invoice to patient (email)
   */
  async sendInvoice(invoiceId: string): Promise<boolean> {
    const { error } = await supabase
      .from('invoices')
      .update({ status: 'sent', updated_at: new Date().toISOString() })
      .eq('id', invoiceId);

    if (error) {
      return false;
    }

    // TODO: Integrate with email service to send actual invoice
    console.log('[BillingService] Invoice sent:', invoiceId);

    return true;
  }

  /**
   * Mark overdue invoices
   */
  async markOverdueInvoices(): Promise<number> {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('invoices')
      .update({ status: 'overdue' })
      .in('status', ['sent', 'partial'])
      .lt('due_date', today)
      .select('id');

    if (error) {
      console.error('[BillingService] Error marking overdue invoices:', error);
      return 0;
    }

    return data?.length || 0;
  }

  /**
   * Process WCB (Workers Compensation Board) claim
   */
  async processWCBClaim(
    patientId: string,
    invoiceId: string,
    claimNumber: string,
    injuryDate: string,
    employerName: string,
    amountClaimed: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Format specific to WCB requirements
      const wcbClaim = {
        patient_id: patientId,
        invoice_id: invoiceId,
        carrier: 'WCB Alberta',
        policy_number: claimNumber,
        claim_number: `WCB-${claimNumber}`,
        claim_date: new Date().toISOString().split('T')[0],
        service_date: injuryDate,
        amount_claimed: amountClaimed,
        status: 'submitted',
        submission_type: 'electronic',
        metadata: {
          employer_name: employerName,
          injury_date: injuryDate,
          wcb_specific: true,
        },
      };

      const { error } = await supabase
        .from('insurance_claims')
        .insert(wcbClaim);

      if (error) {
        return { success: false, error: error.message };
      }

      console.log('[BillingService] WCB claim submitted:', claimNumber);

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

export const billingService = new BillingService();
