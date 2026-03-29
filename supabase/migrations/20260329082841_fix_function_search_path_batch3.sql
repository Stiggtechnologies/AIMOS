/*
  # Fix Function Search Path - Batch 3
  
  Final batch of functions with mutable search_path.
  Covers CII, evidence, clinic metrics, and capacity functions.
*/

CREATE OR REPLACE FUNCTION public.get_cii_dashboard_metrics()
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
AS $function$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_papers', (SELECT COUNT(*) FROM public.research_papers WHERE ingestion_status = 'processed'),
    'pending_translations', (SELECT COUNT(*) FROM public.practice_translations WHERE status = 'proposed'),
    'active_adoptions', (SELECT COUNT(*) FROM public.practice_adoptions WHERE adoption_status IN ('active', 'monitoring')),
    'recent_queries', (SELECT COUNT(*) FROM public.research_queries WHERE created_at > NOW() - INTERVAL '7 days'),
    'avg_query_response_time', (SELECT AVG(response_time_seconds) FROM public.research_queries WHERE created_at > NOW() - INTERVAL '30 days'),
    'positive_outcomes', (SELECT COUNT(*) FROM public.research_outcomes WHERE impact_status = 'positive')
  )
  INTO v_result;
  RETURN v_result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_active_pilots_summary()
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
AS $function$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_active', (SELECT COUNT(*) FROM public.practice_pilots WHERE status = 'active'),
    'planned', (SELECT COUNT(*) FROM public.practice_pilots WHERE status = 'planned'),
    'completed', (SELECT COUNT(*) FROM public.practice_pilots WHERE status = 'completed'),
    'successful', (SELECT COUNT(*) FROM public.practice_pilots WHERE status = 'success'),
    'avg_duration_days', (SELECT AVG(duration_days) FROM public.practice_pilots WHERE status = 'completed')
  )
  INTO v_result;
  RETURN v_result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_high_priority_research_gaps(p_limit integer DEFAULT 10)
  RETURNS TABLE(
    condition_name text,
    outcome_type text,
    gap_score integer,
    paper_count bigint,
    recent_synthesis_count bigint,
    recommendation text
  )
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    rp.condition_name,
    rp.outcome_type,
    public.calculate_research_gap_score(rp.condition_name, rp.outcome_type) as gap_score,
    COUNT(DISTINCT rpp.id) FILTER (WHERE rp.condition_name = ANY(rpp.conditions)) as paper_count,
    COUNT(DISTINCT es.id) FILTER (WHERE es.created_at >= now() - interval '1 year') as recent_synthesis_count,
    CASE
      WHEN public.calculate_research_gap_score(rp.condition_name, rp.outcome_type) > 80
        THEN 'Critical: Immediate research needed'
      WHEN public.calculate_research_gap_score(rp.condition_name, rp.outcome_type) > 60
        THEN 'High: Prioritize for next research cycle'
      WHEN public.calculate_research_gap_score(rp.condition_name, rp.outcome_type) > 40
        THEN 'Medium: Monitor and consider for research'
      ELSE 'Low: Adequate evidence available'
    END as recommendation
  FROM public.research_priorities rp
  LEFT JOIN public.research_papers rpp ON rp.condition_name = ANY(rpp.conditions)
  LEFT JOIN public.evidence_syntheses es ON es.query_text ILIKE '%' || rp.condition_name || '%'
  WHERE rp.is_active = true
  GROUP BY rp.condition_name, rp.outcome_type, rp.priority_score
  ORDER BY public.calculate_research_gap_score(rp.condition_name, rp.outcome_type) DESC
  LIMIT p_limit;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_research_to_practice_cycle_time()
  RETURNS TABLE(translation_title text, cycle_days integer)
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    pt.change_title,
    EXTRACT(DAY FROM (pa.implementation_date - pt.proposed_at::date))::integer
  FROM public.practice_translations pt
  JOIN public.practice_adoptions pa ON pa.translation_id = pt.id
  WHERE pt.status = 'implemented'
  ORDER BY pa.implementation_date DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_evidence_synthesis_latest_version(p_synthesis_id uuid)
  RETURNS TABLE(
    version_number integer,
    synthesis_text text,
    confidence_score integer,
    changed_by uuid,
    created_at timestamp with time zone
  )
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    esv.version_number,
    esv.synthesis_text,
    esv.confidence_score,
    esv.changed_by,
    esv.created_at
  FROM public.evidence_synthesis_versions esv
  WHERE esv.synthesis_id = p_synthesis_id
  ORDER BY esv.version_number DESC
  LIMIT 1;
END;
$function$;

