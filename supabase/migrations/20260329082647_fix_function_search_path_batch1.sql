/*
  # Fix Function Search Path - Batch 1
  
  Functions with mutable search_path are a security risk because they can be
  exploited through search_path injection attacks. Setting search_path = ''
  and using fully-qualified object names prevents this.
  
  This batch fixes core utility and security-sensitive functions.
*/

CREATE OR REPLACE FUNCTION public.set_updated_at()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path = ''
AS $function$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_workflow_updated_at()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN new;
END;
$function$;

CREATE OR REPLACE FUNCTION public.track_case_status_change()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path = ''
AS $function$
DECLARE
  v_duration_days numeric;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    v_duration_days := EXTRACT(DAY FROM (now() - OLD.updated_at));
    INSERT INTO public.ops_case_status_history (
      case_id, old_status, new_status, status_duration_days, changed_by
    ) VALUES (
      NEW.id, OLD.status, NEW.status, v_duration_days, NEW.updated_by
    );
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_case_age(
  case_opened_at timestamp with time zone,
  case_closed_at timestamp with time zone DEFAULT NULL::timestamp with time zone
)
  RETURNS integer
  LANGUAGE plpgsql
  STABLE
  SET search_path = ''
AS $function$
BEGIN
  IF case_closed_at IS NOT NULL THEN
    RETURN EXTRACT(DAY FROM (case_closed_at - case_opened_at));
  ELSE
    RETURN EXTRACT(DAY FROM (now() - case_opened_at));
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_current_ratio(
  p_current_assets numeric,
  p_current_liabilities numeric
)
  RETURNS numeric
  LANGUAGE plpgsql
  SET search_path = ''
AS $function$
BEGIN
  IF p_current_liabilities = 0 OR p_current_liabilities IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN p_current_assets / p_current_liabilities;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_dso(
  p_accounts_receivable numeric,
  p_revenue numeric,
  p_days_in_period integer
)
  RETURNS numeric
  LANGUAGE plpgsql
  SET search_path = ''
AS $function$
BEGIN
  IF p_revenue = 0 OR p_revenue IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN (p_accounts_receivable / p_revenue) * p_days_in_period;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_case_number(p_clinic_id uuid)
  RETURNS text
  LANGUAGE plpgsql
  SET search_path = ''
AS $function$
DECLARE
  v_count INTEGER;
  v_year TEXT;
  v_clinic_code TEXT;
BEGIN
  v_year := TO_CHAR(CURRENT_DATE, 'YY');
  SELECT UPPER(SUBSTRING(name, 1, 3)) INTO v_clinic_code
  FROM public.clinics WHERE id = p_clinic_id;
  SELECT COUNT(*) INTO v_count
  FROM public.ops_cases
  WHERE clinic_id = p_clinic_id
  AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE);
  RETURN v_clinic_code || '-' || v_year || '-' || LPAD((v_count + 1)::TEXT, 4, '0');
END;
$function$;

CREATE OR REPLACE FUNCTION public.prevent_audit_modification()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
AS $function$
BEGIN
  RAISE EXCEPTION 'Audit records are immutable and cannot be modified or deleted';
  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_financial_audit()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.financial_audit_log (
    user_id, action, entity_type, entity_id, old_values, new_values, clinic_id
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
$function$;

CREATE OR REPLACE FUNCTION public.flag_missing_receipts()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
AS $function$
BEGIN
  IF NEW.payment_method = 'corporate_card' AND NEW.receipt_uploaded = false AND NEW.amount > 50 THEN
    NEW.status := 'flagged';
    NEW.notes := COALESCE(NEW.notes || E'\n', '') || 'Receipt required for corporate card purchase over $50';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_lead_on_booking()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
AS $function$
BEGIN
  UPDATE public.crm_leads
  SET status = 'booked', booked_at = NEW.created_at, updated_at = now()
  WHERE id = NEW.lead_id AND status = 'contacted';
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.reject_practice_translation(
  p_translation_id uuid,
  p_rejection_reason text,
  p_reviewer_notes text DEFAULT NULL::text
)
  RETURNS boolean
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
AS $function$
BEGIN
  UPDATE public.practice_translations
  SET
    status = 'rejected',
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    reviewer_notes = COALESCE(p_reviewer_notes, 'Rejected: ' || p_rejection_reason)
  WHERE id = p_translation_id;

  IF FOUND THEN
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_translation_proposal_stats()
  RETURNS TABLE(
    total_generated integer,
    pending_review integer,
    approved_count integer,
    rejected_count integer,
    avg_time_to_approval numeric
  )
  LANGUAGE plpgsql
  SET search_path = ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::integer AS total_generated,
    COUNT(*) FILTER (WHERE status IN ('generated', 'awaiting_cco_review'))::integer AS pending_review,
    COUNT(*) FILTER (WHERE status = 'approved')::integer AS approved_count,
    COUNT(*) FILTER (WHERE status = 'rejected')::integer AS rejected_count,
    COALESCE(
      AVG(EXTRACT(EPOCH FROM (reviewed_at - created_at)) / 86400),
      0
    )::numeric AS avg_time_to_approval
  FROM public.practice_translations
  WHERE evidence_flag_id IS NOT NULL;
END;
$function$;
