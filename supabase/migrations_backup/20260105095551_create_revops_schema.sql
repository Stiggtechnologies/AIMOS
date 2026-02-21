/*
  # Revenue Operations (RevOps) Schema

  ## Purpose
  Complete revenue pipeline tracking from marketing through revenue realization
  with bottleneck detection and capacity planning

  ## New Tables Created
  
  1. **revops_pipeline_metrics**
     - Weekly/monthly pipeline snapshots
     - Marketing leads → Intake → Scheduled → Completed → Revenue
     - Conversion rates at each stage
     - Time-in-stage tracking
  
  2. **revops_capacity_metrics**
     - Clinician capacity and utilization
     - Available hours vs booked hours
     - Revenue per clinician hour
     - Capacity constraints by clinic
  
  3. **revops_bottlenecks**
     - Automatic bottleneck detection
     - Impact assessment (lost revenue, delayed appointments)
     - Recommended actions
  
  4. **revops_clinician_productivity**
     - Individual clinician performance
     - Revenue generated per hour
     - Utilization rates
     - Patient satisfaction scores
  
  5. **revops_growth_alerts**
     - Capacity-constrained growth warnings
     - Demand vs capacity mismatches
     - Hiring recommendations

  ## Security
  - RLS enabled on all tables
  - Executive and Clinic Manager access only
*/

