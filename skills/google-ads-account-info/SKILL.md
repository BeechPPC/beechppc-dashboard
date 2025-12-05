---
name: Getting Google Ads Account Information
description: Retrieves Google Ads account details including account names, IDs, currency, timezone, manager status, and client account hierarchies. Use when analyzing account structure, checking account settings, or exploring MCC relationships.
allowed-tools: mcp__google-ads__list_accessible_accounts, mcp__google-ads__execute_gaql
---

# Getting Google Ads Account Information

## Instructions

When the user asks about Google Ads accounts, account structure, or wants to explore their accessible accounts:

1. **List accessible accounts** using `mcp__google-ads__list_accessible_accounts`
   - Returns array of customer IDs

2. **Get account details** using GAQL query:
   ```sql
   SELECT
     customer.id,
     customer.descriptive_name,
     customer.currency_code,
     customer.time_zone,
     customer.manager
   FROM customer
   WHERE customer.id = {ACCOUNT_ID}
   ```

3. **For MCC accounts**, get client list:
   ```sql
   SELECT
     customer_client.id,
     customer_client.descriptive_name,
     customer_client.currency_code,
     customer_client.manager,
     customer_client.status
   FROM customer_client
   WHERE customer_client.status = 'ENABLED'
   ```

## Output Format

Present account information clearly:
- **Account ID**: {id}
- **Name**: {descriptive_name}
- **Currency**: {currency_code}
- **Time Zone**: {time_zone}
- **Type**: Manager account (MCC) or Standard account

For MCCs, list client accounts in a clear structure.

## Common Use Cases

- "What accounts do I have access to?"
- "Tell me about account {id}"
- "Show me the account structure"
- "What clients are under this MCC?"
