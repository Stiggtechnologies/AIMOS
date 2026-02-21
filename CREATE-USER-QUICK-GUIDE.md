# Quick Guide: Create Your First AIMOS User

## Problem
Cannot log into AIMOS - no user accounts exist in your Supabase project yet.

## Solution (5 minutes)

### Step 1: Create Auth User (2 min)

1. Open: https://supabase.com/dashboard/project/optlghedswctsklcxlkn/auth/users
2. Click **"Add User"** button (top right)
3. Enter:
   - **Email:** `orville@aimrehab.ca` (or any email you want)
   - **Password:** Choose a password (e.g., `Test2026!`)
   - ✓ Check **"Auto Confirm User"**
4. Click **"Create User"**
5. **COPY THE UUID** shown in the user list (looks like: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)

### Step 2: Create User Profile (2 min)

1. Open: https://supabase.com/dashboard/project/optlghedswctsklcxlkn/editor
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New Query"**
4. Copy this SQL and **REPLACE `YOUR_UUID_HERE`** with the UUID from Step 1:

```sql
DO $$
DECLARE
  user_id UUID := 'YOUR_UUID_HERE'; -- ← PASTE YOUR UUID HERE
  clinic_id UUID;
BEGIN
  -- Get first available clinic
  SELECT id INTO clinic_id FROM clinics LIMIT 1;

  -- Create user profile
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
    user_id,
    'orville@aimrehab.ca',
    'Orville',
    'Davis',
    'executive',
    clinic_id,
    '780-215-2887',
    true
  );

  RAISE NOTICE 'User profile created successfully!';
END $$;
```

5. Click **"Run"** (or press Cmd+Enter)
6. Should see: "User profile created successfully!"

### Step 3: Test Login (1 min)

1. Open: https://aimos-ebon.vercel.app
2. Login with:
   - **Email:** `orville@aimrehab.ca`
   - **Password:** (whatever you chose in Step 1)
3. You should see the AIMOS dashboard!

---

## Alternative: Use Demo Users

If you want the 5 demo users from the guide:

**Quick credentials (if created):**
- Executive: `sarah.executive@aimrehab.ca` / `Demo2026!Executive`
- Manager: `michael.manager@aimrehab.ca` / `Demo2026!Manager`
- Admin: `david.admin@aimrehab.ca` / `Demo2026!Admin`

But these need to be created first (same 2-step process above, repeated 5 times).

---

## Troubleshooting

**"Invalid login credentials"**
→ User profile doesn't exist. Run Step 2 again.

**"Email not confirmed"**
→ Go back to Auth Users, find user, click "..." menu → "Send confirmation email" OR make sure you checked "Auto Confirm User"

**"User not found"**
→ Go to Auth Users and create the user first (Step 1)

**SQL Error**
→ Make sure you replaced `YOUR_UUID_HERE` with actual UUID from Step 1

---

**Need help?** Let me know which step failed.
