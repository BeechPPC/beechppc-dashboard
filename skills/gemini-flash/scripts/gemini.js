#!/usr/bin/env node

require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL_ID = 'gemini-2.5-flash';

if (!GEMINI_API_KEY) {
  console.error('Error: GEMINI_API_KEY not found in environment');
  process.exit(1);
}

async function callGemini(prompt, options = {}) {
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent`;

  const data = {
    contents: [{
      role: "user",
      parts: [{ text: prompt }]
    }],
    generationConfig: {
      maxOutputTokens: options.maxTokens || 8192,
      temperature: options.temperature || 0.7
    }
  };

  const startTime = Date.now();

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': GEMINI_API_KEY
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error ${response.status}: ${error}`);
  }

  const result = await response.json();
  const duration = Date.now() - startTime;

  if (!result.candidates || result.candidates.length === 0) {
    throw new Error('No response from Gemini');
  }

  const text = result.candidates[0].content.parts[0].text;
  const usage = result.usageMetadata;

  return { text, usage, duration };
}

// Main execution
const prompt = process.argv[2];

if (!prompt) {
  console.error('Usage: gemini.js "your prompt here"');
  process.exit(1);
}

callGemini(prompt)
  .then(({ text, usage, duration }) => {
    console.log(text);
    console.log('\n---');
    console.log(`Duration: ${duration}ms | Tokens: ${usage?.promptTokenCount || '?'} in / ${usage?.candidatesTokenCount || '?'} out`);
  })
  .catch((error) => {
    console.error('Error:', error.message);
    process.exit(1);
  });
