import { supabase } from '../lib/supabase';

export interface EvidenceSynthesisVersion {
  id: string;
  synthesis_id: string;
  version_number: number;
  query_text: string;
  synthesis_text: string;
  clinical_implications?: string;
  operational_implications?: string;
  recommendations: any[];
  confidence_score?: number;
  evidence_quality?: string;
  consensus_level?: string;
  changed_by?: string;
  change_reason?: string;
  change_summary?: string;
  diff_from_previous?: any;
  created_at: string;
}

export interface PracticeTranslationVersion {
  id: string;
  translation_id: string;
  version_number: number;
  change_title: string;
  change_description: string;
  expected_outcome_improvement?: string;
  implementation_complexity?: string;
  estimated_training_hours?: number;
  status: string;
  changed_by?: string;
  change_reason?: string;
  change_summary?: string;
  diff_from_previous?: any;
  created_at: string;
}

export interface EvidenceContradiction {
  id: string;
  synthesis_a_id?: string;
  synthesis_b_id?: string;
  paper_a_id?: string;
  paper_b_id?: string;
  contradiction_type: 'outcome_conflict' | 'methodology_conflict' | 'temporal_superseded' | 'population_specific' | 'severity_conflict';
  confidence_score: number;
  description: string;
  clinical_impact: 'high' | 'medium' | 'low';
  resolution_status: 'unresolved' | 'investigating' | 'resolved_favor_a' | 'resolved_favor_b' | 'resolved_both_valid' | 'resolved_both_invalid';
  resolution_notes?: string;
  resolved_by?: string;
  resolved_at?: string;
  detected_by_agent_id?: string;
  detected_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
}

export const evidenceVersioningService = {
  async getSynthesisVersionHistory(synthesisId: string): Promise<EvidenceSynthesisVersion[]> {
    try {
      const { data, error } = await supabase
        .from('evidence_synthesis_versions')
        .select('*')
        .eq('synthesis_id', synthesisId)
        .order('version_number', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching synthesis version history:', error);
      return [];
    }
  },

  async getTranslationVersionHistory(translationId: string): Promise<PracticeTranslationVersion[]> {
    try {
      const { data, error } = await supabase
        .from('practice_translation_versions')
        .select('*')
        .eq('translation_id', translationId)
        .order('version_number', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching translation version history:', error);
      return [];
    }
  },

  async compareSynthesisVersions(synthesisId: string, versionA: number, versionB: number): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('compare_synthesis_versions', {
        p_synthesis_id: synthesisId,
        p_version_a: versionA,
        p_version_b: versionB
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error comparing synthesis versions:', error);
      return null;
    }
  },

  async getLatestSynthesisVersion(synthesisId: string): Promise<EvidenceSynthesisVersion | null> {
    try {
      const { data, error } = await supabase.rpc('get_evidence_synthesis_latest_version', {
        p_synthesis_id: synthesisId
      });

      if (error) throw error;
      return data?.[0] || null;
    } catch (error) {
      console.error('Error fetching latest synthesis version:', error);
      return null;
    }
  },

  async getUnresolvedContradictions(): Promise<EvidenceContradiction[]> {
    try {
      const { data, error } = await supabase
        .from('evidence_contradiction_log')
        .select('*')
        .eq('resolution_status', 'unresolved')
        .order('detected_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching unresolved contradictions:', error);
      return [];
    }
  },

  async getAllContradictions(): Promise<EvidenceContradiction[]> {
    try {
      const { data, error } = await supabase
        .from('evidence_contradiction_log')
        .select('*')
        .order('detected_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching contradictions:', error);
      return [];
    }
  },

  async createContradiction(contradiction: Omit<EvidenceContradiction, 'id' | 'detected_at'>): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('evidence_contradiction_log')
        .insert([contradiction])
        .select('id')
        .single();

      if (error) throw error;
      return data?.id || null;
    } catch (error) {
      console.error('Error creating contradiction:', error);
      return null;
    }
  },

  async updateContradictionStatus(
    contradictionId: string,
    status: EvidenceContradiction['resolution_status'],
    notes?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('evidence_contradiction_log')
        .update({
          resolution_status: status,
          resolution_notes: notes,
          resolved_at: new Date().toISOString()
        })
        .eq('id', contradictionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating contradiction status:', error);
      return false;
    }
  },

  async detectContradictions(paperIds: string[]): Promise<EvidenceContradiction[]> {
    try {
      const contradictions: EvidenceContradiction[] = [];

      const { data: papers, error: papersError } = await supabase
        .from('research_papers')
        .select('id, title, study_type, primary_outcome, publication_date')
        .in('id', paperIds);

      if (papersError) throw papersError;

      for (let i = 0; i < papers.length; i++) {
        for (let j = i + 1; j < papers.length; j++) {
          const paperA = papers[i];
          const paperB = papers[j];

          if (paperA.study_type === paperB.study_type &&
              paperA.primary_outcome !== paperB.primary_outcome) {

            const detectionResult: Omit<EvidenceContradiction, 'id' | 'detected_at'> = {
              paper_a_id: paperA.id,
              paper_b_id: paperB.id,
              contradiction_type: 'outcome_conflict',
              confidence_score: 75,
              description: `Potential contradiction: ${paperA.title} vs ${paperB.title} show different outcomes for similar study types`,
              clinical_impact: 'medium',
              resolution_status: 'unresolved'
            };

            const contradictionId = await this.createContradiction(detectionResult);
            if (contradictionId) {
              contradictions.push({
                ...detectionResult,
                id: contradictionId,
                detected_at: new Date().toISOString()
              });
            }
          }
        }
      }

      return contradictions;
    } catch (error) {
      console.error('Error detecting contradictions:', error);
      return [];
    }
  },

  async rollbackSynthesisToVersion(synthesisId: string, targetVersion: number): Promise<boolean> {
    try {
      const { data: versionData, error: versionError } = await supabase
        .from('evidence_synthesis_versions')
        .select('*')
        .eq('synthesis_id', synthesisId)
        .eq('version_number', targetVersion)
        .single();

      if (versionError) throw versionError;

      const { error: updateError } = await supabase
        .from('evidence_syntheses')
        .update({
          query_text: versionData.query_text,
          synthesis_text: versionData.synthesis_text,
          clinical_implications: versionData.clinical_implications,
          operational_implications: versionData.operational_implications,
          recommendations: versionData.recommendations,
          confidence_score: versionData.confidence_score,
          evidence_quality: versionData.evidence_quality,
          consensus_level: versionData.consensus_level
        })
        .eq('id', synthesisId);

      if (updateError) throw updateError;
      return true;
    } catch (error) {
      console.error('Error rolling back synthesis:', error);
      return false;
    }
  },

  async getVersionStatistics(synthesisId: string): Promise<{
    totalVersions: number;
    firstVersion: string;
    lastModified: string;
    totalChanges: number;
  } | null> {
    try {
      const { data, error } = await supabase
        .from('evidence_synthesis_versions')
        .select('version_number, created_at')
        .eq('synthesis_id', synthesisId)
        .order('version_number', { ascending: true });

      if (error) throw error;
      if (!data || data.length === 0) return null;

      return {
        totalVersions: data.length,
        firstVersion: data[0].created_at,
        lastModified: data[data.length - 1].created_at,
        totalChanges: data.length - 1
      };
    } catch (error) {
      console.error('Error fetching version statistics:', error);
      return null;
    }
  }
};
