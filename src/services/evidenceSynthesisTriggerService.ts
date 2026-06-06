import { supabase } from '../lib/supabase';
import { clinicalIntelligenceService } from './clinicalIntelligenceService';

export interface EvidenceDigest {
  id: string;
  digest_month: string;
  status: 'draft' | 'published';
  high_confidence_changes: number;
  moderate_confidence_changes: number;
  evidence_synthesis_count: number;
  papers_reviewed: number;
  major_themes: string[];
  published_at?: string;
  published_by?: string;
}

export interface ConfidenceWeightedSummary {
  theme: string;
  confidence: number;
  evidenceCount: number;
  recommendation: string;
  previousDigestStatus?: string;
  changeIndicator: string;
}

class EvidenceSynthesisTriggerService {
  async generateMonthlyDigest(): Promise<EvidenceDigest | null> {
    const now = new Date();
    const digestMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const { data: existingDigest } = await supabase
      .from('evidence_digests')
      .select('id')
      .eq('digest_month', digestMonth)
      .maybeSingle();

    if (existingDigest) {
      console.log('Digest already exists for month:', digestMonth);
      return null;
    }

    const { data: recentSyntheses, error: synthesisError } = await supabase
      .from('evidence_syntheses')
      .select('*')
      .eq('status', 'published')
      .gte(
        'created_at',
        new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      )
      .lte(
        'created_at',
        new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()
      );

    if (synthesisError || !recentSyntheses) {
      console.error('Error fetching recent syntheses:', synthesisError);
      return null;
    }

    const { data: recentPapers, error: papersError } = await supabase
      .from('research_papers')
      .select('*')
      .eq('ingestion_status', 'processed')
      .gte(
        'ingested_at',
        new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      );

    if (papersError) {
      console.error('Error fetching recent papers:', papersError);
      return null;
    }

    const summaries = await this.synthesizeEvidence(recentSyntheses, recentPapers || []);
    const majorThemes = this.extractMajorThemes(summaries);

    const highConfidence = summaries.filter((s) => s.confidence >= 80).length;
    const moderateConfidence = summaries.filter((s) => s.confidence >= 60 && s.confidence < 80).length;

    const { data: digest, error: digestError } = await supabase
      .from('evidence_digests')
      .insert({
        digest_month: digestMonth,
        status: 'draft',
        high_confidence_changes: highConfidence,
        moderate_confidence_changes: moderateConfidence,
        evidence_synthesis_count: recentSyntheses.length,
        papers_reviewed: recentPapers?.length || 0,
        major_themes: majorThemes,
        confidence_weighted_summaries: summaries
      })
      .select()
      .single();

    if (digestError) {
      console.error('Error creating digest:', digestError);
      return null;
    }

    return digest;
  }

  private async synthesizeEvidence(
    syntheses: any[],
    papers: any[]
  ): Promise<ConfidenceWeightedSummary[]> {
    const summaryMap = new Map<string, ConfidenceWeightedSummary>();

    for (const synthesis of syntheses) {
      const key = synthesis.recommendation || 'general';

      if (!summaryMap.has(key)) {
        summaryMap.set(key, {
          theme: key,
          confidence: synthesis.confidence_score || 0,
          evidenceCount: 1,
          recommendation: synthesis.executive_summary || '',
          changeIndicator: 'new'
        });
      } else {
        const existing = summaryMap.get(key)!;
        existing.evidenceCount += 1;
        existing.confidence = Math.max(existing.confidence, synthesis.confidence_score || 0);
      }
    }

    const summaries: ConfidenceWeightedSummary[] = Array.from(summaryMap.values());

    return summaries.sort((a, b) => b.confidence - a.confidence);
  }

  private extractMajorThemes(summaries: ConfidenceWeightedSummary[]): string[] {
    const themes = new Set<string>();

    for (const summary of summaries) {
      if (summary.confidence >= 75) {
        const tokens = summary.theme.toLowerCase().split(' ');
        tokens.forEach((token) => {
          if (token.length > 4) {
            themes.add(token);
          }
        });
      }
    }

    return Array.from(themes).slice(0, 5);
  }

