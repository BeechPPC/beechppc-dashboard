#!/usr/bin/env node

/**
 * Update Category Script
 *
 * Updates the category for a single search term in the cache.
 * Used for manual overrides from the report UI.
 */

import { ClassificationCache } from './cache.js';

// Parse CLI arguments
function parseArgs() {
    const args = process.argv.slice(2).reduce((acc, arg) => {
        if (arg.includes('=')) {
            const [key, value] = arg.split('=');
            acc[key.replace('--', '')] = value;
        } else if (arg.startsWith('--')) {
            acc[arg.replace('--', '')] = true;
        }
        return acc;
    }, {});
    return args;
}

const args = parseArgs();

if (args.help || !args['account-id'] || !args.term || !args.category) {
    console.log(`
Update Category

Updates the category for a search term in the cache.

Usage:
  node update-category.js --account-id=<id> --term="<search term>" --category=<category>

Required:
  --account-id    Google Ads account ID
  --term          Search term to update (use quotes for terms with spaces)
  --category      New category (transactional, commercial, informational, navigational, local, brand, competitor, ambiguous)

Options:
  --help          Show this help message

Example:
  node update-category.js --account-id=7435598264 --term="pool pump bunnings" --category=competitor
`);
    process.exit(args.help ? 0 : 1);
}

const validCategories = ['transactional', 'commercial', 'informational', 'navigational', 'local', 'brand', 'competitor', 'ambiguous'];

if (!validCategories.includes(args.category)) {
    console.error(`Invalid category: ${args.category}`);
    console.error(`Valid categories: ${validCategories.join(', ')}`);
    process.exit(1);
}

const cache = new ClassificationCache();

const updated = cache.updateCategory(args['account-id'], args.term, args.category);

if (updated) {
    console.log(`Updated "${args.term}" to category: ${args.category}`);
} else {
    console.error(`Term not found: "${args.term}"`);
    process.exit(1);
}

cache.close();
