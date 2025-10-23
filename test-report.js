#!/usr/bin/env node

/**
 * Test script for the daily report API endpoint
 * This simulates the GitHub Actions workflow locally
 */

const https = require('https');
const http = require('http');

// Configuration - update these values
const VERCEL_URL = process.env.VERCEL_URL || 'https://your-app.vercel.app';
const EMAIL_TO = process.env.EMAIL_TO || 'chris@beechppc.com';

console.log('🧪 Testing Daily Report API');
console.log('============================');
console.log(`Vercel URL: ${VERCEL_URL}`);
console.log(`Email to: ${EMAIL_TO}`);
console.log('');

// Parse URL
const url = new URL(`${VERCEL_URL}/api/reports/send`);
const isHttps = url.protocol === 'https:';
const client = isHttps ? https : http;

const postData = JSON.stringify({
  recipients: [EMAIL_TO]
});

const options = {
  hostname: url.hostname,
  port: url.port || (isHttps ? 443 : 80),
  path: url.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('🚀 Sending request...');
console.log(`URL: ${url.toString()}`);
console.log(`Data: ${postData}`);
console.log('');

const req = client.request(options, (res) => {
  console.log(`📊 HTTP Status: ${res.statusCode}`);
  console.log(`📊 Headers:`, res.headers);
  console.log('');

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('📄 Response Body:');
    try {
      const jsonResponse = JSON.parse(data);
      console.log(JSON.stringify(jsonResponse, null, 2));
    } catch (e) {
      console.log(data);
    }
    console.log('');

    if (res.statusCode === 200) {
      console.log('✅ Test successful! Report should be sent.');
    } else {
      console.log('❌ Test failed! Check the response above.');
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
  process.exit(1);
});

req.write(postData);
req.end();
