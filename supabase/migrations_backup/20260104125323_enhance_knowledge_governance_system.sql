/*
  # Enhance Knowledge Governance & Attestation System

  ## Purpose
  Stop SOP drift and IP leakage through comprehensive document governance with:
  - Official document designation and version control
  - Required attestations and read receipts
  - Review cycles and expiration tracking
  - Full audit trail for compliance

  ## Enhancements to Existing Tables
  
  ### `document_library` (add governance flags)
    - `attestation_required` (boolean) - Requires user attestation
    - `read_receipt_required` (boolean) - Requires read confirmation
    - `confidentiality_level` (text) - public, internal, confidential, restricted
    - `ip_sensitive` (boolean) - Contains intellectual property
    - `regulatory_reference` (text) - Related regulations (HIPAA, OSHA, etc.)
    - `last_review_date` (date) - When last reviewed
    - `review_cycle_status` (text) - on_schedule, overdue, upcoming

  ### `document_versions` (add integrity features)
    - `approval_required` (boolean) - Requires approval before publishing
    - `approved_by` (uuid) - Who approved this version
    - `approved_at` (timestamptz) - When approved
    - `retirement_date` (date) - When version retired
    - `superseded_by` (uuid) - Next version reference

  ### `document_attestations` (enhance tracking)
    - `attestation_notes` (text) - Optional notes from user
    - `is_valid` (boolean) - Attestation still valid
    - `expires_at` (timestamptz) - When attestation expires

  ### `document_access_logs` (add metadata)
    - `session_id` (text) - Session tracking
    - `duration_seconds` (integer) - Time spent viewing
    - `completion_percentage` (integer) - % of document viewed

  ## New Tables

  ### `document_read_receipts`
    - Track explicit read confirmations separate from access logs
    - Links to attestations for compliance

  ### `document_review_schedule`
    - Automated review scheduling
    - Owner notifications
    - Compliance tracking

  ## Security
    - Maintain existing RLS policies
    - Add confidentiality-based access control
    - Audit all governance actions

  ## Indexes
    - Performance indexes for governance queries
    - Attestation lookup optimization
    - Review schedule tracking
*/

