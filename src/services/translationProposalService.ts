import { supabase } from '../lib/supabase';

export interface ChangeProposal {
  id: string;
  evidence_flag_id: string;
  change_type: string;
  change_title: string;
  change_description: string;
  affected_sop_id?: string;
  current_sop_version?: string;
  proposed_changes: Record<string, any>;
  expected_outcomes: string[];
  implementation_complexity: string;
  risk_assessment: string;
  routed_to_cco: boolean;
  routed_at?: string;
  status: string;
  created_at: string;
}

class TranslationProposalService {
  async generateProposalFromActionableEvidence(
    flagId: string,
    userId: string
  ): Promise<ChangeProposal | null> {
    const { data: flag, error: flagError } = await supabase
      .from('evidence_flags')
      .select(
        `
        *,
        digest:evidence_digests (
          digest_month,
          major_themes,
          confidence_weighted_summaries
        )
      `
      )
      .eq('id', flagId)
      .maybeSingle();

    if (flagError || !flag) {
      console.error('Error loading evidence flag:', flagError);
      return null;
    }

    const proposal = this.mapEvidenceToProposal(flag);

    const { data: created, error: createError } = await supabase
      .from('practice_translations')
      .insert({
        ...proposal,
        evidence_flag_id: flagId,
        status: 'generated',
        created_by: userId
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating proposal:', createError);
      return null;
    }

    return created;
  }

  private mapEvidenceToProposal(flag: any): Partial<ChangeProposal> {
    const theme = flag.evidence_theme || 'Evidence-based Change';
    const confidence = flag.confidence_score || 0;

    const changeTypeMap: Record<string, string> = {
      'return to work': 'operational',
      'clinical outcome': 'clinical',
      'safety': 'safety',
      'efficiency': 'operational',
      'quality': 'quality'
    };

    let changeType = 'clinical';
    for (const [key, type] of Object.entries(changeTypeMap)) {
      if (theme.toLowerCase().includes(key)) {
        changeType = type as string;
        break;
      }
    }

    const complexityMap = {
      high: 'high',
      moderate: confidence >= 85 ? 'moderate' : 'high',
      low: confidence >= 80 ? 'low' : 'moderate'
    };

    const complexity = Object.keys(complexityMap)[
      Math.min(2, Math.floor((100 - confidence) / 35))
    ] as string;

    return {
      change_type: changeType,
      change_title: `Implement: ${theme}`,
      change_description: `Based on evidence synthesis with confidence score of ${confidence}%, this change aims to improve clinical and operational outcomes.`,
      proposed_changes: {
        evidence_source: theme,
        confidence_level: `${confidence}%`,
        affected_areas: this.inferAffectedAreas(theme),
        implementation_timeline: 'phase'
      },
      expected_outcomes: this.generateExpectedOutcomes(theme, confidence),
      implementation_complexity: complexity,
      risk_assessment: this.assessRisk(confidence, complexity),
      routed_to_cco: false
    };
  }

  private inferAffectedAreas(theme: string): string[] {
    const areas: string[] = [];

    const areaKeywords = {
      clinical_protocols: [
        'treatment',
        'intervention',
        'clinical',
        'outcome',
        'patient'
      ],
      operational_procedures: ['return to work', 'efficiency', 'scheduling', 'capacity'],
      safety_measures: ['safety', 'risk', 'adverse', 'complication'],
      quality_standards: ['quality', 'measure', 'standard', 'guideline']
    };

    const themeLower = theme.toLowerCase();

    for (const [area, keywords] of Object.entries(areaKeywords)) {
      if (keywords.some((k) => themeLower.includes(k))) {
        areas.push(area);
      }
    }

    return areas.length > 0 ? areas : ['clinical_protocols'];
  }

  private generateExpectedOutcomes(theme: string, confidence: number): string[] {
    const outcomes: string[] = [];

    if (theme.toLowerCase().includes('return to work')) {
      outcomes.push('Reduced time to return to work');
      outcomes.push('Improved patient satisfaction');
      if (confidence >= 85) {
        outcomes.push('Increased claim acceptance rates');
      }
    }

    if (theme.toLowerCase().includes('clinical')) {
      outcomes.push('Improved clinical outcomes');
      if (confidence >= 80) {
        outcomes.push('Better patient compliance');
      }
    }

    if (theme.toLowerCase().includes('efficiency')) {
      outcomes.push('Increased operational efficiency');
      outcomes.push('Reduced processing time');
    }

    if (outcomes.length === 0) {
      outcomes.push('Improved clinical and operational metrics');
    }

    return outcomes;
  }

  private assessRisk(confidence: number, complexity: string): string {
    let riskLevel = 'low';

    if (complexity === 'high') {
      riskLevel = 'moderate';
    }

    if (confidence < 70) {
      riskLevel = 'moderate';
    }

    if (confidence < 60) {
      riskLevel = 'high';
    }

    const details = {
      level: riskLevel,
      factors: [
        `Confidence level: ${confidence}%`,
        `Complexity: ${complexity}`
      ],
      mitigation: this.generateMitigation(riskLevel, complexity)
    };

    return JSON.stringify(details);
  }

  private generateMitigation(riskLevel: string, complexity: string): string[] {
    const mitigations: string[] = [];

    if (riskLevel === 'high' || riskLevel === 'moderate') {
      mitigations.push('Phased rollout to pilot clinics');
      mitigations.push('Enhanced monitoring during implementation');
    }

    if (complexity === 'high') {
      mitigations.push('Staff training program');
      mitigations.push('Detailed implementation guide');
    }

    mitigations.push('Regular outcome monitoring');
    mitigations.push('Quick rollback capability');

    return mitigations;
  }

  async routeToCCO(proposalId: string, userId: string): Promise<boolean> {
    const { data: proposal, error: propError } = await supabase
      .from('practice_translations')
      .select('*')
      .eq('id', proposalId)
      .maybeSingle();

    if (propError || !proposal) {
      console.error('Error loading proposal:', propError);
      return false;
    }

    const { error: updateError } = await supabase
      .from('practice_translations')
      .update({
        routed_to_cco: true,
        routed_at: new Date().toISOString(),
        status: 'awaiting_cco_review'
      })
      .eq('id', proposalId);

    if (updateError) {
      console.error('Error routing to CCO:', updateError);
      return false;
    }

    const { error: approvalError } = await supabase
      .from('cco_approvals')
      .insert({
        approval_type: 'evidence_translation',
        entity_id: proposalId,
        submitted_at: new Date().toISOString(),
        submitted_by: userId
      });

    if (approvalError) {
      console.error('Error creating approval record:', approvalError);
      return false;
    }

    return true;
  }

  async getPendingProposals(limit = 10) {
    const { data, error } = await supabase
      .from('practice_translations')
      .select(
        `
        *,
        flag:evidence_flags (
          evidence_theme,
          confidence_score
        )
      `
      )
      .in('status', ['generated', 'awaiting_cco_review'])
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error loading pending proposals:', error);
      return [];
    }

    return data || [];
  }

