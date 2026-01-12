import { supabase } from '../lib/supabase';

export interface CredentialType {
  id: string;
  type_name: string;
  type_enum: 'professional_license' | 'board_certification' | 'cpr_certification' | 'liability_insurance' |
    'malpractice_insurance' | 'npi' | 'dea' | 'education' | 'accreditation' | 'business_license' |
    'facility_privileges' | 'other';
  description?: string;
  is_required: boolean;
  renewal_frequency_days?: number;
  required_for_roles: string[];
  verification_required: boolean;
  issuing_authorities: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Credential {
  id: string;
  staff_id: string;
  staff?: any;
  credential_type_id: string;
  credential_type?: CredentialType;
  credential_number?: string;
  issuing_authority: string;
  issue_date?: string;
  expiry_date?: string;
  renewal_date?: string;
  status: 'active' | 'expired' | 'suspended' | 'revoked' | 'pending_renewal' | 'under_review';
  document_url?: string;
  verification_status: 'not_verified' | 'verified' | 'failed' | 'pending';
  verified_by?: string;
  verified_at?: string;
  scope_of_practice?: string;
  restrictions?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CredentialAlert {
  id: string;
  credential_id: string;
  credential?: Credential;
  staff_id: string;
  staff?: any;
  alert_type: string;
  severity: 'info' | 'warning' | 'critical' | 'urgent';
  risk_score: number;
  alert_message: string;
  days_until_expiry?: number;
  recommended_actions: string[];
  is_acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
  resolved: boolean;
  resolved_at?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AdverseAction {
  id: string;
  staff_id: string;
  staff?: any;
  credential_id?: string;
  credential?: Credential;
  action_type: 'suspension' | 'revocation' | 'restriction' | 'probation' | 'fine' | 'reprimand';
  issuing_authority: string;
  action_date: string;
  effective_date?: string;
  resolution_date?: string;
  status: string;
  severity: string;
  description: string;
  impact_on_practice?: string;
  corrective_actions: Array<{ action: string; completed: boolean }>;
  reported_by?: string;
  document_urls: string[];
  is_public: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export const credentialsService = {
  async getCredentialTypes(): Promise<CredentialType[]> {
    const { data, error } = await supabase
      .from('ops_credential_types')
      .select('*')
      .eq('is_active', true)
      .order('type_name');

    if (error) throw error;
    return data || [];
  },

  async createCredentialType(type: Partial<CredentialType>): Promise<CredentialType> {
    const { data, error } = await supabase
      .from('ops_credential_types')
      .insert(type)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getCredentials(staffId?: string): Promise<Credential[]> {
    let query = supabase
      .from('ops_credentials')
      .select(`
        *,
        staff:staff_profiles(id, user:user_profiles(first_name, last_name, email), job_title),
        credential_type:ops_credential_types(*)
      `)
      .order('expiry_date');

    if (staffId) {
      query = query.eq('staff_id', staffId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  async getCredentialById(id: string): Promise<Credential> {
    const { data, error } = await supabase
      .from('ops_credentials')
      .select(`
        *,
        staff:staff_profiles(id, user:user_profiles(first_name, last_name, email), job_title),
        credential_type:ops_credential_types(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async createCredential(credential: Partial<Credential>): Promise<Credential> {
    const { data, error } = await supabase
      .from('ops_credentials')
      .insert(credential)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateCredential(id: string, updates: Partial<Credential>): Promise<Credential> {
    const { data, error } = await supabase
      .from('ops_credentials')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getCredentialAlerts(staffId?: string, resolved?: boolean): Promise<CredentialAlert[]> {
    let query = supabase
      .from('ops_credential_alerts')
      .select(`
        *,
        credential:ops_credentials(
          *,
          credential_type:ops_credential_types(*)
        ),
        staff:staff_profiles(id, user:user_profiles(first_name, last_name, email))
      `)
      .order('severity')
      .order('created_at', { ascending: false });

    if (staffId) {
      query = query.eq('staff_id', staffId);
    }

    if (resolved !== undefined) {
      query = query.eq('resolved', resolved);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  async createCredentialAlert(alert: Partial<CredentialAlert>): Promise<CredentialAlert> {
    const { data, error } = await supabase
      .from('ops_credential_alerts')
      .insert(alert)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async acknowledgeAlert(id: string, userId: string): Promise<CredentialAlert> {
    const { data, error } = await supabase
      .from('ops_credential_alerts')
      .update({
        is_acknowledged: true,
        acknowledged_by: userId,
        acknowledged_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async resolveAlert(id: string): Promise<CredentialAlert> {
    const { data, error } = await supabase
      .from('ops_credential_alerts')
      .update({
        resolved: true,
        resolved_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getAdverseActions(staffId?: string): Promise<AdverseAction[]> {
    let query = supabase
      .from('ops_adverse_actions')
      .select(`
        *,
        staff:staff_profiles(id, user:user_profiles(first_name, last_name, email)),
        credential:ops_credentials(*, credential_type:ops_credential_types(*))
      `)
      .order('action_date', { ascending: false });

    if (staffId) {
      query = query.eq('staff_id', staffId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  async createAdverseAction(action: Partial<AdverseAction>): Promise<AdverseAction> {
    const { data, error } = await supabase
      .from('ops_adverse_actions')
      .insert(action)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  calculateCredentialRisk(credential: Credential): { risk_score: number; alert_type: string; severity: 'info' | 'warning' | 'critical' | 'urgent'; message: string } {
    let risk = 0;
    let alertType = 'expiry';
    let severity: 'info' | 'warning' | 'critical' | 'urgent' = 'info';
    let message = '';

    if (!credential.expiry_date) {
      return { risk_score: 0, alert_type: 'no_expiry', severity: 'info', message: 'No expiry date set' };
    }

    const today = new Date();
    const expiryDate = new Date(credential.expiry_date);
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      risk = 100;
      severity = 'urgent';
      alertType = 'expired';
      message = `Credential expired ${Math.abs(daysUntilExpiry)} days ago`;
    } else if (daysUntilExpiry <= 30) {
      risk = 75;
      severity = 'critical';
      alertType = 'expiring_soon';
      message = `Credential expires in ${daysUntilExpiry} days`;
    } else if (daysUntilExpiry <= 60) {
      risk = 50;
      severity = 'warning';
      alertType = 'expiring_soon';
      message = `Credential expires in ${daysUntilExpiry} days`;
    } else if (daysUntilExpiry <= 90) {
      risk = 25;
      severity = 'info';
      alertType = 'renewal_reminder';
      message = `Credential expires in ${daysUntilExpiry} days`;
    }

    if (credential.verification_status === 'failed') {
      risk += 30;
      if (severity === 'info') severity = 'warning';
    }

    if (credential.credential_type?.is_required) {
      risk = Math.min(risk * 1.5, 100);
      if (daysUntilExpiry < 0 && severity !== 'urgent') severity = 'critical';
    }

    return {
      risk_score: Math.round(risk),
      alert_type: alertType,
      severity,
      message
    };
  },

  async generateAlertsForCredential(credential: Credential): Promise<CredentialAlert | null> {
    const risk = this.calculateCredentialRisk(credential);

    if (risk.risk_score === 0) return null;

    const existingAlerts = await supabase
      .from('ops_credential_alerts')
      .select('id')
      .eq('credential_id', credential.id)
      .eq('resolved', false)
      .maybeSingle();

    if (existingAlerts.data) return null;

    const recommendedActions = [];
    if (risk.alert_type === 'expired') {
      recommendedActions.push('Upload renewed credential immediately');
      recommendedActions.push('Contact issuing authority for renewal');
      recommendedActions.push('Suspend clinical privileges if required');
    } else if (risk.severity === 'critical') {
      recommendedActions.push('Begin renewal process immediately');
      recommendedActions.push('Upload documentation when available');
    } else {
      recommendedActions.push('Plan for credential renewal');
      recommendedActions.push('Gather required documentation');
    }

    return await this.createCredentialAlert({
      credential_id: credential.id,
      staff_id: credential.staff_id,
      alert_type: risk.alert_type,
      severity: risk.severity,
      risk_score: risk.risk_score,
      alert_message: risk.message,
      days_until_expiry: credential.expiry_date
        ? Math.ceil((new Date(credential.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : undefined,
      recommended_actions: recommendedActions,
      metadata: {}
    });
  },

  async runAlertGeneration(): Promise<{ created: number; skipped: number }> {
    const credentials = await this.getCredentials();
    let created = 0;
    let skipped = 0;

    for (const credential of credentials) {
      try {
        const alert = await this.generateAlertsForCredential(credential);
        if (alert) {
          created++;
        } else {
          skipped++;
        }
      } catch (error) {
        console.error(`Error generating alert for credential ${credential.id}:`, error);
        skipped++;
      }
    }

    return { created, skipped };
  }
};
