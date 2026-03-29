-- ============================================================
-- Migration: 20260330030000_documentation_encounters.sql
-- Purpose: Encounters, transcripts, and transcript segments
-- ============================================================

BEGIN;

-- Encounters: clinical visit records with optional ambient capture
CREATE TABLE IF NOT EXISTS documentation_encounters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
  case_id uuid REFERENCES documentation_cases(id) ON DELETE SET NULL,
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE RESTRICT,
  provider_user_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE RESTRICT,
  encounter_type text NOT NULL CHECK (encounter_type IN ('initial', 'followup', 'assessment', 'reassessment', 'discharge', 'telehealth', 'emergency')),
  modality text NOT NULL DEFAULT 'in_person' CHECK (modality IN ('in_person', 'telehealth', 'hybrid')),
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show')),
  ambient_capture_enabled boolean NOT NULL DEFAULT false,
  capture_status text NOT NULL DEFAULT 'idle' CHECK (capture_status IN ('idle', 'recording', 'processing', 'ready', 'failed')),
  scheduled_start timestamptz,
  actual_start timestamptz,
  actual_end timestamptz,
  created_by_user_id uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_doc_enc_patient_id ON documentation_encounters(patient_id);
CREATE INDEX IF NOT EXISTS idx_doc_enc_case_id ON documentation_encounters(case_id);
CREATE INDEX IF NOT EXISTS idx_doc_enc_clinic_id ON documentation_encounters(clinic_id);
CREATE INDEX IF NOT EXISTS idx_doc_enc_provider_id ON documentation_encounters(provider_user_id);
CREATE INDEX IF NOT EXISTS idx_doc_enc_status ON documentation_encounters(status);
CREATE INDEX IF NOT EXISTS idx_doc_enc_type ON documentation_encounters(encounter_type);
CREATE INDEX IF NOT EXISTS idx_doc_enc_scheduled ON documentation_encounters(scheduled_start);

-- Transcripts: audio-to-text records per encounter
CREATE TABLE IF NOT EXISTS documentation_transcripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id uuid NOT NULL REFERENCES documentation_encounters(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE RESTRICT,
  storage_path text,
  diarization_status text NOT NULL DEFAULT 'pending' CHECK (diarization_status IN ('pending', 'processing', 'completed', 'failed')),
  transcript_status text NOT NULL DEFAULT 'pending' CHECK (transcript_status IN ('pending', 'processing', 'completed', 'failed', 'redacted')),
  source_language text NOT NULL DEFAULT 'en',
  confidence numeric(5,4),
  created_by_user_id uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_doc_tx_encounter_id ON documentation_transcripts(encounter_id);
CREATE INDEX IF NOT EXISTS idx_doc_tx_status ON documentation_transcripts(transcript_status);

-- Transcript segments: individual time-coded speech segments
CREATE TABLE IF NOT EXISTS documentation_transcript_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transcript_id uuid NOT NULL REFERENCES documentation_transcripts(id) ON DELETE CASCADE,
  start_ms integer NOT NULL CHECK (start_ms >= 0),
  end_ms integer NOT NULL CHECK (end_ms > start_ms),
  speaker_label text,
  text text NOT NULL,
  confidence numeric(5,4),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_segment_timing CHECK (end_ms > start_ms)
);

CREATE INDEX IF NOT EXISTS idx_doc_txseg_transcript_id ON documentation_transcript_segments(transcript_id);

COMMIT;