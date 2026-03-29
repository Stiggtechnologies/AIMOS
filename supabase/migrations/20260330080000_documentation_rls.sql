-- ============================================================
-- Migration: 20260330080000_documentation_rls.sql
-- Purpose: Row Level Security policies for documentation module
-- ============================================================

BEGIN;

-- ============================================================
-- RLS Helper Functions
-- These abstract RLS logic so policies stay clean and DRY
-- ============================================================

-- Get the current authenticated user ID from auth.uid()
CREATE OR REPLACE FUNCTION documentation_current_auth_user_id()
RETURNS uuid AS $$
BEGIN
  RETURN COALESCE(nullif(current_setting('request.jwt.claims', true), '')::json ->> 'user_id', NULL)::uuid;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get the current app-level user ID (maps auth user to user_profiles)
CREATE OR REPLACE FUNCTION documentation_current_app_user_id()
RETURNS uuid AS $$
BEGIN
  RETURN (
    SELECT id FROM public.user_profiles
    WHERE auth_id = documentation_current_auth_user_id()
    LIMIT 1
  );
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Check if current user has a specific permission for a clinic
CREATE OR REPLACE FUNCTION documentation_user_has_clinic_permission(
  p_clinic_id uuid,
  p_permission_key text
)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM documentation_role_permissions drp
    JOIN public.user_roles ur ON ur.id = drp.role_id
    JOIN public.user_clinics uc ON uc.role_id = ur.id
    WHERE uc.user_id = documentation_current_app_user_id()
      AND uc.clinic_id = p_clinic_id
      AND drp.permission_key = p_permission_key
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Check if current user has access to a specific patient via any clinic
CREATE OR REPLACE FUNCTION documentation_user_can_access_patient(p_patient_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_clinics uc
    JOIN public.patients p ON p.clinic_id = uc.clinic_id
    WHERE uc.user_id = documentation_current_app_user_id()
      AND p.id = p_patient_id
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Check if current user can access a case
CREATE OR REPLACE FUNCTION documentation_user_can_access_case(p_case_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM documentation_cases c
    WHERE c.id = p_case_id
      AND (
        -- User is assigned to this clinic
        documentation_user_has_clinic_permission(c.clinic_id, 'documentation.view')
        OR
        -- Or user has explicit patient access
        documentation_user_can_access_patient(c.patient_id)
      )
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Check if current user can access an encounter
CREATE OR REPLACE FUNCTION documentation_user_can_access_encounter(p_encounter_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM documentation_encounters e
    WHERE e.id = p_encounter_id
      AND documentation_user_can_access_patient(e.patient_id)
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Check if current user can edit a note draft
CREATE OR REPLACE FUNCTION documentation_user_can_edit_note_draft(p_draft_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM documentation_note_drafts d
    WHERE d.id = p_draft_id
      AND (
        d.author_user_id = documentation_current_app_user_id()
        OR documentation_user_has_clinic_permission(d.clinic_id, 'documentation.edit_draft')
      )
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Check if current user can sign notes at a clinic
CREATE OR REPLACE FUNCTION documentation_user_can_sign_notes(p_clinic_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN documentation_user_has_clinic_permission(p_clinic_id, 'documentation.sign');
END;
$$ LANGUAGE plpgsql STABLE;

-- Check if current user can view signed notes
CREATE OR REPLACE FUNCTION documentation_user_can_view_signed_notes(p_clinic_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN documentation_user_has_clinic_permission(p_clinic_id, 'documentation.view');
END;
$$ LANGUAGE plpgsql STABLE;

-- Check if current user can manage requests at a clinic
CREATE OR REPLACE FUNCTION documentation_user_can_manage_requests(p_clinic_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN documentation_user_has_clinic_permission(p_clinic_id, 'requests.manage');
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- Enable RLS on all documentation tables
-- ============================================================

ALTER TABLE documentation_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentation_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentation_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentation_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentation_encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentation_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentation_transcript_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentation_note_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentation_note_draft_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentation_signed_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentation_note_addenda ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentation_risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentation_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentation_record_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentation_disclosures ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentation_correction_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentation_break_glass_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentation_retention_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentation_ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentation_ai_prompt_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentation_ai_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentation_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentation_pre_visit_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentation_clinical_documents ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS Policies
-- ============================================================

-- documentation_permissions: readable by anyone with a clinic role
CREATE POLICY documentation_permissions_select ON documentation_permissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_clinics uc
      WHERE uc.user_id = documentation_current_app_user_id()
    )
  );

-- documentation_role_permissions: readable by clinic members, writable by admins
CREATE POLICY documentation_role_permissions_select ON documentation_role_permissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_clinics uc
      WHERE uc.user_id = documentation_current_app_user_id()
    )
  );

-- documentation_cases: SELECT to clinic members, INSERT/UPDATE requires edit_draft permission
CREATE POLICY documentation_cases_select ON documentation_cases
  FOR SELECT USING (documentation_user_can_access_patient(patient_id));

CREATE POLICY documentation_cases_insert ON documentation_cases
  FOR INSERT WITH CHECK (documentation_user_has_clinic_permission(clinic_id, 'documentation.edit_draft'));

CREATE POLICY documentation_cases_update ON documentation_cases
  FOR UPDATE USING (documentation_user_has_clinic_permission(clinic_id, 'documentation.edit_draft'));

-- documentation_consents: SELECT/INSERT by clinic members
CREATE POLICY documentation_consents_select ON documentation_consents
  FOR SELECT USING (documentation_user_can_access_patient(patient_id));

CREATE POLICY documentation_consents_insert ON documentation_consents
  FOR INSERT WITH CHECK (documentation_user_has_clinic_permission(clinic_id, 'documentation.edit_draft'));

CREATE POLICY documentation_consents_update ON documentation_consents
  FOR UPDATE USING (documentation_user_has_clinic_permission(clinic_id, 'documentation.edit_draft'));

-- documentation_encounters: SELECT by patient access, INSERT by clinic members
CREATE POLICY documentation_encounters_select ON documentation_encounters
  FOR SELECT USING (documentation_user_can_access_patient(patient_id));

CREATE POLICY documentation_encounters_insert ON documentation_encounters
  FOR INSERT WITH CHECK (documentation_user_has_clinic_permission(clinic_id, 'documentation.view'));

CREATE POLICY documentation_encounters_update ON documentation_encounters
  FOR UPDATE USING (documentation_user_can_access_encounter(id));

-- documentation_transcripts: SELECT by patient access
CREATE POLICY documentation_transcripts_select ON documentation_transcripts
  FOR SELECT USING (documentation_user_can_access_patient(patient_id));

CREATE POLICY documentation_transcripts_insert ON documentation_transcripts
  FOR INSERT WITH CHECK (documentation_user_has_clinic_permission(clinic_id, 'documentation.view'));

-- documentation_transcript_segments: SELECT by transcript access
CREATE POLICY documentation_transcript_segments_select ON documentation_transcript_segments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM documentation_transcripts t
      WHERE t.id = transcript_id
        AND documentation_user_can_access_patient(t.patient_id)
    )
  );

-- documentation_note_drafts: SELECT/INSERT by patient access, UPDATE by author or edit permission
CREATE POLICY documentation_note_drafts_select ON documentation_note_drafts
  FOR SELECT USING (documentation_user_can_access_patient(patient_id));

CREATE POLICY documentation_note_drafts_insert ON documentation_note_drafts
  FOR INSERT WITH CHECK (documentation_user_can_edit_note_draft(id));

CREATE POLICY documentation_note_drafts_update ON documentation_note_drafts
  FOR UPDATE USING (documentation_user_can_edit_note_draft(id));

-- documentation_note_draft_versions: SELECT by draft access
CREATE POLICY documentation_note_draft_versions_select ON documentation_note_draft_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM documentation_note_drafts d
      WHERE d.id = note_draft_id
        AND documentation_user_can_access_patient(d.patient_id)
    )
  );

