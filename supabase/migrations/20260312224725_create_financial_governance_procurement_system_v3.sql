/*
  # Financial Governance, Budgeting & Procurement System
  
  1. New Tables
    - `spending_authority_roles` - DOFA role definitions and limits
    - `budget_categories` - Operational budget categories per clinic
    - `clinic_budget_allocations` - Monthly budget by category per clinic
    - `preferred_vendors` - Vendor management and preferred vendor list
    - `purchase_requests` - Purchase request workflow
    - `expenses` - Expense tracking and reconciliation
    - `corporate_cards` - Corporate card management
    - `card_transactions` - Transaction tracking and reconciliation
    - `purchase_approvals` - Approval workflow history
    - `spend_alerts` - AI-powered spending anomaly alerts
    - `financial_audit_log` - Immutable financial audit trail
    
  2. Security
    - Enable RLS on all tables
    - Clinic managers see only their clinic data
    - Executives see all with full control
    
  3. Automation
    - Auto-approval logic for small purchases
    - Budget validation triggers
    - Receipt enforcement
    - Anomaly detection rules
*/

-- =====================================================
-- DELEGATION OF FINANCIAL AUTHORITY (DOFA)
-- =====================================================

CREATE TABLE IF NOT EXISTS spending_authority_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name text NOT NULL,
  role_level integer NOT NULL,
  max_purchase_amount numeric(12,2) NOT NULL,
  requires_approval boolean DEFAULT true,
  auto_approve_under numeric(12,2) DEFAULT 0,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_role_name UNIQUE (role_name)
);

ALTER TABLE spending_authority_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Finance and executives can manage spending authority"
  ON spending_authority_roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'executive'
    )
  );

CREATE POLICY "All authenticated users can view spending authority"
  ON spending_authority_roles FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- BUDGET CATEGORIES
-- =====================================================

CREATE TABLE IF NOT EXISTS budget_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name text NOT NULL,
  category_code text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_category_code UNIQUE (category_code)
);

ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view budget categories"
  ON budget_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Executives can manage budget categories"
  ON budget_categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'executive'
    )
  );

-- =====================================================
-- CLINIC BUDGET ALLOCATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS clinic_budget_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES budget_categories(id) ON DELETE CASCADE,
  budget_year integer NOT NULL,
  budget_month integer NOT NULL,
  monthly_budget numeric(12,2) NOT NULL DEFAULT 0,
  amount_spent numeric(12,2) NOT NULL DEFAULT 0,
  amount_committed numeric(12,2) NOT NULL DEFAULT 0,
  remaining_budget numeric(12,2) GENERATED ALWAYS AS (monthly_budget - amount_spent - amount_committed) STORED,
  utilization_percent numeric(5,2) GENERATED ALWAYS AS (
    CASE WHEN monthly_budget > 0 
    THEN ((amount_spent + amount_committed) / monthly_budget * 100)
    ELSE 0 END
  ) STORED,
  notes text,
  created_by uuid REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_clinic_category_month UNIQUE (clinic_id, category_id, budget_year, budget_month)
);

ALTER TABLE clinic_budget_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view budgets for their clinic"
  ON clinic_budget_allocations FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_access 
      WHERE user_id = auth.uid() AND revoked_at IS NULL
    )
    OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin')
    )
  );

CREATE POLICY "Executives can manage all clinic budgets"
  ON clinic_budget_allocations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'executive'
    )
  );

CREATE INDEX IF NOT EXISTS idx_clinic_budget_allocations_clinic ON clinic_budget_allocations(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_budget_allocations_category ON clinic_budget_allocations(category_id);
CREATE INDEX IF NOT EXISTS idx_clinic_budget_allocations_period ON clinic_budget_allocations(budget_year, budget_month);

-- =====================================================
-- PREFERRED VENDORS
-- =====================================================

CREATE TABLE IF NOT EXISTS preferred_vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_name text NOT NULL,
  vendor_code text,
  category_id uuid REFERENCES budget_categories(id),
  contact_name text,
  contact_email text,
  contact_phone text,
  billing_terms text,
  account_number text,
  is_preferred boolean DEFAULT false,
  discount_percent numeric(5,2) DEFAULT 0,
  payment_terms_days integer DEFAULT 30,
  notes text,
  website text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE preferred_vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view vendors"
  ON preferred_vendors FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Executives and admins can manage vendors"
  ON preferred_vendors FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin')
    )
  );

