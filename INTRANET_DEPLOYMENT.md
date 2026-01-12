# AIM OS - Complete Intranet System Deployment Guide

## 🎉 System Overview

**AIM OS** is a complete, production-ready internal operating system for Alberta Injury Management Inc., featuring:

- **Full Intranet Platform** with role-based access control
- **Autonomous AI Talent Acquisition Engine** (7 specialized agents)
- **6 Clinic Locations** with real-time metrics
- **Complete Staff Directory** with advanced search
- **Learning Management System** (Academy)
- **Compliance & Safety Management**
- **Internal Communications** (Announcements)

---

## 📊 System Statistics

### Database
- **54 Total Tables** (36 Intranet + 18 Talent Acquisition)
- **Comprehensive RLS Policies** on all tables
- **6 Active Clinics** with metrics
- **Demo Content** ready for immediate use

### Frontend
- **Production Build**: 446.78 KB (120.08 KB gzipped)
- **11 Major Views** + subviews
- **Role-Based Navigation** (Executive, Manager, Clinician, Admin)
- **Mobile Responsive** design

### Features
- ✅ Supabase Authentication with role management
- ✅ Clinic management & real-time metrics
- ✅ Staff directory with profiles & certifications
- ✅ Learning content library with progress tracking
- ✅ Policy management with acknowledgment tracking
- ✅ Incident reporting system
- ✅ Company-wide announcements
- ✅ Onboarding task management
- ✅ Autonomous AI hiring system (7 agents)
- ✅ Job posting & candidate pipeline
- ✅ Interview scheduling & analytics

---

## 🚀 Quick Start

### 1. Prerequisites Check

Your system already has:
- ✅ Supabase project configured
- ✅ Database schema deployed (54 tables)
- ✅ Demo data seeded
- ✅ Environment variables set

### 2. Create Demo Users

**IMPORTANT**: Create test users in Supabase Dashboard before first login.

Navigate to: **Supabase Dashboard → Authentication → Users → Add User**

#### Executive User
```
Email: executive@aimrehab.ca
Password: [set secure password]
```

After creating, add to `user_profiles`:
```sql
INSERT INTO user_profiles (id, email, first_name, last_name, role, is_active)
VALUES
  ('[user-id-from-auth]', 'executive@aimrehab.ca', 'John', 'Smith', 'executive', true);
```

#### Clinic Manager
```
Email: manager@aimrehab.ca
Password: [set secure password]
```

```sql
-- Get Calgary Downtown clinic ID first
SELECT id FROM clinics WHERE code = 'YYC-DT';

INSERT INTO user_profiles (id, email, first_name, last_name, role, primary_clinic_id, is_active)
VALUES
  ('[user-id-from-auth]', 'manager@aimrehab.ca', 'Sarah', 'Johnson', 'clinic_manager', '[clinic-id]', true);
```

#### Clinician
```
Email: clinician@aimrehab.ca
Password: [set secure password]
```

```sql
INSERT INTO user_profiles (id, email, first_name, last_name, role, primary_clinic_id, is_active)
VALUES
  ('[user-id-from-auth]', 'clinician@aimrehab.ca', 'Michael', 'Chen', 'clinician', '[clinic-id]', true);
```

### 3. Start Development Server

```bash
npm run dev
```

Navigate to `http://localhost:5173` and log in with any demo user.

### 4. Deploy to Production

```bash
# Build for production
npm run build

# Deploy to Vercel
vercel --prod

# Or deploy to Netlify
netlify deploy --prod --dir=dist
```

**Set Environment Variables in hosting platform:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## 🎯 User Roles & Permissions

### Executive
- Full system access
- View all clinics and metrics
- Access Talent Acquisition module
- View all staff and data

### Clinic Manager
- Manage assigned clinic(s)
- View clinic metrics and staff
- Access compliance and incidents for their clinic
- Limited talent acquisition visibility

### Clinician
- Personal dashboard
- Access learning materials
- Submit incident reports
- View own clinic information
- Complete onboarding tasks

### Admin
- System administration
- User management
- Access Talent Acquisition module
- Company-wide data access

### Contractor
- Limited access to assigned resources
- Academy content
- Basic clinic information

---

## 📁 System Architecture

### Frontend Structure
```
src/
├── components/
│   ├── LoginPage.tsx                  # Authentication
│   ├── Dashboard.tsx                  # TA Dashboard
│   ├── JobsView.tsx                   # TA Jobs
│   ├── CandidatePipeline.tsx          # TA Pipeline
│   ├── AgentsView.tsx                 # TA AI Agents
│   ├── AnalyticsView.tsx              # TA Analytics
│   └── intranet/
│       ├── IntranetDashboard.tsx      # Main dashboard
│       ├── ClinicsView.tsx            # Clinics module
│       ├── PeopleView.tsx             # Staff directory
│       ├── AcademyView.tsx            # Learning system
│       ├── ComplianceView.tsx         # Policies & incidents
│       └── AnnouncementsView.tsx      # Communications
├── contexts/
│   └── AuthContext.tsx                # Auth state management
├── services/
│   ├── intranetService.ts             # Intranet data layer
│   ├── agentService.ts                # TA agent services
│   ├── jobService.ts                  # TA job services
│   ├── candidateService.ts            # TA candidate services
│   ├── applicationService.ts          # TA application services
│   ├── analyticsService.ts            # TA analytics services
│   └── workflowService.ts             # TA workflow services
├── types/
│   ├── intranet.ts                    # Intranet types
│   └── index.ts                       # TA types
└── lib/
    └── supabase.ts                    # Supabase client
```

