import { supabase } from '../lib/supabase';

export interface CapacitySnapshot {
  clinic_id: string;
  clinic_name: string;
  date: string;
  hour: number;
  total_rooms: number;
  occupied_rooms: number;
  available_rooms: number;
  utilization_rate: number;
  scheduled_appointments: number;
  completed_appointments: number;
  no_shows: number;
  cancellations: number;
  walk_ins: number;
  wait_time_minutes: number;
  staff_available: number;
  staff_busy: number;
}

export interface DailyCapacitySummary {
  clinic_id: string;
  date: string;
  total_capacity_hours: number;
  utilized_hours: number;
  wasted_hours: number;
  peak_hour: number;
  peak_utilization: number;
  lowest_hour: number;
  lowest_utilization: number;
  average_utilization: number;
  revenue_per_capacity_hour: number;
  lost_revenue_estimate: number;
}

export interface CapacityAlert {
  type: 'overbooked' | 'underutilized' | 'staff_shortage' | 'long_wait' | 'equipment_shortage';
  severity: 'info' | 'warning' | 'critical';
  clinic_id: string;
  message: string;
  data: Record<string, any>;
  timestamp: string;
}

export interface CapacityForecast {
  clinic_id: string;
  date: string;
  hour: number;
  predicted_utilization: number;
  predicted_appointments: number;
  confidence: number;
  recommendation: string;
}

class CapacityMonitoringService {
  async getCurrentCapacity(clinicId: string): Promise<CapacitySnapshot | null> {
    try {
      const now = new Date();
      const currentHour = now.getHours();
      const dateStr = now.toISOString().split('T')[0];

      const { data: clinic } = await supabase
        .from('clinics')
        .select('id, name')
        .eq('id', clinicId)
        .single();

      if (!clinic) return null;

      const { data: rooms } = await supabase
        .from('treatment_rooms')
        .select('id, status')
        .eq('clinic_id', clinicId)
        .eq('is_active', true);

      const totalRooms = rooms?.length || 0;
      const occupiedRooms = rooms?.filter(r => r.status === 'occupied').length || 0;

      const { data: appointments } = await supabase
        .from('patient_appointments')
        .select('id, status, scheduled_at')
        .eq('clinic_id', clinicId)
        .gte('scheduled_at', `${dateStr}T${currentHour.toString().padStart(2, '0')}:00:00`)
        .lt('scheduled_at', `${dateStr}T${(currentHour + 1).toString().padStart(2, '0')}:00:00`);

      const scheduledCount = appointments?.length || 0;
      const completedCount = appointments?.filter(a => a.status === 'completed').length || 0;
      const noShowCount = appointments?.filter(a => a.status === 'no_show').length || 0;
      const cancelledCount = appointments?.filter(a => a.status === 'cancelled').length || 0;

      const { data: staff } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('clinic_id', clinicId)
        .in('role', ['provider', 'clinician', 'physiotherapist']);

      const totalStaff = staff?.length || 0;

      const { data: activeStaff } = await supabase
        .from('patient_appointments')
        .select('provider_id')
        .eq('clinic_id', clinicId)
        .eq('status', 'in_progress')
        .gte('scheduled_at', `${dateStr}T${currentHour.toString().padStart(2, '0')}:00:00`)
        .lt('scheduled_at', `${dateStr}T${(currentHour + 1).toString().padStart(2, '0')}:00:00`);

      const busyStaff = new Set(activeStaff?.map(a => a.provider_id)).size;

      return {
        clinic_id: clinicId,
        clinic_name: clinic.name,
        date: dateStr,
        hour: currentHour,
        total_rooms: totalRooms,
        occupied_rooms: occupiedRooms,
        available_rooms: totalRooms - occupiedRooms,
        utilization_rate: totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0,
        scheduled_appointments: scheduledCount,
        completed_appointments: completedCount,
        no_shows: noShowCount,
        cancellations: cancelledCount,
        walk_ins: 0,
        wait_time_minutes: 0,
        staff_available: totalStaff - busyStaff,
        staff_busy: busyStaff,
      };
    } catch (error) {
      console.error('Error getting current capacity:', error);
      return null;
    }
  }