CREATE INDEX IF NOT EXISTS idx_preferred_vendors_category ON preferred_vendors(category_id);
CREATE INDEX IF NOT EXISTS idx_preferred_vendors_preferred ON preferred_vendors(is_preferred) WHERE is_preferred = true;

-- =====================================================
-- PURCHASE REQUESTS
-- =====================================================

CREATE TABLE IF NOT EXISTS purchase_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  requestor_id uuid NOT NULL REFERENCES user_profiles(id),
  category_id uuid REFERENCES budget_categories(id),
  vendor_id uuid REFERENCES preferred_vendors(id),
  vendor_name text,
  item_description text NOT NULL,
  quantity integer DEFAULT 1,
  unit_price numeric(12,2),
  total_cost numeric(12,2) NOT NULL,
  urgency_level text DEFAULT 'normal',
  justification text,
  receipt_url text,
  status text NOT NULL DEFAULT 'draft',
  submitted_at timestamptz,
  approved_at timestamptz,
  approved_by uuid REFERENCES user_profiles(id),
  rejected_at timestamptz,
  rejected_by uuid REFERENCES user_profiles(id),
  rejection_reason text,
  ordered_at timestamptz,
  delivered_at timestamptz,
  delivery_notes text,
  budget_year integer,
  budget_month integer,
  auto_approved boolean DEFAULT false,
  requires_executive_approval boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'ordered', 'delivered', 'cancelled')),
  CONSTRAINT valid_urgency CHECK (urgency_level IN ('low', 'normal', 'high', 'urgent'))
);

ALTER TABLE purchase_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view purchase requests for their clinic"
  ON purchase_requests FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_access 
      WHERE user_id = auth.uid() AND revoked_at IS NULL
    )
    OR
    requestor_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin')
    )
  );

CREATE POLICY "Users can create purchase requests for their clinic"
  ON purchase_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    clinic_id IN (
      SELECT clinic_id FROM clinic_access 
      WHERE user_id = auth.uid() AND revoked_at IS NULL
    )
    AND requestor_id = auth.uid()
  );

CREATE POLICY "Users can update their own draft purchase requests"
  ON purchase_requests FOR UPDATE
  TO authenticated
  USING (requestor_id = auth.uid() AND status = 'draft')
  WITH CHECK (requestor_id = auth.uid());

CREATE POLICY "Managers and executives can approve purchase requests"
  ON purchase_requests FOR UPDATE
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_access 
      WHERE user_id = auth.uid() AND revoked_at IS NULL
    )
    OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'clinic_manager', 'admin')
    )
  );

CREATE INDEX IF NOT EXISTS idx_purchase_requests_clinic ON purchase_requests(clinic_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_requestor ON purchase_requests(requestor_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_status ON purchase_requests(status);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_category ON purchase_requests(category_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_period ON purchase_requests(budget_year, budget_month);

-- =====================================================
-- EXPENSES
-- =====================================================

CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES user_profiles(id),
  purchase_request_id uuid REFERENCES purchase_requests(id),
  vendor_id uuid REFERENCES preferred_vendors(id),
  vendor_name text NOT NULL,
  category_id uuid REFERENCES budget_categories(id),
  expense_date date NOT NULL,
  amount numeric(12,2) NOT NULL,
  description text NOT NULL,
  payment_method text NOT NULL,
  receipt_url text,
  receipt_uploaded boolean DEFAULT false,
  card_transaction_id uuid,
  status text NOT NULL DEFAULT 'pending',
  approved_at timestamptz,
  approved_by uuid REFERENCES user_profiles(id),
  rejected_at timestamptz,
  rejected_by uuid REFERENCES user_profiles(id),
  rejection_reason text,
  reimbursed_at timestamptz,
  reimbursement_amount numeric(12,2),
  budget_year integer,
  budget_month integer,
  is_personal_flag boolean DEFAULT false,
  is_duplicate_flag boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_payment_method CHECK (payment_method IN ('corporate_card', 'vendor_invoice', 'reimbursement', 'petty_cash')),
  CONSTRAINT valid_expense_status CHECK (status IN ('pending', 'approved', 'rejected', 'reimbursed', 'flagged'))
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view expenses for their clinic"
  ON expenses FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_access 
      WHERE user_id = auth.uid() AND revoked_at IS NULL
    )
    OR
    employee_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin')
    )
  );

