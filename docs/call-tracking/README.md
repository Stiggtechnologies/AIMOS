# Call Tracking (Business Hours) — Docs

- `01_TECHNICAL_ARCHITECTURE.md` — system design (Twilio pool, DNI, schema, attribution)
- `02_IMPLEMENTATION_GUIDE.md` — step-by-step setup (Twilio, Supabase, website, staff training)
- `03_CODE_TEMPLATES.md` — reusable snippets (DNI JS, edge patterns, UI patterns, dashboard stubs)
- `04_ROI_ANALYSIS.md` — cost comparison + expected gains + offline conversions

Related (existing):
- `CALL_TRACKING_IMPLEMENTATION.md` (root) — high-level summary
- Migration: `supabase/migrations/20260223150000_create_call_tracking_module.sql`
- Edge functions:
  - `supabase/functions/call-tracking-number/index.ts`
  - `supabase/functions/call-tracking-voice-webhook/index.ts`
- UI:
  - `src/components/call-tracking/CallTrackingView.tsx`
