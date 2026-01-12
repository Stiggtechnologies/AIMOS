/*
  # Operations Engine: Staffing, Capacity, and Credentials

  ## Summary
  Comprehensive operations management system for healthcare facilities covering:
  1. Staff scheduling and shift management
  2. Capacity planning and resource utilization
  3. Credential tracking with AI-powered expiry alerts

  ## New Tables
  All tables prefixed with `ops_` for clear module separation

  ### Staffing Module
    - `ops_shifts` - Shift templates and definitions
    - `ops_staff_schedules` - Assigned shifts for staff members
    - `ops_shift_swaps` - Shift exchange requests between staff
    - `ops_time_off_requests` - PTO, sick leave, vacation requests
    - `ops_shift_coverage_needs` - Open shifts requiring coverage

  ### Capacity Module
    - `ops_treatment_rooms` - Physical treatment room inventory
    - `ops_room_bookings` - Room booking and availability
    - `ops_capacity_targets` - Target utilization by clinic and period
    - `ops_resource_allocations` - Equipment and resource assignments

  ### Credentials Module
    - `ops_credential_types` - Defines credential categories
    - `ops_credentials` - Staff credentials with expiry tracking
    - `ops_credential_verifications` - Verification audit trail
    - `ops_credential_alerts` - AI-generated expiry and risk alerts
    - `ops_adverse_actions` - License suspensions, revocations, restrictions

  ## Security
    - RLS enabled on all tables
    - Managers can view/edit their clinic data
    - Executives see all data
    - Staff can view own schedules and credentials
*/

-- =====================================================
-- ENUMS
-- =====================================================

