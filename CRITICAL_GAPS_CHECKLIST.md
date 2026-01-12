# Critical Gaps Checklist
## What's Missing & What's Needed

---

## Gap Category 1: Governance Entry Points

### ✅ Exists
- [x] RBAC system in `permissionsService.ts`
- [x] Credential tracking in `credentialsService.ts`
- [x] Audit logging in `auditMiddleware.ts`
- [x] Permission matrix in database

### ❌ MISSING

#### 1.1 Authority Delegation Matrix
**What's needed:**
- [ ] `role_credential_authority` table (who can verify what)
- [ ] `authority_delegations` table (track delegation of power)
- [ ] `sod_conflict_matrix` table (segregation of duties)
- [ ] `delegationService.ts` with delegation logic
- [ ] Authority approval workflow
- [ ] Delegation audit trail
- [ ] Delegation expiration handling

**Why it matters:** Can't scale governance if you can't delegate authority without creating conflicts

#### 1.2 Credential Lifecycle Authority
**What's needed:**
- [ ] Map which roles can perform lifecycle steps (request → verify → approve → issue → renew → revoke)
- [ ] Add lifecycle state tracking
- [ ] Create approval routing by authority type
- [ ] Build credential authority dashboard
- [ ] Exception handling & escalation

**Why it matters:** Clinicians need clear path through credential process; auditors need to prove segregation of duties

#### 1.3 Exception Handling & Override Logging
**What's needed:**
- [ ] Exception approval workflow (who can approve overrides)
- [ ] Override justification capture
- [ ] Enhanced audit logging for overrides
- [ ] Management dashboard for pending exceptions
- [ ] Metrics on exception frequency

**Why it matters:** Regulatory compliance requires proof that overrides are controlled and traceable

---

## Gap Category 2: Systematic Onboarding Workflows

### ✅ Exists
- [x] Staff profiles tracking
- [x] Credential verification system
- [x] Clinic assignment logic

### ❌ MISSING

#### 2.1 Onboarding State Machine
**What's needed:**
- [ ] `onboarding_templates` table (templates by role)
- [ ] `staff_onboarding` table (active workflows)
- [ ] `onboarding_steps` table (individual steps)
- [ ] `step_prerequisites` table (dependencies)
- [ ] State machine service with transitions
- [ ] Blocking logic for unmet prerequisites
- [ ] Auto-remediation recommendations

**Implementation files:**
- [ ] Create `services/onboarding/onboardingService.ts`
- [ ] Create `services/onboarding/onboardingStateService.ts`
- [ ] Create `components/onboarding/OnboardingProgressDashboard.tsx`

**Why it matters:** Without this, you can't scale hiring; staff assigned to patients before credentials verified

#### 2.2 Prerequisite Validation & Blocking
**What's needed:**
- [ ] Pre-task credential requirements mapping
- [ ] Task eligibility checking before assignment
- [ ] "Ready to work" status calculation
- [ ] Automatic task blocking when prerequisites fail
- [ ] Notification system for blocked staff
- [ ] Remediation action recommendations

**Why it matters:** Risk of patient care with unqualified staff; regulatory liability

#### 2.3 Onboarding Progress Tracking
**What's needed:**
- [ ] Dashboard showing all staff in onboarding
- [ ] Blocked staff visibility with reasons
- [ ] Time-to-complete tracking
- [ ] Bottleneck identification
- [ ] Manager alerts for stuck processes
- [ ] Historical completion metrics

**Why it matters:** Operations can't scale without visibility into onboarding pipeline

#### 2.4 Checklist & Task Management
**What's needed:**
- [ ] Visual checklist UI
- [ ] Task assignment to mentors/managers
- [ ] Completion evidence capture
- [ ] Sign-off workflow
- [ ] Re-verification for failed steps
- [ ] Escalation for overdue steps

**Why it matters:** New staff need clear visibility into what's required

---

## Gap Category 3: Authority Delegation & Segregation

### ✅ Exists
- [x] Role definitions
- [x] Permission checks
- [x] Audit logging

