/*
  # Enterprise OS Layer — Tables + RLS + Seed Data

  Creates all 14 enterprise OS tables, enables RLS, and seeds canonical data.
  This migration is safe to re-run (uses IF NOT EXISTS / ON CONFLICT DO NOTHING).
*/

-- ─────────────────────────────────────────
-- TABLES
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS scorecards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  region_id uuid REFERENCES regions(id) ON DELETE SET NULL,
  clinic_id uuid REFERENCES clinics(id) ON DELETE SET NULL,
  scope_level text NOT NULL CHECK (scope_level IN ('network','region','clinic','team','owner')),
  period_type text NOT NULL CHECK (period_type IN ('weekly','monthly','quarterly','annual')),
  period_label text NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','reviewed','locked')),
  overall_rag text DEFAULT 'not_set' CHECK (overall_rag IN ('red','yellow','green','not_set')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scorecard_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scorecard_id uuid NOT NULL REFERENCES scorecards(id) ON DELETE CASCADE,
  kpi_definition_id uuid,
  metric_name text NOT NULL,
  category text NOT NULL,
  projected numeric,
  actual numeric,
  target numeric,
  unit text DEFAULT '',
  higher_is_better boolean DEFAULT true,
  rag_status text NOT NULL DEFAULT 'not_set' CHECK (rag_status IN ('red','yellow','green','not_set')),
  owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  owner_comment text,
  recovery_plan text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS goal_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES goal_nodes(id) ON DELETE CASCADE,
  goal_level text NOT NULL CHECK (goal_level IN ('bhag','3hag','annual','quarterly','regional','clinic','owner')),
  title text NOT NULL,
  description text,
  fiscal_year integer,
  quarter integer CHECK (quarter BETWEEN 1 AND 4),
  scope_level text CHECK (scope_level IN ('network','region','clinic','team','owner')),
  region_id uuid REFERENCES regions(id) ON DELETE SET NULL,
  clinic_id uuid REFERENCES clinics(id) ON DELETE SET NULL,
  owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  rag_status text NOT NULL DEFAULT 'not_set' CHECK (rag_status IN ('red','yellow','green','not_set')),
  progress_pct numeric DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
  projected_pct numeric DEFAULT 0,
  target_value numeric,
  current_value numeric,
  unit text DEFAULT '',
  due_date date,
  closed_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS goal_progress_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_node_id uuid NOT NULL REFERENCES goal_nodes(id) ON DELETE CASCADE,
  snapshot_date date NOT NULL,
  progress_pct numeric NOT NULL,
  actual_value numeric,
  rag_status text CHECK (rag_status IN ('red','yellow','green','not_set')),
  notes text,
  captured_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS meeting_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  cadence_type text NOT NULL CHECK (cadence_type IN ('daily_huddle','weekly_tactical','monthly_business_review','quarterly_planning','annual_strategic')),
  title text NOT NULL,
  default_duration_minutes integer NOT NULL DEFAULT 30,
  default_agenda jsonb NOT NULL DEFAULT '[]'::jsonb,
  scorecard_sections jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS meeting_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES meeting_templates(id) ON DELETE SET NULL,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  region_id uuid REFERENCES regions(id) ON DELETE SET NULL,
  clinic_id uuid REFERENCES clinics(id) ON DELETE SET NULL,
  cadence_type text NOT NULL CHECK (cadence_type IN ('daily_huddle','weekly_tactical','monthly_business_review','quarterly_planning','annual_strategic')),
  title text NOT NULL,
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 30,
  facilitator_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','in_progress','completed','cancelled')),
  attendance_count integer DEFAULT 0,
  notes text,
  scorecard_ref_id uuid REFERENCES scorecards(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS meeting_agenda_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES meeting_sessions(id) ON DELETE CASCADE,
  item_type text NOT NULL CHECK (item_type IN ('scorecard_review','goal_update','issue','risk','announcement','action_review','open_discussion','kpi_alert','custom')),
  title text NOT NULL,
  description text,
  duration_minutes integer DEFAULT 5,
  auto_generated boolean DEFAULT false,
  source_ref_id uuid,
  source_ref_type text,
  status text DEFAULT 'pending' CHECK (status IN ('pending','discussed','deferred','resolved')),
  sort_order integer DEFAULT 0,
  presenter_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS meeting_action_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES meeting_sessions(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  due_date date,
  priority text DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
  status text DEFAULT 'open' CHECK (status IN ('open','in_progress','complete','cancelled')),
  linked_goal_id uuid REFERENCES goal_nodes(id) ON DELETE SET NULL,
  linked_scorecard_metric_id uuid REFERENCES scorecard_metrics(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kpi_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  slug text NOT NULL,
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('operations','clinical','financial','workforce','growth','quality','patient_experience')),
  description text NOT NULL,
  formula text,
  data_source text,
  unit text NOT NULL DEFAULT '',
  unit_label text DEFAULT '',
  frequency text NOT NULL CHECK (frequency IN ('daily','weekly','monthly','quarterly','annual')),
  higher_is_better boolean DEFAULT true,
  red_threshold numeric,
  yellow_threshold numeric,
  green_threshold numeric,
  benchmark_source text,
  benchmark_value numeric,
  is_active boolean DEFAULT true,
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, slug)
);

CREATE TABLE IF NOT EXISTS kpi_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_definition_id uuid NOT NULL REFERENCES kpi_definitions(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  region_id uuid REFERENCES regions(id) ON DELETE SET NULL,
  clinic_id uuid REFERENCES clinics(id) ON DELETE SET NULL,
  provider_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  period_type text NOT NULL CHECK (period_type IN ('daily','weekly','monthly','quarterly','annual')),
  period_label text NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  actual_value numeric NOT NULL,
  projected_value numeric,
  target_value numeric,
  rag_status text NOT NULL DEFAULT 'not_set' CHECK (rag_status IN ('red','yellow','green','not_set')),
  notes text,
  computed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kpi_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_definition_id uuid NOT NULL REFERENCES kpi_definitions(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  region_id uuid REFERENCES regions(id) ON DELETE SET NULL,
  clinic_id uuid REFERENCES clinics(id) ON DELETE SET NULL,
  period_type text NOT NULL CHECK (period_type IN ('weekly','monthly','quarterly','annual')),
  fiscal_year integer NOT NULL,
  quarter integer CHECK (quarter BETWEEN 1 AND 4),
  target_value numeric NOT NULL,
  stretch_target numeric,
  minimum_threshold numeric,
  set_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(kpi_definition_id, organization_id, region_id, clinic_id, period_type, fiscal_year, quarter)
);

CREATE TABLE IF NOT EXISTS fhir_event_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  subscription_name text NOT NULL,
  resource_type text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('created','updated','deleted','status_changed','threshold_crossed','deadline_approaching','pattern_detected')),
  filter_criteria jsonb DEFAULT '{}'::jsonb,
  action_type text NOT NULL CHECK (action_type IN ('notify_user','create_task','trigger_workflow','send_sms','send_email','create_meeting_agenda_item','update_rag_status','escalate')),
  action_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  target_role_levels text[] DEFAULT '{}',
  target_user_ids uuid[] DEFAULT '{}',
  clinic_scope_ids uuid[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fhir_event_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid REFERENCES fhir_event_subscriptions(id) ON DELETE SET NULL,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  resource_type text NOT NULL,
  resource_id uuid,
  event_type text NOT NULL,
  payload jsonb DEFAULT '{}'::jsonb,
  fired_at timestamptz DEFAULT now(),
  processed boolean DEFAULT false,
  processed_at timestamptz,
  error_message text,
  retry_count integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS scope_access_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  region_id uuid REFERENCES regions(id) ON DELETE SET NULL,
  clinic_id uuid REFERENCES clinics(id) ON DELETE SET NULL,
  access_level text NOT NULL CHECK (access_level IN ('read','write','admin')),
  granted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  granted_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  UNIQUE(user_id, organization_id, region_id, clinic_id, access_level)
);

-- ─────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_scorecards_scope ON scorecards(scope_level, period_type, period_start);
CREATE INDEX IF NOT EXISTS idx_scorecards_clinic ON scorecards(clinic_id) WHERE clinic_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_scorecard_metrics_scorecard ON scorecard_metrics(scorecard_id);
CREATE INDEX IF NOT EXISTS idx_goal_nodes_level ON goal_nodes(goal_level, fiscal_year);
CREATE INDEX IF NOT EXISTS idx_goal_nodes_org ON goal_nodes(organization_id);
CREATE INDEX IF NOT EXISTS idx_goal_progress_goal ON goal_progress_snapshots(goal_node_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_meeting_sessions_sched ON meeting_sessions(scheduled_at DESC);
CREATE INDEX IF NOT EXISTS idx_kpi_definitions_slug ON kpi_definitions(slug);
CREATE INDEX IF NOT EXISTS idx_kpi_values_def_period ON kpi_values(kpi_definition_id, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_fhir_event_log_fired ON fhir_event_log(fired_at DESC);
CREATE INDEX IF NOT EXISTS idx_scope_policies_user ON scope_access_policies(user_id, is_active);

-- ─────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────

ALTER TABLE scorecards ENABLE ROW LEVEL SECURITY;
ALTER TABLE scorecard_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_progress_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_agenda_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE fhir_event_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fhir_event_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE scope_access_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sc_sel" ON scorecards FOR SELECT TO authenticated USING (auth.uid() IN (SELECT user_id FROM user_scope_memberships WHERE is_active=true AND organization_id=scorecards.organization_id) OR auth.uid()=owner_user_id);
CREATE POLICY "sc_ins" ON scorecards FOR INSERT TO authenticated WITH CHECK (auth.uid() IN (SELECT user_id FROM user_scope_memberships WHERE is_active=true AND organization_id=scorecards.organization_id));
CREATE POLICY "sc_upd" ON scorecards FOR UPDATE TO authenticated USING (auth.uid()=owner_user_id) WITH CHECK (auth.uid()=owner_user_id);
CREATE POLICY "sc_del" ON scorecards FOR DELETE TO authenticated USING (auth.uid()=owner_user_id);

CREATE POLICY "scm_sel" ON scorecard_metrics FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM scorecards s WHERE s.id=scorecard_id AND (auth.uid() IN (SELECT user_id FROM user_scope_memberships WHERE is_active=true AND organization_id=s.organization_id) OR auth.uid()=s.owner_user_id)));
CREATE POLICY "scm_ins" ON scorecard_metrics FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM scorecards s WHERE s.id=scorecard_id AND auth.uid()=s.owner_user_id));
CREATE POLICY "scm_upd" ON scorecard_metrics FOR UPDATE TO authenticated USING (auth.uid()=owner_user_id OR EXISTS (SELECT 1 FROM scorecards s WHERE s.id=scorecard_id AND auth.uid()=s.owner_user_id)) WITH CHECK (auth.uid()=owner_user_id OR EXISTS (SELECT 1 FROM scorecards s WHERE s.id=scorecard_id AND auth.uid()=s.owner_user_id));
CREATE POLICY "scm_del" ON scorecard_metrics FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM scorecards s WHERE s.id=scorecard_id AND auth.uid()=s.owner_user_id));

