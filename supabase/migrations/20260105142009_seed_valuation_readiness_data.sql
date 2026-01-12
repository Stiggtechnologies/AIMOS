/*
  # Seed Valuation Readiness Demo Data

  ## Purpose
  Populates exit readiness module with realistic demo data demonstrating operational maturity and buyer preparation.

  ## Data Seeded
  - KPI normalizations with EBITDA adjustments
  - Due diligence categories and checklists
  - Virtual data room structure and documents
  - Operational maturity assessments
  - Exit readiness metrics
  - Buyer profiles with fit scores
  - Value drivers across financial, operational, market, and strategic dimensions
*/

-- Seed KPI Normalizations
INSERT INTO kpi_normalizations (
  period, period_start, period_end,
  reported_revenue, normalized_revenue,
  reported_ebitda, normalized_ebitda,
  reported_gross_margin, normalized_gross_margin,
  reported_operating_margin, normalized_operating_margin,
  customer_acquisition_cost, lifetime_value, ltv_cac_ratio,
  rule_of_40_score,
  ebitda_adjustments
)
VALUES
  (
    'Q4 2024',
    '2024-10-01',
    '2024-12-31',
    15600000,
    16800000,
    3200000,
    4500000,
    0.68,
    0.72,
    0.21,
    0.27,
    850,
    4250,
    5.0,
    45,
    '[
      {"type": "One-time legal expense", "amount": 450000, "category": "legal", "justification": "One-time M&A advisory fees"},
      {"type": "Founder salary normalization", "amount": 350000, "category": "compensation", "justification": "Adjust founder comp to market rate"},
      {"type": "Office relocation costs", "amount": 200000, "category": "facilities", "justification": "Non-recurring move expense"},
      {"type": "Bad debt write-off", "amount": 300000, "category": "financial", "justification": "One-time cleanup of legacy AR"}
    ]'::jsonb
  ),
  (
    'Q3 2024',
    '2024-07-01',
    '2024-09-30',
    14200000,
    15000000,
    2800000,
    3900000,
    0.66,
    0.70,
    0.20,
    0.26,
    920,
    4100,
    4.5,
    42,
    '[
      {"type": "System migration costs", "amount": 550000, "category": "technology", "justification": "One-time EHR migration"},
      {"type": "Severance payments", "amount": 350000, "category": "compensation", "justification": "Restructuring costs"},
      {"type": "Lease termination", "amount": 200000, "category": "facilities", "justification": "Early lease exit"}
    ]'::jsonb
  )
ON CONFLICT DO NOTHING;

-- Seed Diligence Categories
INSERT INTO diligence_categories (
  category_code, category_name, description,
  importance_level, typical_buyer_focus, display_order
)
VALUES
  ('legal', 'Legal & Compliance', 'Corporate structure, contracts, litigation, IP, regulatory', 'critical', 'Deal breakers, liability exposure', 1),
  ('financial', 'Financial', 'Accounting quality, revenue recognition, working capital', 'critical', 'EBITDA quality, cash generation', 2),
  ('commercial', 'Commercial', 'Customer concentration, contracts, pricing power', 'high', 'Revenue defensibility, growth potential', 3),
  ('operational', 'Operational', 'Process maturity, systems, key man risk', 'high', 'Scalability, integration complexity', 4),
  ('technology', 'Technology & Data', 'Systems architecture, data security, technical debt', 'high', 'Platform scalability, cyber risk', 5),
  ('hr', 'Human Resources', 'Team structure, compensation, retention, culture', 'medium', 'Management depth, turnover risk', 6)
ON CONFLICT DO NOTHING;

-- Seed Diligence Checklists
INSERT INTO diligence_checklists (
  category_id, item_number, item_name, description,
  required_for_exit, buyer_scrutiny_level, completion_status, completion_percentage
)
SELECT
  (SELECT id FROM diligence_categories WHERE category_code = 'legal'),
  'L-001',
  'Corporate Organization Documents',
  'Certificate of incorporation, bylaws, board resolutions, cap table',
  true,
  'critical',
  'complete',
  100
