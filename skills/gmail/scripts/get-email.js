#!/usr/bin/env node

/**
 * Get full email content by ID
 * Usage: node get-email.js <message-id>
 */

const { google } = require('googleapis');
const { authorize } = require('./auth');

function getHeader(message, name) {
  const header = message.payload.headers.find(h => h.name === name);
  return header ? header.value : '';
}

function getBody(payload) {
  // Direct body
  if (payload.body && payload.body.data) {
    return Buffer.from(payload.body.data, 'base64').toString('utf-8');
  }

  // Multipart - try text/plain first
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body && part.body.data) {
        return Buffer.from(part.body.data, 'base64').toString('utf-8');
      }
      // Recurse into nested parts
      if (part.parts) {
        const nested = getBody(part);
        if (nested) return nested;
      }
    }

    // Fallback to text/html if no plain text
    for (const part of payload.parts) {
      if (part.mimeType === 'text/html' && part.body && part.body.data) {
        return Buffer.from(part.body.data, 'base64').toString('utf-8');
      }
    }
  }

  return null;
}

async function getEmail(messageId) {
  if (!messageId) {
    console.error('Usage: node get-email.js <message-id>');
    console.error('Get the message ID from search-gmail.js first');
    process.exit(1);
  }

  const auth = await authorize();
  const gmail = google.gmail({ version: 'v1', auth });

  const msg = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'full'
  });

  const from = getHeader(msg.data, 'From');
  const subject = getHeader(msg.data, 'Subject') || '(no subject)';
  const date = getHeader(msg.data, 'Date');
  const body = getBody(msg.data.payload);

  console.log('─'.repeat(80));
  console.log(`From: ${from}`);
  console.log(`Subject: ${subject}`);
  console.log(`Date: ${date}`);
  console.log(`ID: ${messageId}`);
  console.log('─'.repeat(80));
  console.log('');
  console.log(body || '(no body content found)');
}

const messageId = process.argv[2];
getEmail(messageId).catch(console.error);
