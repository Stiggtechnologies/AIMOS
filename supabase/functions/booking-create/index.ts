import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// booking-create
// Validates a hold, writes intake, upserts patient, creates patient_appointments + CRM, sends confirmation SMS.
//
// Env:
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY
// - SITE_BASE_URL (e.g. https://aimphysiotherapy.ca)
// - TWILIO_* (optional if you send SMS here; otherwise call comm-send-sms)

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function randomToken(bytes = 24) {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return Array.from(buf).map((b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const siteBaseUrl = Deno.env.get("SITE_BASE_URL") || "https://aimphysiotherapy.ca";
  if (!supabaseUrl || !serviceKey) return json({ ok: false, error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" }, 500);

  const body = await req.json().catch(() => ({}));
  const { clinicId, bookingServiceId, holdId, intake } = body ?? {};
  if (!clinicId || !bookingServiceId || !holdId || !intake?.firstName || !intake?.lastName || !intake?.phone) {
    return json({ ok: false, error: "clinicId, bookingServiceId, holdId, intake(firstName,lastName,phone) required" }, 400);
  }

  const headers = {
    "Authorization": `Bearer ${serviceKey}`,
    "apikey": serviceKey,
    "Content-Type": "application/json",
  };

  // 1) Load hold and validate
  const holdRes = await fetch(`${supabaseUrl}/rest/v1/booking_slot_holds?select=*&id=eq.${encodeURIComponent(holdId)}&limit=1`, { headers });
  const holdRows = await holdRes.json().catch(() => []);
  const hold = holdRows?.[0];
  if (!hold) return json({ ok: false, error: "HOLD_NOT_FOUND" }, 404);

  const now = new Date();
  if (hold.status !== 'held') return json({ ok: false, error: "HOLD_NOT_ACTIVE" }, 409);
  if (hold.hold_expires_at && new Date(hold.hold_expires_at) <= now) {
    return json({ ok: false, error: "HOLD_EXPIRED" }, 409);
  }

  // 2) Persist intake submission
  const intakeInsertRes = await fetch(`${supabaseUrl}/rest/v1/booking_intake_submissions`, {
    method: 'POST',
    headers: { ...headers, "Prefer": "return=representation" },
    body: JSON.stringify({
      clinic_id: clinicId,
      booking_service_id: bookingServiceId,
      first_name: intake.firstName,
      last_name: intake.lastName,
      phone: intake.phone,
      email: intake.email ?? null,
      chief_complaint: intake.chiefComplaint ?? null,
      consents: intake.consents ?? {},
      utm: intake.utm ?? {},
      raw: intake,
    }),
  });
  const intakeInserted = await intakeInsertRes.json().catch(() => []);
  if (!intakeInsertRes.ok) return json({ ok: false, error: "INTAKE_INSERT_FAILED", details: intakeInserted }, 500);

  // 3) Upsert patient (MVP: create new patient always; Phase 2: match by phone/email)
  const patientRes = await fetch(`${supabaseUrl}/rest/v1/patients`, {
    method: 'POST',
    headers: { ...headers, "Prefer": "return=representation" },
    body: JSON.stringify({
      clinic_id: clinicId,
      first_name: intake.firstName,
      last_name: intake.lastName,
      phone: intake.phone,
      email: intake.email ?? null,
      is_active: true,
    }),
  });
  const patientRows = await patientRes.json().catch(() => []);
  if (!patientRes.ok) return json({ ok: false, error: "PATIENT_CREATE_FAILED", details: patientRows }, 500);
  const patientId = patientRows?.[0]?.id;

  // 4) Create patient appointment
  // NOTE: Requires patient_appointments table to exist.
  const slotStart = new Date(hold.slot_start);
  const slotEnd = new Date(hold.slot_end);
  const apptDate = slotStart.toISOString().slice(0, 10);
  const startTime = slotStart.toISOString().slice(11, 19); // HH:MM:SS (UTC)
  const endTime = slotEnd.toISOString().slice(11, 19);

  // Load booking_service for appointment_type + CRM service line attribution
  const bsRes = await fetch(`${supabaseUrl}/rest/v1/booking_services?select=appointment_type,duration_minutes,crm_service_line_id&id=eq.${encodeURIComponent(bookingServiceId)}&limit=1`, { headers });
  const bsRows = await bsRes.json().catch(() => []);
  const appointmentType = bsRows?.[0]?.appointment_type || 'Online Booking';
  const crmServiceLineId = bsRows?.[0]?.crm_service_line_id ?? null;

  const apptInsertRes = await fetch(`${supabaseUrl}/rest/v1/patient_appointments`, {
    method: 'POST',
    headers: { ...headers, "Prefer": "return=representation" },
    body: JSON.stringify({
      patient_id: patientId,
      clinic_id: clinicId,
      provider_id: hold.provider_id ?? null,
      appointment_type: appointmentType,
      appointment_date: apptDate,
      start_time: startTime,
      end_time: endTime,
      status: 'scheduled',
      chief_complaint: intake.chiefComplaint ?? null,
    }),
  });
  const apptRows = await apptInsertRes.json().catch(() => []);
  if (!apptInsertRes.ok) return json({ ok: false, error: "APPOINTMENT_CREATE_FAILED", details: apptRows }, 500);
  const appointmentId = apptRows?.[0]?.id;

  // 5) CRM inserts (best-effort)
  let crmLeadId: string | undefined;
  let crmBookingId: string | undefined;
  try {
    const leadRes = await fetch(`${supabaseUrl}/rest/v1/crm_leads`, {
      method: 'POST',
      headers: { ...headers, "Prefer": "return=representation" },
      body: JSON.stringify({
        first_name: intake.firstName,
        last_name: intake.lastName,
        phone: intake.phone,
        email: intake.email ?? null,
        clinic_id: clinicId,
        landing_page_url: intake?.utm?.landing_page_url ?? null,
        utm_source: intake?.utm?.utm_source ?? null,
        utm_medium: intake?.utm?.utm_medium ?? null,
        utm_campaign: intake?.utm?.utm_campaign ?? null,
        status: 'new',
      }),
    });
    const leadRows = await leadRes.json().catch(() => []);
    crmLeadId = leadRows?.[0]?.id;

    if (crmLeadId) {
      const bookingRes = await fetch(`${supabaseUrl}/rest/v1/crm_bookings`, {
        method: 'POST',
        headers: { ...headers, "Prefer": "return=representation" },
        body: JSON.stringify({
          lead_id: crmLeadId,
          clinic_id: clinicId,
          service_line_id: crmServiceLineId,
          scheduled_at: hold.slot_start,
          duration_minutes: bsRows?.[0]?.duration_minutes ?? 60,
          status: 'scheduled',
          confirmation_sent: false,
          reminder_sent: false,
        }),
      });
      const bookingRows = await bookingRes.json().catch(() => []);
      crmBookingId = bookingRows?.[0]?.id;
    }
  } catch (_e) {
    // ignore
  }

  // 6) Consume hold
  await fetch(`${supabaseUrl}/rest/v1/booking_slot_holds?id=eq.${encodeURIComponent(holdId)}`, {
    method: 'PATCH',
    headers: { ...headers, "Prefer": "return=minimal" },
    body: JSON.stringify({ status: 'consumed', updated_at: new Date().toISOString() }),
  });

  // 7) Create cancel token
  const cancelToken = randomToken(24);
  await fetch(`${supabaseUrl}/rest/v1/booking_tokens`, {
    method: 'POST',
    headers: { ...headers, "Prefer": "return=minimal" },
    body: JSON.stringify({
      appointment_id: appointmentId,
      crm_booking_id: crmBookingId ?? null,
      token: cancelToken,
      token_type: 'cancel',
      expires_at: null,
      metadata: { clinicId },
    }),
  });

  const cancelUrl = `${siteBaseUrl}/book/cancel?token=${cancelToken}`;

  // 8) TODO: send SMS confirmation (recommended: call comm-send-sms)

  return json({ ok: true, appointmentId, crmLeadId, crmBookingId, cancelUrl });
});
