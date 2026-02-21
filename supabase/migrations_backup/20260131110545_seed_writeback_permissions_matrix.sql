/*
  # Seed Write-Back Permissions Matrix

  1. Purpose
    - Initialize role-based permissions for Phase 2 write-back
    - Control which roles can approve which types of scheduling actions
    - Enforce approval hierarchy by role

  2. Permission Levels by Role
    - Front Desk: Status updates only
    - Scheduler: All scheduling changes + status
    - Operations Lead: All scheduling + overbooks
    - Clinic Manager: All actions including blocks
*/

INSERT INTO write_back_permissions (
  clinic_id,
  role_name,
  can_approve_status_update,
  can_approve_waitlist_fill,
  can_approve_overbook,
  can_approve_reschedule,
  can_approve_block_insertion,
  can_override_confidence,
  max_approval_impact_level
) VALUES
  -- Edmonton Central
  ('bf3a060f-a018-43da-b45a-e184a40ec94b', 'front_desk', true, false, false, false, false, false, 1),
  ('bf3a060f-a018-43da-b45a-e184a40ec94b', 'scheduler', true, true, false, true, false, false, 2),
  ('bf3a060f-a018-43da-b45a-e184a40ec94b', 'operations_lead', true, true, true, true, false, true, 3),
  ('bf3a060f-a018-43da-b45a-e184a40ec94b', 'clinic_manager', true, true, true, true, true, true, 4),
  
  -- Calgary North
  ('0931b80a-e808-4afe-b464-ecab6c86b2b8', 'front_desk', true, false, false, false, false, false, 1),
  ('0931b80a-e808-4afe-b464-ecab6c86b2b8', 'scheduler', true, true, false, true, false, false, 2),
  ('0931b80a-e808-4afe-b464-ecab6c86b2b8', 'operations_lead', true, true, true, true, false, true, 3),
  ('0931b80a-e808-4afe-b464-ecab6c86b2b8', 'clinic_manager', true, true, true, true, true, true, 4),
  
  -- Calgary South
  ('25a1a69d-cdb7-4083-bba9-050266b85e82', 'front_desk', true, false, false, false, false, false, 1),
  ('25a1a69d-cdb7-4083-bba9-050266b85e82', 'scheduler', true, true, false, true, false, false, 2),
  ('25a1a69d-cdb7-4083-bba9-050266b85e82', 'operations_lead', true, true, true, true, false, true, 3),
  ('25a1a69d-cdb7-4083-bba9-050266b85e82', 'clinic_manager', true, true, true, true, true, true, 4)
ON CONFLICT (clinic_id, role_name) DO UPDATE SET
  can_approve_status_update = EXCLUDED.can_approve_status_update,
  can_approve_waitlist_fill = EXCLUDED.can_approve_waitlist_fill,
  can_approve_overbook = EXCLUDED.can_approve_overbook,
  can_approve_reschedule = EXCLUDED.can_approve_reschedule,
  can_approve_block_insertion = EXCLUDED.can_approve_block_insertion,
  can_override_confidence = EXCLUDED.can_override_confidence,
  max_approval_impact_level = EXCLUDED.max_approval_impact_level,
  updated_at = now();
