import { supabase } from '../lib/supabase';
import { agentExecutionService } from './agentExecutionService';

export interface ResearchPaper {
  id: string;
  title: string;
  authors: string[];
  publication_date: string;
  doi?: string;
  abstract: string;
  study_type: string;
  quality_score: number;
  sample_size?: number;
  conditions: string[];
  interventions: string[];
  clinical_relevance: number;
  operational_relevance: number;
  ai_summary: string;
  ingested_at: string;
}

export interface EvidenceSynthesis {
  id: string;
  query_text: string;
  executive_summary: string;
  clinical_relevance_summary: string;
  operational_relevance_summary: string;
  evidence_quality: string;
  consensus_level: string;
  confidence_score: number;
  recommendation: string;
  created_at: string;
}

export interface PracticeTranslation {
  id: string;
  change_type: string;
  change_title: string;
  change_description: string;
  expected_outcome_improvement: string;
  implementation_complexity: string;
  status: string;
  proposed_at: string;
}

export interface ResearchOutcome {
  id: string;
  measurement_period: string;
  avg_visits_per_case: number;
  avg_days_to_rtw: number;
  claim_acceptance_rate: number;
  cases_measured: number;
  impact_status: string;
  impact_summary: string;
  measurement_date: string;
}

class ClinicalIntelligenceService {
  async getDashboardMetrics() {
    const { data, error } = await supabase
      .rpc('get_cii_dashboard_metrics');

    if (error) {
      console.error('Error loading CII dashboard metrics:', error);
      return null;
    }

    return data;
  }

  async getRecentPapers(limit = 10): Promise<ResearchPaper[]> {
    const { data, error } = await supabase
      .from('research_papers')
      .select('*')
      .eq('ingestion_status', 'processed')
      .order('publication_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error loading research papers:', error);
      return [];
    }

