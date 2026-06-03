-- ============================================================
-- Migration: 20260603100700_pp_source_exports_bucket.sql
-- Purpose: Private Storage bucket for raw Practice Perfect export files
--          (PDF/CSV). These are PHI -> private bucket, signed-URL access only.
--          Idempotent. Mirrors 20260602000000_create_clinical_documents_storage_bucket.sql.
-- ============================================================

BEGIN;

INSERT INTO storage.buckets (id, name, public)
VALUES ('pp-source-exports', 'pp-source-exports', false)
ON CONFLICT (id) DO NOTHING;

-- Authenticated staff may read/write raw exports; bucket stays private and is
-- served via short-lived signed URLs. (App-layer RLS on pp_import_batches /
-- pp_* mirror tables governs who sees the structured data.)
DROP POLICY IF EXISTS "pp_exports_read" ON storage.objects;
CREATE POLICY "pp_exports_read"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'pp-source-exports');

DROP POLICY IF EXISTS "pp_exports_insert" ON storage.objects;
CREATE POLICY "pp_exports_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'pp-source-exports');

DROP POLICY IF EXISTS "pp_exports_delete" ON storage.objects;
CREATE POLICY "pp_exports_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'pp-source-exports');

COMMIT;

-- Recommendation: store objects under `<clinic_id>/<report_type>/<filename>` so
-- a later migration can tighten policies to per-clinic membership.
