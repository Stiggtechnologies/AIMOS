/*
  # Optimize RLS Auth Calls - Batch 2: Operations Tables

  This migration optimizes RLS policies to evaluate auth.uid() once per query instead of per row.
  
  ## Changes
  
  ### Operations Tables
  - ops_shift_swaps: Wrap auth.uid() in SELECT for INSERT policy
  - ops_time_off_requests: Wrap auth.uid() in SELECT for INSERT policy
  
  ## Notes
  Most operations table policies are already optimized with EXISTS or IN subqueries.
  These two policies had direct auth.uid() comparisons in WITH CHECK clauses.
  
  ## Performance Impact
  These optimizations prevent auth.uid() from being re-evaluated for each row.
*/

-- ===================================================================
-- OPS_SHIFT_SWAPS
-- ===================================================================

DROP POLICY IF EXISTS "Staff can create swap requests" ON ops_shift_swaps;
CREATE POLICY "Staff can create swap requests"
ON ops_shift_swaps
FOR INSERT
TO public
WITH CHECK (requested_by = (SELECT auth.uid()));

-- ===================================================================
-- OPS_TIME_OFF_REQUESTS
-- ===================================================================

DROP POLICY IF EXISTS "Staff can create time off requests" ON ops_time_off_requests;
CREATE POLICY "Staff can create time off requests"
ON ops_time_off_requests
FOR INSERT
TO public
WITH CHECK (requested_by = (SELECT auth.uid()));
