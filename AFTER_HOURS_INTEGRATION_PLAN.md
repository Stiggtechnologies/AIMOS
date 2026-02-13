# After-Hours Module Integration into AIMOS

**Status:** Ready to implement  
**Target:** Integrate standalone After-Hours app into AIMOS as native module  
**Timeline:** 2-3 hours implementation  
**Created:** 2026-02-12

---

## Current State

**Standalone Deployment:**
- URL: `aim-after-hours-6ewm67jfw-stiggtechnologies-projects.vercel.app`
- Separate Vercel deployment
- Located in: `/Users/orvilledavis/.openclaw/workspace/AIMWebsite2.0/`
- Features:
  - Twilio voice intake
  - AI-powered transcription
  - Lead capture
  - Staff notifications
  - Separate database table

**Problems with Standalone:**
- ❌ Separate login/authentication
- ❌ Different UI/UX from AIMOS
- ❌ Manual data synchronization
- ❌ Staff must check two systems
- ❌ No integration with CRM workflows
- ❌ Separate deployment pipeline

---

## Target State

**Native AIMOS Module:**
- ✅ Single authentication (AIMOS login)
- ✅ Consistent UI/UX with AIMOS design system
- ✅ Automatic CRM lead creation
- ✅ Integrated with Communications module
- ✅ Unified staff workflow
- ✅ Single deployment
- ✅ Shared analytics dashboard

---

## Integration Architecture

```
After-Hours Call (Twilio)
    ↓
Supabase Edge Function: /api/voice/incoming
    ↓
Parse & Transcribe (OpenAI Whisper)
    ↓
Store in AIMOS DB (after_hours_calls table)
    ↓
Create CRM Lead (crm_leads table)
    ↓
Create Conversation (comm_conversations table)
    ↓
Notify Staff (AIMOS notifications system)
    ↓
Display in AIMOS UI:
    - CRM → Live Lead Queue
    - Communications → After Hours tab
    - Dashboard → After Hours widget
```

---

## Database Schema Changes

### New Table: `after_hours_calls`
```sql
CREATE TABLE after_hours_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Call metadata
  twilio_call_sid TEXT UNIQUE NOT NULL,
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  call_started_at TIMESTAMPTZ NOT NULL,
  call_ended_at TIMESTAMPTZ,
  call_duration_seconds INTEGER,
  call_status TEXT,
  
  -- AI transcription & analysis
  recording_url TEXT,
  transcription TEXT,
  ai_summary TEXT,
  patient_name TEXT,
  injury_description TEXT,
  urgency_level TEXT CHECK (urgency_level IN ('low', 'medium', 'high', 'emergency')),
  callback_preferences JSONB,
  
  -- AIMOS integration
  lead_id UUID REFERENCES crm_leads(id),
  conversation_id UUID REFERENCES comm_conversations(id),
  assigned_to_user_id UUID REFERENCES user_profiles(id),
  follow_up_scheduled_at TIMESTAMPTZ,
  follow_up_completed_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_after_hours_calls_lead ON after_hours_calls(lead_id);
CREATE INDEX idx_after_hours_calls_conversation ON after_hours_calls(conversation_id);
CREATE INDEX idx_after_hours_calls_assigned ON after_hours_calls(assigned_to_user_id);
CREATE INDEX idx_after_hours_calls_created ON after_hours_calls(created_at DESC);
CREATE INDEX idx_after_hours_calls_status ON after_hours_calls(call_status);
```

### Integration Points

**1. CRM Leads**
- After-hours calls automatically create CRM leads
- Lead source: "After Hours Call"
- Priority: Based on AI urgency assessment
- Status: "new" → "contacted" → "booked"

**2. Communications Module**
- Each call creates a conversation in `comm_conversations`
- Channel: "voice"
- Messages stored in `comm_messages`
- Staff can reply via SMS or schedule callback

**3. Notifications**
- Real-time alerts when after-hours calls come in
- Assigned to on-call staff member
- Shows in AIMOS notification bell

---

## Components to Create

### 1. AfterHoursView Component
**Path:** `/Users/orvilledavis/.openclaw/workspace/AIMOS/src/components/after-hours/AfterHoursView.tsx`

**Features:**
- Call history list
- Urgency badges (color-coded)
- Quick actions (call back, schedule, mark done)
- Audio player for recordings
- AI summary display
- Lead conversion tracking

