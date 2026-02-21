/*
  # Growth OS - Complete RevOps for Healthcare

  18 new tables for demand-to-revenue system
  - Marketing Intelligence (4 tables)
  - Sales/Intake Pipeline (4 tables)  
  - Referral Growth Engine (4 tables)
  - Revenue Operations (3 tables)
  - Local Clinic Growth (3 tables)
*/

CREATE TABLE IF NOT EXISTS marketing_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_name text NOT NULL,
  channel_type text NOT NULL,
  platform text,
  description text,
  is_active boolean DEFAULT true,
  monthly_budget numeric(10,2),
  clinic_id uuid REFERENCES clinics(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_name text NOT NULL,
  channel_id uuid REFERENCES marketing_channels(id) ON DELETE CASCADE,
  clinic_id uuid REFERENCES clinics(id),
  campaign_type text NOT NULL,
  start_date date NOT NULL,
  end_date date,
  total_budget numeric(10,2),
  spent_to_date numeric(10,2) DEFAULT 0,
  target_cpl numeric(10,2),
  target_cpa numeric(10,2),
  status text DEFAULT 'active',
  geo_targets jsonb,
  created_by uuid REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES campaigns(id),
  channel_id uuid REFERENCES marketing_channels(id),
  clinic_id uuid REFERENCES clinics(id),
  first_name text,
  last_name text,
  email text,
  phone text,
  source_url text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  lead_score integer DEFAULT 0,
  injury_type text,
  preferred_contact text,
  notes text,
  status text DEFAULT 'new',
  converted_to_intake_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS campaign_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE,
  metric_date date NOT NULL,
  impressions integer DEFAULT 0,
  clicks integer DEFAULT 0,
  spend numeric(10,2) DEFAULT 0,
  leads integer DEFAULT 0,
  conversions integer DEFAULT 0,
  cpl numeric(10,2),
  cpa numeric(10,2),
  ctr numeric(5,2),
  conversion_rate numeric(5,2),
  roas numeric(10,2),
  created_at timestamptz DEFAULT now(),
  UNIQUE(campaign_id, metric_date)
);

CREATE TABLE IF NOT EXISTS intake_pipeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id),
  clinic_id uuid REFERENCES clinics(id) NOT NULL,
  patient_first_name text NOT NULL,
  patient_last_name text NOT NULL,
  patient_email text,
  patient_phone text NOT NULL,
  injury_type text,
  injury_date date,
  referral_source text,
  insurance_type text,
  stage text DEFAULT 'lead_in',
  priority text DEFAULT 'normal',
  assigned_to uuid REFERENCES user_profiles(id),
  first_contact_at timestamptz,
  assessed_at timestamptz,
  booked_at timestamptz,
  first_visit_at timestamptz,
  drop_reason text,
  estimated_value numeric(10,2),
  actual_value numeric(10,2),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS intake_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intake_id uuid REFERENCES intake_pipeline(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  action_by uuid REFERENCES user_profiles(id),
  action_date timestamptz DEFAULT now(),
  outcome text,
  next_action_due timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS intake_outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intake_id uuid REFERENCES intake_pipeline(id) ON DELETE CASCADE,
  outcome_type text NOT NULL,
  outcome_date date NOT NULL,
  outcome_reason text,
  revenue_generated numeric(10,2),
  days_in_pipeline integer,
  touches_to_conversion integer,
  assigned_clinician uuid REFERENCES user_profiles(id),
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS intake_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES clinics(id) NOT NULL,
  rule_name text NOT NULL,
  rule_type text NOT NULL,
  conditions jsonb,
  assigned_to uuid REFERENCES user_profiles(id),
  priority integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS referral_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_name text NOT NULL,
  partner_type text NOT NULL,
  industry text,
  company_size text,
  primary_contact_name text,
  primary_contact_email text,
  primary_contact_phone text,
  address text,
  city text,
  province text,
  preferred_clinic_id uuid REFERENCES clinics(id),
  relationship_status text DEFAULT 'active',
  relationship_health_score integer DEFAULT 50,
  total_referrals integer DEFAULT 0,
  ytd_referrals integer DEFAULT 0,
  avg_case_value numeric(10,2),
  lifetime_value numeric(10,2),
  last_referral_date date,
  last_contact_date date,
  next_contact_due date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS referral_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_name text NOT NULL,
  campaign_type text NOT NULL,
  target_partner_type text,
  clinic_id uuid REFERENCES clinics(id),
  start_date date NOT NULL,
  end_date date,
  goal text,
  target_partners integer,
  contacted integer DEFAULT 0,
  responded integer DEFAULT 0,
  converted integer DEFAULT 0,
  status text DEFAULT 'active',
  assigned_to uuid REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS referral_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid REFERENCES referral_partners(id) ON DELETE CASCADE,
  metric_month date NOT NULL,
  referrals_sent integer DEFAULT 0,
  referrals_converted integer DEFAULT 0,
  revenue_generated numeric(10,2) DEFAULT 0,
  avg_time_to_referral numeric(5,1),
  no_show_rate numeric(5,2),
  satisfaction_score integer,
  touches integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(partner_id, metric_month)
);