-- Pipeline Metrics (Marketing → Revenue Flow)
CREATE TABLE IF NOT EXISTS revops_pipeline_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  
  -- Time Period
  period_start date NOT NULL,
  period_end date NOT NULL,
  period_type text NOT NULL CHECK (period_type IN ('week', 'month', 'quarter')),
  
  -- Stage 1: Marketing & Lead Generation
  marketing_leads integer DEFAULT 0,
  marketing_spend numeric(12,2) DEFAULT 0.00,
  cost_per_lead numeric(10,2) DEFAULT 0.00,
  
  -- Stage 2: Intake
  intake_received integer DEFAULT 0,
  intake_qualified integer DEFAULT 0,
  intake_conversion_rate numeric(5,2) DEFAULT 0.00,
  avg_intake_to_schedule_hours numeric(8,2) DEFAULT 0.00,
  
  -- Stage 3: Scheduling
  appointments_scheduled integer DEFAULT 0,
  schedule_conversion_rate numeric(5,2) DEFAULT 0.00,
  avg_schedule_to_first_visit_days numeric(6,2) DEFAULT 0.00,
  
  -- Stage 4: Completion
  appointments_completed integer DEFAULT 0,
  completion_rate numeric(5,2) DEFAULT 0.00,
  no_show_rate numeric(5,2) DEFAULT 0.00,
  
  -- Stage 5: Revenue
  total_revenue numeric(12,2) DEFAULT 0.00,
  revenue_per_appointment numeric(10,2) DEFAULT 0.00,
  revenue_per_lead numeric(10,2) DEFAULT 0.00,
  
  -- Overall Metrics
  overall_conversion_rate numeric(5,2) DEFAULT 0.00, -- Leads to revenue
  marketing_roi numeric(6,2) DEFAULT 0.00,
  
  -- Bottleneck Indicators
  primary_bottleneck text, -- Which stage is limiting throughput
  bottleneck_severity text CHECK (bottleneck_severity IN ('none', 'minor', 'moderate', 'severe')),
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Capacity Metrics (Clinician Availability & Utilization)
CREATE TABLE IF NOT EXISTS revops_capacity_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  
  -- Time Period
  period_start date NOT NULL,
  period_end date NOT NULL,
  
  -- Capacity Supply
  total_clinicians integer NOT NULL,
  active_clinicians integer NOT NULL,
  total_available_hours numeric(10,2) NOT NULL,
  
  -- Capacity Utilization
  booked_hours numeric(10,2) DEFAULT 0.00,
  completed_hours numeric(10,2) DEFAULT 0.00,
  utilization_rate numeric(5,2) DEFAULT 0.00, -- Booked / Available
  efficiency_rate numeric(5,2) DEFAULT 0.00, -- Completed / Booked
  
  -- Revenue Metrics
  total_revenue numeric(12,2) DEFAULT 0.00,
  revenue_per_hour numeric(10,2) DEFAULT 0.00,
  revenue_per_clinician numeric(12,2) DEFAULT 0.00,
  
  -- Capacity Constraints
  hours_at_capacity numeric(10,2) DEFAULT 0.00, -- Hours when at >90% utilization
  constrained_demand integer DEFAULT 0, -- Appointments that couldn't be scheduled
  estimated_lost_revenue numeric(12,2) DEFAULT 0.00,
  
  -- Growth Indicators
  demand_growth_rate numeric(5,2) DEFAULT 0.00,
  capacity_growth_rate numeric(5,2) DEFAULT 0.00,
  capacity_gap numeric(8,2) DEFAULT 0.00, -- Negative = shortage
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Bottleneck Detection & Analysis
CREATE TABLE IF NOT EXISTS revops_bottlenecks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  
  -- Bottleneck Details
  bottleneck_stage text NOT NULL CHECK (bottleneck_stage IN ('marketing', 'intake', 'scheduling', 'capacity', 'completion', 'billing')),
  severity text NOT NULL CHECK (severity IN ('minor', 'moderate', 'severe', 'critical')),
  
  -- Impact Assessment
  appointments_delayed integer DEFAULT 0,
  appointments_lost integer DEFAULT 0,
  revenue_delayed numeric(12,2) DEFAULT 0.00,
  revenue_lost numeric(12,2) DEFAULT 0.00,
  
  -- Root Cause
  root_cause text NOT NULL,
  contributing_factors text[],
  
  -- Metrics
  current_throughput integer,
  optimal_throughput integer,
  throughput_gap_percentage numeric(5,2),
  
  -- Recommendations
  recommended_actions text[],
  estimated_resolution_time text, -- e.g., "2 weeks", "1 month"
  estimated_impact_if_resolved numeric(12,2), -- Revenue gain
  
  -- Status
  status text DEFAULT 'active' CHECK (status IN ('active', 'monitoring', 'resolved', 'accepted')),
  detected_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  
  -- Assignment
  assigned_to uuid REFERENCES user_profiles(id),
  priority integer DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  
  -- Metadata
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Clinician Productivity Tracking
CREATE TABLE IF NOT EXISTS revops_clinician_productivity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinician_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  
  -- Time Period
  period_start date NOT NULL,
  period_end date NOT NULL,
  
  -- Time Metrics
  scheduled_hours numeric(8,2) DEFAULT 0.00,
  worked_hours numeric(8,2) DEFAULT 0.00,
  productive_hours numeric(8,2) DEFAULT 0.00, -- Direct patient care
  
  -- Volume Metrics
  patients_seen integer DEFAULT 0,
  appointments_completed integer DEFAULT 0,
  treatments_delivered integer DEFAULT 0,
  
  -- Revenue Metrics
  total_revenue numeric(12,2) DEFAULT 0.00,
  revenue_per_hour numeric(10,2) DEFAULT 0.00,
  revenue_per_patient numeric(10,2) DEFAULT 0.00,
  
  -- Efficiency Metrics
  utilization_rate numeric(5,2) DEFAULT 0.00,
  productivity_rate numeric(5,2) DEFAULT 0.00,
  avg_appointment_duration numeric(6,2) DEFAULT 0.00,
  
  -- Quality Metrics
  patient_satisfaction_score numeric(4,2), -- Out of 5.00
  treatment_completion_rate numeric(5,2) DEFAULT 0.00,
  rebooking_rate numeric(5,2) DEFAULT 0.00,
  
  -- Performance Tier
  performance_tier text CHECK (performance_tier IN ('top_performer', 'above_average', 'average', 'below_average', 'needs_improvement')),
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Growth Alerts (Capacity Constraints)
CREATE TABLE IF NOT EXISTS revops_growth_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  
  -- Alert Details
  alert_type text NOT NULL CHECK (alert_type IN ('capacity_shortage', 'demand_spike', 'utilization_ceiling', 'revenue_plateau', 'staffing_gap')),
  severity text NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  
  -- Impact
  current_demand integer,
  current_capacity integer,
  gap_percentage numeric(5,2),
  
  -- Financial Impact
  potential_revenue_loss numeric(12,2),
  revenue_opportunity numeric(12,2),
  
  -- Forecast
  forecast_horizon text, -- e.g., "4 weeks", "2 months"
  projected_gap_if_unaddressed integer,
  
  -- Recommendations
  recommended_action text NOT NULL,
  action_details jsonb, -- e.g., {"hire_clinicians": 2, "expand_hours": 20}
  estimated_cost numeric(12,2),
  estimated_revenue_gain numeric(12,2),
  roi_percentage numeric(6,2),
  
  -- Status
  status text DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'action_taken', 'dismissed')),
  acknowledged_by uuid REFERENCES user_profiles(id),
  acknowledged_at timestamptz,
  
  -- Metadata
  triggered_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_pipeline_metrics_clinic_period ON revops_pipeline_metrics(clinic_id, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_pipeline_metrics_bottleneck ON revops_pipeline_metrics(primary_bottleneck) WHERE primary_bottleneck IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_capacity_metrics_clinic_period ON revops_capacity_metrics(clinic_id, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_capacity_metrics_utilization ON revops_capacity_metrics(utilization_rate DESC);

CREATE INDEX IF NOT EXISTS idx_bottlenecks_clinic_status ON revops_bottlenecks(clinic_id, status);
CREATE INDEX IF NOT EXISTS idx_bottlenecks_severity ON revops_bottlenecks(severity, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_bottlenecks_assigned ON revops_bottlenecks(assigned_to) WHERE assigned_to IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_clinician_productivity_clinician ON revops_clinician_productivity(clinician_id, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_clinician_productivity_clinic ON revops_clinician_productivity(clinic_id, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_clinician_productivity_tier ON revops_clinician_productivity(performance_tier);

CREATE INDEX IF NOT EXISTS idx_growth_alerts_clinic_status ON revops_growth_alerts(clinic_id, status);
CREATE INDEX IF NOT EXISTS idx_growth_alerts_severity ON revops_growth_alerts(severity, triggered_at DESC);

-- Enable RLS
ALTER TABLE revops_pipeline_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE revops_capacity_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE revops_bottlenecks ENABLE ROW LEVEL SECURITY;
ALTER TABLE revops_clinician_productivity ENABLE ROW LEVEL SECURITY;
ALTER TABLE revops_growth_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Executives and Clinic Managers Only
CREATE POLICY "Executives and clinic managers can view pipeline metrics"
  ON revops_pipeline_metrics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'executive', 'clinic_manager')
    )
  );

CREATE POLICY "Executives and clinic managers can manage pipeline metrics"
  ON revops_pipeline_metrics FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'executive', 'clinic_manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'executive', 'clinic_manager')
    )
  );

