/*
  # Technology & Vendor Risk Management Schema

  ## Purpose
  Prevent operational failures through comprehensive vendor risk tracking.
  Clinics fail operationally through vendors, not staff.

  ## Tables Created
  - vendors (if not exists)
  - vendor_criticality
  - vendor_risk_assessments
  - vendor_dependencies
  
  ## Tables Updated
  - vendor_contracts (add missing columns)
  - vendor_incidents (add missing columns)

  ## Security
  - RLS enabled on all tables
  - Executives and clinic managers only
*/

-- Vendors Table
CREATE TABLE IF NOT EXISTS vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_name text NOT NULL,
  vendor_type text NOT NULL,
  primary_contact_name text,
  primary_contact_email text,
  primary_contact_phone text,
  website text,
  status text NOT NULL DEFAULT 'active',
  onboarding_date date,
  last_review_date date,
  next_review_date date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendors_status ON vendors(status);
CREATE INDEX IF NOT EXISTS idx_vendors_type ON vendors(vendor_type);
CREATE INDEX IF NOT EXISTS idx_vendors_name ON vendors(vendor_name);

-- Add missing columns to vendor_contracts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendor_contracts' AND column_name = 'clinic_id'
  ) THEN
    ALTER TABLE vendor_contracts ADD COLUMN clinic_id uuid;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendor_contracts' AND column_name = 'contract_type'
  ) THEN
    ALTER TABLE vendor_contracts ADD COLUMN contract_type text DEFAULT 'service_agreement';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendor_contracts' AND column_name = 'contract_status'
  ) THEN
    ALTER TABLE vendor_contracts ADD COLUMN contract_status text DEFAULT 'active';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendor_contracts' AND column_name = 'key_terms'
  ) THEN
    ALTER TABLE vendor_contracts ADD COLUMN key_terms text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendor_contracts' AND column_name = 'document_url'
  ) THEN
    ALTER TABLE vendor_contracts ADD COLUMN document_url text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendor_contracts' AND column_name = 'payment_frequency'
  ) THEN
    ALTER TABLE vendor_contracts ADD COLUMN payment_frequency text DEFAULT 'annual';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendor_contracts' AND column_name = 'renewal_notice_days'
  ) THEN
    ALTER TABLE vendor_contracts ADD COLUMN renewal_notice_days integer DEFAULT 90;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendor_contracts' AND column_name = 'termination_notice_days'
  ) THEN
    ALTER TABLE vendor_contracts ADD COLUMN termination_notice_days integer DEFAULT 30;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_vendor_contracts_clinic ON vendor_contracts(clinic_id);
CREATE INDEX IF NOT EXISTS idx_vendor_contracts_status ON vendor_contracts(contract_status);

-- Add missing columns to vendor_incidents
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendor_incidents' AND column_name = 'clinic_id'
  ) THEN
    ALTER TABLE vendor_incidents ADD COLUMN clinic_id uuid;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendor_incidents' AND column_name = 'incident_type'
  ) THEN
    ALTER TABLE vendor_incidents ADD COLUMN incident_type text DEFAULT 'other';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendor_incidents' AND column_name = 'description'
  ) THEN
    ALTER TABLE vendor_incidents ADD COLUMN description text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendor_incidents' AND column_name = 'business_impact'
  ) THEN
    ALTER TABLE vendor_incidents ADD COLUMN business_impact text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendor_incidents' AND column_name = 'downtime_minutes'
  ) THEN
    ALTER TABLE vendor_incidents ADD COLUMN downtime_minutes integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendor_incidents' AND column_name = 'patients_affected'
  ) THEN
    ALTER TABLE vendor_incidents ADD COLUMN patients_affected integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendor_incidents' AND column_name = 'revenue_impact'
  ) THEN
    ALTER TABLE vendor_incidents ADD COLUMN revenue_impact numeric DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendor_incidents' AND column_name = 'vendor_response_time_minutes'
  ) THEN
    ALTER TABLE vendor_incidents ADD COLUMN vendor_response_time_minutes integer;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendor_incidents' AND column_name = 'preventive_actions'
  ) THEN
    ALTER TABLE vendor_incidents ADD COLUMN preventive_actions text[];
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_vendor_incidents_clinic ON vendor_incidents(clinic_id);

