#!/usr/bin/env node

/**
 * ML Propagation Module
 *
 * Learns patterns from LLM-classified terms and propagates to remaining terms.
 * Uses TF-IDF vectorization and cosine similarity for intelligent matching.
 */

/**
 * Build word→category frequency map from classified terms
 */
export function buildWordPatterns(classifiedTerms) {
    const wordStats = new Map();  // word → { category → count }

    for (const { term, category } of classifiedTerms) {
        const words = term.toLowerCase().split(/\s+/).filter(w => w.length > 2);
        for (const word of words) {
            if (!wordStats.has(word)) {
                wordStats.set(word, {});
            }
            const stats = wordStats.get(word);
            stats[category] = (stats[category] || 0) + 1;
        }
    }

    // Convert to predictive patterns (word → best category if confident)
    const patterns = new Map();
    for (const [word, cats] of wordStats) {
        const total = Object.values(cats).reduce((a, b) => a + b, 0);
        if (total >= 3) {  // Need at least 3 occurrences
            const sorted = Object.entries(cats).sort((a, b) => b[1] - a[1]);
            const [bestCat, bestCount] = sorted[0];
            const confidence = bestCount / total;
            if (confidence >= 0.7) {  // 70% threshold
                patterns.set(word, { category: bestCat, confidence, count: total });
            }
        }
    }

    return patterns;
}

/**
 * Build n-gram patterns (2-word phrases)
 */
export function buildNgramPatterns(classifiedTerms) {
    const ngramStats = new Map();

    for (const { term, category } of classifiedTerms) {
        const words = term.toLowerCase().split(/\s+/).filter(w => w.length > 2);
        for (let i = 0; i < words.length - 1; i++) {
            const ngram = `${words[i]} ${words[i + 1]}`;
            if (!ngramStats.has(ngram)) {
                ngramStats.set(ngram, {});
            }
            const stats = ngramStats.get(ngram);
            stats[category] = (stats[category] || 0) + 1;
        }
    }

    const patterns = new Map();
    for (const [ngram, cats] of ngramStats) {
        const total = Object.values(cats).reduce((a, b) => a + b, 0);
        if (total >= 2) {
            const sorted = Object.entries(cats).sort((a, b) => b[1] - a[1]);
            const [bestCat, bestCount] = sorted[0];
            const confidence = bestCount / total;
            if (confidence >= 0.8) {
                patterns.set(ngram, { category: bestCat, confidence, count: total });
            }
        }
    }

    return patterns;
}

/**
 * Simple TF-IDF vectorizer
 */
class TfIdfVectorizer {
    constructor() {
        this.vocabulary = new Map();  // word → index
        this.idf = new Map();  // word → idf score
        this.documents = [];
    }

    fit(terms) {
        const docFreq = new Map();  // word → doc count
        const n = terms.length;

        // Build vocabulary and document frequency
        for (const term of terms) {
            const words = new Set(term.toLowerCase().split(/\s+/).filter(w => w.length > 1));
            for (const word of words) {
                docFreq.set(word, (docFreq.get(word) || 0) + 1);
                if (!this.vocabulary.has(word)) {
                    this.vocabulary.set(word, this.vocabulary.size);
                }
            }
        }

        // Calculate IDF
        for (const [word, df] of docFreq) {
            this.idf.set(word, Math.log(n / (df + 1)) + 1);
        }

        return this;
    }

    transform(term) {
        const words = term.toLowerCase().split(/\s+/).filter(w => w.length > 1);
        const tf = new Map();

        // Term frequency
        for (const word of words) {
            tf.set(word, (tf.get(word) || 0) + 1);
        }

        // TF-IDF vector (sparse)
        const vector = new Map();
        for (const [word, count] of tf) {
            if (this.vocabulary.has(word)) {
                const tfidf = count * (this.idf.get(word) || 1);
                vector.set(this.vocabulary.get(word), tfidf);
            }
        }

        return vector;
    }

    transformAll(terms) {
        return terms.map(t => this.transform(t));
    }
}

/**
 * Cosine similarity between two sparse vectors
 */
function cosineSimilarity(v1, v2) {
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (const [idx, val] of v1) {
        norm1 += val * val;
        if (v2.has(idx)) {
            dotProduct += val * v2.get(idx);
        }
    }

    for (const [, val] of v2) {
        norm2 += val * val;
    }

    if (norm1 === 0 || norm2 === 0) return 0;
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

/**
 * Find k nearest neighbors
 */
function findNearestNeighbors(queryVector, trainVectors, trainLabels, k = 3) {
    const similarities = trainVectors.map((v, i) => ({
        index: i,
        similarity: cosineSimilarity(queryVector, v),
        category: trainLabels[i]
    }));

    return similarities
        .filter(s => s.similarity > 0)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, k);
}

