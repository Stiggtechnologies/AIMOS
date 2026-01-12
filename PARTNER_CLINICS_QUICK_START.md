# Partner Clinics Module - Quick Start

## 📍 Where to Find It

### Navigation Location
In the **left sidebar navigation**, look for:

🤝 **"Partner Clinics"**

**Position**: Between "Clinic Launches" and "Academy"

```
🚀 Clinic Launches
🤝 Partner Clinics  ← CLICK HERE
📖 Academy
```

---

## What You'll See

### Partner Clinics List View

When you click on "Partner Clinics", you'll see:

#### **Top Stats Cards**
- Total Partners
- Active
- Flagship Locations
- Total Members (across all partners)

#### **Flagship Locations Section** (Yellow highlight)
- **Edmonton Pickleball Center (EPC)** - First flagship
- Marked with ⭐ and "Template" badge
- Shows: 5,000 members, 5% revenue share, 400 sq ft

#### **Active Partners Section**
- All currently active partner clinics

#### **Pipeline Section**
- Prospects and clinics in negotiation

---

## EPC Flagship Clinic

### Quick Facts
- **Partner**: Edmonton Pickleball Center
- **Members**: 5,000
- **Location**: 11420 170 St NW, Edmonton, AB
- **Type**: Sports Facility (Embedded)
- **Revenue Share**: 5% up to $40K annually
- **Space**: 400 sq ft
- **Status**: Active, Flagship, Replication Template

### Clicking on EPC Opens Partner Dashboard

You'll see:
1. **Header** - Partner name, member base, partnership start date
2. **Privacy Notice** - PHI protection reminder
3. **Date Range Selector** - Last 30 days, 90 days, YTD
4. **Key Stats Cards**:
   - Members Treated
   - Total Visits
   - Avg. Satisfaction (out of 5.0)
   - Return-to-Play Completions

5. **Utilization Metrics**:
   - Avg. visits per episode (progress bar)
   - Successful outcomes percentage (progress bar)
   - Program participation count

6. **Revenue Share Card** (if enabled):
   - Current period revenue share amount
   - Partner-sourced revenue and patient count
   - YTD share
   - Cap progress bar
   - Cap exhausted alert (if applicable)

7. **Metrics Legend**:
   - Green checkmarks for available metrics
   - Red X for blocked PHI data

---

## Key Features

### 1. PHI Protection
All partner dashboard data is **aggregated and de-identified**. Partners can NEVER see:
- ❌ Patient names
- ❌ Diagnoses
- ❌ Clinical notes
- ❌ Billing details
- ❌ Any PHI

### 2. Revenue Share Tracking
- Automatic calculation
- 5% on EPC-sourced patients only
- $40,000 annual cap
- Real-time cap tracking
- YTD accumulation

### 3. Conversion Funnel
Tracks EPC members through:
1. First contact
2. Assessment booked
3. First visit
4. Episode started
5. Program enrolled

### 4. Service Mix
Pre-configured for EPC:
- Sports injury physiotherapy
- Return-to-play programs
- Injury prevention
- Performance rehab
- Seniors mobility (65+)

### 5. Replication Template
EPC configuration can be **cloned for new partners** with one function call.

---

## Common Tasks

### View EPC Dashboard
1. Click 🤝 Partner Clinics in sidebar
2. Click on "Edmonton Pickleball Center" in Flagship section
3. View aggregated metrics

### Change Date Range
1. Open EPC dashboard
2. Click date range buttons: "Last 30 Days", "Last 90 Days", or "Year to Date"
3. Metrics update automatically

### Check Revenue Share
1. Open EPC dashboard
2. Scroll to "Revenue Share" card
3. See current period amount, YTD total, and cap progress

### Return to Partner List
1. From any partner dashboard
2. Click "← Back to Partner Clinics" at top

---

## Access Control

### Who Can View Partner Clinics?
- ✅ Executives (full access)
- ✅ Admins (full access)
- ✅ Clinic Managers (view only)
- ✅ Partner Users (partner_read_only - see own dashboard only)

### Who Can Manage Revenue Share?
- ✅ Executives
- ✅ Admins
- ❌ Clinic Managers (view only)
- ❌ Partners (cannot see financial calculations)

---

## Empty State

If you see "No partner clinics found", it means:
- EPC has not been seeded yet, OR
- Your user role doesn't have access

**Expected**: EPC should be visible immediately after deployment

---

## Troubleshooting

### "I don't see the menu item"
- Refresh browser (Ctrl+R or Cmd+R)
- Check you're logged in
- Verify between "Clinic Launches" and "Academy"

### "Partner list is empty"
- Check database migrations were applied
- Verify EPC seed migration ran successfully
- Check user permissions

### "Dashboard shows no data"
This is expected for a new clinic! The dashboard will populate as:
- Patients are treated
- Visits are recorded
- Programs are enrolled
- Revenue is generated

---

## Technical Details

### Database Tables
- `partner_clinics` - Partner configuration
- `partner_revenue_share` - Revenue tracking
- `partner_conversions` - Patient conversion tracking
- `partner_dashboard_metrics` - Aggregated metrics

### Service Layer
- `partnerService.ts` - All partner operations

### UI Components
- `PartnerClinicsView.tsx` - Main list view
- `PartnerDashboard.tsx` - Individual partner dashboard

---

## Next Steps After Viewing EPC

1. **Review Configuration** - See all EPC settings in partner record
2. **Use as Template** - Clone EPC for new sports facilities
3. **Launch Clinic** - Execute launch via standard AIM OS launch module
4. **Monitor Metrics** - Track conversion and revenue share automatically

---

## Related Documentation

- `EPC_FLAGSHIP_CLINIC_GUIDE.md` - Full EPC configuration details
- `NEW_CLINIC_LAUNCH_MODULE.md` - Launch module documentation
- `LAUNCH_MODULE_QUICK_START.md` - Launch module quick start

---

**Quick Access**:
Main Menu → 🤝 Partner Clinics → Click EPC → View Dashboard