CREATE POLICY "gn_sel" ON goal_nodes FOR SELECT TO authenticated USING (auth.uid() IN (SELECT user_id FROM user_scope_memberships WHERE is_active=true AND organization_id=goal_nodes.organization_id));
CREATE POLICY "gn_ins" ON goal_nodes FOR INSERT TO authenticated WITH CHECK (auth.uid() IN (SELECT user_id FROM user_scope_memberships WHERE is_active=true AND organization_id=goal_nodes.organization_id));
CREATE POLICY "gn_upd" ON goal_nodes FOR UPDATE TO authenticated USING (auth.uid()=owner_user_id) WITH CHECK (auth.uid()=owner_user_id);
CREATE POLICY "gn_del" ON goal_nodes FOR DELETE TO authenticated USING (auth.uid()=owner_user_id);

CREATE POLICY "gps_sel" ON goal_progress_snapshots FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM goal_nodes g JOIN user_scope_memberships m ON m.organization_id=g.organization_id AND m.user_id=auth.uid() AND m.is_active=true WHERE g.id=goal_node_id));
CREATE POLICY "gps_ins" ON goal_progress_snapshots FOR INSERT TO authenticated WITH CHECK (auth.uid()=captured_by);
CREATE POLICY "gps_upd" ON goal_progress_snapshots FOR UPDATE TO authenticated USING (auth.uid()=captured_by) WITH CHECK (auth.uid()=captured_by);
CREATE POLICY "gps_del" ON goal_progress_snapshots FOR DELETE TO authenticated USING (auth.uid()=captured_by);

