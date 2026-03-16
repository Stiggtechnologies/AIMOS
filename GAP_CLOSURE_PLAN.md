# AIM OS - GAP CLOSURE PLAN

**Document Version:** 1.0
**Date:** March 13, 2026
**Target Completion:** April 15, 2026 (4 weeks before launch)

---

## EXECUTIVE SUMMARY

Based on the Requirements Coverage Matrix, AIM OS has **95% coverage (11.4/12 requirements)**. This plan addresses the remaining 5% gap and optional enhancements.

**Current Status:**
- ✅ 11 requirements at 100%
- ⚠️ 1 requirement at 85% (Enterprise Governance)
- 🎯 8 bonus features beyond requirements

**Gap Closure Objective:** Achieve 100% coverage on all 12 requirements before May 1, 2026 launch.

---

## 📊 IDENTIFIED GAPS

### PRIORITY 1: CRITICAL GAPS (Must Fix Before Launch)

None. All critical functionality is implemented and operational.

---

### PRIORITY 2: HIGH-VALUE GAPS (Close Before Launch)

#### Gap 1: Multi-Level Approval Workflows
**Requirement:** Enterprise Governance (#12)
**Current State:** Single-level approvals only
**Target State:** Multi-level approval chains with delegation
**Impact:** Medium - Needed for financial governance
**Effort:** 1 week
**Owner:** Backend Team

**Implementation Plan:**
1. Create approval chain configuration table
2. Add delegation support
3. Update approval workflows
4. Build delegation UI
5. Test approval routing

**Files to Modify:**
- `supabase/migrations/new_multi_level_approvals.sql`
- `src/services/governanceService.ts`
- `src/services/decisionEnforcementService.ts`
- `src/components/aim-os/ApprovalModal.tsx`

---

#### Gap 2: SOAP Notes Enhancement
**Requirement:** Clinical Care Delivery (#2)
**Current State:** Basic text entry
**Target State:** Voice-to-text dictation + templates
**Impact:** High - Clinical efficiency
**Effort:** 2 weeks
**Owner:** Clinical Team

**Implementation Plan:**
1. Integrate Web Speech API
2. Create SOAP note templates library
3. Add autocomplete for common phrases
4. Build template selection UI
5. Add voice commands

**Files to Modify:**
- `src/components/clinician/ClinicalChartingWorkflow.tsx`
- `src/services/clinicalIntelligenceService.ts`
- New: `src/components/clinician/VoiceDictation.tsx`
- New: `src/components/clinician/SOAPTemplates.tsx`

---

### PRIORITY 3: NICE-TO-HAVE ENHANCEMENTS (Optional)

#### Enhancement 1: Advanced Audit Retention Policies
**Current State:** Unlimited audit retention
**Target State:** Automated archival and compliance policies
**Impact:** Low - Compliance enhancement
**Effort:** 1 week
**Owner:** DevOps Team

**Implementation Plan:**
1. Create audit archive table
2. Build archival cron job
3. Add retention policy configuration
4. Implement automated cleanup
5. Add archive search capability

---

#### Enhancement 2: Permission Delegation System
**Current State:** Static role assignments
**Target State:** Temporary permission delegation
**Impact:** Medium - Operational flexibility
**Effort:** 1 week
**Owner:** Backend Team

**Implementation Plan:**
1. Add delegation table
2. Build time-bound permission logic
3. Create delegation UI
4. Add approval workflow for delegations
5. Implement auto-revoke on expiry

---

## 🎯 DETAILED IMPLEMENTATION PLANS

### PLAN A: Multi-Level Approval Workflows

#### Database Schema

```sql
-- Migration: 20260315000000_create_multi_level_approvals.sql

CREATE TABLE approval_chain_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  entity_type TEXT NOT NULL, -- 'budget', 'expense', 'hire', etc.
  approval_levels JSONB NOT NULL,
  -- Example: [
  --   {"level": 1, "role": "manager", "threshold": 5000},
  --   {"level": 2, "role": "director", "threshold": 25000},
  --   {"level": 3, "role": "cfo", "threshold": null}
  -- ]
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE approval_chain_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES approval_chain_templates(id),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  current_level INTEGER DEFAULT 1,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected, cancelled
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE approval_chain_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_instance_id UUID REFERENCES approval_chain_instances(id) ON DELETE CASCADE,
  level INTEGER NOT NULL,
  approver_role TEXT NOT NULL,
  approver_user_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending', -- pending, approved, rejected, delegated
  comments TEXT,
  approved_at TIMESTAMPTZ,
  delegated_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_approval_chain_instances_entity ON approval_chain_instances(entity_type, entity_id);
CREATE INDEX idx_approval_chain_steps_status ON approval_chain_steps(status) WHERE status = 'pending';
CREATE INDEX idx_approval_chain_steps_approver ON approval_chain_steps(approver_user_id);

-- RLS Policies
ALTER TABLE approval_chain_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_chain_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_chain_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view approval templates"
  ON approval_chain_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can view approval chains they're involved in"
  ON approval_chain_instances FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT chain_instance_id FROM approval_chain_steps
      WHERE approver_user_id = auth.uid() OR delegated_to = auth.uid()
    )
  );

CREATE POLICY "Users can view their approval steps"
  ON approval_chain_steps FOR SELECT
  TO authenticated
  USING (approver_user_id = auth.uid() OR delegated_to = auth.uid());

CREATE POLICY "Users can update their approval steps"
  ON approval_chain_steps FOR UPDATE
  TO authenticated
  USING (approver_user_id = auth.uid() OR delegated_to = auth.uid())
  WITH CHECK (approver_user_id = auth.uid() OR delegated_to = auth.uid());
```

#### Service Layer

```typescript
// src/services/approvalChainService.ts

export interface ApprovalChainLevel {
  level: number;
  role: string;
  threshold?: number;
}

export interface ApprovalChainTemplate {
  id: string;
  name: string;
  entity_type: string;
  approval_levels: ApprovalChainLevel[];
}

export class ApprovalChainService {

  async initiateApprovalChain(
    entityType: string,
    entityId: string,
    amount?: number,
    metadata?: any
  ): Promise<string> {
    // 1. Find appropriate template
    const template = await this.findTemplate(entityType, amount);

    // 2. Create chain instance
    const { data: chain } = await supabase
      .from('approval_chain_instances')
      .insert({
        template_id: template.id,
        entity_type: entityType,
        entity_id: entityId,
        metadata
      })
      .select()
      .single();

    // 3. Create approval steps
    await this.createApprovalSteps(chain.id, template.approval_levels);

    // 4. Notify first approver
    await this.notifyNextApprover(chain.id);

    return chain.id;
  }

  async approveStep(stepId: string, comments?: string): Promise<void> {
    // 1. Update step as approved
    await supabase
      .from('approval_chain_steps')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        comments
      })
      .eq('id', stepId);

    // 2. Check if all steps complete
    const chainInstance = await this.getChainByStepId(stepId);
    const allSteps = await this.getChainSteps(chainInstance.id);

    if (allSteps.every(s => s.status === 'approved')) {
      // Chain complete - approve entity
      await this.finalizeApproval(chainInstance);
    } else {
      // Advance to next level
      await this.advanceChain(chainInstance.id);
    }
  }

  async delegateApproval(stepId: string, delegateToUserId: string): Promise<void> {
    await supabase
      .from('approval_chain_steps')
      .update({
        status: 'delegated',
        delegated_to: delegateToUserId
      })
      .eq('id', stepId);

    // Notify delegate
    await notificationService.create({
      user_id: delegateToUserId,
      title: 'Approval Delegated to You',
      message: 'You have been delegated an approval task',
      type: 'approval_delegation'
    });
  }
}
```

#### UI Component

```typescript
// src/components/aim-os/ApprovalChainModal.tsx

export function ApprovalChainModal({
  entityType,
  entityId,
  onClose
}: ApprovalChainModalProps) {
  const [chain, setChain] = useState<ApprovalChain | null>(null);
  const [steps, setSteps] = useState<ApprovalStep[]>([]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6">Approval Chain</h2>

          {/* Progress Indicator */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              {steps.map((step, idx) => (
                <div key={step.id} className="flex items-center">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    ${step.status === 'approved' ? 'bg-green-500' :
                      step.status === 'pending' ? 'bg-blue-500' : 'bg-gray-300'}
                    text-white font-semibold
                  `}>
                    {step.status === 'approved' ? '✓' : idx + 1}
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={`h-1 w-20 ${
                      step.status === 'approved' ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step Details */}
          <div className="space-y-4">
            {steps.map((step) => (
              <div key={step.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">
                    Level {step.level}: {step.approver_role}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    step.status === 'approved' ? 'bg-green-100 text-green-800' :
                    step.status === 'pending' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {step.status}
                  </span>
                </div>

                {step.status === 'pending' && step.approver_user_id === currentUserId && (
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => handleApprove(step.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(step.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleDelegate(step.id)}
                      className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                      Delegate
                    </button>
                  </div>
                )}

                {step.comments && (
                  <p className="mt-2 text-sm text-gray-600">{step.comments}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

### PLAN B: SOAP Notes Voice Dictation

#### Implementation

```typescript
// src/components/clinician/VoiceDictation.tsx

export function VoiceDictation({
  onTranscript,
  field
}: VoiceDictationProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) {
      console.error('Speech recognition not supported');
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      setTranscript(finalTranscript || interimTranscript);
      onTranscript(finalTranscript || interimTranscript);
    };

    if (isListening) {
      recognition.start();
    } else {
      recognition.stop();
    }

    return () => recognition.stop();
  }, [isListening]);

  return (
    <button
      onClick={() => setIsListening(!isListening)}
      className={`p-2 rounded ${
        isListening ? 'bg-red-500 animate-pulse' : 'bg-blue-500'
      } text-white`}
    >
      {isListening ? <MicOff size={20} /> : <Mic size={20} />}
    </button>
  );
}
```

#### SOAP Templates

```typescript
// src/data/soapTemplates.ts

