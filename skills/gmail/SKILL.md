---
name: gmail
description: Gmail and email operations including searching messages, archiving emails, creating drafts (with or without attachments), batch operations, and notifications. USE WHEN user asks to check Gmail, search email, archive messages, create drafts, or manage email operations. Triggers include "check gmail", "search email", "archive email", "create draft", "email with attachment".
---

# Gmail Skill

## Core Operations

### 1. Search Gmail
Search emails using Gmail query syntax.
- **Script:** `scripts/search-gmail.js`
- **Usage:** `node scripts/search-gmail.js "query" [maxResults]`
- **Examples:**
  - `node scripts/search-gmail.js "from:sender@example.com"`
  - `node scripts/search-gmail.js "subject:invoice after:2024/10/01" 20`
  - `node scripts/search-gmail.js "has:attachment is:unread"`

### 2. Archive Email
Archive emails by message ID.
- **Script:** `scripts/archive-email.js`
- **Usage:** `node scripts/archive-email.js <message-id>`

### 3. Create Draft (Plain Text)
Create email draft without attachment.
- **Script:** `scripts/create-draft.js`
- **Usage:** `node scripts/create-draft.js <to> <subject> <body>`

### 4. Create Draft with Attachment
Create email draft with file attachment.
- **Script:** `scripts/create-draft-with-attachment.js`
- **Usage:** `node scripts/create-draft-with-attachment.js <to> <subject> <body> <attachment-path>`

## Configuration

OAuth credentials are in `auth/google/`:
- `auth/google/credentials.json` - OAuth client credentials
- `auth/google/token.json` - Saved OAuth token

## Dynamic Script Creation

For one-off operations not covered by existing scripts:
1. Create temporary script in `/tmp/gmail-{operation}-{timestamp}.js`
2. Execute the operation
3. Delete after use, or move to scripts/ if reusable

## Best Practices

1. **Always prefer arguments over new scripts**
2. **Create temporary scripts for one-offs**
3. **Generalize patterns when they repeat**
