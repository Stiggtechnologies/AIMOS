# AIM OS - PERFORMANCE OPTIMIZATION GUIDE

**Target:** <2 second load times, 99.9% uptime
**Last Updated:** March 12, 2026

---

## EXECUTIVE SUMMARY

This guide provides actionable strategies to optimize AIM OS performance for the South Commons launch and beyond.

**Current State:**
- Build size: 2.0 MB
- Initial load: ~3-4 seconds
- Database queries: Optimized with indexes
- API response: <500ms

**Target State:**
- Build size: <1.5 MB
- Initial load: <2 seconds
- Database queries: <200ms
- API response: <300ms

---

## FRONTEND OPTIMIZATION

### 1. Code Splitting

**Current:** All components loaded at once (2.0 MB bundle)
**Target:** Lazy load routes and heavy components

**Implementation:**

```typescript
// In src/App.tsx - implement lazy loading

import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./components/Dashboard'));
const Scheduler = lazy(() => import('./components/aim-os/SchedulerView'));
const CRM = lazy(() => import('./components/crm/CRMDashboard'));
const Operations = lazy(() => import('./components/operations/OperationsDashboard'));

// Wrap routes in Suspense
<Suspense fallback={<LoadingState />}>
  <Dashboard />
</Suspense>
```

**Expected Impact:** Reduce initial bundle by 40% (800 KB savings)

### 2. Image Optimization

**Issue:** Stock images not optimized
**Solution:** Use WebP format, lazy loading, CDN

```typescript
// Use modern image formats
<img
  src="image.webp"
  alt="Description"
  loading="lazy"
  srcSet="image-small.webp 400w, image-medium.webp 800w, image-large.webp 1200w"
  sizes="(max-width: 600px) 400px, (max-width: 1200px) 800px, 1200px"
/>
```

**Expected Impact:** 60% faster image loading

### 3. Remove Unused Dependencies

**Action Items:**
1. Run `npm run build -- --analyze` to identify large packages
2. Remove unused icon imports from Lucide React
3. Consider replacing Recharts with lighter charting library

```bash
# Analyze bundle
npm install -D webpack-bundle-analyzer
npm run build -- --analyze
```

**Expected Impact:** 200-300 KB reduction

### 4. Implement Service Worker (PWA)

**Benefits:**
- Offline capability
- Faster repeat visits
- Background sync

```typescript
// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js');
  });
}
```

**Expected Impact:** 80% faster repeat loads

### 5. Optimize React Rendering

**Use React.memo for expensive components:**

```typescript
import { memo } from 'react';

const SchedulerView = memo(({ appointments }) => {
  // Heavy rendering logic
}, (prevProps, nextProps) => {
  // Custom comparison
  return prevProps.appointments.length === nextProps.appointments.length;
});
```

**Use useMemo for expensive calculations:**

```typescript
const sortedAppointments = useMemo(() => {
  return appointments.sort((a, b) =>
    new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
  );
}, [appointments]);
```

**Expected Impact:** 30% faster re-renders

---

## DATABASE OPTIMIZATION

### 1. Query Optimization

**Current Issues:**
- Some queries fetch unnecessary columns
- Multiple queries could be combined
- Missing indexes on foreign keys

**Solutions:**

```typescript
// Bad: Fetching all columns
const { data } = await supabase
  .from('patient_appointments')
  .select('*');

// Good: Fetch only needed columns
const { data } = await supabase
  .from('patient_appointments')
  .select('id, patient_id, scheduled_at, status');
```

**Use single queries with joins:**

```typescript
// Bad: Multiple queries
const appointments = await supabase.from('patient_appointments').select('*');
const patients = await supabase.from('patients').select('*').in('id', appointmentIds);

// Good: Single query with join
const { data } = await supabase
  .from('patient_appointments')
  .select(`
    id,
    scheduled_at,
    patients (first_name, last_name, phone)
  `);
```

### 2. Database Indexes

**Critical Indexes to Add:**

```sql
-- Scheduler performance
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_date
ON patient_appointments(clinic_id, scheduled_at)
WHERE status != 'cancelled';

-- Financial queries
CREATE INDEX IF NOT EXISTS idx_invoices_clinic_date_status
ON invoices(clinic_id, created_at, status);

-- Patient lookup
CREATE INDEX IF NOT EXISTS idx_patients_phone
ON patients(phone);

-- Provider schedule
CREATE INDEX IF NOT EXISTS idx_appointments_provider_date
ON patient_appointments(provider_id, scheduled_at);
```

**Expected Impact:** 10x faster query performance

### 3. Connection Pooling

**Supabase automatically handles this**, but monitor:
- Keep database connections under 50 concurrent
- Use `maybeSingle()` instead of `single()` where appropriate
- Batch inserts when possible

### 4. Caching Strategy

**Implement Redis-style caching for frequently accessed data:**