CREATE TABLE IF NOT EXISTS referral_gaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid REFERENCES referral_partners(id) ON DELETE CASCADE,
  gap_type text NOT NULL,
  gap_description text NOT NULL,
  expected_volume integer,
  actual_volume integer,
  opportunity_value numeric(10,2),
  priority text DEFAULT 'medium',
  action_required text,
  assigned_to uuid REFERENCES user_profiles(id),
  status text DEFAULT 'open',
  detected_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS revops_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES clinics(id),
  metric_date date NOT NULL,
  marketing_spend numeric(10,2) DEFAULT 0,
  leads_generated integer DEFAULT 0,
  cost_per_lead numeric(10,2),
  leads_contacted integer DEFAULT 0,
  leads_qualified integer DEFAULT 0,
  appointments_booked integer DEFAULT 0,
  appointments_attended integer DEFAULT 0,
  speed_to_contact_avg numeric(5,1),
  available_capacity_hours numeric(10,2),
  utilized_capacity_hours numeric(10,2),
  utilization_rate numeric(5,2),
  revenue_generated numeric(10,2) DEFAULT 0,
  revenue_per_lead numeric(10,2),
  revenue_per_booking numeric(10,2),
  revenue_per_clinician_hour numeric(10,2),
  lead_to_booking_rate numeric(5,2),
  booking_to_attendance_rate numeric(5,2),
  overall_conversion_rate numeric(5,2),
  primary_bottleneck text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(clinic_id, metric_date)
);

CREATE TABLE IF NOT EXISTS capacity_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES clinics(id) NOT NULL,
  analysis_date date NOT NULL,
  inbound_leads integer DEFAULT 0,
  booking_requests integer DEFAULT 0,
  waitlist_count integer DEFAULT 0,
  demand_score integer DEFAULT 50,
  total_clinicians integer DEFAULT 0,
  available_hours numeric(10,2),
  booked_hours numeric(10,2),
  utilization_rate numeric(5,2),
  capacity_score integer DEFAULT 50,
  demand_supply_gap numeric(5,2),
  recommended_action text,
  urgency text DEFAULT 'normal',
  created_at timestamptz DEFAULT now(),
  UNIQUE(clinic_id, analysis_date)
);

