# API Documentation - AIM Rehab Enterprise System

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Service Layer APIs](#service-layer-apis)
4. [Edge Functions](#edge-functions)
5. [Database Direct Access](#database-direct-access)
6. [Error Handling](#error-handling)
7. [Rate Limiting](#rate-limiting)
8. [Best Practices](#best-practices)

---

## Overview

### Architecture

The AIM Rehab Enterprise System uses a layered API architecture:

1. **Frontend Services** - TypeScript services wrapping Supabase client
2. **Supabase Client API** - Auto-generated REST and GraphQL APIs
3. **Edge Functions** - Serverless functions for custom logic
4. **Database Direct Access** - Row Level Security enforced queries

### Base URLs

```
Production: https://your-project.supabase.co
Edge Functions: https://your-project.supabase.co/functions/v1
Frontend: https://your-app.vercel.app
```

### API Versioning

Current Version: **v1**

APIs are versioned through the Edge Functions path:
- `/functions/v1/endpoint-name`

---

## Authentication

### Overview

All API requests require authentication via Supabase Auth JWT tokens.

### Getting an Access Token

**Login:**
```typescript
import { supabase } from './lib/supabase';

const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@aimrehab.ca',
  password: 'password'
});

// Access token
const token = data.session?.access_token;
```

### Using Access Tokens

**In API Requests:**
```typescript
const headers = {
  'Authorization': `Bearer ${access_token}`,
  'apikey': 'your-anon-key',
  'Content-Type': 'application/json'
};
```

**Token Expiration:**
- Access tokens expire after 1 hour
- Refresh tokens are valid for 30 days
- Use `supabase.auth.refreshSession()` to renew

### Authentication Errors

| Status Code | Error | Description |
|-------------|-------|-------------|
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Valid token but insufficient permissions |
| 419 | Token Expired | Access token has expired |

---

## Service Layer APIs

### Patient Portal Service

**File:** `src/services/patientPortalService.ts`

#### Get Patient Profile

```typescript
async getPatientProfile(userId: string): Promise<PatientProfile | null>
```

**Example:**
```typescript
import { patientPortalService } from './services/patientPortalService';

const profile = await patientPortalService.getPatientProfile(user.id);
```

**Response:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "medical_record_number": "MRN-12345",
  "first_name": "John",
  "last_name": "Doe",
  "date_of_birth": "1980-01-15",
  "phone": "403-555-0123",
  "email": "john.doe@email.com",
  "status": "active"
}
```

#### Get Appointments

```typescript
async getAppointments(
  patientId: string,
  filter?: {
    upcoming?: boolean;
    past?: boolean;
    limit?: number;
  }
): Promise<PatientAppointment[]>
```

**Example:**
```typescript
const appointments = await patientPortalService.getAppointments(
  patientId,
  { upcoming: true, limit: 5 }
);
```

#### Send Message

```typescript
async sendMessage(message: {
  patient_id: string;
  sender_id: string;
  sender_type: string;
  recipient_id: string;
  subject: string;
  message: string;
  priority?: string;
})
```

**Example:**
```typescript
await patientPortalService.sendMessage({
  patient_id: patient.id,
  sender_id: user.id,
  sender_type: 'patient',
  recipient_id: provider.id,
  subject: 'Question about treatment',
  message: 'I have a question about my recent visit...',
  priority: 'normal'
});
```

---

### Clinician Mobile Service

**File:** `src/services/clinicianMobileService.ts`

#### Get Today's Appointments

```typescript
async getTodaysAppointments(clinicianId: string): Promise<AppointmentForCheckIn[]>
```

**Example:**
```typescript
import { clinicianMobileService } from './services/clinicianMobileService';

const appointments = await clinicianMobileService.getTodaysAppointments(user.id);
```

**Response:**
```json
[
  {
    "id": "uuid",
    "patient_id": "uuid",
    "patient": {
      "first_name": "John",
      "last_name": "Doe",
      "medical_record_number": "MRN-12345"
    },
    "appointment_type": "Physical Therapy",
    "appointment_date": "2026-01-09",
    "start_time": "09:00:00",
    "end_time": "10:00:00",
    "status": "scheduled"
  }
]
```

#### Check In Patient

```typescript
async checkInPatient(appointmentId: string)
```

**Example:**
```typescript
await clinicianMobileService.checkInPatient(appointmentId);
```

#### Create Quick Note

```typescript
async createQuickNote(note: {
  clinician_id: string;
  patient_id?: string;
  appointment_id?: string;
  note_type: string;
  note_text: string;
  tags?: string[];
  is_draft: boolean;
})
```

**Example:**
```typescript
await clinicianMobileService.createQuickNote({
  clinician_id: user.id,
  patient_id: patient.id,
  appointment_id: appointment.id,
  note_type: 'clinical',
  note_text: 'Patient showed improvement in range of motion...',
  tags: ['progress', 'rom'],
  is_draft: false
});
```

---

### Operations Service

**File:** `src/services/operationsService.ts`

#### Get Case Aging Data

```typescript
async getCaseAging(clinicId?: string, filters?: {
  status?: string;
  priority?: string;
  ageThreshold?: number;
})
```

**Example:**
```typescript
import { operationsService } from './services/operationsService';

const cases = await operationsService.getCaseAging(
  clinicId,
  { status: 'open', ageThreshold: 7 }
);
```

#### Get Capacity Data

```typescript
async getCapacityData(clinicId: string, dateRange: {
  start: string;
  end: string;
})
```

---

### Launch Service

**File:** `src/services/launchService.ts`

#### Get Launch Projects

```typescript
async getLaunchProjects(filters?: {
  status?: string;
  type?: string;
  limit?: number;
})
```

**Example:**
```typescript
import { launchService } from './services/launchService';

const projects = await launchService.getLaunchProjects({
  status: 'active',
  type: 'partner',
  limit: 10
});
```

#### Update Phase Gate

```typescript
async updatePhaseGate(gateId: string, updates: {
  status?: string;
  completion_percentage?: number;
  notes?: string;
})
```

---

### Financial Service

**File:** `src/services/financialService.ts`

#### Get Revenue Metrics

```typescript
async getRevenueMetrics(filters: {
  clinicId?: string;
  startDate: string;
  endDate: string;
  groupBy?: 'day' | 'week' | 'month';
})
```

**Example:**
```typescript
import { financialService } from './services/financialService';

const metrics = await financialService.getRevenueMetrics({
  clinicId: 'clinic-uuid',
  startDate: '2026-01-01',
  endDate: '2026-01-31',
  groupBy: 'day'
});
```

---

## Edge Functions

### OpenAI Assistant

**Endpoint:** `/functions/v1/openai-assistant`

**Method:** POST

**Purpose:** Process natural language queries and generate intelligent responses.

**Request:**
```typescript
const response = await fetch(
  `${supabaseUrl}/functions/v1/openai-assistant`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messages: [
        {
          role: 'user',
          content: 'Show me revenue for Calgary clinic this month'
        }
      ],
      context: {
        userId: user.id,
        role: user.role
      }
    })
  }
);
```

**Response:**
```json
{
  "response": "Based on the data, Calgary clinic generated $125,450 in revenue this month...",
  "data": {
    "revenue": 125450,
    "clinic": "Calgary",
    "period": "2026-01"
  },
  "suggestions": [
    "View detailed breakdown",
    "Compare to previous month",
    "See top revenue sources"
  ]
}
```

**Error Response:**
```json
{
  "error": "Invalid request",
  "message": "Missing required field: messages"
}
```

---

### Workflow Processor

**Endpoint:** `/functions/v1/workflow-processor`

**Method:** POST

**Purpose:** Execute automated workflow tasks.

**Request:**
```typescript
const response = await fetch(
  `${supabaseUrl}/functions/v1/workflow-processor`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      workflowId: 'workflow-uuid',
      action: 'execute',
      data: {
        caseId: 'case-uuid',
        action: 'escalate'
      }
    })
  }
);
```

**Response:**
```json
{
  "success": true,
  "workflowId": "workflow-uuid",
  "executionId": "execution-uuid",
  "status": "completed",
  "results": {
    "actionsExecuted": 3,
    "notificationsSent": 2
  }
}
```

---

### Setup Demo Users

**Endpoint:** `/functions/v1/setup-demo-users`

**Method:** POST

**Purpose:** Create demo users for testing and training.

**Request:**
```typescript
const response = await fetch(
  `${supabaseUrl}/functions/v1/setup-demo-users`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      environment: 'staging'
    })
  }
);
```

**Response:**
```json
{
  "success": true,
  "usersCreated": 5,
  "users": [
    {
      "email": "sarah.executive@aimrehab.ca",
      "role": "executive",
      "password": "demo-password"
    }
  ]
}
```

---

## Database Direct Access

### Using Supabase Client

**Basic Query:**
```typescript
const { data, error } = await supabase
  .from('patients')
  .select('*')
  .eq('clinic_id', clinicId)
  .order('created_at', { ascending: false });
