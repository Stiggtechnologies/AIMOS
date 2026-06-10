#!/usr/bin/env python3
"""
Parse a Practice Perfect "Revenue Report" PDF into the AIM OS revenue_import
JSON schema (same shape as import_parsed/revenue_import_*.json), which the
import-revenue-report edge function + scripts/pp-import.ts consume.

Uses `pdftotext -layout` (poppler). Pulls authoritative figures from the report's
own summary sections rather than re-summing transaction lines.

Usage:
  python3 scripts/pp_parse_revenue.py <revenue.pdf> <out.json> \
      [--clinic "Alberta Injury Management"] [--city Edmonton]
"""
import json, re, subprocess, sys, argparse

def money(s): return float(s.replace('$', '').replace(',', '').strip())

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('pdf'); ap.add_argument('out')
    ap.add_argument('--clinic', default='Alberta Injury Management')
    ap.add_argument('--city', default='Edmonton')
    a = ap.parse_args()

    text = subprocess.run(['pdftotext', '-layout', a.pdf, '-'],
                          capture_output=True, text=True, check=True).stdout
    lines = text.splitlines()

    # Period from header ("Revenue taking place from YYYY-MM-DD to YYYY-MM-DD").
    m = re.search(r'from\s+(\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})', text)
    period_start, period_end = (m.group(1), m.group(2)) if m else (None, None)

    # Grand total + visit/client counts from the TOTAL summary line.
    total_revenue = 0.0
    total_visits = 0
    unique_clients = None
    mt = re.search(r'# of unique clients:\s*(\d+)', text)
    if mt: unique_clients = int(mt.group(1))
    # Grand-total visits appear in the TOTAL block as "132 visits; 25 items".
    mv = re.search(r'(\d+)\s+visits;\s*\d+\s+items', text) or re.search(r'(\d+)\s+visits', text)
    if mv: total_visits = int(mv.group(1))
    # The first standalone "TOTAL ... $X $X" after the service summary is the grand total.
    for ln in lines:
        mtot = re.match(r'^TOTAL\b.*\$([\d,]+\.\d{2})\s+\$[\d,]+\.\d{2}\s*$', ln)
        if mtot:
            total_revenue = money(mtot.group(1)); break

    # Service lines from "Summary by Services" block(s) (between first such header
    # and "Summary by Fee Types"). Row: <code+desc> <pct>% <qty> <#used> $total $net
    svc_start = next((i for i, l in enumerate(lines) if l.lstrip().startswith('Summary by Services')), None)
    svc_end = next((i for i, l in enumerate(lines) if l.lstrip().startswith('Summary by Fee Types')), len(lines))
    service_lines = []
    if svc_start is not None:
        row_re = re.compile(r'^\s+(?P<body>\S.*?)\s+(?P<pct>\d+\.\d+)%\s+(?P<qty>.*?)\s+(?P<used>\d+)?\s*\$(?P<total>[\d,]+\.\d{2})\s+\$[\d,]+\.\d{2}\s*$')
        for ln in lines[svc_start:svc_end]:
            if 'Fee Code' in ln or 'Revenue Report:' in ln:
                continue
            mr = row_re.match(ln)
            if not mr:
                continue
            body = re.sub(r'\s{2,}', ' ', mr.group('body')).strip()
            # Fee code = leading uppercase/code tokens; description = remainder.
            mc = re.match(r'^([A-Z0-9][A-Z0-9 .\-/]*?)\s{1,}([A-Z].*)$', body)
            fee_code, desc = (mc.group(1).strip(), mc.group(2).strip()) if mc else (body, body)
            vm = re.search(r'(\d+)\s+visit', mr.group('qty'))
            service_lines.append({
                'service_line': desc,
                'service_category': 'Clinical',
                'total_revenue': money(mr.group('total')),
                'total_visits': int(vm.group(1)) if vm else 0,
                'metadata': {'fee_code': fee_code},
            })

    # Payer mix from "Summary by Divisions".
    payer = {}
    div_start = next((i for i, l in enumerate(lines) if l.lstrip().startswith('Summary by Divisions')), None)
    if div_start is not None:
        for ln in lines[div_start:div_start + 12]:
            if 'WCB' in ln: payer['wsib_percent'] = pct(ln)
            elif 'PRIVATE INSURANCE' in ln: payer['private_insurance_percent'] = pct(ln)
            elif 'MOTOR VEHICLE' in ln: payer['mva_percent'] = pct(ln)
            elif re.search(r'PRIVATE\s+PATIENT|\bPATIENT\b', ln): payer['patient_direct_percent'] = pct(ln)

    out = {
        'report_metadata': {
            'period_start': period_start, 'period_end': period_end,
            'clinic_name': a.clinic, 'clinic_city': a.city,
        },
        'overall_metrics': {
            'total_revenue': total_revenue, 'total_visits': total_visits,
            **({'unique_clients': unique_clients} if unique_clients is not None else {}),
        },
        **({'payer_mix': payer} if payer else {}),
        'service_lines': service_lines,
    }
    with open(a.out, 'w') as f:
        json.dump(out, f, indent=2)
    line_sum = sum(s['total_revenue'] for s in service_lines)
    print(f"✅ {a.out}: total_revenue={total_revenue} visits={total_visits} "
          f"clients={unique_clients} lines={len(service_lines)} (line-sum={line_sum:.2f})")

def pct(ln):
    m = re.search(r'(\d+\.\d+)%', ln)
    return float(m.group(1)) if m else 0.0

if __name__ == '__main__':
    main()
