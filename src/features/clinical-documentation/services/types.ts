import type {
  Case,
  Consent,
  Encounter,
  Transcript,
  TranscriptSegment,
  NoteDraft,
  NoteDraftVersion,
  SignedNote,
  NoteAddendum,
  ClinicalDocument,
  CommunicationLog,
  RecordRequest,
  Disclosure,
  CorrectionRequest,
  DocumentationRisk,
  PreVisitBrief,
  AIGovernanceModel,
  AIPromptVersion,
  AIRun,
  BreakGlassEvent,
  RetentionPolicy,
  Vendor,
  DocumentationComplianceMetrics,
  PaginatedResult,
  PaginationParams,
} from '../types';

// ============================================================
// Documentation Service Interface
// ============================================================

export interface IDocumentationService {
  getPatientDocumentationSummary(
    patientId: string
  ): Promise<import('../types').PatientDocumentationSummaryDTO>;
  getPatientCases(
    patientId: string,
    pagination?: PaginationParams
  ): Promise<PaginatedResult<Case>>;
  getPatientConsents(
    patientId: string,
    activeOnly?: boolean
  ): Promise<Consent[]>;
  getActiveConsentsForEncounter(
    patientId: string,
    clinicId: string
  ): Promise<Consent[]>;
  createCase(
    patientId: string,
    clinicId: string,
    organizationId: string,
    data: Partial<Case>
  ): Promise<Case>;
  getEncountersForPatient(
    patientId: string,
    pagination?: PaginationParams
  ): Promise<PaginatedResult<Encounter>>;
  getEncounterWithRelations(
    encounterId: string
  ): Promise<import('../types').EncounterWithRelations>;
  getPreVisitBrief(
    patientId: string,
    encounterId: string
  ): Promise<PreVisitBrief | null>;
  generatePreVisitBrief(
    patientId: string,
    caseId: string,
    clinicId: string,
    encounterId?: string
  ): Promise<PreVisitBrief>;
  getDocumentationRisks(
    patientId: string,
    clinicId: string,
    unresolvedOnly?: boolean
  ): Promise<DocumentationRisk[]>;
  resolveDocumentationRisk(
    riskId: string,
    resolvedByUserId: string
  ): Promise<DocumentationRisk>;
  getComplianceMetrics(
    clinicId: string,
    period: string
  ): Promise<DocumentationComplianceMetrics>;
}

// ============================================================
// Encounter Service Interface
// ============================================================

export interface IEncounterService {
  createEncounter(input: import('../types').CreateEncounterInput): Promise<Encounter>;
  getEncounter(encounterId: string): Promise<Encounter>;
  updateEncounterState(
    input: import('../types').UpdateEncounterStateInput
  ): Promise<Encounter>;
  listEncountersByPatient(
    patientId: string,
    pagination?: PaginationParams
  ): Promise<PaginatedResult<Encounter>>;
  listEncountersByCase(caseId: string): Promise<Encounter[]>;
  listEncountersByClinic(
    clinicId: string,
    pagination?: PaginationParams
  ): Promise<PaginatedResult<Encounter>>;
  getEncounterTranscript(encounterId: string): Promise<Transcript | null>;
  getTranscriptSegments(transcriptId: string): Promise<TranscriptSegment[]>;
  uploadTranscript(
    encounterId: string,
    storagePath: string,
    createdByUserId: string
  ): Promise<Transcript>;
  processTranscript(
    transcriptId: string,
    createdByUserId: string
  ): Promise<Transcript>;
}

// ============================================================
// Note Service Interface
// ============================================================

