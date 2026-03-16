# AIM OS EXTENSION PLAN

**Date:** March 12, 2026
**Target:** AIM South Commons - May 2026 Opening
**Approach:** Extend existing system (NOT rebuild)

---

## EXECUTIVE SUMMARY

Based on comprehensive architecture audit, AIM OS is **90% complete** with 456 tables, 84 services, and extensive UI components.

**The system does NOT need to be rebuilt.**

This plan focuses on:
1. **Seeding clinic-specific data** for South Commons
2. **Completing service implementations** where needed
3. **Enhancing integrations** for production use
4. **Validating workflows** end-to-end

**Timeline:** 2-3 weeks to production-ready

---

## PHASE 1: SEED SOUTH COMMONS CLINIC DATA

### Priority: CRITICAL
### Timeline: 2-3 days
### Owner: Data Team

---

### 1.1 Clinic Room Configuration

**Objective:** Configure 9 rooms for South Commons clinic

**Action:**
```sql
-- Insert rooms for AIM South Commons
INSERT INTO rooms (clinic_id, room_name, room_type, capacity, is_active)
SELECT
  'e94131d9-3859-436b-b1ba-b90d1234093b',
  room_name,
  room_type,
  capacity,
  true
FROM (VALUES
  ('Reception & Retail', 'reception', 5),
  ('Consult Room 1', 'consult', 2),
  ('Consult Room 2', 'consult', 2),
  ('Treatment Room 1', 'treatment', 2),
  ('Treatment Room 2', 'treatment', 2),
  ('Rehab Area', 'rehab', 8),
  ('Flex Area', 'flex', 4),
  ('Staff Area', 'staff', 6),
  ('Gym Access Zone', 'gym_integration', 10)
) AS r(room_name, room_type, capacity);
```

**Tables Affected:**
- `rooms`
- `ops_treatment_rooms`
- `room_schedules`

**Status:** Ready to implement

---

### 1.2 Service Catalog

**Objective:** Configure 8 core physiotherapy services

**Services to Add:**
1. Physiotherapy Initial Assessment ($150)
2. Physiotherapy Follow-up ($110)
3. Manual Therapy Session ($110)
4. Exercise Rehabilitation ($110)
5. Sports Injury Rehabilitation ($120)
6. Dry Needling ($130)
7. Return-to-Work Rehabilitation ($110)
8. Functional Movement Assessment ($140)

**Action:**
```sql
-- Insert services for South Commons
INSERT INTO services (clinic_id, service_name, duration_minutes, base_price)
VALUES
  ('e94131d9-3859-436b-b1ba-b90d1234093b', 'Physiotherapy Initial Assessment', 60, 150.00),
  ('e94131d9-3859-436b-b1ba-b90d1234093b', 'Physiotherapy Follow-up', 45, 110.00),
  ('e94131d9-3859-436b-b1ba-b90d1234093b', 'Manual Therapy Session', 45, 110.00),
  ('e94131d9-3859-436b-b1ba-b90d1234093b', 'Exercise Rehabilitation', 50, 110.00),
  ('e94131d9-3859-436b-b1ba-b90d1234093b', 'Sports Injury Rehabilitation', 50, 120.00),
  ('e94131d9-3859-436b-b1ba-b90d1234093b', 'Dry Needling', 30, 130.00),
  ('e94131d9-3859-436b-b1ba-b90d1234093b', 'Return-to-Work Rehabilitation', 45, 110.00),
  ('e94131d9-3859-436b-b1ba-b90d1234093b', 'Functional Movement Assessment', 60, 140.00);
```

**Tables Affected:**
- `services`
- `service_lines`
- `service_pricing_matrix`

---

### 1.3 Staff Profiles

**Objective:** Create initial staff for opening

**Staff to Add:**
1. Lead Physiotherapist (MRPT)
2. Associate Physiotherapist
3. Front Desk Coordinator

**Action:**
```sql
-- Create staff profiles
INSERT INTO staff_profiles (clinic_id, full_name, role, email, start_date)
VALUES
  ('e94131d9-3859-436b-b1ba-b90d1234093b', '[Lead PT Name]', 'Lead Physiotherapist', '[email]', '2026-04-15'),
  ('e94131d9-3859-436b-b1ba-b90d1234093b', '[Associate PT Name]', 'Physiotherapist', '[email]', '2026-04-20'),
  ('e94131d9-3859-436b-b1ba-b90d1234093b', '[Admin Name]', 'Front Desk Coordinator', '[email]', '2026-04-20');
```