### ❌ MISSING

#### 3.1 Explicit Delegation Tracking
**What's needed:**
- [ ] `delegable_authorities` table (define what can be delegated)
- [ ] `authority_delegations` table (track who delegated to whom)
- [ ] `delegation_audit_log` table (immutable log)
- [ ] Delegation service with creation/revocation
- [ ] Time-limited delegations
- [ ] Amount limits for financial authorities
- [ ] Sub-delegation permissions

**Implementation files:**
- [ ] Create `services/delegation/delegationService.ts`
- [ ] Create `components/governance/DelegationManagementView.tsx`

**Why it matters:** Auditors need to see who authorized what actions and when

#### 3.2 Segregation of Duties (SoD) Conflict Detection
**What's needed:**
- [ ] `sod_conflict_matrix` table (define conflicting roles)
- [ ] Conflict checking before delegation
- [ ] Conflict escalation workflow
- [ ] Dashboard showing SoD risks
- [ ] Automated alerts for violations
- [ ] Exception approval process

**Why it matters:** Prevents one person from having too much power (approve invoice + pay invoice)

#### 3.3 Delegation Authority Approval
**What's needed:**
- [ ] Approval workflow for delegations
- [ ] Role-based approval routing
- [ ] SoD review by compliance
- [ ] Time-limited approval periods
- [ ] Rejection workflow with feedback
- [ ] Re-request mechanism

**Why it matters:** Delegations must be formally approved and traceable

#### 3.4 Delegation Expiration & Renewal
**What's needed:**
- [ ] Automatic expiration of delegations
- [ ] Renewal request workflow
- [ ] Compliance review on renewal
- [ ] Alerts before expiration
- [ ] Re-certification requirements

**Why it matters:** Delegations shouldn't be forever; must be regularly revalidated

---

## Gap Category 4: Feature Flag Infrastructure

### ✅ Exists
- [x] All features deployed

### ❌ MISSING

#### 4.1 Feature Flag Service
**What's needed:**
- [ ] `feature_flags` table
- [ ] `featureFlagService.ts` with runtime checking
- [ ] Flag evaluation with context (user, clinic, role)
- [ ] Percentage-based rollouts (0-100%)
- [ ] Target-specific rollouts (clinic/role/user)
- [ ] Kill switch implementation
- [ ] Flag configuration UI

**Implementation:**
- [ ] Create `services/featureFlags/featureFlagService.ts`
- [ ] Create `components/admin/FeatureFlagDashboard.tsx`
- [ ] Wrap all new features with flag checks

**Why it matters:** Can't safely deploy risky features without ability to instantly disable

#### 4.2 Gradual Rollout Capability
**What's needed:**
- [ ] Percentage-based rollouts
- [ ] Automatic rollback on error threshold
- [ ] Canary deployment support
- [ ] A/B testing framework
- [ ] Feature statistics dashboard
- [ ] Rollout automation

**Why it matters:** Reduces blast radius of broken features

#### 4.3 Kill Switch Implementation
**What's needed:**
- [ ] Emergency flag disable (<1 second)
- [ ] Confirmation before kill switch
- [ ] Audit log of kill switches
- [ ] On-call notification on activation
- [ ] Automatic fallback behavior

**Why it matters:** When something breaks in production, need instant off switch

---

## Gap Category 5: Meta-Agent Supervision Framework

### ✅ Exists
- [x] Individual AI agents (7+)
- [x] Confidence scoring per agent
- [x] Decision logging
- [x] Escalation rules

### ❌ MISSING

#### 5.1 Meta-Agent Orchestrator
**What's needed:**
- [ ] `metaAgentSupervisor.ts` service
- [ ] Agent orchestration logic
- [ ] Cross-agent dependency management
- [ ] Conflict detection & resolution
- [ ] Dynamic parameter adjustment
- [ ] Agent health monitoring

**Implementation:**
- [ ] Create `services/aiOrchestration/metaAgentSupervisor.ts`
- [ ] Create `services/aiOrchestration/agentCoordinator.ts`
- [ ] Create database tables for orchestration logs

