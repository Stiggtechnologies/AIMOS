import React, { useState } from 'react';
import { Upload, FileJson, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface ImportResult {
  success: boolean;
  message?: string;
  error?: string;
  clinic_id?: string;
  period?: string;
  total_revenue?: number;
  service_lines_imported?: number;
}

export default function RevenueReportImport() {
  const [jsonInput, setJsonInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setJsonInput(content);
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setResult(null);

    try {
      const jsonData = JSON.parse(jsonInput);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/import-revenue-report`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(jsonData),
        }
      );

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Invalid JSON format',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSampleData = () => {
    const sample = {
      report_metadata: {
        period_start: "2026-02-01",
        period_end: "2026-02-28",
        clinic_name: "Alberta Injury Management Inc.",
        clinic_city: "Edmonton"
      },
      overall_metrics: {
        total_revenue: 15500.00,
        total_visits: 130,
        total_items: 8,
        total_hours: 20.5,
        unique_clients: 58,
        operating_margin_percent: 66.0
      },
      payer_mix: {
        wsib_percent: 6.0,
        private_insurance_percent: 65.0,
        mva_percent: 15.0,
        patient_direct_percent: 14.0
      },
      service_lines: [
        {
          service_line: "Physical Therapy",
          service_category: "Clinical",
          total_revenue: 8500.00,
          revenue_percent: 54.84,
          total_visits: 72,
          billable_hours: 11.0,
          direct_costs: 3200.00,
          allocated_overhead: 1050.00,
          gross_margin_percent: 62.4,
          contribution_margin_percent: 59.0,
          capacity_utilization_percent: 85.0,
          growth_rate_percent: 5.5,
          trend_direction: "growing",
          performance_tier: "star",
          strategic_priority: "maintain"
        },
        {
          service_line: "Manual Osteopathy",
          service_category: "Clinical",
          total_revenue: 2200.00,
          revenue_percent: 14.19,
          total_visits: 17,
          billable_hours: 4.5,
          direct_costs: 700.00,
          allocated_overhead: 180.00,
          gross_margin_percent: 68.2,
          contribution_margin_percent: 66.0,
          capacity_utilization_percent: 67.0,
          growth_rate_percent: 2.3,
          trend_direction: "stable",
          performance_tier: "cash_cow",
          strategic_priority: "maintain"
        }
      ]
    };
    setJsonInput(JSON.stringify(sample, null, 2));
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Revenue Report Import</h2>
          <p className="text-sm text-gray-600 mt-1">
            Upload your weekly revenue report in JSON format for instant processing
          </p>
        </div>
        <FileJson className="h-8 w-8 text-blue-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload JSON File or Paste Data
            </label>
            <div className="flex gap-2 mb-3">
              <label className="flex-1 cursor-pointer">
                <div className="flex items-center justify-center px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors">
                  <Upload className="h-5 w-5 mr-2 text-gray-400" />
                  <span className="text-sm text-gray-600">Upload JSON File</span>
                </div>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <button
                onClick={loadSampleData}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                Load Sample
              </button>
            </div>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='Paste your JSON data here or upload a file...'
              className="w-full h-96 p-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !jsonInput.trim()}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              loading || !jsonInput.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {loading ? 'Importing...' : 'Import Report'}
          </button>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Import Result</h3>
          {result ? (
            <div
              className={`p-4 rounded-lg border-2 ${
                result.success
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-start">
                {result.success ? (
                  <CheckCircle className="h-6 w-6 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <h4
                    className={`font-semibold mb-2 ${
                      result.success ? 'text-green-900' : 'text-red-900'
                    }`}
                  >
                    {result.success ? 'Import Successful' : 'Import Failed'}
                  </h4>
                  {result.success ? (
                    <div className="text-sm text-green-800 space-y-1">
                      <p>{result.message}</p>
                      {result.period && <p className="font-medium">Period: {result.period}</p>}
                      {result.total_revenue && (
                        <p className="font-medium">
                          Total Revenue: ${result.total_revenue.toLocaleString()}
                        </p>
                      )}
                      {result.service_lines_imported && (
                        <p>Service Lines: {result.service_lines_imported}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-red-800">{result.error}</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">
                Submit your report to see the import results here
              </p>
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2 text-sm">Quick Reference</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• See REVENUE_IMPORT_SCHEMA.md for full schema</li>
              <li>• Required: report_metadata, overall_metrics, service_lines</li>
              <li>• Auto-calculates: revenue_per_visit, revenue_per_hour</li>
              <li>• Supports partial data - missing fields are auto-filled</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h4 className="font-semibold text-yellow-900 mb-2 text-sm">Valid Enum Values</h4>
            <div className="text-xs text-yellow-800 space-y-1">
              <p><strong>trend_direction:</strong> growing, stable, declining</p>
              <p><strong>performance_tier:</strong> star, cash_cow, question_mark, dog</p>
              <p><strong>strategic_priority:</strong> expand, maintain, optimize, discontinue</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