CREATE TABLE IF NOT EXISTS bottleneck_detection (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES clinics(id),
  detection_date date NOT NULL,
  bottleneck_type text NOT NULL,
  bottleneck_description text NOT NULL,
  impact_level text DEFAULT 'medium',
  estimated_revenue_loss numeric(10,2),
  recommended_action text,
  assigned_to uuid REFERENCES user_profiles(id),
  status text DEFAULT 'open',
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS growth_playbooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  playbook_name text NOT NULL,
  playbook_type text NOT NULL,
  clinic_id uuid REFERENCES clinics(id),
  description text,
  goal text,
  target_metric text,
  target_value numeric(10,2),
  duration_weeks integer,
  estimated_cost numeric(10,2),
  expected_roi numeric(5,2),
  status text DEFAULT 'draft',
  start_date date,
  end_date date,
  template jsonb,
  created_by uuid REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS playbook_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  playbook_id uuid REFERENCES growth_playbooks(id) ON DELETE CASCADE,
  action_name text NOT NULL,
  action_type text NOT NULL,
  description text,
  assigned_to uuid REFERENCES user_profiles(id),
  due_date date,
  status text DEFAULT 'pending',
  completion_date date,
  outcome text,
  cost numeric(10,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS playbook_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  playbook_id uuid REFERENCES growth_playbooks(id) ON DELETE CASCADE,
  metric_date date NOT NULL,
  metric_name text NOT NULL,
  metric_value numeric(10,2) NOT NULL,
  target_value numeric(10,2),
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(playbook_id, metric_date, metric_name)
);

CREATE INDEX IF NOT EXISTS idx_marketing_channels_clinic ON marketing_channels(clinic_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_clinic ON campaigns(clinic_id);
CREATE INDEX IF NOT EXISTS idx_leads_clinic ON leads(clinic_id);
CREATE INDEX IF NOT EXISTS idx_intake_pipeline_clinic ON intake_pipeline(clinic_id);
CREATE INDEX IF NOT EXISTS idx_referral_partners_clinic ON referral_partners(preferred_clinic_id);
CREATE INDEX IF NOT EXISTS idx_revops_metrics_clinic ON revops_metrics(clinic_id);
CREATE INDEX IF NOT EXISTS idx_capacity_analysis_clinic ON capacity_analysis(clinic_id);
CREATE INDEX IF NOT EXISTS idx_growth_playbooks_clinic ON growth_playbooks(clinic_id);

ALTER TABLE marketing_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE intake_pipeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE intake_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE intake_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE intake_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE revops_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE capacity_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE bottleneck_detection ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE playbook_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE playbook_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Execs can view marketing_channels" ON marketing_channels FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('executive', 'admin')));

CREATE POLICY "Execs can view campaigns" ON campaigns FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('executive', 'admin')));

CREATE POLICY "Execs can view leads" ON leads FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('executive', 'admin')));

CREATE POLICY "Execs can view campaign_metrics" ON campaign_metrics FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('executive', 'admin')));

CREATE POLICY "Execs can view intake_pipeline" ON intake_pipeline FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('executive', 'admin')));

CREATE POLICY "Execs can view intake_actions" ON intake_actions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('executive', 'admin')));

CREATE POLICY "Execs can view intake_outcomes" ON intake_outcomes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('executive', 'admin')));

CREATE POLICY "Execs can view intake_assignments" ON intake_assignments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('executive', 'admin')));

CREATE POLICY "Execs can view referral_partners" ON referral_partners FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('executive', 'admin')));

CREATE POLICY "Execs can view referral_campaigns" ON referral_campaigns FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('executive', 'admin')));

CREATE POLICY "Execs can view referral_metrics" ON referral_metrics FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('executive', 'admin')));

CREATE POLICY "Execs can view referral_gaps" ON referral_gaps FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('executive', 'admin')));

CREATE POLICY "Execs can view revops_metrics" ON revops_metrics FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('executive', 'admin')));

CREATE POLICY "Execs can view capacity_analysis" ON capacity_analysis FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('executive', 'admin')));

CREATE POLICY "Execs can view bottleneck_detection" ON bottleneck_detection FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('executive', 'admin')));

CREATE POLICY "Execs can view growth_playbooks" ON growth_playbooks FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('executive', 'admin')));

CREATE POLICY "Execs can view playbook_actions" ON playbook_actions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('executive', 'admin')));

CREATE POLICY "Execs can view playbook_metrics" ON playbook_metrics FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('executive', 'admin')));
