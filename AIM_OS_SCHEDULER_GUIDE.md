# AIM OS Scheduler - Implementation Guide

## Overview

The AIM OS Scheduler is a **read-only**, **AI-powered** scheduling intelligence layer that mirrors Practice Perfect appointments while adding predictive insights.

**Core Principle:** "Looks familiar. Acts smarter. Never breaks Practice Perfect."

## Access

1. Navigate to **AIM OS** from the main navigation
2. Click the **Scheduler** module tile
3. Or navigate directly to the scheduler view

## Features Implemented

### Layout & UI

**Top Navigation Bar** (Dark Slate #0F172A)
- AIM OS branding
- Clinic selector dropdown
- Date picker with prev/next navigation
- View toggle (Day | Week)

**Filter Bar**
- Provider filter
- Status filter
- Toggle for AI overlays

**Three-Column Layout**

1. **Time Rail (Left)**
   - Fixed 15-minute increments
   - 8:00 AM to 7:00 PM
   - Sticky on scroll

2. **Provider Grid (Center)**
   - One column per provider
   - Provider header with name, role, utilization indicator
   - Appointment blocks sized by duration
   - Color-coded by status
   - AI risk badges (when enabled)

3. **Intelligence Panel (Right)**
   - Real-time AI insights
   - No-show risk warnings
   - Overbooking alerts
   - Capacity gap detection
   - Confidence scores
   - Suggested actions

### Appointment Blocks

**Visual Design**
- Background color matches status
- Patient name (Last, First)
- Time range
- Status icon
- Appointment type
- AI risk indicator (if applicable)

**Status Icons**
- ⏳ Scheduled
- ✓ Confirmed
- 🚶 Checked In
- 🔄 In Progress
- ✅ Completed
- ❌ Cancelled
- 🚫 No Show

**Interactions**
- Click to open detail drawer
- Hover for tooltip
- No drag-and-drop (Phase 1)
- No inline editing (Phase 1)

### Appointment Detail Drawer

Opens on click, displays:
- Patient information (de-identified if needed)
- Appointment date/time
- Provider details
- Status
- AI insights (no-show risk, patterns)
- **"Open in Practice Perfect"** button
- Read-only notice

### AI Intelligence Panel

**Insight Types**
1. **No-Show Risk** 🔶
   - Triggered when risk > 70%
   - Shows confidence percentage
   - Suggests reminder or standby fill

2. **Overbooking Risk** 🔴
   - Detects >4 appointments in same hour
   - Highlights capacity concern
   - Suggests review

3. **Capacity Gaps** 🔵
   - Identifies underutilized slots
   - Opportunities for waitlist fills

4. **Underutilization** 🟣
   - Flags low-density periods
   - Optimization suggestions

## Data Architecture

### Database Tables Used

**patient_appointments**
- Source of truth for all appointments
- Contains: patient_id, provider_id, clinic_id, date, times, status
- Indexed on provider, date, clinic

**user_profiles**
- Provider information
- Role, name, active status

**clinician_schedules**
- Provider blocks (breaks, meetings, etc.)
- Schedule type, times, notes

### Data Flow

1. **Scheduler Service** (`schedulerService.ts`)
   - Fetches appointments for selected clinic/date
   - Retrieves provider roster
   - Generates AI insights
   - Calculates utilization metrics

2. **Scheduler View** (`SchedulerView.tsx`)
   - Renders grid layout
   - Positions appointment blocks
   - Displays intelligence panel
   - Manages drawer state

3. **Read-Only Enforcement**
   - No POST/PUT/DELETE operations
   - All editing redirects to Practice Perfect
   - Feature flag: `aim_scheduler_enabled`

## Technical Specifications

### Component Structure

```
SchedulerView.tsx (Main Component)
├── Top Nav Bar (Clinic, Date, View Toggle)
├── Filter Bar (Providers, Statuses, AI Toggle)
├── Main Grid Container
│   ├── Time Rail (Sticky Left)
│   ├── Provider Columns (Scrollable Center)
│   │   ├── Provider Header
│   │   └── Appointment Blocks
│   └── Intelligence Panel (Fixed Right)
└── Appointment Detail Drawer (Conditional)
```

### Appointment Block Positioning

```typescript
// Position calculation (based on time)
const startMinutes = timeToMinutes(startTime);
const endMinutes = timeToMinutes(endTime);
const dayStart = 8 * 60; // 8:00 AM
const top = ((startMinutes - dayStart) / 15) * 24; // 24px per 15-min slot
const height = ((endMinutes - startMinutes) / 15) * 24;
```

### Color Coding

**Status Colors**
- Scheduled: #DBEAFE (light blue)
- Confirmed: #93C5FD (blue)
- Checked In: #FDE68A (yellow)
- In Progress: #FCD34D (amber)
- Completed: #86EFAC (green)
- Cancelled: #FCA5A5 (red)
- No Show: #EF4444 (dark red)

**AI Risk Border**
- High risk (>70%): #F59E0B (orange) 2px border

## Usage Workflow

### Day-to-Day Use

1. **Morning Check**
   - Open scheduler view
   - Review today's schedule
   - Check intelligence panel for risks
   - Address high no-show risks

2. **During Day**
   - Monitor appointment status changes
   - Track capacity utilization
   - Identify fill opportunities

3. **Planning**
   - Review upcoming days
   - Assess provider utilization
   - Optimize schedule balance

### Responding to AI Insights

**High No-Show Risk**
1. Review patient history in drawer
2. Send appointment reminder
3. Prepare standby patient
4. Mark in Practice Perfect

**Overbooking Alert**
1. Review provider capacity
2. Check appointment durations
3. Consider rescheduling in Practice Perfect

**Capacity Gap**
1. Check waitlist
2. Identify suitable patients
3. Schedule in Practice Perfect

## Integration with Practice Perfect

**Read-Only Mirror**
- AIM OS displays Practice Perfect data
- No write operations to scheduler
- Refresh every 5-10 minutes

**Deep Linking**
- "Open in Practice Perfect" button
- Preserves appointment context
- Seamless transition

**System of Record**
- Practice Perfect = source of truth
- All scheduling actions happen in PP
- AIM OS = intelligence layer only

## Phase Roadmap

### Phase 1 (Current)
- Read-only mirror
- AI insights display
- Provider day view
- Intelligence panel
- Click-to-view drawer

### Phase 2 (Future)
- AI suggestions with approval flow
- Week view by provider
- Room/resource view
- Automated reminders

### Phase 3 (Future)
- Limited write-back (with governance)
- Predictive scheduling
- Capacity optimization
- Waitlist management

## Best Practices

1. **Use as Decision Support**
   - Review AI insights daily
   - Validate with clinical judgment
   - Act in Practice Perfect

2. **Trust the Intelligence**
   - Confidence scores are data-driven
   - Patterns emerge over time
   - Insights improve with use

3. **Maintain Practice Perfect Workflow**
   - Continue all scheduling in PP
   - AIM OS supplements, doesn't replace
   - No training shock for staff

4. **Monitor Utilization**
   - Track provider efficiency
   - Balance workload
   - Optimize capacity

## Troubleshooting

**No Appointments Showing**
- Check selected clinic
- Verify date range
- Confirm provider assignment

**AI Insights Not Appearing**
- Toggle "Show AI Overlays" on
- Check appointment volume
- Verify risk thresholds

**Slow Performance**
- Large provider roster may impact load
- Consider clinic filtering
- Check network connection

## Security & Privacy

**Patient Privacy**
- Patient names de-identified option
- RLS policies enforced
- Role-based access control

**Data Access**
- Only assigned clinic data visible
- Provider filtering by role
- Audit trail maintained

## Support

For technical issues or feature requests:
- Check existing appointment data in database
- Verify provider assignments
- Review RLS policies
- Contact system administrator

---

**Remember:** AIM OS Scheduler is read-only. All scheduling changes must be made in Practice Perfect.
