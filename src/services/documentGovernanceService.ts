import { supabase } from '../lib/supabase';

export interface Document {
  id: string;
  document_code: string;
  title: string;
  document_type?: string;
  category?: string;
  description?: string;
  is_official?: boolean;
  is_critical?: boolean;
  current_version_id?: string;
  owner_id?: string;
  review_frequency_days?: number;
  next_review_date?: string;
  last_review_date?: string;
  expiry_date?: string;
  status?: string;
  tags?: string[];
  attestation_required?: boolean;
  read_receipt_required?: boolean;
  confidentiality_level?: 'public' | 'internal' | 'confidential' | 'restricted';
  ip_sensitive?: boolean;
  regulatory_reference?: string;
  review_cycle_status?: 'on_schedule' | 'upcoming' | 'overdue';
  created_at: string;
  updated_at: string;
}

export interface DocumentVersion {
  id: string;
  document_id?: string;
  version_number: string;
  file_url?: string;
  file_name?: string;
  file_size_bytes?: number;
  content_hash?: string;
  change_summary?: string;
  is_current?: boolean;
  published_by?: string;
  published_at?: string;
  approval_required?: boolean;
  approved_by?: string;
  approved_at?: string;
  retirement_date?: string;
  superseded_by?: string;
  created_at: string;
}

export interface DocumentAttestation {
  id: string;
  document_id?: string;
  version_id?: string;
  user_id?: string;
  attested_at?: string;
  attestation_type?: string;
  ip_address?: string;
  user_agent?: string;
  attestation_notes?: string;
  is_valid?: boolean;
  expires_at?: string;
}

export interface DocumentReadReceipt {
  id: string;
  document_id: string;
  version_id?: string;
  user_id: string;
  read_at?: string;
  confirmed_understanding?: boolean;
  time_spent_seconds?: number;
  completion_percentage?: number;
  ip_address?: string;
  user_agent?: string;
  attestation_id?: string;
}

export interface DocumentAccessLog {
  id: string;
  document_id?: string;
  version_id?: string;
  user_id?: string;
  action?: string;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  duration_seconds?: number;
  completion_percentage?: number;
  accessed_at?: string;
}

export interface DocumentReviewSchedule {
  id: string;
  document_id: string;
  scheduled_date: string;
  reviewer_id?: string;
  review_type?: 'routine' | 'regulatory' | 'incident_driven' | 'version_update';
  status?: 'pending' | 'in_progress' | 'completed' | 'skipped';
  completed_at?: string;
  completed_by?: string;
  review_notes?: string;
  outcome?: 'approved' | 'revised' | 'retired' | 'no_changes';
  next_review_date?: string;
  created_at: string;
  updated_at: string;
}

export interface GovernanceDashboard {
  overview: {
    total_documents: number;
    official_documents: number;
    ip_sensitive_documents: number;
    overdue_reviews: number;
    pending_attestations: number;
    version_drift_alerts: number;
  };
  critical_documents: Document[];
  overdue_reviews: DocumentReviewSchedule[];
  pending_attestations: {
    document: Document;
    user_count: number;
    deadline?: string;
  }[];
  recent_versions: EnhancedDocumentVersion[];
  access_statistics: AccessStatistic[];
}

export interface EnhancedDocumentVersion extends DocumentVersion {
  document?: Document;
  publisher_name?: string;
  approver_name?: string;
}

export interface AccessStatistic {
  document_id: string;
  document_title: string;
  total_views: number;
  unique_users: number;
  avg_completion: number;
  last_accessed: string;
}

export async function getGovernanceDashboard(): Promise<GovernanceDashboard> {
  const [documents, reviews, attestations, versions, accessLogs] = await Promise.all([
    getDocuments(),
    getReviewSchedules(),
    getAttestations(),
    getDocumentVersions(),
    getAccessLogs(),
  ]);

  const officialDocs = documents.filter(d => d.is_official);
  const ipSensitiveDocs = documents.filter(d => d.ip_sensitive);
  const overdueReviews = reviews.filter(r =>
    r.status === 'pending' && new Date(r.scheduled_date) < new Date()
  );

  const criticalDocs = documents
    .filter(d => d.is_critical || d.review_cycle_status === 'overdue')
    .slice(0, 10);

  return {
    overview: {
      total_documents: documents.length,
      official_documents: officialDocs.length,
      ip_sensitive_documents: ipSensitiveDocs.length,
      overdue_reviews: overdueReviews.length,
      pending_attestations: 0,
      version_drift_alerts: 0,
    },
    critical_documents: criticalDocs,
    overdue_reviews: overdueReviews.slice(0, 10),
    pending_attestations: [],
    recent_versions: versions.slice(0, 10) as EnhancedDocumentVersion[],
    access_statistics: generateAccessStatistics(documents, accessLogs),
  };
}

