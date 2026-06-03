import { supabase } from '../../../lib/supabase';
import type { IComplianceService } from './types';
import type { BreakGlassEvent, RetentionPolicy, DocumentationComplianceMetrics, PaginatedResult, PaginationParams } from '../types';

const BREAK_GLASS = 'documentation_break_glass_events';
const RETENTION = 'documentation_retention_policies';

function paginate(pagination?: PaginationParams) {
  const limit = pagination?.limit ?? 20;
  const page = pagination?.page ?? 1;
  const offset = (page - 1) * limit;
  return { limit, page, offset };
}

export const complianceService: IComplianceService = {
  async getComplianceMetrics(clinicId: string, period: string): Promise<DocumentationComplianceMetrics> {
    const [encountersRes, draftsRes, signedRes, addendaRes, correctionsRes, risksRes] = await Promise.all([
      supabase.from('documentation_encounters').select('id', { count: 'exact', head: true }).eq('clinic_id', clinicId),
      supabase.from('documentation_note_drafts').select('status', { count: 'exact' }).eq('clinic_id', clinicId),
      supabase.from('documentation_signed_notes').select('id', { count: 'exact', head: true }).eq('clinic_id', clinicId),
      supabase.from('documentation_note_addenda').select('id', { count: 'exact', head: true }).eq('clinic_id', clinicId),
      supabase.from('documentation_correction_requests').select('id', { count: 'exact', head: true }).eq('clinic_id', clinicId),
      supabase.from('documentation_risks').select('resolved_at').eq('clinic_id', clinicId),
    ]);

    const totalEncounters = encountersRes.count ?? 0;
    const notesCompleted = signedRes.count ?? 0;
    const drafts = (draftsRes.data || []) as { status: string }[];
    const notesPending = drafts.filter((d) => d.status === 'draft' || d.status === 'in_review').length;
    const risks = (risksRes.data || []) as { resolved_at: string | null }[];
    const resolvedRisks = risks.filter((r) => r.resolved_at).length;

    return {
      clinic_id: clinicId,
      period,
      total_encounters: totalEncounters,
      notes_completed: notesCompleted,
      notes_pending: notesPending,
      notes_overdue: 0,
      signature_rate: totalEncounters > 0 ? Math.round((notesCompleted / totalEncounters) * 100) / 100 : 0,
      avg_completion_time_hours: null,
      addendum_count: addendaRes.count ?? 0,
      correction_request_count: correctionsRes.count ?? 0,
      risk_flag_resolution_rate: risks.length > 0 ? Math.round((resolvedRisks / risks.length) * 100) / 100 : 0,
    };
  },

  async getRiskFlagSummary(clinicId: string): Promise<{ level_counts: Record<string, number>; total: number }> {
    const { data, error } = await supabase
      .from('documentation_risks').select('risk_level').eq('clinic_id', clinicId);
    if (error) throw new Error(`getRiskFlagSummary failed: ${error.message}`);
    const rows = (data || []) as { risk_level: string }[];
    const level_counts: Record<string, number> = {};
    for (const r of rows) level_counts[r.risk_level] = (level_counts[r.risk_level] || 0) + 1;
    return { level_counts, total: rows.length };
  },

  async getDocumentationTimeliness(clinicId: string): Promise<{ on_time: number; late: number; overdue: number }> {
    // Timeliness: signed within 48h of encounter end = on_time, within 7d = late, otherwise overdue.
    const { data, error } = await supabase
      .from('documentation_signed_notes')
      .select('signed_at, encounter_id, documentation_encounters(actual_end)')
      .eq('clinic_id', clinicId);
    if (error) throw new Error(`getDocumentationTimeliness failed: ${error.message}`);
    const rows = (data || []) as unknown as Array<{ signed_at: string; documentation_encounters?: { actual_end: string | null } | { actual_end: string | null }[] | null }>;
    let on_time = 0, late = 0, overdue = 0;
    for (const row of rows) {
      const rel = row.documentation_encounters;
      const end = Array.isArray(rel) ? rel[0]?.actual_end : rel?.actual_end;
      if (!end) { on_time++; continue; }
      const hours = (new Date(row.signed_at).getTime() - new Date(end).getTime()) / 3_600_000;
      if (hours <= 48) on_time++;
      else if (hours <= 168) late++;
      else overdue++;
    }
    return { on_time, late, overdue };
  },

  async getSignatureCompliance(clinicId: string): Promise<{ signed: number; unsigned: number; rate: number }> {
    const [signedRes, draftsRes] = await Promise.all([
      supabase.from('documentation_signed_notes').select('id', { count: 'exact', head: true }).eq('clinic_id', clinicId),
      supabase.from('documentation_note_drafts').select('id', { count: 'exact', head: true }).eq('clinic_id', clinicId).in('status', ['draft', 'in_review']),
    ]);
    const signed = signedRes.count ?? 0;
    const unsigned = draftsRes.count ?? 0;
    const total = signed + unsigned;
    return { signed, unsigned, rate: total > 0 ? Math.round((signed / total) * 100) / 100 : 0 };
  },

  async recordBreakGlassEvent(patientId: string, clinicId: string, userId: string, reason: string): Promise<BreakGlassEvent> {
    const { data, error } = await supabase
      .from(BREAK_GLASS)
      .insert({ patient_id: patientId, clinic_id: clinicId, user_id: userId, reason })
      .select()
      .single();
    if (error) throw new Error(`recordBreakGlassEvent failed: ${error.message}`);
    return data as BreakGlassEvent;
  },

  async listBreakGlassEvents(clinicId: string, patientId?: string, pagination?: PaginationParams): Promise<PaginatedResult<BreakGlassEvent>> {
    const { limit, page, offset } = paginate(pagination);
    let query = supabase.from(BREAK_GLASS).select('*', { count: 'exact' }).eq('clinic_id', clinicId);
    if (patientId) query = query.eq('patient_id', patientId);
    const { data, error, count } = await query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
    if (error) throw new Error(`listBreakGlassEvents failed: ${error.message}`);
    const total = count ?? data.length;
    return { data: data as BreakGlassEvent[], total, page, limit, has_more: offset + limit < total };
  },

  async approveBreakGlassEvent(eventId: string, approvedByUserId: string): Promise<BreakGlassEvent> {
    const { data, error } = await supabase
      .from(BREAK_GLASS).update({ approved_by_user_id: approvedByUserId }).eq('id', eventId).select().single();
    if (error) throw new Error(`approveBreakGlassEvent failed: ${error.message}`);
    return data as BreakGlassEvent;
  },

  async getRetentionPolicies(organizationId: string): Promise<RetentionPolicy[]> {
    const { data, error } = await supabase
      .from(RETENTION).select('*').eq('organization_id', organizationId).order('record_category', { ascending: true });
    if (error) throw new Error(`getRetentionPolicies failed: ${error.message}`);
    return data as RetentionPolicy[];
  },

  async upsertRetentionPolicy(
    organizationId: string,
    recordCategory: string,
    retainYears: number,
    minorRule: boolean,
    active: boolean
  ): Promise<RetentionPolicy> {
    const { data, error } = await supabase
      .from(RETENTION)
      .upsert({
        organization_id: organizationId,
        record_category: recordCategory,
        retain_years: retainYears,
        minor_rule: minorRule,
        active,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'organization_id,record_category' })
      .select()
      .single();
    if (error) throw new Error(`upsertRetentionPolicy failed: ${error.message}`);
    return data as RetentionPolicy;
  },
};
