/**
 * Clinical Documentation Routes
 * Canonical route definitions for the documentation module.
 * All navigation links should reference these constants.
 */
export const ClinicalDocRoutes = {
  // Encounter workspace: view/create/edit note for a specific encounter
  ENCOUNTER_WORKSPACE: (encounterId: string) => `/clinical-documentation/encounter/${encounterId}`,

  // Draft review: review a specific draft note before signing
  DRAFT_REVIEW: (draftId: string) => `/clinical-documentation/draft/${draftId}`,

  // Signed note view: read-only signed record
  SIGNED_NOTE: (signedNoteId: string) => `/clinical-documentation/signed/${signedNoteId}`,

  // Patient documentation hub: list all notes for a patient
  PATIENT_DOCS: (patientId: string) => `/clinical-documentation/patient/${patientId}`,

  // Case documentation: all documentation for a case
  CASE_DOCS: (caseId: string) => `/clinical-documentation/case/${caseId}`,
} as const;

// Module-level subRoutes (used with currentModule='clinical-documentation')
export const ClinicalDocSubRoutes = {
  ENCOUNTER_WORKSPACE: 'encounter-workspace',
  DRAFT_REVIEW: 'draft-review',
  SIGNED_NOTE: 'signed-note',
  PATIENT_DOCS: 'patient-documentation',
  CASE_DOCS: 'case-documentation',
} as const;