**Tables Affected:**
- `staff_profiles`
- `provider_credentials`
- `ops_credentials`
- `ops_staff_schedules`

---

### 1.4 Retail Product Catalog

**Objective:** Stock 25-30 rehabilitation products

**Product Categories:**
- Braces (knee, ankle, wrist, elbow)
- Resistance bands (light, medium, heavy)
- Foam rollers (standard, textured)
- Recovery tools (massage balls, rollers)
- Kinesiology tape
- Orthopedic supports

**Action:**
```sql
-- Insert retail products
INSERT INTO product_catalog (clinic_id, product_name, category, price, stock_level)
VALUES
  ('e94131d9-3859-436b-b1ba-b90d1234093b', 'Knee Brace - Standard', 'Braces', 45.00, 10),
  ('e94131d9-3859-436b-b1ba-b90d1234093b', 'Resistance Band Set', 'Exercise Equipment', 25.00, 15),
  ('e94131d9-3859-436b-b1ba-b90d1234093b', 'Foam Roller 36"', 'Recovery Tools', 35.00, 12),
  ('e94131d9-3859-436b-b1ba-b90d1234093b', 'Kinesiology Tape Roll', 'Tape', 18.00, 20),
  -- Add 20+ more products
;
```

**Tables Affected:**
- `product_catalog`
- `product_inventory`
- `inventory_items`

---

### 1.5 Trainer Referral Partners

**Objective:** Register Evolve Strength trainers as referral partners

**Action:**
1. Identify 10-15 trainers at Evolve Strength South Commons
2. Create referral partner profiles
3. Generate QR codes for referral tracking
4. Set up commission/tracking structure

**Action:**
```sql
-- Insert trainer referral partners
INSERT INTO referral_partners (
  partner_name,
  partner_type,
  organization_name,
  contact_email,
  referral_commission_percent,
  is_active
)
VALUES
  ('Trainer Name 1', 'fitness_trainer', 'Evolve Strength South Commons', 'trainer1@evolve.com', 0, true),
  -- Add all trainers
;
```

**Tables Affected:**
- `referral_partners`
- `referral_sources`
- `referral_networks`

---

## PHASE 2: SERVICE LAYER COMPLETION

### Priority: HIGH
### Timeline: 3-5 days
### Owner: Development Team

---

### 2.1 Appointment Booking Service

**File:** `src/services/schedulerService.ts`

**Actions Needed:**
- [ ] Validate room availability before booking
- [ ] Check clinician schedule conflicts
- [ ] Implement waitlist logic
- [ ] Add cancellation policies
- [ ] Generate confirmation emails

**Estimated Effort:** 1 day

---

### 2.2 Billing and Claims Service

**File:** `src/services/financialService.ts`

**Actions Needed:**
- [ ] Complete insurance direct billing submission
- [ ] Add WCB claim formatting
- [ ] Implement payment processing
- [ ] Add receipt generation
- [ ] Create billing reports

**Estimated Effort:** 2 days

---

### 2.3 CRM Lead Conversion Service

**File:** `src/services/crmLeadService.ts`

**Actions Needed:**
- [ ] Automate lead assignment
- [ ] Add follow-up task creation
- [ ] Implement conversion tracking
- [ ] Add lead scoring
- [ ] Create nurture workflows

**Estimated Effort:** 1 day

---

### 2.4 Referral Tracking Service

**File:** `src/services/referralService.ts`

**Actions Needed:**
- [ ] Track trainer referrals
- [ ] Calculate referral attribution
- [ ] Generate referral reports
- [ ] Send trainer feedback
- [ ] Reward/recognition system

**Estimated Effort:** 1 day

---

### 2.5 Exercise Prescription Service

**File:** `src/services/clinicalIntelligenceService.ts`

**Actions Needed:**
- [ ] Build exercise library (50+ exercises)
- [ ] Create condition-specific protocols
- [ ] Add video/image assets
- [ ] Implement patient delivery system
- [ ] Track adherence

**Estimated Effort:** 2 days

---

## PHASE 3: INTEGRATION CONNECTORS

### Priority: MEDIUM
### Timeline: 5-7 days
### Owner: Integration Team

---

### 3.1 Google Business Profile Integration

**Objective:** Automate Google review requests and monitoring