CREATE OR REPLACE FUNCTION public.compare_synthesis_versions(
  p_synthesis_id uuid,
  p_version_a integer,
  p_version_b integer
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
AS $function$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'version_a', jsonb_build_object(
      'version_number', a.version_number,
      'synthesis_text', a.synthesis_text,
      'confidence_score', a.confidence_score,
      'created_at', a.created_at
    ),
    'version_b', jsonb_build_object(
      'version_number', b.version_number,
      'synthesis_text', b.synthesis_text,
      'confidence_score', b.confidence_score,
      'created_at', b.created_at
    ),
    'differences', jsonb_build_object(
      'synthesis_text_changed', (a.synthesis_text != b.synthesis_text),
      'confidence_changed', (a.confidence_score != b.confidence_score),
      'recommendations_changed', (a.recommendations != b.recommendations)
    )
  ) INTO v_result
  FROM public.evidence_synthesis_versions a
  CROSS JOIN public.evidence_synthesis_versions b
  WHERE a.synthesis_id = p_synthesis_id
  AND b.synthesis_id = p_synthesis_id
  AND a.version_number = p_version_a
  AND b.version_number = p_version_b;

  RETURN v_result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_evidence_pack_data(
  p_pack_type text,
  p_condition text,
  p_start_date date,
  p_end_date date
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
AS $function$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'evidence_summary', (
      SELECT jsonb_agg(jsonb_build_object(
        'query', query_text, 'summary', executive_summary,
        'confidence', confidence_score, 'date', created_at
      ))
      FROM public.evidence_syntheses
      WHERE created_at BETWEEN p_start_date AND p_end_date
      AND applicable_conditions @> ARRAY[p_condition]
    ),
    'practice_changes', (
      SELECT jsonb_agg(jsonb_build_object(
        'title', change_title, 'type', change_type,
        'status', status, 'expected_impact', expected_outcome_improvement
      ))
      FROM public.practice_translations
      WHERE created_at BETWEEN p_start_date AND p_end_date
    ),
    'outcomes', (
      SELECT jsonb_agg(jsonb_build_object(
        'metric', 'visits_per_case', 'value', avg_visits_per_case, 'impact', impact_status
      ))
      FROM public.research_outcomes
      WHERE measurement_date BETWEEN p_start_date AND p_end_date
    )
  )
  INTO v_result;

  RETURN v_result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_research_gap_score(
  p_condition_name text,
  p_outcome_type text
)
  RETURNS integer
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
AS $function$
DECLARE
  v_priority_score integer := 0;
  v_paper_count integer := 0;
  v_recent_paper_count integer := 0;
  v_synthesis_count integer := 0;
  v_translation_success_rate numeric := 0;
  v_gap_score integer;
BEGIN
  SELECT priority_score INTO v_priority_score
  FROM public.research_priorities
  WHERE condition_name = p_condition_name
  AND outcome_type = p_outcome_type
  AND is_active = true
  LIMIT 1;

  v_priority_score := COALESCE(v_priority_score, 50);

  SELECT COUNT(*) INTO v_paper_count
  FROM public.research_papers WHERE p_condition_name = ANY(conditions);

  SELECT COUNT(*) INTO v_recent_paper_count
  FROM public.research_papers
  WHERE p_condition_name = ANY(conditions)
  AND ingested_at >= now() - interval '2 years';

  SELECT COUNT(*) INTO v_synthesis_count
  FROM public.evidence_syntheses
  WHERE query_text ILIKE '%' || p_condition_name || '%'
  AND evidence_quality IN ('strong', 'moderate');

  SELECT
    CASE
      WHEN COUNT(*) > 0 THEN
        COUNT(*) FILTER (WHERE status = 'implemented')::numeric / COUNT(*)::numeric
      ELSE 0
    END
  INTO v_translation_success_rate
  FROM public.practice_translations pt
  JOIN public.evidence_syntheses es ON es.id = pt.evidence_synthesis_id
  WHERE es.query_text ILIKE '%' || p_condition_name || '%';

  v_gap_score := v_priority_score;
  v_gap_score := v_gap_score - (v_paper_count * 2);
  v_gap_score := v_gap_score - (v_recent_paper_count * 3);
  v_gap_score := v_gap_score - (v_synthesis_count * 5);
  v_gap_score := v_gap_score + ((1 - v_translation_success_rate) * 20)::integer;
  v_gap_score := GREATEST(0, LEAST(100, v_gap_score));

  RETURN v_gap_score;
END;
$function$;

CREATE OR REPLACE FUNCTION public.auto_adjust_research_priorities()
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
AS $function$
DECLARE
  v_condition record;
  v_gap_score integer;
BEGIN
  FOR v_condition IN
    SELECT DISTINCT condition_name, outcome_type
    FROM public.research_priorities
    WHERE is_active = true
  LOOP
    v_gap_score := public.calculate_research_gap_score(
      v_condition.condition_name,
      v_condition.outcome_type
    );

    UPDATE public.research_priorities
    SET priority_score = v_gap_score, last_updated = now()
    WHERE condition_name = v_condition.condition_name
    AND outcome_type = v_condition.outcome_type
    AND is_active = true;
  END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.trigger_priority_adjustment()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
