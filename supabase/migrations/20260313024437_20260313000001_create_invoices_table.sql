/*
  # Create Invoices and Line Items Tables
  
  ## New Tables
    - `invoices` - Invoice records for billing workflow
    - `invoice_line_items` - Line items for invoices
  
  ## Security
    - RLS enabled with clinic-based isolation
    - Role-based access control for management operations
*/

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES patient_appointments(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
  balance_due NUMERIC(12,2) GENERATED ALWAYS AS (total_amount - amount_paid) STORED,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'partial', 'overdue', 'void', 'cancelled')),
  payment_terms TEXT DEFAULT 'net_30',
  notes TEXT,
  internal_notes TEXT,
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  voided_at TIMESTAMPTZ,
  voided_by UUID REFERENCES user_profiles(id),
  voided_reason TEXT,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(clinic_id, invoice_number)
);

CREATE TABLE IF NOT EXISTS invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL,
  discount_percent NUMERIC(5,2) DEFAULT 0,
  tax_rate NUMERIC(5,2) DEFAULT 0,
  line_total NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_price * (1 - discount_percent/100)) STORED,
  billing_code TEXT,
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoices_clinic ON invoices(clinic_id);
CREATE INDEX IF NOT EXISTS idx_invoices_patient ON invoices(patient_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date) WHERE status NOT IN ('paid', 'void', 'cancelled');
CREATE INDEX IF NOT EXISTS idx_invoice_line_items_invoice ON invoice_line_items(invoice_id);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view clinic invoices"
  ON invoices FOR SELECT TO authenticated
  USING (clinic_id IN (SELECT clinic_id FROM clinic_access WHERE user_id = auth.uid() AND revoked_at IS NULL));

CREATE POLICY "Managers can create invoices"
  ON invoices FOR INSERT TO authenticated
  WITH CHECK (clinic_id IN (
    SELECT ca.clinic_id FROM clinic_access ca
    JOIN user_profiles up ON up.id = auth.uid()
    WHERE ca.user_id = auth.uid() AND ca.revoked_at IS NULL
    AND up.role IN ('admin', 'clinic_manager', 'executive')
  ));

CREATE POLICY "Managers can update invoices"
  ON invoices FOR UPDATE TO authenticated
  USING (clinic_id IN (
    SELECT ca.clinic_id FROM clinic_access ca
    JOIN user_profiles up ON up.id = auth.uid()
    WHERE ca.user_id = auth.uid() AND ca.revoked_at IS NULL
    AND up.role IN ('admin', 'clinic_manager', 'executive')
  ));

CREATE POLICY "Staff can view invoice line items"
  ON invoice_line_items FOR SELECT TO authenticated
  USING (invoice_id IN (
    SELECT id FROM invoices WHERE clinic_id IN (
      SELECT clinic_id FROM clinic_access WHERE user_id = auth.uid() AND revoked_at IS NULL
    )
  ));

CREATE POLICY "Managers can manage invoice line items"
  ON invoice_line_items FOR ALL TO authenticated
  USING (invoice_id IN (
    SELECT id FROM invoices WHERE clinic_id IN (
      SELECT ca.clinic_id FROM clinic_access ca
      JOIN user_profiles up ON up.id = auth.uid()
      WHERE ca.user_id = auth.uid() AND ca.revoked_at IS NULL
      AND up.role IN ('admin', 'clinic_manager', 'executive')
    )
  ));