**Why it matters:** Agents need coordination; can't have intake agent and capacity agent contradicting each other

#### 5.2 Unified AI Decision Audit Trail
**What's needed:**
- [ ] `agent_orchestration_log` table
- [ ] Unified decision logging across all agents
- [ ] Cross-agent dependency tracking
- [ ] Conflict resolution logging
- [ ] Final decision audit trail
- [ ] Complete reasoning chain

**Why it matters:** Regulators need to see why AI made a decision, not just what it decided

#### 5.3 Agent Performance Dashboard
**What's needed:**
- [ ] Agent accuracy tracking
- [ ] Agent escalation rates
- [ ] Agent decision speed
- [ ] Agent failure analysis
- [ ] Trend analysis
- [ ] Feedback loops to models

**Components:**
- [ ] Create `components/ai/AgentPerformanceDashboard.tsx`
- [ ] Create `components/ai/AgentDecisionTracer.tsx`

**Why it matters:** Need visibility into which agents are reliable and which need attention

#### 5.4 Adaptive Confidence Thresholds
**What's needed:**
- [ ] Dynamic confidence threshold adjustment
- [ ] Per-agent threshold tuning
- [ ] Context-aware thresholds
- [ ] Feedback loops from outcomes
- [ ] A/B testing of thresholds

**Why it matters:** Thresholds today might not work tomorrow; need adaptation

#### 5.5 Agent Failure Handling
**What's needed:**
- [ ] Fallback agent selection
- [ ] Graceful degradation
- [ ] Human escalation triggers
- [ ] Retry logic with backoff
- [ ] Partial result handling

**Why it matters:** When agent fails, system shouldn't break; need graceful fallbacks

---

## Gap Category 6: Advanced Risk Prediction

### ✅ Exists
- [x] Manual risk assessment
- [ ] Phase gate validation

### ❌ MISSING

#### 6.1 ML Risk Prediction Model
**What's needed:**
- [ ] Historical clinic dataset collection
- [ ] Feature engineering (what predicts success/failure)
- [ ] Model training (ML pipeline)
- [ ] Risk scoring API
- [ ] Continuous model retraining
- [ ] Model performance tracking

**Implementation:**
- [ ] Create `services/riskPrediction/riskPredictionService.ts`
- [ ] Create ML training pipeline (separate from application)
- [ ] Create scoring API endpoint

**Why it matters:** Predict which clinics will struggle BEFORE they launch; enable proactive interventions

#### 6.2 Remediation Recommendation Engine
**What's needed:**
- [ ] Map risk factors to interventions
- [ ] Historical success rate tracking per intervention
- [ ] Personalized recommendations based on risk profile
- [ ] Prioritization of actions
- [ ] Timeline estimation

**Why it matters:** Can't just tell someone they're high-risk; need actionable path to reduce risk

#### 6.3 Stabilization Time Forecasting
**What's needed:**
- [ ] Historical stabilization timelines
- [ ] Trend analysis by region/type
- [ ] Forecast confidence intervals
- [ ] Factors affecting timeline
- [ ] Early warning indicators

**Why it matters:** Need realistic timelines for clinic maturity; helps with capital allocation

#### 6.4 Cross-Clinic Benchmark Comparison
**What's needed:**
- [ ] Normalized KPI comparison
- [ ] Percentile tracking (where is clinic vs peers)
- [ ] Peer clustering
- [ ] Best practice identification
- [ ] Anomaly detection

**Why it matters:** Know if clinic is underperforming vs realistic benchmarks

#### 6.5 Success Factor Extraction
**What's needed:**
- [ ] Historical analysis of successes vs failures
- [ ] Common success patterns
- [ ] Common failure modes
- [ ] Protective factors identification
- [ ] Risk amplification factors

**Why it matters:** Learn from history to improve future launches

---

## Gap Category 7: Skills Matching & Forecasting

### ✅ Exists
- [x] Credential tracking
- [x] Staffing capacity engine
- [x] Utilization tracking