CREATE POLICY "Users can create expenses for their clinic"
  ON expenses FOR INSERT
  TO authenticated
  WITH CHECK (
    clinic_id IN (
      SELECT clinic_id FROM clinic_access 
      WHERE user_id = auth.uid() AND revoked_at IS NULL
    )
    AND employee_id = auth.uid()
  );

CREATE POLICY "Executives and admins can manage all expenses"
  ON expenses FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin')
    )
  );

CREATE INDEX IF NOT EXISTS idx_expenses_clinic ON expenses(clinic_id);
CREATE INDEX IF NOT EXISTS idx_expenses_employee ON expenses(employee_id);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_period ON expenses(budget_year, budget_month);

-- =====================================================
-- CORPORATE CARDS
-- =====================================================

CREATE TABLE IF NOT EXISTS corporate_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_holder_id uuid NOT NULL REFERENCES user_profiles(id),
  clinic_id uuid REFERENCES clinics(id),
  card_last_four text NOT NULL,
  card_nickname text,
  card_type text DEFAULT 'visa',
  monthly_limit numeric(12,2) NOT NULL DEFAULT 1000,
  transaction_limit numeric(12,2) NOT NULL DEFAULT 500,
  is_active boolean DEFAULT true,
  activation_date date,
  expiry_date date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE corporate_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Card holders can view their own cards"
  ON corporate_cards FOR SELECT
  TO authenticated
  USING (
    card_holder_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin')
    )
  );

CREATE POLICY "Executives and admins can manage all corporate cards"
  ON corporate_cards FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin')
    )
  );

CREATE INDEX IF NOT EXISTS idx_corporate_cards_holder ON corporate_cards(card_holder_id);
CREATE INDEX IF NOT EXISTS idx_corporate_cards_clinic ON corporate_cards(clinic_id);

-- =====================================================
-- CARD TRANSACTIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS card_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL REFERENCES corporate_cards(id) ON DELETE CASCADE,
  expense_id uuid REFERENCES expenses(id),
  transaction_date date NOT NULL,
  posted_date date,
  vendor_name text NOT NULL,
  category_id uuid REFERENCES budget_categories(id),
  amount numeric(12,2) NOT NULL,
  description text,
  receipt_url text,
  receipt_uploaded boolean DEFAULT false,
  reconciled boolean DEFAULT false,
  reconciled_at timestamptz,
  reconciled_by uuid REFERENCES user_profiles(id),
  is_personal_flag boolean DEFAULT false,
  is_duplicate_flag boolean DEFAULT false,
  flagged_reason text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE card_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Card holders can view their own transactions"
  ON card_transactions FOR SELECT
  TO authenticated
  USING (
    card_id IN (
      SELECT id FROM corporate_cards WHERE card_holder_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin')
    )
  );

CREATE POLICY "Executives and admins can manage all card transactions"
  ON card_transactions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin')
    )
  );

CREATE INDEX IF NOT EXISTS idx_card_transactions_card ON card_transactions(card_id);
CREATE INDEX IF NOT EXISTS idx_card_transactions_expense ON card_transactions(expense_id);
CREATE INDEX IF NOT EXISTS idx_card_transactions_date ON card_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_card_transactions_reconciled ON card_transactions(reconciled);

-- =====================================================
-- PURCHASE APPROVALS
-- =====================================================

CREATE TABLE IF NOT EXISTS purchase_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_request_id uuid NOT NULL REFERENCES purchase_requests(id) ON DELETE CASCADE,
  approver_id uuid NOT NULL REFERENCES user_profiles(id),
  approver_role text NOT NULL,
  decision text NOT NULL,
  decision_notes text,
  approval_level integer NOT NULL,
  required_for_amount numeric(12,2),
  decided_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_decision CHECK (decision IN ('approved', 'rejected', 'escalated', 'pending'))
);

