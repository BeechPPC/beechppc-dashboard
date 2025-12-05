#!/usr/bin/env node

/**
 * Signal-Based Classifier
 *
 * Uses TRUE intent signals to classify search terms.
 * Only signals that genuinely indicate intent, NOT modifiers.
 *
 * Categories:
 * - brand: Your brand (handled by brand_strings in accounts.json)
 * - navigational: Brand searches (identified separately)
 * - high_intent: Clear purchase signals
 * - medium_intent: Product searches, no clear signal (DEFAULT)
 * - low_intent: Research/learning
 * - negative: Won't convert
 * - low_volume: Bottom 5% by impressions (handled in classify.js)
 */

// TRUE intent signals - these genuinely indicate intent
// NOT modifiers like "australia", "womens", "kids", "size"

const HIGH_INTENT_SIGNALS = {
    // Purchase action words
    purchase: ['buy', 'buying', 'purchase', 'order', 'ordering', 'get', 'getting'],

    // Price/deal signals (ready to transact)
    price: ['price', 'prices', 'pricing', 'cost', 'costs', 'quote', 'quotes'],
    deal: ['cheap', 'cheapest', 'affordable', 'budget', 'discount', 'discounts', 'deal', 'deals', 'sale', 'sales', 'clearance', 'outlet', 'promo', 'coupon', 'code'],

    // Location intent (ready to visit/buy)
    local: ['near', 'nearby', 'closest', 'nearest', 'local'],

    // Comparison signals (close to purchase)
    compare: ['best', 'top', 'vs', 'versus', 'compare', 'comparing', 'comparison', 'review', 'reviews', 'rating', 'ratings', 'rated'],

    // Shopping intent
    shopping: ['shop', 'shopping', 'store', 'stores', 'stockist', 'stockists', 'retailer', 'buy online', 'order online'],
};

const LOW_INTENT_SIGNALS = {
    // Question words (learning, not buying)
    questions: ['how', 'what', 'why', 'when', 'where', 'which', 'can', 'should', 'does', 'do', 'is', 'are'],

    // Educational content
    learning: ['guide', 'guides', 'tutorial', 'tutorials', 'learn', 'learning', 'teach', 'meaning', 'means', 'definition', 'difference', 'differences', 'explained', 'explanation', 'tips', 'tricks', 'advice', 'ideas', 'examples', 'example'],

    // Troubleshooting
    problems: ['problem', 'problems', 'issue', 'issues', 'trouble', 'fix', 'fixing', 'broken', 'repair'],
};

const NEGATIVE_SIGNALS = {
    // Job seekers (not customers)
    jobs: ['job', 'jobs', 'career', 'careers', 'salary', 'salaries', 'hiring', 'employment', 'vacancy', 'vacancies', 'work from home', 'remote work'],

    // DIY/self-service (won't buy)
    diy: ['diy', 'homemade', 'make your own', 'build your own', 'do it yourself'],

    // Free seekers
    free: ['free download', 'free pdf', 'free template', 'free pattern', 'free printable'],

    // Research platforms (not buyers)
    platforms: ['reddit', 'pinterest', 'youtube', 'tiktok', 'instagram', 'facebook', 'twitter', 'forum', 'forums', 'wiki', 'wikipedia', 'blog', 'blogs'],

    // Images/media (not buyers)
    media: ['images', 'image', 'photos', 'photo', 'pictures', 'picture', 'pics', 'wallpaper', 'wallpapers', 'meme', 'memes', 'video', 'videos'],

    // Login/account (wrong audience)
    account: ['login', 'log in', 'signin', 'sign in', 'account', 'password', 'reset password'],

    // Complaints
    complaints: ['scam', 'legit', 'complaint', 'complaints', 'lawsuit', 'refund'],
};

// Build flat sets for fast lookup
function buildSignalSet(signalGroups) {
    const set = new Set();
    for (const signals of Object.values(signalGroups)) {
        for (const signal of signals) {
            set.add(signal.toLowerCase());
        }
    }
    return set;
}

const HIGH_SET = buildSignalSet(HIGH_INTENT_SIGNALS);
const LOW_SET = buildSignalSet(LOW_INTENT_SIGNALS);
const NEGATIVE_SET = buildSignalSet(NEGATIVE_SIGNALS);

// Multi-word patterns that need phrase matching
const PHRASE_PATTERNS = {
    high_intent: [
        /\bnear me\b/i,
        /\bnear by\b/i,
        /\bfor sale\b/i,
        /\bbuy online\b/i,
        /\border online\b/i,
        /\bfree shipping\b/i,
        /\bfree delivery\b/i,
    ],
    low_intent: [
        /\bhow to\b/i,
        /\bhow do\b/i,
        /\bhow does\b/i,
        /\bhow can\b/i,
        /\bwhat is\b/i,
        /\bwhat are\b/i,
        /\bwhat does\b/i,
        /\bwhy is\b/i,
        /\bwhy are\b/i,
        /\bwhy do\b/i,
        /\bcan i\b/i,
        /\bcan you\b/i,
        /\bshould i\b/i,
        /\bdo i need\b/i,
        /\bdifference between\b/i,
    ],
    negative: [
        /\bfree download\b/i,
        /\bfree pdf\b/i,
        /\bfree template\b/i,
        /\bdo it yourself\b/i,
        /\bmake your own\b/i,
        /\bwork from home\b/i,
        /\blog in\b/i,
        /\bsign in\b/i,
    ],
};

