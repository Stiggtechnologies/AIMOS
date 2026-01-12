import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface DemoUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  phone: string;
  clinicCode?: string;
}

const demoUsers: DemoUser[] = [
  {
    email: 'sarah.executive@aimrehab.ca',
    password: 'Demo2026!Executive',
    firstName: 'Sarah',
    lastName: 'Chen',
    role: 'executive',
    phone: '403-555-1001'
  },
  {
    email: 'michael.manager@aimrehab.ca',
    password: 'Demo2026!Manager',
    firstName: 'Michael',
    lastName: 'Roberts',
    role: 'clinic_manager',
    phone: '403-555-1002',
    clinicCode: 'YYC-S'
  },
  {
    email: 'jennifer.clinician@aimrehab.ca',
    password: 'Demo2026!Clinician',
    firstName: 'Jennifer',
    lastName: 'Wong',
    role: 'clinician',
    phone: '780-555-2001',
    clinicCode: 'YEG-C'
  },
  {
    email: 'david.admin@aimrehab.ca',
    password: 'Demo2026!Admin',
    firstName: 'David',
    lastName: 'Thompson',
    role: 'admin',
    phone: '403-555-3001',
    clinicCode: 'YYC-N'
  },
  {
    email: 'amanda.contractor@aimrehab.ca',
    password: 'Demo2026!Contractor',
    firstName: 'Amanda',
    lastName: 'Martinez',
    role: 'contractor',
    phone: '403-555-4001',
    clinicCode: 'YYC-S'
  }
];

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const results = [];
    
    for (const user of demoUsers) {
      try {
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: {
            first_name: user.firstName,
            last_name: user.lastName
          }
        });

        if (authError) {
          if (authError.message.includes('already exists')) {
            results.push({ email: user.email, status: 'already_exists' });
            continue;
          }
          throw authError;
        }

        if (!authData.user) {
          throw new Error('User creation failed');
        }

        let clinicId = null;
        if (user.clinicCode) {
          const { data: clinicData } = await supabase
            .from('clinics')
            .select('id')
            .eq('code', user.clinicCode)
            .maybeSingle();
          
          clinicId = clinicData?.id;
        }

        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: authData.user.id,
            email: user.email,
            first_name: user.firstName,
            last_name: user.lastName,
            role: user.role,
            phone: user.phone,
            primary_clinic_id: clinicId,
            is_active: true
          });

        if (profileError) throw profileError;

        if (clinicId && ['clinic_manager', 'clinician', 'contractor'].includes(user.role)) {
          await supabase
            .from('clinic_access')
            .insert({
              user_id: authData.user.id,
              clinic_id: clinicId,
              role: user.role === 'clinic_manager' ? 'manager' : user.role,
              granted_at: new Date().toISOString()
            });
        }

        results.push({
          email: user.email,
          status: 'created',
          userId: authData.user.id
        });
      } catch (err) {
        results.push({
          email: user.email,
          status: 'error',
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Demo users setup completed',
        results
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});