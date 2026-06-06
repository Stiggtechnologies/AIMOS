import { supabase } from '../lib/supabase';
import type {
  MarketingChannel,
  Campaign,
  Lead,
  CampaignMetric,
  IntakePipeline,
  IntakeAction,
  IntakeOutcome,
  ReferralPartner,
  ReferralCampaign,
  ReferralMetric,
  ReferralGap,
  RevOpsMetric,
  CapacityAnalysis,
  BottleneckDetection,
  GrowthPlaybook,
  PlaybookAction,
  PlaybookMetric
} from '../types/aim-os';

export async function getMarketingChannels(clinicId?: string): Promise<MarketingChannel[]> {
  let query = supabase.from('marketing_channels').select('*').eq('is_active', true).order('created_at', { ascending: false });
  if (clinicId) {
    query = query.eq('clinic_id', clinicId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getCampaigns(clinicId?: string, status?: string): Promise<Campaign[]> {
  let query = supabase.from('campaigns').select('*').order('start_date', { ascending: false });
  if (clinicId) {
    query = query.eq('clinic_id', clinicId);
  }
  if (status) {
    query = query.eq('status', status);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getLeads(clinicId?: string, status?: string): Promise<Lead[]> {
  let query = supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(100);
  if (clinicId) {
    query = query.eq('clinic_id', clinicId);
  }
  if (status) {
    query = query.eq('status', status);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getCampaignMetrics(campaignId: string): Promise<CampaignMetric[]> {
  const { data, error } = await supabase
    .from('campaign_metrics')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('metric_date', { ascending: false })
    .limit(30);
  if (error) throw error;
  return data || [];
}

export async function getIntakePipeline(clinicId?: string, stage?: string): Promise<IntakePipeline[]> {
  let query = supabase.from('intake_pipeline').select('*').order('created_at', { ascending: false }).limit(100);
  if (clinicId) {
    query = query.eq('clinic_id', clinicId);
  }
  if (stage) {
    query = query.eq('stage', stage);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getIntakeActions(intakeId: string): Promise<IntakeAction[]> {
  const { data, error } = await supabase
    .from('intake_actions')
    .select('*')
    .eq('intake_id', intakeId)
    .order('action_date', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getIntakeOutcomes(intakeId: string): Promise<IntakeOutcome[]> {
  const { data, error } = await supabase
    .from('intake_outcomes')
    .select('*')
    .eq('intake_id', intakeId)
    .order('outcome_date', { ascending: false});
  if (error) throw error;
  return data || [];
}

export async function getReferralPartners(clinicId?: string, status?: string): Promise<ReferralPartner[]> {
  let query = supabase.from('referral_partners').select('*').order('relationship_health_score', { ascending: false });
  if (clinicId) {
    query = query.eq('preferred_clinic_id', clinicId);
  }
  if (status) {
    query = query.eq('relationship_status', status);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getReferralCampaigns(clinicId?: string): Promise<ReferralCampaign[]> {
  let query = supabase.from('referral_campaigns').select('*').order('start_date', { ascending: false });
  if (clinicId) {
    query = query.eq('clinic_id', clinicId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getReferralMetrics(partnerId: string): Promise<ReferralMetric[]> {
  const { data, error } = await supabase
    .from('referral_metrics')
    .select('*')
    .eq('partner_id', partnerId)
    .order('metric_month', { ascending: false })
    .limit(12);
  if (error) throw error;
  return data || [];
}

export async function getReferralGaps(status?: string): Promise<ReferralGap[]> {
  let query = supabase.from('referral_gaps').select('*').order('detected_at', { ascending: false });
  if (status) {
    query = query.eq('status', status);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getRevOpsMetrics(clinicId?: string): Promise<RevOpsMetric[]> {
  let query = supabase.from('revops_metrics').select('*').order('metric_date', { ascending: false }).limit(30);
  if (clinicId) {
    query = query.eq('clinic_id', clinicId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getCapacityAnalysis(clinicId?: string): Promise<CapacityAnalysis[]> {
  let query = supabase.from('capacity_analysis').select('*').order('analysis_date', { ascending: false }).limit(30);
  if (clinicId) {
    query = query.eq('clinic_id', clinicId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getBottleneckDetections(clinicId?: string, status?: string): Promise<BottleneckDetection[]> {
  let query = supabase.from('bottleneck_detection').select('*').order('detection_date', { ascending: false });
  if (clinicId) {
    query = query.eq('clinic_id', clinicId);
  }
  if (status) {
    query = query.eq('status', status);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getGrowthPlaybooks(clinicId?: string, status?: string): Promise<GrowthPlaybook[]> {
  let query = supabase.from('growth_playbooks').select('*').order('created_at', { ascending: false });
  if (clinicId) {
    query = query.eq('clinic_id', clinicId);
  }
  if (status) {
    query = query.eq('status', status);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getPlaybookActions(playbookId: string): Promise<PlaybookAction[]> {
  const { data, error } = await supabase
    .from('playbook_actions')
    .select('*')
    .eq('playbook_id', playbookId)
    .order('due_date', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getPlaybookMetrics(playbookId: string): Promise<PlaybookMetric[]> {
  const { data, error } = await supabase
    .from('playbook_metrics')
    .select('*')
    .eq('playbook_id', playbookId)
    .order('metric_date', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getPipelineStats(clinicId?: string) {
  const leads = await getLeads(clinicId);
  const intake = await getIntakePipeline(clinicId);

  return {
    totalLeads: leads.length,
    newLeads: leads.filter(l => l.status === 'new').length,
    qualifiedLeads: leads.filter(l => l.status === 'qualified').length,
    convertedLeads: leads.filter(l => l.status === 'converted').length,
    totalIntakes: intake.length,
    leadInStage: intake.filter(i => i.stage === 'lead_in').length,
    contactedStage: intake.filter(i => i.stage === 'contacted').length,
    bookedStage: intake.filter(i => i.stage === 'booked').length,
    attendedStage: intake.filter(i => i.stage === 'attended').length,
  };
}

export async function getMarketingStats(clinicId?: string) {
  const campaigns = await getCampaigns(clinicId, 'active');
  const leads = await getLeads(clinicId);

  let totalSpend = 0;
  let totalLeads = leads.length;

  campaigns.forEach(c => {
    totalSpend += c.spent_to_date || 0;
  });

  const costPerLead = totalLeads > 0 ? totalSpend / totalLeads : 0;

  return {
    activeCampaigns: campaigns.length,
    totalSpend,
    totalLeads,
    costPerLead,
    channelCount: (await getMarketingChannels(clinicId)).length,
  };
}
