#!/usr/bin/env node

/**
 * N-gram Analyzer Module
 *
 * Analyzes search terms to auto-detect patterns like:
 * - Sold brands (frequently appearing brand names not matching own brand)
 * - Competitor patterns
 * - Product type patterns
 *
 * These patterns are used for pre-classification before LLM.
 */

// Universal stop words and generic terms (language-agnostic, not industry-specific)
// These are truly generic and should be excluded from brand detection
const GENERIC_TERMS = new Set([
    // Stop words
    'the', 'and', 'for', 'with', 'from', 'all', 'set', 'sets', 'of', 'in', 'to', 'a', 'an',
    // Universal shopping terms
    'online', 'shop', 'store', 'buy', 'sale', 'cheap', 'best', 'top', 'price', 'cost',
    'new', 'free', 'shipping', 'delivery', 'clearance', 'outlet', 'discount',
    // Universal sizes
    'size', 'sizes', 'large', 'small', 'medium', 'xl', 'xxl', 'xs',
    // Universal locations (just the generic ones)
    'near', 'me', 'local', 'nearby',
    // Universal colors
    'black', 'white', 'blue', 'red', 'pink', 'green', 'navy', 'grey', 'gray', 'brown'
]);

// No default competitors - these should come from accounts.json per account
const DEFAULT_COMPETITORS = [];

/**
 * Extract n-grams from search terms
 * Returns frequency map of words and bigrams
 */
export function extractNgrams(terms, options = {}) {
    const {
        minFrequency = 10,     // Minimum occurrences to consider
        maxGeneric = 0.3,      // Skip if appears in >30% of terms (too generic)
        minLength = 3          // Minimum word length
    } = options;

    const unigrams = new Map();
    const bigrams = new Map();
    const totalTerms = terms.length;

    for (const term of terms) {
        const words = term.toLowerCase().split(/\s+/).filter(w => w.length >= minLength);

        // Count unigrams
        const seenUnigrams = new Set();
        for (const word of words) {
            if (!seenUnigrams.has(word)) {
                unigrams.set(word, (unigrams.get(word) || 0) + 1);
                seenUnigrams.add(word);
            }
        }

        // Count bigrams
        const seenBigrams = new Set();
        for (let i = 0; i < words.length - 1; i++) {
            const bigram = `${words[i]} ${words[i + 1]}`;
            if (!seenBigrams.has(bigram)) {
                bigrams.set(bigram, (bigrams.get(bigram) || 0) + 1);
                seenBigrams.add(bigram);
            }
        }
    }

    // Filter by frequency and generic threshold
    const maxAllowed = totalTerms * maxGeneric;

    const filteredUnigrams = new Map();
    for (const [word, count] of unigrams) {
        if (count >= minFrequency && count <= maxAllowed && !GENERIC_TERMS.has(word)) {
            filteredUnigrams.set(word, count);
        }
    }

    const filteredBigrams = new Map();
    for (const [bigram, count] of bigrams) {
        if (count >= minFrequency && count <= maxAllowed) {
            // Check if bigram is generic
            const words = bigram.split(' ');
            const isGeneric = words.every(w => GENERIC_TERMS.has(w));
            if (!isGeneric) {
                filteredBigrams.set(bigram, count);
            }
        }
    }

    return {
        unigrams: filteredUnigrams,
        bigrams: filteredBigrams,
        totalTerms
    };
}

/**
 * Detect sold brands from n-gram analysis
 * Sold brands are frequent n-grams that:
 * - Appear consistently (not just in own brand terms)
 * - Are NOT in the competitor list
 * - Are NOT generic product terms
 */
export function detectSoldBrands(terms, options = {}) {
    const {
        ownBrand = [],           // Own brand terms to exclude
        competitors = DEFAULT_COMPETITORS,
        minFrequency = 20,
        topN = 30                // Return top N candidates
    } = options;

    const { unigrams, bigrams, totalTerms } = extractNgrams(terms, { minFrequency });

    const candidates = [];

    // Check unigrams
    for (const [word, count] of unigrams) {
        // Skip if it's own brand
        if (ownBrand.some(b => b.toLowerCase().includes(word) || word.includes(b.toLowerCase()))) {
            continue;
        }
        // Skip if it's a competitor
        if (competitors.some(c => c.toLowerCase() === word)) {
            continue;
        }

        candidates.push({
            term: word,
            type: 'unigram',
            count,
            pct: (count / totalTerms * 100).toFixed(1)
        });
    }

    // Check bigrams
    for (const [bigram, count] of bigrams) {
        // Skip if it's own brand
        if (ownBrand.some(b => b.toLowerCase() === bigram || bigram.includes(b.toLowerCase()))) {
            continue;
        }
        // Skip if it's a competitor
        if (competitors.some(c => c.toLowerCase() === bigram)) {
            continue;
        }

        candidates.push({
            term: bigram,
            type: 'bigram',
            count,
            pct: (count / totalTerms * 100).toFixed(1)
        });
    }

    // Sort by count and return top N
    return candidates
        .sort((a, b) => b.count - a.count)
        .slice(0, topN);
}

