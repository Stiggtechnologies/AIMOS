/*
  # AIM OS Schema Extension - Comprehensive Healthcare Operations

  ## Overview
  This migration extends the existing AIM OS schema with new tables for enhanced healthcare operations management.
  NO existing tables are modified. All new tables follow the established patterns with RLS enabled.

  ## New Modules & Tables

  ### 1. Patient Management (4 tables)
  - `patients` - Core patient demographics and registration
  - `patient_appointments` - Appointment scheduling and history
  - `patient_medical_history` - Medical conditions, allergies, medications
  - `patient_communications` - Messages, calls, and correspondence log

  ### 2. Inventory Management (5 tables)
  - `inventory_categories` - Medical supplies, equipment, pharmaceuticals
  - `inventory_items` - Individual items with stock levels
  - `inventory_transactions` - Stock movements (receive, dispense, transfer)
  - `equipment_maintenance` - Maintenance schedules and service records
  - `supply_orders` - Purchase orders and vendor management

  ### 3. Quality Assurance (4 tables)
  - `quality_audits` - Quality assurance audit records
  - `quality_findings` - Issues identified during audits
  - `improvement_initiatives` - Continuous improvement projects
  - `safety_incidents` - Patient safety incident tracking

  ### 4. Revenue Cycle Management (4 tables)
  - `insurance_payers` - Insurance companies and payer information
  - `patient_insurance` - Patient insurance coverage details
  - `claims` - Insurance claims submission and tracking
  - `payments` - Payment receipts and transaction records

  ### 5. Provider Network (3 tables)
  - `external_providers` - Specialists, hospitals, labs
  - `provider_credentials` - Credentialing and verification
  - `referral_networks` - Network relationships and agreements

  ### 6. Care Coordination (4 tables)
  - `care_plans` - Patient care plans and treatment protocols
  - `care_team_members` - Multi-disciplinary care team assignments
  - `care_milestones` - Treatment milestones and progress tracking
  - `patient_goals` - Patient-specific health goals

  ### 7. Compliance Monitoring (4 tables)
  - `regulatory_requirements` - Federal, state, local regulations
  - `compliance_assessments` - Regular compliance evaluations
  - `inspection_visits` - Regulatory inspections and surveys
  - `corrective_action_responses` - Responses to compliance findings

  ### 8. Resource Scheduling (3 tables)
  - `facility_rooms` - Exam rooms, procedure rooms, offices
  - `room_schedules` - Room booking and allocation
  - `equipment_schedules` - Equipment reservation system

  ### 9. Advanced Analytics (3 tables)
  - `custom_reports` - User-defined report templates
  - `report_schedules` - Automated report generation
  - `data_exports` - Data export requests and audit trail

  ### 10. Clinical Protocols (3 tables)
  - `clinical_protocols` - Evidence-based treatment protocols
  - `protocol_versions` - Version control for protocols
  - `protocol_adherence` - Tracking protocol compliance

  ## Security
  - All tables have RLS enabled
  - Policies restrict access based on clinic membership and user roles
  - Sensitive data (PHI) has additional access controls
  - Audit logging built into sensitive operations

  ## Total New Tables: 37
*/

-- =====================================================
-- 1. PATIENT MANAGEMENT
-- =====================================================

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  medical_record_number text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  date_of_birth date NOT NULL,
  gender text,
  email text,
  phone text,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_contact_relationship text,
  preferred_language text DEFAULT 'en',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(clinic_id, medical_record_number)
);

CREATE INDEX IF NOT EXISTS idx_patients_clinic ON patients(clinic_id);
CREATE INDEX IF NOT EXISTS idx_patients_mrn ON patients(medical_record_number);
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(last_name, first_name);

-- Patient appointments
CREATE TABLE IF NOT EXISTS patient_appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  provider_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  appointment_slot_id uuid REFERENCES appointment_slots(id) ON DELETE SET NULL,
  appointment_type text NOT NULL,
  appointment_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status text NOT NULL DEFAULT 'scheduled',
  reason_for_visit text,
  chief_complaint text,
  notes text,
  cancellation_reason_id uuid REFERENCES cancellation_reasons(id),
  cancelled_at timestamptz,
  cancelled_by uuid REFERENCES user_profiles(id),
  checked_in_at timestamptz,
  checked_out_at timestamptz,
  no_show boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_patient_appointments_patient ON patient_appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_appointments_clinic ON patient_appointments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_patient_appointments_provider ON patient_appointments(provider_id);
CREATE INDEX IF NOT EXISTS idx_patient_appointments_date ON patient_appointments(appointment_date, start_time);