DO $$ BEGIN
  CREATE TYPE ops_shift_type AS ENUM ('morning', 'afternoon', 'evening', 'night', 'full_day', 'on_call');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE ops_schedule_status AS ENUM ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE ops_swap_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE ops_time_off_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE ops_room_type AS ENUM ('treatment', 'assessment', 'gym', 'private', 'group', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE ops_booking_status AS ENUM ('available', 'booked', 'in_use', 'maintenance');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE ops_credential_type_enum AS ENUM (
    'professional_license',
    'board_certification',
    'cpr_certification',
    'liability_insurance',
    'malpractice_insurance',
    'npi',
    'dea',
    'education',
    'accreditation',
    'business_license',
    'facility_privileges',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE ops_credential_status AS ENUM ('active', 'expired', 'suspended', 'revoked', 'pending_renewal', 'under_review');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE ops_verification_status AS ENUM ('not_verified', 'verified', 'failed', 'pending');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE ops_alert_severity AS ENUM ('info', 'warning', 'critical', 'urgent');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE ops_adverse_action_type AS ENUM ('suspension', 'revocation', 'restriction', 'probation', 'fine', 'reprimand');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- STAFFING MODULE
-- =====================================================

CREATE TABLE IF NOT EXISTS ops_shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  shift_type ops_shift_type NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  default_capacity INTEGER DEFAULT 1,
  color TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ops_staff_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  shift_id UUID REFERENCES ops_shifts(id),
  schedule_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status ops_schedule_status DEFAULT 'scheduled',
  notes TEXT,
  assigned_by UUID REFERENCES user_profiles(id),
  confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ops_shift_swaps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_schedule_id UUID NOT NULL REFERENCES ops_staff_schedules(id) ON DELETE CASCADE,
  from_staff_id UUID NOT NULL REFERENCES staff_profiles(id),
  to_staff_id UUID REFERENCES staff_profiles(id),
  requested_by UUID NOT NULL REFERENCES user_profiles(id),
  status ops_swap_status DEFAULT 'pending',
  reason TEXT,
  approved_by UUID REFERENCES user_profiles(id),
  approved_at TIMESTAMPTZ,
  rejected_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ops_time_off_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status ops_time_off_status DEFAULT 'pending',
  reason TEXT,
  notes TEXT,
  requested_by UUID NOT NULL REFERENCES user_profiles(id),
  approved_by UUID REFERENCES user_profiles(id),
  approved_at TIMESTAMPTZ,
  rejected_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ops_shift_coverage_needs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  shift_id UUID REFERENCES ops_shifts(id),
  coverage_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  positions_needed INTEGER DEFAULT 1,
  positions_filled INTEGER DEFAULT 0,
  required_skills JSONB DEFAULT '[]',
  priority TEXT DEFAULT 'normal',
  is_filled BOOLEAN DEFAULT false,
  filled_at TIMESTAMPTZ,
  notes TEXT,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- CAPACITY MODULE
-- =====================================================

CREATE TABLE IF NOT EXISTS ops_treatment_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  room_number TEXT NOT NULL,
  room_name TEXT NOT NULL,
  room_type ops_room_type NOT NULL,
  capacity INTEGER DEFAULT 1,
  floor_number INTEGER,
  square_feet INTEGER,
  equipment JSONB DEFAULT '[]',
  amenities JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  is_accessible BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(clinic_id, room_number)
);

CREATE TABLE IF NOT EXISTS ops_room_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES ops_treatment_rooms(id) ON DELETE CASCADE,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status ops_booking_status DEFAULT 'booked',
  booked_by UUID REFERENCES user_profiles(id),
  patient_name TEXT,
  treatment_type TEXT,
  staff_assigned JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ops_capacity_targets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  target_period TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  target_utilization_rate NUMERIC(5,2) DEFAULT 85.0,
  target_patient_visits INTEGER,
  target_revenue NUMERIC(12,2),
  target_staff_hours INTEGER,
  notes TEXT,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ops_resource_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  resource_name TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  quantity_available INTEGER DEFAULT 1,
  quantity_allocated INTEGER DEFAULT 0,
  assigned_to_room UUID REFERENCES ops_treatment_rooms(id),
  assigned_to_staff UUID REFERENCES staff_profiles(id),
  allocation_date DATE,
  return_date DATE,
  condition TEXT,
  notes TEXT,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- CREDENTIALS MODULE
-- =====================================================

CREATE TABLE IF NOT EXISTS ops_credential_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type_name TEXT UNIQUE NOT NULL,
  type_enum ops_credential_type_enum NOT NULL,
  description TEXT,
  is_required BOOLEAN DEFAULT false,
  renewal_frequency_days INTEGER,
  required_for_roles JSONB DEFAULT '[]',
  verification_required BOOLEAN DEFAULT true,
  issuing_authorities JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ops_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
  credential_type_id UUID NOT NULL REFERENCES ops_credential_types(id),
  credential_number TEXT,
  issuing_authority TEXT NOT NULL,
  issue_date DATE,
  expiry_date DATE,
  renewal_date DATE,
  status ops_credential_status DEFAULT 'active',
  document_url TEXT,
  verification_status ops_verification_status DEFAULT 'not_verified',
  verified_by UUID REFERENCES user_profiles(id),
  verified_at TIMESTAMPTZ,
  scope_of_practice TEXT,
  restrictions TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ops_credential_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  credential_id UUID NOT NULL REFERENCES ops_credentials(id) ON DELETE CASCADE,
  verified_by UUID NOT NULL REFERENCES user_profiles(id),
  verification_date TIMESTAMPTZ DEFAULT now(),
  verification_method TEXT,
  verification_result ops_verification_status NOT NULL,
  verification_notes TEXT,
  document_checked BOOLEAN DEFAULT false,
  primary_source_verified BOOLEAN DEFAULT false,
  next_verification_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ops_credential_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  credential_id UUID NOT NULL REFERENCES ops_credentials(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff_profiles(id),
  alert_type TEXT NOT NULL,
  severity ops_alert_severity NOT NULL,
  risk_score INTEGER CHECK (risk_score BETWEEN 0 AND 100),
  alert_message TEXT NOT NULL,
  days_until_expiry INTEGER,
  recommended_actions JSONB DEFAULT '[]',
  is_acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID REFERENCES user_profiles(id),
  acknowledged_at TIMESTAMPTZ,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ops_adverse_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
  credential_id UUID REFERENCES ops_credentials(id),
  action_type ops_adverse_action_type NOT NULL,
  issuing_authority TEXT NOT NULL,
  action_date DATE NOT NULL,
  effective_date DATE,
  resolution_date DATE,
  status TEXT DEFAULT 'active',
  severity TEXT NOT NULL,
  description TEXT NOT NULL,
  impact_on_practice TEXT,
  corrective_actions JSONB DEFAULT '[]',
  reported_by UUID REFERENCES user_profiles(id),
  document_urls JSONB DEFAULT '[]',
  is_public BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_ops_shifts_type ON ops_shifts(shift_type);
CREATE INDEX IF NOT EXISTS idx_ops_shifts_active ON ops_shifts(is_active);

CREATE INDEX IF NOT EXISTS idx_ops_staff_schedules_staff ON ops_staff_schedules(staff_id);
CREATE INDEX IF NOT EXISTS idx_ops_staff_schedules_clinic ON ops_staff_schedules(clinic_id);
CREATE INDEX IF NOT EXISTS idx_ops_staff_schedules_date ON ops_staff_schedules(schedule_date);
CREATE INDEX IF NOT EXISTS idx_ops_staff_schedules_status ON ops_staff_schedules(status);

CREATE INDEX IF NOT EXISTS idx_ops_shift_swaps_from_staff ON ops_shift_swaps(from_staff_id);
CREATE INDEX IF NOT EXISTS idx_ops_shift_swaps_to_staff ON ops_shift_swaps(to_staff_id);
CREATE INDEX IF NOT EXISTS idx_ops_shift_swaps_status ON ops_shift_swaps(status);

CREATE INDEX IF NOT EXISTS idx_ops_time_off_staff ON ops_time_off_requests(staff_id);
CREATE INDEX IF NOT EXISTS idx_ops_time_off_status ON ops_time_off_requests(status);
CREATE INDEX IF NOT EXISTS idx_ops_time_off_dates ON ops_time_off_requests(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_ops_coverage_needs_clinic ON ops_shift_coverage_needs(clinic_id);
CREATE INDEX IF NOT EXISTS idx_ops_coverage_needs_date ON ops_shift_coverage_needs(coverage_date);
CREATE INDEX IF NOT EXISTS idx_ops_coverage_needs_filled ON ops_shift_coverage_needs(is_filled);

CREATE INDEX IF NOT EXISTS idx_ops_treatment_rooms_clinic ON ops_treatment_rooms(clinic_id);
CREATE INDEX IF NOT EXISTS idx_ops_treatment_rooms_type ON ops_treatment_rooms(room_type);
CREATE INDEX IF NOT EXISTS idx_ops_treatment_rooms_active ON ops_treatment_rooms(is_active);

CREATE INDEX IF NOT EXISTS idx_ops_room_bookings_room ON ops_room_bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_ops_room_bookings_date ON ops_room_bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_ops_room_bookings_status ON ops_room_bookings(status);

CREATE INDEX IF NOT EXISTS idx_ops_capacity_targets_clinic ON ops_capacity_targets(clinic_id);
CREATE INDEX IF NOT EXISTS idx_ops_capacity_targets_period ON ops_capacity_targets(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_ops_resource_allocations_clinic ON ops_resource_allocations(clinic_id);
CREATE INDEX IF NOT EXISTS idx_ops_resource_allocations_room ON ops_resource_allocations(assigned_to_room);
CREATE INDEX IF NOT EXISTS idx_ops_resource_allocations_staff ON ops_resource_allocations(assigned_to_staff);

CREATE INDEX IF NOT EXISTS idx_ops_credential_types_enum ON ops_credential_types(type_enum);
CREATE INDEX IF NOT EXISTS idx_ops_credential_types_active ON ops_credential_types(is_active);

CREATE INDEX IF NOT EXISTS idx_ops_credentials_staff ON ops_credentials(staff_id);
CREATE INDEX IF NOT EXISTS idx_ops_credentials_type ON ops_credentials(credential_type_id);
CREATE INDEX IF NOT EXISTS idx_ops_credentials_status ON ops_credentials(status);
CREATE INDEX IF NOT EXISTS idx_ops_credentials_expiry ON ops_credentials(expiry_date);
CREATE INDEX IF NOT EXISTS idx_ops_credentials_verification ON ops_credentials(verification_status);

CREATE INDEX IF NOT EXISTS idx_ops_credential_verifications_credential ON ops_credential_verifications(credential_id);
CREATE INDEX IF NOT EXISTS idx_ops_credential_verifications_date ON ops_credential_verifications(verification_date);

CREATE INDEX IF NOT EXISTS idx_ops_credential_alerts_credential ON ops_credential_alerts(credential_id);
CREATE INDEX IF NOT EXISTS idx_ops_credential_alerts_staff ON ops_credential_alerts(staff_id);
CREATE INDEX IF NOT EXISTS idx_ops_credential_alerts_severity ON ops_credential_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_ops_credential_alerts_resolved ON ops_credential_alerts(resolved);

CREATE INDEX IF NOT EXISTS idx_ops_adverse_actions_staff ON ops_adverse_actions(staff_id);
CREATE INDEX IF NOT EXISTS idx_ops_adverse_actions_credential ON ops_adverse_actions(credential_id);
CREATE INDEX IF NOT EXISTS idx_ops_adverse_actions_status ON ops_adverse_actions(status);
CREATE INDEX IF NOT EXISTS idx_ops_adverse_actions_date ON ops_adverse_actions(action_date);

-- =====================================================
-- TRIGGERS
-- =====================================================

DO $$
BEGIN
  DROP TRIGGER IF EXISTS ops_shifts_updated_at ON ops_shifts;
  CREATE TRIGGER ops_shifts_updated_at BEFORE UPDATE ON ops_shifts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  DROP TRIGGER IF EXISTS ops_staff_schedules_updated_at ON ops_staff_schedules;
  CREATE TRIGGER ops_staff_schedules_updated_at BEFORE UPDATE ON ops_staff_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  DROP TRIGGER IF EXISTS ops_shift_swaps_updated_at ON ops_shift_swaps;
  CREATE TRIGGER ops_shift_swaps_updated_at BEFORE UPDATE ON ops_shift_swaps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  DROP TRIGGER IF EXISTS ops_time_off_requests_updated_at ON ops_time_off_requests;
  CREATE TRIGGER ops_time_off_requests_updated_at BEFORE UPDATE ON ops_time_off_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  DROP TRIGGER IF EXISTS ops_shift_coverage_needs_updated_at ON ops_shift_coverage_needs;
  CREATE TRIGGER ops_shift_coverage_needs_updated_at BEFORE UPDATE ON ops_shift_coverage_needs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  DROP TRIGGER IF EXISTS ops_treatment_rooms_updated_at ON ops_treatment_rooms;
  CREATE TRIGGER ops_treatment_rooms_updated_at BEFORE UPDATE ON ops_treatment_rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  DROP TRIGGER IF EXISTS ops_room_bookings_updated_at ON ops_room_bookings;
  CREATE TRIGGER ops_room_bookings_updated_at BEFORE UPDATE ON ops_room_bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  DROP TRIGGER IF EXISTS ops_capacity_targets_updated_at ON ops_capacity_targets;
  CREATE TRIGGER ops_capacity_targets_updated_at BEFORE UPDATE ON ops_capacity_targets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  DROP TRIGGER IF EXISTS ops_resource_allocations_updated_at ON ops_resource_allocations;
  CREATE TRIGGER ops_resource_allocations_updated_at BEFORE UPDATE ON ops_resource_allocations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  DROP TRIGGER IF EXISTS ops_credential_types_updated_at ON ops_credential_types;
  CREATE TRIGGER ops_credential_types_updated_at BEFORE UPDATE ON ops_credential_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  DROP TRIGGER IF EXISTS ops_credentials_updated_at ON ops_credentials;
  CREATE TRIGGER ops_credentials_updated_at BEFORE UPDATE ON ops_credentials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  DROP TRIGGER IF EXISTS ops_credential_alerts_updated_at ON ops_credential_alerts;
  CREATE TRIGGER ops_credential_alerts_updated_at BEFORE UPDATE ON ops_credential_alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  DROP TRIGGER IF EXISTS ops_adverse_actions_updated_at ON ops_adverse_actions;
  CREATE TRIGGER ops_adverse_actions_updated_at BEFORE UPDATE ON ops_adverse_actions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE ops_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_staff_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_shift_swaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_time_off_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_shift_coverage_needs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_treatment_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_room_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_capacity_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_resource_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_credential_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_credential_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_credential_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_adverse_actions ENABLE ROW LEVEL SECURITY;

-- Shifts: Everyone can view active shifts
CREATE POLICY "Users can view active shifts"
  ON ops_shifts FOR SELECT
  USING (is_active = true);

CREATE POLICY "Managers can manage shifts"
  ON ops_shifts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('executive', 'admin', 'clinic_manager')
    )
  );

-- Staff Schedules: Staff can view own schedules, managers can view/manage clinic schedules
CREATE POLICY "Staff can view own schedules"
  ON ops_staff_schedules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles
      WHERE staff_profiles.id = ops_staff_schedules.staff_id
      AND staff_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can view clinic schedules"
  ON ops_staff_schedules FOR SELECT
  USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_access WHERE user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('executive', 'admin')
    )
  );