  async approveProposal(proposalId: string, ccoId: string, notes?: string): Promise<boolean> {
    const { error: updateError } = await supabase
      .from('practice_translations')
      .update({
        status: 'approved',
        reviewed_by: ccoId,
        reviewed_at: new Date().toISOString(),
        reviewer_notes: notes
      })
      .eq('id', proposalId);

    if (updateError) {
      console.error('Error approving proposal:', updateError);
      return false;
    }

    const { error: approvalError } = await supabase
      .from('cco_approvals')
      .update({
        decision: 'approved',
        decision_rationale: notes || '',
        cco_id: ccoId,
        reviewed_at: new Date().toISOString()
      })
      .eq('entity_id', proposalId)
      .eq('approval_type', 'evidence_translation');

    if (approvalError) {
      console.error('Error updating approval:', approvalError);
      return false;
    }

    return true;
  }

  async rejectProposal(
    proposalId: string,
    ccoId: string,
    reason: string
  ): Promise<boolean> {
    const { error: updateError } = await supabase
      .from('practice_translations')
      .update({
        status: 'rejected',
        reviewed_by: ccoId,
        reviewed_at: new Date().toISOString(),
        reviewer_notes: reason
      })
      .eq('id', proposalId);

    if (updateError) {
      console.error('Error rejecting proposal:', updateError);
      return false;
    }

    const { error: approvalError } = await supabase
      .from('cco_approvals')
      .update({
        decision: 'rejected',
        decision_rationale: reason,
        cco_id: ccoId,
        reviewed_at: new Date().toISOString()
      })
      .eq('entity_id', proposalId)
      .eq('approval_type', 'evidence_translation');

    if (approvalError) {
      console.error('Error updating approval:', approvalError);
      return false;
    }

    return true;
  }

  async getApprovedProposalsReadyForPilot(limit = 5) {
    const { data, error } = await supabase
      .from('practice_translations')
      .select('*')
      .eq('status', 'approved')
      .is('pilot_started_at', null)
      .order('reviewed_at', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error loading approved proposals:', error);
      return [];
    }

    return data || [];
  }

  async getProposalStats() {
    const { data, error } = await supabase
      .rpc('get_translation_proposal_stats');

    if (error) {
      console.error('Error loading proposal stats:', error);
      return null;
    }

    return data;
  }
}

export const translationProposalService = new TranslationProposalService();
