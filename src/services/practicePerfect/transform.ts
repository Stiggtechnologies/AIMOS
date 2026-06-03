// ============================================================
// Practice Perfect -> AIM OS mirror: pure transform / clean / validate layer.
// No DB access. Handles the documented PP PDF-export data-quality problems:
//  - PDF header text bleeding into name fields
//  - inconsistent provider name strings for the same person
//  - money/percent formatting ($, commas, %)
//  - garbage service-line fragments from PDF shatter
// ============================================================

import type {
  CleanServiceLine,
  CleanedRow,
  PPRevenuePayload,
  ProviderPerformanceRow,
} from './types';

// Role/discipline tokens that get appended to PP surnames inconsistently.
const ROLE_TOKENS = ['MASSAGE', 'PHYSIOTHERAPY', 'PHYSIO', 'THERAPY'];

// Header/footer text that bleeds into name fields on PDF extraction.
const HEADER_TOKENS = [
  /MANAGEMENT INC\.?/gi,
  /Page\s+\d+\s+of\s+\d+/gi,
  /Provider Performance Summary/gi,
  /Provider Name/gi,
  /Total Scheduled Visits/gi,
];

function stripHeaderTokens(raw: string): string {
  let s = raw;
  for (const re of HEADER_TOKENS) s = s.replace(re, ' ');
  return s.replace(/\s+/g, ' ').trim();
}

const NAME_RE = /[A-Z][A-Za-z'’.-]*(?:\s+[A-Za-z'’.-]+)*,\s*[A-Za-z'’.-]+(?:\s+[A-Za-z'’.-]+)*/g;