-- documentation_signed_notes: SELECT by clinic view permission, UPDATE/DELETE blocked by trigger
CREATE POLICY documentation_signed_notes_select ON documentation_signed_notes
  FOR SELECT USING (documentation_user_can_view_signed_notes(clinic_id));

-- documentation_note_addenda: SELECT/INSERT by addendum permission
CREATE POLICY documentation_note_addenda_select ON documentation_note_addenda
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM documentation_signed_notes sn
      WHERE sn.id = signed_note_id
        AND documentation_user_can_view_signed_notes(sn.clinic_id)
    )
  );

CREATE POLICY documentation_note_addenda_insert ON documentation_note_addenda
  FOR INSERT WITH CHECK (documentation_user_has_clinic_permission(clinic_id, 'documentation.addendum'));

-- documentation_risks: SELECT by patient access, INSERT by compliance review permission
CREATE POLICY documentation_risks_select ON documentation_risks
  FOR SELECT USING (documentation_user_can_access_patient(patient_id));

CREATE POLICY documentation_risks_insert ON documentation_risks
  FOR INSERT WITH CHECK (documentation_user_has_clinic_permission(clinic_id, 'compliance.documentation_review'));

-- documentation_communications: SELECT by patient access, INSERT by log permission
CREATE POLICY documentation_communications_select ON documentation_communications
  FOR SELECT USING (documentation_user_can_access_patient(patient_id));

CREATE POLICY documentation_communications_insert ON documentation_communications
  FOR INSERT WITH CHECK (documentation_user_has_clinic_permission(clinic_id, 'communications.log'));

-- documentation_record_requests: SELECT by patient access, INSERT/MODIFY by manage requests permission
CREATE POLICY documentation_record_requests_select ON documentation_record_requests
  FOR SELECT USING (
    documentation_user_can_access_patient(patient_id)
    OR documentation_user_can_manage_requests(clinic_id)
  );

CREATE POLICY documentation_record_requests_insert ON documentation_record_requests
  FOR INSERT WITH CHECK (documentation_user_can_manage_requests(clinic_id));

