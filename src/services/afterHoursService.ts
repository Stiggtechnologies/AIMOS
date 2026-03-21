import { supabase } from '../lib/supabase';
import type { AfterHoursCall, AfterHoursStats, AfterHoursFilters } from '../types/afterHours';

export const afterHoursService = {
  /**
   * Get after-hours calls with optional filters
   */
  async getCalls(filters?: AfterHoursFilters): Promise<AfterHoursCall[]> {
    let query = supabase
      .from('after_hours_calls')
      .select(`
        *,
        lead:crm_leads(id, first_name, last_name, status),
        assigned_to:user_profiles(id, first_name, last_name, email),
        clinic:clinics(id, name)
      `)
      .order('call_started_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('call_status', filters.status);
    }
    if (filters?.urgency) {
      query = query.eq('urgency_level', filters.urgency);
    }
    if (filters?.assigned_to) {
      query = query.eq('assigned_to_user_id', filters.assigned_to);
    }
    if (filters?.outcome) {
      query = query.eq('outcome', filters.outcome);
    }
    if (filters?.date_from) {
      query = query.gte('call_started_at', filters.date_from);
    }
    if (filters?.date_to) {
      query = query.lte('call_started_at', filters.date_to);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /**
   * Get a single call by ID
   */
  async getCallById(id: string): Promise<AfterHoursCall | null> {
    const { data, error } = await supabase
      .from('after_hours_calls')
      .select(`
        *,
        lead:crm_leads(*),
        assigned_to:user_profiles(*),
        clinic:clinics(*)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  /**
   * Get recent calls (last 24 hours)
   */
  async getRecentCalls(limit: number = 10): Promise<AfterHoursCall[]> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { data, error } = await supabase
      .from('after_hours_calls')
      .select(`
        *,
        lead:crm_leads(id, first_name, last_name, status),
        assigned_to:user_profiles(id, first_name, last_name)
      `)
      .gte('call_started_at', yesterday.toISOString())
      .order('call_started_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  /**
   * Get calls pending follow-up
   */
  async getPendingFollowUps(): Promise<AfterHoursCall[]> {
    const { data, error } = await supabase
      .from('after_hours_calls')
      .select(`
        *,
        lead:crm_leads(id, first_name, last_name, phone),
        assigned_to:user_profiles(id, first_name, last_name)
      `)
      .is('follow_up_completed_at', null)
      .not('follow_up_scheduled_at', 'is', null)
      .order('follow_up_scheduled_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get stats for dashboard
   */
  async getStats(startDate?: string, endDate?: string): Promise<AfterHoursStats> {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const end = endDate || new Date().toISOString();

    const { data, error } = await supabase
      .rpc('get_after_hours_stats', {
        start_date: start,
        end_date: end
      })
      .single();

    if (error) throw error;
    return data as AfterHoursStats;
  },

  /**
   * Assign call to a user
   */
  async assignCall(callId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('after_hours_calls')
      .update({
        assigned_to_user_id: userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', callId);

    if (error) throw error;
  },

  /**
   * Schedule follow-up
   */
  async scheduleFollowUp(callId: string, scheduledAt: string): Promise<void> {
    const { error } = await supabase
      .from('after_hours_calls')
      .update({
        follow_up_scheduled_at: scheduledAt,
        updated_at: new Date().toISOString()
      })
      .eq('id', callId);

    if (error) throw error;
  },

  /**
   * Complete follow-up
   */
  async completeFollowUp(
    callId: string,
    outcome: AfterHoursCall['outcome'],
    notes?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('after_hours_calls')
      .update({
        follow_up_completed_at: new Date().toISOString(),
        outcome,
        follow_up_notes: notes,
        call_status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', callId);

    if (error) throw error;
  },

  /**
   * Update urgency level
   */
  async updateUrgency(
    callId: string,
    urgencyLevel: AfterHoursCall['urgency_level']
  ): Promise<void> {
    const { error } = await supabase
      .from('after_hours_calls')
      .update({
        urgency_level: urgencyLevel,
        updated_at: new Date().toISOString()
      })
      .eq('id', callId);

    if (error) throw error;
  },

  /**
   * Get call count by urgency
   */
  async getCallCountsByUrgency(startDate?: string): Promise<Record<string, number>> {
    const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('after_hours_calls')
      .select('urgency_level')
      .gte('call_started_at', start);

    if (error) throw error;

    const counts: Record<string, number> = {
      emergency: 0,
      high: 0,
      medium: 0,
      low: 0
    };

    data?.forEach((call) => {
      if (call.urgency_level) {
        counts[call.urgency_level] = (counts[call.urgency_level] || 0) + 1;
      }
    });

    return counts;
  }
};
