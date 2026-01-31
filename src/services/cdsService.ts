import { researchIntelligenceService, EvidenceClaim, ClinicalRule } from './researchIntelligenceService';
import { ClinicalDomain } from './evidenceAuthorityService';

export interface PatientProfile {
  domain?: ClinicalDomain;
  region: string;
  condition_type: string;
  acuity: string;
  age_range?: string;
  centralization?: boolean;
  directional_preference?: string;
  classification?: string;
  visits_completed?: number;
  fear_avoidance?: boolean;
  red_flags?: boolean;
}

export interface CDSMatch {
  claim: EvidenceClaim;
  relevanceScore: number;
  citations: any[];
  reasoning: string;
}

export interface CDSRecommendation {
  type: 'rule' | 'pathway' | 'education';
  title: string;
  clinicianText: string;
  patientText: string;
  priority: number;
  linkedClaims?: EvidenceClaim[];
}

interface CDSEndpointResponse {
  domain: string;
  outputs: {
    claims: Array<{
      claim_id: string;
      claim_text: string;
      confidence_score: number;
      score: number;
      clinical_tags: string[];
      outcomes: string[];
      evidence_level: string;
      risk_of_bias: string;
      source_id: string;
    }>;
    rules: Array<{
      rule_id: string;
      rule_name: string;
      recommendation_text: string;
      patient_explanation_text: string;
      priority: number;
      matched: boolean;
    }>;
    pathways: Array<{
      pathway_id: string;
      name: string;
      intended_population: any;
      phases: any;
      visit_guidance: any;
      home_program_guidance: any;
    }>;
  };
  meta: {
    claim_count: number;
    returned_claims: number;
    returned_rules: number;
    returned_pathways: number;
  };
}

