/*
  # Fix Function Search Path - Batch 2
  
  Continues fixing functions with mutable search_path.
  This batch covers security DEFINER functions that handle agent governance,
  clinical intelligence, research, and budget operations.
*/

CREATE OR REPLACE FUNCTION public.check_permission(
  p_permission_key text,
  p_required_level text DEFAULT 'full'::text
)
  RETURNS boolean
  LANGUAGE plpgsql
  STABLE SECURITY DEFINER
  SET search_path = ''
AS $function$
DECLARE
  v_user_role TEXT;
  v_access_level TEXT;
  v_override_granted BOOLEAN;
BEGIN
  SELECT role::text INTO v_user_role
  FROM public.user_profiles
  WHERE id = auth.uid();

  IF v_user_role IS NULL THEN
    RETURN false;
  END IF;

  SELECT is_granted INTO v_override_granted
  FROM public.user_permission_overrides
  WHERE user_id = auth.uid()
  AND permission_key = p_permission_key
  AND (expires_at IS NULL OR expires_at > now())
  LIMIT 1;

  IF v_override_granted IS NOT NULL AND v_override_granted = false THEN
    RETURN false;
  END IF;

  IF v_override_granted = true THEN
    RETURN true;
  END IF;

  SELECT access_level INTO v_access_level
  FROM public.role_permissions
  WHERE role = v_user_role::public.user_role
  AND permission_key = p_permission_key
  AND is_active = true;

  IF v_access_level IS NULL THEN
    RETURN false;
  END IF;

  IF p_required_level = 'full' THEN
    RETURN v_access_level = 'full';
  ELSIF p_required_level = 'read_only' THEN
    RETURN v_access_level IN ('full', 'read_only');
  END IF;

  RETURN false;
END;
$function$;

CREATE OR REPLACE FUNCTION public.can_access_audit_logs()
  RETURNS boolean
  LANGUAGE plpgsql
  STABLE SECURITY DEFINER
  SET search_path = ''
AS $function$
BEGIN
  RETURN public.check_permission('audit_logs', 'full');
END;
$function$;

CREATE OR REPLACE FUNCTION public.can_edit_clinics()
  RETURNS boolean
  LANGUAGE plpgsql
  STABLE SECURITY DEFINER
  SET search_path = ''
AS $function$
BEGIN
  RETURN public.check_permission('edit_clinics', 'full');
END;
$function$;

CREATE OR REPLACE FUNCTION public.can_edit_credentials()
  RETURNS boolean
  LANGUAGE plpgsql
  STABLE SECURITY DEFINER
  SET search_path = ''
AS $function$
BEGIN
  RETURN public.check_permission('view_credentials', 'full');
END;
$function$;

CREATE OR REPLACE FUNCTION public.can_edit_dashboards()
  RETURNS boolean
  LANGUAGE plpgsql
  STABLE SECURITY DEFINER
  SET search_path = ''
AS $function$
BEGIN
  RETURN public.check_permission('view_dashboards', 'full');
END;
$function$;

CREATE OR REPLACE FUNCTION public.can_edit_staffing()
  RETURNS boolean
  LANGUAGE plpgsql
  STABLE SECURITY DEFINER
  SET search_path = ''
AS $function$
BEGIN
  RETURN public.check_permission('view_staffing', 'full');
END;
$function$;

CREATE OR REPLACE FUNCTION public.can_view_ai_insights()
  RETURNS boolean
  LANGUAGE plpgsql
  STABLE SECURITY DEFINER
  SET search_path = ''
AS $function$
BEGIN
  RETURN public.check_permission('ai_insights', 'read_only');
END;
$function$;

CREATE OR REPLACE FUNCTION public.can_view_credentials()
  RETURNS boolean
  LANGUAGE plpgsql
  STABLE SECURITY DEFINER
  SET search_path = ''
AS $function$
BEGIN
  RETURN public.check_permission('view_credentials', 'read_only');
END;
$function$;

CREATE OR REPLACE FUNCTION public.can_view_dashboards()
  RETURNS boolean
  LANGUAGE plpgsql
  STABLE SECURITY DEFINER
  SET search_path = ''
AS $function$
BEGIN
  RETURN public.check_permission('view_dashboards', 'read_only');
END;
$function$;