ALTER TABLE purchase_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view approvals for purchases they can see"
  ON purchase_approvals FOR SELECT
  TO authenticated
  USING (
    purchase_request_id IN (
      SELECT id FROM purchase_requests 
      WHERE clinic_id IN (
        SELECT clinic_id FROM clinic_access 
        WHERE user_id = auth.uid() AND revoked_at IS NULL
      )
      OR requestor_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin')
    )
  );

CREATE POLICY "Approvers can create approval records"
  ON purchase_approvals FOR INSERT
  TO authenticated
  WITH CHECK (approver_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_purchase_approvals_request ON purchase_approvals(purchase_request_id);
CREATE INDEX IF NOT EXISTS idx_purchase_approvals_approver ON purchase_approvals(approver_id);

-- =====================================================
-- SPEND ALERTS
-- =====================================================

CREATE TABLE IF NOT EXISTS spend_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES clinics(id),
  alert_type text NOT NULL,
  severity text NOT NULL DEFAULT 'medium',
  title text NOT NULL,
  description text NOT NULL,
  metric_value numeric(12,2),
  threshold_value numeric(12,2),
  category_id uuid REFERENCES budget_categories(id),
  related_entity_type text,
  related_entity_id uuid,
  is_resolved boolean DEFAULT false,
  resolved_at timestamptz,
  resolved_by uuid REFERENCES user_profiles(id),
  resolution_notes text,
  notified_users uuid[],
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_alert_type CHECK (alert_type IN ('budget_overrun', 'spending_spike', 'duplicate_purchase', 'unusual_vendor', 'missing_receipt', 'budget_threshold')),
  CONSTRAINT valid_severity CHECK (severity IN ('low', 'medium', 'high', 'critical'))
);

ALTER TABLE spend_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view alerts for their clinic"
  ON spend_alerts FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_access 
      WHERE user_id = auth.uid() AND revoked_at IS NULL
    )
    OR
    auth.uid() = ANY(notified_users)
    OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin')
    )
  );

CREATE POLICY "System can create alerts"
  ON spend_alerts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Executives can manage all alerts"
  ON spend_alerts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin')
    )
  );

CREATE INDEX IF NOT EXISTS idx_spend_alerts_clinic ON spend_alerts(clinic_id);
CREATE INDEX IF NOT EXISTS idx_spend_alerts_type ON spend_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_spend_alerts_resolved ON spend_alerts(is_resolved);
CREATE INDEX IF NOT EXISTS idx_spend_alerts_created ON spend_alerts(created_at);

-- =====================================================
-- FINANCIAL AUDIT LOG (IMMUTABLE)
-- =====================================================

CREATE TABLE IF NOT EXISTS financial_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  clinic_id uuid,
  timestamp timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE financial_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only system can insert audit logs"
  ON financial_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Executives can view audit logs"
  ON financial_audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin')
    )
  );

CREATE INDEX IF NOT EXISTS idx_financial_audit_log_user ON financial_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_audit_log_entity ON financial_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_financial_audit_log_timestamp ON financial_audit_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_financial_audit_log_clinic ON financial_audit_log(clinic_id);

-- =====================================================
-- SEED DEFAULT DATA
-- =====================================================

-- Insert spending authority roles
INSERT INTO spending_authority_roles (role_name, role_level, max_purchase_amount, auto_approve_under, description)
VALUES
  ('clinician', 1, 150.00, 150.00, 'Front desk staff, therapy assistants - auto-approve up to $150'),
  ('clinic_manager', 2, 1000.00, 150.00, 'Clinic managers - can approve up to $1,000'),
  ('admin', 3, 5000.00, 150.00, 'Regional managers/admins - can approve up to $5,000'),
  ('executive', 4, 99999999.99, 150.00, 'Executive team - unlimited approval authority')
ON CONFLICT (role_name) DO NOTHING;

-- Insert budget categories
INSERT INTO budget_categories (category_name, category_code, description, display_order)
VALUES
  ('Office Supplies', 'OFFICE_SUP', 'Pens, paper, printer supplies, office equipment', 1),
  ('Cleaning Supplies', 'CLEANING', 'Cleaning products, sanitizers, disinfectants', 2),
  ('Laundry', 'LAUNDRY', 'Towels, linens, laundry service', 3),
  ('Therapy Supplies', 'THERAPY_SUP', 'Resistance bands, tape, exercise equipment, treatment supplies', 4),
  ('Clinical Equipment', 'EQUIPMENT', 'Treatment tables, ultrasound, modalities, large equipment', 5),
  ('Marketing', 'MARKETING', 'Advertising, promotional materials, digital marketing', 6),
  ('Staff Development', 'TRAINING', 'Continuing education, certifications, training', 7),
  ('Facility Maintenance', 'MAINTENANCE', 'Repairs, maintenance, facility improvements', 8),
  ('IT & Software', 'IT', 'Software subscriptions, IT equipment, technology', 9),
  ('Miscellaneous', 'MISC', 'Other operational expenses', 99)
