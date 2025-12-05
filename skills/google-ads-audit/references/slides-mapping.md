# Audit Slides Mapping

Maps the automated audit output to presentation slides.

## Proposed Slide Structure

Based on the HTML audit report, here's the recommended slide structure:

### Section 1: Overview (Slides 1-5)
1. **Title Slide** - Account name, date, your business
2. **Executive Summary** - Key findings, overall health score
3. **Performance Snapshot** - Total spend, conversions, ROAS (current period)
4. **Period Comparison** - Current vs previous period with deltas
5. **Table of Contents** - Section overview

### Section 2: Budget & Bidding (Slides 6-9)
6. **Budget Section Header**
7. **Budget Pacing** - Projected spend for next 30 days, month-end
8. **Bid Management Section Header**
9. **Highest CPC Analysis** - Top CPC keywords and search terms (7d & 30d)

### Section 3: Campaign Performance (Slides 10-13)
10. **Campaign Section Header**
11. **Campaign Performance Table** - All campaigns with key metrics
12. **Top Campaigns by Spend** - Bar chart or top 5 list
13. **Campaign ROAS Comparison** - Performance tiers

### Section 4: Keywords & Search Terms (Slides 14-19)
14. **Keywords Section Header**
15. **Top Non-Brand Keywords** - Highest spend/conversion keywords
16. **Search Terms Section Header**
17. **Zero-Conversion Search Terms** - Wasted spend opportunities
18. **Negative Keyword Recommendations** - Terms to add as negatives
19. **Keyword Opportunities** - Converting terms not yet keywords

### Section 5: Conversion Tracking (Slides 20-22)
20. **Conversion Section Header**
21. **Conversion Actions Overview** - Active actions, total conversions
22. **Conversion Trends** - Daily trend chart or summary

### Section 6: Performance Trends (Slides 23-25)
23. **Trends Section Header**
24. **Daily Performance** - Cost, conversions, ROAS trend
25. **Insights & Anomalies** - Notable spikes or drops

### Section 7: Ad & Asset Performance (Slides 26-28)
26. **Ads Section Header**
27. **Asset Performance Summary** - BEST/GOOD/LOW counts
28. **Asset Recommendations** - Low performers to replace, best to replicate

### Section 8: Recommendations (Slides 29-31)
29. **Recommendations Section Header**
30. **Priority Actions** - Top 5-10 actionable items
31. **Quick Wins** - Easy fixes with high impact

### Section 9: Closing (Slides 32-33)
32. **Next Steps** - Roadmap for improvements
33. **Thank You** - Contact info

---

## JSON Output Format

The audit should output a JSON file that maps directly to these slides:

