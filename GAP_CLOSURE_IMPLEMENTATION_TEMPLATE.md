# Gap Closure Implementation Template
## Governance Entry Points, Onboarding Workflows, Delegation Authority

---

## PART 1: GOVERNANCE ENTRY POINTS FOR CREDENTIALS & ROLES

### 1.1 Credential Authority Mapping

**Database Schema Addition:**

```sql
-- Map which roles can verify which credential types
CREATE TABLE IF NOT EXISTS role_credential_authority (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL,
  credential_type_id uuid NOT NULL REFERENCES credential_types(id),
  can_verify boolean DEFAULT false,
  can_reject boolean DEFAULT false,
  can_revoke boolean DEFAULT false,
  max_review_time_hours integer DEFAULT 72,
  escalation_authority uuid REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Track credential governance events
CREATE TABLE IF NOT EXISTS credential_governance_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  credential_id uuid NOT NULL REFERENCES credentials(id),
  action text NOT NULL, -- 'requested', 'verified', 'rejected', 'revoked'
  performed_by uuid NOT NULL REFERENCES auth.users(id),
  authority_role text NOT NULL,
  reason text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Credential governance dashboard
CREATE VIEW credential_governance_status AS
SELECT
  c.id,
  c.status,
  c.credential_number,
  ct.type_name,
  s.first_name || ' ' || s.last_name as staff_name,
  u.email as verifier_email,
  c.verification_status,
  COALESCE(cgl.action, 'pending') as last_action,
  cgl.performed_by as verified_by,
  c.updated_at as last_updated
FROM credentials c
JOIN credential_types ct ON c.credential_type_id = ct.id
JOIN staff_profiles s ON c.staff_id = s.id
LEFT JOIN auth.users u ON c.verified_by = u.id
LEFT JOIN credential_governance_log cgl ON c.id = cgl.credential_id
ORDER BY c.updated_at DESC;
```

### 1.2 Role-Based Credential Verification

**Service Implementation:**