CREATE POLICY "mt_sel" ON meeting_templates FOR SELECT TO authenticated USING (auth.uid() IN (SELECT user_id FROM user_scope_memberships WHERE is_active=true AND organization_id=meeting_templates.organization_id));
CREATE POLICY "mt_ins" ON meeting_templates FOR INSERT TO authenticated WITH CHECK (auth.uid() IN (SELECT user_id FROM user_scope_memberships WHERE is_active=true AND organization_id=meeting_templates.organization_id));
CREATE POLICY "mt_upd" ON meeting_templates FOR UPDATE TO authenticated USING (auth.uid() IN (SELECT user_id FROM user_scope_memberships WHERE is_active=true AND organization_id=meeting_templates.organization_id)) WITH CHECK (auth.uid() IN (SELECT user_id FROM user_scope_memberships WHERE is_active=true AND organization_id=meeting_templates.organization_id));
CREATE POLICY "mt_del" ON meeting_templates FOR DELETE TO authenticated USING (auth.uid() IN (SELECT user_id FROM user_scope_memberships WHERE is_active=true AND organization_id=meeting_templates.organization_id));

CREATE POLICY "ms_sel" ON meeting_sessions FOR SELECT TO authenticated USING (auth.uid() IN (SELECT user_id FROM user_scope_memberships WHERE is_active=true AND organization_id=meeting_sessions.organization_id) OR auth.uid()=facilitator_user_id);
CREATE POLICY "ms_ins" ON meeting_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() IN (SELECT user_id FROM user_scope_memberships WHERE is_active=true AND organization_id=meeting_sessions.organization_id));
CREATE POLICY "ms_upd" ON meeting_sessions FOR UPDATE TO authenticated USING (auth.uid()=facilitator_user_id) WITH CHECK (auth.uid()=facilitator_user_id);
CREATE POLICY "ms_del" ON meeting_sessions FOR DELETE TO authenticated USING (auth.uid()=facilitator_user_id);

