/*
  # Complete RBAC Implementation
  
  Final comprehensive RBAC with audit logging and anonymization.
*/

-- Tables
CREATE TABLE IF NOT EXISTS sensitive_data_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id),
  user_role text NOT NULL,
  clinic_id uuid REFERENCES clinics(id),
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  access_type text NOT NULL,
  patient_id uuid REFERENCES patients(id),
  accessed_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS data_modification_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id),
  user_role text NOT NULL,
  clinic_id uuid REFERENCES clinics(id),
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  operation text NOT NULL,
  old_values jsonb,
  new_values jsonb,
  patient_id uuid REFERENCES patients(id),
  modified_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS patient_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinician_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  assignment_type text NOT NULL,
  is_primary boolean DEFAULT false,
  assigned_at timestamptz DEFAULT now(),
  assigned_by uuid REFERENCES user_profiles(id),
  revoked_at timestamptz,
  notes text,
  UNIQUE(patient_id, clinician_id, assignment_type)
);

CREATE INDEX IF NOT EXISTS idx_sens_user ON sensitive_data_access_log(user_id);
CREATE INDEX IF NOT EXISTS idx_mod_user ON data_modification_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_assign_patient ON patient_assignments(patient_id);
CREATE INDEX IF NOT EXISTS idx_assign_clinician ON patient_assignments(clinician_id);

ALTER TABLE sensitive_data_access_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_modification_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_assignments ENABLE ROW LEVEL SECURITY;

-- Functions
CREATE OR REPLACE FUNCTION get_user_role() RETURNS text AS $$
DECLARE r text;
BEGIN SELECT role::text INTO r FROM user_profiles WHERE id = auth.uid(); RETURN COALESCE(r, 'contractor'); END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_executive() RETURNS boolean AS $$
BEGIN RETURN get_user_role() = 'executive'; END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_clinic_manager() RETURNS boolean AS $$
BEGIN RETURN get_user_role() = 'clinic_manager'; END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_clinician() RETURNS boolean AS $$
BEGIN RETURN get_user_role() = 'clinician'; END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin() RETURNS boolean AS $$
BEGIN RETURN get_user_role() = 'admin'; END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_assigned_to_patient(p uuid) RETURNS boolean AS $$
BEGIN
  IF is_executive() OR is_clinic_manager() OR is_admin() THEN RETURN true; END IF;
  RETURN EXISTS (SELECT 1 FROM patient_assignments WHERE patient_id = p AND clinician_id = auth.uid() AND revoked_at IS NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION has_elevated_privileges() RETURNS boolean AS $$
BEGIN RETURN get_user_role() IN ('executive', 'admin', 'clinic_manager'); END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION anonymize_peer_name(peer uuid) RETURNS text AS $$
DECLARE r text; f text; l text;
BEGIN
  r := get_user_role();
  IF r IN ('executive', 'admin', 'clinic_manager') OR peer = auth.uid() THEN
    SELECT first_name, last_name INTO f, l FROM user_profiles WHERE id = peer;
    RETURN COALESCE(f || ' ' || l, 'Unknown');
  END IF;
  RETURN 'Clinician-' || substr(peer::text, 1, 8);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies for new tables (patients, appointments, etc)
CREATE POLICY "rbac_sel" ON patients FOR SELECT TO authenticated
USING (is_executive() OR (is_clinic_manager() AND user_has_clinic_access(clinic_id)) OR (is_clinician() AND is_assigned_to_patient(id)) OR is_admin());

CREATE POLICY "rbac_mod" ON patients FOR ALL TO authenticated
USING ((is_clinic_manager() AND user_has_clinic_access(clinic_id)) OR (is_clinician() AND is_assigned_to_patient(id)))
WITH CHECK ((is_clinic_manager() AND user_has_clinic_access(clinic_id)) OR (is_clinician() AND is_assigned_to_patient(id)));

-- Audit policies
CREATE POLICY "rbac_sel" ON sensitive_data_access_log FOR SELECT TO authenticated
USING (is_executive() OR is_admin() OR (is_clinic_manager() AND user_has_clinic_access(clinic_id)));

CREATE POLICY "rbac_ins" ON sensitive_data_access_log FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "rbac_sel" ON data_modification_audit FOR SELECT TO authenticated
USING (is_executive() OR is_admin() OR (is_clinic_manager() AND user_has_clinic_access(clinic_id)));

CREATE POLICY "rbac_ins" ON data_modification_audit FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "rbac_sel" ON patient_assignments FOR SELECT TO authenticated
USING (is_executive() OR is_admin() OR (is_clinic_manager() AND user_has_clinic_access(clinic_id)) OR (is_clinician() AND clinician_id = auth.uid()));

CREATE POLICY "rbac_mod" ON patient_assignments FOR ALL TO authenticated
USING (is_clinic_manager() AND user_has_clinic_access(clinic_id))
WITH CHECK (is_clinic_manager() AND user_has_clinic_access(clinic_id));

-- Anonymization view
CREATE OR REPLACE VIEW anonymized_clinician_performance AS
SELECT 
  cps.id,
  CASE WHEN cps.clinician_id = auth.uid() OR has_elevated_privileges() 
    THEN (SELECT first_name || ' ' || last_name FROM user_profiles WHERE id = cps.clinician_id)
    ELSE anonymize_peer_name(cps.clinician_id)
  END as clinician_name,
  cps.clinic_id,
  cps.period_start,
  cps.period_end,
  cps.total_episodes,
  cps.patient_satisfaction_score
FROM clinician_performance_snapshots cps
WHERE has_elevated_privileges() OR cps.clinician_id = auth.uid() OR (is_clinic_manager() AND user_has_clinic_access(cps.clinic_id));

COMMENT ON TABLE sensitive_data_access_log IS 'Audit log for sensitive data access';
COMMENT ON TABLE data_modification_audit IS 'Audit log for data modifications';
COMMENT ON TABLE patient_assignments IS 'Clinician-patient assignments for access control';
COMMENT ON VIEW anonymized_clinician_performance IS 'Anonymized performance metrics for clinicians';
