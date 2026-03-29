-- ============================================================
-- Migration: 20260330070000_documentation_functions_triggers.sql
-- Purpose: Stored functions and triggers for documentation module
-- ============================================================

BEGIN;

-- ============================================================
-- Trigger Function: set_updated_at
-- Automatically updates updated_at column on row update
-- ============================================================
CREATE OR REPLACE FUNCTION documentation_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Trigger Function: prevent_signed_note_update
-- Signed notes are immutable — block any UPDATE attempts
-- ============================================================
CREATE OR REPLACE FUNCTION documentation_prevent_signed_note_update()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Signed clinical notes are immutable and cannot be updated.';
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Trigger Function: prevent_append_only_delete
-- Append-only tables (signed notes) cannot be deleted
-- ============================================================
CREATE OR REPLACE FUNCTION documentation_prevent_append_only_delete()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Signed clinical notes cannot be deleted. They must be superseded via addendum.';
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Trigger Function: prevent_correction_request_delete
-- Correction requests cannot be deleted once created
-- ============================================================
CREATE OR REPLACE FUNCTION documentation_prevent_correction_request_delete()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Correction requests cannot be deleted.';
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Function: canonical_jsonb_hash
-- Computes a deterministic SHA-256 hash of a jsonb document
-- for version integrity verification
-- ============================================================
CREATE OR REPLACE FUNCTION documentation_canonical_jsonb_hash(payload jsonb)
RETURNS text AS $$
BEGIN
  -- Use pg's digest for deterministic hashing of canonical JSON representation
  RETURN encode(
    digest(
      coalesce(payload::text, '')::bytea,
      'sha256'
    ),
    'hex'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE STRICT PARALLEL SAFE;

-- ============================================================
-- Stored Function: sign_note_from_draft
-- Atomically signs a note draft:
-- 1. Computes canonical hash from the draft's structured_payload
-- 2. Inserts into documentation_signed_notes
-- 3. Updates the draft status to 'signed'
-- 4. Returns the signed_note_id
-- Runs as SECURITY DEFINER so it can update records even if
-- RLS would otherwise block the user from writing signed notes
-- ============================================================
CREATE OR REPLACE FUNCTION documentation_sign_note_from_draft(
  p_note_draft_id uuid,
  p_signed_by_user_id uuid
)
RETURNS uuid AS $$
DECLARE
  v_draft documentation_note_drafts%ROWTYPE;
  v_signed_note_id uuid;
  v_version_hash text;
BEGIN
  -- Fetch the draft (must be in draft or in_review status)
  SELECT * INTO v_draft
  FROM documentation_note_drafts
  WHERE id = p_note_draft_id
    AND status IN ('draft', 'in_review');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Draft note not found or not in signable state: %', p_note_draft_id;
  END IF;

  -- Compute canonical hash
  v_version_hash := documentation_canonical_jsonb_hash(v_draft.structured_payload);

  -- Insert signed note
  INSERT INTO documentation_signed_notes (
    note_draft_id, encounter_id, patient_id, case_id, clinic_id,
    note_type, signed_payload, signed_text, version_number,
    signed_by_user_id, signed_at, version_hash, status
  ) VALUES (
    v_draft.id, v_draft.encounter_id, v_draft.patient_id, v_draft.case_id, v_draft.clinic_id,
    v_draft.note_type, v_draft.structured_payload, v_draft.plain_text, v_draft.current_version,
    p_signed_by_user_id, now(), v_version_hash, 'active'
  ) RETURNING id INTO v_signed_note_id;

  -- Update draft status
  UPDATE documentation_note_drafts
  SET status = 'signed', updated_at = now()
  WHERE id = p_note_draft_id;

  RETURN v_signed_note_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Attach triggers to documentation tables
-- ============================================================

-- updated_at triggers on tables with updated_at column
CREATE TRIGGER trg_doc_cases_updated_at
  BEFORE UPDATE ON documentation_cases
  FOR EACH ROW EXECUTE FUNCTION documentation_set_updated_at();

CREATE TRIGGER trg_doc_consents_updated_at
  BEFORE UPDATE ON documentation_consents
  FOR EACH ROW EXECUTE FUNCTION documentation_set_updated_at();

CREATE TRIGGER trg_doc_encounters_updated_at
  BEFORE UPDATE ON documentation_encounters
  FOR EACH ROW EXECUTE FUNCTION documentation_set_updated_at();

CREATE TRIGGER trg_doc_note_drafts_updated_at
  BEFORE UPDATE ON documentation_note_drafts
  FOR EACH ROW EXECUTE FUNCTION documentation_set_updated_at();

CREATE TRIGGER trg_doc_retention_policies_updated_at
  BEFORE UPDATE ON documentation_retention_policies
  FOR EACH ROW EXECUTE FUNCTION documentation_set_updated_at();

CREATE TRIGGER trg_doc_clinical_documents_updated_at
  BEFORE UPDATE ON documentation_clinical_documents
  FOR EACH ROW EXECUTE FUNCTION documentation_set_updated_at();

-- Immutable signed notes — prevent UPDATE and DELETE
CREATE TRIGGER trg_prevent_signed_note_update
  BEFORE UPDATE ON documentation_signed_notes
  FOR EACH ROW EXECUTE FUNCTION documentation_prevent_signed_note_update();

CREATE TRIGGER trg_prevent_signed_note_delete
  BEFORE DELETE ON documentation_signed_notes
  FOR EACH ROW EXECUTE FUNCTION documentation_prevent_append_only_delete();

-- Correction requests are append-only (audit trail)
CREATE TRIGGER trg_prevent_correction_request_delete
  BEFORE DELETE ON documentation_correction_requests
  FOR EACH ROW EXECUTE FUNCTION documentation_prevent_correction_request_delete();

COMMIT;