import { supabase } from '../lib/supabase';
import type { EmergencyEvent, CrisisTask } from '../types/aim-os';

export async function getEmergencyEvents(status?: string) {
  let query = supabase
    .from('emergency_events')
    .select('*')
    .order('declared_at', { ascending: false });

  if (status) {
    query = query.eq('event_status', status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as EmergencyEvent[];
}

export async function getCrisisTasks(eventId: string) {
  const { data, error } = await supabase
    .from('crisis_tasks')
    .select('*')
    .eq('emergency_event_id', eventId)
    .order('priority', { ascending: false })
    .order('due_at');

  if (error) throw error;
  return data as CrisisTask[];
}

export async function createEmergencyEvent(event: Omit<EmergencyEvent, 'id' | 'declared_at'>) {
  const { data, error } = await supabase
    .from('emergency_events')
    .insert([event])
    .select()
    .single();

  if (error) throw error;
  return data as EmergencyEvent;
}

export async function updateEmergencyEvent(id: string, updates: Partial<EmergencyEvent>) {
  const { data, error } = await supabase
    .from('emergency_events')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as EmergencyEvent;
}

export async function createCrisisTask(task: Omit<CrisisTask, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('crisis_tasks')
    .insert([task])
    .select()
    .single();

  if (error) throw error;
  return data as CrisisTask;
}

export async function updateCrisisTask(id: string, updates: Partial<CrisisTask>) {
  const { data, error } = await supabase
    .from('crisis_tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as CrisisTask;
}

export async function getEmergencyPlaybooks(category?: string) {
  let query = supabase
    .from('emergency_playbooks')
    .select('*')
    .eq('is_active', true)
    .eq('approval_status', 'approved')
    .order('playbook_category')
    .order('playbook_name');

  if (category) {
    query = query.eq('playbook_category', category);
  }

  const { data, error } = await query;
  if (error) return [];
  return data;
}

export async function getPlaybookSteps(playbookId: string) {
  const { data, error } = await supabase
    .from('emergency_playbook_steps')
    .select('*')
    .eq('playbook_id', playbookId)
    .order('step_number');

  if (error) return [];
  return data;
}

export async function getEmergencyTasks(eventId: string) {
  const { data, error } = await supabase
    .from('emergency_tasks')
    .select('*')
    .eq('event_id', eventId)
    .order('priority', { ascending: false })
    .order('urgency', { ascending: false })
    .order('due_at');

  if (error) return [];
  return data;
}

export async function getMyEmergencyTasks(userId: string) {
  const { data, error } = await supabase
    .from('emergency_tasks')
    .select('*, event:emergency_events(*)')
    .eq('assigned_to', userId)
    .in('task_status', ['pending', 'in_progress', 'blocked'])
    .order('urgency', { ascending: false })
    .order('due_at');

  if (error) return [];
  return data;
}

export async function updateEmergencyTask(id: string, updates: any) {
  const { data, error } = await supabase
    .from('emergency_tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getEmergencyBroadcasts(eventId: string) {
  const { data, error } = await supabase
    .from('emergency_broadcasts')
    .select('*')
    .eq('event_id', eventId)
    .order('sent_at', { ascending: false });

  if (error) return [];
  return data;
}

export async function getRecentBroadcasts(limit: number = 10) {
  const { data, error } = await supabase
    .from('emergency_broadcasts')
    .select('*, event:emergency_events(*)')
    .eq('broadcast_status', 'sent')
    .order('sent_at', { ascending: false })
    .limit(limit);

  if (error) return [];
  return data;
}

export async function getEmergencyContacts(contactType?: string) {
  let query = supabase
    .from('emergency_contacts')
    .select('*')
    .eq('is_active', true)
    .order('escalation_level')
    .order('escalation_order');

  if (contactType) {
    query = query.eq('contact_type', contactType);
  }

  const { data, error } = await query;
  if (error) return [];
  return data;
}

export async function get247Contacts() {
  const { data, error } = await supabase
    .from('emergency_contacts')
    .select('*')
    .eq('is_active', true)
    .eq('is_24_7_available', true)
    .order('escalation_level')
    .order('contact_name');

  if (error) return [];
  return data;
}

export async function getEventLogs(eventId: string) {
  const { data, error } = await supabase
    .from('emergency_event_logs')
    .select('*')
    .eq('event_id', eventId)
    .order('log_timestamp', { ascending: false });

  if (error) return [];
  return data;
}

export async function createEventLog(log: any) {
  const { data, error } = await supabase
    .from('emergency_event_logs')
    .insert([log])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getActiveEmergency() {
  const { data, error } = await supabase
    .from('emergency_events')
    .select('*')
    .eq('is_emergency_mode_active', true)
    .in('status', ['active', 'monitoring'])
    .order('declared_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return null;
  return data;
}

export async function getEmergencyDashboard(eventId: string) {
  const [
    event,
    tasks,
    broadcasts,
    logs,
    playbook,
  ] = await Promise.all([
    supabase.from('emergency_events').select('*').eq('id', eventId).maybeSingle(),
    getEmergencyTasks(eventId),
    getEmergencyBroadcasts(eventId),
    getEventLogs(eventId),
    supabase.from('emergency_events').select('playbook_id').eq('id', eventId).maybeSingle()
      .then(async (result) => {
        if (result.data?.playbook_id) {
          const playbookData = await supabase
            .from('emergency_playbooks')
            .select('*, steps:emergency_playbook_steps(*)')
            .eq('id', result.data.playbook_id)
            .maybeSingle();
          return playbookData.data;
        }
        return null;
      }),
  ]);

  if (!event.data) return null;

  const tasksByStatus = {
    pending: tasks.filter((t: any) => t.task_status === 'pending'),
    in_progress: tasks.filter((t: any) => t.task_status === 'in_progress'),
    blocked: tasks.filter((t: any) => t.task_status === 'blocked'),
    completed: tasks.filter((t: any) => t.task_status === 'completed'),
  };

  const tasksByPriority = {
    critical: tasks.filter((t: any) => t.priority === 'critical'),
    high: tasks.filter((t: any) => t.priority === 'high'),
    medium: tasks.filter((t: any) => t.priority === 'medium'),
    low: tasks.filter((t: any) => t.priority === 'low'),
  };

  const broadcastsByStatus = {
    sent: broadcasts.filter((b: any) => b.broadcast_status === 'sent'),
    scheduled: broadcasts.filter((b: any) => b.broadcast_status === 'scheduled'),
    draft: broadcasts.filter((b: any) => b.broadcast_status === 'draft'),
  };

  return {
    event: event.data,
    tasks,
    tasksByStatus,
    tasksByPriority,
    broadcasts,
    broadcastsByStatus,
    logs,
    playbook,
    summary: {
      total_tasks: tasks.length,
      pending_tasks: tasksByStatus.pending.length,
      in_progress_tasks: tasksByStatus.in_progress.length,
      blocked_tasks: tasksByStatus.blocked.length,
      completed_tasks: tasksByStatus.completed.length,
      critical_tasks: tasksByPriority.critical.length,
      total_broadcasts: broadcasts.length,
      sent_broadcasts: broadcastsByStatus.sent.length,
      total_logs: logs.length,
      affected_staff: event.data.affected_staff_count || 0,
      affected_patients: event.data.affected_patient_count || 0,
    },
  };
}