  async getChangeComparison(previousDigestId?: string): Promise<any> {
    let currentDigest: any = null;
    let previousDigest: any = null;

    if (previousDigestId) {
      const { data: prev } = await supabase
        .from('evidence_digests')
        .select('*')
        .eq('id', previousDigestId)
        .maybeSingle();
      previousDigest = prev;
    } else {
      const now = new Date();
      const monthBefore = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevMonth = `${monthBefore.getFullYear()}-${String(monthBefore.getMonth() + 1).padStart(2, '0')}`;

      const { data: prev } = await supabase
        .from('evidence_digests')
        .select('*')
        .eq('digest_month', prevMonth)
        .maybeSingle();
      previousDigest = prev;
    }

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const { data: curr } = await supabase
      .from('evidence_digests')
      .select('*')
      .eq('digest_month', currentMonth)
      .eq('status', 'published')
      .maybeSingle();
    currentDigest = curr;

    if (!currentDigest) {
      return null;
    }

    const comparison = {
      currentDigest,
      previousDigest,
      changeMetrics: {
        synthesisCountChange:
          currentDigest.evidence_synthesis_count -
          (previousDigest?.evidence_synthesis_count || 0),
        papersReviewedChange:
          currentDigest.papers_reviewed - (previousDigest?.papers_reviewed || 0),
        highConfidenceChange:
          currentDigest.high_confidence_changes -
          (previousDigest?.high_confidence_changes || 0),
        moderateConfidenceChange:
          currentDigest.moderate_confidence_changes -
          (previousDigest?.moderate_confidence_changes || 0)
      },
      newThemes: currentDigest.major_themes.filter(
        (theme: string) =>
          !previousDigest || !previousDigest.major_themes.includes(theme)
      ),
      persistentThemes: previousDigest
        ? currentDigest.major_themes.filter((theme: string) =>
            previousDigest.major_themes.includes(theme)
          )
        : []
    };

    return comparison;
  }

  async publishDigest(digestId: string, publishedBy: string): Promise<boolean> {
    const { error } = await supabase
      .from('evidence_digests')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
        published_by: publishedBy
      })
      .eq('id', digestId);

    if (error) {
      console.error('Error publishing digest:', error);
      return false;
    }

    const { data: digest } = await supabase
      .from('evidence_digests')
      .select('*')
      .eq('id', digestId)
      .maybeSingle();

    if (digest && digest.high_confidence_changes > 0) {
      await this.flagActionableEvidence(digestId);
    }

    return true;
  }

  private async flagActionableEvidence(digestId: string): Promise<void> {
    const { data: digest } = await supabase
      .from('evidence_digests')
      .select('*')
      .eq('id', digestId)
      .maybeSingle();

    if (!digest || !digest.confidence_weighted_summaries) {
      return;
    }

    for (const summary of digest.confidence_weighted_summaries) {
      if (summary.confidence >= 80) {
        await supabase
          .from('evidence_flags')
          .insert({
            digest_id: digestId,
            evidence_theme: summary.theme,
            confidence_score: summary.confidence,
            actionability_flag: 'actionable',
            flagged_at: new Date().toISOString()
          });
      }
    }
  }

  async getActionableEvidence(limit = 10) {
    const { data, error } = await supabase
      .from('evidence_flags')
      .select(
        `
        *,
        digest:evidence_digests (
          digest_month,
          major_themes
        )
      `
      )
      .eq('actionability_flag', 'actionable')
      .gte('confidence_score', 80)
      .order('flagged_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error loading actionable evidence:', error);
      return [];
    }

    return data || [];
  }

  async markEvidenceAsProcessed(flagId: string): Promise<boolean> {
    const { error } = await supabase
      .from('evidence_flags')
      .update({
        actionability_flag: 'processed',
        processed_at: new Date().toISOString()
      })
      .eq('id', flagId);

    if (error) {
      console.error('Error marking evidence as processed:', error);
      return false;
    }

    return true;
  }

  async getDigestSummary(digestId: string) {
    const { data: digest, error } = await supabase
      .from('evidence_digests')
      .select('*')
      .eq('id', digestId)
      .maybeSingle();

    if (error || !digest) {
      console.error('Error loading digest:', error);
      return null;
    }

    return {
      month: digest.digest_month,
      status: digest.status,
      paperCount: digest.papers_reviewed,
      synthesisCount: digest.evidence_synthesis_count,
      highConfidenceCount: digest.high_confidence_changes,
      moderateConfidenceCount: digest.moderate_confidence_changes,
      majorThemes: digest.major_themes,
      summaries: digest.confidence_weighted_summaries || []
    };
  }

  async getLatestDigestTrends() {
    const { data: digests, error } = await supabase
      .from('evidence_digests')
      .select('*')
      .eq('status', 'published')
      .order('digest_month', { ascending: false })
      .limit(6);

    if (error) {
      console.error('Error loading digests:', error);
      return [];
    }

    return (digests || []).map((d) => ({
      month: d.digest_month,
      papers: d.papers_reviewed,
      highConfidence: d.high_confidence_changes,
      themes: d.major_themes
    }));
  }
}

export const evidenceSynthesisTriggerService = new EvidenceSynthesisTriggerService();