CREATE POLICY documentation_record_requests_update ON documentation_record_requests
  FOR UPDATE USING (documentation_user_can_manage_requests(clinic_id));

-- documentation_disclosures: SELECT/INSERT by release disclosure permission
CREATE POLICY documentation_disclosures_select ON documentation_disclosures
  FOR SELECT USING (documentation_user_can_manage_requests(clinic_id));

CREATE POLICY documentation_disclosures_insert ON documentation_disclosures
  FOR INSERT WITH CHECK (documentation_user_has_clinic_permission(clinic_id, 'disclosures.release'));

-- documentation_correction_requests: SELECT by patient/note access, INSERT by clinic members
CREATE POLICY documentation_correction_requests_select ON documentation_correction_requests
  FOR SELECT USING (
    documentation_user_can_access_patient(patient_id)
    OR documentation_user_can_manage_requests(clinic_id)
  );

CREATE POLICY documentation_correction_requests_insert ON documentation_correction_requests
  FOR INSERT WITH CHECK (documentation_user_can_manage_requests(clinic_id));

CREATE POLICY documentation_correction_requests_update ON documentation_correction_requests
  FOR UPDATE USING (documentation_user_can_manage_requests(clinic_id));

-- documentation_break_glass_events: SELECT/INSERT by clinic members
CREATE POLICY documentation_break_glass_events_select ON documentation_break_glass_events
  FOR SELECT USING (documentation_user_has_clinic_permission(clinic_id, 'compliance.documentation_review'));

CREATE POLICY documentation_break_glass_events_insert ON documentation_break_glass_events
  FOR INSERT WITH CHECK (documentation_user_has_clinic_permission(clinic_id, 'compliance.documentation_review'));

-- documentation_retention_policies: SELECT by clinic access, manage by admin
CREATE POLICY documentation_retention_policies_select ON documentation_retention_policies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_clinics uc
      WHERE uc.user_id = documentation_current_app_user_id()
        AND uc.clinic_id IN (SELECT clinic_id FROM public.clinics WHERE organization_id = organization_id)
    )
  );

CREATE POLICY documentation_retention_policies_manage ON documentation_retention_policies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.user_clinics uc ON uc.role_id = ur.id
      WHERE uc.user_id = documentation_current_app_user_id()
        AND ur.name IN ('admin', 'super_admin')
    )
  );

-- documentation_ai_models: SELECT by clinic access, manage by AI governance permission
CREATE POLICY documentation_ai_models_select ON documentation_ai_models
  FOR SELECT USING (true);

CREATE POLICY documentation_ai_models_manage ON documentation_ai_models
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_clinics uc
      WHERE uc.user_id = documentation_current_app_user_id()
        AND documentation_user_has_clinic_permission(uc.clinic_id, 'ai_governance.documentation_manage')
    )
  );

-- documentation_ai_prompt_versions: SELECT by all, manage by AI governance
CREATE POLICY documentation_ai_prompt_versions_select ON documentation_ai_prompt_versions
  FOR SELECT USING (true);

CREATE POLICY documentation_ai_prompt_versions_manage ON documentation_ai_prompt_versions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_clinics uc
      WHERE uc.user_id = documentation_current_app_user_id()
        AND documentation_user_has_clinic_permission(uc.clinic_id, 'ai_governance.documentation_manage')
    )
  );

-- documentation_ai_runs: SELECT by patient access, INSERT by AI governance
CREATE POLICY documentation_ai_runs_select ON documentation_ai_runs
  FOR SELECT USING (documentation_user_can_access_patient(patient_id));

CREATE POLICY documentation_ai_runs_insert ON documentation_ai_runs
  FOR INSERT WITH CHECK (documentation_user_has_clinic_permission(clinic_id, 'ai_governance.documentation_manage'));

-- documentation_vendors: SELECT by all, manage by AI governance
CREATE POLICY documentation_vendors_select ON documentation_vendors
  FOR SELECT USING (true);

CREATE POLICY documentation_vendors_manage ON documentation_vendors
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_clinics uc
      WHERE uc.user_id = documentation_current_app_user_id()
        AND documentation_user_has_clinic_permission(uc.clinic_id, 'ai_governance.documentation_manage')
    )
  );

-- documentation_pre_visit_briefs: SELECT by patient access
CREATE POLICY documentation_pre_visit_briefs_select ON documentation_pre_visit_briefs
  FOR SELECT USING (documentation_user_can_access_patient(patient_id));

-- documentation_clinical_documents: SELECT by patient access, INSERT by upload permission
CREATE POLICY documentation_clinical_documents_select ON documentation_clinical_documents
  FOR SELECT USING (documentation_user_can_access_patient(patient_id));

CREATE POLICY documentation_clinical_documents_insert ON documentation_clinical_documents
  FOR INSERT WITH CHECK (documentation_user_has_clinic_permission(clinic_id, 'documents.clinical_upload'));

CREATE POLICY documentation_clinical_documents_delete ON documentation_clinical_documents
  FOR DELETE USING (documentation_user_has_clinic_permission(clinic_id, 'documents.clinical_upload'));

COMMIT;