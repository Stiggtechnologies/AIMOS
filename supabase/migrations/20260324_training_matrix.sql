-- AIM Training Matrix Database Schema
-- Phase 1: Core training infrastructure

-- Training modules
CREATE TABLE training_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_code TEXT UNIQUE NOT NULL,
  module_name TEXT NOT NULL,
  description TEXT,
  training_category TEXT NOT NULL, -- e.g., 'Safe Practice & Compliance', 'Clinical Excellence'
  audience_type TEXT NOT NULL, -- 'All', 'Clinical', 'Operations', 'Leadership', etc.
  delivery_method TEXT NOT NULL, -- 'LMS', 'Live', 'Workshop', 'Shadow', 'Simulation', 'Observed'
  duration_hours DECIMAL(4,2),
  is_required BOOLEAN DEFAULT true,
  is_enterprise_core BOOLEAN DEFAULT false,
  renewal_frequency TEXT, -- 'Annual', 'Bi-annual', 'None'
  assessment_type TEXT, -- 'Quiz', 'Scenario', 'Observed', 'Audit', 'Sign-off'
  passing_threshold TEXT, -- '80%', 'Pass/Fail', etc.
  pre_requisites JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Training academies (schools)
CREATE TABLE training_academies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_code TEXT UNIQUE NOT NULL,
  academy_name TEXT NOT NULL,
  description TEXT,
  target_audience TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link modules to academies
CREATE TABLE training_academy_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID REFERENCES training_academies(id) ON DELETE CASCADE,
  module_id UUID REFERENCES training_modules(id) ON DELETE CASCADE,
  sort_order INT DEFAULT 0,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Role training pathways
CREATE TABLE role_training_pathways (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_code TEXT UNIQUE NOT NULL,
  role_name TEXT NOT NULL,
  role_family TEXT NOT NULL, -- 'Leadership', 'Clinical', 'Operations', 'Support', 'Contractor'
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Module assignments to roles
CREATE TABLE role_module_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_code TEXT REFERENCES role_training_pathways(role_code) ON DELETE CASCADE,
  module_id UUID REFERENCES training_modules(id) ON DELETE CASCADE,
  timing_window TEXT NOT NULL, -- 'Pre-start', 'Day 1', 'Week 1', 'Week 2-4', etc.
  timing_days_from_start INT NOT NULL, -- Day offset from employment start
  is_required BOOLEAN DEFAULT true,
  assessment_type TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 30-60-90 day competencies
CREATE TABLE competency_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_code TEXT REFERENCES role_training_pathways(role_code) ON DELETE CASCADE,
  milestone_day INT NOT NULL, -- 30, 60, 90
  milestone_name TEXT NOT NULL,
  description TEXT,
  competencies JSONB NOT NULL, -- Array of competency items
  required_actions JSONB DEFAULT '[]',
  sign_off_required BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Training enrollments (tracking who needs what)
CREATE TABLE training_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id UUID REFERENCES training_modules(id) ON DELETE CASCADE,
  assigned_date TIMESTAMPTZ DEFAULT NOW(),
  due_date TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,
  status TEXT DEFAULT 'Not Started', -- 'Not Started', 'In Progress', 'Completed', 'Overdue'
  assessment_score DECIMAL(5,2),
  assessment_attempts INT DEFAULT 0,
  evidence_url TEXT,
  signed_off_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Policy acknowledgments
CREATE TABLE policy_acknowledgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_code TEXT NOT NULL,
  policy_name TEXT NOT NULL,
  policy_version TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  acknowledged_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  browser_info TEXT
);

-- Annual recertification tracking
CREATE TABLE recertification_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  completed_date TIMESTAMPTZ,
  status TEXT DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Training analytics
CREATE TABLE training_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date DATE NOT NULL,
  total_enrollments INT DEFAULT 0,
  completed_count INT DEFAULT 0,
  overdue_count INT DEFAULT 0,
  avg_assessment_score DECIMAL(5,2),
  by_role JSONB DEFAULT '{}',
  by_module JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_academies ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_academy_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_training_pathways ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_module_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE competency_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_acknowledgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE recertification_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_analytics ENABLE ROW LEVEL SECURITY;

