#!/usr/bin/env node

/**
 * Search Term Classifier - Main Pipeline
 *
 * New classification pipeline (minimal LLM):
 * 1. Language check (flag non-Latin if account is Latin-dominant)
 * 2. brand_strings match → brand
 * 3. Cache lookup
 * 4. Signal-based classification → high/low/negative/medium_intent
 * 5. Similarity matching → inherit from known brands
 * 6. Low volume (bottom 5%) → low_volume
 * 7. Cache inheritance (predictive words)
 * 8. Remaining unknowns → LLM batch for brand identification
 *
 * Categories:
 * - brand: Your brand (from brand_strings)
 * - navigational: Brand searches (known brands)
 * - high_intent: Clear purchase signals
 * - medium_intent: Product searches, no signal (DEFAULT)
 * - low_intent: Research/learning
 * - negative: Won't convert
 * - low_volume: Bottom 5% by impressions
 * - non_latin: Non-Latin in Latin-dominant account
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

import { ClassificationCache } from './cache.js';
import { classifyBySignal, classifyBatchBySignal } from './patterns.js';
import {
    levenshteinSimilarity,
    findBestMatch,
    batchMatch,
    analyzeLanguageProfile,
    latinRatio
} from './similarity.js';
import { classifyMultiple as llmClassifyMultiple, setModel, getModelInfo, setAccountContext } from './llm.js';
import { MLPropagator, estimateCoverage } from './propagate.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Configuration
const LOW_VOLUME_THRESHOLD = 0.95; // Bottom 5% of impressions
const SIMILARITY_THRESHOLD = 0.80; // For brand matching
const PREDICTIVE_MIN_COUNT = 10; // Minimum occurrences for a word to be predictive
const PREDICTIVE_CONFIDENCE = 0.80; // 80% of occurrences must predict same category

// Load account info from accounts.json
function loadAccountInfo(accountId) {
    // Try multiple locations for accounts.json
    const possiblePaths = [
        resolve(process.cwd(), '.claude/accounts.json'),
        resolve(__dirname, '../../../../.claude/accounts.json'),
        resolve(__dirname, '../../../accounts.json'),
    ];

    let accountsPath = null;
    for (const p of possiblePaths) {
        if (existsSync(p)) {
            accountsPath = p;
            break;
        }
    }

    if (!accountsPath) return null;

    try {
        const accounts = JSON.parse(readFileSync(accountsPath, 'utf8'));
        for (const [key, account] of Object.entries(accounts)) {
            if (account.id === accountId) {
                return { key, ...account };
            }
        }
        return null;
    } catch (err) {
        console.warn('Warning: Could not load accounts.json:', err.message);
        return null;
    }
}

// Parse CLI arguments
function parseArgs() {
    return process.argv.slice(2).reduce((acc, arg) => {
        if (arg.includes('=')) {
            const [key, value] = arg.split('=');
            acc[key.replace('--', '')] = value;
        } else if (arg.startsWith('--')) {
            acc[arg.replace('--', '')] = true;
        }
        return acc;
    }, {});
}

// Parse CSV with flexible column detection
function parseCSV(content) {
    // Clean Google Ads export headers
    const lines = content.trim().split('\n');
    let startLine = 0;

    // Skip metadata lines (report name, date range)
    if (lines[0] && (lines[0].match(/,/g) || []).length < 3) {
        startLine = 1;
        if (lines[1] && (lines[1].match(/,/g) || []).length < 3) {
            startLine = 2;
        }
    }

    const headers = lines[startLine].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows = [];

    for (let i = startLine + 1; i < lines.length; i++) {
        const values = [];
        let current = '';
        let inQuotes = false;

        for (const char of lines[i]) {
            if (char === '"') inQuotes = !inQuotes;
            else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim());

        const row = {};
        headers.forEach((h, idx) => row[h] = values[idx] || '');
        rows.push(row);
    }

    return { headers, rows };
}

// Find column by various naming conventions
function findColumn(headers, candidates) {
    for (const candidate of candidates) {
        if (headers.includes(candidate)) return candidate;
        const lower = candidate.toLowerCase();
        const match = headers.find(h => h.toLowerCase() === lower);
        if (match) return match;
    }
    return null;
}

// Build predictive words from cache
function buildPredictiveWords(cache, accountId) {
    const wordCategories = new Map();
    const allCached = cache.getAllForAccount(accountId);

    for (const { term, category } of allCached) {
        const words = term.split(/\s+/).filter(w => w.length > 2);
        for (const word of words) {
            if (!wordCategories.has(word)) wordCategories.set(word, {});
            wordCategories.get(word)[category] = (wordCategories.get(word)[category] || 0) + 1;
        }
    }

    const predictive = new Map();
    for (const [word, cats] of wordCategories) {
        const total = Object.values(cats).reduce((a, b) => a + b, 0);
        if (total >= PREDICTIVE_MIN_COUNT) {
            const sorted = Object.entries(cats).sort((a, b) => b[1] - a[1]);
            const [topCat, topCount] = sorted[0];
            if (topCount / total >= PREDICTIVE_CONFIDENCE) {
                predictive.set(word, { category: topCat, confidence: topCount / total });
            }
        }
    }

    return predictive;
}

// Main classification pipeline
async function classify(inputPath, accountId, outputPath, options = {}) {
    const { rebuild = false, dryRun = false, verbose = false, model = 'haiku', runLlm = false, llmLimit = 1000 } = options;

    if (model) setModel(model);
    const modelInfo = getModelInfo();

    const startTime = Date.now();
    const stats = {
        total: 0,
        brand: 0,
        cacheHits: 0,
        signalMatches: 0,
        similarityMatches: 0,
        predictiveMatches: 0,
        lowVolume: 0,
        nonLatin: 0,
        llmCalls: 0,
        propagated: 0,
        medium: 0,
    };

    const log = (msg) => verbose && console.log(msg);

    // Initialize cache
    const cache = new ClassificationCache();

    if (rebuild) {
        log('Rebuilding cache for account...');
        cache.clearAccount(accountId);
    }

    // Load account info
    const accountInfo = loadAccountInfo(accountId);
    const brandStrings = accountInfo?.brand_strings || [];
    const knownBrands = accountInfo?.sold_brands || accountInfo?.competitor_strings || [];

    console.log('='.repeat(60));
    console.log('SEARCH TERM CLASSIFIER');
    console.log('='.repeat(60));
    console.log('');

    if (accountInfo) {
        console.log(`Account: ${accountInfo.name} (${accountInfo.currency})`);
        console.log(`Model: ${modelInfo.displayName}`);
        console.log(`Brand strings: ${brandStrings.length > 0 ? brandStrings.join(', ') : '(none)'}`);
        console.log(`Known brands: ${knownBrands.length > 0 ? knownBrands.join(', ') : '(none)'}`);
        // Set account context for LLM prompts
        const businessType = accountInfo.business_type || accountInfo.name || 'e-commerce store';
        setAccountContext(`a ${businessType} business`);
    } else {
        console.log(`Account: ${accountId}`);
        console.log(`Model: ${modelInfo.displayName}`);
        setAccountContext('an e-commerce store');
    }
    console.log('');

    // Read input file
    const content = readFileSync(inputPath, 'utf8');
    const { headers, rows } = parseCSV(content);
    stats.total = rows.length;

    console.log(`Loaded ${stats.total.toLocaleString()} rows`);

    // Find columns
    const termCol = findColumn(headers, ['search_term_view.search_term', 'search_term', 'Search term', 'query']);
    const impCol = findColumn(headers, ['metrics.impressions', 'impressions', 'Impressions', 'Impr']);
    const sourceCol = findColumn(headers, ['source']);

    if (!termCol || !impCol) {
        throw new Error(`Required columns not found. Available: ${headers.join(', ')}`);
    }

    console.log(`Term column: ${termCol}`);
    console.log(`Impressions column: ${impCol}`);
    if (sourceCol) console.log(`Source column: ${sourceCol}`);
    console.log('');

    // Build term -> impressions map and get unique terms
    // Also track PMax Uncategorized terms
    const termImpressions = new Map();
    const pmaxUncategorizedTerms = new Set();
    let totalImpressions = 0;

    for (const row of rows) {
        const term = row[termCol]?.toLowerCase().trim();
        const imp = parseInt(row[impCol]) || 0;
        const source = sourceCol ? row[sourceCol] : null;
        if (term) {
            termImpressions.set(term, (termImpressions.get(term) || 0) + imp);
            totalImpressions += imp;
            // Track PMax Uncategorized (term is 'uncategorized' from PMax source)
            if (source === 'P' && term === 'uncategorized') {
                pmaxUncategorizedTerms.add(term);
            }
        }
    }

    const allTerms = [...termImpressions.keys()];
    console.log(`Unique terms: ${allTerms.length.toLocaleString()}`);
    console.log(`Total impressions: ${totalImpressions.toLocaleString()}`);
    if (pmaxUncategorizedTerms.size > 0) {
        console.log(`PMax Uncategorized: ${pmaxUncategorizedTerms.size}`);
    }
    console.log('');

    // Classification results
    const results = new Map();

    // Track low volume terms separately (they can be overridden by brand/competitor)
    const lowVolumeTerms = new Set();

    // Pre-classify PMax Uncategorized terms
    for (const term of pmaxUncategorizedTerms) {
        results.set(term, { category: 'pmax_uncategorized', confidence: 1.0, method: 'pmax_hidden' });
    }

    // ============================================
    // STEP 1: Language Check
    // ============================================
    console.log('--- Step 1: Language Check ---');
    const langProfile = analyzeLanguageProfile(allTerms);
    console.log(`Account language: ${(langProfile.avgLatinRatio * 100).toFixed(1)}% Latin`);

    if (langProfile.isLatinDominant && langProfile.nonLatinTerms.length > 0) {
        console.log(`Non-Latin terms flagged: ${langProfile.nonLatinTerms.length}`);
        for (const term of langProfile.nonLatinTerms) {
            results.set(term, { category: 'non_latin', confidence: 1.0, method: 'language_check' });
            stats.nonLatin++;
        }
    }
    console.log('');

    // ============================================
    // STEP 2: Low Volume Detection (FIRST - before other classification)
    // Brand/competitor can override, but cache/signal cannot
    // ============================================
    console.log('--- Step 2: Low Volume Detection ---');
    const sortedByImp = [...termImpressions.entries()].sort((a, b) => b[1] - a[1]);
    let cumulative = 0;

    for (const [term, imp] of sortedByImp) {
        cumulative += imp;
        if (cumulative / totalImpressions > LOW_VOLUME_THRESHOLD && !results.has(term)) {
            lowVolumeTerms.add(term);
            results.set(term, { category: 'low_volume', confidence: 1.0, method: 'low_volume' });
            stats.lowVolume++;
        }
    }
    console.log(`Low volume terms: ${stats.lowVolume.toLocaleString()}`);
    console.log('');

    // ============================================
    // STEP 3: Brand Strings Match (CAN override low_volume)
    // ============================================
    console.log('--- Step 3: Brand String Match ---');
    const lowerBrandStrings = brandStrings.map(s => s.toLowerCase());

    for (const term of allTerms) {
        // Skip non-Latin, but CAN override low_volume
        if (results.has(term) && results.get(term).category !== 'low_volume') continue;

        const matchedBrand = lowerBrandStrings.find(bs => term.includes(bs));
        if (matchedBrand) {
            // Override low_volume if applicable
            if (lowVolumeTerms.has(term)) {
                stats.lowVolume--;  // Remove from low volume count
            }
            results.set(term, { category: 'brand', confidence: 1.0, method: `brand_string:${matchedBrand}` });
            stats.brand++;
        }
    }
    console.log(`Brand matches: ${stats.brand.toLocaleString()}`);
    console.log('');

    // ============================================
    // STEP 4: Competitor/Sold Brand Strings Match (CAN override low_volume)
    // ============================================
    if (knownBrands.length > 0) {
        console.log('--- Step 4: Competitor/Sold Brand Match ---');
        const lowerKnownBrands = knownBrands.map(s => s.toLowerCase());
        let competitorMatches = 0;

        for (const term of allTerms) {
            // Skip already classified (except low_volume)
            if (results.has(term) && results.get(term).category !== 'low_volume') continue;

            const matchedBrand = lowerKnownBrands.find(kb => term.includes(kb));
            if (matchedBrand) {
                // Override low_volume if applicable
                if (lowVolumeTerms.has(term)) {
                    stats.lowVolume--;
                }
                results.set(term, { category: 'navigational', confidence: 1.0, method: `competitor_string:${matchedBrand}` });
                competitorMatches++;
            }
        }
        console.log(`Competitor matches: ${competitorMatches.toLocaleString()}`);
        console.log('');
    }

    // ============================================
    // STEP 5: Cache Lookup (CANNOT override low_volume)
    // Cache only contains LLM-classified terms from previous runs
    // ============================================
    console.log('--- Step 5: Cache Lookup (LLM terms) ---');
    // Only look up terms that aren't low_volume or already classified
    const uncachedTerms = allTerms.filter(t => !results.has(t));
    const cached = cache.getBatch(accountId, uncachedTerms);

    for (const term of uncachedTerms) {
        const normalized = cache.normalize(term);
        const cachedCategory = cached.get(normalized);
        if (cachedCategory) {
            results.set(term, {
                category: cachedCategory,
                confidence: 0.85,  // LLM confidence
                method: 'cache'
            });
            stats.cacheHits++;
        }
    }
    console.log(`Cache hits (prior LLM): ${stats.cacheHits.toLocaleString()}`);
    console.log('');

    // ============================================
    // STEP 6: Signal-Based Classification (CANNOT override low_volume)
    // ============================================
    console.log('--- Step 6: Signal-Based Classification ---');
    const unclassified = allTerms.filter(t => !results.has(t));

    for (const term of unclassified) {
        const signalResult = classifyBySignal(term);
        if (signalResult) {
            results.set(term, {
                category: signalResult.category,
                confidence: signalResult.confidence,
                method: `signal:${signalResult.signal}`
            });
            stats.signalMatches++;
        }
    }
    console.log(`Signal matches: ${stats.signalMatches.toLocaleString()}`);
    console.log('');

    // ============================================
    // STEP 7: Similarity Matching (if known brands configured)
    // ============================================
    if (knownBrands.length > 0) {
        console.log('--- Step 7: Similarity Matching ---');
        const stillUnclassified = allTerms.filter(t => !results.has(t));

        // Extract single-word terms that might be brand misspellings
        const singleWordTerms = stillUnclassified.filter(t => t.split(/\s+/).length === 1);

        const matches = batchMatch(singleWordTerms, knownBrands, { minSimilarity: SIMILARITY_THRESHOLD });

        for (const [term, match] of matches) {
            results.set(term, {
                category: 'navigational',
                confidence: match.similarity,
                method: `similar_to:${match.match}`
            });
            stats.similarityMatches++;
        }
        console.log(`Similarity matches: ${stats.similarityMatches.toLocaleString()}`);
        console.log('');
    }

    // ============================================
    // STEP 8: Cache-Based Prediction
    // ============================================
    console.log('--- Step 8: Cache Prediction ---');
    const predictiveWords = buildPredictiveWords(cache, accountId);
    console.log(`Predictive words: ${predictiveWords.size}`);

    const stillUnclassified = allTerms.filter(t => !results.has(t));
    for (const term of stillUnclassified) {
        const words = term.split(/\s+/);
        for (const word of words) {
            const prediction = predictiveWords.get(word);
            if (prediction) {
                results.set(term, {
                    category: prediction.category,
                    confidence: prediction.confidence * 0.9,
                    method: `predicted_from:${word}`
                });
                stats.predictiveMatches++;
                break;
            }
        }
    }
    console.log(`Predictive matches: ${stats.predictiveMatches.toLocaleString()}`);
    console.log('');

    // ============================================
    // STEP 9: Remaining Terms - Offer LLM Option
    // ============================================
    console.log('--- Step 9: Remaining Terms ---');
    const remaining = allTerms.filter(t => !results.has(t));
    console.log(`Remaining unclassified: ${remaining.length.toLocaleString()}`);

    // Calculate LLM cost estimate
    // Average ~15 tokens per term, batched 50 per call
    // Haiku: $0.25/MTok input, $1.25/MTok output
    const avgTokensPerTerm = 15;
    const batchSize = 50;
    const estimatedCalls = Math.ceil(remaining.length / batchSize);
    const estimatedInputTokens = remaining.length * avgTokensPerTerm;
    const estimatedOutputTokens = remaining.length * 5; // ~5 tokens per classification
    const costPerMTokInput = modelInfo.inputCostPerMTok || 0.25;
    const costPerMTokOutput = modelInfo.outputCostPerMTok || 1.25;
    const estimatedCost = (estimatedInputTokens / 1_000_000 * costPerMTokInput) +
                          (estimatedOutputTokens / 1_000_000 * costPerMTokOutput);

    if (remaining.length > 0 && !runLlm) {
        console.log('');
        const termStr = remaining.length.toLocaleString();
        const modelStr = modelInfo.displayName;
        const callsStr = estimatedCalls.toLocaleString();
        const costStr = `$${estimatedCost.toFixed(2)}`;

        console.log('┌────────────────────────────────────────────────────────┐');
        console.log('│  LLM CLASSIFICATION AVAILABLE                          │');
        console.log('├────────────────────────────────────────────────────────┤');
        console.log(`│  Terms needing LLM: ${termStr.padEnd(35)}│`);
        console.log(`│  Model: ${modelStr.padEnd(46)}│`);
        console.log(`│  Estimated calls: ${callsStr.padEnd(37)}│`);
        console.log(`│  Estimated cost: ${costStr.padEnd(38)}│`);
        console.log('├────────────────────────────────────────────────────────┤');
        console.log('│  Add --run-llm to classify these terms                 │');
        console.log('│  Without LLM, these default to "medium_intent"         │');
        console.log('└────────────────────────────────────────────────────────┘');
        console.log('');

        // Default remaining to medium_intent
        for (const term of remaining) {
            results.set(term, {
                category: 'medium_intent',
                confidence: 0.5,
                method: 'default_no_llm'
            });
            stats.medium++;
        }
    } else if (remaining.length > 0 && runLlm) {
        // Sort remaining terms by impressions (highest first) and cap at llmLimit
        const sortedRemaining = remaining
            .map(term => ({ term, impressions: termImpressions.get(term) || 0 }))
            .sort((a, b) => b.impressions - a.impressions);

        const termsForLlm = sortedRemaining.slice(0, llmLimit).map(t => t.term);
        const termsToPropagate = sortedRemaining.slice(llmLimit).map(t => t.term);

        const llmBatchSize = 100;  // Larger batches for speed
        const llmEstCalls = Math.ceil(termsForLlm.length / llmBatchSize);

        console.log(`Running LLM classification for TOP ${termsForLlm.length.toLocaleString()} terms by impressions...`);
        console.log(`Remaining ${termsToPropagate.length.toLocaleString()} terms will be classified via ML propagation`);
        console.log(`Batches: ${llmEstCalls} @ ${llmBatchSize} terms each`);
        console.log('');

        // Capture "before" state - what would have been medium_intent
        const beforeDist = {
            high_intent: stats.signalMatches,
            low_intent: 0,
            negative: 0,
            medium_intent: termsForLlm.length  // Only counting terms we're actually classifying
        };
        // Count existing signal matches by category
        for (const [term, result] of results) {
            if (result.method === 'signal') {
                if (result.category === 'low_intent') beforeDist.low_intent++;
                if (result.category === 'negative') beforeDist.negative++;
                if (result.category === 'high_intent') beforeDist.high_intent++;
            }
        }

        try {
            const llmResults = await llmClassifyMultiple(termsForLlm, {
                batchSize: llmBatchSize,
                onProgress: (progress) => {
                    if (progress.batch) {
                        process.stdout.write(`\r  Progress: ${progress.batch}/${progress.totalBatches} batches`);
                    }
                }
            });
            console.log('');

            // Track LLM category distribution for before/after
            const llmDist = { high_intent: 0, medium_intent: 0, low_intent: 0, negative: 0 };

            for (const [term, classification] of llmResults) {
                results.set(term, {
                    category: classification.category,
                    confidence: classification.confidence || 0.85,
                    method: 'llm'
                });
                stats.llmCalls++;
                if (llmDist[classification.category] !== undefined) {
                    llmDist[classification.category]++;
                }
            }
            console.log(`LLM classified: ${stats.llmCalls.toLocaleString()}`);

            // Show before/after comparison
            console.log('');
            console.log('┌────────────────────────────────────────────────────────┐');
            console.log('│  LLM CLASSIFICATION IMPACT                             │');
            console.log('├────────────────────────────────────────────────────────┤');
            console.log('│  Category         Before LLM    After LLM    Change   │');
            console.log('├────────────────────────────────────────────────────────┤');

            const afterDist = {
                high_intent: beforeDist.high_intent - stats.signalMatches + llmDist.high_intent + stats.signalMatches,
                medium_intent: llmDist.medium_intent,
                low_intent: beforeDist.low_intent + llmDist.low_intent,
                negative: beforeDist.negative + llmDist.negative
            };

            // Simpler: just count from rules then add LLM
            const categories = ['high_intent', 'medium_intent', 'low_intent', 'negative'];
            for (const cat of categories) {
                const before = cat === 'medium_intent' ? remaining.length : 0;
                const after = llmDist[cat];
                const change = after - before;
                const changeStr = change > 0 ? `+${change.toLocaleString()}` : change.toLocaleString();
                const arrow = change > 0 ? '↑' : (change < 0 ? '↓' : '→');
                console.log(`│  ${cat.padEnd(16)} ${before.toLocaleString().padStart(10)}  ${after.toLocaleString().padStart(10)}  ${arrow} ${changeStr.padStart(6)} │`);
            }
            console.log('└────────────────────────────────────────────────────────┘');

            // Store LLM impact for report
            stats.llmImpact = {
                termsProcessed: termsForLlm.length,
                distribution: llmDist,
                reclassified: termsForLlm.length - llmDist.medium_intent
            };

            // ============================================
            // STEP 10: ML Propagation
            // ============================================
            if (termsToPropagate.length > 0) {
                console.log('');
                console.log('--- Step 10: ML Propagation ---');
                console.log(`Learning patterns from ${stats.llmCalls.toLocaleString()} LLM-classified terms...`);

                // Build training data from LLM results
                const llmTrainingData = [];
                for (const [term, classification] of llmResults) {
                    llmTrainingData.push({ term, category: classification.category });
                }

                // Also include signal-classified terms for more training data
                for (const [term, result] of results) {
                    if (result.method === 'signal') {
                        llmTrainingData.push({ term, category: result.category });
                    }
                }

                const propagator = new MLPropagator();
                propagator.learn(llmTrainingData);
                const propStats = propagator.getStats();
                console.log(`  Word patterns: ${propStats.wordPatterns}`);
                console.log(`  N-gram patterns: ${propStats.ngramPatterns}`);
                console.log(`  Vocabulary size: ${propStats.vocabularySize}`);

                // Classify remaining terms
                console.log(`Propagating to ${termsToPropagate.length.toLocaleString()} terms...`);
                const { results: propResults, matched: propMatched } = propagator.classifyBatch(termsToPropagate, {
                    minSimilarity: 0.4,  // Lower threshold for better coverage
                    k: 5
                });

                // Track propagation method breakdown
                const propMethods = { ngram: 0, word_pattern: 0, knn: 0 };

                for (const [term, propResult] of propResults) {
                    results.set(term, {
                        category: propResult.category,
                        confidence: propResult.confidence * 0.85,  // Slightly lower confidence for propagated
                        method: `propagated:${propResult.method}`
                    });
                    stats.propagated++;

                    // Track method
                    if (propResult.method.startsWith('ngram')) propMethods.ngram++;
                    else if (propResult.method === 'word_pattern') propMethods.word_pattern++;
                    else if (propResult.method.startsWith('knn')) propMethods.knn++;
                }

                console.log(`Propagated: ${propMatched.toLocaleString()} (${((propMatched / termsToPropagate.length) * 100).toFixed(1)}%)`);
                console.log(`  N-gram matches: ${propMethods.ngram.toLocaleString()}`);
                console.log(`  Word pattern matches: ${propMethods.word_pattern.toLocaleString()}`);
                console.log(`  KNN similarity matches: ${propMethods.knn.toLocaleString()}`);

                // Default truly unmatched terms
                const stillUnmatched = termsToPropagate.filter(t => !results.has(t));
                console.log(`Defaulting ${stillUnmatched.length.toLocaleString()} unmatched terms to medium_intent`);

                for (const term of stillUnmatched) {
                    results.set(term, {
                        category: 'medium_intent',
                        confidence: 0.5,
                        method: 'default_after_propagation'
                    });
                    stats.medium++;
                }

                // Store propagation stats for report
                stats.propagationStats = {
                    trained: llmTrainingData.length,
                    propagated: propMatched,
                    methods: propMethods,
                    defaulted: stillUnmatched.length
                };
            }

        } catch (err) {
            console.error('LLM classification failed:', err.message);
            console.log('Defaulting remaining terms to medium_intent');

            for (const term of remaining) {
                if (!results.has(term)) {
                    results.set(term, {
                        category: 'medium_intent',
                        confidence: 0.5,
                        method: 'default_llm_failed'
                    });
                    stats.medium++;
                }
            }
        }
    } else {
        console.log('No remaining terms to classify.');
    }
    console.log('');

    // ============================================
    // Save to cache and output
    // ============================================
    if (!dryRun) {
        console.log('--- Saving Results ---');

        // Save ONLY LLM-classified terms to cache
        // Rule-based classifications are not cached (can be reapplied instantly)
        const llmClassifications = [];
        for (const [term, result] of results) {
            if (result.method === 'llm') {
                llmClassifications.push({
                    searchTerm: term,
                    category: result.category
                });
            }
        }

        if (llmClassifications.length > 0) {
            cache.setBatch(accountId, llmClassifications);
            console.log(`Saved ${llmClassifications.length.toLocaleString()} LLM classifications to cache`);
        } else {
            console.log('No new LLM classifications to cache');
        }

        // Write output CSV
        const outputHeaders = [...headers, 'intent_category', 'intent_confidence', 'intent_method'];
        const csvLines = [outputHeaders.join(',')];

        for (const row of rows) {
            const term = row[termCol]?.toLowerCase().trim();
            const classification = results.get(term) || { category: 'unknown', confidence: 0, method: 'unknown' };

            const values = outputHeaders.map(h => {
                let val;
                if (h === 'intent_category') val = classification.category;
                else if (h === 'intent_confidence') val = classification.confidence;
                else if (h === 'intent_method') val = classification.method;
                else val = row[h];

                if (val === undefined || val === null) val = '';
                val = String(val);
                if (val.includes(',') || val.includes('"') || val.includes('\n')) {
                    val = `"${val.replace(/"/g, '""')}"`;
                }
                return val;
            });

            csvLines.push(values.join(','));
        }

        writeFileSync(outputPath, csvLines.join('\n'));
        console.log(`Output: ${outputPath}`);
    }

    cache.close();

    // ============================================
    // Summary
    // ============================================
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('');
    console.log('='.repeat(60));
    console.log('CLASSIFICATION COMPLETE');
    console.log('='.repeat(60));
    console.log('');
    console.log(`Time: ${elapsed}s`);
    console.log(`Total terms: ${allTerms.length.toLocaleString()}`);
    console.log('');
    console.log('Classification Breakdown:');
    console.log(`  Brand (your brand): ${stats.brand.toLocaleString()}`);
    console.log(`  Cache hits: ${stats.cacheHits.toLocaleString()}`);
    console.log(`  Signal matches: ${stats.signalMatches.toLocaleString()}`);
    console.log(`  Similarity matches: ${stats.similarityMatches.toLocaleString()}`);
    console.log(`  Predictive matches: ${stats.predictiveMatches.toLocaleString()}`);
    console.log(`  Low volume: ${stats.lowVolume.toLocaleString()}`);
    console.log(`  Non-Latin: ${stats.nonLatin.toLocaleString()}`);
    console.log(`  LLM classified: ${stats.llmCalls.toLocaleString()}`);
    console.log(`  ML propagated: ${stats.propagated.toLocaleString()}`);
    console.log(`  Medium intent (default): ${stats.medium.toLocaleString()}`);
    console.log('');

    // Category distribution
    const catDist = {};
    for (const [, result] of results) {
        catDist[result.category] = (catDist[result.category] || 0) + 1;
    }
    console.log('Category Distribution:');
    for (const [cat, count] of Object.entries(catDist).sort((a, b) => b[1] - a[1])) {
        const pct = ((count / allTerms.length) * 100).toFixed(1);
        console.log(`  ${cat}: ${count.toLocaleString()} (${pct}%)`);
    }

    return { stats, results };
}

// CLI interface
const args = parseArgs();

if (args.help || (!args.input && !args['dry-run'])) {
    console.log(`
Search Term Classifier - Minimal LLM Pipeline

Usage:
  ./classify.js --input=<file> --account-id=<id> [options]

Required:
  --input         Input CSV file with search terms
  --account-id    Google Ads account ID

Output (one of):
  --account-name  Account name for auto-folder (saves to data/google-ads/{name}/)
  --output        Explicit output CSV file path

Options:
  --run-llm       Run LLM classification on remaining terms (shows cost first)
  --llm-limit=N   Max terms for LLM (default: 1000)
  --model         LLM model (default: gemini-2.5-flash)
  --rebuild       Clear cache and reclassify all terms
  --dry-run       Show what would be done without saving
  --verbose       Show detailed progress
  --help          Show this help

Categories:
  brand           Your brand (from brand_strings config)
  navigational    Known brand searches
  high_intent     Clear purchase signals (buy, price, near me, sale, best)
  medium_intent   Product searches, no clear signal (DEFAULT)
  low_intent      Research/learning (how to, what is, guide)
  negative        Won't convert (jobs, reddit, images, diy)
  low_volume      Bottom 5% by impressions
  non_latin       Non-Latin in Latin-dominant account
`);
    process.exit(0);
}

const inputPath = resolve(args.input);
const accountId = args['account-id'];
const accountName = args['account-name'];

// Determine output path
let outputPath;
if (args.output) {
    outputPath = resolve(args.output);
} else if (accountName) {
    // Auto-folder: data/google-ads/{account-name}/
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const accountDir = resolve(process.cwd(), 'data/google-ads', accountName);
    if (!existsSync(accountDir)) {
        mkdirSync(accountDir, { recursive: true });
        console.log(`Created folder: ${accountDir}`);
    }
    outputPath = resolve(accountDir, `${today}-${accountName}-classified.csv`);
} else {
    // Default: same location as input with -classified suffix
    outputPath = resolve(args.input.replace('.csv', '-classified.csv'));
}

if (!existsSync(inputPath)) {
    console.error(`Error: Input file not found: ${inputPath}`);
    process.exit(1);
}

if (!accountId) {
    console.error('Error: --account-id is required');
    process.exit(1);
}

classify(inputPath, accountId, outputPath, {
    rebuild: args.rebuild,
    dryRun: args['dry-run'],
    verbose: args.verbose,
    model: args.model || 'gemini-2.5-flash',  // Default to Gemini 2.5 Flash
    runLlm: args['run-llm'],
    llmLimit: parseInt(args['llm-limit']) || 1000  // Default: top 1000 terms by impressions
}).catch(err => {
    console.error('Classification failed:', err);
    process.exit(1);
});
