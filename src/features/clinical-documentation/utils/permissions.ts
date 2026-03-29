import { DOCUMENTATION_PERMISSION_KEYS, type DocumentationPermissionKey } from '../types';

// Documentation permission constants
export const DOCUMENTATION_PERMISSIONS = DOCUMENTATION_PERMISSION_KEYS;

export const PERMISSION_LABELS: Record<DocumentationPermissionKey, string> = {
  [DOCUMENTATION_PERMISSION_KEYS.VIEW]: 'View Documentation',
  [DOCUMENTATION_PERMISSION_KEYS.EDIT_DRAFT]: 'Edit Draft Notes',
  [DOCUMENTATION_PERMISSION_KEYS.SIGN]: 'Sign Clinical Notes',
  [DOCUMENTATION_PERMISSION_KEYS.ADDENDUM]: 'Add Addenda to Signed Notes',
  [DOCUMENTATION_PERMISSION_KEYS.LOG_COMMUNICATION]: 'Log Patient Communications',
  [DOCUMENTATION_PERMISSION_KEYS.UPLOAD_DOCUMENT]: 'Upload Clinical Documents',
  [DOCUMENTATION_PERMISSION_KEYS.MANAGE_REQUESTS]: 'Manage Record Requests',
  [DOCUMENTATION_PERMISSION_KEYS.RELEASE_DISCLOSURE]: 'Release Disclosures',
  [DOCUMENTATION_PERMISSION_KEYS.REVIEW_COMPLIANCE]: 'Review Documentation Compliance',
  [DOCUMENTATION_PERMISSION_KEYS.MANAGE_AI_GOVERNANCE]: 'Manage AI Governance',
} as const;

// Stub hook for permission checking — replace with actual implementation
// based on the auth system used in AIMOS (likely Supabase RLS + user_roles)
export function useHasPermission(permission: DocumentationPermissionKey): boolean {
  // TODO: Wire to actual permission check — e.g. from auth context or RLS claims
  return false;
}