```typescript
// services/credentialGovernance/credentialGovernanceService.ts
import { supabase } from '../../lib/supabase';

export interface CredentialVerificationAuthority {
  roleId: string;
  roleName: string;
  credentialTypeId: string;
  canVerify: boolean;
  canReject: boolean;
  canRevoke: boolean;
  maxReviewTimeHours: number;
  escalationAuthority?: string;
}

interface CredentialGovernanceEvent {
  credentialId: string;
  action: 'requested' | 'assigned_for_review' | 'verified' | 'rejected' | 'revoked' | 'escalated';
  performedBy: string;
  authorityRole: string;
  reason?: string;
  metadata?: Record<string, any>;
}

export const credentialGovernanceService = {
  // Check if user can verify specific credential type
  async canVerifyCredential(credentialId: string, userId: string): Promise<{
    canVerify: boolean;
    reason?: string;
    requiredRole?: string;
  }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

      const { data: credential } = await supabase
        .from('credentials')
        .select(`
          *,
          credential_types(type_name, id)
        `)
        .eq('id', credentialId)
        .maybeSingle();

      if (!credential) {
        return { canVerify: false, reason: 'Credential not found' };
      }

      const { data: authority } = await supabase
        .from('role_credential_authority')
        .select('*')
        .eq('role', profile?.role)
        .eq('credential_type_id', credential.credential_type_id)
        .maybeSingle();

      if (!authority || !authority.can_verify) {
        return {
          canVerify: false,
          reason: `Role ${profile?.role} cannot verify ${credential.credential_types.type_name}`
        };
      }

      return { canVerify: true };
    } catch (error) {
      console.error('Error checking credential verification authority:', error);
      return { canVerify: false, reason: 'Authorization check failed' };
    }
  },

  // Verify credential with governance tracking
  async verifyCredential(
    credentialId: string,
    verifiedBy: string,
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const canVerify = await this.canVerifyCredential(credentialId, verifiedBy);
      if (!canVerify.canVerify) {
        return { success: false, error: canVerify.reason };
      }

      // Update credential status
      const { error: updateError } = await supabase
        .from('credentials')
        .update({
          verification_status: 'verified',
          verified_by: verifiedBy,
          verified_at: new Date().toISOString(),
          status: 'active'
        })
        .eq('id', credentialId);

      if (updateError) throw updateError;

      // Log governance event
      await this.logGovernanceEvent({
        credentialId,
        action: 'verified',
        performedBy: verifiedBy,
        authorityRole: (await supabase.auth.getUser()).data.user?.id || '',
        reason: notes,
        metadata: { timestamp: new Date().toISOString() }
      });

      return { success: true };
    } catch (error) {
      console.error('Error verifying credential:', error);
      return { success: false, error: 'Verification failed' };
    }
  },

  // Reject credential with escalation if needed
  async rejectCredential(
    credentialId: string,
    rejectedBy: string,
    reason: string
  ): Promise<{ success: boolean; escalated?: boolean; error?: string }> {
    try {
      const { data: authority } = await supabase
        .from('role_credential_authority')
        .select('escalation_authority')
        .eq('role', (await supabase.auth.getUser()).data.user?.id)
        .maybeSingle();

      // Update credential
      const { error: updateError } = await supabase
        .from('credentials')
        .update({
          verification_status: 'failed',
          status: 'suspended'
        })
        .eq('id', credentialId);

      if (updateError) throw updateError;

      // Log rejection
      await this.logGovernanceEvent({
        credentialId,
        action: 'rejected',
        performedBy: rejectedBy,
        authorityRole: 'reviewer',
        reason,
        metadata: {
          escalationRequired: !!authority?.escalation_authority,
          timestamp: new Date().toISOString()
        }
      });

      // Auto-escalate if configured
      if (authority?.escalation_authority) {
        await this.escalateCredential(credentialId, authority.escalation_authority, reason);
        return { success: true, escalated: true };
      }

      return { success: true };
    } catch (error) {
      console.error('Error rejecting credential:', error);
      return { success: false, error: 'Rejection failed' };
    }
  },

  // Escalate credential review to authority
  async escalateCredential(
    credentialId: string,
    escalateToUserId: string,
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('credential_governance_log')
        .insert({
          credential_id: credentialId,
          action: 'escalated',
          performed_by: (await supabase.auth.getUser()).data.user?.id,
          authority_role: 'escalation',
          reason,
          metadata: { escalated_to: escalateToUserId }
        });

      if (error) throw error;

      // Create notification for escalation authority
      await supabase
        .from('notifications')
        .insert({
          user_id: escalateToUserId,
          type: 'credential_escalation',
          title: 'Credential Review Escalation',
          message: `Credential requires your review: ${reason}`,
          metadata: { credential_id: credentialId }
        });

      return { success: true };
    } catch (error) {
      console.error('Error escalating credential:', error);
      return { success: false, error: 'Escalation failed' };
    }
  },

  // Log all governance events
  async logGovernanceEvent(event: CredentialGovernanceEvent): Promise<void> {
    try {
      await supabase
        .from('credential_governance_log')
        .insert({
          credential_id: event.credentialId,
          action: event.action,
          performed_by: event.performedBy,
          authority_role: event.authorityRole,
          reason: event.reason,
          metadata: event.metadata
        });
    } catch (error) {
      console.error('Error logging governance event:', error);
    }
  },

  // Get credential governance audit trail
  async getAuditTrail(credentialId: string): Promise<CredentialGovernanceEvent[]> {
    try {
      const { data, error } = await supabase
        .from('credential_governance_log')
        .select(`
          *,
          auth.users(email)
        `)
        .eq('credential_id', credentialId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching audit trail:', error);
      return [];
    }
  }
};
```

---

## PART 2: SYSTEMATIC ONBOARDING WORKFLOW

### 2.1 Onboarding State Machine

**Database Schema:**

