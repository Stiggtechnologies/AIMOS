import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the launch ID
    const { data: launch } = await supabase
      .from('clinic_launches')
      .select('id')
      .eq('launch_code', 'ASC-2026-MAY')
      .single();

    if (!launch) {
      throw new Error('Launch not found');
    }

    const launchId = launch.id;

    // Create 4 phases
    await supabase.from('launch_phases').insert([
      {
        launch_id: launchId,
        phase_name: 'phase_1_site_build_compliance',
        phase_number: 1,
        start_date: '2026-02-01',
        target_end_date: '2026-02-29',
        status: 'in_progress',
        completion_pct: 40
      },
      {
        launch_id: launchId,
        phase_name: 'phase_2_staffing_credentialing',
        phase_number: 2,
        start_date: '2026-03-01',
        target_end_date: '2026-03-31',
        status: 'not_started',
        completion_pct: 0
      },
      {
        launch_id: launchId,
        phase_name: 'phase_3_systems_ops_readiness',
        phase_number: 3,
        start_date: '2026-04-01',
        target_end_date: '2026-04-30',
        status: 'not_started',
        completion_pct: 0
      },
      {
        launch_id: launchId,
        phase_name: 'phase_4_go_live',
        phase_number: 4,
        start_date: '2026-05-01',
        target_end_date: '2026-05-31',
        status: 'not_started',
        completion_pct: 0
      }
    ]);

    // Create 8 workstreams
    const { data: workstreams } = await supabase
      .from('launch_workstreams')
      .insert([
        {
          launch_id: launchId,
          workstream_name: 'Regulatory & Compliance',
          description: 'CPTA registration, WCB provider status, direct billing setup',
          owner_role: 'Compliance Manager',
          status: 'in_progress',
          completion_pct: 25,
          priority: 'high',
          display_order: 1
        },
        {
          launch_id: launchId,
          workstream_name: 'Facility & Equipment',
          description: 'Gym partnership, equipment procurement, room setup',
          owner_role: 'Operations Manager',
          status: 'in_progress',
          completion_pct: 35,
          priority: 'high',
          display_order: 2
        },
        {
          launch_id: launchId,
          workstream_name: 'AIM OS Deployment',
          description: 'Platform configuration, forms, templates, patient portal',
          owner_role: 'IT Manager',
          status: 'in_progress',
          completion_pct: 45,
          priority: 'high',
          display_order: 3
        },
        {
          launch_id: launchId,
          workstream_name: 'Staffing & Training',
          description: 'Recruit lead physio, associate physio, front desk, training',
          owner_role: 'HR Manager',
          status: 'in_progress',
          completion_pct: 20,
          priority: 'high',
          display_order: 4
        },
        {
          launch_id: launchId,
          workstream_name: 'Clinical Program Design',
          description: 'Treatment protocols, exercise templates, rehab programs',
          owner_role: 'Clinical Director',
          status: 'in_progress',
          completion_pct: 30,
          priority: 'medium',
          display_order: 5
        },
        {
          launch_id: launchId,
          workstream_name: 'Marketing & Patient Acquisition',
          description: 'Digital presence, trainer partnerships, preboking',
          owner_role: 'Marketing Manager',
          status: 'in_progress',
          completion_pct: 15,
          priority: 'high',
          display_order: 6
        },
        {
          launch_id: launchId,
          workstream_name: 'Financial & Billing Setup',
          description: 'Direct billing, WCB billing, POS system, retail',
          owner_role: 'Finance Manager',
          status: 'not_started',
          completion_pct: 10,
          priority: 'medium',
          display_order: 7
        },
        {
          launch_id: launchId,
          workstream_name: 'Launch Execution',
          description: 'Soft opening, grand opening event, performance tracking',
          owner_role: 'Launch Director',
          status: 'not_started',
          completion_pct: 5,
          priority: 'high',
          display_order: 8
        }
      ])
      .select();

    // Create target metrics
    await supabase.from('launch_target_metrics').insert([
      {
        launch_id: launchId,
        metric_name: 'New Patients Per Week',
        metric_category: 'patient_acquisition',
        target_value: 18,
        unit: 'patients',
        measurement_frequency: 'weekly',
        baseline_value: 0
      },
      {
        launch_id: launchId,
        metric_name: 'Total Patient Visits Month 1',
        metric_category: 'patient_volume',
        target_value: 70,
        unit: 'visits',
        measurement_frequency: 'monthly',
        baseline_value: 0
      },
      {
        launch_id: launchId,
        metric_name: 'Total Patient Visits Month 3',
        metric_category: 'patient_volume',
        target_value: 250,
        unit: 'visits',
        measurement_frequency: 'monthly',
        baseline_value: 0
      },
      {
        launch_id: launchId,
        metric_name: 'Conversion Rate',
        metric_category: 'patient_acquisition',
        target_value: 45,
        unit: 'percentage',
        measurement_frequency: 'weekly',
        baseline_value: 0
      },
      {
        launch_id: launchId,
        metric_name: 'Lead Physio Utilization',
        metric_category: 'staff_productivity',
        target_value: 65,
        unit: 'percentage',
        measurement_frequency: 'weekly',
        baseline_value: 0
      },
      {
        launch_id: launchId,
        metric_name: 'Google Review Rating',
        metric_category: 'reputation',
        target_value: 4.5,
        unit: 'rating',
        measurement_frequency: 'monthly',
        baseline_value: 0
      },
      {
        launch_id: launchId,
        metric_name: 'Trainer Referrals Per Week',
        metric_category: 'referral_sources',
        target_value: 5,
        unit: 'referrals',
        measurement_frequency: 'weekly',
        baseline_value: 0
      },
      {
        launch_id: launchId,
        metric_name: 'Monthly Revenue Month 1',
        metric_category: 'financial',
        target_value: 6650,
        unit: 'dollars',
        measurement_frequency: 'monthly',
        baseline_value: 0
      },
      {
        launch_id: launchId,
        metric_name: 'Monthly Revenue Month 3',
        metric_category: 'financial',
        target_value: 23750,
        unit: 'dollars',
        measurement_frequency: 'monthly',
        baseline_value: 0
      }
    ]);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'AIM South Commons launch roadmap seeded successfully',
        launchId,
        workstreamsCreated: workstreams?.length || 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
