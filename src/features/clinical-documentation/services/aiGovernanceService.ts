import { supabase } from '../../../lib/supabase';
import type { IAIGovernanceService } from './types';
import type { AIGovernanceModel, AIPromptVersion, AIRun, Vendor, AIThresholdUpdateInput, PaginatedResult, PaginationParams, VendorRiskLevel, ContractStatus } from '../types';

const MODELS = 'documentation_ai_models';
const PROMPTS = 'documentation_ai_prompt_versions';
const RUNS = 'documentation_ai_runs';
const VENDORS = 'documentation_vendors';

function paginate(pagination?: PaginationParams) {
  const limit = pagination?.limit ?? 20;
  const page = pagination?.page ?? 1;
  const offset = (page - 1) * limit;
  return { limit, page, offset };
}

export const aiGovernanceService: IAIGovernanceService = {
  async listAIModels(): Promise<AIGovernanceModel[]> {
    const { data, error } = await supabase.from(MODELS).select('*').order('created_at', { ascending: false });
    if (error) throw new Error(`listAIModels failed: ${error.message}`);
    return data as AIGovernanceModel[];
  },

  async getAIModel(modelId: string): Promise<AIGovernanceModel> {
    const { data, error } = await supabase.from(MODELS).select('*').eq('id', modelId).single();
    if (error) throw new Error(`getAIModel failed: ${error.message}`);
    return data as AIGovernanceModel;
  },

  async approveAIModel(modelId: string): Promise<AIGovernanceModel> {
    const { data, error } = await supabase
      .from(MODELS).update({ approved: true, approved_at: new Date().toISOString() }).eq('id', modelId).select().single();
    if (error) throw new Error(`approveAIModel failed: ${error.message}`);
    return data as AIGovernanceModel;
  },

  async registerAIModel(name: string, vendor: string, purpose: string, config?: Record<string, unknown>): Promise<AIGovernanceModel> {
    const { data, error } = await supabase
      .from(MODELS).insert({ name, vendor, purpose, approved: false, config: config ?? null }).select().single();
    if (error) throw new Error(`registerAIModel failed: ${error.message}`);
    return data as AIGovernanceModel;
  },

  async listPromptVersions(modelId: string): Promise<AIPromptVersion[]> {
    const { data, error } = await supabase
      .from(PROMPTS).select('*').eq('model_id', modelId).order('version', { ascending: false });
    if (error) throw new Error(`listPromptVersions failed: ${error.message}`);
    return data as AIPromptVersion[];
  },

  async getActivePromptVersion(modelId: string, promptKey: string): Promise<AIPromptVersion | null> {
    const { data, error } = await supabase
      .from(PROMPTS).select('*').eq('model_id', modelId).eq('prompt_key', promptKey).eq('active', true).maybeSingle();
    if (error && error.code !== 'PGRST116') throw new Error(`getActivePromptVersion failed: ${error.message}`);
    return (data as AIPromptVersion) ?? null;
  },

  async createPromptVersion(modelId: string, promptKey: string, version: number, promptText: string): Promise<AIPromptVersion> {
    const { data, error } = await supabase
      .from(PROMPTS).insert({ model_id: modelId, prompt_key: promptKey, version, prompt_text: promptText, active: false }).select().single();
    if (error) throw new Error(`createPromptVersion failed: ${error.message}`);
    return data as AIPromptVersion;
  },

  async activatePromptVersion(promptVersionId: string): Promise<AIPromptVersion> {
    const { data: target, error: lookupError } = await supabase
      .from(PROMPTS).select('*').eq('id', promptVersionId).single();
    if (lookupError) throw new Error(`activatePromptVersion (lookup) failed: ${lookupError.message}`);

    // Only one version per prompt_key may be active at a time.
    await supabase.from(PROMPTS).update({ active: false }).eq('prompt_key', (target as AIPromptVersion).prompt_key);

    const { data, error } = await supabase
      .from(PROMPTS).update({ active: true }).eq('id', promptVersionId).select().single();
    if (error) throw new Error(`activatePromptVersion failed: ${error.message}`);
    return data as AIPromptVersion;
  },

  async listAIRuns(clinicId: string, pagination?: PaginationParams): Promise<PaginatedResult<AIRun>> {
    const { limit, page, offset } = paginate(pagination);
    const { data, error, count } = await supabase
      .from(RUNS).select('*', { count: 'exact' })
      .eq('clinic_id', clinicId).order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw new Error(`listAIRuns failed: ${error.message}`);
    const total = count ?? data.length;
    return { data: data as AIRun[], total, page, limit, has_more: offset + limit < total };
  },

  async getAIRun(runId: string): Promise<AIRun> {
    const { data, error } = await supabase.from(RUNS).select('*').eq('id', runId).single();
    if (error) throw new Error(`getAIRun failed: ${error.message}`);
    return data as AIRun;
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
    const { data, error } = await supabase
      .from(RUNS)
      .insert({
        clinic_id: clinicId,
        patient_id: patientId,
        model_id: modelId,
        task_type: taskType,
        created_by_user_id: createdByUserId,
        encounter_id: options?.encounterId ?? null,
        note_draft_id: options?.noteDraftId ?? null,
        prompt_version_id: options?.promptVersionId ?? null,
        input_metadata: options?.inputMetadata ?? null,
        human_review_required: false,
      })
      .select()
      .single();
    if (error) throw new Error(`createAIRun failed: ${error.message}`);
    return data as AIRun;
  },

  async updateAIRunOutput(runId: string, outputMetadata: Record<string, unknown>): Promise<AIRun> {
    const { data, error } = await supabase
      .from(RUNS).update({ output_metadata: outputMetadata }).eq('id', runId).select().single();
    if (error) throw new Error(`updateAIRunOutput failed: ${error.message}`);
    return data as AIRun;
  },

  async updateAIThresholds(input: AIThresholdUpdateInput): Promise<{ model_id: string; thresholds: Record<string, number> }> {
    const { data: model, error: lookupError } = await supabase
      .from(MODELS).select('config').eq('id', input.model_id).single();
    if (lookupError) throw new Error(`updateAIThresholds (lookup) failed: ${lookupError.message}`);
    const config = { ...((model?.config as Record<string, unknown>) || {}), thresholds: input.thresholds };
    const { error } = await supabase.from(MODELS).update({ config }).eq('id', input.model_id);
    if (error) throw new Error(`updateAIThresholds failed: ${error.message}`);
    return { model_id: input.model_id, thresholds: input.thresholds };
  },

  async listVendors(organizationId?: string): Promise<Vendor[]> {
    let query = supabase.from(VENDORS).select('*');
    if (organizationId) query = query.eq('organization_id', organizationId);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw new Error(`listVendors failed: ${error.message}`);
    return data as Vendor[];
  },

  async registerVendor(
    organizationId: string,
    name: string,
    serviceType: string,
    riskLevel: VendorRiskLevel,
    securityControls?: Record<string, unknown>
  ): Promise<Vendor> {
    const { data, error } = await supabase
      .from(VENDORS)
      .insert({
        organization_id: organizationId,
        name,
        service_type: serviceType,
        risk_level: riskLevel,
        contract_status: 'pending',
        security_controls: securityControls ?? null,
        active: true,
      })
      .select()
      .single();
    if (error) throw new Error(`registerVendor failed: ${error.message}`);
    return data as Vendor;
  },

  async updateVendorStatus(vendorId: string, contractStatus: ContractStatus): Promise<Vendor> {
    const { data, error } = await supabase
      .from(VENDORS).update({ contract_status: contractStatus }).eq('id', vendorId).select().single();
    if (error) throw new Error(`updateVendorStatus failed: ${error.message}`);
    return data as Vendor;
  },
};
