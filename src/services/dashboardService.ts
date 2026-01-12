import { supabase } from '../lib/supabase';

export interface DashboardWidget {
  id: string;
  name: string;
  title: string;
  description?: string;
  widget_type: 'metrics' | 'tasks' | 'announcements' | 'forms' | 'reports' | 'quick_links' | 'calendar' | 'sop_quick_access';
  configuration: Record<string, any>;
  default_size: string;
  is_system: boolean;
  available_for_roles: string[];
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface UserDashboardLayout {
  id: string;
  user_id: string;
  layout_name: string;
  widgets: Array<{
    widget_id: string;
    position: { x: number; y: number; w: number; h: number };
    config?: Record<string, any>;
  }>;
  layout_config: Record<string, any>;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export const dashboardService = {
  async getAvailableWidgets(): Promise<DashboardWidget[]> {
    const { data, error } = await supabase
      .from('dashboard_widgets')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  },

  async getWidgetById(id: string): Promise<DashboardWidget> {
    const { data, error } = await supabase
      .from('dashboard_widgets')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async createWidget(widget: Partial<DashboardWidget>): Promise<DashboardWidget> {
    const { data, error } = await supabase
      .from('dashboard_widgets')
      .insert(widget)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateWidget(id: string, updates: Partial<DashboardWidget>): Promise<DashboardWidget> {
    const { data, error } = await supabase
      .from('dashboard_widgets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteWidget(id: string): Promise<void> {
    const { error } = await supabase
      .from('dashboard_widgets')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getUserLayout(userId: string, layoutName: string = 'default'): Promise<UserDashboardLayout | null> {
    const { data, error } = await supabase
      .from('user_dashboard_layouts')
      .select('*')
      .eq('user_id', userId)
      .eq('layout_name', layoutName)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getUserLayouts(userId: string): Promise<UserDashboardLayout[]> {
    const { data, error } = await supabase
      .from('user_dashboard_layouts')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('layout_name');

    if (error) throw error;
    return data || [];
  },

  async saveUserLayout(layout: Partial<UserDashboardLayout>): Promise<UserDashboardLayout> {
    const { data, error } = await supabase
      .from('user_dashboard_layouts')
      .upsert(layout)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteUserLayout(id: string): Promise<void> {
    const { error } = await supabase
      .from('user_dashboard_layouts')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async setDefaultLayout(userId: string, layoutId: string): Promise<void> {
    await supabase
      .from('user_dashboard_layouts')
      .update({ is_default: false })
      .eq('user_id', userId);

    const { error } = await supabase
      .from('user_dashboard_layouts')
      .update({ is_default: true })
      .eq('id', layoutId)
      .eq('user_id', userId);

    if (error) throw error;
  }
};
