# AIMOS Practice Perfect → AIMOS Import Spec (MVP)

**Decisions:**
- AR: **aggregate only** (no invoice/client-level storage)
- Provider key: **provider_name** (string)

This spec converts the parsed artifacts in `AIMOS/import_parsed/` into tables already referenced by the AIMOS app, with a minimal new table for provider performance.

---

## 0) Source artifacts (already generated)
Folder: `AIMOS/import_parsed/`

- `revenue_import_jan_2026.json`
- `revenue_import_dec_2025.json`
- `accounts_receivable_aging_ALL_2026-01-23.json`
- `provider_performance_summary.csv`
- `daily_reconciliation_missing_charges.csv`

---

## 1) Revenue → existing AIMOS tables
### Target
- `clinic_financial_metrics`
- `service_line_performance`

### Ingestion method
Use existing edge function:
- `supabase/functions/import-revenue-report`

Payloads ready:
- `revenue_import_jan_2026.json`
- `revenue_import_dec_2025.json`

**Notes**
- These payloads estimate `total_visits` by parsing “X visits/items” from the PDF-derived lines.
- If Practice Perfect can export the same report as CSV, we can make visit counts exact.

---

## 2) Accounts Receivable (aggregate) → existing table
### Target
- `accounts_receivable_aging`

### Mapping (aggregate-only)
From `accounts_receivable_aging_ALL_2026-01-23.json`:
- `snapshot_date` → `accounts_receivable_aging.snapshot_date`
- `payer_name` = `ALL`
- `payer_type` = `other`
- `current_0_30_days` = `total_due_total`
- `days_31_60` / `days_61_90` / `days_over_90` = `0` (until we have true aging buckets)

**Why this works for MVP**
- The dashboards can show total AR and trends without exposing PHI.

**Upgrade path**
- When we have a CSV export with aging buckets, we’ll populate the bucket fields and compute `at_risk_amount`.

---

## 3) Provider Performance → **new table (recommended)**
There is no existing provider-performance table in the schema; the app currently only has clinic-level metrics.

### Proposed table
`provider_performance_metrics`

**Columns (minimal MVP):**
- `id uuid primary key default gen_random_uuid()`
- `clinic_id uuid references clinics(id) on delete cascade`
- `period_start date not null`
- `period_end date not null`
- `provider_name text not null`
- `total_scheduled_visits integer`
- `total_scheduled_hours numeric`
- `actual_visits integer`
- `client_cancels_no_shows integer`
- `pct_cancel_no_show numeric`
- `revenue numeric`
- `avg_revenue_per_hour numeric`
- `avg_revenue_per_visit numeric`
- `unscheduled_hours numeric`
- `units numeric`
- `therapist_cancels integer`
- `source text` (e.g., `practiceperfect_pdf`)
- `raw_values jsonb` (optional, for re-parsing without re-import)
- timestamps

**RLS**
- mirror `service_line_performance` policy: clinic_access-based SELECT.

### Mapping from `provider_performance_summary.csv`
- `provider_name` → `provider_name`
- `total_scheduled_visits` → `total_scheduled_visits`
- `total_scheduled_hours` → `total_scheduled_hours`
- `actual_visits` → `actual_visits`
- `client_cancels_no_shows` → `client_cancels_no_shows`
- `pct_cancel_no_show` → `pct_cancel_no_show` (strip `%`)
- `revenue` → `revenue`
- `avg_revenue_per_hour` → `avg_revenue_per_hour`
- `avg_revenue_per_visit` → `avg_revenue_per_visit`
- `unscheduled_hours` → `unscheduled_hours`
- `units` → `units`
- `therapist_cancels` → `therapist_cancels`

### Period dates
The PDF header indicates: `2025-08-01` to `2026-01-31`.
Use:
- `period_start = 2025-08-01`
- `period_end = 2026-01-31`

---

## 4) Daily Reconciliation “missing charges” (optional MVP)
This file contains client names (PHI). For MVP we should **not ingest it** unless we explicitly decide it’s acceptable.

If/when we ingest:
- store only **counts** and **provider-level aggregates** (no client names), or store in a restricted PHI schema.

---

## 5) What I can do next (pick one)
A) **Generate a Bolt-ready SQL migration** for `provider_performance_metrics` (+ RLS policy)
B) Add a new edge function `import-provider-performance` that inserts the CSV rows (service role key)
C) Do (A) + (B)