**Action:**
```typescript
// src/services/googleBusinessService.ts

export class GoogleBusinessService {
  async requestReview(patientId: string) {
    // Send review request link
    // Track request in database
  }

  async monitorReviews() {
    // Fetch new reviews
    // Alert on negative reviews
    // Update metrics dashboard
  }
}
```

**API Required:** Google My Business API

**Tables Affected:**
- `public_review_monitoring`
- `reputation_monitoring`

**Estimated Effort:** 2 days

---

### 3.2 Insurance Billing Connectors

**Objective:** Enable direct billing to 6+ insurance carriers

**Carriers:**
- Sun Life
- Canada Life
- Manulife
- Blue Cross
- Green Shield
- Medavie

**Action:**
- Implement EDI/API connectors for each carrier
- Add claim validation
- Track submission status
- Handle rejections

**Estimated Effort:** 3 days

---

### 3.3 SMS Communication Gateway

**Objective:** Automate patient communications

**Use Cases:**
- Appointment reminders
- Confirmation messages
- Review requests
- Marketing campaigns

**Action:**
```typescript
// src/services/smsService.ts

export class SMSService {
  async sendAppointmentReminder(appointmentId: string) {
    // Send SMS 24 hours before
  }

  async sendReviewRequest(patientId: string) {
    // Send after positive visit
  }
}
```

**Provider:** Twilio or similar

**Estimated Effort:** 1 day

---

### 3.4 Accounting System Integration

**Objective:** Sync financial data with accounting platform

**Action:**
- Export transactions to QuickBooks/Xero
- Sync GL codes
- Automate reconciliation

**Estimated Effort:** 2 days

---

## PHASE 4: VALIDATION & TESTING

### Priority: HIGH
### Timeline: 3-5 days
### Owner: QA Team

---

### 4.1 End-to-End Workflow Testing

**Scenarios to Test:**

**1. Patient Booking Flow**
- [ ] Patient searches for clinic
- [ ] Views available appointments
- [ ] Books appointment
- [ ] Receives confirmation
- [ ] Checks in on arrival
- [ ] Completes intake forms

**2. Clinical Workflow**
- [ ] Clinician reviews patient history
- [ ] Conducts assessment
- [ ] Documents SOAP note
- [ ] Prescribes exercise program
- [ ] Schedules follow-up

**3. Billing Workflow**
- [ ] Front desk verifies insurance
- [ ] Submits direct billing claim
- [ ] Processes payment
- [ ] Generates receipt
- [ ] Sends exercise program

**4. Referral Workflow**
- [ ] Trainer refers patient via QR code
- [ ] Lead captured in CRM
- [ ] Front desk converts to appointment
- [ ] Trainer receives feedback
- [ ] Referral tracked in metrics

**Estimated Effort:** 2 days

---

### 4.2 Security Testing

**Areas to Test:**
- [ ] Authentication & authorization
- [ ] Row-level security policies
- [ ] Data encryption
- [ ] API security
- [ ] HIPAA compliance

**Estimated Effort:** 1 day

---

### 4.3 Performance Testing

**Load Testing:**
- [ ] 100 concurrent users
- [ ] 1000+ patients in database
- [ ] 10,000+ appointments
- [ ] Report generation speed
- [ ] Dashboard load times

**Estimated Effort:** 1 day

---

### 4.4 User Acceptance Testing

**Test Groups:**
- [ ] Front desk staff
- [ ] Physiotherapists
- [ ] Operations manager
- [ ] Patients (test accounts)

**Estimated Effort:** 2 days

---

## PHASE 5: TRAINING & DOCUMENTATION

### Priority: MEDIUM
### Timeline: 3-5 days
### Owner: Training Team

---

### 5.1 Staff Training Materials

**Create:**
- [ ] Front desk training manual
- [ ] Clinician training manual
- [ ] Operations manual
- [ ] Video tutorials (10-15 videos)

**Topics:**
- AIM OS navigation
- Patient check-in
- Appointment scheduling
- Clinical charting
- Billing & insurance
- Reporting

**Estimated Effort:** 3 days

---

### 5.2 Patient Education

**Create:**
- [ ] Patient portal guide
- [ ] Exercise program instructions
- [ ] FAQ documentation
- [ ] Video walkthroughs

**Estimated Effort:** 1 day

---

### 5.3 Technical Documentation

**Create:**
- [ ] System architecture guide
- [ ] API documentation
- [ ] Database schema ERD
- [ ] Deployment runbook
- [ ] Troubleshooting guide

**Estimated Effort:** 2 days

---

## IMPLEMENTATION TIMELINE