-- Public read for training content
CREATE POLICY "Public training content" ON training_modules FOR SELECT USING (true);
CREATE POLICY "Public academies" ON training_academies FOR SELECT USING (true);
CREATE POLICY "Public academy modules" ON training_academy_modules FOR SELECT USING (true);
CREATE POLICY "Public role pathways" ON role_training_pathways FOR SELECT USING (true);
CREATE POLICY "Public role assignments" ON role_module_assignments FOR SELECT USING (true);
CREATE POLICY "Public competencies" ON competency_milestones FOR SELECT USING (true);

-- Users can see their own enrollments
CREATE POLICY "Own enrollments" ON training_enrollments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Own policies" ON policy_acknowledgments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Own recert" ON recertification_schedule FOR SELECT USING (auth.uid() = user_id);

-- Managers/admins can manage all enrollments
CREATE POLICY "Manage all enrollments" ON training_enrollments FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'clinic_manager', 'executive'))
);

-- Insert training academies
INSERT INTO training_academies (academy_code, academy_name, description, target_audience, sort_order) VALUES
('SCHOOL1', 'Welcome to AIM', 'Company orientation and culture', 'All', 1),
('SCHOOL2', 'Safe Practice & Compliance', 'Privacy, OHS, infection control, boundaries', 'All', 2),
('SCHOOL3', 'Clinical Excellence', 'Clinical skills and documentation', 'Clinical staff', 3),
('SCHOOL4', 'Patient Access & Revenue', 'Front desk, billing, intake', 'Operations', 4),
('SCHOOL5', 'Leadership Academy', 'Management and governance', 'Managers', 5),
('SCHOOL6', 'Digital Operations', 'AIM OS, EMR, systems', 'All users', 6),
('SCHOOL7', 'Specialty Pathways', 'Concussion, pelvic health, pediatrics', 'Specialist clinicians', 7);

-- Insert role families
INSERT INTO role_training_pathways (role_code, role_name, role_family, description) VALUES
('OWNER', 'Owner / CEO', 'Leadership', 'Executive leadership'),
('COO', 'COO / Director of Operations', 'Leadership', 'Operations director'),
('REGIONAL_MGR', 'Regional Manager', 'Leadership', 'Multi-site management'),
('CLINIC_MGR', 'Clinic Manager', 'Leadership', 'Single clinic leadership'),
('CLINICAL_DIR', 'Clinical Director', 'Leadership', 'Clinical governance'),
('PT', 'Physiotherapist', 'Clinical', 'Licensed PT'),
('PT_PELVIC', 'Pelvic Health PT', 'Clinical', 'Specialty pelvic health'),
('PT_CONCUSSION', 'Concussion/Vestibular PT', 'Clinical', 'Specialty concussion'),
('PT_PEDIA', 'Pediatric PT', 'Clinical', 'Specialty pediatrics'),
('OT', 'Occupational Therapist', 'Clinical', 'Licensed OT'),
('CHIRO', 'Chiropractor', 'Clinical', 'Licensed DC'),
('RMT', 'Massage Therapist', 'Clinical', 'Licensed RMT'),
('PTA', 'PT Assistant', 'Clinical Support', 'PT aide'),
('KINESIO', 'Kinesiologist', 'Clinical Support', 'Exercise therapist'),
('ATHLETIC_THERAPIST', 'Athletic Therapist', 'Clinical Support', 'CAT'),
('THERAPY_AIDE', 'Therapy Aide', 'Clinical Support', 'Unlicensed aide'),
('STUDENT', 'Student/Intern', 'Clinical Support', 'Practicum learner'),
('FRONT_DESK', 'Front Desk / Patient Coordinator', 'Operations', 'Reception'),
('INTAKE_COORD', 'Intake Coordinator', 'Operations', 'Referral intake'),
('BILLING', 'Billing Specialist', 'Operations', 'Revenue cycle'),
('WCB_COORD', 'WCB Coordinator', 'Operations', 'Worker compensation'),
('CALL_CENTER', 'Call Center / Virtual Booking', 'Operations', 'Central booking'),
('HR', 'HR / People Operations', 'Operations', 'Human resources'),
('MARKETING', 'Marketing / Communications', 'Operations', 'Marketing'),
('IT_ADMIN', 'IT / Systems Admin', 'Operations', 'Technical admin'),
('QA', 'Quality & Compliance', 'Operations', 'Compliance lead'),
('CONTRACTOR', 'Independent Contractor', 'Contractor', 'Contract clinician'),
('LOCUM', 'Locum Clinician', 'Contractor', 'Temporary clinician'),
('CLEANER', 'Cleaner / Janitor', 'Vendor', 'Facilities');

