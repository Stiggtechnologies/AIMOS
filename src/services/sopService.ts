import { supabase } from '../lib/supabase';

export interface SOPCategory {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  department?: string;
  icon?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SOP {
  id: string;
  sop_number: string;
  title: string;
  category_id?: string;
  category?: SOPCategory;
  purpose?: string;
  scope?: string;
  owner_id?: string;
  owner?: any;
  status: 'draft' | 'review' | 'approved' | 'archived';
  current_version_id?: string;
  current_version?: SOPVersion;
  requires_review: boolean;
  review_frequency_days: number;
  next_review_date?: string;
  applicable_roles: string[];
  applicable_clinics: string[];
  tags: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface SOPVersion {
  id: string;
  sop_id: string;
  version_number: string;
  content: string;
  change_summary?: string;
  attachments: Array<{ name: string; url: string }>;
  approved_by?: string;
  approved_at?: string;
  effective_date?: string;
  created_by: string;
  creator?: any;
  created_at: string;
}

export interface SOPReview {
  id: string;
  sop_id: string;
  version_id?: string;
  reviewer_id: string;
  reviewer?: any;
  reviewed_at: string;
  acknowledged: boolean;
  feedback?: string;
}

export const sopService = {
  async getCategories(): Promise<SOPCategory[]> {
    const { data, error } = await supabase
      .from('sop_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .order('name');

    if (error) throw error;
    return data || [];
  },

  async createCategory(category: Partial<SOPCategory>): Promise<SOPCategory> {
    const { data, error } = await supabase
      .from('sop_categories')
      .insert(category)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateCategory(id: string, updates: Partial<SOPCategory>): Promise<SOPCategory> {
    const { data, error } = await supabase
      .from('sop_categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getAllSOPs(): Promise<SOP[]> {
    const { data, error } = await supabase
      .from('sops')
      .select(`
        *,
        category:sop_categories(*),
        owner:user_profiles(id, first_name, last_name, email)
      `)
      .order('sop_number');

    if (error) throw error;
    return data || [];
  },

  async getSOPById(id: string): Promise<SOP> {
    const { data, error } = await supabase
      .from('sops')
      .select(`
        *,
        category:sop_categories(*),
        owner:user_profiles(id, first_name, last_name, email),
        current_version:sop_versions!sops_current_version_id_fkey(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async createSOP(sop: Partial<SOP>): Promise<SOP> {
    const sopNumber = `SOP-${Date.now()}`;
    const { data, error } = await supabase
      .from('sops')
      .insert({ ...sop, sop_number: sopNumber })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateSOP(id: string, updates: Partial<SOP>): Promise<SOP> {
    const { data, error } = await supabase
      .from('sops')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteSOP(id: string): Promise<void> {
    const { error } = await supabase
      .from('sops')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getVersions(sopId: string): Promise<SOPVersion[]> {
    const { data, error } = await supabase
      .from('sop_versions')
      .select(`
        *,
        creator:user_profiles(id, first_name, last_name, email)
      `)
      .eq('sop_id', sopId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createVersion(version: Partial<SOPVersion>): Promise<SOPVersion> {
    const { data: existingVersions } = await supabase
      .from('sop_versions')
      .select('version_number')
      .eq('sop_id', version.sop_id!)
      .order('version_number', { ascending: false })
      .limit(1);

    const lastVersion = existingVersions?.[0]?.version_number || '0.0';
    const [major, minor] = lastVersion.split('.').map(Number);
    const newVersion = `${major}.${minor + 1}`;

    const { data, error } = await supabase
      .from('sop_versions')
      .insert({ ...version, version_number: newVersion })
      .select()
      .single();

    if (error) throw error;

    await supabase
      .from('sops')
      .update({ current_version_id: data.id })
      .eq('id', version.sop_id!);

    return data;
  },

  async approveVersion(versionId: string, approverId: string): Promise<SOPVersion> {
    const { data, error } = await supabase
      .from('sop_versions')
      .update({
        approved_by: approverId,
        approved_at: new Date().toISOString(),
        effective_date: new Date().toISOString()
      })
      .eq('id', versionId)
      .select()
      .single();

    if (error) throw error;

    await supabase
      .from('sops')
      .update({ status: 'approved' })
      .eq('current_version_id', versionId);

    return data;
  },

  async getReviews(sopId: string): Promise<SOPReview[]> {
    const { data, error } = await supabase
      .from('sop_reviews')
      .select(`
        *,
        reviewer:user_profiles(id, first_name, last_name, email)
      `)
      .eq('sop_id', sopId)
      .order('reviewed_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createReview(review: Partial<SOPReview>): Promise<SOPReview> {
    const { data, error } = await supabase
      .from('sop_reviews')
      .insert(review)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async searchSOPs(query: string): Promise<SOP[]> {
    const { data, error } = await supabase
      .from('sops')
      .select(`
        *,
        category:sop_categories(*),
        owner:user_profiles(id, first_name, last_name, email)
      `)
      .or(`title.ilike.%${query}%,sop_number.ilike.%${query}%,purpose.ilike.%${query}%`)
      .eq('status', 'approved');

    if (error) throw error;
    return data || [];
  }
};
