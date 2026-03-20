/*
  # Seed Realistic AI Call Agent Data v2

  Inserts 25 call sessions, 15 appointments, and 16 events covering all intake types:
  physio (new patients, post-surgical, pediatric, elderly), orthotics (plantar fasciitis,
  overpronation, diabetic, sports), WCB (acute, frustrated, follow-up), MVA (rear-end,
  multi-party, French-speaking), employer inquiries (Syncrude, construction), and
  existing patient rescheduling calls.

  Uses valid insurance_type values: 'private', 'wcb', 'mva', 'employer', 'direct_billing'
*/

DO $$
DECLARE
  loc_id UUID;
  prac1_id UUID;
  prac2_id UUID;
  prac3_id UUID;

  s1 UUID := gen_random_uuid(); s2 UUID := gen_random_uuid(); s3 UUID := gen_random_uuid();
  s4 UUID := gen_random_uuid(); s5 UUID := gen_random_uuid(); s6 UUID := gen_random_uuid();
  s7 UUID := gen_random_uuid(); s8 UUID := gen_random_uuid(); s9 UUID := gen_random_uuid();
  s10 UUID := gen_random_uuid(); s11 UUID := gen_random_uuid(); s12 UUID := gen_random_uuid();
  s13 UUID := gen_random_uuid(); s14 UUID := gen_random_uuid(); s15 UUID := gen_random_uuid();
  s16 UUID := gen_random_uuid(); s17 UUID := gen_random_uuid(); s18 UUID := gen_random_uuid();
  s19 UUID := gen_random_uuid(); s20 UUID := gen_random_uuid(); s21 UUID := gen_random_uuid();
  s22 UUID := gen_random_uuid(); s23 UUID := gen_random_uuid(); s24 UUID := gen_random_uuid();
  s25 UUID := gen_random_uuid();

  a1 UUID := gen_random_uuid(); a2 UUID := gen_random_uuid(); a3 UUID := gen_random_uuid();
  a4 UUID := gen_random_uuid(); a5 UUID := gen_random_uuid(); a6 UUID := gen_random_uuid();
  a7 UUID := gen_random_uuid(); a8 UUID := gen_random_uuid(); a9 UUID := gen_random_uuid();
  a10 UUID := gen_random_uuid(); a11 UUID := gen_random_uuid(); a12 UUID := gen_random_uuid();
  a13 UUID := gen_random_uuid(); a14 UUID := gen_random_uuid(); a15 UUID := gen_random_uuid();

