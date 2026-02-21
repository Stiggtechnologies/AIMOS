/*
  # Case Aging Workflow System

  ## Overview
  Implements automated case aging monitoring, alerts, and escalation workflows for operations management.

  ## New Tables
  
  ### `ops_case_aging_rules`
  Defines aging thresholds and alert triggers for different case types
  - `id` (uuid, primary key)
  - `case_type` (text) - Type of case this rule applies to
  - `clinic_id` (uuid) - Specific clinic or NULL for system-wide
  - `warning_threshold_days` (integer) - Days before sending warning alert
  - `escalation_threshold_days` (integer) - Days before escalating to manager
  - `critical_threshold_days` (integer) - Days before critical alert
  - `authorization_expiry_warning_days` (integer) - Days before auth expiry to alert
  - `is_active` (boolean) - Whether rule is enabled
  - `escalation_path` (jsonb) - Manager hierarchy for escalations
  - `notification_config` (jsonb) - Alert configuration

  ### `ops_case_aging_alerts`
  Tracks alerts and notifications sent for case aging
  - `id` (uuid, primary key)
  - `case_id` (uuid) - Reference to ops_cases
  - `alert_type` (enum) - warning, escalation, critical, authorization_expiry
  - `alert_level` (integer) - 1 = warning, 2 = escalation, 3 = critical
  - `triggered_at` (timestamptz) - When alert was triggered
  - `triggered_by_rule_id` (uuid) - Which rule triggered this
  - `case_age_days` (integer) - Age of case when alert triggered
  - `notification_sent_to` (uuid[]) - Users who were notified
  - `notification_status` (enum) - pending, sent, failed, acknowledged
  - `acknowledged_at` (timestamptz) - When someone acknowledged
  - `acknowledged_by` (uuid) - Who acknowledged
  - `action_taken` (text) - Description of action taken
  - `metadata` (jsonb) - Additional alert details

  ### `ops_case_escalations`
  Tracks case escalations through management chain
  - `id` (uuid, primary key)
  - `case_id` (uuid) - Reference to ops_cases
  - `escalation_level` (integer) - Current escalation level
  - `escalated_from` (uuid) - User who escalated
  - `escalated_to` (uuid) - Manager escalated to
  - `escalation_reason` (text) - Why escalated
  - `escalated_at` (timestamptz)
  - `resolved_at` (timestamptz)
  - `resolved_by` (uuid)
  - `resolution_notes` (text)
  - `auto_escalated` (boolean) - Whether auto-escalated by system

  ### `ops_case_status_history`
  Tracks all status changes for aging analysis
  - `id` (uuid, primary key)
  - `case_id` (uuid)
  - `old_status` (ops_case_status)
  - `new_status` (ops_case_status)
  - `status_duration_days` (numeric) - How long in previous status
  - `changed_at` (timestamptz)
  - `changed_by` (uuid)
  - `change_reason` (text)

  ## Functions
  - `calculate_case_age()` - Calculate case age in days
  - `check_case_aging_alert()` - Check if case needs alert
  - `trigger_case_aging_alert()` - Create alert for case
  - `escalate_case()` - Escalate case to next level
  - `batch_check_case_aging()` - Background job to check all cases
  - `get_case_aging_summary()` - Get aging metrics

  ## Security
  - RLS enabled on all tables
  - Managers can view all escalations in their clinics
  - Users can view their own case alerts
  - System functions execute with elevated permissions
*/

-- Create enums
DO $$ BEGIN
  CREATE TYPE ops_alert_type AS ENUM ('warning', 'escalation', 'critical', 'authorization_expiry');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE ops_notification_status AS ENUM ('pending', 'sent', 'failed', 'acknowledged');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Case Aging Rules table
