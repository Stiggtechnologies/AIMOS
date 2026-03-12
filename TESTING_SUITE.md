# AIM OS Testing Suite

**Date:** March 12, 2026
**For:** AIM South Commons May 2026 Opening
**Status:** Complete Test Coverage

---

## OVERVIEW

This document outlines the complete testing suite for AIM OS, covering all critical workflows and integrations for the South Commons clinic launch.

---

## 1. PATIENT BOOKING FLOW

### Test Case 1.1: Online Booking - Happy Path
**Objective:** Verify patient can successfully book appointment online

**Steps:**
1. Navigate to public booking portal
2. Select AIM South Commons clinic
3. Choose service: "Physiotherapy Initial Assessment"
4. Select available date and time
5. Fill in patient information (first name, last name, email, phone)
6. Confirm booking

**Expected Result:**
- Booking confirmation displayed
- Confirmation code generated (APT-XXXXXX)
- Email confirmation sent
- SMS confirmation sent
- Appointment appears in scheduler

**Success Criteria:**
- All steps complete without errors
- Appointment status = "scheduled"
- Patient receives confirmation within 2 minutes

---

### Test Case 1.2: Booking Validation - Conflict Detection
**Objective:** Verify system prevents double-booking

**Steps:**
1. Attempt to book appointment at 2:00 PM with Provider A
2. System checks existing appointments
3. Provider A already has appointment at 2:00 PM

**Expected Result:**
- Error message: "Provider conflict: [Patient Name] at 14:00-14:45"
- Booking not created
- Alternative times suggested

---

### Test Case 1.3: Booking Validation - Outside Operating Hours
**Objective:** Verify system prevents bookings outside clinic hours

**Steps:**
1. Attempt to book appointment on Sunday (clinic closed)
2. System checks operating hours

**Expected Result:**
- Error message: "Clinic is closed on this day"
- Booking not created
- Available days highlighted

---

## 2. CLINICAL WORKFLOW

### Test Case 2.1: Patient Check-In
**Objective:** Verify front desk can check in patient

**Steps:**
1. Front desk searches for patient appointment
2. Patient arrives on time
3. Click "Check In" button
4. Status changes to "checked_in"

**Expected Result:**
- Appointment status = "checked_in"
- Checked-in timestamp recorded
- Clinician notified (dashboard updates)

---

### Test Case 2.2: Clinical Charting (SOAP Note)
**Objective:** Verify clinician can document assessment

**Steps:**
1. Clinician opens patient chart
2. Navigate to current appointment
3. Complete SOAP note:
   - Subjective: Patient complaint
   - Objective: Assessment findings
   - Assessment: Diagnosis
   - Plan: Treatment plan
4. Save note

**Expected Result:**
- SOAP note saved to database
- Timestamp and clinician ID recorded
- Accessible in patient history

---

### Test Case 2.3: Exercise Program Prescription
**Objective:** Verify exercise program can be prescribed

**Steps:**
1. Clinician selects exercises from library
2. Assign sets, reps, frequency
3. Add instructions and videos
4. Send to patient portal

**Expected Result:**
- Exercise program created
- Patient receives notification (email/SMS)
- Accessible in patient portal
- Link: "Access your program here"

---

## 3. BILLING WORKFLOW

### Test Case 3.1: Invoice Generation
**Objective:** Verify invoice created after appointment

**Steps:**
1. Appointment marked as "completed"
2. Front desk creates invoice
3. Add line items:
   - Physiotherapy Initial Assessment - $150.00
4. Calculate tax (5% GST)
5. Generate invoice

**Expected Result:**
- Invoice number: INV-202603-XXXX
- Subtotal: $150.00
- Tax: $7.50
- Total: $157.50
- Status: "draft"

---

### Test Case 3.2: Payment Processing
**Objective:** Verify payment can be recorded

**Steps:**
1. Patient pays with credit card: $157.50
2. Front desk records payment
3. Payment method: "card"
4. Reference number: AUTH-12345

**Expected Result:**
- Payment recorded
- Invoice status = "paid"
- Amount paid: $157.50
- Balance: $0.00
- Receipt generated

---

### Test Case 3.3: Insurance Direct Billing
**Objective:** Verify insurance claim submission

**Steps:**
1. Patient provides insurance information:
   - Carrier: Blue Cross Alberta
   - Policy #: BC-123456
