import { cdsService, PatientProfile, CDSRecommendation } from './cdsService';
import { researchIntelligenceService, EvidenceClaim, ClinicalRule, PatientEducationAsset, CarePathwayTemplate } from './researchIntelligenceService';
import { supabase } from '../lib/supabase';

export interface ClinicianEvidenceView {
  matchedClaims: EvidenceClaim[];
  triggeredRules: ClinicalRule[];
  recommendations: CDSRecommendation[];
  safetyAlerts: string[];
  suggestedPathway?: CarePathwayTemplate;
}

export interface PatientEvidenceView {
  educationAssets: PatientEducationAsset[];
  simpleRecommendations: Array<{
    title: string;
    explanation: string;
    icon: string;
  }>;
  safetyMessages: string[];
}

class EvidenceGateway {
  /**
   * Get comprehensive clinician evidence view
   */
  async getClinicianEvidenceView(patientProfile: PatientProfile): Promise<ClinicianEvidenceView> {
    try {
      // Get matched evidence
      const matchedClaims = await cdsService.matchEvidence(patientProfile);
      const topClaims = matchedClaims.slice(0, 5).map(m => m.claim);

      // Get triggered rules
      const rules = await researchIntelligenceService.getActiveRules();
      const triggeredRules = researchIntelligenceService.evaluateRules(rules, patientProfile);

      // Get recommendations
      const recommendations = await cdsService.getRecommendations(patientProfile);

      // Get safety alerts
      const safetyAlerts = cdsService.getSafetyAlerts(patientProfile);

      // Get suggested pathway
      const pathways = await researchIntelligenceService.getPathways({ isActive: true });
      const suggestedPathway = pathways.find(p => this.pathwayMatches(p, patientProfile));

      return {
        matchedClaims: topClaims,
        triggeredRules,
        recommendations,
        safetyAlerts,
        suggestedPathway
      };
    } catch (error) {
      console.error('Error getting clinician evidence view:', error);
      return {
        matchedClaims: [],
        triggeredRules: [],
        recommendations: [],
        safetyAlerts: ['Error loading evidence']
      };
    }
  }

  /**
   * Get patient-friendly evidence view
   */
  async getPatientEvidenceView(patientProfile: PatientProfile): Promise<PatientEvidenceView> {
    try {
      // Get education assets
      const educationAssets = await researchIntelligenceService.getEducationAssets({
        readingLevel: 6,
        topicTags: this.getPatientRelevantTopics(patientProfile)
      });

      // Get safety messages
      const safetyMessages = cdsService.getSafetyAlerts(patientProfile);

      // Build simple recommendations
      const recommendations = await cdsService.getRecommendations(patientProfile);
      const simpleRecommendations = recommendations
        .filter(r => r.priority <= 2)
        .slice(0, 3)
        .map(r => ({
          title: r.title,
          explanation: r.patientText,
          icon: r.type === 'rule' ? '✓' : r.type === 'education' ? '📚' : '📋'
        }));

      return {
        educationAssets: educationAssets.slice(0, 5),
        simpleRecommendations,
        safetyMessages
      };
    } catch (error) {
      console.error('Error getting patient evidence view:', error);
      return {
        educationAssets: [],
        simpleRecommendations: [],
        safetyMessages: ['Information loading...']
      };
    }
  }

  /**
   * Search evidence with filters
   */
  async searchEvidence(query: string, filters?: {
    region?: string;
    evidenceLevel?: string;
    tags?: string[];
  }) {
    try {
      const claims = await researchIntelligenceService.searchClaims({
        region: filters?.region,
        evidenceLevel: filters?.evidenceLevel,
        tags: filters?.tags,
        status: 'approved'
      });

      // Filter by search query
      const filtered = claims.filter(claim =>
        claim.claim_text.toLowerCase().includes(query.toLowerCase()) ||
        claim.clinical_tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      );

      // Get citations for each claim
      const results = await Promise.all(
        filtered.map(async (claim) => ({
          ...claim,
          citations: await researchIntelligenceService.getClaimCitations(claim.claim_id)
        }))
      );

      return results;
    } catch (error) {
      console.error('Error searching evidence:', error);
      return [];
    }
  }

  /**
   * Get care pathway details
   */
  async getPathwayDetails(pathwayId: string) {
    try {
      const { data, error } = await supabase
        .from('care_pathway_templates')
        .select('*')
        .eq('pathway_id', pathwayId)
        .single();

      if (error) throw error;

      // Get linked rules
      const { data: ruleLinks } = await supabase
        .from('rule_claim_links')
        .select('rule_id')
        .in('rule_id', data.linked_rule_ids);

      return {
        ...data,
        linkedRules: ruleLinks || []
      };
    } catch (error) {
      console.error('Error getting pathway details:', error);
      return null;
    }
  }

  /**
   * Create evidence ingestion job
   */
  async startEvidenceIngestion(sourceId: string) {
    try {
      const job = await researchIntelligenceService.createEvidenceJob(sourceId, 'extraction');
      return job;
    } catch (error) {
      console.error('Error creating ingestion job:', error);
      return null;
    }
  }

  /**
   * Get extraction job status
   */
  async getExtractionJobStatus(jobId: string) {
    try {
      const { data, error } = await supabase
        .from('evidence_jobs')
        .select('*')
        .eq('job_id', jobId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting job status:', error);
      return null;
    }
  }

  /**
   * Get version history of evidence sets
   */
  async getVersionHistory() {
    try {
      return await researchIntelligenceService.getVersionSets();
    } catch (error) {
      console.error('Error getting version history:', error);
      return [];
    }
  }

  /**
   * Helper: check if pathway matches profile
   */
  private pathwayMatches(pathway: CarePathwayTemplate, profile: PatientProfile): boolean {
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
   * Helper: get patient-relevant topics
   */
  private getPatientRelevantTopics(profile: PatientProfile): string[] {
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

    topics.push('self_management');

    return topics;
  }
}

export const evidenceGateway = new EvidenceGateway();
