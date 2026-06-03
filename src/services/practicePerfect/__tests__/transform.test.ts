import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  parseMoney,
  parsePct,
  normalizeName,
  extractProviderName,
  hasHeaderBleed,
  isGarbageServiceLine,
  cleanRevenueServiceLines,
  mapProviderPerformanceRow,
} from '../transform';
import type { PPRevenuePayload } from '../types';

const here = dirname(fileURLToPath(import.meta.url));
const fixtures = resolve(here, '../../../../import_parsed');

describe('parseMoney', () => {
  it('handles $, commas, plain, empty', () => {
    expect(parseMoney('$18,540.50')).toBe(18540.5);
    expect(parseMoney('18540.5')).toBe(18540.5);
    expect(parseMoney('$0.00')).toBe(0);
    expect(parseMoney('')).toBeNull();
    expect(parseMoney(71.72)).toBe(71.72);
  });
});

describe('parsePct', () => {
  it('strips %', () => {
    expect(parsePct('11.16%')).toBe(11.16);
    expect(parsePct('0.00%')).toBe(0);
    expect(parsePct('')).toBeNull();
  });
});

describe('name normalization', () => {
  it('treats inconsistent spellings of the same person as equal', () => {
    expect(normalizeName('EL MANASEER, THAER')).toBe(normalizeName("ELMANASEER MASSAGE, THA'ER"));
  });

  it('extracts the real name out of header-bleed', () => {
    const bleed =
      'Provider Performance Summary Page 1 of 2 Provider Name Total Scheduled Visits MABAG, GLERICKA';
    expect(hasHeaderBleed(bleed)).toBe(true);
    expect(extractProviderName(bleed)).toBe('MABAG, GLERICKA');
  });

  it('passes clean names through', () => {
    expect(extractProviderName('CLACKEN, CARLA')).toBe('CLACKEN, CARLA');
  });
});

describe('isGarbageServiceLine', () => {
  it('rejects PDF-shatter fragments but keeps real lines', () => {
    expect(isGarbageServiceLine({ service_line: '4.63%' })).toBe(true);
    expect(isGarbageServiceLine({ service_line: 'hours' })).toBe(true);
    expect(isGarbageServiceLine({ service_line: 'X', metadata: { fee_code: '27:15' } })).toBe(true);
    expect(isGarbageServiceLine({ service_line: '1 30 MINUTES MASSAGE', metadata: { fee_code: 'MASSAGE' } })).toBe(false);
    // Zero-value but legitimate categories are kept.
    expect(isGarbageServiceLine({ service_line: 'Cancellation', metadata: { fee_code: 'CANCEL' } })).toBe(false);
  });
});

describe('revenue fixture', () => {
  const payload = JSON.parse(
    readFileSync(resolve(fixtures, 'revenue_import_jan_2026.json'), 'utf8'),
  ) as PPRevenuePayload;

  it('keeps clean lines and rejects garbage', () => {
    const rows = cleanRevenueServiceLines(payload);
    expect(rows.length).toBe(payload.service_lines.length);
    const kept = rows.filter((r) => r.validation.status !== 'rejected');
    const massage = kept.find((r) => r.cleaned.fee_code === 'MASSAGE');
    expect(massage).toBeTruthy();
    // At least one fragment should be rejected from this real export.
    expect(rows.some((r) => r.validation.status === 'rejected')).toBe(true);
  });
});

describe('provider performance row mapping', () => {
  it('maps reliable fields from a real CLACKEN row', () => {
    // Real values from provider_performance_summary.csv (CLACKEN, CARLA).
    const row: Record<string, unknown> = {
      provider_name: 'CLACKEN, CARLA',
      total_scheduled_visits: '224',
      total_scheduled_hours: '258.50',
      avg_visits_per_hour: '0.75',
      discharged_clients: '10',
      change_in_client_load: '9',
      client_cancels_no_shows: '24',
      actual_visits: '194',
      pct_cancel_no_show: '11.16%',
      revenue: '18540.5',
      avg_revenue_per_hour: '71.72',
      raw_values: '["224", "258.50", "0.75", "19", "10", "9", "24", "194", "11.16%", "$18,540.50"]',
    };
    const out = mapProviderPerformanceRow(row);
    expect(out.cleaned.provider_name).toBe('CLACKEN, CARLA');
    expect(out.cleaned.total_scheduled_visits).toBe(224);
    expect(out.cleaned.revenue).toBe(18540.5);
    expect(out.cleaned.pct_cancel_no_show).toBe(11.16);
    expect(Array.isArray(out.cleaned.raw_values)).toBe(true);
    expect(out.validation.status).not.toBe('rejected');
  });

  it('recovers the real name from a header-bleed row and flags it', () => {
    const out = mapProviderPerformanceRow({
      provider_name:
        'Provider Performance Summary Page 1 of 2 Provider Name Total Scheduled Visits MABAG, GLERICKA',
      revenue: '$0.00',
    });
    expect(out.cleaned.provider_name).toBe('MABAG, GLERICKA');
    expect(out.validation.status).toBe('warning');
    expect(out.validation.messages.join(' ')).toMatch(/header-bleed/);
  });
});