export interface INoteService {
  createDraftNote(input: import('../types').CreateDraftNoteInput): Promise<NoteDraft>;
  getDraftNote(noteDraftId: string): Promise<NoteDraft>;
  updateDraftNote(
    noteDraftId: string,
    updates: Partial<NoteDraft>
  ): Promise<NoteDraft>;
  saveDraftVersion(
    input: import('../types').SaveDraftNoteVersionInput
  ): Promise<NoteDraftVersion>;
  getDraftVersions(noteDraftId: string): Promise<NoteDraftVersion[]>;
  getDraftNoteWithVersions(noteDraftId: string): Promise<import('../types').NoteDraftWithVersions>;
  validateDraftNote(
    noteDraftId: string,
    expectedSignature?: string
  ): Promise<{ valid: boolean; errors: string[] }>;
  signDraftNote(
    noteDraftId: string,
    signedByUserId: string
  ): Promise<SignedNote>;
  getSignedNote(signedNoteId: string): Promise<SignedNote>;
  getSignedNoteWithAddenda(signedNoteId: string): Promise<import('../types').SignedNoteWithAddenda>;
  listPatientSignedNotes(
    patientId: string,
    pagination?: PaginationParams
  ): Promise<PaginatedResult<SignedNote>>;
  listPatientDraftNotes(
    patientId: string,
    pagination?: PaginationParams
  ): Promise<PaginatedResult<NoteDraft>>;
  createAddendum(input: import('../types').CreateAddendumInput): Promise<NoteAddendum>;
  approveAddendum(
    addendumId: string,
    approvedByUserId: string
  ): Promise<NoteAddendum>;
  listAddendaForSignedNote(signedNoteId: string): Promise<NoteAddendum[]>;
}

// ============================================================
// Communication Service Interface
// ============================================================

export interface ICommunicationService {
  logCommunication(
    input: import('../types').CreateCommunicationInput
  ): Promise<CommunicationLog>;
  getCommunication(communicationId: string): Promise<CommunicationLog>;
  listCommunicationsByPatient(
    patientId: string,
    pagination?: PaginationParams
  ): Promise<PaginatedResult<CommunicationLog>>;
  listCommunicationsByCase(
    caseId: string,
    pagination?: PaginationParams
  ): Promise<PaginatedResult<CommunicationLog>>;
  listCommunicationsByEncounter(encounterId: string): Promise<CommunicationLog[]>;
  listCommunicationsByClinic(
    clinicId: string,
    pagination?: PaginationParams
  ): Promise<PaginatedResult<CommunicationLog>>;
  markCommunicationFollowUp(
    communicationId: string,
    requiresFollowUp: boolean
  ): Promise<CommunicationLog>;
  convertCommunicationToNote(
    communicationId: string,
    noteDraftId: string
  ): Promise<CommunicationLog>;
}

// ============================================================
// Document Service Interface
// ============================================================

export interface IDocumentService {
  uploadClinicalDocument(
    input: import('../types').UploadClinicalDocumentInput
  ): Promise<ClinicalDocument>;
  getClinicalDocument(documentId: string): Promise<ClinicalDocument>;
  listDocumentsByPatient(
    patientId: string,
    pagination?: PaginationParams
  ): Promise<PaginatedResult<ClinicalDocument>>;
  listDocumentsByCase(
    caseId: string,
    pagination?: PaginationParams
  ): Promise<PaginatedResult<ClinicalDocument>>;
  listDocumentsByClinic(
    clinicId: string,
    pagination?: PaginationParams
  ): Promise<PaginatedResult<ClinicalDocument>>;
  deleteClinicalDocument(documentId: string): Promise<void>;
  getDocumentDownloadUrl(documentId: string): Promise<string>;
}

// ============================================================
// Records Request Service Interface
// ============================================================

export interface IRecordsRequestService {
  createRecordRequest(
    input: import('../types').CreateRecordRequestInput
  ): Promise<RecordRequest>;
  getRecordRequest(requestId: string): Promise<RecordRequest>;
  updateRequestStatus(
    input: import('../types').UpdateRequestStatusInput
  ): Promise<RecordRequest>;
  listRecordRequestsByPatient(
    patientId: string,
    pagination?: PaginationParams
  ): Promise<PaginatedResult<RecordRequest>>;
  listRecordRequestsByClinic(
    clinicId: string,
    pagination?: PaginationParams
  ): Promise<PaginatedResult<RecordRequest>>;
  listPendingRequestsByClinic(clinicId: string): Promise<RecordRequest[]>;
  releaseDisclosure(
    input: import('../types').ReleaseDisclosureInput
  ): Promise<Disclosure>;
  listDisclosuresByRequest(requestId: string): Promise<Disclosure[]>;
  createCorrectionRequest(
    input: import('../types').CreateCorrectionRequestInput
  ): Promise<CorrectionRequest>;
  getCorrectionRequest(requestId: string): Promise<CorrectionRequest>;
  updateCorrectionRequestStatus(
    requestId: string,
    status: import('../types').CorrectionRequestStatus,
    resolutionNotes?: string,
    resolvedAt?: string
  ): Promise<CorrectionRequest>;
  listCorrectionRequestsByPatient(
    patientId: string,
    pagination?: PaginationParams
  ): Promise<PaginatedResult<CorrectionRequest>>;
  listCorrectionRequestsByClinic(
    clinicId: string,
    pagination?: PaginationParams
  ): Promise<PaginatedResult<CorrectionRequest>>;
}

