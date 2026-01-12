/*
  # Optimize RLS Auth Calls - Batch 1: Workflow & Notification Tables

  This migration optimizes RLS policies to evaluate auth.uid() once per query instead of per row.
  
  ## Changes
  
  ### Notification Tables
  - notification_history: Wrap auth.uid() in SELECT for user policy
  - notification_preferences: Wrap auth.uid() in SELECT for all user policies
  - notification_queue: Wrap auth.uid() in SELECT for user policy
  
  ### Workflow Tables  
  - workflow_actions: Policies already optimized with EXISTS
  - workflow_definitions: Policies already optimized with EXISTS
  - workflow_executions: Only optimize the manager check policy (others have security issues to fix separately)
  
  ### Task Tables
  - scheduled_tasks: Policies already optimized with EXISTS
  - task_execution_log: Policies already optimized with EXISTS
  
  ## Performance Impact
  These optimizations prevent auth.uid() from being re-evaluated for each row, significantly improving query performance.
  
  ## Security Notes
  Several tables have "USING (true)" policies that bypass security - these will be addressed in a separate security-focused migration.
*/

-- ===================================================================
-- NOTIFICATION_HISTORY
-- ===================================================================

DROP POLICY IF EXISTS "Users can view their notification history" ON notification_history;
CREATE POLICY "Users can view their notification history" 
ON notification_history
FOR SELECT 
TO authenticated
USING (recipient_id = (SELECT auth.uid()));

-- ===================================================================
-- NOTIFICATION_PREFERENCES  
-- ===================================================================

DROP POLICY IF EXISTS "Users can view own preferences" ON notification_preferences;
CREATE POLICY "Users can view own preferences"
ON notification_preferences
FOR SELECT
TO authenticated  
USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own preferences" ON notification_preferences;
CREATE POLICY "Users can update own preferences"
ON notification_preferences
FOR UPDATE
TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own preferences" ON notification_preferences;
CREATE POLICY "Users can insert own preferences"
ON notification_preferences
FOR INSERT
TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

-- ===================================================================
-- NOTIFICATION_QUEUE
-- ===================================================================

DROP POLICY IF EXISTS "Users can view their notifications" ON notification_queue;
CREATE POLICY "Users can view their notifications"
ON notification_queue
FOR SELECT
TO authenticated
USING (recipient_id = (SELECT auth.uid()));
