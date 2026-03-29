// ============================================================
// AIMOS Clinical Documentation Intelligence - Type Definitions
// ============================================================

// ---- Enums / Union Types ----

export type CaseStatus = 'active' | 'closed' | 'suspended' | 'pending_discharge';
export type ConsentType = 'treatment' | 'research' | 'communication' | 'data_sharing' | 'ai_assisted';
export type ConsentStatus = 'pending' | 'granted' | 'revoked' | 'expired' | 'withdrawn';
export type EncounterType = 'initial' | 'followup' | 'assessment' | 'reassessment' | 'discharge' | 'telehealth' | 'emergency';
export type EncounterModality = 'in_person' | 'telehealth' | 'hybrid';
export type EncounterStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
export type CaptureStatus = 'idle' | 'recording' | 'processing' | 'ready' | 'failed';
export type DiarizationStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type TranscriptStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'redacted';
export type NoteType = 'soap' | 'progress' | 'initial' | 'discharge' | 'assessment' | 'referral' | 'letter' | 'custom';
export type NoteStatus = 'draft' | 'in_review' | 'signed' | 'amended' | 'archived';
export type SourceMode = 'manual' | 'ai_assisted' | 'transcribed' | 'imported';
export type SignedNoteStatus = 'active' | 'amended' | 'superseded' | 'locked';
export type AddendumType = 'correction' | 'clarification' | 'addition' | 'restatement';
export type CommunicationType = 'phone' | 'email' | 'portal_message' | 'sms' | 'in_person' | 'video' | 'letter' | 'other';
export type CommunicationDirection = 'inbound' | 'outbound' | 'internal';
export type RecordRequestType = 'patient_access' | 'third_party' | 'legal' | 'insurance' | 'research' | 'quality_review';
export type RecordRequestStatus = 'received' | 'reviewing' | 'approved' | 'partially_released' | 'released' | 'denied' | 'cancelled' | 'expired';
export type DisclosureDeliveryMethod = 'email' | 'portal' | 'mail' | 'fax' | 'in_person' | 'encrypted_electronic';
export type CorrectionRequestStatus = 'received' | 'reviewing' | 'approved' | 'denied' | 'partially_corrected' | 'implemented';
export type DocumentationRiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type ContractStatus = 'active' | 'pending' | 'expired' | 'terminated';
export type VendorRiskLevel = 'low' | 'medium' | 'high' | 'critical';

// ---- Core Entity Types ----

