// ============================================================
// Practice Perfect import-status / reconciliation read service (app-side).
// Powers the "Practice Perfect Sync" admin surface.
// ============================================================
import { supabase } from '../../lib/supabase';
import type { PPReportType } from './types';

export interface ImportBatchSummary {
  id: string;
  clinic_id: string | null;
  report_type: PPReportType;
  source_filename: string | null;
  period_start: string | null;
  period_end: string | null;
  snapshot_date: string | null;
  status: string;
  row_count_loaded: number;
  row_count_rejected: number;
  connector: string;
  created_at: string;
  completed_at: string | null;
}

export interface RejectedRow {
  id: string;
  row_index: number;
  validation_status: string;
  validation_messages: string[] | null;
  target_table: string | null;
  raw: unknown;
}

export const importStatusService = {
  async listBatches(clinicId: string, limit = 50): Promise<ImportBatchSummary[]> {
    const { data, error } = await supabase
      .from('pp_import_batches')
      .select('id, clinic_id, report_type, source_filename, period_start, period_end, snapshot_date, status, row_count_loaded, row_count_rejected, connector, created_at, completed_at')
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw new Error(`listBatches failed: ${error.message}`);
    return (data ?? []) as ImportBatchSummary[];
  },

  async getBatch(batchId: string): Promise<ImportBatchSummary | null> {
    const { data, error } = await supabase
      .from('pp_import_batches')
      .select('id, clinic_id, report_type, source_filename, period_start, period_end, snapshot_date, status, row_count_loaded, row_count_rejected, connector, created_at, completed_at')
      .eq('id', batchId)
      .maybeSingle();
    if (error) throw new Error(`getBatch failed: ${error.message}`);
    return (data as ImportBatchSummary) ?? null;
  },

  async listRejectedRows(batchId: string): Promise<RejectedRow[]> {
    const { data, error } = await supabase
      .from('pp_import_rows')
      .select('id, row_index, validation_status, validation_messages, target_table, raw')
      .eq('batch_id', batchId)
      .eq('validation_status', 'rejected')
      .order('row_index', { ascending: true });
    if (error) throw new Error(`listRejectedRows failed: ${error.message}`);
    return (data ?? []) as RejectedRow[];
  },

  /** Reconciliation: revenue header total vs summed clean service-line revenue for a period. */
  async revenueReconciliation(clinicId: string, periodStart: string, periodEnd: string): Promise<{
    header_total: number;
    line_sum: number;
    variance: number;
  }> {
    const [{ data: metrics }, { data: lines }] = await Promise.all([
      supabase.from('clinic_financial_metrics')
        .select('total_revenue')
        .eq('clinic_id', clinicId).eq('period_start', periodStart).eq('period_end', periodEnd).maybeSingle(),
      supabase.from('service_line_performance')
        .select('total_revenue')
        .eq('clinic_id', clinicId).eq('period_start', periodStart).eq('period_end', periodEnd),
    ]);
    const header_total = Number((metrics as { total_revenue?: number } | null)?.total_revenue ?? 0);
    const line_sum = ((lines ?? []) as { total_revenue: number }[]).reduce((s, r) => s + Number(r.total_revenue), 0);
    return { header_total, line_sum, variance: Math.round((header_total - line_sum) * 100) / 100 };
  },
};
