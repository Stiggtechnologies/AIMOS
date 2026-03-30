import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const rotations: { email: string; newPassword: string; role: string }[] = [
  { email: 'sarah.executive@aimrehab.ca',    newPassword: 'AimExec#2026!',       role: 'executive' },
  { email: 'michael.manager@aimrehab.ca',    newPassword: 'AimMgr#2026!',        role: 'clinic_manager' },
  { email: 'jennifer.clinician@aimrehab.ca', newPassword: 'AimClin#2026!',       role: 'clinician' },
  { email: 'sarah.mitchell@aimrehab.ca',     newPassword: 'AimClin#2026!',       role: 'clinician' },
  { email: 'james.chen@aimrehab.ca',         newPassword: 'AimClin#2026!',       role: 'clinician' },
  { email: 'lisa.thompson@aimrehab.ca',      newPassword: 'AimClin#2026!',       role: 'clinician' },
  { email: 'david.kim@aimrehab.ca',          newPassword: 'AimClin#2026!',       role: 'clinician' },
  { email: 'david.admin@aimrehab.ca',        newPassword: 'AimAdmin#2026!',      role: 'admin' },
  { email: 'amanda.contractor@aimrehab.ca',  newPassword: 'AimContr#2026!',      role: 'contractor' },
  { email: 'patient.demo@aimrehab.ca',       newPassword: 'AimPatient#2026!',    role: 'patient' },
];

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const results: { email: string; status: string; error?: string }[] = [];

    for (const { email, newPassword } of rotations) {
      try {
        const { data: users, error: listErr } = await supabase.auth.admin.listUsers();
        if (listErr) throw listErr;

        const user = users.users.find((u) => u.email === email);
        if (!user) {
          results.push({ email, status: 'not_found' });
          continue;
        }

        const { error: pwErr } = await supabase.auth.admin.updateUserById(user.id, {
          password: newPassword,
        });
        if (pwErr) throw pwErr;

        await supabase.auth.admin.signOut(user.id, 'global');

        results.push({ email, status: 'rotated' });
      } catch (err) {
        results.push({ email, status: 'error', error: err instanceof Error ? err.message : String(err) });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        rotated_at: new Date().toISOString(),
        results,
        new_credentials: rotations.map(r => ({ email: r.email, role: r.role, password: r.newPassword })),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
