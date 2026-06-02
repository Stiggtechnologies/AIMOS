// Barrel export for all documentation services
export { documentationService } from './documentationService';
export { encounterService } from './encounterService';
export { noteService } from './noteService';
export { communicationService } from './communicationService';
export { documentService } from './documentService';
export { recordsRequestService } from './recordsRequestService';
export { complianceService } from './complianceService';
export { aiGovernanceService } from './aiGovernanceService';

// Service interfaces are defined in ./types
export type {
  IDocumentationService,
  IEncounterService,
  INoteService,
  ICommunicationService,
  IDocumentService,
  IRecordsRequestService,
  IComplianceService,
  IAIGovernanceService,
} from './types';
