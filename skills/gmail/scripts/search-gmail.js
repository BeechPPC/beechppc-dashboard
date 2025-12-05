#!/usr/bin/env node

/**
 * Search Gmail and list recent emails
 */

const { google } = require('googleapis');
const { authorize } = require('./auth');

function getHeader(message, name) {
  const header = message.payload.headers.find(h => h.name === name);
  return header ? header.value : '';
}

async function searchGmail(query, maxResults = 10) {
  const auth = await authorize();
  const gmail = google.gmail({ version: 'v1', auth });

  // Default query to inbox if not specified
  const searchQuery = query || 'in:inbox';

  const res = await gmail.users.messages.list({
    userId: 'me',
    q: searchQuery,
    maxResults: maxResults
  });

  if (!res.data.messages) {
    console.log('No messages found.');
    return;
  }

  console.log(`\nFound ${res.data.messages.length} messages:\n`);
  console.log('─'.repeat(80));

  // Fetch full message details
  for (const msg of res.data.messages) {
    const fullMsg = await gmail.users.messages.get({
      userId: 'me',
      id: msg.id,
      format: 'full'
    });

    const from = getHeader(fullMsg.data, 'From');
    const subject = getHeader(fullMsg.data, 'Subject') || '(no subject)';
    const date = getHeader(fullMsg.data, 'Date');

    console.log(`From: ${from}`);
    console.log(`Subject: ${subject}`);
    console.log(`Date: ${date}`);
    console.log(`ID: ${msg.id}`);
    console.log('─'.repeat(80));
  }
}

// Get query from command line args
const query = process.argv[2];
const maxResults = parseInt(process.argv[3]) || 10;

searchGmail(query, maxResults).catch(console.error);
