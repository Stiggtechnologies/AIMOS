import { supabase } from '../lib/supabase';
import type { Job, Application } from '../types';

export const jobService = {
  async getAllJobs(): Promise<Job[]> {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getActiveJobs(): Promise<Job[]> {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'active')
      .order('priority_score', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getJobById(id: string): Promise<Job | null> {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async createJob(job: Partial<Job>): Promise<Job> {
    const { data, error } = await supabase
      .from('jobs')
      .insert(job)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateJob(id: string, updates: Partial<Job>): Promise<Job> {
    const { data, error } = await supabase
      .from('jobs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getJobApplications(jobId: string): Promise<Application[]> {
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        candidate:candidates(*),
        job:jobs(*)
      `)
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getJobStats(jobId: string): Promise<{
    total_applications: number;
    screening: number;
    interviewing: number;
    offered: number;
    hired: number;
    rejected: number;
  }> {
    const { data, error } = await supabase
      .from('applications')
      .select('status')
      .eq('job_id', jobId);

    if (error) throw error;

    const stats = {
      total_applications: data?.length || 0,
      screening: 0,
      interviewing: 0,
      offered: 0,
      hired: 0,
      rejected: 0
    };

    data?.forEach(app => {
      if (app.status === 'screening') stats.screening++;
      else if (app.status === 'interviewing' || app.status === 'interview_scheduled') stats.interviewing++;
      else if (app.status === 'offered') stats.offered++;
      else if (app.status === 'accepted') stats.hired++;
      else if (app.status === 'rejected') stats.rejected++;
    });

    return stats;
  }
};