/**
 * Classify a search term by intent signals
 * Returns: { category, confidence, signal } or null for medium_intent default
 */
export function classifyBySignal(searchTerm) {
    const term = searchTerm.toLowerCase().trim();
    const words = term.split(/\s+/);

    // Check phrase patterns first (multi-word)
    for (const pattern of PHRASE_PATTERNS.negative) {
        if (pattern.test(term)) {
            return { category: 'negative', confidence: 0.95, signal: pattern.toString() };
        }
    }

    for (const pattern of PHRASE_PATTERNS.low_intent) {
        if (pattern.test(term)) {
            return { category: 'low_intent', confidence: 0.90, signal: pattern.toString() };
        }
    }

    for (const pattern of PHRASE_PATTERNS.high_intent) {
        if (pattern.test(term)) {
            return { category: 'high_intent', confidence: 0.90, signal: pattern.toString() };
        }
    }

    // Check single-word signals
    for (const word of words) {
        if (NEGATIVE_SET.has(word)) {
            return { category: 'negative', confidence: 0.85, signal: word };
        }
    }

    for (const word of words) {
        if (LOW_SET.has(word)) {
            // But override if high intent signal also present
            const hasHighIntent = words.some(w => HIGH_SET.has(w));
            if (!hasHighIntent) {
                return { category: 'low_intent', confidence: 0.80, signal: word };
            }
        }
    }

    for (const word of words) {
        if (HIGH_SET.has(word)) {
            return { category: 'high_intent', confidence: 0.85, signal: word };
        }
    }

    // No signal found - will default to medium_intent
    return null;
}

/**
 * Batch classify - returns Map of term -> result
 * Terms without signals are NOT included (they default to medium_intent)
 */
export function classifyBatchBySignal(searchTerms) {
    const results = new Map();

    for (const term of searchTerms) {
        const result = classifyBySignal(term);
        if (result) {
            results.set(term, result);
        }
    }

    return results;
}

/**
 * Get all signal words for reference
 */
export function getSignalWords() {
    return {
        high_intent: [...HIGH_SET],
        low_intent: [...LOW_SET],
        negative: [...NEGATIVE_SET],
    };
}

// Backwards compatibility - alias old function names
export const classifyByPattern = classifyBySignal;
export const classifyBatchByPattern = classifyBatchBySignal;

// CLI interface for testing
if (import.meta.url === `file://${process.argv[1]}`) {
    const args = process.argv.slice(2);

    if (args[0] === '--test') {
        const testCases = [
            // High intent
            'swimwear near me',
            'buy bikini online',
            'best swimwear australia',
            'seafolly sale',
            'cheap bathers',
            'speedo outlet',
            // Medium intent (no signal - should return null)
            'swimwear',
            'kids swimwear',
            'seafolly',
            'tankini australia',
            'plus size bathers',
            // Low intent
            'how to wash swimwear',
            'what size swimwear do i need',
            'swimwear size guide',
            'difference between bikini and tankini',
            // Negative
            'swimwear shop jobs',
            'swimwear images',
            'swimwear reddit',
            'free swimwear patterns pdf',
        ];

        console.log('Signal-Based Classification Test');
        console.log('='.repeat(60));
        console.log('');

        for (const term of testCases) {
            const result = classifyBySignal(term);
            if (result) {
                console.log(`"${term}"`);
                console.log(`  → ${result.category} (${(result.confidence * 100).toFixed(0)}%) signal: ${result.signal}`);
            } else {
                console.log(`"${term}"`);
                console.log(`  → medium_intent (default - no signal)`);
            }
        }
    } else if (args[0] === '--signals') {
        const signals = getSignalWords();
        console.log('HIGH_INTENT signals:', signals.high_intent.length);
        console.log(signals.high_intent.join(', '));
        console.log('');
        console.log('LOW_INTENT signals:', signals.low_intent.length);
        console.log(signals.low_intent.join(', '));
        console.log('');
        console.log('NEGATIVE signals:', signals.negative.length);
        console.log(signals.negative.join(', '));
    } else {
        const term = args.join(' ') || 'swimwear near me';
        const result = classifyBySignal(term);
        console.log(`Term: "${term}"`);
        if (result) {
            console.log(`Category: ${result.category}`);
            console.log(`Confidence: ${(result.confidence * 100).toFixed(0)}%`);
            console.log(`Signal: ${result.signal}`);
        } else {
            console.log('Category: medium_intent (default)');
        }
    }
}

export default { classifyBySignal, classifyBatchBySignal, getSignalWords };
