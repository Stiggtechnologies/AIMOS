// ============================================================
// Practice Perfect -> AIM OS mirror: shared types.
// Ported/extended from the prior scaffold (~/.openclaw/.../src/types.ts).
// ============================================================

export type PPReportType =
  | 'revenue'
  | 'accounts_receivable'
  | 'provider_performance'
  | 'compensation'
  | 'client_listing'
  | 'patient_calendar'
  | 'payment_journal'
  | 'invoice_journal'
  | 'daily_reconciliation'
  | 'unbilled_services'
  | 'unpaid_services'
  | 'patient_falloff';

export type PPSourceFormat = 'pdf' | 'csv' | 'json' | 'api';

/** A row's validation outcome from the transform layer. */
export type ValidationStatus = 'ok' | 'warning' | 'rejected';

export interface RowValidation {
  status: ValidationStatus;
  messages: string[];
}

export interface CleanedRow<T> {
  cleaned: T;
  validation: RowValidation;
  raw: unknown;
}

/** Output of a connector: parsed-but-uncleaned payload + provenance metadata. */
export interface PPRawPayload {
  reportType: PPReportType;
  sourceFormat: PPSourceFormat;
  sourceFilename?: string;
  clinicName?: string;
  clinicCity?: string;
  periodStart?: string;
  periodEnd?: string;
  snapshotDate?: string;
  /** The parsed body (JSON object, or array of CSV row objects). */
  body: unknown;
}

/** Swappable data source. Manual export today; CSV/API later — downstream unchanged. */
export interface PracticePerfectConnector {
  readonly name: string;
  fetchReport(type: PPReportType, params?: Record<string, unknown>): Promise<PPRawPayload>;
}

// ---- Revenue report ----
export interface PPRevenueServiceLineRaw {
  service_line: string;
  service_category?: string;
  total_revenue?: number;
  total_visits?: number;
  metadata?: { fee_code?: string };
}

export interface PPRevenuePayload {
  report_metadata: { period_start: string; period_end: string; clinic_name: string; clinic_city: string };
  overall_metrics: { total_revenue: number; total_visits: number; total_hours?: number; unique_clients?: number };
  payer_mix?: Record<string, number>;
  service_lines: PPRevenueServiceLineRaw[];
}

export interface CleanServiceLine {
  service_line: string;
  service_category: string;
  fee_code: string;
  total_revenue: number;
  total_visits: number;
}

// ---- Provider performance ----
export interface ProviderPerformanceRow {
  provider_name: string;
  normalized_name: string;
  total_scheduled_visits: number | null;
  total_scheduled_hours: number | null;
  avg_visits_per_hour: number | null;
  discharged_clients: number | null;
  change_in_client_load: number | null;
  client_cancels_no_shows: number | null;
  actual_visits: number | null;
  pct_cancel_no_show: number | null;
  revenue: number | null;
  avg_revenue_per_hour: number | null;
  raw_values: unknown;
}

// ---- Accounts receivable (aggregate) ----
export interface PPArAggregatePayload {
  as_of_date: string;
  invoiced_total?: number;
  current_total?: number;
  total_due_total?: number;
  invoice_count?: number;
  source_file?: string;
  notes?: string;
}
