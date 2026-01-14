import { supabase } from '../lib/supabase';

export interface SearchResult {
  id: string;
  type: 'clinic' | 'provider' | 'patient' | 'document' | 'sop' | 'job' | 'candidate' | 'launch' | 'partner';
  title: string;
  subtitle?: string;
  description?: string;
  url: string;
  metadata?: Record<string, any>;
  relevance?: number;
}

export const globalSearchService = {
  async search(query: string, filters?: {
    types?: string[];
    limit?: number;
  }): Promise<SearchResult[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const searchTerm = `%${query.toLowerCase()}%`;
    const results: SearchResult[] = [];
    const limit = filters?.limit || 50;
    const types = filters?.types || ['clinic', 'provider', 'document', 'sop', 'job', 'candidate', 'launch', 'partner'];

    try {
      if (types.includes('clinic')) {
        const { data } = await supabase
          .from('clinics')
          .select('id, name, location, type')
          .or(`name.ilike.${searchTerm},location.ilike.${searchTerm}`)
          .limit(10);

        if (data) {
          results.push(...data.map(item => ({
            id: item.id,
            type: 'clinic' as const,
            title: item.name,
            subtitle: item.location,
            description: item.type,
            url: `/intranet/clinics/${item.id}`
          })));
        }
      }

      if (types.includes('provider')) {
        const { data } = await supabase
          .from('providers')
          .select('id, full_name, specialty, clinic_id')
          .or(`full_name.ilike.${searchTerm},specialty.ilike.${searchTerm}`)
          .limit(10);

        if (data) {
          results.push(...data.map(item => ({
            id: item.id,
            type: 'provider' as const,
            title: item.full_name,
            subtitle: item.specialty,
            url: `/operations/providers/${item.id}`
          })));
        }
      }

      if (types.includes('document')) {
        const { data } = await supabase
          .from('intranet_documents')
          .select('id, title, category, author')
          .or(`title.ilike.${searchTerm},category.ilike.${searchTerm}`)
          .limit(10);

        if (data) {
          results.push(...data.map(item => ({
            id: item.id,
            type: 'document' as const,
            title: item.title,
            subtitle: item.category,
            description: `By ${item.author}`,
            url: `/intranet/documents/${item.id}`
          })));
        }
      }

      if (types.includes('sop')) {
        const { data } = await supabase
          .from('intranet_sops')
          .select('id, title, category, version')
          .or(`title.ilike.${searchTerm},category.ilike.${searchTerm}`)
          .limit(10);

        if (data) {
          results.push(...data.map(item => ({
            id: item.id,
            type: 'sop' as const,
            title: item.title,
            subtitle: item.category,
            description: `Version ${item.version}`,
            url: `/intranet/sops/${item.id}`
          })));
        }
      }

      if (types.includes('job')) {
        const { data } = await supabase
          .from('jobs')
          .select('id, title, department, location, status')
          .or(`title.ilike.${searchTerm},department.ilike.${searchTerm}`)
          .limit(10);

        if (data) {
          results.push(...data.map(item => ({
            id: item.id,
            type: 'job' as const,
            title: item.title,
            subtitle: item.department,
            description: `${item.location} - ${item.status}`,
            url: `/talent/jobs/${item.id}`
          })));
        }
      }

      if (types.includes('candidate')) {
        const { data } = await supabase
          .from('candidates')
          .select('id, name, email, current_position')
          .or(`name.ilike.${searchTerm},email.ilike.${searchTerm},current_position.ilike.${searchTerm}`)
          .limit(10);

        if (data) {
          results.push(...data.map(item => ({
            id: item.id,
            type: 'candidate' as const,
            title: item.name,
            subtitle: item.current_position,
            description: item.email,
            url: `/talent/candidates/${item.id}`
          })));
        }
      }

      if (types.includes('launch')) {
        const { data } = await supabase
          .from('clinic_launches')
          .select('id, clinic_name, launch_type, status')
          .or(`clinic_name.ilike.${searchTerm}`)
          .limit(10);

        if (data) {
          results.push(...data.map(item => ({
            id: item.id,
            type: 'launch' as const,
            title: item.clinic_name,
            subtitle: item.launch_type,
            description: item.status,
            url: `/launches/${item.id}`
          })));
        }
      }

      if (types.includes('partner')) {
        const { data } = await supabase
          .from('partner_clinics')
          .select('id, name, specialty, status')
          .or(`name.ilike.${searchTerm},specialty.ilike.${searchTerm}`)
          .limit(10);

        if (data) {
          results.push(...data.map(item => ({
            id: item.id,
            type: 'partner' as const,
            title: item.name,
            subtitle: item.specialty,
            description: item.status,
            url: `/partners/${item.id}`
          })));
        }
      }

      return results.slice(0, limit);
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  },

  async getRecentSearches(userId: string): Promise<string[]> {
    const { data } = await supabase
      .from('search_history')
      .select('query')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    return data?.map(item => item.query) || [];
  },

  async saveSearch(userId: string, query: string) {
    await supabase
      .from('search_history')
      .insert({ user_id: userId, query });
  }
};
