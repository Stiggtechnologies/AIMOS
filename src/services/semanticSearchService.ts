import { supabase } from '../lib/supabase';

interface EvidenceClaimWithEmbedding {
  claim_id: string;
  claim_text: string;
  embedding?: number[];
  similarity_score?: number;
}

interface SearchResult {
  claim_id: string;
  claim_text: string;
  similarity_score: number;
  evidence_level: string;
  clinical_tags: string[];
  confidence_score: number;
}

class SemanticSearchService {
  private embeddingsCache = new Map<string, number[]>();

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY || ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: text,
          model: 'text-embedding-3-small',
        }),
      });

      if (!response.ok) {
        throw new Error(`Embeddings API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      return [];
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length === 0 || b.length === 0) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  async semanticSearchClaims(
    query: string,
    limit: number = 5,
    minSimilarity: number = 0.3
  ): Promise<SearchResult[]> {
    try {
      const queryEmbedding = await this.generateEmbedding(query);
      if (queryEmbedding.length === 0) {
        return [];
      }

      const { data: claims, error } = await supabase
        .from('evidence_claims')
        .select('claim_id, claim_text, embedding, evidence_level, clinical_tags, confidence_score, status')
        .eq('status', 'approved');

      if (error || !claims) {
        console.error('Error fetching claims:', error);
        return [];
      }

      const results: SearchResult[] = [];

      for (const claim of claims as any[]) {
        let embedding = claim.embedding;

        if (!embedding && this.embeddingsCache.has(claim.claim_id)) {
          embedding = this.embeddingsCache.get(claim.claim_id);
        }

        if (!embedding) {
          embedding = await this.generateEmbedding(claim.claim_text);
          if (embedding.length > 0) {
            this.embeddingsCache.set(claim.claim_id, embedding);
            await this.storeEmbedding(claim.claim_id, embedding);
          }
        }

        if (embedding && embedding.length > 0) {
          const similarity = this.cosineSimilarity(queryEmbedding, embedding);

          if (similarity >= minSimilarity) {
            results.push({
              claim_id: claim.claim_id,
              claim_text: claim.claim_text,
              similarity_score: similarity,
              evidence_level: claim.evidence_level,
              clinical_tags: claim.clinical_tags || [],
              confidence_score: claim.confidence_score,
            });
          }
        }
      }

      return results
        .sort((a, b) => b.similarity_score - a.similarity_score)
        .slice(0, limit);
    } catch (error) {
      console.error('Error in semantic search:', error);
      return [];
    }
  }

  async findSimilarClaims(claimId: string, limit: number = 5): Promise<SearchResult[]> {
    try {
      const { data: claim, error } = await supabase
        .from('evidence_claims')
        .select('claim_text')
        .eq('claim_id', claimId)
        .maybeSingle();

      if (error || !claim) {
        console.error('Error fetching claim:', error);
        return [];
      }

      return this.semanticSearchClaims(claim.claim_text, limit);
    } catch (error) {
      console.error('Error finding similar claims:', error);
      return [];
    }
  }

  async searchByOutcome(outcome: string, limit: number = 10): Promise<SearchResult[]> {
    try {
      const { data: claims, error } = await supabase
        .from('evidence_claims')
        .select('claim_id, claim_text, outcomes, evidence_level, clinical_tags, confidence_score, status')
        .contains('outcomes', [outcome])
        .eq('status', 'approved')
        .limit(limit);

      if (error) {
        console.error('Error searching by outcome:', error);
        return [];
      }

      return (claims || []).map((claim: any) => ({
        claim_id: claim.claim_id,
        claim_text: claim.claim_text,
        similarity_score: 1.0,
        evidence_level: claim.evidence_level,
        clinical_tags: claim.clinical_tags || [],
        confidence_score: claim.confidence_score,
      }));
    } catch (error) {
      console.error('Error in outcome search:', error);
      return [];
    }
  }

  async storeEmbedding(claimId: string, embedding: number[]): Promise<void> {
    try {
      await supabase
        .from('evidence_claims')
        .update({ embedding })
        .eq('claim_id', claimId);
    } catch (error) {
      console.error('Error storing embedding:', error);
    }
  }

  async batchGenerateEmbeddings(limit: number = 100): Promise<number> {
    try {
      const { data: claims, error } = await supabase
        .from('evidence_claims')
        .select('claim_id, claim_text')
        .is('embedding', null)
        .eq('status', 'approved')
        .limit(limit);

      if (error || !claims) {
        console.error('Error fetching claims without embeddings:', error);
        return 0;
      }

      let count = 0;
      for (const claim of claims) {
        const embedding = await this.generateEmbedding((claim as any).claim_text);
        if (embedding.length > 0) {
          await this.storeEmbedding((claim as any).claim_id, embedding);
          count++;
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      return count;
    } catch (error) {
      console.error('Error in batch generation:', error);
      return 0;
    }
  }
}

export const semanticSearchService = new SemanticSearchService();
