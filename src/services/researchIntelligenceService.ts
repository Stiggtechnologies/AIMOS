import { supabase } from '../lib/supabase';

export interface EvidenceClaim {
  claim_id: string;
  source_id: string;
  claim_text: string;
  effect_direction: 'benefit' | 'no_difference' | 'harm' | 'uncertain';
  outcomes: string[];
  population: Record<string, any>;
  evidence_level: string;
  clinical_tags: string[];
  confidence_score: number;
  status: string;
}

export interface ClinicalRule {
  rule_id: string;
  rule_name: string;
  trigger: Record<string, any>;
  recommendation_text: string;
  patient_explanation_text: string;
  safety_notes?: string;
  priority: number;
  is_active: boolean;
}

export interface PatientEducationAsset {
  asset_id: string;
  title: string;
  reading_level: number;
  topic_tags: string[];
  content_md: string;
  is_active: boolean;
}

export interface CarePathwayTemplate {
  pathway_id: string;
  name: string;
  intended_population: Record<string, any>;
  phases: Record<string, any>;
  visit_guidance: Record<string, any>;
  home_program_guidance: Record<string, any>;
  is_active: boolean;
}

class ResearchIntelligenceService {
  /**
   * Search evidence claims by various criteria
   */
  async searchClaims(filters: {
    tags?: string[];
    region?: string;
    acuity?: string;
    evidenceLevel?: string;
    status?: string;
    domain?: string;
  }): Promise<EvidenceClaim[]> {
    // If domain filter is specified, join with research_sources and evidence_authorities
    if (filters.domain) {
      const { data, error } = await supabase
        .from('evidence_claims')
        .select(`
          *,
          research_sources!inner(
            id,
            evidence_authorities!inner(
              domain
            )
          )
        `)
        .eq('research_sources.evidence_authorities.domain', filters.domain)
        .eq('status', filters.status || 'approved')
        .order('confidence_score', { ascending: false });

      if (error) {
        console.error('Error searching claims with domain filter:', error);
        return [];
      }

      return (data || []).map((item: any) => {
        const { research_sources, ...claim } = item;
        return claim;
      });
    }

    // Default query without domain filter
    let query = supabase
      .from('evidence_claims')
      .select('*');

    if (filters.tags && filters.tags.length > 0) {
      query = query.contains('clinical_tags', filters.tags);
    }

    if (filters.region) {
      query = query.filter('population', 'cs', { region: filters.region });
    }

    if (filters.evidenceLevel) {
      query = query.eq('evidence_level', filters.evidenceLevel);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    } else {
      query = query.eq('status', 'approved');
    }

    const { data, error } = await query.order('confidence_score', { ascending: false });

    if (error) {
      console.error('Error searching claims:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get all active clinical rules
   */
  async getActiveRules(domain?: string): Promise<ClinicalRule[]> {
    let query = supabase
      .from('clinical_rules')
      .select('*')
      .eq('is_active', true);

    if (domain) {
      query = query.eq('domain', domain);
    }

    const { data, error } = await query.order('priority', { ascending: true });

    if (error) {
      console.error('Error fetching rules:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Evaluate rules against patient data
   */
  evaluateRules(rules: ClinicalRule[], patientContext: Record<string, any>) {
    const triggeredRules = rules.filter(rule => {
      return this.evaluateJSONLogic(rule.trigger, patientContext);
    });

    return triggeredRules.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Simple JSONLogic evaluator
   */
  private evaluateJSONLogic(logic: Record<string, any>, context: Record<string, any>): boolean {
    if (!logic || typeof logic !== 'object') {
      return false;
    }

    const keys = Object.keys(logic);

    if (keys.includes('==')) {
      const [path, value] = logic['=='] as any[];
      return this.getContextValue(path, context) === value;
    }

    if (keys.includes('!=')) {
      const [path, value] = logic['!='] as any[];
      return this.getContextValue(path, context) !== value;
    }

    if (keys.includes('>')) {
      const [path, value] = logic['>'] as any[];
      return this.getContextValue(path, context) > value;
    }

    if (keys.includes('>=')) {
      const [path, value] = logic['>='] as any[];
      return this.getContextValue(path, context) >= value;
    }

    if (keys.includes('<')) {
      const [path, value] = logic['<'] as any[];
      return this.getContextValue(path, context) < value;
    }

    if (keys.includes('<=')) {
      const [path, value] = logic['<='] as any[];
      return this.getContextValue(path, context) <= value;
    }

    if (keys.includes('in')) {
      const [path, values] = logic['in'] as any[];
      return (values || []).includes(this.getContextValue(path, context));
    }

    if (keys.includes('and')) {
      return (logic['and'] as any[]).every(condition =>
        this.evaluateJSONLogic(condition, context)
      );
    }

    if (keys.includes('or')) {
      return (logic['or'] as any[]).some(condition =>
        this.evaluateJSONLogic(condition, context)
      );
    }

    return false;
  }

  /**
   * Extract value from context using var notation
   */
  private getContextValue(varPath: Record<string, any>, context: Record<string, any>): any {
    if (varPath?.var) {
      return context[varPath.var];
    }
    return null;
  }

  /**
   * Get care pathway templates
   */
  async getPathways(filters?: {
    region?: string;
    isActive?: boolean;
    domain?: string;
  }): Promise<CarePathwayTemplate[]> {
    let query = supabase.from('care_pathway_templates').select('*');

    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    } else {
      query = query.eq('is_active', true);
    }

    if (filters?.domain) {
      query = query.eq('domain', filters.domain);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching pathways:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get patient education assets
   */
  async getEducationAssets(filters?: {
    readingLevel?: number;
    topicTags?: string[];
    domain?: string;
  }): Promise<PatientEducationAsset[]> {
    let query = supabase
      .from('patient_education_assets')
      .select('*')
      .eq('is_active', true);

    if (filters?.readingLevel) {
      query = query.eq('reading_level', filters.readingLevel);
    }

    if (filters?.topicTags && filters.topicTags.length > 0) {
      query = query.contains('topic_tags', filters.topicTags);
    }

    // Filter by domain - check if domain name is in topic_tags or title
    if (filters?.domain) {
      // For now, we'll filter client-side since education assets use topic tags
      // In future, could add a domain column to patient_education_assets table
      const { data, error } = await query;

      if (error) {
        console.error('Error fetching education assets:', error);
        return [];
      }

      // Match by domain-specific keywords in title or tags
      const domainKeywords: Record<string, string[]> = {
        'chronic_pain': ['pain', 'chronic', 'pacing', 'flare', 'stress', 'sleep'],
        'acl': ['acl', 'strength', 'landing', 'sport', 'hop', 'knee'],
        'neuro': ['neuro', 'repetition', 'balance', 'fatigue', 'gait', 'walking', 'stroke', 'falls']
      };

      const keywords = domainKeywords[filters.domain] || [];
      return (data || []).filter(asset => {
        const titleLower = asset.title.toLowerCase();
        const tags = asset.topic_tags || [];
        return keywords.some(keyword =>
          titleLower.includes(keyword) ||
          tags.some((tag: string) => tag.toLowerCase().includes(keyword))
        );
      });
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching education assets:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get claim citations for traceability
   */
  async getClaimCitations(claimId: string) {
    const { data, error } = await supabase
      .from('claim_citations')
      .select('*')
      .eq('claim_id', claimId);

    if (error) {
      console.error('Error fetching citations:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Create an evidence job for ingestion/extraction
   */
  async createEvidenceJob(sourceId: string, jobType: string) {
    const { data, error } = await supabase
      .from('evidence_jobs')
      .insert({
        source_id: sourceId,
        job_type: jobType,
        status: 'queued'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating evidence job:', error);
      return null;
    }

    return data;
  }

  /**
   * Get version sets to track external updates
   */
  async getVersionSets() {
    const { data, error } = await supabase
      .from('evidence_version_sets')
      .select('*')
      .order('release_date', { ascending: false });

    if (error) {
      console.error('Error fetching version sets:', error);
      return [];
    }

    return data || [];
  }
}

export const researchIntelligenceService = new ResearchIntelligenceService();
