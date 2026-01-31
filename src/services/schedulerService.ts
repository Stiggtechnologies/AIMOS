import { supabase } from '../lib/supabase';
import { analyzeScheduleOptimization, generateSchedulingRecommendations } from './openaiService';

export interface SchedulerAppointment {
  id: string;
  patient_id: string;
  patient_name: string;
  clinic_id: string;
  provider_id: string | null;
  provider_name: string | null;
  provider_role: string | null;
  appointment_type: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: 'scheduled' | 'confirmed' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  color_code?: string;
  reason_for_visit?: string;
  chief_complaint?: string;
  no_show_risk?: number;
  checked_in_at?: string;
  checked_out_at?: string;
  case_type?: string;
}

export interface SchedulerProvider {
  id: string;
  name: string;
  role: string;
  clinic_id: string;
  utilization?: number;
  active: boolean;
}

export interface SchedulerBlock {
  id: string;
  provider_id: string;
  block_type: 'break' | 'meeting' | 'administrative' | 'training';
  start_time: string;
  end_time: string;
  reason?: string;
  color_code: string;
}

export interface ScheduleIntelligence {
  id: string;
  type: 'no_show_risk' | 'capacity_gap' | 'overbooking' | 'waitlist_opportunity' | 'underutilization';
  title: string;
  description: string;
  confidence: number;
  appointment_id?: string;
  provider_id?: string;
  suggested_action?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, any>;
}

export interface RefreshStatus {
  lastRefreshed: Date | null;
  isRefreshing: boolean;
  nextRefreshIn?: number;
}

class SchedulerService {
  private refreshStatus: RefreshStatus = {
    lastRefreshed: null,
    isRefreshing: false,
  };
  private refreshInterval: NodeJS.Timer | null = null;
  private refreshIntervalMs: number = 5 * 60 * 1000;

  async getAppointments(
    clinicId: string,
    date: string,
    providers?: string[]
  ): Promise<SchedulerAppointment[]> {
    console.log('[SchedulerService] Fetching appointments:', { clinicId, date, providers });

    let query = supabase
      .from('patient_appointments')
      .select(`
        id,
        patient_id,
        patients!inner(first_name, last_name),
        clinic_id,
        provider_id,
        user_profiles(display_name, first_name, last_name, role),
        appointment_type,
        appointment_date,
        start_time,
        end_time,
        status,
        reason_for_visit,
        chief_complaint,
        no_show,
        checked_in_at,
        checked_out_at
      `)
      .eq('clinic_id', clinicId)
      .eq('appointment_date', date)
      .order('start_time', { ascending: true });

    if (providers && providers.length > 0) {
      query = query.in('provider_id', providers);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[SchedulerService] Error fetching appointments:', error);
      throw error;
    }

    console.log(`[SchedulerService] Loaded ${data?.length || 0} appointments for ${date} at clinic ${clinicId}`, data);

    return (data || []).map(appt => ({
      id: appt.id,
      patient_id: appt.patient_id,
      patient_name: `${appt.patients.last_name}, ${appt.patients.first_name}`,
      clinic_id: appt.clinic_id,
      provider_id: appt.provider_id,
      provider_name: appt.user_profiles?.display_name ||
                    `${appt.user_profiles?.first_name || ''} ${appt.user_profiles?.last_name || ''}`.trim() ||
                    null,
      provider_role: appt.user_profiles?.role || null,
      appointment_type: appt.appointment_type,
      appointment_date: appt.appointment_date,
      start_time: appt.start_time,
      end_time: appt.end_time,
      status: appt.status,
      color_code: this.getStatusColor(appt.status),
      reason_for_visit: appt.reason_for_visit,
      chief_complaint: appt.chief_complaint,
      no_show_risk: appt.no_show ? 95 : Math.random() * 40,
      checked_in_at: appt.checked_in_at,
      checked_out_at: appt.checked_out_at,
    }));
  }

  async getProviders(clinicId: string): Promise<SchedulerProvider[]> {
    console.log('[SchedulerService] Fetching providers for clinic:', clinicId);

    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, display_name, first_name, last_name, role, is_active, primary_clinic_id')
      .eq('role', 'clinician')
      .eq('is_active', true);

    if (error) {
      console.error('[SchedulerService] Error fetching providers:', error);
      throw error;
    }

    console.log('[SchedulerService] Raw providers from DB:', data);

    const filtered = (data || []).filter(p => p.primary_clinic_id === clinicId || !p.primary_clinic_id);
    console.log('[SchedulerService] Filtered providers for clinic:', filtered);

    const providers = filtered.map(provider => ({
      id: provider.id,
      name: provider.display_name || `${provider.first_name || ''} ${provider.last_name || ''}`.trim(),
      role: provider.role,
      clinic_id: clinicId,
      utilization: Math.random() * 40 + 60,
      active: provider.is_active,
    }));

    console.log('[SchedulerService] Final providers array:', providers);
    return providers;
  }