### Database Tables

#### Intranet Core (36 tables)
- **User Management**: `user_profiles`, `clinic_access`
- **Clinics**: `clinics`, `clinic_metrics`
- **Staff**: `staff_profiles`, `staff_certifications`, `staff_availability`
- **Academy**: `academy_categories`, `academy_content`, `learning_progress`
- **Compliance**: `policies`, `policy_acknowledgments`, `incident_reports`, `audit_logs`
- **Communication**: `announcements`, `announcement_reads`
- **Onboarding**: `onboarding_templates`, `onboarding_tasks`, `onboarding_progress`

#### Talent Acquisition (18 tables)
- **Jobs**: `jobs`
- **Candidates**: `candidates`, `applications`, `interviews`, `reference_checks`, `offers`
- **Agents**: `agents`, `agent_events`, `agent_memory`, `agent_executions`
- **Workflows**: `workflows`, `workflow_executions`, `tasks`
- **Analytics**: `kpis`, `sourcing_channels`, `forecasts`
- **Communication**: `messages`, `notifications`

---

## 🔐 Security Features

### Row Level Security (RLS)
- ✅ Enabled on all 54 tables
- ✅ Clinic-based data isolation
- ✅ Role-based access control
- ✅ Executive bypass for company-wide view

### Authentication
- ✅ Supabase Auth with email/password
- ✅ Secure session management
- ✅ Auto sign-out on token expiry
- ✅ Protected routes based on role

### Data Privacy
- ✅ Users only see their clinic data (unless executive)
- ✅ Policies enforce least-privilege access
- ✅ Audit logging for sensitive actions
- ✅ PIPEDA compliance ready

---

## 🎨 User Interface

### Navigation Structure

**Main Intranet** (All Users):
- Dashboard (role-specific view)
- Clinics (location details & metrics)
- People (staff directory)
- Academy (learning materials)
- Compliance (policies & incidents)
- Announcements (company news)

**Talent Acquisition** (Executives & Admins only):
- Overview (hiring metrics)
- Jobs (open positions)
- Pipeline (candidates)
- AI Agents (7 autonomous agents)
- Analytics (performance data)

### Design Features
- Clean, medical-grade aesthetic
- Consistent color scheme (blues, greens, purples)
- Responsive grid layouts
- Card-based information display
- Smooth transitions and hover states
- Loading states for async operations

---

## 📈 Key Features by Module

### 1. Dashboard
- **Executive**: Company-wide KPIs, revenue, utilization, clinics
- **Manager**: Clinic performance, team metrics, tasks
- **Clinician**: Personal tasks, schedule, learning progress

### 2. Clinics
- View all 6 locations
- Real-time metrics (visits, revenue, utilization)
- Contact information
- Services offered
- Treatment room capacity

### 3. People
- Searchable staff directory
- Contact information (email, phone)
- Job titles and specializations
- Clinic assignments
- Skills and certifications
- Employment type

### 4. Academy
- Categorized learning content
- Documents, videos, courses
- Progress tracking
- Required vs optional content
- Duration estimates
- Mark as complete functionality

### 5. Compliance
- **Policies**: View, read, acknowledge company policies
- **Incidents**: Report and track safety incidents
- Severity levels and status tracking
- Root cause analysis
- Corrective actions

### 6. Announcements
- Company-wide and clinic-specific
- Priority levels (urgent, high, normal, low)
- Pinned announcements
- Read tracking
- Author attribution

### 7. Talent Acquisition (Executive/Admin)
- **Jobs**: 4 active positions with AI priority scoring
- **Pipeline**: 7 candidates across pipeline stages
- **AI Agents**: 7 autonomous agents (Strategy, Sourcing, Screening, Interview Coordinator, Offer & Onboarding, Compliance, Analytics)
- **Analytics**: Channel performance, agent metrics, KPIs

---

## 🔧 Configuration

### Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Supabase Project
- **Region**: Closest to Alberta (US West recommended)
- **Plan**: Pro (for production) or Free (for demo)
- **Extensions**: uuid-ossp (enabled automatically)

---

## 📊 Demo Data Included

### Clinics (6)
- Calgary Downtown (8 treatment rooms)
- Calgary South (6 treatment rooms)
- Edmonton West (10 treatment rooms)
- Edmonton North (5 treatment rooms)
- Red Deer (4 treatment rooms)
- Lethbridge (3 treatment rooms)

### Academy Content (6+ items)
- Assessment Best Practices (required for clinicians)
- Documentation Standards (required for clinicians)
- Infection Control (required for all)
- Emergency Procedures (required for managers)
- AIM OS User Guide (optional)
- AIM Values and Mission (required for all)

