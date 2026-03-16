import { supabase } from '../lib/supabase';
import { capacityMonitoringService } from './capacityMonitoringService';

export interface DailyReport {
  clinic_id: string;
  clinic_name: string;
  report_date: string;
  generated_at: string;

  patient_metrics: {
    total_appointments: number;
    completed: number;
    no_shows: number;
    cancellations: number;
    completion_rate: number;
    no_show_rate: number;
    new_patients: number;
    returning_patients: number;
  };

  financial_metrics: {
    total_revenue: number;
    collected: number;
    outstanding: number;
    collection_rate: number;
    average_transaction: number;
    retail_sales: number;
    service_revenue: number;
    insurance_claims: number;
  };

  operational_metrics: {
    average_wait_time: number;
    average_appointment_duration: number;
    capacity_utilization: number;
    staff_utilization: number;
    rooms_utilized: number;
    peak_hour: number;
    peak_utilization: number;
  };

  service_breakdown: Array<{
    service_name: string;
    count: number;
    revenue: number;
    percentage: number;
  }>;

  provider_performance: Array<{
    provider_name: string;
    appointments: number;
    revenue: number;
    avg_duration: number;
    patient_satisfaction: number;
  }>;

  alerts: Array<{
    type: string;
    severity: string;
    message: string;
  }>;

  recommendations: string[];
}

export interface WeeklyReport extends DailyReport {
  week_start: string;
  week_end: string;
  weekly_trends: {
    busiest_day: string;
    slowest_day: string;
    revenue_trend: 'increasing' | 'decreasing' | 'stable';
    patient_volume_trend: 'increasing' | 'decreasing' | 'stable';
  };
}

export interface MonthlyReport {
  clinic_id: string;
  clinic_name: string;
  month: string;
  year: number;

  summary: {
    total_patients: number;
    total_revenue: number;
    total_appointments: number;
    average_daily_revenue: number;
    growth_vs_previous_month: number;
  };

  top_services: Array<{
    service_name: string;
    count: number;
    revenue: number;
  }>;

  top_providers: Array<{
    provider_name: string;
    patients_seen: number;
    revenue_generated: number;
  }>;

  referral_sources: Array<{
    source: string;
    count: number;
    conversion_rate: number;
  }>;

  goals_vs_actuals: {
    revenue_goal: number;
    revenue_actual: number;
    patient_goal: number;
    patient_actual: number;
    satisfaction_goal: number;
    satisfaction_actual: number;
  };
}

class DailyReportService {
  async generateDailyReport(clinicId: string, date: string): Promise<DailyReport | null> {
    try {
      const { data: clinic } = await supabase
        .from('clinics')
        .select('id, name')
        .eq('id', clinicId)
        .single();

      if (!clinic) return null;

      const patientMetrics = await this.getPatientMetrics(clinicId, date);
      const financialMetrics = await this.getFinancialMetrics(clinicId, date);
      const operationalMetrics = await this.getOperationalMetrics(clinicId, date);
      const serviceBreakdown = await this.getServiceBreakdown(clinicId, date);
      const providerPerformance = await this.getProviderPerformance(clinicId, date);
      const alerts = await this.generateAlerts(clinicId, date);
      const recommendations = await this.generateRecommendations(
        patientMetrics,
        financialMetrics,
        operationalMetrics
      );

      return {
        clinic_id: clinicId,
        clinic_name: clinic.name,
        report_date: date,
        generated_at: new Date().toISOString(),
        patient_metrics: patientMetrics,
        financial_metrics: financialMetrics,
        operational_metrics: operationalMetrics,
        service_breakdown: serviceBreakdown,
        provider_performance: providerPerformance,
        alerts,
        recommendations,
      };
    } catch (error) {
      console.error('Error generating daily report:', error);
      return null;
    }
  }