AS $function$
BEGIN
  PERFORM public.auto_adjust_research_priorities();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_clinic_capacity(p_clinic_id uuid, p_date date)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
AS $function$
DECLARE
  v_result jsonb;
  v_total_slots integer;
  v_booked_slots integer;
BEGIN
  SELECT COALESCE(COUNT(*) * 8, 8) INTO v_total_slots
  FROM public.clinic_assignments
  WHERE clinic_id = p_clinic_id AND active = true;

  SELECT COALESCE(COUNT(*), 0) INTO v_booked_slots
  FROM public.crm_bookings
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
$function$;

CREATE OR REPLACE FUNCTION public.verify_audit_immutability()
  RETURNS TABLE(
    table_name text,
    has_update_trigger boolean,
    has_delete_trigger boolean,
    has_rls_enabled boolean
  )
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    t.tablename::TEXT,
    EXISTS(
      SELECT 1 FROM pg_trigger
      WHERE tgrelid = (quote_ident(t.schemaname) || '.' || quote_ident(t.tablename))::regclass
      AND tgname LIKE '%update%'
    ) as has_update_trigger,
    EXISTS(
      SELECT 1 FROM pg_trigger
      WHERE tgrelid = (quote_ident(t.schemaname) || '.' || quote_ident(t.tablename))::regclass
      AND tgname LIKE '%delete%'
    ) as has_delete_trigger,
    t.rowsecurity as has_rls_enabled
  FROM pg_tables t
  WHERE t.schemaname = 'public'
  AND (
    t.tablename LIKE '%_logs' OR t.tablename LIKE '%_history' OR
    t.tablename LIKE '%_events' OR t.tablename LIKE '%_snapshots'
  )
  ORDER BY t.tablename;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_evidence_synthesis_version()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
AS $function$
DECLARE
  v_version_number integer;
  v_diff jsonb;
BEGIN
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO v_version_number
  FROM public.evidence_synthesis_versions
  WHERE synthesis_id = NEW.id;

  v_diff := jsonb_build_object(
    'query_text_changed', (OLD.query_text IS DISTINCT FROM NEW.query_text),
    'synthesis_text_changed', (OLD.synthesis_text IS DISTINCT FROM NEW.synthesis_text),
    'confidence_score_changed', (OLD.confidence_score IS DISTINCT FROM NEW.confidence_score),
    'evidence_quality_changed', (OLD.evidence_quality IS DISTINCT FROM NEW.evidence_quality),
    'recommendations_changed', (OLD.recommendations IS DISTINCT FROM NEW.recommendations)
  );

  INSERT INTO public.evidence_synthesis_versions (
    synthesis_id, version_number, query_text, synthesis_text,
    clinical_implications, operational_implications, recommendations,
    confidence_score, evidence_quality, consensus_level,
    changed_by, change_summary, diff_from_previous
  ) VALUES (
    NEW.id, v_version_number, NEW.query_text, NEW.synthesis_text,
    NEW.clinical_implications, NEW.operational_implications, NEW.recommendations,
    NEW.confidence_score, NEW.evidence_quality, NEW.consensus_level,
    auth.uid(), 'Auto-versioned on update', v_diff
  );

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_practice_translation_version()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
AS $function$
DECLARE
  v_version_number integer;
  v_diff jsonb;
BEGIN
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO v_version_number
  FROM public.practice_translation_versions
  WHERE translation_id = NEW.id;

  v_diff := jsonb_build_object(
    'change_title_changed', (OLD.change_title IS DISTINCT FROM NEW.change_title),
    'change_description_changed', (OLD.change_description IS DISTINCT FROM NEW.change_description),
    'expected_outcome_changed', (OLD.expected_outcome_improvement IS DISTINCT FROM NEW.expected_outcome_improvement),
    'status_changed', (OLD.status IS DISTINCT FROM NEW.status)
  );

  INSERT INTO public.practice_translation_versions (
    translation_id, version_number, change_title, change_description,
    expected_outcome_improvement, implementation_complexity,
    estimated_training_hours, status, changed_by, change_summary, diff_from_previous
  ) VALUES (
    NEW.id, v_version_number, NEW.change_title, NEW.change_description,
    NEW.expected_outcome_improvement, NEW.implementation_complexity,
    NEW.estimated_training_hours, NEW.status, auth.uid(),
    CASE
      WHEN OLD.status != NEW.status
        THEN 'Status changed from ' || OLD.status || ' to ' || NEW.status
      ELSE 'Auto-versioned on update'
    END,
    v_diff
  );

  RETURN NEW;
END;
$function$;