  async getProviderBlocks(
    providerId: string,
    date: string
  ): Promise<SchedulerBlock[]> {
    const { data, error } = await supabase
      .from('clinician_schedules')
      .select('*')
      .eq('clinician_id', providerId)
      .eq('schedule_date', date)
      .in('schedule_type', ['break', 'meeting', 'administrative', 'training']);

    if (error) throw error;

    return (data || []).map(block => ({
      id: block.id,
      provider_id: block.clinician_id,
      block_type: block.schedule_type,
      start_time: block.start_time,
      end_time: block.end_time,
      reason: block.notes,
      color_code: '#E5E7EB',
    }));
  }

  async getScheduleIntelligence(
    clinicId: string,
    date: string
  ): Promise<ScheduleIntelligence[]> {
    const appointments = await this.getAppointments(clinicId, date);
    const providers = await this.getProviders(clinicId);
    const insights: ScheduleIntelligence[] = [];

    // No-show risk detection
    appointments.forEach(appt => {
      if ((appt.no_show_risk || 0) > 70) {
        insights.push({
          id: `insight_no_show_${appt.id}`,
          type: 'no_show_risk',
          title: 'High No-Show Risk',
          description: `${appt.patient_name} – ${appt.start_time}`,
          confidence: appt.no_show_risk || 75,
          appointment_id: appt.id,
          provider_id: appt.provider_id || undefined,
          suggested_action: 'Send reminder or fill with standby',
          severity: 'high',
        });
      }
    });

    // Overbooking detection
    const appointmentsByHour = appointments.reduce((acc, appt) => {
      const hour = appt.start_time.substring(0, 2);
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(appointmentsByHour).forEach(([hour, count]) => {
      if (count > 4) {
        const overbookedAppointments = appointments.filter(a => a.start_time.startsWith(hour));
        insights.push({
          id: `insight_overbooking_${hour}`,
          type: 'overbooking',
          title: 'Potential Overbooking',
          description: `${count} appointments at ${hour}:00`,
          confidence: 85,
          suggested_action: 'Review capacity for this hour',
          severity: 'medium',
          metadata: {
            hour,
            affectedAppointmentIds: overbookedAppointments.map(a => a.id),
          },
        });
      }
    });

    // Underutilization detection
    providers.forEach(provider => {
      const providerAppts = appointments.filter(a => a.provider_id === provider.id);
      const totalHours = providerAppts.reduce((sum, appt) => {
        const start = this.timeToMinutes(appt.start_time);
        const end = this.timeToMinutes(appt.end_time);
        return sum + (end - start) / 60;
      }, 0);

      if (totalHours < 4 && providerAppts.length > 0) {
        insights.push({
          id: `insight_underutilization_${provider.id}`,
          type: 'underutilization',
          title: 'Low Provider Utilization',
          description: `${provider.name} has only ${totalHours.toFixed(1)} hours booked`,
          confidence: 90,
          provider_id: provider.id,
          suggested_action: 'Review scheduling or add appointments',
          severity: 'low',
          metadata: {
            provider_id: provider.id,
            totalHours: totalHours.toFixed(1),
          },
        });
      }
    });

    // Capacity gap detection (large gaps between appointments)
    appointments.forEach((appt, idx) => {
      if (idx < appointments.length - 1) {
        const nextAppt = appointments[idx + 1];
        if (appt.provider_id === nextAppt.provider_id) {
          const endMinutes = this.timeToMinutes(appt.end_time);
          const nextStartMinutes = this.timeToMinutes(nextAppt.start_time);
          const gapMinutes = nextStartMinutes - endMinutes;

          if (gapMinutes >= 90) {
            insights.push({
              id: `insight_capacity_gap_${appt.id}_${nextAppt.id}`,
              type: 'capacity_gap',
              title: 'Scheduling Gap',
              description: `${(gapMinutes / 60).toFixed(1)}h gap between ${appt.end_time} and ${nextAppt.start_time}`,
              confidence: 80,
              provider_id: appt.provider_id || undefined,
              suggested_action: 'Consider filling with waitlist patients',
              severity: 'low',
              metadata: {
                provider_id: appt.provider_id,
                gapMinutes,
                startAppointmentId: appt.id,
                endAppointmentId: nextAppt.id,
              },
            });
          }
        }
      }
    });

    return insights;
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  isAppointmentLate(appt: SchedulerAppointment): boolean {
    if (appt.status !== 'scheduled' && appt.status !== 'confirmed') {
      return false;
    }

    const now = new Date();
    const apptDate = new Date(appt.appointment_date + 'T' + appt.start_time);
    const diff = now.getTime() - apptDate.getTime();
    const minutesLate = Math.floor(diff / 1000 / 60);

    return minutesLate > 5;
  }

  private getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      scheduled: '#DBEAFE',
      confirmed: '#93C5FD',
      checked_in: '#FDE68A',
      in_progress: '#FCD34D',
      completed: '#86EFAC',
      cancelled: '#FCA5A5',
      no_show: '#EF4444',
      late: '#FCA5A5',
    };
    return colors[status] || '#E5E7EB';
  }

  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      scheduled: '⏳',
      confirmed: '✓',
      checked_in: '🚶',
      in_progress: '🔄',
      completed: '✅',
      cancelled: '❌',
      no_show: '🚫',
    };
    return icons[status] || '○';
  }

  async getAIScheduleAnalysis(
    clinicId: string,
    date: string
  ): Promise<{ analysis: string; recommendations: string } | null> {
    try {
      const appointments = await this.getAppointments(clinicId, date);
      const providers = await this.getProviders(clinicId);
      const insights = await this.getScheduleIntelligence(clinicId, date);

      const gaps = insights.filter(i => i.type === 'capacity_gap');
      const underutilized = insights.filter(i => i.type === 'underutilization');
      const overbooked = insights.filter(i => i.type === 'overbooking');

      const [analysis, recommendations] = await Promise.all([
        analyzeScheduleOptimization({
          appointments: appointments.map(a => ({
            patient: a.patient_name,
            type: a.appointment_type,
            time: `${a.start_time}-${a.end_time}`,
            provider: a.provider_name,
            status: a.status
          })),
          providers: providers.map(p => ({
            name: p.name,
            role: p.role,
            utilization: p.utilization
          })),
          date
        }),
        generateSchedulingRecommendations({
          gaps,
          underutilizedProviders: underutilized,
          overbookedSlots: overbooked
        })
      ]);

      return { analysis, recommendations };
    } catch (error) {
      console.error('[SchedulerService] AI analysis failed:', error);
      return null;
    }
  }

  getRefreshStatus(): RefreshStatus {
    return { ...this.refreshStatus };
  }

  startAutoRefresh(intervalMs: number = 5 * 60 * 1000) {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    this.refreshIntervalMs = intervalMs;
    console.log(`[SchedulerService] Starting auto-refresh every ${intervalMs / 1000 / 60} minutes`);

    this.refreshInterval = setInterval(() => {
      this.refreshStatus.nextRefreshIn = undefined;
      console.log('[SchedulerService] Auto-refresh interval triggered');
    }, intervalMs);
  }

  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
      console.log('[SchedulerService] Auto-refresh stopped');
    }
  }

  async refreshScheduleData(clinicId: string, date: string) {
    if (this.refreshStatus.isRefreshing) {
      console.log('[SchedulerService] Refresh already in progress');
      return;
    }

    try {
      this.refreshStatus.isRefreshing = true;
      console.log('[SchedulerService] Starting manual refresh for', { clinicId, date });

      await Promise.all([
        this.getAppointments(clinicId, date),
        this.getProviders(clinicId),
        this.getScheduleIntelligence(clinicId, date),
      ]);

      this.refreshStatus.lastRefreshed = new Date();
      console.log('[SchedulerService] Refresh completed at', this.refreshStatus.lastRefreshed);
    } catch (error) {
      console.error('[SchedulerService] Refresh failed:', error);
    } finally {
      this.refreshStatus.isRefreshing = false;
    }
  }

  isFeatureEnabled(featureName: 'aim_scheduler_enabled'): boolean {
    const featureFlags: Record<string, boolean> = {
      aim_scheduler_enabled: true,
    };

    const value = localStorage.getItem(`feature_${featureName}`);
    if (value !== null) {
      return value === 'true';
    }

    return featureFlags[featureName] ?? false;
  }

  setFeatureFlag(featureName: 'aim_scheduler_enabled', enabled: boolean) {
    localStorage.setItem(`feature_${featureName}`, String(enabled));
    console.log(`[SchedulerService] Feature flag "${featureName}" set to ${enabled}`);
  }
}

export const schedulerService = new SchedulerService();
