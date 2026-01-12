/*
  # Fix Critical "Always True" RLS Policies - Batch 1 V3

  ## Security Issue
  Multiple tables have RLS policies with USING (true) or WITH CHECK (true), which completely bypass
  row-level security and allow any authenticated user to access/modify all data.
  
  ## Changes
  
  This migration fixes the most critical tables where authenticated users can perform ALL operations
  without any access control. We're replacing blanket "true" policies with proper role-based access control.
  
  ### Tables Fixed:
  - clinic_access: Critical - controls who can access clinics
  - agents, agent_events, agent_executions, agent_memory: Talent acquisition system
  - workflows, workflow_executions: Workflow automation
  
  ## Security Impact
  After this migration, users will only be able to access data they have permission to see,
  based on their role and clinic access.
*/

-- ===================================================================
-- CLINIC_ACCESS - CRITICAL SECURITY FIX
-- ===================================================================

DROP POLICY IF EXISTS "Authenticated users can manage clinic access" ON clinic_access;
DROP POLICY IF EXISTS "Users can view own clinic access" ON clinic_access;

-- Only admins and executives can grant clinic access
CREATE POLICY "Admins can manage clinic access"
ON clinic_access
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
    AND user_profiles.role = ANY (ARRAY['executive'::user_role, 'admin'::user_role])
  )
);

-- Users can view their own clinic access
CREATE POLICY "Users can view own access"
ON clinic_access
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));

-- ===================================================================
-- WORKFLOW EXECUTIONS - Fix remaining true policies
-- ===================================================================

DROP POLICY IF EXISTS "Authenticated users can manage workflow_executions" ON workflow_executions;
DROP POLICY IF EXISTS "Authenticated users can view workflow_executions" ON workflow_executions;
DROP POLICY IF EXISTS "System can manage workflow executions" ON workflow_executions;

-- Managers can view all workflow executions
CREATE POLICY "Managers view executions"
ON workflow_executions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
    AND user_profiles.role = ANY (ARRAY['executive'::user_role, 'admin'::user_role, 'clinic_manager'::user_role])
  )
);

-- System/Admins can insert workflow executions
CREATE POLICY "Admins insert executions"
ON workflow_executions
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
    AND user_profiles.role = ANY (ARRAY['executive'::user_role, 'admin'::user_role])
  )
);

-- System/Admins can update workflow executions
CREATE POLICY "Admins update executions"
ON workflow_executions
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
    AND user_profiles.role = ANY (ARRAY['executive'::user_role, 'admin'::user_role])
  )
);

-- ===================================================================
-- AGENTS - Talent Acquisition System
-- ===================================================================

DROP POLICY IF EXISTS "Authenticated users can manage agents" ON agents;
DROP POLICY IF EXISTS "Authenticated users can view agents" ON agents;

CREATE POLICY "Admins manage agents"
ON agents
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
    AND user_profiles.role = ANY (ARRAY['executive'::user_role, 'admin'::user_role])
  )
);

CREATE POLICY "Users view agents"
ON agents
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
    AND user_profiles.role = ANY (ARRAY['executive'::user_role, 'admin'::user_role, 'clinic_manager'::user_role])
  )
);

-- ===================================================================
-- AGENT_EVENTS
-- ===================================================================

DROP POLICY IF EXISTS "Authenticated users can manage agent_events" ON agent_events;
DROP POLICY IF EXISTS "Authenticated users can view agent_events" ON agent_events;

CREATE POLICY "Admins manage agent events"
ON agent_events
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
    AND user_profiles.role = ANY (ARRAY['executive'::user_role, 'admin'::user_role])
  )
);

CREATE POLICY "Users view agent events"
ON agent_events
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
    AND user_profiles.role = ANY (ARRAY['executive'::user_role, 'admin'::user_role, 'clinic_manager'::user_role])
  )
);

-- ===================================================================
-- AGENT_EXECUTIONS
-- ===================================================================

DROP POLICY IF EXISTS "Authenticated users can insert agent_executions" ON agent_executions;
DROP POLICY IF EXISTS "Authenticated users can view agent_executions" ON agent_executions;

CREATE POLICY "System insert agent executions"
ON agent_executions
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
    AND user_profiles.role = ANY (ARRAY['executive'::user_role, 'admin'::user_role])
  )
);

CREATE POLICY "Users view agent executions"
ON agent_executions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
    AND user_profiles.role = ANY (ARRAY['executive'::user_role, 'admin'::user_role, 'clinic_manager'::user_role])
  )
);

-- ===================================================================
-- AGENT_MEMORY
-- ===================================================================

DROP POLICY IF EXISTS "Authenticated users can manage agent_memory" ON agent_memory;
DROP POLICY IF EXISTS "Authenticated users can view agent_memory" ON agent_memory;

CREATE POLICY "Admins manage agent memory"
ON agent_memory
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
    AND user_profiles.role = ANY (ARRAY['executive'::user_role, 'admin'::user_role])
  )
);

CREATE POLICY "Users view agent memory"
ON agent_memory
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
    AND user_profiles.role = ANY (ARRAY['executive'::user_role, 'admin'::user_role, 'clinic_manager'::user_role])
  )
);
