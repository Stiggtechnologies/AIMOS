# Case Aging Workflow System

## Overview

The Case Aging Workflow System provides automated monitoring, alerts, and escalation workflows for operations case management. It helps ensure cases don't stall and automatically escalates cases that exceed defined thresholds.

## Features

### 1. Automated Aging Monitoring
- **Real-time case age tracking**: Calculates days since case opened
- **Configurable thresholds**: Warning, escalation, and critical thresholds per case type
- **Authorization expiry tracking**: Alerts when authorization dates approach expiry
- **Status history**: Tracks all status changes with duration metrics

### 2. Alert System
- **Four alert types**:
  - **Warning**: Case approaching escalation threshold
  - **Escalation**: Case requires manager attention
  - **Critical**: Case severely overdue
  - **Authorization Expiry**: Authorization approaching expiration
- **Smart deduplication**: Prevents alert spam with time-based checks
- **Targeted notifications**: Alerts sent to clinicians, team members, and managers
- **Acknowledgment workflow**: Users can acknowledge and take action on alerts

### 3. Escalation Management
- **Multi-level escalations**: Configurable escalation paths through management chain
- **Auto-escalation**: System automatically escalates cases at critical thresholds
- **Manual escalation**: Staff can manually escalate with reason
- **Resolution tracking**: Full lifecycle from escalation to resolution
- **Priority adjustment**: Case priority automatically increases with escalation level

### 4. Dashboard & Monitoring
- **Overview metrics**: Total cases, critical count, active escalations, unacknowledged alerts
- **Aging status breakdown**: Visual breakdown of warning/escalation/critical cases
- **Case list view**: Filterable list showing all cases with aging status
- **Alert inbox**: Personalized view of unacknowledged alerts
- **My escalations**: Manager view of cases escalated to them

## Database Schema

### Tables

#### `ops_case_aging_rules`
Defines aging thresholds for different case types
- System-wide or clinic-specific rules
- Configurable thresholds in days
- Escalation path configuration
- Notification preferences

#### `ops_case_aging_alerts`
Tracks all alerts triggered for cases
- Alert type and severity level
- Notification status (pending/sent/failed/acknowledged)
- Case age at time of alert
- Acknowledgment tracking

#### `ops_case_escalations`
Tracks case escalations through management
- Escalation level and path
- Auto vs manual escalation flag
- Resolution status and notes
- Complete audit trail

#### `ops_case_status_history`
Historical record of all status changes
- Old and new status
- Duration in each status
- Change reason and user

### Functions

#### `calculate_case_age(opened_at, closed_at)`
Returns case age in days from opened date to closed date (or now if open)

#### `check_case_aging_alert(case_id)`
Checks if a case needs an aging alert based on rules and recent alerts

#### `trigger_case_aging_alert(case_id, alert_type, ...)`
Creates an alert and notifies appropriate users

#### `escalate_case(case_id, reason, ...)`
Escalates a case to the next level in the escalation path

#### `batch_check_case_aging()`
Background job that checks all open cases and triggers alerts/escalations

#### `get_case_aging_summary(clinic_id)`
Returns summary metrics for case aging dashboard

### View

#### `ops_case_aging_status`
Consolidated view of all open cases with:
- Current age and aging status
- Authorization expiry information
- Alert and escalation counts
- Threshold information from rules

## Default Rules

The system seeds the following default rules:

| Case Type | Warning | Escalation | Critical | Auth Warning |
|-----------|---------|------------|----------|--------------|
| Physical Therapy | 3 days | 7 days | 14 days | 7 days |
| Occupational Therapy | 3 days | 7 days | 14 days | 7 days |
| Speech Therapy | 3 days | 7 days | 14 days | 7 days |
| Work Conditioning | 2 days | 5 days | 10 days | 5 days |
| FCE Assessment | 1 day | 3 days | 7 days | 3 days |
| Post-Offer Testing | 1 day | 3 days | 7 days | 3 days |
| Ergonomic Assessment | 2 days | 5 days | 10 days | 7 days |
| Injury Prevention | 3 days | 7 days | 14 days | 7 days |

Rules can be customized per clinic or system-wide.

## API Usage

### Service Layer (`caseAgingService`)

```typescript
// Get aging summary
const summary = await caseAgingService.getCaseAgingSummary(clinicId);

// Get cases with aging status
const cases = await caseAgingService.getCaseAgingStatus({
  aging_status: 'critical',
  case_type: 'Physical Therapy'
});

// Get my unacknowledged alerts
const alerts = await caseAgingService.getUnacknowledgedAlerts();

// Acknowledge an alert
await caseAgingService.acknowledgeAlert(alertId, 'Contacted patient');

// Get escalations assigned to me
const escalations = await caseAgingService.getMyEscalations();

// Manually escalate a case
const escalationId = await caseAgingService.escalateCase(
  caseId,
  'Case stalled - patient unresponsive',
  false
);

// Resolve an escalation
await caseAgingService.resolveEscalation(
  escalationId,
  'Case reactivated - scheduled follow-up'
);

// Run aging check (batch process)
const result = await caseAgingService.batchCheckCaseAging();
// Returns: { cases_checked, alerts_triggered, escalations_created }
```

## Workflow Automation

The case aging system integrates with the workflow automation engine:

1. **Scheduled Job**: `batch_check_case_aging()` should run hourly or daily
2. **Workflow Triggers**: Can trigger workflows on:
   - Case reaches warning threshold
   - Case escalated
   - Authorization expiring soon
3. **Actions**: Automated actions include:
   - Email notifications to staff
   - SMS alerts for urgent cases
   - Task creation in workflow system
   - Calendar reminders

## UI Components

### CaseAgingView
Main dashboard accessible via Operations > Case Aging

**Tabs:**
- **Overview**: Summary metrics and top priority cases
- **Cases**: Filterable table of all open cases with aging status
- **Alerts**: Inbox of unacknowledged alerts
- **My Escalations**: Cases escalated to current user

**Features:**
- Real-time metrics
- Manual aging check trigger
- One-click alert acknowledgment
- Escalation resolution workflow
- Color-coded priority indicators
- Filterable case lists

## Security

### Row Level Security (RLS)

All tables have RLS enabled:

- **Rules**: Managers can edit clinic rules, all can view
- **Alerts**: Users see alerts where they're notified or on their cases
- **Escalations**: Users see escalations they're involved in or for their cases
- **History**: Users with clinic access can view status history

### Permissions

- **View aging data**: All authenticated users with clinic access
- **Acknowledge alerts**: Users on notification list
- **Escalate cases**: Staff with clinic access
- **Resolve escalations**: Manager escalated to
- **Edit rules**: Clinic managers and admins

## Best Practices

1. **Review aging rules regularly**: Adjust thresholds based on case type complexity
2. **Acknowledge alerts promptly**: Keep alert inbox clean for priority visibility
3. **Document escalations**: Provide clear reasons when escalating
4. **Resolve escalations with notes**: Explain what action was taken
5. **Monitor authorization expiry**: Address expiring authorizations before cases stall
6. **Use filters effectively**: Focus on critical cases first
7. **Run batch checks regularly**: Schedule automated aging checks

## Future Enhancements

Potential improvements:
- Predictive analytics for case completion
- Integration with patient communication systems
- Automated case closure suggestions
- Performance metrics per clinician
- Custom notification preferences
- Mobile app push notifications
- Integration with calendar systems for deadline reminders
