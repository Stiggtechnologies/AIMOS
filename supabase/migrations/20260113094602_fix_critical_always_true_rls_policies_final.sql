/*
  # Fix Critical Always-True RLS Policies

  1. Security Changes
    - Drop always-true RLS policies that bypass security
    - Replace with proper permission checks using check_permission()
    - Agent tables: Restrict to users with AI insights or system admin
    - CRM tables: Restrict based on clinic access
    - Research tables: Restrict to users with AIM OS access

  2. Critical Fixes
    - `agent_actions`: Replace unrestricted ALL with proper role checks
    - `agent_audit_trail`: Replace unrestricted INSERT with system audit only
    - `agent_decisions`: Replace unrestricted ALL with proper role checks
    - CRM tables: Add clinic-based access control
    - Research tables: Add role-based access control
*/

-- Fix agent_actions policies
DROP POLICY IF EXISTS "Authenticated users access actions" ON agent_actions;

CREATE POLICY "Users can view agent actions with permission"
  ON agent_actions FOR SELECT
  TO authenticated
  USING (
    check_permission('ai_insights', 'read_only')
    OR check_permission('manage_system', 'full')
  );

CREATE POLICY "System can insert agent actions"
  ON agent_actions FOR INSERT
  TO authenticated
  WITH CHECK (
    check_permission('manage_system', 'full')
  );

-- Fix agent_audit_trail policies
DROP POLICY IF EXISTS "System appends audit trail" ON agent_audit_trail;

CREATE POLICY "System can append to audit trail"
  ON agent_audit_trail FOR INSERT
  TO authenticated
  WITH CHECK (
    check_permission('manage_system', 'full')
  );

CREATE POLICY "Users can view audit trail with permission"
  ON agent_audit_trail FOR SELECT
  TO authenticated
  USING (
    check_permission('audit_logs', 'read_only')
    OR check_permission('manage_system', 'full')
  );

-- Fix agent_decisions policies
DROP POLICY IF EXISTS "Authenticated users access decisions" ON agent_decisions;

CREATE POLICY "Users can view agent decisions with permission"
  ON agent_decisions FOR SELECT
  TO authenticated
  USING (
    check_permission('ai_insights', 'read_only')
    OR check_permission('manage_system', 'full')
  );

CREATE POLICY "System can insert agent decisions"
  ON agent_decisions FOR INSERT
  TO authenticated
  WITH CHECK (
    check_permission('manage_system', 'full')
  );

-- Fix CRM leads policies
DO $$
BEGIN
  DROP POLICY IF EXISTS "Unrestricted access to leads" ON crm_leads;
  DROP POLICY IF EXISTS "All authenticated users can view leads" ON crm_leads;
  DROP POLICY IF EXISTS "Anyone can view leads" ON crm_leads;
EXCEPTION WHEN undefined_table THEN
  NULL;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crm_leads') THEN
    EXECUTE 'CREATE POLICY "Users can view leads in their clinics"
      ON crm_leads FOR SELECT
      TO authenticated
      USING (
        clinic_id IN (
          SELECT ca.clinic_id
          FROM clinic_access ca
          WHERE ca.user_id = (SELECT auth.uid())
        )
        OR check_permission(''view_all_data'', ''read_only'')
      )';
    
    EXECUTE 'CREATE POLICY "Users can insert leads with permission"
      ON crm_leads FOR INSERT
      TO authenticated
      WITH CHECK (
        clinic_id IN (
          SELECT ca.clinic_id
          FROM clinic_access ca
          WHERE ca.user_id = (SELECT auth.uid())
        )
        AND check_permission(''access_growth_os'', ''full'')
      )';
    
    EXECUTE 'CREATE POLICY "Users can update leads in their clinics"
      ON crm_leads FOR UPDATE
      TO authenticated
      USING (
        clinic_id IN (
          SELECT ca.clinic_id
          FROM clinic_access ca
          WHERE ca.user_id = (SELECT auth.uid())
        )
      )
      WITH CHECK (
        clinic_id IN (
          SELECT ca.clinic_id
          FROM clinic_access ca
          WHERE ca.user_id = (SELECT auth.uid())
        )
        AND check_permission(''access_growth_os'', ''full'')
      )';
  END IF;
END $$;

-- Fix research_papers policies
DROP POLICY IF EXISTS "System can manage research papers" ON research_papers;
DROP POLICY IF EXISTS "All users can view papers" ON research_papers;

CREATE POLICY "Users can view published research papers"
  ON research_papers FOR SELECT
  TO authenticated
  USING (
    (ingestion_status = 'processed' AND check_permission('access_aim_os', 'read_only'))
    OR check_permission('manage_system', 'full')
  );

CREATE POLICY "Authorized users can insert research papers"
  ON research_papers FOR INSERT
  TO authenticated
  WITH CHECK (
    check_permission('manage_system', 'full')
  );

CREATE POLICY "Authorized users can update research papers"
  ON research_papers FOR UPDATE
  TO authenticated
  USING (
    check_permission('manage_system', 'full')
  )
  WITH CHECK (
    check_permission('manage_system', 'full')
  );

