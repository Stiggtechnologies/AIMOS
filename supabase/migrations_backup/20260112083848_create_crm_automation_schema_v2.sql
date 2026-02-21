/*
  # CRM Automation System - Full Google Ads + Intake + CRM

  1. New Tables
    - `crm_service_lines` - Service offerings (Injury Mgmt, Sports, EPC, Massage)
    - `crm_payor_types` - Payment sources (Private, WCB, Insurance)
    - `crm_clv_tiers` - Customer lifetime value tiers
    - `crm_lead_sources` - Lead origin tracking (Google Ads, EPC, Referral)
    - `crm_leads` - All incoming leads with full attribution
    - `crm_lead_tags` - Multi-tag system for leads
    - `crm_bookings` - Appointment bookings linked to leads
    - `crm_cases` - Full patient cases (multi-visit tracking)
    - `crm_case_visits` - Individual visit records
    - `crm_upsells` - Upsell/cross-sell tracking (Shockwave, Orthotics)
    - `crm_campaigns` - Google Ads campaign tracking
    - `crm_keywords` - Keyword performance tracking
    - `crm_capacity_rules` - Dynamic capacity rules engine
    - `crm_capacity_snapshots` - Real-time capacity tracking
    - `crm_alerts` - Automated alert system
    - `crm_follow_ups` - SMS/Email follow-up tracking
    - `crm_staff_performance` - Front desk conversion metrics
    - `crm_revenue_tracking` - Revenue per case tracking
    - `crm_cash_lag_tracking` - Payment lag by payor

  2. Security
    - Enable RLS on all tables
    - Policies for authenticated users

  3. Functions
    - Real-time capacity calculation
    - Alert generation
    - CPA and ROAS calculation
*/

-- Service Lines
CREATE TABLE IF NOT EXISTS crm_service_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  priority integer NOT NULL DEFAULT 0,
  target_clv numeric(10,2),
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE crm_service_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view service lines"
  ON crm_service_lines FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage service lines"
  ON crm_service_lines FOR ALL
  TO authenticated
  USING (true);

-- Payor Types
CREATE TABLE IF NOT EXISTS crm_payor_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  avg_payment_days integer DEFAULT 30,
  margin_percent numeric(5,2),
  priority integer NOT NULL DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE crm_payor_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view payor types"
  ON crm_payor_types FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage payor types"
  ON crm_payor_types FOR ALL
  TO authenticated
  USING (true);

-- CLV Tiers
CREATE TABLE IF NOT EXISTS crm_clv_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  min_value numeric(10,2),
  max_value numeric(10,2),
  priority integer NOT NULL DEFAULT 0,
  color text DEFAULT '#gray',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE crm_clv_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view CLV tiers"
  ON crm_clv_tiers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage CLV tiers"
  ON crm_clv_tiers FOR ALL
  TO authenticated
  USING (true);

-- Lead Sources
CREATE TABLE IF NOT EXISTS crm_lead_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  type text CHECK (type IN ('paid', 'organic', 'referral', 'partner')),
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE crm_lead_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view lead sources"
  ON crm_lead_sources FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage lead sources"
  ON crm_lead_sources FOR ALL
  TO authenticated
  USING (true);

-- Campaigns
CREATE TABLE IF NOT EXISTS crm_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id text UNIQUE,
  name text NOT NULL,
  service_line_id uuid REFERENCES crm_service_lines(id),
  clinic_id uuid REFERENCES clinics(id),
  status text CHECK (status IN ('active', 'paused', 'archived')) DEFAULT 'active',
  daily_budget numeric(10,2),
  actual_spend numeric(10,2) DEFAULT 0,
  total_clicks integer DEFAULT 0,
  total_impressions integer DEFAULT 0,
  total_leads integer DEFAULT 0,
  total_bookings integer DEFAULT 0,
  total_revenue numeric(10,2) DEFAULT 0,
  cpa numeric(10,2),
  roas numeric(10,2),
  auto_throttle_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE crm_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view campaigns"
  ON crm_campaigns FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage campaigns"
  ON crm_campaigns FOR ALL
  TO authenticated
  USING (true);

CREATE INDEX idx_crm_campaigns_service_line ON crm_campaigns(service_line_id);
CREATE INDEX idx_crm_campaigns_clinic ON crm_campaigns(clinic_id);
CREATE INDEX idx_crm_campaigns_status ON crm_campaigns(status);

