# AIMOS Clinical Documentation Intelligence Module - PRD

> **Version:** 1.0  
> **Status:** Build-Ready  
> **Date:** 2026-03-29  
> **Author:** Subagent (AIMOS Extension)  
> **Target:** Production deployment for Alberta physiotherapy clinic network

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Requirements](#2-product-requirements)
3. [Integration Blueprint](#3-integration-blueprint)
4. [Screen-by-Screen UX Specification](#4-screen-by-screen-ux-specification)
5. [Supabase Schema Recommendation](#5-supabase-schema-recommendation)
6. [Phased Build Roadmap](#6-phased-build-roadmap)
7. [KPI Stack](#7-kpi-stack)
8. [Governance Model](#8-governance-model)

---

## 1. Executive Summary

### Purpose

This PRD defines the **Clinical Documentation Intelligence Module** for AIMOS — a regulated clinical charting system that meets Alberta-specific privacy and documentation standards (HIA, PIPA, CPTA). This module extends the existing AIMOS enterprise platform, NOT a greenfield build.

### Vision

> **"Clinician-first charting that satisfies regulators, delights patients, and scales across Alberta's healthcare network."**

### Design Principles

| Principle | Description |
|-----------|-------------|
| **Regulatory First** | Every feature satisfies Alberta HIA, PIPA, and CPTA documentation requirements |
| **Human in the Chart** | AI assists but never replaces clinician judgment (Levels 0-4 model) |
| **Immutable Provenance** | Signed clinical notes are tamper-evident with full audit trails |
| **Federated Identity** | Reuse existing AIMOS patients, clinics, encounters — never duplicate |
| **Offline-Capable** | Rural Albertan clinics must chart with intermittent connectivity |

---

## 2. Product Requirements

### 2.1 Regulatory Baseline

#### Alberta Health Information Act (HIA)

- **Retention:** Minimum 10 years for active patient records, 25 years for disabled/WSCC
- **Access logs:** Every PHI view must be logged with user, timestamp, purpose
- **Breach notification:** Must detect and report within 72 hours
- **Consent:** Express consent required before disclosure (opt-in model)

#### Alberta Personal Information Protection Act (PIPA)

- **Purpose limitation:** Data collected only for stated clinical purposes
- **Accuracy:** Patient must be able to request correction
- **Security:** Reasonable safeguards (encryption at rest/in transit)
- **Individual access:** Patient right to access own record

#### College of Physical Therapists of Alberta (CPTA)

- **Standards of practice:** Documentation must be timely, accurate, complete
- **Progress notes:** Required within 48 hours of intervention
- **Discharge summaries:** Required within 30 days of discharge
- **Clinical reasoning:** Must show clinical decision-making trail
- **Co-signature:** Student therapist notes require PT co-signature

### 2.2 Core Product Pillars

| Pillar | Description |
|--------|-------------|
| **P1: Clinician Efficiency** | Reduce charting time by 40% via AI-assisted documentation |
| **P2: Regulatory Compliance** | Built-in compliance checks for HIA/PIPA/CPTA |
| **P3: Patient Safety** | Real-time flags, allergies, contraindication alerts |
| **P4: Interoperability** | FHIR R4 export for future provincial integration |
| **P5: Auditability** | Complete provenance from draft to signed record |

### 2.3 "Human in the Chart" Operating Model

The "Human in the Chart" model defines AI autonomy levels for clinical documentation:

| Level | Name | AI Role | Example |
|-------|------|--------|---------|
| **0** | Manual | No AI assistance | Clinician types everything |
| **1** | Transcription | Voice-to-text capture | AI scribes voice, clinician edits |
| **2** | Assistance | Auto-suggestions | AI suggests SOAP, clinician approves |
| **3** | Co-Pilot | Shared authoring | AI drafts, clinician reviews and signs |
| **4** | Autonomous | AI with oversight | AI generates, clinician can override |

**Policy Rule:** AI cannot exceed Level 3 for clinical decisions. Level 4 requires explicit patient consent and governance committee approval.

### 2.4 State-of-the-Art Features

| Feature | Description |
|---------|-------------|
| **Voice-first charting** | Mobile-responsive voice input for bedside charting |
| **Smart templates** | Condition-specific templates (back pain, post-op, sports rehab) |
| **Clinical reasoning capture** | Structured clinical decision logging |
| **Real-time drug interaction** | Integrated BC drug database (Alberta pharmacists) |
| **Image annotation** | Diagram-based SOAP (body map annotations) |
| **Video exercise attachment** | Patient-specific video exercises linked to notes |
| **Multi-language support** | English, French, Chinese, Punjabi patient materials |

---

## 3. Integration Blueprint

### 3.1 Extending Existing AIMOS Architecture

This module extends AIMOS by:

1. **Adding a new `clinical_documentation` module** to the navigation hierarchy
2. **Reusing existing tables** for patients, clinics, encounters, auth
3. **Extending RBAC** with clinical-specific roles
4. **Adding audit events** for PHI access compliance

### 3.2 Navigation Integration

In `navigation.ts`, add AFTER the existing `clinical` module:

```typescript
{
  key: 'clinical_documentation',
  label: 'Clinical Notes',
  description: 'Regulated clinical documentation and charting',
  icon: 'FileSignature',
  color: 'teal',
  gradient: 'from-teal-600 to-teal-700',
  subItems: [
    { key: 'dashboard', label: 'Clinician Dashboard', icon: 'LayoutDashboard', roles: ['clinician'] },
    { key: 'patients', label: 'Patient Registry', icon: 'Users', roles: ['clinician'] },
    { key: 'encounter', label: 'Live Encounter', icon: 'ClipboardList', roles: ['clinician'] },
    { key: 'drafts', label: 'Draft Review', icon: 'FileEdit', roles: ['clinician'] },
    { key: 'signed', label: 'Signed Records', icon: 'FileCheck', roles: ['clinician'] },
    { key: 'addenda', label: 'Addenda', icon: 'FilePlus', roles: ['clinician'] },
    { key: 'documents', label: 'Documents Center', icon: 'FileStack', roles: ['clinician'] },
    { key: 'comms', label: 'Communications', icon: 'MessageCircle', roles: ['clinician'] },
    { key: 'disclosures', label: 'Record Requests', icon: 'Share2', roles: ['clinician'] },
    { key: 'compliance', label: 'Compliance Center', icon: 'ShieldCheck', roles: ['executive', 'admin', 'clinic_manager'] },
    { key: 'ai-governance', label: 'AI Governance', icon: 'Bot', roles: ['executive', 'admin'] },
    { key: 'admin', label: 'Configuration', icon: 'Settings', roles: ['admin'] }
  ]
}
```

### 3.3 Shared Infrastructure to Reuse

| AIMOS Component | Reuse Strategy |
|---------------|----------------|
| **Auth (auth.users)** | Same Supabase auth — clinicians log in via existing login |
| **user_profiles** | Extend with clinical_role, license_number, cpta_id |
| **organizations** | Reference via organization_id for multi-clinic |
| **regions** | Reference for regional compliance reporting |
| **employee_assignments** | Link clinician to clinic assignment |
| **audit_events** | Extend with clinical_access event type |
| **notifications** | Same system for clinical alerts |

### 3.4 Data Model Integration

**NEW tables should reference EXISTING AIMOS tables:**

```sql
-- Patient reference (existing - DO NOT DUPLICATE)
-- Reference via: patient_id (to be created in AIMOS patient module)

-- Clinic reference (existing)
REFERENCES organizations(id) -- for clinic organization

-- Encounter reference (existing or new)
REFERENCES clinical_encounters(id) -- link to appointment/visit

-- User/clinician reference
REFERENCES auth.users(id) -- forclinician author

-- RBAC extension
REFERENCES enterprise_roles(id) -- extend with clinical roles
```

### 3.5 NOT Duplicate

The Clinical Documentation module MUST NOT duplicate:

- Patient identity (name, DOB, contact) — use existing patient table
- Authentication — use existing auth.users
- Clinic master data — use existing organizations
- User master data — use existing user_profiles
- Billing/claims — use existing revenue module

---

## 4. Screen-by-Screen UX Specification

### 4.1 Clinician Dashboard

| Attribute | Value |
|-----------|-------|
| **Purpose** | Daily worklist, pending notes, alerts |
| **Layout** | 3-column: Today's Patients / Pending Drafts / Alerts |

**Components:**
- Today's patient list with visit status
- Pending draft count badge
- Critical alerts (allergies, missed follow-ups)
- Quick-start encounter button

**UX Behaviors:**
- Auto-sort by appointment time
- One-click visit launch
- Real-time sync with schedule module

**Blocking Rules:**
- Must complete mandatory training before access
- Must have active license on file

**Privacy:**
- Minimum necessary: only today's assigned patients visible

---

### 4.2 Patient Registry and Search

| Attribute | Value |
|-----------|-------|
| **Purpose** | Find and select patients for documentation |
| **Layout** | Search bar + tabular results |

**Components:**
- Global search (name, MRN, DOB)
- Filter by clinic, status, condition
- Recent patients list
- Favorites/starred patients

**UX Behaviors:**
- Type-ahead search with instant results
- Keyboard navigation (arrow keys, Enter to select)
- Mobile-optimized tap targets

**Blocking Rules:**
- Search only within assigned clinic(s)

**Privacy:**
- Audit log: every search query logged to audit_events

---

### 4.3 Patient Chart (Longitudinal)

| Attribute | Value |
|-----------|-------|
| **Purpose** | Full patient history across all visits |
| **Layout** | Timeline view (vertical scroll) |

**Components:**
- Patient header (demographics, allergies, alerts)
- Timeline of encounters
- Filter by date range, type, clinician
- Collapse/expand encounters

**UX Behaviors:**
- Infinite scroll with virtualization
- Click encounter to expand
- Export to PDF (for disclosures)

**Blocking Rules:**
- Must have treating relationship (or admin override)

**Privacy:**
- Full audit trail: every view logged
- HIA: access purpose required

---

### 4.4 Pre-Visit Brief

| Attribute | Value |
|-----------|-------|
| **Purpose** | Review patient before encounter |
| **Layout** | Single-page summary card |

**Components:**
- Last visit summary
- Active problem list
- Current medications
- Care plan highlights
- Pending tasks/reminders

**UX Behaviors:**
- Auto-populate from last visit
- One-click launch to encounter
- Flag for chart review

**Blocking Rules:**
- Must be scheduled for today

**Privacy:**
- Same as Patient Chart

---

### 4.5 Live Encounter Workspace (Flagship)

| Attribute | Value |
|-----------|-------|
| **Purpose** | Real-time clinical documentation during patient visit |
| **Layout** | **3-column layout:** |

```
┌─────────────────┬─────────────────┬─────────────────┐
│   PATIENT INFO   │  SOAP EDITOR     │  TOOLS & AI      │
│   (Left Panel)  │  (Center)       │  (Right Panel)  │
│                 │                 │                 │
│ - Demographics  │ - Subjective    │ - Templates     │
│ - Allergies    │ - Objective     │ - AI Assist     │
│ - Alerts      │ - Assessment     │ - Quick Texts   │
│ - History     │ - Plan          │ - Diagnoses     │
│ - Meds        │                 │ - Exercises    │
│                 │                 │ - Referrals    │
└─────────────────┴─────────────────┴─────────────────┘
```

**Left Panel — Patient Info:**
- Collapsible header with demographics
- Allergy/adverse reaction alerts (red banner)
- Active problem list
- Recent visit timeline (last 3)
- Current medications
- Care plan summary

**Center Panel — SOAP Editor:**
- Tabbed sections: Subjective | Objective | Assessment | Plan
- Rich text editor with formatting
- Voice input button
- Template insertion
- Smart auto-complete
- Timestamp on first keystroke (compliance)

**Right Panel — Tools & AI:**
- Template selector dropdown
- AI assist (Level 1-3 based on user setting)
- Diagnosis picker (ICD-10-CA)
- Procedure codes (CPT-BC)
- Exercise attachment
- Referral generator
- Save as Draft / Sign & Close buttons

**UX Behaviors:**
- Auto-save every 30 seconds
- Offline-capable (service worker)
- Voice input toggle
- Keyboard shortcuts (Ctrl+S save, Ctrl+Enter sign)
- Conflict detection (if another clinician editing)

**Blocking Rules:**
- Cannot sign without Subjective entry
- Requires allergy check acknowledgment
- Must select diagnosis for billing

**Privacy:**
- Session timeout: 15 minutes idle
- PHI masking option in settings

---

### 4.6 Draft Review and Signing

| Attribute | Value |
|-----------|-------|
| **Purpose** | Review, edit, and sign clinical notes |
| **Layout** | Full-screen editor with review panel |

**Components:**
- Full note display (read-only)
- Edit mode toggle
- Co-signature workflow (for students)
- Signature pad / click-to-sign
- Amendment notes field

**UX Behaviors:**
- Review checklist (all sections present)
- One-click sign and close
- Decline with feedback

**Blocking Rules:**
- Cannot sign if fields missing (CPTA)
- Co-signature required for student notes
- 48-hour signing deadline (CPTA)

**Privacy:**
- Signed notes are IMMUTABLE (see Section 5.4)

---

### 4.7 Signed Record Viewer (Immutable)

| Attribute | Value |
|-----------|-------|
| **Purpose** | View tamper-evident signed clinical notes |
| **Layout** | Read-only with audit trail |

**Components:**
- Rendered note (immutable)
- Digital signature badge
- Audit trail panel (viewable)
- Timestamp chain
- PDF export

**UX Behaviors:**
- Read-only by default
- Request addendum (not edit)
- Print with watermarks

**Blocking Rules:**
- Cannot edit signed notes
- 10-year retention (See HIA)

**Privacy:**
- Full audit log required for every view

---

### 4.8 Addendum / Correction Workflow

| Attribute | Value |
|-----------|-------|
| **Purpose** | Add new information to signed records |
| **Layout** | Linked addendum form |

**Components:**
- Original note link
- Addendum text editor
- Reason dropdown (error correction, new information, clarifica...)
- Attach to original

**UX Behaviors:**
- New timestamp for addendum
- Links to original (not replaces)
- Both visible in timeline

**Blocking Rules:**
- Must cite reason
- Cannot delete original (HIA)

**Privacy:**
- Original preserved, addendum appended

---

### 4.9 Documents Center

| Attribute | Value |
|-----------|-------|
| **Purpose** | Manage clinical documents (referrals, reports, external) |
| **Layout** | File manager interface |

**Components:**
- Folder structure by patient
- Upload/download
- Document types (referral, report, imaging)
- Search within documents
- eSign support

**UX Behaviors:**
- Drag-and-drop upload
- Auto-classify by content
- Link to encounter

**Blocking Rules:**
- Max file size: 25MB
- Allowed types: PDF, JPG, PNG, DICOM

**Privacy:**
- Encryption at rest required

---

### 4.10 Communications Log

| Attribute | Value |
|-----------|-------|
| **Purpose** | Log all patient communication (phone, email, portal) |
| **Layout** | Chronological log |

**Components:**
- Communication type icons
- Message preview
- Contact method
- Outcome tags

**UX Behaviors:**
- Auto-log from patient portal
- Manual entry option
- Link to encounter

**Blocking Rules:**
- Required for clinical communications

**Privacy:**
- Part of medical record

---

### 4.11 Record Request / Disclosure Center

| Attribute | Value |
|-----------|-------|
| **Purpose** | Handle patient access requests and third-party disclosures |
| **Layout** | Queue + detail view |

**Components:**
- Request queue (inbound)
- Disclosure workflow
- Patient consent tracking
- Audit certificate generator

**UX Behaviors:**
- Approve/deny with reason
- Auto-generate disclosure package
- Track patient notification

**Blocking Rules:**
- Requires patient consent (PIPA)
- 30-day response deadline (HIA)

**Privacy:**
- Full audit of disclosures required

---

### 4.12 Compliance Command Center

| Attribute | Value |
|-----------|-------|
| **Purpose** | Admin oversight of clinical documentation compliance |
| **Layout** | Dashboard with metrics |

**Components:**
- Compliance scorecards by clinic
- Lagging notes report
- Missing signatures
- Audit log explorer
- Breach detection alerts

**UX Behaviors:**
- Drill-down by clinic/region
- Export compliance reports
- Alert thresholds

**Blocking Rules:**
- Admin only access

**Privacy:**
- Aggregate only (no PHI)

---

### 4.13 AI Governance Console

| Attribute | Value |
|-----------|-------|
| **Purpose** | Configure and monitor AI documentation assist |
| **Layout** | Settings + monitoring |

**Components:**
- AI Level configuration per role
- Usage statistics
- Error rate monitoring
- Patient consent tracking
- Model version control

**UX Behaviors:**
- Toggle AI assist on/off
- Review flagged outputs
- Audit AI decisions

**Blocking Rules:**
- Executive/Admin only

**Privacy:**
- No patient data in logs (aggregate only)

---

### 4.14 Admin Configuration

| Attribute | Value |
|-----------|-------|
| **Purpose** | System configuration for clinical documentation |
| **Layout** | Settings panels |

**Components:**
- Template management
- Auto-save intervals
- Retention policies
- Integration settings
- User clinical roles
- License management

**UX Behaviors:**
- CRUD templates
- Clone from library
- Version control

**Blocking Rules:**
- Admin only

**Privacy:**
- Configuration only (no PHI)

---

## 5. Supabase Schema Recommendation

### 5.1 New Tables to Add

```sql
-- ═════════════════════════════════════════════════════════════
-- CLINICAL DOCUMENTATION MODULE TABLES
-- ═════════════════════════════════════════════════════════════

-- Clinical encounters (links to appointment/visit)
CREATE TABLE IF NOT EXISTS clinical_encounters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL, -- FK to patients (to be created in AIMOS)
  clinic_id UUID NOT NULL, -- FK to organizations
  clinician_id UUID NOT NULL, -- FK to auth.users
  encounter_date DATE NOT NULL,
  encounter_type VARCHAR(50) NOT NULL, -- initial, follow-up, discharge, etc.
  status VARCHAR(20) DEFAULT 'in_progress', -- draft, pending_signature, signed, amended
  signed_at TIMESTAMPTZ,
  signed_by UUID, -- FK to auth.users
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clinical notes (SOAP structure)
CREATE TABLE IF NOT EXISTS clinical_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id UUID NOT NULL, -- FK to clinical_encounters
  clinician_id UUID NOT NULL, -- FK to auth.users
  subjective TEXT,
  objective TEXT,
  assessment TEXT,
  plan TEXT,
  diagnosis_codes TEXT[], -- ICD-10-CA codes
  procedure_codes TEXT[], -- CPT-BC codes
  note_version INTEGER DEFAULT 1,
  is_draft BOOLEAN DEFAULT true,
  signed_at TIMESTAMPTZ,
  digital_signature BYTEA, -- Cryptographic signature
  signature_hash VARCHAR(256), -- SHA-256 hash for integrity
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clinical addenda (appended to signed notes)
CREATE TABLE IF NOT EXISTS clinical_addenda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_note_id UUID NOT NULL, -- FK to clinical_notes
  clinician_id UUID NOT NULL, -- FK to auth.users
  addendum_text TEXT NOT NULL,
  reason VARCHAR(100) NOT NULL, -- error_correction, new_information, clarification
  is_signed BOOLEAN DEFAULT false,
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clinical document attachments
CREATE TABLE IF NOT EXISTS clinical_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL, -- FK to patients
  encounter_id UUID, -- FK to clinical_encounters (nullable)
  document_type VARCHAR(50) NOT NULL, -- referral, report, imaging, other
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_hash VARCHAR(256), -- For integrity verification
  uploaded_by UUID NOT NULL, -- FK to auth.users
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Communications log
CREATE TABLE IF NOT EXISTS clinical_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  clinician_id UUID NOT NULL,
  encounter_id UUID,
  communication_type VARCHAR(50) NOT NULL, -- phone, email, portal, in_person
  direction VARCHAR(20) NOT NULL, -- inbound, outbound
  subject VARCHAR(255),
  message TEXT,
  outcome VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Record disclosure requests
CREATE TABLE IF NOT EXISTS clinical_disclosure_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  requested_by UUID NOT NULL, -- FK to auth.users (requester)
  request_purpose TEXT,
  disclosure_type VARCHAR(50) NOT NULL, -- patient_access, third_party, legal, research
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, denied, fulfilled
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  fulfilled_at TIMESTAMPTZ,
  patient_consent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI assist logs (for governance)
CREATE TABLE IF NOT EXISTS clinical_ai_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinician_id UUID NOT NULL,
  encounter_id UUID,
  ai_level INTEGER NOT NULL, -- 1, 2, or 3
  prompt TEXT,
  response_text TEXT,
  approved_by_clinician BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clinical templates (user-created)
CREATE TABLE IF NOT EXISTS clinical_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID, -- FK to organizations (nullable for global)
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50), -- initial, follow_up, discharge, etc.
  template_json JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_by UUID NOT NULL, -- FK to auth.users
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.2 Existing Tables to Reference via FK

```sql
-- Reference existing AIMOS tables

-- FROM: organizations (clinic master)
-- Usage: clinical_encounters.clinic_id

-- FROM: auth.users (clinician)
-- Usage: clinical_encounters.clinician_id, clinical_notes.clinician_id

-- FROM: user_profiles (extended profile data)
-- Usage: Link for license_number, cpta_id

-- FROM: existing audit_events (extend)
-- Usage: Reference same table for clinical_access events

-- FROM: patients (TBD in AIMOS clinical)
-- Usage: clinical_encounters.patient_id, clinical_documents.patient_id
```

### 5.3 RLS Strategy (Extend Existing RBAC)

```sql
-- Row Level Security for clinical tables

-- Enable RLS on all clinical tables
ALTER TABLE clinical_encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_addenda ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_disclosure_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_ai_logs ENABLE ROW LEVEL SECURITY;

-- Clinician: can view/edit own patients
CREATE POLICY "clinicians_own_encounters" ON clinical_encounters
  FOR ALL USING (
    clinician_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM employee_assignments ea
      JOIN user_profiles up ON up.id = auth.uid()
      WHERE ea.user_id = auth.uid()
      AND ea.clinic_id = clinical_encounters.clinic_id
    )
  );

-- Executive/Admin: full access
CREATE POLICY "exec_full_access" ON clinical_encounters
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('executive', 'admin')
    )
  );

-- Read access for disclosure (with audit)
CREATE POLICY "disclosure_read" ON clinical_encounters
  FOR SELECT WITH CHECK (
    EXISTS (
      SELECT 1 FROM audit_events
      WHERE user_id = auth.uid()
      AND event_type = 'clinical_access'
      AND purpose IS NOT NULL
    )
  );
```

### 5.4 Signed Note Immutability Pattern

```sql
-- ═════════════════════════════════════════════════════════════
-- IMMUTABLE SIGNED NOTE PATTERN
-- ═════════════════════════════════════════════════════���═���═════

-- 1. On sign: Lock the note (RLS + trigger)
CREATE OR REPLACE FUNCTION clinical.sign_note()
RETURNS TRIGGER AS $$
BEGIN
  -- Set signed timestamp
  NEW.signed_at := NOW();
  NEW.is_draft := false;
  
  -- Generate cryptographic hash of content
  NEW.signature_hash := encode(
    sha256(
      (NEW.subjective || NEW.objective || NEW.assessment || NEW.plan)::bytea
    ),
    'hex'
  );
  
  -- Store digital signature (from clinician's key)
  -- Note: In production, use proper key management
  NEW.digital_signature := encode(
    gen_random_bytes(32),
    'hex'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;

-- Trigger to run on note signing
CREATE TRIGGER trigger_sign_note
  BEFORE UPDATE ON clinical_notes
  FOR EACH ROW
  WHEN (NEW.is_draft = false AND OLD.is_draft = true)
  EXECUTE FUNCTION clinical.sign_note();

-- 2. Prevent updates to signed notes
CREATE OR REPLACE FUNCTION clinical.prevent_signed_update()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Cannot modify signed clinical note. Use addendum instead.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_signed_update
  BEFORE UPDATE ON clinical_notes
  FOR EACH ROW
  WHEN (OLD.is_draft = false)
  EXECUTE FUNCTION clinical.prevent_signed_update();

-- 3. Full audit trail
CREATE TABLE IF NOT EXISTS clinical_note_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL,
  clinician_id UUID NOT NULL,
  action VARCHAR(20) NOT NULL, -- created, viewed, signed, addended
  purpose TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.5 Audit Event Design

```sql
-- Extend existing audit_events for clinical access (HIA compliance)

-- Add event types to existing audit_events or create new table
CREATE TABLE IF NOT EXISTS clinical_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- FK to auth.users
  patient_id UUID NOT NULL, -- FK to patients
  encounter_id UUID,
  event_type VARCHAR(50) NOT NULL, -- clinical_view, clinical_create, clinical_sign, clinical_disclose
  purpose VARCHAR(255), -- Required for PHI access (HIA)
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Log every PHI access automatically
CREATE OR REPLACE FUNCTION clinical.log_access()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO clinical_audit_events (user_id, patient_id, encounter_id, event_type, purpose)
  VALUES (
    auth.uid(),
    NEW.patient_id,
    NEW.id,
    TG_OP || '_' || TG_TABLE_NAME,
    current_setting('clinical.access_purpose', true)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 6. Phased Build Roadmap

### Phase 1: Regulated Charting Core (Weeks 1-6)

| Week | Deliverable |
|------|-------------|
| 1-2 | Database schema, RLS, basic CRUD APIs |
| 3-4 | Clinician Dashboard, Patient Registry |
| 5 | Live Encounter (3-column) core |
| 6 | Draft Review, Signing flow |

**MVP Success Criteria:**
- [ ] Can create and sign a clinical note
- [ ] Signed notes are immutable
- [ ] Full audit trail exists
- [ ] Basic compliance reports work

---

### Phase 2: Clinical AI Assist (Weeks 7-12)

| Week | Deliverable |
|------|-------------|
| 7-8 | Voice-to-text integration |
| 9-10 | Smart templates + auto-complete |
| 11 | AI suggestion engine (Level 2) |
| 12 | AI governance console |

**Success Criteria:**
- [ ] Voice input works on mobile
- [ ] AI suggests SOAP content
- [ ] Clinician can override AI suggestions
- [ ] Audit logs show AI interactions

---

### Phase 3: Enterprise Compliance (Weeks 13-18)

| Week | Deliverable |
|------|-------------|
| 13-14 | Documents Center + uploads |
| 15 | Communications log |
| 16-17 | Disclosure request workflow |
| 18 | Compliance Command Center |

**Success Criteria:**
- [ ] Can upload/manage documents
- [ ] Disclosure requests tracked
- [ ] Compliance scores visible by clinic

---

### Phase 4: Advanced Autonomy (Weeks 19-24)

| Week | Deliverable |
|------|-------------|
| 19-20 | Exercise attachment + video |
| 21-22 | FHIR R4 export |
| 23-24 | Advanced analytics + reporting |

**Success Criteria:**
- [ ] Patient can receive exercises
- [ ] FHIR bundle export works
- [ ] Usage analytics dashboar

---

## 7. KPI Stack

### 7.1 Clinician KPIs

| KPI | Target | Measure |
|-----|-------|---------|
| **Charting time per visit** | < 5 minutes | Average note creation time |
| **Notes signed within 48h** | 95% | Signed within 48h / total notes |
| **Notes awaiting signature** | < 10 | Count of drafts > 48h old |
| **AI assist usage** | 60% | Notes with AI assist / total notes |
| **Template utilization** | 40% | Notes using templates / total |

### 7.2 Clinic KPIs

| KPI | Target | Measure |
|-----|-------|---------|
| **Compliance score** | > 90% | Notes meeting all CPTA requirements |
| **Average note completeness** | > 85% | Fields filled / total fields |
| **Pending signatures** | < 5% | Pending / total encounters |
| **Disclosure turnaround** | < 30 days | Days from request to fulfillment |
| **Audit log coverage** | 100% | PHI accesses logged |

### 7.3 Enterprise KPIs

| KPI | Target | Measure |
|-----|-------|---------|
| **Total patients documented** | Growing | Unique patients with notes |
| **Notes by region** | By target | Per region dashboard |
| **AI error rate** | < 1% | Corrections / AI-assisted notes |
| **Compliance across clinics** | > 90% | All clinics meeting targets |
| **Breach detection** | 100% within 72h | Detected and reported |

---

## 8. Governance Model

### 8.1 AI Use Policy Requirements

Per Alberta OIPC guidance on AI scribes:

1. **Transparency:** Patient must be informed AI is assisting
2. **Consent:** Explicit opt-in for AI-assisted notes
3. **Human oversight:** Clinician reviews and signs all AI output
4. **Accuracy:** AI outputs marked as "AI-assisted"
5. **Retention:** AI logs retained for 10+ years
6. **Auditability:** All AI interactions logged

### 8.2 PIA Requirements (Alberta OIPC AI Scribe Guidance)

The Privacy Impact Assessment must cover:

| Element | Requirement |
|---------|-------------|
| **Data flows** | Where PHI goes (AI providers) |
| **Storage** | At rest encryption |
| **Access logs** | Every PHI access logged |
| **Retention** | 10-year minimum |
| **Breach** | Notification procedures |
| **Third parties** | Data processing agreements |
| **AI training** | No PHI in model training |

### 8.3 Clinical AI Governance Committee

| Role | Responsibility |
|------|----------------|
| **Chair (CMIO)** | Overall clinical AI strategy |
| **Medical Director** | Clinical accuracy review |
| **Privacy Officer** | PIA compliance |
| **IT Lead** | Technical implementation |
| **Clinician Rep** | Front-line feedback (rotating) |
| **Legal Counsel** | Regulatory compliance |

**Meeting cadence:** Monthly (reviewing AI logs, approving new features)

**Decision authority:**
- Level 1-2: Department head
- Level 3: CMIO + Privacy Officer
- Level 4: Full committee vote

---

## Appendix A: Regulatory Quick Reference

| Regulation | Key Requirement | Module Coverage |
|-----------|----------------|---------------|
| HIA | 10-year retention | Note retention policies |
| HIA | Access logging | clinical_audit_events |
| HIA | Breach notification | Compliance Center alerts |
| PIPA | Consent | AI consent workflow |
| PIPA | Purpose limitation | Access controls |
| PIPA | Individual access | Disclosure Center |
| CPTA | 48h progress notes | Draft to sign workflow |
| CPTA | Clinical reasoning | Assessment field |
| CPTA | Co-signature | Student workflow |

---

## Appendix B: Data Dictionary

| Table | Description |
|-------|-------------|
| clinical_encounters | Clinical visit record |
| clinical_notes | SOAP note content |
| clinical_addenda | Corrections to signed notes |
| clinical_documents | File attachments |
| clinical_communications | Patient comms log |
| clinical_disclosure_requests | Patient/third-party requests |
| clinical_ai_logs | AI assist interactions |
| clinical_templates | Note templates |
| clinical_note_audit | Note-specific audit |
| clinical_audit_events | PHI access logs |

---

*End of Document*
