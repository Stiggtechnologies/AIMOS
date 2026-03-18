/*
  # Seed Patient Education Content

  1. Purpose
    - Populates the patient_education_assets table with evidence-based content
    - Provides educational materials for common conditions seen in integrative medicine
    - Materials written at appropriate reading levels for patient consumption

  2. Content Categories
    - Musculoskeletal conditions (back pain, neck pain, joint issues)
    - Pain management education
    - Recovery and self-management guidance

  3. Each Asset Contains
    - Title and reading level (grade level 6-8 for accessibility)
    - Topic tags for filtering
    - Markdown content with clear explanations
    - Contraindication banners where appropriate
*/

DELETE FROM patient_education_assets WHERE title IN (
  'Understanding Low Back Pain',
  'The Power of Movement: Why Exercise Helps Pain',
  'Understanding Your Neck Pain',
  'What Is Centralization and Why Does It Matter?',
  'Managing Chronic Pain: Understanding Your Journey',
  'Ergonomics: Setting Up Your Workspace',
  'Sleep and Pain: Breaking the Cycle',
  'Returning to Work After an Injury',
  'Understanding Imaging: X-rays, MRIs, and What They Show',
  'Stress and Pain: The Mind-Body Connection'
);

INSERT INTO patient_education_assets (title, reading_level, topic_tags, content_md, contraindications_banner, is_active)
VALUES
(
  'Understanding Low Back Pain',
  6,
  ARRAY['lumbar', 'back_pain', 'self_management'],
  E'Low back pain is one of the most common reasons people see a doctor. The good news is that most back pain gets better on its own with proper care.\n\n**What causes low back pain?**\nYour back is made up of bones (vertebrae), muscles, and ligaments that work together. Pain can come from any of these parts. Common causes include:\n- Muscle strain from lifting or sudden movements\n- Poor posture over time\n- Normal wear and tear as we age\n- Stress and tension\n\n**What can you do?**\nStay active! While rest may feel good at first, too much rest can actually make things worse. Gentle movement helps your back heal.\n\nTry these helpful tips:\n- Take short walks several times a day\n- Avoid sitting for more than 30 minutes at a time\n- Use ice for the first 48 hours, then switch to heat\n- Sleep on your side with a pillow between your knees\n\n**When to call your doctor:**\nContact us if you have numbness in your legs, difficulty with bladder control, or if pain is severe and not improving after a few days.',
  'If you experience sudden weakness in your legs, loss of bladder or bowel control, or severe pain that wakes you from sleep, seek immediate medical attention.',
  true
),
(
  'The Power of Movement: Why Exercise Helps Pain',
  6,
  ARRAY['exercise', 'self_management', 'chronic_pain'],
  E'It might seem strange, but one of the best things you can do for pain is to keep moving. Here is why exercise actually helps.\n\n**How does exercise reduce pain?**\nWhen you move your body, amazing things happen:\n- Your brain releases natural pain relievers called endorphins\n- Blood flow increases, bringing healing nutrients to injured areas\n- Muscles get stronger and better able to support your joints\n- Your mood improves, which affects how you feel pain\n\n**Start small and be patient**\nYou do not need to run a marathon. Even 10 minutes of gentle walking counts. The key is to start where you are and gradually do more.\n\n**Good exercises to try:**\n- Walking at a comfortable pace\n- Swimming or water aerobics\n- Gentle stretching\n- Stationary biking\n- Yoga or tai chi\n\n**Tips for success:**\n- Pick activities you enjoy\n- Exercise at the same time each day to build a habit\n- Listen to your body but do not let fear stop you\n- Some discomfort is normal when starting. Sharp pain means stop.\n\nRemember: Motion is lotion for your joints!',
  NULL,
  true
),
(
  'Understanding Your Neck Pain',
  6,
  ARRAY['cervical', 'neck_pain', 'self_management'],
  E'Neck pain is very common and usually improves with the right care. Your neck is strong but also flexible, which can make it vulnerable to strain.\n\n**Common causes of neck pain:**\n- Muscle tension from stress or poor posture\n- Looking down at phones or computers too long (tech neck)\n- Sleeping in an awkward position\n- Normal changes that happen as we age\n\n**Helpful tips for neck pain:**\n\n**Posture matters:**\n- Keep your screen at eye level\n- Hold your phone up instead of looking down\n- Take breaks every 30 minutes to move your neck gently\n\n**Heat and ice:**\n- Use ice wrapped in a towel for 15-20 minutes if pain is new\n- Try heat for muscle tension and stiffness\n\n**Gentle movements:**\n- Slowly turn your head side to side\n- Gently tilt your ear toward your shoulder\n- Roll your shoulders backward\n\n**Sleep position:**\n- Use a pillow that keeps your neck in line with your spine\n- Avoid sleeping on your stomach\n\nMost neck pain improves within a few weeks with proper care.',
  'Seek immediate medical attention if you have neck pain with numbness or tingling down your arms, difficulty walking, or pain after an injury or fall.',
  true
),
(
  'What Is Centralization and Why Does It Matter?',
  7,
  ARRAY['centralization', 'lumbar', 'mdt'],
  E'If your physical therapist has talked to you about centralization, here is what they mean and why it is good news for your recovery.\n\n**What is centralization?**\nWhen you have back or neck pain, you might also feel pain, numbness, or tingling traveling down your arm or leg. Centralization means that with certain movements or positions, this spreading pain starts to move back toward your spine.\n\nFor example: If you have pain going down to your knee, and after doing specific exercises, the pain moves up to your hip or lower back, that is centralization.\n\n**Why is this good?**\nCentralization is one of the best signs that your pain will improve! Research shows that people whose symptoms centralize tend to have much better outcomes.\n\n**Your job:**\n- Do the exercises your therapist prescribes\n- Pay attention to where you feel the symptoms\n- Report any changes to your therapist\n- Even if back pain temporarily increases while leg pain decreases, that is usually a positive sign\n\n**Remember:**\n- Centralization may not happen right away\n- Stay consistent with your exercises\n- Your therapist will adjust your program based on your response\n\nThis approach is called the McKenzie Method or MDT, and it is backed by decades of research.',
  NULL,
  true
),
(
  'Managing Chronic Pain: Understanding Your Journey',
  7,
  ARRAY['chronic_pain', 'self_management', 'mental_health'],
  E'Living with pain that lasts more than three months can be challenging. Understanding how chronic pain works can help you take control of your recovery.\n\n**Chronic pain is different:**\nWhen pain lasts a long time, changes happen in your nervous system. Your nerves become more sensitive and can send pain signals even when there is no new injury. This is real pain, not imagined!\n\n**The pain cycle:**\nPain leads to less activity, which leads to weaker muscles, which leads to more pain. Breaking this cycle is key.\n\n**What helps chronic pain:**\n\n**Stay active:**\nRegular gentle movement is one of the most effective treatments. Start slow and gradually increase.\n\n**Manage stress:**\nStress makes pain worse. Try deep breathing exercises, meditation or mindfulness, and activities you enjoy.\n\n**Sleep well:**\nPoor sleep increases pain sensitivity. Create a regular sleep schedule and wind down before bed.\n\n**Pace yourself:**\nDo not overdo it on good days. Keep activity levels steady.\n\n**Build your team:**\nChronic pain often needs multiple approaches. Work with your healthcare providers to find what helps you.\n\n**Remember:** Recovery is possible. Many people learn to manage chronic pain and live full, active lives.',
  NULL,
  true
),
(
  'Ergonomics: Setting Up Your Workspace',
  6,
  ARRAY['ergonomics', 'posture', 'self_management', 'neck_pain', 'back_pain'],
  E'Spending hours at a desk can lead to pain if your workspace is not set up correctly. Here is how to create a comfortable setup.\n\n**Your chair:**\n- Feet should be flat on the floor or on a footrest\n- Knees should be at about 90 degrees\n- Use lumbar support for your lower back\n- Armrests should let your shoulders relax\n\n**Your screen:**\n- Top of the monitor at or slightly below eye level\n- Screen about an arm length away\n- Reduce glare with proper lighting\n\n**Your keyboard and mouse:**\n- Elbows at about 90 degrees\n- Wrists in a neutral position, not bent up or down\n- Keep mouse close to keyboard\n\n**Take breaks:**\n- Stand up every 30 minutes\n- Look away from screen every 20 minutes\n- Do gentle stretches throughout the day\n\n**If you use a laptop:**\n- Use an external keyboard and raise the screen, OR\n- Use a separate monitor when possible\n\nSmall changes to your workspace can make a big difference in how you feel at the end of the day.',
  NULL,
  true
),
(
  'Sleep and Pain: Breaking the Cycle',
  6,
  ARRAY['sleep', 'self_management', 'chronic_pain'],
  E'Pain and sleep have a two-way relationship. Poor sleep makes pain worse, and pain makes it harder to sleep. Here is how to improve both.\n\n**Why sleep matters for pain:**\nDuring deep sleep, your body repairs tissues and processes pain differently. Without good sleep, you are more sensitive to pain the next day.\n\n**Tips for better sleep:**\n\n**Create a sleep routine:**\n- Go to bed and wake up at the same time daily\n- Start winding down 30-60 minutes before bed\n- Keep your bedroom cool, dark, and quiet\n\n**Prepare your body:**\n- Avoid caffeine after noon\n- Limit alcohol (it disrupts sleep quality)\n- Exercise regularly, but not close to bedtime\n- Avoid large meals before bed\n\n**Manage pain at night:**\n- Find comfortable sleeping positions\n- Use pillows for support\n- Try gentle stretches before bed\n- Consider heat or ice before sleep\n\n**Calm your mind:**\n- Write worries in a journal before bed\n- Try deep breathing or meditation\n- Avoid screens for an hour before bed\n- Read something relaxing\n\n**If you cannot sleep:**\n- Do not watch the clock\n- Get up after 20 minutes and do something calm\n- Return to bed when sleepy\n\nBe patient. It can take weeks to see improvements in sleep patterns.',
  'If you have sleep apnea or other sleep disorders, talk to your doctor about specific recommendations for your condition.',
  true
),
(
  'Returning to Work After an Injury',
  7,
  ARRAY['rtw', 'work', 'self_management'],
  E'Getting back to work after an injury is an important milestone. Here is what to expect and how to prepare for success.\n\n**Gradual return is often best:**\nMany people return to work in stages. This might mean:\n- Starting with fewer hours\n- Beginning with lighter duties\n- Taking more frequent breaks\n\n**Talk to your employer:**\nDiscuss any temporary modifications you might need:\n- Ergonomic equipment\n- Schedule adjustments\n- Task modifications\n- Access to breaks for exercises or stretches\n\n**Prepare yourself:**\n- Practice your work activities at home if possible\n- Build up your stamina gradually\n- Follow your exercise program consistently\n- Communicate with your treatment team\n\n**What to expect:**\n- Some increase in symptoms is normal at first\n- Fatigue may be higher than usual\n- Progress is rarely a straight line\n\n**Warning signs to watch for:**\n- Symptoms significantly worse than before return\n- New symptoms appearing\n- Unable to complete essential job tasks\n\n**Remember:**\n- Returning to work is good for recovery\n- Stay in communication with your healthcare team\n- Pace yourself and avoid overdoing it\n- Celebrate your progress\n\nWork with your therapist to create a plan that fits your specific job requirements.',
  NULL,
  true
),
(
  'Understanding Imaging: X-rays, MRIs, and What They Show',
  7,
  ARRAY['imaging', 'education', 'chronic_pain'],
  E'If you have had an X-ray or MRI, you might have questions about what the results mean. Here is what you should know.\n\n**The surprising truth about imaging:**\nMany findings on imaging are normal parts of aging and do not cause pain. Studies show:\n- 50 percent of people over 40 have disc bulges with NO pain\n- Arthritis shows up on X-rays of many pain-free people\n- Degenerative changes are often just normal aging\n\n**What this means for you:**\nAn abnormal scan does not always explain your pain. And it does not mean you cannot get better!\n\n**When is imaging helpful?**\nYour doctor may recommend imaging if:\n- Your symptoms are not improving as expected\n- There are warning signs of something serious\n- Surgery is being considered\n- There was significant trauma\n\n**When is imaging less helpful?**\n- For routine low back or neck pain\n- When symptoms are already improving\n- As a starting point for treatment\n\n**The bottom line:**\n- Focus on how you feel and function, not just the images\n- Many abnormalities on scans are not causing your pain\n- You can improve even with findings on imaging\n- Treatment is based on your symptoms, not just pictures\n\nTalk to your healthcare provider if you have questions about your imaging results.',
  NULL,
  true
),
(
  'Stress and Pain: The Mind-Body Connection',
  6,
  ARRAY['stress', 'mental_health', 'chronic_pain', 'self_management'],
  E'Stress and pain are closely connected. When you understand this connection, you can use it to feel better.\n\n**How stress affects pain:**\nWhen you are stressed, your body:\n- Tenses muscles (which can cause pain)\n- Becomes more sensitive to pain signals\n- Has higher levels of stress hormones\n- Has a harder time healing\n\n**Signs stress may be affecting your pain:**\n- Pain gets worse during stressful times\n- Muscle tension in neck, shoulders, or jaw\n- Headaches with stress\n- Sleep problems\n- Irritability or mood changes\n\n**Ways to reduce stress:**\n\n**Breathing exercises:**\nTry the 4-7-8 technique:\n- Breathe in for 4 counts\n- Hold for 7 counts\n- Breathe out for 8 counts\n- Repeat 3-4 times\n\n**Movement:**\n- Walking in nature\n- Gentle yoga or stretching\n- Dancing to favorite music\n\n**Relaxation:**\n- Progressive muscle relaxation\n- Meditation or mindfulness apps\n- Warm baths\n\n**Social connection:**\n- Talk to supportive friends or family\n- Join a support group\n- Consider counseling if needed\n\n**Remember:** Managing stress is not about eliminating all stress. It is about building tools to handle it better.',
  NULL,
  true
);
