/*
  # Remove Duplicate Indexes - Batch 1
  
  1. Changes
    - Remove duplicate indexes that are redundant
    - Keep primary indexes with better naming conventions
    - Reduces storage overhead and maintenance cost
    
  2. Indexes Removed (Part 1)
    - CRM tables: campaigns, cases, follow_ups, keywords, lead_tags, leads
    - Data audit tables
    - Document tracking tables
    - Emergency and equipment tables
*/

-- CRM campaigns duplicates
DROP INDEX IF EXISTS idx_crm_campaigns_clinic;  -- Duplicate of idx_crm_campaigns_clinic_id

-- CRM cases duplicates
DROP INDEX IF EXISTS idx_crm_cases_clinic;  -- Duplicate of idx_crm_cases_clinic_id

-- CRM follow_ups duplicates
DROP INDEX IF EXISTS idx_crm_follow_ups_lead;  -- Duplicate of idx_crm_follow_ups_lead_id

-- CRM keywords duplicates
DROP INDEX IF EXISTS idx_crm_keywords_campaign;  -- Duplicate of idx_crm_keywords_campaign_id

-- CRM lead_tags duplicates
DROP INDEX IF EXISTS idx_crm_lead_tags_lead;  -- Duplicate of idx_crm_lead_tags_lead_id
DROP INDEX IF EXISTS idx_crm_lead_tags_tag;  -- Duplicate of idx_crm_lead_tags_tag_id

-- CRM leads duplicates
DROP INDEX IF EXISTS idx_crm_leads_clinic;  -- Duplicate of idx_crm_leads_clinic_id
DROP INDEX IF EXISTS idx_crm_leads_campaign;  -- Duplicate of idx_crm_leads_campaign_id

-- Data modification audit duplicates
DROP INDEX IF EXISTS idx_data_modification_audit_user;  -- Duplicate of idx_data_modification_audit_user_id

-- Document read receipts duplicates
DROP INDEX IF EXISTS idx_document_read_receipts_user;  -- Duplicate of idx_document_read_receipts_user_id
DROP INDEX IF EXISTS idx_document_read_receipts_document;  -- Duplicate of idx_document_read_receipts_document_id
