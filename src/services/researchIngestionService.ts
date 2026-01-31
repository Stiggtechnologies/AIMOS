import { supabase } from '../lib/supabase';

export interface ResearchIngestionJob {
  id: string;
  source_id: string;
  source_name: string;
  scheduled_for: string;
  completed_at?: string;
  papers_found: number;
  papers_ingested: number;
  papers_rejected: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error_message?: string;
  metadata_quality_score: number;
}

export interface ResearchIngestionResult {
  paperId: string;
  title: string;
  doi?: string;
  source: string;
  qualityScore: number;
  metadataCompleteness: number;
  qualityTags: string[];
  relevanceScores: {
    clinical: number;
    operational: number;
  };
  ingestedAt: string;
}

class ResearchIngestionService {
  async scheduleIngestionJobs() {
    const { data: sources, error: sourcesError } = await supabase
      .from('research_sources')
      .select('*')
      .eq('approved', true)
      .eq('auto_ingest', true);

    if (sourcesError) {
      console.error('Error fetching research sources:', sourcesError);
      return [];
    }

    if (!sources || sources.length === 0) {
      return [];
    }

    const jobs: any[] = [];

    for (const source of sources) {
      const { data: existingJob } = await supabase
        .from('ingestion_jobs')
        .select('*')
        .eq('source_id', source.id)
        .eq('status', 'running')
        .maybeSingle();

      if (existingJob) {
        continue;
      }

      const jobData = {
        source_id: source.id,
        source_name: source.name,
        scheduled_for: new Date().toISOString(),
        status: 'pending',
        papers_found: 0,
        papers_ingested: 0,
        papers_rejected: 0,
        metadata_quality_score: 0
      };

      const { data: job, error: jobError } = await supabase
        .from('ingestion_jobs')
        .insert(jobData)
        .select()
        .single();

      if (!jobError && job) {
        jobs.push(job);
      }
    }

    return jobs;
  }

  async extractPaperMetadata(paperData: any): Promise<{
    title: string;
    authors: string[];
    abstract: string;
    publicationDate: string;
    doi?: string;
    quality: number;
    completeness: number;
    tags: string[];
  }> {
    let completenessScore = 0;
    const tags: string[] = [];

    if (paperData.title) completenessScore += 15;
    if (paperData.authors && paperData.authors.length > 0) completenessScore += 15;
    if (paperData.abstract) completenessScore += 20;
    if (paperData.published_date) completenessScore += 15;
    if (paperData.doi) completenessScore += 10;
    if (paperData.methods) completenessScore += 10;
    if (paperData.outcomes) completenessScore += 10;

    if (completenessScore < 50) tags.push('incomplete-metadata');
    if (!paperData.methods) tags.push('no-methods');
    if (!paperData.outcomes) tags.push('no-outcomes');
    if (!paperData.limitations) tags.push('no-limitations');

    const qualityScore = this.calculateQualityScore(paperData);

    return {
      title: paperData.title || 'Untitled',
      authors: paperData.authors || [],
      abstract: paperData.abstract || '',
      publicationDate: paperData.published_date || new Date().toISOString(),
      doi: paperData.doi,
      quality: qualityScore,
      completeness: Math.min(completenessScore, 100),
      tags
    };
  }

  private calculateQualityScore(paperData: any): number {
    let score = 0;

    const studyType = paperData.study_type || '';
    const sampleSize = paperData.sample_size || 0;

    if (studyType.toLowerCase().includes('randomized')) score += 35;
    else if (studyType.toLowerCase().includes('prospective')) score += 25;
    else if (studyType.toLowerCase().includes('retrospective')) score += 15;
    else if (studyType.toLowerCase().includes('case-control')) score += 20;
    else score += 5;

    if (sampleSize >= 1000) score += 25;
    else if (sampleSize >= 500) score += 20;
    else if (sampleSize >= 100) score += 15;
    else if (sampleSize > 0) score += 10;

    if (paperData.peer_reviewed) score += 25;
    else score -= 10;

    if (paperData.outcomes) score += 10;
    if (paperData.statistical_significance) score += 5;

    return Math.max(0, Math.min(100, score));
  }

  async tagPaperRelevance(
    paperData: any,
    clinicalConditions: string[],
    operationalMetrics: string[]
  ): Promise<{ clinical: number; operational: number; tags: string[] }> {
    let clinicalScore = 0;
    let operationalScore = 0;
    const tags: string[] = [];

    const title = (paperData.title || '').toLowerCase();
    const abstract = (paperData.abstract || '').toLowerCase();
    const fullText = `${title} ${abstract}`;

    for (const condition of clinicalConditions) {
      if (fullText.includes(condition.toLowerCase())) {
        clinicalScore += 25;
        tags.push(`condition:${condition}`);
      }
    }

    for (const metric of operationalMetrics) {
      if (
        fullText.includes(metric.toLowerCase()) ||
        fullText.includes('return to work') ||
        fullText.includes('time to recovery') ||
        fullText.includes('functional outcome')
      ) {
        operationalScore += 25;
        tags.push(`metric:${metric}`);
      }
    }

    if (paperData.outcomes) {
      if (
        fullText.includes('outcome') ||
        fullText.includes('result') ||
        fullText.includes('effectiveness')
      ) {
        operationalScore += 15;
      }
    }

    return {
      clinical: Math.min(clinicalScore, 100),
      operational: Math.min(operationalScore, 100),
      tags
    };
  }