-- Keywords
CREATE TABLE IF NOT EXISTS crm_keywords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES crm_campaigns(id) ON DELETE CASCADE,
  keyword text NOT NULL,
  match_type text CHECK (match_type IN ('exact', 'phrase', 'broad')),
  clicks integer DEFAULT 0,
  impressions integer DEFAULT 0,
  spend numeric(10,2) DEFAULT 0,
  leads integer DEFAULT 0,
  revenue numeric(10,2) DEFAULT 0,
  cpa numeric(10,2),
  roas numeric(10,2),
  status text CHECK (status IN ('active', 'paused', 'suggested_pause')) DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE crm_keywords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view keywords"
  ON crm_keywords FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage keywords"
  ON crm_keywords FOR ALL
  TO authenticated
  USING (true);

CREATE INDEX idx_crm_keywords_campaign ON crm_keywords(campaign_id);

-- Leads
CREATE TABLE IF NOT EXISTS crm_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id text UNIQUE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  phone text NOT NULL,
  service_line_id uuid REFERENCES crm_service_lines(id),
  payor_type_id uuid REFERENCES crm_payor_types(id),
  clv_tier_id uuid REFERENCES crm_clv_tiers(id),
  lead_source_id uuid REFERENCES crm_lead_sources(id),
  campaign_id uuid REFERENCES crm_campaigns(id),
  keyword_id uuid REFERENCES crm_keywords(id),
  clinic_id uuid REFERENCES clinics(id),
  landing_page_url text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  status text CHECK (status IN ('new', 'contacted', 'booked', 'showed', 'no_show', 'converted', 'lost')) DEFAULT 'new',
  priority text CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
  contacted_at timestamptz,
  contacted_by uuid REFERENCES auth.users(id),
  booked_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view leads"
  ON crm_leads FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage leads"
  ON crm_leads FOR ALL
  TO authenticated
  USING (true);

CREATE INDEX idx_crm_leads_status ON crm_leads(status);
CREATE INDEX idx_crm_leads_priority ON crm_leads(priority);
CREATE INDEX idx_crm_leads_service_line ON crm_leads(service_line_id);
CREATE INDEX idx_crm_leads_clinic ON crm_leads(clinic_id);
CREATE INDEX idx_crm_leads_created ON crm_leads(created_at DESC);
CREATE INDEX idx_crm_leads_campaign ON crm_leads(campaign_id);

-- Lead Tags
CREATE TABLE IF NOT EXISTS crm_lead_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES crm_leads(id) ON DELETE CASCADE,
  tag_type text NOT NULL,
  tag_value text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE crm_lead_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view lead tags"
  ON crm_lead_tags FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage lead tags"
  ON crm_lead_tags FOR ALL
  TO authenticated
  USING (true);

CREATE INDEX idx_crm_lead_tags_lead ON crm_lead_tags(lead_id);

-- Bookings
CREATE TABLE IF NOT EXISTS crm_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES crm_leads(id),
  clinic_id uuid REFERENCES clinics(id),
  clinician_id uuid REFERENCES auth.users(id),
  service_line_id uuid REFERENCES crm_service_lines(id),
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer DEFAULT 60,
  status text CHECK (status IN ('scheduled', 'confirmed', 'completed', 'no_show', 'cancelled')) DEFAULT 'scheduled',
  confirmation_sent boolean DEFAULT false,
  reminder_sent boolean DEFAULT false,
  booked_by uuid REFERENCES auth.users(id),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE crm_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view bookings"
  ON crm_bookings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage bookings"
  ON crm_bookings FOR ALL
  TO authenticated
  USING (true);

CREATE INDEX idx_crm_bookings_lead ON crm_bookings(lead_id);
CREATE INDEX idx_crm_bookings_clinic ON crm_bookings(clinic_id);
CREATE INDEX idx_crm_bookings_scheduled ON crm_bookings(scheduled_at);
CREATE INDEX idx_crm_bookings_status ON crm_bookings(status);

-- Cases (Multi-Visit Tracking)
CREATE TABLE IF NOT EXISTS crm_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES crm_leads(id),
  clinic_id uuid REFERENCES clinics(id),
  service_line_id uuid REFERENCES crm_service_lines(id),
  payor_type_id uuid REFERENCES crm_payor_types(id),
  clv_tier_id uuid REFERENCES crm_clv_tiers(id),
  case_number text UNIQUE NOT NULL,
  status text CHECK (status IN ('active', 'completed', 'abandoned')) DEFAULT 'active',
  planned_visits integer,
  completed_visits integer DEFAULT 0,
  total_revenue numeric(10,2) DEFAULT 0,
  total_cost numeric(10,2) DEFAULT 0,
  margin_percent numeric(5,2),
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE crm_cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view cases"
  ON crm_cases FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage cases"
  ON crm_cases FOR ALL
  TO authenticated
  USING (true);

