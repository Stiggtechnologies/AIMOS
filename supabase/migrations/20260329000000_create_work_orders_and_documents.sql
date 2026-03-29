-- ============================================================================
-- Asset Management: Work Orders & Documents Schema
-- Created: 2026-03-29
-- Purpose: Complete the Asset Management module data layer
-- ============================================================================

-- ============================================================================
-- WORK ORDERS TABLE
-- Tracks maintenance and repair work orders for assets
-- ============================================================================

CREATE TABLE IF NOT EXISTS work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_number TEXT UNIQUE NOT NULL,
  asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL,
  user_clinic_access_id UUID REFERENCES user_clinic_access(id) ON DELETE SET NULL,
  
  -- Work order classification
  type TEXT NOT NULL CHECK (type IN ('preventive', 'corrective', 'emergency', 'inspection', 'upgrade', 'other')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'in_progress', 'completed', 'cancelled', 'on_hold')),
  
  -- Description and scheduling
  issue_description TEXT,
  requested_date TIMESTAMPTZ DEFAULT NOW(),
  scheduled_date TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,
  
  -- Assignment
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  vendor_name TEXT,
  
  -- Costs
  labor_cost DECIMAL(12,2) DEFAULT 0,
  parts_cost DECIMAL(12,2) DEFAULT 0,
  total_cost DECIMAL(12,2) GENERATED ALWAYS AS (COALESCE(labor_cost, 0) + COALESCE(parts_cost, 0)) STORED,
  
  -- Downtime tracking
  downtime_hours DECIMAL(8,2) DEFAULT 0,
  
  -- Resolution
  root_cause TEXT,
  resolution_notes TEXT,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for work_orders
CREATE INDEX IF NOT EXISTS idx_work_orders_number ON work_orders(work_order_number);
CREATE INDEX IF NOT EXISTS idx_work_orders_asset ON work_orders(asset_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_clinic ON work_orders(clinic_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_priority ON work_orders(priority);
CREATE INDEX IF NOT EXISTS idx_work_orders_scheduled ON work_orders(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_work_orders_assigned ON work_orders(assigned_to);
CREATE INDEX IF NOT EXISTS idx_work_orders_created ON work_orders(created_at);

-- ============================================================================
-- ASSET DOCUMENTS TABLE
-- Stores document references for assets
-- ============================================================================

CREATE TABLE IF NOT EXISTS asset_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  user_clinic_access_id UUID REFERENCES user_clinic_access(id) ON DELETE SET NULL,
  
  -- Document classification
  document_type TEXT NOT NULL CHECK (document_type IN ('manual', 'warranty', 'certificate', 'inspection_report', 'maintenance_log', 'purchase_order', 'invoice', 'photo', 'schematic', 'safety', 'calibration', 'other')),
  title TEXT NOT NULL,
  
  -- File reference
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  
  -- Version control
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'superseded', 'archived')),
  
  -- Upload tracking
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Tags for organization
  tags TEXT[],
  
  -- Expiry tracking for certificates/warranties
  expiry_date DATE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for asset_documents
CREATE INDEX IF NOT EXISTS idx_asset_documents_asset ON asset_documents(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_documents_type ON asset_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_asset_documents_status ON asset_documents(status);
CREATE INDEX IF NOT EXISTS idx_asset_documents_uploaded ON asset_documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_asset_documents_expiry ON asset_documents(expiry_date);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_documents ENABLE ROW LEVEL SECURITY;

-- Work Orders RLS Policies
CREATE POLICY "Users can view work orders for their clinics"
  ON work_orders FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      clinic_id IN (
        SELECT clinic_id FROM user_clinic_access WHERE user_id = auth.uid()
      )
      OR created_by = auth.uid()
      OR assigned_to = auth.uid()
    )
  );

CREATE POLICY "Users can insert work orders for their clinics"
  ON work_orders FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND clinic_id IN (
      SELECT clinic_id FROM user_clinic_access WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update work orders for their clinics"
  ON work_orders FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND (
      clinic_id IN (
        SELECT clinic_id FROM user_clinic_access WHERE user_id = auth.uid()
      )
      OR created_by = auth.uid()
      OR assigned_to = auth.uid()
    )
  );

-- Asset Documents RLS Policies
CREATE POLICY "Users can view documents for their clinics"
  ON asset_documents FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      asset_id IN (
        SELECT id FROM assets WHERE clinic_id IN (
          SELECT clinic_id FROM user_clinic_access WHERE user_id = auth.uid()
        )
      )
      OR uploaded_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert documents for their clinics"
  ON asset_documents FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND asset_id IN (
      SELECT id FROM assets WHERE clinic_id IN (
        SELECT clinic_id FROM user_clinic_access WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update documents for their clinics"
  ON asset_documents FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND (
      asset_id IN (
        SELECT id FROM assets WHERE clinic_id IN (
          SELECT clinic_id FROM user_clinic_access WHERE user_id = auth.uid()
        )
      )
      OR uploaded_by = auth.uid()
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to generate work order number
CREATE OR REPLACE FUNCTION generate_work_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.work_order_number IS NULL THEN
    NEW.work_order_number := 'WO-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('work_order_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto work order number
DROP SEQUENCE IF EXISTS work_order_seq;
CREATE SEQUENCE work_order_seq START 1;

CREATE OR REPLACE TRIGGER set_work_order_number
  BEFORE INSERT ON work_orders
  FOR EACH ROW
  EXECUTE FUNCTION generate_work_order_number();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE OR REPLACE TRIGGER update_work_orders_updated_at
  BEFORE UPDATE ON work_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_asset_documents_updated_at
  BEFORE UPDATE ON asset_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 'work_orders table created' AS status;
SELECT count(*) as work_orders_count FROM work_orders;

SELECT 'asset_documents table created' AS status;
SELECT count(*) as asset_documents_count FROM asset_documents;