  async getDailyCapacitySummary(clinicId: string, date: string): Promise<DailyCapacitySummary | null> {
    try {
      const { data: clinic } = await supabase
        .from('clinics')
        .select('id, operating_hours')
        .eq('id', clinicId)
        .single();

      if (!clinic) return null;

      const operatingHours = clinic.operating_hours as any || { start: '07:00', end: '20:00' };
      const startHour = parseInt(operatingHours.start?.split(':')[0] || '7');
      const endHour = parseInt(operatingHours.end?.split(':')[0] || '20');
      const totalHours = endHour - startHour;

      const { data: rooms } = await supabase
        .from('treatment_rooms')
        .select('id')
        .eq('clinic_id', clinicId)
        .eq('is_active', true);

      const totalRooms = rooms?.length || 1;
      const totalCapacityHours = totalHours * totalRooms;

      const { data: appointments } = await supabase
        .from('patient_appointments')
        .select('id, status, scheduled_at, duration_minutes')
        .eq('clinic_id', clinicId)
        .gte('scheduled_at', `${date}T00:00:00`)
        .lt('scheduled_at', `${date}T23:59:59`);

      const completedAppts = appointments?.filter(a => a.status === 'completed') || [];
      const utilizationByHour: Record<number, number> = {};

      completedAppts.forEach(appt => {
        const hour = new Date(appt.scheduled_at).getHours();
        const duration = (appt.duration_minutes || 45) / 60;
        utilizationByHour[hour] = (utilizationByHour[hour] || 0) + duration;
      });

      const totalUtilizedHours = Object.values(utilizationByHour).reduce((sum, val) => sum + val, 0);
      const wastedHours = totalCapacityHours - totalUtilizedHours;

      let peakHour = startHour;
      let peakUtilization = 0;
      let lowestHour = startHour;
      let lowestUtilization = totalRooms;

      for (let hour = startHour; hour < endHour; hour++) {
        const hourUtil = utilizationByHour[hour] || 0;
        if (hourUtil > peakUtilization) {
          peakHour = hour;
          peakUtilization = hourUtil;
        }
        if (hourUtil < lowestUtilization) {
          lowestHour = hour;
          lowestUtilization = hourUtil;
        }
      }

      const { data: revenue } = await supabase
        .from('invoices')
        .select('total_amount')
        .eq('clinic_id', clinicId)
        .gte('created_at', `${date}T00:00:00`)
        .lt('created_at', `${date}T23:59:59`)
        .eq('status', 'paid');

      const totalRevenue = revenue?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;
      const revenuePerHour = totalUtilizedHours > 0 ? totalRevenue / totalUtilizedHours : 0;
      const lostRevenue = wastedHours * revenuePerHour;

      return {
        clinic_id: clinicId,
        date,
        total_capacity_hours: totalCapacityHours,
        utilized_hours: totalUtilizedHours,
        wasted_hours: wastedHours,
        peak_hour: peakHour,
        peak_utilization: (peakUtilization / totalRooms) * 100,
        lowest_hour: lowestHour,
        lowest_utilization: (lowestUtilization / totalRooms) * 100,
        average_utilization: (totalUtilizedHours / totalCapacityHours) * 100,
        revenue_per_capacity_hour: revenuePerHour,
        lost_revenue_estimate: lostRevenue,
      };
    } catch (error) {
      console.error('Error getting daily capacity summary:', error);
      return null;
    }
  }

