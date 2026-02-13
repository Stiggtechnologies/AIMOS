# Twilio Webhook Configuration for AIMOS After-Hours

**Twilio Phone Number:** PNab0e0b04c54beb6b9d513b5960e43d19  
**Configuration URL:** https://console.twilio.com/us1/develop/phone-numbers/manage/incoming/PNab0e0b04c54beb6b9d513b5960e43d19/configure

---

## Webhook URLs

**Your Supabase Project:** `tfnoogotbyshsznpjspk`

### Main Webhook URLs:
```
https://tfnoogotbyshsznpjspk.supabase.co/functions/v1/incoming-call
https://tfnoogotbyshsznpjspk.supabase.co/functions/v1/process-voice-intake
https://tfnoogotbyshsznpjspk.supabase.co/functions/v1/voice-recording-complete
```

---

## Configuration Steps

### Section 1: Voice Configuration

**"A CALL COMES IN"**
- **Configure with:** Webhooks, TwiML Bins, Functions, Studio, or Proxy
- **Selection:** Webhook
- **URL:** `https://tfnoogotbyshsznpjspk.supabase.co/functions/v1/incoming-call`
- **HTTP:** POST
- **Description:** (Optional) "AIMOS After-Hours Voice Intake"

### Section 2: Status Callbacks (Optional but Recommended)

Scroll down to **"Call Status Changes"**

**Status Callback URL:**
- **URL:** `https://tfnoogotbyshsznpjspk.supabase.co/functions/v1/voice-status-callback`
- **HTTP:** POST

**Events to track:** (Check all that apply)
- [x] Initiated
- [x] Ringing
- [x] Answered
- [x] Completed

---

## After Saving

### Test the Integration

1. **Save the configuration** in Twilio Console
2. **Call the number:** (You can find it in the Twilio console)
3. **Expected flow:**
   - Professional greeting plays
   - Prompted to describe injury/concern
   - Record up to 2 minutes
   - Thank you message
   - Call ends

4. **Verify in AIMOS:**
   - Log into AIMOS
   - Click "After Hours" in sidebar
   - Your test call should appear within 30 seconds
   - AI transcription may take 2-3 minutes

5. **Check components:**
   - ✅ Call appears in list
   - ✅ Audio recording playable
   - ✅ Transcription shows (after 2-3 min)
   - ✅ AI urgency detected
   - ✅ CRM lead created (check CRM → Leads)

---

## Troubleshooting

### If call doesn't appear in AIMOS:

**1. Check Supabase Function Logs:**
```bash
supabase functions logs incoming-call --limit 20
```

**2. Verify Functions are Deployed:**
```bash
supabase functions list
```

Should show:
- incoming-call
- process-voice-intake
- voice-recording-complete

**3. Check Twilio Error Logs:**
- Twilio Console → Monitor → Logs → Errors
- Look for 404 or 500 errors

**4. Verify Environment Variables:**
```bash
supabase secrets list
```

Should include:
- TWILIO_ACCOUNT_SID
- TWILIO_AUTH_TOKEN
- TWILIO_PHONE_NUMBER
- OPENAI_API_KEY

---

## Voice Greeting (What Caller Hears)

```
"Hello, you've reached Alberta Injury Management. 
Our clinic is currently closed, but we'd like to help capture 
your information so we can get back to you first thing tomorrow morning.

Please describe your injury or concern, and tell us how we can help you. 
You'll have up to two minutes. Press any key when you're done, 
or just wait for the beep."

[BEEP - Recording starts]

[After recording or 2 minutes]

"Thank you for calling Alberta Injury Management. We've recorded 
your information and will contact you tomorrow during business hours. 
Have a great evening."

[Call ends]
```

---

## Advanced Configuration (Optional)

### Call Forwarding (For Emergencies)

If you want emergency calls to forward to a live person:

1. Modify the edge function to detect keywords like "emergency", "chest pain", "can't breathe"
2. If detected, use Twilio `<Dial>` to forward to on-call staff
3. Otherwise, proceed with recording

### Business Hours Detection

Currently handles ALL calls. To restrict to after-hours only:

1. Add business hours check in `incoming-call` function
2. If within hours, forward to main clinic line
3. If after hours, proceed with voice intake

### SMS Follow-up

After recording, send SMS confirmation:

```typescript
// In voice-recording-complete function
await fetch('https://api.twilio.com/2010-04-01/Accounts/[SID]/Messages.json', {
  method: 'POST',
  headers: {
    'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`)
  },
  body: new URLSearchParams({
    From: twilioNumber,
    To: callerNumber,
    Body: 'Thank you for calling AIM. We received your message and will call you back tomorrow morning. If urgent, call 911.'
  })
});
```

---

## Production Checklist

Before going live:

- [ ] All 3 functions deployed to Supabase
- [ ] Environment variables set (Twilio + OpenAI)
- [ ] Twilio webhook configured (this page)
- [ ] Test call successful
- [ ] Call appears in AIMOS within 30 seconds
- [ ] Audio recording playable
- [ ] Transcription works (2-3 min delay OK)
- [ ] CRM lead auto-created
- [ ] Staff trained on follow-up workflow

---

## Quick Reference

| Component | URL |
|-----------|-----|
| **Incoming Call Webhook** | https://tfnoogotbyshsznpjspk.supabase.co/functions/v1/incoming-call |
| **Recording Callback** | https://tfnoogotbyshsznpjspk.supabase.co/functions/v1/voice-recording-complete |
| **Transcription Callback** | https://tfnoogotbyshsznpjspk.supabase.co/functions/v1/process-voice-intake |
| **AIMOS After-Hours View** | https://[your-aimos-domain]/after-hours |
| **Twilio Console** | https://console.twilio.com/us1/develop/phone-numbers/manage/incoming/PNab0e0b04c54beb6b9d513b5960e43d19/configure |

---

## Current Status

**Before configuration:**
- ✅ Database schema deployed
- ✅ Edge functions deployed
- ✅ Frontend components deployed
- ⏳ **Twilio webhook not yet configured** ← YOU ARE HERE

**After configuration:**
- ✅ Live after-hours calls → AIMOS
- ✅ Staff see calls in dashboard
- ✅ Auto-lead creation working
- ✅ Follow-up workflow active

---

**Next step:** Configure the webhook in the Twilio console using the URL above, then make a test call!
