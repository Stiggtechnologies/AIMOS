/*
  # Extend Service Portfolio for Complete Management

  ## Changes
  1. Add clinic_id to existing service_lines table
  2. Create missing service portfolio tables
  3. Add RLS policies for all tables (executives and clinic_managers only)
  4. Create indexes for performance

  ## Purpose
  Enable strategic service portfolio management with demand, capacity, and lifecycle tracking
*/

-- Add clinic_id to service_lines if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_lines' AND column_name = 'clinic_id'
  ) THEN
    ALTER TABLE service_lines ADD COLUMN clinic_id uuid;
    -- Set a default clinic_id for existing rows
    UPDATE service_lines SET clinic_id = (SELECT id FROM clinics LIMIT 1) WHERE clinic_id IS NULL;
  END IF;
END $$;

-- Create service_demand table if not exists
CREATE TABLE IF NOT EXISTS service_demand (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_line_id uuid NOT NULL,
  clinic_id uuid NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  requests_received integer DEFAULT 0,
  appointments_booked integer DEFAULT 0,
  appointments_completed integer DEFAULT 0,
  waitlist_count integer DEFAULT 0,
  average_wait_days numeric DEFAULT 0,
  referrals_received integer DEFAULT 0,
  conversion_rate numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_demand_service ON service_demand(service_line_id);
CREATE INDEX IF NOT EXISTS idx_service_demand_clinic ON service_demand(clinic_id);
CREATE INDEX IF NOT EXISTS idx_service_demand_period ON service_demand(period_start, period_end);

-- Create service_capacity table if not exists
CREATE TABLE IF NOT EXISTS service_capacity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_line_id uuid NOT NULL,
  clinic_id uuid NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  total_slots_available integer DEFAULT 0,
  slots_booked integer DEFAULT 0,
  slots_completed integer DEFAULT 0,
  slots_cancelled integer DEFAULT 0,
  utilization_percentage numeric DEFAULT 0,
  staff_fte_allocated numeric DEFAULT 0,
  room_hours_allocated numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_capacity_service ON service_capacity(service_line_id);
CREATE INDEX IF NOT EXISTS idx_service_capacity_clinic ON service_capacity(clinic_id);
CREATE INDEX IF NOT EXISTS idx_service_capacity_period ON service_capacity(period_start, period_end);

-- Create service_performance table if not exists
CREATE TABLE IF NOT EXISTS service_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_line_id uuid NOT NULL,
  clinic_id uuid NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  total_revenue numeric DEFAULT 0,
  direct_costs numeric DEFAULT 0,
  gross_margin numeric DEFAULT 0,
  gross_margin_percentage numeric DEFAULT 0,
  patient_count integer DEFAULT 0,
  average_revenue_per_patient numeric DEFAULT 0,
  patient_satisfaction_score numeric DEFAULT 0,
  nps_score integer,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_performance_service ON service_performance(service_line_id);
CREATE INDEX IF NOT EXISTS idx_service_performance_clinic ON service_performance(clinic_id);
CREATE INDEX IF NOT EXISTS idx_service_performance_period ON service_performance(period_start, period_end);

-- service_lifecycle_events already exists, ensure it has needed columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_lifecycle_events' AND column_name = 'clinic_id'
  ) THEN
    ALTER TABLE service_lifecycle_events ADD COLUMN clinic_id uuid;
    UPDATE service_lifecycle_events SET clinic_id = (SELECT id FROM clinics LIMIT 1) WHERE clinic_id IS NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_lifecycle_events' AND column_name = 'decision_maker'
  ) THEN
    ALTER TABLE service_lifecycle_events ADD COLUMN decision_maker uuid;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_lifecycle_events' AND column_name = 'rationale'
  ) THEN
    ALTER TABLE service_lifecycle_events ADD COLUMN rationale text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_lifecycle_events' AND column_name = 'success_metrics'
  ) THEN
    ALTER TABLE service_lifecycle_events ADD COLUMN success_metrics jsonb DEFAULT '{}'::jsonb;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_lifecycle_events' AND column_name = 'actual_outcomes'
  ) THEN
    ALTER TABLE service_lifecycle_events ADD COLUMN actual_outcomes jsonb;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_service_lifecycle_clinic ON service_lifecycle_events(clinic_id);

-- Create service_dependencies table if not exists
CREATE TABLE IF NOT EXISTS service_dependencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_line_id uuid NOT NULL,
  dependency_type text NOT NULL CHECK (dependency_type IN ('equipment', 'staff_certification', 'space', 'technology', 'regulatory')),
  description text NOT NULL,
  is_met boolean DEFAULT false,
  target_completion_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_dependencies_service ON service_dependencies(service_line_id);
CREATE INDEX IF NOT EXISTS idx_service_dependencies_status ON service_dependencies(is_met);

-- Enable RLS
ALTER TABLE service_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_demand ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_capacity ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_lifecycle_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_dependencies ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Executives and managers can view service lines" ON service_lines;
DROP POLICY IF EXISTS "Executives and managers can manage service lines" ON service_lines;
DROP POLICY IF EXISTS "Executives and managers can view service demand" ON service_demand;
DROP POLICY IF EXISTS "Executives and managers can manage service demand" ON service_demand;
DROP POLICY IF EXISTS "Executives and managers can view service capacity" ON service_capacity;
DROP POLICY IF EXISTS "Executives and managers can manage service capacity" ON service_capacity;
DROP POLICY IF EXISTS "Executives and managers can view service performance" ON service_performance;
DROP POLICY IF EXISTS "Executives and managers can manage service performance" ON service_performance;
DROP POLICY IF EXISTS "Executives and managers can view lifecycle events" ON service_lifecycle_events;
DROP POLICY IF EXISTS "Executives and managers can manage lifecycle events" ON service_lifecycle_events;
DROP POLICY IF EXISTS "Executives and managers can view service dependencies" ON service_dependencies;
DROP POLICY IF EXISTS "Executives and managers can manage service dependencies" ON service_dependencies;

-- RLS Policies for service_lines
CREATE POLICY "Executives and managers can view service lines"
  ON service_lines FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'clinic_manager')
    )
  );

CREATE POLICY "Executives and managers can manage service lines"
  ON service_lines FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'clinic_manager')
    )
  );

-- RLS Policies for service_demand
CREATE POLICY "Executives and managers can view service demand"
  ON service_demand FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'clinic_manager')
    )
  );

CREATE POLICY "Executives and managers can manage service demand"
  ON service_demand FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'clinic_manager')
    )
  );

-- RLS Policies for service_capacity
CREATE POLICY "Executives and managers can view service capacity"
  ON service_capacity FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'clinic_manager')
    )
  );

CREATE POLICY "Executives and managers can manage service capacity"
  ON service_capacity FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'clinic_manager')
    )
  );

-- RLS Policies for service_performance
CREATE POLICY "Executives and managers can view service performance"
  ON service_performance FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'clinic_manager')
    )
  );

CREATE POLICY "Executives and managers can manage service performance"
  ON service_performance FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'clinic_manager')
    )
  );

-- RLS Policies for service_lifecycle_events
CREATE POLICY "Executives and managers can view lifecycle events"
  ON service_lifecycle_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'clinic_manager')
    )
  );

CREATE POLICY "Executives and managers can manage lifecycle events"
  ON service_lifecycle_events FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'clinic_manager')
    )
  );

-- RLS Policies for service_dependencies
CREATE POLICY "Executives and managers can view service dependencies"
  ON service_dependencies FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'clinic_manager')
    )
  );

CREATE POLICY "Executives and managers can manage service dependencies"
  ON service_dependencies FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'clinic_manager')
    )
  );