function generateAccessStatistics(documents: Document[], logs: DocumentAccessLog[]): AccessStatistic[] {
  const stats: Map<string, AccessStatistic> = new Map();

  documents.forEach(doc => {
    const docLogs = logs.filter(l => l.document_id === doc.id);
    const uniqueUsers = new Set(docLogs.map(l => l.user_id)).size;
    const avgCompletion = docLogs.length > 0
      ? docLogs.reduce((sum, l) => sum + (l.completion_percentage || 0), 0) / docLogs.length
      : 0;
    const lastAccessed = docLogs.length > 0
      ? docLogs.sort((a, b) => new Date(b.accessed_at || '').getTime() - new Date(a.accessed_at || '').getTime())[0].accessed_at || ''
      : '';

    if (docLogs.length > 0) {
      stats.set(doc.id, {
        document_id: doc.id,
        document_title: doc.title,
        total_views: docLogs.length,
        unique_users: uniqueUsers,
        avg_completion: Math.round(avgCompletion),
        last_accessed: lastAccessed,
      });
    }
  });

  return Array.from(stats.values()).sort((a, b) => b.total_views - a.total_views).slice(0, 10);
}

async function getDocuments(): Promise<Document[]> {
  const { data, error } = await supabase
    .from('document_library')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) return generateMockDocuments();
  return data as Document[];
}