// ============================================================
// Compliance Service Interface
// ============================================================

export interface IComplianceService {
  getComplianceMetrics(
    clinicId: string,
    period: string
  ): Promise<DocumentationComplianceMetrics>;
  getRiskFlagSummary(
    clinicId: string,
    period: string
  ): Promise<{ level_counts: Record<string, number>; total: number }>;
  getDocumentationTimeliness(
    clinicId: string,
    period: string
  ): Promise<{ on_time: number; late: number; overdue: number }>;
  getSignatureCompliance(
    clinicId: string,
    period: string
  ): Promise<{ signed: number; unsigned: number; rate: number }>;
  recordBreakGlassEvent(
    patientId: string,
    clinicId: string,
    userId: string,
    reason: string
  ): Promise<BreakGlassEvent>;
  listBreakGlassEvents(
    clinicId: string,
    patientId?: string,
    pagination?: PaginationParams
  ): Promise<PaginatedResult<BreakGlassEvent>>;
  approveBreakGlassEvent(
    eventId: string,
    approvedByUserId: string
  ): Promise<BreakGlassEvent>;
  getRetentionPolicies(
    organizationId: string
  ): Promise<RetentionPolicy[]>;
  upsertRetentionPolicy(
    organizationId: string,
    recordCategory: string,
    retainYears: number,
    minorRule: boolean,
    active: boolean
  ): Promise<RetentionPolicy>;
}

// ============================================================
// AI Governance Service Interface
// ============================================================

export interface IAIGovernanceService {
  listAIModels(clinicId?: string): Promise<AIGovernanceModel[]>;
  getAIModel(modelId: string): Promise<AIGovernanceModel>;
  approveAIModel(
    modelId: string,
    approvedByUserId: string
  ): Promise<AIGovernanceModel>;
  registerAIModel(
    name: string,
    vendor: string,
    purpose: string,
    config?: Record<string, unknown>
  ): Promise<AIGovernanceModel>;
  listPromptVersions(modelId: string): Promise<AIPromptVersion[]>;
  getActivePromptVersion(
    modelId: string,
    promptKey: string
  ): Promise<AIPromptVersion | null>;
  createPromptVersion(
    modelId: string,
    promptKey: string,
    version: number,
    promptText: string
  ): Promise<AIPromptVersion>;
  activatePromptVersion(promptVersionId: string): Promise<AIPromptVersion>;
  listAIRuns(
    clinicId: string,
    pagination?: PaginationParams
  ): Promise<PaginatedResult<AIRun>>;
  getAIRun(runId: string): Promise<AIRun>;
  createAIRun(
    clinicId: string,
    patientId: string,
    modelId: string,
    taskType: string,
    createdByUserId: string,
    options?: {
      encounterId?: string;
      noteDraftId?: string;
      promptVersionId?: string;
      inputMetadata?: Record<string, unknown>;
    }
  ): Promise<AIRun>;
  updateAIRunOutput(
    runId: string,
    outputMetadata: Record<string, unknown>
  ): Promise<AIRun>;
  updateAIThresholds(
    input: import('../types').AIThresholdUpdateInput
  ): Promise<{ model_id: string; thresholds: Record<string, number> }>;
  listVendors(organizationId?: string): Promise<Vendor[]>;
  registerVendor(
    organizationId: string,
    name: string,
    serviceType: string,
    riskLevel: import('../types').VendorRiskLevel,
    securityControls?: Record<string, unknown>
  ): Promise<Vendor>;
  updateVendorStatus(
    vendorId: string,
    contractStatus: import('../types').ContractStatus
  ): Promise<Vendor>;
}