  async getCapacityAlerts(clinicId: string): Promise<CapacityAlert[]> {
    const alerts: CapacityAlert[] = [];
    const current = await this.getCurrentCapacity(clinicId);

    if (!current) return alerts;

    if (current.utilization_rate > 95) {
      alerts.push({
        type: 'overbooked',
        severity: 'critical',
        clinic_id: clinicId,
        message: `Clinic is at ${current.utilization_rate.toFixed(0)}% capacity. Consider adding overflow capacity.`,
        data: { utilization: current.utilization_rate, occupied: current.occupied_rooms, total: current.total_rooms },
        timestamp: new Date().toISOString(),
      });
    }

    if (current.utilization_rate < 30 && current.hour >= 9 && current.hour <= 17) {
      alerts.push({
        type: 'underutilized',
        severity: 'warning',
        clinic_id: clinicId,
        message: `Low utilization at ${current.utilization_rate.toFixed(0)}%. Consider marketing campaigns or accepting walk-ins.`,
        data: { utilization: current.utilization_rate },
        timestamp: new Date().toISOString(),
      });
    }

    if (current.staff_available === 0 && current.scheduled_appointments > 0) {
      alerts.push({
        type: 'staff_shortage',
        severity: 'critical',
        clinic_id: clinicId,
        message: 'No staff available but appointments scheduled. Urgent staffing needed.',
        data: { scheduled: current.scheduled_appointments, available_staff: 0 },
        timestamp: new Date().toISOString(),
      });
    }

    if (current.wait_time_minutes > 30) {
      alerts.push({
        type: 'long_wait',
        severity: 'warning',
        clinic_id: clinicId,
        message: `Average wait time is ${current.wait_time_minutes} minutes. Consider expediting check-ins.`,
        data: { wait_minutes: current.wait_time_minutes },
        timestamp: new Date().toISOString(),
      });
    }

    return alerts;
  }

