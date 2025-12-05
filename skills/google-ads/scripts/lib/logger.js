/**
 * Mutation audit logging
 *
 * Logs all Google Ads mutation operations to logs/google-ads-mutations/
 * for audit trail and rollback planning.
 */

import fs from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Get log file path for today
 *
 * @returns {string} Path to today's log file
 */
function getLogFilePath() {
    const logsDir = join(__dirname, '../../../../../logs/google-ads-mutations');

    // Ensure logs directory exists
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
    }

    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    return join(logsDir, `${today}.log`);
}

/**
 * Log a mutation operation
 *
 * @param {Object} operation - Operation details
 * @param {string} operation.status - success, dry_run, or error
 * @param {string} operation.operation - Operation name (e.g., create_campaign)
 * @param {string} operation.account - Account name
 * @param {string} operation.customer_id - Customer ID
 * @param {Object} operation.details - Additional operation details
 */
export function logMutation(operation) {
    const logFilePath = getLogFilePath();

    const logEntry = {
        timestamp: new Date().toISOString(),
        status: operation.status,
        operation: operation.operation,
        account: operation.account,
        customer_id: operation.customer_id,
        ...operation,
    };

    const logLine = JSON.stringify(logEntry) + '\n';

    fs.appendFileSync(logFilePath, logLine, 'utf8');
}

/**
 * Get recent mutation logs
 *
 * @param {number} days - Number of days to retrieve (default: 7)
 * @returns {Array} Array of log entries
 */
export function getRecentLogs(days = 7) {
    const logsDir = join(__dirname, '../../../../../logs/google-ads-mutations');

    if (!fs.existsSync(logsDir)) {
        return [];
    }

    const logs = [];
    const today = new Date();

    for (let i = 0; i < days; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
        const logFile = join(logsDir, `${dateStr}.log`);

        if (fs.existsSync(logFile)) {
            const lines = fs.readFileSync(logFile, 'utf8').trim().split('\n');
            for (const line of lines) {
                if (line.trim()) {
                    logs.push(JSON.parse(line));
                }
            }
        }
    }

    return logs.sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );
}