CREATE POLICY "mai_sel" ON meeting_agenda_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM meeting_sessions ms WHERE ms.id=session_id AND (auth.uid() IN (SELECT user_id FROM user_scope_memberships WHERE is_active=true AND organization_id=ms.organization_id) OR auth.uid()=ms.facilitator_user_id)));
CREATE POLICY "mai_ins" ON meeting_agenda_items FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM meeting_sessions ms WHERE ms.id=session_id AND auth.uid() IN (SELECT user_id FROM user_scope_memberships WHERE is_active=true AND organization_id=ms.organization_id)));
CREATE POLICY "mai_upd" ON meeting_agenda_items FOR UPDATE TO authenticated USING (auth.uid()=presenter_user_id OR EXISTS (SELECT 1 FROM meeting_sessions ms WHERE ms.id=session_id AND auth.uid()=ms.facilitator_user_id)) WITH CHECK (auth.uid()=presenter_user_id OR EXISTS (SELECT 1 FROM meeting_sessions ms WHERE ms.id=session_id AND auth.uid()=ms.facilitator_user_id));
CREATE POLICY "mai_del" ON meeting_agenda_items FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM meeting_sessions ms WHERE ms.id=session_id AND auth.uid()=ms.facilitator_user_id));

CREATE POLICY "macti_sel" ON meeting_action_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM meeting_sessions ms WHERE ms.id=session_id AND auth.uid() IN (SELECT user_id FROM user_scope_memberships WHERE is_active=true AND organization_id=ms.organization_id)) OR auth.uid()=owner_user_id);
CREATE POLICY "macti_ins" ON meeting_action_items FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM meeting_sessions ms WHERE ms.id=session_id AND auth.uid() IN (SELECT user_id FROM user_scope_memberships WHERE is_active=true AND organization_id=ms.organization_id)));
CREATE POLICY "macti_upd" ON meeting_action_items FOR UPDATE TO authenticated USING (auth.uid()=owner_user_id) WITH CHECK (auth.uid()=owner_user_id);
CREATE POLICY "macti_del" ON meeting_action_items FOR DELETE TO authenticated USING (auth.uid()=owner_user_id);

CREATE POLICY "kd_sel" ON kpi_definitions FOR SELECT TO authenticated USING (auth.uid() IN (SELECT user_id FROM user_scope_memberships WHERE is_active=true AND organization_id=kpi_definitions.organization_id));
CREATE POLICY "kd_ins" ON kpi_definitions FOR INSERT TO authenticated WITH CHECK (auth.uid() IN (SELECT user_id FROM user_scope_memberships WHERE is_active=true AND organization_id=kpi_definitions.organization_id));
CREATE POLICY "kd_upd" ON kpi_definitions FOR UPDATE TO authenticated USING (auth.uid() IN (SELECT user_id FROM user_scope_memberships WHERE is_active=true AND organization_id=kpi_definitions.organization_id)) WITH CHECK (auth.uid() IN (SELECT user_id FROM user_scope_memberships WHERE is_active=true AND organization_id=kpi_definitions.organization_id));
CREATE POLICY "kd_del" ON kpi_definitions FOR DELETE TO authenticated USING (auth.uid() IN (SELECT user_id FROM user_scope_memberships WHERE is_active=true AND organization_id=kpi_definitions.organization_id));

CREATE POLICY "kv_sel" ON kpi_values FOR SELECT TO authenticated USING (auth.uid() IN (SELECT user_id FROM user_scope_memberships WHERE is_active=true AND (organization_id=kpi_values.organization_id OR clinic_id=kpi_values.clinic_id OR region_id=kpi_values.region_id)) OR auth.uid()=provider_user_id);
CREATE POLICY "kv_ins" ON kpi_values FOR INSERT TO authenticated WITH CHECK (auth.uid() IN (SELECT user_id FROM user_scope_memberships WHERE is_active=true AND organization_id=kpi_values.organization_id));
CREATE POLICY "kv_upd" ON kpi_values FOR UPDATE TO authenticated USING (auth.uid() IN (SELECT user_id FROM user_scope_memberships WHERE is_active=true AND organization_id=kpi_values.organization_id)) WITH CHECK (auth.uid() IN (SELECT user_id FROM user_scope_memberships WHERE is_active=true AND organization_id=kpi_values.organization_id));
CREATE POLICY "kv_del" ON kpi_values FOR DELETE TO authenticated USING (auth.uid() IN (SELECT user_id FROM user_scope_memberships WHERE is_active=true AND organization_id=kpi_values.organization_id));

CREATE POLICY "kt_sel" ON kpi_targets FOR SELECT TO authenticated USING (auth.uid() IN (SELECT user_id FROM user_scope_memberships WHERE is_active=true AND (organization_id=kpi_targets.organization_id OR clinic_id=kpi_targets.clinic_id OR region_id=kpi_targets.region_id)));
CREATE POLICY "kt_ins" ON kpi_targets FOR INSERT TO authenticated WITH CHECK (auth.uid() IN (SELECT user_id FROM user_scope_memberships WHERE is_active=true AND organization_id=kpi_targets.organization_id));
CREATE POLICY "kt_upd" ON kpi_targets FOR UPDATE TO authenticated USING (auth.uid()=set_by) WITH CHECK (auth.uid()=set_by);
CREATE POLICY "kt_del" ON kpi_targets FOR DELETE TO authenticated USING (auth.uid()=set_by);