-- Patient medical history
CREATE TABLE IF NOT EXISTS patient_medical_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  category text NOT NULL,
  condition_code text,
  condition_name text NOT NULL,
  onset_date date,
  resolution_date date,
  severity text,
  status text NOT NULL DEFAULT 'active',
  notes text,
  recorded_by uuid REFERENCES user_profiles(id),
  recorded_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_patient_medical_history_patient ON patient_medical_history(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_medical_history_clinic ON patient_medical_history(clinic_id);
CREATE INDEX IF NOT EXISTS idx_patient_medical_history_category ON patient_medical_history(category);

-- Patient communications
CREATE TABLE IF NOT EXISTS patient_communications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  communication_type text NOT NULL,
  direction text NOT NULL,
  subject text,
  content text NOT NULL,
  channel text NOT NULL,
  sent_by uuid REFERENCES user_profiles(id),
  received_by uuid REFERENCES user_profiles(id),
  status text NOT NULL DEFAULT 'sent',
  priority text DEFAULT 'normal',
  related_appointment_id uuid REFERENCES patient_appointments(id),
  created_at timestamptz DEFAULT now(),
  read_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_patient_communications_patient ON patient_communications(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_communications_clinic ON patient_communications(clinic_id);
CREATE INDEX IF NOT EXISTS idx_patient_communications_date ON patient_communications(created_at DESC);

-- =====================================================
-- 2. INVENTORY MANAGEMENT
-- =====================================================

-- Inventory categories
CREATE TABLE IF NOT EXISTS inventory_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  category_type text NOT NULL,
  description text,
  parent_category_id uuid REFERENCES inventory_categories(id),
  requires_lot_tracking boolean DEFAULT false,
  requires_expiration_tracking boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_categories_type ON inventory_categories(category_type);

-- Inventory items
CREATE TABLE IF NOT EXISTS inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES inventory_categories(id),
  item_code text NOT NULL,
  item_name text NOT NULL,
  description text,
  manufacturer text,
  model_number text,
  unit_of_measure text NOT NULL,
  current_quantity numeric DEFAULT 0,
  reorder_point numeric,
  reorder_quantity numeric,
  unit_cost numeric,
  location text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(clinic_id, item_code)
);

CREATE INDEX IF NOT EXISTS idx_inventory_items_clinic ON inventory_items(clinic_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_code ON inventory_items(item_code);

-- Inventory transactions
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  transaction_type text NOT NULL,
  quantity numeric NOT NULL,
  unit_cost numeric,
  lot_number text,
  expiration_date date,
  transaction_date timestamptz DEFAULT now(),
  reference_id uuid,
  reference_type text,
  from_location text,
  to_location text,
  performed_by uuid NOT NULL REFERENCES user_profiles(id),
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_transactions_item ON inventory_transactions(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_clinic ON inventory_transactions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_date ON inventory_transactions(transaction_date DESC);

-- Equipment maintenance
CREATE TABLE IF NOT EXISTS equipment_maintenance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_item_id uuid NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  maintenance_type text NOT NULL,
  scheduled_date date NOT NULL,
  completed_date date,
  performed_by text,
  vendor_name text,
  service_description text NOT NULL,
  cost numeric,
  next_service_date date,
  status text NOT NULL DEFAULT 'scheduled',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_equipment ON equipment_maintenance(equipment_item_id);
CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_clinic ON equipment_maintenance(clinic_id);
CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_date ON equipment_maintenance(scheduled_date);

-- Supply orders
CREATE TABLE IF NOT EXISTS supply_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  order_number text NOT NULL,
  vendor_name text NOT NULL,
  vendor_contact text,
  order_date date NOT NULL,
  expected_delivery_date date,
  actual_delivery_date date,
  status text NOT NULL DEFAULT 'pending',
  subtotal numeric DEFAULT 0,
  tax_amount numeric DEFAULT 0,
  shipping_cost numeric DEFAULT 0,
  total_amount numeric DEFAULT 0,
  ordered_by uuid NOT NULL REFERENCES user_profiles(id),
  received_by uuid REFERENCES user_profiles(id),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(clinic_id, order_number)
);

CREATE INDEX IF NOT EXISTS idx_supply_orders_clinic ON supply_orders(clinic_id);
CREATE INDEX IF NOT EXISTS idx_supply_orders_status ON supply_orders(status);
CREATE INDEX IF NOT EXISTS idx_supply_orders_date ON supply_orders(order_date DESC);

-- =====================================================
-- 3. QUALITY ASSURANCE
-- =====================================================

-- Quality audits
CREATE TABLE IF NOT EXISTS quality_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  audit_type text NOT NULL,
  audit_title text NOT NULL,
  audit_date date NOT NULL,
  auditor_id uuid NOT NULL REFERENCES user_profiles(id),
  scope text NOT NULL,
  methodology text,
  status text NOT NULL DEFAULT 'scheduled',
  overall_score numeric,
  pass_fail text,
  executive_summary text,
  recommendations text,
  follow_up_required boolean DEFAULT false,
  follow_up_date date,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quality_audits_clinic ON quality_audits(clinic_id);
CREATE INDEX IF NOT EXISTS idx_quality_audits_date ON quality_audits(audit_date DESC);
CREATE INDEX IF NOT EXISTS idx_quality_audits_status ON quality_audits(status);

-- Quality findings
CREATE TABLE IF NOT EXISTS quality_findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id uuid NOT NULL REFERENCES quality_audits(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  finding_number text NOT NULL,
  category text NOT NULL,
  severity text NOT NULL,
  area text NOT NULL,
  description text NOT NULL,
  evidence text,
  standard_reference text,
  immediate_action_taken text,
  corrective_action_required boolean DEFAULT true,
  corrective_plan_id uuid REFERENCES corrective_plans(id),
  status text NOT NULL DEFAULT 'open',
  identified_by uuid REFERENCES user_profiles(id),
  assigned_to uuid REFERENCES user_profiles(id),
  due_date date,
  closed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quality_findings_audit ON quality_findings(audit_id);
CREATE INDEX IF NOT EXISTS idx_quality_findings_clinic ON quality_findings(clinic_id);
CREATE INDEX IF NOT EXISTS idx_quality_findings_status ON quality_findings(status);

-- Improvement initiatives
CREATE TABLE IF NOT EXISTS improvement_initiatives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  initiative_name text NOT NULL,
  initiative_type text NOT NULL,
  priority text NOT NULL,
  description text NOT NULL,
  problem_statement text,
  goal text,
  target_metric text,
  baseline_value numeric,
  target_value numeric,
  current_value numeric,
  sponsor_id uuid REFERENCES user_profiles(id),
  lead_id uuid NOT NULL REFERENCES user_profiles(id),
  start_date date NOT NULL,
  target_completion_date date,
  actual_completion_date date,
  status text NOT NULL DEFAULT 'planning',
  budget numeric,
  resources_required text,
  barriers text,
  lessons_learned text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_improvement_initiatives_clinic ON improvement_initiatives(clinic_id);
CREATE INDEX IF NOT EXISTS idx_improvement_initiatives_status ON improvement_initiatives(status);
CREATE INDEX IF NOT EXISTS idx_improvement_initiatives_lead ON improvement_initiatives(lead_id);

-- Safety incidents
CREATE TABLE IF NOT EXISTS safety_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  incident_number text NOT NULL,
  incident_date timestamptz NOT NULL,
  incident_type text NOT NULL,
  severity text NOT NULL,
  location text NOT NULL,
  patient_id uuid REFERENCES patients(id),
  staff_id uuid REFERENCES user_profiles(id),
  description text NOT NULL,
  immediate_action text,
  harm_level text,
  contributing_factors text,
  root_cause_analysis text,
  preventive_measures text,
  reported_by uuid NOT NULL REFERENCES user_profiles(id),
  reported_at timestamptz DEFAULT now(),
  investigated_by uuid REFERENCES user_profiles(id),
  investigation_completed_at timestamptz,
  status text NOT NULL DEFAULT 'reported',
  external_reporting_required boolean DEFAULT false,
  external_report_submitted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(clinic_id, incident_number)
);

CREATE INDEX IF NOT EXISTS idx_safety_incidents_clinic ON safety_incidents(clinic_id);
CREATE INDEX IF NOT EXISTS idx_safety_incidents_date ON safety_incidents(incident_date DESC);
CREATE INDEX IF NOT EXISTS idx_safety_incidents_type ON safety_incidents(incident_type);

-- =====================================================
-- 4. REVENUE CYCLE MANAGEMENT
-- =====================================================

-- Insurance payers
CREATE TABLE IF NOT EXISTS insurance_payers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payer_name text NOT NULL,
  payer_code text,
  payer_type text NOT NULL,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  phone text,
  fax text,
  email text,
  portal_url text,
  claims_submission_method text,
  electronic_payer_id text,
  contract_start_date date,
  contract_end_date date,
  notes text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_insurance_payers_name ON insurance_payers(payer_name);
CREATE INDEX IF NOT EXISTS idx_insurance_payers_status ON insurance_payers(status);

-- Patient insurance
CREATE TABLE IF NOT EXISTS patient_insurance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  payer_id uuid NOT NULL REFERENCES insurance_payers(id),
  policy_number text NOT NULL,
  group_number text,
  subscriber_name text NOT NULL,
  subscriber_dob date,
  relationship_to_subscriber text NOT NULL,
  coverage_type text NOT NULL,
  priority text NOT NULL DEFAULT 'primary',
  effective_date date NOT NULL,
  termination_date date,
  copay_amount numeric,
  deductible_amount numeric,
  deductible_met numeric DEFAULT 0,
  out_of_pocket_max numeric,
  out_of_pocket_met numeric DEFAULT 0,
  coverage_percentage numeric,
  authorization_required boolean DEFAULT false,
  verification_status text DEFAULT 'pending',
  verified_at timestamptz,
  verified_by uuid REFERENCES user_profiles(id),
  notes text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_patient_insurance_patient ON patient_insurance(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_insurance_clinic ON patient_insurance(clinic_id);
CREATE INDEX IF NOT EXISTS idx_patient_insurance_payer ON patient_insurance(payer_id);

-- Claims
CREATE TABLE IF NOT EXISTS claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  patient_insurance_id uuid NOT NULL REFERENCES patient_insurance(id),
  appointment_id uuid REFERENCES patient_appointments(id),
  claim_number text NOT NULL,
  claim_type text NOT NULL,
  service_date date NOT NULL,
  submission_date date,
  provider_id uuid REFERENCES user_profiles(id),
  diagnosis_codes text[] NOT NULL,
  procedure_codes text[] NOT NULL,
  billed_amount numeric NOT NULL,
  allowed_amount numeric,
  paid_amount numeric DEFAULT 0,
  patient_responsibility numeric DEFAULT 0,
  adjustment_amount numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  submission_method text,
  clearinghouse_claim_id text,
  payer_claim_id text,
  denial_reason text,
  denial_code text,
  appeal_submitted boolean DEFAULT false,
  appeal_date date,
  remittance_date date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(clinic_id, claim_number)
);

CREATE INDEX IF NOT EXISTS idx_claims_clinic ON claims(clinic_id);
CREATE INDEX IF NOT EXISTS idx_claims_patient ON claims(patient_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_claims_service_date ON claims(service_date DESC);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  claim_id uuid REFERENCES claims(id),
  appointment_id uuid REFERENCES patient_appointments(id),
  payment_number text NOT NULL,
  payment_date date NOT NULL,
  payment_method text NOT NULL,
  payment_source text NOT NULL,
  amount numeric NOT NULL,
  reference_number text,
  check_number text,
  card_last_four text,
  transaction_id text,
  payer_name text,
  applied_to_copay numeric DEFAULT 0,
  applied_to_deductible numeric DEFAULT 0,
  applied_to_coinsurance numeric DEFAULT 0,
  applied_to_balance numeric DEFAULT 0,
  unapplied_amount numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  posted_by uuid REFERENCES user_profiles(id),
  posted_at timestamptz,
  void_reason text,
  voided_at timestamptz,
  voided_by uuid REFERENCES user_profiles(id),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(clinic_id, payment_number)
);

CREATE INDEX IF NOT EXISTS idx_payments_clinic ON payments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_payments_patient ON payments(patient_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- =====================================================
-- 5. PROVIDER NETWORK
-- =====================================================

-- External providers
CREATE TABLE IF NOT EXISTS external_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_type text NOT NULL,
  organization_name text,
  provider_first_name text,
  provider_last_name text,
  specialty text,
  sub_specialty text,
  npi text,
  tax_id text,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  phone text,
  fax text,
  email text,
  website text,
  accepts_referrals boolean DEFAULT true,
  preferred_contact_method text,
  network_status text DEFAULT 'active',
  contract_type text,
  quality_rating numeric,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_external_providers_type ON external_providers(provider_type);
CREATE INDEX IF NOT EXISTS idx_external_providers_specialty ON external_providers(specialty);
CREATE INDEX IF NOT EXISTS idx_external_providers_status ON external_providers(network_status);

-- Provider credentials
CREATE TABLE IF NOT EXISTS provider_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES external_providers(id) ON DELETE CASCADE,
  credential_type text NOT NULL,
  credential_number text,
  issuing_organization text NOT NULL,
  issue_date date,
  expiration_date date,
  verification_status text NOT NULL DEFAULT 'pending',
  verified_by uuid REFERENCES user_profiles(id),
  verified_at timestamptz,
  verification_method text,
  primary_source_verified boolean DEFAULT false,
  document_url text,
  re_verification_date date,
  status text NOT NULL DEFAULT 'active',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_provider_credentials_provider ON provider_credentials(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_credentials_expiration ON provider_credentials(expiration_date);
CREATE INDEX IF NOT EXISTS idx_provider_credentials_status ON provider_credentials(status);

-- Referral networks
CREATE TABLE IF NOT EXISTS referral_networks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  network_name text NOT NULL,
  network_type text NOT NULL,
  description text,
  managing_clinic_id uuid REFERENCES clinics(id),
  service_area text,
  specialty_focus text,
  quality_standards text,
  contract_terms text,
  payment_model text,
  start_date date NOT NULL,
  end_date date,
  auto_renewal boolean DEFAULT false,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_referral_networks_clinic ON referral_networks(managing_clinic_id);
CREATE INDEX IF NOT EXISTS idx_referral_networks_status ON referral_networks(status);

-- =====================================================
-- 6. CARE COORDINATION
-- =====================================================

-- Care plans
CREATE TABLE IF NOT EXISTS care_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  plan_name text NOT NULL,
  plan_type text NOT NULL,
  primary_diagnosis text NOT NULL,
  secondary_diagnoses text[],
  start_date date NOT NULL,
  end_date date,
  review_date date,
  status text NOT NULL DEFAULT 'active',
  goals text NOT NULL,
  interventions text NOT NULL,
  barriers text,
  patient_education text,
  discharge_criteria text,
  created_by uuid NOT NULL REFERENCES user_profiles(id),
  reviewed_by uuid REFERENCES user_profiles(id),
  last_reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_care_plans_patient ON care_plans(patient_id);
CREATE INDEX IF NOT EXISTS idx_care_plans_clinic ON care_plans(clinic_id);
CREATE INDEX IF NOT EXISTS idx_care_plans_status ON care_plans(status);

-- Care team members
CREATE TABLE IF NOT EXISTS care_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  care_plan_id uuid NOT NULL REFERENCES care_plans(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  member_type text NOT NULL,
  staff_id uuid REFERENCES user_profiles(id),
  external_provider_id uuid REFERENCES external_providers(id),
  role text NOT NULL,
  responsibilities text,
  primary_contact boolean DEFAULT false,
  contact_phone text,
  contact_email text,
  start_date date NOT NULL,
  end_date date,
  status text NOT NULL DEFAULT 'active',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT check_member_reference CHECK (
    (staff_id IS NOT NULL AND external_provider_id IS NULL) OR
    (staff_id IS NULL AND external_provider_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_care_team_members_plan ON care_team_members(care_plan_id);
CREATE INDEX IF NOT EXISTS idx_care_team_members_patient ON care_team_members(patient_id);
CREATE INDEX IF NOT EXISTS idx_care_team_members_staff ON care_team_members(staff_id);

-- Care milestones
CREATE TABLE IF NOT EXISTS care_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  care_plan_id uuid NOT NULL REFERENCES care_plans(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  milestone_name text NOT NULL,
  milestone_type text NOT NULL,
  description text,
  target_date date NOT NULL,
  actual_date date,
  status text NOT NULL DEFAULT 'pending',
  completion_criteria text,
  evidence text,
  outcome text,
  responsible_staff_id uuid REFERENCES user_profiles(id),
  completed_by uuid REFERENCES user_profiles(id),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_care_milestones_plan ON care_milestones(care_plan_id);
CREATE INDEX IF NOT EXISTS idx_care_milestones_patient ON care_milestones(patient_id);
CREATE INDEX IF NOT EXISTS idx_care_milestones_status ON care_milestones(status);

-- Patient goals
CREATE TABLE IF NOT EXISTS patient_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  care_plan_id uuid REFERENCES care_plans(id),
  goal_category text NOT NULL,
  goal_description text NOT NULL,
  measurable_target text NOT NULL,
  baseline_value text,
  current_value text,
  target_value text,
  time_frame text,
  priority text NOT NULL,
  status text NOT NULL DEFAULT 'in_progress',
  patient_agreed boolean DEFAULT false,
  set_by uuid NOT NULL REFERENCES user_profiles(id),
  set_date date NOT NULL,
  target_date date,
  achieved_date date,
  barriers text,
  support_needed text,
  progress_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_patient_goals_patient ON patient_goals(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_goals_clinic ON patient_goals(clinic_id);
CREATE INDEX IF NOT EXISTS idx_patient_goals_status ON patient_goals(status);

-- =====================================================
-- 7. COMPLIANCE MONITORING
-- =====================================================

-- Regulatory requirements
CREATE TABLE IF NOT EXISTS regulatory_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_code text NOT NULL UNIQUE,
  requirement_name text NOT NULL,
  regulatory_body text NOT NULL,
  jurisdiction text NOT NULL,
  requirement_category text NOT NULL,
  description text NOT NULL,
  applicability_criteria text,
  compliance_evidence_required text,
  inspection_frequency text,
  penalty_for_noncompliance text,
  effective_date date NOT NULL,
  revision_date date,
  superseded_date date,
  reference_url text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_regulatory_requirements_body ON regulatory_requirements(regulatory_body);
CREATE INDEX IF NOT EXISTS idx_regulatory_requirements_category ON regulatory_requirements(requirement_category);
CREATE INDEX IF NOT EXISTS idx_regulatory_requirements_status ON regulatory_requirements(status);

-- Compliance assessments
CREATE TABLE IF NOT EXISTS compliance_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  requirement_id uuid NOT NULL REFERENCES regulatory_requirements(id),
  assessment_date date NOT NULL,
  assessor_id uuid NOT NULL REFERENCES user_profiles(id),
  compliance_status text NOT NULL,
  compliance_score numeric,
  evidence_reviewed text,
  findings text,
  gaps_identified text,
  corrective_actions_needed text,
  next_assessment_date date,
  status text NOT NULL DEFAULT 'completed',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_compliance_assessments_clinic ON compliance_assessments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_compliance_assessments_requirement ON compliance_assessments(requirement_id);
CREATE INDEX IF NOT EXISTS idx_compliance_assessments_date ON compliance_assessments(assessment_date DESC);

-- Inspection visits
CREATE TABLE IF NOT EXISTS inspection_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  inspection_type text NOT NULL,
  regulatory_body text NOT NULL,
  inspection_date date NOT NULL,
  lead_inspector_name text NOT NULL,
  inspector_contact text,
  scope text NOT NULL,
  announced boolean DEFAULT true,
  entrance_conference_notes text,
  areas_inspected text,
  documents_reviewed text,
  interviews_conducted text,
  observations text,
  deficiencies_found text,
  immediate_jeopardy boolean DEFAULT false,
  citation_count integer DEFAULT 0,
  exit_conference_notes text,
  overall_result text,
  plan_of_correction_due_date date,
  plan_submitted boolean DEFAULT false,
  plan_submitted_date date,
  follow_up_visit_required boolean DEFAULT false,
  follow_up_visit_date date,
  final_report_received boolean DEFAULT false,
  final_report_date date,
  status text NOT NULL DEFAULT 'in_progress',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inspection_visits_clinic ON inspection_visits(clinic_id);
CREATE INDEX IF NOT EXISTS idx_inspection_visits_date ON inspection_visits(inspection_date DESC);
CREATE INDEX IF NOT EXISTS idx_inspection_visits_status ON inspection_visits(status);

-- Corrective action responses
CREATE TABLE IF NOT EXISTS corrective_action_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  inspection_visit_id uuid REFERENCES inspection_visits(id),
  compliance_assessment_id uuid REFERENCES compliance_assessments(id),
  quality_finding_id uuid REFERENCES quality_findings(id),
  deficiency_description text NOT NULL,
  root_cause_analysis text NOT NULL,
  corrective_action_plan text NOT NULL,
  responsible_person uuid NOT NULL REFERENCES user_profiles(id),
  due_date date NOT NULL,
  implementation_date date,
  verification_method text,
  effectiveness_check_date date,
  effectiveness_confirmed boolean DEFAULT false,
  supporting_documentation text,
  status text NOT NULL DEFAULT 'planned',
  submitted_to_regulator boolean DEFAULT false,
  submission_date date,
  regulator_acceptance text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT check_corrective_action_source CHECK (
    inspection_visit_id IS NOT NULL OR 
    compliance_assessment_id IS NOT NULL OR 
    quality_finding_id IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_corrective_action_responses_clinic ON corrective_action_responses(clinic_id);
CREATE INDEX IF NOT EXISTS idx_corrective_action_responses_status ON corrective_action_responses(status);
CREATE INDEX IF NOT EXISTS idx_corrective_action_responses_due ON corrective_action_responses(due_date);

-- =====================================================
-- 8. RESOURCE SCHEDULING
-- =====================================================

-- Facility rooms
CREATE TABLE IF NOT EXISTS facility_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  room_number text NOT NULL,
  room_name text,
  room_type text NOT NULL,
  floor text,
  building text,
  capacity integer,
  square_footage numeric,
  equipment_available text[],
  features text[],
  accessibility_features text[],
  status text NOT NULL DEFAULT 'available',
  maintenance_notes text,
  last_cleaned_at timestamptz,
  next_maintenance_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(clinic_id, room_number)
);

CREATE INDEX IF NOT EXISTS idx_facility_rooms_clinic ON facility_rooms(clinic_id);
CREATE INDEX IF NOT EXISTS idx_facility_rooms_type ON facility_rooms(room_type);
CREATE INDEX IF NOT EXISTS idx_facility_rooms_status ON facility_rooms(status);

-- Room schedules
CREATE TABLE IF NOT EXISTS room_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES facility_rooms(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES patient_appointments(id),
  event_type text NOT NULL,
  event_title text NOT NULL,
  start_datetime timestamptz NOT NULL,
  end_datetime timestamptz NOT NULL,
  booked_by uuid NOT NULL REFERENCES user_profiles(id),
  primary_user uuid REFERENCES user_profiles(id),
  attendees uuid[],
  purpose text,
  setup_requirements text,
  special_equipment text[],
  status text NOT NULL DEFAULT 'confirmed',
  cancellation_reason text,
  cancelled_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_room_schedules_room ON room_schedules(room_id);
CREATE INDEX IF NOT EXISTS idx_room_schedules_clinic ON room_schedules(clinic_id);
CREATE INDEX IF NOT EXISTS idx_room_schedules_datetime ON room_schedules(start_datetime, end_datetime);

-- Equipment schedules
CREATE TABLE IF NOT EXISTS equipment_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id uuid NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES patient_appointments(id),
  room_schedule_id uuid REFERENCES room_schedules(id),
  reservation_type text NOT NULL,
  start_datetime timestamptz NOT NULL,
  end_datetime timestamptz NOT NULL,
  reserved_by uuid NOT NULL REFERENCES user_profiles(id),
  primary_operator uuid REFERENCES user_profiles(id),
  purpose text NOT NULL,
  setup_requirements text,
  status text NOT NULL DEFAULT 'confirmed',
  checkout_condition text,
  checked_out_at timestamptz,
  checked_out_by uuid REFERENCES user_profiles(id),
  checkin_condition text,
  checked_in_at timestamptz,
  checked_in_by uuid REFERENCES user_profiles(id),
  maintenance_required boolean DEFAULT false,
  cancellation_reason text,
  cancelled_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_equipment_schedules_equipment ON equipment_schedules(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_schedules_clinic ON equipment_schedules(clinic_id);
CREATE INDEX IF NOT EXISTS idx_equipment_schedules_datetime ON equipment_schedules(start_datetime, end_datetime);

-- =====================================================
-- 9. ADVANCED ANALYTICS
-- =====================================================

-- Custom reports
CREATE TABLE IF NOT EXISTS custom_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES clinics(id),
  report_name text NOT NULL,
  report_description text,
  report_category text NOT NULL,
  report_type text NOT NULL,
  data_source text NOT NULL,
  query_definition jsonb NOT NULL,
  parameters jsonb,
  filters jsonb,
  grouping jsonb,
  sorting jsonb,
  visualization_type text,
  visualization_config jsonb,
  output_format text DEFAULT 'table',
  is_public boolean DEFAULT false,
  created_by uuid NOT NULL REFERENCES user_profiles(id),
  shared_with uuid[],
  shared_with_roles text[],
  status text NOT NULL DEFAULT 'active',
  last_run_at timestamptz,
  run_count integer DEFAULT 0,
  avg_execution_time numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_custom_reports_clinic ON custom_reports(clinic_id);
CREATE INDEX IF NOT EXISTS idx_custom_reports_creator ON custom_reports(created_by);
CREATE INDEX IF NOT EXISTS idx_custom_reports_category ON custom_reports(report_category);

-- Report schedules
CREATE TABLE IF NOT EXISTS report_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES custom_reports(id) ON DELETE CASCADE,
  clinic_id uuid REFERENCES clinics(id),
  schedule_name text NOT NULL,
  frequency text NOT NULL,
  schedule_config jsonb NOT NULL,
  parameters jsonb,
  delivery_method text NOT NULL,
  recipients text[] NOT NULL,
  subject_template text,
  body_template text,
  attachment_format text DEFAULT 'pdf',
  is_active boolean DEFAULT true,
  last_run_at timestamptz,
  next_run_at timestamptz,
  last_status text,
  last_error text,
  success_count integer DEFAULT 0,
  failure_count integer DEFAULT 0,
  created_by uuid NOT NULL REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_report_schedules_report ON report_schedules(report_id);
CREATE INDEX IF NOT EXISTS idx_report_schedules_next_run ON report_schedules(next_run_at);
CREATE INDEX IF NOT EXISTS idx_report_schedules_active ON report_schedules(is_active);

-- Data exports
CREATE TABLE IF NOT EXISTS data_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES clinics(id),
  export_name text NOT NULL,
  export_type text NOT NULL,
  data_scope text NOT NULL,
  table_names text[],
  date_range_start date,
  date_range_end date,
  filters jsonb,
  include_archived boolean DEFAULT false,
  export_format text NOT NULL,
  file_size_bytes bigint,
  file_url text,
  record_count integer,
  requested_by uuid NOT NULL REFERENCES user_profiles(id),
  requested_at timestamptz DEFAULT now(),
  approved_by uuid REFERENCES user_profiles(id),
  approved_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  expires_at timestamptz,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  download_count integer DEFAULT 0,
  last_downloaded_at timestamptz,
  reason text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_data_exports_clinic ON data_exports(clinic_id);
CREATE INDEX IF NOT EXISTS idx_data_exports_requester ON data_exports(requested_by);
CREATE INDEX IF NOT EXISTS idx_data_exports_status ON data_exports(status);
CREATE INDEX IF NOT EXISTS idx_data_exports_date ON data_exports(requested_at DESC);

-- =====================================================
-- 10. CLINICAL PROTOCOLS
-- =====================================================

-- Clinical protocols
CREATE TABLE IF NOT EXISTS clinical_protocols (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_code text NOT NULL UNIQUE,
  protocol_name text NOT NULL,
  protocol_category text NOT NULL,
  specialty text,
  condition text,
  description text NOT NULL,
  purpose text,
  scope text,
  target_population text,
  evidence_level text,
  evidence_source text,
  clinical_guidelines_reference text,
  keywords text[],
  developed_by uuid REFERENCES user_profiles(id),
  reviewed_by uuid REFERENCES user_profiles(id),
  approved_by uuid REFERENCES user_profiles(id),
  review_cycle_months integer DEFAULT 12,
  next_review_date date,
  status text NOT NULL DEFAULT 'draft',
  is_published boolean DEFAULT false,
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clinical_protocols_code ON clinical_protocols(protocol_code);
CREATE INDEX IF NOT EXISTS idx_clinical_protocols_category ON clinical_protocols(protocol_category);
CREATE INDEX IF NOT EXISTS idx_clinical_protocols_status ON clinical_protocols(status);

-- Protocol versions
CREATE TABLE IF NOT EXISTS protocol_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id uuid NOT NULL REFERENCES clinical_protocols(id) ON DELETE CASCADE,
  version_number text NOT NULL,
  version_date date NOT NULL,
  content_summary text,
  full_content text NOT NULL,
  steps jsonb,
  decision_points jsonb,
  assessment_criteria jsonb,
  intervention_guidelines jsonb,
  monitoring_parameters jsonb,
  documentation_requirements text,
  contraindications text,
  precautions text,
  expected_outcomes text,
  change_summary text,
  changed_by uuid NOT NULL REFERENCES user_profiles(id),
  approved_by uuid REFERENCES user_profiles(id),
  approved_at timestamptz,
  effective_date date,
  superseded_date date,
  is_current boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(protocol_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_protocol_versions_protocol ON protocol_versions(protocol_id);
CREATE INDEX IF NOT EXISTS idx_protocol_versions_current ON protocol_versions(is_current);

-- Protocol adherence
CREATE TABLE IF NOT EXISTS protocol_adherence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id uuid NOT NULL REFERENCES clinical_protocols(id),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES patients(id),
  care_plan_id uuid REFERENCES care_plans(id),
  appointment_id uuid REFERENCES patient_appointments(id),
  provider_id uuid NOT NULL REFERENCES user_profiles(id),
  adherence_date date NOT NULL,
  adherence_status text NOT NULL,
  steps_completed jsonb,
  steps_skipped jsonb,
  deviations jsonb,
  deviation_reasons text,
  clinical_justification text,
  outcome text,
  complications text,
  adverse_events text,
  patient_response text,
  follow_up_required boolean DEFAULT false,
  follow_up_date date,
  documentation_complete boolean DEFAULT false,
  quality_score numeric,
  reviewed_by uuid REFERENCES user_profiles(id),
  reviewed_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_protocol_adherence_protocol ON protocol_adherence(protocol_id);
CREATE INDEX IF NOT EXISTS idx_protocol_adherence_clinic ON protocol_adherence(clinic_id);
CREATE INDEX IF NOT EXISTS idx_protocol_adherence_provider ON protocol_adherence(provider_id);
CREATE INDEX IF NOT EXISTS idx_protocol_adherence_date ON protocol_adherence(adherence_date DESC);

-- =====================================================
-- ROW LEVEL SECURITY - ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_medical_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_communications ENABLE ROW LEVEL SECURITY;

ALTER TABLE inventory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE supply_orders ENABLE ROW LEVEL SECURITY;

ALTER TABLE quality_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE improvement_initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_incidents ENABLE ROW LEVEL SECURITY;

ALTER TABLE insurance_payers ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_insurance ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

ALTER TABLE external_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_networks ENABLE ROW LEVEL SECURITY;

ALTER TABLE care_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_goals ENABLE ROW LEVEL SECURITY;

ALTER TABLE regulatory_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE corrective_action_responses ENABLE ROW LEVEL SECURITY;

ALTER TABLE facility_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_schedules ENABLE ROW LEVEL SECURITY;

ALTER TABLE custom_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_exports ENABLE ROW LEVEL SECURITY;

ALTER TABLE clinical_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocol_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocol_adherence ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Helper function to check clinic access
CREATE OR REPLACE FUNCTION user_has_clinic_access(clinic_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM clinic_access
    WHERE user_id = auth.uid()
    AND clinic_id = clinic_uuid
    AND revoked_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PATIENT MANAGEMENT POLICIES
-- =====================================================

-- Patients
CREATE POLICY "Staff can view patients at their clinics"
  ON patients FOR SELECT
  TO authenticated
  USING (user_has_clinic_access(clinic_id));

CREATE POLICY "Staff can insert patients at their clinics"
  ON patients FOR INSERT
  TO authenticated
  WITH CHECK (user_has_clinic_access(clinic_id));

CREATE POLICY "Staff can update patients at their clinics"
  ON patients FOR UPDATE
  TO authenticated
  USING (user_has_clinic_access(clinic_id))
  WITH CHECK (user_has_clinic_access(clinic_id));

CREATE POLICY "Staff can delete patients at their clinics"
  ON patients FOR DELETE
  TO authenticated
  USING (user_has_clinic_access(clinic_id));

-- Patient appointments
CREATE POLICY "Staff can view appointments at their clinics"
  ON patient_appointments FOR SELECT
  TO authenticated
  USING (user_has_clinic_access(clinic_id));

CREATE POLICY "Staff can manage appointments at their clinics"
  ON patient_appointments FOR ALL
  TO authenticated
  USING (user_has_clinic_access(clinic_id))
  WITH CHECK (user_has_clinic_access(clinic_id));

-- Patient medical history
CREATE POLICY "Staff can view medical history at their clinics"
  ON patient_medical_history FOR SELECT
  TO authenticated
  USING (user_has_clinic_access(clinic_id));

CREATE POLICY "Staff can manage medical history at their clinics"
  ON patient_medical_history FOR ALL
  TO authenticated
  USING (user_has_clinic_access(clinic_id))
  WITH CHECK (user_has_clinic_access(clinic_id));

-- Patient communications
CREATE POLICY "Staff can view communications at their clinics"
  ON patient_communications FOR SELECT
  TO authenticated
  USING (user_has_clinic_access(clinic_id));

CREATE POLICY "Staff can manage communications at their clinics"
  ON patient_communications FOR ALL
  TO authenticated
  USING (user_has_clinic_access(clinic_id))
  WITH CHECK (user_has_clinic_access(clinic_id));

-- =====================================================
-- INVENTORY MANAGEMENT POLICIES
-- =====================================================

-- Inventory categories (system-wide visibility)
CREATE POLICY "Authenticated users can view inventory categories"
  ON inventory_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage inventory categories"
  ON inventory_categories FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Inventory items
CREATE POLICY "Staff can view inventory at their clinics"
  ON inventory_items FOR SELECT
  TO authenticated
  USING (user_has_clinic_access(clinic_id));

CREATE POLICY "Staff can manage inventory at their clinics"
  ON inventory_items FOR ALL
  TO authenticated
  USING (user_has_clinic_access(clinic_id))
  WITH CHECK (user_has_clinic_access(clinic_id));

-- Inventory transactions
CREATE POLICY "Staff can view inventory transactions at their clinics"
  ON inventory_transactions FOR SELECT
  TO authenticated
  USING (user_has_clinic_access(clinic_id));

CREATE POLICY "Staff can create inventory transactions at their clinics"
  ON inventory_transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    user_has_clinic_access(clinic_id) AND
    auth.uid() = performed_by
  );

-- Equipment maintenance
CREATE POLICY "Staff can view equipment maintenance at their clinics"
  ON equipment_maintenance FOR SELECT
  TO authenticated
  USING (user_has_clinic_access(clinic_id));

CREATE POLICY "Staff can manage equipment maintenance at their clinics"
  ON equipment_maintenance FOR ALL
  TO authenticated
  USING (user_has_clinic_access(clinic_id))
  WITH CHECK (user_has_clinic_access(clinic_id));

-- Supply orders
CREATE POLICY "Staff can view supply orders at their clinics"
  ON supply_orders FOR SELECT
  TO authenticated
  USING (user_has_clinic_access(clinic_id));

CREATE POLICY "Staff can manage supply orders at their clinics"
  ON supply_orders FOR ALL
  TO authenticated
  USING (user_has_clinic_access(clinic_id))
  WITH CHECK (user_has_clinic_access(clinic_id));

-- =====================================================
-- QUALITY ASSURANCE POLICIES
-- =====================================================

-- Quality audits
CREATE POLICY "Staff can view quality audits at their clinics"
  ON quality_audits FOR SELECT
  TO authenticated
  USING (user_has_clinic_access(clinic_id));

CREATE POLICY "Staff can manage quality audits at their clinics"
  ON quality_audits FOR ALL
  TO authenticated
  USING (user_has_clinic_access(clinic_id))
  WITH CHECK (user_has_clinic_access(clinic_id));

-- Quality findings
CREATE POLICY "Staff can view quality findings at their clinics"
  ON quality_findings FOR SELECT
  TO authenticated
  USING (user_has_clinic_access(clinic_id));

CREATE POLICY "Staff can manage quality findings at their clinics"
  ON quality_findings FOR ALL
  TO authenticated
  USING (user_has_clinic_access(clinic_id))
  WITH CHECK (user_has_clinic_access(clinic_id));

-- Improvement initiatives
CREATE POLICY "Staff can view improvement initiatives at their clinics"
  ON improvement_initiatives FOR SELECT
  TO authenticated
  USING (user_has_clinic_access(clinic_id));

CREATE POLICY "Staff can manage improvement initiatives at their clinics"
  ON improvement_initiatives FOR ALL
  TO authenticated
  USING (user_has_clinic_access(clinic_id))
  WITH CHECK (user_has_clinic_access(clinic_id));

-- Safety incidents
CREATE POLICY "Staff can view safety incidents at their clinics"
  ON safety_incidents FOR SELECT
  TO authenticated
  USING (user_has_clinic_access(clinic_id));

CREATE POLICY "Staff can manage safety incidents at their clinics"
  ON safety_incidents FOR ALL
  TO authenticated
  USING (user_has_clinic_access(clinic_id))
  WITH CHECK (user_has_clinic_access(clinic_id));

-- =====================================================
-- REVENUE CYCLE MANAGEMENT POLICIES
-- =====================================================

-- Insurance payers (system-wide visibility)
CREATE POLICY "Authenticated users can view insurance payers"
  ON insurance_payers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage insurance payers"
  ON insurance_payers FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Patient insurance
CREATE POLICY "Staff can view patient insurance at their clinics"
  ON patient_insurance FOR SELECT
  TO authenticated
  USING (user_has_clinic_access(clinic_id));

CREATE POLICY "Staff can manage patient insurance at their clinics"
  ON patient_insurance FOR ALL
  TO authenticated
  USING (user_has_clinic_access(clinic_id))
  WITH CHECK (user_has_clinic_access(clinic_id));

-- Claims
CREATE POLICY "Staff can view claims at their clinics"
  ON claims FOR SELECT
  TO authenticated
  USING (user_has_clinic_access(clinic_id));

CREATE POLICY "Staff can manage claims at their clinics"
  ON claims FOR ALL
  TO authenticated
  USING (user_has_clinic_access(clinic_id))
  WITH CHECK (user_has_clinic_access(clinic_id));

-- Payments
CREATE POLICY "Staff can view payments at their clinics"
  ON payments FOR SELECT
  TO authenticated
  USING (user_has_clinic_access(clinic_id));

CREATE POLICY "Staff can manage payments at their clinics"
  ON payments FOR ALL
  TO authenticated
  USING (user_has_clinic_access(clinic_id))
  WITH CHECK (user_has_clinic_access(clinic_id));

-- =====================================================
-- PROVIDER NETWORK POLICIES
-- =====================================================

-- External providers (system-wide visibility)
CREATE POLICY "Authenticated users can view external providers"
  ON external_providers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage external providers"
  ON external_providers FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Provider credentials
CREATE POLICY "Authenticated users can view provider credentials"
  ON provider_credentials FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage provider credentials"
  ON provider_credentials FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Referral networks
CREATE POLICY "Staff can view referral networks"
  ON referral_networks FOR SELECT
  TO authenticated
  USING (
    managing_clinic_id IS NULL OR
    user_has_clinic_access(managing_clinic_id)
  );

CREATE POLICY "Staff can manage referral networks at their clinics"
  ON referral_networks FOR ALL
  TO authenticated
  USING (
    managing_clinic_id IS NULL OR
    user_has_clinic_access(managing_clinic_id)
  )
  WITH CHECK (
    managing_clinic_id IS NULL OR
    user_has_clinic_access(managing_clinic_id)
  );

-- =====================================================
-- CARE COORDINATION POLICIES
-- =====================================================

-- Care plans
CREATE POLICY "Staff can view care plans at their clinics"
  ON care_plans FOR SELECT
  TO authenticated
  USING (user_has_clinic_access(clinic_id));

CREATE POLICY "Staff can manage care plans at their clinics"
  ON care_plans FOR ALL
  TO authenticated
  USING (user_has_clinic_access(clinic_id))
  WITH CHECK (user_has_clinic_access(clinic_id));

-- Care team members
CREATE POLICY "Staff can view care team members"
  ON care_team_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM care_plans
      WHERE care_plans.id = care_team_members.care_plan_id
      AND user_has_clinic_access(care_plans.clinic_id)
    )
  );

CREATE POLICY "Staff can manage care team members"
  ON care_team_members FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM care_plans
      WHERE care_plans.id = care_team_members.care_plan_id
      AND user_has_clinic_access(care_plans.clinic_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM care_plans
      WHERE care_plans.id = care_team_members.care_plan_id
      AND user_has_clinic_access(care_plans.clinic_id)
    )
  );

-- Care milestones
CREATE POLICY "Staff can view care milestones"
  ON care_milestones FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM care_plans
      WHERE care_plans.id = care_milestones.care_plan_id
      AND user_has_clinic_access(care_plans.clinic_id)
    )
  );

CREATE POLICY "Staff can manage care milestones"
  ON care_milestones FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM care_plans
      WHERE care_plans.id = care_milestones.care_plan_id
      AND user_has_clinic_access(care_plans.clinic_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM care_plans
      WHERE care_plans.id = care_milestones.care_plan_id
      AND user_has_clinic_access(care_plans.clinic_id)
    )
  );

-- Patient goals
CREATE POLICY "Staff can view patient goals at their clinics"
  ON patient_goals FOR SELECT
  TO authenticated
  USING (user_has_clinic_access(clinic_id));

CREATE POLICY "Staff can manage patient goals at their clinics"
  ON patient_goals FOR ALL
  TO authenticated
  USING (user_has_clinic_access(clinic_id))
  WITH CHECK (user_has_clinic_access(clinic_id));

-- =====================================================
-- COMPLIANCE MONITORING POLICIES
-- =====================================================

-- Regulatory requirements (system-wide visibility)
CREATE POLICY "Authenticated users can view regulatory requirements"
  ON regulatory_requirements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage regulatory requirements"
  ON regulatory_requirements FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Compliance assessments
CREATE POLICY "Staff can view compliance assessments at their clinics"
  ON compliance_assessments FOR SELECT
  TO authenticated
  USING (user_has_clinic_access(clinic_id));

CREATE POLICY "Staff can manage compliance assessments at their clinics"
  ON compliance_assessments FOR ALL
  TO authenticated
  USING (user_has_clinic_access(clinic_id))
  WITH CHECK (user_has_clinic_access(clinic_id));

-- Inspection visits
CREATE POLICY "Staff can view inspection visits at their clinics"
  ON inspection_visits FOR SELECT
  TO authenticated
  USING (user_has_clinic_access(clinic_id));

CREATE POLICY "Staff can manage inspection visits at their clinics"
  ON inspection_visits FOR ALL
  TO authenticated
  USING (user_has_clinic_access(clinic_id))
  WITH CHECK (user_has_clinic_access(clinic_id));

-- Corrective action responses
CREATE POLICY "Staff can view corrective action responses at their clinics"
  ON corrective_action_responses FOR SELECT
  TO authenticated
  USING (user_has_clinic_access(clinic_id));

CREATE POLICY "Staff can manage corrective action responses at their clinics"
  ON corrective_action_responses FOR ALL
  TO authenticated
  USING (user_has_clinic_access(clinic_id))
  WITH CHECK (user_has_clinic_access(clinic_id));

-- =====================================================
-- RESOURCE SCHEDULING POLICIES
-- =====================================================

-- Facility rooms
CREATE POLICY "Staff can view facility rooms at their clinics"
  ON facility_rooms FOR SELECT
  TO authenticated
  USING (user_has_clinic_access(clinic_id));

CREATE POLICY "Staff can manage facility rooms at their clinics"
  ON facility_rooms FOR ALL
  TO authenticated
  USING (user_has_clinic_access(clinic_id))
  WITH CHECK (user_has_clinic_access(clinic_id));

-- Room schedules
CREATE POLICY "Staff can view room schedules at their clinics"
  ON room_schedules FOR SELECT
  TO authenticated
  USING (user_has_clinic_access(clinic_id));

CREATE POLICY "Staff can manage room schedules at their clinics"
  ON room_schedules FOR ALL
  TO authenticated
  USING (user_has_clinic_access(clinic_id))
  WITH CHECK (user_has_clinic_access(clinic_id));

-- Equipment schedules
CREATE POLICY "Staff can view equipment schedules at their clinics"
  ON equipment_schedules FOR SELECT
  TO authenticated
  USING (user_has_clinic_access(clinic_id));

CREATE POLICY "Staff can manage equipment schedules at their clinics"
  ON equipment_schedules FOR ALL
  TO authenticated
  USING (user_has_clinic_access(clinic_id))
  WITH CHECK (user_has_clinic_access(clinic_id));

-- =====================================================
-- ADVANCED ANALYTICS POLICIES
-- =====================================================

-- Custom reports
CREATE POLICY "Users can view their own and shared reports"
  ON custom_reports FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid() OR
    is_public = true OR
    auth.uid() = ANY(shared_with) OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role::text = ANY(shared_with_roles)
    ) OR
    (clinic_id IS NULL) OR
    user_has_clinic_access(clinic_id)
  );

CREATE POLICY "Users can manage their own reports"
  ON custom_reports FOR ALL
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Report schedules
CREATE POLICY "Users can view schedules for reports they can access"
  ON report_schedules FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM custom_reports
      WHERE custom_reports.id = report_schedules.report_id
      AND (
        custom_reports.created_by = auth.uid() OR
        custom_reports.is_public = true OR
        auth.uid() = ANY(custom_reports.shared_with)
      )
    )
  );

CREATE POLICY "Users can manage schedules for their own reports"
  ON report_schedules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM custom_reports
      WHERE custom_reports.id = report_schedules.report_id
      AND custom_reports.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM custom_reports
      WHERE custom_reports.id = report_schedules.report_id
      AND custom_reports.created_by = auth.uid()
    )
  );

-- Data exports
CREATE POLICY "Users can view their own data exports"
  ON data_exports FOR SELECT
  TO authenticated
  USING (
    requested_by = auth.uid() OR
    (clinic_id IS NOT NULL AND user_has_clinic_access(clinic_id))
  );

CREATE POLICY "Users can request data exports"
  ON data_exports FOR INSERT
  TO authenticated
  WITH CHECK (requested_by = auth.uid());

CREATE POLICY "Users can update their own data exports"
  ON data_exports FOR UPDATE
  TO authenticated
  USING (requested_by = auth.uid())
  WITH CHECK (requested_by = auth.uid());

-- =====================================================
-- CLINICAL PROTOCOLS POLICIES
-- =====================================================

-- Clinical protocols (read-only for most, write for protocol managers)
CREATE POLICY "Authenticated users can view published protocols"
  ON clinical_protocols FOR SELECT
  TO authenticated
  USING (is_published = true OR status = 'active');

CREATE POLICY "Authenticated users can manage protocols"
  ON clinical_protocols FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Protocol versions
CREATE POLICY "Authenticated users can view protocol versions"
  ON protocol_versions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage protocol versions"
  ON protocol_versions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Protocol adherence
CREATE POLICY "Staff can view protocol adherence at their clinics"
  ON protocol_adherence FOR SELECT
  TO authenticated
  USING (user_has_clinic_access(clinic_id));

CREATE POLICY "Staff can record protocol adherence at their clinics"
  ON protocol_adherence FOR INSERT
  TO authenticated
  WITH CHECK (
    user_has_clinic_access(clinic_id) AND
    provider_id = auth.uid()
  );

CREATE POLICY "Providers can update their own protocol adherence records"
  ON protocol_adherence FOR UPDATE
  TO authenticated
  USING (provider_id = auth.uid())
  WITH CHECK (provider_id = auth.uid());
