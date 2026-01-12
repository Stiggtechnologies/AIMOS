# Enhanced Analytics & Reporting System

## Overview

The Enhanced Analytics & Reporting System provides comprehensive cross-module analytics, executive dashboards, custom report building capabilities, and data export functionality. It aggregates data from operations, credentials, cases, staffing, and capacity modules to provide actionable insights.

## Features

### 1. Executive Dashboard
Comprehensive analytics dashboard with multiple views:
- **Overview**: High-level metrics and key concerns
- **Operational Health**: Clinic-by-clinic health scores and metrics
- **Clinic Performance**: Performance comparison across all clinics
- **Compliance Risk**: Staff with credential issues and their impact
- **Trends**: Historical trend analysis for key metrics

### 2. Cross-Module Analytics
Intelligent views that combine data from multiple sources:
- **Operational Health Score**: Weighted score considering staff, credentials, capacity, and cases
- **Credential Impact Analysis**: How credential status affects operational capacity
- **Performance Comparison**: Benchmarking clinics against each other

### 3. Custom Report Builder
Users can create custom reports with:
- Configurable data sources
- Custom metrics selection
- Filtering and grouping
- Visualization configuration
- Public or private sharing

### 4. Report Scheduling
Automated report delivery:
- Cron-based scheduling
- Email or download delivery
- Multiple export formats (PDF, Excel, CSV, JSON)
- Recipient management

### 5. Export Functionality
Client-side export capabilities:
- CSV export for spreadsheet analysis
- JSON export for data integration
- One-click download from any view

## Database Schema

### Tables

#### `analytics_report_definitions`
Custom report definitions
- `id` (uuid, primary key)
- `name` (text) - Report name
- `description` (text) - Report description
- `report_type` (enum) - executive, operational, compliance, financial, growth, custom
- `data_sources` (jsonb) - Array of modules/tables to query
- `metrics` (jsonb) - Array of metrics to include
- `filters` (jsonb) - Default filter configuration
- `grouping` (jsonb) - Grouping configuration
- `visualization_config` (jsonb) - Chart/table configuration
- `is_system` (boolean) - System vs user-created
- `is_public` (boolean) - Shared with organization
- `created_by` (uuid)
- `clinic_id` (uuid) - Clinic-specific or NULL for global

#### `analytics_scheduled_reports`
Report scheduling configuration
- `id` (uuid, primary key)
- `report_definition_id` (uuid) - Which report to run
- `schedule_cron` (text) - Cron expression
- `delivery_method` (enum) - email, download, dashboard
- `recipients` (jsonb) - Email addresses or user IDs
- `format` (enum) - pdf, excel, csv, json
- `is_active` (boolean) - Schedule enabled/disabled
- `last_run_at` (timestamptz)
- `next_run_at` (timestamptz)

#### `analytics_report_executions`
History of report runs
- `id` (uuid, primary key)
- `report_definition_id` (uuid)
- `scheduled_report_id` (uuid) - NULL if manual
- `executed_by` (uuid)
- `execution_started_at` (timestamptz)
- `execution_completed_at` (timestamptz)
- `status` (enum) - queued, running, completed, failed
- `row_count` (integer)
- `file_path` (text) - Exported file path
- `error_message` (text)
- `execution_params` (jsonb)

### Analytics Views

#### `analytics_operational_health`
Cross-module operational health metrics
```sql
SELECT
  clinic_id,
  clinic_name,
  total_staff,
  active_staff,
  total_credentials,
  expired_credentials,
  expiring_soon_credentials,
  total_rooms,
  active_rooms,
  open_cases,
  critical_cases,
  avg_case_age_days,
  unack_aging_alerts,
  health_score (0-100),
  calculated_at
FROM analytics_operational_health;
```

**Health Score Calculation:**
- 25% - Staff active ratio
- 25% - Credential compliance
- 25% - Room availability
- 25% - Case criticality (deducted for urgent/critical cases)

#### `analytics_credential_impact`
How credential status affects operations
```sql
SELECT
  clinic_id,
  clinic_name,
  staff_id,
  staff_name,
  employment_type,
  total_credentials,
  active_credentials,
  expired_credentials,
  next_expiry_date,
  compliance_status (compliant/warning/at_risk),
  active_cases,
  risk_level (no_risk/low_risk/medium_risk/high_risk)
FROM analytics_credential_impact;
```

