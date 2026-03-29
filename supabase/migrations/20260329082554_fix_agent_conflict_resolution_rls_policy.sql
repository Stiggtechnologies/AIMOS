/*
  # Fix agent_conflict_resolution Missing RLS Policy
  
  The agent_conflict_resolution table had RLS enabled but no policies,
  meaning NO authenticated user could access any data in it (complete lockout).
  
  This migration adds the minimum necessary policies to allow authenticated
  access to this table.
*/

CREATE POLICY "agent_conflict_resolution_select"
  ON agent_conflict_resolution FOR SELECT
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "agent_conflict_resolution_insert"
  ON agent_conflict_resolution FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "agent_conflict_resolution_update"
  ON agent_conflict_resolution FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "agent_conflict_resolution_delete"
  ON agent_conflict_resolution FOR DELETE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL);