/** Money string ("$18,540.50", "18540.5", "$0.00", "") -> number | null. */
export function parseMoney(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const s = String(value).trim();
  if (s === '' || s === '-') return null;
  const cleaned = s.replace(/[$,\s]/g, '');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/** Percent string ("11.16%", "0.00%", "") -> number | null. */
export function parsePct(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const s = String(value).trim().replace(/%/g, '');
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function parseIntOrNull(value: unknown): number | null {
  const n = parseMoney(value);
  return n === null ? null : Math.round(n);
}

/** Whether the string carries PDF header/footer bleed. */
export function hasHeaderBleed(raw: string): boolean {
  return HEADER_TOKENS.some((re) => {
    re.lastIndex = 0; // /g regexes are stateful; reset before test()
    return re.test(raw);
  });
}

/**
 * Extract the real "LAST, FIRST" name from a possibly header-corrupted string.
 * Strip known header/footer phrases first, then take the LAST name-like token.
 */
export function extractProviderName(raw: string): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  // Special non-name labels PP emits.
  if (/^<.*>$/.test(trimmed) || /^Unassigned/i.test(trimmed)) return trimmed;
  const stripped = stripHeaderTokens(trimmed);
  NAME_RE.lastIndex = 0;
  const matches = stripped.match(NAME_RE);
  if (matches && matches.length > 0) return matches[matches.length - 1].trim();
  return stripped;
}

/**
 * Normalized matching key: letters-only, uppercased, role tokens removed,
 * order preserved. Makes "EL MANASEER, THAER" === "ELMANASEER MASSAGE, THA'ER".
 */
export function normalizeName(raw: string): string {
  let name = extractProviderName(raw).toUpperCase();
  for (const token of ROLE_TOKENS) {
    name = name.replace(new RegExp(`\\b${token}\\b`, 'g'), ' ');
  }
  // Letters only (drops commas, apostrophes, spaces, punctuation), order kept.
  return name.replace(/[^A-Z]/g, '');
}

/** A service-line row that is a PDF-shatter fragment rather than a real service. */
export function isGarbageServiceLine(line: { service_line?: string; metadata?: { fee_code?: string } }): boolean {
  const name = (line.service_line ?? '').trim();
  const fee = (line.metadata?.fee_code ?? '').trim();
  if (name === '') return true;
  if (/^\d+(\.\d+)?%$/.test(name)) return true; // pure percentage
  if (/^(hours|units|visits|REVENUE|PARTS|UP|PART|& STRAIN)$/i.test(name)) return true;
  if (/\d+\s+items/i.test(name)) return true;
  // Real fee codes are alphabetic (MASSAGE, DNA, CANCEL, MOT, PT, ORTHOTIC...).
  // Numeric or time-like fee codes ("176", "27:15", "2.00") signal shatter.
  if (fee !== '' && /^\d+([:.]\d+)?$/.test(fee)) return true;
  return false;
}

/** Clean + validate revenue service lines; garbage rows are rejected (retained upstream in staging). */
export function cleanRevenueServiceLines(payload: PPRevenuePayload): CleanedRow<CleanServiceLine>[] {
  return (payload.service_lines ?? []).map((sl) => {
    const messages: string[] = [];
    if (isGarbageServiceLine(sl)) {
      return {
        cleaned: {
          service_line: (sl.service_line ?? '').trim(),
          service_category: sl.service_category ?? 'Clinical',
          fee_code: (sl.metadata?.fee_code ?? '').trim(),
          total_revenue: parseMoney(sl.total_revenue) ?? 0,
          total_visits: parseIntOrNull(sl.total_visits) ?? 0,
        },
        validation: { status: 'rejected', messages: ['PDF-shatter fragment, not a real service line'] },
        raw: sl,
      };
    }
    const revenue = parseMoney(sl.total_revenue) ?? 0;
    const visits = parseIntOrNull(sl.total_visits) ?? 0;
    if (revenue < 0) messages.push('negative revenue');
    return {
      cleaned: {
        service_line: sl.service_line.trim(),
        service_category: sl.service_category ?? 'Clinical',
        fee_code: (sl.metadata?.fee_code ?? '').trim(),
        total_revenue: revenue,
        total_visits: visits,
      },
      validation: { status: messages.length ? 'warning' : 'ok', messages },
      raw: sl,
    };
  });
}

/**
 * Map one provider-performance CSV row to a clean record.
 * The named columns are unreliable past the first ~10 fields (column misalignment),
 * so we populate only the reliably-labeled fields and null the rest, preserving
 * raw_values verbatim. Header-bleed in the name is stripped + flagged.
 */
export function mapProviderPerformanceRow(row: Record<string, unknown>): CleanedRow<ProviderPerformanceRow> {
  const rawName = String(row.provider_name ?? '');
  const messages: string[] = [];
  if (hasHeaderBleed(rawName)) messages.push('header-bleed stripped from provider_name');

  const provider_name = extractProviderName(rawName);
  const normalized_name = normalizeName(rawName);

  let raw_values: unknown = row.raw_values;
  if (typeof raw_values === 'string') {
    try { raw_values = JSON.parse(raw_values); } catch { messages.push('raw_values not parseable'); }
  }

  const cleaned: ProviderPerformanceRow = {
    provider_name,
    normalized_name,
    total_scheduled_visits: parseIntOrNull(row.total_scheduled_visits),
    total_scheduled_hours: parseMoney(row.total_scheduled_hours),
    avg_visits_per_hour: parseMoney(row.avg_visits_per_hour),
    discharged_clients: parseIntOrNull(row.discharged_clients),
    change_in_client_load: parseIntOrNull(row.change_in_client_load),
    client_cancels_no_shows: parseIntOrNull(row.client_cancels_no_shows),
    actual_visits: parseIntOrNull(row.actual_visits),
    pct_cancel_no_show: parsePct(row.pct_cancel_no_show),
    revenue: parseMoney(row.revenue),
    avg_revenue_per_hour: parseMoney(row.avg_revenue_per_hour),
    raw_values,
  };

  const status = normalized_name === '' ? 'rejected' : messages.length ? 'warning' : 'ok';
  if (normalized_name === '') messages.push('could not derive a provider name');
  return { cleaned, validation: { status, messages }, raw: row };
}
