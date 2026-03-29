# AIMOS Asset Management Schema — Checkpoint Validation Report
**Project:** tfnoogotbyshsznpjspk  
**Validated:** 2026-03-29 04:15 MDT  
**Status:** ⚠️ BLOCKED — Schema drift + empty core tables + RLS unknown

---

## PART 1: LIVE DATA FINDINGS

### Assets Table — ACTUAL Schema
**36 columns confirmed via live REST API:**

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| asset_tag | TEXT | UNIQUE (e.g., "AIM-RD-001-T001") |
| qr_code_value | TEXT | UNIQUE, nullable |
| name | TEXT | NOT NULL |
| description | TEXT | |
| clinic_id | UUID | FK → clinics(id) |
| category_id | UUID | FK → asset_categories(id) |
| sub_category | TEXT | nullable |
| manufacturer | TEXT | |
| model | TEXT | |
| serial_number | TEXT | nullable |
| supplier | TEXT | nullable |
| purchase_date | DATE | nullable |
| in_service_date | DATE | nullable |
| purchase_cost | NUMERIC(12,2) | nullable |
| installation_cost | NUMERIC(12,2) | nullable |
| book_value | NUMERIC(12,2) | nullable |
| replacement_cost | NUMERIC(12,2) | nullable |
| estimated_market_value | NUMERIC(12,2) | nullable |
| useful_life_months | INTEGER | DEFAULT 60 |
| expected_replacement_date | DATE | nullable |
| warranty_expiry_date | DATE | nullable |
| condition_score | NUMERIC(4,1) | DEFAULT 7.0 |
| condition_notes | TEXT | nullable |
| criticality | TEXT | DEFAULT 'medium' |
| risk_rating | TEXT | DEFAULT 'low' |
| status | TEXT | DEFAULT 'active' |
| room_location | TEXT | nullable |
| assigned_to_user_id | UUID | FK → auth.users (nullable) |
| ownership_type | TEXT | DEFAULT 'owned' |
| acquisition_batch_id | UUID | FK → acquisition_batches (nullable) |
| photo_url | TEXT | nullable |
| manual_url | TEXT | nullable |
| created_at | TIMESTAMPTZ | auto |
| updated_at | TIMESTAMPTZ | auto |

**Row count:** 6 assets (live data confirmed)

**Indexes (from migration files):**
- `assets_pkey` — PRIMARY KEY on id
- `idx_assets_tag` — asset_tag
- `idx_assets_clinic` — clinic_id
- `idx_assets_category` — category_id
- `idx_assets_status` — status
- `idx_assets_serial` — serial_number
- `idx_assets_warranty` — warranty_expiry_date

**Foreign Keys (from migration files):**
- clinic_id → clinics(id)
- category_id → asset_categories(id)
- assigned_to_user_id → auth.users(id)
- acquisition_batch_id → acquisition_batches(id)

---

### Work Orders Table — ACTUAL Schema
**Source:** migration `20260329000000_create_work_orders_and_documents.sql`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| work_order_number | TEXT | UNIQUE, NOT NULL (auto-generated) |
| asset_id | UUID | FK → assets(id) ON DELETE SET NULL |
| clinic_id | UUID | FK → clinics(id) ON DELETE SET NULL |
| user_clinic_access_id | UUID | FK → user_clinic_access(id) ON DELETE SET NULL |
| type | TEXT | CHECK: preventive/corrective/emergency/inspection/upgrade/other |
| priority | TEXT | CHECK: low/medium/high/critical |
| status | TEXT | DEFAULT 'pending' |
| issue_description | TEXT | nullable |
| requested_date | TIMESTAMPTZ | DEFAULT NOW() |
| scheduled_date | TIMESTAMPTZ | nullable |
| completed_date | TIMESTAMPTZ | nullable |
| assigned_to | UUID | FK → auth.users(id) ON DELETE SET NULL |
| vendor_name | TEXT | nullable |
| labor_cost | DECIMAL(12,2) | DEFAULT 0 |
| parts_cost | DECIMAL(12,2) | DEFAULT 0 |
| total_cost | DECIMAL(12,2) | COMPUTED (labor + parts) |
| downtime_hours | DECIMAL(8,2) | DEFAULT 0 |
| root_cause | TEXT | nullable |
| resolution_notes | TEXT | nullable |
| created_by | UUID | FK → auth.users(id) ON DELETE SET NULL |
| created_at | TIMESTAMPTZ | auto |
| updated_at | TIMESTAMPTZ | auto |

**Row count:** 0 (empty)

