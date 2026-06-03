/**
 * Practice Perfect -> AIM OS bulk importer (manual-export connector).
 *
 * Usage:
 *   DATABASE_URL=postgres://... tsx scripts/pp-import.ts \
 *     --report=revenue --file=import_parsed/revenue_import_jan_2026.json \
 *     --clinic="Alberta Injury Management" [--city=Edmonton] [--dry-run]
 *
 * Reports supported now: revenue | accounts_receivable | provider_performance.
 * Idempotent: identical file content is deduped (sha256); data upserts on the
 * table's natural key, so re-running never duplicates rows.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { Client } from 'pg';
import {
  cleanRevenueServiceLines,
  mapProviderPerformanceRow,
} from '../src/services/practicePerfect/transform';
import type { PPRevenuePayload, PPArAggregatePayload } from '../src/services/practicePerfect/types';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...v] = a.replace(/^--/, '').split('=');
    return [k, v.length ? v.join('=') : 'true'];
  }),
);

const DATABASE_URL = process.env.DATABASE_URL;
const report = String(args.report ?? '');
const file = String(args.file ?? '');
const clinicName = String(args.clinic ?? '');
const clinicCity = String(args.city ?? '');
const dryRun = args['dry-run'] === 'true';

function die(msg: string): never { console.error(`❌ ${msg}`); process.exit(1); }
if (!DATABASE_URL) die('Missing DATABASE_URL (Supabase > Settings > Database > Connection string URI).');
if (!report || !file) die('Usage: --report=<type> --file=<path> --clinic="Name" [--city=City] [--dry-run]');

/** Quote-aware CSV parse (handles "LAST, FIRST" and quoted JSON in raw_values). */
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let field = '', row: string[] = [], inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQ = false;
      else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      if (field !== '' || row.length) { row.push(field); rows.push(row); row = []; field = ''; }
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  const headers = rows.shift() ?? [];
  return rows.map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ''])));
}

async function main() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    const filePath = path.resolve(process.cwd(), file);
    const buf = fs.readFileSync(filePath);
    const sha256 = crypto.createHash('sha256').update(buf).digest('hex');
    const filename = path.basename(filePath);

    // Resolve clinic (report the match — confirmation requirement).
    const clinicRes = await client.query(
      `SELECT id, name, city FROM public.clinics WHERE name ILIKE $1 ${clinicCity ? 'AND city ILIKE $2' : ''} LIMIT 2`,
      clinicCity ? [`%${clinicName}%`, `%${clinicCity}%`] : [`%${clinicName}%`],
    );
    if (clinicRes.rowCount === 0) die(`No clinic matched "${clinicName}"${clinicCity ? ` / ${clinicCity}` : ''}. Confirm the clinic row first.`);
    if ((clinicRes.rowCount ?? 0) > 1) die(`Ambiguous clinic match for "${clinicName}" (${clinicRes.rowCount}). Pass --city to disambiguate.`);
    const clinic = clinicRes.rows[0];
    console.log(`🏥 Clinic resolved: ${clinic.name} (${clinic.city}) [${clinic.id}]`);

    const body = filename.endsWith('.json') ? JSON.parse(buf.toString('utf8')) : parseCsv(buf.toString('utf8'));

    if (dryRun) { console.log('🔎 --dry-run: parsed OK, no writes.'); return; }

    await client.query('BEGIN');

    // Dedup identical file.
    const existing = await client.query(
      `SELECT id, status FROM public.pp_import_batches WHERE report_type=$1 AND source_sha256=$2 LIMIT 1`,
      [report, sha256],
    );
    let batchId: string;
    if (existing.rowCount && existing.rows[0].status === 'upserted') {
      console.log(`✅ Identical file already imported (batch ${existing.rows[0].id}). No-op.`);
      await client.query('ROLLBACK');
      return;
    }
    if (existing.rowCount) {
      batchId = existing.rows[0].id;
    } else {
      const ins = await client.query(
        `INSERT INTO public.pp_import_batches (clinic_id, report_type, source_format, source_filename, source_sha256, raw_payload, connector, status)
         VALUES ($1,$2,$3,$4,$5,$6,'manual_export','validating') RETURNING id`,
        [clinic.id, report, filename.endsWith('.json') ? 'json' : 'csv', filename, sha256, JSON.stringify(body)],
      );
      batchId = ins.rows[0].id;
    }

    let loaded = 0, rejected = 0;
    if (report === 'revenue') ({ loaded, rejected } = await importRevenue(client, clinic.id, batchId, body as PPRevenuePayload));
    else if (report === 'accounts_receivable') ({ loaded, rejected } = await importAr(client, clinic.id, batchId, body as PPArAggregatePayload));
    else if (report === 'provider_performance') ({ loaded, rejected } = await importProviderPerformance(client, clinic.id, batchId, body as Record<string, string>[]));
    else die(`Unsupported report type "${report}" (revenue|accounts_receivable|provider_performance).`);

    await client.query(
      `UPDATE public.pp_import_batches SET status='upserted', row_count_loaded=$2, row_count_rejected=$3, completed_at=now() WHERE id=$1`,
      [batchId, loaded, rejected],
    );
    await client.query('COMMIT');
    console.log(`✅ Imported ${report}: ${loaded} loaded, ${rejected} rejected (batch ${batchId}).`);
  } catch (err) {
    await client.query('ROLLBACK');
    die(err instanceof Error ? err.message : String(err));
  } finally {
    await client.end();
  }
}

