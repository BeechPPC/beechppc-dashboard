#!/usr/bin/env node

/**
 * Archive a specific email by message ID
 * Also marks it as read
 */

const { google } = require('googleapis');
const { authorize } = require('./auth');

async function archiveEmail(messageId) {
  const auth = await authorize();
  const gmail = google.gmail({ version: 'v1', auth });

  console.log(`\nProcessing message ID: ${messageId}`);

  // Mark as read and archive (remove INBOX label, remove UNREAD label)
  await gmail.users.messages.modify({
    userId: 'me',
    id: messageId,
    requestBody: {
      removeLabelIds: ['INBOX', 'UNREAD']
    }
  });

  console.log('✓ Marked as read');
  console.log('✓ Archived (removed from inbox)\n');
}

// Get message ID from command line or from inbox-analysis.json
const messageId = process.argv[2];

if (!messageId) {
  console.error('\nUsage: node archive-email.js <messageId>');
  console.error('\nOr check inbox-analysis.json for recent message IDs\n');
  process.exit(1);
}

archiveEmail(messageId).catch(console.error);
