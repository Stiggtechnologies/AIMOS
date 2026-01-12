/*
  # Launch Module Gate Validation Functions

  1. Functions Created
    - validate_phase_gate - Check if phase can advance
    - calculate_launch_completion - Calculate overall launch progress
    - get_launch_blockers - Get all items blocking launch
    - update_launch_progress - Recalculate progress metrics
    - create_launch_from_template - Create launch with standard phases
    
  2. Helper Functions
    - get_overdue_tasks - Get tasks past due date
    - get_critical_risks - Get unresolved critical risks
    - calculate_workstream_progress - Calculate workstream completion
*/

-- Function to validate if a phase can pass its gate
CREATE OR REPLACE FUNCTION validate_phase_gate(p_phase_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phase record;
  v_launch record;
  v_blockers jsonb DEFAULT '[]'::jsonb;
  v_can_pass boolean DEFAULT true;
  v_required_tasks_count integer;
  v_completed_required_tasks_count integer;
  v_critical_risks_count integer;
  v_pending_approvals_count integer;
BEGIN
  -- Get phase and launch info
  SELECT * INTO v_phase FROM launch_phases WHERE id = p_phase_id;
  SELECT * INTO v_launch FROM clinic_launches WHERE id = v_phase.clinic_launch_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'can_pass', false,
      'reason', 'Phase not found'
    );
  END IF;
  
  -- Check 1: All required tasks must be completed
  SELECT 
    COUNT(*) FILTER (WHERE is_required = true),
    COUNT(*) FILTER (WHERE is_required = true AND status = 'completed')
  INTO v_required_tasks_count, v_completed_required_tasks_count
  FROM launch_tasks
  WHERE clinic_launch_id = v_phase.clinic_launch_id
  AND phase_name = v_phase.phase_name;
  
  IF v_required_tasks_count > v_completed_required_tasks_count THEN
    v_can_pass := false;
    v_blockers := v_blockers || jsonb_build_object(
      'type', 'incomplete_tasks',
      'message', format('%s of %s required tasks incomplete', 
        v_required_tasks_count - v_completed_required_tasks_count,
        v_required_tasks_count)
    );
  END IF;
  
  -- Check 2: No critical unresolved risks
  SELECT COUNT(*) INTO v_critical_risks_count
  FROM launch_risks
  WHERE clinic_launch_id = v_phase.clinic_launch_id
  AND phase_name = v_phase.phase_name
  AND severity = 'critical'
  AND status NOT IN ('resolved', 'accepted');
  
  IF v_critical_risks_count > 0 THEN
    v_can_pass := false;
    v_blockers := v_blockers || jsonb_build_object(
      'type', 'critical_risks',
      'message', format('%s unresolved critical risks', v_critical_risks_count)
    );
  END IF;
  
  -- Check 3: All required documents approved
  SELECT COUNT(*) INTO v_pending_approvals_count
  FROM launch_documents
  WHERE clinic_launch_id = v_phase.clinic_launch_id
  AND phase_name = v_phase.phase_name
  AND requires_approval = true
  AND approved = false;
  
  IF v_pending_approvals_count > 0 THEN
    v_can_pass := false;
    v_blockers := v_blockers || jsonb_build_object(
      'type', 'pending_approvals',
      'message', format('%s documents pending approval', v_pending_approvals_count)
    );
  END IF;
  
  RETURN jsonb_build_object(
    'can_pass', v_can_pass,
    'blockers', v_blockers,
    'required_tasks', v_required_tasks_count,
    'completed_tasks', v_completed_required_tasks_count,
    'critical_risks', v_critical_risks_count,
    'pending_approvals', v_pending_approvals_count
  );
END;
$$;

-- Function to calculate overall launch completion
CREATE OR REPLACE FUNCTION calculate_launch_completion(p_launch_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_tasks integer;
  v_completed_tasks integer;
  v_completion_pct numeric;
BEGIN
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'completed')
  INTO v_total_tasks, v_completed_tasks
  FROM launch_tasks
  WHERE clinic_launch_id = p_launch_id;
  
  IF v_total_tasks = 0 THEN
    RETURN 0;
  END IF;
  
  v_completion_pct := (v_completed_tasks::numeric / v_total_tasks::numeric) * 100;
  
  -- Update the launch record
  UPDATE clinic_launches
  SET 
    overall_completion_pct = v_completion_pct,
    updated_at = now()
  WHERE id = p_launch_id;
  
  RETURN v_completion_pct;
