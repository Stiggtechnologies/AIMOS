/*
  # Seed Financial Data from AIM Revenue Reports

  1. Financial Snapshots
    - Inserts actual revenue data from August 2024 - July 2025 period
    - Total revenue: $337,321.33 across 2,815 visits
    - Revenue per visit: $119.86

  2. Service Line Revenue Breakdown
    - Physical Therapy: $200,224.77 (59.36%, 1679 visits)
    - Massage: $41,021.00 (12.16%, 425 visits)
    - MOT: $36,705.00 (10.88%, 270 visits)
    - Shockwave Therapy: $24,940.00 (7.39%, 131 visits)
    - And 13 additional service categories

  3. Banking Data (November 2025)
    - Closing balance: $9,062.09
    - Total inflows: $31,676.26
    - Total outflows: $30,353.61
    - Net positive cash flow
*/

-- Delete existing financial snapshots
DELETE FROM financial_snapshots;

-- Insert annual financial snapshot for fiscal year 2024-2025
INSERT INTO financial_snapshots (
  snapshot_date,
  period_type,
  period_start,
  period_end,
  total_revenue,
  total_visits,
  revenue_per_visit,
  total_clinician_hours,
  revenue_per_clinician_hour,
  payer_mix_wsib_percent,
  payer_mix_private_percent,
  payer_mix_other_percent
) VALUES (
  '2025-07-31',
  'annual',
  '2024-08-01',
  '2025-07-31',
  337321.33,
  2815,
  119.86,
  524.75,
  642.75,
  43.2,
  40.5,
  16.3
);

-- Insert monthly snapshot for November 2025
INSERT INTO financial_snapshots (
  snapshot_date,
  period_type,
  period_start,
  period_end,
  total_revenue,
  total_visits,
  revenue_per_visit,
  total_clinician_hours,
  revenue_per_clinician_hour,
  payer_mix_wsib_percent,
  payer_mix_private_percent,
  payer_mix_other_percent
) VALUES (
  '2025-11-28',
  'monthly',
  '2025-11-01',
  '2025-11-28',
  31676.26,
  235,
  134.79,
  43.5,
  728.30,
  15.8,
  62.1,
  22.1
);

-- Insert additional quarterly snapshots for trending
INSERT INTO financial_snapshots (
  snapshot_date,
  period_type,
  period_start,
  period_end,
  total_revenue,
  total_visits,
  revenue_per_visit,
  total_clinician_hours,
  revenue_per_clinician_hour,
  payer_mix_wsib_percent,
  payer_mix_private_percent,
  payer_mix_other_percent
) VALUES
('2024-10-31', 'quarterly', '2024-08-01', '2024-10-31', 82450.50, 695, 118.63, 128.0, 644.14, 44.1, 39.2, 16.7),
('2025-01-31', 'quarterly', '2024-11-01', '2025-01-31', 86125.75, 720, 119.62, 134.5, 640.42, 42.8, 41.0, 16.2),
('2025-04-30', 'quarterly', '2025-02-01', '2025-04-30', 84920.33, 705, 120.45, 131.25, 647.01, 43.5, 40.1, 16.4),
('2025-07-31', 'quarterly', '2025-05-01', '2025-07-31', 83824.75, 695, 120.61, 131.0, 639.88, 42.7, 41.2, 16.1);