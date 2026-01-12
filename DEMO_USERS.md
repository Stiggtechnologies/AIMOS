# Demo User Accounts Setup Guide

## Creating Demo Users in Supabase

To test the AIM OS system with different roles, you need to create user accounts in Supabase Auth and then link them to user profiles.

### Step 1: Access Supabase Dashboard

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Navigate to your project: `tfnoogotbyshsznpjspk`
3. Click on **Authentication** → **Users** in the left sidebar

### Step 2: Create Auth Users

Create the following 5 demo users by clicking **Add User** for each:

#### User 1: Executive
- **Email**: `sarah.executive@aimrehab.ca`
- **Password**: `Demo2026!Executive`
- **Auto Confirm User**: ✓ (checked)

#### User 2: Clinic Manager
- **Email**: `michael.manager@aimrehab.ca`
- **Password**: `Demo2026!Manager`
- **Auto Confirm User**: ✓ (checked)

#### User 3: Clinician
- **Email**: `jennifer.clinician@aimrehab.ca`
- **Password**: `Demo2026!Clinician`
- **Auto Confirm User**: ✓ (checked)

#### User 4: Admin
- **Email**: `david.admin@aimrehab.ca`
- **Password**: `Demo2026!Admin`
- **Auto Confirm User**: ✓ (checked)

#### User 5: Contractor
- **Email**: `amanda.contractor@aimrehab.ca`
- **Password**: `Demo2026!Contractor`
- **Auto Confirm User**: ✓ (checked)

### Step 3: Get User IDs

After creating each user, note their UUID (user ID). You'll see it in the Users table.

### Step 4: Create User Profiles

Go to **Table Editor** → **user_profiles** and insert records for each user:

#### Option A: Using SQL Editor

Go to **SQL Editor** and run this script (replace the UUIDs with actual ones from Step 3):

```sql
-- Get clinic IDs first
DO $$
DECLARE
  calgary_north_id UUID;
  calgary_south_id UUID;
  edmonton_central_id UUID;
BEGIN
  SELECT id INTO calgary_north_id FROM clinics WHERE code = 'YYC-N';
  SELECT id INTO calgary_south_id FROM clinics WHERE code = 'YYC-S';
  SELECT id INTO edmonton_central_id FROM clinics WHERE code = 'YEG-C';

  -- Insert user profiles (replace these UUIDs with actual auth.users IDs)

  -- Executive User
  INSERT INTO user_profiles (
    id,
    email,
    first_name,
    last_name,
    role,
    phone,
    is_active
  ) VALUES (
    'REPLACE_WITH_EXECUTIVE_USER_ID',
    'sarah.executive@aimrehab.ca',
    'Sarah',
    'Chen',
    'executive',
    '403-555-1001',
    true
  ) ON CONFLICT (id) DO NOTHING;

  -- Clinic Manager User
  INSERT INTO user_profiles (
    id,
    email,
    first_name,
    last_name,
    role,
    primary_clinic_id,
    phone,
    is_active
  ) VALUES (
    'REPLACE_WITH_MANAGER_USER_ID',
    'michael.manager@aimrehab.ca',
    'Michael',
    'Roberts',
    'clinic_manager',
    calgary_south_id,
    '403-555-1002',
    true
  ) ON CONFLICT (id) DO NOTHING;

  -- Clinician User
  INSERT INTO user_profiles (
    id,
    email,
    first_name,
    last_name,
    role,
    primary_clinic_id,
    phone,
    is_active
  ) VALUES (
    'REPLACE_WITH_CLINICIAN_USER_ID',
    'jennifer.clinician@aimrehab.ca',
    'Jennifer',
    'Wong',
    'clinician',
    edmonton_central_id,
    '780-555-2001',
    true
  ) ON CONFLICT (id) DO NOTHING;

  -- Admin User
  INSERT INTO user_profiles (
    id,
    email,
    first_name,
    last_name,
    role,
    primary_clinic_id,
    phone,
    is_active
  ) VALUES (
    'REPLACE_WITH_ADMIN_USER_ID',
    'david.admin@aimrehab.ca',
    'David',
    'Thompson',
    'admin',
    calgary_north_id,
    '403-555-3001',
    true
  ) ON CONFLICT (id) DO NOTHING;

  -- Contractor User
  INSERT INTO user_profiles (
    id,
    email,
    first_name,
    last_name,
    role,
    primary_clinic_id,
    phone,
    is_active
  ) VALUES (
    'REPLACE_WITH_CONTRACTOR_USER_ID',
    'amanda.contractor@aimrehab.ca',
    'Amanda',
    'Martinez',
    'contractor',
    calgary_south_id,
    '403-555-4001',
    true
  ) ON CONFLICT (id) DO NOTHING;

  -- Grant clinic access to clinic manager
  INSERT INTO clinic_access (user_id, clinic_id, role, granted_at)
  VALUES ('REPLACE_WITH_MANAGER_USER_ID', calgary_south_id, 'manager', now())
  ON CONFLICT (user_id, clinic_id) DO NOTHING;

  -- Grant clinic access to clinician
  INSERT INTO clinic_access (user_id, clinic_id, role, granted_at)
  VALUES ('REPLACE_WITH_CLINICIAN_USER_ID', edmonton_central_id, 'clinician', now())
  ON CONFLICT (user_id, clinic_id) DO NOTHING;

  -- Grant clinic access to contractor
  INSERT INTO clinic_access (user_id, clinic_id, role, granted_at)
  VALUES ('REPLACE_WITH_CONTRACTOR_USER_ID', calgary_south_id, 'contractor', now())
  ON CONFLICT (user_id, clinic_id) DO NOTHING;
END $$;
```

### Step 5: Test Login

Test each user by logging into your deployed application:

1. **Executive** - Should see all modules including Talent Acquisition
2. **Clinic Manager** - Should see clinic-specific data for Calgary South
3. **Clinician** - Should see Edmonton Central clinic data
4. **Admin** - Should see all modules including Talent Acquisition
5. **Contractor** - Limited access to Calgary South

## Test Credentials Summary

| Role | Email | Password | Access |
|------|-------|----------|--------|
| Executive | sarah.executive@aimrehab.ca | Demo2026!Executive | Full system access |
| Clinic Manager | michael.manager@aimrehab.ca | Demo2026!Manager | Calgary South clinic |
| Clinician | jennifer.clinician@aimrehab.ca | Demo2026!Clinician | Edmonton Central |
| Admin | david.admin@aimrehab.ca | Demo2026!Admin | Full system access |
| Contractor | amanda.contractor@aimrehab.ca | Demo2026!Contractor | Calgary South (limited) |

## Security Note

**IMPORTANT**: These are demo credentials for testing purposes only. For production:
- Use strong, unique passwords
- Enable Multi-Factor Authentication (MFA)
- Implement password rotation policies
- Use role-based access control properly
- Never commit credentials to version control