```json
{
  "metadata": {
    "account_name": "Client Name",
    "account_id": "123-456-7890",
    "audit_date": "2024-01-15",
    "period": {
      "current": { "start": "2024-01-01", "end": "2024-01-15" },
      "previous": { "start": "2023-12-15", "end": "2023-12-31" }
    },
    "currency": "USD"
  },

  "executive_summary": {
    "health_score": 72,
    "key_findings": [
      "Strong ROAS at 5.2x overall",
      "15% of spend going to zero-conversion terms",
      "Conversion tracking shows gaps in some actions"
    ],
    "priority_actions": [
      "Add 45 negative keywords from wasted spend analysis",
      "Review 3 campaigns with declining ROAS",
      "Fix conversion tracking for 'Phone Call' action"
    ]
  },

  "performance_summary": {
    "current": {
      "spend": 55952.00,
      "clicks": 12450,
      "impressions": 845230,
      "conversions": 3593,
      "value": 538950.00,
      "roas": 9.63,
      "ctr": 1.47,
      "cpc": 4.49
    },
    "previous": {
      "spend": 49872.00,
      "clicks": 11200,
      "impressions": 780450,
      "conversions": 3320,
      "value": 498000.00,
      "roas": 9.98,
      "ctr": 1.44,
      "cpc": 4.45
    },
    "change": {
      "spend": { "value": 6080, "percent": 12.2 },
      "conversions": { "value": 273, "percent": 8.2 },
      "roas": { "value": -0.35, "percent": -3.5 }
    }
  },

  "budget_pacing": {
    "projected_30d_spend": 58500.00,
    "projected_month_end_spend": 62000.00,
    "daily_average": 1865.07,
    "budget_limited_campaigns": [
      {
        "campaign": "Brand - Core",
        "current_budget": 100.00,
        "recommended_budget": 150.00,
        "lost_impression_share": 15.2
      }
    ]
  },

  "bid_management": {
    "highest_cpc_keywords_7d": [
      { "keyword": "emergency plumber", "cpc": 45.23, "conversions": 2 },
      { "keyword": "24hr plumbing", "cpc": 38.50, "conversions": 1 }
    ],
    "highest_cpc_keywords_30d": [
      { "keyword": "emergency plumber", "cpc": 42.10, "conversions": 8 },
      { "keyword": "plumber near me", "cpc": 35.80, "conversions": 12 }
    ],
    "highest_cpc_search_terms_7d": [
      { "term": "emergency plumber downtown", "cpc": 52.00, "conversions": 1 }
    ],
    "highest_cpc_search_terms_30d": [
      { "term": "emergency plumber downtown", "cpc": 48.50, "conversions": 3 }
    ],
    "avg_conversion_value": 150.00,
    "alerts": [
      "Keyword 'emergency plumber' CPC ($45.23) exceeds avg conv value ($150)"
    ]
  },

  "campaign_performance": [
    {
      "campaign": "Brand - Core",
      "status": "enabled",
      "spend": 15230.50,
      "clicks": 4500,
      "conversions": 1250,
      "value": 187500.00,
      "roas": 12.31,
      "change_vs_prev": { "spend": 8.5, "conversions": 12.3 }
    }
  ],

  "keywords": {
    "top_non_brand": [
      {
        "keyword": "plumber near me",
        "campaign": "Generic - Services",
        "spend": 2450.00,
        "conversions": 45,
        "cpc": 8.50,
        "roas": 6.2
      }
    ],
    "zero_conversion": [
      {
        "keyword": "plumber salary",
        "campaign": "Generic - Services",
        "spend": 350.00,
        "clicks": 85,
        "action": "pause or add negative"
      }
    ]
  },

  "search_terms": {
    "wasted_spend": [
      {
        "term": "plumber jobs",
        "campaign": "Generic - Services",
        "spend": 125.00,
        "clicks": 45,
        "conversions": 0,
        "action": "add as negative"
      }
    ],
    "total_wasted": 2850.00,
    "opportunities": [
      {
        "term": "emergency pipe repair",
        "spend": 85.00,
        "conversions": 3,
        "status": "NONE",
        "action": "add as keyword"
      }
    ]
  },

  "conversion_tracking": {
    "actions": [
      {
        "name": "Purchase",
        "conversions": 2500,
        "value": 375000.00,
        "status": "healthy"
      },
      {
        "name": "Phone Call",
        "conversions": 45,
        "value": 0,
        "status": "warning",
        "note": "No value assigned"
      }
    ],
    "total_actions": 5,
    "healthy": 3,
    "warnings": 2
  },

  "daily_trends": {
    "data": [
      { "date": "2024-01-01", "spend": 1850, "conversions": 120, "roas": 9.5 },
      { "date": "2024-01-02", "spend": 1920, "conversions": 115, "roas": 8.8 }
    ],
    "anomalies": [
      { "date": "2024-01-10", "type": "spike", "metric": "spend", "note": "25% above average" }
    ]
  },

  "asset_performance": {
    "summary": {
      "BEST": 12,
      "GOOD": 25,
      "LOW": 8,
      "LEARNING": 15
    },
    "low_performers": [
      {
        "asset": "Quality Service Guaranteed",
        "type": "HEADLINE",
        "ad_group": "Brand - Core",
        "action": "replace"
      }
    ],
    "top_performers": [
      {
        "asset": "24/7 Emergency Service",
        "type": "HEADLINE",
        "ad_group": "Brand - Core",
        "action": "replicate to other ad groups"
      }
    ]
  },

  "recommendations": {
    "high_priority": [
      {
        "title": "Add Negative Keywords",
        "description": "Add 45 negative keywords from wasted spend analysis",
        "impact": "Save $2,850/month",
        "effort": "low"
      }
    ],
    "medium_priority": [
      {
        "title": "Increase Brand Budget",
        "description": "Brand campaigns losing 15% impression share to budget",
        "impact": "Est. +120 conversions/month",
        "effort": "low"
      }
    ],
    "quick_wins": [
      "Pause keyword 'plumber salary' - $350 wasted",
      "Add 'jobs' and 'career' as account negatives"
    ]
  }
}
```

---

## Slide Population Strategy

1. **Run audit** → Generates JSON output
2. **Load template** → Copy the master slide deck
3. **Populate slides** → Use Slides API to:
   - Update text placeholders
   - Insert tables with data
   - Update charts (if using linked sheets)
4. **Generate PDF** → Export for client delivery

## Text Placeholder Convention

Use consistent placeholders in slides:
- `{{account_name}}` - Client name
- `{{audit_date}}` - Audit date
- `{{spend}}` - Total spend
- `{{conversions}}` - Total conversions
- `{{roas}}` - ROAS value

Tables should be structured elements that can be programmatically updated.
