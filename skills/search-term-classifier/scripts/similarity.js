#!/usr/bin/env node

/**
 * Similarity Matching Module
 *
 * Provides string similarity algorithms for:
 * - Matching typos/misspellings to known brands
 * - Detecting language (Latin vs non-Latin)
 * - Grouping similar terms
 *
 * Algorithms:
 * - Levenshtein Distance (edit distance)
 * - Soundex (phonetic matching)
 * - Latin Ratio (language detection)
 */

/**
 * Levenshtein Distance - number of edits to transform a into b
 */
export function levenshtein(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = Array(b.length + 1).fill().map(() => Array(a.length + 1).fill(0));

    for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= b.length; j++) {
        for (let i = 1; i <= a.length; i++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[j][i] = Math.min(
                matrix[j][i - 1] + 1,      // insertion
                matrix[j - 1][i] + 1,      // deletion
                matrix[j - 1][i - 1] + cost // substitution
            );
        }
    }

    return matrix[b.length][a.length];
}

/**
 * Normalized Levenshtein Similarity (0-1, higher = more similar)
 */
export function levenshteinSimilarity(a, b) {
    if (a === b) return 1;
    const distance = levenshtein(a.toLowerCase(), b.toLowerCase());
    return 1 - distance / Math.max(a.length, b.length);
}

/**
 * Soundex - phonetic encoding
 * Returns 4-character code representing pronunciation
 */
export function soundex(s) {
    if (!s || s.length === 0) return '0000';

    const word = s.toLowerCase().replace(/[^a-z]/g, '');
    if (word.length === 0) return '0000';

    const codes = {
        b: 1, f: 1, p: 1, v: 1,
        c: 2, g: 2, j: 2, k: 2, q: 2, s: 2, x: 2, z: 2,
        d: 3, t: 3,
        l: 4,
        m: 5, n: 5,
        r: 6
    };

    const first = word[0].toUpperCase();
    let result = first;
    let lastCode = codes[word[0]] || 0;

    for (let i = 1; i < word.length && result.length < 4; i++) {
        const code = codes[word[i]];
        if (code && code !== lastCode) {
            result += code;
        }
        lastCode = code || 0;
    }

    return (result + '000').slice(0, 4);
}

/**
 * Check if two words sound similar (same Soundex code)
 */
export function soundsLike(a, b) {
    return soundex(a) === soundex(b);
}

/**
 * Calculate Latin character ratio (0-1)
 * 1 = all Latin, 0 = no Latin
 * Includes digits and common punctuation as "Latin-compatible"
 */