**UI Sections:**
- **Header:** Stats (total calls, pending follow-ups, conversion rate)
- **Filters:** Date range, urgency, status
- **Call List:** Table with key info + actions
- **Call Detail Modal:** Full transcription, AI analysis, actions

### 2. AfterHoursService
**Path:** `/Users/orvilledavis/.openclaw/workspace/AIMOS/src/services/afterHoursService.ts`

**Methods:**
```typescript
- getAfterHoursCalls(filters) → Call[]
- getCallById(id) → Call
- getStats(period) → AfterHoursStats
- assignCall(callId, userId) → void
- scheduleFollowUp(callId, datetime) → void
- completeFollowUp(callId) → void
- createLeadFromCall(callId) → Lead
- markUrgency(callId, level) → void
```

### 3. AfterHoursDashboardWidget
**Path:** `/Users/orvilledavis/.openclaw/workspace/AIMOS/src/components/after-hours/AfterHoursDashboardWidget.tsx`

**Display:**
- Recent calls (last 24h)
- Pending follow-ups count
- Conversion rate
- Quick action button

---

## Supabase Edge Functions

### Migrate from AIMWebsite2.0

**Source:** `/Users/orvilledavis/.openclaw/workspace/AIMWebsite2.0/app/api/voice/`

**Target:** `/Users/orvilledavis/.openclaw/workspace/AIMOS/supabase/functions/`

**Functions to migrate:**

1. **incoming-call** (replaces `/api/voice/incoming`)
   - Receives Twilio webhook
   - Returns TwiML for initial greeting
   - Creates call record

2. **process-voice-intake** (replaces `/api/voice/process-intake`)
   - Receives recording
   - Transcribes with OpenAI Whisper
   - Analyzes with GPT
   - Creates CRM lead
   - Creates communication conversation
   - Sends notifications

3. **voice-status-callback** (replaces status callback handler)
   - Updates call status
   - Calculates duration
   - Marks call complete

---

## App.tsx Integration

### Add to View Type
```typescript
type View = 'dashboard' | ... | 'after-hours';
```

### Add Menu Item
```typescript
{
  label: 'After Hours',
  icon: Moon,
  view: 'after-hours',
  badge: pendingAfterHoursCount,
  roles: ['executive', 'clinic_manager', 'admin']
}
```

### Add Route
```typescript
{currentView === 'after-hours' && <AfterHoursView />}
```

---

## CRM Integration

### Update CRMDashboard.tsx

Add "After Hours" tab to show leads from after-hours calls:

```typescript
<Tab label="After Hours" count={afterHoursLeadCount}>
  <AfterHoursLeadsList />
</Tab>
```

### Update Lead Sources

Add "After Hours Call" to `crm_lead_sources`:

```sql
INSERT INTO crm_lead_sources (slug, name, description, active)
VALUES (
  'after-hours-call',
  'After Hours Call',
  'Leads generated from after-hours phone calls',
  true
);
```

---

## Communications Integration

### Update CommunicationsView.tsx

Add filter for "Voice" channel:

```typescript
<ChannelFilter>
  <Option value="sms">SMS</Option>
  <Option value="voice">Voice</Option>
  <Option value="all">All</Option>
</ChannelFilter>
```

### Voice Conversations

- Show after-hours calls in conversation list
- Display call duration, recording player
- Enable SMS replies
- Schedule callback button

---

## Implementation Steps

### Phase 1: Database & API (1 hour)

1. **Create Migration**
   - Add `after_hours_calls` table
   - Add RLS policies
   - Add indexes
   - Update `crm_lead_sources`

2. **Migrate Edge Functions**
   - Copy voice webhook handlers from AIMWebsite2.0
   - Adapt to AIMOS database schema
   - Add AIMOS integration logic
   - Test with Twilio sandbox

3. **Create Service**
   - Build `afterHoursService.ts`
   - Implement all methods
   - Add TypeScript types

### Phase 2: UI Components (1.5 hours)

1. **Create AfterHoursView**
   - List view with filters
   - Call detail modal
   - Quick actions
   - Stats header

2. **Create Dashboard Widget**
   - Recent calls summary
   - Pending count badge
   - Quick access link

3. **Update CRM & Comm Modules**
   - Add after-hours tabs
   - Integrate lead conversion
   - Add voice conversation display

### Phase 3: Integration & Testing (30 minutes)

1. **App.tsx Updates**
   - Add routing
   - Add menu item
   - Add permissions

