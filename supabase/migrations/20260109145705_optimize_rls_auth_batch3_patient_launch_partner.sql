/*
  # Optimize RLS Auth Calls - Batch 3: Patient, Launch, Partner Tables

  This migration optimizes RLS policies to evaluate auth.uid() once per query instead of per row.
  
  ## Changes
  
  ### Launch Tables
  - launch_tasks: Wrap auth.uid() in SELECT for assignee policies
  - launch_workstreams: Wrap auth.uid() in SELECT for owner policies
  
  ### Patient Tables
  - patient_messages: Wrap auth.uid() in SELECT for sender/recipient policies
  
  ## Notes
  Most policies already use EXISTS or IN subqueries which optimize auth.uid() evaluation.
  This migration focuses on policies with direct auth.uid() comparisons.
  
  ## Performance Impact
  These optimizations prevent auth.uid() from being re-evaluated for each row.
*/

-- ===================================================================
-- LAUNCH_TASKS
-- ===================================================================

DROP POLICY IF EXISTS "Task assignees can update tasks" ON launch_tasks;
CREATE POLICY "Task assignees can update tasks"
ON launch_tasks
FOR UPDATE
TO authenticated
USING (assigned_to = (SELECT auth.uid()))
WITH CHECK (assigned_to = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can view accessible tasks" ON launch_tasks;
CREATE POLICY "Users can view accessible tasks"
ON launch_tasks
FOR SELECT
TO authenticated
USING (
  (assigned_to = (SELECT auth.uid())) OR 
  (EXISTS ( 
    SELECT 1
    FROM clinic_launches
    WHERE (
      (clinic_launches.id = launch_tasks.clinic_launch_id) AND 
      (
        (clinic_launches.launch_owner_id = (SELECT auth.uid())) OR 
        (clinic_launches.executive_sponsor_id = (SELECT auth.uid())) OR 
        (EXISTS ( 
          SELECT 1
          FROM user_profiles
          WHERE (
            (user_profiles.id = (SELECT auth.uid())) AND 
            (user_profiles.role = ANY (ARRAY['executive'::user_role, 'admin'::user_role, 'clinic_manager'::user_role]))
          )
        ))
      )
    )
  ))
);

-- ===================================================================
-- LAUNCH_WORKSTREAMS  
-- ===================================================================

DROP POLICY IF EXISTS "Workstream owners can manage workstreams" ON launch_workstreams;
CREATE POLICY "Workstream owners can manage workstreams"
ON launch_workstreams
FOR ALL
TO authenticated
USING (
  (owner_id = (SELECT auth.uid())) OR 
  (EXISTS ( 
    SELECT 1
    FROM clinic_launches
    WHERE (
      (clinic_launches.id = launch_workstreams.clinic_launch_id) AND 
      (
        (clinic_launches.launch_owner_id = (SELECT auth.uid())) OR 
        (clinic_launches.executive_sponsor_id = (SELECT auth.uid()))
      )
    )
  ))
);

DROP POLICY IF EXISTS "Users can view accessible workstreams" ON launch_workstreams;
CREATE POLICY "Users can view accessible workstreams"
ON launch_workstreams
FOR SELECT
TO authenticated
USING (
  (owner_id = (SELECT auth.uid())) OR 
  (EXISTS ( 
    SELECT 1
    FROM clinic_launches
    WHERE (
      (clinic_launches.id = launch_workstreams.clinic_launch_id) AND 
      (
        (clinic_launches.launch_owner_id = (SELECT auth.uid())) OR 
        (clinic_launches.executive_sponsor_id = (SELECT auth.uid())) OR 
        (EXISTS ( 
          SELECT 1
          FROM user_profiles
          WHERE (
            (user_profiles.id = (SELECT auth.uid())) AND 
            (user_profiles.role = ANY (ARRAY['executive'::user_role, 'admin'::user_role, 'clinic_manager'::user_role]))
          )
        ))
      )
    )
  ))
);

-- ===================================================================
-- PATIENT_MESSAGES
-- ===================================================================

DROP POLICY IF EXISTS "Users can send messages" ON patient_messages;
CREATE POLICY "Users can send messages"
ON patient_messages
FOR INSERT
TO authenticated
WITH CHECK (sender_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update messages" ON patient_messages;
CREATE POLICY "Users can update messages"
ON patient_messages
FOR UPDATE
TO authenticated
USING ((sender_id = (SELECT auth.uid())) OR (recipient_id = (SELECT auth.uid())))
WITH CHECK ((sender_id = (SELECT auth.uid())) OR (recipient_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Users can view their messages" ON patient_messages;
CREATE POLICY "Users can view their messages"
ON patient_messages
FOR SELECT
TO authenticated
USING ((sender_id = (SELECT auth.uid())) OR (recipient_id = (SELECT auth.uid())));