CREATE OR REPLACE FUNCTION public.can_view_staffing()
  RETURNS boolean
  LANGUAGE plpgsql
  STABLE SECURITY DEFINER
  SET search_path = ''
AS $function$
BEGIN
  RETURN public.check_permission('view_staffing', 'read_only');
END;
$function$;

CREATE OR REPLACE FUNCTION public.auto_approve_small_purchases()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
AS $function$
DECLARE
  v_auto_approve_limit numeric;
  v_requestor_role text;
BEGIN
  IF NEW.status = 'submitted' THEN
    SELECT up.role::text, sar.auto_approve_under
    INTO v_requestor_role, v_auto_approve_limit
    FROM public.user_profiles up
    LEFT JOIN public.spending_authority_roles sar ON sar.role_name = up.role::text
    WHERE up.id = NEW.requestor_id;

    IF v_auto_approve_limit IS NOT NULL AND NEW.total_cost <= v_auto_approve_limit THEN
      NEW.status := 'approved';
      NEW.approved_at := now();
      NEW.auto_approved := true;

      INSERT INTO public.purchase_approvals (
        purchase_request_id, approver_id, approver_role,
        decision, decision_notes, approval_level, required_for_amount
      ) VALUES (
        NEW.id, NEW.requestor_id, 'System Auto-Approval', 'approved',
        'Auto-approved - under $' || v_auto_approve_limit || ' threshold',
        1, NEW.total_cost
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_purchase_budget()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
AS $function$
DECLARE
  v_remaining_budget numeric;
  v_utilization numeric;
BEGIN
  IF NEW.status = 'approved' AND NEW.category_id IS NOT NULL THEN
    SELECT remaining_budget, utilization_percent
    INTO v_remaining_budget, v_utilization
    FROM public.clinic_budget_allocations
    WHERE clinic_id = NEW.clinic_id
    AND category_id = NEW.category_id
    AND budget_year = EXTRACT(YEAR FROM COALESCE(NEW.submitted_at, now()))
    AND budget_month = EXTRACT(MONTH FROM COALESCE(NEW.submitted_at, now()));

    IF v_remaining_budget IS NOT NULL AND v_remaining_budget < NEW.total_cost THEN
      INSERT INTO public.spend_alerts (
        clinic_id, alert_type, severity, title, description,
        metric_value, threshold_value, category_id, related_entity_type, related_entity_id
      ) VALUES (
        NEW.clinic_id, 'budget_overrun',
        CASE WHEN v_utilization > 120 THEN 'critical'
             WHEN v_utilization > 100 THEN 'high'
             ELSE 'medium' END,
        'Budget Exceeded', 'Purchase request exceeds remaining budget',
        NEW.total_cost, v_remaining_budget, NEW.category_id,
        'purchase_request', NEW.id
      );

      IF v_utilization > 110 THEN
        NEW.requires_executive_approval := true;
      END IF;
    END IF;

    UPDATE public.clinic_budget_allocations
    SET amount_committed = amount_committed + NEW.total_cost, updated_at = now()
    WHERE clinic_id = NEW.clinic_id
    AND category_id = NEW.category_id
    AND budget_year = EXTRACT(YEAR FROM COALESCE(NEW.submitted_at, now()))
    AND budget_month = EXTRACT(MONTH FROM COALESCE(NEW.submitted_at, now()));
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_budget_on_expense()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
AS $function$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') AND NEW.category_id IS NOT NULL THEN
    UPDATE public.clinic_budget_allocations
    SET amount_spent = amount_spent + NEW.amount, updated_at = now()
    WHERE clinic_id = NEW.clinic_id
    AND category_id = NEW.category_id
    AND budget_year = EXTRACT(YEAR FROM NEW.expense_date)
    AND budget_month = EXTRACT(MONTH FROM NEW.expense_date);
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_agent_performance_score(
  p_agent_id uuid,
  p_period_days integer DEFAULT 30
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
AS $function$
DECLARE
  v_result jsonb;
  v_total_decisions integer;
  v_approved_decisions integer;
  v_overrides integer;
  v_escalations integer;
  v_avg_confidence numeric;
BEGIN
  SELECT
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE approved = true) as approved,
    AVG(confidence_score) as avg_conf
  INTO v_total_decisions, v_approved_decisions, v_avg_confidence
  FROM public.agent_decisions
  WHERE agent_id = p_agent_id
  AND created_at > now() - (p_period_days || ' days')::interval;

  SELECT COUNT(*) INTO v_overrides
  FROM public.agent_overrides
  WHERE agent_id = p_agent_id
  AND created_at > now() - (p_period_days || ' days')::interval;

  SELECT COUNT(*) INTO v_escalations
  FROM public.agent_escalations
  WHERE agent_id = p_agent_id
  AND created_at > now() - (p_period_days || ' days')::interval;

  v_result := jsonb_build_object(
    'total_decisions', COALESCE(v_total_decisions, 0),
    'approved_decisions', COALESCE(v_approved_decisions, 0),
    'approval_rate', CASE WHEN v_total_decisions > 0 THEN ROUND((v_approved_decisions::numeric / v_total_decisions) * 100, 2) ELSE 0 END,
    'overrides', COALESCE(v_overrides, 0),
    'override_rate', CASE WHEN v_total_decisions > 0 THEN ROUND((v_overrides::numeric / v_total_decisions) * 100, 2) ELSE 0 END,
    'escalations', COALESCE(v_escalations, 0),
    'escalation_rate', CASE WHEN v_total_decisions > 0 THEN ROUND((v_escalations::numeric / v_total_decisions) * 100, 2) ELSE 0 END,
    'avg_confidence', ROUND(COALESCE(v_avg_confidence, 0), 2)
  );

  RETURN v_result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_escalation_required(
  p_agent_id uuid,
  p_confidence_score numeric,
  p_financial_impact numeric DEFAULT 0
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
AS $function$
DECLARE
  v_agent public.ai_agents;
  v_threshold public.agent_risk_thresholds;
  v_escalate boolean := false;
  v_reasons text[] := ARRAY[]::text[];
BEGIN
  SELECT * INTO v_agent FROM public.ai_agents WHERE id = p_agent_id;

  IF v_agent.requires_hitl THEN
    v_escalate := true;
    v_reasons := array_append(v_reasons, 'Agent requires HITL by default');
  END IF;

  IF p_confidence_score < v_agent.hitl_confidence_threshold THEN
    v_escalate := true;
    v_reasons := array_append(v_reasons, 'Confidence below threshold: ' || p_confidence_score || ' < ' || v_agent.hitl_confidence_threshold);
  END IF;

  IF p_financial_impact > v_agent.max_financial_impact THEN
    v_escalate := true;
    v_reasons := array_append(v_reasons, 'Financial impact exceeds limit: ' || p_financial_impact || ' > ' || v_agent.max_financial_impact);
  END IF;

  FOR v_threshold IN
    SELECT * FROM public.agent_risk_thresholds
    WHERE agent_id = p_agent_id AND active = true
  LOOP
    IF v_threshold.action_on_breach IN ('escalate', 'block') THEN
      v_escalate := true;
      v_reasons := array_append(v_reasons, 'Threshold breach: ' || v_threshold.threshold_name);
    END IF;
  END LOOP;

  RETURN jsonb_build_object('escalate', v_escalate, 'reasons', v_reasons);
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_agent_performance_summary(p_agent_id uuid)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
AS $function$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_executions', COUNT(*),
    'successful_executions', COUNT(*) FILTER (WHERE outcome = 'executed'),
    'escalated_executions', COUNT(*) FILTER (WHERE escalated_to_human = true),
    'avg_confidence', ROUND(AVG(confidence_score), 2),
    'escalation_rate', ROUND(
      (COUNT(*) FILTER (WHERE escalated_to_human = true)::decimal / NULLIF(COUNT(*), 0) * 100), 2
    ),
    'override_rate', ROUND(
      (COUNT(*) FILTER (WHERE human_override = true)::decimal / NULLIF(COUNT(*), 0) * 100), 2
    ),
    'last_execution', MAX(created_at)
  )
  INTO v_result
  FROM public.agent_decisions
  WHERE agent_id = p_agent_id;

  RETURN v_result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_pending_hitl_count()
  RETURNS TABLE(agent_id uuid, agent_name text, pending_count bigint)
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    aa.id,
    aa.name,
    COUNT(ahq.id)
  FROM public.ai_agents aa
  LEFT JOIN public.agent_hitl_queue ahq ON ahq.agent_id = aa.id AND ahq.status = 'pending'
  GROUP BY aa.id, aa.name
  ORDER BY COUNT(ahq.id) DESC;
END;
$function$;
