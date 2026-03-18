import { supabase } from '../lib/supabase';

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv' | 'json';
  filename: string;
  title?: string;
  subtitle?: string;
  columns?: { key: string; label: string; width?: number }[];
  orientation?: 'portrait' | 'landscape';
  includeTimestamp?: boolean;
}

export interface ExportJob {
  id: string;
  user_id: string;
  export_type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  file_url?: string;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

const EXCEL_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const PDF_MIME = 'application/pdf';

function escapeCSV(value: any): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatValue(value: any): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (value instanceof Date) return value.toLocaleDateString();
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function generateCSV(data: any[], columns?: { key: string; label: string }[]): string {
  if (!data || data.length === 0) return '';

  const headers = columns ? columns.map(c => c.label) : Object.keys(data[0]);
  const keys = columns ? columns.map(c => c.key) : Object.keys(data[0]);

  const csvRows = [
    headers.map(h => escapeCSV(h)).join(','),
    ...data.map(row =>
      keys.map(key => escapeCSV(formatValue(row[key]))).join(',')
    )
  ];

  return csvRows.join('\n');
}

function generateExcelXML(data: any[], options: ExportOptions): string {
  const columns = options.columns || Object.keys(data[0] || {}).map(key => ({ key, label: key }));
  const timestamp = options.includeTimestamp ? new Date().toLocaleString() : '';

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<?mso-application progid="Excel.Sheet"?>\n';
  xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n';
  xml += '  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n';

  xml += '<Styles>\n';
  xml += '  <Style ss:ID="header"><Font ss:Bold="1" ss:Size="12"/><Interior ss:Color="#E8E8E8" ss:Pattern="Solid"/></Style>\n';
  xml += '  <Style ss:ID="title"><Font ss:Bold="1" ss:Size="16"/></Style>\n';
  xml += '  <Style ss:ID="subtitle"><Font ss:Size="11" ss:Color="#666666"/></Style>\n';
  xml += '  <Style ss:ID="number"><NumberFormat ss:Format="#,##0.00"/></Style>\n';
  xml += '  <Style ss:ID="currency"><NumberFormat ss:Format="$#,##0.00"/></Style>\n';
  xml += '  <Style ss:ID="percent"><NumberFormat ss:Format="0.0%"/></Style>\n';
  xml += '  <Style ss:ID="date"><NumberFormat ss:Format="yyyy-mm-dd"/></Style>\n';
  xml += '</Styles>\n';

  xml += `<Worksheet ss:Name="${options.title || 'Data'}">\n`;
  xml += '<Table>\n';

  columns.forEach((_, idx) => {
    xml += `  <Column ss:Index="${idx + 1}" ss:Width="${columns[idx]?.width || 120}"/>\n`;
  });

  if (options.title) {
    xml += '  <Row>\n';
    xml += `    <Cell ss:StyleID="title" ss:MergeAcross="${columns.length - 1}"><Data ss:Type="String">${options.title}</Data></Cell>\n`;
    xml += '  </Row>\n';
  }

  if (options.subtitle || timestamp) {
    xml += '  <Row>\n';
    xml += `    <Cell ss:StyleID="subtitle" ss:MergeAcross="${columns.length - 1}"><Data ss:Type="String">${options.subtitle || ''} ${timestamp ? `(Generated: ${timestamp})` : ''}</Data></Cell>\n`;
    xml += '  </Row>\n';
    xml += '  <Row></Row>\n';
  }

  xml += '  <Row>\n';
  columns.forEach(col => {
    xml += `    <Cell ss:StyleID="header"><Data ss:Type="String">${col.label}</Data></Cell>\n`;
  });
  xml += '  </Row>\n';

  data.forEach(row => {
    xml += '  <Row>\n';
    columns.forEach(col => {
      const value = row[col.key];
      let type = 'String';
      let style = '';
      let formattedValue = formatValue(value);

      if (typeof value === 'number') {
        type = 'Number';
        if (col.key.toLowerCase().includes('percent') || col.key.toLowerCase().includes('rate')) {
          style = ' ss:StyleID="percent"';
        } else if (col.key.toLowerCase().includes('amount') || col.key.toLowerCase().includes('revenue') || col.key.toLowerCase().includes('cost')) {
          style = ' ss:StyleID="currency"';
        } else {
          style = ' ss:StyleID="number"';
        }
        formattedValue = String(value);
      } else if (value instanceof Date || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value))) {
        style = ' ss:StyleID="date"';
      }

      xml += `    <Cell${style}><Data ss:Type="${type}">${formattedValue}</Data></Cell>\n`;
    });
    xml += '  </Row>\n';
  });

  xml += '</Table>\n';
  xml += '</Worksheet>\n';
  xml += '</Workbook>';

  return xml;
}

