// Stable React Query key factory for all documentation queries

const doc = ['clinicalDocumentation'] as const;

export const documentationQueryKeys = {
  all: doc,
  summary: (patientId: string) => [...doc, 'summary', patientId],
  cases: (patientId: string) => [...doc, 'cases', patientId],
  consents: (patientId: string, activeOnly?: boolean) => [...doc, 'consents', patientId, { activeOnly }],
  activeConsents: (patientId: string, clinicId: string) => [...doc, 'activeConsents', patientId, clinicId],
  encounters: {
    all: [...doc, 'encounters'],
    patient: (patientId: string) => [...doc, 'encounters', 'patient', patientId],
    encounter: (encounterId: string) => [...doc, 'encounters', 'detail', encounterId],
    withRelations: (encounterId: string) => [...doc, 'encounters', 'withRelations', encounterId],
    clinic: (clinicId: string) => [...doc, 'encounters', 'clinic', clinicId],
    case: (caseId: string) => [...doc, 'encounters', 'case', caseId],
  },
  transcripts: {
    all: [...doc, 'transcripts'],
    encounter: (encounterId: string) => [...doc, 'transcripts', 'encounter', encounterId],
    segments: (transcriptId: string) => [...doc, 'transcripts', 'segments', transcriptId],
  },
  notes: {
    all: [...doc, 'notes'],
    drafts: {
      all: [...doc, 'notes', 'drafts'],
      patient: (patientId: string) => [...doc, 'notes', 'drafts', 'patient', patientId],
      detail: (noteDraftId: string) => [...doc, 'notes', 'drafts', 'detail', noteDraftId],
      versions: (noteDraftId: string) => [...doc, 'notes', 'drafts', 'versions', noteDraftId],
      withVersions: (noteDraftId: string) => [...doc, 'notes', 'drafts', 'withVersions', noteDraftId],
    },
    signed: {
      all: [...doc, 'notes', 'signed'],
      patient: (patientId: string) => [...doc, 'notes', 'signed', 'patient', patientId],
      detail: (signedNoteId: string) => [...doc, 'notes', 'signed', 'detail', signedNoteId],
      withAddenda: (signedNoteId: string) => [...doc, 'notes', 'signed', 'withAddenda', signedNoteId],
    },
    addenda: {
      all: [...doc, 'notes', 'addenda'],
      forSignedNote: (signedNoteId: string) => [...doc, 'notes', 'addenda', 'signedNote', signedNoteId],
    },
  },
  communications: {
    all: [...doc, 'communications'],
    patient: (patientId: string) => [...doc, 'communications', 'patient', patientId],
    case: (caseId: string) => [...doc, 'communications', 'case', caseId],
    encounter: (encounterId: string) => [...doc, 'communications', 'encounter', encounterId],
    clinic: (clinicId: string) => [...doc, 'communications', 'clinic', clinicId],
    detail: (communicationId: string) => [...doc, 'communications', 'detail', communicationId],
  },
  documents: {
    all: [...doc, 'documents'],
    patient: (patientId: string) => [...doc, 'documents', 'patient', patientId],
    case: (caseId: string) => [...doc, 'documents', 'case', caseId],
    clinic: (clinicId: string) => [...doc, 'documents', 'clinic', clinicId],
    detail: (documentId: string) => [...doc, 'documents', 'detail', documentId],
  },
  requests: {
    all: [...doc, 'requests'],
    records: {
      all: [...doc, 'requests', 'records'],
      patient: (patientId: string) => [...doc, 'requests', 'records', 'patient', patientId],
      clinic: (clinicId: string) => [...doc, 'requests', 'records', 'clinic', clinicId],
      detail: (requestId: string) => [...doc, 'requests', 'records', 'detail', requestId],
      pending: (clinicId: string) => [...doc, 'requests', 'records', 'pending', clinicId],
      disclosures: (requestId: string) => [...doc, 'requests', 'records', 'disclosures', requestId],
    },
    corrections: {
      all: [...doc, 'requests', 'corrections'],
      patient: (patientId: string) => [...doc, 'requests', 'corrections', 'patient', patientId],
      clinic: (clinicId: string) => [...doc, 'requests', 'corrections', 'clinic', clinicId],
      detail: (requestId: string) => [...doc, 'requests', 'corrections', 'detail', requestId],
    },
  },
  compliance: {
    all: [...doc, 'compliance'],
    metrics: (clinicId: string, period: string) => [...doc, 'compliance', 'metrics', clinicId, period],
    riskFlags: (clinicId: string, period: string) => [...doc, 'compliance', 'riskFlags', clinicId, period],
    timeliness: (clinicId: string, period: string) => [...doc, 'compliance', 'timeliness', clinicId, period],
    signatures: (clinicId: string, period: string) => [...doc, 'compliance', 'signatures', clinicId, period],
  },
  ai: {
    all: [...doc, 'ai'],
    models: (clinicId?: string) => [...doc, 'ai', 'models', { clinicId }],
    model: (modelId: string) => [...doc, 'ai', 'model', modelId],
    prompts: (modelId: string) => [...doc, 'ai', 'prompts', modelId],
    activePrompt: (modelId: string, promptKey: string) => [...doc, 'ai', 'activePrompt', modelId, promptKey],
    runs: (clinicId: string) => [...doc, 'ai', 'runs', clinicId],
    run: (runId: string) => [...doc, 'ai', 'run', runId],
    vendors: (organizationId?: string) => [...doc, 'ai', 'vendors', { organizationId }],
  },
  preVisitBrief: (patientId: string, encounterId: string) => [...doc, 'preVisitBrief', patientId, encounterId],
  risks: (patientId: string, clinicId: string, unresolvedOnly?: boolean) => [...doc, 'risks', patientId, clinicId, { unresolvedOnly }],
  breakGlass: {
    all: [...doc, 'breakGlass'],
    clinic: (clinicId: string, patientId?: string) => [...doc, 'breakGlass', 'clinic', clinicId, { patientId }],
    detail: (eventId: string) => [...doc, 'breakGlass', 'detail', eventId],
  },
  retentionPolicies: (organizationId: string) => [...doc, 'retentionPolicies', organizationId],
};