BEGIN
  SELECT id INTO loc_id FROM ai_clinic_locations WHERE active = true ORDER BY created_at LIMIT 1;
  SELECT id INTO prac1_id FROM ai_practitioners WHERE active = true ORDER BY booking_priority LIMIT 1;
  SELECT id INTO prac2_id FROM ai_practitioners WHERE active = true ORDER BY booking_priority OFFSET 1 LIMIT 1;
  SELECT id INTO prac3_id FROM ai_practitioners WHERE active = true ORDER BY booking_priority OFFSET 2 LIMIT 1;

  IF prac2_id IS NULL THEN prac2_id := prac1_id; END IF;
  IF prac3_id IS NULL THEN prac3_id := prac1_id; END IF;

  -- ─── 25 CALL SESSIONS ───────────────────────────────────────────────────
  INSERT INTO call_sessions (
    id, caller_phone, caller_name, transcript, ai_summary, intent_type, service_type,
    urgency_level, routing_result, assigned_location_id, escalation_required, escalation_reason,
    call_duration_seconds, sentiment, issue_summary, callback_needed, insurance_context,
    is_existing_patient, stage_reached, location_preference, ai_provider, staff_notes,
    created_at, updated_at
  ) VALUES

  (s1,'(587) 234-7821','Sarah Kowalski',
   E'AI: Thank you for calling AIM Health. How can I help you today?\nCaller: Hi, I have lower back pain that has been getting worse for about 3 weeks. I''ve been having trouble sleeping and it hurts when I sit for long periods at my desk.\nAI: I''m sorry to hear that. I can help you get an appointment with one of our physiotherapists. Are you a new patient?\nCaller: Yes, first time. My doctor suggested I try physio.\nAI: Great. Can I confirm you''re looking for our South Commons location?\nCaller: South Commons would be closest.\nAI: We have availability Thursday at 2:30 PM or Friday at 9:00 AM. Which works?\nCaller: Thursday at 2:30 would be great.\nAI: Booked for Thursday 2:30 PM. You''ll receive a confirmation SMS shortly.',
   'New patient with 3-week lower back pain affecting sleep and desk work. GP-referred. Booked for initial physio assessment Thursday 2:30 PM at South Commons. Cooperative and motivated.',
   'physio','physio','medium','booked',loc_id,false,null,247,'positive',
   'Lower back pain x3 weeks, worsening. Affects sleep and prolonged sitting. GP referral.',
   false,'Alberta Blue Cross - Extended Health',false,'confirmation','South Commons','retell',null,
   NOW()-INTERVAL'2 hours',NOW()-INTERVAL'2 hours'),

  (s2,'(780) 441-9823','Marcus Thompson',
   E'AI: Thank you for calling AIM Health Physiotherapy.\nCaller: I hurt my shoulder playing hockey last weekend. Quite sore — can''t lift my arm above my head.\nAI: That sounds painful. Do you have extended health benefits?\nCaller: Yes, through my employer, Pembina Pipeline.\nAI: Our Heritage Valley location would be closest to Windermere. Unfortunately all today and tomorrow slots are filled. May I have our front desk call you back for the earliest opening?\nCaller: Yes please. I''m free from noon onwards.\nAI: Perfect. Callback noted. Available after noon.',
   'New patient, acute shoulder injury from hockey, limited abduction. Pembina Pipeline benefits. All slots full — callback requested. Available after noon. Heritage Valley preferred.',
   'physio','physio','high','callback_requested',loc_id,false,null,198,'neutral',
   'Acute shoulder injury, limited ROM, cannot raise arm overhead.',
   true,'Group Benefits - Pembina Pipeline',false,'qualification','Heritage Valley','retell',
   'Called back at 2:15 PM - booked Fri 10am with Dr. Chen',
   NOW()-INTERVAL'5 hours',NOW()-INTERVAL'3 hours'),

  (s3,'(587) 891-2344','Jennifer Osei',
   E'AI: AIM Health, how can I help?\nCaller: I was in a car accident three weeks ago. My neck is really sore. I''m not sure if I need WCB or if it goes through car insurance.\nAI: For motor vehicle accidents the claim process goes through your auto insurance, not WCB. We specialize in MVA rehabilitation. Have you opened a claim?\nCaller: I''ve contacted my insurance but don''t have a claim number yet.\nAI: That''s fine. Let me transfer you to our intake coordinator who can walk you through the MVA process.\nCaller: OK sounds good.',
   'New patient, cervical strain from MVA 3 weeks ago. Auto insurance claim in progress (no number yet). Transferred to intake coordinator for MVA claim walkthrough.',
   'mva','mva','medium','transferred',loc_id,false,null,312,'neutral',
   'Neck pain post-MVA 3 weeks. Insurance claim in progress, no claim number yet.',
   false,'Auto Insurance - Intact',false,'routing',null,'retell',null,
   NOW()-INTERVAL'1 day',NOW()-INTERVAL'1 day'),

  (s4,'(780) 324-5567','Robert Delacroix',
   E'AI: AIM Health, how can I assist?\nCaller: I''d like to get custom orthotics. My podiatrist recommended them for plantar fasciitis.\nAI: We do custom orthotics — full biomechanical assessment and foot scan, about 60 minutes. Do you have extended benefits?\nCaller: Yes, through Sun Life.\nAI: Most Sun Life plans cover orthotics well. We have Thursday 10 AM or Monday 1 PM.\nCaller: Thursday 10 works.\nAI: Confirmed! Thursday 10:00 AM for your orthotics assessment.',
   'New patient, podiatrist-referred for custom orthotics for plantar fasciitis. Sun Life benefits. Booked 60-min orthotics assessment Thursday 10 AM.',
   'orthotics','orthotics','low','booked',loc_id,false,null,203,'positive',
   'Plantar fasciitis, podiatrist-referred. First time patient.',
   false,'Sun Life Extended Health',false,'confirmation',null,'retell',null,
   NOW()-INTERVAL'3 hours',NOW()-INTERVAL'3 hours'),

  (s5,'(587) 672-0091','Priya Nambiar',
   E'AI: Good afternoon, AIM Health.\nCaller: I''m calling about custom orthotics. I have overpronation and flat feet.\nAI: Do you know your insurance coverage? We want to make sure your visit is straightforward.\nCaller: I have a work plan but I don''t know the exact coverage. I don''t want a big out-of-pocket cost.\nAI: Would you like our orthotics coordinator to call you back with a clear cost estimate?\nCaller: Yes, very helpful.\nAI: Available for callback — when works best?\nCaller: Tomorrow morning.',
   'New patient, overpronation/flat feet, interested in custom orthotics. Uncertain about coverage. Callback from orthotics coordinator requested — available tomorrow morning.',
   'orthotics','orthotics','low','callback_requested',loc_id,false,null,167,'neutral',
   'Overpronation and flat feet. Insurance coverage unclear.',
   true,'Work benefits - unknown plan',false,'qualification',null,'retell',null,
   NOW()-INTERVAL'6 hours',NOW()-INTERVAL'6 hours'),

  (s6,'(780) 556-3321','Tyler Brandt',
   E'AI: AIM Health, how can I help?\nCaller: I need to book. I hurt my back at work lifting and have a WCB claim.\nAI: WCB patients are a priority. Can I get your claim number?\nCaller: AB-2024-778821.\nAI: Lower back, lumbar area — you said you can barely bend over?\nCaller: Yes.\nAI: We have a WCB assessment tomorrow at 1:00 PM. Does that work?\nCaller: Yes, great.\nAI: Booked. Please bring your Notice of Claim paperwork.',
   'WCB patient, acute low back lifting injury. Claim AB-2024-778821. Severe lumbar flexion limitation. Booked for WCB initial assessment tomorrow 1:00 PM.',
   'wcb','wcb','high','booked',loc_id,false,null,228,'neutral',
   'Acute low back injury from workplace lifting. WCB claim AB-2024-778821. Severe flexion limitation.',
   false,'WCB Alberta - Claim AB-2024-778821',false,'confirmation',null,'retell',null,
   NOW()-INTERVAL'4 hours',NOW()-INTERVAL'4 hours'),

  (s7,'(587) 103-9882','Dmitri Volkov',
   E'AI: AIM Health, how can I help?\nCaller: Finally someone answers. I''ve been in pain for two weeks and WCB keeps sending me back and forth. I need an appointment NOW.\nAI: I hear you and I''m very sorry. Let''s get this sorted. Your WCB claim number?\nCaller: AB-2024-661004. This has been a nightmare. I can''t work, I can''t sleep.\nAI: I''m flagging this as urgent and escalating to our WCB coordinator who will call you within the hour.\nCaller: I just need someone to actually help me.\nAI: Our WCB coordinator will call you within the hour. I''ve marked this high priority.',
   'Highly distressed WCB patient, 2 weeks without proper care, unable to work or sleep. Claim AB-2024-661004. Escalated to WCB coordinator for urgent 1-hour callback.',
   'wcb','wcb','high','callback_requested',loc_id,
   true,'Patient highly distressed - 2 weeks without care. WCB claim AB-2024-661004. Urgent 1-hour callback required.',
   289,'frustrated',
   'WCB patient - 2 weeks severe pain, no resolution. Cannot work or sleep.',
   true,'WCB Alberta - Claim AB-2024-661004',false,'qualification',null,'retell',
   'WCB coordinator Kim called back within 30 min. Emergency slot booked.',
   NOW()-INTERVAL'1 day',NOW()-INTERVAL'20 hours'),

  (s8,'(780) 992-4471','Aisha Okonkwo',
   E'AI: AIM Health, thank you for calling.\nCaller: I was in a rear-end collision two weeks ago with a claim from Intact Insurance. My neck and shoulders are really sore.\nAI: MVA rehabilitation is our specialty. Your claim number?\nCaller: IBC-2024-88321-A.\nAI: I have tomorrow at 11:00 AM or Wednesday 3:30 PM.\nCaller: Tomorrow works.\nAI: Perfect. Initial MVA assessment tomorrow 11:00 AM.',
   'MVA patient, rear-end collision 2 weeks ago. Intact Insurance claim IBC-2024-88321-A. Cervical and shoulder strain. Booked tomorrow 11 AM.',
   'mva','mva','medium','booked',loc_id,false,null,195,'positive',
   'Rear-end collision 2 weeks. Neck/shoulder pain. MVA claim with Intact Insurance.',
   false,'MVA - Intact Insurance IBC-2024-88321-A',false,'confirmation',null,'retell',null,
   NOW()-INTERVAL'8 hours',NOW()-INTERVAL'8 hours'),

  (s9,'(587) 441-7723','Unknown Caller',
   E'AI: AIM Health, how can I help?\nCaller: Hi yes I was in an accident and I want to book—\n[Call disconnected]',
   'Call dropped after caller mentioned MVA. No details captured. Consider proactive outreach if caller ID matches existing records.',
   'mva','mva','low','incomplete',loc_id,false,null,23,'neutral',
   'Call dropped - MVA inquiry, no details captured.',
   false,null,false,'greeting',null,'retell',null,
   NOW()-INTERVAL'2 days',NOW()-INTERVAL'2 days'),

  (s10,'(780) 881-7700','Cassandra Whitfield',
   E'AI: AIM Health, how can I help?\nCaller: I''m calling on behalf of Syncrude Canada. We''re looking to set up a preferred provider agreement. About 800 employees in Fort McMurray.\nAI: Wonderful. We have a corporate partnerships program covering preferred scheduling, group rates, and on-site ergonomic assessments. Shall I book a consultation call with our partnerships director?\nCaller: Yes. We do a lot of manual labour.\nAI: Significant experience with oil and gas clients. Booked: Monday 10:00 AM discovery call with Dr. Anand Mehta.',
   'Corporate inquiry from Syncrude Canada HR (800 employees, Fort McMurray). Preferred provider interest. Booked 45-min discovery call Monday 10 AM with partnerships director.',
   'employer','physio','medium','booked',loc_id,false,null,387,'positive',
   'Syncrude Canada corporate preferred provider inquiry. 800 employees, oil/gas sector.',
   false,'Corporate - Syncrude Canada',false,'confirmation',null,'retell',
   'High-value corporate prospect. Flag for partnerships director.',
   NOW()-INTERVAL'3 days',NOW()-INTERVAL'3 days'),

  (s11,'(780) 332-5510','Ben Halloway',
   E'AI: AIM Health, how can I help?\nCaller: I''m an occupational health manager at a construction company. We''ve had WCB claims and are looking at preventative programs.\nAI: We offer workplace wellness and injury prevention. Workforce size?\nCaller: About 150 workers, mostly on-site trades.\nAI: I''ll have our workplace health coordinator send a customized proposal. Best email?\nCaller: bhalloway@stonebridge-construction.ca\nAI: Program overview within 24 hours with follow-up call.',
   'Occupational health manager at Stonebridge Construction (150 trades). Injury prevention program inquiry. Email: bhalloway@stonebridge-construction.ca. Coordinator follow-up pending.',
   'employer','physio','low','callback_requested',loc_id,false,null,221,'positive',
   'Construction company OH manager - injury prevention for 150 trade workers.',
   true,'Corporate - Stonebridge Construction',false,'qualification',null,'retell',null,
   NOW()-INTERVAL'2 days',NOW()-INTERVAL'2 days'),

  (s12,'(587) 229-8834','Daniel Fernandez',
   E'AI: AIM Health, how can I help?\nCaller: I''m a patient there. I have an appointment tomorrow at 9 AM but something came up at work. Need to reschedule.\nAI: Of course. Date of birth?\nCaller: June 15, 1985.\nAI: I see your appointment with Dr. Patel tomorrow morning. What days work this week?\nCaller: Any afternoon this week.\nAI: Thursday 2:00 PM or Friday 3:30 PM with Dr. Patel.\nCaller: Thursday 2 is perfect.\nAI: Rescheduled to Thursday 2:00 PM. New confirmation SMS sent.',
   'Existing patient rescheduling due to work conflict. Wed 9 AM → Thu 2 PM with Dr. Patel. Smooth interaction.',
   'existing_patient','physio','low','booked',loc_id,false,null,143,'positive',
   'Appointment reschedule - work conflict. Wed 9 AM → Thu 2 PM.',
   false,'Extended Health',true,'confirmation',null,'retell',null,
   NOW()-INTERVAL'1 day',NOW()-INTERVAL'1 day'),

  (s13,'(780) 774-3312','Grace Mullen',
   E'AI: AIM Health, how can I help?\nCaller: I''ve been a patient for 6 months for my knee. My therapist said we''re near discharge but it still doesn''t feel right.\nAI: Discharge timing is really a conversation with your physiotherapist. I''ll transfer you to the clinic coordinator who can note your concern and discuss options.\nCaller: OK, yes. I also have questions about my benefits.\nAI: We can address both. Transferring you now.',
   'Long-term physio patient (6 months, knee), concerned about premature discharge and remaining benefits. Transferred to clinic coordinator for treatment plan and benefits discussion.',
   'existing_patient','physio','medium','transferred',loc_id,false,null,187,'frustrated',
   'Knee rehabilitation ongoing. Concerned about discharge timing and benefits balance.',
   false,'Extended Health - Benefits inquiry',true,'routing',null,'retell',null,
   NOW()-INTERVAL'6 hours',NOW()-INTERVAL'6 hours'),

  (s14,'(587) 662-1100','Patricia O''Brien',
   E'AI: AIM Health, how can I help?\nCaller: I just had knee replacement surgery 3 weeks ago and was told to start physio immediately. My surgeon is Dr. Lindqvist at the U of A.\nAI: Post-surgical rehabilitation is critical. Are you able to come in on crutches?\nCaller: Yes, with help.\nAI: Priority post-surgical booking. Tomorrow 10:30 AM available.\nCaller: Wonderful, thank you.\nAI: Booked. Please bring your surgical report.',
   'Post knee replacement (Dr. Lindqvist, U of A), 3 weeks post-op, on crutches. Priority booking for post-surgical rehab. Tomorrow 10:30 AM.',
   'physio','physio','high','booked',loc_id,false,null,218,'positive',
   'Post-knee replacement 3 weeks post-op, Dr. Lindqvist referral. Priority rehab.',
   false,'AHC / Extended Benefits',false,'confirmation',null,'retell',null,
   NOW()-INTERVAL'30 minutes',NOW()-INTERVAL'30 minutes'),

  (s15,'(780) 234-9901','Kevin Tran',
   E'AI: AIM Health, how can I help?\nCaller: I''m a runner dealing with shin splints for months. Sports medicine doctor thinks custom orthotics might help.\nAI: We do full biomechanical assessments with gait analysis for runners. Benefits coverage?\nCaller: University of Alberta staff plan.\nAI: That typically covers orthotics well. Thursday 4 PM?\nCaller: Thursday works.\nAI: Booked! Bring your running shoes for gait analysis.',
   'Runner with chronic shin splints, sports medicine referral for custom orthotics and gait analysis. U of A staff benefits. Booked Thursday 4 PM.',
   'orthotics','orthotics','low','booked',loc_id,false,null,189,'positive',
   'Shin splints from running. Sports medicine referral for orthotics and gait analysis.',
   false,'U of A Staff Benefits',false,'confirmation',null,'retell',null,
   NOW()-INTERVAL'7 hours',NOW()-INTERVAL'7 hours'),

  (s16,'(587) 550-8871','Omar Hassan',
   E'AI: AIM Health, how can I help?\nCaller: Do you accept WCB? I hurt my wrist at work but haven''t filed a claim yet.\nAI: Yes, we work with WCB. You could book an assessment first and our therapist can advise whether a formal claim makes sense.\nCaller: That makes sense. Let''s book.\nAI: Friday 1:00 PM — does that work?\nCaller: Yes, works fine.',
   'Work wrist injury, undecided on WCB claim. Consultation booked Friday 1 PM to assess severity and advise on claim process.',
   'wcb','wcb','medium','booked',loc_id,false,null,267,'neutral',
   'Work wrist injury, undecided on WCB filing. Consultation to advise on claim.',
   false,'Potential WCB claim',false,'confirmation',null,'retell',null,
   NOW()-INTERVAL'2 days',NOW()-INTERVAL'2 days'),

  (s17,'(780) 667-3341','Linda Morrison',
   E'AI: Thank you for calling AIM Health. Please leave a message.\nCaller: Hi, this is Linda Morrison. I''d like to book a physio appointment for my shoulder. Call me back at this number. Thanks.',
   'Voicemail - shoulder issue, requesting physio appointment. Callback number provided.',
   'physio','physio','low','voicemail',loc_id,false,null,34,'neutral',
   'Voicemail - shoulder issue, requesting physio appointment.',
   true,null,false,'greeting',null,'retell',null,
   NOW()-INTERVAL'3 days',NOW()-INTERVAL'3 days'),

  (s18,'(587) 784-5523','Stephane Bouchard',
   E'AI: AIM Health, how can I help?\nCaller: Bonjour. I was in an accident. My English is not perfect. I have pain in my back and neck.\nAI: Take your time. Do you have an insurance claim number?\nCaller: Yes, TD Insurance. Number TD-2024-553892.\nAI: Have you seen a doctor?\nCaller: Yes, my family doctor said to go to physio.\nAI: We have Wednesday 2:00 PM. Is that OK?\nCaller: Yes, Wednesday, OK.\nAI: Booked. Wednesday 2 PM for MVA assessment.',
   'French-speaking MVA patient, GP referred. TD Insurance claim TD-2024-553892. Back and neck pain. Booked Wednesday 2 PM. Note: may need translation support.',
   'mva','mva','medium','booked',loc_id,false,null,334,'neutral',
   'MVA patient (French-speaking), neck/back pain, GP referral, TD Insurance.',
   false,'MVA - TD Insurance TD-2024-553892',false,'confirmation',null,'retell',
   'French-speaking patient - may need translation support at appointment.',
   NOW()-INTERVAL'4 days',NOW()-INTERVAL'4 days'),

  (s19,'(780) 229-4456','Rachel Kim',
   E'AI: AIM Health, how can I help?\nCaller: I''m calling about my 14-year-old daughter. She''s been having knee pain playing soccer — possibly Osgood-Schlatter.\nAI: Common in young athletes. Is she still playing?\nCaller: Sitting out 2 weeks. She''s upset about it.\nAI: We work with adolescent patients. Weekday after school preference?\nCaller: Around 4 or 5 PM.\nAI: Tuesday 4:30 PM. Her name?\nCaller: Mia Kim.\nAI: Booked for Mia Kim, Tuesday 4:30 PM.',
   'Pediatric patient Mia Kim (14F, soccer) - suspected Osgood-Schlatter, 2 weeks off sports. Mother called. After-school slot Tuesday 4:30 PM.',
   'physio','physio','medium','booked',loc_id,false,null,256,'positive',
   'Pediatric 14F soccer player - suspected Osgood-Schlatter, 2 weeks inactive.',
   false,'Family Benefits',false,'confirmation',null,'retell',null,
   NOW()-INTERVAL'1 day',NOW()-INTERVAL'1 day'),

  (s20,'(587) 332-0097','Howard Beaumont',
   E'AI: AIM Health, how can I help?\nCaller: Hello. I''m 79 years old and I had a fall last month. My daughter told me to call.\nAI: I''m glad you called. Are you in pain?\nCaller: My hip is sore. Not broken — they checked at hospital. Hurts to walk far.\nAI: We have physiotherapists with geriatric experience. Is someone able to bring you?\nCaller: My daughter can. Maybe next week?\nAI: Monday 11 AM — a relaxed time slot. Your daughter is welcome to come in.\nCaller: Monday 11. Yes.',
   '79-year-old male, post-fall hip pain (fracture ruled out). Daughter accompanying. Geriatric-focused slot Monday 11 AM. Family involvement confirmed.',
   'physio','physio','medium','booked',loc_id,false,null,298,'positive',
   'Elderly 79M, post-fall hip pain, balance rehabilitation needed.',
   false,'Alberta Health Care',false,'confirmation',null,'retell',
   'Geriatric patient. Balance-focused assessment protocol recommended.',
   NOW()-INTERVAL'5 hours',NOW()-INTERVAL'5 hours'),

  (s21,'(780) 558-2290','Nadia Petrov',
   E'AI: AIM Health, how can I help?\nCaller: I''m a current patient. 6 sessions for lower back and I''m not feeling much improvement. Am I doing something wrong?\nAI: I''d like to connect you with your therapist to discuss progress. Can I transfer you to our coordinator who can arrange an urgent therapist callback?\nCaller: Can I talk to someone today?\nAI: Connecting you now to our clinic coordinator.',
   'Existing patient (6 sessions, lower back), not seeing expected progress. Requesting same-day therapist consultation. Transferred to clinic coordinator.',
   'existing_patient','physio','medium','transferred',loc_id,false,null,178,'frustrated',
   '6 sessions lower back with limited perceived improvement. Reassessment requested.',
   false,'Extended Health',true,'routing',null,'retell',null,
   NOW()-INTERVAL'9 hours',NOW()-INTERVAL'9 hours'),

  (s22,'(587) 990-1123','Chris Abbott',
   E'AI: AIM Health, how can I help?\nCaller: I need an appointment today if possible. I woke up and can barely move my neck. Pain is like 8 out of 10.\nAI: That warrants same-day care. Let me check — we have a cancellation at 1:30 PM today. Can you make it?\nCaller: Absolutely.\nAI: Booked. 1:30 PM today. Mention it''s a same-day acute booking at reception.',
   'Acute neck pain (8/10 severity, overnight onset). Work-from-home, flexible. Same-day cancellation slot booked 1:30 PM.',
   'physio','physio','high','booked',loc_id,false,null,134,'positive',
   'Acute neck pain 8/10, onset overnight. Same-day booking.',
   false,'Group Benefits',false,'confirmation',null,'retell',null,
   NOW()-INTERVAL'10 minutes',NOW()-INTERVAL'10 minutes'),

  (s23,'(780) 412-7788','Fatima Al-Rashid',
   E'AI: AIM Health, how can I help?\nCaller: My family doctor sent me for custom orthotics. I have type 2 diabetes and foot pain with numbness.\nAI: Diabetic foot care is very important — we work with many diabetic patients. New patient?\nCaller: Yes. My doctor is Dr. Sharma at Millwoods.\nAI: We have a slot Friday 10 AM with extended time for new diabetic patients.\nCaller: That works.\nAI: Booked. Bring any previous orthotics and comfortable shoes.',
   'New diabetic patient (Type 2), foot pain and neuropathy. Dr. Sharma referral (Millwoods). Specialized diabetic orthotics assessment Friday 10 AM.',
   'orthotics','orthotics','medium','booked',loc_id,false,null,219,'positive',
   'Type 2 diabetic - foot pain and neuropathy. Physician referral for custom orthotics.',
   false,'AHC / Diabetes Program',false,'confirmation',null,'retell',null,
   NOW()-INTERVAL'11 hours',NOW()-INTERVAL'11 hours'),

  (s24,'(587) 881-3320','Mike Jardine',
   E'AI: AIM Health, how can I help?\nCaller: I''m in a WCB program with you. I have an appointment Thursday but I need to reschedule — I have a WCB board review that day.\nAI: No problem. Which day works better?\nCaller: The following Monday? Same time if possible.\nAI: Monday 2:00 PM — same time slot moved to Monday.\nCaller: Perfect, thanks.\nAI: Done. Monday 2:00 PM.',
   'Active WCB patient rescheduling due to WCB board review conflict. Thursday → Monday same time 2:00 PM. Smooth.',
   'existing_patient','wcb','low','booked',loc_id,false,null,112,'positive',
   'WCB patient reschedule - board review conflict. Thu → Mon 2 PM.',
   false,'WCB Alberta - Active claim',true,'confirmation',null,'retell',null,
   NOW()-INTERVAL'2 days',NOW()-INTERVAL'2 days'),

  (s25,'(780) 334-8821','Inquirer',
   E'AI: AIM Health, how can I help?\nCaller: How much does physiotherapy cost? I don''t have insurance.\nAI: Initial assessment is $120, follow-up treatments $85. Custom orthotics assessment $125, with orthotics $350-500 depending on complexity. We also offer payment plans.\nCaller: OK, thanks. I''ll think about it.\nAI: Of course. Call back anytime.',
   'Self-pay price inquiry. Provided rates: initial $120, follow-up $85, orthotics assessment $125, orthotics $350-500. No booking. Patient considering options.',
   'unknown','unknown','low','information_only',loc_id,false,null,89,'neutral',
   'Price inquiry - self-pay, no insurance. Rates provided.',
   false,'Self-pay',false,'qualification',null,'retell',null,
   NOW()-INTERVAL'3 days',NOW()-INTERVAL'3 days');

  -- ─── 15 APPOINTMENTS ─────────────────────────────────────────────────────
  INSERT INTO ai_appointments (
    id, clinic_location_id, practitioner_id, service_type, appointment_type,
    start_time, end_time, duration_minutes, status, booking_source,
    notes, confirmation_code, patient_name, patient_phone, patient_email,
    insurance_type, estimated_revenue, is_new_patient, created_at, updated_at
  ) VALUES

  (a1,loc_id,prac1_id,'physio','initial_assessment',
   NOW()+INTERVAL'1 day 14 hours 30 minutes',NOW()+INTERVAL'1 day 15 hours 30 minutes',60,
   'confirmed','ai_call_agent','Lower back pain x3 weeks, GP referral. New patient.','AIM-K7X2P1',
   'Sarah Kowalski','(587) 234-7821','sarah.kowalski@email.com','private',120,true,
   NOW()-INTERVAL'2 hours',NOW()-INTERVAL'2 hours'),

  (a2,loc_id,prac1_id,'orthotics','orthotics_assessment',
   NOW()+INTERVAL'1 day 10 hours',NOW()+INTERVAL'1 day 11 hours',60,
   'confirmed','ai_call_agent','Plantar fasciitis, podiatrist referral. Sun Life.','AIM-Q8T4R9',
   'Robert Delacroix','(780) 324-5567','rdelacroix@email.com','private',125,true,
   NOW()-INTERVAL'3 hours',NOW()-INTERVAL'3 hours'),

  (a3,loc_id,prac2_id,'wcb_assessment','initial_assessment',
   NOW()+INTERVAL'20 hours',NOW()+INTERVAL'21 hours',60,
   'confirmed','ai_call_agent','WCB Claim AB-2024-778821. Acute low back lifting injury. Priority.','AIM-V3N8K2',
   'Tyler Brandt','(780) 556-3321',null,'wcb',0,true,
   NOW()-INTERVAL'4 hours',NOW()-INTERVAL'4 hours'),

  (a4,loc_id,prac1_id,'mva_assessment','initial_assessment',
   NOW()+INTERVAL'23 hours',NOW()+INTERVAL'24 hours',60,
   'confirmed','ai_call_agent','MVA Intact Insurance IBC-2024-88321-A. Cervical/shoulder strain.','AIM-D5M7Z3',
   'Aisha Okonkwo','(780) 992-4471',null,'mva',0,true,
   NOW()-INTERVAL'8 hours',NOW()-INTERVAL'8 hours'),

  (a5,loc_id,prac3_id,'physio','initial_assessment',
   NOW()+INTERVAL'1 day 10 hours 30 minutes',NOW()+INTERVAL'1 day 11 hours 30 minutes',60,
   'confirmed','ai_call_agent','Post knee replacement (Dr. Lindqvist, U of A). 3 weeks post-op. Priority.','AIM-R2F6J8',
   'Patricia O''Brien','(587) 662-1100',null,'private',120,true,
   NOW()-INTERVAL'30 minutes',NOW()-INTERVAL'30 minutes'),

  (a6,loc_id,prac1_id,'physio','initial_assessment',
   NOW()+INTERVAL'4 days 9 hours',NOW()+INTERVAL'4 days 10 hours',60,
   'scheduled','ai_call_agent','Suspected Osgood-Schlatter, 14F soccer player. After-school slot.','AIM-L9P3X7',
   'Mia Kim','(780) 229-4456',null,'private',120,true,
   NOW()-INTERVAL'1 day',NOW()-INTERVAL'1 day'),

  (a7,loc_id,prac2_id,'mva_assessment','initial_assessment',
   NOW()+INTERVAL'3 days 14 hours',NOW()+INTERVAL'3 days 15 hours',60,
   'scheduled','ai_call_agent','MVA TD Insurance TD-2024-553892. French-speaking. Translation may be needed.','AIM-C4H8W1',
   'Stephane Bouchard','(587) 784-5523',null,'mva',0,true,
   NOW()-INTERVAL'4 days',NOW()-INTERVAL'4 days'),

  (a8,loc_id,prac3_id,'physio','follow_up',
   NOW()+INTERVAL'2 days 14 hours',NOW()+INTERVAL'2 days 14 hours 45 minutes',45,
   'scheduled','ai_call_agent','Reschedule from Wed 9AM. Patient: Daniel Fernandez.','AIM-S7B2N4',
   'Daniel Fernandez','(587) 229-8834',null,'private',85,false,
   NOW()-INTERVAL'1 day',NOW()-INTERVAL'1 day'),

  (a9,loc_id,prac1_id,'orthotics','orthotics_assessment',
   NOW()+INTERVAL'3 days 16 hours',NOW()+INTERVAL'3 days 17 hours',60,
   'scheduled','ai_call_agent','Runner with shin splints. Bring running shoes for gait analysis.','AIM-T6E3A5',
   'Kevin Tran','(780) 234-9901',null,'private',125,true,
   NOW()-INTERVAL'7 hours',NOW()-INTERVAL'7 hours'),

  (a10,loc_id,prac2_id,'physio','initial_assessment',
   NOW()+INTERVAL'1 day 13 hours 30 minutes',NOW()+INTERVAL'1 day 14 hours 30 minutes',60,
   'scheduled','ai_call_agent','Same-day acute neck pain. 8/10 severity. Cancellation slot.','AIM-U1W9I6',
   'Chris Abbott','(587) 990-1123',null,'private',120,true,
   NOW()-INTERVAL'10 minutes',NOW()-INTERVAL'10 minutes'),

  (a11,loc_id,prac3_id,'physio','initial_assessment',
   NOW()+INTERVAL'7 days 11 hours',NOW()+INTERVAL'7 days 12 hours',60,
   'scheduled','staff_manual','Elderly patient 79M, post-fall hip. Geriatric slot. Family attending.','AIM-G4Y7O2',
   'Howard Beaumont','(587) 332-0097',null,'private',120,true,
   NOW()-INTERVAL'5 hours',NOW()-INTERVAL'5 hours'),

  (a12,loc_id,prac1_id,'orthotics','orthotics_assessment',
   NOW()+INTERVAL'4 days 10 hours',NOW()+INTERVAL'4 days 11 hours',60,
   'scheduled','ai_call_agent','Type 2 diabetic, foot pain/neuropathy, Dr. Sharma referral. Extended time.','AIM-H2K5Q9',
   'Fatima Al-Rashid','(780) 412-7788',null,'private',125,true,
   NOW()-INTERVAL'11 hours',NOW()-INTERVAL'11 hours'),

  (a13,loc_id,prac2_id,'wcb_assessment','consultation',
   NOW()+INTERVAL'2 days 13 hours',NOW()+INTERVAL'2 days 14 hours',60,
   'confirmed','ai_call_agent','WCB wrist injury. Undecided on claim. Advise on process.','AIM-J8F3B6',
   'Omar Hassan','(587) 550-8871',null,'wcb',0,true,
   NOW()-INTERVAL'2 days',NOW()-INTERVAL'2 days'),

  (a14,loc_id,prac1_id,'employer_call','consultation',
   NOW()+INTERVAL'3 days 10 hours',NOW()+INTERVAL'3 days 10 hours 45 minutes',45,
   'confirmed','ai_call_agent','Syncrude Canada discovery call. 800 employees. Dr. Mehta attending.','AIM-Z9X1C4',
   'Cassandra Whitfield (Syncrude)','(780) 881-7700',null,'employer',0,false,
   NOW()-INTERVAL'3 days',NOW()-INTERVAL'3 days'),

  (a15,loc_id,prac1_id,'physio','follow_up',
   NOW()-INTERVAL'3 days 14 hours',NOW()-INTERVAL'3 days 13 hours',45,
   'completed','web_form','Follow-up session, patient progressing well.','AIM-M5R8W7',
   'David Chen','(587) 441-2234','dchen@gmail.com','private',85,false,
   NOW()-INTERVAL'5 days',NOW()-INTERVAL'3 days');

  -- ─── LINK SESSIONS → APPOINTMENTS ───────────────────────────────────────
  UPDATE call_sessions SET appointment_id = a1  WHERE id = s1;
  UPDATE call_sessions SET appointment_id = a2  WHERE id = s4;
  UPDATE call_sessions SET appointment_id = a3  WHERE id = s6;
  UPDATE call_sessions SET appointment_id = a4  WHERE id = s8;
  UPDATE call_sessions SET appointment_id = a5  WHERE id = s14;
  UPDATE call_sessions SET appointment_id = a6  WHERE id = s19;
  UPDATE call_sessions SET appointment_id = a7  WHERE id = s18;
  UPDATE call_sessions SET appointment_id = a8  WHERE id = s12;
  UPDATE call_sessions SET appointment_id = a9  WHERE id = s15;
  UPDATE call_sessions SET appointment_id = a10 WHERE id = s22;
  UPDATE call_sessions SET appointment_id = a11 WHERE id = s20;
  UPDATE call_sessions SET appointment_id = a12 WHERE id = s23;
  UPDATE call_sessions SET appointment_id = a13 WHERE id = s16;
  UPDATE call_sessions SET appointment_id = a14 WHERE id = s10;

  -- ─── EVENTS ──────────────────────────────────────────────────────────────
  INSERT INTO call_agent_events (event_type, call_session_id, appointment_id, payload, processed, created_at)
  VALUES
  ('inbound_call_completed',s1,null,'{"intent":"physio","duration":247}'::jsonb,true,NOW()-INTERVAL'2 hours'),
  ('ai_booking_completed',s1,a1,'{"service_type":"physio","source":"ai_call_agent"}'::jsonb,true,NOW()-INTERVAL'2 hours'),
  ('appointment_confirmed',s1,a1,'{"status":"confirmed"}'::jsonb,true,NOW()-INTERVAL'2 hours'),
  ('inbound_call_completed',s6,null,'{"intent":"wcb","duration":228}'::jsonb,true,NOW()-INTERVAL'4 hours'),
  ('ai_booking_completed',s6,a3,'{"service_type":"wcb_assessment","source":"ai_call_agent"}'::jsonb,true,NOW()-INTERVAL'4 hours'),
  ('staff_escalation_triggered',s7,null,'{"reason":"Patient highly distressed, 2 weeks without care. WCB AB-2024-661004"}'::jsonb,true,NOW()-INTERVAL'1 day'),
  ('callback_requested',s2,null,'{"intent":"physio","urgency":"high"}'::jsonb,true,NOW()-INTERVAL'5 hours'),
  ('inbound_call_completed',s8,null,'{"intent":"mva","duration":195}'::jsonb,true,NOW()-INTERVAL'8 hours'),
  ('ai_booking_completed',s8,a4,'{"service_type":"mva_assessment","source":"ai_call_agent"}'::jsonb,true,NOW()-INTERVAL'8 hours'),
  ('employer_inquiry_created',s10,a14,'{"company":"Syncrude Canada","employees":800}'::jsonb,true,NOW()-INTERVAL'3 days'),
  ('ai_booking_completed',s4,a2,'{"service_type":"orthotics","source":"ai_call_agent"}'::jsonb,true,NOW()-INTERVAL'3 hours'),
  ('inbound_call_completed',s14,null,'{"intent":"physio","duration":218,"urgency":"high"}'::jsonb,true,NOW()-INTERVAL'30 minutes'),
  ('ai_booking_completed',s14,a5,'{"service_type":"physio","source":"ai_call_agent","note":"post_surgical_priority"}'::jsonb,true,NOW()-INTERVAL'30 minutes'),
  ('callback_requested',s5,null,'{"intent":"orthotics","reason":"insurance_verification"}'::jsonb,false,NOW()-INTERVAL'6 hours'),
  ('inbound_call_completed',s22,null,'{"intent":"physio","duration":134,"urgency":"high"}'::jsonb,true,NOW()-INTERVAL'10 minutes'),
  ('ai_booking_completed',s22,a10,'{"service_type":"physio","source":"ai_call_agent","note":"same_day_urgent"}'::jsonb,true,NOW()-INTERVAL'10 minutes');

END $$;