END;
$$;

-- Function to get all launch blockers
CREATE OR REPLACE FUNCTION get_launch_blockers(p_launch_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_blockers jsonb DEFAULT '[]'::jsonb;
  v_overdue_tasks integer;
  v_critical_risks integer;
  v_blocked_tasks integer;
BEGIN
  -- Overdue tasks
  SELECT COUNT(*) INTO v_overdue_tasks
  FROM launch_tasks
  WHERE clinic_launch_id = p_launch_id
  AND status NOT IN ('completed', 'skipped')
  AND due_date < CURRENT_DATE;
  
  IF v_overdue_tasks > 0 THEN
    v_blockers := v_blockers || jsonb_build_object(
      'type', 'overdue_tasks',
      'count', v_overdue_tasks,
      'severity', 'high',
      'message', format('%s tasks are overdue', v_overdue_tasks)
    );
  END IF;
  
  -- Critical unresolved risks
  SELECT COUNT(*) INTO v_critical_risks
  FROM launch_risks
  WHERE clinic_launch_id = p_launch_id
  AND severity IN ('critical', 'high')
  AND status NOT IN ('resolved', 'accepted');
  
  IF v_critical_risks > 0 THEN
    v_blockers := v_blockers || jsonb_build_object(
      'type', 'critical_risks',
      'count', v_critical_risks,
      'severity', 'critical',
      'message', format('%s critical/high risks unresolved', v_critical_risks)
    );
  END IF;
  
  -- Blocked tasks
  SELECT COUNT(*) INTO v_blocked_tasks
  FROM launch_tasks
  WHERE clinic_launch_id = p_launch_id
  AND status = 'blocked';
  
  IF v_blocked_tasks > 0 THEN
    v_blockers := v_blockers || jsonb_build_object(
      'type', 'blocked_tasks',
      'count', v_blocked_tasks,
      'severity', 'medium',
      'message', format('%s tasks are blocked', v_blocked_tasks)
    );
  END IF;
  
  RETURN jsonb_build_object(
    'blockers', v_blockers,
    'total_count', jsonb_array_length(v_blockers),
    'has_blockers', jsonb_array_length(v_blockers) > 0
  );
END;
$$;

-- Function to update all launch progress metrics
CREATE OR REPLACE FUNCTION update_launch_progress(p_launch_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_workstream record;
  v_phase record;
BEGIN
  -- Update workstream progress
  FOR v_workstream IN 
    SELECT id FROM launch_workstreams WHERE clinic_launch_id = p_launch_id
  LOOP
    UPDATE launch_workstreams
    SET 
      total_tasks = (
        SELECT COUNT(*) FROM launch_tasks WHERE workstream_id = v_workstream.id
      ),
      completed_tasks = (
        SELECT COUNT(*) FROM launch_tasks WHERE workstream_id = v_workstream.id AND status = 'completed'
      ),
      completion_pct = (
        SELECT CASE 
          WHEN COUNT(*) = 0 THEN 0 
          ELSE (COUNT(*) FILTER (WHERE status = 'completed')::numeric / COUNT(*)::numeric) * 100 
        END
        FROM launch_tasks WHERE workstream_id = v_workstream.id
      ),
      updated_at = now()
    WHERE id = v_workstream.id;
  END LOOP;
  
  -- Update phase progress
  FOR v_phase IN 
    SELECT id, phase_name FROM launch_phases WHERE clinic_launch_id = p_launch_id
  LOOP
    UPDATE launch_phases
    SET 
      completion_pct = (
        SELECT CASE 
          WHEN COUNT(*) = 0 THEN 0 
          ELSE (COUNT(*) FILTER (WHERE status = 'completed')::numeric / COUNT(*)::numeric) * 100 
        END
        FROM launch_tasks 
        WHERE clinic_launch_id = p_launch_id AND phase_name = v_phase.phase_name
      ),
      updated_at = now()
    WHERE id = v_phase.id;
  END LOOP;
  
  -- Update overall launch completion
  PERFORM calculate_launch_completion(p_launch_id);
END;
$$;

-- Function to create a launch with standard phases and workstreams
CREATE OR REPLACE FUNCTION create_launch_from_template(
  p_clinic_id uuid,
  p_launch_name text,
  p_launch_code text,
  p_launch_owner_id uuid,
  p_target_open_date date,
  p_approved_budget numeric DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_launch_id uuid;
  v_phase_order integer;
  v_phase_name launch_phase_name;
  v_workstream_type workstream_type;
  v_planned_start date := CURRENT_DATE;
BEGIN
  -- Create launch
  INSERT INTO clinic_launches (
    clinic_id,
    launch_name,
    launch_code,
    launch_owner_id,
    target_open_date,
    planned_start_date,
    approved_budget,
    created_by
  ) VALUES (
    p_clinic_id,
    p_launch_name,
    p_launch_code,
    p_launch_owner_id,
    p_target_open_date,
    v_planned_start,
    p_approved_budget,
    auth.uid()
  )
  RETURNING id INTO v_launch_id;
  
  -- Create standard phases
  v_phase_order := 0;
  FOR v_phase_name IN SELECT unnest(ARRAY[
    'phase_0_deal_authorization'::launch_phase_name,
    'phase_1_site_build_compliance'::launch_phase_name,
    'phase_2_staffing_credentialing'::launch_phase_name,
    'phase_3_systems_ops_readiness'::launch_phase_name,
    'phase_4_go_live'::launch_phase_name,
    'phase_5_stabilization'::launch_phase_name
  ])
  LOOP
    INSERT INTO launch_phases (
      clinic_launch_id,
      phase_name,
      phase_order,
      status
    ) VALUES (
      v_launch_id,
      v_phase_name,
      v_phase_order,
      CASE WHEN v_phase_order = 0 THEN 'in_progress'::phase_status ELSE 'not_started'::phase_status END
    );
    v_phase_order := v_phase_order + 1;
  END LOOP;
  
  -- Create standard workstreams
  FOR v_workstream_type IN SELECT unnest(ARRAY[
    'real_estate_build'::workstream_type,
    'compliance_licensing'::workstream_type,
    'staffing_credentials'::workstream_type,
    'systems_it'::workstream_type,
    'clinical_ops'::workstream_type,
    'marketing_outreach'::workstream_type
  ])
  LOOP
    INSERT INTO launch_workstreams (
      clinic_launch_id,
      workstream_type,
      workstream_name,
      description
    ) VALUES (
      v_launch_id,
      v_workstream_type,
      REPLACE(REPLACE(v_workstream_type::text, '_', ' '), 'workstream type.', ''),
      'Standard ' || v_workstream_type::text || ' workstream'
    );
  END LOOP;
  
  RETURN v_launch_id;
END;
$$;

-- Function to get overdue tasks for a launch
CREATE OR REPLACE FUNCTION get_overdue_tasks(p_launch_id uuid)
RETURNS TABLE (
  task_id uuid,
  task_name text,
  due_date date,
  days_overdue integer,
  assigned_to uuid,
  workstream_name text,
  is_gate_blocker boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.task_name,
    t.due_date,
    (CURRENT_DATE - t.due_date)::integer,
    t.assigned_to,
    w.workstream_name,
    t.is_gate_blocker
  FROM launch_tasks t
  LEFT JOIN launch_workstreams w ON t.workstream_id = w.id
  WHERE t.clinic_launch_id = p_launch_id
  AND t.status NOT IN ('completed', 'skipped')
  AND t.due_date < CURRENT_DATE
  ORDER BY t.due_date ASC;
END;
$$;

-- Function to get critical risks for a launch
CREATE OR REPLACE FUNCTION get_critical_risks(p_launch_id uuid)
RETURNS TABLE (
  risk_id uuid,
  risk_title text,
  severity risk_severity,
  status risk_status,
  phase_name launch_phase_name,
  identified_date date,
  owner_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.risk_title,
    r.severity,
    r.status,
    r.phase_name,
    r.identified_date,
    r.owner_id
  FROM launch_risks r
  WHERE r.clinic_launch_id = p_launch_id
  AND r.severity IN ('critical', 'high')
  AND r.status NOT IN ('resolved', 'accepted')
  ORDER BY 
    CASE r.severity 
      WHEN 'critical' THEN 1
      WHEN 'high' THEN 2
      ELSE 3
    END,
    r.identified_date ASC;
END;
$$;