export interface Case {
  id: string;
  patient_id: string;
  clinic_id: string;
  organization_id: string;
  payer_type: string | null;
  payer_name: string | null;
  referral_source: string | null;
  case_status: CaseStatus;
  tags: string[] | null;
  opened_at: string;
  closed_at: string | null;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Consent {
  id: string;
  patient_id: string;
  case_id: string | null;
  clinic_id: string;
  consent_type: ConsentType;
  status: ConsentStatus;
  granted_at: string | null;
  revoked_at: string | null;
  expires_at: string | null;
  captured_by_user_id: string | null;
  document_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Encounter {
  id: string;
  appointment_id: string | null;
  patient_id: string;
  case_id: string | null;
  clinic_id: string;
  provider_user_id: string;
  encounter_type: EncounterType;
  modality: EncounterModality;
  status: EncounterStatus;
  ambient_capture_enabled: boolean;
  capture_status: CaptureStatus;
  scheduled_start: string | null;
  actual_start: string | null;
  actual_end: string | null;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Transcript {
  id: string;
  encounter_id: string;
  clinic_id: string;
  storage_path: string | null;
  diarization_status: DiarizationStatus;
  transcript_status: TranscriptStatus;
  source_language: string;
  confidence: number | null;
  created_by_user_id: string;
  created_at: string;
}

export interface TranscriptSegment {
  id: string;
  transcript_id: string;
  start_ms: number;
  end_ms: number;
  speaker_label: string | null;
  text: string;
  confidence: number | null;
  created_at: string;
}

export interface NoteDraft {
  id: string;
  encounter_id: string | null;
  patient_id: string;
  case_id: string | null;
  clinic_id: string;
  author_user_id: string;
  note_type: NoteType;
  status: NoteStatus;
  source_mode: SourceMode;
  structured_payload: Record<string, unknown> | null;
  plain_text: string | null;
  completeness_score: number | null;
  risk_score: number | null;
  payer_readiness_score: number | null;
  current_version: number;
  created_at: string;
  updated_at: string;
}

export interface NoteDraftVersion {
  id: string;
  note_draft_id: string;
  version_number: number;
  structured_payload: Record<string, unknown> | null;
  plain_text: string | null;
  provenance_payload: Record<string, unknown> | null;
  ai_output_metadata: Record<string, unknown> | null;
  created_by_user_id: string;
  created_at: string;
}

export interface SignedNote {
  id: string;
  note_draft_id: string;
  encounter_id: string | null;
  patient_id: string;
  case_id: string | null;
  clinic_id: string;
  note_type: NoteType;
  signed_payload: Record<string, unknown> | null;
  signed_text: string | null;
  version_number: number;
  signed_by_user_id: string;
  signed_at: string;
  version_hash: string | null;
  status: SignedNoteStatus;
}

export interface NoteAddendum {
  id: string;
  signed_note_id: string;
  clinic_id: string;
  addendum_type: AddendumType;
  reason: string;
  addendum_text: string;
  created_by_user_id: string;
  approved_by_user_id: string | null;
  approved_at: string | null;
  created_at: string;
}

export interface ClinicalDocument {
  id: string;
  patient_id: string;
  case_id: string | null;
  clinic_id: string;
  document_type: string;
  file_name: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  uploaded_by_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CommunicationLog {
  id: string;
  patient_id: string;
  case_id: string | null;
  encounter_id: string | null;
  clinic_id: string;
  communication_type: CommunicationType;
  direction: CommunicationDirection;
  occurred_at: string;
  summary_text: string | null;
  participants: string[] | null;
  captured_by_user_id: string;
  requires_follow_up: boolean;
  converted_to_note_id: string | null;
  created_at: string;
}

export interface RecordRequest {
  id: string;
  patient_id: string;
  case_id: string | null;
  clinic_id: string;
  request_type: RecordRequestType;
  requester_name: string;
  requester_role: string | null;
  authority_basis: string | null;
  scope_description: string | null;
  status: RecordRequestStatus;
  received_at: string;
  completed_at: string | null;
  created_by_user_id: string;
  created_at: string;
}

export interface Disclosure {
  id: string;
  record_request_id: string;
  patient_id: string;
  clinic_id: string;
  disclosed_by_user_id: string;
  recipient_name: string;
  recipient_details: Record<string, unknown> | null;
  scope_description: string | null;
  delivery_method: DisclosureDeliveryMethod;
  disclosed_at: string;
  created_at: string;
}

export interface CorrectionRequest {
  id: string;
  patient_id: string;
  signed_note_id: string;
  clinic_id: string;
  requested_by: string;
  request_text: string;
  status: CorrectionRequestStatus;
  received_at: string;
  resolved_at: string | null;
  resolution_notes: string | null;
  created_by_user_id: string;
  created_at: string;
}

export interface DocumentationRisk {
  id: string;
  note_draft_id: string | null;
  patient_id: string;
  clinic_id: string;
  risk_level: DocumentationRiskLevel;
  risk_category: string;
  risk_description: string;
  flagged_at: string;
  resolved_at: string | null;
  resolved_by_user_id: string | null;
  notes: string | null;
}

export interface PreVisitBrief {
  id: string;
  patient_id: string;
  case_id: string;
  clinic_id: string;
  encounter_id: string | null;
  visit_date: string;
  brief_data: Record<string, unknown>;
  generated_at: string;
  created_by_user_id: string | null;
}

export interface AIGovernanceModel {
  id: string;
  name: string;
  vendor: string;
  purpose: string;
  approved: boolean;
  approved_at: string | null;
  config: Record<string, unknown> | null;
  created_at: string;
}

export interface AIPromptVersion {
  id: string;
  model_id: string;
  prompt_key: string;
  version: number;
  prompt_text: string;
  active: boolean;
  created_at: string;
}

export interface AIRun {
  id: string;
  clinic_id: string;
  patient_id: string;
  encounter_id: string | null;
  note_draft_id: string | null;
  model_id: string;
  prompt_version_id: string | null;
  task_type: string;
  input_metadata: Record<string, unknown> | null;
  output_metadata: Record<string, unknown> | null;
  human_review_required: boolean;
  created_by_user_id: string;
  created_at: string;
}

// ---- UI Model Types ----

export interface DocumentationSummary {
  patient_id: string;
  active_cases: number;
  active_consents: Consent[];
  recent_encounters: Encounter[];
  draft_notes: NoteDraft[];
  signed_notes: NoteDraft[];
  pending_requests: number;
  pending_addenda: number;
  risk_flag_count: number;
  last_signed_note_date: string | null;
}

export interface EncounterWithRelations extends Encounter {
  transcript?: Transcript | null;
  draft_notes?: NoteDraft[];
  signed_notes?: SignedNote[];
  communications?: CommunicationLog[];
}

export interface NoteDraftWithVersions extends NoteDraft {
  versions?: NoteDraftVersion[];
  risks?: DocumentationRisk[];
}

export interface SignedNoteWithAddenda extends SignedNote {
  addenda?: NoteAddendum[];
  original_draft?: NoteDraft;
}

export interface RecordRequestWithDisclosures extends RecordRequest {
  disclosures?: Disclosure[];
}

// ---- Structured Clinical Note Payload ----

export interface StructuredClinicalNotePayload {
  subjective?: {
    chief_complaint?: string;
    history_of_present_illness?: string;
    review_of_systems?: Record<string, string | boolean>;
    past_medical_history?: string[];
    medications?: Array<{ name: string; dosage: string; frequency: string }>;
    allergies?: string[];
  };
  objective?: {
    vital_signs?: Record<string, number | string>;
    physical_exam?: Record<string, string>;
    measurements?: Array<{ type: string; value: string; unit: string }>;
    observations?: string[];
  };
  assessment?: {
    diagnoses?: Array<{ code: string; description: string; severity?: string }>;
    clinical_reasoning?: string;
    functional_status?: string;
    prognosis?: string;
  };
  plan?: {
    treatment_goals?: string[];
    interventions?: Array<{ type: string; description: string; frequency?: string }>;
    referrals?: Array<{ specialty: string; reason: string }>;
    follow_up?: string;
    patient_education?: string[];
    medication_changes?: Array<{ action: string; medication: string; rationale: string }>;
  };
  signatures?: {
    author?: { user_id: string; name: string; signed_at: string };
    reviewer?: { user_id: string; name: string; signed_at: string } | null;
  };
  metadata?: {
    encounter_id?: string;
    note_type?: NoteType;
    created_at?: string;
    last_modified?: string;
    source_mode?: SourceMode;
    version?: number;
    ai_confidence_score?: number;
    risk_flags?: string[];
  };
}

// ---- AI Governance ----

export interface BreakGlassEvent {
  id: string;
  patient_id: string;
  clinic_id: string;
  user_id: string;
  reason: string;
  approved_by_user_id: string | null;
  created_at: string;
}

export interface RetentionPolicy {
  id: string;
  organization_id: string;
  record_category: string;
  retain_years: number;
  minor_rule: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Vendor {
  id: string;
  organization_id: string;
  name: string;
  service_type: string;
  contract_status: ContractStatus;
  risk_level: VendorRiskLevel;
  security_controls: Record<string, unknown> | null;
  active: boolean;
  created_at: string;
}

// ---- DTO Types ----

export interface PatientDocumentationSummaryDTO {
  patient_id: string;
  summary: DocumentationSummary;
  recent_notes: NoteDraft[];
  upcoming_encounters: Encounter[];
  active_consents: Consent[];
  pending_requests: RecordRequest[];
}

export interface CreateEncounterInput {
  appointment_id?: string;
  patient_id: string;
  case_id?: string;
  clinic_id: string;
  provider_user_id: string;
  encounter_type: EncounterType;
  modality: EncounterModality;
  scheduled_start?: string;
  ambient_capture_enabled?: boolean;
}

export interface UpdateEncounterStateInput {
  encounter_id: string;
  status?: EncounterStatus;
  capture_status?: CaptureStatus;
  actual_start?: string;
  actual_end?: string;
}

export interface CreateDraftNoteInput {
  encounter_id?: string;
  patient_id: string;
  case_id?: string;
  clinic_id: string;
  author_user_id: string;
  note_type: NoteType;
  source_mode?: SourceMode;
  structured_payload?: Record<string, unknown>;
  plain_text?: string;
}

export interface SaveDraftNoteVersionInput {
  note_draft_id: string;
  version_number: number;
  structured_payload: Record<string, unknown>;
  plain_text?: string;
  provenance_payload?: Record<string, unknown>;
  ai_output_metadata?: Record<string, unknown>;
  created_by_user_id: string;
}

export interface CreateAddendumInput {
  signed_note_id: string;
  clinic_id: string;
  addendum_type: AddendumType;
  reason: string;
  addendum_text: string;
  created_by_user_id: string;
}

export interface CreateCommunicationInput {
  patient_id: string;
  case_id?: string;
  encounter_id?: string;
  clinic_id: string;
  communication_type: CommunicationType;
  direction: CommunicationDirection;
  occurred_at: string;
  summary_text?: string;
  participants?: string[];
  captured_by_user_id: string;
  requires_follow_up?: boolean;
}

export interface UploadClinicalDocumentInput {
  patient_id: string;
  case_id?: string;
  clinic_id: string;
  document_type: string;
  file_name: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  uploaded_by_user_id: string;
}

export interface CreateRecordRequestInput {
  patient_id: string;
  case_id?: string;
  clinic_id: string;
  request_type: RecordRequestType;
  requester_name: string;
  requester_role?: string;
  authority_basis?: string;
  scope_description?: string;
  received_at: string;
  created_by_user_id: string;
}

export interface ReleaseDisclosureInput {
  record_request_id: string;
  patient_id: string;
  clinic_id: string;
  disclosed_by_user_id: string;
  recipient_name: string;
  recipient_details?: Record<string, unknown>;
  scope_description?: string;
  delivery_method: DisclosureDeliveryMethod;
}

export interface CreateCorrectionRequestInput {
  patient_id: string;
  signed_note_id: string;
  clinic_id: string;
  requested_by: string;
  request_text: string;
  received_at: string;
  created_by_user_id: string;
}

export interface UpdateRequestStatusInput {
  request_id: string;
  status: RecordRequestStatus;
  completed_at?: string;
  resolution_notes?: string;
}

export interface AIThresholdUpdateInput {
  model_id: string;
  thresholds: Record<string, number>;
}

// ---- Pagination ----

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

// ---- Compliance Metrics ----

export interface DocumentationComplianceMetrics {
  clinic_id: string;
  period: string;
  total_encounters: number;
  notes_completed: number;
  notes_pending: number;
  notes_overdue: number;
  signature_rate: number;
  avg_completion_time_hours: number | null;
  addendum_count: number;
  correction_request_count: number;
  risk_flag_resolution_rate: number;
}

// ---- Permission Keys ----

export const DOCUMENTATION_PERMISSION_KEYS = {
  VIEW: 'documentation.view',
  EDIT_DRAFT: 'documentation.edit_draft',
  SIGN: 'documentation.sign',
  ADDENDUM: 'documentation.addendum',
  LOG_COMMUNICATION: 'communications.log',
  UPLOAD_DOCUMENT: 'documents.clinical_upload',
  MANAGE_REQUESTS: 'requests.manage',
  RELEASE_DISCLOSURE: 'disclosures.release',
  REVIEW_COMPLIANCE: 'compliance.documentation_review',
  MANAGE_AI_GOVERNANCE: 'ai_governance.documentation_manage',
} as const;

export type DocumentationPermissionKey =
  (typeof DOCUMENTATION_PERMISSION_KEYS)[keyof typeof DOCUMENTATION_PERMISSION_KEYS];

// ---- Barrel Export ----

export * from './index';