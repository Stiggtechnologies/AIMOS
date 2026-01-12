import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface NotificationQueueItem {
  id: string;
  recipient_id?: string;
  recipient_email?: string;
  channel: string;
  priority: string;
  subject?: string;
  body: string;
  attempts: number;
  max_attempts: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'process_notifications';

    let result: any = {};

    switch (action) {
      case 'process_notifications':
        result = await processNotifications(supabase);
        break;
      
      case 'generate_credential_alerts':
        result = await generateCredentialAlerts(supabase);
        break;
      
      case 'check_scheduled_tasks':
        result = await checkScheduledTasks(supabase);
        break;
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
    }

    return new Response(
      JSON.stringify({ success: true, ...result }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in workflow processor:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function processNotifications(supabase: any) {
  const { data: notifications, error } = await supabase
    .from('notification_queue')
    .select('*')
    .lte('scheduled_for', new Date().toISOString())
    .lt('attempts', supabase.raw('max_attempts'))
    .order('priority', { ascending: false })
    .order('scheduled_for')
    .limit(50);

  if (error) throw error;

  const processed: string[] = [];
  const failed: string[] = [];

  for (const notification of notifications || []) {
    try {
      await sendNotification(supabase, notification);
      processed.push(notification.id);
      
      await supabase.from('notification_queue').delete().eq('id', notification.id);
      
      await supabase.from('notification_history').insert({
        queue_id: notification.id,
        recipient_id: notification.recipient_id,
        recipient_email: notification.recipient_email,
        channel: notification.channel,
        priority: notification.priority,
        subject: notification.subject,
        body: notification.body,
        status: 'sent',
        sent_at: new Date().toISOString(),
      });
    } catch (error: any) {
      failed.push(notification.id);
      console.error(`Failed to send notification ${notification.id}:`, error);
      
      await supabase
        .from('notification_queue')
        .update({
          attempts: notification.attempts + 1,
          last_error: error.message,
        })
        .eq('id', notification.id);
    }
  }

  return {
    action: 'process_notifications',
    total_checked: notifications?.length || 0,
    processed: processed.length,
    failed: failed.length,
  };
}

async function sendNotification(supabase: any, notification: NotificationQueueItem) {
  console.log(`[DEMO MODE] Would send ${notification.channel} notification:`);
  console.log(`  To: ${notification.recipient_email || notification.recipient_id}`);
  console.log(`  Subject: ${notification.subject}`);
  console.log(`  Priority: ${notification.priority}`);
  console.log(`  Body preview: ${notification.body.substring(0, 100)}...`);
}

async function generateCredentialAlerts(supabase: any) {
  const { data: credentials, error } = await supabase
    .from('ops_credentials')
    .select(`
      *,
      staff:staff_profiles!ops_credentials_staff_id_fkey(
        id,
        user:user_profiles(id, email, first_name, last_name)
      ),
      credential_type:ops_credential_types(*)
    `)
    .eq('status', 'active');

  if (error) throw error;

  let created = 0;
  let skipped = 0;

  for (const credential of credentials || []) {
    if (!credential.expiry_date) {
      skipped++;
      continue;
    }

    const expiryDate = new Date(credential.expiry_date);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    let severity: string | null = null;
    let alertType = '';
    let message = '';

    if (daysUntilExpiry < 0) {
      severity = 'urgent';
      alertType = 'expired';
      message = `Credential expired ${Math.abs(daysUntilExpiry)} days ago`;
    } else if (daysUntilExpiry <= 30) {
      severity = 'critical';
      alertType = 'expiring_soon';
      message = `Credential expires in ${daysUntilExpiry} days`;
    } else if (daysUntilExpiry <= 60) {
      severity = 'warning';
      alertType = 'expiring_soon';
      message = `Credential expires in ${daysUntilExpiry} days`;
    } else if (daysUntilExpiry <= 90) {
      severity = 'info';
      alertType = 'renewal_reminder';
      message = `Credential expires in ${daysUntilExpiry} days`;
    }

    if (severity) {
      const { data: existingAlert } = await supabase
        .from('ops_credential_alerts')
        .select('id')
        .eq('credential_id', credential.id)
        .eq('resolved', false)
        .maybeSingle();

      if (existingAlert) {
        skipped++;
        continue;
      }

      const riskScore = daysUntilExpiry < 0 ? 100 : Math.max(0, 100 - daysUntilExpiry);

      await supabase.from('ops_credential_alerts').insert({
        credential_id: credential.id,
        staff_id: credential.staff_id,
        alert_type: alertType,
        severity,
        risk_score: riskScore,
        alert_message: message,
        days_until_expiry: daysUntilExpiry,
        recommended_actions: [
          daysUntilExpiry < 0 ? 'Upload renewed credential immediately' : 'Begin renewal process',
          'Contact issuing authority',
        ],
        metadata: {},
      });

      if (credential.staff?.user?.email && (severity === 'urgent' || severity === 'critical')) {
        await supabase.from('notification_queue').insert({
          recipient_id: credential.staff.user.id,
          recipient_email: credential.staff.user.email,
          channel: 'email',
          priority: severity === 'urgent' ? 'urgent' : 'high',
          subject: `Credential Alert: ${credential.credential_type?.type_name || 'Credential'}`,
          body: `Hello ${credential.staff.user.first_name},\n\nThis is an automated alert regarding your ${credential.credential_type?.type_name || 'credential'}.\n\n${message}\n\nPlease take action as soon as possible to maintain compliance.\n\nThank you,\nAIM OS`,
          scheduled_for: new Date().toISOString(),
          metadata: {
            alert_type: alertType,
            credential_id: credential.id,
          },
        });
      }

      created++;
    } else {
      skipped++;
    }
  }

  return {
    action: 'generate_credential_alerts',
    total_credentials: credentials?.length || 0,
    alerts_created: created,
    skipped,
  };
}

async function checkScheduledTasks(supabase: any) {
  const { data: tasks, error } = await supabase
    .from('scheduled_tasks')
    .select('*')
    .eq('is_active', true)
    .lte('next_run_at', new Date().toISOString());

  if (error) throw error;

  const executed: string[] = [];
  const failed: string[] = [];

  for (const task of tasks || []) {
    const startTime = new Date();
    let status = 'completed';
    let errorMessage = null;

    try {
      console.log(`Executing scheduled task: ${task.name}`);
      
      if (task.function_name === 'generate_credential_alerts') {
        await generateCredentialAlerts(supabase);
      }

      executed.push(task.id);
    } catch (error: any) {
      status = 'failed';
      errorMessage = error.message;
      failed.push(task.id);
      console.error(`Task ${task.name} failed:`, error);
    }

    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    await supabase.from('task_execution_log').insert({
      task_id: task.id,
      status,
      started_at: startTime.toISOString(),
      completed_at: endTime.toISOString(),
      duration_ms: duration,
      error_message: errorMessage,
    });

    const nextRunDate = new Date();
    nextRunDate.setHours(nextRunDate.getHours() + 24);

    await supabase
      .from('scheduled_tasks')
      .update({
        last_run_at: new Date().toISOString(),
        next_run_at: nextRunDate.toISOString(),
        run_count: task.run_count + 1,
        failure_count: status === 'failed' ? task.failure_count + 1 : task.failure_count,
      })
      .eq('id', task.id);
  }

  return {
    action: 'check_scheduled_tasks',
    total_tasks: tasks?.length || 0,
    executed: executed.length,
    failed: failed.length,
  };
}
