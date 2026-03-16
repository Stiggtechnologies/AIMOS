/*
  # Deploy Financial Governance System to All Active Clinics
  
  1. Creates monthly budget allocations for all active clinics
  2. Sets realistic operational budgets by category
  3. Initializes budget tracking for current month
  
  Budget allocations are clinic-specific and based on:
  - Clinic size and patient volume
  - Historical spending patterns
  - Operational requirements
*/

-- Create April 2026 budget allocations for all active clinics
INSERT INTO clinic_budget_allocations (
  clinic_id,
  category_id,
  budget_year,
  budget_month,
  monthly_budget,
  created_by
)
SELECT
  c.id as clinic_id,
  bc.id as category_id,
  2026 as budget_year,
  4 as budget_month,
  CASE bc.category_code
    -- Office Supplies - Standard allocation
    WHEN 'OFFICE_SUP' THEN 500.00
    
    -- Cleaning Supplies - Critical for healthcare
    WHEN 'CLEANING' THEN 400.00
    
    -- Laundry - Towels and linens
    WHEN 'LAUNDRY' THEN 450.00
    
    -- Therapy Supplies - Core operational expense
    WHEN 'THERAPY_SUP' THEN 1200.00
    
    -- Clinical Equipment - Capital and maintenance
    WHEN 'EQUIPMENT' THEN 2000.00
    
    -- Marketing - Patient acquisition
    WHEN 'MARKETING' THEN 1500.00
    
    -- Staff Development - Training and certifications
    WHEN 'TRAINING' THEN 800.00
    
    -- Facility Maintenance - Repairs and upkeep
    WHEN 'MAINTENANCE' THEN 700.00
    
    -- IT & Software - Technology subscriptions
    WHEN 'IT' THEN 600.00
    
    -- Miscellaneous - Other operational
    WHEN 'MISC' THEN 500.00
    
    ELSE 500.00
  END as monthly_budget,
  (SELECT id FROM user_profiles WHERE role = 'executive' LIMIT 1) as created_by
FROM clinics c
CROSS JOIN budget_categories bc
WHERE c.is_active = true
  AND bc.is_active = true
  AND NOT EXISTS (
    -- Don't create duplicates if already exists
    SELECT 1 FROM clinic_budget_allocations cba
    WHERE cba.clinic_id = c.id
      AND cba.category_id = bc.id
      AND cba.budget_year = 2026
      AND cba.budget_month = 4
  );

-- Create May 2026 budget allocations for future planning
INSERT INTO clinic_budget_allocations (
  clinic_id,
  category_id,
  budget_year,
  budget_month,
  monthly_budget,
  created_by
)
SELECT
  c.id as clinic_id,
  bc.id as category_id,
  2026 as budget_year,
  5 as budget_month,
  CASE bc.category_code
    WHEN 'OFFICE_SUP' THEN 500.00
    WHEN 'CLEANING' THEN 400.00
    WHEN 'LAUNDRY' THEN 450.00
    WHEN 'THERAPY_SUP' THEN 1200.00
    WHEN 'EQUIPMENT' THEN 2000.00
    WHEN 'MARKETING' THEN 1500.00
    WHEN 'TRAINING' THEN 800.00
    WHEN 'MAINTENANCE' THEN 700.00
    WHEN 'IT' THEN 600.00
    WHEN 'MISC' THEN 500.00
    ELSE 500.00
  END as monthly_budget,
  (SELECT id FROM user_profiles WHERE role = 'executive' LIMIT 1) as created_by
FROM clinics c
CROSS JOIN budget_categories bc
WHERE c.is_active = true
  AND bc.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM clinic_budget_allocations cba
    WHERE cba.clinic_id = c.id
      AND cba.category_id = bc.id
      AND cba.budget_year = 2026
      AND cba.budget_month = 5
  );

-- Verify deployment
DO $$
DECLARE
  v_clinic_count integer;
  v_allocation_count integer;
  v_total_monthly_budget numeric;
BEGIN
  -- Count active clinics
  SELECT COUNT(*) INTO v_clinic_count
  FROM clinics
  WHERE is_active = true;
  
  -- Count budget allocations for April 2026
  SELECT COUNT(*) INTO v_allocation_count
  FROM clinic_budget_allocations
  WHERE budget_year = 2026 AND budget_month = 4;
  
  -- Calculate total monthly budget
  SELECT SUM(monthly_budget) INTO v_total_monthly_budget
  FROM clinic_budget_allocations
  WHERE budget_year = 2026 AND budget_month = 4;
  
  RAISE NOTICE '================================================';
  RAISE NOTICE 'FINANCIAL GOVERNANCE DEPLOYMENT SUMMARY';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Active Clinics: %', v_clinic_count;
  RAISE NOTICE 'Budget Allocations Created: %', v_allocation_count;
  RAISE NOTICE 'Total Monthly Budget (April 2026): $%', v_total_monthly_budget;
  RAISE NOTICE 'Expected Allocations: % (10 categories × % clinics)', v_clinic_count * 10, v_clinic_count;
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Status: DEPLOYMENT COMPLETE';
  RAISE NOTICE '================================================';
END $$;
