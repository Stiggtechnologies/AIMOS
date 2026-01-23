# Weekly Revenue Report Import Schema

## Overview
This JSON schema allows you to import weekly revenue reports in seconds. Simply convert your PDF report into this format and POST it to the import endpoint.

## JSON Schema

```json
{
  "report_metadata": {
    "period_start": "2026-01-01",
    "period_end": "2026-01-31",
    "clinic_name": "Alberta Injury Management Inc.",
    "clinic_city": "Edmonton"
  },
  "overall_metrics": {
    "total_revenue": 14955.00,
    "total_visits": 124,
    "total_items": 7,
    "total_hours": 19.25,
    "unique_clients": 53,
    "revenue_per_visit": 120.60,
    "revenue_per_hour": 776.75,
    "operating_margin_percent": 65.0
  },
  "payer_mix": {
    "wsib_percent": 5.55,
    "private_insurance_percent": 63.66,
    "mva_percent": 16.10,
    "patient_direct_percent": 12.00,
    "other_percent": 2.69
  },
  "service_lines": [
    {
      "service_line": "Physical Therapy",
      "service_category": "Clinical",
      "total_revenue": 8089.00,
      "revenue_percent": 54.09,
      "total_visits": 69,
      "billable_hours": 10.0,
      "revenue_per_visit": 117.23,
      "revenue_per_hour": 808.90,
      "direct_costs": 3073.00,
      "allocated_overhead": 1000.82,
      "gross_margin_percent": 62.0,
      "contribution_margin_percent": 58.0,
      "capacity_utilization_percent": 82.0,
      "growth_rate_percent": 5.2,
      "trend_direction": "growing",
      "performance_tier": "star",
      "strategic_priority": "maintain"
    },
    {
      "service_line": "Manual Osteopathy",
      "service_category": "Clinical",
      "total_revenue": 2150.00,
      "revenue_percent": 14.38,
      "total_visits": 16,
      "billable_hours": 4.0,
      "revenue_per_visit": 134.38,
      "revenue_per_hour": 537.50,
      "direct_costs": 688.00,
      "allocated_overhead": 172.00,
      "gross_margin_percent": 68.0,
      "contribution_margin_percent": 65.0,
      "capacity_utilization_percent": 65.0,
      "growth_rate_percent": 2.1,
      "trend_direction": "stable",
      "performance_tier": "cash_cow",
      "strategic_priority": "maintain"
    }
  ]
}
```

## Field Definitions

### report_metadata
- **period_start/end**: Date range in YYYY-MM-DD format
- **clinic_name**: Full clinic name
- **clinic_city**: City to identify the specific clinic

### overall_metrics
- **total_revenue**: Total revenue in dollars
- **total_visits**: Number of patient visits
- **total_items**: Non-visit items (products, reports, etc.)
- **total_hours**: Total billable clinician hours
- **unique_clients**: Number of unique patients
- **revenue_per_visit**: Average revenue per visit
- **revenue_per_hour**: Average revenue per clinician hour
- **operating_margin_percent**: Operating margin percentage

### payer_mix
All values are percentages (0-100)
- **wsib_percent**: Workers Compensation Board
- **private_insurance_percent**: Private insurance
- **mva_percent**: Motor Vehicle Accident
- **patient_direct_percent**: Patient direct pay
- **other_percent**: Other payment sources

### service_lines (array)
- **service_line**: Service name (e.g., "Physical Therapy")
- **service_category**: "Clinical" or "Products"
- **total_revenue**: Revenue for this service line
- **revenue_percent**: Percentage of total revenue
- **total_visits**: Number of visits/items
- **billable_hours**: Hours (0 for products)
- **revenue_per_visit**: Average per visit
- **revenue_per_hour**: Average per hour
- **direct_costs**: Direct costs
- **allocated_overhead**: Overhead allocation
- **gross_margin_percent**: Gross margin %
- **contribution_margin_percent**: Contribution margin %
- **capacity_utilization_percent**: Capacity utilization %
- **growth_rate_percent**: Growth rate %
- **trend_direction**: "growing", "stable", or "declining"
- **performance_tier**: "star", "cash_cow", "question_mark", or "dog"
- **strategic_priority**: "expand", "maintain", "optimize", or "discontinue"

## Valid Enum Values

**trend_direction**: `growing`, `stable`, `declining`
**performance_tier**: `star`, `cash_cow`, `question_mark`, `dog`
**strategic_priority**: `expand`, `maintain`, `optimize`, `discontinue`

## Minimal Example

If you don't have all metrics, here's a minimal version:

```json
{
  "report_metadata": {
    "period_start": "2026-01-01",
    "period_end": "2026-01-31",
    "clinic_name": "Alberta Injury Management Inc.",
    "clinic_city": "Edmonton"
  },
  "overall_metrics": {
    "total_revenue": 14955.00,
    "total_visits": 124,
    "unique_clients": 53
  },
  "payer_mix": {
    "wsib_percent": 5.55,
    "private_insurance_percent": 63.66,
    "other_percent": 30.79
  },
  "service_lines": [
    {
      "service_line": "Physical Therapy",
      "service_category": "Clinical",
      "total_revenue": 8089.00,
      "revenue_percent": 54.09,
      "total_visits": 69
    }
  ]
}
```

The system will auto-calculate missing fields where possible.