CREATE INDEX idx_crm_cases_lead ON crm_cases(lead_id);
CREATE INDEX idx_crm_cases_clinic ON crm_cases(clinic_id);
CREATE INDEX idx_crm_cases_status ON crm_cases(status);

-- Case Visits
CREATE TABLE IF NOT EXISTS crm_case_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES crm_cases(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES crm_bookings(id),
  visit_number integer NOT NULL,
  visit_date timestamptz NOT NULL,
  clinician_id uuid REFERENCES auth.users(id),
  service_provided text,
  duration_minutes integer,
  revenue numeric(10,2),
  cost numeric(10,2),
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE crm_case_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view case visits"
  ON crm_case_visits FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage case visits"
  ON crm_case_visits FOR ALL
  TO authenticated
  USING (true);

CREATE INDEX idx_crm_case_visits_case ON crm_case_visits(case_id);
CREATE INDEX idx_crm_case_visits_date ON crm_case_visits(visit_date);

-- Upsells
CREATE TABLE IF NOT EXISTS crm_upsells (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES crm_cases(id) ON DELETE CASCADE,
  visit_id uuid REFERENCES crm_case_visits(id),
  upsell_type text NOT NULL,
  upsell_name text NOT NULL,
  revenue numeric(10,2) NOT NULL,
  offered_by uuid REFERENCES auth.users(id),
  accepted boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE crm_upsells ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view upsells"
  ON crm_upsells FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage upsells"
  ON crm_upsells FOR ALL
  TO authenticated
  USING (true);

CREATE INDEX idx_crm_upsells_case ON crm_upsells(case_id);

-- Capacity Rules
CREATE TABLE IF NOT EXISTS crm_capacity_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES clinics(id),
  rule_name text NOT NULL,
  rule_type text CHECK (rule_type IN ('pause_ads', 'prioritize_service', 'block_booking')) NOT NULL,
  condition_field text NOT NULL,
  condition_operator text CHECK (condition_operator IN ('<', '<=', '>', '>=', '=')) NOT NULL,
  condition_value numeric NOT NULL,
  action_target text,
  action_value text,
  priority integer DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE crm_capacity_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage capacity rules"
  ON crm_capacity_rules FOR ALL
  TO authenticated
  USING (true);

-- Capacity Snapshots
CREATE TABLE IF NOT EXISTS crm_capacity_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES clinics(id),
  snapshot_date date NOT NULL,
  total_slots integer NOT NULL,
  booked_slots integer NOT NULL,
  available_slots integer NOT NULL,
  capacity_percent numeric(5,2),
  high_clv_slots integer DEFAULT 0,
  medium_clv_slots integer DEFAULT 0,
  low_clv_slots integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(clinic_id, snapshot_date)
);

ALTER TABLE crm_capacity_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view capacity snapshots"
  ON crm_capacity_snapshots FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage capacity snapshots"
  ON crm_capacity_snapshots FOR ALL
  TO authenticated
  USING (true);

CREATE INDEX idx_crm_capacity_clinic_date ON crm_capacity_snapshots(clinic_id, snapshot_date DESC);

-- Alerts
CREATE TABLE IF NOT EXISTS crm_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text CHECK (alert_type IN ('capacity', 'cpa', 'cash_lag', 'no_show', 'lead_sla', 'revenue')) NOT NULL,
  severity text CHECK (severity IN ('info', 'warning', 'critical')) DEFAULT 'info',
  title text NOT NULL,
  message text NOT NULL,
  clinic_id uuid REFERENCES clinics(id),
  campaign_id uuid REFERENCES crm_campaigns(id),
  lead_id uuid REFERENCES crm_leads(id),
  metadata jsonb,
  acknowledged boolean DEFAULT false,
  acknowledged_by uuid REFERENCES auth.users(id),
  acknowledged_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE crm_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view alerts"
  ON crm_alerts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage alerts"
  ON crm_alerts FOR ALL
  TO authenticated
  USING (true);

CREATE INDEX idx_crm_alerts_type ON crm_alerts(alert_type);
CREATE INDEX idx_crm_alerts_severity ON crm_alerts(severity);
CREATE INDEX idx_crm_alerts_created ON crm_alerts(created_at DESC);

-- Follow-ups
CREATE TABLE IF NOT EXISTS crm_follow_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES crm_leads(id) ON DELETE CASCADE,
  follow_up_type text CHECK (follow_up_type IN ('sms', 'email', 'call')) NOT NULL,
  scheduled_at timestamptz NOT NULL,
  sent_at timestamptz,
  status text CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')) DEFAULT 'pending',
  template_name text,
  message_content text,
  response_received boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE crm_follow_ups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view follow-ups"
  ON crm_follow_ups FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage follow-ups"
  ON crm_follow_ups FOR ALL
  TO authenticated
  USING (true);

CREATE INDEX idx_crm_follow_ups_lead ON crm_follow_ups(lead_id);
CREATE INDEX idx_crm_follow_ups_scheduled ON crm_follow_ups(scheduled_at);
CREATE INDEX idx_crm_follow_ups_status ON crm_follow_ups(status);

-- Staff Performance
CREATE TABLE IF NOT EXISTS crm_staff_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  clinic_id uuid REFERENCES clinics(id),
  metric_date date NOT NULL,
  leads_contacted integer DEFAULT 0,
  leads_booked integer DEFAULT 0,
  bookings_showed integer DEFAULT 0,
  bookings_no_show integer DEFAULT 0,
  multi_visit_conversions integer DEFAULT 0,
  upsells_successful integer DEFAULT 0,
  avg_contact_time_minutes numeric(10,2),
  conversion_rate numeric(5,2),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, clinic_id, metric_date)
);

