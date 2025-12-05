#!/usr/bin/env node

/**
 * Report Server
 *
 * Serves the search term classification report with live API endpoints
 * for re-classification and category updates.
 */

import http from 'http';
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { ClassificationCache } from './cache.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = 3456;

// Parse CLI arguments
function parseArgs() {
    const args = process.argv.slice(2).reduce((acc, arg) => {
        if (arg.includes('=')) {
            const [key, value] = arg.split('=');
            acc[key.replace('--', '')] = value;
        }
        return acc;
    }, {});
    return args;
}

// Run classification command
function runClassification(inputFile, accountId, model, rebuild = true) {
    return new Promise((resolve, reject) => {
        const outputFile = inputFile.replace('.csv', '-classified.csv');
        const args = [
            '.claude/skills/search-term-classifier/scripts/classify.js',
            `--input=${inputFile}`,
            `--account-id=${accountId}`,
            `--output=${outputFile}`,
            `--model=${model}`
        ];
        if (rebuild) args.push('--rebuild');

        console.log(`Running: node ${args.join(' ')}`);

        const child = spawn('node', args, {
            cwd: process.cwd(),
            stdio: ['inherit', 'pipe', 'pipe']
        });

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data) => {
            stdout += data.toString();
            process.stdout.write(data);
        });

        child.stderr.on('data', (data) => {
            stderr += data.toString();
            process.stderr.write(data);
        });

        child.on('close', (code) => {
            if (code === 0) {
                resolve({ success: true, output: stdout, outputFile });
            } else {
                reject(new Error(`Classification failed: ${stderr || stdout}`));
            }
        });
    });
}

// Update category in cache
function updateCategory(accountId, term, category) {
    const cache = new ClassificationCache();
    const result = cache.updateCategory(accountId, term, category);
    cache.close();
    return result;
}

// Handle API requests
async function handleAPI(req, res, body) {
    const url = new URL(req.url, `http://localhost:${PORT}`);

    if (url.pathname === '/api/reclassify' && req.method === 'POST') {
        try {
            const { inputFile, accountId, model, rebuild } = JSON.parse(body);
            console.log(`\nRe-classifying with model: ${model}`);

            const result = await runClassification(inputFile, accountId, model, rebuild);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                message: 'Classification complete',
                outputFile: result.outputFile
            }));
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: error.message }));
        }
        return true;
    }

    if (url.pathname === '/api/update-category' && req.method === 'POST') {
        try {
            const { accountId, term, category } = JSON.parse(body);
            const success = updateCategory(accountId, term, category);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success, term, category }));
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: error.message }));
        }
        return true;
    }

    if (url.pathname === '/api/update-categories' && req.method === 'POST') {
        try {
            const { accountId, updates } = JSON.parse(body);
            const cache = new ClassificationCache();
            let successCount = 0;

            for (const { term, category } of updates) {
                if (cache.updateCategory(accountId, term, category)) {
                    successCount++;
                }
            }

            cache.close();

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                updated: successCount,
                total: updates.length
            }));
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: error.message }));
        }
        return true;
    }

    return false;
}

// Main server
function startServer(reportPath) {
    const server = http.createServer(async (req, res) => {
        // Handle CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
            res.writeHead(204);
            res.end();
            return;
        }

        // Collect body for POST requests
        let body = '';
        if (req.method === 'POST') {
            for await (const chunk of req) {
                body += chunk;
            }
        }

        // Handle API endpoints
        if (req.url.startsWith('/api/')) {
            const handled = await handleAPI(req, res, body);
            if (handled) return;
        }

        // Serve report HTML
        if (req.url === '/' || req.url === '/report') {
            if (existsSync(reportPath)) {
                const html = readFileSync(reportPath, 'utf8');
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(html);
            } else {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Report not found. Generate it first.');
            }
            return;
        }

        // 404 for everything else
        res.writeHead(404);
        res.end('Not found');
    });

    server.listen(PORT, () => {
        console.log(`\nReport server running at http://localhost:${PORT}`);
        console.log(`Serving: ${reportPath}`);
        console.log('\nAPI endpoints:');
        console.log('  POST /api/reclassify - Re-run classification');
        console.log('  POST /api/update-category - Update single category');
        console.log('  POST /api/update-categories - Update multiple categories');
        console.log('\nPress Ctrl+C to stop\n');
    });

    return server;
}

// CLI
const args = parseArgs();

if (args.help) {
    console.log(`
Report Server

Serves the classification report with live API for re-classification and updates.

Usage:
  node serve-report.js --report=<path> [options]

Options:
  --report    Path to HTML report file (default: data/reports/search-term-report-YYYY-MM-DD.html)
  --port      Server port (default: 3456)
  --help      Show this help

Example:
  node serve-report.js --report=data/reports/search-term-report-2025-11-28.html
`);
    process.exit(0);
}

const today = new Date().toISOString().slice(0, 10);
const reportPath = resolve(args.report || `data/reports/search-term-report-${today}.html`);

startServer(reportPath);