### ❌ MISSING

#### 7.1 Real-Time Skills-Demand Matching
**What's needed:**
- [ ] Skills taxonomy creation
- [ ] Map staff skills to tasks
- [ ] Task skill requirements
- [ ] Match quality scoring
- [ ] Mismatch alerting

**Why it matters:** Can't assign tasks to people without required skills

#### 7.2 Predictive Capacity Gap Forecasting
**What's needed:**
- [ ] 60-day capacity forecast
- [ ] Turnover prediction
- [ ] Hiring lead time modeling
- [ ] Gap identification early
- [ ] Rebalancing recommendations

**Why it matters:** Know staffing gaps BEFORE they become crises

#### 7.3 Dynamic Resource Rebalancing
**What's needed:**
- [ ] Identify overstaffed regions
- [ ] Identify understaffed regions
- [ ] Transfer recommendations
- [ ] Hiring vs transfer analysis
- [ ] Cost impact modeling

**Why it matters:** Optimize resource allocation across clinics for efficiency

---

## Implementation Priority & Effort

### MUST DO IMMEDIATELY (Blocking Expansion)
| Gap | Effort | Timeline | Impact |
|-----|--------|----------|--------|
| Meta-Agent Supervisor | 5w | Week 1-5 | 🔴 Blocks all expansion |
| Feature Flags | 2w | Week 1-2 | 🔴 Blocks safe rollouts |
| Delegation Authority | 2w | Week 2-3 | 🟠 Compliance risk |
| Onboarding Workflows | 3w | Week 3-5 | 🟠 Hiring bottleneck |

### SHOULD DO SOON (Before Scale)
| Gap | Effort | Timeline | Impact |
|-----|--------|----------|--------|
| SoD Conflict Detection | 1w | Week 2 | 🟠 Governance gap |
| Credential Authority | 2w | Week 3-4 | 🟠 Process clarity |
| Exception Handling | 1w | Week 4 | 🟡 Operational need |

### CAN DO LATER (Optimization)
| Gap | Effort | Timeline | Impact |
|-----|--------|----------|--------|
| ML Risk Models | 6w | Week 6-11 | 🟡 Nice-to-have |
| Skills Matching | 3w | Week 7-9 | 🟡 Nice-to-have |
| Capacity Forecasting | 2w | Week 10-11 | 🟡 Nice-to-have |

---

## Effort Estimation

**Critical Path:** 9-10 weeks
```
Week 1-2: Meta-Agent Supervisor (overlap: Feature Flags)
Week 2-3: Feature Flags + Delegation Authority
Week 3-5: Onboarding Workflows + SoD
Week 5-6: Testing & regulatory review
Week 6+: Optional: ML models
```

**Total Blocking Effort:** ~12 engineer-weeks
**Optional Effort:** ~10 engineer-weeks

---

## Success Metrics

### Governance
- [ ] 100% of delegations tracked with immutable audit trail
- [ ] 0 SoD conflicts go undetected
- [ ] <5 min audit query time
- [ ] 100% of credential changes logged

### Expansion
- [ ] 100% of new hires complete onboarding
- [ ] <2 day time-to-ready
- [ ] 0 staff assigned without required credentials
- [ ] <5% onboarding failure rate

### Operations
- [ ] 0 untracked AI decisions
- [ ] Cross-agent conflicts resolved <2 min
- [ ] Feature flag kill switch <1 sec
- [ ] 0 production surprises from features

---

## Sign-Off Checklist

Before each gap closure, verify:
- [ ] Database schema deployed and tested
- [ ] Service layer implemented and unit tested
- [ ] UI components created and styled
- [ ] Integration tests passing
- [ ] Audit trail validated
- [ ] Performance tested (query times acceptable)
- [ ] Security reviewed (RLS policies)
- [ ] Regulatory compliance confirmed
- [ ] Documentation complete
- [ ] On-call training completed

---

**This checklist is your roadmap to enterprise-grade governance and safe expansion.**

Start with Meta-Agent Supervisor (P0) in Week 1.
