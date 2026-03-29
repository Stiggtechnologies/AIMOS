import type { INoteService } from './types';
import type { CreateDraftNoteInput, SaveDraftNoteVersionInput, CreateAddendumInput, NoteDraft, NoteDraftVersion, SignedNote, NoteAddendum, PaginatedResult, PaginationParams, NoteDraftWithVersions, SignedNoteWithAddenda } from '../types';

export const noteService: INoteService = {
  async createDraftNote(input: CreateDraftNoteInput): Promise<NoteDraft> {
    throw new Error('Not implemented');
  },
  async getDraftNote(noteDraftId: string): Promise<NoteDraft> {
    throw new Error('Not implemented');
  },
  async updateDraftNote(noteDraftId: string, updates: Partial<NoteDraft>): Promise<NoteDraft> {
    throw new Error('Not implemented');
  },
  async saveDraftVersion(input: SaveDraftNoteVersionInput): Promise<NoteDraftVersion> {
    throw new Error('Not implemented');
  },
  async getDraftVersions(noteDraftId: string): Promise<NoteDraftVersion[]> {
    throw new Error('Not implemented');
  },
  async getDraftNoteWithVersions(noteDraftId: string): Promise<NoteDraftWithVersions> {
    throw new Error('Not implemented');
  },
  async validateDraftNote(noteDraftId: string, expectedSignature?: string): Promise<{ valid: boolean; errors: string[] }> {
    throw new Error('Not implemented');
  },
  async signDraftNote(noteDraftId: string, signedByUserId: string): Promise<SignedNote> {
    throw new Error('Not implemented');
  },
  async getSignedNote(signedNoteId: string): Promise<SignedNote> {
    throw new Error('Not implemented');
  },
  async getSignedNoteWithAddenda(signedNoteId: string): Promise<SignedNoteWithAddenda> {
    throw new Error('Not implemented');
  },
  async listPatientSignedNotes(patientId: string, pagination?: PaginationParams): Promise<PaginatedResult<SignedNote>> {
    throw new Error('Not implemented');
  },
  async listPatientDraftNotes(patientId: string, pagination?: PaginationParams): Promise<PaginatedResult<NoteDraft>> {
    throw new Error('Not implemented');
  },
  async createAddendum(input: CreateAddendumInput): Promise<NoteAddendum> {
    throw new Error('Not implemented');
  },
  async approveAddendum(addendumId: string, approvedByUserId: string): Promise<NoteAddendum> {
    throw new Error('Not implemented');
  },
  async listAddendaForSignedNote(signedNoteId: string): Promise<NoteAddendum[]> {
    throw new Error('Not implemented');
  },
};