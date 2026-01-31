import { supabase } from '../lib/supabase';

export type ClinicalDomain =
  | 'spine_mdt'
  | 'acl'
  | 'concussion'
  | 'chronic_pain'
  | 'neuro'
  | 'tendon'
  | 'shoulder'
  | 'hip_groin'
  | 'pediatric_msk'
  | 'general_msk';

export type AuthorityType =
  | 'institute'
  | 'consensus_group'
  | 'guideline_body'
  | 'journal';

export interface EvidenceAuthority {
  authority_id: string;
  domain: ClinicalDomain;
  authority_name: string;
  authority_type: AuthorityType;
  description: string;
  primary_scope: string;
  geographic_scope: string;
  update_cycle_months: number | null;
  credibility_level: number;
  website_url: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

export interface DomainFilterOptions {
  domain?: ClinicalDomain;
  authority_id?: string;
  include_claims?: boolean;
  include_rules?: boolean;
  include_pathways?: boolean;
}

class EvidenceAuthorityService {
  async getAllAuthorities(): Promise<EvidenceAuthority[]> {
    const { data, error } = await supabase
      .from('evidence_authorities')
      .select('*')
      .eq('is_active', true)
      .order('domain', { ascending: true })
      .order('credibility_level', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getAuthoritiesByDomain(domain: ClinicalDomain): Promise<EvidenceAuthority[]> {
    const { data, error } = await supabase
      .from('evidence_authorities')
      .select('*')
      .eq('domain', domain)
      .eq('is_active', true)
      .order('credibility_level', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getAuthorityById(authorityId: string): Promise<EvidenceAuthority | null> {
    const { data, error } = await supabase
      .from('evidence_authorities')
      .select('*')
      .eq('authority_id', authorityId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async getDomainList(): Promise<ClinicalDomain[]> {
    const domains: ClinicalDomain[] = [
      'spine_mdt',
      'acl',
      'concussion',
      'chronic_pain',
      'neuro',
      'tendon',
      'shoulder',
      'hip_groin',
      'pediatric_msk',
      'general_msk'
    ];
    return domains;
  }

  async getResearchSourcesByDomain(domain: ClinicalDomain) {
    const { data, error } = await supabase
      .from('research_sources')
      .select(`
        *,
        evidence_authorities!inner (
          authority_id,
          authority_name,
          domain,
          credibility_level
        )
      `)
      .eq('evidence_authorities.domain', domain)
      .eq('evidence_authorities.is_active', true);

    if (error) throw error;
    return data || [];
  }

  async getClinicalRulesByDomain(domain: ClinicalDomain) {
    const { data, error } = await supabase
      .from('clinical_rules')
      .select('*')
      .eq('domain', domain)
      .eq('is_active', true);

    if (error) throw error;
    return data || [];
  }

  async getCarePathwaysByDomain(domain: ClinicalDomain) {
    const { data, error } = await supabase
      .from('care_pathway_templates')
      .select('*')
      .eq('domain', domain)
      .eq('is_active', true);

    if (error) throw error;
    return data || [];
  }

  async filterByDomain(options: DomainFilterOptions) {
    const results: any = {
      authorities: [],
      research_sources: [],
      clinical_rules: [],
      care_pathways: []
    };

    if (!options.domain) {
      return results;
    }

    results.authorities = await this.getAuthoritiesByDomain(options.domain);

    if (options.include_claims) {
      results.research_sources = await this.getResearchSourcesByDomain(options.domain);
    }

    if (options.include_rules) {
      results.clinical_rules = await this.getClinicalRulesByDomain(options.domain);
    }

    if (options.include_pathways) {
      results.care_pathways = await this.getCarePathwaysByDomain(options.domain);
    }

    return results;
  }

  getDomainDisplayName(domain: ClinicalDomain): string {
    const displayNames: Record<ClinicalDomain, string> = {
      'spine_mdt': 'MDT / Spine',
      'acl': 'ACL',
      'concussion': 'Concussion',
      'chronic_pain': 'Chronic Pain',
      'neuro': 'Neuro',
      'tendon': 'Tendon',
      'shoulder': 'Shoulder',
      'hip_groin': 'Hip & Groin',
      'pediatric_msk': 'Pediatric MSK',
      'general_msk': 'General MSK'
    };
    return displayNames[domain];
  }

  async linkResearchSourceToAuthority(
    sourceId: string,
    authorityId: string
  ): Promise<void> {
    const { error } = await supabase
      .from('research_sources')
      .update({ authority_id: authorityId })
      .eq('source_id', sourceId);

    if (error) throw error;
  }

  async setRuleDomain(ruleId: string, domain: ClinicalDomain): Promise<void> {
    const { error } = await supabase
      .from('clinical_rules')
      .update({ domain })
      .eq('rule_id', ruleId);

    if (error) throw error;
  }

  async setPathwayDomain(pathwayId: string, domain: ClinicalDomain): Promise<void> {
    const { error } = await supabase
      .from('care_pathway_templates')
      .update({ domain })
      .eq('pathway_id', pathwayId);

    if (error) throw error;
  }
}

export const evidenceAuthorityService = new EvidenceAuthorityService();
