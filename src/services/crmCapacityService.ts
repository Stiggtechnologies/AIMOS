import { supabase } from '../lib/supabase';

export interface CapacitySnapshot {
  id: string;
  clinic_id: string;
  snapshot_date: string;
  total_slots: number;
  booked_slots: number;
  available_slots: number;
  capacity_percent: number;
  high_clv_slots: number;
  medium_clv_slots: number;
  low_clv_slots: number;
  created_at: string;
}

export interface CapacityRule {
  id: string;
  clinic_id: string;
  rule_name: string;
  rule_type: string;
  condition_field: string;
  condition_operator: string;
  condition_value: number;
  action_target?: string;
  action_value?: string;
  priority: number;
  active: boolean;
  created_at: string;
}

export interface CapacityStatus {
  status: 'green' | 'yellow' | 'red';
  capacity_percent: number;
  message: string;
  should_throttle: boolean;
}

export const crmCapacityService = {
  async getCapacitySnapshots(clinic_id: string, days: number = 14): Promise<CapacitySnapshot[]> {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const { data, error } = await supabase
      .from('crm_capacity_snapshots')
      .select('*')
      .eq('clinic_id', clinic_id)
      .gte('snapshot_date', startDate.toISOString().split('T')[0])
      .lte('snapshot_date', endDate.toISOString().split('T')[0])
      .order('snapshot_date');

    if (error) throw error;
    return data || [];
  },

  async getCurrentCapacity(clinic_id: string): Promise<CapacitySnapshot | null> {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('crm_capacity_snapshots')
      .select('*')
      .eq('clinic_id', clinic_id)
      .eq('snapshot_date', today)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getCapacityStatus(clinic_id: string): Promise<CapacityStatus> {
    const capacity = await this.getCurrentCapacity(clinic_id);

    if (!capacity) {
      return {
        status: 'green',
        capacity_percent: 0,
        message: 'No capacity data available',
        should_throttle: false,
      };
    }

    const percent = capacity.capacity_percent;

    if (percent < 70) {
      return {
        status: 'green',
        capacity_percent: percent,
        message: 'Good capacity - scale marketing',
        should_throttle: false,
      };
    } else if (percent < 85) {
      return {
        status: 'yellow',
        capacity_percent: percent,
        message: 'Moderate capacity - hold spend',
        should_throttle: false,
      };
    } else {
      return {
        status: 'red',
        capacity_percent: percent,
        message: 'High capacity - throttle low-CLV campaigns',
        should_throttle: true,
      };
    }
  },

  async getCapacityRules(clinic_id?: string): Promise<CapacityRule[]> {
    let query = supabase
      .from('crm_capacity_rules')
      .select('*')
      .eq('active', true)
      .order('priority');

    if (clinic_id) {
      query = query.eq('clinic_id', clinic_id);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async createCapacityRule(rule: Partial<CapacityRule>): Promise<CapacityRule> {
    const { data, error } = await supabase
      .from('crm_capacity_rules')
      .insert([rule])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateCapacityRule(id: string, updates: Partial<CapacityRule>): Promise<CapacityRule> {
    const { data, error } = await supabase
      .from('crm_capacity_rules')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteCapacityRule(id: string): Promise<void> {
    const { error } = await supabase
      .from('crm_capacity_rules')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getCapacityTimeline(clinic_id: string, days: number = 28): Promise<CapacitySnapshot[]> {
    return this.getCapacitySnapshots(clinic_id, days);
  },

  async evaluateRules(clinic_id: string): Promise<{
    triggered_rules: CapacityRule[];
    actions: Array<{ rule: string; action: string; target: string }>;
  }> {
    const capacity = await this.getCurrentCapacity(clinic_id);
    const rules = await this.getCapacityRules(clinic_id);

    if (!capacity) {
      return { triggered_rules: [], actions: [] };
    }

    const triggered: CapacityRule[] = [];
    const actions: Array<{ rule: string; action: string; target: string }> = [];

    for (const rule of rules) {
      let shouldTrigger = false;
      const fieldValue = capacity.capacity_percent;

      switch (rule.condition_operator) {
        case '<':
          shouldTrigger = fieldValue < rule.condition_value;
          break;
        case '<=':
          shouldTrigger = fieldValue <= rule.condition_value;
          break;
        case '>':
          shouldTrigger = fieldValue > rule.condition_value;
          break;
        case '>=':
          shouldTrigger = fieldValue >= rule.condition_value;
          break;
        case '=':
          shouldTrigger = fieldValue === rule.condition_value;
          break;
      }

      if (shouldTrigger) {
        triggered.push(rule);
        actions.push({
          rule: rule.rule_name,
          action: rule.rule_type,
          target: `${rule.action_target}: ${rule.action_value}`,
        });
      }
    }

    return { triggered_rules: triggered, actions };
  }
};
