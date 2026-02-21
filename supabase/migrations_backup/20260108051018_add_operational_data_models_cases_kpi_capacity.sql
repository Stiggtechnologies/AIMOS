/*
  # Add Operational Data Models - Cases, KPI Events, Capacity Snapshots

  ## Summary
  Adds the final operational data models to complete the AIM OS operations engine:
  - Patient cases (episodes of care)
  - KPI events (time-series operational metrics)
  - Capacity snapshots (point-in-time capacity measurements)

  ## New Tables
  1. `ops_cases` - Patient episodes and treatment cases
  2. `ops_kpi_events` - Time-series operational KPI events
  3. `ops_capacity_snapshots` - Point-in-time capacity measurements

  ## Integration
  - Extends existing patients, clinics, staff_profiles tables
  - All writes automatically logged to audit_events via triggers
  - RLS enabled for all tables
  - No modifications to existing tables

  ## Security
  - RLS restricts access based on clinic membership
  - Audit triggers log all INSERT/UPDATE/DELETE operations
  - PHI data properly protected with clinic-scoped access
*/

-- =====================================================
-- ENUMS
-- =====================================================

DO $$ BEGIN
  CREATE TYPE ops_case_status AS ENUM (
    'new',
    'active',
    'on_hold',
    'pending_approval',
    'completed',
    'cancelled',
    'archived'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE ops_case_priority AS ENUM ('low', 'medium', 'high', 'urgent', 'critical');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE ops_kpi_event_type AS ENUM (
    'appointment_scheduled',
    'appointment_completed',
    'appointment_cancelled',
    'appointment_no_show',
    'patient_checked_in',
    'patient_checked_out',
    'treatment_started',
    'treatment_completed',
    'credential_expired',
    'credential_renewed',
    'staff_shift_started',
    'staff_shift_ended',
    'capacity_threshold_reached',
    'room_occupied',
    'room_released',
    'equipment_used',
    'supply_depleted',
    'quality_incident',
    'safety_alert',
    'custom'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- 1. CASES TABLE (Patient Episodes)
-- =====================================================

CREATE TABLE IF NOT EXISTS ops_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number TEXT NOT NULL,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  
  -- Case details
  case_type TEXT NOT NULL,
  diagnosis_code TEXT,
  diagnosis_description TEXT,
  status ops_case_status DEFAULT 'new',
  priority ops_case_priority DEFAULT 'medium',
  
  -- Timeline
  opened_at TIMESTAMPTZ DEFAULT now(),
  closed_at TIMESTAMPTZ,
  target_completion_date DATE,
  
  -- Assignment
  primary_clinician_id UUID REFERENCES staff_profiles(id),
  assigned_team_ids UUID[] DEFAULT '{}',
  referring_provider_id UUID,
  
  -- Clinical information
  chief_complaint TEXT,
  treatment_plan TEXT,
  clinical_notes TEXT,
  
  -- Authorization and billing
  authorization_number TEXT,
  authorization_expiry DATE,
  employer_id UUID REFERENCES employer_accounts(id),
  payer_id UUID REFERENCES insurance_payers(id),
  
  -- Outcomes
  outcome_status TEXT,
  discharge_disposition TEXT,
  readmission_risk_score NUMERIC(3,2),
  
  -- Metadata
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  UNIQUE(clinic_id, case_number)
);

CREATE INDEX IF NOT EXISTS idx_ops_cases_patient ON ops_cases(patient_id);
CREATE INDEX IF NOT EXISTS idx_ops_cases_clinic ON ops_cases(clinic_id);
CREATE INDEX IF NOT EXISTS idx_ops_cases_status ON ops_cases(status);
CREATE INDEX IF NOT EXISTS idx_ops_cases_priority ON ops_cases(priority);
CREATE INDEX IF NOT EXISTS idx_ops_cases_clinician ON ops_cases(primary_clinician_id);
CREATE INDEX IF NOT EXISTS idx_ops_cases_opened_at ON ops_cases(opened_at);
CREATE INDEX IF NOT EXISTS idx_ops_cases_employer ON ops_cases(employer_id);
CREATE INDEX IF NOT EXISTS idx_ops_cases_payer ON ops_cases(payer_id);
CREATE INDEX IF NOT EXISTS idx_ops_cases_case_number ON ops_cases(case_number);

-- =====================================================
-- 2. KPI EVENTS TABLE (Time-Series Metrics)
-- =====================================================

CREATE TABLE IF NOT EXISTS ops_kpi_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type ops_kpi_event_type NOT NULL,
  event_name TEXT NOT NULL,
  
  -- Context
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES staff_profiles(id),
  patient_id UUID REFERENCES patients(id),
  case_id UUID REFERENCES ops_cases(id),
  
  -- Event details
  event_timestamp TIMESTAMPTZ DEFAULT now(),
  event_date DATE DEFAULT CURRENT_DATE,
  
  -- Metrics
  metric_value NUMERIC(12,4),
  metric_unit TEXT,
  
  -- Dimensions for analysis
  dimensions JSONB DEFAULT '{}',
  
  -- Additional context
  related_entity_type TEXT,
  related_entity_id UUID,
  
  -- Metadata
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  
  -- Attribution
  triggered_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ops_kpi_events_type ON ops_kpi_events(event_type);
CREATE INDEX IF NOT EXISTS idx_ops_kpi_events_clinic ON ops_kpi_events(clinic_id);
CREATE INDEX IF NOT EXISTS idx_ops_kpi_events_timestamp ON ops_kpi_events(event_timestamp);
CREATE INDEX IF NOT EXISTS idx_ops_kpi_events_date ON ops_kpi_events(event_date);
CREATE INDEX IF NOT EXISTS idx_ops_kpi_events_staff ON ops_kpi_events(staff_id);
CREATE INDEX IF NOT EXISTS idx_ops_kpi_events_patient ON ops_kpi_events(patient_id);
CREATE INDEX IF NOT EXISTS idx_ops_kpi_events_case ON ops_kpi_events(case_id);
CREATE INDEX IF NOT EXISTS idx_ops_kpi_events_entity ON ops_kpi_events(related_entity_type, related_entity_id);

-- GIN index for JSONB dimensions (for filtering)
CREATE INDEX IF NOT EXISTS idx_ops_kpi_events_dimensions ON ops_kpi_events USING GIN(dimensions);

-- =====================================================
-- 3. CAPACITY SNAPSHOTS TABLE (Point-in-Time Capacity)
-- =====================================================

CREATE TABLE IF NOT EXISTS ops_capacity_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  
  -- Snapshot timing
  snapshot_timestamp TIMESTAMPTZ DEFAULT now(),
  snapshot_date DATE DEFAULT CURRENT_DATE,
  snapshot_hour INTEGER,
  
  -- Staff capacity
  total_staff_available INTEGER DEFAULT 0,
  total_staff_scheduled INTEGER DEFAULT 0,
  total_staff_on_duty INTEGER DEFAULT 0,
  staff_utilization_percent NUMERIC(5,2),
  
  -- Room/facility capacity
  total_rooms INTEGER DEFAULT 0,
  rooms_available INTEGER DEFAULT 0,
  rooms_in_use INTEGER DEFAULT 0,
  rooms_maintenance INTEGER DEFAULT 0,
  room_utilization_percent NUMERIC(5,2),
  
  -- Patient/appointment capacity
  total_appointment_slots INTEGER DEFAULT 0,
  slots_booked INTEGER DEFAULT 0,
  slots_available INTEGER DEFAULT 0,
  active_patients_in_clinic INTEGER DEFAULT 0,
  waiting_patients INTEGER DEFAULT 0,
  
  -- Equipment and resources
  critical_equipment_available INTEGER DEFAULT 0,
  critical_equipment_in_use INTEGER DEFAULT 0,
  
  -- Metrics
  average_wait_time_minutes INTEGER,
  average_visit_duration_minutes INTEGER,
  
  -- Capacity flags
  is_at_capacity BOOLEAN DEFAULT false,
  is_overcapacity BOOLEAN DEFAULT false,
  capacity_status TEXT DEFAULT 'normal',
  
  -- Dimensional data
  service_line TEXT,
  shift_type TEXT,
  
  -- Metadata
  dimensions JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  
  -- Attribution
  captured_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ops_capacity_snapshots_clinic ON ops_capacity_snapshots(clinic_id);
CREATE INDEX IF NOT EXISTS idx_ops_capacity_snapshots_timestamp ON ops_capacity_snapshots(snapshot_timestamp);
CREATE INDEX IF NOT EXISTS idx_ops_capacity_snapshots_date ON ops_capacity_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_ops_capacity_snapshots_hour ON ops_capacity_snapshots(snapshot_date, snapshot_hour);
CREATE INDEX IF NOT EXISTS idx_ops_capacity_snapshots_service ON ops_capacity_snapshots(service_line);
CREATE INDEX IF NOT EXISTS idx_ops_capacity_snapshots_status ON ops_capacity_snapshots(capacity_status);

-- GIN index for JSONB dimensions
CREATE INDEX IF NOT EXISTS idx_ops_capacity_snapshots_dimensions ON ops_capacity_snapshots USING GIN(dimensions);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Cases RLS
ALTER TABLE ops_cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view cases at their clinics"
  ON ops_cases FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_access WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can insert cases at their clinics"
  ON ops_cases FOR INSERT
  TO authenticated
  WITH CHECK (
    clinic_id IN (
      SELECT ca.clinic_id 
      FROM clinic_access ca
      JOIN user_profiles up ON ca.user_id = up.id
      WHERE ca.user_id = auth.uid()
        AND up.role IN ('admin', 'executive', 'clinic_manager')
    )
  );

CREATE POLICY "Managers can update cases at their clinics"
  ON ops_cases FOR UPDATE
  TO authenticated
  USING (
    clinic_id IN (
      SELECT ca.clinic_id 
      FROM clinic_access ca
      JOIN user_profiles up ON ca.user_id = up.id
      WHERE ca.user_id = auth.uid()
        AND up.role IN ('admin', 'executive', 'clinic_manager')
    )
  )
  WITH CHECK (
    clinic_id IN (
      SELECT ca.clinic_id 
      FROM clinic_access ca
      JOIN user_profiles up ON ca.user_id = up.id
      WHERE ca.user_id = auth.uid()
        AND up.role IN ('admin', 'executive', 'clinic_manager')
    )
  );

CREATE POLICY "Admins can delete cases"
  ON ops_cases FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- KPI Events RLS
ALTER TABLE ops_kpi_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view KPI events at their clinics"
  ON ops_kpi_events FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_access WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert KPI events"
  ON ops_kpi_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- No update or delete - events are immutable once created

-- Capacity Snapshots RLS
ALTER TABLE ops_capacity_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view capacity snapshots at their clinics"
  ON ops_capacity_snapshots FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_access WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert capacity snapshots"
  ON ops_capacity_snapshots FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- No update or delete - snapshots are immutable once created

-- =====================================================
-- AUDIT TRIGGERS
-- =====================================================

-- Add audit trigger to ops_cases
DROP TRIGGER IF EXISTS audit_ops_cases ON ops_cases;
CREATE TRIGGER audit_ops_cases
  AFTER INSERT OR UPDATE OR DELETE ON ops_cases
  FOR EACH ROW
  EXECUTE FUNCTION log_modification();

-- Add audit trigger to ops_kpi_events
DROP TRIGGER IF EXISTS audit_ops_kpi_events ON ops_kpi_events;
CREATE TRIGGER audit_ops_kpi_events
  AFTER INSERT OR UPDATE OR DELETE ON ops_kpi_events
  FOR EACH ROW
  EXECUTE FUNCTION log_modification();

-- Add audit trigger to ops_capacity_snapshots
DROP TRIGGER IF EXISTS audit_ops_capacity_snapshots ON ops_capacity_snapshots;
CREATE TRIGGER audit_ops_capacity_snapshots
  AFTER INSERT OR UPDATE OR DELETE ON ops_capacity_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION log_modification();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to generate case number
CREATE OR REPLACE FUNCTION generate_case_number(p_clinic_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INTEGER;
  v_year TEXT;
  v_clinic_code TEXT;
BEGIN
  -- Get year
  v_year := TO_CHAR(CURRENT_DATE, 'YY');
  
  -- Get clinic code (first 3 letters of clinic name)
  SELECT UPPER(SUBSTRING(name, 1, 3)) INTO v_clinic_code
  FROM clinics
  WHERE id = p_clinic_id;
  
  -- Get count of cases for this clinic this year
  SELECT COUNT(*) INTO v_count
  FROM ops_cases
  WHERE clinic_id = p_clinic_id
    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE);
  
  -- Generate case number: CLINIC-YY-0001
  RETURN v_clinic_code || '-' || v_year || '-' || LPAD((v_count + 1)::TEXT, 4, '0');
END;
$$;

-- Function to record KPI event
CREATE OR REPLACE FUNCTION record_kpi_event(
  p_event_type TEXT,
  p_event_name TEXT,
  p_clinic_id UUID DEFAULT NULL,
  p_metric_value NUMERIC DEFAULT NULL,
  p_dimensions JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO ops_kpi_events (
    event_type,
    event_name,
    clinic_id,
    metric_value,
    dimensions,
    triggered_by
  ) VALUES (
    p_event_type::ops_kpi_event_type,
    p_event_name,
    p_clinic_id,
    p_metric_value,
    p_dimensions,
    auth.uid()
  ) RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$;

GRANT EXECUTE ON FUNCTION generate_case_number TO authenticated;
GRANT EXECUTE ON FUNCTION record_kpi_event TO authenticated;
