/*
  # Clinical Documentation Module — Migration 8: RLS Policies

  ## Summary
  Enables Row Level Security on all 21 documentation tables and installs
  the full policy set using helper functions that resolve identity and
  clinic/patient access through the existing `user_clinic_access` table.

  ## Helper Functions
  - `documentation_current_user_id()` — extracts authenticated user UUID from
    JWT claims, returns NULL if absent
  - `documentation_user_can_access_clinic(p_clinic_id)` — returns true when
    current user has any row in `user_clinic_access` for that clinic
  - `documentation_user_can_access_patient(p_patient_id)` — returns true when
    current user has access to the clinic owning the patient record
  - `documentation_user_can_sign(p_clinic_id)` — returns true when current
    user's role for that clinic is: admin, clinician, physiotherapist,
    Chiropractor, or Massage Therapist

  ## Schema Adaptations (from actual table inspection)
  - `documentation_transcripts` — no patient_id/clinic_id; joins via encounter_id
  - `documentation_note_addenda` — no clinic_id; joins via signed_note_id
  - `documentation_ai_runs` — no patient_id/clinic_id; joins via encounter_id
  - All other tables have direct patient_id and/or clinic_id columns

  ## Policy Design
  - Clinical tables gate SELECT on patient access, INSERT/UPDATE on clinic access
  - Signed notes gate all access on `documentation_user_can_sign`
  - Reference tables (ai_models, ai_prompt_versions, vendors, permissions,
    retention_policies) are readable by any authenticated user — no PII
  - DELETE intentionally omitted on signed_notes and correction_requests
    (enforced via immutability triggers from migration 7)

  ## Security
  - No USING (true) policies — every policy checks auth or ownership
  - All helper functions use SECURITY DEFINER with explicit search_path
*/