-- Fix evidence_syntheses policies
DROP POLICY IF EXISTS "Anyone can view syntheses" ON evidence_syntheses;
DROP POLICY IF EXISTS "All authenticated users view syntheses" ON evidence_syntheses;

CREATE POLICY "Users can view published evidence syntheses"
  ON evidence_syntheses FOR SELECT
  TO authenticated
  USING (
    (status = 'published' AND check_permission('access_aim_os', 'read_only'))
    OR query_by = (SELECT auth.uid())
    OR check_permission('manage_system', 'full')
  );

CREATE POLICY "Users can create evidence syntheses"
  ON evidence_syntheses FOR INSERT
  TO authenticated
  WITH CHECK (
    query_by = (SELECT auth.uid())
    AND check_permission('access_aim_os', 'read_only')
  );

-- Fix practice_translations policies
DROP POLICY IF EXISTS "All authenticated users can view translations" ON practice_translations;
DROP POLICY IF EXISTS "Anyone can view translations" ON practice_translations;

CREATE POLICY "Users can view approved or own practice translations"
  ON practice_translations FOR SELECT
  TO authenticated
  USING (
    (status IN ('approved', 'adopted') AND check_permission('access_aim_os', 'read_only'))
    OR proposed_by = (SELECT auth.uid())
    OR check_permission('manage_system', 'full')
  );

CREATE POLICY "Authorized users can create practice translations"
  ON practice_translations FOR INSERT
  TO authenticated
  WITH CHECK (
    check_permission('access_aim_os', 'full')
  );

-- Fix research_queries policies
DROP POLICY IF EXISTS "All users can view queries" ON research_queries;

CREATE POLICY "Users can view own research queries"
  ON research_queries FOR SELECT
  TO authenticated
  USING (
    requested_by = (SELECT auth.uid())
    OR check_permission('view_all_data', 'read_only')
  );

CREATE POLICY "Users can create research queries"
  ON research_queries FOR INSERT
  TO authenticated
  WITH CHECK (
    requested_by = (SELECT auth.uid())
    AND check_permission('access_aim_os', 'read_only')
  );

-- Fix cco_approvals policies
DROP POLICY IF EXISTS "Anyone can view approvals" ON cco_approvals;
DROP POLICY IF EXISTS "All users view approvals" ON cco_approvals;

CREATE POLICY "Authorized users can view CCO approvals"
  ON cco_approvals FOR SELECT
  TO authenticated
  USING (
    check_permission('access_aim_os', 'read_only')
  );

CREATE POLICY "Authorized users can submit for CCO approval"
  ON cco_approvals FOR INSERT
  TO authenticated
  WITH CHECK (
    check_permission('access_aim_os', 'full')
  );

CREATE POLICY "Authorized users can update CCO approvals"
  ON cco_approvals FOR UPDATE
  TO authenticated
  USING (
    check_permission('access_aim_os', 'full')
  )
  WITH CHECK (
    check_permission('access_aim_os', 'full')
  );

-- Fix practice_pilots policies
DROP POLICY IF EXISTS "All users can view pilots" ON practice_pilots;

CREATE POLICY "Users can view pilots with permission"
  ON practice_pilots FOR SELECT
  TO authenticated
  USING (
    check_permission('access_aim_os', 'read_only')
    OR check_permission('view_all_data', 'read_only')
  );

CREATE POLICY "Authorized users can create pilots"
  ON practice_pilots FOR INSERT
  TO authenticated
  WITH CHECK (
    check_permission('access_aim_os', 'full')
  );

CREATE POLICY "Authorized users can update pilots"
  ON practice_pilots FOR UPDATE
  TO authenticated
  USING (
    check_permission('access_aim_os', 'full')
  )
  WITH CHECK (
    check_permission('access_aim_os', 'full')
  );

-- Fix evidence_digests policies
DROP POLICY IF EXISTS "All users can view digests" ON evidence_digests;

CREATE POLICY "Users can view published evidence digests"
  ON evidence_digests FOR SELECT
  TO authenticated
  USING (
    (status = 'published' AND check_permission('access_aim_os', 'read_only'))
    OR check_permission('manage_system', 'full')
  );

-- Fix research_sources policies
DROP POLICY IF EXISTS "All users can view sources" ON research_sources;

CREATE POLICY "Users can view approved research sources"
  ON research_sources FOR SELECT
  TO authenticated
  USING (
    (approved = true AND check_permission('access_aim_os', 'read_only'))
    OR check_permission('manage_system', 'full')
  );

-- Fix research_priorities policies
DROP POLICY IF EXISTS "All users can view priorities" ON research_priorities;

CREATE POLICY "Users can view active research priorities"
  ON research_priorities FOR SELECT
  TO authenticated
  USING (
    (active = true AND check_permission('access_aim_os', 'read_only'))
    OR check_permission('manage_system', 'full')
  );

-- Fix evidence_packs policies
DROP POLICY IF EXISTS "All users can view evidence packs" ON evidence_packs;

CREATE POLICY "Users can view evidence packs with permission"
  ON evidence_packs FOR SELECT
  TO authenticated
  USING (
    check_permission('access_aim_os', 'read_only')
  );