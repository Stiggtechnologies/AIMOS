import { supabase } from '../lib/supabase';

export interface Shift {
  id: string;
  name: string;
  shift_type: 'morning' | 'afternoon' | 'evening' | 'night' | 'full_day' | 'on_call';
  start_time: string;
  end_time: string;
  is_active: boolean;
  default_capacity: number;
  color?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface StaffSchedule {
  id: string;
  staff_id: string;
  staff?: any;
  clinic_id: string;
  clinic?: any;
  shift_id?: string;
  shift?: Shift;
  schedule_date: string;
  start_time: string;
  end_time: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  assigned_by?: string;
  confirmed_at?: string;
  completed_at?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ShiftSwap {
  id: string;
  from_schedule_id: string;
  from_schedule?: StaffSchedule;
  from_staff_id: string;
  from_staff?: any;
  to_staff_id?: string;
  to_staff?: any;
  requested_by: string;
  requester?: any;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reason?: string;
  approved_by?: string;
  approved_at?: string;
  rejected_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface TimeOffRequest {
  id: string;
  staff_id: string;
  staff?: any;
  request_type: string;
  start_date: string;
  end_date: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reason?: string;
  notes?: string;
  requested_by: string;
  approved_by?: string;
  approved_at?: string;
  rejected_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface TreatmentRoom {
  id: string;
  clinic_id: string;
  clinic?: any;
  room_number: string;
  room_name: string;
  room_type: 'treatment' | 'assessment' | 'gym' | 'private' | 'group' | 'admin';
  capacity: number;
  floor_number?: number;
  square_feet?: number;
  equipment: string[];
  amenities: string[];
  is_active: boolean;
  is_accessible: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface RoomBooking {
  id: string;
  room_id: string;
  room?: TreatmentRoom;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: 'available' | 'booked' | 'in_use' | 'maintenance';
  booked_by?: string;
  patient_name?: string;
  treatment_type?: string;
  staff_assigned: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CapacityTarget {
  id: string;
  clinic_id: string;
  clinic?: any;
  target_period: string;
  start_date: string;
  end_date: string;
  target_utilization_rate: number;
  target_patient_visits?: number;
  target_revenue?: number;
  target_staff_hours?: number;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export const staffingService = {
  async getShifts(): Promise<Shift[]> {
    const { data, error } = await supabase
      .from('ops_shifts')
      .select('*')
      .eq('is_active', true)
      .order('start_time');

    if (error) throw error;
    return data || [];
  },

  async createShift(shift: Partial<Shift>): Promise<Shift> {
    const { data, error } = await supabase
      .from('ops_shifts')
      .insert(shift)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getStaffSchedules(clinicId?: string, startDate?: string, endDate?: string): Promise<StaffSchedule[]> {
    let query = supabase
      .from('ops_staff_schedules')
      .select(`
        *,
        staff:staff_profiles(id, user:user_profiles(first_name, last_name, email), job_title),
        clinic:clinics(id, name, code),
        shift:ops_shifts(*)
      `);

    if (clinicId) {
      query = query.eq('clinic_id', clinicId);
    }

    if (startDate) {
      query = query.gte('schedule_date', startDate);
    }

    if (endDate) {
      query = query.lte('schedule_date', endDate);
    }

    const { data, error } = await query.order('schedule_date').order('start_time');

    if (error) throw error;
    return data || [];
  },

  async createSchedule(schedule: Partial<StaffSchedule>): Promise<StaffSchedule> {
    const { data, error } = await supabase
      .from('ops_staff_schedules')
      .insert(schedule)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateSchedule(id: string, updates: Partial<StaffSchedule>): Promise<StaffSchedule> {
    const { data, error } = await supabase
      .from('ops_staff_schedules')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getTimeOffRequests(staffId?: string): Promise<TimeOffRequest[]> {
    let query = supabase
      .from('ops_time_off_requests')
      .select(`
        *,
        staff:staff_profiles(id, user:user_profiles(first_name, last_name, email))
      `)
      .order('start_date', { ascending: false });

    if (staffId) {
      query = query.eq('staff_id', staffId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  async createTimeOffRequest(request: Partial<TimeOffRequest>): Promise<TimeOffRequest> {
    const { data, error } = await supabase
      .from('ops_time_off_requests')
      .insert(request)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async approveTimeOffRequest(id: string, approverId: string): Promise<TimeOffRequest> {
    const { data, error } = await supabase
      .from('ops_time_off_requests')
      .update({
        status: 'approved',
        approved_by: approverId,
        approved_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async rejectTimeOffRequest(id: string, approverId: string, reason: string): Promise<TimeOffRequest> {
    const { data, error } = await supabase
      .from('ops_time_off_requests')
      .update({
        status: 'rejected',
        approved_by: approverId,
        approved_at: new Date().toISOString(),
        rejected_reason: reason
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

export const capacityService = {
  async getTreatmentRooms(clinicId?: string): Promise<TreatmentRoom[]> {
    let query = supabase
      .from('ops_treatment_rooms')
      .select(`
        *,
        clinic:clinics(id, name, code)
      `)
      .eq('is_active', true)
      .order('room_number');

    if (clinicId) {
      query = query.eq('clinic_id', clinicId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  async createTreatmentRoom(room: Partial<TreatmentRoom>): Promise<TreatmentRoom> {
    const { data, error } = await supabase
      .from('ops_treatment_rooms')
      .insert(room)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getRoomBookings(roomId?: string, date?: string): Promise<RoomBooking[]> {
    let query = supabase
      .from('ops_room_bookings')
      .select(`
        *,
        room:ops_treatment_rooms(*)
      `)
      .order('booking_date')
      .order('start_time');

    if (roomId) {
      query = query.eq('room_id', roomId);
    }

    if (date) {
      query = query.eq('booking_date', date);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  async createRoomBooking(booking: Partial<RoomBooking>): Promise<RoomBooking> {
    const { data, error } = await supabase
      .from('ops_room_bookings')
      .insert(booking)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getCapacityTargets(clinicId?: string): Promise<CapacityTarget[]> {
    let query = supabase
      .from('ops_capacity_targets')
      .select(`
        *,
        clinic:clinics(id, name, code)
      `)
      .order('start_date', { ascending: false });

    if (clinicId) {
      query = query.eq('clinic_id', clinicId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  async createCapacityTarget(target: Partial<CapacityTarget>): Promise<CapacityTarget> {
    const { data, error } = await supabase
      .from('ops_capacity_targets')
      .insert(target)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async calculateUtilization(clinicId: string, startDate: string, endDate: string) {
    const rooms = await this.getTreatmentRooms(clinicId);
    const bookings = await supabase
      .from('ops_room_bookings')
      .select('*')
      .gte('booking_date', startDate)
      .lte('booking_date', endDate)
      .in('room_id', rooms.map(r => r.id));

    if (bookings.error) throw bookings.error;

    const totalRoomHours = rooms.length * 8 *
      Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));

    const bookedHours = (bookings.data || []).reduce((sum, booking) => {
      const start = new Date(`2000-01-01 ${booking.start_time}`);
      const end = new Date(`2000-01-01 ${booking.end_time}`);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return sum + hours;
    }, 0);

    const utilizationRate = totalRoomHours > 0 ? (bookedHours / totalRoomHours) * 100 : 0;

    return {
      totalRoomHours,
      bookedHours,
      utilizationRate: Math.round(utilizationRate * 10) / 10,
      totalRooms: rooms.length,
      totalBookings: bookings.data?.length || 0
    };
  }
};
