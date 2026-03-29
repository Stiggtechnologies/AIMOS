import type { StructuredClinicalNotePayload } from '../types';

/**
 * Type guard to validate a structured clinical note payload.
 * Checks for required top-level sections (subjective/objective/assessment/plan).
 */
export function isStructuredClinicalNotePayload(
  value: unknown
): value is StructuredClinicalNotePayload {
  if (typeof value !== 'object' || value === null) return false;

  const payload = value as Record<string, unknown>;

  const hasSections =
    'subjective' in payload ||
    'objective' in payload ||
    'assessment' in payload ||
    'plan' in payload;

  return hasSections;
}

/**
 * Validates that a StructuredClinicalNotePayload has all four required sections
 * for a complete SOAP note.
 */
export function isCompleteSOAPNote(
  payload: StructuredClinicalNotePayload
): boolean {
  return !!(
    payload.subjective &&
    payload.objective &&
    payload.assessment &&
    payload.plan
  );
}