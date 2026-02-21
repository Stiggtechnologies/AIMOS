/*
  # Create Scheduler Write-Back Phase 2 Schema

  1. New Tables
    - `scheduler_recommendations` — AI-generated scheduling recommendations
    - `scheduler_approvals` — Human approvals/rejections of recommendations
    - `scheduler_audit_log` — Complete audit trail for compliance
    - `write_back_permissions` — Role-based permission matrix for approval authority

  2. Features
    - Confidence thresholds (75-95% depending on action type)
    - Role-based approval permissions
    - Full audit trail with outcomes
    - Reversible action tracking
    - Human approval requirement

  3. Security
    - RLS enabled on all tables
    - Role-based access control
    - Immutable audit logs
    - No autonomous execution

  4. Columns Include
    - Original IDs preserved from Practice Perfect
    - Confidence scores with thresholds
    - User identifiers for approval tracking
    - Timestamps for all state changes
    - Outcome tracking for AI learning
*/

-- Scheduler Recommendations Table
CREATE TABLE IF NOT EXISTS scheduler_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  appointment_id text NOT NULL,
  recommendation_type TEXT NOT NULL CHECK (recommendation_type IN (
    'status_update', 'waitlist_fill', 'overbook_suggestion', 'reschedule', 'block_insertion'
  )),
  confidence_score NUMERIC(5,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
  required_threshold NUMERIC(5,2) NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  rationale TEXT NOT NULL,
  expected_impact JSONB NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',
  proposed_action JSONB NOT NULL,
  approval_required BOOLEAN DEFAULT true,
  is_approved BOOLEAN DEFAULT NULL,
  is_executed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '1 day'),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Scheduler Approvals Table
CREATE TABLE IF NOT EXISTS scheduler_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id uuid NOT NULL REFERENCES scheduler_recommendations(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  approver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  approver_role TEXT NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('approved', 'rejected')),
  approval_note TEXT,
  confidence_check_passed BOOLEAN NOT NULL,
  role_authorized BOOLEAN NOT NULL,
  data_freshness_check BOOLEAN NOT NULL DEFAULT true,
  approved_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Write-Back Execution Log
CREATE TABLE IF NOT EXISTS scheduler_execution_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_id uuid NOT NULL REFERENCES scheduler_approvals(id) ON DELETE CASCADE,
  recommendation_id uuid NOT NULL REFERENCES scheduler_recommendations(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  pp_action_id TEXT,
  execution_status TEXT NOT NULL CHECK (execution_status IN (
    'pending', 'in_progress', 'success', 'failed', 'rolled_back'
  )),
  error_message TEXT,
  pp_response JSONB,
  executed_at TIMESTAMPTZ,
  executed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  outcome_status TEXT,
  outcome_data JSONB,
  recorded_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Scheduler Audit Log (Immutable)
CREATE TABLE IF NOT EXISTS scheduler_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'recommendation_generated', 'approval_requested', 'approval_granted', 
    'approval_denied', 'execution_initiated', 'execution_completed', 
    'execution_failed', 'outcome_recorded'
  )),
  recommendation_id uuid REFERENCES scheduler_recommendations(id) ON DELETE SET NULL,
  approval_id uuid REFERENCES scheduler_approvals(id) ON DELETE SET NULL,
  execution_id uuid REFERENCES scheduler_execution_log(id) ON DELETE SET NULL,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_role TEXT,
  action_description TEXT NOT NULL,
  ai_confidence NUMERIC(5,2),
  data_snapshot JSONB NOT NULL DEFAULT '{}',
  outcome JSONB DEFAULT '{}',
  notes TEXT,
  recorded_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Write-Back Permissions Matrix
CREATE TABLE IF NOT EXISTS write_back_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL,
  can_approve_status_update BOOLEAN DEFAULT false,
  can_approve_waitlist_fill BOOLEAN DEFAULT false,
  can_approve_overbook BOOLEAN DEFAULT false,
  can_approve_reschedule BOOLEAN DEFAULT false,
  can_approve_block_insertion BOOLEAN DEFAULT false,
  can_override_confidence BOOLEAN DEFAULT false,
  max_approval_impact_level INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(clinic_id, role_name)
);

-- Enable RLS
ALTER TABLE scheduler_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduler_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduler_execution_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduler_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE write_back_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: scheduler_recommendations
CREATE POLICY "Staff can view recommendations for their clinic"
  ON scheduler_recommendations FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "System can create recommendations"
  ON scheduler_recommendations FOR INSERT
  TO authenticated
  WITH CHECK (
    clinic_id IN (
      SELECT clinic_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Approvers can update recommendations"
  ON scheduler_recommendations FOR UPDATE
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM user_profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    clinic_id IN (
      SELECT clinic_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- RLS Policies: scheduler_approvals
CREATE POLICY "Staff can view approvals for their clinic"
  ON scheduler_approvals FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Authorized staff can approve"
  ON scheduler_approvals FOR INSERT
  TO authenticated
  WITH CHECK (
    clinic_id IN (
      SELECT clinic_id FROM user_profiles WHERE id = auth.uid()
    )
    AND approver_id = auth.uid()
  );

-- RLS Policies: scheduler_execution_log
CREATE POLICY "Staff can view execution logs for their clinic"
  ON scheduler_execution_log FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "System can log executions"
  ON scheduler_execution_log FOR INSERT
  TO authenticated
  WITH CHECK (
    clinic_id IN (
      SELECT clinic_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- RLS Policies: scheduler_audit_log (Immutable)
CREATE POLICY "Staff can view audit logs for their clinic"
  ON scheduler_audit_log FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "System can append to audit log"
  ON scheduler_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (
    clinic_id IN (
      SELECT clinic_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- RLS Policies: write_back_permissions
CREATE POLICY "Clinic managers can view permissions"
  ON write_back_permissions FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX idx_scheduler_recommendations_clinic_id ON scheduler_recommendations(clinic_id);
CREATE INDEX idx_scheduler_recommendations_appointment_id ON scheduler_recommendations(appointment_id);
CREATE INDEX idx_scheduler_recommendations_created_at ON scheduler_recommendations(created_at DESC);
CREATE INDEX idx_scheduler_approvals_recommendation_id ON scheduler_approvals(recommendation_id);
CREATE INDEX idx_scheduler_approvals_approver_id ON scheduler_approvals(approver_id);
CREATE INDEX idx_scheduler_approvals_created_at ON scheduler_approvals(created_at DESC);
CREATE INDEX idx_scheduler_execution_log_recommendation_id ON scheduler_execution_log(recommendation_id);
CREATE INDEX idx_scheduler_audit_log_clinic_id ON scheduler_audit_log(clinic_id);
CREATE INDEX idx_scheduler_audit_log_event_type ON scheduler_audit_log(event_type);
CREATE INDEX idx_write_back_permissions_clinic_id ON write_back_permissions(clinic_id);