CREATE POLICY "Managers can manage clinic schedules"
  ON ops_staff_schedules FOR ALL
  USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_access WHERE user_id = auth.uid() AND can_manage = true
    ) OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('executive', 'admin')
    )
  );

-- Shift Swaps: Staff can view own swap requests, managers can view/approve
CREATE POLICY "Staff can view own swap requests"
  ON ops_shift_swaps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles
      WHERE (staff_profiles.id = ops_shift_swaps.from_staff_id OR staff_profiles.id = ops_shift_swaps.to_staff_id)
      AND staff_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can create swap requests"
  ON ops_shift_swaps FOR INSERT
  WITH CHECK (requested_by = auth.uid());

CREATE POLICY "Managers can approve swap requests"
  ON ops_shift_swaps FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('executive', 'admin', 'clinic_manager')
    )
  );

-- Time Off Requests: Staff can view/create own requests, managers can approve
CREATE POLICY "Staff can view own time off requests"
  ON ops_time_off_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles
      WHERE staff_profiles.id = ops_time_off_requests.staff_id
      AND staff_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can create time off requests"
  ON ops_time_off_requests FOR INSERT
  WITH CHECK (requested_by = auth.uid());

CREATE POLICY "Managers can view/approve time off requests"
  ON ops_time_off_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('executive', 'admin', 'clinic_manager')
    )
  );