```

**With Joins:**
```typescript
const { data, error } = await supabase
  .from('patient_appointments')
  .select(`
    *,
    patient:patients(first_name, last_name, medical_record_number),
    clinic:clinics(name, address)
  `)
  .eq('provider_id', providerId)
  .gte('appointment_date', today);
```

**Insert:**
```typescript
const { data, error } = await supabase
  .from('patients')
  .insert({
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@email.com',
    clinic_id: clinicId
  })
  .select()
  .single();
```

**Update:**
```typescript
const { data, error } = await supabase
  .from('patients')
  .update({ status: 'active' })
  .eq('id', patientId)
  .select()
  .single();
```

**Delete:**
```typescript
const { error } = await supabase
  .from('patients')
  .delete()
  .eq('id', patientId);
```

### Real-time Subscriptions

**Subscribe to Changes:**
```typescript
const channel = supabase
  .channel('patient-changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'patients',
      filter: `clinic_id=eq.${clinicId}`
    },
    (payload) => {
      console.log('Change received!', payload);
      // Update UI
    }
  )
  .subscribe();

// Cleanup
channel.unsubscribe();
```

### Using maybeSingle() vs single()

**Recommended: maybeSingle()**
```typescript
// Returns null if no rows, doesn't throw error
const { data, error } = await supabase
  .from('patients')
  .select('*')
  .eq('email', email)
  .maybeSingle();