```sql
-- Onboarding workflow templates
CREATE TABLE IF NOT EXISTS onboarding_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,
  description text,
  steps jsonb NOT NULL, -- Array of step definitions
  required_credentials jsonb DEFAULT '[]'::jsonb,
  estimated_duration_days integer DEFAULT 14,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Active onboarding workflows per staff member
CREATE TABLE IF NOT EXISTS staff_onboarding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES staff_profiles(id),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  template_id uuid NOT NULL REFERENCES onboarding_templates(id),
  status text DEFAULT 'not_started', -- not_started | in_progress | blocked | complete | failed
  started_at timestamptz,
  completed_at timestamptz,
  blocked_until timestamptz,
  blocked_reason text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Individual onboarding steps
CREATE TABLE IF NOT EXISTS onboarding_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL REFERENCES staff_onboarding(id),
  template_step_id text NOT NULL, -- Reference to template step
  sequence_number integer NOT NULL,
  title text NOT NULL,
  description text,
  type text NOT NULL, -- credential_verification | training | system_access | team_intro | compliance
  status text DEFAULT 'pending', -- pending | in_progress | blocked | complete | failed | skipped
  assigned_to uuid REFERENCES auth.users(id),
  prerequisite_steps text[] DEFAULT '{}'::text[],
  required_credentials text[] DEFAULT '{}'::text[],
  time_estimate_minutes integer,
  due_date timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  completion_evidence text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Step prerequisites status
CREATE TABLE IF NOT EXISTS step_prerequisites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id uuid NOT NULL REFERENCES onboarding_steps(id),
  prerequisite_type text NOT NULL, -- credential | step | training | approval
  prerequisite_id text NOT NULL,
  status_required text NOT NULL, -- verified | complete | approved
  is_met boolean DEFAULT false,
  checked_at timestamptz,
  remediation_action text,
  created_at timestamptz DEFAULT now()
);

-- Onboarding progress view
CREATE VIEW onboarding_progress AS
SELECT
  so.id as workflow_id,
  sp.first_name || ' ' || sp.last_name as staff_name,
  c.name as clinic_name,
  so.status,
  COUNT(CASE WHEN os.status = 'complete' THEN 1 END)::integer as steps_complete,
  COUNT(CASE WHEN os.status = 'blocked' THEN 1 END)::integer as steps_blocked,
  COUNT(os.id)::integer as total_steps,
  ROUND(100.0 * COUNT(CASE WHEN os.status = 'complete' THEN 1 END) / NULLIF(COUNT(os.id), 0))::integer as percent_complete,
  so.started_at,
  so.completed_at,
  MAX(os.due_date) as next_due_date
FROM staff_onboarding so
JOIN staff_profiles sp ON so.staff_id = sp.id
JOIN clinics c ON so.clinic_id = c.id
LEFT JOIN onboarding_steps os ON so.id = os.workflow_id
GROUP BY so.id, sp.first_name, sp.last_name, c.name, so.status, so.started_at, so.completed_at;
```

### 2.2 Onboarding Service