/**
 * Main propagation class
 */
export class MLPropagator {
    constructor() {
        this.wordPatterns = new Map();
        this.ngramPatterns = new Map();
        this.vectorizer = new TfIdfVectorizer();
        this.trainVectors = [];
        this.trainLabels = [];
        this.trainTerms = [];
    }

    /**
     * Learn from LLM-classified terms
     */
    learn(classifiedTerms) {
        // Build pattern maps
        this.wordPatterns = buildWordPatterns(classifiedTerms);
        this.ngramPatterns = buildNgramPatterns(classifiedTerms);

        // Build TF-IDF vectors
        const terms = classifiedTerms.map(t => t.term);
        this.vectorizer.fit(terms);
        this.trainVectors = this.vectorizer.transformAll(terms);
        this.trainLabels = classifiedTerms.map(t => t.category);
        this.trainTerms = terms;

        return this;
    }

    /**
     * Classify a single term using learned patterns
     */
    classify(term, options = {}) {
        const { minSimilarity = 0.5, k = 3 } = options;
        const normalizedTerm = term.toLowerCase();
        const words = normalizedTerm.split(/\s+/).filter(w => w.length > 2);

        // 1. Try n-gram patterns first (most specific)
        for (let i = 0; i < words.length - 1; i++) {
            const ngram = `${words[i]} ${words[i + 1]}`;
            const pattern = this.ngramPatterns.get(ngram);
            if (pattern) {
                return {
                    category: pattern.category,
                    confidence: pattern.confidence * 0.95,
                    method: `ngram:${ngram}`
                };
            }
        }

        // 2. Try word patterns
        const wordVotes = {};
        for (const word of words) {
            const pattern = this.wordPatterns.get(word);
            if (pattern) {
                wordVotes[pattern.category] = (wordVotes[pattern.category] || 0) + pattern.confidence;
            }
        }

        if (Object.keys(wordVotes).length > 0) {
            const sorted = Object.entries(wordVotes).sort((a, b) => b[1] - a[1]);
            const [bestCat, score] = sorted[0];
            if (score >= 0.7) {
                return {
                    category: bestCat,
                    confidence: Math.min(score / words.length, 0.9),
                    method: 'word_pattern'
                };
            }
        }

        // 3. Try cosine similarity (KNN)
        if (this.trainVectors.length > 0) {
            const queryVector = this.vectorizer.transform(normalizedTerm);
            const neighbors = findNearestNeighbors(queryVector, this.trainVectors, this.trainLabels, k);

            if (neighbors.length > 0 && neighbors[0].similarity >= minSimilarity) {
                // Vote among neighbors
                const votes = {};
                let totalWeight = 0;
                for (const n of neighbors) {
                    votes[n.category] = (votes[n.category] || 0) + n.similarity;
                    totalWeight += n.similarity;
                }

                const sorted = Object.entries(votes).sort((a, b) => b[1] - a[1]);
                const [bestCat, score] = sorted[0];

                return {
                    category: bestCat,
                    confidence: score / totalWeight,
                    method: `knn:${neighbors[0].similarity.toFixed(2)}`,
                    nearestTerm: this.trainTerms[neighbors[0].index]
                };
            }
        }

        // 4. No confident match
        return null;
    }

    /**
     * Classify multiple terms
     */
    classifyBatch(terms, options = {}) {
        const results = new Map();
        let matched = 0;

        for (const term of terms) {
            const result = this.classify(term, options);
            if (result) {
                results.set(term, result);
                matched++;
            }
        }

        return { results, matched, total: terms.length };
    }

    /**
     * Get stats about learned patterns
     */
    getStats() {
        return {
            wordPatterns: this.wordPatterns.size,
            ngramPatterns: this.ngramPatterns.size,
            vocabularySize: this.vectorizer.vocabulary.size,
            trainingSize: this.trainTerms.length
        };
    }
}

/**
 * Estimate propagation coverage
 */
export function estimateCoverage(llmTerms, allTerms) {
    const propagator = new MLPropagator();
    propagator.learn(llmTerms);

    // Sample 1000 random unclassified terms
    const sample = allTerms
        .filter(t => !llmTerms.find(lt => lt.term === t))
        .sort(() => Math.random() - 0.5)
        .slice(0, 1000);

    const { matched } = propagator.classifyBatch(sample);
    const estimatedCoverage = matched / sample.length;

    return {
        sampleSize: sample.length,
        matched,
        estimatedCoverage,
        estimatedTotal: Math.round(allTerms.length * estimatedCoverage)
    };
}

export default MLPropagator;