-- Insert core enterprise modules
INSERT INTO training_modules (module_code, module_name, description, training_category, audience_type, delivery_method, duration_hours, is_required, is_enterprise_core, renewal_frequency, assessment_type, passing_threshold) VALUES
('CORE001', 'AIM Mission, Values & Culture', 'Company story, patient promise, growth plan', 'Welcome to AIM', 'All', 'Live', 2, true, true, 'Annual', 'Attendance', 'Pass/Fail'),
('CORE002', 'Code of Conduct & Respectful Workplace', 'Expected behaviors, escalation pathways', 'Welcome to AIM', 'All', 'LMS', 1, true, true, 'Annual', 'Quiz', '80%'),
('CORE003', 'Privacy & Confidentiality Basics', 'PIPA, HIA, need-to-know, breach reporting', 'Safe Practice & Compliance', 'All', 'LMS', 1.5, true, true, 'Annual', 'Quiz', '80%'),
('CORE004', 'Alberta OHS Orientation', 'Worker rights, hazard awareness, safe work', 'Safe Practice & Compliance', 'All', 'Live', 2, true, true, 'Annual', 'Checklist', 'Pass/Fail'),
('CORE005', 'Workplace Violence & Harassment', 'Prevention, reporting, response', 'Safe Practice & Compliance', 'All', 'LMS', 1, true, true, 'Annual', 'Quiz', '80%'),
('CORE006', 'Emergency Procedures', 'Fire, evacuation, medical emergency codes', 'Safe Practice & Compliance', 'All', 'Live', 1.5, true, true, 'Annual', 'Drill', 'Pass/Fail'),
('CORE007', 'Infection Prevention & Control', 'Hand hygiene, cleaning, PPE, blood exposure', 'Safe Practice & Compliance', 'All patient-facing', 'LMS + Demo', 2, true, true, 'Annual', 'Demo', 'Pass/Fail'),
('CORE008', 'Cybersecurity & System Access', 'Passwords, MFA, phishing, device security', 'Safe Practice & Compliance', 'All', 'LMS', 1, true, true, 'Annual', 'Quiz', '80%'),
('CORE009', 'Documentation Standards by Role', 'Charting, timeliness, corrections', 'Safe Practice & Compliance', 'All', 'LMS + Live', 1.5, true, true, 'Annual', 'Audit', 'Pass/Fail'),
('CORE010', 'Service Standards & De-escalation', 'Customer service, handling upset patients', 'Welcome to AIM', 'All', 'Role-play', 1.5, true, true, 'Annual', 'Scenario', 'Pass/Fail'),
('CORE011', 'AIM Systems Orientation', 'Email, Slack, EMR, AIM OS access', 'Digital Operations', 'All relevant', 'Live', 2, true, true, 'None', 'Access Validation', 'Pass/Fail'),
('CORE012', 'Professional Boundaries', 'Gifts, social media, chaperones, conduct', 'Safe Practice & Compliance', 'Clinical', 'LMS', 1, true, true, 'Annual', 'Quiz', '80%');

