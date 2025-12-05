#!/usr/bin/env node

/**
 * SQLite Cache Layer for LLM Search Term Classifications
 *
 * Stores ONLY LLM-classified terms to avoid expensive re-classification.
 * Rule-based classifications (signals, brands, low-volume) are NOT cached
 * since rules can be reapplied instantly.
 *
 * Lean schema: account_id, search_term_normalized, category
 */

import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'fs';
import { dirname, resolve } from 'path';

const DEFAULT_DB_PATH = resolve(process.cwd(), 'data/search-term-cache.db');

export class ClassificationCache {
    constructor(dbPath = DEFAULT_DB_PATH) {
        // Ensure directory exists
        const dir = dirname(dbPath);
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }

        this.db = new Database(dbPath);
        this.initSchema();
    }

    initSchema() {
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS classifications (
                account_id TEXT NOT NULL,
                search_term_normalized TEXT NOT NULL,
                category TEXT NOT NULL,
                UNIQUE(account_id, search_term_normalized)
            );

            CREATE INDEX IF NOT EXISTS idx_account_term
            ON classifications(account_id, search_term_normalized);
        `);
    }

    /**
     * Normalize search term for consistent matching
     */
    normalize(term) {
        return term
            .toLowerCase()
            .trim()
            .replace(/\s+/g, ' ');  // Collapse multiple spaces
    }

    /**
     * Look up existing classification
     * Returns: category string or null
     */
    get(accountId, searchTerm) {
        const normalized = this.normalize(searchTerm);
        const stmt = this.db.prepare(`
            SELECT category
            FROM classifications
            WHERE account_id = ? AND search_term_normalized = ?
        `);
        const row = stmt.get(accountId, normalized);
        return row ? row.category : null;
    }

    /**
     * Batch lookup - returns Map of normalized term -> category
     */
    getBatch(accountId, searchTerms) {
        const results = new Map();
        const normalized = searchTerms.map(t => this.normalize(t));

        // SQLite has a limit on placeholders, process in chunks
        const chunkSize = 500;
        for (let i = 0; i < normalized.length; i += chunkSize) {
            const chunk = normalized.slice(i, i + chunkSize);
            const placeholders = chunk.map(() => '?').join(',');
            const stmt = this.db.prepare(`
                SELECT search_term_normalized, category
                FROM classifications
                WHERE account_id = ? AND search_term_normalized IN (${placeholders})
            `);
            const rows = stmt.all(accountId, ...chunk);
            rows.forEach(row => {
                results.set(row.search_term_normalized, row.category);
            });
        }

        return results;
    }

    /**
     * Save a single LLM classification
     */
    set(accountId, searchTerm, category) {
        const normalized = this.normalize(searchTerm);

        const stmt = this.db.prepare(`
            INSERT INTO classifications (account_id, search_term_normalized, category)
            VALUES (?, ?, ?)
            ON CONFLICT(account_id, search_term_normalized) DO UPDATE SET
                category = excluded.category
        `);

        stmt.run(accountId, normalized, category);
    }

    /**
     * Batch save LLM classifications (much faster)
     * Input: array of { searchTerm, category }
     */
    setBatch(accountId, classifications) {
        const stmt = this.db.prepare(`
            INSERT INTO classifications (account_id, search_term_normalized, category)
            VALUES (?, ?, ?)
            ON CONFLICT(account_id, search_term_normalized) DO UPDATE SET
                category = excluded.category
        `);

        const insertMany = this.db.transaction((items) => {
            for (const item of items) {
                const normalized = this.normalize(item.searchTerm);
                stmt.run(accountId, normalized, item.category);
            }
        });

        insertMany(classifications);
    }

    /**
     * Get statistics for an account
     */
    getStats(accountId) {
        const stmt = this.db.prepare(`
            SELECT
                COUNT(*) as total,
                COUNT(DISTINCT category) as categories
            FROM classifications
            WHERE account_id = ?
        `);
        return stmt.get(accountId);
    }

    /**
     * Get distribution by category
     */
    getCategoryDistribution(accountId) {
        const stmt = this.db.prepare(`
            SELECT
                category,
                COUNT(*) as count
            FROM classifications
            WHERE account_id = ?
            GROUP BY category
            ORDER BY count DESC
        `);
        return stmt.all(accountId);
    }

    /**
     * Get all classifications for an account (for predictive word building)
     */
    getAllForAccount(accountId) {
        const stmt = this.db.prepare(`
            SELECT search_term_normalized as term, category
            FROM classifications
            WHERE account_id = ?
        `);
        return stmt.all(accountId);
    }

    /**
     * Update category for a specific term (manual override)
     */
    updateCategory(accountId, searchTerm, newCategory) {
        const normalized = this.normalize(searchTerm);

        const stmt = this.db.prepare(`
            UPDATE classifications
            SET category = ?
            WHERE account_id = ? AND search_term_normalized = ?
        `);

        const result = stmt.run(newCategory, accountId, normalized);
        return result.changes > 0;
    }

    /**
     * Clear all classifications for an account (for rebuilding)
     */
    clearAccount(accountId) {
        const stmt = this.db.prepare(`
            DELETE FROM classifications WHERE account_id = ?
        `);
        return stmt.run(accountId);
    }

    /**
     * Close database connection
     */
    close() {
        this.db.close();
    }
}

// CLI interface for testing
if (import.meta.url === `file://${process.argv[1]}`) {
    const args = process.argv.slice(2);
    const command = args[0];
    const accountId = args[1];

    const cache = new ClassificationCache();

    switch (command) {
        case 'stats':
            if (!accountId) {
                console.error('Usage: cache.js stats <account_id>');
                process.exit(1);
            }
            console.log(cache.getStats(accountId));
            break;

        case 'distribution':
            if (!accountId) {
                console.error('Usage: cache.js distribution <account_id>');
                process.exit(1);
            }
            console.log('By Category:');
            console.table(cache.getCategoryDistribution(accountId));
            break;

        case 'clear':
            if (!accountId) {
                console.error('Usage: cache.js clear <account_id>');
                process.exit(1);
            }
            const result = cache.clearAccount(accountId);
            console.log(`Cleared ${result.changes} classifications`);
            break;

        default:
            console.log('Usage: cache.js <command> [account_id]');
            console.log('Commands: stats, distribution, clear');
    }

    cache.close();
}

export default ClassificationCache;
