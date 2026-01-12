import { supabase } from '../lib/supabase';
import type {
  Clinic, StaffProfile, AcademyContent, AcademyCategory,
  Policy, IncidentReport, Announcement, ClinicMetrics,
  OnboardingProgress, LearningProgress
} from '../types/intranet';

export const clinicService = {
  async getAllClinics(): Promise<Clinic[]> {
    const { data, error } = await supabase
      .from('clinics')
      .select('*')
      .eq('is_active', true)
      .order('name');
    if (error) throw error;
    return data || [];
  },

  async getClinicMetrics(clinicId: string, days: number = 7): Promise<ClinicMetrics[]> {
    const { data, error } = await supabase
      .from('clinic_metrics')
      .select('*')
      .eq('clinic_id', clinicId)
      .gte('metric_date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('metric_date', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getClinicStats() {
    const { data: clinics } = await supabase
      .from('clinics')
      .select('id')
      .eq('is_active', true);

    const { data: metrics } = await supabase
      .from('clinic_metrics')
      .select('*')
      .gte('metric_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    const totalRevenue = metrics?.reduce((sum, m) => sum + Number(m.revenue), 0) || 0;
    const avgUtilization = metrics?.reduce((sum, m) => sum + Number(m.utilization_rate), 0) / (metrics?.length || 1) || 0;
    const totalVisits = metrics?.reduce((sum, m) => sum + m.patient_visits, 0) || 0;

    return {
      total_clinics: clinics?.length || 0,
      weekly_revenue: totalRevenue,
      avg_utilization: avgUtilization,
      weekly_visits: totalVisits
    };
  }
};

export const staffService = {
  async getAllStaff(): Promise<StaffProfile[]> {
    const { data, error } = await supabase
      .from('staff_profiles')
      .select(`
        *,
        user:user_profiles(*),
        clinic:clinics(*)
      `)
      .order('user_id');
    if (error) throw error;
    return data || [];
  },

  async searchStaff(query: string): Promise<StaffProfile[]> {
    const { data, error } = await supabase
      .from('staff_profiles')
      .select(`
        *,
        user:user_profiles(*),
        clinic:clinics(*)
      `)
      .or(`job_title.ilike.%${query}%,specialization.ilike.%${query}%`);
    if (error) throw error;
    return data || [];
  }
};

export const academyService = {
  async getCategories(): Promise<AcademyCategory[]> {
    const { data, error } = await supabase
      .from('academy_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');
    if (error) throw error;
    return data || [];
  },

  async getContent(categoryId?: string): Promise<AcademyContent[]> {
    let query = supabase
      .from('academy_content')
      .select(`
        *,
        category:academy_categories(*)
      `)
      .eq('is_published', true);

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query.order('title');
    if (error) throw error;
    return data || [];
  },

  async getMyProgress(userId: string): Promise<LearningProgress[]> {
    const { data, error } = await supabase
      .from('learning_progress')
      .select('*')
      .eq('user_id', userId)
      .order('last_accessed_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async updateProgress(userId: string, contentId: string, progressPercent: number, completed: boolean): Promise<void> {
    const { error } = await supabase
      .from('learning_progress')
      .upsert({
        user_id: userId,
        content_id: contentId,
        progress_percent: progressPercent,
        completed,
        completed_at: completed ? new Date().toISOString() : null,
        last_accessed_at: new Date().toISOString()
      });
    if (error) throw error;
  }
};

export const complianceService = {
  async getPolicies(): Promise<Policy[]> {
    const { data, error } = await supabase
      .from('policies')
      .select('*')
      .eq('is_active', true)
      .order('policy_number');
    if (error) throw error;
    return data || [];
  },

  async acknowledgePolicy(userId: string, policyId: string): Promise<void> {
    const { error } = await supabase
      .from('policy_acknowledgments')
      .insert({
        user_id: userId,
        policy_id: policyId,
        acknowledged_at: new Date().toISOString()
      });
    if (error) throw error;
  },

  async getIncidents(clinicId?: string): Promise<IncidentReport[]> {
    let query = supabase
      .from('incident_reports')
      .select(`
        *,
        clinic:clinics(*),
        reporter:user_profiles(*)
      `)
      .order('incident_date', { ascending: false });

    if (clinicId) {
      query = query.eq('clinic_id', clinicId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async createIncident(incident: Partial<IncidentReport>): Promise<IncidentReport> {
    const incidentNumber = `INC-${Date.now()}`;
    const { data, error } = await supabase
      .from('incident_reports')
      .insert({ ...incident, incident_number: incidentNumber })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};

export const announcementService = {
  async getAnnouncements(): Promise<Announcement[]> {
    const { data, error } = await supabase
      .from('announcements')
      .select(`
        *,
        author:user_profiles(*)
      `)
      .eq('is_published', true)
      .order('is_pinned', { ascending: false })
      .order('published_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async markAsRead(userId: string, announcementId: string): Promise<void> {
    const { error } = await supabase
      .from('announcement_reads')
      .insert({
        user_id: userId,
        announcement_id: announcementId,
        read_at: new Date().toISOString()
      });
    if (error && error.code !== '23505') throw error;
  }
};

export const onboardingService = {
  async getMyTasks(userId: string): Promise<OnboardingProgress[]> {
    const { data, error } = await supabase
      .from('onboarding_progress')
      .select(`
        *,
        task:onboarding_tasks(*)
      `)
      .eq('user_id', userId)
      .order('created_at');
    if (error) throw error;
    return data || [];
  },

  async completeTask(progressId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('onboarding_progress')
      .update({
        completed: true,
        completed_at: new Date().toISOString(),
        completed_by: userId,
        status: 'completed'
      })
      .eq('id', progressId);
    if (error) throw error;
  }
};