2. Front desk submits claim electronically
3. Amount claimed: $150.00

**Expected Result:**
- Claim number generated: CLM-1234567890-XXX
- Claim status: "submitted"
- Submission type: "electronic"
- Claim logged in database

---

### Test Case 3.4: WCB Claim Submission
**Objective:** Verify WCB claim processing

**Steps:**
1. Patient provides WCB information:
   - Claim #: WCB-789012
   - Injury date: 2026-02-15
   - Employer: ABC Construction
2. Submit WCB claim

**Expected Result:**
- Claim number: WCB-WCB-789012
- Carrier: "WCB Alberta"
- Metadata includes employer and injury date
- Status: "submitted"

---

## 4. REFERRAL TRACKING

### Test Case 4.1: Trainer Referral via QR Code
**Objective:** Verify referral captured from Evolve Strength trainer

**Steps:**
1. Trainer (Jordan Smith) scans QR code with client
2. Client fills in contact information
3. Referral source: "Jordan Smith - Evolve Strength"
4. Lead created in CRM

**Expected Result:**
- Lead status: "new"
- Referral partner: "Jordan Smith"
- Source: "trainer_referral"
- Lead assigned to front desk
- Notification sent to clinic

---

### Test Case 4.2: Referral Conversion
**Objective:** Verify referral converts to appointment

**Steps:**
1. Front desk contacts lead
2. Lead books appointment
3. Appointment created
4. Link referral to appointment

**Expected Result:**
- Lead status: "converted"
- Appointment created
- Referral tracked in analytics
- Trainer attribution recorded

---

## 5. COMMUNICATION WORKFLOWS

### Test Case 5.1: 24-Hour Appointment Reminder
**Objective:** Verify automated SMS reminder sent

**Steps:**
1. System checks appointments 24 hours out
2. Patient has appointment tomorrow at 2:00 PM
3. SMS reminder sent

**Expected SMS:**
```
Hi [FirstName], this is a reminder of your appointment tomorrow at 14:00
with [Provider] at AIM South Commons. Reply CONFIRM to confirm or call
(780) 555-0100 to reschedule.
```

**Expected Result:**
- SMS sent to patient phone
- SMS status: "sent"
- Logged in sms_messages table

---

### Test Case 5.2: Review Request After Visit
**Objective:** Verify Google review request sent

**Steps:**
1. Appointment completed successfully
2. 24 hours after appointment
3. System sends review request

**Expected SMS/Email:**
```
Hi [FirstName], thank you for visiting AIM South Commons! We'd love your
feedback. Please leave us a review: https://g.page/r/AIM-south-commons/review
```

**Expected Result:**
- Review request logged
- Link generated
- Status: "pending"

---

## 6. SCHEDULER INTELLIGENCE

### Test Case 6.1: No-Show Risk Detection
**Objective:** Verify AI identifies high no-show risk

**Steps:**
1. Patient books appointment 2 hours before slot
2. Patient has 2 previous no-shows
3. Scheduler AI analyzes pattern

**Expected Result:**
- Insight created: "High No-Show Risk"
- Confidence: 85%
- Suggested action: "Send reminder or fill with standby"
- Alert displayed on scheduler

---

### Test Case 6.2: Capacity Gap Detection
**Objective:** Verify system identifies unfilled slots

**Steps:**
1. Provider A has gap: 10:00-12:00 (2 hours)
2. No appointments scheduled
3. System analyzes schedule

**Expected Result:**
- Insight: "Capacity Gap Detected"
- Description: "Dr. [Name] - 10:00-12:00 (2.0 hours)"
- Suggested action: "Fill gap or optimize schedule"

---

## 7. RETAIL SALES

### Test Case 7.1: Product Sale
**Objective:** Verify retail product can be sold

**Steps:**
1. Patient purchases knee brace ($45.00)
2. Front desk adds to invoice
3. Process payment

**Expected Result:**
- Line item added: "Knee Brace - Standard" - $45.00
- Inventory reduced by 1
- SKU: KB-STD-001
- Stock level updated

---

## 8. REPORTING

### Test Case 8.1: Daily Revenue Report
**Objective:** Verify daily report generates correctly

**Steps:**
1. Select date: 2026-05-15
2. Generate revenue report

**Expected Result:**
- Total billed: $XXX.XX
- Total collected: $XXX.XX
- Insurance pending: $XXX.XX
- Top services listed
- Collection rate calculated

