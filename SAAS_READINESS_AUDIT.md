# Hard-Coded Values Audit Report

**Date:** 2025-12-09
**Purpose:** Identify hard-coded values preventing SaaS multi-tenancy
**Status:** 🔴 Requires Action

---

## 🔴 CRITICAL - Must Address for SaaS

### 1. **Hard-Coded Email Address** (`chris@beechppc.com`)
**Impact:** HIGH - Personal email appearing throughout the codebase
**Priority:** P0 - Must fix before any SaaS deployment

**Locations:**
- [lib/settings/types.ts:283](lib/settings/types.ts#L283) - DEFAULT_SETTINGS recipients
- [lib/alerts/storage-kv.ts:105,118,131](lib/alerts/storage-kv.ts#L105) - Default alert recipients (3 instances)
- [lib/alerts/storage-memory.ts:17,30,43](lib/alerts/storage-memory.ts#L17) - Memory storage defaults (3 instances)
- [lib/alerts/storage.ts:100,113,126](lib/alerts/storage.ts#L100) - Storage defaults (3 instances)
- [components/alerts/create-alert-form.tsx:32](components/alerts/create-alert-form.tsx#L32) - Form default value
- [app/(app)/reports/page.tsx:26,36,56,64](app/(app)/reports/page.tsx#L26) - Multiple report recipient defaults (4 instances)
- [scripts/send-spacegenie-monthly-report.ts:118](scripts/send-spacegenie-monthly-report.ts#L118) - Script recipient
- [scripts/send-spacegenie-report-ses.ts:20](scripts/send-spacegenie-report-ses.ts#L20) - SES script recipient
- [scripts/generate-sample-spacegenie-report.ts:397](scripts/generate-sample-spacegenie-report.ts#L397) - Sample report recipient
- [test-report.js:13](test-report.js#L13) - Test default

**Recommendation:**
Replace with user's profile email from Clerk authentication or organization-specific settings. Use pattern:
```typescript
const defaultEmail = user?.primaryEmailAddress?.emailAddress || '';
```

**Action Items:**
- [x] Update DEFAULT_SETTINGS to use empty string or require user input
- [x] Update all alert storage defaults to use empty arrays
- [x] Update form components to get default from user context
- [x] Update report pages to pull from user settings
- [x] Update or remove client-specific scripts (moved to examples/client-specific/)
- [x] Update test files to use environment variables

---

### 2. **Hard-Coded Deployment URL** (`https://beechppc-dashboard.vercel.app`)
**Impact:** HIGH - Production URL hard-coded in email templates
**Priority:** P0 - Breaks when deployed to different domains

**Locations:**
- [lib/alerts/email-template.ts:243](lib/alerts/email-template.ts#L243) - Dashboard link in CTA button
- [lib/alerts/email-template.ts:252](lib/alerts/email-template.ts#L252) - Alerts management link

**Recommendation:**
Use environment variable or dynamically generate from request headers:
```typescript
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
```

**Action Items:**
- [ ] Add `NEXT_PUBLIC_APP_URL` to .env.example
- [ ] Update email templates to use environment variable
- [ ] Add URL parameter to email template functions
- [ ] Test email links in different deployment environments

---

### 3. **Hard-Coded Company/Brand Name** ("Beech PPC", "BeechPPC")
**Impact:** MEDIUM-HIGH - Brand name appears throughout application
**Priority:** P1 - Required for white-label SaaS

**Locations:**
- [lib/settings/types.ts:276](lib/settings/types.ts#L276) - DEFAULT_SETTINGS companyName: 'Beech PPC AI'
- [lib/settings/storage.ts:12](lib/settings/storage.ts#L12) - SETTINGS_KEY: 'beechppc:settings'
- [lib/alerts/storage-kv.ts:11](lib/alerts/storage-kv.ts#L11) - ALERTS_KEY: 'beechppc:alerts'
- [lib/alerts/email-template.ts:251](lib/alerts/email-template.ts#L251) - Email footer: "Beech PPC AI"
- [lib/alerts/email-template.ts:253](lib/alerts/email-template.ts#L253) - Copyright: "Beech PPC"
- [lib/email/templates/custom-report.ts:399](lib/email/templates/custom-report.ts#L399) - Footer: "BeechPPC Dashboard"
- [lib/email/templates/keyword-deep-dive.ts:317](lib/email/templates/keyword-deep-dive.ts#L317) - Footer: "BeechPPC Dashboard"
- [lib/email/templates/auction-insights.ts:304](lib/email/templates/auction-insights.ts#L304) - Footer: "BeechPPC Dashboard"
- [lib/web/fetcher.ts:51](lib/web/fetcher.ts#L51) - User-Agent: 'BeechPPC-Bot/1.0'
- [scripts/setup-skills.ts:155](scripts/setup-skills.ts#L155) - Console message: "BeechPPC Agent"

**Recommendation:**
Make this tenant-configurable. Each organization should be able to set their own company name. Store in organization settings.

**Action Items:**
- [ ] Update DEFAULT_SETTINGS to use generic name or prompt during onboarding
- [ ] Pass company name to email templates from organization settings
- [ ] Make User-Agent configurable or use generic name
- [ ] Update console messages to be generic
- [ ] Consider adding organization branding table (logo, colors, name)

---

### 4. **Hard-Coded Redis Keys with Brand Prefix**
**Impact:** MEDIUM - Could cause data collisions in shared Redis instance
**Priority:** P0 - Critical for multi-tenancy security

**Locations:**
- [lib/settings/storage.ts:12](lib/settings/storage.ts#L12) - `'beechppc:settings'`
- [lib/alerts/storage-kv.ts:11](lib/alerts/storage-kv.ts#L11) - `'beechppc:alerts'`

**Recommendation:**
Include organization/tenant ID in Redis keys to ensure data isolation:
```typescript
const SETTINGS_KEY = (orgId: string) => `${orgId}:settings`;
const ALERTS_KEY = (orgId: string) => `${orgId}:alerts`;
```

**Action Items:**
- [ ] Update settings storage to accept organization ID parameter
- [ ] Update alerts storage to accept organization ID parameter
- [ ] Get organization ID from Clerk's useOrganization hook
- [ ] Pass organization ID through all API routes
- [ ] Add middleware to validate organization access
- [ ] Test data isolation between organizations

---

### 5. **Hard-Coded Client-Specific References** ("Spacegenie")
**Impact:** MEDIUM - Client name appears in multiple scripts
**Priority:** P2 - Should be removed or generalized

**Locations:**
- [scripts/send-spacegenie-monthly-report.ts](scripts/send-spacegenie-monthly-report.ts) - Entire script is client-specific
- [scripts/send-spacegenie-report-ses.ts](scripts/send-spacegenie-report-ses.ts) - SES version of above
- [scripts/generate-sample-spacegenie-report.ts](scripts/generate-sample-spacegenie-report.ts) - Sample data generator

**Recommendation:**
These scripts should be:
1. Moved to a separate `/examples` or `/client-specific` folder, OR
2. Generalized to work for any account by accepting account ID as parameter, OR
3. Removed from the codebase entirely

**Action Items:**
- [x] Decide on approach (move, generalize, or remove) - **MOVED TO EXAMPLES**
- [x] If keeping: Move to `/examples` folder with README
- [ ] If generalizing: Update to accept account ID parameter
- [x] Update documentation to clarify these are examples
- [x] Remove hard-coded "spacegenie" references from core codebase

---

## 🟡 MEDIUM PRIORITY - Should Address

### 6. **Hard-Coded Default Color Scheme**
**Impact:** LOW-MEDIUM - Branding locked to specific colors
**Priority:** P2 - Nice to have for white-label

**Location:**
- [lib/settings/types.ts:277](lib/settings/types.ts#L277) - `colorScheme: 'beech-yellow'`

**Recommendation:**
While this is configurable in settings, the default should be neutral or prompt during organization onboarding.

**Action Items:**
- [ ] Change default to 'default' or 'neutral'
- [ ] Add color scheme selection during organization setup
- [ ] Consider adding custom color picker for full white-label

---

### 7. **Hard-Coded Timezone**
**Impact:** LOW-MEDIUM - Default timezone is Australia/Melbourne
**Priority:** P2 - Better UX for global SaaS

**Location:**
- [lib/settings/types.ts:282](lib/settings/types.ts#L282) - `timezone: 'Australia/Melbourne'`

**Recommendation:**
Detect from user's browser timezone or require selection during onboarding:
```typescript
const defaultTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
```

**Action Items:**
- [ ] Add timezone detection in browser
- [ ] Prompt for timezone during organization setup
- [ ] Store timezone per organization in settings
- [ ] Update DEFAULT_SETTINGS to use UTC or browser detection

---

### 8. **Localhost URLs in Scripts and Fallbacks**
**Impact:** LOW - Mainly affects development/test environments
**Priority:** P3 - Low risk but should clean up

**Locations:**
- [skills/gmail/scripts/auth.js:30,47](skills/gmail/scripts/auth.js#L30) - OAuth redirect URI
- [app/api/chat/route.ts:228,296](app/api/chat/route.ts#L228) - Fallback to `http://localhost:3000`
- [skills/search-term-classifier/scripts/serve-report.js:198](skills/search-term-classifier/scripts/serve-report.js#L198) - Dev server URL
- [test-keyword-api.js:8](test-keyword-api.js#L8) - Test script URL

**Recommendation:**
These have proper fallbacks but should consistently use environment variables.

**Action Items:**
- [ ] Ensure all have environment variable alternatives
- [ ] Add comments explaining localhost is for development only
- [ ] Update test scripts to use configurable URL
- [ ] Document required environment variables

---

## 🟢 GOOD - Already Handled Properly

### ✅ **No Hard-Coded API Keys**
All sensitive credentials are properly using environment variables:
- Google Ads API credentials
- Anthropic API key
- Email credentials
- AWS credentials
- Clerk authentication keys
- Supabase keys

### ✅ **Environment Variable Usage**
Excellent use of `process.env` throughout the codebase for all sensitive data.

### ✅ **No Database Hard-Coding**
No SQL migrations or database schemas found with hard-coded tenant references. Clean data model.

### ✅ **Proper Fallback Handling**
Good fallback mechanisms in place (Redis → Memory storage) for resilience.

---

## 📋 SaaS Readiness Checklist

To make this truly multi-tenant SaaS-ready, implement the following:

### Phase 1: Multi-Tenancy Foundation (Week 1)
- [ ] **Implement Organization/Tenant Model**
  - [ ] Add `organizationId` to all data models
  - [ ] Implement Clerk organization features
  - [ ] Add middleware to extract and validate organization context
  - [ ] Scope all database queries by organization

- [ ] **Update Redis Key Patterns**
  - [ ] Add organization ID to all Redis keys
  - [ ] Pattern: `${orgId}:${resourceType}:${id}`
  - [ ] Test data isolation between tenants

- [ ] **Replace Hard-Coded Email Defaults**
  - [ ] Remove all instances of `chris@beechppc.com`
  - [ ] Use authenticated user's email from Clerk
  - [ ] Allow per-organization recipient configuration

### Phase 2: Dynamic Branding (Week 2)
- [ ] **Environment-Based URLs**
  - [ ] Add `NEXT_PUBLIC_APP_URL` environment variable
  - [ ] Update all email templates to use dynamic URL
  - [ ] Test across different deployment environments

- [ ] **Configurable Branding**
  - [ ] Store company name per organization
  - [ ] Make color schemes tenant-specific
  - [ ] Update email templates to use organization branding
  - [ ] Consider adding logo upload capability

### Phase 3: Cleanup & Security (Week 3)
- [ ] **Client-Specific Code**
  - [ ] Move/remove Spacegenie-specific scripts
  - [ ] Generalize any client-specific logic
  - [ ] Document any example scripts clearly

- [ ] **Security Audit**
  - [ ] Test tenant isolation thoroughly
  - [ ] Verify no data leakage between organizations
  - [ ] Add integration tests for multi-tenancy
  - [ ] Security review of all API routes

- [ ] **Documentation**
  - [ ] Document organization setup process
  - [ ] Create migration guide for existing users
  - [ ] Update README with multi-tenant architecture
  - [ ] Add environment variable documentation

---

## Priority Action Items Summary

### 🔴 P0 - Critical (Must do before SaaS launch)
1. Remove all `chris@beechppc.com` email defaults
2. Implement organization-scoped Redis keys
3. Add `NEXT_PUBLIC_APP_URL` environment variable
4. Add organization ID to all data models and queries

### 🟡 P1 - High Priority (Needed for white-label)
1. Make company name configurable per organization
2. Update email templates with dynamic branding
3. Implement organization settings management

### 🟢 P2 - Medium Priority (Better UX)
1. Timezone detection and configuration
2. Color scheme customization
3. Handle client-specific scripts

### ⚪ P3 - Low Priority (Clean up)
1. Localhost URL references in dev scripts
2. Generic naming throughout codebase

---

## Current Status Tracking

**Last Updated:** 2025-12-09

### Completed ✅
- Initial audit completed
- Hard-coded values identified and documented
- ✅ **P0 Critical: Removed all hard-coded email addresses** (`chris@beechppc.com`)
  - Updated DEFAULT_SETTINGS to use empty string
  - Updated all alert storage defaults to use empty arrays
  - Updated form components to have empty defaults
  - Updated report pages to pull from settings
  - Moved client-specific scripts to examples/client-specific/
  - Updated test files

### In Progress 🔄
- None

### Blocked 🚫
- None

---

## Notes

- The architecture is fundamentally sound - good use of environment variables and no hard-coded secrets
- Main work is implementing proper multi-tenancy with Clerk organizations
- Redis key patterns need immediate attention for data isolation
- Most hard-coded values are in default configurations which is easier to fix than if they were scattered throughout business logic
- Clerk's organization features should handle most of the multi-tenancy infrastructure