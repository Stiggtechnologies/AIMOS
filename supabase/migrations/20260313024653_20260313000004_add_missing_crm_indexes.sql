/*
  # Add Missing Indexes from Audit
  
  Adding indexes identified as missing during the comprehensive audit for:
  - CRM tables
  - Expense tables
  - Purchase request tables
*/

-- CRM indexes
CREATE INDEX IF NOT EXISTS idx_crm_cases_payor_type ON crm_cases(payor_type_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_clinic_source ON crm_leads(clinic_id, lead_source_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_clinic_created ON crm_leads(clinic_id, created_at);
CREATE INDEX IF NOT EXISTS idx_crm_bookings_clinician_scheduled ON crm_bookings(clinician_id, scheduled_at);

-- Expense indexes
CREATE INDEX IF NOT EXISTS idx_expenses_vendor ON expenses(vendor_id);
CREATE INDEX IF NOT EXISTS idx_expenses_clinic_status ON expenses(clinic_id, status);

-- Purchase request indexes  
CREATE INDEX IF NOT EXISTS idx_purchase_requests_clinic_status_submitted ON purchase_requests(clinic_id, status, submitted_at);
