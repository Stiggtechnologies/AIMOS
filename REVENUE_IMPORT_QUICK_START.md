# Revenue Report Import - Quick Start Guide

## 🚀 What's New?

You now have a **fully automated weekly revenue import system** that processes your reports in **under 30 seconds** for pennies.

## 📍 How to Access

1. Log into the application
2. Click **"Revenue Import"** in the left sidebar (below Operations)
3. Or navigate directly to the Revenue Import view

## 📊 How to Import Your Weekly Report

### Option 1: Copy & Paste (Fastest)
1. Convert your weekly revenue report to the JSON format (see below)
2. Paste into the text area
3. Click "Import Report"
4. Done! ✓

### Option 2: File Upload
1. Save your report as a `.json` file
2. Click "Upload JSON File"
3. Select your file
4. Click "Import Report"
5. Done! ✓

### Option 3: Sample Data
Click "Load Sample" to see what the format looks like and test the system.

## 📝 JSON Format (Simplified)

Here's the minimum you need for a basic import:

```json
{
  "report_metadata": {
    "period_start": "2026-02-01",
    "period_end": "2026-02-28",
    "clinic_name": "Alberta Injury Management Inc.",
    "clinic_city": "Edmonton"
  },
  "overall_metrics": {
    "total_revenue": 15500.00,
    "total_visits": 130,
    "unique_clients": 58
  },
  "payer_mix": {
    "wsib_percent": 6.0,
    "private_insurance_percent": 65.0
  },
  "service_lines": [
    {
      "service_line": "Physical Therapy",
      "service_category": "Clinical",
      "total_revenue": 8500.00,
      "total_visits": 72
    },
    {
      "service_line": "Manual Osteopathy",
      "service_category": "Clinical",
      "total_revenue": 2200.00,
      "total_visits": 17
    }
  ]
}
```

## 🤖 Auto-Calculations

The system automatically calculates:
- Revenue per visit (total_revenue ÷ total_visits)
- Revenue per hour (if hours provided)
- Missing payer percentages (fills to 100%)
- Average visits per day
- Service line breakdowns

## 📋 Converting Your PDF Report

From your current PDF format, extract these key numbers:

**From the Summary Section:**
- Period dates (start & end)
- Total revenue
- Total visits
- Unique clients

**From Payer Mix:**
- WSIB %
- Private Insurance %
- MVA %
- Patient Direct Pay %

**From Service Lines (each one):**
- Service name (e.g., "Physical Therapy")
- Total revenue
- Number of visits
- (Optional) billable hours, costs, margins, etc.

## ✅ What Gets Updated?

Each import creates records in:
1. **clinic_financial_metrics** - Overall clinic performance
2. **service_line_performance** - Individual service breakdowns

These automatically appear in:
- Financial dashboards
- Service line analytics
- Executive reports
- Trend analysis charts

## 🎯 Valid Values Reference

**Service Categories:**
- `Clinical` - All therapy services
- `Products` - Orthotics, supplies, retail

**Trend Direction:**
- `growing` - Increasing trend
- `stable` - Flat/steady trend
- `declining` - Decreasing trend

**Performance Tier:**
- `star` - High growth, high margin (invest)
- `cash_cow` - Stable revenue, high margin (maintain)
- `question_mark` - High growth, low margin (optimize)
- `dog` - Low growth, low margin (evaluate)

**Strategic Priority:**
- `expand` - Grow this service
- `maintain` - Keep steady
- `optimize` - Improve efficiency
- `discontinue` - Phase out

## 🔧 API Endpoint (Advanced)

If you want to automate from your accounting system:

```bash
POST https://your-supabase-url/functions/v1/import-revenue-report
Authorization: Bearer YOUR_ANON_KEY
Content-Type: application/json

{
  "report_metadata": { ... },
  "overall_metrics": { ... },
  "service_lines": [ ... ]
}
```

## 📖 Full Schema

See `REVENUE_IMPORT_SCHEMA.md` for complete field definitions and advanced options.

## 🆘 Troubleshooting

**"Clinic not found"**
- Check clinic_name matches exactly
- Check clinic_city is correct

**"Invalid enum value"**
- Use exact values from reference above
- Check spelling and case (lowercase)

**"Failed to parse JSON"**
- Validate JSON syntax at jsonlint.com
- Check for missing commas or brackets

**"Missing required fields"**
- Must include: report_metadata, overall_metrics, service_lines
- Each service line needs: service_line, service_category, total_revenue, total_visits

## 💡 Pro Tips

1. **Create a template** - Save a .json template with your clinic info, just update numbers weekly
2. **Test first** - Use "Load Sample" to verify the system works
3. **Batch import** - You can include all service lines in one upload
4. **Version control** - Keep copies of your JSON files for audit trail

## 📞 Need Help?

Full documentation in `REVENUE_IMPORT_SCHEMA.md`
