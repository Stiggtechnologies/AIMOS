/*
  # Remove Duplicate Indexes - Batch 2
  
  1. Changes
    - Remove remaining duplicate indexes
    - Focuses on emergency, equipment, experience, and facility tables
    - Completes duplicate index cleanup
    
  2. Indexes Removed (Part 2)
    - Emergency mode status
    - Equipment maintenance and schedules
    - Experience improvement actions
    - Facility rooms
    - Feature access log
*/

-- Emergency mode status duplicates
DROP INDEX IF EXISTS idx_emergency_mode_status_clinic;  -- Duplicate of idx_emergency_mode_status_clinic_id
DROP INDEX IF EXISTS idx_emergency_mode_status_activated_by;  -- Duplicate of idx_emergency_mode_status_activated_by_id

-- Equipment maintenance duplicates  
DROP INDEX IF EXISTS idx_equipment_maintenance_equipment;  -- Duplicate of idx_equipment_maintenance_equipment_id
DROP INDEX IF EXISTS idx_equipment_maintenance_clinic;  -- Duplicate of idx_equipment_maintenance_clinic_id

-- Equipment schedules duplicates
DROP INDEX IF EXISTS idx_equipment_schedules_equipment;  -- Duplicate of idx_equipment_schedules_equipment_id
DROP INDEX IF EXISTS idx_equipment_schedules_clinic;  -- Duplicate of idx_equipment_schedules_clinic_id

-- Experience improvement actions duplicates
DROP INDEX IF EXISTS idx_experience_improvement_actions_issue;  -- Duplicate of idx_experience_improvement_actions_issue_id
DROP INDEX IF EXISTS idx_experience_improvement_actions_assigned_to;  -- Duplicate of idx_experience_improvement_actions_assigned_to_id

-- Facility rooms duplicates
DROP INDEX IF EXISTS idx_facility_rooms_clinic;  -- Duplicate of idx_facility_rooms_clinic_id

-- Feature access log duplicates
DROP INDEX IF EXISTS idx_feature_access_log_user;  -- Duplicate of idx_feature_access_log_user_id
DROP INDEX IF EXISTS idx_feature_access_log_feature;  -- Duplicate of idx_feature_access_log_feature_id