-- Shift Coverage Needs: Managers can manage, staff can view
CREATE POLICY "Staff can view coverage needs"
  ON ops_shift_coverage_needs FOR SELECT
  USING (true);

CREATE POLICY "Managers can manage coverage needs"
  ON ops_shift_coverage_needs FOR ALL
  USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_access WHERE user_id = auth.uid() AND can_manage = true
    ) OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('executive', 'admin')
    )
  );

-- Treatment Rooms: Everyone can view, managers can manage
CREATE POLICY "Users can view treatment rooms"
  ON ops_treatment_rooms FOR SELECT
  USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_access WHERE user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('executive', 'admin')
    )
  );

CREATE POLICY "Managers can manage treatment rooms"
  ON ops_treatment_rooms FOR ALL
  USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_access WHERE user_id = auth.uid() AND can_manage = true
    ) OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('executive', 'admin')
    )
  );

-- Room Bookings: Staff can view, managers can manage
CREATE POLICY "Users can view room bookings"
  ON ops_room_bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ops_treatment_rooms
      WHERE ops_treatment_rooms.id = ops_room_bookings.room_id
      AND (
        ops_treatment_rooms.clinic_id IN (
          SELECT clinic_id FROM clinic_access WHERE user_id = auth.uid()
        ) OR EXISTS (
          SELECT 1 FROM user_profiles
          WHERE id = auth.uid() AND role IN ('executive', 'admin')
        )
      )
    )
  );

