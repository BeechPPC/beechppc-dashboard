/**
 * Account management utilities
 *
 * Loads account information from .claude/accounts.json and resolves
 * account names/aliases to customer IDs.
 */

import fs from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Load accounts from .claude/accounts.json
 *
 * @returns {Array} Array of account objects
 */
export function loadAccounts() {
    const accountsPath = join(__dirname, '../../../../accounts.json');

    if (!fs.existsSync(accountsPath)) {
        throw new Error(`Accounts file not found at: ${accountsPath}`);
    }

    const accountsFile = fs.readFileSync(accountsPath, 'utf8');
    const accountsObj = JSON.parse(accountsFile);

    // Convert object to array of account objects
    return Object.entries(accountsObj).map(([key, account]) => ({
        key,
        ...account,
    }));
}

/**
 * Resolve account identifier to account info
 *
 * Accepts account name, alias, or customer ID.
 *
 * @param {string} identifier - Account name, alias, or customer ID
 * @returns {Object} Account object with id, name, login_customer_id, etc.
 */
export function resolveAccount(identifier) {
    const accounts = loadAccounts();

    // Try exact customer ID match first (digits only)
    const customerIdMatch = accounts.find(acc => acc.id === identifier);
    if (customerIdMatch) {
        return customerIdMatch;
    }

    // Try case-insensitive name match
    const nameMatch = accounts.find(
        acc => acc.name.toLowerCase() === identifier.toLowerCase()
    );
    if (nameMatch) {
        return nameMatch;
    }

    // Try aliases (case-insensitive)
    const aliasMatch = accounts.find(acc =>
        acc.aliases?.some(
            alias => alias.toLowerCase() === identifier.toLowerCase()
        )
    );
    if (aliasMatch) {
        return aliasMatch;
    }

    throw new Error(
        `Account not found: "${identifier}". ` +
            `Check .claude/accounts.json for available accounts.`
    );
}

/**
 * List all available accounts
 *
 * @returns {Array} Array of account objects
 */
export function listAccounts() {
    return loadAccounts();
}