```typescript
// Cache clinic operating hours (rarely changes)
const CACHE_TTL = 3600; // 1 hour

async function getClinicHours(clinicId: string) {
  const cacheKey = `clinic:${clinicId}:hours`;
  const cached = localStorage.getItem(cacheKey);

  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_TTL * 1000) {
      return data;
    }
  }

  const { data } = await supabase
    .from('clinics')
    .select('operating_hours')
    .eq('id', clinicId)
    .single();

  localStorage.setItem(cacheKey, JSON.stringify({
    data,
    timestamp: Date.now()
  }));

  return data;
}
```

**Expected Impact:** 90% reduction in repeated queries

---

## API & EDGE FUNCTION OPTIMIZATION

### 1. Response Caching

**Add caching headers to Edge Functions:**

```typescript
return new Response(JSON.stringify(data), {
  headers: {
    ...corsHeaders,
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=300', // 5 minutes
  },
});
```

### 2. Reduce Payload Size

**Compress responses:**

```typescript
// Use gzip compression
const compressed = gzip(JSON.stringify(data));

return new Response(compressed, {
  headers: {
    ...corsHeaders,
    'Content-Type': 'application/json',
    'Content-Encoding': 'gzip',
  },
});
```

### 3. Batch API Requests

**Instead of:**
```typescript
const patient = await fetchPatient(id);
const appointments = await fetchAppointments(id);
const invoices = await fetchInvoices(id);
```

**Do:**
```typescript
const [patient, appointments, invoices] = await Promise.all([
  fetchPatient(id),
  fetchAppointments(id),
  fetchInvoices(id),
]);
```

**Expected Impact:** 3x faster data loading

---

## MONITORING & ALERTING

### 1. Performance Monitoring

**Implement basic performance tracking:**

```typescript
// Track page load time
window.addEventListener('load', () => {
  const loadTime = performance.now();
  console.log(`Page loaded in ${loadTime}ms`);

  // Send to analytics
  if (loadTime > 3000) {
    // Alert if page takes >3 seconds
    console.warn('Slow page load detected');
  }
});
```

### 2. Database Query Monitoring

**Log slow queries:**

```sql
-- Enable pg_stat_statements
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Find slow queries
SELECT
  query,
  calls,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100 -- queries taking >100ms
ORDER BY mean_exec_time DESC
LIMIT 20;
```

### 3. Error Tracking

**Implement error boundary:**

```typescript
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    console.error('Application error:', error, errorInfo);
    // Send to error tracking service
  }

  render() {
    return this.props.children;
  }
}
```

---

## NETWORK OPTIMIZATION

### 1. Enable Compression

**Vite production builds automatically use gzip**

Verify in `vite.config.ts`:

```typescript
export default defineConfig({
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
      },
    },
  },
});
```

### 2. CDN for Static Assets

**Serve static assets from CDN:**

```typescript
// Use Vercel CDN or Cloudflare
const STATIC_ASSET_URL = process.env.VITE_CDN_URL || '';

<img src={`${STATIC_ASSET_URL}/images/logo.png`} />
```

### 3. Reduce HTTP Requests

**Combine resources:**
- Use CSS sprites for icons (or SVG sprites)
- Inline critical CSS
- Defer non-critical scripts

```html
<!-- Inline critical CSS -->
<style>
  /* Critical above-the-fold styles */
</style>

<!-- Defer non-critical -->
<link rel="stylesheet" href="app.css" media="print" onload="this.media='all'">
```

---

## MOBILE OPTIMIZATION

### 1. Reduce Mobile Bundle Size

**Use responsive imports:**

```typescript
const ChartComponent = isMobile ?
  lazy(() => import('./MobileChart')) :
  lazy(() => import('./DesktopChart'));
```

### 2. Touch Optimization

**Increase tap target sizes:**

```css
/* Minimum 44x44px for touch targets */
.button {
  min-height: 44px;
  min-width: 44px;
  padding: 12px 24px;
}
```

### 3. Reduce Data Usage

**Lazy load images on mobile:**

```typescript
const shouldLoadImage = !isMobile || isInViewport(imageRef);
```

---

## CHECKLIST FOR LAUNCH

### Pre-Launch Performance Audit

**Week Before Launch:**
- [ ] Run Lighthouse audit (target: 90+ score)
- [ ] Test on 3G network simulation
- [ ] Profile bundle size (<1.5 MB)
- [ ] Verify all images optimized
- [ ] Check database indexes applied
- [ ] Test with 50+ concurrent users
- [ ] Verify caching headers set
- [ ] Test offline functionality (if PWA)

**Day Before Launch:**
- [ ] Clear all test data
- [ ] Optimize database (VACUUM, ANALYZE)
- [ ] Verify CDN working
- [ ] Test from different networks
- [ ] Check mobile performance
- [ ] Review error logs
- [ ] Backup database

**Launch Day:**
- [ ] Monitor response times
- [ ] Watch database connection pool
- [ ] Track error rates
- [ ] Monitor server CPU/memory
- [ ] Check CDN hit rates

