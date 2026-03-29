import type { ICommunicationService } from './types';
import type { CreateCommunicationInput, CommunicationLog, PaginatedResult, PaginationParams } from '../types';

export const communicationService: ICommunicationService = {
  async logCommunication(input: CreateCommunicationInput): Promise<CommunicationLog> {
    throw new Error('Not implemented');
  },
  async getCommunication(communicationId: string): Promise<CommunicationLog> {
    throw new Error('Not implemented');
  },
  async listCommunicationsByPatient(patientId: string, pagination?: PaginationParams): Promise<PaginatedResult<CommunicationLog>> {
    throw new Error('Not implemented');
  },
  async listCommunicationsByCase(caseId: string, pagination?: PaginationParams): Promise<PaginatedResult<CommunicationLog>> {
    throw new Error('Not implemented');
  },
  async listCommunicationsByEncounter(encounterId: string): Promise<CommunicationLog[]> {
    throw new Error('Not implemented');
  },
  async listCommunicationsByClinic(clinicId: string, pagination?: PaginationParams): Promise<PaginatedResult<CommunicationLog>> {
    throw new Error('Not implemented');
  },
  async markCommunicationFollowUp(communicationId: string, requiresFollowUp: boolean): Promise<CommunicationLog> {
    throw new Error('Not implemented');
  },
  async convertCommunicationToNote(communicationId: string, noteDraftId: string): Promise<CommunicationLog> {
    throw new Error('Not implemented');
  },
};