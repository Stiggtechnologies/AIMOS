/*
  # Fix Unindexed Foreign Keys - Batch 1
  
  1. Changes
    - Add covering indexes for 8 unindexed foreign keys
    - Scheduler tables: execution_id, recommendation_id, approval_id, clinic_id, executed_by, created_by
    - SOD conflict matrix: authority_id2
    - Staff onboarding: template_id
  
  2. Performance Impact
    - Improves join performance on foreign key relationships
    - Reduces query execution time for referential integrity checks
    - Essential for optimal database performance
*/

-- Scheduler audit log indexes
CREATE INDEX IF NOT EXISTS idx_scheduler_audit_log_execution_id_fkey 
  ON scheduler_audit_log(execution_id);

CREATE INDEX IF NOT EXISTS idx_scheduler_audit_log_recommendation_id_fkey 
  ON scheduler_audit_log(recommendation_id);

-- Scheduler execution log indexes
CREATE INDEX IF NOT EXISTS idx_scheduler_execution_log_approval_id_fkey 
  ON scheduler_execution_log(approval_id);

CREATE INDEX IF NOT EXISTS idx_scheduler_execution_log_clinic_id_fkey 
  ON scheduler_execution_log(clinic_id);

CREATE INDEX IF NOT EXISTS idx_scheduler_execution_log_executed_by_fkey 
  ON scheduler_execution_log(executed_by);

-- Scheduler recommendations index
CREATE INDEX IF NOT EXISTS idx_scheduler_recommendations_created_by_fkey 
  ON scheduler_recommendations(created_by);

-- SOD conflict matrix index
CREATE INDEX IF NOT EXISTS idx_sod_conflict_matrix_authority_id2_fkey 
  ON sod_conflict_matrix(authority_id2);

-- Staff onboarding index
CREATE INDEX IF NOT EXISTS idx_staff_onboarding_template_id_fkey 
  ON staff_onboarding(template_id);
