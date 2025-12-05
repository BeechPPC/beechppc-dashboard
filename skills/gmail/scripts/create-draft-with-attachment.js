#!/usr/bin/env node

/**
 * Create a Gmail draft with attachment
 * Usage: node create-draft-with-attachment.js <to> <subject> <body> <attachment-path>
 */

const { google } = require('googleapis');
const { authorize } = require('./auth');
const fs = require('fs');
const path = require('path');

function createMessageWithAttachment(to, subject, body, attachmentPath) {
  const boundary = '8020brain_boundary_' + Date.now();
  const attachmentName = path.basename(attachmentPath);
  const attachmentContent = fs.readFileSync(attachmentPath).toString('base64');

  // Determine MIME type
  const ext = path.extname(attachmentPath).toLowerCase();
  const mimeTypes = {
    '.zip': 'application/zip',
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.png': 'image/png',
    '.txt': 'text/plain'
  };
  const mimeType = mimeTypes[ext] || 'application/octet-stream';

  const messageParts = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    '',
    body,
    '',
    `--${boundary}`,
    `Content-Type: ${mimeType}; name="${attachmentName}"`,
    'Content-Transfer-Encoding: base64',
    `Content-Disposition: attachment; filename="${attachmentName}"`,
    '',
    attachmentContent,
    `--${boundary}--`,
  ];

  const message = messageParts.join('\n');

  // Encode in base64url format for Gmail API
  const encodedMessage = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return encodedMessage;
}

async function createDraft(gmail, to, subject, body, attachmentPath) {
  const encodedMessage = createMessageWithAttachment(to, subject, body, attachmentPath);

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
  const attachmentPath = process.argv[5];

  if (!to || !subject || !body || !attachmentPath) {
    console.error('Usage: node create-draft-with-attachment.js <to> <subject> <body> <attachment-path>');
    console.error('\nExample:');
    console.error('  node create-draft-with-attachment.js "email@example.com" "Subject" "Body text" "/path/to/file.zip"');
    process.exit(1);
  }

  if (!fs.existsSync(attachmentPath)) {
    console.error(`Error: Attachment file not found: ${attachmentPath}`);
    process.exit(1);
  }

  console.log(`Creating draft to ${to}...`);
  console.log(`Attachment: ${path.basename(attachmentPath)} (${(fs.statSync(attachmentPath).size / 1024 / 1024).toFixed(2)} MB)`);

  const auth = await authorize();
  const gmail = google.gmail({ version: 'v1', auth });

  const draft = await createDraft(gmail, to, subject, body, attachmentPath);

  console.log('\n✓ Draft created successfully!');
  console.log(`Draft ID: ${draft.id}`);
  console.log(`\nView in Gmail: https://mail.google.com/mail/u/0/#drafts`);
}

main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