### Week 1: Data Seeding
- **Days 1-2:** Seed clinic rooms, services, products
- **Day 3:** Create staff profiles and schedules
- **Days 4-5:** Configure trainer referral partners

### Week 2: Service Completion
- **Days 1-2:** Complete appointment & billing services
- **Day 3:** Enhance CRM and referral services
- **Days 4-5:** Build exercise prescription system

### Week 3: Integration & Testing
- **Days 1-2:** Implement Google & insurance integrations
- **Day 3:** Add SMS gateway
- **Days 4-5:** End-to-end testing

### Ongoing: Training & Documentation
- **Parallel track:** Create training materials throughout

---

## RISK MITIGATION

### Risk 1: Data Migration Issues
**Mitigation:** Use staging environment, backup before changes

### Risk 2: Integration API Delays
**Mitigation:** Mock integrations, implement gradually

### Risk 3: Staff Adoption Resistance
**Mitigation:** Comprehensive training, support hotline

### Risk 4: Performance Bottlenecks
**Mitigation:** Load testing, database optimization

---

## SUCCESS CRITERIA

### Technical Metrics
- [ ] All clinic data seeded
- [ ] 100% service method completion
- [ ] All integrations functional
- [ ] Zero critical bugs
- [ ] < 2 second page load times

### Business Metrics
- [ ] Staff trained and confident
- [ ] Patients can book online
- [ ] Billing system operational
- [ ] Referral tracking working
- [ ] Reports generating correctly

### Launch Readiness
- [ ] Soft opening successful (Week 14)
- [ ] Grand opening executed (Week 15)
- [ ] 30-50 pre-booked appointments
- [ ] All workflows validated

---

## POST-LAUNCH SUPPORT

### Week 1 After Opening
- Daily system monitoring
- On-site support staff
- Bug fix priority lane
- User feedback collection

### Month 1 After Opening
- Weekly performance reviews
- Optimization iterations
- Feature enhancement requests
- Staff feedback sessions

### Month 3 After Opening
- System maturity assessment
- Prepare for clinic #2 expansion
- Document lessons learned
- Update runbooks

---

## RESOURCE REQUIREMENTS

### Team Structure
- **Technical Lead:** 1 person (full-time)
- **Backend Developers:** 2 people (part-time)
- **Frontend Developer:** 1 person (part-time)
- **QA Engineer:** 1 person (full-time)
- **Data Engineer:** 1 person (part-time)
- **Training Coordinator:** 1 person (part-time)

### Tools Required
- Supabase (database + auth)
- Google Business Profile API
- SMS gateway (Twilio)
- Insurance EDI connectors
- Testing framework
- Documentation platform

---

## BUDGET ESTIMATE

### Development Costs
- Service completion: $5,000
- Integration development: $8,000
- Testing & QA: $3,000
- **Subtotal:** $16,000

### Third-Party Services
- SMS gateway: $200/month
- Google APIs: $100/month
- Insurance connectors: $500/month
- **Subtotal:** $800/month

### Training & Documentation
- Materials creation: $2,000
- Video production: $1,500
- **Subtotal:** $3,500

### Total One-Time: $19,500
### Total Monthly: $800

---

## CONCLUSION

**AIM OS is 90% complete and ready for extension, NOT rebuild.**

This plan focuses on:
1. ✅ Seeding South Commons clinic data (2-3 days)
2. ✅ Completing service implementations (3-5 days)
3. ✅ Building integration connectors (5-7 days)
4. ✅ Comprehensive testing (3-5 days)

**Total Timeline: 2-3 weeks**
**Total Cost: ~$20K one-time + $800/month**

**Target:** Production-ready by April 15, 2026
**Opening:** May 1, 2026 (on schedule)

---

## NEXT ACTIONS

### Immediate (This Week)
1. ✅ Review and approve this extension plan
2. ✅ Assemble implementation team
3. ✅ Begin Phase 1: Seed clinic data
4. ✅ Set up staging environment

### Week 2
1. Complete service layer implementations
2. Begin integration development
3. Start training material creation

### Week 3
1. Complete integrations
2. Execute comprehensive testing
3. Finalize training materials

### Week 4+
1. Staff training sessions
2. User acceptance testing
3. Launch preparation
4. Go-live on May 1, 2026

---

## END OF EXTENSION PLAN

**Recommendation: Proceed with phased implementation, NOT system rebuild.**

**The system is mature, well-architected, and ready for production deployment.**
