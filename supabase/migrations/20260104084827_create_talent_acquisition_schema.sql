/*
  # AIM Autonomous Talent Acquisition Engine - Database Schema

  ## Overview
  Complete database schema for autonomous AI-driven talent acquisition system
  supporting multi-agent workflow orchestration, candidate management, and analytics.

  ## 1. New Tables
  
  ### Core Entities
    - `jobs` - Job requisitions with compensation, requirements, and status tracking
    - `candidates` - Candidate profiles with enrichment data and scoring
    - `applications` - Application tracking linking candidates to jobs
    - `interviews` - Interview scheduling and feedback collection
    - `reference_checks` - Reference check data and scores
    - `offers` - Offer letters and negotiation history
    
  ### Agent System
    - `agents` - Agent registry with capabilities and status
    - `agent_events` - Event queue for agent task distribution
    - `agent_memory` - Persistent memory store for agent state
    - `agent_executions` - Execution logs and performance tracking
    
  ### Workflow & Automation
    - `workflows` - Workflow definitions and triggers
    - `workflow_executions` - Workflow execution history
    - `tasks` - Autonomous task queue
    
  ### Analytics & Reporting
    - `kpis` - Key performance indicators time series
    - `sourcing_channels` - Channel performance tracking
    - `forecasts` - Workforce planning forecasts
    
  ### Communication
    - `messages` - Email/SMS communication log
    - `notifications` - System notifications
    
  ## 2. Security
    - Enable RLS on all tables
    - Policies for authenticated access
    - Service role bypass for agent operations

  ## 3. Indexes
    - Optimized for event processing, candidate search, and analytics queries
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUMS
-- =====================================================

DO $$ BEGIN
  CREATE TYPE job_status AS ENUM ('draft', 'active', 'on_hold', 'filled', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE role_type AS ENUM ('physiotherapist', 'kinesiologist', 'massage_therapist', 'athletic_therapist', 'administrator', 'performance_coach', 'other');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE candidate_status AS ENUM ('new', 'screening', 'interviewing', 'offered', 'hired', 'rejected', 'withdrawn');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE application_status AS ENUM ('applied', 'screening', 'interview_scheduled', 'interviewing', 'interview_completed', 'offered', 'accepted', 'rejected', 'withdrawn');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE interview_type AS ENUM ('screening', 'phone', 'video', 'technical', 'cultural', 'panel', 'final');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE interview_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled', 'no_show');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE event_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE agent_status AS ENUM ('active', 'paused', 'error', 'maintenance');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE task_status AS ENUM ('pending', 'assigned', 'in_progress', 'completed', 'failed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE message_type AS ENUM ('email', 'sms', 'inmail', 'system');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE message_status AS ENUM ('queued', 'sent', 'delivered', 'failed', 'bounced');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  role_type role_type NOT NULL,
  location TEXT NOT NULL,
  department TEXT,
  status job_status DEFAULT 'draft',
  compensation_min NUMERIC(10, 2),
  compensation_max NUMERIC(10, 2),
  compensation_currency TEXT DEFAULT 'CAD',
  job_description TEXT,
  requirements JSONB DEFAULT '{}',
  benefits JSONB DEFAULT '{}',
  created_by_agent TEXT,
  priority_score NUMERIC(3, 1) DEFAULT 5.0,
  target_fill_date DATE,
  filled_date DATE,
  headcount INTEGER DEFAULT 1,
  remote_allowed BOOLEAN DEFAULT false,
  visa_sponsorship BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Candidates table
CREATE TABLE IF NOT EXISTS candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  location TEXT,
  resume_url TEXT,
  resume_text TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  source_channel TEXT,
  source_campaign TEXT,
  enrichment_data JSONB DEFAULT '{}',
  skills JSONB DEFAULT '[]',
  experience_years NUMERIC(4, 1),
  education JSONB DEFAULT '[]',
  certifications JSONB DEFAULT '[]',
  overall_score NUMERIC(5, 2),
  status candidate_status DEFAULT 'new',
  availability_date DATE,
  salary_expectation_min NUMERIC(10, 2),
  salary_expectation_max NUMERIC(10, 2),
  work_authorization TEXT,
  willing_to_relocate BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Applications table
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  status application_status DEFAULT 'applied',
  stage TEXT DEFAULT 'applied',
  screening_score NUMERIC(5, 2),
  screening_notes TEXT,
  interview_scores JSONB DEFAULT '[]',
  technical_assessment_score NUMERIC(5, 2),
  cultural_fit_score NUMERIC(5, 2),
  overall_assessment JSONB DEFAULT '{}',
  offer_details JSONB,
  rejection_reason TEXT,
  rejection_category TEXT,
  withdrawn_reason TEXT,
  assigned_recruiter TEXT,
  assigned_hiring_manager TEXT,
  days_in_pipeline INTEGER DEFAULT 0,
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(candidate_id, job_id)
);

-- Interviews table
CREATE TABLE IF NOT EXISTS interviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  interview_type interview_type NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  location TEXT,
  meeting_link TEXT,
  interviewer_name TEXT,
  interviewer_email TEXT,
  interviewer_ids JSONB DEFAULT '[]',
  status interview_status DEFAULT 'scheduled',
  feedback TEXT,
  feedback_structured JSONB DEFAULT '{}',
  score NUMERIC(5, 2),
  recommendation TEXT,
  strengths JSONB DEFAULT '[]',
  concerns JSONB DEFAULT '[]',
  next_steps TEXT,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  rescheduled_from UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Reference checks table
CREATE TABLE IF NOT EXISTS reference_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  reference_name TEXT NOT NULL,
  reference_email TEXT,
  reference_phone TEXT,
  relationship TEXT,
  company TEXT,
  requested_at TIMESTAMPTZ DEFAULT now(),
  responded_at TIMESTAMPTZ,
  questionnaire_responses JSONB DEFAULT '{}',
  overall_rating NUMERIC(3, 1),
  would_rehire BOOLEAN,
  strengths TEXT,
  areas_for_improvement TEXT,
  additional_comments TEXT,
  risk_flags JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Offers table
CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  offer_letter_url TEXT,
  salary NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'CAD',
  bonus NUMERIC(10, 2) DEFAULT 0,
  equity TEXT,
  benefits_summary TEXT,
  start_date DATE,
  offer_sent_at TIMESTAMPTZ,
  offer_expires_at TIMESTAMPTZ,
  response_received_at TIMESTAMPTZ,
  accepted BOOLEAN,
  declined_reason TEXT,
  negotiation_history JSONB DEFAULT '[]',
  counter_offer_amount NUMERIC(10, 2),
  final_terms JSONB DEFAULT '{}',
  signed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- AGENT SYSTEM TABLES
-- =====================================================

-- Agents registry
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  capabilities JSONB DEFAULT '[]',
  status agent_status DEFAULT 'active',
  config JSONB DEFAULT '{}',
  last_heartbeat_at TIMESTAMPTZ,
  total_executions INTEGER DEFAULT 0,
  total_failures INTEGER DEFAULT 0,
  average_execution_time_ms INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Agent events (event queue)
CREATE TABLE IF NOT EXISTS agent_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_name TEXT NOT NULL,
  event_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  payload JSONB DEFAULT '{}',
  priority INTEGER DEFAULT 5,
  status event_status DEFAULT 'pending',
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  scheduled_for TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  execution_time_ms INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Agent memory (persistent state)
CREATE TABLE IF NOT EXISTS agent_memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_name TEXT NOT NULL,
  memory_key TEXT NOT NULL,
  memory_value JSONB NOT NULL,
  memory_type TEXT DEFAULT 'short_term',
  importance_score NUMERIC(3, 1) DEFAULT 5.0,
  access_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agent_name, memory_key)
);

-- Agent executions (audit log)
CREATE TABLE IF NOT EXISTS agent_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_name TEXT NOT NULL,
  event_id UUID REFERENCES agent_events(id),
  action_taken TEXT,
  input_data JSONB DEFAULT '{}',
  output_data JSONB DEFAULT '{}',
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  execution_time_ms INTEGER,
  tokens_used INTEGER,
  cost_usd NUMERIC(10, 6),
  decisions_made JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- WORKFLOW TABLES
-- =====================================================

-- Workflows
CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL,
  trigger_conditions JSONB DEFAULT '{}',
  actions JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  execution_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMPTZ,
  success_rate NUMERIC(5, 2),
  average_duration_ms INTEGER,
  created_by TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Workflow executions
CREATE TABLE IF NOT EXISTS workflow_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  trigger_event JSONB DEFAULT '{}',
  status event_status DEFAULT 'pending',
  steps_completed INTEGER DEFAULT 0,
  steps_total INTEGER,
  current_step TEXT,
  execution_log JSONB DEFAULT '[]',
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tasks (autonomous task queue)
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL,
  assigned_agent TEXT,
  status task_status DEFAULT 'pending',
  priority task_priority DEFAULT 'medium',
  entity_type TEXT,
  entity_id UUID,
  dependencies JSONB DEFAULT '[]',
  scheduled_for TIMESTAMPTZ DEFAULT now(),
  due_date TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  result JSONB DEFAULT '{}',
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- ANALYTICS TABLES
-- =====================================================

-- KPIs
CREATE TABLE IF NOT EXISTS kpis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_name TEXT NOT NULL,
  metric_value NUMERIC(15, 4) NOT NULL,
  metric_unit TEXT,
  dimensions JSONB DEFAULT '{}',
  period_type TEXT DEFAULT 'daily',
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  calculation_method TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Sourcing channels
CREATE TABLE IF NOT EXISTS sourcing_channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_name TEXT UNIQUE NOT NULL,
  channel_type TEXT,
  is_active BOOLEAN DEFAULT true,
  total_candidates INTEGER DEFAULT 0,
  total_applications INTEGER DEFAULT 0,
  total_hires INTEGER DEFAULT 0,
  average_quality_score NUMERIC(5, 2),
  average_time_to_hire_days NUMERIC(6, 1),
  cost_per_hire NUMERIC(10, 2),
  conversion_rate NUMERIC(5, 2),
  performance_score NUMERIC(5, 2),
  config JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Forecasts
CREATE TABLE IF NOT EXISTS forecasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  forecast_type TEXT NOT NULL,
  location TEXT,
  role_type role_type,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  predicted_demand INTEGER,
  predicted_supply INTEGER,
  shortage_gap INTEGER,
  confidence_score NUMERIC(3, 1),
  factors JSONB DEFAULT '{}',
  recommendations JSONB DEFAULT '[]',
  created_by_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- COMMUNICATION TABLES
-- =====================================================

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_type message_type NOT NULL,
  recipient_type TEXT,
  recipient_id UUID,
  recipient_email TEXT,
  recipient_phone TEXT,
  subject TEXT,
  body TEXT NOT NULL,
  template_name TEXT,
  template_variables JSONB DEFAULT '{}',
  status message_status DEFAULT 'queued',
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  error_message TEXT,
  external_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT,
  priority task_priority DEFAULT 'medium',
  entity_type TEXT,
  entity_id UUID,
  action_url TEXT,
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  dismissed BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_role_type ON jobs(role_type);
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email);
CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status);
CREATE INDEX IF NOT EXISTS idx_candidates_overall_score ON candidates(overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_candidates_source_channel ON candidates(source_channel);

CREATE INDEX IF NOT EXISTS idx_applications_candidate_id ON applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_interviews_application_id ON interviews(application_id);
CREATE INDEX IF NOT EXISTS idx_interviews_scheduled_at ON interviews(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_interviews_status ON interviews(status);

CREATE INDEX IF NOT EXISTS idx_agent_events_agent_name ON agent_events(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_events_status ON agent_events(status);
CREATE INDEX IF NOT EXISTS idx_agent_events_event_type ON agent_events(event_type);
CREATE INDEX IF NOT EXISTS idx_agent_events_scheduled_for ON agent_events(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_agent_events_created_at ON agent_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_memory_agent_name ON agent_memory(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_memory_key ON agent_memory(agent_name, memory_key);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_agent ON tasks(assigned_agent);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_for ON tasks(scheduled_for);

CREATE INDEX IF NOT EXISTS idx_kpis_metric_name ON kpis(metric_name);
CREATE INDEX IF NOT EXISTS idx_kpis_period ON kpis(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_email ON messages(recipient_email);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  DROP TRIGGER IF EXISTS jobs_updated_at ON jobs;
  CREATE TRIGGER jobs_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  DROP TRIGGER IF EXISTS candidates_updated_at ON candidates;
  CREATE TRIGGER candidates_updated_at BEFORE UPDATE ON candidates FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  DROP TRIGGER IF EXISTS applications_updated_at ON applications;
  CREATE TRIGGER applications_updated_at BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  DROP TRIGGER IF EXISTS interviews_updated_at ON interviews;
  CREATE TRIGGER interviews_updated_at BEFORE UPDATE ON interviews FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  DROP TRIGGER IF EXISTS agents_updated_at ON agents;
  CREATE TRIGGER agents_updated_at BEFORE UPDATE ON agents FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  DROP TRIGGER IF EXISTS agent_memory_updated_at ON agent_memory;
  CREATE TRIGGER agent_memory_updated_at BEFORE UPDATE ON agent_memory FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  DROP TRIGGER IF EXISTS workflows_updated_at ON workflows;
  CREATE TRIGGER workflows_updated_at BEFORE UPDATE ON workflows FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  DROP TRIGGER IF EXISTS tasks_updated_at ON tasks;
  CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  DROP TRIGGER IF EXISTS sourcing_channels_updated_at ON sourcing_channels;
  CREATE TRIGGER sourcing_channels_updated_at BEFORE UPDATE ON sourcing_channels FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE reference_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE sourcing_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view jobs" ON jobs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert jobs" ON jobs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update jobs" ON jobs FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete jobs" ON jobs FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view candidates" ON candidates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert candidates" ON candidates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update candidates" ON candidates FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view applications" ON applications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert applications" ON applications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update applications" ON applications FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view interviews" ON interviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage interviews" ON interviews FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can view reference_checks" ON reference_checks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage reference_checks" ON reference_checks FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can view offers" ON offers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage offers" ON offers FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can view agents" ON agents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage agents" ON agents FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can view agent_events" ON agent_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage agent_events" ON agent_events FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can view agent_memory" ON agent_memory FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage agent_memory" ON agent_memory FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can view agent_executions" ON agent_executions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert agent_executions" ON agent_executions FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can view workflows" ON workflows FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage workflows" ON workflows FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can view workflow_executions" ON workflow_executions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage workflow_executions" ON workflow_executions FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can view tasks" ON tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage tasks" ON tasks FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can view kpis" ON kpis FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert kpis" ON kpis FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can view sourcing_channels" ON sourcing_channels FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage sourcing_channels" ON sourcing_channels FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can view forecasts" ON forecasts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert forecasts" ON forecasts FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can view messages" ON messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert messages" ON messages FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can view notifications" ON notifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage notifications" ON notifications FOR ALL TO authenticated USING (true);