  async forecastCapacity(clinicId: string, daysAhead: number = 7): Promise<CapacityForecast[]> {
    const forecasts: CapacityForecast[] = [];

    try {
      const pastDays = 30;
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - pastDays);

      const { data: historicalAppts } = await supabase
        .from('patient_appointments')
        .select('scheduled_at, status')
        .eq('clinic_id', clinicId)
        .gte('scheduled_at', startDate.toISOString())
        .lte('scheduled_at', endDate.toISOString());

      const hourlyAverage: Record<string, number[]> = {};

      historicalAppts?.forEach(appt => {
        const date = new Date(appt.scheduled_at);
        const dayOfWeek = date.getDay();
        const hour = date.getHours();
        const key = `${dayOfWeek}-${hour}`;

        if (!hourlyAverage[key]) {
          hourlyAverage[key] = [];
        }
        if (appt.status === 'completed' || appt.status === 'scheduled') {
          hourlyAverage[key].push(1);
        }
      });

      const avgByDayHour: Record<string, number> = {};
      Object.keys(hourlyAverage).forEach(key => {
        const values = hourlyAverage[key];
        avgByDayHour[key] = values.reduce((sum, v) => sum + v, 0) / values.length;
      });

      for (let day = 1; day <= daysAhead; day++) {
        const forecastDate = new Date();
        forecastDate.setDate(forecastDate.getDate() + day);
        const dayOfWeek = forecastDate.getDay();
        const dateStr = forecastDate.toISOString().split('T')[0];

        for (let hour = 7; hour < 20; hour++) {
          const key = `${dayOfWeek}-${hour}`;
          const predicted = avgByDayHour[key] || 0;

          let recommendation = 'Normal operations';
          if (predicted > 5) {
            recommendation = 'High demand expected. Consider adding staff.';
          } else if (predicted < 2) {
            recommendation = 'Low demand. Opportunity for marketing or special offers.';
          }

          forecasts.push({
            clinic_id: clinicId,
            date: dateStr,
            hour,
            predicted_utilization: Math.min(predicted * 15, 100),
            predicted_appointments: Math.round(predicted),
            confidence: hourlyAverage[key]?.length > 5 ? 0.8 : 0.5,
            recommendation,
          });
        }
      }

      return forecasts;
    } catch (error) {
      console.error('Error forecasting capacity:', error);
      return [];
    }
  }

  async getWeeklyCapacityTrends(clinicId: string): Promise<any[]> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const trends = [];

      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];

        const summary = await this.getDailyCapacitySummary(clinicId, dateStr);
        if (summary) {
          trends.push({
            date: dateStr,
            day: date.toLocaleDateString('en-US', { weekday: 'short' }),
            utilization: summary.average_utilization,
            revenue: summary.utilized_hours * summary.revenue_per_capacity_hour,
            lost_revenue: summary.lost_revenue_estimate,
          });
        }
      }

      return trends;
    } catch (error) {
      console.error('Error getting weekly trends:', error);
      return [];
    }
  }

  async recordCapacitySnapshot(clinicId: string): Promise<void> {
    try {
      const snapshot = await this.getCurrentCapacity(clinicId);
      if (!snapshot) return;

      await supabase.from('capacity_snapshots').insert({
        clinic_id: snapshot.clinic_id,
        snapshot_date: snapshot.date,
        snapshot_hour: snapshot.hour,
        total_rooms: snapshot.total_rooms,
        occupied_rooms: snapshot.occupied_rooms,
        utilization_rate: snapshot.utilization_rate,
        scheduled_appointments: snapshot.scheduled_appointments,
        completed_appointments: snapshot.completed_appointments,
        no_shows: snapshot.no_shows,
        staff_available: snapshot.staff_available,
        staff_busy: snapshot.staff_busy,
      });
    } catch (error) {
      console.error('Error recording capacity snapshot:', error);
    }
  }

  async optimizeSchedule(clinicId: string, date: string): Promise<{
    current_gaps: Array<{ hour: number; available_slots: number }>;
    recommendations: string[];
    potential_revenue_gain: number;
  }> {
    try {
      const summary = await this.getDailyCapacitySummary(clinicId, date);
      if (!summary) {
        return { current_gaps: [], recommendations: [], potential_revenue_gain: 0 };
      }

      const { data: rooms } = await supabase
        .from('treatment_rooms')
        .select('id')
        .eq('clinic_id', clinicId)
        .eq('is_active', true);

      const totalRooms = rooms?.length || 1;
      const gaps: Array<{ hour: number; available_slots: number }> = [];
      const recommendations: string[] = [];

      const { data: appointments } = await supabase
        .from('patient_appointments')
        .select('scheduled_at, duration_minutes')
        .eq('clinic_id', clinicId)
        .gte('scheduled_at', `${date}T00:00:00`)
        .lt('scheduled_at', `${date}T23:59:59`)
        .in('status', ['scheduled', 'in_progress', 'completed']);

      const hourlyBookings: Record<number, number> = {};
      appointments?.forEach(appt => {
        const hour = new Date(appt.scheduled_at).getHours();
        hourlyBookings[hour] = (hourlyBookings[hour] || 0) + 1;
      });

      for (let hour = 7; hour < 20; hour++) {
        const booked = hourlyBookings[hour] || 0;
        const available = totalRooms - booked;

        if (available > 0) {
          gaps.push({ hour, available_slots: available });

          if (hour >= 9 && hour <= 17 && available >= 2) {
            recommendations.push(
              `${hour}:00 - ${available} slots available. Ideal for walk-ins or last-minute bookings.`
            );
          }
        }
      }

      const totalGapSlots = gaps.reduce((sum, g) => sum + g.available_slots, 0);
      const avgRevenuePerSlot = summary.revenue_per_capacity_hour;
      const potentialGain = totalGapSlots * avgRevenuePerSlot;

      if (summary.average_utilization < 70) {
        recommendations.push(
          `Overall utilization is ${summary.average_utilization.toFixed(0)}%. Consider targeted marketing for ${date}.`
        );
      }

      if (summary.peak_utilization > 90) {
        recommendations.push(
          `Peak hour (${summary.peak_hour}:00) is near capacity. Consider extending hours or adding resources.`
        );
      }

      return {
        current_gaps: gaps,
        recommendations,
        potential_revenue_gain: potentialGain,
      };
    } catch (error) {
      console.error('Error optimizing schedule:', error);
      return { current_gaps: [], recommendations: [], potential_revenue_gain: 0 };
    }
  }
}

export const capacityMonitoringService = new CapacityMonitoringService();