-- ─── Helper functions ────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION documentation_current_user_id()
RETURNS uuid AS $$
BEGIN
  RETURN COALESCE(
    nullif(current_setting('request.jwt.claims', true), '')::json ->> 'user_id',
    NULL
  )::uuid;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION documentation_user_can_access_clinic(p_clinic_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_clinic_access
    WHERE user_id   = documentation_current_user_id()
      AND clinic_id = p_clinic_id
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION documentation_user_can_access_patient(p_patient_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_clinic_access uc
    JOIN public.patients p ON p.clinic_id = uc.clinic_id
    WHERE uc.user_id = documentation_current_user_id()
      AND p.id       = p_patient_id
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION documentation_user_can_sign(p_clinic_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_clinic_access
    WHERE user_id   = documentation_current_user_id()
      AND clinic_id = p_clinic_id
      AND role IN (
        'admin',
        'clinician',
        'physiotherapist',
        'Chiropractor',
        'Massage Therapist'
      )
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- ─── Enable RLS on all 21 tables ─────────────────────────────────────────────

ALTER TABLE documentation_permissions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentation_role_permissions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentation_cases                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentation_consents              ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentation_encounters            ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentation_transcripts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentation_transcript_segments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentation_note_drafts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentation_note_draft_versions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentation_signed_notes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentation_note_addenda          ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentation_communications        ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentation_record_requests       ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentation_disclosures           ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentation_correction_requests   ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentation_break_glass_events    ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentation_retention_policies    ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentation_ai_models             ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentation_ai_prompt_versions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentation_ai_runs               ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentation_vendors               ENABLE ROW LEVEL SECURITY;

-- ─── Drop existing policies (idempotent) ─────────────────────────────────────

DO $$ DECLARE pol record; BEGIN
  FOR pol IN
    SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public' AND tablename LIKE 'documentation_%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- ─── Reference / config tables (no PII) ─────────────────────────────────────

CREATE POLICY "Authenticated users can view permissions"
  ON documentation_permissions FOR SELECT
  TO authenticated
  USING (documentation_current_user_id() IS NOT NULL);

CREATE POLICY "Authenticated users can view role permissions"
  ON documentation_role_permissions FOR SELECT
  TO authenticated
  USING (documentation_current_user_id() IS NOT NULL);

CREATE POLICY "Authenticated users can view retention policies"
  ON documentation_retention_policies FOR SELECT
  TO authenticated
  USING (documentation_current_user_id() IS NOT NULL);

CREATE POLICY "Authenticated users can view AI models"
  ON documentation_ai_models FOR SELECT
  TO authenticated
  USING (documentation_current_user_id() IS NOT NULL);

CREATE POLICY "Authenticated users can view AI prompt versions"
  ON documentation_ai_prompt_versions FOR SELECT
  TO authenticated
  USING (documentation_current_user_id() IS NOT NULL);

CREATE POLICY "Authenticated users can view vendors"
  ON documentation_vendors FOR SELECT
  TO authenticated
  USING (documentation_current_user_id() IS NOT NULL);

-- ─── Cases ───────────────────────────────────────────────────────────────────

CREATE POLICY "Clinic staff can view cases for their patients"
  ON documentation_cases FOR SELECT
  TO authenticated
  USING (documentation_user_can_access_patient(patient_id));

CREATE POLICY "Clinic staff can create cases"
  ON documentation_cases FOR INSERT
  TO authenticated
  WITH CHECK (documentation_user_can_access_clinic(clinic_id));

CREATE POLICY "Clinic staff can update cases"
  ON documentation_cases FOR UPDATE
  TO authenticated
  USING  (documentation_user_can_access_clinic(clinic_id))
  WITH CHECK (documentation_user_can_access_clinic(clinic_id));

-- ─── Consents ────────────────────────────────────────────────────────────────

CREATE POLICY "Clinic staff can view consents for their patients"
  ON documentation_consents FOR SELECT
  TO authenticated
  USING (documentation_user_can_access_patient(patient_id));

CREATE POLICY "Clinic staff can create consents"
  ON documentation_consents FOR INSERT
  TO authenticated
  WITH CHECK (documentation_user_can_access_clinic(clinic_id));

CREATE POLICY "Clinic staff can update consents"
  ON documentation_consents FOR UPDATE
  TO authenticated
  USING  (documentation_user_can_access_clinic(clinic_id))
  WITH CHECK (documentation_user_can_access_clinic(clinic_id));

-- ─── Encounters ──────────────────────────────────────────────────────────────

CREATE POLICY "Clinic staff can view encounters for their patients"
  ON documentation_encounters FOR SELECT
  TO authenticated
  USING (documentation_user_can_access_patient(patient_id));

CREATE POLICY "Clinic staff can create encounters"
  ON documentation_encounters FOR INSERT
  TO authenticated
  WITH CHECK (documentation_user_can_access_clinic(clinic_id));

CREATE POLICY "Clinic staff can update encounters"
  ON documentation_encounters FOR UPDATE
  TO authenticated
  USING  (documentation_user_can_access_clinic(clinic_id))
  WITH CHECK (documentation_user_can_access_clinic(clinic_id));

-- ─── Transcripts (no direct patient_id/clinic_id — joins via encounter) ──────

CREATE POLICY "Clinic staff can view transcripts for their encounters"
  ON documentation_transcripts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documentation_encounters e
      WHERE e.id = encounter_id
        AND documentation_user_can_access_patient(e.patient_id)
    )
  );

CREATE POLICY "Clinic staff can create transcripts"
  ON documentation_transcripts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documentation_encounters e
      WHERE e.id = encounter_id
        AND documentation_user_can_access_clinic(e.clinic_id)
    )
  );

-- ─── Transcript segments (joins via transcript → encounter) ──────────────────

CREATE POLICY "Clinic staff can view transcript segments"
  ON documentation_transcript_segments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM documentation_transcripts t
      JOIN documentation_encounters e ON e.id = t.encounter_id
      WHERE t.id = transcript_id
        AND documentation_user_can_access_patient(e.patient_id)
    )
  );

-- ─── Note drafts ─────────────────────────────────────────────────────────────

CREATE POLICY "Clinic staff can view note drafts for their patients"
  ON documentation_note_drafts FOR SELECT
  TO authenticated
  USING (documentation_user_can_access_patient(patient_id));

CREATE POLICY "Clinic staff can create note drafts"
  ON documentation_note_drafts FOR INSERT
  TO authenticated
  WITH CHECK (documentation_user_can_access_clinic(clinic_id));

CREATE POLICY "Clinic staff can update note drafts"
  ON documentation_note_drafts FOR UPDATE
  TO authenticated
  USING  (documentation_user_can_access_clinic(clinic_id))
  WITH CHECK (documentation_user_can_access_clinic(clinic_id));

-- ─── Note draft versions (joins via draft) ───────────────────────────────────

CREATE POLICY "Clinic staff can view note draft versions"
  ON documentation_note_draft_versions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documentation_note_drafts d
      WHERE d.id = note_draft_id
        AND documentation_user_can_access_patient(d.patient_id)
    )
  );

