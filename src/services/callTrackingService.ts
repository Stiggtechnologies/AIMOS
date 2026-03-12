import { supabase } from '../lib/supabase';
import type { CallTrackingCall, CallTrackingFilters, CallTrackingStats, CallOutcome } from '../types/callTracking';

export const callTrackingService = {
  async getCalls(filters?: CallTrackingFilters): Promise<CallTrackingCall[]> {
    let query = supabase
      .from('call_tracking_calls')
      .select(`
        *,
        lead:crm_leads(id, first_name, last_name, status),
        clinic:clinics(id, name)
      `)
      .order('call_started_at', { ascending: false });

    if (filters?.source_type) query = query.eq('source_type', filters.source_type);
    if (filters?.status) query = query.eq('call_status', filters.status);
    if (filters?.outcome) query = query.eq('outcome', filters.outcome);
    if (filters?.date_from) query = query.gte('call_started_at', filters.date_from);
    if (filters?.date_to) query = query.lte('call_started_at', filters.date_to);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as any;
  },

  async getStats(startDate?: string, endDate?: string): Promise<CallTrackingStats> {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const end = endDate || new Date().toISOString();

    const { data, error } = await supabase
      .rpc('get_call_tracking_stats', {
        start_date: start,
        end_date: end,
      })
      .single();

    if (error) throw error;
    return data as any;
  },

  async setOutcome(callId: string, outcome: CallOutcome, notes?: string): Promise<void> {
    const { error } = await supabase
      .from('call_tracking_calls')
      .update({
        outcome,
        outcome_notes: notes || null,
        outcome_tagged_at: new Date().toISOString(),
      })
      .eq('id', callId);

    if (error) throw error;
  },
};