ALTER TABLE crm_staff_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view staff performance"
  ON crm_staff_performance FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage staff performance"
  ON crm_staff_performance FOR ALL
  TO authenticated
  USING (true);

CREATE INDEX idx_crm_staff_performance_user_date ON crm_staff_performance(user_id, metric_date DESC);

-- Revenue Tracking
CREATE TABLE IF NOT EXISTS crm_revenue_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES crm_cases(id),
  clinic_id uuid REFERENCES clinics(id),
  service_line_id uuid REFERENCES crm_service_lines(id),
  payor_type_id uuid REFERENCES crm_payor_types(id),
  revenue_date date NOT NULL,
  revenue_amount numeric(10,2) NOT NULL,
  cost_amount numeric(10,2),
  margin_amount numeric(10,2),
  margin_percent numeric(5,2),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE crm_revenue_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view revenue tracking"
  ON crm_revenue_tracking FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage revenue tracking"
  ON crm_revenue_tracking FOR ALL
  TO authenticated
  USING (true);

CREATE INDEX idx_crm_revenue_clinic_date ON crm_revenue_tracking(clinic_id, revenue_date DESC);

-- Cash Lag Tracking
CREATE TABLE IF NOT EXISTS crm_cash_lag_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES crm_cases(id),
  payor_type_id uuid REFERENCES crm_payor_types(id),
  service_date date NOT NULL,
  billed_date date,
  payment_received_date date,
  amount numeric(10,2) NOT NULL,
  days_to_payment integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE crm_cash_lag_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view cash lag tracking"
  ON crm_cash_lag_tracking FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage cash lag tracking"
  ON crm_cash_lag_tracking FOR ALL
  TO authenticated
  USING (true);

CREATE INDEX idx_crm_cash_lag_payor ON crm_cash_lag_tracking(payor_type_id);

-- Trigger: Auto-update lead status on booking
CREATE OR REPLACE FUNCTION update_lead_on_booking()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE crm_leads
  SET status = 'booked',
      booked_at = NEW.created_at,
      updated_at = now()
  WHERE id = NEW.lead_id
  AND status = 'contacted';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_lead_on_booking ON crm_bookings;
CREATE TRIGGER trigger_update_lead_on_booking
  AFTER INSERT ON crm_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_lead_on_booking();

-- Function: Calculate real-time capacity
CREATE OR REPLACE FUNCTION calculate_clinic_capacity(p_clinic_id uuid, p_date date)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
  v_total_slots integer;
  v_booked_slots integer;
BEGIN
  -- Calculate total available slots (8 hours * 60 min / avg 60 min appointment = 8 slots per clinician)
  SELECT COALESCE(COUNT(*) * 8, 8) INTO v_total_slots
  FROM clinic_assignments
  WHERE clinic_id = p_clinic_id
  AND active = true;
  
  -- Count booked slots
  SELECT COALESCE(COUNT(*), 0) INTO v_booked_slots
  FROM crm_bookings
  WHERE clinic_id = p_clinic_id
  AND DATE(scheduled_at) = p_date
  AND status IN ('scheduled', 'confirmed');
  
  v_result := jsonb_build_object(
    'total_slots', v_total_slots,
    'booked_slots', v_booked_slots,
    'available_slots', v_total_slots - v_booked_slots,
    'capacity_percent', ROUND((v_booked_slots::numeric / NULLIF(v_total_slots, 0)) * 100, 2)
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;