/**
 * Classify terms by n-gram patterns
 * Returns map of term -> category for matched terms
 */
export function classifyByNgrams(terms, config = {}) {
    const {
        ownBrand = [],
        soldBrands = [],
        competitors = DEFAULT_COMPETITORS
    } = config;

    const results = new Map();

    // Normalize patterns for matching
    const ownBrandLower = ownBrand.map(b => b.toLowerCase());
    const soldBrandsLower = soldBrands.map(b => b.toLowerCase());
    const competitorsLower = competitors.map(c => c.toLowerCase());

    for (const term of terms) {
        const termLower = term.toLowerCase();

        // Check own brand
        if (ownBrandLower.some(b => termLower.includes(b))) {
            results.set(term, {
                category: 'brand',
                confidence: 0.95,
                method: 'ngram_own_brand',
                matchedPattern: ownBrandLower.find(b => termLower.includes(b))
            });
            continue;
        }

        // Check competitors
        if (competitorsLower.some(c => termLower.includes(c))) {
            results.set(term, {
                category: 'competitor',
                confidence: 0.95,
                method: 'ngram_competitor',
                matchedPattern: competitorsLower.find(c => termLower.includes(c))
            });
            continue;
        }

        // Check sold brands
        if (soldBrandsLower.some(sb => termLower.includes(sb))) {
            results.set(term, {
                category: 'sold_brand',
                confidence: 0.90,
                method: 'ngram_sold_brand',
                matchedPattern: soldBrandsLower.find(sb => termLower.includes(sb))
            });
            continue;
        }
    }

    return results;
}

/**
 * Get category coverage stats
 */
export function getCoverageStats(classifications, totalTerms) {
    const counts = {};
    for (const [, { category }] of classifications) {
        counts[category] = (counts[category] || 0) + 1;
    }

    const stats = {
        total: classifications.size,
        coverage: (classifications.size / totalTerms * 100).toFixed(1) + '%',
        byCategory: {}
    };

    for (const [cat, count] of Object.entries(counts)) {
        stats.byCategory[cat] = {
            count,
            pct: (count / totalTerms * 100).toFixed(1) + '%'
        };
    }

    return stats;
}

// CLI for testing
if (import.meta.url === `file://${process.argv[1]}`) {
    import('fs').then(fs => {
        const args = process.argv.slice(2);
        const inputFile = args.find(a => a.startsWith('--input='))?.split('=')[1];
        const mode = args.find(a => a.startsWith('--mode='))?.split('=')[1] || 'detect';
        const ownBrand = args.find(a => a.startsWith('--brand='))?.split('=')[1]?.split(',') || [];

        if (!inputFile) {
            console.log('Usage: ngram-analyzer.js --input=<csv_file> [--mode=detect|classify] [--brand=brand1,brand2]');
            process.exit(1);
        }

        const csv = fs.readFileSync(inputFile, 'utf8');
        const lines = csv.trim().split('\n').slice(1);
        const terms = lines.map(line => {
            const parts = line.split(',');
            return parts[6] || parts[parts.length - 1];
        });

        console.log(`Analyzing ${terms.length.toLocaleString()} terms...`);
        console.log(`Own brand: ${ownBrand.length ? ownBrand.join(', ') : '(none specified)'}`);
        console.log('');

        if (mode === 'detect') {
            const candidates = detectSoldBrands(terms, { ownBrand });
            console.log('DETECTED SOLD BRAND CANDIDATES:');
            console.log('================================');
            candidates.forEach((c, i) => {
                console.log(`${i + 1}. ${c.term} (${c.type}) - ${c.count} occurrences (${c.pct}%)`);
            });

            console.log('\n\nSuggested sold_brands config:');
            console.log(JSON.stringify(candidates.slice(0, 15).map(c => c.term), null, 2));
        } else if (mode === 'classify') {
            // For classify mode, use top detected brands as sold_brands
            const detected = detectSoldBrands(terms, { ownBrand });
            const soldBrands = detected.slice(0, 15).map(c => c.term);

            console.log('Using sold_brands:', soldBrands.join(', '));
            console.log('');

            const classifications = classifyByNgrams(terms, { ownBrand, soldBrands });
            const stats = getCoverageStats(classifications, terms.length);

            console.log('N-GRAM CLASSIFICATION RESULTS:');
            console.log('==============================');
            console.log(`Total classified: ${stats.total} (${stats.coverage})`);
            console.log('');
            for (const [cat, data] of Object.entries(stats.byCategory)) {
                console.log(`  ${cat}: ${data.count} (${data.pct})`);
            }
        }
    });
}

export default {
    extractNgrams,
    detectSoldBrands,
    classifyByNgrams,
    getCoverageStats,
    GENERIC_TERMS,
    DEFAULT_COMPETITORS
};