### Policies (4)
- Code of Conduct (requires acknowledgment)
- Privacy and Confidentiality (requires acknowledgment)
- Workplace Safety (requires acknowledgment)
- Professional Licensure (clinicians only)

### Announcements (3)
- Welcome to AIM OS (pinned)
- Upcoming Policy Review
- New Calgary South Clinic Opening

### Talent Acquisition Demo Data
- 4 Active Jobs (Physiotherapist, Kinesiologist, Massage Therapist, Athletic Therapist)
- 7 Candidates at various pipeline stages
- 6 Applications (Applied → Offered)
- 7 Autonomous AI Agents (all active)
- 8 Workflow definitions
- Historical KPIs and metrics

---

## 🧪 Testing the System

### 1. Login Flow
- Navigate to login page
- Enter demo credentials
- Verify redirect to appropriate dashboard

### 2. Role-Based Access
- **Executive**: Verify access to all modules including Talent
- **Manager**: Confirm clinic-specific data visibility
- **Clinician**: Check limited access to own data

### 3. Navigation
- Test all navigation items
- Verify smooth transitions
- Check sidebar collapse/expand

### 4. Data Operations
- View clinics and metrics
- Search staff directory
- Browse academy content
- View policies and announcements
- (Executive) Access talent acquisition data

### 5. Responsive Design
- Test on desktop (1920x1080)
- Test on tablet (768x1024)
- Test on mobile (375x667)

---

## 🐛 Troubleshooting

### "No user profile found"
- Ensure user exists in `user_profiles` table
- Check that `id` matches auth.users.id
- Verify `is_active = true`

### "Cannot view clinic data"
- Check `primary_clinic_id` is set
- For executives, verify `role = 'executive'`
- Confirm RLS policies are enabled

### "Talent Acquisition not visible"
- Verify user role is `executive` or `admin`
- Check navigation code restricts by role

### Build errors
- Run `npm install` to ensure dependencies
- Check Node.js version (18+ required)
- Clear node_modules and reinstall if needed

---

## 📚 Additional Documentation

- **ARCHITECTURE.md**: Complete system architecture for TA engine
- **DEPLOYMENT.md**: TA engine deployment guide
- **AI_IMPLEMENTATION_GUIDE.md**: LLM integration examples
- **README.md**: Project overview and quick start

---

## 🎓 Training Users

### For All Staff
1. Log in with credentials
2. Complete profile information
3. Acknowledge required policies (Compliance tab)
4. Review "AIM OS User Guide" in Academy
5. Complete required training courses

### For Clinic Managers
1. Review clinic metrics dashboard
2. Familiarize with staff directory
3. Learn incident reporting process
4. Set up onboarding tasks for new hires

### For Executives
1. Explore company-wide KPIs
2. Review all clinic performance
3. Access Talent Acquisition module
4. Monitor AI agent activity
5. Review hiring pipeline and analytics

---

## 🚀 Next Steps

### Phase 1: User Onboarding
1. Create accounts for all staff
2. Assign roles and clinic access
3. Populate staff profiles with details
4. Upload additional academy content
5. Configure clinic-specific announcements

### Phase 2: Content Population
1. Add all company policies
2. Upload training videos
3. Create onboarding checklists
4. Set up incident categories
5. Define audit procedures

### Phase 3: Integration
1. Connect EMR system (if applicable)
2. Set up SSO (optional)
3. Integrate payroll data
4. Connect scheduling system
5. Deploy AI agent orchestrator for autonomous TA

### Phase 4: Optimization
1. Gather user feedback
2. Customize dashboards per role
3. Add custom reports
4. Fine-tune RLS policies
5. Optimize database queries

---

## 💡 Pro Tips

1. **Search is Fast**: Use the People search to quickly find staff
2. **Mobile Friendly**: Access from anywhere on any device
3. **Sidebar Collapse**: Click menu icon to maximize screen space
4. **Executive View**: Executives see ALL data across all clinics
5. **TA Module**: Only visible to executives and admins
6. **Real-time**: Data updates automatically, no refresh needed
7. **Secure**: RLS ensures users only see authorized data

---

## 📞 Support

For technical support:
- **Email**: it@aimrehab.ca
- **System Issues**: Check Supabase dashboard logs
- **Feature Requests**: Document and prioritize

---

## ✅ Production Checklist

Before going live:
- [ ] All staff accounts created in Supabase Auth
- [ ] User profiles populated in `user_profiles` table
- [ ] Clinic access granted via `clinic_access` table
- [ ] Staff profiles completed with certifications
- [ ] All policies uploaded and marked as requiring acknowledgment
- [ ] Academy content organized and published
- [ ] Onboarding templates configured for each role
- [ ] Demo data removed (if not needed)
- [ ] Environment variables set in production hosting
- [ ] SSL certificate configured (automatic on Vercel/Netlify)
- [ ] Custom domain pointed (optional)
- [ ] User training materials prepared
- [ ] Backup procedures documented
- [ ] Incident reporting process communicated

---

**Your complete AIM OS intranet system is ready for deployment!**

Built with: React 19, TypeScript, Vite, Tailwind CSS, Supabase, and Lucide Icons.