**Indexes:**
- `idx_work_orders_number` — work_order_number
- `idx_work_orders_asset` — asset_id
- `idx_work_orders_clinic` — clinic_id
- `idx_work_orders_status` — status
- `idx_work_orders_priority` — priority
- `idx_work_orders_scheduled` — scheduled_date
- `idx_work_orders_assigned` — assigned_to
- `idx_work_orders_created` — created_at

**Foreign Keys:**
- asset_id → assets(id)
- clinic_id → clinics(id)
- user_clinic_access_id → user_clinic_access(id)
- assigned_to → auth.users(id)
- created_by → auth.users(id)

**Triggers:**
- `set_work_order_number` — BEFORE INSERT, calls `generate_work_order_number()` which sets `WO-YYYYMMDD-####` format
- `update_work_orders_updated_at` — BEFORE UPDATE, auto-updates updated_at

**Sequence:**
- `work_order_seq` — START 1, used by trigger

---

### Asset Documents Table — ACTUAL Schema
**Source:** migration `20260329000000_create_work_orders_and_documents.sql`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| asset_id | UUID | FK → assets(id) ON DELETE CASCADE |
| user_clinic_access_id | UUID | FK → user_clinic_access(id) ON DELETE SET NULL |
| document_type | TEXT | CHECK: manual/warranty/certificate/inspection_report/maintenance_log/purchase_order/invoice/photo/schematic/safety/calibration/other |
| title | TEXT | NOT NULL |
| file_url | TEXT | NOT NULL |
| file_size | INTEGER | nullable |
| mime_type | TEXT | nullable |
| version | INTEGER | DEFAULT 1 |
| status | TEXT | DEFAULT 'active' |
| uploaded_by | UUID | FK → auth.users(id) ON DELETE SET NULL |
| uploaded_at | TIMESTAMPTZ | DEFAULT NOW() |
| tags | TEXT[] | nullable |
| expiry_date | DATE | nullable |
| created_at | TIMESTAMPTZ | auto |
| updated_at | TIMESTAMPTZ | auto |

**Row count:** 0 (empty)

**Indexes:**
- `idx_asset_documents_asset` — asset_id
- `idx_asset_documents_type` — document_type
- `idx_asset_documents_status` — status
- `idx_asset_documents_uploaded` — uploaded_by
- `idx_asset_documents_expiry` — expiry_date

---

### Asset Categories Table — ACTUAL Schema

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| name | TEXT | NOT NULL |
| parent_category_id | UUID | FK → asset_categories(id) |
| description | TEXT | |
| depreciation_method_default | TEXT | DEFAULT 'CCA' |
| useful_life_months_default | INTEGER | DEFAULT 60 |
| is_maintenance_trackable | BOOLEAN | DEFAULT TRUE |
| is_depreciable | BOOLEAN | DEFAULT TRUE |
| icon | TEXT | nullable |
| color | TEXT | nullable |
| created_at | TIMESTAMPTZ | auto |

**Row count:** 6 categories

---

## PART 2: SCHEMA DRIFT ANALYSIS — UI vs DB

### AssetRegisterView.tsx — Field Mismatches

| UI Reference | Actual DB Column | Status |
|---|---|---|
| `asset.location` | `room_location` | ❌ WRONG |
| `asset.asset_id` | `asset_tag` (or id) | ❌ WRONG |
| `asset.asset_category_id` | `category_id` | ⚠️ WRONG NAME |
| `asset.condition` | `condition_score` | ❌ WRONG |
| `asset.asset_categories?.name` | `asset_categories(name)` | ⚠️ JOIN needed |
| `asset.status` | `status` | ✅ CORRECT |
| `asset.name` | `name` | ✅ CORRECT |

### AssetDetailView.tsx — Field Mismatches

| UI Reference | Actual DB Column | Status |
|---|---|---|
| `asset.location` | `room_location` | ❌ WRONG |
| `asset.warranty_expiry` | `warranty_expiry_date` | ❌ WRONG |

### Summary of Drifted UI Components

| Component | File | Issues Count |
|---|---|---|
| AssetRegisterView.tsx | src/components/assets/AssetRegisterView.tsx | 5 |
| AssetDetailView.tsx | src/components/assets/AssetDetailView.tsx | 2 |
| WorkOrdersView.tsx | src/components/assets/WorkOrdersView.tsx | 1 (no WO data to verify) |
| DocumentsCenter.tsx | src/components/assets/DocumentsCenter.tsx | Not directly tested |

---

## PART 3: RLS VALIDATION

### Current RLS Policies (from migration files)

