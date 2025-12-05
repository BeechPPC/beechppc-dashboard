#!/usr/bin/env node

/**
 * Create a Gmail draft (without attachment)
 * Usage: node create-draft.js <to> <subject> <body>
 */

const { google } = require('googleapis');
const { authorize } = require('./auth');

async function createDraft(gmail, to, subject, body) {
  // Create RFC 2822 formatted message
  const message = [
    `To: ${to}`,
    `Subject: ${subject}`,
    '',
    body
  ].join('\n');

  // Encode in base64url
  const encodedMessage = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const draft = await gmail.users.drafts.create({
    userId: 'me',
    requestBody: {
      message: {
        raw: encodedMessage
      }
    }
  });

  return draft.data;
}

async function main() {
  const to = process.argv[2];
  const subject = process.argv[3];
  const body = process.argv[4];

  if (!to || !subject || !body) {
    console.error('Usage: node create-draft.js <to> <subject> <body>');
    console.error('\nExample:');
    console.error('  node create-draft.js "email@example.com" "Subject" "Body text"');
    process.exit(1);
  }

  console.log(`Creating draft to ${to}...`);

  const auth = await authorize();
  const gmail = google.gmail({ version: 'v1', auth });

  const draft = await createDraft(gmail, to, subject, body);

  console.log('\nDraft created successfully!');
  console.log(`Draft ID: ${draft.id}`);
  console.log(`\nView in Gmail: https://mail.google.com/mail/u/0/#drafts`);
}

main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
