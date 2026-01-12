export type JobStatus = 'draft' | 'active' | 'on_hold' | 'filled' | 'cancelled';
export type RoleType = 'physiotherapist' | 'kinesiologist' | 'massage_therapist' | 'athletic_therapist' | 'administrator' | 'performance_coach' | 'other';
export type CandidateStatus = 'new' | 'screening' | 'interviewing' | 'offered' | 'hired' | 'rejected' | 'withdrawn';
export type ApplicationStatus = 'applied' | 'screening' | 'interview_scheduled' | 'interviewing' | 'interview_completed' | 'offered' | 'accepted' | 'rejected' | 'withdrawn';
export type EventStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type AgentStatus = 'active' | 'paused' | 'error' | 'maintenance';
export type TaskStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Job {
  id: string;
  title: string;
  role_type: RoleType;
  location: string;
  department?: string;
  status: JobStatus;
  compensation_min?: number;
  compensation_max?: number;
  compensation_currency: string;
  job_description?: string;
  requirements?: any;
  benefits?: any;
  created_by_agent?: string;
  priority_score: number;
  target_fill_date?: string;
  filled_date?: string;
  headcount: number;
  remote_allowed: boolean;
  visa_sponsorship: boolean;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface Candidate {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  location?: string;
  resume_url?: string;
  resume_text?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  source_channel?: string;
  source_campaign?: string;
  enrichment_data?: any;
  skills?: string[];
  experience_years?: number;
  education?: any[];
  certifications?: any[];
  overall_score?: number;
  status: CandidateStatus;
  availability_date?: string;
  salary_expectation_min?: number;
  salary_expectation_max?: number;
  work_authorization?: string;
  willing_to_relocate: boolean;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  candidate_id: string;
  job_id: string;
  status: ApplicationStatus;
  stage: string;
  screening_score?: number;
  screening_notes?: string;
  interview_scores?: any[];
  technical_assessment_score?: number;
  cultural_fit_score?: number;
  overall_assessment?: any;
  offer_details?: any;
  rejection_reason?: string;
  rejection_category?: string;
  withdrawn_reason?: string;
  assigned_recruiter?: string;
  assigned_hiring_manager?: string;
  days_in_pipeline: number;
  last_activity_at: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
  candidate?: Candidate;
  job?: Job;
}

export interface Agent {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  capabilities?: string[];
  status: AgentStatus;
  config?: any;
  last_heartbeat_at?: string;
  total_executions: number;
  total_failures: number;
  average_execution_time_ms?: number;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface AgentEvent {
  id: string;
  agent_name: string;
  event_type: string;
  entity_type?: string;
  entity_id?: string;
  payload?: any;
  priority: number;
  status: EventStatus;
  error_message?: string;
  retry_count: number;
  max_retries: number;
  scheduled_for: string;
  started_at?: string;
  completed_at?: string;
  execution_time_ms?: number;
  metadata?: any;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  task_type: string;
  assigned_agent?: string;
  status: TaskStatus;
  priority: TaskPriority;
  entity_type?: string;
  entity_id?: string;
  dependencies?: string[];
  scheduled_for: string;
  due_date?: string;
  started_at?: string;
  completed_at?: string;
  result?: any;
  error_message?: string;
  retry_count: number;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface KPI {
  id: string;
  metric_name: string;
  metric_value: number;
  metric_unit?: string;
  dimensions?: any;
  period_type: string;
  period_start: string;
  period_end: string;
  calculation_method?: string;
  metadata?: any;
  created_at: string;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  trigger_type: string;
  trigger_conditions?: any;
  actions?: any[];
  is_active: boolean;
  execution_count: number;
  last_executed_at?: string;
  success_rate?: number;
  average_duration_ms?: number;
  created_by?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}
