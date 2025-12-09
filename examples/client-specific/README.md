# Client-Specific Example Scripts

This folder contains example scripts that were created for specific clients. These are **NOT** part of the core SaaS application and should be used as reference examples only.

## Important Notes

⚠️ **These scripts contain hard-coded client-specific data and should NOT be used in production multi-tenant environments.**

These scripts are kept as examples to demonstrate:
- How to generate monthly reports for specific accounts
- How to send reports via different email services (SES)
- How to create sample data for testing

## Scripts in This Folder

### 1. `send-spacegenie-monthly-report.ts`
Example script that generates and sends a monthly report for a specific client account ("Spacegenie").

**Hard-coded elements:**
- Client name: "Spacegenie"
- Email recipient: chris@beechppc.com
- Specific account search by name

**To use this as a template:**
Replace hard-coded values with parameters or environment variables.

### 2. `send-spacegenie-report-ses.ts`
Example of sending reports via AWS SES instead of SMTP.

**Hard-coded elements:**
- Email recipient: chris@beechppc.com
- Specific report file path

### 3. `generate-sample-spacegenie-report.ts`
Example script with sample data for testing report generation.

**Hard-coded elements:**
- Sample campaign data
- Client name: "Spacegenie"
- Email recipient: chris@beechppc.com

## Generalizing These Scripts

To use these scripts as templates for a multi-tenant SaaS application:

1. **Replace hard-coded client names** with account ID parameters
2. **Replace hard-coded emails** with user/organization settings
3. **Add organization/tenant context** to all database queries
4. **Use environment variables** for configuration
5. **Implement proper access control** to ensure users only access their own data

## Example: Generalizing the Monthly Report Script

**Before (client-specific):**
```typescript
const spacegenieAccount = allAccounts.find((acc) =>
  acc.name.toLowerCase().includes('spacegenie')
)
const recipient = 'chris@beechppc.com'
```

**After (multi-tenant):**
```typescript
// Accept account ID as parameter
const accountId = process.argv[2]
const account = await getAccountById(accountId, organizationId)

// Get recipients from organization settings
const settings = await getOrganizationSettings(organizationId)
const recipients = settings.reportRecipients
```

## Running These Examples

These scripts are provided for reference only. If you need to run them:

1. Update the hard-coded values to match your needs
2. Ensure you have the required dependencies installed
3. Set up proper environment variables
4. Run with: `npx tsx examples/client-specific/[script-name].ts`

## Migration Path

For a production SaaS application, these functionalities should be:

1. **Built into the UI** - Allow users to generate reports through the dashboard
2. **Organization-scoped** - All data filtered by organization ID
3. **User-configurable** - Recipients, schedules, and preferences stored in database
4. **API-driven** - Accessible via authenticated API endpoints

See the main `/app/(app)/reports` page for the multi-tenant implementation.