-- ─── Signed notes (clinician roles only) ─────────────────────────────────────

CREATE POLICY "Clinicians can view signed notes for their clinic"
  ON documentation_signed_notes FOR SELECT
  TO authenticated
  USING (documentation_user_can_sign(clinic_id));

-- ─── Note addenda (no direct clinic_id — joins via signed_note) ──────────────

CREATE POLICY "Clinicians can view addenda for their signed notes"
  ON documentation_note_addenda FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documentation_signed_notes sn
      WHERE sn.id = signed_note_id
        AND documentation_user_can_sign(sn.clinic_id)
    )
  );

CREATE POLICY "Clinicians can create addenda"
  ON documentation_note_addenda FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documentation_signed_notes sn
      WHERE sn.id = signed_note_id
        AND documentation_user_can_sign(sn.clinic_id)
    )
  );

-- ─── Communications ──────────────────────────────────────────────────────────

CREATE POLICY "Clinic staff can view communications for their patients"
  ON documentation_communications FOR SELECT
  TO authenticated
  USING (documentation_user_can_access_patient(patient_id));

CREATE POLICY "Clinic staff can create communications"
  ON documentation_communications FOR INSERT
  TO authenticated
  WITH CHECK (documentation_user_can_access_clinic(clinic_id));

-- ─── Record requests ─────────────────────────────────────────────────────────

CREATE POLICY "Clinic staff can view record requests"
  ON documentation_record_requests FOR SELECT
  TO authenticated
  USING (
    documentation_user_can_access_patient(patient_id)
    OR documentation_user_can_access_clinic(clinic_id)
  );

CREATE POLICY "Clinic staff can create record requests"
  ON documentation_record_requests FOR INSERT
  TO authenticated
  WITH CHECK (documentation_user_can_access_clinic(clinic_id));

CREATE POLICY "Clinic staff can update record requests"
  ON documentation_record_requests FOR UPDATE
  TO authenticated
  USING  (documentation_user_can_access_clinic(clinic_id))
  WITH CHECK (documentation_user_can_access_clinic(clinic_id));

-- ─── Disclosures ─────────────────────────────────────────────────────────────

CREATE POLICY "Clinic staff can view disclosures"
  ON documentation_disclosures FOR SELECT
  TO authenticated
  USING (documentation_user_can_access_clinic(clinic_id));

CREATE POLICY "Clinic staff can create disclosures"
  ON documentation_disclosures FOR INSERT
  TO authenticated
  WITH CHECK (documentation_user_can_access_clinic(clinic_id));

-- ─── Correction requests ─────────────────────────────────────────────────────

CREATE POLICY "Clinic staff can view correction requests"
  ON documentation_correction_requests FOR SELECT
  TO authenticated
  USING (
    documentation_user_can_access_patient(patient_id)
    OR documentation_user_can_access_clinic(clinic_id)
  );

CREATE POLICY "Clinic staff can submit correction requests"
  ON documentation_correction_requests FOR INSERT
  TO authenticated
  WITH CHECK (documentation_user_can_access_clinic(clinic_id));

CREATE POLICY "Clinic staff can update correction requests"
  ON documentation_correction_requests FOR UPDATE
  TO authenticated
  USING  (documentation_user_can_access_clinic(clinic_id))
  WITH CHECK (documentation_user_can_access_clinic(clinic_id));

-- ─── Break-glass events ──────────────────────────────────────────────────────

CREATE POLICY "Clinic staff can view break-glass events"
  ON documentation_break_glass_events FOR SELECT
  TO authenticated
  USING (documentation_user_can_access_clinic(clinic_id));

CREATE POLICY "Clinic staff can log break-glass events"
  ON documentation_break_glass_events FOR INSERT
  TO authenticated
  WITH CHECK (documentation_user_can_access_clinic(clinic_id));

-- ─── AI runs (no direct patient_id/clinic_id — joins via encounter) ──────────

CREATE POLICY "Clinic staff can view AI runs for their encounters"
  ON documentation_ai_runs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documentation_encounters e
      WHERE e.id = encounter_id
        AND documentation_user_can_access_patient(e.patient_id)
    )
  );

CREATE POLICY "Clinic staff can create AI runs"
  ON documentation_ai_runs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documentation_encounters e
      WHERE e.id = encounter_id
        AND documentation_user_can_access_clinic(e.clinic_id)
    )
  );
