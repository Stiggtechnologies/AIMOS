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
  }): Promise<EvidenceClaim[]> {
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
  async getActiveRules(): Promise<ClinicalRule[]> {
    const { data, error } = await supabase
      .from('clinical_rules')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: true });

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
  }): Promise<CarePathwayTemplate[]> {
    let query = supabase.from('care_pathway_templates').select('*');

    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    } else {
      query = query.eq('is_active', true);
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
