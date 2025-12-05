#!/usr/bin/env node

/**
 * LLM Classification Module
 *
 * Multi-model support for efficient search term classification.
 * Supports Claude Haiku, Gemini Flash, and OpenAI GPT-4.1 nano.
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load .env from project root
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../../../../.env') });

import Anthropic from '@anthropic-ai/sdk';

// Model configurations with pricing (per 1M tokens)
const MODEL_CONFIGS = {
    'gemini-2.5-flash': {
        provider: 'google',
        model: 'gemini-2.5-flash',
        displayName: 'Gemini 2.5 Flash',
        inputPrice: 0.30,
        outputPrice: 2.50
    },
    'haiku-3.5': {
        provider: 'anthropic',
        model: 'claude-3-5-haiku-latest',
        displayName: 'Claude Haiku 3.5',
        inputPrice: 0.80,
        outputPrice: 4.00
    },
    'gpt-5-nano': {
        provider: 'openai',
        model: 'gpt-5-nano',
        displayName: 'GPT-5 Nano',
        inputPrice: 0.05,
        outputPrice: 0.40
    }
};

// Current model selection (can be changed at runtime)
let currentModelKey = 'gemini-2.5-flash';

// Account context for prompts
let accountContext = 'e-commerce store';

// Lazy-loaded clients
let anthropic = null;
let openai = null;
let googleGenAI = null;

function getAnthropicClient() {
    if (!anthropic) {
        anthropic = new Anthropic();
    }
    return anthropic;
}

async function getOpenAIClient() {
    if (!openai) {
        const { default: OpenAI } = await import('openai');
        openai = new OpenAI();
    }
    return openai;
}

async function getGoogleClient() {
    if (!googleGenAI) {
        const { GoogleGenAI } = await import('@anthropic-ai/sdk'); // Placeholder - need actual import
        // For Gemini, we'll use the REST API directly
    }
    return googleGenAI;
}

// Configuration
// Gemini 2.5 Flash uses ~250 "thinking" tokens per classification
// For batch of 50 terms, need ~15000 tokens to be safe
const MAX_TOKENS = 16384;

// Intent categories - 4 options for LLM
const INTENT_CATEGORIES = {
    high_intent: 'Ready to buy - clear purchase signals',
    medium_intent: 'Browsing products - might buy, unclear',
    low_intent: 'Researching or learning, not ready to buy',
    negative: 'Will never convert (jobs, DIY, social media, images)'
};

/**
 * Build the classification prompt - optimized for consistent output
 */
function buildPrompt(terms, isBatch = false) {
    if (isBatch) {
        return `You are classifying search terms for ${accountContext}.

For each search term, output EXACTLY ONE of these four words:
- high_intent = READY TO BUY. Has purchase signals: buy, order, price, cheap, sale, discount, deal, near me, best, top, vs, compare, review, specific sizes
- medium_intent = BROWSING. Product searches without clear buying signals. Just product names, brands, or general browsing. Could buy, could just be looking
- low_intent = LEARNING. Has question/research signals: how to, what is, why, guide, tutorial, tips, care, meaning, difference
- negative = WON'T BUY. Non-customer signals: jobs, careers, DIY, reddit, pinterest, youtube, images, photos, free pdf, login, wiki

EXAMPLES:
"buy [product] online" → high_intent (has "buy")
"best [product] australia" → high_intent (has "best")
"[brand] [product]" → medium_intent (just brand + product)
"[product type]" → medium_intent (just product browsing)
"how to [action]" → low_intent (has "how to")
"[product] jobs" → negative (has "jobs")

OUTPUT FORMAT: One word per line. No numbers, no punctuation, no explanations.

Search terms:
${terms.join('\n')}

Classifications:`;
    } else {
        return `Classify this search term for ${accountContext}.

Output EXACTLY ONE word:
- high_intent = ready to buy (has: buy, price, cheap, best, near me)
- medium_intent = browsing products (no clear signal)
- low_intent = learning (has: how to, what is, guide)
- negative = won't convert (has: jobs, reddit, images)

Search term: "${terms}"

Classification:`;
    }
}

/**
 * Normalize category name - handle common variations
 */