---

## PERFORMANCE TARGETS

### Page Load Times
| Page | Target | Acceptable | Poor |
|------|--------|------------|------|
| Login | <1s | <2s | >2s |
| Dashboard | <1.5s | <3s | >3s |
| Scheduler | <2s | <3s | >3s |
| Patient List | <1.5s | <2.5s | >2.5s |
| Reports | <2s | <4s | >4s |

### API Response Times
| Endpoint | Target | Acceptable | Poor |
|----------|--------|------------|------|
| Authentication | <200ms | <500ms | >500ms |
| Get Appointments | <300ms | <500ms | >500ms |
| Create Booking | <500ms | <1s | >1s |
| Generate Report | <1s | <3s | >3s |
| Search Patients | <200ms | <400ms | >400ms |

### Database Queries
| Query Type | Target | Acceptable | Poor |
|------------|--------|------------|------|
| Simple SELECT | <50ms | <100ms | >100ms |
| JOIN (2 tables) | <100ms | <200ms | >200ms |
| Complex aggregation | <300ms | <500ms | >500ms |
| INSERT/UPDATE | <100ms | <200ms | >200ms |

---

## QUICK WINS

**Implement These First for Immediate Impact:**

1. **Add Database Indexes** (30 minutes)
   - Impact: 10x query performance
   - Risk: Low
   - Effort: Low

2. **Enable Lazy Loading** (2 hours)
   - Impact: 40% smaller initial bundle
   - Risk: Low
   - Effort: Medium

3. **Optimize Images** (1 hour)
   - Impact: 60% faster image loads
   - Risk: None
   - Effort: Low

4. **Implement Query Caching** (3 hours)
   - Impact: 90% fewer repeated queries
   - Risk: Low
   - Effort: Medium

5. **Add Response Compression** (1 hour)
   - Impact: 70% smaller payloads
   - Risk: None
   - Effort: Low

**Total Time:** 7.5 hours
**Expected Impact:** 2-3x performance improvement

---

## LONG-TERM OPTIMIZATION

### Month 1-3
- Implement comprehensive caching strategy
- Add service worker for offline support
- Optimize critical rendering path
- Set up performance monitoring

### Month 3-6
- Migrate to SSR/SSG for public pages
- Implement predictive prefetching
- Add GraphQL for complex queries
- Optimize database schema

### Month 6-12
- Consider edge computing for API
- Implement micro-frontends
- Add intelligent code splitting
- Optimize for Core Web Vitals

---

## TROUBLESHOOTING

### Slow Page Loads

**Symptoms:** Pages taking >3 seconds to load

**Diagnosis:**
1. Open DevTools → Network tab
2. Identify largest assets
3. Check waterfall for blocking resources

**Solutions:**
- Defer non-critical scripts
- Lazy load images
- Reduce bundle size
- Enable compression

### Slow Database Queries

**Symptoms:** Queries taking >500ms

**Diagnosis:**
```sql
EXPLAIN ANALYZE
SELECT * FROM patient_appointments
WHERE clinic_id = '...' AND scheduled_at > NOW();
```

**Solutions:**
- Add indexes
- Reduce selected columns
- Use query caching
- Optimize joins

### High Memory Usage

**Symptoms:** Browser using >500 MB RAM

**Diagnosis:**
1. Open DevTools → Performance tab
2. Take heap snapshot
3. Identify memory leaks

**Solutions:**
- Clear intervals/timeouts
- Remove event listeners
- Limit rendered list size
- Use virtualization for long lists

---

## TESTING METHODOLOGY

### Load Testing

**Use Artillery or k6:**

```yaml
# artillery-test.yml
config:
  target: 'https://aim-os.com'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Sustained load"
    - duration: 60
      arrivalRate: 100
      name: "Spike test"

scenarios:
  - name: "Browse and book"
    flow:
      - get:
          url: "/login"
      - post:
          url: "/api/login"
          json:
            email: "test@example.com"
            password: "password"
      - get:
          url: "/scheduler"
      - post:
          url: "/api/bookings"
          json:
            clinic_id: "..."
            service_id: "..."
```

Run with: `artillery run artillery-test.yml`

### Performance Budget

**Set and enforce budgets:**

```json
{
  "budget": {
    "javascript": 500,
    "css": 100,
    "images": 300,
    "fonts": 100,
    "total": 1500
  }
}
```

---

## CONCLUSION

**Priority Order:**
1. Database indexes (immediate)
2. Code splitting (week 1)
3. Image optimization (week 1)
4. Caching strategy (week 2)
5. Monitoring setup (week 2)

**Expected Results:**
- 50% faster page loads
- 70% reduction in API calls
- 90% improvement in repeat visits
- 99.9% uptime

**Review Schedule:**
- Weekly for first month
- Bi-weekly for months 2-3
- Monthly ongoing

---

**Document Version:** 1.0
**Last Updated:** March 12, 2026
**Next Review:** April 1, 2026
