/*
  # Fix RLS Policies That Always Return True

  ## Summary
  Fixes RLS policies that use `true` or `OR true` which bypass row-level security.
  This migration addresses critical security issues by adding proper access controls.

  ## Critical Fixes

  ### Research Queries
  - Fixed "Users can view own queries" - removed `OR true` that defeated ownership check

  ### Claim Citations (PUBLIC access)
  - Changed from public to authenticated access
  - Citations should not be publicly accessible without authentication

  ## Notes
  - Many agent and CRM tables intentionally allow all authenticated users
  - Those are kept as-is as they appear to be design decisions
  - Focus on fixing policies where `OR true` defeats intended restrictions
  - More restrictive policies can be added in future migrations as requirements clarify

  ## Security Impact
  - Prevents unauthorized access to user-specific data
  - Removes public access to sensitive citation data
  - Maintains audit trail visibility for authenticated users
*/

-- Fix research_queries: Remove OR true that defeats ownership check
DROP POLICY IF EXISTS "Users can view own queries" ON public.research_queries;
CREATE POLICY "Users can view own queries"
  ON public.research_queries
  FOR SELECT
  TO authenticated
  USING (requested_by = (SELECT auth.uid()));

-- Fix claim_citations: Change from public to authenticated
DROP POLICY IF EXISTS "citations_select" ON public.claim_citations;
CREATE POLICY "citations_select"
  ON public.claim_citations
  FOR SELECT
  TO authenticated
  USING (true);