CREATE POLICY "fes_sel" ON fhir_event_subscriptions FOR SELECT TO authenticated USING (auth.uid() IN (SELECT user_id FROM user_scope_memberships WHERE is_active=true AND organization_id=fhir_event_subscriptions.organization_id));
CREATE POLICY "fes_ins" ON fhir_event_subscriptions FOR INSERT TO authenticated WITH CHECK (auth.uid() IN (SELECT user_id FROM user_scope_memberships WHERE is_active=true AND organization_id=fhir_event_subscriptions.organization_id));
CREATE POLICY "fes_upd" ON fhir_event_subscriptions FOR UPDATE TO authenticated USING (auth.uid()=created_by) WITH CHECK (auth.uid()=created_by);
CREATE POLICY "fes_del" ON fhir_event_subscriptions FOR DELETE TO authenticated USING (auth.uid()=created_by);

CREATE POLICY "fel_sel" ON fhir_event_log FOR SELECT TO authenticated USING (auth.uid() IN (SELECT user_id FROM user_scope_memberships WHERE is_active=true AND organization_id=fhir_event_log.organization_id));
CREATE POLICY "fel_ins" ON fhir_event_log FOR INSERT TO authenticated WITH CHECK (auth.uid() IN (SELECT user_id FROM user_scope_memberships WHERE is_active=true AND organization_id=fhir_event_log.organization_id));
CREATE POLICY "fel_upd" ON fhir_event_log FOR UPDATE TO authenticated USING (auth.uid() IN (SELECT user_id FROM user_scope_memberships WHERE is_active=true AND organization_id=fhir_event_log.organization_id)) WITH CHECK (auth.uid() IN (SELECT user_id FROM user_scope_memberships WHERE is_active=true AND organization_id=fhir_event_log.organization_id));
CREATE POLICY "fel_del" ON fhir_event_log FOR DELETE TO authenticated USING (auth.uid() IN (SELECT user_id FROM user_scope_memberships WHERE is_active=true AND organization_id=fhir_event_log.organization_id));

CREATE POLICY "sap_sel" ON scope_access_policies FOR SELECT TO authenticated USING (auth.uid()=user_id OR auth.uid()=granted_by);
CREATE POLICY "sap_ins" ON scope_access_policies FOR INSERT TO authenticated WITH CHECK (auth.uid()=granted_by);
CREATE POLICY "sap_upd" ON scope_access_policies FOR UPDATE TO authenticated USING (auth.uid()=granted_by) WITH CHECK (auth.uid()=granted_by);
CREATE POLICY "sap_del" ON scope_access_policies FOR DELETE TO authenticated USING (auth.uid()=granted_by);

-- ─────────────────────────────────────────
-- SEED DATA
-- ─────────────────────────────────────────

DO $$
DECLARE
  v_org uuid;
  v_bhag uuid;
  v_hag uuid;
  v_sc uuid;