```typescript
// services/onboarding/onboardingService.ts
import { supabase } from '../../lib/supabase';

export interface OnboardingTemplate {
  id: string;
  name: string;
  role: string;
  steps: OnboardingStepDefinition[];
  requiredCredentials: string[];
  estimatedDurationDays: number;
}

export interface OnboardingStepDefinition {
  id: string;
  sequence: number;
  title: string;
  type: 'credential_verification' | 'training' | 'system_access' | 'team_intro' | 'compliance';
  timeEstimateMinutes: number;
  prerequisites?: string[];
  requiredCredentials?: string[];
}

export interface OnboardingWorkflow {
  id: string;
  staffId: string;
  clinicId: string;
  templateId: string;
  status: 'not_started' | 'in_progress' | 'blocked' | 'complete' | 'failed';
  steps: OnboardingStep[];
  blockedReason?: string;
  blockedUntil?: string;
}

export interface OnboardingStep {
  id: string;
  sequenceNumber: number;
  title: string;
  status: 'pending' | 'in_progress' | 'blocked' | 'complete' | 'failed' | 'skipped';
  assignedTo?: string;
  prerequisites: StepPrerequisite[];
  dueDate?: string;
  completedAt?: string;
  completionEvidence?: string;
}

interface StepPrerequisite {
  type: 'credential' | 'step' | 'training';
  id: string;
  statusRequired: string;
  isMet: boolean;
  remediationAction?: string;
}

export const onboardingService = {
  // Create onboarding workflow for new staff
  async createOnboardingWorkflow(
    staffId: string,
    clinicId: string,
    role: string
  ): Promise<{ workflow: OnboardingWorkflow | null; error?: string }> {
    try {
      // Get template for role
      const { data: template, error: templateError } = await supabase
        .from('onboarding_templates')
        .select('*')
        .eq('role', role)
        .eq('is_active', true)
        .maybeSingle();

      if (templateError || !template) {
        return { workflow: null, error: `No template for role: ${role}` };
      }

      // Create workflow
      const { data: workflow, error: workflowError } = await supabase
        .from('staff_onboarding')
        .insert({
          staff_id: staffId,
          clinic_id: clinicId,
          template_id: template.id,
          status: 'not_started'
        })
        .select()
        .maybeSingle();

      if (workflowError) throw workflowError;

      // Create steps from template
      const steps = template.steps.map((step: OnboardingStepDefinition, index: number) => ({
        workflow_id: workflow.id,
        template_step_id: step.id,
        sequence_number: index,
        title: step.title,
        description: step.title,
        type: step.type,
        status: 'pending',
        prerequisite_steps: step.prerequisites || [],
        required_credentials: step.requiredCredentials || [],
        time_estimate_minutes: step.timeEstimateMinutes,
        due_date: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000).toISOString()
      }));

      const { error: stepsError } = await supabase
        .from('onboarding_steps')
        .insert(steps);

      if (stepsError) throw stepsError;

      // Check prerequisites for first step
      await this.validateStepPrerequisites(workflow.id, steps[0].template_step_id);

      return { workflow };
    } catch (error) {
      console.error('Error creating onboarding workflow:', error);
      return { workflow: null, error: 'Failed to create workflow' };
    }
  },

  // Start onboarding workflow
  async startOnboarding(workflowId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('staff_onboarding')
        .update({
          status: 'in_progress',
          started_at: new Date().toISOString()
        })
        .eq('id', workflowId);

      if (error) throw error;

      // Move first step to in_progress
      await supabase
        .from('onboarding_steps')
        .update({ status: 'in_progress' })
        .eq('workflow_id', workflowId)
        .eq('sequence_number', 0);

      return { success: true };
    } catch (error) {
      console.error('Error starting onboarding:', error);
      return { success: false, error: 'Failed to start' };
    }
  },

  // Complete a step
  async completeStep(
    stepId: string,
    completionEvidence?: string
  ): Promise<{ success: boolean; nextStep?: OnboardingStep; error?: string }> {
    try {
      // Update step
      const { error: stepError } = await supabase
        .from('onboarding_steps')
        .update({
          status: 'complete',
          completed_at: new Date().toISOString(),
          completion_evidence: completionEvidence
        })
        .eq('id', stepId);

      if (stepError) throw stepError;

      // Get workflow to find next step
      const { data: currentStep } = await supabase
        .from('onboarding_steps')
        .select('workflow_id, sequence_number')
        .eq('id', stepId)
        .maybeSingle();

      // Get next step
      const { data: nextStep, error: nextError } = await supabase
        .from('onboarding_steps')
        .select('*')
        .eq('workflow_id', currentStep?.workflow_id)
        .eq('sequence_number', (currentStep?.sequence_number || 0) + 1)
        .maybeSingle();

      if (!nextStep) {
        // Mark workflow as complete
        await supabase
          .from('staff_onboarding')
          .update({
            status: 'complete',
            completed_at: new Date().toISOString()
          })
          .eq('id', currentStep?.workflow_id);

        return { success: true };
      }

      // Validate prerequisites for next step
      const prereqsValid = await this.validateStepPrerequisites(
        currentStep?.workflow_id || '',
        nextStep.template_step_id
      );

      if (!prereqsValid) {
        return {
          success: true,
          error: 'Next step has unmet prerequisites'
        };
      }

      // Move to next step
      await supabase
        .from('onboarding_steps')
        .update({ status: 'in_progress' })
        .eq('id', nextStep.id);

      return { success: true, nextStep };
    } catch (error) {
      console.error('Error completing step:', error);
      return { success: false, error: 'Failed to complete step' };
    }
  },

  // Validate prerequisites for step
  async validateStepPrerequisites(
    workflowId: string,
    stepId: string
  ): Promise<boolean> {
    try {
      const { data: prerequisites, error } = await supabase
        .from('step_prerequisites')
        .select(`
          *,
          onboarding_steps(status)
        `)
        .eq('step_id', stepId);

      if (error) throw error;

      // Check all prerequisites
      const allMet = prerequisites?.every((prereq) => {
        if (prereq.prerequisite_type === 'credential') {
          // Check if staff has required credential with status
          return true; // Implementation specific to credential service
        } else if (prereq.prerequisite_type === 'step') {
          // Check if prerequisite step is complete
          return prereq.is_met;
        }
        return false;
      });

      return allMet || false;
    } catch (error) {
      console.error('Error validating prerequisites:', error);
      return false;
    }
  },

  // Get onboarding progress
  async getOnboardingProgress(staffId: string): Promise<OnboardingWorkflow[]> {
    try {
      const { data, error } = await supabase
        .from('staff_onboarding')
        .select(`
          *,
          onboarding_steps(*)
        `)
        .eq('staff_id', staffId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching onboarding progress:', error);
      return [];
    }
  },

  // Block onboarding due to unmet prerequisites
  async blockOnboarding(
    workflowId: string,
    reason: string,
    blockedUntil?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('staff_onboarding')
        .update({
          status: 'blocked',
          blocked_reason: reason,
          blocked_until: blockedUntil
        })
        .eq('id', workflowId);

      if (error) throw error;

      // Notify manager
      const { data: workflow } = await supabase
        .from('staff_onboarding')
        .select('staff_id')
        .eq('id', workflowId)
        .maybeSingle();

      if (workflow) {
        await supabase
          .from('notifications')
          .insert({
            user_id: workflow.staff_id,
            type: 'onboarding_blocked',
            title: 'Onboarding Blocked',
            message: reason,
            metadata: { workflow_id: workflowId }
          });
      }

      return { success: true };
    } catch (error) {
      console.error('Error blocking onboarding:', error);
      return { success: false, error: 'Failed to block' };
    }
  }
};
```

