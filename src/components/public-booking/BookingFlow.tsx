import React, { useEffect, useMemo, useState } from 'react';
import { AvailabilityService, BookableSlot } from '../../services/booking/AvailabilityService';
import { supabase } from '../../lib/supabase';

type Intake = {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  chiefComplaint?: string;
  consents: {
    sms: boolean;
    terms: boolean;
    privacy: boolean;
  };
  utm?: Record<string, string | undefined>;
};

type Step = 'clinic' | 'service' | 'slot' | 'details' | 'done';

export default function BookingFlow() {
  const api = useMemo(() => new AvailabilityService(), []);

  const [step, setStep] = useState<Step>('clinic');

  // MVP: hard-coded clinics (public clinics list is not exposed yet). Booking services ARE loaded from DB.
  const [clinicId, setClinicId] = useState<string>('');
  const [bookingServiceId, setBookingServiceId] = useState<string>('');

  const [bookingServices, setBookingServices] = useState<Array<{ id: string; public_name: string; duration_minutes: number }>>([]);
  const [servicesLoading, setServicesLoading] = useState(false);

  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slots, setSlots] = useState<BookableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<BookableSlot | null>(null);
  const [holdId, setHoldId] = useState<string | null>(null);

  const [intake, setIntake] = useState<Intake>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    chiefComplaint: '',
    consents: { sms: true, terms: false, privacy: false },
  });

  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{ appointmentId: string; cancelUrl?: string } | null>(null);

  async function loadBookingServices() {
    if (!clinicId) return;
    setServicesLoading(true);
    try {
      const { data, error } = await supabase
        .from('booking_services')
        .select('id, public_name, duration_minutes')
        .eq('clinic_id', clinicId)
        .eq('active', true)
        .order('public_name');
      if (error) throw error;
      setBookingServices(data || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load services');
      setBookingServices([]);
    } finally {
      setServicesLoading(false);
    }
  }

  useEffect(() => {
    setBookingServiceId('');
    setBookingServices([]);
    if (clinicId) {
      void loadBookingServices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinicId]);

  async function loadAvailability() {
    if (!clinicId || !bookingServiceId) return;
    setError(null);
    setSlotsLoading(true);
    try {
      const res = await api.getAvailability({
        clinicId,
        bookingServiceId,
        startDate: new Date().toISOString().slice(0, 10),
        days: 7,
      });
      setSlots(res.slots);
    } catch (e: any) {
      setError(e?.message || 'Failed to load availability');
    } finally {
      setSlotsLoading(false);
    }
  }

  async function holdSelectedSlot() {
    if (!selectedSlot) throw new Error('Select a time first');
    const sessionId = api.getOrCreateSessionId();
    const res = await api.holdSlot({
      clinicId,
      bookingServiceId,
      start: selectedSlot.start,
      end: selectedSlot.end,
      sessionId,
    });
    setHoldId(res.holdId);
  }

  async function submitBooking() {
    if (!holdId) {
      await holdSelectedSlot();
    }

    // IMPORTANT: This expects an edge function `booking-create`.
    const created = await api.createBooking({
      clinicId,
      bookingServiceId,
      holdId: holdId!,
      intake,
    });

    setConfirmation({ appointmentId: created.appointmentId, cancelUrl: created.cancelUrl });
    setStep('done');
  }

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold">Book an appointment</h1>
      <p className="text-sm text-gray-600 mt-1">Fast online booking — confirmation by SMS.</p>

      {error && (
        <div className="mt-4 p-3 border border-red-200 bg-red-50 text-red-800 rounded">
          {error}
        </div>
      )}

      {/* STEP: Clinic */}
      {step === 'clinic' && (
        <div className="mt-6 space-y-3">
          <label className="block text-sm font-medium">Choose a clinic</label>
          <select
            className="w-full border rounded p-2"
            value={clinicId}
            onChange={(e) => setClinicId(e.target.value)}
          >
            <option value="">Select…</option>
            <option value="bf3a060f-a018-43da-b45a-e184a40ec94b">Edmonton Central</option>
            <option value="0931b80a-e808-4afe-b464-ecab6c86b2b8">Calgary North</option>
            <option value="25a1a69d-cdb7-4083-bba9-050266b85e82">Calgary South</option>
          </select>

          <button
            className="w-full bg-blue-600 text-white rounded p-3 font-medium disabled:opacity-50"
            disabled={!clinicId}
            onClick={() => setStep('service')}
          >
            Next
          </button>
        </div>
      )}

      {/* STEP: Service */}
      {step === 'service' && (
        <div className="mt-6 space-y-3">
          <label className="block text-sm font-medium">What are you booking?</label>
          <select
            className="w-full border rounded p-2"
            value={bookingServiceId}
            onChange={(e) => setBookingServiceId(e.target.value)}
            disabled={servicesLoading}
          >
            <option value="">{servicesLoading ? 'Loading…' : 'Select…'}</option>
            {bookingServices.map((s) => (
              <option key={s.id} value={s.id}>
                {s.public_name}{s.duration_minutes ? ` (${s.duration_minutes}m)` : ''}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <button className="flex-1 border rounded p-3" onClick={() => setStep('clinic')}>Back</button>
            <button
              className="flex-1 bg-blue-600 text-white rounded p-3 font-medium disabled:opacity-50"
              disabled={!bookingServiceId}
              onClick={async () => {
                setStep('slot');
                await loadAvailability();
              }}
            >
              See times
            </button>
          </div>
        </div>
      )}

      {/* STEP: Slot */}
      {step === 'slot' && (
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Choose a time</h2>
            <button className="text-sm text-blue-700" onClick={loadAvailability}>
              Refresh
            </button>
          </div>

          {slotsLoading ? (
            <div className="p-4 text-gray-600">Loading times…</div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {slots.map((s) => (
                <button
                  key={s.start}
                  className={`border rounded p-2 text-sm ${selectedSlot?.start === s.start ? 'border-blue-600 bg-blue-50' : ''}`}
                  onClick={() => setSelectedSlot(s)}
                >
                  {new Date(s.start).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2 mt-2">
            <button className="flex-1 border rounded p-3" onClick={() => setStep('service')}>Back</button>
            <button
              className="flex-1 bg-blue-600 text-white rounded p-3 font-medium disabled:opacity-50"
              disabled={!selectedSlot}
              onClick={async () => {
                setError(null);
                try {
                  await holdSelectedSlot();
                  setStep('details');
                } catch (e: any) {
                  setError(e?.message || 'Unable to reserve that time');
                  await loadAvailability();
                }
              }}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* STEP: Details */}
      {step === 'details' && (
        <div className="mt-6 space-y-4">
          <h2 className="text-lg font-semibold">Your details</h2>

          <div className="grid grid-cols-2 gap-2">
            <input className="border rounded p-2" placeholder="First name" value={intake.firstName} onChange={(e) => setIntake({ ...intake, firstName: e.target.value })} />
            <input className="border rounded p-2" placeholder="Last name" value={intake.lastName} onChange={(e) => setIntake({ ...intake, lastName: e.target.value })} />
          </div>

          <input className="border rounded p-2 w-full" placeholder="Phone" inputMode="tel" value={intake.phone} onChange={(e) => setIntake({ ...intake, phone: e.target.value })} />
          <input className="border rounded p-2 w-full" placeholder="Email (optional)" inputMode="email" value={intake.email} onChange={(e) => setIntake({ ...intake, email: e.target.value })} />

          <textarea className="border rounded p-2 w-full" placeholder="What’s bothering you? (optional)" value={intake.chiefComplaint} onChange={(e) => setIntake({ ...intake, chiefComplaint: e.target.value })} />

          <div className="space-y-2 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={intake.consents.sms} onChange={(e) => setIntake({ ...intake, consents: { ...intake.consents, sms: e.target.checked } })} />
              SMS confirmations/reminders
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={intake.consents.terms} onChange={(e) => setIntake({ ...intake, consents: { ...intake.consents, terms: e.target.checked } })} />
              I agree to Terms
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={intake.consents.privacy} onChange={(e) => setIntake({ ...intake, consents: { ...intake.consents, privacy: e.target.checked } })} />
              I agree to Privacy Policy
            </label>
          </div>

          <div className="flex gap-2">
            <button className="flex-1 border rounded p-3" onClick={() => setStep('slot')}>Back</button>
            <button
              className="flex-1 bg-blue-600 text-white rounded p-3 font-medium disabled:opacity-50"
              disabled={!intake.firstName || !intake.lastName || !intake.phone || !intake.consents.terms || !intake.consents.privacy}
              onClick={async () => {
                setError(null);
                try {
                  await submitBooking();
                } catch (e: any) {
                  const msg = e?.message || 'Booking failed';
                  setError(msg);
                  // If hold expired, force the user back to slot selection.
                  if (String(msg).toUpperCase().includes('HOLD_EXPIRED')) {
                    setStep('slot');
                    await loadAvailability();
                  }
                }
              }}
            >
              Book appointment
            </button>
          </div>
        </div>
      )}

      {/* STEP: Done */}
      {step === 'done' && confirmation && (
        <div className="mt-6 space-y-3">
          <h2 className="text-lg font-semibold">Confirmed</h2>
          <p className="text-sm text-gray-700">You’re booked. You’ll receive a confirmation text shortly.</p>
          <div className="text-sm text-gray-700">
            <div><span className="font-medium">Appointment ID:</span> {confirmation.appointmentId}</div>
            {confirmation.cancelUrl && (
              <div className="mt-2">
                <a className="text-blue-700 underline" href={confirmation.cancelUrl}>Cancel / reschedule</a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
