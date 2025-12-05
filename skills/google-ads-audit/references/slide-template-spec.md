# Audit Slide Template Specification

## Design Principle

Each data point gets its own placeholder. No multi-line text blocks.

## Slide Structure

### Slide 1: Title
- `{{account_name}}` - Client name
- `{{audit_date}}` - Date
- `{{your_business}}` - Your business name
- Logo placeholder (image)

### Slide 2: Executive Summary
**Large metric cards:**
- `{{total_spend}}` - e.g., "A$77,464"
- `{{total_conversions}}` - e.g., "3,610"
- `{{overall_roas}}` - e.g., "7.2x"
- `{{spend_change}}` - e.g., "+10.9%"
- `{{conv_change}}` - e.g., "+13.5%"

**Key insight (one line):**
- `{{headline_insight}}` - e.g., "Strong performance with 7.2x ROAS. Budget constraints limiting Brand campaigns."

### Slide 3: Performance
**Metric cards (current period):**
- `{{perf_spend}}` - Spend value
- `{{perf_clicks}}` - Clicks
- `{{perf_conversions}}` - Conversions
- `{{perf_roas}}` - ROAS
- `{{perf_ctr}}` - CTR
- `{{perf_cpc}}` - CPC

**Change indicators:**
- `{{perf_spend_delta}}` - e.g., "+10.9%"
- `{{perf_conv_delta}}` - e.g., "+13.5%"
- `{{perf_roas_delta}}` - e.g., "+1.6%"

### Slide 4: Budget & Bidding
**Budget section:**
- `{{budget_daily_avg}}` - Daily average spend
- `{{budget_projected}}` - Projected 30-day spend
- `{{budget_limited_count}}` - Number of limited campaigns

**Top budget-limited campaign:**
- `{{budget_camp_1_name}}` - Campaign name
- `{{budget_camp_1_current}}` - Current budget
- `{{budget_camp_1_recommended}}` - Recommended budget

**Highest CPC:**
- `{{cpc_keyword_1}}` - Keyword text
- `{{cpc_keyword_1_value}}` - CPC value
- `{{cpc_keyword_1_conv}}` - Conversions

### Slide 5: Conversion Tracking
- `{{conv_total_actions}}` - Total actions
- `{{conv_healthy}}` - Healthy count
- `{{conv_warnings}}` - Warning count

**Top 2 actions:**
- `{{conv_action_1_name}}` - e.g., "Purchase"
- `{{conv_action_1_count}}` - e.g., "3,200"
- `{{conv_action_2_name}}` - e.g., "Add to Cart"
- `{{conv_action_2_count}}` - e.g., "410"

### Slide 6: Keywords & Search Terms
**Top keyword:**
- `{{kw_1_text}}` - Keyword
- `{{kw_1_spend}}` - Spend
- `{{kw_1_conv}}` - Conversions
- `{{kw_1_roas}}` - ROAS

**Second keyword:**
- `{{kw_2_text}}`
- `{{kw_2_spend}}`
- `{{kw_2_conv}}`
- `{{kw_2_roas}}`

**Wasted spend:**
- `{{wasted_spend_total}}` - Total wasted
- `{{wasted_term_count}}` - Number of terms

### Slide 7: Recommendations
**Priority 1:**
- `{{rec_1_title}}` - e.g., "Add Negative Keywords"
- `{{rec_1_desc}}` - e.g., "15 search terms wasting A$450/month"
- `{{rec_1_impact}}` - e.g., "Save A$450/month"

**Priority 2:**
- `{{rec_2_title}}`
- `{{rec_2_desc}}`
- `{{rec_2_impact}}`

**Quick wins (3 items):**
- `{{quick_1}}`
- `{{quick_2}}`
- `{{quick_3}}`

### Slide 8: Thank You
- `{{account_name}}`
- `{{your_business}}`
- `{{audit_date}}`

---

## JSON Structure (Flat for Easy Mapping)

```json
{
  "account_name": "Swimwear Galore",
  "account_id": "7415198088",
  "audit_date": "2024-11-21",
  "your_business": "8020agent.com",
  "currency": "AUD",
  "logo_url": "https://swimweargalore.com/cdn/shop/files/logo.png",

  "total_spend": "A$77,464",
  "total_conversions": "3,610",
  "overall_roas": "7.2x",
  "spend_change": "+10.9%",
  "conv_change": "+13.5%",
  "headline_insight": "Strong 7.2x ROAS. Brand campaigns budget-limited, losing 12.5% impression share.",

  "perf_spend": "A$77,464",
  "perf_clicks": "28,450",
  "perf_conversions": "3,610",
  "perf_roas": "7.20x",
  "perf_ctr": "2.28%",
  "perf_cpc": "A$2.72",
  "perf_spend_delta": "+10.9%",
  "perf_conv_delta": "+13.5%",
  "perf_roas_delta": "+1.6%",

  "budget_daily_avg": "A$2,582",
  "budget_projected": "A$77,464",
  "budget_limited_count": "1",
  "budget_camp_1_name": "S | Brand - AU - SP",
  "budget_camp_1_current": "A$500",
  "budget_camp_1_recommended": "A$650",

  "cpc_keyword_1": "swimwear online",
  "cpc_keyword_1_value": "A$8.45",
  "cpc_keyword_1_conv": "12",

  "conv_total_actions": "2",
  "conv_healthy": "2",
  "conv_warnings": "0",
  "conv_action_1_name": "Purchase",
  "conv_action_1_count": "3,200",
  "conv_action_2_name": "Add to Cart",
  "conv_action_2_count": "410",

  "kw_1_text": "swimwear online",
  "kw_1_spend": "A$4,250",
  "kw_1_conv": "145",
  "kw_1_roas": "8.2x",
  "kw_2_text": "bikini sale",
  "kw_2_spend": "A$3,180",
  "kw_2_conv": "98",
  "kw_2_roas": "7.5x",

  "wasted_spend_total": "A$450",
  "wasted_term_count": "2",

  "rec_1_title": "Add Negative Keywords",
  "rec_1_desc": "15 search terms wasting budget",
  "rec_1_impact": "Save A$450/month",
  "rec_2_title": "Replace Low-Performing Assets",
  "rec_2_desc": "8 ad assets marked as LOW",
  "rec_2_impact": "Improve CTR",

  "quick_1": "Add 'careers' and 'jobs' as account negatives",
  "quick_2": "Replicate top headline to all ad groups",
  "quick_3": "Add 'one piece swimsuit sale' as keyword"
}
```

---

## Implementation Steps

1. **Create template in Google Slides** with all placeholders as separate text boxes
2. **Style each placeholder** - large bold for values, smaller for labels
3. **Save template ID** in config
4. **Update populate script** to do simple find/replace on each `{{placeholder}}`

This approach gives full control over formatting since each element is styled independently in the template.