async function getDocumentVersions(): Promise<DocumentVersion[]> {
  const { data, error } = await supabase
    .from('document_versions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return [];
  return data as DocumentVersion[];
}

async function getAttestations(): Promise<DocumentAttestation[]> {
  const { data, error } = await supabase
    .from('document_attestations')
    .select('*')
    .eq('is_valid', true)
    .order('attested_at', { ascending: false })
    .limit(100);

  if (error) return [];
  return data as DocumentAttestation[];
}

async function getReviewSchedules(): Promise<DocumentReviewSchedule[]> {
  const { data, error } = await supabase
    .from('document_review_schedule')
    .select('*')
    .order('scheduled_date')
    .limit(100);

  if (error) return generateMockReviewSchedules();
  return data as DocumentReviewSchedule[];
}

async function getAccessLogs(): Promise<DocumentAccessLog[]> {
  const { data, error } = await supabase
    .from('document_access_logs')
    .select('*')
    .order('accessed_at', { ascending: false })
    .limit(500);

  if (error) return [];
  return data as DocumentAccessLog[];
}

function generateMockDocuments(): Document[] {
  return [
    {
      id: 'doc-1',
      document_code: 'SOP-001',
      title: 'Standard Operating Procedure - Patient Intake',
      document_type: 'SOP',
      category: 'Clinical',
      description: 'Official SOP for patient intake and registration process',
      is_official: true,
      is_critical: true,
      attestation_required: true,
      read_receipt_required: true,
      confidentiality_level: 'internal',
      ip_sensitive: false,
      regulatory_reference: 'HIPAA, State Requirements',
      review_frequency_days: 365,
      next_review_date: '2025-06-01',
      last_review_date: '2024-06-01',
      review_cycle_status: 'on_schedule',
      status: 'active',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-06-01T14:00:00Z',
    },
    {
      id: 'doc-2',
      document_code: 'IP-PROP-001',
      title: 'Proprietary Treatment Protocol - Advanced Care',
      document_type: 'Protocol',
      category: 'Clinical',
      description: 'Proprietary clinical protocol - Trade Secret',
      is_official: true,
      is_critical: true,
      attestation_required: true,
      read_receipt_required: true,
      confidentiality_level: 'restricted',
      ip_sensitive: true,
      regulatory_reference: 'Trade Secret Protection',
      review_frequency_days: 180,
      next_review_date: '2025-01-15',
      last_review_date: '2024-07-15',
      review_cycle_status: 'on_schedule',
      status: 'active',
      created_at: '2024-01-10T09:00:00Z',
      updated_at: '2024-07-15T11:00:00Z',
    },
    {
      id: 'doc-3',
      document_code: 'POLICY-HR-001',
      title: 'Employee Handbook',
      document_type: 'Policy',
      category: 'Human Resources',
      description: 'Official employee handbook - requires annual attestation',
      is_official: true,
      is_critical: false,
      attestation_required: true,
      read_receipt_required: true,
      confidentiality_level: 'internal',
      ip_sensitive: false,
      regulatory_reference: 'Employment Law',
      review_frequency_days: 365,
      next_review_date: '2024-12-01',
      last_review_date: '2023-12-01',
      review_cycle_status: 'overdue',
      status: 'active',
      created_at: '2023-12-01T10:00:00Z',
      updated_at: '2023-12-01T10:00:00Z',
    },
  ];
}

function generateMockReviewSchedules(): DocumentReviewSchedule[] {
  return [
    {
      id: 'review-1',
      document_id: 'doc-3',
      scheduled_date: '2024-12-01',
      review_type: 'routine',
      status: 'pending',
      created_at: '2024-06-01T10:00:00Z',
      updated_at: '2024-06-01T10:00:00Z',
    },
  ];
}

export async function getDocumentById(id: string): Promise<Document | null> {
  const { data, error } = await supabase
    .from('document_library')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data as Document | null;
}

export async function getDocumentVersionsByDocId(docId: string): Promise<DocumentVersion[]> {
  const { data, error } = await supabase
    .from('document_versions')
    .select('*')
    .eq('document_id', docId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as DocumentVersion[];
}

export async function createDocument(doc: Omit<Document, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('document_library')
    .insert([doc])
    .select()
    .single();

  if (error) throw error;
  return data as Document;
}

export async function updateDocument(id: string, updates: Partial<Document>) {
  const { data, error } = await supabase
    .from('document_library')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Document;
}

export async function createDocumentVersion(version: Omit<DocumentVersion, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('document_versions')
    .insert([version])
    .select()
    .single();

  if (error) throw error;
  return data as DocumentVersion;
}

export async function createAttestation(attestation: Omit<DocumentAttestation, 'id'>) {
  const { data, error } = await supabase
    .from('document_attestations')
    .insert([attestation])
    .select()
    .single();

  if (error) throw error;
  return data as DocumentAttestation;
}

export async function createReadReceipt(receipt: Omit<DocumentReadReceipt, 'id'>) {
  const { data, error } = await supabase
    .from('document_read_receipts')
    .insert([receipt])
    .select()
    .single();

  if (error) throw error;
  return data as DocumentReadReceipt;
}

export async function logDocumentAccess(log: Omit<DocumentAccessLog, 'id'>) {
  const { data, error } = await supabase
    .from('document_access_logs')
    .insert([log])
    .select()
    .single();

  if (error) throw error;
  return data as DocumentAccessLog;
}

export async function createReviewSchedule(schedule: Omit<DocumentReviewSchedule, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('document_review_schedule')
    .insert([schedule])
    .select()
    .single();

  if (error) throw error;
  return data as DocumentReviewSchedule;
}

export async function updateReviewSchedule(id: string, updates: Partial<DocumentReviewSchedule>) {
  const { data, error } = await supabase
    .from('document_review_schedule')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as DocumentReviewSchedule;
}

export async function getAttestationsByUser(userId: string): Promise<DocumentAttestation[]> {
  const { data, error } = await supabase
    .from('document_attestations')
    .select('*')
    .eq('user_id', userId)
    .eq('is_valid', true)
    .order('attested_at', { ascending: false });

  if (error) throw error;
  return data as DocumentAttestation[];
}

export async function getReadReceiptsByUser(userId: string): Promise<DocumentReadReceipt[]> {
  const { data, error } = await supabase
    .from('document_read_receipts')
    .select('*')
    .eq('user_id', userId)
    .order('read_at', { ascending: false });

  if (error) throw error;
  return data as DocumentReadReceipt[];
}

export async function getUserDocumentCompliance(userId: string): Promise<{
  required_attestations: number;
  completed_attestations: number;
  required_read_receipts: number;
  completed_read_receipts: number;
  overdue_count: number;
}> {
  const [documents, attestations, receipts] = await Promise.all([
    getDocuments(),
    getAttestationsByUser(userId),
    getReadReceiptsByUser(userId),
  ]);

  const requiredAttestations = documents.filter(d => d.attestation_required);
  const requiredReadReceipts = documents.filter(d => d.read_receipt_required);

  return {
    required_attestations: requiredAttestations.length,
    completed_attestations: attestations.length,
    required_read_receipts: requiredReadReceipts.length,
    completed_read_receipts: receipts.length,
    overdue_count: 0,
  };
}
