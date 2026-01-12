import { useEffect, useState } from 'react';
import { FileText, Plus, Send, Eye, CheckCircle, Clock, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { formsService, FormTemplate, FormSubmission, FormField, FormFieldResponse } from '../../services/formsService';

type ViewMode = 'list' | 'fill' | 'view-submission' | 'my-submissions';

export default function FormsView() {
  const { profile } = useAuth();
  const [forms, setForms] = useState<FormTemplate[]>([]);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [selectedForm, setSelectedForm] = useState<FormTemplate | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);
  const [formResponses, setFormResponses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');

  const isManager = profile?.role === 'executive' || profile?.role === 'admin' || profile?.role === 'clinic_manager';

  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    try {
      const data = await formsService.getAvailableForms();
      setForms(data);
    } catch (error) {
      console.error('Error loading forms:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMySubmissions = async () => {
    if (!profile?.id) return;

    try {
      const data = isManager
        ? await formsService.getAllSubmissions()
        : await formsService.getMySubmissions(profile.id);
      setSubmissions(data);
      setViewMode('my-submissions');
    } catch (error) {
      console.error('Error loading submissions:', error);
    }
  };

  const startFillForm = async (form: FormTemplate) => {
    try {
      const fullForm = await formsService.getFormById(form.id);
      setSelectedForm(fullForm);
      setFormResponses({});
      setViewMode('fill');
    } catch (error) {
      console.error('Error loading form details:', error);
    }
  };

  const handleFieldChange = (fieldId: string, value: string) => {
    setFormResponses(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const submitForm = async () => {
    if (!selectedForm || !profile?.id) return;

    try {
      const submission = await formsService.createSubmission({
        form_id: selectedForm.id,
        submitted_by: profile.id,
        status: 'draft',
        clinic_id: profile.primary_clinic_id,
        metadata: {}
      });

      for (const field of selectedForm.fields || []) {
        const value = formResponses[field.id];
        if (value) {
          await formsService.saveFieldResponse({
            submission_id: submission.id,
            field_id: field.id,
            field_value: value,
            file_urls: []
          });
        }
      }

      await formsService.submitForm(submission.id);

      alert('Form submitted successfully!');
      setViewMode('list');
      setSelectedForm(null);
      setFormResponses({});
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error submitting form. Please try again.');
    }
  };

  const viewSubmissionDetail = async (submission: FormSubmission) => {
    try {
      const fullSubmission = await formsService.getSubmissionById(submission.id);
      setSelectedSubmission(fullSubmission);
      setViewMode('view-submission');
    } catch (error) {
      console.error('Error loading submission:', error);
    }
  };

  const renderFieldInput = (field: FormField) => {
    const value = formResponses[field.id] || '';

    switch (field.field_type) {
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.is_required}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.is_required}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            required={field.is_required}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        );

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            required={field.is_required}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select an option...</option>
            {field.options.map((option, idx) => (
              <option key={idx} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {field.options.map((option, idx) => (
              <label key={idx} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name={field.id}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  required={field.is_required}
                  className="text-blue-600"
                />
                <span className="text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={value === 'true'}
              onChange={(e) => handleFieldChange(field.id, e.target.checked ? 'true' : 'false')}
              className="text-blue-600"
            />
            <span className="text-gray-700">{field.field_label}</span>
          </label>
        );

      case 'email':
        return (
          <input
            type="email"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.is_required}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        );

      case 'phone':
        return (
          <input
            type="tel"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.is_required}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        );

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.is_required}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (viewMode === 'fill' && selectedForm) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              setViewMode('list');
              setSelectedForm(null);
              setFormResponses({});
            }}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Forms
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{selectedForm.title}</h1>
          {selectedForm.description && (
            <p className="text-gray-600 mb-6">{selectedForm.description}</p>
          )}

          <form onSubmit={(e) => { e.preventDefault(); submitForm(); }} className="space-y-6">
            {selectedForm.fields?.map((field) => (
              <div key={field.id}>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  {field.field_label}
                  {field.is_required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {renderFieldInput(field)}
                {field.help_text && (
                  <p className="mt-1 text-sm text-gray-500">{field.help_text}</p>
                )}
              </div>
            ))}

            <div className="flex space-x-3 pt-6">
              <button
                type="submit"
                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Send className="h-5 w-5 mr-2" />
                Submit Form
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewMode('list');
                  setSelectedForm(null);
                  setFormResponses({});
                }}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (viewMode === 'view-submission' && selectedSubmission) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              setViewMode('my-submissions');
              setSelectedSubmission(null);
            }}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Submissions
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{selectedSubmission.form?.title}</h1>
              <p className="text-gray-600">Submission #{selectedSubmission.submission_number}</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${
              selectedSubmission.status === 'approved'
                ? 'bg-green-100 text-green-800'
                : selectedSubmission.status === 'rejected'
                ? 'bg-red-100 text-red-800'
                : selectedSubmission.status === 'submitted'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {selectedSubmission.status}
            </span>
          </div>

          <div className="space-y-6">
            {selectedSubmission.responses?.map((response) => (
              <div key={response.id} className="pb-4 border-b border-gray-200 last:border-0">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  {response.field?.field_label}
                </label>
                <div className="text-gray-700">
                  {response.field_value || <span className="text-gray-400 italic">No response</span>}
                </div>
              </div>
            ))}
          </div>

          {selectedSubmission.approval_notes && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Review Notes</h3>
              <p className="text-gray-700">{selectedSubmission.approval_notes}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (viewMode === 'my-submissions') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">My Submissions</h1>
          <button
            onClick={() => setViewMode('list')}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Back to Forms
          </button>
        </div>

        {submissions.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {submissions.map((submission) => (
              <div key={submission.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {submission.form?.title || 'Unknown Form'}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Submission #{submission.submission_number}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {submission.submitted_at
                          ? new Date(submission.submitted_at).toLocaleDateString()
                          : 'Draft'}
                      </span>
                      {isManager && submission.submitter && (
                        <span>
                          By: {submission.submitter.first_name} {submission.submitter.last_name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      submission.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : submission.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : submission.status === 'submitted'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {submission.status}
                    </span>
                    <button
                      onClick={() => viewSubmissionDetail(submission)}
                      className="flex items-center px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Submissions Yet</h3>
            <p className="text-gray-600">You haven't submitted any forms yet</p>
          </div>
        )}
      </div>
    );
  }

  const filteredForms = searchQuery
    ? forms.filter(form =>
        form.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        form.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : forms;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Forms</h1>
          <p className="mt-2 text-gray-600">Submit and manage forms</p>
        </div>
        <button
          onClick={loadMySubmissions}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FileText className="h-5 w-5 mr-2" />
          My Submissions
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search forms..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {filteredForms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredForms.map((form) => (
            <div key={form.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                {form.category && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                    {form.category}
                  </span>
                )}
              </div>

              <h3 className="font-semibold text-gray-900 mb-2">{form.title}</h3>
              {form.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{form.description}</p>
              )}

              <button
                onClick={() => startFillForm(form)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Fill Form
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Forms Available</h3>
          <p className="text-gray-600">
            {searchQuery ? 'Try a different search term' : 'No forms are currently available'}
          </p>
        </div>
      )}
    </div>
  );
}