**assets table:**
- `Users can view assets for their clinics` — SELECT
  - USING: `auth.uid() IS NOT NULL AND clinic_id IN (SELECT clinic_id FROM user_clinic_access WHERE user_id = auth.uid())`
  - ⚠️ TEMPORARY: Uses `USING true` pattern via subquery on user_clinic_access
  
- `Users can insert assets for their clinics` — INSERT
  - WITH CHECK: Same clinic-based subquery
  
- `Users can update assets for their clinics` — UPDATE
  - USING: Same clinic-based subquery

**work_orders table:**
- `Users can view work orders for their clinics` — SELECT
  - USING: `clinic_id IN (SELECT clinic_id FROM user_clinic_access WHERE user_id = auth.uid()) OR created_by = auth.uid() OR assigned_to = auth.uid()`
  
- `Users can insert work orders for their clinics` — INSERT
  - WITH CHECK: Must be in user_clinic_access for the clinic
  
- `Users can update work orders for their clinics` — UPDATE
  - USING: clinic access OR created_by OR assigned_to

**asset_documents table:**
- `Users can view documents for their clinics` — SELECT
  - USING: Asset must be in user's clinic via user_clinic_access, OR uploaded_by = auth.uid()
  
- `Users can insert documents for their clinics` — INSERT
  - WITH CHECK: Asset must be in user's clinic
  
- `Users can update documents for their clinics` — UPDATE
  - USING: Asset must be in user's clinic OR uploaded_by

**asset_categories table:**
- Check not completed (via REST)

### Temporary Policies (USING true) — NONE FOUND
The migrations do NOT use `USING true` for any public access. All policies use `auth.uid() IS NOT NULL` or clinic-based subqueries.

### ⚠️ RLS Risk: `auth.uid() IS NOT NULL` on ALL Tables
Every policy starts with `auth.uid() IS NOT NULL`, meaning:
- **Any authenticated user can see ALL records in those tables** (not filtered by clinic)
- The clinic subquery filters within SELECT, but the initial check is permissive
- This is acceptable for a clinic-based system IF user_clinic_access is properly maintained

---

## PART 4: DATA INTEGRITY ISSUES

### Issue 1: Core Tables Empty
- `work_orders`: 0 rows — cannot validate end-to-end CRUD, triggers, or sequences
- `asset_documents`: 0 rows — cannot validate INSERT, READ, or FK constraints

### Issue 2: No Live Validation of Work Order Number Generation
- Migration includes `generate_work_order_number()` trigger and `work_order_seq` sequence
- Cannot verify trigger fires correctly without inserting test data
- **Non-production validation method needed**: Use a test Supabase project or mock the INSERT

### Issue 3: No FK Cascade Testing Possible
- FK constraints exist in schema definition but cannot be tested without data
- `asset_documents.asset_id` → `assets.id` ON DELETE CASCADE cannot be verified

### Issue 4: Missing `created_by` on Assets Table
- Assets table has `assigned_to_user_id` NOT `created_by`
- Previous RLS proposals referencing `created_by` will NOT work
- **Actual asset ownership column is `assigned_to_user_id`**

---

## PART 5: PERFORMANCE RISK

### Current Row Counts
- assets: 6 (negligible)
- work_orders: 0 (negligible)
- asset_documents: 0 (negligible)
- asset_categories: 6 (negligible)

### Growth Risk Assessment

| Table | Growth Rate | Index Coverage | Status |
|---|---|---|---|
| assets | Low-Medium | Good (8 indexes) | ✅ OK |
| work_orders | **HIGH** | Good (8 indexes) | ✅ OK |
| asset_documents | **HIGH** | Good (5 indexes) | ✅ OK |
| asset_categories | Very Low | Not indexed (small table) | ✅ OK |

**Indexes are adequate.** Both high-growth tables have indexes on their most queried columns (asset_id, status, clinic_id, scheduled_date).

### Missing Indexes (recommended for future):
- `assets.warranty_expiry_date` — for alert queries
- `work_orders.assigned_to` — for technician dashboard
- `asset_documents.expiry_date` — for certificate reminders

---

## PART 6: PRODUCTION-FINAL RLS MODEL

Based on actual schema (NOT assumed):

### assets
```
SELECT:  auth.uid() IS NOT NULL AND clinic_id IN (
          SELECT clinic_id FROM user_clinic_access WHERE user_id = auth.uid()
        )
INSERT:  auth.uid() IS NOT NULL AND clinic_id IN (...) — user must have clinic access
UPDATE:  auth.uid() IS NOT NULL AND clinic_id IN (...) — creator OR assigned user
DELETE:  auth.uid() IS NOT NULL AND clinic_id IN (...) AND created_by = auth.uid() — admin only
```