-- Insert role-specific modules
INSERT INTO training_modules (module_code, module_name, description, training_category, audience_type, delivery_method, duration_hours, is_required, is_enterprise_core, renewal_frequency, assessment_type, passing_threshold) VALUES
('PT001', 'PT Registration & Credential Verification', 'CPTA registration, insurance verification', 'Clinical Excellence', 'PT', 'Admin', 0.5, true, false, 'Annual', 'Verification', 'Pass/Fail'),
('PT002', 'AIM Clinical Model & Care Pathways', 'Care pathways, clinical protocols', 'Clinical Excellence', 'PT', 'Workshop', 2, true, false, 'None', 'Attendance', 'Pass/Fail'),
('PT003', 'Consent in Practice', 'Informed consent, documentation, withdrawal', 'Clinical Excellence', 'PT', 'LMS + Discussion', 1.5, true, false, 'Annual', 'Quiz + Observed', '80%'),
('PT004', 'Documentation & Charting Standards', 'SOAP, timeliness, corrections, subjective/objective', 'Clinical Excellence', 'PT', 'Live + Review', 2, true, false, 'Annual', 'Chart Audit', 'Pass/Fail'),
('PT005', 'Assessment & Reassessment Expectations', 'Evaluation standards, outcome measures', 'Clinical Excellence', 'PT', 'Shadow + Observed', 4, true, false, 'None', 'Observed', 'Pass/Fail'),
('PT006', 'Billing Integrity & Insurer Documentation', 'Alberta billing, WCB, insurer requirements', 'Clinical Excellence', 'PT', 'Workshop', 2, true, false, 'Annual', 'Audit', 'Pass/Fail'),
('PT007', 'Delegation & Supervision of Assistants', 'PTA supervision, scope of practice', 'Clinical Excellence', 'PT', 'Workshop', 1.5, true, false, 'None', 'Scenario', 'Pass/Fail'),
('PT008', 'Sexual Abuse/Misconduct Prevention', 'CPTA mandatory training, boundaries', 'Clinical Excellence', 'PT', 'LMS', 1, true, false, 'Annual', 'Quiz', '80%'),
('MGR001', 'Opening/Closing Procedures', 'Daily operations, security, deposits', 'Leadership Academy', 'Clinic Manager', 'Shadow + SOP', 2, true, false, 'None', 'Observation', 'Pass/Fail'),
('MGR002', 'Scheduling & Capacity Management', 'Utilization, staffing, productivity', 'Leadership Academy', 'Clinic Manager', 'Workshop', 2, true, false, 'None', 'Simulation', 'Pass/Fail'),
('MGR003', 'Staffing & Coverage Management', 'Absence, overtime, relief scheduling', 'Leadership Academy', 'Clinic Manager', 'Workshop', 1.5, true, false, 'None', 'Scenario', 'Pass/Fail'),
('MGR004', 'Privacy Complaints & Breach Escalation', 'Incident response, OIPC reporting', 'Leadership Academy', 'Clinic Manager', 'Workshop', 1.5, true, false, 'Annual', 'Scenario', 'Pass/Fail'),
('MGR005', 'Incident Reporting & OHS Leadership', 'Near miss, injury, emergency response', 'Leadership Academy', 'Clinic Manager', 'Live + Scenario', 2, true, false, 'Annual', 'Drill', 'Pass/Fail'),
('MGR006', 'Patient Complaint Handling', 'Service recovery, escalation, documentation', 'Leadership Academy', 'Clinic Manager', 'Role-play', 1.5, true, false, 'Annual', 'Role-play', 'Pass/Fail'),
('MGR007', 'KPI Dashboard & Huddles', 'Daily huddles, weekly reviews, scorecards', 'Leadership Academy', 'Clinic Manager', 'Workshop', 2, true, false, 'None', 'Live Huddle', 'Pass/Fail'),
('MGR008', 'Hiring, Onboarding & Coaching', 'Recruitment, performance, documentation', 'Leadership Academy', 'Clinic Manager', 'Workshop', 2, true, false, 'None', 'File Review', 'Pass/Fail'),
('FD001', 'Phone Etiquette & Brand Scripts', 'Inbound call handling, messaging', 'Patient Access & Revenue', 'Front Desk', 'Role-play', 2, true, false, 'None', 'Simulation', 'Pass/Fail'),
('FD002', 'Booking & Schedule Management', 'EMR scheduling, double-booking, waitlist', 'Patient Access & Revenue', 'Front Desk', 'Systems Training', 2, true, false, 'None', 'Workflow Check', 'Pass/Fail'),
('FD003', 'Intake & Registration', 'Patient data, insurance, referral capture', 'Patient Access & Revenue', 'Front Desk', 'Live', 2, true, false, 'None', '5 Registrations', 'Pass/Fail'),
('FD004', 'Insurance/WCB/Referral Data Capture', 'Payer info, authorization, WCB claims', 'Patient Access & Revenue', 'Front Desk', 'Live', 1.5, true, false, 'Annual', 'Audit', 'Pass/Fail'),
('FD005', 'Privacy at Front Desk', 'Screen privacy, verbal privacy,HIPAA', 'Patient Access & Revenue', 'Front Desk', 'LMS + Scenario', 1, true, false, 'Annual', 'Scenario', 'Pass/Fail'),
('FD006', 'Payment Collection & Receipts', 'POS, balances, refund policy', 'Patient Access & Revenue', 'Front Desk', 'Live', 1.5, true, false, 'None', 'Mock Checkout', 'Pass/Fail'),
('FD007', 'No-Show/Cancellation Scripts', 'Policy enforcement, rescheduling', 'Patient Access & Revenue', 'Front Desk', 'Role-play', 1, true, false, 'None', 'Role-play', 'Pass/Fail'),
('FD008', 'Upset Patient Handling', 'De-escalation, service recovery', 'Patient Access & Revenue', 'Front Desk', 'Role-play', 1.5, true, false, 'Annual', 'Scenario', 'Pass/Fail'),
('BILL001', 'Payer & Insurer Setup', 'WCB, Alberta Blue Cross, Sun Life setup', 'Patient Access & Revenue', 'Billing', 'Live', 2, true, false, 'None', 'Checklist', 'Pass/Fail'),
('BILL002', 'WCB & Insurer Workflows', 'Claims submission, forms, timelines', 'Patient Access & Revenue', 'Billing', 'Workshop', 3, true, false, 'None', 'Case Test', 'Pass/Fail'),
('BILL003', 'Claim Submission & Reconciliation', 'Clean claims, ERA, day-end', 'Patient Access & Revenue', 'Billing', 'Systems Training', 3, true, false, 'None', '10 Claims', 'Pass/Fail'),
('BILL004', 'Denial/Rejection Management', 'Appeals, resubmission, denial reasons', 'Patient Access & Revenue', 'Billing', 'Workshop', 2, true, false, 'None', 'Mock Denial', 'Pass/Fail'),
('BILL005', 'Privacy in Billing', 'Collection calls, statements, PCI', 'Patient Access & Revenue', 'Billing', 'LMS', 1, true, false, 'Annual', 'Quiz', '80%');