function normalizeCategory(raw) {
    const text = raw.toLowerCase().trim();

    // Direct matches first
    if (text === 'high_intent' || text === 'high-intent' || text === 'highintent') return 'high_intent';
    if (text === 'medium_intent' || text === 'medium-intent' || text === 'mediumintent') return 'medium_intent';
    if (text === 'low_intent' || text === 'low-intent' || text === 'lowintent') return 'low_intent';
    if (text === 'negative') return 'negative';

    // Synonyms - be careful with order (check specific before general)
    if (text === 'transactional' || text === 'buy' || text === 'purchase') return 'high_intent';
    if (text === 'commercial' || text === 'browsing' || text === 'browse') return 'medium_intent';
    if (text === 'informational' || text === 'research' || text === 'learn' || text === 'learning') return 'low_intent';
    if (text === 'exclude' || text === 'irrelevant' || text === 'no' || text === 'none') return 'negative';

    // Partial matches last (more risky)
    if (text.includes('high')) return 'high_intent';
    if (text.includes('medium')) return 'medium_intent';
    if (text.includes('low')) return 'low_intent';

    return null; // Unknown - will default to medium_intent
}

/**
 * Parse batch classification response
 */
function parseBatchResponse(response, terms) {
    const lines = response.trim().split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => {
            // Remove numbering, bullets, dashes (e.g., "1. high_intent" -> "high_intent")
            return line.replace(/^[\d\.\-\*\s]+/, '').trim();
        });

    const results = new Map();

    for (let i = 0; i < terms.length; i++) {
        const rawCategory = lines[i] || '';
        const category = normalizeCategory(rawCategory);

        if (category) {
            results.set(terms[i], {
                category,
                confidence: 0.85,
                method: 'llm_batch'
            });
        } else {
            // Default to medium_intent if we can't parse
            results.set(terms[i], {
                category: 'medium_intent',
                confidence: 0.6,
                method: 'llm_batch_default'
            });
        }
    }

    return results;
}

/**
 * Set the model to use for classification
 */
export function setModel(modelKey) {
    if (MODEL_CONFIGS[modelKey]) {
        currentModelKey = modelKey;
        console.log(`Using model: ${MODEL_CONFIGS[modelKey].displayName}`);
        return true;
    }
    console.warn(`Unknown model: ${modelKey}, keeping ${currentModelKey}`);
    return false;
}

/**
 * Set account context for more relevant classification
 */
export function setAccountContext(context) {
    accountContext = context;
}

/**
 * Get current model info
 */
export function getModelInfo() {
    return {
        key: currentModelKey,
        ...MODEL_CONFIGS[currentModelKey]
    };
}

/**
 * Get all available models
 */
export function getAvailableModels() {
    return Object.entries(MODEL_CONFIGS).map(([key, config]) => ({
        key,
        ...config
    }));
}

/**
 * Detect which API keys are available and return usable models
 */
export function getAvailableProviders() {
    const available = [];

    if (process.env.GEMINI_API_KEY) {
        available.push({
            provider: 'google',
            key: 'gemini-2.5-flash',
            model: MODEL_CONFIGS['gemini-2.5-flash'].model,
            displayName: MODEL_CONFIGS['gemini-2.5-flash'].displayName
        });
    }

    if (process.env.ANTHROPIC_API_KEY) {
        available.push({
            provider: 'anthropic',
            key: 'haiku-3.5',
            model: MODEL_CONFIGS['haiku-3.5'].model,
            displayName: MODEL_CONFIGS['haiku-3.5'].displayName
        });
    }

    if (process.env.OPENAI_API_KEY) {
        available.push({
            provider: 'openai',
            key: 'gpt-5-nano',
            model: MODEL_CONFIGS['gpt-5-nano'].model,
            displayName: MODEL_CONFIGS['gpt-5-nano'].displayName
        });
    }

    return available;
}

/**
 * Auto-select best available model (prefers Gemini 2.5 Flash)
 */
export function autoSelectModel() {
    const available = getAvailableProviders();

    if (available.length === 0) {
        throw new Error('No API keys configured. Set GEMINI_API_KEY, ANTHROPIC_API_KEY, or OPENAI_API_KEY');
    }

    // Preference order: Gemini 2.5 Flash > Claude Haiku > GPT-5 Nano
    const gemini = available.find(p => p.provider === 'google');
    if (gemini) {
        setModel(gemini.key);
        return gemini;
    }

    const anthropic = available.find(p => p.provider === 'anthropic');
    if (anthropic) {
        setModel(anthropic.key);
        return anthropic;
    }

    const openai = available.find(p => p.provider === 'openai');
    if (openai) {
        setModel(openai.key);
        return openai;
    }

    throw new Error('No usable API keys found');
}

/**
 * Call Anthropic API
 */