export function latinRatio(s) {
    if (!s || s.length === 0) return 1;

    const withoutSpaces = s.replace(/\s/g, '');
    if (withoutSpaces.length === 0) return 1;

    // Count letters, digits, and common punctuation as Latin-compatible
    const latinChars = (s.match(/[a-zA-Z0-9.,!?'"()\-]/g) || []).length;
    return latinChars / withoutSpaces.length;
}

/**
 * Check if string contains non-Latin characters
 */
export function hasNonLatin(s) {
    // Matches any character outside basic ASCII printable range
    // that isn't a number or common punctuation
    return /[^\x00-\x7F]/.test(s);
}

/**
 * Find best match from a list of known terms
 * Returns: { match, similarity, soundexMatch } or null if no good match
 */
export function findBestMatch(unknown, knownTerms, options = {}) {
    const { minSimilarity = 0.70 } = options;

    let bestMatch = null;
    let bestSimilarity = 0;
    let soundexMatch = false;

    const unknownLower = unknown.toLowerCase().trim();

    for (const known of knownTerms) {
        const knownLower = known.toLowerCase().trim();

        // Exact match
        if (unknownLower === knownLower) {
            return { match: known, similarity: 1.0, soundexMatch: true };
        }

        const sim = levenshteinSimilarity(unknownLower, knownLower);
        if (sim > bestSimilarity) {
            bestSimilarity = sim;
            bestMatch = known;
            soundexMatch = soundsLike(unknownLower, knownLower);
        }
    }

    if (bestSimilarity >= minSimilarity) {
        return { match: bestMatch, similarity: bestSimilarity, soundexMatch };
    }

    return null;
}

/**
 * Match multiple unknown terms against known terms
 * Returns: Map of unknown -> { match, similarity } for matches above threshold
 */
export function batchMatch(unknowns, knownTerms, options = {}) {
    const results = new Map();

    for (const unknown of unknowns) {
        const result = findBestMatch(unknown, knownTerms, options);
        if (result) {
            results.set(unknown, result);
        }
    }

    return results;
}

/**
 * Analyze account's language profile
 * Returns { avgLatinRatio, isLatinDominant, nonLatinTerms }
 */
export function analyzeLanguageProfile(terms) {
    if (!terms || terms.length === 0) {
        return { avgLatinRatio: 1, isLatinDominant: true, nonLatinTerms: [] };
    }

    let totalRatio = 0;
    const nonLatinTerms = [];

    for (const term of terms) {
        const ratio = latinRatio(term);
        totalRatio += ratio;

        if (ratio < 0.5) {
            nonLatinTerms.push(term);
        }
    }

    const avgLatinRatio = totalRatio / terms.length;

    return {
        avgLatinRatio,
        isLatinDominant: avgLatinRatio > 0.9,
        nonLatinTerms
    };
}

/**
 * Extract single words from a term for ngram matching
 */
export function extractWords(term) {
    return term.toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2);
}

/**
 * Simple word-based similarity (Jaccard)
 */
export function wordSimilarity(a, b) {
    const wordsA = new Set(extractWords(a));
    const wordsB = new Set(extractWords(b));

    if (wordsA.size === 0 || wordsB.size === 0) return 0;

    let intersection = 0;
    for (const word of wordsA) {
        if (wordsB.has(word)) intersection++;
    }

    const union = new Set([...wordsA, ...wordsB]).size;
    return intersection / union;
}

// CLI interface for testing
if (import.meta.url === `file://${process.argv[1]}`) {
    const args = process.argv.slice(2);

    if (args[0] === '--test') {
        console.log('=== SIMILARITY TESTS ===\n');

        const testPairs = [
            ['zoggs', 'zoogs'],
            ['sealevel', 'sea level'],
            ['artesands', 'arte sands'],
            ['seafolly', 'seafoly'],
            ['speedo', 'speedos'],
            ['funkita', 'funky trunks'],
        ];

        console.log('Levenshtein Similarity:');
        for (const [a, b] of testPairs) {
            const sim = levenshteinSimilarity(a, b);
            const sounds = soundsLike(a, b);
            console.log(`  "${a}" ↔ "${b}": ${(sim * 100).toFixed(0)}% ${sounds ? '(sounds alike)' : ''}`);
        }

        console.log('\n=== LANGUAGE DETECTION ===\n');
        const langTests = ['swimwear', '泳衣', 'bañador', 'купальник', 'maillot de bain'];
        for (const term of langTests) {
            const ratio = latinRatio(term);
            const nonLatin = hasNonLatin(term);
            console.log(`  "${term}": ${(ratio * 100).toFixed(0)}% Latin ${nonLatin ? '(has non-Latin)' : ''}`);
        }

        console.log('\n=== BRAND MATCHING ===\n');
        const knownBrands = ['seafolly', 'speedo', 'funkita', 'zoggs', 'artesands', 'sealevel'];
        const unknowns = ['seafoly', 'zoogs', 'artesand', 'seelevel', 'amanzi', 'ozmosis'];

        console.log('Known brands:', knownBrands.join(', '));
        console.log('\nMatching unknown terms:');
        for (const unknown of unknowns) {
            const result = findBestMatch(unknown, knownBrands, { minSimilarity: 0.70 });
            if (result) {
                console.log(`  "${unknown}" → "${result.match}" (${(result.similarity * 100).toFixed(0)}%)`);
            } else {
                console.log(`  "${unknown}" → NO MATCH (new brand?)`);
            }
        }

    } else if (args[0] === '--match') {
        const unknown = args[1];
        const knownTerms = args.slice(2);

        if (!unknown || knownTerms.length === 0) {
            console.log('Usage: similarity.js --match <unknown> <known1> <known2> ...');
            process.exit(1);
        }

        const result = findBestMatch(unknown, knownTerms);
        if (result) {
            console.log(`"${unknown}" matches "${result.match}" (${(result.similarity * 100).toFixed(0)}%)`);
        } else {
            console.log(`"${unknown}" has no match above threshold`);
        }

    } else {
        console.log('Usage:');
        console.log('  similarity.js --test                    Run all tests');
        console.log('  similarity.js --match <term> <known>... Find best match');
    }
}

export default {
    levenshtein,
    levenshteinSimilarity,
    soundex,
    soundsLike,
    latinRatio,
    hasNonLatin,
    findBestMatch,
    batchMatch,
    analyzeLanguageProfile,
    extractWords,
    wordSimilarity
};
