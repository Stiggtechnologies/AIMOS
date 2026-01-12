export type UserRole = 'executive' | 'clinic_manager' | 'clinician' | 'admin' | 'contractor';
export type EmploymentType = 'full_time' | 'part_time' | 'contractor' | 'casual';
export type ContentType = 'document' | 'video' | 'course' | 'quiz' | 'link';
export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'draft' | 'submitted' | 'under_review' | 'resolved' | 'closed';
export type AnnouncementPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  display_name?: string;
  role: UserRole;
  primary_clinic_id?: string;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  last_login_at?: string;
  preferences?: any;
  created_at: string;
  updated_at: string;
}

export interface Clinic {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  province: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  manager_id?: string;
  is_active: boolean;
  operating_hours?: any;
  services_offered?: string[];
  treatment_rooms: number;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface StaffProfile {
  id: string;
  user_id?: string;
  employee_id?: string;
  employment_type: EmploymentType;
  primary_clinic_id?: string;
  job_title?: string;
  department?: string;
  specialization?: string;
  hire_date?: string;
  hourly_rate?: number;
  annual_salary?: number;
  is_licensed: boolean;
  license_number?: string;
  license_expiry?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  skills?: string[];
  languages?: string[];
  bio?: string;
  user?: UserProfile;
  clinic?: Clinic;
}

export interface AcademyCategory {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  icon?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface AcademyContent {
  id: string;
  title: string;
  description?: string;
  content_type: ContentType;
  category_id?: string;
  file_url?: string;
  video_url?: string;
  external_link?: string;
  content_text?: string;
  duration_minutes?: number;
  is_required: boolean;
  required_for_roles?: UserRole[];
  tags?: string[];
  author_id?: string;
  is_published: boolean;
  published_at?: string;
  view_count: number;
  metadata?: any;
  created_at: string;
  updated_at: string;
  category?: AcademyCategory;
  progress?: LearningProgress;
}

export interface LearningProgress {
  id: string;
  user_id: string;
  content_id: string;
  progress_percent: number;
  completed: boolean;
  completed_at?: string;
  time_spent_minutes: number;
  last_accessed_at: string;
  quiz_score?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Policy {
  id: string;
  title: string;
  policy_number?: string;
  category: string;
  description?: string;
  content: string;
  file_url?: string;
  version: string;
  effective_date: string;
  review_date?: string;
  is_active: boolean;
  requires_acknowledgment: boolean;
  applicable_roles?: UserRole[];
  created_by?: string;
  created_at: string;
  updated_at: string;
  acknowledged?: boolean;
}

export interface IncidentReport {
  id: string;
  incident_number: string;
  title: string;
  description: string;
  incident_date: string;
  reported_date: string;
  clinic_id?: string;
  location_details?: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  reported_by: string;
  involved_staff?: any[];
  involved_patients?: any[];
  witnesses?: any[];
  immediate_action_taken?: string;
  follow_up_required: boolean;
  follow_up_notes?: string;
  root_cause_analysis?: string;
  corrective_actions?: any[];
  assigned_to?: string;
  resolved_at?: string;
  attachments?: any[];
  metadata?: any;
  created_at: string;
  updated_at: string;
  clinic?: Clinic;
  reporter?: UserProfile;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  author_id?: string;
  target_roles?: UserRole[];
  target_clinics?: string[];
  is_pinned: boolean;
  is_published: boolean;
  published_at?: string;
  expires_at?: string;
  attachments?: any[];
  created_at: string;
  updated_at: string;
  author?: UserProfile;
  read?: boolean;
}

export interface ClinicMetrics {
  id: string;
  clinic_id: string;
  metric_date: string;
  patient_visits: number;
  revenue: number;
  utilization_rate: number;
  staff_count: number;
  new_patients: number;
  cancellations: number;
  no_shows: number;
  metadata?: any;
  created_at: string;
}

export interface OnboardingTask {
  id: string;
  template_id?: string;
  title: string;
  description?: string;
  category?: string;
  sort_order: number;
  days_to_complete: number;
  is_required: boolean;
  assigned_to_role?: string;
  instructions?: string;
  completion_criteria?: string;
  created_at: string;
}

export interface OnboardingProgress {
  id: string;
  user_id: string;
  task_id: string;
  template_id?: string;
  status: string;
  assigned_to?: string;
  due_date?: string;
  completed: boolean;
  completed_at?: string;
  completed_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  task?: OnboardingTask;
}