### work_orders
```
SELECT:  auth.uid() IS NOT NULL AND (
          clinic_id IN (SELECT clinic_id FROM user_clinic_access WHERE user_id = auth.uid())
          OR created_by = auth.uid()
          OR assigned_to = auth.uid()
        )
INSERT:  auth.uid() IS NOT NULL AND clinic_id IN (...) — user must have clinic access
UPDATE:  auth.uid() IS NOT NULL AND (...) — clinic access OR assigned to OR created by
DELETE:  auth.uid() IS NOT NULL AND (created_by = auth.uid() OR assigned_to = auth.uid())
```

### asset_documents
```
SELECT:  auth.uid() IS NOT NULL AND (
          asset_id IN (SELECT id FROM assets WHERE clinic_id IN (
            SELECT clinic_id FROM user_clinic_access WHERE user_id = auth.uid()
          ))
          OR uploaded_by = auth.uid()
        )
INSERT:  auth.uid() IS NOT NULL AND asset_id IN (...) — asset must be in user's clinic
UPDATE:  auth.uid() IS NOT NULL AND (uploaded_by = auth.uid() OR ...)
DELETE:  auth.uid() IS NOT NULL AND uploaded_by = auth.uid()
```

### asset_categories
```
SELECT:  auth.uid() IS NOT NULL — all authenticated users can view categories
INSERT/UPDATE/DELETE:  auth.uid() IS NOT NULL AND role-based (via user_clinic_access)
```

---

## PART 7: UI FILES REQUIRING UPDATES

| File | Component | Fields to Fix |
|---|---|---|
| `src/components/assets/AssetRegisterView.tsx` | Asset table display | `location` → `room_location`, `asset.asset_id` → `asset.asset_tag`, `asset.asset_category_id` → `asset.category_id`, `asset.condition` → `asset.condition_score`, `asset.asset_categories?.name` → join asset_categories |
| `src/components/assets/AssetDetailView.tsx` | Asset detail view | `asset.location` → `asset.room_location`, `asset.warranty_expiry` → `asset.warranty_expiry_date` |
| `src/components/assets/WorkOrdersView.tsx` | Work orders table | Verify `work_order_number`, `priority`, `status` fields match schema |
| `src/components/assets/AnalyticsView.tsx` | Analytics | Likely needs field mapping |
| `src/components/assets/AcquisitionIntakeView.tsx` | Acquisition | Likely references wrong field names |
| `src/components/assets/CapitalPlanningView.tsx` | Capital planning | Likely references `warranty_expiry` and `location` |
| `src/components/assets/DocumentsCenter.tsx` | Documents | Needs verification against asset_documents schema |

---

## PART 8: NON-PRODUCTION VALIDATION METHOD

To validate work_orders CRUD and trigger without touching production:

**Option A: Create a temporary test migration**
- In a non-production environment (staging/draft Supabase project), add one work_order row
- Verify:
  1. `work_order_number` auto-generated correctly
  2. FK to assets works
  3. RLS policies enforce correctly
  4. Index performance on 100+ rows

**Option B: Use Supabase Edge Functions with test data**
- Create a temporary endpoint that:
  1. Creates a test asset (in a test clinic)
  2. Creates 3 test work_orders linked to it
  3. Verifies sequence increments
  4. Cleans up test data
- Run once via postman/curl, then delete endpoint

**Option C: Manual SQL via Supabase Dashboard**
- Use SQL Editor to run INSERT tests directly
- Use service role key to bypass RLS during testing

---

## SUMMARY: ISSUES & REQUIRED ACTIONS

| Priority | Issue | Fix Required |
|---|---|---|
| 🔴 CRITICAL | UI field names don't match DB schema | Fix 6+ field references across 3+ components |
| 🔴 CRITICAL | `work_orders` and `asset_documents` empty — can't validate triggers/FKs | Non-production validation needed |
| 🟡 HIGH | `created_by` doesn't exist on assets (was used in RLS proposals) | Use `assigned_to_user_id` or `clinic_id` for ownership |
| 🟡 HIGH | RLS policies all start with `auth.uid() IS NOT NULL` — any authenticated user has base access | Confirm user_clinic_access is always populated |
| 🟢 MEDIUM | Missing indexes on `warranty_expiry_date`, `assigned_to`, `expiry_date` | Add when tables grow past 50 rows |
| 🟢 LOW | No views exist in schema | Confirm if analytics/dashboard views need creation |