    return data || [];
  }

  async queryEvidence(queryText: string, userId: string): Promise<EvidenceSynthesis | null> {
    try {
      const result = await agentExecutionService.executeAgent({
        agentSlug: 'evidence-synthesis-agent',
        userInput: queryText,
        userId
      });

      const synthesisData = {
        query_text: queryText,
        query_by: userId,
        executive_summary: result.recommendation || 'Evidence synthesis in progress',
        clinical_relevance_summary: result.rationale || '',
        operational_relevance_summary: '',
        evidence_quality: result.confidence_score >= 80 ? 'strong' : result.confidence_score >= 60 ? 'moderate' : 'weak',
        consensus_level: result.confidence_score >= 85 ? 'strong_consensus' : 'moderate_consensus',
        confidence_score: result.confidence_score,
        recommendation: result.recommendation,
        status: 'published'
      };

      const { data: synthesis, error } = await supabase
        .from('evidence_syntheses')
        .insert(synthesisData)
        .select()
        .single();

      if (error) {
        console.error('Error saving evidence synthesis:', error);
        return null;
      }

      await supabase
        .from('research_queries')
        .insert({
          query_text: queryText,
          requested_by: userId,
          synthesis_id: synthesis.id,
          response_text: result.recommendation
        });

      return synthesis;
    } catch (error: any) {
      console.error('Error querying evidence:', error);
      return null;
    }
  }

  async getEvidenceSyntheses(limit = 20): Promise<EvidenceSynthesis[]> {
    const { data, error } = await supabase
      .from('evidence_syntheses')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error loading evidence syntheses:', error);
      return [];
    }

    return data || [];
  }

  async getPendingTranslations(): Promise<PracticeTranslation[]> {
    const { data, error } = await supabase
      .from('practice_translations')
      .select('*')
      .eq('status', 'proposed')
      .order('proposed_at', { ascending: false });

    if (error) {
      console.error('Error loading practice translations:', error);
      return [];
    }

    return data || [];
  }

  async approveTranslation(translationId: string, reviewerId: string, notes?: string): Promise<boolean> {
    const { error } = await supabase
      .from('practice_translations')
      .update({
        status: 'approved',
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
        reviewer_notes: notes
      })
      .eq('id', translationId);

    if (error) {
      console.error('Error approving translation:', error);
      return false;
    }

    return true;
  }

  async rejectTranslation(translationId: string, reviewerId: string, notes: string): Promise<boolean> {
    const { error } = await supabase
      .from('practice_translations')
      .update({
        status: 'rejected',
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
        reviewer_notes: notes
      })
      .eq('id', translationId);

    if (error) {
      console.error('Error rejecting translation:', error);
      return false;
    }

    return true;
  }

  async getResearchOutcomes(adoptionId: string): Promise<ResearchOutcome[]> {
    const { data, error } = await supabase
      .from('research_outcomes')
      .select('*')
      .eq('adoption_id', adoptionId)
      .order('measurement_date', { ascending: true });

    if (error) {
      console.error('Error loading research outcomes:', error);
      return [];
    }

    return data || [];
  }

  async getRecentQueries(userId?: string, limit = 10) {
    let query = supabase
      .from('research_queries')
      .select(`
        *,
        synthesis:evidence_syntheses (
          executive_summary,
          confidence_score,
          evidence_quality
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (userId) {
      query = query.eq('requested_by', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading research queries:', error);
      return [];
    }

    return data || [];
  }

  async getPapersByCondition(condition: string, limit = 10): Promise<ResearchPaper[]> {
    const { data, error } = await supabase
      .from('research_papers')
      .select('*')
      .contains('conditions', [condition])
      .eq('ingestion_status', 'processed')
      .order('quality_score', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error loading papers by condition:', error);
      return [];
    }

    return data || [];
  }

  async searchPapers(searchTerm: string, limit = 20): Promise<ResearchPaper[]> {
    const { data, error } = await supabase
      .from('research_papers')
      .select('*')
      .or(`title.ilike.%${searchTerm}%,abstract.ilike.%${searchTerm}%`)
      .eq('ingestion_status', 'processed')
      .order('quality_score', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error searching papers:', error);
      return [];
    }

    return data || [];
  }

  async getResearchToPracticeCycleTime() {
    const { data, error } = await supabase
      .rpc('get_research_to_practice_cycle_time');

    if (error) {
      console.error('Error loading cycle time:', error);
      return [];
    }

    return data || [];
  }

  async getLatestDigest() {
    const { data, error } = await supabase
      .from('evidence_digests')
      .select('*')
      .eq('status', 'published')
      .order('digest_month', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error loading latest digest:', error);
      return null;
    }

    return data;
  }

  async getAllDigests(limit = 12) {
    const { data, error } = await supabase
      .from('evidence_digests')
      .select('*')
      .eq('status', 'published')
      .order('digest_month', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error loading digests:', error);
      return [];
    }

    return data || [];
  }

  async getResearchSources(tier?: number) {
    let query = supabase
      .from('research_sources')
      .select('*')
      .eq('approved', true)
      .order('credibility_score', { ascending: false });

    if (tier) {
      query = query.eq('tier', tier);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading research sources:', error);
      return [];
    }

    return data || [];
  }

  async getResearchPriorities(type?: 'condition' | 'outcome') {
    let query = supabase
      .from('research_priorities')
      .select('*')
      .eq('active', true)
      .order('priority_score', { ascending: false });

    if (type) {
      query = query.eq('priority_type', type);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading research priorities:', error);
      return [];
    }

    return data || [];
  }

  async getActivePilots() {
    const { data, error } = await supabase
      .from('practice_pilots')
      .select(`
        *,
        translation:practice_translations (
          change_title,
          change_type,
          expected_outcome_improvement
        )
      `)
      .in('status', ['planned', 'active'])
      .order('start_date', { ascending: false });

    if (error) {
      console.error('Error loading active pilots:', error);
      return [];
    }

    return data || [];
  }

  async getPilotsSummary() {
    const { data, error } = await supabase
      .rpc('get_active_pilots_summary');

    if (error) {
      console.error('Error loading pilots summary:', error);
      return null;
    }

    return data;
  }

  async createPilot(pilotData: any, userId: string) {
    const { data, error } = await supabase
      .from('practice_pilots')
      .insert({
        ...pilotData,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating pilot:', error);
      return null;
    }

    await supabase
      .from('cco_approvals')
      .insert({
        approval_type: 'pilot',
        entity_id: data.id,
        decision: 'approved',
        submitted_at: new Date().toISOString()
      });

    return data;
  }

  async updatePilotStatus(pilotId: string, status: string, decision?: string, rationale?: string, userId?: string) {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (decision) {
      updateData.decision = decision;
      updateData.decision_rationale = rationale;
      updateData.decided_by = userId;
      updateData.decided_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('practice_pilots')
      .update(updateData)
      .eq('id', pilotId);

    if (error) {
      console.error('Error updating pilot status:', error);
      return false;
    }

    return true;
  }

  async generateEvidencePack(packType: string, condition: string, forEntity: string, startDate: string, endDate: string, userId: string) {
    const { data: packData, error: packError } = await supabase
      .rpc('generate_evidence_pack_data', {
        p_pack_type: packType,
        p_condition: condition,
        p_start_date: startDate,
        p_end_date: endDate
      });

    if (packError) {
      console.error('Error generating pack data:', error);
      return null;
    }

    const { data, error } = await supabase
      .from('evidence_packs')
      .insert({
        pack_type: packType,
        pack_name: `${condition} Evidence Pack - ${forEntity}`,
        evidence_summary: packData?.evidence_summary || '',
        citations: packData?.evidence_summary || {},
        practice_changes: packData?.practice_changes || {},
        measured_outcomes: packData?.outcomes || {},
        for_entity: forEntity,
        for_condition: condition,
        date_range_start: startDate,
        date_range_end: endDate,
        generated_by: userId,
        auto_generated: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving evidence pack:', error);
      return null;
    }

    return data;
  }

  async getEvidencePacks(limit = 10) {
    const { data, error } = await supabase
      .from('evidence_packs')
      .select('*')
      .order('generated_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error loading evidence packs:', error);
      return [];
    }

    return data || [];
  }

  async submitForCCOApproval(translationType: string, translationId: string, userId: string) {
    const { data, error } = await supabase
      .from('cco_approvals')
      .insert({
        approval_type: translationType,
        entity_id: translationId,
        submitted_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error submitting for CCO approval:', error);
      return null;
    }

    return data;
  }

  async recordCCODecision(approvalId: string, decision: string, rationale: string, ccoId: string, conditions?: string[]) {
    const { error } = await supabase
      .from('cco_approvals')
      .update({
        decision,
        decision_rationale: rationale,
        cco_id: ccoId,
        conditions: conditions || [],
        reviewed_at: new Date().toISOString()
      })
      .eq('id', approvalId);

    if (error) {
      console.error('Error recording CCO decision:', error);
      return false;
    }

    return true;
  }

  async getPendingCCOApprovals() {
    const { data, error } = await supabase
      .from('cco_approvals')
      .select('*')
      .is('reviewed_at', null)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Error loading pending CCO approvals:', error);
      return [];
    }

    return data || [];
  }
}

export const clinicalIntelligenceService = new ClinicalIntelligenceService();