async function importRevenue(client: Client, clinicId: string, batchId: string, payload: PPRevenuePayload) {
  const m = payload.report_metadata;
  const o = payload.overall_metrics;
  await client.query(
    `INSERT INTO public.clinic_financial_metrics
       (clinic_id, period_start, period_end, total_revenue, total_visits, revenue_per_visit,
        total_clinician_hours, revenue_per_clinician_hour, source, import_batch_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'practiceperfect_pdf',$9)
     ON CONFLICT (clinic_id, period_start, period_end, source) DO UPDATE SET
       total_revenue=EXCLUDED.total_revenue, total_visits=EXCLUDED.total_visits,
       revenue_per_visit=EXCLUDED.revenue_per_visit, import_batch_id=EXCLUDED.import_batch_id`,
    [clinicId, m.period_start, m.period_end, o.total_revenue, o.total_visits,
     o.total_visits > 0 ? o.total_revenue / o.total_visits : 0, o.total_hours ?? 0,
     o.total_hours ? o.total_revenue / o.total_hours : 0, batchId],
  );

  const lines = cleanRevenueServiceLines(payload);
  let loaded = 0, rejected = 0;
  for (const [i, lr] of lines.entries()) {
    await stageRow(client, batchId, i, lr.raw, lr.cleaned, lr.validation, 'service_line_performance');
    if (lr.validation.status === 'rejected') { rejected++; continue; }
    const c = lr.cleaned;
    await client.query(
      `INSERT INTO public.service_line_performance
         (clinic_id, period_start, period_end, service_line, service_category, fee_code,
          total_visits, total_revenue, revenue_per_visit, source, import_batch_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'practiceperfect_pdf',$10)
       ON CONFLICT (clinic_id, period_start, period_end, service_line, fee_code) DO UPDATE SET
         total_visits=EXCLUDED.total_visits, total_revenue=EXCLUDED.total_revenue,
         revenue_per_visit=EXCLUDED.revenue_per_visit, import_batch_id=EXCLUDED.import_batch_id`,
      [clinicId, m.period_start, m.period_end, c.service_line, c.service_category, c.fee_code,
       c.total_visits, c.total_revenue, c.total_visits > 0 ? c.total_revenue / c.total_visits : 0, batchId],
    );
    loaded++;
  }
  const cleanSum = lines.filter((l) => l.validation.status !== 'rejected').reduce((s, l) => s + l.cleaned.total_revenue, 0);
  console.log(`   ↳ reconciliation: header revenue ${o.total_revenue} vs clean-line sum ${cleanSum.toFixed(2)} (Δ ${(o.total_revenue - cleanSum).toFixed(2)})`);
  return { loaded, rejected };
}

