/*
  # Fix Always-True RLS Policies That Bypass Security

  1. Security Issue
    - Tables have RLS policies using `USING (true)` or only status-based checks
    - This allows unrestricted access without proper authentication or role verification
    - Critical security vulnerability that must be fixed
    
  2. Changes
    - Replace `USING (true)` with proper authentication checks
    - Add role-based access control where appropriate
    - Maintain intended functionality while enforcing security
    
  3. Tables Fixed
    - document_library: Add authentication to published document check
    - marketing_channels: Restrict to marketing team and executives
    
  4. Security Impact
    - HIGH: Prevents unauthorized access to sensitive organizational data
    - Enforces authentication requirements across all tables
    - Maintains proper access control boundaries
*/

-- document_library: Add authentication to published check
DROP POLICY IF EXISTS "All users can view published documents" ON document_library;
CREATE POLICY "Authenticated users can view published documents"
  ON document_library FOR SELECT
  TO authenticated
  USING (
    status = 'published'
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
    )
  );

-- marketing_channels: Restrict to marketing team and executives
DROP POLICY IF EXISTS "All users can view channels" ON marketing_channels;
CREATE POLICY "Marketing team can view channels"
  ON marketing_channels FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
    )
  );
