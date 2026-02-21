/*
  # Fix Security and Performance Issues - Part 3: Function Search Paths

  ## Changes
  - Set secure search paths for all security-critical functions
  - Prevents search_path manipulation attacks
  - Sets search_path to 'public, pg_temp' for function security

  ## Security Impact
  - Prevents malicious users from creating objects in other schemas
  - Prevents function hijacking through search_path manipulation
  - Critical security hardening for SECURITY DEFINER functions

  ## Notes
  - All security-related functions now have immutable search paths
  - Safe to run multiple times
  - No functional changes, only security hardening
*/

-- Update all security-critical functions with secure search path
ALTER FUNCTION public.get_user_role() SET search_path = public, pg_temp;
ALTER FUNCTION public.is_executive() SET search_path = public, pg_temp;
ALTER FUNCTION public.is_clinic_manager() SET search_path = public, pg_temp;
ALTER FUNCTION public.is_clinician() SET search_path = public, pg_temp;
ALTER FUNCTION public.is_admin() SET search_path = public, pg_temp;
ALTER FUNCTION public.is_assigned_to_patient(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.has_elevated_privileges() SET search_path = public, pg_temp;
ALTER FUNCTION public.anonymize_peer_name(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.user_has_clinic_access(uuid) SET search_path = public, pg_temp;