CREATE POLICY "Executives and clinic managers can view capacity metrics"
  ON revops_capacity_metrics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'executive', 'clinic_manager')
    )
  );

CREATE POLICY "Executives and clinic managers can manage capacity metrics"
  ON revops_capacity_metrics FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'executive', 'clinic_manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'executive', 'clinic_manager')
    )
  );

CREATE POLICY "Executives and clinic managers can view bottlenecks"
  ON revops_bottlenecks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'executive', 'clinic_manager')
    )
  );

CREATE POLICY "Executives and clinic managers can manage bottlenecks"
  ON revops_bottlenecks FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'executive', 'clinic_manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'executive', 'clinic_manager')
    )
  );

CREATE POLICY "Executives and clinic managers can view clinician productivity"
  ON revops_clinician_productivity FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'executive', 'clinic_manager')
    )
  );

CREATE POLICY "Executives and clinic managers can manage clinician productivity"
  ON revops_clinician_productivity FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'executive', 'clinic_manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'executive', 'clinic_manager')
    )
  );

CREATE POLICY "Executives and clinic managers can view growth alerts"
  ON revops_growth_alerts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'executive', 'clinic_manager')
    )
  );

CREATE POLICY "Executives and clinic managers can manage growth alerts"
  ON revops_growth_alerts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'executive', 'clinic_manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'executive', 'clinic_manager')
    )
  );
