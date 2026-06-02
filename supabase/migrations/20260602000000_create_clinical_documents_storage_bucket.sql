-- ============================================================
-- Migration: 20260602000000_create_clinical_documents_storage_bucket.sql
-- Purpose: Private Storage bucket backing documentationService /
--          documentService (clinical document uploads, PHI).
-- Notes:   Bucket is PRIVATE — files are served via short-lived signed URLs
--          (documentService.getDocumentDownloadUrl). Idempotent.
-- ============================================================

BEGIN;

-- Create the bucket if it does not already exist.
INSERT INTO storage.buckets (id, name, public)
VALUES ('clinical-documents', 'clinical-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Authenticated clinicians may read objects in this bucket. Files are PHI, so
-- the bucket stays private; access is gated by app-layer RLS on the
-- documentation_clinical_documents metadata table + signed URLs.
DROP POLICY IF EXISTS "clinical_documents_read" ON storage.objects;
CREATE POLICY "clinical_documents_read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'clinical-documents');

DROP POLICY IF EXISTS "clinical_documents_insert" ON storage.objects;
CREATE POLICY "clinical_documents_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'clinical-documents');

DROP POLICY IF EXISTS "clinical_documents_update" ON storage.objects;
CREATE POLICY "clinical_documents_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'clinical-documents')
  WITH CHECK (bucket_id = 'clinical-documents');

DROP POLICY IF EXISTS "clinical_documents_delete" ON storage.objects;
CREATE POLICY "clinical_documents_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'clinical-documents');

COMMIT;

-- Recommendation: upload objects under a `<clinic_id>/<patient_id>/<file>` key
-- convention so a future migration can tighten these policies to per-clinic
-- access using (storage.foldername(name))[1] = clinic membership.