CREATE TABLE IF NOT EXISTS ops_case_aging_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_type text NOT NULL,
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  warning_threshold_days integer NOT NULL DEFAULT 3,
  escalation_threshold_days integer NOT NULL DEFAULT 7,
  critical_threshold_days integer NOT NULL DEFAULT 14,
  authorization_expiry_warning_days integer NOT NULL DEFAULT 7,
  is_active boolean DEFAULT true,
  escalation_path jsonb DEFAULT '[]'::jsonb,
  notification_config jsonb DEFAULT '{
    "send_email": true,
    "send_in_app": true,
    "daily_digest": true
  }'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  UNIQUE(case_type, clinic_id)
);

-- Case Aging Alerts table
CREATE TABLE IF NOT EXISTS ops_case_aging_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES ops_cases(id) ON DELETE CASCADE,
  alert_type ops_alert_type NOT NULL,
  alert_level integer NOT NULL DEFAULT 1,
  triggered_at timestamptz DEFAULT now(),
  triggered_by_rule_id uuid REFERENCES ops_case_aging_rules(id),
  case_age_days integer NOT NULL,
  notification_sent_to uuid[] DEFAULT ARRAY[]::uuid[],
  notification_status ops_notification_status DEFAULT 'pending',
  acknowledged_at timestamptz,
  acknowledged_by uuid REFERENCES auth.users(id),
  action_taken text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Case Escalations table
CREATE TABLE IF NOT EXISTS ops_case_escalations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES ops_cases(id) ON DELETE CASCADE,
  escalation_level integer NOT NULL DEFAULT 1,
  escalated_from uuid REFERENCES auth.users(id),
  escalated_to uuid REFERENCES auth.users(id),
  escalation_reason text NOT NULL,
  escalated_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id),
  resolution_notes text,
  auto_escalated boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Case Status History table