  async ingestPaperBatch(jobId: string, papers: any[]): Promise<ResearchIngestionResult[]> {
    const results: ResearchIngestionResult[] = [];

    const { data: priorities } = await supabase
      .from('research_priorities')
      .select('condition, metric')
      .eq('active', true);

    const conditions = priorities?.map((p: any) => p.condition) || [];
    const metrics = priorities?.map((p: any) => p.metric) || [];

    for (const paper of papers) {
      const metadata = await this.extractPaperMetadata(paper);
      const relevance = await this.tagPaperRelevance(paper, conditions, metrics);

      const qualityTags = [
        ...(metadata.tags || []),
        ...(relevance.tags || []),
        metadata.completeness >= 80 ? 'complete-metadata' : 'incomplete-metadata',
        metadata.quality >= 70 ? 'high-quality' : metadata.quality >= 50 ? 'moderate-quality' : 'low-quality'
      ];

      const shouldIngest = metadata.quality >= 40 && metadata.completeness >= 50;

      if (shouldIngest) {
        const { data: ingested, error: ingestError } = await supabase
          .from('research_papers')
          .insert({
            title: metadata.title,
            authors: metadata.authors,
            abstract: metadata.abstract,
            publication_date: metadata.publicationDate,
            doi: metadata.doi,
            study_type: paper.study_type || 'unknown',
            quality_score: metadata.quality,
            sample_size: paper.sample_size,
            conditions: conditions.filter((c: string) =>
              metadata.title.toLowerCase().includes(c.toLowerCase())
            ),
            interventions: paper.interventions || [],
            clinical_relevance: relevance.clinical,
            operational_relevance: relevance.operational,
            quality_tags: qualityTags,
            ai_summary: paper.summary || metadata.abstract,
            ingestion_source: paper.source || 'automated',
            ingestion_job_id: jobId,
            ingestion_status: 'processed'
          })
          .select()
          .single();

        if (!ingestError && ingested) {
          results.push({
            paperId: ingested.id,
            title: ingested.title,
            doi: ingested.doi,
            source: ingested.ingestion_source,
            qualityScore: metadata.quality,
            metadataCompleteness: metadata.completeness,
            qualityTags,
            relevanceScores: relevance,
            ingestedAt: new Date().toISOString()
          });
        }
      }
    }

    await supabase
      .from('ingestion_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        papers_found: papers.length,
        papers_ingested: results.length,
        papers_rejected: papers.length - results.length,
        metadata_quality_score:
          results.length > 0
            ? results.reduce((sum, r) => sum + r.metadataCompleteness, 0) / results.length
            : 0
      })
      .eq('id', jobId);

    return results;
  }

  async getIngestionStatus() {
    const { data: jobs, error } = await supabase
      .from('ingestion_jobs')
      .select('*')
      .order('scheduled_for', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error loading ingestion jobs:', error);
      return [];
    }

    return jobs || [];
  }

  async getQualityReport(timeframeStart?: string, timeframeEnd?: string) {
    let query = supabase
      .from('ingestion_jobs')
      .select('*')
      .eq('status', 'completed');

    if (timeframeStart) {
      query = query.gte('completed_at', timeframeStart);
    }
    if (timeframeEnd) {
      query = query.lte('completed_at', timeframeEnd);
    }

    const { data: jobs, error } = await query;

    if (error) {
      console.error('Error loading quality report:', error);
      return null;
    }

    if (!jobs || jobs.length === 0) {
      return {
        totalJobsCompleted: 0,
        totalPapersIngessted: 0,
        totalPapersRejected: 0,
        avgMetadataQuality: 0,
        avgAcceptanceRate: 0
      };
    }

    const totalPapers = jobs.reduce((sum, j) => sum + j.papers_found, 0);
    const totalIngested = jobs.reduce((sum, j) => sum + j.papers_ingested, 0);
    const totalRejected = jobs.reduce((sum, j) => sum + j.papers_rejected, 0);
    const avgQuality = jobs.reduce((sum, j) => sum + j.metadata_quality_score, 0) / jobs.length;

    return {
      totalJobsCompleted: jobs.length,
      totalPapersIngested: totalIngested,
      totalPapersRejected: totalRejected,
      avgMetadataQuality: avgQuality,
      avgAcceptanceRate: totalPapers > 0 ? (totalIngested / totalPapers) * 100 : 0
    };
  }

  async retryFailedIngestions(jobId: string) {
    const { data: job, error: jobError } = await supabase
      .from('ingestion_jobs')
      .select('*')
      .eq('id', jobId)
      .maybeSingle();

    if (jobError || !job) {
      return false;
    }

    await supabase
      .from('ingestion_jobs')
      .update({
        status: 'pending',
        error_message: null
      })
      .eq('id', jobId);

    return true;
  }
}

export const researchIngestionService = new ResearchIngestionService();
