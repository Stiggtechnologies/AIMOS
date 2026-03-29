import type { IEncounterService } from './types';
import type { CreateEncounterInput, UpdateEncounterStateInput, Encounter, Transcript, TranscriptSegment, PaginatedResult, PaginationParams } from '../types';

export const encounterService: IEncounterService = {
  async createEncounter(input: CreateEncounterInput): Promise<Encounter> {
    throw new Error('Not implemented');
  },
  async getEncounter(encounterId: string): Promise<Encounter> {
    throw new Error('Not implemented');
  },
  async updateEncounterState(input: UpdateEncounterStateInput): Promise<Encounter> {
    throw new Error('Not implemented');
  },
  async listEncountersByPatient(patientId: string, pagination?: PaginationParams): Promise<PaginatedResult<Encounter>> {
    throw new Error('Not implemented');
  },
  async listEncountersByCase(caseId: string): Promise<Encounter[]> {
    throw new Error('Not implemented');
  },
  async listEncountersByClinic(clinicId: string, pagination?: PaginationParams): Promise<PaginatedResult<Encounter>> {
    throw new Error('Not implemented');
  },
  async getEncounterTranscript(encounterId: string): Promise<Transcript | null> {
    throw new Error('Not implemented');
  },
  async getTranscriptSegments(transcriptId: string): Promise<TranscriptSegment[]> {
    throw new Error('Not implemented');
  },
  async uploadTranscript(encounterId: string, storagePath: string, createdByUserId: string): Promise<Transcript> {
    throw new Error('Not implemented');
  },
  async processTranscript(transcriptId: string, createdByUserId: string): Promise<Transcript> {
    throw new Error('Not implemented');
  },
};