export const SOAP_TEMPLATES = {
  'low-back-pain-initial': {
    name: 'Low Back Pain - Initial Assessment',
    subjective: `Chief Complaint: Low back pain
Location: [lumbar spine / L4-L5 / sacroiliac]
Onset: [acute / gradual] [date]
Mechanism: [lifting / bending / unknown]
Pain Description: [sharp / dull / aching / radiating]
Pain Scale: [0-10]/10
Aggravating Factors: [sitting / standing / bending / lifting]
Relieving Factors: [rest / ice / heat / medication]
Previous Treatment: [none / physio / chiro / medication]
Red Flags: [none / night pain / bowel/bladder changes / progressive weakness]`,

    objective: `Observation: [posture / gait]
ROM: [flexion / extension / lateral flexion / rotation]
Strength: [hip flexion / extension / knee extension]
Neurological: [sensation / reflexes / dermatomes]
Special Tests: [SLR / slump / FABER]
Palpation: [muscle spasm / tenderness]`,

    assessment: `Primary Diagnosis: [mechanical low back pain / disc herniation / facet syndrome]
Contributing Factors: [poor ergonomics / weak core / tight hip flexors]
Prognosis: [good / fair / guarded]
Goals: [reduce pain to 3/10, return to work, improve function]`,

    plan: `Treatment: [manual therapy / exercise / modalities]
Frequency: [2x/week for 4 weeks]
Home Exercise Program: [core strengthening / stretching]
Education: [posture / ergonomics / activity modification]
Re-assessment: [in 2 weeks]`
  },

  'concussion-initial': {
    name: 'Concussion - Initial Assessment',
    subjective: `Chief Complaint: Post-concussion symptoms
Mechanism: [sport / MVA / fall / assault]
Date of Injury: [date]
Loss of Consciousness: [yes / no] [duration if yes]
Symptoms: [headache / dizziness / nausea / vision changes / cognitive issues]
Symptom Severity: [0-10]/10
Sleep: [difficulty falling asleep / staying asleep / sleeping more]
Cognitive: [concentration / memory / processing speed]
Emotional: [irritability / sadness / anxiety]
Return to Activity: [school / work / sport]`,

    objective: `Vital Signs: [BP / HR]
Cognitive Screening: [orientation / memory / attention]
Balance: [BESS / tandem stance]
Oculomotor: [smooth pursuits / saccades / convergence]
Vestibular: [VOR / head thrust / positional testing]
Cervical Spine: [ROM / strength / provocation]
Exertion Testing: [if appropriate]`,

    assessment: `Diagnosis: Post-concussion syndrome
Symptom Cluster: [vestibular / ocular / cervical / cognitive / anxiety]
Stage: [acute / sub-acute / prolonged]
Barriers to Recovery: [identify]
Prognosis: [good / guarded]`,

    plan: `Treatment: [vestibular rehab / cervical treatment / graded exertion]
Frequency: [2x/week]
Return to Learn Protocol: [stage]
Return to Sport Protocol: [stage if applicable]
Referrals: [sport medicine physician / neuropsychology if needed]
Re-assessment: [weekly]`
  },

  'shoulder-pain-followup': {
    name: 'Shoulder Pain - Follow-up',
    subjective: `Progress Since Last Visit: [improved / same / worse]
Current Pain Level: [0-10]/10
Compliance with HEP: [excellent / good / fair / poor]
New Symptoms: [yes / no]
Activities: [able to / unable to]`,

    objective: `ROM: [flexion / abduction / ER / IR]
Strength: [rotator cuff / scapular stabilizers]
Special Tests: [as needed]`,

    assessment: `Progress: [on track / slower than expected]
Barriers: [compliance / pain / other]`,

    plan: `Continue: [current treatments]
Progress: [exercises / activities]
Next Visit: [date]`
  }
};
```

---

## 📅 IMPLEMENTATION TIMELINE

### Week 1 (March 13-19)
- [ ] Design multi-level approval schema
- [ ] Build approval chain database tables
- [ ] Create approval service layer
- [ ] Start voice dictation research

### Week 2 (March 20-26)
- [ ] Build approval chain UI
- [ ] Test approval workflows
- [ ] Implement voice dictation component
- [ ] Create SOAP templates library

### Week 3 (March 27 - April 2)
- [ ] Integrate voice dictation into charting
- [ ] Test SOAP templates
- [ ] User acceptance testing
- [ ] Documentation updates

### Week 4 (April 3-9)
- [ ] Bug fixes
- [ ] Performance optimization
- [ ] Final QA testing
- [ ] Training materials

### Week 5 (April 10-16)
- [ ] Staff training
- [ ] Final deployment
- [ ] Monitoring and support
- [ ] ✅ Gap closure complete

---

## ✅ ACCEPTANCE CRITERIA

### Multi-Level Approvals
- [ ] Budgets > $5K require manager approval
- [ ] Budgets > $25K require director approval
- [ ] Budgets > $100K require CFO approval
- [ ] Users can delegate approvals
- [ ] Approval chains visible in real-time
- [ ] Email notifications sent to approvers
- [ ] Audit trail maintained

### SOAP Notes Enhancement
- [ ] Voice dictation works in Chrome/Edge
- [ ] Templates available for common conditions
- [ ] Auto-complete suggests common phrases
- [ ] Voice commands work ("new paragraph", "delete that")
- [ ] Saves dictation as user speaks
- [ ] Works on desktop and tablet

---

## 🚀 POST-LAUNCH ENHANCEMENTS (Optional)

These are NOT required for launch but could be added later:

### Phase 2 (June 2026)
1. **Mobile Native Apps**
   - iOS clinician app
   - Android clinician app
   - Patient mobile app

2. **Advanced Predictive Analytics**
   - Patient no-show prediction
   - Revenue forecasting with ML
   - Automated capacity optimization

3. **Telehealth Integration**
   - Video consultations
   - Remote exercise monitoring
   - Digital outcome tracking

### Phase 3 (September 2026)
1. **AI Documentation**
   - Automated SOAP note generation from video
   - AI-powered clinical recommendations
   - Automated coding and billing

2. **Advanced Marketing**
   - Predictive lead scoring
   - Automated campaign optimization
   - Dynamic pricing

---

## 📊 SUCCESS METRICS

**Target: 100% coverage on all 12 requirements by April 15, 2026**

| Requirement | Current | Target | Status |
|-------------|---------|--------|--------|
| 1. Clinic Operations | 100% | 100% | ✅ Complete |
| 2. Clinical Care | 95% | 100% | 🔧 In Progress |
| 3. Revenue Cycle | 100% | 100% | ✅ Complete |
| 4. Strategic Planning | 100% | 100% | ✅ Complete |
| 5. Goal Alignment | 100% | 100% | ✅ Complete |
| 6. Budgeting | 100% | 100% | ✅ Complete |
| 7. Growth & Marketing | 100% | 100% | ✅ Complete |
| 8. Referral Networks | 100% | 100% | ✅ Complete |
| 9. Knowledge Mgmt | 100% | 100% | ✅ Complete |
| 10. Multi-Clinic | 100% | 100% | ✅ Complete |
| 11. Analytics | 100% | 100% | ✅ Complete |
| 12. Governance | 85% | 100% | 🔧 In Progress |

---

## 🎯 LAUNCH DECISION CRITERIA

**Go/No-Go Decision: April 20, 2026**

### MUST HAVE (Launch Blockers)
- ✅ All 12 requirements at 95%+
- ✅ Critical workflows tested
- ✅ Data migration complete
- ✅ Staff training complete
- ✅ Security audit passed

### SHOULD HAVE (Recommended)
- 🔧 Multi-level approvals implemented
- 🔧 Voice dictation for SOAP notes
- ✅ Performance optimization complete
- ✅ Mobile-responsive design

### NICE TO HAVE (Post-Launch)
- ⏸️ Native mobile apps
- ⏸️ Advanced AI features
- ⏸️ Telehealth integration

---

## 📞 CONTACT & ESCALATION

**Gap Closure Project Manager:** [TBD]
**Technical Lead:** [TBD]
**QA Lead:** [TBD]

**Daily Standup:** 9:00 AM MST
**Weekly Status:** Friday 2:00 PM MST

---

**Document Owner:** Engineering Team
**Next Review:** March 20, 2026
**Status:** IN PROGRESS
