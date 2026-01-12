import { supabase } from '../lib/supabase';
import type { Application } from '../types';

export const applicationService = {
  async getAllApplications(): Promise<Application[]> {
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        candidate:candidates(*),
        job:jobs(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getApplicationById(id: string): Promise<Application | null> {
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        candidate:candidates(*),
        job:jobs(*)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async createApplication(application: Partial<Application>): Promise<Application> {
    const { data, error } = await supabase
      .from('applications')
      .insert(application)
      .select(`
        *,
        candidate:candidates(*),
        job:jobs(*)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  async updateApplication(id: string, updates: Partial<Application>): Promise<Application> {
    const { data, error } = await supabase
      .from('applications')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        candidate:candidates(*),
        job:jobs(*)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  async updateApplicationStatus(id: string, status: Application['status']): Promise<void> {
    const { error } = await supabase
      .from('applications')
      .update({
        status,
        last_activity_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
  },

  async getApplicationsByStatus(status: Application['status']): Promise<Application[]> {
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        candidate:candidates(*),
        job:jobs(*)
      `)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
};