if (!data) {
  // No patient found
}
```

**Alternative: single()**
```typescript
// Throws error if no rows found
const { data, error } = await supabase
  .from('patients')
  .select('*')
  .eq('email', email)
  .single();

// Must handle error case
if (error) {
  if (error.code === 'PGRST116') {
    // No rows found
  }
}
```

---

## Error Handling

### Error Types

**Authentication Errors:**
```typescript
if (error?.message?.includes('Invalid login credentials')) {
  // Handle invalid credentials
}

if (error?.message?.includes('Email not confirmed')) {
  // Handle unconfirmed email
}
```

**Permission Errors:**
```typescript
if (error?.code === 'PGRST301') {
  // Row level security violation
  console.error('Permission denied');
}
```

**Network Errors:**
```typescript
if (error?.message?.includes('Failed to fetch')) {
  // Network connectivity issue
  console.error('Network error');
}
```

### Standard Error Response

```typescript
interface APIError {
  error: string;
  message: string;
  code?: string;
  details?: any;
}
```

### Error Handling Pattern

```typescript
try {
  const { data, error } = await supabase
    .from('patients')
    .select('*');

  if (error) {
    throw error;
  }

  return data;
} catch (error) {
  console.error('Error fetching patients:', error);

  // Log to error tracking service
  // logError(error);

  // Return user-friendly message
  throw new Error('Unable to load patients. Please try again.');
}
```

---

## Rate Limiting

### Current Limits

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Authentication | 100 requests | 1 hour |
| Database Queries | 1000 requests | 1 minute |
| Edge Functions | 500 requests | 1 minute |
| File Uploads | 100 requests | 1 hour |

### Handling Rate Limits

**Response Headers:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1609459200
```

**Error Response:**
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again later.",
  "retryAfter": 60
}
```

**Retry Logic:**
```typescript
async function fetchWithRetry(fetchFn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await fetchFn();
      return result;
    } catch (error) {
      if (error.status === 429 && i < maxRetries - 1) {
        const retryAfter = error.retryAfter || 1000 * (i + 1);
        await new Promise(resolve => setTimeout(resolve, retryAfter));
        continue;
      }
      throw error;
    }
  }
}
```

---

## Best Practices

### Performance

**1. Use Selective Queries**
```typescript
// ❌ Bad: Select all columns
const { data } = await supabase.from('patients').select('*');