function generatePDFHTML(data: any[], options: ExportOptions): string {
  const columns = options.columns || Object.keys(data[0] || {}).map(key => ({ key, label: key }));
  const timestamp = options.includeTimestamp ? new Date().toLocaleString() : '';
  const isLandscape = options.orientation === 'landscape';

  let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${options.title || 'Export'}</title>
  <style>
    @page { size: ${isLandscape ? 'landscape' : 'portrait'}; margin: 1cm; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; color: #333; }
    .header { margin-bottom: 20px; border-bottom: 2px solid #2563eb; padding-bottom: 15px; }
    .title { font-size: 24px; font-weight: bold; color: #1e40af; margin: 0; }
    .subtitle { font-size: 14px; color: #6b7280; margin-top: 5px; }
    .timestamp { font-size: 12px; color: #9ca3af; margin-top: 8px; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px; }
    th { background: #1e40af; color: white; padding: 10px 8px; text-align: left; font-weight: 600; }
    td { padding: 8px; border-bottom: 1px solid #e5e7eb; }
    tr:nth-child(even) { background: #f9fafb; }
    tr:hover { background: #f3f4f6; }
    .number { text-align: right; font-variant-numeric: tabular-nums; }
    .footer { margin-top: 20px; padding-top: 15px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #9ca3af; }
    .summary { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px; padding: 12px; margin-bottom: 15px; }
    .summary-label { font-weight: 600; color: #0369a1; }
  </style>
</head>
<body>
  <div class="header">
    <h1 class="title">${options.title || 'Data Export'}</h1>
    ${options.subtitle ? `<p class="subtitle">${options.subtitle}</p>` : ''}
    ${timestamp ? `<p class="timestamp">Generated: ${timestamp}</p>` : ''}
  </div>

  <div class="summary">
    <span class="summary-label">Total Records:</span> ${data.length}
  </div>

  <table>
    <thead>
      <tr>
        ${columns.map(col => `<th>${col.label}</th>`).join('\n        ')}
      </tr>
    </thead>
    <tbody>
      ${data.map(row => `
      <tr>
        ${columns.map(col => {
          const value = row[col.key];
          const isNumber = typeof value === 'number';
          return `<td class="${isNumber ? 'number' : ''}">${formatValue(value)}</td>`;
        }).join('\n        ')}
      </tr>`).join('')}
    </tbody>
  </table>

  <div class="footer">
    AIM OS - Confidential Report | Page 1
  </div>
</body>
</html>`;

  return html;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const exportService = {
  async exportToCSV(data: any[], options: Omit<ExportOptions, 'format'>): Promise<void> {
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }

    const csv = generateCSV(data, options.columns);
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const filename = options.includeTimestamp
      ? `${options.filename}_${new Date().toISOString().split('T')[0]}.csv`
      : `${options.filename}.csv`;

    downloadBlob(blob, filename);
    await this.logExport('csv', options.filename, data.length);
  },

  async exportToExcel(data: any[], options: Omit<ExportOptions, 'format'>): Promise<void> {
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }

    const xml = generateExcelXML(data, { ...options, format: 'excel' });
    const blob = new Blob([xml], { type: EXCEL_MIME });
    const filename = options.includeTimestamp
      ? `${options.filename}_${new Date().toISOString().split('T')[0]}.xls`
      : `${options.filename}.xls`;

    downloadBlob(blob, filename);
    await this.logExport('excel', options.filename, data.length);
  },

  async exportToPDF(data: any[], options: Omit<ExportOptions, 'format'>): Promise<void> {
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }

    const html = generatePDFHTML(data, { ...options, format: 'pdf' });
    const printWindow = window.open('', '_blank');

    if (!printWindow) {
      throw new Error('Could not open print window. Please allow popups for this site.');
    }

    printWindow.document.write(html);
    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };

    await this.logExport('pdf', options.filename, data.length);
  },

  async exportToJSON(data: any[], options: Omit<ExportOptions, 'format'>): Promise<void> {
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }

    const exportData = {
      metadata: {
        title: options.title,
        subtitle: options.subtitle,
        exportedAt: new Date().toISOString(),
        recordCount: data.length
      },
      data
    };

    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const filename = options.includeTimestamp
      ? `${options.filename}_${new Date().toISOString().split('T')[0]}.json`
      : `${options.filename}.json`;

    downloadBlob(blob, filename);
    await this.logExport('json', options.filename, data.length);
  },

  async export(data: any[], options: ExportOptions): Promise<void> {
    switch (options.format) {
      case 'csv':
        return this.exportToCSV(data, options);
      case 'excel':
        return this.exportToExcel(data, options);
      case 'pdf':
        return this.exportToPDF(data, options);
      case 'json':
        return this.exportToJSON(data, options);
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  },

  async logExport(format: string, filename: string, rowCount: number): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('audit_events').insert({
        user_id: user.id,
        action: 'export',
        table_name: 'exports',
        metadata: {
          format,
          filename,
          row_count: rowCount,
          exported_at: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to log export:', error);
    }
  },

  async getExportHistory(limit: number = 50): Promise<ExportJob[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('audit_events')
      .select('*')
      .eq('user_id', user.id)
      .eq('action', 'export')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map(event => ({
      id: event.id,
      user_id: event.user_id,
      export_type: event.metadata?.format || 'unknown',
      status: 'completed' as const,
      file_url: undefined,
      created_at: event.created_at,
      completed_at: event.created_at
    }));
  },

  generateReportColumns(reportType: string): { key: string; label: string; width?: number }[] {
    const columnSets: Record<string, { key: string; label: string; width?: number }[]> = {
      clinic_performance: [
        { key: 'clinic_name', label: 'Clinic', width: 150 },
        { key: 'total_visits', label: 'Total Visits', width: 100 },
        { key: 'revenue', label: 'Revenue', width: 120 },
        { key: 'utilization_rate', label: 'Utilization %', width: 100 },
        { key: 'nps_score', label: 'NPS', width: 80 },
        { key: 'avg_wait_time', label: 'Avg Wait (min)', width: 100 }
      ],
      staff_credentials: [
        { key: 'staff_name', label: 'Staff Member', width: 150 },
        { key: 'credential_type', label: 'Credential Type', width: 150 },
        { key: 'status', label: 'Status', width: 100 },
        { key: 'expiry_date', label: 'Expiry Date', width: 100 },
        { key: 'days_until_expiry', label: 'Days Remaining', width: 100 }
      ],
      financial_summary: [
        { key: 'period', label: 'Period', width: 120 },
        { key: 'gross_revenue', label: 'Gross Revenue', width: 120 },
        { key: 'adjustments', label: 'Adjustments', width: 120 },
        { key: 'net_revenue', label: 'Net Revenue', width: 120 },
        { key: 'ar_outstanding', label: 'AR Outstanding', width: 120 },
        { key: 'collection_rate', label: 'Collection Rate', width: 100 }
      ],
      patient_outcomes: [
        { key: 'patient_id', label: 'Patient ID', width: 100 },
        { key: 'diagnosis', label: 'Diagnosis', width: 150 },
        { key: 'treatment_type', label: 'Treatment', width: 150 },
        { key: 'start_date', label: 'Start Date', width: 100 },
        { key: 'outcome_score', label: 'Outcome Score', width: 100 },
        { key: 'improvement_pct', label: 'Improvement %', width: 100 }
      ],
      audit_log: [
        { key: 'timestamp', label: 'Timestamp', width: 150 },
        { key: 'user_email', label: 'User', width: 180 },
        { key: 'action', label: 'Action', width: 100 },
        { key: 'table_name', label: 'Resource', width: 120 },
        { key: 'description', label: 'Description', width: 250 }
      ]
    };

    return columnSets[reportType] || [];
  }
};