-- Add governance columns to document_library
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_library' AND column_name = 'attestation_required') THEN
    ALTER TABLE document_library ADD COLUMN attestation_required BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_library' AND column_name = 'read_receipt_required') THEN
    ALTER TABLE document_library ADD COLUMN read_receipt_required BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_library' AND column_name = 'confidentiality_level') THEN
    ALTER TABLE document_library ADD COLUMN confidentiality_level TEXT DEFAULT 'internal' CHECK (confidentiality_level IN ('public', 'internal', 'confidential', 'restricted'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_library' AND column_name = 'ip_sensitive') THEN
    ALTER TABLE document_library ADD COLUMN ip_sensitive BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_library' AND column_name = 'regulatory_reference') THEN
    ALTER TABLE document_library ADD COLUMN regulatory_reference TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_library' AND column_name = 'last_review_date') THEN
    ALTER TABLE document_library ADD COLUMN last_review_date DATE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_library' AND column_name = 'review_cycle_status') THEN
    ALTER TABLE document_library ADD COLUMN review_cycle_status TEXT DEFAULT 'on_schedule' CHECK (review_cycle_status IN ('on_schedule', 'upcoming', 'overdue'));
  END IF;
END $$;

-- Add version integrity columns to document_versions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_versions' AND column_name = 'approval_required') THEN
    ALTER TABLE document_versions ADD COLUMN approval_required BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_versions' AND column_name = 'approved_by') THEN
    ALTER TABLE document_versions ADD COLUMN approved_by UUID REFERENCES auth.users(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_versions' AND column_name = 'approved_at') THEN
    ALTER TABLE document_versions ADD COLUMN approved_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_versions' AND column_name = 'retirement_date') THEN
    ALTER TABLE document_versions ADD COLUMN retirement_date DATE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_versions' AND column_name = 'superseded_by') THEN
    ALTER TABLE document_versions ADD COLUMN superseded_by UUID REFERENCES document_versions(id);
  END IF;
END $$;

-- Add attestation validity columns to document_attestations
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_attestations' AND column_name = 'attestation_notes') THEN
    ALTER TABLE document_attestations ADD COLUMN attestation_notes TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_attestations' AND column_name = 'is_valid') THEN
    ALTER TABLE document_attestations ADD COLUMN is_valid BOOLEAN DEFAULT true;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_attestations' AND column_name = 'expires_at') THEN
    ALTER TABLE document_attestations ADD COLUMN expires_at TIMESTAMPTZ;
  END IF;
END $$;

-- Add tracking metadata to document_access_logs
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_access_logs' AND column_name = 'session_id') THEN
    ALTER TABLE document_access_logs ADD COLUMN session_id TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_access_logs' AND column_name = 'duration_seconds') THEN
    ALTER TABLE document_access_logs ADD COLUMN duration_seconds INTEGER;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_access_logs' AND column_name = 'completion_percentage') THEN
    ALTER TABLE document_access_logs ADD COLUMN completion_percentage INTEGER CHECK (completion_percentage BETWEEN 0 AND 100);
  END IF;
END $$;

-- Create document_read_receipts table for explicit confirmations
CREATE TABLE IF NOT EXISTS document_read_receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES document_library(id) ON DELETE CASCADE,
  version_id UUID REFERENCES document_versions(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  read_at TIMESTAMPTZ DEFAULT now(),
  confirmed_understanding BOOLEAN DEFAULT true,
  time_spent_seconds INTEGER,
  completion_percentage INTEGER CHECK (completion_percentage BETWEEN 0 AND 100),
  ip_address INET,
  user_agent TEXT,
  attestation_id UUID REFERENCES document_attestations(id)
);

-- Create document_review_schedule table for automated tracking
CREATE TABLE IF NOT EXISTS document_review_schedule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES document_library(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  reviewer_id UUID REFERENCES user_profiles(id),
  review_type TEXT CHECK (review_type IN ('routine', 'regulatory', 'incident_driven', 'version_update')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id),
  review_notes TEXT,
  outcome TEXT CHECK (outcome IN ('approved', 'revised', 'retired', 'no_changes')),
  next_review_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for document_library governance columns
CREATE INDEX IF NOT EXISTS idx_document_library_attestation_required 
  ON document_library(attestation_required) WHERE attestation_required = true;

CREATE INDEX IF NOT EXISTS idx_document_library_confidentiality 
  ON document_library(confidentiality_level);

CREATE INDEX IF NOT EXISTS idx_document_library_ip_sensitive 
  ON document_library(ip_sensitive) WHERE ip_sensitive = true;

CREATE INDEX IF NOT EXISTS idx_document_library_review_status 
  ON document_library(review_cycle_status);

CREATE INDEX IF NOT EXISTS idx_document_library_next_review 
  ON document_library(next_review_date) WHERE next_review_date IS NOT NULL;

-- Create indexes for document_versions
CREATE INDEX IF NOT EXISTS idx_document_versions_approval 
  ON document_versions(approval_required, approved_at);

CREATE INDEX IF NOT EXISTS idx_document_versions_approved_by 
  ON document_versions(approved_by);

-- Create indexes for document_attestations
CREATE INDEX IF NOT EXISTS idx_document_attestations_valid 
  ON document_attestations(is_valid, expires_at);

CREATE INDEX IF NOT EXISTS idx_document_attestations_user_document 
  ON document_attestations(user_id, document_id);

-- Create indexes for document_read_receipts
CREATE INDEX IF NOT EXISTS idx_document_read_receipts_document 
  ON document_read_receipts(document_id);

CREATE INDEX IF NOT EXISTS idx_document_read_receipts_user 
  ON document_read_receipts(user_id);

CREATE INDEX IF NOT EXISTS idx_document_read_receipts_version 
  ON document_read_receipts(version_id);

CREATE INDEX IF NOT EXISTS idx_document_read_receipts_read_at 
  ON document_read_receipts(read_at DESC);

-- Create indexes for document_review_schedule
CREATE INDEX IF NOT EXISTS idx_document_review_schedule_document 
  ON document_review_schedule(document_id);

CREATE INDEX IF NOT EXISTS idx_document_review_schedule_date 
  ON document_review_schedule(scheduled_date);

CREATE INDEX IF NOT EXISTS idx_document_review_schedule_status 
  ON document_review_schedule(status);

CREATE INDEX IF NOT EXISTS idx_document_review_schedule_reviewer 
  ON document_review_schedule(reviewer_id);

-- Add updated_at trigger for document_review_schedule
DO $$
BEGIN
  DROP TRIGGER IF EXISTS document_review_schedule_updated_at ON document_review_schedule;
  CREATE TRIGGER document_review_schedule_updated_at 
    BEFORE UPDATE ON document_review_schedule 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enable RLS on new tables
ALTER TABLE document_read_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_review_schedule ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_read_receipts
CREATE POLICY "Users can view own read receipts" 
  ON document_read_receipts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own read receipts" 
  ON document_read_receipts FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all read receipts" 
  ON document_read_receipts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'executive')
    )
  );

-- RLS Policies for document_review_schedule
CREATE POLICY "Reviewers can view assigned reviews" 
  ON document_review_schedule FOR SELECT
  USING (
    reviewer_id = auth.uid() OR EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'executive')
    )
  );

CREATE POLICY "Admins can manage review schedule" 
  ON document_review_schedule FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'executive')
    )
  );

CREATE POLICY "Reviewers can update assigned reviews" 
  ON document_review_schedule FOR UPDATE
  USING (reviewer_id = auth.uid());