UNION ALL SELECT
  (SELECT id FROM diligence_categories WHERE category_code = 'legal'),
  'L-002',
  'Material Contracts',
  'Customer agreements, vendor contracts, leases, financing docs',
  true,
  'critical',
  'complete',
  100
UNION ALL SELECT
  (SELECT id FROM diligence_categories WHERE category_code = 'legal'),
  'L-003',
  'Intellectual Property',
  'Trademarks, patents, copyrights, domain names, licenses',
  true,
  'high',
  'complete',
  100
UNION ALL SELECT
  (SELECT id FROM diligence_categories WHERE category_code = 'legal'),
  'L-004',
  'Litigation & Disputes',
  'Pending or threatened litigation, regulatory investigations',
  true,
  'critical',
  'complete',
  100
UNION ALL SELECT
  (SELECT id FROM diligence_categories WHERE category_code = 'financial'),
  'F-001',
  'Audited Financial Statements',
  'Last 3 years of audited or reviewed financials',
  true,
  'critical',
  'in_progress',
  75
UNION ALL SELECT
  (SELECT id FROM diligence_categories WHERE category_code = 'financial'),
  'F-002',
  'Quality of Earnings Report',
  'Independent QoE analysis of EBITDA and adjustments',
  true,
  'critical',
  'not_started',
  0
UNION ALL SELECT
  (SELECT id FROM diligence_categories WHERE category_code = 'financial'),
  'F-003',
  'Monthly Management Reports',
  'P&L, balance sheet, cash flow for last 24 months',
  true,
  'high',
  'complete',
  100
UNION ALL SELECT
  (SELECT id FROM diligence_categories WHERE category_code = 'financial'),
  'F-004',
  'Working Capital Analysis',
  'AR aging, AP aging, inventory, customer deposits',
  true,
  'high',
  'complete',
  100
UNION ALL SELECT
  (SELECT id FROM diligence_categories WHERE category_code = 'commercial'),
  'C-001',
  'Customer Concentration Analysis',
  'Top 20 customers with revenue, retention, contract terms',
  true,
  'critical',
  'complete',
  100
UNION ALL SELECT
  (SELECT id FROM diligence_categories WHERE category_code = 'commercial'),
  'C-002',
  'Revenue by Product/Service',
  'Historical trends, pricing, gross margins by offering',
  true,
  'high',
  'complete',
  100
UNION ALL SELECT
  (SELECT id FROM diligence_categories WHERE category_code = 'commercial'),
  'C-003',
  'Sales Pipeline & Forecast',
  'Current pipeline, win rates, sales cycle metrics',
  false,
  'medium',
  'in_progress',
  60
UNION ALL SELECT
  (SELECT id FROM diligence_categories WHERE category_code = 'operational'),
  'O-001',
  'Organization Chart',
  'Current org structure with names, titles, tenure',
  true,
  'high',
  'complete',
  100
UNION ALL SELECT
  (SELECT id FROM diligence_categories WHERE category_code = 'operational'),
  'O-002',
  'Process Documentation',
  'SOPs for key workflows, quality assurance, compliance',
  true,
  'high',
  'in_progress',
  65
UNION ALL SELECT
  (SELECT id FROM diligence_categories WHERE category_code = 'technology'),
  'T-001',
  'Systems Architecture Diagram',
  'Current technology stack, integrations, dependencies',
  true,
  'high',
  'complete',
  100
UNION ALL SELECT
  (SELECT id FROM diligence_categories WHERE category_code = 'technology'),
  'T-002',
  'Cybersecurity & Data Privacy',
  'SOC 2, HIPAA compliance, security policies, incident history',
  true,
  'critical',
  'in_progress',
  80
ON CONFLICT DO NOTHING;

