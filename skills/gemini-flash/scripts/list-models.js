#!/usr/bin/env node

require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function listModels() {
  const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models';

  const response = await fetch(apiUrl, {
    headers: {
      'x-goog-api-key': GEMINI_API_KEY
    }
  });

  if (!response.ok) {
    throw new Error(`API Error ${response.status}`);
  }

  const result = await response.json();

  console.log('Available Gemini Models:\n');

  result.models
    .filter(m => m.name.includes('flash') || m.name.includes('2.5'))
    .forEach(model => {
      console.log(`${model.name}`);
      console.log(`  Display: ${model.displayName}`);
      console.log(`  Methods: ${model.supportedGenerationMethods.join(', ')}\n`);
    });
}

listModels().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