async function importAr(client: Client, clinicId: string, batchId: string, body: PPArAggregatePayload) {
  const due = body.total_due_total ?? body.current_total ?? 0;
  await client.query(
    `INSERT INTO public.accounts_receivable_aging
       (clinic_id, snapshot_date, payer_name, payer_type, current_0_30_days, invoiced_total, invoice_count,
        risk_level, risk_reason, recommended_action, source, import_batch_id)
     VALUES ($1,$2,'ALL','other',$3,$4,$5,'medium',
       'Aggregate-only AR snapshot (no aging buckets parsed from PDF).',
       'Export AR aging buckets (CSV) to refine aging + risk.','practiceperfect_pdf',$6)
     ON CONFLICT (clinic_id, snapshot_date, payer_name) DO UPDATE SET
       current_0_30_days=EXCLUDED.current_0_30_days, invoiced_total=EXCLUDED.invoiced_total,
       invoice_count=EXCLUDED.invoice_count, import_batch_id=EXCLUDED.import_batch_id`,
    [clinicId, body.as_of_date, due, body.invoiced_total ?? null, body.invoice_count ?? null, batchId],
  );
  console.log(`   ↳ AR total outstanding ${due}, invoices ${body.invoice_count ?? '?'}`);
  return { loaded: 1, rejected: 0 };
}

async function importProviderPerformance(client: Client, clinicId: string, batchId: string, rows: Record<string, string>[]) {
  let loaded = 0, rejected = 0;
  for (const [i, raw] of rows.entries()) {
    const r = mapProviderPerformanceRow(raw);
    await stageRow(client, batchId, i, raw, r.cleaned, r.validation, 'pp_provider_performance');
    if (r.validation.status === 'rejected') { rejected++; continue; }
    const c = r.cleaned;
    const ppProviderId = await resolveProvider(client, clinicId, c.provider_name, c.normalized_name);
    await client.query(
      `INSERT INTO public.pp_provider_performance
         (clinic_id, pp_provider_id, provider_name, period_start, period_end,
          total_scheduled_visits, total_scheduled_hours, avg_visits_per_hour, discharged_clients,
          change_in_client_load, client_cancels_no_shows, actual_visits, pct_cancel_no_show,
          revenue, avg_revenue_per_hour, raw_values, source, import_batch_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,'practiceperfect_pdf',$17)
       ON CONFLICT (clinic_id, provider_name, period_start, period_end) DO UPDATE SET
         pp_provider_id=EXCLUDED.pp_provider_id, total_scheduled_visits=EXCLUDED.total_scheduled_visits,
         revenue=EXCLUDED.revenue, raw_values=EXCLUDED.raw_values, import_batch_id=EXCLUDED.import_batch_id`,
      [clinicId, ppProviderId, c.provider_name,
       args['period-start'] ?? '2026-01-01', args['period-end'] ?? '2026-01-31',
       c.total_scheduled_visits, c.total_scheduled_hours, c.avg_visits_per_hour, c.discharged_clients,
       c.change_in_client_load, c.client_cancels_no_shows, c.actual_visits, c.pct_cancel_no_show,
       c.revenue, c.avg_revenue_per_hour, JSON.stringify(c.raw_values ?? null), batchId],
    );
    loaded++;
  }
  return { loaded, rejected };
}

/** Find-or-create a pp_providers row + alias (exact normalized match; fuzzy left to the UI). */
async function resolveProvider(client: Client, clinicId: string, name: string, normalized: string): Promise<string | null> {
  if (!normalized) return null;
  const alias = await client.query(`SELECT pp_provider_id FROM public.pp_provider_aliases WHERE normalized_name=$1 LIMIT 1`, [normalized]);
  if (alias.rowCount) return alias.rows[0].pp_provider_id;
  const prov = await client.query(
    `INSERT INTO public.pp_providers (clinic_id, canonical_name, normalized_name, match_status)
     VALUES ($1,$2,$3,'unmatched')
     ON CONFLICT (clinic_id, normalized_name) DO UPDATE SET canonical_name=EXCLUDED.canonical_name
     RETURNING id`,
    [clinicId, name, normalized],
  );
  const ppProviderId = prov.rows[0].id;
  await client.query(
    `INSERT INTO public.pp_provider_aliases (pp_provider_id, raw_name, normalized_name, source_report)
     VALUES ($1,$2,$3,'provider_performance') ON CONFLICT (normalized_name) DO NOTHING`,
    [ppProviderId, name, normalized],
  );
  return ppProviderId;
}

async function stageRow(
  client: Client, batchId: string, idx: number, raw: unknown, cleaned: unknown,
  validation: { status: string; messages: string[] }, target: string,
) {
  await client.query(
    `INSERT INTO public.pp_import_rows (batch_id, row_index, raw, cleaned, validation_status, validation_messages, target_table)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [batchId, idx, JSON.stringify(raw), JSON.stringify(cleaned), validation.status, JSON.stringify(validation.messages), target],
  );
}

main();