  private async getPatientMetrics(clinicId: string, date: string) {
    const { data: appointments } = await supabase
      .from('patient_appointments')
      .select('id, status, patient_id')
      .eq('clinic_id', clinicId)
      .gte('scheduled_at', `${date}T00:00:00`)
      .lt('scheduled_at', `${date}T23:59:59`);

    const total = appointments?.length || 0;
    const completed = appointments?.filter(a => a.status === 'completed').length || 0;
    const noShows = appointments?.filter(a => a.status === 'no_show').length || 0;
    const cancelled = appointments?.filter(a => a.status === 'cancelled').length || 0;

    const uniquePatients = new Set(appointments?.map(a => a.patient_id));

    const { data: newPatients } = await supabase
      .from('patients')
      .select('id')
      .eq('clinic_id', clinicId)
      .gte('created_at', `${date}T00:00:00`)
      .lt('created_at', `${date}T23:59:59`);

    return {
      total_appointments: total,
      completed,
      no_shows: noShows,
      cancellations: cancelled,
      completion_rate: total > 0 ? (completed / total) * 100 : 0,
      no_show_rate: total > 0 ? (noShows / total) * 100 : 0,
      new_patients: newPatients?.length || 0,
      returning_patients: uniquePatients.size - (newPatients?.length || 0),
    };
  }

  private async getFinancialMetrics(clinicId: string, date: string) {
    const { data: invoices } = await supabase
      .from('invoices')
      .select('total_amount, amount_paid, status, invoice_type')
      .eq('clinic_id', clinicId)
      .gte('created_at', `${date}T00:00:00`)
      .lt('created_at', `${date}T23:59:59`);

    const totalRevenue = invoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;
    const collected = invoices?.reduce((sum, inv) => sum + (inv.amount_paid || 0), 0) || 0;
    const outstanding = totalRevenue - collected;

    const retailSales = invoices
      ?.filter(inv => inv.invoice_type === 'retail')
      .reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;

    const serviceSales = invoices
      ?.filter(inv => inv.invoice_type === 'service' || !inv.invoice_type)
      .reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;

    const insuranceClaims = invoices
      ?.filter(inv => inv.invoice_type === 'insurance')
      .reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;

    return {
      total_revenue: totalRevenue,
      collected,
      outstanding,
      collection_rate: totalRevenue > 0 ? (collected / totalRevenue) * 100 : 0,
      average_transaction: invoices && invoices.length > 0 ? totalRevenue / invoices.length : 0,
      retail_sales: retailSales,
      service_revenue: serviceSales,
      insurance_claims: insuranceClaims,
    };
  }

  private async getOperationalMetrics(clinicId: string, date: string) {
    const capacitySummary = await capacityMonitoringService.getDailyCapacitySummary(clinicId, date);

    const { data: appointments } = await supabase
      .from('patient_appointments')
      .select('duration_minutes')
      .eq('clinic_id', clinicId)
      .eq('status', 'completed')
      .gte('scheduled_at', `${date}T00:00:00`)
      .lt('scheduled_at', `${date}T23:59:59`);

    const avgDuration = appointments && appointments.length > 0
      ? appointments.reduce((sum, a) => sum + (a.duration_minutes || 45), 0) / appointments.length
      : 45;

    const { data: rooms } = await supabase
      .from('treatment_rooms')
      .select('id')
      .eq('clinic_id', clinicId)
      .eq('is_active', true);

    return {
      average_wait_time: 0,
      average_appointment_duration: avgDuration,
      capacity_utilization: capacitySummary?.average_utilization || 0,
      staff_utilization: 0,
      rooms_utilized: rooms?.length || 0,
      peak_hour: capacitySummary?.peak_hour || 12,
      peak_utilization: capacitySummary?.peak_utilization || 0,
    };
  }