CREATE POLICY "Managers can manage room bookings"
  ON ops_room_bookings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM ops_treatment_rooms
      WHERE ops_treatment_rooms.id = ops_room_bookings.room_id
      AND (
        ops_treatment_rooms.clinic_id IN (
          SELECT clinic_id FROM clinic_access WHERE user_id = auth.uid() AND can_manage = true
        ) OR EXISTS (
          SELECT 1 FROM user_profiles
          WHERE id = auth.uid() AND role IN ('executive', 'admin')
        )
      )
    )
  );

-- Capacity Targets: Managers can view/manage
CREATE POLICY "Managers can view capacity targets"
  ON ops_capacity_targets FOR SELECT
  USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_access WHERE user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('executive', 'admin')
    )
  );

CREATE POLICY "Managers can manage capacity targets"
  ON ops_capacity_targets FOR ALL
  USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_access WHERE user_id = auth.uid() AND can_manage = true
    ) OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('executive', 'admin')
    )
  );

-- Resource Allocations: Staff can view, managers can manage
CREATE POLICY "Users can view resource allocations"
  ON ops_resource_allocations FOR SELECT
  USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_access WHERE user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('executive', 'admin')
    )
  );

CREATE POLICY "Managers can manage resource allocations"
  ON ops_resource_allocations FOR ALL
  USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_access WHERE user_id = auth.uid() AND can_manage = true
    ) OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('executive', 'admin')
    )
  );