---

## PART 3: AUTHORITY DELEGATION WITH AUDIT TRACKING

### 3.1 Delegation Authority Schema

```sql
-- Define what authorities can be delegated
CREATE TABLE IF NOT EXISTS delegable_authorities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  authority_key text NOT NULL UNIQUE, -- e.g., 'approve_launch', 'verify_credential'
  authority_name text NOT NULL,
  authority_category text NOT NULL, -- 'clinical' | 'operational' | 'financial' | 'governance'
  description text,
  requires_segregation_check boolean DEFAULT true,
  max_delegation_chain_length integer DEFAULT 2,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Track delegations of authority
CREATE TABLE IF NOT EXISTS authority_delegations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  authority_id uuid NOT NULL REFERENCES delegable_authorities(id),
  from_user_id uuid NOT NULL REFERENCES auth.users(id),
  to_user_id uuid NOT NULL REFERENCES auth.users(id),
  clinic_scope uuid REFERENCES clinics(id), -- NULL = all clinics
  department_scope text, -- NULL = all departments
  valid_from timestamptz NOT NULL,
  valid_to timestamptz NOT NULL,
  delegation_amount_limit numeric(15,2), -- For financial authorities
  delegation_chain_length integer DEFAULT 1,
  can_sub_delegate boolean DEFAULT false,
  approved_by uuid NOT NULL REFERENCES auth.users(id),
  approved_at timestamptz DEFAULT now(),
  sod_review_status text DEFAULT 'pending', -- pending | approved | rejected | escalated
  sod_review_notes text,
  sod_reviewed_by uuid REFERENCES auth.users(id),
  is_active boolean DEFAULT true,
  revoked_at timestamptz,
  revoked_by uuid REFERENCES auth.users(id),
  revoke_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Authority delegation audit trail
CREATE TABLE IF NOT EXISTS delegation_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delegation_id uuid NOT NULL REFERENCES authority_delegations(id),
  event_type text NOT NULL, -- 'created' | 'approved' | 'used' | 'revoked' | 'expired'
  performed_by uuid REFERENCES auth.users(id),
  action_details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Segregation of Duties (SoD) conflict matrix
CREATE TABLE IF NOT EXISTS sod_conflict_matrix (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  authority_id1 uuid NOT NULL REFERENCES delegable_authorities(id),
  authority_id2 uuid NOT NULL REFERENCES delegable_authorities(id),
  conflict_level text NOT NULL, -- 'critical' | 'high' | 'medium' | 'low'
  conflict_description text,
  remediation_required text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(authority_id1, authority_id2)
);

-- View for active delegations
CREATE VIEW active_delegations AS
SELECT
  ad.id,
  au.authority_key,
  au.authority_name,
  fu.email as from_user,
  tu.email as to_user,
  ad.valid_from,
  ad.valid_to,
  ad.sod_review_status,
  ad.is_active,
  c.name as clinic_scope,
  ad.delegation_amount_limit,
  ad.can_sub_delegate
FROM authority_delegations ad
JOIN delegable_authorities au ON ad.authority_id = au.id
JOIN auth.users fu ON ad.from_user_id = fu.id
JOIN auth.users tu ON ad.to_user_id = tu.id
LEFT JOIN clinics c ON ad.clinic_scope = c.id
WHERE ad.is_active = true
  AND ad.valid_from <= now()
  AND ad.valid_to > now();
```