**Risk Assessment:**
- **High Risk**: Expired credentials + active cases
- **Medium Risk**: Expired credentials, no active cases
- **Low Risk**: Credentials expiring within 30 days
- **No Risk**: All credentials compliant

#### `analytics_executive_summary`
High-level KPIs for executive dashboard
```sql
SELECT
  total_active_clinics,
  total_active_staff,
  total_open_cases,
  avg_operational_health,
  total_expired_credentials,
  credentials_expiring_soon,
  critical_cases,
  avg_case_age_days,
  capacity_utilization_pct,
  unacknowledged_alerts,
  active_escalations,
  staff_at_risk,
  snapshot_time
FROM analytics_executive_summary;
```

### Functions

#### `get_clinic_performance_comparison(start_date, end_date)`
Compares clinic performance over a date range
```sql
SELECT * FROM get_clinic_performance_comparison(
  '2026-01-01',
  '2026-01-31'
);
```

**Returns:**
- `clinic_id` - Clinic identifier
- `clinic_name` - Clinic name
- `total_cases` - Total cases in period
- `completed_cases` - Completed cases
- `avg_case_duration_days` - Average time to close
- `credential_compliance_rate` - % active credentials
- `staff_count` - Active staff
- `staff_productivity_score` - Cases per staff member
- `overall_performance_score` - Weighted performance (0-100)

#### `get_metric_trend(metric_name, clinic_id, days_back)`
Get historical trend for a metric
```sql
SELECT * FROM get_metric_trend(
  'open_cases',  -- or 'expired_credentials', 'active_staff'
  NULL,          -- NULL for all clinics or specific clinic_id
  30             -- Days back to retrieve
);
```

**Supported Metrics:**
- `open_cases` - Daily count of open cases
- `expired_credentials` - Daily count of expired credentials
- `active_staff` - Daily count of active staff

## Service Layer

### `analyticsReportingService`

Complete TypeScript service for analytics operations:

```typescript
import { analyticsReportingService } from './services/analyticsReportingService';

// Get executive summary
const summary = await analyticsReportingService.getExecutiveSummary();

// Get operational health for all clinics
const health = await analyticsReportingService.getOperationalHealth();

// Get operational health for specific clinic
const clinicHealth = await analyticsReportingService.getOperationalHealth(clinicId);

// Get credential impact (high risk only)
const impact = await analyticsReportingService.getCredentialImpact(undefined, 'high_risk');

// Get clinic performance comparison
const performance = await analyticsReportingService.getClinicPerformanceComparison(
  '2026-01-01',
  '2026-01-31'
);

// Get metric trend
const trend = await analyticsReportingService.getMetricTrend(
  'open_cases',
  clinicId,
  30
);

// Export data to CSV
await analyticsReportingService.exportToCSV(data, 'report.csv');

// Export data to JSON
await analyticsReportingService.exportToJSON(data, 'report.json');
```

### Report Management

```typescript
// Get all reports
const reports = await analyticsReportingService.getReportDefinitions();

// Get reports by type
const executiveReports = await analyticsReportingService.getReportDefinitions({
  report_type: 'executive'
});

// Create custom report
const reportId = await analyticsReportingService.createReportDefinition({
  name: 'Monthly Operations Report',
  description: 'Comprehensive operational metrics',
  report_type: 'operational',
  data_sources: ['ops_cases', 'ops_credentials'],
  metrics: ['open_cases', 'expired_credentials'],
  filters: { date_range: '30d' },
  grouping: ['clinic_id'],
  visualization_config: { type: 'table', chartType: 'bar' },
  is_system: false,
  is_public: true,
  clinic_id: null
});

// Update report
await analyticsReportingService.updateReportDefinition(reportId, {
  name: 'Updated Report Name'
});

// Delete report
await analyticsReportingService.deleteReportDefinition(reportId);
```

### Report Scheduling

