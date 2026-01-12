import { supabase } from '../lib/supabase';

export interface FormTemplate {
  id: string;
  name: string;
  title: string;
  description?: string;
  category?: string;
  status: 'draft' | 'active' | 'archived';
  icon?: string;
  allows_multiple_submissions: boolean;
  requires_approval: boolean;
  approval_workflow: Array<{ role: string; order: number }>;
  available_for_roles: string[];
  available_for_clinics: string[];
  notification_settings: Record<string, any>;
  created_by: string;
  creator?: any;
  is_public: boolean;
  sort_order: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  fields?: FormField[];
}

export interface FormField {
  id: string;
  form_id: string;
  field_name: string;
  field_label: string;
  field_type: 'text' | 'textarea' | 'number' | 'date' | 'datetime' | 'select' | 'multiselect' | 'radio' | 'checkbox' | 'file_upload' | 'signature' | 'rating' | 'email' | 'phone' | 'url';
  placeholder?: string;
  help_text?: string;
  is_required: boolean;
  validation_rules: Record<string, any>;
  options: Array<{ label: string; value: string }>;
  default_value?: string;
  conditional_logic: Record<string, any>;
  sort_order: number;
  grid_column_span: number;
  created_at: string;
  updated_at: string;
}

export interface FormSubmission {
  id: string;
  form_id: string;
  form?: FormTemplate;
  submitted_by: string;
  submitter?: any;
  submission_number: string;
  status: 'draft' | 'submitted' | 'in_review' | 'approved' | 'rejected';
  submitted_at?: string;
  reviewed_by?: string;
  reviewer?: any;
  reviewed_at?: string;
  approval_notes?: string;
  clinic_id?: string;
  clinic?: any;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  responses?: FormFieldResponse[];
}

export interface FormFieldResponse {
  id: string;
  submission_id: string;
  field_id: string;
  field?: FormField;
  field_value?: string;
  file_urls: Array<{ name: string; url: string }>;
  created_at: string;
  updated_at: string;
}

export const formsService = {
  async getAvailableForms(): Promise<FormTemplate[]> {
    const { data, error } = await supabase
      .from('form_templates')
      .select(`
        *,
        creator:user_profiles(id, first_name, last_name, email)
      `)
      .eq('status', 'active')
      .order('sort_order')
      .order('title');

    if (error) throw error;
    return data || [];
  },

  async getFormById(id: string): Promise<FormTemplate> {
    const { data, error } = await supabase
      .from('form_templates')
      .select(`
        *,
        creator:user_profiles(id, first_name, last_name, email),
        fields:form_fields(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    if (data.fields) {
      data.fields = (data.fields as any[]).sort((a, b) => a.sort_order - b.sort_order);
    }

    return data;
  },

  async createForm(form: Partial<FormTemplate>): Promise<FormTemplate> {
    const { data, error } = await supabase
      .from('form_templates')
      .insert(form)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateForm(id: string, updates: Partial<FormTemplate>): Promise<FormTemplate> {
    const { data, error } = await supabase
      .from('form_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteForm(id: string): Promise<void> {
    const { error } = await supabase
      .from('form_templates')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getFormFields(formId: string): Promise<FormField[]> {
    const { data, error } = await supabase
      .from('form_fields')
      .select('*')
      .eq('form_id', formId)
      .order('sort_order');

    if (error) throw error;
    return data || [];
  },

  async createField(field: Partial<FormField>): Promise<FormField> {
    const { data, error } = await supabase
      .from('form_fields')
      .insert(field)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateField(id: string, updates: Partial<FormField>): Promise<FormField> {
    const { data, error } = await supabase
      .from('form_fields')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteField(id: string): Promise<void> {
    const { error } = await supabase
      .from('form_fields')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getMySubmissions(userId: string): Promise<FormSubmission[]> {
    const { data, error } = await supabase
      .from('form_submissions')
      .select(`
        *,
        form:form_templates(id, title, category),
        submitter:user_profiles!form_submissions_submitted_by_fkey(id, first_name, last_name, email),
        clinic:clinics(id, name, code)
      `)
      .eq('submitted_by', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getAllSubmissions(): Promise<FormSubmission[]> {
    const { data, error } = await supabase
      .from('form_submissions')
      .select(`
        *,
        form:form_templates(id, title, category),
        submitter:user_profiles!form_submissions_submitted_by_fkey(id, first_name, last_name, email),
        clinic:clinics(id, name, code)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getSubmissionById(id: string): Promise<FormSubmission> {
    const { data, error } = await supabase
      .from('form_submissions')
      .select(`
        *,
        form:form_templates(*),
        submitter:user_profiles!form_submissions_submitted_by_fkey(id, first_name, last_name, email),
        reviewer:user_profiles!form_submissions_reviewed_by_fkey(id, first_name, last_name, email),
        clinic:clinics(id, name, code),
        responses:form_field_responses(
          *,
          field:form_fields(*)
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async createSubmission(submission: Partial<FormSubmission>): Promise<FormSubmission> {
    const submissionNumber = `FORM-${Date.now()}`;
    const { data, error } = await supabase
      .from('form_submissions')
      .insert({ ...submission, submission_number: submissionNumber })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateSubmission(id: string, updates: Partial<FormSubmission>): Promise<FormSubmission> {
    const { data, error } = await supabase
      .from('form_submissions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async submitForm(id: string): Promise<FormSubmission> {
    const { data, error } = await supabase
      .from('form_submissions')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async saveFieldResponse(response: Partial<FormFieldResponse>): Promise<FormFieldResponse> {
    const { data, error } = await supabase
      .from('form_field_responses')
      .upsert(response)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getSubmissionResponses(submissionId: string): Promise<FormFieldResponse[]> {
    const { data, error } = await supabase
      .from('form_field_responses')
      .select(`
        *,
        field:form_fields(*)
      `)
      .eq('submission_id', submissionId)
      .order('created_at');

    if (error) throw error;
    return data || [];
  },

  async approveSubmission(id: string, reviewerId: string, notes?: string): Promise<FormSubmission> {
    const { data, error } = await supabase
      .from('form_submissions')
      .update({
        status: 'approved',
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
        approval_notes: notes
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async rejectSubmission(id: string, reviewerId: string, notes: string): Promise<FormSubmission> {
    const { data, error } = await supabase
      .from('form_submissions')
      .update({
        status: 'rejected',
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
        approval_notes: notes
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
