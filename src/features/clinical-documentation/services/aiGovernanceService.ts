import type { IAIGovernanceService } from './types';
import type { AIGovernanceModel, AIPromptVersion, AIRun, Vendor, AIThresholdUpdateInput, PaginatedResult, PaginationParams, VendorRiskLevel, ContractStatus } from '../types';

export const aiGovernanceService: IAIGovernanceService = {
  async listAIModels(clinicId?: string): Promise<AIGovernanceModel[]> {
    throw new Error('Not implemented');
  },
  async getAIModel(modelId: string): Promise<AIGovernanceModel> {
    throw new Error('Not implemented');
  },
  async approveAIModel(modelId: string, approvedByUserId: string): Promise<AIGovernanceModel> {
    throw new Error('Not implemented');
  },
  async registerAIModel(name: string, vendor: string, purpose: string, config?: Record<string, unknown>): Promise<AIGovernanceModel> {
    throw new Error('Not implemented');
  },
  async listPromptVersions(modelId: string): Promise<AIPromptVersion[]> {
    throw new Error('Not implemented');
  },
  async getActivePromptVersion(modelId: string, promptKey: string): Promise<AIPromptVersion | null> {
    throw new Error('Not implemented');
  },
  async createPromptVersion(modelId: string, promptKey: string, version: number, promptText: string): Promise<AIPromptVersion> {
    throw new Error('Not implemented');
  },
  async activatePromptVersion(promptVersionId: string): Promise<AIPromptVersion> {
    throw new Error('Not implemented');
  },
  async listAIRuns(clinicId: string, pagination?: PaginationParams): Promise<PaginatedResult<AIRun>> {
    throw new Error('Not implemented');
  },
  async getAIRun(runId: string): Promise<AIRun> {
    throw new Error('Not implemented');
  },
  async createAIRun(
    clinicId: string,
    patientId: string,
    modelId: string,
    taskType: string,
    createdByUserId: string,
    options?: {
      encounterId?: string;
      noteDraftId?: string;
      promptVersionId?: string;
      inputMetadata?: Record<string, unknown>;
    }
  ): Promise<AIRun> {
    throw new Error('Not implemented');
  },
  async updateAIRunOutput(runId: string, outputMetadata: Record<string, unknown>): Promise<AIRun> {
    throw new Error('Not implemented');
  },
  async updateAIThresholds(input: AIThresholdUpdateInput): Promise<{ model_id: string; thresholds: Record<string, number> }> {
    throw new Error('Not implemented');
  },
  async listVendors(organizationId?: string): Promise<Vendor[]> {
    throw new Error('Not implemented');
  },
  async registerVendor(
    organizationId: string,
    name: string,
    serviceType: string,
    riskLevel: VendorRiskLevel,
    securityControls?: Record<string, unknown>
  ): Promise<Vendor> {
    throw new Error('Not implemented');
  },
  async updateVendorStatus(vendorId: string, contractStatus: ContractStatus): Promise<Vendor> {
    throw new Error('Not implemented');
  },
};