-- Insert 30-60-90 milestones for key roles
INSERT INTO competency_milestones (role_code, milestone_day, milestone_name, description, competencies, required_actions) VALUES
('PT', 30, 'Safe with Supervision', 'Can perform routine duties with support', 
  '["Charting meets standards", "Understands consent process", "Follows care pathways", "Privacy compliant", "IPC awareness demonstrated"]',
  '["5 chart audits passed", "3 observed evaluations", "Consent discussion observed"]'),
('PT', 60, 'Increasing Autonomy', 'Can manage normal caseload with moderate oversight',
  '["Independent documentation", "Appropriate escalation", "Handles common presentations", "Utilization meeting targets"]',
  '["3 observed follow-ups", "2 care plan reviews", "KPI introduction"]'),
('PT', 90, 'Fully Integrated', 'Independent practice, meets KPIs',
  '["Normal caseload independent", "Documentation audit pass", "Patient experience good", "Billing accurate"]',
  '["Billing audit passed", "Discharge summary review", "Final competency sign-off"]'),
('CLINIC_MGR', 30, 'Managing Daily Flow', 'Runs clinic with support',
  '["Opening/closing procedures", "Daily huddles", "Staff scheduling", "Basic KPI understanding"]',
  '["Run daily huddle", "Manage no-show day", "Complete site audit checklist"]'),
