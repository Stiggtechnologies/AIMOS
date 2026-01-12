/*
  # Add RLS Policies to Tasks and Workflows Tables

  1. Security Issue
    - Tables have RLS enabled but no policies
    - This completely blocks all access to these tables
    - Need to add appropriate policies for proper functionality
    
  2. Changes
    - Add SELECT, INSERT, UPDATE, DELETE policies for tasks table
    - Add SELECT, INSERT, UPDATE, DELETE policies for workflows table
    - Restrict access based on user roles and authentication
    
  3. Tables Fixed
    - tasks: Add comprehensive CRUD policies
    - workflows: Add comprehensive CRUD policies
    
  4. Security Impact
    - Enables proper functionality while maintaining security
    - Role-based access control for system management
*/

-- tasks: Allow authenticated users to view tasks
CREATE POLICY "Authenticated users can view tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
    )
  );

-- tasks: Allow managers to create tasks
CREATE POLICY "Managers can create tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
    )
  );

-- tasks: Allow managers to update tasks
CREATE POLICY "Managers can update tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
    )
  );

-- tasks: Allow admins to delete tasks
CREATE POLICY "Admins can delete tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin')
    )
  );

-- workflows: Allow authenticated users to view workflows
CREATE POLICY "Authenticated users can view workflows"
  ON workflows FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
    )
  );

-- workflows: Allow admins to create workflows
CREATE POLICY "Admins can create workflows"
  ON workflows FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin')
    )
  );

-- workflows: Allow admins to update workflows
CREATE POLICY "Admins can update workflows"
  ON workflows FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin')
    )
  );

-- workflows: Allow admins to delete workflows
CREATE POLICY "Admins can delete workflows"
  ON workflows FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin')
    )
  );