### 3.2 Delegation Service

```typescript
// services/delegation/delegationService.ts
import { supabase } from '../../lib/supabase';

export interface DelegableAuthority {
  id: string;
  key: string;
  name: string;
  category: 'clinical' | 'operational' | 'financial' | 'governance';
  requiresSoD: boolean;
  maxChainLength: number;
}

export interface AuthorityDelegation {
  id: string;
  authorityId: string;
  fromUserId: string;
  toUserId: string;
  validFrom: string;
  validTo: string;
  delegationAmountLimit?: number;
  clinicScope?: string;
  canSubDelegate: boolean;
  sodReviewStatus: 'pending' | 'approved' | 'rejected' | 'escalated';
  isActive: boolean;
}

export interface SoDConflict {
  authorityId1: string;
  authorityId2: string;
  conflictLevel: 'critical' | 'high' | 'medium' | 'low';
  description: string;
}

export const delegationService = {
  // Create new delegation with SoD check
  async createDelegation(
    authorityKey: string,
    fromUserId: string,
    toUserId: string,
    validFrom: string,
    validTo: string,
    options?: {
      clinicScope?: string;
      delegationAmountLimit?: number;
      canSubDelegate?: boolean;
    }
  ): Promise<{ delegation: AuthorityDelegation | null; sodConflicts?: SoDConflict[]; error?: string }> {
    try {
      const currentUser = (await supabase.auth.getUser()).data.user;

      // Get authority definition
      const { data: authority } = await supabase
        .from('delegable_authorities')
        .select('*')
        .eq('authority_key', authorityKey)
        .maybeSingle();

      if (!authority) {
        return { delegation: null, error: `Authority not found: ${authorityKey}` };
      }

      // Check SoD conflicts
      if (authority.requires_segregation_check) {
        const conflicts = await this.checkSoDConflicts(toUserId, authority.id);
        if (conflicts.length > 0) {
          return {
            delegation: null,
            sodConflicts: conflicts,
            error: 'SoD conflicts detected - escalation required'
          };
        }
      }

      // Create delegation
      const { data: delegation, error } = await supabase
        .from('authority_delegations')
        .insert({
          authority_id: authority.id,
          from_user_id: fromUserId,
          to_user_id: toUserId,
          clinic_scope: options?.clinicScope,
          valid_from: validFrom,
          valid_to: validTo,
          delegation_amount_limit: options?.delegationAmountLimit,
          can_sub_delegate: options?.canSubDelegate || false,
          approved_by: currentUser?.id,
          approved_at: new Date().toISOString(),
          sod_review_status: 'approved'
        })
        .select()
        .maybeSingle();

      if (error) throw error;

      // Log delegation creation
      await this.logDelegationEvent(delegation.id, 'created', currentUser?.id);

      return { delegation };
    } catch (error) {
      console.error('Error creating delegation:', error);
      return { delegation: null, error: 'Failed to create delegation' };
    }
  },

  // Check SoD conflicts
  async checkSoDConflicts(userId: string, authorityId: string): Promise<SoDConflict[]> {
    try {
      // Get user's current authorities
      const { data: userAuthorities } = await supabase
        .from('active_delegations')
        .select('authority_id')
        .eq('to_user', userId);

      if (!userAuthorities) return [];

      // Check conflicts with each
      const conflictQueries = userAuthorities.map((auth: any) =>
        supabase
          .from('sod_conflict_matrix')
          .select('*')
          .or(
            `and(authority_id1.eq.${authorityId},authority_id2.eq.${auth.authority_id}),and(authority_id1.eq.${auth.authority_id},authority_id2.eq.${authorityId})`
          )
      );

      const results = await Promise.all(conflictQueries);
      const conflicts = results
        .flatMap((r) => r.data || [])
        .filter((c: any) => c.conflict_level === 'critical' || c.conflict_level === 'high');

      return conflicts;
    } catch (error) {
      console.error('Error checking SoD conflicts:', error);
      return [];
    }
  },

  // Revoke delegation
  async revokeDelegation(
    delegationId: string,
    reason: string,
    revokedBy: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('authority_delegations')
        .update({
          is_active: false,
          revoked_at: new Date().toISOString(),
          revoked_by: revokedBy,
          revoke_reason: reason
        })
        .eq('id', delegationId);

      if (error) throw error;

      // Log revocation
      await this.logDelegationEvent(delegationId, 'revoked', revokedBy, {
        reason
      });

      return { success: true };
    } catch (error) {
      console.error('Error revoking delegation:', error);
      return { success: false, error: 'Failed to revoke' };
    }
  },

  // Get user's active delegations
  async getUserDelegations(userId: string): Promise<AuthorityDelegation[]> {
    try {
      const { data, error } = await supabase
        .from('active_delegations')
        .select('*')
        .eq('to_user', userId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching delegations:', error);
      return [];
    }
  },

  // Get delegation audit trail
  async getDelegationAuditTrail(delegationId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('delegation_audit_log')
        .select(`
          *,
          auth.users(email)
        `)
        .eq('delegation_id', delegationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching audit trail:', error);
      return [];
    }
  },

  // Log delegation event
  async logDelegationEvent(
    delegationId: string,
    eventType: string,
    performedBy: string,
    details?: Record<string, any>
  ): Promise<void> {
    try {
      await supabase
        .from('delegation_audit_log')
        .insert({
          delegation_id: delegationId,
          event_type: eventType,
          performed_by: performedBy,
          action_details: details || {}
        });
    } catch (error) {
      console.error('Error logging delegation event:', error);
    }
  }
};
```

