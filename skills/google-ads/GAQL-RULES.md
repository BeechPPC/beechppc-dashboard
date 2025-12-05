# GAQL Rules - Central Reference

**IMPORTANT:** All Google Ads skills MUST reference this file for GAQL query construction.

## Date Range Rules

### CRITICAL: Valid DURING Enum Values

GAQL only supports these DURING values. **Any other value will fail:**

| Enum | Description |
|------|-------------|
| `TODAY` | Today only |
| `YESTERDAY` | Yesterday only |
| `LAST_7_DAYS` | Last 7 days |
| `LAST_14_DAYS` | Last 14 days |
| `LAST_30_DAYS` | Last 30 days |
| `LAST_BUSINESS_WEEK` | Mon-Fri of previous week |
| `THIS_WEEK_SUN_TODAY` | This week (Sun-Today) |
| `THIS_WEEK_MON_TODAY` | This week (Mon-Today) |
| `LAST_WEEK_SUN_SAT` | Last week (Sun-Sat) |
| `LAST_WEEK_MON_SUN` | Last week (Mon-Sun) |
| `THIS_MONTH` | Current month to date |
| `LAST_MONTH` | Previous full month |

### INVALID Values (Do Not Use)

These **DO NOT EXIST** and will cause query failures:

- `LAST_60_DAYS` - DOES NOT EXIST
- `LAST_90_DAYS` - DOES NOT EXIST
- `LAST_120_DAYS` - DOES NOT EXIST
- `LAST_180_DAYS` - DOES NOT EXIST
- `LAST_365_DAYS` - DOES NOT EXIST
- Any other `LAST_N_DAYS` except 7, 14, 30

### Best Practice: Always Use BETWEEN

**For any custom date range, ALWAYS use BETWEEN with explicit dates.**

```sql
WHERE segments.date BETWEEN '2025-08-31' AND '2025-11-28'
```

### Date Calculation Rules

When calculating date ranges:

1. **End date = YESTERDAY** (never today, unless explicitly requested)
2. **Use account timezone** for date calculation
3. **Format: YYYY-MM-DD** with single quotes in GAQL

**Why yesterday?** Today's data is incomplete and can skew metrics. Always use yesterday as the end date unless the user explicitly asks for today.

**Example - User asks for "last 90 days":**
```
Today (Melbourne): 2025-11-29
Yesterday: 2025-11-28 (this is the END date)
90 days before yesterday: 2025-08-31 (this is the START date)

Result: BETWEEN '2025-08-31' AND '2025-11-28'
```

### Date Calculation JavaScript

```javascript
function calculateDateRange(numDays, timezone) {
    // Get current date in account timezone
    const now = new Date();
    const todayInTz = new Date(now.toLocaleString('en-US', { timeZone: timezone }));

    // End date is YESTERDAY (not today)
    const endDate = new Date(todayInTz);
    endDate.setDate(endDate.getDate() - 1);

    // Start date is (numDays - 1) before yesterday
    // e.g., for "last 30 days": yesterday minus 29 days = 30 days total
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - (numDays - 1));

    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    return {
        start: formatDate(startDate),
        end: formatDate(endDate)
    };
}
```

## MCP vs API Script Rules

### When to Use API Script (query.js)

**ALWAYS use the API script for:**

- Search terms (always high volume)
- Any query expected to return >100 rows
- Any data that needs to be saved to CSV
- Any data that will be processed by other scripts/skills

```bash
node .claude/skills/google-ads/scripts/query.js \
  --customer-id={id} \
  --login-customer-id={login_id} \
  --query="SELECT ... WHERE segments.date BETWEEN '...' AND '...'" \
  --output=data/google-ads/{date}-{account}-{resource}.csv
```

### When MCP is Acceptable

**MCP can be used for:**

- Quick lookups of <10 rows (e.g., account info, campaign count)
- Single-value queries (e.g., account timezone)
- Interactive exploration where CSV isn't needed

**NEVER use MCP for:**

- Search terms (NEVER - always high volume)
- Keywords (typically high volume)
- Any bulk data retrieval
- Any data that will be analyzed or processed

## Query Template Pattern

All GAQL files should use `{DATE_RANGE}` placeholder:

```sql
SELECT
  campaign.name,
  metrics.impressions,
  metrics.clicks,
  metrics.cost_micros
FROM campaign
WHERE segments.date {DATE_RANGE}
  AND metrics.impressions > 0
ORDER BY metrics.cost_micros DESC
```

Before execution, replace `{DATE_RANGE}` with calculated BETWEEN dates:

```sql
WHERE segments.date BETWEEN '2025-08-31' AND '2025-11-28'
```

## Formatting Rules

When displaying data:

| Field | Transformation |
|-------|---------------|
| `cost_micros` | Divide by 1,000,000 → $X.XX |
| `ctr` | Multiply by 100 → X.XX% |
| `customer_id` | Digits only, no dashes |

## Account Resolution

Always resolve accounts from `.claude/accounts.json`:

1. Match by name, key, or alias (case-insensitive)
2. Get `id` (customer_id) and `login_customer_id`
3. Get `currency` for formatting
4. Get `timezone` for date calculations (if available)

## Error Messages

If a date range query fails with "invalid date range":

1. Check if using invalid enum (LAST_90_DAYS etc.)
2. Convert to BETWEEN with explicit dates
3. Verify date format is YYYY-MM-DD with single quotes
