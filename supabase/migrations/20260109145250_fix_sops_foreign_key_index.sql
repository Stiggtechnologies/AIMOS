/*
  # Fix Unindexed Foreign Key on SOPs Table

  This migration adds a missing index on the foreign key column to improve query performance.

  ## Changes
  - Add index on sops.current_version_id to cover the foreign key constraint

  ## Performance Impact
  This index will improve join performance when querying SOPs with their current versions.
*/

CREATE INDEX IF NOT EXISTS idx_sops_current_version_id 
ON sops(current_version_id);