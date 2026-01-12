/*
  # Fix Critical Partner Clinic Gaps

  1. Add partner_read_only role to user_role enum
  2. Create partner scheduling rules table
  3. Add access tracking to support gym/court supervision

  Addresses:
  - STEP 6: Scheduling & Access Rules
  - STEP 9: Partner Read-Only Role
*/

-- Add partner_read_only to user_role enum if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'partner_read_only' 
    AND enumtypid = 'user_role'::regtype
  ) THEN
    ALTER TYPE user_role ADD VALUE 'partner_read_only';
  END IF;
END $$;

-- Partner scheduling rules table
CREATE TABLE IF NOT EXISTS partner_scheduling_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_clinic_id uuid NOT NULL REFERENCES partner_clinics(id) ON DELETE CASCADE,
  
  -- Day and time configuration
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  open_time time NOT NULL,
  close_time time NOT NULL,
  
  -- Appointment configuration
  appointment_slot_duration interval DEFAULT '30 minutes',
  slots_per_hour integer DEFAULT 2,
  max_concurrent_appointments integer DEFAULT 1,
  
  -- Access rules
  allow_gym_access boolean DEFAULT true,
  allow_court_access boolean DEFAULT false,
  supervised_only boolean DEFAULT true,
  
  -- Special notes
  notes text,
  is_active boolean DEFAULT true,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(partner_clinic_id, day_of_week)
);

-- Partner facility access log
CREATE TABLE IF NOT EXISTS partner_facility_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_clinic_id uuid NOT NULL REFERENCES partner_clinics(id) ON DELETE CASCADE,
  patient_id uuid,
  
  -- Visit details
  visit_date date NOT NULL,
  check_in_time timestamptz,
  check_out_time timestamptz,
  
  -- Access granted
  gym_access_granted boolean DEFAULT false,
  court_access_granted boolean DEFAULT false,
  supervised_session boolean DEFAULT true,
  
  -- Supervision
  supervising_clinician_id uuid REFERENCES auth.users(id),
  supervision_notes text,
  
  -- Session details
  session_type text,
  programs_used text[],
  
  metadata jsonb DEFAULT '{}'::jsonb,
  
  created_at timestamptz DEFAULT now()
);

-- Add scheduling metadata to partner clinics
ALTER TABLE partner_clinics 
ADD COLUMN IF NOT EXISTS scheduling_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS default_appointment_duration interval DEFAULT '30 minutes';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_partner_scheduling_rules_clinic 
  ON partner_scheduling_rules(partner_clinic_id);
CREATE INDEX IF NOT EXISTS idx_partner_scheduling_rules_day 
  ON partner_scheduling_rules(day_of_week);

CREATE INDEX IF NOT EXISTS idx_partner_facility_access_clinic 
  ON partner_facility_access_log(partner_clinic_id);
CREATE INDEX IF NOT EXISTS idx_partner_facility_access_date 
  ON partner_facility_access_log(visit_date);
CREATE INDEX IF NOT EXISTS idx_partner_facility_access_patient 
  ON partner_facility_access_log(patient_id);

-- Enable RLS
ALTER TABLE partner_scheduling_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_facility_access_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for partner_scheduling_rules
CREATE POLICY "Authorized users can view scheduling rules"
  ON partner_scheduling_rules FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
    )
  );

CREATE POLICY "Admins can manage scheduling rules"
  ON partner_scheduling_rules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin')
    )
  );

-- RLS Policies for partner_facility_access_log (PHI protected)
CREATE POLICY "Clinical staff can view facility access"
  ON partner_facility_access_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin', 'clinician', 'clinic_manager')
    )
  );

CREATE POLICY "Clinical staff can log facility access"
  ON partner_facility_access_log FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('clinician', 'clinic_manager', 'admin')
    )
  );

-- Function to check if appointment time is within partner hours
CREATE OR REPLACE FUNCTION check_partner_scheduling_allowed(
  p_partner_clinic_id uuid,
  p_appointment_datetime timestamptz
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_day_of_week integer;
  v_appointment_time time;
  v_rule record;
BEGIN
  -- Extract day and time from appointment
  v_day_of_week := EXTRACT(DOW FROM p_appointment_datetime)::integer;
  v_appointment_time := p_appointment_datetime::time;
  
  -- Check if scheduling rule exists for this day
  SELECT * INTO v_rule
  FROM partner_scheduling_rules
  WHERE partner_clinic_id = p_partner_clinic_id
  AND day_of_week = v_day_of_week
  AND is_active = true;
  
  -- If no rule found, default to not allowed
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check if time is within allowed range
  RETURN v_appointment_time BETWEEN v_rule.open_time AND v_rule.close_time;
END;
$$;

-- Seed EPC scheduling rules (6 AM - 10 PM, 7 days/week)
INSERT INTO partner_scheduling_rules (
  partner_clinic_id,
  day_of_week,
  open_time,
  close_time,
  appointment_slot_duration,
  slots_per_hour,
  allow_gym_access,
  allow_court_access,
  supervised_only,
  notes
)
SELECT 
  pc.id,
  day_num,
  '06:00:00'::time,
  '22:00:00'::time,
  '30 minutes'::interval,
  2,
  true,
  true,
  true,
  CASE 
    WHEN day_num BETWEEN 1 AND 5 THEN 'Weekday - Peak times 5-9 PM'
    ELSE 'Weekend - Peak times 8 AM - 6 PM'
  END
FROM partner_clinics pc
CROSS JOIN generate_series(0, 6) AS day_num
WHERE pc.partner_name = 'Edmonton Pickleball Center'
ON CONFLICT (partner_clinic_id, day_of_week) DO NOTHING;