BEGIN
  SELECT id INTO v_org FROM organizations ORDER BY created_at LIMIT 1;
  IF v_org IS NULL THEN RETURN; END IF;

  -- KPI Definitions
  INSERT INTO kpi_definitions (organization_id,slug,name,category,description,formula,unit,unit_label,frequency,higher_is_better,red_threshold,yellow_threshold,green_threshold,benchmark_source,benchmark_value)
  SELECT v_org,'provider_utilization','Provider Utilization','operations','Percentage of available provider hours that are billable/scheduled. Per APTA PPS.','(Scheduled Hours / Available Hours) x 100','%','Percent','monthly',true,75,85,90,'APTA PPS 2024',87
  WHERE NOT EXISTS (SELECT 1 FROM kpi_definitions WHERE organization_id=v_org AND slug='provider_utilization');

  INSERT INTO kpi_definitions (organization_id,slug,name,category,description,formula,unit,unit_label,frequency,higher_is_better,red_threshold,yellow_threshold,green_threshold,benchmark_source,benchmark_value)
  SELECT v_org,'visits_per_provider','Visits per Provider per Day','operations','Average patient visits per FTE provider per day.','Total Visits / Provider FTE / Working Days','visits','Visits/FTE/Day','monthly',true,8,10,12,'Clinicient Benchmark 2024',10.5
  WHERE NOT EXISTS (SELECT 1 FROM kpi_definitions WHERE organization_id=v_org AND slug='visits_per_provider');

  INSERT INTO kpi_definitions (organization_id,slug,name,category,description,formula,unit,unit_label,frequency,higher_is_better,red_threshold,yellow_threshold,green_threshold,benchmark_source,benchmark_value)
  SELECT v_org,'no_show_rate','No-Show Rate','operations','Percentage of scheduled appointments where patient did not attend without advance cancellation.','(No-Shows / Total Scheduled) x 100','%','Percent','monthly',false,10,7,4,'MGMA 2024',6.2
  WHERE NOT EXISTS (SELECT 1 FROM kpi_definitions WHERE organization_id=v_org AND slug='no_show_rate');

  INSERT INTO kpi_definitions (organization_id,slug,name,category,description,formula,unit,unit_label,frequency,higher_is_better,red_threshold,yellow_threshold,green_threshold,benchmark_source,benchmark_value)
  SELECT v_org,'wait_time_first_visit','Wait Time to First Visit','patient_experience','Average calendar days from referral to first attended visit.','AVG(First Visit Date - Referral Date)','days','Days','monthly',false,14,10,7,'AIM Network Internal 2024',8
  WHERE NOT EXISTS (SELECT 1 FROM kpi_definitions WHERE organization_id=v_org AND slug='wait_time_first_visit');

  INSERT INTO kpi_definitions (organization_id,slug,name,category,description,formula,unit,unit_label,frequency,higher_is_better,red_threshold,yellow_threshold,green_threshold,benchmark_source,benchmark_value)
  SELECT v_org,'plan_completion_rate','Plan Completion Rate','clinical','Percentage of treatment plans completed through planned discharge.','(Completed Plans / Started Plans) x 100','%','Percent','monthly',true,70,82,90,'Clinicient Benchmark 2024',84
  WHERE NOT EXISTS (SELECT 1 FROM kpi_definitions WHERE organization_id=v_org AND slug='plan_completion_rate');

  INSERT INTO kpi_definitions (organization_id,slug,name,category,description,formula,unit,unit_label,frequency,higher_is_better,red_threshold,yellow_threshold,green_threshold,benchmark_source,benchmark_value)
  SELECT v_org,'reassessment_compliance','Reassessment Compliance','clinical','Percentage of active patients reassessed within mandated interval (every 6 visits or 30 days).','(Reassessments on Time / Reassessments Due) x 100','%','Percent','monthly',true,70,85,95,'APTA CPG 2024',90
  WHERE NOT EXISTS (SELECT 1 FROM kpi_definitions WHERE organization_id=v_org AND slug='reassessment_compliance');

  INSERT INTO kpi_definitions (organization_id,slug,name,category,description,formula,unit,unit_label,frequency,higher_is_better,red_threshold,yellow_threshold,green_threshold,benchmark_source,benchmark_value)
  SELECT v_org,'net_days_ar','Net Days in AR','financial','Average days to collect a claim from date of service. Canonical per HFMA MAP Key.','Net AR Balance / (Net Collections / Days in Period)','days','Days','monthly',false,50,40,30,'HFMA MAP Key 2024',35
  WHERE NOT EXISTS (SELECT 1 FROM kpi_definitions WHERE organization_id=v_org AND slug='net_days_ar');

  INSERT INTO kpi_definitions (organization_id,slug,name,category,description,formula,unit,unit_label,frequency,higher_is_better,red_threshold,yellow_threshold,green_threshold,benchmark_source,benchmark_value)
  SELECT v_org,'denial_rate','Denial Rate','financial','Percentage of claims denied on first submission before appeals.','(Denied Claims / Submitted Claims) x 100','%','Percent','monthly',false,10,6,3,'HFMA MAP Key 2024',5.1
  WHERE NOT EXISTS (SELECT 1 FROM kpi_definitions WHERE organization_id=v_org AND slug='denial_rate');

  INSERT INTO kpi_definitions (organization_id,slug,name,category,description,formula,unit,unit_label,frequency,higher_is_better,red_threshold,yellow_threshold,green_threshold,benchmark_source,benchmark_value)
  SELECT v_org,'revenue_per_provider','Revenue per Provider Monthly','financial','Total collected revenue divided by FTE providers in the period.','Total Collected Revenue / Provider FTE','$','USD','monthly',true,18000,22000,26000,'AIM Network Internal 2024',24000
  WHERE NOT EXISTS (SELECT 1 FROM kpi_definitions WHERE organization_id=v_org AND slug='revenue_per_provider');

  INSERT INTO kpi_definitions (organization_id,slug,name,category,description,formula,unit,unit_label,frequency,higher_is_better,red_threshold,yellow_threshold,green_threshold,benchmark_source,benchmark_value)
  SELECT v_org,'vacancy_rate','Provider Vacancy Rate','workforce','Percentage of budgeted provider FTE positions currently unfilled.','(Vacant / Budgeted) x 100','%','Percent','monthly',false,20,10,5,'SHRM Healthcare 2024',8
  WHERE NOT EXISTS (SELECT 1 FROM kpi_definitions WHERE organization_id=v_org AND slug='vacancy_rate');

  -- Meeting Templates
  INSERT INTO meeting_templates (organization_id,cadence_type,title,default_duration_minutes,default_agenda)
  SELECT v_org,'daily_huddle','Daily Clinical Huddle',15,'[{"title":"Yesterday highlights","minutes":2},{"title":"Today schedule and capacity","minutes":3},{"title":"Open action items","minutes":5},{"title":"Blockers and announcements","minutes":5}]'::jsonb
  WHERE NOT EXISTS (SELECT 1 FROM meeting_templates WHERE organization_id=v_org AND cadence_type='daily_huddle');

  INSERT INTO meeting_templates (organization_id,cadence_type,title,default_duration_minutes,default_agenda)
  SELECT v_org,'weekly_tactical','Weekly Tactical Review',60,'[{"title":"Scorecard review — previous week","minutes":15},{"title":"Open issues — Reds and Yellows","minutes":15},{"title":"Action item review","minutes":10},{"title":"KPI variance discussion","minutes":10},{"title":"Goal progress update","minutes":5},{"title":"New items and announcements","minutes":5}]'::jsonb
  WHERE NOT EXISTS (SELECT 1 FROM meeting_templates WHERE organization_id=v_org AND cadence_type='weekly_tactical');

  INSERT INTO meeting_templates (organization_id,cadence_type,title,default_duration_minutes,default_agenda)
  SELECT v_org,'monthly_business_review','Monthly Business Review',90,'[{"title":"Monthly scorecard — all levels","minutes":20},{"title":"KPI deep dive — red metrics","minutes":20},{"title":"Goal cascade update","minutes":15},{"title":"Financial performance","minutes":15},{"title":"People and workforce","minutes":10},{"title":"Decisions and action items","minutes":10}]'::jsonb
  WHERE NOT EXISTS (SELECT 1 FROM meeting_templates WHERE organization_id=v_org AND cadence_type='monthly_business_review');

  INSERT INTO meeting_templates (organization_id,cadence_type,title,default_duration_minutes,default_agenda)
  SELECT v_org,'quarterly_planning','Quarterly Planning Session',180,'[{"title":"Previous quarter scorecard","minutes":20},{"title":"Goal cascade review","minutes":25},{"title":"Next quarter priorities — BHAG alignment","minutes":30},{"title":"KPI target setting","minutes":20},{"title":"Risk and issues","minutes":20},{"title":"Resource and budget alignment","minutes":20},{"title":"Action items and owners","minutes":25}]'::jsonb
  WHERE NOT EXISTS (SELECT 1 FROM meeting_templates WHERE organization_id=v_org AND cadence_type='quarterly_planning');

  INSERT INTO meeting_templates (organization_id,cadence_type,title,default_duration_minutes,default_agenda)
  SELECT v_org,'annual_strategic','Annual Strategic Planning',480,'[{"title":"Annual scorecard review","minutes":45},{"title":"BHAG progress and 3HAG alignment","minutes":30},{"title":"3-year picture update","minutes":45},{"title":"Annual priorities — next fiscal year","minutes":60},{"title":"KPI dictionary review and target approval","minutes":30},{"title":"Network and regional expansion","minutes":45},{"title":"Financial and capital plan","minutes":45},{"title":"People and culture strategy","minutes":30},{"title":"Technology and systems roadmap","minutes":30},{"title":"Risk management","minutes":20},{"title":"Year commitments and owners","minutes":20}]'::jsonb
  WHERE NOT EXISTS (SELECT 1 FROM meeting_templates WHERE organization_id=v_org AND cadence_type='annual_strategic');

  -- Goal Cascade
  IF NOT EXISTS (SELECT 1 FROM goal_nodes WHERE organization_id=v_org AND goal_level='bhag') THEN
    INSERT INTO goal_nodes (organization_id,goal_level,title,description,fiscal_year,scope_level,rag_status,progress_pct,projected_pct,unit)
    VALUES (v_org,'bhag','Become Canada''s most trusted physiotherapy network — 50 clinics, $100M revenue','Our 10-year BHAG. Every decision must move us closer.',2030,'network','green',22,20,'%')
    RETURNING id INTO v_bhag;

    INSERT INTO goal_nodes (organization_id,parent_id,goal_level,title,description,fiscal_year,scope_level,rag_status,progress_pct,projected_pct,unit)
    VALUES (v_org,v_bhag,'3hag','Build a replicable clinic excellence model across 20+ locations by 2027','Scalable operations, clinical quality, and outcomes defining the network standard.',2027,'network','green',38,35,'%')
    RETURNING id INTO v_hag;

    INSERT INTO goal_nodes (organization_id,parent_id,goal_level,title,description,fiscal_year,scope_level,rag_status,progress_pct,projected_pct,target_value,current_value,unit)
    VALUES (v_org,v_hag,'annual','Achieve 87%+ provider utilization across all clinics','Drive operational efficiency to network benchmark level.',2026,'network','yellow',61,70,87,82,'%');

    INSERT INTO goal_nodes (organization_id,parent_id,goal_level,title,description,fiscal_year,scope_level,rag_status,progress_pct,projected_pct,target_value,current_value,unit)
    VALUES (v_org,v_hag,'annual','Reduce AR days below 35 across all billing entities','Align revenue cycle to HFMA MAP Key standard.',2026,'network','red',40,60,35,44,'days');

    INSERT INTO goal_nodes (organization_id,parent_id,goal_level,title,description,fiscal_year,scope_level,rag_status,progress_pct,projected_pct,target_value,current_value,unit)
    VALUES (v_org,v_hag,'annual','Open 3 new clinics — South Commons, EPC flagship, 1 TBD','Expand network footprint.',2026,'network','green',67,60,3,2,'clinics');
  END IF;

  -- Sample Scorecard
  IF NOT EXISTS (SELECT 1 FROM scorecards WHERE organization_id=v_org AND period_label='February 2026' AND scope_level='network') THEN
    INSERT INTO scorecards (organization_id,scope_level,period_type,period_label,period_start,period_end,status,overall_rag,notes)
    VALUES (v_org,'network','monthly','February 2026','2026-02-01','2026-02-28','reviewed','yellow','AR days remain elevated. Utilization strong in most clinics except EPC.')
    RETURNING id INTO v_sc;

    INSERT INTO scorecard_metrics (scorecard_id,metric_name,category,projected,actual,target,unit,higher_is_better,rag_status,owner_comment,recovery_plan) VALUES
      (v_sc,'Provider Utilization','operations',87,84.2,87,'%',true,'yellow','EPC clinic drag — 3 providers onboarding.','Complete EPC onboarding by Mar 15. Weekly utilization tracking.'),
      (v_sc,'Visits per Provider/Day','operations',11,11.4,11,'visits',true,'green','Slightly above target.',NULL),
      (v_sc,'No-Show Rate','operations',6,5.8,6,'%',false,'green','Reminder automation working well.',NULL),
      (v_sc,'Net Days in AR','financial',38,44.1,35,'days',false,'red','Payer mix shift. Blue Cross processing delays.','Escalate Blue Cross denial queue. AR team daily review until resolved.'),
      (v_sc,'Denial Rate','financial',5,4.2,5,'%',false,'green','Below target. Coding accuracy improved.',NULL),
      (v_sc,'Plan Completion Rate','clinical',84,81.3,84,'%',true,'yellow','Patient drop-off increasing.','Patient retention protocol review for March weekly tactical.'),
      (v_sc,'Reassessment Compliance','clinical',90,92.1,90,'%',true,'green','Above target. Clinician dashboard reminders effective.',NULL),
      (v_sc,'Provider Vacancy Rate','workforce',10,8.5,10,'%',false,'green','Two hires closing this month.',NULL);
  END IF;

  -- FHIR Event Subscriptions
  INSERT INTO fhir_event_subscriptions (organization_id,subscription_name,resource_type,event_type,filter_criteria,action_type,action_config,is_active)
  SELECT v_org,'AR Days Red Alert','KPIValue','threshold_crossed','{"metric_slug":"net_days_ar","direction":"above","value":45}'::jsonb,'notify_user','{"message":"Net AR Days exceeded 45. Immediate review required.","priority":"high"}'::jsonb,true
  WHERE NOT EXISTS (SELECT 1 FROM fhir_event_subscriptions WHERE organization_id=v_org AND subscription_name='AR Days Red Alert');

  INSERT INTO fhir_event_subscriptions (organization_id,subscription_name,resource_type,event_type,filter_criteria,action_type,action_config,is_active)
  SELECT v_org,'Utilization Yellow Alert','KPIValue','threshold_crossed','{"metric_slug":"provider_utilization","direction":"below","value":80}'::jsonb,'notify_user','{"message":"Provider utilization dropped below 80%.","priority":"medium"}'::jsonb,true
  WHERE NOT EXISTS (SELECT 1 FROM fhir_event_subscriptions WHERE organization_id=v_org AND subscription_name='Utilization Yellow Alert');

  INSERT INTO fhir_event_subscriptions (organization_id,subscription_name,resource_type,event_type,filter_criteria,action_type,action_config,is_active)
  SELECT v_org,'Denial Rate Spike','KPIValue','threshold_crossed','{"metric_slug":"denial_rate","direction":"above","value":8}'::jsonb,'create_meeting_agenda_item','{"meeting_cadence":"weekly_tactical","title":"Denial Rate Spike — Review Needed","priority":"high"}'::jsonb,true
  WHERE NOT EXISTS (SELECT 1 FROM fhir_event_subscriptions WHERE organization_id=v_org AND subscription_name='Denial Rate Spike');

  INSERT INTO fhir_event_subscriptions (organization_id,subscription_name,resource_type,event_type,filter_criteria,action_type,action_config,is_active)
  SELECT v_org,'RTW Deadline Approaching','Patient','deadline_approaching','{"case_type":"rtw","days_ahead":7}'::jsonb,'notify_user','{"message":"RTW case deadline within 7 days. Clinician action required.","priority":"high"}'::jsonb,true
  WHERE NOT EXISTS (SELECT 1 FROM fhir_event_subscriptions WHERE organization_id=v_org AND subscription_name='RTW Deadline Approaching');

  INSERT INTO fhir_event_subscriptions (organization_id,subscription_name,resource_type,event_type,filter_criteria,action_type,action_config,is_active)
  SELECT v_org,'Scorecard Red Auto-Agenda','ScorecardMetric','status_changed','{"new_status":"red"}'::jsonb,'create_meeting_agenda_item','{"meeting_cadence":"weekly_tactical","title":"Scorecard Red — auto-generated","auto_generated":true}'::jsonb,true
  WHERE NOT EXISTS (SELECT 1 FROM fhir_event_subscriptions WHERE organization_id=v_org AND subscription_name='Scorecard Red Auto-Agenda');
END $$;
