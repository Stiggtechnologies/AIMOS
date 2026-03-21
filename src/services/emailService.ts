import { supabase } from '../lib/supabase';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_body: string;
  text_body: string;
  variables: string[];
  category: 'notification' | 'credential' | 'appointment' | 'billing' | 'marketing' | 'system';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmailJob {
  id: string;
  to_email: string;
  to_name?: string;
  from_email: string;
  from_name: string;
  subject: string;
  html_body: string;
  text_body?: string;
  template_id?: string;
  status: 'queued' | 'sending' | 'sent' | 'failed' | 'bounced';
  scheduled_for?: string;
  sent_at?: string;
  error_message?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface EmailPreview {
  subject: string;
  html_body: string;
  text_body: string;
}

const DEFAULT_FROM_EMAIL = 'noreply@aimintegrative.com';
const DEFAULT_FROM_NAME = 'AIM Integrative Medicine';

const TEMPLATES: Record<string, Omit<EmailTemplate, 'id' | 'created_at' | 'updated_at'>> = {
  credential_expiry_warning: {
    name: 'Credential Expiry Warning',
    subject: 'Action Required: Your {{credential_type}} expires in {{days_remaining}} days',
    html_body: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
    .alert-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .btn { display: inline-block; background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin:0;">Credential Renewal Required</h1>
    </div>
    <div class="content">
      <p>Hi {{staff_name}},</p>

      <div class="alert-box">
        <strong>Your {{credential_type}} expires on {{expiry_date}}</strong><br>
        Only {{days_remaining}} days remaining!
      </div>

      <p>To continue practicing without interruption, please renew your credential before the expiration date.</p>

      <h3>What you need to do:</h3>
      <ol>
        <li>Visit your credentialing body's website</li>
        <li>Complete any required continuing education</li>
        <li>Submit your renewal application</li>
        <li>Upload your new credential to AIM OS</li>
      </ol>

      <p style="text-align: center; margin: 30px 0;">
        <a href="{{action_url}}" class="btn">View My Credentials</a>
      </p>

      <p>If you have any questions, please contact HR or your clinic manager.</p>

      <p>Best regards,<br>AIM Integrative Medicine</p>
    </div>
    <div class="footer">
      This is an automated message from AIM OS. Please do not reply directly to this email.
    </div>
  </div>
</body>
</html>`,
    text_body: `
Hi {{staff_name}},

CREDENTIAL RENEWAL REQUIRED

Your {{credential_type}} expires on {{expiry_date}} ({{days_remaining}} days remaining).

To continue practicing without interruption, please renew your credential before the expiration date.

What you need to do:
1. Visit your credentialing body's website
2. Complete any required continuing education
3. Submit your renewal application
4. Upload your new credential to AIM OS

View your credentials: {{action_url}}

If you have any questions, please contact HR or your clinic manager.

Best regards,
AIM Integrative Medicine
    `,
    variables: ['staff_name', 'credential_type', 'expiry_date', 'days_remaining', 'action_url'],
    category: 'credential',
    is_active: true
  },

  appointment_reminder: {
    name: 'Appointment Reminder',
    subject: 'Reminder: Your appointment tomorrow at {{appointment_time}}',
    html_body: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
    .appointment-card { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .detail-row { display: flex; margin: 10px 0; }
    .detail-label { font-weight: 600; width: 120px; color: #6b7280; }
    .btn { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; }
    .btn-secondary { background: #6b7280; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin:0;">Appointment Reminder</h1>
    </div>
    <div class="content">
      <p>Hi {{patient_name}},</p>

      <p>This is a friendly reminder about your upcoming appointment.</p>

      <div class="appointment-card">
        <div class="detail-row">
          <span class="detail-label">Date:</span>
          <span>{{appointment_date}}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Time:</span>
          <span>{{appointment_time}}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Provider:</span>
          <span>{{provider_name}}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Location:</span>
          <span>{{clinic_name}}<br>{{clinic_address}}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Service:</span>
          <span>{{service_type}}</span>
        </div>
      </div>

      <h3>Before Your Visit:</h3>
      <ul>
        <li>Please arrive 10 minutes early</li>
        <li>Bring your insurance card and photo ID</li>
        <li>Wear comfortable clothing for your treatment</li>
      </ul>

      <p style="text-align: center; margin: 30px 0;">
        <a href="{{confirm_url}}" class="btn">Confirm Appointment</a>
        &nbsp;&nbsp;
        <a href="{{reschedule_url}}" class="btn btn-secondary">Reschedule</a>
      </p>

      <p>Need to cancel? Please give us at least 24 hours notice by calling {{clinic_phone}}.</p>

      <p>We look forward to seeing you!</p>

      <p>Best regards,<br>{{clinic_name}}</p>
    </div>
    <div class="footer">
      This is an automated message from AIM Integrative Medicine.
    </div>
  </div>
</body>
</html>`,
    text_body: `
Hi {{patient_name}},

This is a friendly reminder about your upcoming appointment.

APPOINTMENT DETAILS:
Date: {{appointment_date}}
Time: {{appointment_time}}
Provider: {{provider_name}}
Location: {{clinic_name}}
         {{clinic_address}}
Service: {{service_type}}

BEFORE YOUR VISIT:
- Please arrive 10 minutes early
- Bring your insurance card and photo ID
- Wear comfortable clothing for your treatment

Confirm: {{confirm_url}}
Reschedule: {{reschedule_url}}

Need to cancel? Please give us at least 24 hours notice by calling {{clinic_phone}}.

We look forward to seeing you!

Best regards,
{{clinic_name}}
    `,
    variables: ['patient_name', 'appointment_date', 'appointment_time', 'provider_name', 'clinic_name', 'clinic_address', 'clinic_phone', 'service_type', 'confirm_url', 'reschedule_url'],
    category: 'appointment',
    is_active: true
  },

  case_aging_alert: {
    name: 'Case Aging Alert',
    subject: 'Alert: {{case_count}} cases require attention',
    html_body: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
    .alert-summary { display: flex; gap: 20px; margin: 20px 0; }
    .stat-card { flex: 1; background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 8px; text-align: center; }
    .stat-number { font-size: 32px; font-weight: bold; color: #dc2626; }
    .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #f3f4f6; padding: 10px; text-align: left; font-weight: 600; }
    td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
    .priority-critical { color: #dc2626; font-weight: bold; }
    .priority-high { color: #f59e0b; font-weight: bold; }
    .btn { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin:0;">Case Aging Alert</h1>
      <p style="margin:10px 0 0 0;opacity:0.9;">Immediate attention required</p>
    </div>
    <div class="content">
      <p>Hi {{manager_name}},</p>

      <p>The following cases at {{clinic_name}} have exceeded their target resolution times and require your attention.</p>

      <div class="alert-summary">
        <div class="stat-card">
          <div class="stat-number">{{critical_count}}</div>
          <div class="stat-label">Critical</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{high_count}}</div>
          <div class="stat-label">High Priority</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{total_count}}</div>
          <div class="stat-label">Total Aging</div>
        </div>
      </div>

      <h3>Top Cases Requiring Action:</h3>
      <table>
        <thead>
          <tr>
            <th>Case ID</th>
            <th>Patient</th>
            <th>Days Open</th>
            <th>Priority</th>
          </tr>
        </thead>
        <tbody>
          {{case_rows}}
        </tbody>
      </table>

      <p style="text-align: center; margin: 30px 0;">
        <a href="{{dashboard_url}}" class="btn">View All Aging Cases</a>
      </p>

      <p>Please review these cases and take appropriate action to resolve them.</p>

      <p>Best regards,<br>AIM OS Automation</p>
    </div>
    <div class="footer">
      This is an automated alert from AIM OS Case Management.
    </div>
  </div>
</body>
</html>`,
    text_body: `
Hi {{manager_name}},

CASE AGING ALERT - Immediate attention required

The following cases at {{clinic_name}} have exceeded their target resolution times.

Summary:
- Critical: {{critical_count}}
- High Priority: {{high_count}}
- Total Aging: {{total_count}}

View all aging cases: {{dashboard_url}}

Please review these cases and take appropriate action to resolve them.

Best regards,
AIM OS Automation
    `,
    variables: ['manager_name', 'clinic_name', 'critical_count', 'high_count', 'total_count', 'case_rows', 'dashboard_url'],
    category: 'notification',
    is_active: true
  },

  welcome_new_staff: {
    name: 'Welcome New Staff',
    subject: 'Welcome to AIM Integrative Medicine, {{first_name}}!',
    html_body: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 40px 30px; border-radius: 8px 8px 0 0; text-align: center; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
    .checklist { background: #f0f9ff; border: 1px solid #bae6fd; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .checklist-item { display: flex; align-items: center; margin: 10px 0; }
    .checkbox { width: 20px; height: 20px; border: 2px solid #3b82f6; border-radius: 4px; margin-right: 12px; }
    .btn { display: inline-block; background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin:0;font-size:28px;">Welcome to the Team!</h1>
      <p style="margin:10px 0 0 0;opacity:0.9;font-size:16px;">We're excited to have you at AIM Integrative Medicine</p>
    </div>
    <div class="content">
      <p>Hi {{first_name}},</p>

      <p>Welcome to AIM Integrative Medicine! We're thrilled to have you join our team at {{clinic_name}}.</p>

      <p>Your start date is <strong>{{start_date}}</strong>. Here's what you need to know:</p>

      <div class="checklist">
        <h3 style="margin-top:0;">Your First Week Checklist:</h3>
        <div class="checklist-item">
          <div class="checkbox"></div>
          <span>Complete your AIM OS profile setup</span>
        </div>
        <div class="checklist-item">
          <div class="checkbox"></div>
          <span>Upload required credentials and certifications</span>
        </div>
        <div class="checklist-item">
          <div class="checkbox"></div>
          <span>Review the employee handbook</span>
        </div>
        <div class="checklist-item">
          <div class="checkbox"></div>
          <span>Complete mandatory compliance training</span>
        </div>
        <div class="checklist-item">
          <div class="checkbox"></div>
          <span>Meet with your supervisor</span>
        </div>
      </div>

      <h3>Your Account Details:</h3>
      <ul>
        <li><strong>Email:</strong> {{email}}</li>
        <li><strong>Role:</strong> {{role}}</li>
        <li><strong>Department:</strong> {{department}}</li>
        <li><strong>Reports to:</strong> {{manager_name}}</li>
      </ul>

      <p style="text-align: center; margin: 30px 0;">
        <a href="{{login_url}}" class="btn">Access AIM OS</a>
      </p>

      <p>If you have any questions, don't hesitate to reach out to your manager or HR.</p>

      <p>Welcome aboard!</p>

      <p>Best regards,<br>The AIM Team</p>
    </div>
    <div class="footer">
      AIM Integrative Medicine | Empowering health through integrative care
    </div>
  </div>
</body>
</html>`,
    text_body: `
Hi {{first_name}},

Welcome to AIM Integrative Medicine! We're thrilled to have you join our team at {{clinic_name}}.

Your start date is {{start_date}}.

YOUR FIRST WEEK CHECKLIST:
[ ] Complete your AIM OS profile setup
[ ] Upload required credentials and certifications
[ ] Review the employee handbook
[ ] Complete mandatory compliance training
[ ] Meet with your supervisor

YOUR ACCOUNT DETAILS:
- Email: {{email}}
- Role: {{role}}
- Department: {{department}}
- Reports to: {{manager_name}}

Access AIM OS: {{login_url}}

If you have any questions, don't hesitate to reach out to your manager or HR.

Welcome aboard!

Best regards,
The AIM Team
    `,
    variables: ['first_name', 'clinic_name', 'start_date', 'email', 'role', 'department', 'manager_name', 'login_url'],
    category: 'system',
    is_active: true
  },

  billing_statement: {
    name: 'Billing Statement',
    subject: 'Your Statement from AIM Integrative Medicine - {{statement_date}}',
    html_body: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1e40af; color: white; padding: 30px; border-radius: 8px 8px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
    .amount-due { background: #fef3c7; border: 1px solid #fcd34d; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
    .amount { font-size: 36px; font-weight: bold; color: #92400e; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #f3f4f6; padding: 10px; text-align: left; }
    td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
    .total-row { font-weight: bold; background: #f9fafb; }
    .btn { display: inline-block; background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin:0;">Billing Statement</h1>
      <p style="margin:10px 0 0 0;opacity:0.9;">Statement Date: {{statement_date}}</p>
    </div>
    <div class="content">
      <p>Dear {{patient_name}},</p>

      <p>Please find your billing statement below for services rendered at AIM Integrative Medicine.</p>

      <div class="amount-due">
        <div style="font-size:14px;color:#92400e;margin-bottom:5px;">Amount Due</div>
        <div class="amount">DOLLAR_SIGN{{total_due}}</div>
        <div style="font-size:12px;color:#6b7280;margin-top:5px;">Due by {{due_date}}</div>
      </div>

      <h3>Statement Details:</h3>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Service</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {{line_items}}
        </tbody>
        <tfoot>
          <tr class="total-row">
            <td colspan="2">Insurance Payments</td>
            <td>-DOLLAR_SIGN{{insurance_paid}}</td>
          </tr>
          <tr class="total-row">
            <td colspan="2">Previous Payments</td>
            <td>-DOLLAR_SIGN{{patient_paid}}</td>
          </tr>
          <tr class="total-row">
            <td colspan="2">Balance Due</td>
            <td>DOLLAR_SIGN{{total_due}}</td>
          </tr>
        </tfoot>
      </table>

      <p style="text-align: center; margin: 30px 0;">
        <a href="{{payment_url}}" class="btn">Pay Now</a>
      </p>

      <h3>Payment Options:</h3>
      <ul>
        <li>Pay online at {{payment_url}}</li>
        <li>Call us at {{clinic_phone}}</li>
        <li>Mail a check to our billing address</li>
      </ul>

      <p>Questions about your statement? Contact our billing department at {{billing_email}}.</p>

      <p>Thank you for choosing AIM Integrative Medicine.</p>
    </div>
    <div class="footer">
      This is a billing statement from AIM Integrative Medicine. Please do not reply to this email.
    </div>
  </div>
</body>
</html>`,
    text_body: `
Dear {{patient_name}},

BILLING STATEMENT
Statement Date: {{statement_date}}

Amount Due: DOLLAR_SIGN{{total_due}}
Due by: {{due_date}}

Pay online: {{payment_url}}

Questions? Contact our billing department at {{billing_email}}.

Thank you for choosing AIM Integrative Medicine.
    `,
    variables: ['patient_name', 'statement_date', 'due_date', 'total_due', 'insurance_paid', 'patient_paid', 'line_items', 'payment_url', 'clinic_phone', 'billing_email'],
    category: 'billing',
    is_active: true
  },

  daily_digest: {
    name: 'Daily Operations Digest',
    subject: 'Daily Operations Digest - {{date}}',
    html_body: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
    .metric-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
    .metric-card { background: #f9fafb; border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; text-align: center; }
    .metric-value { font-size: 24px; font-weight: bold; color: #1e40af; }
    .metric-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
    .metric-change { font-size: 12px; margin-top: 5px; }
    .change-up { color: #059669; }
    .change-down { color: #dc2626; }
    .section { margin: 25px 0; }
    .section-title { font-size: 16px; font-weight: 600; color: #1e40af; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 15px; }
    .alert-item { display: flex; align-items: center; padding: 10px; background: #fef2f2; border-radius: 6px; margin: 8px 0; }
    .alert-icon { width: 8px; height: 8px; background: #dc2626; border-radius: 50%; margin-right: 12px; }
    .btn { display: inline-block; background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin:0;">Daily Operations Digest</h1>
      <p style="margin:10px 0 0 0;opacity:0.9;">{{date}} | {{clinic_name}}</p>
    </div>
    <div class="content">
      <p>Good morning, {{recipient_name}}!</p>

      <p>Here's your daily operations summary:</p>

      <div class="metric-grid">
        <div class="metric-card">
          <div class="metric-value">{{visits_today}}</div>
          <div class="metric-label">Visits Today</div>
          <div class="metric-change {{visits_change_class}}">{{visits_change}}</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">{{utilization_pct}}%</div>
          <div class="metric-label">Utilization</div>
          <div class="metric-change {{util_change_class}}">{{util_change}}</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">DOLLAR_SIGN{{revenue_today}}</div>
          <div class="metric-label">Revenue</div>
          <div class="metric-change {{revenue_change_class}}">{{revenue_change}}</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">{{nps_score}}</div>
          <div class="metric-label">NPS Score</div>
          <div class="metric-change">Last 7 days</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Action Items ({{action_count}})</div>
        {{action_items}}
      </div>

      <div class="section">
        <div class="section-title">Alerts</div>
        {{alerts}}
      </div>

      <p style="text-align: center; margin: 30px 0;">
        <a href="{{dashboard_url}}" class="btn">Open Dashboard</a>
      </p>

      <p>Have a great day!</p>
    </div>
    <div class="footer">
      AIM OS Daily Digest | Unsubscribe from these emails in your notification preferences
    </div>
  </div>
</body>
</html>`,
    text_body: `
Daily Operations Digest
{{date}} | {{clinic_name}}

Good morning, {{recipient_name}}!

KEY METRICS:
- Visits Today: {{visits_today}} ({{visits_change}})
- Utilization: {{utilization_pct}}% ({{util_change}})
- Revenue: DOLLAR_SIGN{{revenue_today}} ({{revenue_change}})
- NPS Score: {{nps_score}}

ACTION ITEMS: {{action_count}}
{{action_items_text}}

Open Dashboard: {{dashboard_url}}

Have a great day!
    `,
    variables: ['date', 'clinic_name', 'recipient_name', 'visits_today', 'visits_change', 'visits_change_class', 'utilization_pct', 'util_change', 'util_change_class', 'revenue_today', 'revenue_change', 'revenue_change_class', 'nps_score', 'action_count', 'action_items', 'action_items_text', 'alerts', 'dashboard_url'],
    category: 'notification',
    is_active: true
  }
};

function interpolateTemplate(template: string, variables: Record<string, any>): string {
  let result = template.replace(/DOLLAR_SIGN/g, '$');
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, String(value ?? ''));
  }
  return result;
}

export const emailService = {
  async getTemplates(): Promise<EmailTemplate[]> {
    return Object.entries(TEMPLATES).map(([id, template]) => ({
      id,
      ...template,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
  },

  async getTemplate(templateId: string): Promise<EmailTemplate | null> {
    const template = TEMPLATES[templateId];
    if (!template) return null;

    return {
      id: templateId,
      ...template,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  },

  async previewEmail(templateId: string, variables: Record<string, any>): Promise<EmailPreview> {
    const template = TEMPLATES[templateId];
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    return {
      subject: interpolateTemplate(template.subject, variables),
      html_body: interpolateTemplate(template.html_body, variables),
      text_body: interpolateTemplate(template.text_body, variables)
    };
  },

  async queueEmail(params: {
    to_email: string;
    to_name?: string;
    template_id?: string;
    variables?: Record<string, any>;
    subject?: string;
    html_body?: string;
    text_body?: string;
    scheduled_for?: string;
    metadata?: Record<string, any>;
  }): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();

    let subject = params.subject || '';
    let html_body = params.html_body || '';
    let text_body = params.text_body || '';

    if (params.template_id && params.variables) {
      const preview = await this.previewEmail(params.template_id, params.variables);
      subject = preview.subject;
      html_body = preview.html_body;
      text_body = preview.text_body;
    }

    const emailJob: Omit<EmailJob, 'id' | 'created_at'> = {
      to_email: params.to_email,
      to_name: params.to_name,
      from_email: DEFAULT_FROM_EMAIL,
      from_name: DEFAULT_FROM_NAME,
      subject,
      html_body,
      text_body,
      template_id: params.template_id,
      status: 'queued',
      scheduled_for: params.scheduled_for,
      metadata: params.metadata
    };

    const { data, error } = await supabase
      .from('email_queue')
      .insert(emailJob)
      .select('id')
      .single();

    if (error) {
      console.error('Failed to queue email, logging to audit:', error);
      await supabase.from('audit_events').insert({
        user_id: user?.id,
        action: 'email_queued',
        table_name: 'email_queue',
        metadata: {
          to_email: params.to_email,
          subject,
          template_id: params.template_id,
          status: 'queued_locally'
        }
      });
      return 'local-' + Date.now();
    }

    return data.id;
  },

  async sendCredentialExpiryEmail(params: {
    staff_email: string;
    staff_name: string;
    credential_type: string;
    expiry_date: string;
    days_remaining: number;
  }): Promise<string> {
    return this.queueEmail({
      to_email: params.staff_email,
      to_name: params.staff_name,
      template_id: 'credential_expiry_warning',
      variables: {
        staff_name: params.staff_name,
        credential_type: params.credential_type,
        expiry_date: params.expiry_date,
        days_remaining: params.days_remaining,
        action_url: `${window.location.origin}/workforce/credentials`
      }
    });
  },

  async sendAppointmentReminder(params: {
    patient_email: string;
    patient_name: string;
    appointment_date: string;
    appointment_time: string;
    provider_name: string;
    clinic_name: string;
    clinic_address: string;
    clinic_phone: string;
    service_type: string;
    appointment_id: string;
  }): Promise<string> {
    return this.queueEmail({
      to_email: params.patient_email,
      to_name: params.patient_name,
      template_id: 'appointment_reminder',
      variables: {
        ...params,
        confirm_url: `${window.location.origin}/appointments/${params.appointment_id}/confirm`,
        reschedule_url: `${window.location.origin}/appointments/${params.appointment_id}/reschedule`
      }
    });
  },

  async sendCaseAgingAlert(params: {
    manager_email: string;
    manager_name: string;
    clinic_name: string;
    critical_count: number;
    high_count: number;
    total_count: number;
    cases: Array<{ id: string; patient: string; days_open: number; priority: string }>;
  }): Promise<string> {
    const case_rows = params.cases
      .slice(0, 10)
      .map(c => `
        <tr>
          <td>${c.id}</td>
          <td>${c.patient}</td>
          <td>${c.days_open}</td>
          <td class="priority-${c.priority}">${c.priority}</td>
        </tr>
      `)
      .join('');

    return this.queueEmail({
      to_email: params.manager_email,
      to_name: params.manager_name,
      template_id: 'case_aging_alert',
      variables: {
        manager_name: params.manager_name,
        clinic_name: params.clinic_name,
        critical_count: params.critical_count,
        high_count: params.high_count,
        total_count: params.total_count,
        case_rows,
        dashboard_url: `${window.location.origin}/operations/case-aging`
      }
    });
  },

  async sendWelcomeEmail(params: {
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    department: string;
    clinic_name: string;
    start_date: string;
    manager_name: string;
  }): Promise<string> {
    return this.queueEmail({
      to_email: params.email,
      to_name: `${params.first_name} ${params.last_name}`,
      template_id: 'welcome_new_staff',
      variables: {
        ...params,
        login_url: `${window.location.origin}/login`
      }
    });
  },

  async sendDailyDigest(params: {
    recipient_email: string;
    recipient_name: string;
    clinic_name: string;
    metrics: {
      visits_today: number;
      visits_change: string;
      utilization_pct: number;
      util_change: string;
      revenue_today: number;
      revenue_change: string;
      nps_score: number;
    };
    action_items: Array<{ text: string }>;
    alerts: Array<{ text: string }>;
  }): Promise<string> {
    const date = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const action_items_html = params.action_items.length > 0
      ? params.action_items.map(item => `<div class="alert-item"><div class="alert-icon"></div>${item.text}</div>`).join('')
      : '<p style="color:#6b7280;">No action items today!</p>';

    const alerts_html = params.alerts.length > 0
      ? params.alerts.map(alert => `<div class="alert-item"><div class="alert-icon"></div>${alert.text}</div>`).join('')
      : '<p style="color:#6b7280;">No alerts - everything is running smoothly!</p>';

    return this.queueEmail({
      to_email: params.recipient_email,
      to_name: params.recipient_name,
      template_id: 'daily_digest',
      variables: {
        date,
        clinic_name: params.clinic_name,
        recipient_name: params.recipient_name,
        visits_today: params.metrics.visits_today,
        visits_change: params.metrics.visits_change,
        visits_change_class: params.metrics.visits_change.startsWith('+') ? 'change-up' : 'change-down',
        utilization_pct: params.metrics.utilization_pct,
        util_change: params.metrics.util_change,
        util_change_class: params.metrics.util_change.startsWith('+') ? 'change-up' : 'change-down',
        revenue_today: params.metrics.revenue_today.toLocaleString(),
        revenue_change: params.metrics.revenue_change,
        revenue_change_class: params.metrics.revenue_change.startsWith('+') ? 'change-up' : 'change-down',
        nps_score: params.metrics.nps_score,
        action_count: params.action_items.length,
        action_items: action_items_html,
        action_items_text: params.action_items.map(i => `- ${i.text}`).join('\n'),
        alerts: alerts_html,
        dashboard_url: `${window.location.origin}/command-center`
      }
    });
  },

  async getEmailQueue(filters?: {
    status?: EmailJob['status'];
    limit?: number;
  }): Promise<EmailJob[]> {
    let query = supabase
      .from('email_queue')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Failed to fetch email queue:', error);
      return [];
    }

    return data as EmailJob[];
  },

  async retryEmail(emailId: string): Promise<void> {
    const { error } = await supabase
      .from('email_queue')
      .update({ status: 'queued', error_message: null })
      .eq('id', emailId);

    if (error) throw error;
  }
};