-- Seed Data Room Structure
INSERT INTO data_room_structure (
  folder_path, folder_name, folder_type,
  description, document_count, is_confidential, access_level, display_order
)
VALUES
  ('/01_corporate', '01 Corporate', 'category', 'Corporate structure and governance', 12, false, 'phase1', 1),
  ('/02_financial', '02 Financial', 'category', 'Financial statements and records', 28, true, 'phase1', 2),
  ('/03_legal', '03 Legal', 'category', 'Legal documents and contracts', 45, true, 'phase2', 3),
  ('/04_commercial', '04 Commercial', 'category', 'Sales, marketing, and customer data', 18, true, 'phase1', 4),
  ('/05_operations', '05 Operations', 'category', 'Operational processes and metrics', 22, false, 'phase1', 5),
  ('/06_hr', '06 Human Resources', 'category', 'Personnel and compensation', 15, true, 'phase2', 6),
  ('/07_technology', '07 Technology', 'category', 'Systems, IP, and technical assets', 19, true, 'phase2', 7)
ON CONFLICT DO NOTHING;

-- Seed Data Room Documents
INSERT INTO data_room_documents (
  folder_id, document_name, document_type, description,
  file_size_mb, version, status, requires_nda
)
SELECT
  (SELECT id FROM data_room_structure WHERE folder_name = '01 Corporate'),
  'Certificate of Incorporation',
  'PDF',
  'DE Certificate of Incorporation',
  0.5,
  '1.0',
  'approved',
  false
UNION ALL SELECT
  (SELECT id FROM data_room_structure WHERE folder_name = '01 Corporate'),
  'Bylaws - Current',
  'PDF',
  'Amended and restated bylaws',
  0.8,
  '3.0',
  'approved',
  false
UNION ALL SELECT
  (SELECT id FROM data_room_structure WHERE folder_name = '02 Financial'),
  'Audited Financials - 2023',
  'PDF',
  'CPA audited financial statements',
  2.4,
  '1.0',
  'approved',
  true
UNION ALL SELECT
  (SELECT id FROM data_room_structure WHERE folder_name = '02 Financial'),
  'Audited Financials - 2022',
  'PDF',
  'CPA audited financial statements',
  2.2,
  '1.0',
  'approved',
  true
UNION ALL SELECT
  (SELECT id FROM data_room_structure WHERE folder_name = '02 Financial'),
  'Monthly Financials - 2024',
  'Excel',
  'Monthly P&L, BS, CF for YTD 2024',
  1.8,
  '12.0',
  'approved',
  true
UNION ALL SELECT
  (SELECT id FROM data_room_structure WHERE folder_name = '03 Legal'),
  'Material Customer Contracts',
  'PDF',
  'Top 20 customer agreements',
  15.6,
  '1.0',
  'approved',
  true
UNION ALL SELECT
  (SELECT id FROM data_room_structure WHERE folder_name = '04 Commercial'),
  'Customer Revenue Analysis',
  'Excel',
  'Customer-level revenue trends',
  3.2,
  '1.0',
  'approved',
  true
ON CONFLICT DO NOTHING;

-- Seed Operational Maturity Dimensions
INSERT INTO operational_maturity_dimensions (
  dimension_code, dimension_name, description, weight, max_score
)
VALUES
  ('finance', 'Financial Management', 'Quality of accounting, reporting, and financial controls', 1.2, 100),
  ('sales', 'Sales & Marketing', 'Customer acquisition processes and marketing effectiveness', 1.0, 100),
  ('operations', 'Operations', 'Process documentation, efficiency, and quality management', 1.1, 100),
  ('technology', 'Technology', 'Systems scalability, architecture, and technical debt', 1.0, 100),
  ('hr', 'Human Resources', 'Talent management, succession planning, and culture', 0.9, 100),
  ('legal', 'Legal & Compliance', 'Regulatory compliance, contract management, and risk', 1.0, 100)
ON CONFLICT DO NOTHING;