---

## UI Components for Gap Closure

### Credential Governance Dashboard

```typescript
// components/governance/CredentialGovernanceDashboard.tsx
import { CredentialGovernanceView } from './CredentialGovernanceView';
import { DelegationManagementView } from './DelegationManagementView';
import { OnboardingProgressView } from './OnboardingProgressView';

export function GovernanceDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Governance Control Center</h1>
        <p className="mt-2 text-gray-600">Authority, Credentials & Onboarding Management</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Credential Verification Authority */}
        <CredentialGovernanceView />

        {/* Authority Delegation Management */}
        <DelegationManagementView />

        {/* Onboarding Progress */}
        <OnboardingProgressView />
      </div>
    </div>
  );
}
```

---

## Implementation Checklist

### Phase 1: Governance Entry Points (Week 1)
- [ ] Deploy credential governance schema
- [ ] Implement credential verification authority service
- [ ] Build credential governance audit views
- [ ] Create credential dashboard UI
- [ ] Set up role-to-credential mappings
- [ ] Test verification workflows

### Phase 2: Onboarding Workflows (Week 2-3)
- [ ] Deploy onboarding schema
- [ ] Implement onboarding state machine service
- [ ] Create step progression logic
- [ ] Build prerequisite validation
- [ ] Implement auto-blocking for prerequisites
- [ ] Create onboarding progress dashboard

### Phase 3: Delegation Authority (Week 3-4)
- [ ] Deploy delegation authority schema
- [ ] Implement SoD conflict matrix
- [ ] Build delegation service
- [ ] Create delegation UI
- [ ] Implement audit trail logging
- [ ] Set up approval workflows

### Validation & Testing
- [ ] Credential verification audit trail completeness
- [ ] Onboarding prerequisite blocking functionality
- [ ] Delegation SoD conflict detection accuracy
- [ ] Audit trail immutability and traceability
- [ ] Regulatory compliance review

---

**Next:** Deploy Phase 1 and begin credential governance implementation