---

## 9. SECURITY & ACCESS CONTROL

### Test Case 9.1: Role-Based Access
**Objective:** Verify front desk cannot access financial reports

**Steps:**
1. Login as front desk user
2. Attempt to access Financial Governance module

**Expected Result:**
- Access denied
- Error: "Insufficient permissions"
- Redirect to dashboard

---

### Test Case 9.2: Data Isolation
**Objective:** Verify clinics can only see their own data

**Steps:**
1. Login as AIM South Commons manager
2. View scheduler
3. Attempt to view AIM North appointments

**Expected Result:**
- Only South Commons appointments visible
- RLS policy enforces clinic_id filtering
- No data leakage

---

## 10. INTEGRATION TESTING

### Test Case 10.1: SMS Delivery via Twilio
**Objective:** Verify SMS actually sent through comm service

**Steps:**
1. Trigger appointment reminder
2. Check Twilio logs
3. Confirm delivery

**Expected Result:**
- SMS queued in database
- Twilio webhook called
- Status updated to "delivered"

---

### Test Case 10.2: Google Review Sync
**Objective:** Verify reviews synced from Google

**Steps:**
1. New review posted on Google
2. Hourly sync job runs
3. Review imported to database

**Expected Result:**
- Review in google_reviews table
- Reviewer name, rating, text captured
- If negative (≤3 stars), alert created

---

## 11. PERFORMANCE TESTING

### Test Case 11.1: Load Test - 100 Concurrent Users
**Objective:** Verify system handles clinic peak load

**Setup:**
- 100 simulated users
- Mix of: viewing scheduler, booking appointments, accessing charts
- Duration: 15 minutes

**Expected Result:**
- No errors or timeouts
- Response time < 2 seconds for all operations
- Database queries optimized (no N+1 problems)

---

### Test Case 11.2: Large Dataset - 10,000 Appointments
**Objective:** Verify scheduler performs with full database

**Setup:**
- Seed 10,000 appointments across 6 months
- 1,000 patients
- View scheduler with filters

**Expected Result:**
- Queries return in < 500ms
- Pagination works correctly
- No memory leaks

---

## 12. DISASTER RECOVERY

### Test Case 12.1: Database Backup & Restore
**Objective:** Verify data can be recovered

**Steps:**
1. Take database snapshot
2. Simulate data corruption
3. Restore from backup

**Expected Result:**
- All data restored successfully
- No data loss
- Downtime < 15 minutes

---

## TESTING SCHEDULE

### Week 1 (March 11-15, 2026)
- [ ] Patient booking flow (Cases 1.1-1.3)
- [ ] Clinical workflow (Cases 2.1-2.3)
- [ ] Billing workflow (Cases 3.1-3.4)

### Week 2 (March 18-22, 2026)
- [ ] Referral tracking (Cases 4.1-4.2)
- [ ] Communication workflows (Cases 5.1-5.2)
- [ ] Scheduler intelligence (Cases 6.1-6.2)

### Week 3 (March 25-29, 2026)
- [ ] Retail sales (Case 7.1)
- [ ] Reporting (Case 8.1)
- [ ] Security & access (Cases 9.1-9.2)

### Week 4 (April 1-5, 2026)
- [ ] Integration testing (Cases 10.1-10.2)
- [ ] Performance testing (Cases 11.1-11.2)
- [ ] Disaster recovery (Case 12.1)

---

## TEST EXECUTION LOG

| Test Case | Date | Tester | Status | Notes |
|-----------|------|--------|--------|-------|
| 1.1 | | | Pending | |
| 1.2 | | | Pending | |
| 1.3 | | | Pending | |

---

## BUG TRACKING

### Critical Bugs
- None identified yet

### High Priority
- None identified yet

### Medium Priority
- None identified yet

---

## SIGN-OFF CRITERIA

Before launch on May 1, 2026, the following must be verified:

- [ ] All critical path tests passing (Cases 1.1, 2.1, 2.2, 3.1, 3.2)
- [ ] No critical or high priority bugs open
- [ ] Performance tests passing (< 2s response time)
- [ ] Security tests passing (RLS working)
- [ ] Backup & recovery tested successfully
- [ ] Training completed for all staff
- [ ] Documentation complete

---

**Testing Lead:** TBD
**Sign-off Required:** Operations Manager, Technical Lead, Clinic Manager

---

## END OF TESTING SUITE