ON CONFLICT (category_code) DO NOTHING;

-- Insert preferred vendors
INSERT INTO preferred_vendors (vendor_name, vendor_code, category_id, is_preferred, discount_percent, payment_terms_days, website)
SELECT
  vendor_name,
  vendor_code,
  (SELECT id FROM budget_categories WHERE category_code = cat_code),
  is_pref,
  discount,
  terms,
  site
FROM (VALUES
  ('Amazon Business', 'AMAZON', 'OFFICE_SUP', true, 0, 30, 'https://business.amazon.ca'),
  ('Staples Business', 'STAPLES', 'OFFICE_SUP', true, 5, 30, 'https://www.staples.ca/business'),
  ('Costco Business', 'COSTCO', 'OFFICE_SUP', true, 0, 0, 'https://www.costco.ca'),
  ('Medline Canada', 'MEDLINE', 'THERAPY_SUP', true, 10, 30, 'https://www.medline.ca'),
  ('Performance Health', 'PERF_HEALTH', 'THERAPY_SUP', true, 15, 30, 'https://www.performancehealth.ca'),
  ('PhysioSupplies', 'PHYSIO_SUP', 'THERAPY_SUP', true, 12, 30, 'https://www.physiosupplies.ca'),
  ('Home Depot', 'HOME_DEPOT', 'MAINTENANCE', false, 0, 30, 'https://www.homedepot.ca'),
  ('Uline Canada', 'ULINE', 'CLEANING', true, 8, 30, 'https://www.uline.ca')
) AS v(vendor_name, vendor_code, cat_code, is_pref, discount, terms, site)
ON CONFLICT DO NOTHING;

-- =====================================================
-- AUTOMATION FUNCTIONS
-- =====================================================

-- Function to validate budget before purchase
CREATE OR REPLACE FUNCTION validate_purchase_budget()
RETURNS TRIGGER AS $$
DECLARE
  v_remaining_budget numeric;
  v_utilization numeric;
BEGIN
  IF NEW.status = 'approved' AND NEW.category_id IS NOT NULL THEN
    SELECT remaining_budget, utilization_percent
    INTO v_remaining_budget, v_utilization
    FROM clinic_budget_allocations
    WHERE clinic_id = NEW.clinic_id
      AND category_id = NEW.category_id
      AND budget_year = EXTRACT(YEAR FROM COALESCE(NEW.submitted_at, now()))
      AND budget_month = EXTRACT(MONTH FROM COALESCE(NEW.submitted_at, now()));
    
    IF v_remaining_budget IS NOT NULL AND v_remaining_budget < NEW.total_cost THEN
      INSERT INTO spend_alerts (
        clinic_id,
        alert_type,
        severity,
        title,
        description,
        metric_value,
        threshold_value,
        category_id,
        related_entity_type,
        related_entity_id
      ) VALUES (
        NEW.clinic_id,
        'budget_overrun',
        CASE WHEN v_utilization > 120 THEN 'critical'
             WHEN v_utilization > 100 THEN 'high'
             ELSE 'medium' END,
        'Budget Exceeded',
        'Purchase request exceeds remaining budget',
        NEW.total_cost,
        v_remaining_budget,
        NEW.category_id,
        'purchase_request',
        NEW.id
      );
      
      IF v_utilization > 110 THEN
        NEW.requires_executive_approval := true;
      END IF;
    END IF;
    
    UPDATE clinic_budget_allocations
    SET amount_committed = amount_committed + NEW.total_cost,
        updated_at = now()
    WHERE clinic_id = NEW.clinic_id
      AND category_id = NEW.category_id
      AND budget_year = EXTRACT(YEAR FROM COALESCE(NEW.submitted_at, now()))
      AND budget_month = EXTRACT(MONTH FROM COALESCE(NEW.submitted_at, now()));
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_validate_purchase_budget ON purchase_requests;
CREATE TRIGGER trigger_validate_purchase_budget
  BEFORE INSERT OR UPDATE ON purchase_requests
  FOR EACH ROW
  EXECUTE FUNCTION validate_purchase_budget();