-- Seed Maturity Assessments
INSERT INTO maturity_assessments (
  dimension_id, current_score, target_score,
  score_rationale, strengths, weaknesses
)
SELECT
  (SELECT id FROM operational_maturity_dimensions WHERE dimension_code = 'finance'),
  82,
  95,
  'Strong financial controls with monthly close process. External audit relationship established.',
  ARRAY['Monthly close in 5 days', 'Clean audit opinions', 'Robust FP&A function'],
  ARRAY['Manual reconciliations', 'Limited automation in AP/AR']
UNION ALL SELECT
  (SELECT id FROM operational_maturity_dimensions WHERE dimension_code = 'sales'),
  75,
  90,
  'Proven sales process with CRM tracking. Marketing attribution needs improvement.',
  ARRAY['Documented sales playbook', 'CRM adoption >90%', 'Consistent win rates'],
  ARRAY['Limited marketing attribution', 'Nascent account management function']
UNION ALL SELECT
  (SELECT id FROM operational_maturity_dimensions WHERE dimension_code = 'operations'),
  78,
  92,
  'Core clinical processes well-documented. Some operational workflows still informal.',
  ARRAY['Clinical quality metrics tracked', 'Patient satisfaction >90%'],
  ARRAY['Supply chain optimization needed', 'Limited process automation']
UNION ALL SELECT
  (SELECT id FROM operational_maturity_dimensions WHERE dimension_code = 'technology'),
  70,
  90,
  'Modern tech stack but some technical debt. Cloud migration 80% complete.',
  ARRAY['API-first architecture', 'Modern EHR platform', 'Good uptime (99.8%)'],
  ARRAY['Legacy systems in 2 clinics', 'Limited disaster recovery testing']
UNION ALL SELECT
  (SELECT id FROM operational_maturity_dimensions WHERE dimension_code = 'hr'),
  68,
  85,
  'Core HR systems in place. Succession planning and development programs emerging.',
  ARRAY['HRIS implemented', 'Competitive compensation'],
  ARRAY['Limited succession planning', 'Development programs immature']
UNION ALL SELECT
  (SELECT id FROM operational_maturity_dimensions WHERE dimension_code = 'legal'),
  80,
  95,
  'Strong compliance posture with dedicated resources. Contract management system needed.',
  ARRAY['HIPAA compliant', 'Active compliance program', 'No material litigation'],
  ARRAY['Manual contract management', 'Limited audit trail for some processes']
ON CONFLICT DO NOTHING;

-- Seed Exit Readiness Metrics
INSERT INTO exit_readiness_metrics (
  overall_readiness_score,
  diligence_completion_percentage,
  data_room_completion_percentage,
  maturity_score,
  financial_quality_score,
  operational_quality_score,
  tech_quality_score,
  estimated_multiple_low,
  estimated_multiple_high,
  competitive_advantages,
  red_flags,
  value_creation_opportunities
)
VALUES
  (
    78,
    73,
    85,
    76,
    82,
    78,
    70,
    8.5,
    11.0,
    '[
      "Market-leading clinical quality metrics",
      "Proprietary patient engagement platform",
      "Dense geographic footprint in high-growth MSA",
      "Strong payer relationships with upside case rates"
    ]'::jsonb,
    '[
      "Quality of Earnings report outstanding",
      "Key person concentration in 2 markets",
      "Technical debt in legacy clinic systems"
    ]'::jsonb,
    '[
      "Complete cloud migration (+$500K EBITDA)",
      "Implement centralized scheduling (+$300K)",
      "Launch telehealth offering (+$800K revenue)",
      "Optimize payer mix (+200bps margin)"
    ]'::jsonb
  )
ON CONFLICT DO NOTHING;