('CLINIC_MGR', 60, 'Independent Management', 'Manages clinic independently',
  '["Full scheduling autonomy", "Staff coaching", "Incident management", "Budget awareness"]',
  '["Handle privacy complaint", "Approve supply order", "Run weekly team meeting"]'),
('CLINIC_MGR', 90, 'KPI Ownership', 'Owns KPI cadence, coaching, escalation',
  '["Full P&L awareness", "Staff performance management", "Quality/audit ownership", "Escalation mastery"]',
  '["Complete 30-60-90 scorecard", "Quarterly training calendar", "Final sign-off"]'),
('FRONT_DESK', 30, 'Safe and Functional', 'Accurate in routine workflows',
  '["Booking flow independent", "Complete intake", "Privacy consistent", "Payment accurate"]',
  '["10 test bookings", "5 registrations", "Payment simulation"]'),
('BILLING', 30, 'Safe in Workflows', 'Understands payer rules',
  '["Clean claim submission", "Reconciliation basics", "Denial understanding"]',
  '["Submit 10 clean claims", "Complete reconciliation", "Pass claim audit"]');

-- Insert site orientation items
CREATE TABLE site_orientation_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_item TEXT NOT NULL,
  category TEXT NOT NULL, -- 'Access', 'Safety', 'Equipment', 'Workflow', 'Hazards'
  is_required BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0
);

INSERT INTO site_orientation_checklist (checklist_item, category, sort_order) VALUES
('Building access / alarm / keys / badge', 'Access', 1),
('Tour of treatment rooms / gym / reception / storage', 'Access', 2),
('Emergency exits / muster point / fire extinguisher / first aid', 'Safety', 3),
('Staff washroom / locker / lunchroom', 'Safety', 4),
('Cleaning stations and PPE locations', 'Safety', 5),
('Equipment-specific orientation', 'Equipment', 6),
('Laundry/cleaning flow', 'Equipment', 7),
('Site-specific hazards', 'Hazards', 8),
('Opening / closing workflow', 'Workflow', 9),
('Contact list and escalation tree', 'Workflow', 10);

-- Create indexes
CREATE INDEX idx_training_enrollments_user ON training_enrollments(user_id);
CREATE INDEX idx_training_enrollments_module ON training_enrollments(module_id);
CREATE INDEX idx_training_enrollments_status ON training_enrollments(status);
CREATE INDEX idx_role_modules_role ON role_module_assignments(role_code);
CREATE INDEX idx_recert_user ON recertification_schedule(user_id);
CREATE INDEX idx_recert_due ON recertification_schedule(due_date);

-- Function to auto-create enrollments for new hires
CREATE OR REPLACE FUNCTION auto_assign_training(user_uuid UUID, role_code TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO training_enrollments (user_id, module_id, due_date, status)
  SELECT 
    user_uuid,
    rm.module_id,
    NOW() + (rm.timing_days_from_start || ' days')::INTERVAL,
    'Not Started'
  FROM role_module_assignments rm
  WHERE rm.role_code = role_code AND rm.is_required = true
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update enrollment status
CREATE OR REPLACE FUNCTION complete_training_module(enrollment_id UUID, score DECIMAL)
RETURNS VOID AS $$
BEGIN
  UPDATE training_enrollments 
  SET status = 'Completed', 
      completed_date = NOW(), 
      assessment_score = score
  WHERE id = enrollment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER training_modules_updated 
  BEFORE UPDATE ON training_modules 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Comments
COMMENT ON TABLE training_modules IS 'Core training module definitions';
COMMENT ON TABLE training_academies IS 'Training schools/academies (AIM University structure)';
COMMENT ON TABLE role_training_pathways IS 'Role definitions with training pathways';
COMMENT ON TABLE role_module_assignments IS 'Module assignments to roles with timing';
COMMENT ON TABLE competency_milestones IS '30-60-90 day competency milestones by role';
COMMENT ON TABLE training_enrollments IS 'Training tracking - who is enrolled in what';
COMMENT ON TABLE policy_acknowledgments IS 'Policy acknowledgment tracking';
COMMENT ON TABLE recertification_schedule IS 'Annual recertification tracking';