class ClinicalDecisionSupportService {
  /**
   * Call the CDS Match endpoint
   * Uses the new edge function for domain-filtered evidence matching
   */
  private async callCDSEndpoint(patientProfile: PatientProfile): Promise<CDSEndpointResponse | null> {
    if (!patientProfile.domain) {
      console.warn('No domain specified, skipping CDS endpoint call');
      return null;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cds-match`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            domain: patientProfile.domain,
            patient_profile: {
              age_range: patientProfile.age_range,
              region: patientProfile.region,
              acuity: patientProfile.acuity,
              condition_type: patientProfile.condition_type,
            },
            clinical_findings: {
              centralization: patientProfile.centralization,
              directional_preference: patientProfile.directional_preference,
              classification: patientProfile.classification,
              visits_completed: patientProfile.visits_completed,
              fear_avoidance: patientProfile.fear_avoidance,
              red_flags: patientProfile.red_flags,
            },
            preferences: {
              tags: this.getRelevantTopics(patientProfile),
              outcome_focus: ['function', 'pain', 'quality_of_life'],
              limit_claims: 10,
            }
          })
        }
      );

      if (!response.ok) {
        console.error('CDS endpoint error:', response.statusText);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('CDS endpoint call failed:', error);
      return null;
    }
  }

  /**
   * Match patient profile against evidence claims
   * NOW USES CDS ENDPOINT for domain-filtered, scored evidence
   */
  async matchEvidence(patientProfile: PatientProfile): Promise<CDSMatch[]> {
    const endpointResult = await this.callCDSEndpoint(patientProfile);

    if (endpointResult) {
      const matches: CDSMatch[] = [];

      for (const claim of endpointResult.outputs.claims) {
        const citations = await researchIntelligenceService.getClaimCitations(claim.claim_id);

        matches.push({
          claim: claim as any,
          relevanceScore: claim.score,
          citations,
          reasoning: this.getReasoningFromScore(claim)
        });
      }

      return matches;
    }

    console.log('Falling back to legacy matching');
    return this.legacyMatchEvidence(patientProfile);
  }

  /**
   * Get clinical recommendations based on patient profile
   * NOW USES CDS ENDPOINT for domain-filtered recommendations
   */
  async getRecommendations(patientProfile: PatientProfile): Promise<CDSRecommendation[]> {
    const recommendations: CDSRecommendation[] = [];

    const endpointResult = await this.callCDSEndpoint(patientProfile);

    if (endpointResult) {
      for (const rule of endpointResult.outputs.rules) {
        recommendations.push({
          type: 'rule',
          title: rule.rule_name,
          clinicianText: rule.recommendation_text,
          patientText: rule.patient_explanation_text,
          priority: rule.priority
        });
      }

      for (const claim of endpointResult.outputs.claims.slice(0, 3)) {
        recommendations.push({
          type: 'evidence' as any,
          title: 'Evidence-Based Recommendation',
          clinicianText: claim.claim_text,
          patientText: `Research shows: ${claim.claim_text}`,
          priority: Math.max(1, 5 - Math.floor(claim.score)),
          linkedClaims: [claim as any]
        });
      }

      for (const pathway of endpointResult.outputs.pathways) {
        recommendations.push({
          type: 'pathway',
          title: `Suggested Pathway: ${pathway.name}`,
          clinicianText: `Consider ${pathway.name} based on evidence for this condition.`,
          patientText: `A care plan tailored to your condition has been suggested.`,
          priority: 1
        });
      }
    } else {
      console.log('Falling back to legacy recommendations');
      return this.legacyGetRecommendations(patientProfile);
    }

    const educationAssets = await researchIntelligenceService.getEducationAssets({
      topicTags: this.getRelevantTopics(patientProfile),
      readingLevel: 6
    });

    if (educationAssets.length > 0) {
      recommendations.push({
        type: 'education',
        title: 'Patient Education',
        clinicianText: `Share education materials: ${educationAssets.map(a => a.title).join(', ')}`,
        patientText: 'Educational materials can help your recovery.',
        priority: 2
      });
    }

    return recommendations.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Get reasoning from CDS endpoint score
   */
  private getReasoningFromScore(claim: any): string {
    const reasons: string[] = [];

    if (claim.score > 1.5) {
      reasons.push('Highly relevant match');
    } else if (claim.score > 1.2) {
      reasons.push('Strong match');
    } else {
      reasons.push('Relevant');
    }

    if (claim.evidence_level === 'systematic_review') {
      reasons.push('Strong evidence (SR)');
    } else if (claim.evidence_level === 'rct') {
      reasons.push('RCT evidence');
    }

    if (claim.clinical_tags && claim.clinical_tags.length > 0) {
      reasons.push(`Tags: ${claim.clinical_tags.slice(0, 3).join(', ')}`);
    }

    return reasons.join(' • ');
  }

  /**
   * Legacy matching (fallback if endpoint fails)
   */
  private async legacyMatchEvidence(patientProfile: PatientProfile): Promise<CDSMatch[]> {
    const searchFilters: any = {
      status: 'approved'
    };

    if (patientProfile.domain) {
      searchFilters.domain = patientProfile.domain;
    }

    if (patientProfile.region) {
      searchFilters.region = patientProfile.region;
    }

    if (patientProfile.acuity) {
      searchFilters.acuity = patientProfile.acuity;
    }

    const claims = await researchIntelligenceService.searchClaims(searchFilters);

    const matches: CDSMatch[] = [];

    for (const claim of claims) {
      const relevanceScore = this.scoreRelevance(claim, patientProfile);

      if (relevanceScore > 0.5) {
        const citations = await researchIntelligenceService.getClaimCitations(claim.claim_id);

        matches.push({
          claim,
          relevanceScore,
          citations,
          reasoning: this.getRelevanceReasoning(claim, patientProfile)
        });
      }
    }

    return matches.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Legacy recommendations (fallback if endpoint fails)
   */
  private async legacyGetRecommendations(patientProfile: PatientProfile): Promise<CDSRecommendation[]> {
    const recommendations: CDSRecommendation[] = [];

    const allRules = await researchIntelligenceService.getActiveRules();
    const rules = patientProfile.domain
      ? allRules.filter(r => !r.domain || r.domain === patientProfile.domain)
      : allRules;
    const triggeredRules = researchIntelligenceService.evaluateRules(rules, patientProfile);

    for (const rule of triggeredRules) {
      recommendations.push({
        type: 'rule',
        title: rule.rule_name,
        clinicianText: rule.recommendation_text,
        patientText: rule.patient_explanation_text,
        priority: rule.priority
      });
    }

    const matches = await this.legacyMatchEvidence(patientProfile);
    const topMatches = matches.slice(0, 3);

    for (const match of topMatches) {
      recommendations.push({
        type: 'evidence' as any,
        title: 'Matched Evidence',
        clinicianText: match.claim.claim_text,
        patientText: `Research shows: ${match.claim.claim_text}`,
        priority: Math.max(1, 5 - Math.floor(match.relevanceScore * 5)),
        linkedClaims: [match.claim]
      });
    }

    const allPathways = await researchIntelligenceService.getPathways();
    const pathways = patientProfile.domain
      ? allPathways.filter(p => !p.domain || p.domain === patientProfile.domain)
      : allPathways;
    const matchedPathway = pathways.find(p =>
      this.pathwayMatches(p, patientProfile)
    );

    if (matchedPathway) {
      recommendations.push({
        type: 'pathway',
        title: `Suggested Pathway: ${matchedPathway.name}`,
        clinicianText: `Consider ${matchedPathway.name}. Visits: ${matchedPathway.visit_guidance.min}-${matchedPathway.visit_guidance.max}`,
        patientText: `A care plan tailored to your condition has been suggested.`,
        priority: 1
      });
    }

    return recommendations.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Score relevance of a claim to patient profile
   */
  private scoreRelevance(claim: EvidenceClaim, profile: PatientProfile): number {
    let score = claim.confidence_score;

    // Boost for region match
    const claimRegion = claim.population?.region;
    if (claimRegion && claimRegion === profile.region) {
      score += 0.15;
    }

    // Boost for acuity match
    const claimAcuity = claim.population?.acuity;
    if (claimAcuity && claimAcuity === profile.acuity) {
      score += 0.1;
    }

    // Boost for centralization match
    if (profile.centralization !== undefined) {
      const hasCentralizationTag = claim.clinical_tags?.includes('centralization');
      if (profile.centralization && hasCentralizationTag) {
        score += 0.1;
      }
    }

    // Boost for directional preference match
    if (profile.directional_preference && profile.directional_preference !== 'unknown') {
      const hasDirectionalTag = claim.clinical_tags?.includes('directional_preference');
      if (hasDirectionalTag) {
        score += 0.08;
      }
    }

    // Penalize for harmful outcomes
    if (claim.effect_direction === 'harm') {
      score -= 0.3;
    }

    return Math.min(1, Math.max(0, score));
  }

  /**
   * Get reasoning for relevance score
   */
  private getRelevanceReasoning(claim: EvidenceClaim, profile: PatientProfile): string {
    const reasons: string[] = [];

    if (claim.population?.region === profile.region) {
      reasons.push(`Region match (${profile.region})`);
    }

    if (claim.population?.acuity === profile.acuity) {
      reasons.push(`Acuity match (${profile.acuity})`);
    }

    if (profile.centralization && claim.clinical_tags?.includes('centralization')) {
      reasons.push('Centralization present');
    }

    if (claim.evidence_level === 'systematic_review') {
      reasons.push('Strong evidence (SR)');
    } else if (claim.evidence_level === 'rct') {
      reasons.push('RCT evidence');
    }

    return reasons.join(' • ') || 'Potentially relevant';
  }

  /**
   * Check if pathway matches profile
   */
  private pathwayMatches(pathway: any, profile: PatientProfile): boolean {
    const intended = pathway.intended_population || {};

    if (intended.region && intended.region !== profile.region) {
      return false;
    }

    if (intended.acuity && intended.acuity !== profile.acuity) {
      return false;
    }

    if (intended.centralization !== undefined && intended.centralization !== profile.centralization) {
      return false;
    }

    return true;
  }

  /**
   * Get relevant topics for patient
   */
  private getRelevantTopics(profile: PatientProfile): string[] {
    const topics: string[] = [];

    if (profile.region === 'lumbar') {
      topics.push('lumbar');
    } else if (profile.region === 'cervical') {
      topics.push('cervical');
    }

    if (profile.centralization) {
      topics.push('centralization');
    }

    if (profile.directional_preference && profile.directional_preference !== 'unknown') {
      topics.push('directional_preference');
    }

    if (profile.acuity === 'chronic') {
      topics.push('chronic_pain');
    }

    if (profile.classification === 'derangement') {
      topics.push('derangement');
    }

    topics.push('self_management');

    return topics;
  }

  /**
   * Get safety alerts based on profile
   * Domain-aware: applies domain-specific safety checks
   */
  getSafetyAlerts(profile: PatientProfile): string[] {
    const alerts: string[] = [];

    if (profile.red_flags) {
      alerts.push('Red flags detected - immediate medical referral recommended');
    }

    if (profile.fear_avoidance && profile.acuity === 'chronic') {
      alerts.push('High fear avoidance in chronic pain - education critical');
    }

    if (profile.domain) {
      const domainAlerts = this.getDomainSpecificSafetyAlerts(profile);
      alerts.push(...domainAlerts);
    }

    return alerts;
  }

  /**
   * Get domain-specific safety alerts
   */
  private getDomainSpecificSafetyAlerts(profile: PatientProfile): string[] {
    const alerts: string[] = [];

    switch (profile.domain) {
      case 'concussion':
        if (profile.visits_completed && profile.visits_completed < 2) {
          alerts.push('Concussion: Ensure proper baseline assessment completed');
        }
        break;

      case 'spine_mdt':
        if (!profile.classification) {
          alerts.push('MDT: Mechanical assessment required for classification');
        }
        break;

      case 'acl':
        if (profile.visits_completed && profile.visits_completed > 0) {
          alerts.push('ACL: Follow return-to-sport criteria before clearance');
        }
        break;

      case 'chronic_pain':
        if (!profile.fear_avoidance) {
          alerts.push('Chronic Pain: Consider psychosocial assessment');
        }
        break;

      case 'neuro':
        alerts.push('Neuro: Monitor for neurological changes each visit');
        break;

      default:
        break;
    }

    return alerts;
  }
}

export const cdsService = new ClinicalDecisionSupportService();