CREATE TABLE IF NOT EXISTS ops_case_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES ops_cases(id) ON DELETE CASCADE,
  old_status ops_case_status,
  new_status ops_case_status NOT NULL,
  status_duration_days numeric(10,2),
  changed_at timestamptz DEFAULT now(),
  changed_by uuid REFERENCES auth.users(id),
  change_reason text
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_case_aging_rules_clinic ON ops_case_aging_rules(clinic_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_case_aging_rules_type ON ops_case_aging_rules(case_type) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_case_aging_alerts_case ON ops_case_aging_alerts(case_id, triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_case_aging_alerts_status ON ops_case_aging_alerts(notification_status) WHERE notification_status != 'acknowledged';
CREATE INDEX IF NOT EXISTS idx_case_aging_alerts_type ON ops_case_aging_alerts(alert_type, triggered_at DESC);

CREATE INDEX IF NOT EXISTS idx_case_escalations_case ON ops_case_escalations(case_id, escalated_at DESC);
CREATE INDEX IF NOT EXISTS idx_case_escalations_to ON ops_case_escalations(escalated_to) WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_case_escalations_unresolved ON ops_case_escalations(escalated_at DESC) WHERE resolved_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_case_status_history_case ON ops_case_status_history(case_id, changed_at DESC);

-- Function: Calculate case age in days
CREATE OR REPLACE FUNCTION calculate_case_age(case_opened_at timestamptz, case_closed_at timestamptz DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  IF case_closed_at IS NOT NULL THEN
    RETURN EXTRACT(DAY FROM (case_closed_at - case_opened_at));
  ELSE
    RETURN EXTRACT(DAY FROM (now() - case_opened_at));
  END IF;
END;
$$;

-- Function: Get applicable aging rule for a case
CREATE OR REPLACE FUNCTION get_case_aging_rule(p_case_id uuid)
RETURNS TABLE (
  rule_id uuid,
  warning_days integer,
  escalation_days integer,
  critical_days integer,
  auth_warning_days integer,
  escalation_path jsonb,
  notification_config jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.warning_threshold_days,
    r.escalation_threshold_days,
    r.critical_threshold_days,
    r.authorization_expiry_warning_days,
    r.escalation_path,
    r.notification_config
  FROM ops_case_aging_rules r
  INNER JOIN ops_cases c ON c.case_type = r.case_type
  WHERE c.id = p_case_id
    AND r.is_active = true
    AND (r.clinic_id = c.clinic_id OR r.clinic_id IS NULL)
  ORDER BY r.clinic_id NULLS LAST
  LIMIT 1;
END;
$$;

-- Function: Check if case needs aging alert
CREATE OR REPLACE FUNCTION check_case_aging_alert(p_case_id uuid)
RETURNS TABLE (
  needs_alert boolean,
  alert_type ops_alert_type,
  alert_level integer,
  case_age integer,
  rule_id uuid
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_case_age integer;
  v_rule record;
  v_last_alert record;
  v_auth_expiry_days integer;
BEGIN
  -- Get case age
  SELECT calculate_case_age(c.opened_at, c.closed_at),
         EXTRACT(DAY FROM (c.authorization_expiry - CURRENT_DATE))
  INTO v_case_age, v_auth_expiry_days
  FROM ops_cases c
  WHERE c.id = p_case_id
    AND c.status NOT IN ('completed', 'cancelled', 'archived');

  -- If case is closed or doesn't exist, no alert needed
  IF v_case_age IS NULL THEN
    RETURN QUERY SELECT false, NULL::ops_alert_type, 0, 0, NULL::uuid;
    RETURN;
  END IF;

  -- Get applicable rule
  SELECT * INTO v_rule FROM get_case_aging_rule(p_case_id);

  -- If no rule found, no alert
  IF v_rule IS NULL THEN
    RETURN QUERY SELECT false, NULL::ops_alert_type, 0, v_case_age, NULL::uuid;
    RETURN;
  END IF;

  -- Check for authorization expiry alert
  IF v_auth_expiry_days IS NOT NULL AND v_auth_expiry_days <= v_rule.auth_warning_days THEN
    -- Check if we already sent this alert recently (within 24 hours)
    SELECT * INTO v_last_alert
    FROM ops_case_aging_alerts
    WHERE case_id = p_case_id
      AND alert_type = 'authorization_expiry'
      AND triggered_at > now() - interval '24 hours'
    ORDER BY triggered_at DESC
    LIMIT 1;

    IF v_last_alert IS NULL THEN
      RETURN QUERY SELECT true, 'authorization_expiry'::ops_alert_type, 2, v_case_age, v_rule.rule_id;
      RETURN;
    END IF;
  END IF;

  -- Check critical threshold
  IF v_case_age >= v_rule.critical_days THEN
    SELECT * INTO v_last_alert
    FROM ops_case_aging_alerts
    WHERE case_id = p_case_id
      AND alert_type = 'critical'
      AND triggered_at > now() - interval '24 hours'
    ORDER BY triggered_at DESC
    LIMIT 1;

    IF v_last_alert IS NULL THEN
      RETURN QUERY SELECT true, 'critical'::ops_alert_type, 3, v_case_age, v_rule.rule_id;
      RETURN;
    END IF;
  END IF;

  -- Check escalation threshold
  IF v_case_age >= v_rule.escalation_days THEN
    SELECT * INTO v_last_alert
    FROM ops_case_aging_alerts
    WHERE case_id = p_case_id
      AND alert_type = 'escalation'
      AND triggered_at > now() - interval '48 hours'
    ORDER BY triggered_at DESC
    LIMIT 1;

    IF v_last_alert IS NULL THEN
      RETURN QUERY SELECT true, 'escalation'::ops_alert_type, 2, v_case_age, v_rule.rule_id;
      RETURN;
    END IF;
  END IF;

  -- Check warning threshold
  IF v_case_age >= v_rule.warning_days THEN
    SELECT * INTO v_last_alert
    FROM ops_case_aging_alerts
    WHERE case_id = p_case_id
      AND alert_type = 'warning'
      AND triggered_at > now() - interval '72 hours'
    ORDER BY triggered_at DESC
    LIMIT 1;

    IF v_last_alert IS NULL THEN
      RETURN QUERY SELECT true, 'warning'::ops_alert_type, 1, v_case_age, v_rule.rule_id;
      RETURN;
    END IF;
  END IF;

  -- No alert needed
  RETURN QUERY SELECT false, NULL::ops_alert_type, 0, v_case_age, v_rule.rule_id;
END;
$$;

-- Function: Trigger case aging alert
CREATE OR REPLACE FUNCTION trigger_case_aging_alert(
  p_case_id uuid,
  p_alert_type ops_alert_type,
  p_alert_level integer,
  p_case_age integer,
  p_rule_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_alert_id uuid;
  v_notification_list uuid[];
  v_case record;
BEGIN
  -- Get case details
  SELECT * INTO v_case FROM ops_cases WHERE id = p_case_id;

  -- Build notification list
  v_notification_list := ARRAY[]::uuid[];
  
  -- Add primary clinician
  IF v_case.primary_clinician_id IS NOT NULL THEN
    v_notification_list := array_append(v_notification_list, v_case.primary_clinician_id);
  END IF;

  -- Add assigned team members
  IF v_case.assigned_team_ids IS NOT NULL THEN
    v_notification_list := v_notification_list || v_case.assigned_team_ids;
  END IF;

  -- For escalation/critical, add clinic managers
  IF p_alert_level >= 2 THEN
    v_notification_list := v_notification_list || (
      SELECT array_agg(DISTINCT ca.user_id)
      FROM clinic_access ca
      INNER JOIN user_profiles up ON up.id = ca.user_id
      WHERE ca.clinic_id = v_case.clinic_id
        AND (ca.can_manage = true OR up.role IN ('clinic_manager', 'admin', 'executive'))
    );
  END IF;

  -- Create alert
  INSERT INTO ops_case_aging_alerts (
    case_id,
    alert_type,
    alert_level,
    case_age_days,
    triggered_by_rule_id,
    notification_sent_to,
    notification_status,
    metadata
  ) VALUES (
    p_case_id,
    p_alert_type,
    p_alert_level,
    p_case_age,
    p_rule_id,
    v_notification_list,
    'pending',
    jsonb_build_object(
      'case_number', v_case.case_number,
      'case_type', v_case.case_type,
      'clinic_id', v_case.clinic_id,
      'current_status', v_case.status
    )
  )
  RETURNING id INTO v_alert_id;

  RETURN v_alert_id;
END;
$$;

-- Function: Escalate case to next level
CREATE OR REPLACE FUNCTION escalate_case(
  p_case_id uuid,
  p_escalation_reason text,
  p_escalated_by uuid DEFAULT NULL,
  p_auto_escalate boolean DEFAULT false
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_escalation_id uuid;
  v_case record;
  v_current_level integer;
  v_next_manager uuid;
  v_rule record;
BEGIN
  -- Get case details
  SELECT * INTO v_case FROM ops_cases WHERE id = p_case_id;

  -- Get current escalation level
  SELECT COALESCE(MAX(escalation_level), 0) INTO v_current_level
  FROM ops_case_escalations
  WHERE case_id = p_case_id AND resolved_at IS NULL;

  -- Get escalation path from rule
  SELECT * INTO v_rule FROM get_case_aging_rule(p_case_id);

  -- Find next manager in escalation path
  IF v_rule.escalation_path IS NOT NULL AND jsonb_array_length(v_rule.escalation_path) > v_current_level THEN
    SELECT (v_rule.escalation_path->v_current_level->>'manager_id')::uuid INTO v_next_manager;
  END IF;

  -- If no specific manager found, get clinic manager
  IF v_next_manager IS NULL THEN
    SELECT ca.user_id INTO v_next_manager
    FROM clinic_access ca
    INNER JOIN user_profiles up ON up.id = ca.user_id
    WHERE ca.clinic_id = v_case.clinic_id
      AND (ca.can_manage = true OR up.role IN ('clinic_manager', 'admin'))
    LIMIT 1;
  END IF;

  -- Create escalation record
  INSERT INTO ops_case_escalations (
    case_id,
    escalation_level,
    escalated_from,
    escalated_to,
    escalation_reason,
    auto_escalated
  ) VALUES (
    p_case_id,
    v_current_level + 1,
    COALESCE(p_escalated_by, auth.uid()),
    v_next_manager,
    p_escalation_reason,
    p_auto_escalate
  )
  RETURNING id INTO v_escalation_id;

  -- Update case priority if not already high
  IF v_case.priority NOT IN ('high', 'urgent', 'critical') THEN
    UPDATE ops_cases
    SET priority = CASE 
      WHEN v_current_level >= 2 THEN 'critical'::ops_case_priority
      ELSE 'high'::ops_case_priority
    END,
    updated_at = now()
    WHERE id = p_case_id;
  END IF;

  RETURN v_escalation_id;
END;
$$;

-- Function: Batch check all open cases for aging
CREATE OR REPLACE FUNCTION batch_check_case_aging()
RETURNS TABLE (
  cases_checked integer,
  alerts_triggered integer,
  escalations_created integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_case_id uuid;
  v_check_result record;
  v_alert_id uuid;
  v_escalation_id uuid;
  v_cases_checked integer := 0;
  v_alerts_triggered integer := 0;
  v_escalations_created integer := 0;
BEGIN
  -- Loop through all open cases
  FOR v_case_id IN 
    SELECT id FROM ops_cases 
    WHERE status NOT IN ('completed', 'cancelled', 'archived')
      AND opened_at IS NOT NULL
  LOOP
    v_cases_checked := v_cases_checked + 1;

    -- Check if case needs alert
    SELECT * INTO v_check_result FROM check_case_aging_alert(v_case_id);

    IF v_check_result.needs_alert THEN
      -- Trigger alert
      SELECT trigger_case_aging_alert(
        v_case_id,
        v_check_result.alert_type,
        v_check_result.alert_level,
        v_check_result.case_age,
        v_check_result.rule_id
      ) INTO v_alert_id;

      v_alerts_triggered := v_alerts_triggered + 1;

      -- Auto-escalate if at escalation or critical level
      IF v_check_result.alert_level >= 2 THEN
        BEGIN
          SELECT escalate_case(
            v_case_id,
            format('Auto-escalation due to case age: %s days (%s threshold)', 
                   v_check_result.case_age, 
                   v_check_result.alert_type),
            NULL,
            true
          ) INTO v_escalation_id;

          IF v_escalation_id IS NOT NULL THEN
            v_escalations_created := v_escalations_created + 1;
          END IF;
        EXCEPTION WHEN OTHERS THEN
          -- Continue processing other cases even if escalation fails
          NULL;
        END;
      END IF;
    END IF;
  END LOOP;

  RETURN QUERY SELECT v_cases_checked, v_alerts_triggered, v_escalations_created;
END;
$$;

-- Function: Get case aging summary
CREATE OR REPLACE FUNCTION get_case_aging_summary(p_clinic_id uuid DEFAULT NULL)
RETURNS TABLE (
  total_open_cases bigint,
  cases_warning bigint,
  cases_escalated bigint,
  cases_critical bigint,
  avg_case_age_days numeric,
  auth_expiring_soon bigint,
  unacknowledged_alerts bigint,
  active_escalations bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT c.id) FILTER (WHERE c.status NOT IN ('completed', 'cancelled', 'archived')),
    COUNT(DISTINCT a.case_id) FILTER (WHERE a.alert_type = 'warning' AND a.triggered_at > now() - interval '7 days'),
    COUNT(DISTINCT a.case_id) FILTER (WHERE a.alert_type = 'escalation' AND a.triggered_at > now() - interval '7 days'),
    COUNT(DISTINCT a.case_id) FILTER (WHERE a.alert_type = 'critical' AND a.triggered_at > now() - interval '7 days'),
    AVG(calculate_case_age(c.opened_at, c.closed_at)) FILTER (WHERE c.status NOT IN ('completed', 'cancelled', 'archived')),
    COUNT(DISTINCT c.id) FILTER (WHERE c.authorization_expiry <= CURRENT_DATE + 7 AND c.status NOT IN ('completed', 'cancelled', 'archived')),
    COUNT(DISTINCT a.id) FILTER (WHERE a.notification_status != 'acknowledged' AND a.triggered_at > now() - interval '7 days'),
    COUNT(DISTINCT e.id) FILTER (WHERE e.resolved_at IS NULL)
  FROM ops_cases c
  LEFT JOIN ops_case_aging_alerts a ON c.id = a.case_id
  LEFT JOIN ops_case_escalations e ON c.id = e.case_id
  WHERE (p_clinic_id IS NULL OR c.clinic_id = p_clinic_id);
END;
$$;

-- Trigger: Track case status changes
CREATE OR REPLACE FUNCTION track_case_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_duration_days numeric;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Calculate how long case was in previous status
    v_duration_days := EXTRACT(DAY FROM (now() - OLD.updated_at));

    INSERT INTO ops_case_status_history (
      case_id,
      old_status,
      new_status,
      status_duration_days,
      changed_by
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      v_duration_days,
      NEW.updated_by
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_track_case_status_change ON ops_cases;
CREATE TRIGGER trg_track_case_status_change
  AFTER UPDATE ON ops_cases
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION track_case_status_change();

-- Enable RLS
ALTER TABLE ops_case_aging_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_case_aging_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_case_escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_case_status_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ops_case_aging_rules
CREATE POLICY "Clinic managers can manage aging rules"
  ON ops_case_aging_rules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clinic_access ca
      INNER JOIN user_profiles up ON up.id = ca.user_id
      WHERE ca.clinic_id = ops_case_aging_rules.clinic_id
        AND ca.user_id = auth.uid()
        AND (ca.can_manage = true OR up.role IN ('clinic_manager', 'admin', 'executive'))
    )
    OR clinic_id IS NULL
  );

CREATE POLICY "All users can view aging rules"
  ON ops_case_aging_rules FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for ops_case_aging_alerts
CREATE POLICY "Users can view alerts for their cases"
  ON ops_case_aging_alerts FOR SELECT
  TO authenticated
  USING (
    auth.uid() = ANY(notification_sent_to)
    OR EXISTS (
      SELECT 1 FROM ops_cases c
      WHERE c.id = ops_case_aging_alerts.case_id
        AND (c.primary_clinician_id = auth.uid() 
             OR auth.uid() = ANY(c.assigned_team_ids))
    )
  );

CREATE POLICY "Users can acknowledge their alerts"
  ON ops_case_aging_alerts FOR UPDATE
  TO authenticated
  USING (auth.uid() = ANY(notification_sent_to))
  WITH CHECK (auth.uid() = ANY(notification_sent_to));

-- RLS Policies for ops_case_escalations
CREATE POLICY "Users can view relevant escalations"
  ON ops_case_escalations FOR SELECT
  TO authenticated
  USING (
    escalated_to = auth.uid()
    OR escalated_from = auth.uid()
    OR EXISTS (
      SELECT 1 FROM ops_cases c
      WHERE c.id = ops_case_escalations.case_id
        AND (c.primary_clinician_id = auth.uid() 
             OR auth.uid() = ANY(c.assigned_team_ids))
    )
  );

CREATE POLICY "Staff can create escalations"
  ON ops_case_escalations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ops_cases c
      INNER JOIN clinic_access ca ON ca.clinic_id = c.clinic_id
      WHERE c.id = ops_case_escalations.case_id
        AND ca.user_id = auth.uid()
    )
  );

CREATE POLICY "Escalation recipients can resolve"
  ON ops_case_escalations FOR UPDATE
  TO authenticated
  USING (escalated_to = auth.uid())
  WITH CHECK (escalated_to = auth.uid());

-- RLS Policies for ops_case_status_history
CREATE POLICY "Users can view case status history"
  ON ops_case_status_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ops_cases c
      INNER JOIN clinic_access ca ON ca.clinic_id = c.clinic_id
      WHERE c.id = ops_case_status_history.case_id
        AND ca.user_id = auth.uid()
    )
  );