-- Vendor Criticality Table
CREATE TABLE IF NOT EXISTS vendor_criticality (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  clinic_id uuid,
  criticality_level text NOT NULL,
  business_impact_if_down text,
  affected_departments text[],
  affected_services text[],
  patient_impact text,
  revenue_impact_per_day numeric DEFAULT 0,
  is_single_point_of_failure boolean DEFAULT false,
  backup_vendor_exists boolean DEFAULT false,
  backup_vendor_id uuid REFERENCES vendors(id),
  failover_plan_exists boolean DEFAULT false,
  last_tested_date date,
  assessment_date date NOT NULL,
  assessment_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendor_criticality_vendor ON vendor_criticality(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_criticality_clinic ON vendor_criticality(clinic_id);
CREATE INDEX IF NOT EXISTS idx_vendor_criticality_level ON vendor_criticality(criticality_level);
CREATE INDEX IF NOT EXISTS idx_vendor_criticality_spof ON vendor_criticality(is_single_point_of_failure);

-- Vendor Risk Assessments Table
CREATE TABLE IF NOT EXISTS vendor_risk_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  assessment_date date NOT NULL,
  assessed_by_user_id uuid,
  overall_risk_score integer DEFAULT 0,
  financial_stability_score integer DEFAULT 0,
  security_compliance_score integer DEFAULT 0,
  performance_reliability_score integer DEFAULT 0,
  support_responsiveness_score integer DEFAULT 0,
  data_privacy_compliance boolean DEFAULT false,
  hipaa_compliant boolean DEFAULT false,
  soc2_certified boolean DEFAULT false,
  insurance_verified boolean DEFAULT false,
  background_check_completed boolean DEFAULT false,
  key_risks_identified text[],
  mitigation_actions text[],
  next_assessment_due date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendor_risk_assessments_vendor ON vendor_risk_assessments(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_risk_assessments_date ON vendor_risk_assessments(assessment_date);
CREATE INDEX IF NOT EXISTS idx_vendor_risk_assessments_score ON vendor_risk_assessments(overall_risk_score);

-- Vendor Dependencies Table
CREATE TABLE IF NOT EXISTS vendor_dependencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  depends_on_vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  dependency_type text NOT NULL,
  is_critical_path boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendor_dependencies_vendor ON vendor_dependencies(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_dependencies_depends_on ON vendor_dependencies(depends_on_vendor_id);

-- Enable RLS
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_criticality ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_dependencies ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Executives and clinic managers can view vendors" ON vendors;
DROP POLICY IF EXISTS "Executives and clinic managers can manage vendors" ON vendors;
DROP POLICY IF EXISTS "Executives and clinic managers can view vendor contracts" ON vendor_contracts;
DROP POLICY IF EXISTS "Executives and clinic managers can manage vendor contracts" ON vendor_contracts;
DROP POLICY IF EXISTS "Executives and clinic managers can view vendor criticality" ON vendor_criticality;
DROP POLICY IF EXISTS "Executives and clinic managers can manage vendor criticality" ON vendor_criticality;
DROP POLICY IF EXISTS "Executives and clinic managers can view vendor risk assessments" ON vendor_risk_assessments;
DROP POLICY IF EXISTS "Executives and clinic managers can manage vendor risk assessments" ON vendor_risk_assessments;
DROP POLICY IF EXISTS "Executives and clinic managers can view vendor incidents" ON vendor_incidents;
DROP POLICY IF EXISTS "Executives and clinic managers can manage vendor incidents" ON vendor_incidents;
DROP POLICY IF EXISTS "Executives and clinic managers can view vendor dependencies" ON vendor_dependencies;
DROP POLICY IF EXISTS "Executives and clinic managers can manage vendor dependencies" ON vendor_dependencies;

-- RLS Policies for vendors
CREATE POLICY "Executives and clinic managers can view vendors"
  ON vendors FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'clinic_manager')
    )
  );

CREATE POLICY "Executives and clinic managers can manage vendors"
  ON vendors FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'clinic_manager')
    )
  );

-- RLS Policies for vendor_contracts
CREATE POLICY "Executives and clinic managers can view vendor contracts"
  ON vendor_contracts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'clinic_manager')
    )
  );

CREATE POLICY "Executives and clinic managers can manage vendor contracts"
  ON vendor_contracts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'clinic_manager')
    )
  );

-- RLS Policies for vendor_criticality
CREATE POLICY "Executives and clinic managers can view vendor criticality"
  ON vendor_criticality FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'clinic_manager')
    )
  );

CREATE POLICY "Executives and clinic managers can manage vendor criticality"
  ON vendor_criticality FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'clinic_manager')
    )
  );

-- RLS Policies for vendor_risk_assessments
CREATE POLICY "Executives and clinic managers can view vendor risk assessments"
  ON vendor_risk_assessments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'clinic_manager')
    )
  );

CREATE POLICY "Executives and clinic managers can manage vendor risk assessments"
  ON vendor_risk_assessments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'clinic_manager')
    )
  );

-- RLS Policies for vendor_incidents
CREATE POLICY "Executives and clinic managers can view vendor incidents"
  ON vendor_incidents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'clinic_manager')
    )
  );

CREATE POLICY "Executives and clinic managers can manage vendor incidents"
  ON vendor_incidents FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'clinic_manager')
    )
  );

-- RLS Policies for vendor_dependencies
CREATE POLICY "Executives and clinic managers can view vendor dependencies"
  ON vendor_dependencies FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'clinic_manager')
    )
  );

CREATE POLICY "Executives and clinic managers can manage vendor dependencies"
  ON vendor_dependencies FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'clinic_manager')
    )
  );
