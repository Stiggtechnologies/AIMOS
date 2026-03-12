import { supabase } from '../../lib/supabase';

export type BookableSlot = {
  start: string; // ISO string with tz offset
  end: string;   // ISO string with tz offset
  providerId?: string;
};

export type AvailabilityRequest = {
  clinicId: string;
  bookingServiceId: string;
  startDate: string; // YYYY-MM-DD
  days: number;
  timezone?: string;
};

export class AvailabilityService {
  getOrCreateSessionId(): string {
    const key = 'booking_session_id';
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const sessionId = crypto.randomUUID();
    localStorage.setItem(key, sessionId);
    return sessionId;
  }

  async getAvailability(req: AvailabilityRequest): Promise<{ ok: true; slots: BookableSlot[] }> {
    const { data, error } = await supabase.functions.invoke('booking-availability', {
      body: {
        clinicId: req.clinicId,
        bookingServiceId: req.bookingServiceId,
        startDate: req.startDate,
        days: req.days,
        timezone: req.timezone,
      },
    });

    if (error) throw error;
    if (!data?.ok) throw new Error(data?.error || 'Availability failed');
    return data;
  }

  async holdSlot(input: { clinicId: string; bookingServiceId: string; start: string; end: string; sessionId: string })
    : Promise<{ ok: true; holdId: string; expiresAt: string }>
  {
    const { data, error } = await supabase.functions.invoke('booking-hold-slot', {
      body: input,
    });
    if (error) throw error;
    if (!data?.ok) throw new Error(data?.error || 'Hold failed');
    return data;
  }

  async createBooking(input: {
    clinicId: string;
    bookingServiceId: string;
    holdId: string;
    intake: {
      firstName: string;
      lastName: string;
      phone: string;
      email?: string;
      chiefComplaint?: string;
      consents: { sms: boolean; terms: boolean; privacy: boolean };
      utm?: Record<string, string | undefined>;
    };
  }): Promise<{ ok: true; appointmentId: string; crmLeadId?: string; crmBookingId?: string; cancelUrl?: string }> {
    const { data, error } = await supabase.functions.invoke('booking-create', { body: input });
    if (error) throw error;
    if (!data?.ok) throw new Error(data?.error || 'Create booking failed');
    return data;
  }
}