2. **Test End-to-End**
   - Make test call to Twilio number
   - Verify call appears in AIMOS
   - Verify lead created in CRM
   - Verify conversation created
   - Verify notification sent
   - Test follow-up workflow

3. **Deploy**
   - Push database migration
   - Deploy edge functions
   - Deploy AIMOS frontend
   - Update Twilio webhook URLs
   - Monitor first real call

---

## Configuration Changes

### Environment Variables (AIMOS)

Add to Supabase secrets:

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1780xxxxxxx
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Twilio Webhook URLs

Update Twilio console:

**Old (standalone):**
```
https://aim-after-hours-6ewm67jfw-stiggtechnologies-projects.vercel.app/api/voice/incoming
```

**New (AIMOS):**
```
https://[your-supabase-project].supabase.co/functions/v1/incoming-call
```

---

## Benefits of Integration

### For Staff
- ✅ Single login, single dashboard
- ✅ After-hours leads in same queue as Facebook/web leads
- ✅ Unified conversation history (SMS + Voice)
- ✅ One-click callback scheduling
- ✅ Better context (see all patient interactions)

### For Management
- ✅ Unified analytics (all lead sources together)
- ✅ Better ROI tracking (after-hours phone spend)
- ✅ Easier staffing decisions (see call volume trends)
- ✅ Single deployment pipeline

### For Patients
- ✅ Faster response (staff see calls immediately)
- ✅ Better continuity (all history in one place)
- ✅ SMS follow-up after call
- ✅ Seamless booking experience

---

## Migration Strategy

### Option A: Clean Cutover (Recommended)

1. Deploy AIMOS integration
2. Update Twilio webhooks → AIMOS
3. Test with a few calls
4. Deprecate standalone app
5. Keep standalone app as backup for 30 days

### Option B: Gradual Migration

1. Deploy AIMOS integration
2. Run both systems in parallel
3. Staff use AIMOS for new calls
4. Migrate historical data
5. Deprecate standalone after 2 weeks

**Recommendation:** Option A. Clean break. After Hours system is simple enough that parallel operation isn't needed.

---

## Rollback Plan

If integration has issues:

1. **Immediate (< 5 minutes):**
   - Revert Twilio webhook → standalone app
   - Standalone app continues working

2. **Short-term (< 1 hour):**
   - Debug AIMOS integration
   - Test with Twilio sandbox
   - Fix issues and re-deploy

3. **Long-term:**
   - Keep standalone app deployed for 30 days as backup
   - Can always revert if needed

---

## Success Metrics

After integration, track:

- ✅ **Response Time:** Average time from call → first follow-up
- ✅ **Conversion Rate:** After-hours calls → booked appointments
- ✅ **Staff Efficiency:** Time spent per after-hours lead
- ✅ **System Uptime:** Webhook success rate
- ✅ **User Adoption:** % of staff using AIMOS vs standalone

**Target:**
- Response time: < 2 hours (next business day)
- Conversion rate: > 40% (after-hours callers are high-intent)
- System uptime: > 99.5%

---

## Timeline

| Phase | Time | Status |
|-------|------|--------|
| Database migration | 30 min | ⏳ Ready |
| Edge functions migration | 1 hour | ⏳ Ready |
| Service creation | 30 min | ⏳ Ready |
| UI components | 1.5 hours | ⏳ Ready |
| Integration & routing | 30 min | ⏳ Ready |
| Testing | 30 min | ⏳ Ready |
| Deployment | 15 min | ⏳ Ready |
| **Total** | **~4 hours** | |

---

## Files to Create

### Database
- `supabase/migrations/20260212230500_create_after_hours_module.sql`

### Edge Functions
- `supabase/functions/incoming-call/index.ts`
- `supabase/functions/process-voice-intake/index.ts`
- `supabase/functions/voice-status-callback/index.ts`

### Services
- `src/services/afterHoursService.ts`
- `src/types/afterHours.ts`

### Components
- `src/components/after-hours/AfterHoursView.tsx`
- `src/components/after-hours/AfterHoursDashboardWidget.tsx`
- `src/components/after-hours/AfterHoursCallList.tsx`
- `src/components/after-hours/AfterHoursCallDetail.tsx`

### Documentation
- `AFTER_HOURS_MODULE.md` (user guide)

---

## Decision

**Integrate now** to unify AIM's operational systems.

**Why:**
- Reduces operational complexity
- Better staff experience
- Unified analytics
- Easier to maintain
- Scalable architecture

**Next Step:** Begin Phase 1 (Database & API migration)

Ready to proceed?
