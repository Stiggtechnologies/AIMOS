/*
  # Fix Critical "Always True" RLS Policies - Batch 3

  ## Security Issue
  Continues fixing tables with "always true" RLS policies that bypass security.
  
  ## Changes
  
  ### Provider/Clinical Management:
  - external_providers: External provider management
  - provider_credentials: Provider credential tracking
  - insurance_payers: Insurance payer information
  - clinical_protocols: Clinical protocol management
  - protocol_versions: Protocol version control
  
  ### Inventory Management:
  - inventory_categories: Inventory categorization
  
  ### Regulatory/Compliance:
  - regulatory_requirements: Regulatory requirement tracking
  
  ## Security Impact
  Restricts access to clinical and provider data based on user roles.
*/

-- ===================================================================
-- EXTERNAL_PROVIDERS
-- ===================================================================

DROP POLICY IF EXISTS "Authenticated users can manage external providers" ON external_providers;
DROP POLICY IF EXISTS "Authenticated users can view external providers" ON external_providers;

CREATE POLICY "Managers manage external providers"
ON external_providers
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
    AND user_profiles.role = ANY (ARRAY['executive'::user_role, 'admin'::user_role, 'clinic_manager'::user_role])
  )
);

CREATE POLICY "Staff view external providers"
ON external_providers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
  )
);

-- ===================================================================
-- PROVIDER_CREDENTIALS
-- ===================================================================

DROP POLICY IF EXISTS "Authenticated users can manage provider credentials" ON provider_credentials;
DROP POLICY IF EXISTS "Authenticated users can view provider credentials" ON provider_credentials;

CREATE POLICY "Managers manage provider credentials"
ON provider_credentials
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
    AND user_profiles.role = ANY (ARRAY['executive'::user_role, 'admin'::user_role, 'clinic_manager'::user_role])
  )
);

CREATE POLICY "Staff view provider credentials"
ON provider_credentials
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
  )
);

-- ===================================================================
-- INSURANCE_PAYERS
-- ===================================================================

DROP POLICY IF EXISTS "Authenticated users can manage insurance payers" ON insurance_payers;
DROP POLICY IF EXISTS "Authenticated users can view insurance payers" ON insurance_payers;

CREATE POLICY "Admins manage insurance payers"
ON insurance_payers
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
    AND user_profiles.role = ANY (ARRAY['executive'::user_role, 'admin'::user_role])
  )
);

CREATE POLICY "Staff view insurance payers"
ON insurance_payers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
  )
);

-- ===================================================================
-- CLINICAL_PROTOCOLS
-- ===================================================================

DROP POLICY IF EXISTS "Authenticated users can manage protocols" ON clinical_protocols;

CREATE POLICY "Admins manage protocols"
ON clinical_protocols
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
    AND user_profiles.role = ANY (ARRAY['executive'::user_role, 'admin'::user_role])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
    AND user_profiles.role = ANY (ARRAY['executive'::user_role, 'admin'::user_role])
  )
);

-- ===================================================================
-- PROTOCOL_VERSIONS
-- ===================================================================

DROP POLICY IF EXISTS "Authenticated users can manage protocol versions" ON protocol_versions;
DROP POLICY IF EXISTS "Authenticated users can view protocol versions" ON protocol_versions;

CREATE POLICY "Admins manage protocol versions"
ON protocol_versions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
    AND user_profiles.role = ANY (ARRAY['executive'::user_role, 'admin'::user_role])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
    AND user_profiles.role = ANY (ARRAY['executive'::user_role, 'admin'::user_role])
  )
);

CREATE POLICY "Clinical staff view protocol versions"
ON protocol_versions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
  )
);

-- ===================================================================
-- INVENTORY_CATEGORIES
-- ===================================================================

DROP POLICY IF EXISTS "Authenticated users can manage inventory categories" ON inventory_categories;
DROP POLICY IF EXISTS "Authenticated users can view inventory categories" ON inventory_categories;

CREATE POLICY "Managers manage inventory categories"
ON inventory_categories
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
    AND user_profiles.role = ANY (ARRAY['executive'::user_role, 'admin'::user_role, 'clinic_manager'::user_role])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
    AND user_profiles.role = ANY (ARRAY['executive'::user_role, 'admin'::user_role, 'clinic_manager'::user_role])
  )
);

CREATE POLICY "Staff view inventory categories"
ON inventory_categories
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
  )
);

-- ===================================================================
-- REGULATORY_REQUIREMENTS
-- ===================================================================

DROP POLICY IF EXISTS "Authenticated users can manage regulatory requirements" ON regulatory_requirements;
DROP POLICY IF EXISTS "Authenticated users can view regulatory requirements" ON regulatory_requirements;

CREATE POLICY "Admins manage regulatory requirements"
ON regulatory_requirements
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
    AND user_profiles.role = ANY (ARRAY['executive'::user_role, 'admin'::user_role])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
    AND user_profiles.role = ANY (ARRAY['executive'::user_role, 'admin'::user_role])
  )
);

CREATE POLICY "Staff view regulatory requirements"
ON regulatory_requirements
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
  )
);