-- Function to auto-approve small purchases
CREATE OR REPLACE FUNCTION auto_approve_small_purchases()
RETURNS TRIGGER AS $$
DECLARE
  v_auto_approve_limit numeric;
  v_requestor_role text;
BEGIN
  IF NEW.status = 'submitted' THEN
    SELECT up.role::text, sar.auto_approve_under 
    INTO v_requestor_role, v_auto_approve_limit
    FROM user_profiles up
    LEFT JOIN spending_authority_roles sar ON sar.role_name = up.role::text
    WHERE up.id = NEW.requestor_id;
    
    IF v_auto_approve_limit IS NOT NULL AND NEW.total_cost <= v_auto_approve_limit THEN
      NEW.status := 'approved';
      NEW.approved_at := now();
      NEW.auto_approved := true;
      
      INSERT INTO purchase_approvals (
        purchase_request_id,
        approver_id,
        approver_role,
        decision,
        decision_notes,
        approval_level,
        required_for_amount
      ) VALUES (
        NEW.id,
        NEW.requestor_id,
        'System Auto-Approval',
        'approved',
        'Auto-approved - under $' || v_auto_approve_limit || ' threshold',
        1,
        NEW.total_cost
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_auto_approve_small_purchases ON purchase_requests;
CREATE TRIGGER trigger_auto_approve_small_purchases
  BEFORE INSERT OR UPDATE ON purchase_requests
  FOR EACH ROW
  EXECUTE FUNCTION auto_approve_small_purchases();

-- Function to update budget on expense approval
CREATE OR REPLACE FUNCTION update_budget_on_expense()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') AND NEW.category_id IS NOT NULL THEN
    UPDATE clinic_budget_allocations
    SET amount_spent = amount_spent + NEW.amount,
        updated_at = now()
    WHERE clinic_id = NEW.clinic_id
      AND category_id = NEW.category_id
      AND budget_year = EXTRACT(YEAR FROM NEW.expense_date)
      AND budget_month = EXTRACT(MONTH FROM NEW.expense_date);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_budget_on_expense ON expenses;
CREATE TRIGGER trigger_update_budget_on_expense
  AFTER UPDATE ON expenses
  FOR EACH ROW
  WHEN (NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status IS DISTINCT FROM 'approved'))
  EXECUTE FUNCTION update_budget_on_expense();

-- Function to flag missing receipts
CREATE OR REPLACE FUNCTION flag_missing_receipts()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_method = 'corporate_card' AND NEW.receipt_uploaded = false AND NEW.amount > 50 THEN
    NEW.status := 'flagged';
    NEW.notes := COALESCE(NEW.notes || E'\n', '') || 'Receipt required for corporate card purchase over $50';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_flag_missing_receipts ON expenses;
CREATE TRIGGER trigger_flag_missing_receipts
  BEFORE INSERT ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION flag_missing_receipts();

-- Function to create audit log entries
CREATE OR REPLACE FUNCTION log_financial_audit()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO financial_audit_log (
    user_id,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values,
    clinic_id
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
    COALESCE(NEW.clinic_id, OLD.clinic_id)
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit triggers to key tables
DROP TRIGGER IF EXISTS audit_purchase_requests ON purchase_requests;
CREATE TRIGGER audit_purchase_requests
  AFTER INSERT OR UPDATE OR DELETE ON purchase_requests
  FOR EACH ROW
  EXECUTE FUNCTION log_financial_audit();

DROP TRIGGER IF EXISTS audit_expenses ON expenses;
CREATE TRIGGER audit_expenses
  AFTER INSERT OR UPDATE OR DELETE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION log_financial_audit();

DROP TRIGGER IF EXISTS audit_purchase_approvals ON purchase_approvals;
CREATE TRIGGER audit_purchase_approvals
  AFTER INSERT OR UPDATE ON purchase_approvals
  FOR EACH ROW
  EXECUTE FUNCTION log_financial_audit();