// ✅ Good: Select only needed columns
const { data } = await supabase
  .from('patients')
  .select('id, first_name, last_name, email');
```

**2. Paginate Large Results**
```typescript
const pageSize = 50;
const page = 1;

const { data } = await supabase
  .from('patients')
  .select('*')
  .range((page - 1) * pageSize, page * pageSize - 1);
```

**3. Use Indexes**
```sql
-- Create indexes for frequently queried columns
CREATE INDEX idx_patients_email ON patients(email);
CREATE INDEX idx_appointments_date ON patient_appointments(appointment_date);
```

### Security

**1. Never Expose Service Role Key**
```typescript
// ❌ Bad: Service role in client code
const supabase = createClient(url, serviceRoleKey);

// ✅ Good: Use anon key in client, service role in Edge Functions only
const supabase = createClient(url, anonKey);
```

**2. Validate Input**
```typescript
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

if (!validateEmail(email)) {
  throw new Error('Invalid email format');
}
```

**3. Sanitize User Input**
```typescript
import DOMPurify from 'dompurify';

const sanitizedInput = DOMPurify.sanitize(userInput);
```

### Data Consistency

**1. Use Transactions**
```typescript
// For complex operations, use Edge Functions with transactions
// Example in Edge Function:
const { data, error } = await supabase.rpc('transfer_patient', {
  patient_id: 'uuid',
  from_clinic_id: 'uuid',
  to_clinic_id: 'uuid'
});
```

**2. Handle Race Conditions**
```typescript
// Use optimistic locking with version field
const { data: currentData } = await supabase
  .from('appointments')
  .select('version')
  .eq('id', appointmentId)
  .single();

const { error } = await supabase
  .from('appointments')
  .update({
    status: 'confirmed',
    version: currentData.version + 1
  })
  .eq('id', appointmentId)
  .eq('version', currentData.version);

if (error) {
  // Handle conflict
}
```

### Caching

**1. Client-Side Caching**
```typescript
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getCachedData(key: string, fetchFn: Function) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const data = await fetchFn();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}
```

**2. Use React Query (Recommended)**
```typescript
import { useQuery } from '@tanstack/react-query';

const { data, isLoading, error } = useQuery({
  queryKey: ['patients', clinicId],
  queryFn: () => patientService.getPatients(clinicId),
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

---

## API Reference Summary

### Patient Portal
| Method | Endpoint | Description |
|--------|----------|-------------|
| `getPatientProfile(userId)` | patients | Get patient profile |
| `getAppointments(patientId, filter)` | patient_appointments | Get appointments |
| `getDocuments(patientId, filter)` | patient_documents | Get documents |
| `getMessages(patientId, filter)` | patient_messages | Get messages |
| `sendMessage(message)` | patient_messages | Send message |
| `getTreatmentPlans(patientId)` | patient_treatment_plans | Get treatment plans |

### Clinician Mobile
| Method | Endpoint | Description |
|--------|----------|-------------|
| `getTodaysAppointments(clinicianId)` | patient_appointments | Get today's schedule |
| `checkInPatient(appointmentId)` | patient_appointments | Check in patient |
| `checkOutPatient(appointmentId)` | patient_appointments | Check out patient |
| `createQuickNote(note)` | clinician_quick_notes | Create note |
| `getAvailability(clinicianId)` | clinician_availability | Get availability |

### Operations
| Method | Endpoint | Description |
|--------|----------|-------------|
| `getCaseAging(clinicId, filters)` | case_aging | Get aging cases |
| `getCapacityData(clinicId, dateRange)` | capacity_data | Get capacity metrics |
| `getCredentials(filters)` | credentials | Get credentials |

### Financial
| Method | Endpoint | Description |
|--------|----------|-------------|
| `getRevenueMetrics(filters)` | financial_metrics | Get revenue data |
| `getCashFlow(clinicId, dateRange)` | cash_flow | Get cash flow |

---

**API Version:** 1.0
**Last Updated:** January 2026
**Support:** api-support@aimrehab.ca