  private async getServiceBreakdown(clinicId: string, date: string) {
    const { data: appointments } = await supabase
      .from('patient_appointments')
      .select('service_type')
      .eq('clinic_id', clinicId)
      .eq('status', 'completed')
      .gte('scheduled_at', `${date}T00:00:00`)
      .lt('scheduled_at', `${date}T23:59:59`);

    const { data: invoiceItems } = await supabase
      .from('invoice_items')
      .select('description, unit_price, quantity, invoices!inner(clinic_id, created_at)')
      .eq('invoices.clinic_id', clinicId)
      .gte('invoices.created_at', `${date}T00:00:00`)
      .lt('invoices.created_at', `${date}T23:59:59`);

    const serviceMap = new Map<string, { count: number; revenue: number }>();

    appointments?.forEach(appt => {
      const service = appt.service_type || 'Unknown Service';
      const current = serviceMap.get(service) || { count: 0, revenue: 0 };
      serviceMap.set(service, { ...current, count: current.count + 1 });
    });

    invoiceItems?.forEach((item: any) => {
      const service = item.description || 'Unknown Service';
      const revenue = (item.unit_price || 0) * (item.quantity || 1);
      const current = serviceMap.get(service) || { count: 0, revenue: 0 };
      serviceMap.set(service, { ...current, revenue: current.revenue + revenue });
    });

    const totalRevenue = Array.from(serviceMap.values()).reduce((sum, s) => sum + s.revenue, 0);

    return Array.from(serviceMap.entries())
      .map(([name, data]) => ({
        service_name: name,
        count: data.count,
        revenue: data.revenue,
        percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }

  private async getProviderPerformance(clinicId: string, date: string) {
    const { data: appointments } = await supabase
      .from('patient_appointments')
      .select(`
        provider_id,
        duration_minutes,
        user_profiles!patient_appointments_provider_id_fkey(first_name, last_name)
      `)
      .eq('clinic_id', clinicId)
      .eq('status', 'completed')
      .gte('scheduled_at', `${date}T00:00:00`)
      .lt('scheduled_at', `${date}T23:59:59`);

    const { data: invoices } = await supabase
      .from('invoices')
      .select('provider_id, total_amount')
      .eq('clinic_id', clinicId)
      .gte('created_at', `${date}T00:00:00`)
      .lt('created_at', `${date}T23:59:59`);

    const providerMap = new Map<string, {
      name: string;
      appointments: number;
      revenue: number;
      totalDuration: number;
    }>();

    appointments?.forEach((appt: any) => {
      const providerId = appt.provider_id;
      if (!providerId) return;

      const profile = appt.user_profiles;
      const name = profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown Provider';

      const current = providerMap.get(providerId) || {
        name,
        appointments: 0,
        revenue: 0,
        totalDuration: 0,
      };

      providerMap.set(providerId, {
        ...current,
        appointments: current.appointments + 1,
        totalDuration: current.totalDuration + (appt.duration_minutes || 45),
      });
    });

    invoices?.forEach(inv => {
      const providerId = inv.provider_id;
      if (!providerId) return;

      const current = providerMap.get(providerId);
      if (current) {
        current.revenue += inv.total_amount || 0;
      }
    });

    return Array.from(providerMap.values())
      .map(p => ({
        provider_name: p.name,
        appointments: p.appointments,
        revenue: p.revenue,
        avg_duration: p.appointments > 0 ? p.totalDuration / p.appointments : 0,
        patient_satisfaction: 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }

  private async generateAlerts(clinicId: string, date: string) {
    const alerts: Array<{ type: string; severity: string; message: string }> = [];

    const patientMetrics = await this.getPatientMetrics(clinicId, date);
    const financialMetrics = await this.getFinancialMetrics(clinicId, date);
    const operationalMetrics = await this.getOperationalMetrics(clinicId, date);

    if (patientMetrics.no_show_rate > 15) {
      alerts.push({
        type: 'high_no_show_rate',
        severity: 'warning',
        message: `No-show rate is ${patientMetrics.no_show_rate.toFixed(0)}%. Consider implementing stricter reminder policies.`,
      });
    }

    if (financialMetrics.collection_rate < 80) {
      alerts.push({
        type: 'low_collection_rate',
        severity: 'critical',
        message: `Collection rate is only ${financialMetrics.collection_rate.toFixed(0)}%. Review payment processing procedures.`,
      });
    }

    if (operationalMetrics.capacity_utilization < 50) {
      alerts.push({
        type: 'low_utilization',
        severity: 'warning',
        message: `Capacity utilization is ${operationalMetrics.capacity_utilization.toFixed(0)}%. Consider marketing initiatives.`,
      });
    }

    if (operationalMetrics.capacity_utilization > 95) {
      alerts.push({
        type: 'overbooked',
        severity: 'info',
        message: `Operating at ${operationalMetrics.capacity_utilization.toFixed(0)}% capacity. Excellent utilization!`,
      });
    }

    return alerts;
  }

  private async generateRecommendations(
    patientMetrics: any,
    financialMetrics: any,
    operationalMetrics: any
  ): Promise<string[]> {
    const recommendations: string[] = [];

    if (patientMetrics.no_show_rate > 10) {
      recommendations.push(
        'Implement automated SMS reminders 24 hours and 2 hours before appointments to reduce no-shows.'
      );
    }

    if (financialMetrics.collection_rate < 90) {
      recommendations.push(
        'Process payments at time of service to improve collection rates. Consider requiring credit card on file.'
      );
    }

    if (operationalMetrics.capacity_utilization < 60) {
      recommendations.push(
        'Capacity below 60%. Run targeted Google Ads or social media campaigns to fill empty slots.'
      );
    }

    if (operationalMetrics.peak_utilization > 90) {
      recommendations.push(
        `Peak hour (${operationalMetrics.peak_hour}:00) is near capacity. Consider staggering lunch breaks or extending hours.`
      );
    }

    if (patientMetrics.new_patients < 5) {
      recommendations.push(
        'Low new patient acquisition. Focus on referral partnerships and online booking optimization.'
      );
    }

    if (financialMetrics.average_transaction < 100) {
      recommendations.push(
        'Average transaction is below $100. Train staff on upselling retail products and multi-session packages.'
      );
    }

    return recommendations;
  }

  async generateWeeklyReport(clinicId: string, weekStart: string): Promise<WeeklyReport | null> {
    try {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      const weekEndStr = weekEnd.toISOString().split('T')[0];

      const dailyReports: DailyReport[] = [];

      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];

        const report = await this.generateDailyReport(clinicId, dateStr);
        if (report) {
          dailyReports.push(report);
        }
      }

      if (dailyReports.length === 0) return null;

      const latestReport = dailyReports[dailyReports.length - 1];

      const revenues = dailyReports.map(r => r.financial_metrics.total_revenue);
      const maxRevenue = Math.max(...revenues);
      const minRevenue = Math.min(...revenues);
      const busiestDay = dailyReports[revenues.indexOf(maxRevenue)].report_date;
      const slowestDay = dailyReports[revenues.indexOf(minRevenue)].report_date;

      const revenueTrend = revenues[revenues.length - 1] > revenues[0] ? 'increasing' :
                          revenues[revenues.length - 1] < revenues[0] ? 'decreasing' : 'stable';

      const volumes = dailyReports.map(r => r.patient_metrics.total_appointments);
      const volumeTrend = volumes[volumes.length - 1] > volumes[0] ? 'increasing' :
                         volumes[volumes.length - 1] < volumes[0] ? 'decreasing' : 'stable';

      return {
        ...latestReport,
        week_start: weekStart,
        week_end: weekEndStr,
        weekly_trends: {
          busiest_day: new Date(busiestDay).toLocaleDateString('en-US', { weekday: 'long' }),
          slowest_day: new Date(slowestDay).toLocaleDateString('en-US', { weekday: 'long' }),
          revenue_trend: revenueTrend,
          patient_volume_trend: volumeTrend,
        },
      };
    } catch (error) {
      console.error('Error generating weekly report:', error);
      return null;
    }
  }

  async emailDailyReport(clinicId: string, date: string, recipients: string[]): Promise<boolean> {
    try {
      const report = await this.generateDailyReport(clinicId, date);
      if (!report) return false;

      console.log('Daily report would be emailed to:', recipients);
      console.log('Report summary:', {
        date: report.report_date,
        revenue: report.financial_metrics.total_revenue,
        appointments: report.patient_metrics.total_appointments,
      });

      return true;
    } catch (error) {
      console.error('Error emailing daily report:', error);
      return false;
    }
  }
}

export const dailyReportService = new DailyReportService();