```typescript
// Schedule a report
const scheduleId = await analyticsReportingService.createScheduledReport({
  report_definition_id: reportId,
  schedule_cron: '0 8 * * 1',  // Every Monday at 8 AM
  delivery_method: 'email',
  recipients: ['manager@company.com', 'executive@company.com'],
  format: 'pdf',
  is_active: true
});

// Update schedule
await analyticsReportingService.updateScheduledReport(scheduleId, {
  is_active: false
});

// Get scheduled reports
const schedules = await analyticsReportingService.getScheduledReports(reportId);
```

## UI Components

### ExecutiveAnalyticsView

Main analytics dashboard with 5 view modes:

**Location:** AIM OS > Executive Analytics

**Features:**
- Real-time executive summary cards
- Interactive view tabs (Overview, Operational, Performance, Compliance, Trends)
- Export functionality (CSV/JSON)
- Drill-down capabilities
- Color-coded health scores and risk levels

**View Modes:**

1. **Overview**
   - Key metrics at a glance
   - Top concerns highlighted
   - Quick access to problem areas

2. **Operational Health**
   - Table view of all clinics
   - Health score with visual indicators
   - Staff, credential, and case metrics
   - Alert counts

3. **Clinic Performance**
   - Performance comparison table
   - Completion rates
   - Staff productivity
   - Overall performance scores

4. **Compliance Risk**
   - High-risk staff list
   - Credential status impact
   - Active case assignments
   - Risk level indicators

5. **Trends**
   - Historical trend visualization
   - Selectable metrics
   - Configurable time ranges
   - Bar chart display

## Security

### Row Level Security (RLS)

All tables have RLS enabled:

**Report Definitions:**
- View: Public reports, own reports, system reports, clinic reports
- Create: Any authenticated user
- Update: Report creator only
- Delete: Report creator only (not system reports)

**Scheduled Reports:**
- View: Creator or report owner
- Create: Any authenticated user
- Update: Creator only
- Delete: Creator only

**Report Executions:**
- View: Executor or report owner
- Insert: System (authenticated users)

### Permissions

- **View Analytics**: All authenticated users with clinic access
- **Create Reports**: All authenticated users
- **Schedule Reports**: All authenticated users
- **Manage Reports**: Report creators
- **View Executions**: Report executors and owners

## Best Practices

### Performance Optimization

1. **Use Views**: Pre-aggregated views are optimized for performance
2. **Filter Early**: Apply clinic/date filters to reduce data volume
3. **Limit Trends**: Don't fetch more than 90 days of trend data
4. **Cache Results**: Executive summary is expensive; cache for 5-10 minutes

### Report Design

1. **Name Clearly**: Use descriptive names for reports
2. **Document Purpose**: Add detailed descriptions
3. **Share Wisely**: Mark reports public only when appropriate
4. **Test Filters**: Validate filters before scheduling

### Data Export

1. **Size Limits**: Don't export more than 10,000 rows to CSV
2. **Format Choice**: Use JSON for data integration, CSV for analysis
3. **Naming Convention**: Include date in filename
4. **Regular Cleanup**: Clean up old exports

### Monitoring

1. **Check Health Scores**: Review clinics below 75 regularly
2. **Review Trends**: Monitor for negative trends
3. **Address Risks**: Tackle high-risk compliance issues immediately
4. **Acknowledge Alerts**: Keep alert counts low

## Troubleshooting

### Common Issues

**Health Score is 0 or NULL:**
- Check if clinic has data in all modules
- Verify staff, credentials, rooms, and cases exist
- Review calculation logic in view

**Export Not Working:**
- Check browser pop-up blocker
- Verify data is not empty
- Ensure sufficient browser memory

**Trends Not Loading:**
- Verify metric name is correct
- Check date range is valid
- Ensure clinic has historical data

**Report Schedule Not Running:**
- Verify cron expression is valid
- Check `is_active` is true
- Review `next_run_at` timestamp

## Future Enhancements

Potential improvements:
- PDF export with charting
- Excel export with formatting
- Email delivery integration
- Dashboard widgets
- Real-time notifications
- Predictive analytics
- Custom formulas
- Report templates
- Snapshot comparisons
- Annotations and notes
- Drill-through navigation
- Mobile app views
- API access for external systems