async function callAnthropic(prompt) {
    const client = getAnthropicClient();
    const config = MODEL_CONFIGS[currentModelKey];
    const response = await client.messages.create({
        model: config.model,
        max_tokens: MAX_TOKENS,
        messages: [{ role: 'user', content: prompt }]
    });
    return response.content[0].text;
}

/**
 * Call OpenAI API
 */
async function callOpenAI(prompt) {
    const client = await getOpenAIClient();
    const config = MODEL_CONFIGS[currentModelKey];
    const response = await client.chat.completions.create({
        model: config.model,
        max_completion_tokens: MAX_TOKENS,  // GPT-5 uses max_completion_tokens
        messages: [{ role: 'user', content: prompt }]
    });
    return response.choices[0].message.content;
}

/**
 * Call Google Gemini API via REST
 */
async function callGemini(prompt) {
    const config = MODEL_CONFIGS[currentModelKey];
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error('GEMINI_API_KEY not set');
    }

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { maxOutputTokens: MAX_TOKENS }
            })
        }
    );

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Gemini API error: ${error}`);
    }

    const data = await response.json();

    // Handle missing or blocked responses
    if (!data.candidates || data.candidates.length === 0) {
        if (data.promptFeedback?.blockReason) {
            throw new Error(`Gemini blocked: ${data.promptFeedback.blockReason}`);
        }
        throw new Error('Gemini returned no candidates');
    }

    const candidate = data.candidates[0];
    if (candidate.finishReason === 'SAFETY') {
        throw new Error('Gemini blocked for safety reasons');
    }

    if (!candidate.content?.parts?.[0]?.text) {
        throw new Error(`Gemini unexpected response structure: ${JSON.stringify(data).slice(0, 200)}`);
    }

    return candidate.content.parts[0].text;
}

/**
 * Universal LLM call dispatcher
 */
async function callLLM(prompt) {
    const config = MODEL_CONFIGS[currentModelKey];

    switch (config.provider) {
        case 'anthropic':
            return callAnthropic(prompt);
        case 'openai':
            return callOpenAI(prompt);
        case 'google':
            return callGemini(prompt);
        default:
            throw new Error(`Unknown provider: ${config.provider}`);
    }
}

/**
 * Classify a single search term
 */
export async function classifySingle(term) {
    try {
        const response = await callLLM(buildPrompt(term, false));
        const category = response.trim().toLowerCase();
        const validCategories = Object.keys(INTENT_CATEGORIES);

        if (validCategories.includes(category)) {
            return {
                category,
                confidence: 0.95,
                method: 'llm_individual'
            };
        } else {
            return {
                category: 'ambiguous',
                confidence: 0.6,
                method: 'llm_individual_fallback'
            };
        }
    } catch (error) {
        console.error(`Error classifying "${term}":`, error.message);
        // Return null on error - caller keeps original classification
        return null;
    }
}

/**
 * Classify a batch of search terms (more efficient)
 * Recommended batch size: 20-30 terms for rate limit safety
 */
export async function classifyBatch(terms, retryCount = 0) {
    if (terms.length === 0) return new Map();

    const MAX_RETRIES = 3;
    const RETRY_DELAYS = [5000, 15000, 30000]; // 5s, 15s, 30s

    try {
        const response = await callLLM(buildPrompt(terms, true));
        return parseBatchResponse(response, terms);
    } catch (error) {
        const isRateLimit = error.message?.includes('rate_limit') || error.message?.includes('429');

        if (isRateLimit && retryCount < MAX_RETRIES) {
            const delay = RETRY_DELAYS[retryCount];
            console.log(`Rate limited. Waiting ${delay/1000}s before retry ${retryCount + 1}/${MAX_RETRIES}...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return classifyBatch(terms, retryCount + 1);
        }

        console.error('Batch classification error:', error.message);

        // Return empty map on error - caller should keep original classifications
        // DO NOT return "ambiguous" - that's not a valid category
        return new Map();
    }
}

/**
 * Classify multiple terms with progress callback
 * Automatically batches for efficiency
 */