-- Seed Buyer Profiles
INSERT INTO buyer_profiles (
  buyer_type, buyer_name,
  typical_check_size_min, typical_check_size_max,
  preferred_revenue_range_min, preferred_revenue_range_max,
  key_evaluation_criteria, typical_hold_period,
  integration_approach, deal_structure_preference, fit_score
)
VALUES
  (
    'financial_sponsor',
    'HealthTech Capital Partners',
    50000000,
    200000000,
    15000000,
    75000000,
    ARRAY['EBITDA margin >20%', 'Fragmented market', 'Add-on potential', 'Management team strength'],
    '4-6 years',
    'Platform + add-ons',
    'Majority recapitalization',
    92
  ),
  (
    'strategic',
    'National Healthcare Services Corp',
    25000000,
    500000000,
    10000000,
    100000000,
    ARRAY['Geographic expansion', 'Clinical capabilities', 'Technology platform', 'Payer relationships'],
    'Permanent',
    'Full integration',
    '100% acquisition',
    85
  ),
  (
    'financial_sponsor',
    'Growth Equity Partners',
    30000000,
    150000000,
    12000000,
    60000000,
    ARRAY['Rule of 40 >35', 'Recurring revenue >70%', 'Tech-enabled', 'Scalable model'],
    '3-5 years',
    'Minority growth capital',
    'Minority investment',
    78
  ),
  (
    'strategic',
    'Regional Health System',
    10000000,
    75000000,
    5000000,
    40000000,
    ARRAY['Local market presence', 'Clinical integration', 'Value-based care', 'Patient access'],
    'Permanent',
    'Partnership model',
    'Majority or JV',
    72
  )
ON CONFLICT DO NOTHING;

-- Seed Value Drivers
INSERT INTO value_drivers (
  driver_category, driver_name, description,
  current_rating, impact_on_multiple, supporting_evidence, improvement_plan
)
VALUES
  (
    'financial',
    'Revenue Growth',
    'Historical and projected revenue CAGR',
    'strong',
    'high',
    '32% CAGR last 3 years. Q4 2024 growth of 18% YoY.',
    'Maintain >20% growth through geographic expansion'
  ),
  (
    'financial',
    'EBITDA Margin',
    'Normalized EBITDA as % of revenue',
    'strong',
    'high',
    '27% normalized EBITDA margin, above 22% industry median.',
    'Target 30% through operational leverage'
  ),
  (
    'financial',
    'Cash Conversion',
    'Ability to convert EBITDA to free cash flow',
    'moderate',
    'medium',
    '75% cash conversion. DSO at 42 days.',
    'Improve to 85% by reducing DSO to 35 days'
  ),
  (
    'operational',
    'Process Maturity',
    'Documented, scalable operational processes',
    'moderate',
    'high',
    'Core clinical processes documented. Back-office needs standardization.',
    'Complete SOP documentation across all functions'
  ),
  (
    'operational',
    'Key Person Risk',
    'Dependence on specific individuals',
    'weak',
    'high',
    'High dependence on founder in 2 markets. Limited management bench.',
    'Hire 2 regional VPs. Strengthen C-suite.'
  ),
  (
    'market',
    'Market Position',
    'Competitive positioning and market share',
    'strong',
    'high',
    '#1 or #2 in 3 of 5 markets. NPS of 78.',
    'Expand to #1 position in remaining 2 markets'
  ),
  (
    'market',
    'Customer Concentration',
    'Revenue diversification across customers',
    'strong',
    'medium',
    'Top 10 customers <35% of revenue. No customer >8%.',
    'Maintain diversification as we scale'
  ),
  (
    'strategic',
    'Platform Technology',
    'Proprietary technology and data assets',
    'strong',
    'high',
    'Proprietary patient engagement platform. 85% patient app adoption.',
    'Monetize platform through licensing'
  ),
  (
    'strategic',
    'Add-On Opportunities',
    'Potential for platform M&A strategy',
    'strong',
    'high',
    'Fragmented market with 500+ small competitors. Proven integration playbook.',
    'Target 3 add-ons in next 18 months'
  )
ON CONFLICT DO NOTHING;

SELECT 'Valuation readiness demo data seeded successfully' as result;