-- Credential Types: Everyone can view active types
CREATE POLICY "Users can view credential types"
  ON ops_credential_types FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage credential types"
  ON ops_credential_types FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('executive', 'admin')
    )
  );

-- Credentials: Staff can view own, managers can view/manage
CREATE POLICY "Staff can view own credentials"
  ON ops_credentials FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles
      WHERE staff_profiles.id = ops_credentials.staff_id
      AND staff_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can view all credentials"
  ON ops_credentials FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('executive', 'admin', 'clinic_manager')
    )
  );

CREATE POLICY "Managers can manage credentials"
  ON ops_credentials FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('executive', 'admin', 'clinic_manager')
    )
  );

-- Credential Verifications: Managers only
CREATE POLICY "Managers can view credential verifications"
  ON ops_credential_verifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('executive', 'admin', 'clinic_manager')
    )
  );

CREATE POLICY "Managers can create credential verifications"
  ON ops_credential_verifications FOR INSERT
  WITH CHECK (
    verified_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('executive', 'admin', 'clinic_manager')
    )
  );

-- Credential Alerts: Staff can view own, managers can view/manage
CREATE POLICY "Staff can view own credential alerts"
  ON ops_credential_alerts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles
      WHERE staff_profiles.id = ops_credential_alerts.staff_id
      AND staff_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can view all credential alerts"
  ON ops_credential_alerts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('executive', 'admin', 'clinic_manager')
    )
  );

CREATE POLICY "Staff can acknowledge own alerts"
  ON ops_credential_alerts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles
      WHERE staff_profiles.id = ops_credential_alerts.staff_id
      AND staff_profiles.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_profiles
      WHERE staff_profiles.id = ops_credential_alerts.staff_id
      AND staff_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can manage credential alerts"
  ON ops_credential_alerts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('executive', 'admin', 'clinic_manager')
    )
  );

-- Adverse Actions: Staff can view own, managers can view/manage
CREATE POLICY "Staff can view own adverse actions"
  ON ops_adverse_actions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles
      WHERE staff_profiles.id = ops_adverse_actions.staff_id
      AND staff_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can view all adverse actions"
  ON ops_adverse_actions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('executive', 'admin', 'clinic_manager')
    )
  );

CREATE POLICY "Managers can manage adverse actions"
  ON ops_adverse_actions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('executive', 'admin', 'clinic_manager')
    )
  );
