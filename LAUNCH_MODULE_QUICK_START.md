# 🚀 Clinic Launch Module - Quick Start

## Where to Find It

### Navigation Location
Open the AIM OS application and look in the **left sidebar navigation**.

The **"Clinic Launches"** item appears with a 🚀 Rocket icon.

**Position**: Between "People" and "Academy"

```
📊 Dashboard
🧠 AI Assistant
🏢 Clinics
👥 People
🚀 Clinic Launches  ← CLICK HERE
📖 Academy
🛡️  Compliance
📢 Announcements
⚙️  Operations
💻 AIM OS
⚡ Growth OS
```

## Quick Test

1. **Login** to AIM OS
2. **Look in the left sidebar** for the Rocket icon 🚀
3. **Click "Clinic Launches"**
4. You should see the Launch Management Dashboard

## What You'll See

When you click on "Clinic Launches", you'll see:

- **4 stat cards** at the top:
  - Active Launches
  - At Risk
  - Completed (YTD)
  - My Tasks

- **AI Insights section** (if there are active launches)

- **Launch list** with filtering options:
  - ALL
  - MY
  - PLANNING
  - IN_PROGRESS
  - AT_RISK

- **My Tasks section** at the bottom (if you have assigned tasks)

## Creating Your First Launch

Currently the dashboard shows an empty state since no launches exist yet.

To create a launch, you would need to:
1. Have executive or admin role
2. Use the database function or API to create a launch

**Example SQL**:
```sql
SELECT create_launch_from_template(
  p_clinic_id := 'your-clinic-id',
  p_launch_name := 'Calgary North Launch',
  p_launch_code := 'CGN-2024-Q2',
  p_launch_owner_id := 'your-user-id',
  p_target_open_date := '2024-06-15',
  p_approved_budget := 250000
);
```

## Troubleshooting

### "I don't see the menu item"

**Check 1**: Refresh your browser (Ctrl+R or Cmd+R)

**Check 2**: Make sure you're logged in and can see other menu items

**Check 3**: Check browser console (F12) for any errors

**Check 4**: Verify the dev server is running

### "I see the menu but clicking it shows nothing"

This is expected! The dashboard will show an empty state with:
- "No launches found" message
- A rocket icon in the center

This is correct behavior when no launches exist yet.

## Access Control

**Who can access this module?**
- ✅ Executives (full access)
- ✅ Admins (full access)
- ✅ Clinic Managers (view access for their clinics)
- ✅ Launch Owners (full access to assigned launches)
- ✅ Task Assignees (access to assigned tasks)

## Need Help?

See the full documentation in `NEW_CLINIC_LAUNCH_MODULE.md`