export async function classifyMultiple(terms, options = {}) {
    const {
        batchSize = 50,
        onProgress = null,
        individualThreshold = 100  // Use individual calls for small sets
    } = options;

    const results = new Map();
    const total = terms.length;

    if (total === 0) return results;

    // For very small sets, use individual classification
    if (total <= individualThreshold) {
        for (let i = 0; i < terms.length; i++) {
            const term = terms[i];
            const result = await classifySingle(term);
            results.set(term, result);

            if (onProgress) {
                onProgress({
                    completed: i + 1,
                    total,
                    current: term,
                    category: result.category
                });
            }
        }
        return results;
    }

    // For larger sets, use batched classification
    const batches = Math.ceil(total / batchSize);

    for (let i = 0; i < total; i += batchSize) {
        const batch = terms.slice(i, i + batchSize);
        const batchNum = Math.floor(i / batchSize) + 1;

        if (onProgress) {
            onProgress({
                batch: batchNum,
                totalBatches: batches,
                batchSize: batch.length,
                completed: i,
                total
            });
        }

        const batchResults = await classifyBatch(batch);
        for (const [term, classification] of batchResults) {
            results.set(term, classification);
        }

        // Delay between batches to avoid rate limiting
        // 200ms delay = ~300 batches/min - fast but safe for Gemini
        if (i + batchSize < total) {
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }

    return results;
}

/**
 * Get estimated cost for classification
 * Uses current model's pricing
 */
export function estimateCost(termCount, method = 'batch', modelKey = null) {
    const config = MODEL_CONFIGS[modelKey || currentModelKey];
    const inputPrice = config.inputPrice;
    const outputPrice = config.outputPrice;

    if (method === 'batch') {
        // Batch of 50: ~300 input tokens, ~60 output tokens
        const batches = Math.ceil(termCount / 50);
        const inputTokens = batches * 300;
        const outputTokens = batches * 60;
        const cost = (inputTokens * inputPrice / 1_000_000) + (outputTokens * outputPrice / 1_000_000);
        return { inputTokens, outputTokens, cost, calls: batches, model: config.displayName };
    } else {
        // Individual: ~50 input tokens, ~5 output tokens per call
        const inputTokens = termCount * 50;
        const outputTokens = termCount * 5;
        const cost = (inputTokens * inputPrice / 1_000_000) + (outputTokens * outputPrice / 1_000_000);
        return { inputTokens, outputTokens, cost, calls: termCount, model: config.displayName };
    }
}

// CLI interface for testing
if (import.meta.url === `file://${process.argv[1]}`) {
    const args = process.argv.slice(2);

    if (args[0] === '--test-single') {
        const term = args.slice(1).join(' ') || 'buy pool pump online';
        console.log(`Classifying: "${term}"`);

        classifySingle(term).then(result => {
            console.log('Result:', result);
        }).catch(err => {
            console.error('Error:', err.message);
        });
    } else if (args[0] === '--test-batch') {
        const testTerms = [
            'buy pool pump',
            'best pool pump 2024',
            'how to install pool pump',
            'pool pump near me',
            'amazon.com pool pump',
            'cheap pool pumps for sale',
            'pool pump vs filter',
            'what is a variable speed pump',
            'pool supplies melbourne',
            'pool pump installation cost',
        ];

        console.log(`Batch classifying ${testTerms.length} terms...`);

        classifyBatch(testTerms).then(results => {
            console.log('\nResults:');
            for (const [term, classification] of results) {
                console.log(`  "${term}" → ${classification.category}`);
            }
        }).catch(err => {
            console.error('Error:', err.message);
        });
    } else if (args[0] === '--estimate') {
        const count = parseInt(args[1]) || 30000;
        const batchEst = estimateCost(count, 'batch');
        const individualEst = estimateCost(count, 'individual');

        console.log(`Cost estimate for ${count.toLocaleString()} terms:`);
        console.log('\nBatched (recommended):');
        console.log(`  API calls: ${batchEst.calls.toLocaleString()}`);
        console.log(`  Tokens: ${batchEst.inputTokens.toLocaleString()} in / ${batchEst.outputTokens.toLocaleString()} out`);
        console.log(`  Est. cost: $${batchEst.cost.toFixed(4)}`);

        console.log('\nIndividual (not recommended):');
        console.log(`  API calls: ${individualEst.calls.toLocaleString()}`);
        console.log(`  Tokens: ${individualEst.inputTokens.toLocaleString()} in / ${individualEst.outputTokens.toLocaleString()} out`);
        console.log(`  Est. cost: $${individualEst.cost.toFixed(4)}`);
    } else {
        console.log('Usage:');
        console.log('  llm.js --test-single <search term>');
        console.log('  llm.js --test-batch');
        console.log('  llm.js --estimate <term_count>');
    }
}

export default {
    classifySingle,
    classifyBatch,
    classifyMultiple,
    estimateCost,
    setModel,
    getModelInfo,
    getAvailableModels,
    getAvailableProviders,
    autoSelectModel,
    INTENT_CATEGORIES,
    MODEL_CONFIGS
};
