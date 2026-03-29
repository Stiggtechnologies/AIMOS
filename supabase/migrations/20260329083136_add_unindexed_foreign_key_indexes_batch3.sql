/*
  # Add Indexes for Unindexed Foreign Keys - Batch 3 (Final)
  
  Final batch covering soap_notes, spend_alerts, system_alerts, treatment_plans,
  user_scope_memberships, user_tasks, and all wf_* (workflow) tables.
*/

-- soap_notes
CREATE INDEX IF NOT EXISTS idx_soap_notes_signed_by ON soap_notes(signed_by);

-- spend_alerts
CREATE INDEX IF NOT EXISTS idx_spend_alerts_category_id ON spend_alerts(category_id);
CREATE INDEX IF NOT EXISTS idx_spend_alerts_resolved_by ON spend_alerts(resolved_by);

-- system_alerts
CREATE INDEX IF NOT EXISTS idx_system_alerts_acknowledged_by ON system_alerts(acknowledged_by);
CREATE INDEX IF NOT EXISTS idx_system_alerts_resolved_by ON system_alerts(resolved_by);

-- treatment_plans
CREATE INDEX IF NOT EXISTS idx_treatment_plans_clinician_id ON treatment_plans(clinician_id);

-- user_scope_memberships
CREATE INDEX IF NOT EXISTS idx_user_scope_memberships_granted_by ON user_scope_memberships(granted_by);

-- user_tasks
CREATE INDEX IF NOT EXISTS idx_user_tasks_assigned_by ON user_tasks(assigned_by);

-- wf_content_approvals
CREATE INDEX IF NOT EXISTS idx_wf_content_approvals_content_item_id ON wf_content_approvals(content_item_id);
CREATE INDEX IF NOT EXISTS idx_wf_content_approvals_requested_by ON wf_content_approvals(requested_by_user_id);
CREATE INDEX IF NOT EXISTS idx_wf_content_approvals_requested_from ON wf_content_approvals(requested_from_user_id);

-- wf_content_assets
CREATE INDEX IF NOT EXISTS idx_wf_content_assets_content_item_id ON wf_content_assets(content_item_id);

-- wf_content_items
CREATE INDEX IF NOT EXISTS idx_wf_content_items_created_by ON wf_content_items(created_by);
CREATE INDEX IF NOT EXISTS idx_wf_content_items_owner_user_id ON wf_content_items(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_wf_content_items_primary_channel_id ON wf_content_items(primary_channel_id);

-- wf_content_variants
CREATE INDEX IF NOT EXISTS idx_wf_content_variants_channel_id ON wf_content_variants(channel_id);
CREATE INDEX IF NOT EXISTS idx_wf_content_variants_content_item_id ON wf_content_variants(content_item_id);

-- wf_integration_accounts
CREATE INDEX IF NOT EXISTS idx_wf_integration_accounts_location_id ON wf_integration_accounts(location_id);

-- wf_notification_events
CREATE INDEX IF NOT EXISTS idx_wf_notification_events_target_user_id ON wf_notification_events(target_user_id);

-- wf_publish_jobs
CREATE INDEX IF NOT EXISTS idx_wf_publish_jobs_content_item_id ON wf_publish_jobs(content_item_id);
CREATE INDEX IF NOT EXISTS idx_wf_publish_jobs_content_variant_id ON wf_publish_jobs(content_variant_id);
CREATE INDEX IF NOT EXISTS idx_wf_publish_jobs_idempotency_key_id ON wf_publish_jobs(idempotency_key_id);
CREATE INDEX IF NOT EXISTS idx_wf_publish_jobs_location_id ON wf_publish_jobs(location_id);

-- wf_publish_results
CREATE INDEX IF NOT EXISTS idx_wf_publish_results_publish_job_id ON wf_publish_results(publish_job_id);

-- wf_review_approvals
CREATE INDEX IF NOT EXISTS idx_wf_review_approvals_draft_id ON wf_review_approvals(draft_id);
CREATE INDEX IF NOT EXISTS idx_wf_review_approvals_requested_from ON wf_review_approvals(requested_from_user_id);
CREATE INDEX IF NOT EXISTS idx_wf_review_approvals_review_id ON wf_review_approvals(review_id);

-- wf_review_drafts
CREATE INDEX IF NOT EXISTS idx_wf_review_drafts_drafted_by ON wf_review_drafts(drafted_by_user_id);
CREATE INDEX IF NOT EXISTS idx_wf_review_drafts_review_id ON wf_review_drafts(review_id);

-- wf_review_flags
CREATE INDEX IF NOT EXISTS idx_wf_review_flags_review_id ON wf_review_flags(review_id);

-- wf_users
CREATE INDEX IF NOT EXISTS idx_wf_users_auth_user_id ON wf_users(auth_user_id);

-- wf_workflow_exceptions
CREATE INDEX IF NOT EXISTS idx_wf_workflow_exceptions_workflow_run_id ON wf_workflow_exceptions(workflow_run_id);
