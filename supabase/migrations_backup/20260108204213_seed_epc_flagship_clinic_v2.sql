/*
  # Seed EPC Flagship Clinic Configuration

  1. Creates EPC clinic in clinics table
  2. Creates partner clinic configuration
  3. Configures revenue share parameters
  4. Marks as flagship and replication template
*/

-- Insert EPC clinic (if not exists)
INSERT INTO clinics (
  name,
  code,
  city,
  province,
  address,
  postal_code,
  phone,
  email,
  is_active,
  treatment_rooms,
  metadata
) VALUES (
  'AIM Performance West – EPC',
  'EPC-YEG-001',
  'Edmonton',
  'AB',
  '11420 170 St NW, Edmonton, AB',
  'T5M 3Y7',
  '587-XXX-XXXX',
  'epc@aim.ca',
  false,
  2,
  jsonb_build_object(
    'partner_name', 'Edmonton Pickleball Center',
    'launch_type', 'embedded_partner',
    'facility_type', 'sports_facility',
    'sport_focus', 'pickleball',
    'status', 'planning'
  )
)
ON CONFLICT (code) DO NOTHING;

-- Create partner clinic configuration for EPC
INSERT INTO partner_clinics (
  clinic_id,
  partner_name,
  partner_type,
  partner_member_base,
  partner_location_type,
  partner_contact_email,
  is_flagship_location,
  is_replication_template,
  template_name,
  partnership_start_date,
  status,
  revenue_share_enabled,
  revenue_share_rate,
  revenue_share_cap,
  revenue_share_cap_period,
  square_footage,
  space_description,
  notes,
  metadata
)
SELECT 
  c.id,
  'Edmonton Pickleball Center',
  'sports_facility'::partner_clinic_type,
  5000,
  'Pickleball Facility',
  'partnership@edmontonpickleballcenter.com',
  true,
  true,
  'Embedded Sports Facility Template',
  CURRENT_DATE,
  'active'::partner_status,
  true,
  5.00,
  40000.00,
  'annual',
  400,
  'Embedded clinic space within pickleball facility, approximately 400 sq ft',
  'EPC Flagship - Reference implementation for all future embedded partner locations. Revenue share: 5% up to $40K annually on EPC-sourced patients only.',
  jsonb_build_object(
    'facility_hours', '6 AM - 10 PM, 7 days/week',
    'peak_times', jsonb_build_array('5-9 PM weekdays', '8 AM - 6 PM weekends'),
    'target_demographics', jsonb_build_array(
      'Active adults 25-65',
      'Seniors 65+',
      'Competitive pickleball players',
      'Recreational players'
    ),
    'injury_patterns', jsonb_build_array(
      'Shoulder (rotator cuff)',
      'Elbow (tennis/golfer elbow)',
      'Knee (meniscus, patella)',
      'Ankle sprains',
      'Lower back'
    ),
    'service_presets', jsonb_build_object(
      'sports_injury_physiotherapy', jsonb_build_object(
        'enabled', true,
        'focus_areas', jsonb_build_array(
          'Pickleball-specific shoulder injuries',
          'Elbow tendinopathies',
          'Knee injuries',
          'Ankle sprains',
          'Lower back pain'
        )
      ),
      'return_to_play_programs', jsonb_build_object(
        'enabled', true,
        'programs', jsonb_build_array(
          'Post-injury return to court',
          'Progressive loading protocols',
          'Sport-specific movement patterns'
        )
      ),
      'injury_prevention', jsonb_build_object(
        'enabled', true,
        'target_audience', 'All EPC members'
      ),
      'performance_rehab', jsonb_build_object(
        'enabled', true,
        'integration', 'Court + gym based'
      ),
      'seniors_mobility', jsonb_build_object(
        'enabled', true,
        'focus', '65+ pickleball players'
      )
    ),
    'intake_configuration', jsonb_build_object(
      'epc_member_field', true,
      'epc_member_id_optional', true,
      'auto_tag_source', 'EPC Member',
      'referral_tracking', true
    ),
    'partner_dashboard_config', jsonb_build_object(
      'enabled', true,
      'access_level', 'partner_read_only',
      'visible_metrics', jsonb_build_array(
        'members_treated_count',
        'aggregate_utilization',
        'program_participation',
        'return_to_play_averages',
        'satisfaction_scores_aggregated'
      ),
      'hidden_data', 'All PHI protected'
    ),
    'success_metrics', jsonb_build_object(
      'tracked_automatically', true,
      'targets', jsonb_build_object(
        'monthly_conversions', 25,
        'avg_visits_per_episode', 6,
        'patient_satisfaction', 4.5,
        'return_to_play_completion', 0.85
      )
    ),
    'phase_2_automation', jsonb_build_object(
      'status', 'planned',
      'features', jsonb_build_array(
        'Injury prevention campaigns',
        'Tournament injury response',
        'Subscription return-to-play programs',
        'Employer clinic intake',
        'AI rehab pathway recommendations'
      )
    )
  )
FROM clinics c
WHERE c.code = 'EPC-YEG-001'
ON CONFLICT DO NOTHING;

-- Create initial dashboard metrics record
INSERT INTO partner_dashboard_metrics (
  partner_clinic_id,
  metric_date,
  metric_period,
  partner_members_treated,
  new_patient_conversions,
  total_visits,
  metadata
)
SELECT 
  pc.id,
  CURRENT_DATE,
  'daily',
  0,
  0,
  0,
  jsonb_build_object(
    'status', 'pre_launch',
    'notes', 'Clinic in planning phase'
  )
FROM partner_clinics pc
WHERE pc.partner_name = 'Edmonton Pickleball Center'
ON CONFLICT DO NOTHING;

-- Create initial revenue share tracking record
INSERT INTO partner_revenue_share (
  partner_clinic_id,
  period_start,
  period_end,
  period_type,
  total_revenue,
  partner_sourced_revenue,
  revenue_share_amount,
  ytd_revenue_share,
  cap_remaining,
  notes
)
SELECT 
  pc.id,
  DATE_TRUNC('month', CURRENT_DATE)::date,
  (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date,
  'monthly',
  0,
  0,
  0,
  0,
  pc.revenue_share_cap,
  'Pre-launch tracking initialized'
FROM partner_clinics pc
WHERE pc.partner_name = 'Edmonton Pickleball Center'
ON CONFLICT DO NOTHING;