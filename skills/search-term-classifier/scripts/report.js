#!/usr/bin/env node

/**
 * Search Term Classification Report Generator
 *
 * Generates an HTML report with:
 * - 4 charts (shared legend)
 * - 4 tabs: Performance, Terms, Insights, Stats
 * - Live API integration for re-classification and category updates
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { ClassificationCache } from './cache.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

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

// Format currency from micros
function formatCurrency(micros, currency = 'AUD') {
    const amount = micros / 1_000_000;
    return new Intl.NumberFormat('en-AU', {
        style: 'currency',
        currency
    }).format(amount);
}

// Format number with commas
function formatNumber(num) {
    return new Intl.NumberFormat('en-AU').format(num);
}

// Format category name for display (snake_case → Title Case)
function formatCategoryName(category) {
    if (!category) return 'Unknown';
    // Special cases
    if (category === 'pmax_uncategorized') return 'PMax Uncategorized';
    if (category === 'ctr') return 'CTR';
    if (category === 'cpa') return 'CPA';
    if (category === 'cpc') return 'CPC';
    // General: replace underscores with spaces, title case
    return category
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// Calculate derived metrics
function calculateMetrics(data) {
    const ctr = data.clicks > 0 && data.impressions > 0
        ? ((data.clicks / data.impressions) * 100).toFixed(2)
        : '0.00';
    const cpc = data.clicks > 0 && data.cost_micros > 0
        ? (data.cost_micros / 1_000_000 / data.clicks).toFixed(2)
        : '0.00';
    const convRate = data.clicks > 0 && data.conversions > 0
        ? ((data.conversions / data.clicks) * 100).toFixed(2)
        : '0.00';
    const cpa = data.conversions > 0 && data.cost_micros > 0
        ? (data.cost_micros / 1_000_000 / data.conversions).toFixed(2)
        : '-';
    return { ctr, cpc, convRate, cpa };
}

// Generate HTML report
function generateReport(data) {
    const {
        accountId,
        accountName,
        inputFile,
        inputFilePath,
        outputFile,
        runStats,
        dateRange = {},
        categoryStats,
        methodStats,
        cacheStats,
        allTerms,
        brandStrings = [],
        competitorStrings = [],
        currency = 'AUD'
    } = data;

    // Calculate totals
    const totals = categoryStats.reduce((acc, cat) => ({
        terms: acc.terms + cat.count,
        impressions: acc.impressions + (cat.impressions || 0),
        clicks: acc.clicks + (cat.clicks || 0),
        cost_micros: acc.cost_micros + (cat.cost_micros || 0),
        conversions: acc.conversions + (cat.conversions || 0),
        value: acc.value + (cat.value || 0)
    }), { terms: 0, impressions: 0, clicks: 0, cost_micros: 0, conversions: 0, value: 0 });

    // Calculate S/Sh/P breakdowns for scorecards
    const searchTerms = allTerms.filter(t => t.source === 'S' || !t.source);
    const shoppingTerms = allTerms.filter(t => t.source === 'Sh');
    const pmaxTerms = allTerms.filter(t => t.source === 'P');

    const sTotals = searchTerms.reduce((acc, t) => ({
        terms: acc.terms + 1,
        impressions: acc.impressions + (t.impressions || 0),
        clicks: acc.clicks + (t.clicks || 0),
        cost_micros: acc.cost_micros + (t.cost || 0),
        conversions: acc.conversions + (t.conversions || 0)
    }), { terms: 0, impressions: 0, clicks: 0, cost_micros: 0, conversions: 0 });

    const shTotals = shoppingTerms.reduce((acc, t) => ({
        terms: acc.terms + 1,
        impressions: acc.impressions + (t.impressions || 0),
        clicks: acc.clicks + (t.clicks || 0),
        cost_micros: acc.cost_micros + (t.cost || 0),
        conversions: acc.conversions + (t.conversions || 0)
    }), { terms: 0, impressions: 0, clicks: 0, cost_micros: 0, conversions: 0 });

    const pTotals = pmaxTerms.reduce((acc, t) => ({
        terms: acc.terms + 1,
        impressions: acc.impressions + (t.impressions || 0),
        clicks: acc.clicks + (t.clicks || 0),
        cost_micros: acc.cost_micros + (t.cost || 0),
        conversions: acc.conversions + (t.conversions || 0)
    }), { terms: 0, impressions: 0, clicks: 0, cost_micros: 0, conversions: 0 });

    const hasPmax = pmaxTerms.length > 0;
    const hasSearch = searchTerms.length > 0;
    const hasShopping = shoppingTerms.length > 0;
    const hasMultipleSources = (hasSearch ? 1 : 0) + (hasShopping ? 1 : 0) + (hasPmax ? 1 : 0) > 1;

    // Filter categoryStats to exclude pmax_uncategorized if no PMax data
    const filteredCategoryStats = hasPmax
        ? categoryStats
        : categoryStats.filter(c => c.category !== 'pmax_uncategorized');

    // Category colors - distinct colors for each category
    const categoryColors = {
        high_intent: '#2E8B57',     // Sea green - ready to buy
        medium_intent: '#6495ED',   // Cornflower blue - browsing
        low_intent: '#DAA520',      // Goldenrod - researching
        negative: '#DC143C',        // Crimson - won't convert
        brand: '#4169E1',           // Royal blue - your brand
        navigational: '#9932CC',    // Purple - competitor/navigational
        low_volume: '#B0B0B0',      // Light gray - low volume
        non_latin: '#708090',       // Slate gray - non-latin
        sold_brand: '#9932CC',      // Purple - brands you sell
        competitor: '#FF8C00',      // Orange - competitor brand
        ambiguous: '#A0A0A0',       // Gray - unclear
        pmax_uncategorized: '#8B4513' // Saddle brown - PMax hidden data
    };

    // Categories available for selection (exclude pmax_uncategorized if no PMax data)
    const allCategories = hasPmax
        ? ['high_intent', 'medium_intent', 'low_intent', 'negative', 'brand', 'navigational', 'low_volume', 'non_latin', 'pmax_uncategorized']
        : ['high_intent', 'medium_intent', 'low_intent', 'negative', 'brand', 'navigational', 'low_volume', 'non_latin'];

    // Method tooltips
    const methodTooltips = {
        'ngram_own_brand': 'Matched your brand keywords via n-gram analysis',
        'ngram_sold_brand': 'Matched brand you sell via n-gram analysis',
        'ngram_competitor': 'Matched competitor keywords via n-gram analysis',
        'pattern_high_intent': 'Matched high-intent patterns (buy, price, etc)',
        'pattern_low_intent': 'Matched research patterns (reviews, compare, etc)',
        'pattern_negative': 'Matched negative patterns (jobs, DIY, free, etc)',
        'low_volume': 'Low volume term (bottom 5% impressions) - auto-classified',
        'llm_single': 'High-value term classified individually by LLM',
        'llm_batch': 'Mid-tier term classified in LLM batch',
        'similarity': 'Inherited category from similar Tier 1 term',
        'manual_override': 'Manually changed by user',
        'cached': 'Retrieved from previous run',
        'imported': 'Imported from CSV file'
    };

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Search Term Classification - ${accountName || accountId}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        .category-pill { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
        .cat-high_intent { background: #d4edda; color: #1e5631; }
        .cat-medium_intent { background: #dbeafe; color: #1e40af; }
        .cat-low_intent { background: #fff3cd; color: #856404; }
        .cat-negative { background: #f8d7da; color: #721c24; }
        .cat-brand { background: #cce5ff; color: #004085; }
        .cat-navigational { background: #e2d5f1; color: #4a235a; }
        .cat-low_volume { background: #e2e3e5; color: #495057; }
        .cat-non_latin { background: #e2e3e5; color: #374151; }
        .cat-sold_brand { background: #e2d5f1; color: #4a235a; }
        .cat-competitor { background: #ffe4cc; color: #8a4500; }
        .cat-ambiguous { background: #d6d8db; color: #383d41; }
        .filter-btn { padding: 6px 12px; border-radius: 4px; font-size: 13px; cursor: pointer; border: 2px solid transparent; transition: all 0.15s; }
        .filter-btn:hover { opacity: 0.8; }
        .filter-btn.active { border-color: #333; font-weight: 600; }
        .sort-arrow { font-size: 10px; margin-left: 4px; opacity: 0.6; }
        .sorted .sort-arrow { opacity: 1; }
        .method-info { cursor: help; display: inline-flex; align-items: center; justify-content: center; width: 14px; height: 14px; background: #e5e7eb; border-radius: 50%; font-size: 10px; color: #6b7280; margin-left: 4px; }
        .method-tooltip { position: absolute; background: #1f2937; color: white; padding: 8px 12px; border-radius: 4px; font-size: 12px; max-width: 250px; z-index: 100; white-space: normal; line-height: 1.4; }
        table { border-collapse: collapse; width: 100%; }
        th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #e5e7eb; }
        th { background: #f9fafb; font-weight: 600; }
        tr:hover { background: #f9fafb; }
        .tab-btn { padding: 12px 24px; border-bottom: 2px solid transparent; cursor: pointer; font-weight: 500; color: #6b7280; }
        .tab-btn:hover { color: #111827; }
        .tab-btn.active { border-color: #3b82f6; color: #3b82f6; }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        .category-select { padding: 2px 6px; border-radius: 4px; border: 1px solid #e5e7eb; cursor: pointer; font-size: 12px; }
        .page-btn { padding: 4px 10px; border: 1px solid #e5e7eb; background: white; cursor: pointer; font-size: 13px; margin: 0 2px; border-radius: 4px; }
        .page-btn.active { background: #3b82f6; color: white; border-color: #3b82f6; }
        .page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .loading { opacity: 0.5; pointer-events: none; }
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .chart-container { position: relative; height: 150px; width: 100%; }
    </style>
</head>
<body class="bg-gray-100 min-h-screen">
    <div class="max-w-7xl mx-auto px-4 py-6">
        <!-- LLM Status Banner -->
        ${(() => {
            const llmClassified = allTerms.filter(t => t.method === 'llm');
            const needsLlm = allTerms.filter(t =>
                t.method === 'default_no_llm' ||
                t.method === 'default_low_priority' ||
                t.method === 'default'
            );

            // If LLM was run, show green success banner
            if (llmClassified.length > 0) {
                return `
                <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <div class="flex items-start gap-3">
                        <div class="text-green-500 text-xl">✓</div>
                        <div class="flex-1">
                            <div class="font-medium text-green-800">LLM Classification Complete</div>
                            <div class="text-green-700 text-sm mt-1">
                                <strong>${llmClassified.length.toLocaleString()}</strong> top terms classified by LLM (sorted by impressions).
                                ${needsLlm.length > 0 ? `<strong>${needsLlm.length.toLocaleString()}</strong> lower-priority terms defaulted to Medium Intent.` : ''}
                            </div>
                        </div>
                    </div>
                </div>`;
            }

            // If LLM was NOT run and many terms need it, show yellow available banner
            if (needsLlm.length > 100) {
                const estCost = (1000 * 20 / 1_000_000 * 0.30 + 1000 * 5 / 1_000_000 * 2.50).toFixed(2);  // Gemini 2.5 Flash pricing
                return `
                <div class="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                    <div class="flex items-start gap-3">
                        <div class="text-amber-500 text-xl">⚡</div>
                        <div class="flex-1">
                            <div class="font-medium text-amber-800">More Accurate Classification Available</div>
                            <div class="text-amber-700 text-sm mt-1">
                                <strong>${needsLlm.length.toLocaleString()}</strong> terms were assigned "Medium Intent" by default because they didn't match any known patterns.
                                An LLM can analyze these terms and classify them more accurately (High Intent, Low Intent, Negative, etc.).
                            </div>
                            <div class="text-amber-600 text-sm mt-2">
                                Cost: ~<strong>$${estCost}</strong> to classify the top 1,000 terms by impressions using Gemini 2.5 Flash.
                                Ask Claude: <code class="bg-amber-100 px-1 rounded">"run LLM classification"</code>
                            </div>
                            <div class="text-amber-500 text-xs mt-1">
                                Note: Low Volume terms (bottom 5%) are excluded - they stay classified as Low Volume.
                            </div>
                        </div>
                    </div>
                </div>`;
            }
            return '';
        })()}

        <!-- Header -->
        <div class="flex justify-between items-start mb-6">
            <div>
                <h1 class="text-2xl font-bold text-gray-900">Search Term Classification</h1>
                <p class="text-gray-600">${accountName || 'Account ' + accountId}${dateRange.startDate && dateRange.endDate ? ` | ${dateRange.startDate} to ${dateRange.endDate}` : ''}${dateRange.days ? ` (${dateRange.days} days)` : ''}</p>
            </div>
        </div>

        <!-- Source Toggle (Global) - only show if account has multiple data sources -->
        ${hasMultipleSources ? `
            <div class="bg-white rounded-lg p-4 shadow-sm mb-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <span class="font-medium text-gray-700">Data Source:</span>
                        <div class="flex gap-2">
                            <button class="source-btn active px-4 py-2 rounded text-sm font-medium border-2 border-blue-500 bg-blue-50 text-blue-700" data-source="all" onclick="filterSource('all')">
                                All (${allTerms.length.toLocaleString()})
                            </button>
                            ${hasSearch ? `<button class="source-btn px-4 py-2 rounded text-sm font-medium border-2 border-transparent bg-gray-100 text-gray-600 hover:bg-gray-200" data-source="S" onclick="filterSource('S')">
                                <span class="inline-flex items-center justify-center w-5 h-5 rounded bg-emerald-500 text-white text-xs font-bold mr-2">S</span>
                                Search (${searchTerms.length.toLocaleString()})
                            </button>` : ''}
                            ${hasShopping ? `<button class="source-btn px-4 py-2 rounded text-sm font-medium border-2 border-transparent bg-gray-100 text-gray-600 hover:bg-gray-200" data-source="Sh" onclick="filterSource('Sh')">
                                <span class="inline-flex items-center justify-center w-5 h-5 rounded bg-orange-500 text-white text-xs font-bold mr-2">Sh</span>
                                Shopping (${shoppingTerms.length.toLocaleString()})
                            </button>` : ''}
                            ${hasPmax ? `<button class="source-btn px-4 py-2 rounded text-sm font-medium border-2 border-transparent bg-gray-100 text-gray-600 hover:bg-gray-200" data-source="P" onclick="filterSource('P')">
                                <span class="inline-flex items-center justify-center w-5 h-5 rounded bg-purple-500 text-white text-xs font-bold mr-2">P</span>
                                PMax (${pmaxTerms.length.toLocaleString()})
                            </button>` : ''}
                        </div>
                    </div>
                    <div class="text-sm text-gray-500">
                        ${hasSearch ? `<span class="inline-flex items-center justify-center w-5 h-5 rounded bg-emerald-500 text-white text-xs font-bold">S</span> Search &nbsp;` : ''}
                        ${hasShopping ? `<span class="inline-flex items-center justify-center w-5 h-5 rounded bg-orange-500 text-white text-xs font-bold">Sh</span> Shopping &nbsp;` : ''}
                        ${hasPmax ? `<span class="inline-flex items-center justify-center w-5 h-5 rounded bg-purple-500 text-white text-xs font-bold">P</span> PMax` : ''}
                    </div>
                </div>
                ${hasPmax ? `<div class="mt-2 text-xs text-amber-600">
                    <strong>Note:</strong> PMax categories have no cost data. PMax "Uncategorized" contains search queries Google chose not to reveal.
                </div>` : ''}
            </div>
            ` : ''}

        <!-- Summary Cards (F1-style dense with S/Sh/P breakdown - only show breakdown if multiple sources exist) -->
        <div class="grid grid-cols-4 gap-4 mb-6">
            <div class="bg-white rounded-lg shadow-sm overflow-hidden">
                <div class="p-3 flex items-baseline justify-between">
                    <div id="scorecard-terms" class="text-2xl font-bold">${formatNumber(totals.terms)}</div>
                    <div class="text-gray-500 text-xs uppercase tracking-wide">Terms</div>
                </div>
                ${hasMultipleSources ? `<div class="px-3 pb-2 flex gap-3 text-xs border-t border-gray-100 pt-2">
                    ${hasSearch ? `<div class="flex items-center gap-1"><span class="inline-flex items-center justify-center w-4 h-4 rounded bg-emerald-500 text-white text-[10px] font-bold">S</span><span id="scorecard-terms-s" class="font-medium">${formatNumber(sTotals.terms)}</span></div>` : ''}
                    ${hasShopping ? `<div class="flex items-center gap-1"><span class="inline-flex items-center justify-center w-4 h-4 rounded bg-orange-500 text-white text-[10px] font-bold">Sh</span><span id="scorecard-terms-sh" class="font-medium">${formatNumber(shTotals.terms)}</span></div>` : ''}
                    ${hasPmax ? `<div class="flex items-center gap-1"><span class="inline-flex items-center justify-center w-4 h-4 rounded bg-purple-500 text-white text-[10px] font-bold">P</span><span id="scorecard-terms-p" class="font-medium">${formatNumber(pTotals.terms)}</span></div>` : ''}
                </div>` : ''}
            </div>
            <div class="bg-white rounded-lg shadow-sm overflow-hidden">
                <div class="p-3 flex items-baseline justify-between">
                    <div id="scorecard-impressions" class="text-2xl font-bold">${formatNumber(totals.impressions)}</div>
                    <div class="text-gray-500 text-xs uppercase tracking-wide">Impr</div>
                </div>
                ${hasMultipleSources ? `<div class="px-3 pb-2 flex gap-3 text-xs border-t border-gray-100 pt-2">
                    ${hasSearch ? `<div class="flex items-center gap-1"><span class="inline-flex items-center justify-center w-4 h-4 rounded bg-emerald-500 text-white text-[10px] font-bold">S</span><span id="scorecard-impr-s" class="font-medium">${formatNumber(sTotals.impressions)}</span></div>` : ''}
                    ${hasShopping ? `<div class="flex items-center gap-1"><span class="inline-flex items-center justify-center w-4 h-4 rounded bg-orange-500 text-white text-[10px] font-bold">Sh</span><span id="scorecard-impr-sh" class="font-medium">${formatNumber(shTotals.impressions)}</span></div>` : ''}
                    ${hasPmax ? `<div class="flex items-center gap-1"><span class="inline-flex items-center justify-center w-4 h-4 rounded bg-purple-500 text-white text-[10px] font-bold">P</span><span id="scorecard-impr-p" class="font-medium">${formatNumber(pTotals.impressions)}</span></div>` : ''}
                </div>` : ''}
            </div>
            <div class="bg-white rounded-lg shadow-sm overflow-hidden">
                <div class="p-3 flex items-baseline justify-between">
                    <div id="scorecard-spend" class="text-2xl font-bold">${formatCurrency(totals.cost_micros, currency)}</div>
                    <div class="text-gray-500 text-xs uppercase tracking-wide">Spend</div>
                </div>
                ${hasMultipleSources ? `<div class="px-3 pb-2 flex gap-3 text-xs border-t border-gray-100 pt-2">
                    ${hasSearch ? `<div class="flex items-center gap-1"><span class="inline-flex items-center justify-center w-4 h-4 rounded bg-emerald-500 text-white text-[10px] font-bold">S</span><span id="scorecard-spend-s" class="font-medium">${formatCurrency(sTotals.cost_micros, currency)}</span></div>` : ''}
                    ${hasShopping ? `<div class="flex items-center gap-1"><span class="inline-flex items-center justify-center w-4 h-4 rounded bg-orange-500 text-white text-[10px] font-bold">Sh</span><span id="scorecard-spend-sh" class="font-medium">${formatCurrency(shTotals.cost_micros, currency)}</span></div>` : ''}
                    ${hasPmax ? `<div class="flex items-center gap-1 text-gray-400"><span class="inline-flex items-center justify-center w-4 h-4 rounded bg-purple-300 text-white text-[10px] font-bold">P</span><span id="scorecard-spend-p" class="font-medium">n/a</span></div>` : ''}
                </div>` : ''}
            </div>
            <div class="bg-white rounded-lg shadow-sm overflow-hidden">
                <div class="p-3 flex items-baseline justify-between">
                    <div id="scorecard-conversions" class="text-2xl font-bold">${totals.conversions.toFixed(1)}</div>
                    <div class="text-gray-500 text-xs uppercase tracking-wide">Conv</div>
                </div>
                ${hasMultipleSources ? `<div class="px-3 pb-2 flex gap-3 text-xs border-t border-gray-100 pt-2">
                    ${hasSearch ? `<div class="flex items-center gap-1"><span class="inline-flex items-center justify-center w-4 h-4 rounded bg-emerald-500 text-white text-[10px] font-bold">S</span><span id="scorecard-conv-s" class="font-medium">${sTotals.conversions.toFixed(1)}</span></div>` : ''}
                    ${hasShopping ? `<div class="flex items-center gap-1"><span class="inline-flex items-center justify-center w-4 h-4 rounded bg-orange-500 text-white text-[10px] font-bold">Sh</span><span id="scorecard-conv-sh" class="font-medium">${shTotals.conversions.toFixed(1)}</span></div>` : ''}
                    ${hasPmax ? `<div class="flex items-center gap-1"><span class="inline-flex items-center justify-center w-4 h-4 rounded bg-purple-500 text-white text-[10px] font-bold">P</span><span id="scorecard-conv-p" class="font-medium">${pTotals.conversions.toFixed(1)}</span></div>` : ''}
                </div>` : ''}
            </div>
        </div>

        <!-- Shared Legend -->
        <div class="bg-white rounded-lg p-4 shadow-sm mb-4">
            <div id="legend-container" class="flex flex-wrap justify-center gap-4">
                ${filteredCategoryStats.map(cat => `
                    <div class="flex items-center gap-2">
                        <div class="w-3 h-3 rounded" style="background: ${categoryColors[cat.category] || '#6b7280'}"></div>
                        <span class="text-sm">${formatCategoryName(cat.category)} (${cat.count.toLocaleString()})</span>
                    </div>
                `).join('')}
            </div>
        </div>

        <!-- 4 Charts -->
        <div class="grid grid-cols-4 gap-4 mb-6">
            <div class="bg-white rounded-lg p-4 shadow-sm">
                <h3 class="text-sm font-medium text-gray-700 mb-2 text-center">Terms by Category</h3>
                <div class="chart-container"><canvas id="termsChart"></canvas></div>
            </div>
            <div class="bg-white rounded-lg p-4 shadow-sm">
                <h3 class="text-sm font-medium text-gray-700 mb-2 text-center">Spend by Category</h3>
                <div class="chart-container"><canvas id="spendChart"></canvas></div>
            </div>
            <div class="bg-white rounded-lg p-4 shadow-sm">
                <h3 class="text-sm font-medium text-gray-700 mb-2 text-center">Impressions by Category</h3>
                <div class="chart-container"><canvas id="impressionsChart"></canvas></div>
            </div>
            <div class="bg-white rounded-lg p-4 shadow-sm">
                <h3 class="text-sm font-medium text-gray-700 mb-2 text-center">Conversions by Category</h3>
                <div class="chart-container"><canvas id="conversionsChart"></canvas></div>
            </div>
        </div>

        <!-- Tabs -->
        <div class="bg-white rounded-lg shadow-sm overflow-hidden">
            <div class="flex border-b">
                <button class="tab-btn active" onclick="showTab('performance')">Category Performance</button>
                <button class="tab-btn" onclick="showTab('terms')">Search Terms</button>
                <button class="tab-btn" onclick="showTab('insights')">Insights</button>
                <button class="tab-btn" onclick="showTab('stats')">Classification Stats</button>
            </div>

            <!-- Tab 1: Category Performance -->
            <div id="tab-performance" class="tab-content active p-6">
                <table>
                    <thead>
                        <tr>
                            <th>Category</th>
                            <th class="text-right">Terms</th>
                            <th class="text-right">Impressions</th>
                            <th class="text-right">Clicks</th>
                            <th class="text-right">CTR</th>
                            <th class="text-right">Spend</th>
                            <th class="text-right">Conv.</th>
                            <th class="text-right">CPA</th>
                        </tr>
                    </thead>
                    <tbody id="categoryPerformanceBody">
                        ${filteredCategoryStats.map(cat => {
                            const metrics = calculateMetrics(cat);
                            return `
                            <tr>
                                <td><span class="category-pill cat-${cat.category}">${formatCategoryName(cat.category)}</span></td>
                                <td class="text-right">${formatNumber(cat.count)}</td>
                                <td class="text-right">${formatNumber(cat.impressions || 0)}</td>
                                <td class="text-right">${formatNumber(cat.clicks || 0)}</td>
                                <td class="text-right">${metrics.ctr}%</td>
                                <td class="text-right">${formatCurrency(cat.cost_micros || 0, currency)}</td>
                                <td class="text-right">${(cat.conversions || 0).toFixed(1)}</td>
                                <td class="text-right">${metrics.cpa !== '-' ? '$' + metrics.cpa : '-'}</td>
                            </tr>`;
                        }).join('')}
                        <tr class="font-semibold bg-gray-50">
                            <td>Total</td>
                            <td class="text-right">${formatNumber(totals.terms)}</td>
                            <td class="text-right">${formatNumber(totals.impressions)}</td>
                            <td class="text-right">${formatNumber(totals.clicks)}</td>
                            <td class="text-right">${calculateMetrics(totals).ctr}%</td>
                            <td class="text-right">${formatCurrency(totals.cost_micros, currency)}</td>
                            <td class="text-right">${totals.conversions.toFixed(1)}</td>
                            <td class="text-right">${totals.conversions > 0 ? '$' + (totals.cost_micros / 1_000_000 / totals.conversions).toFixed(2) : '-'}</td>
                        </tr>
                    </tbody>
                </table>
                ${hasPmax ? `<p class="text-xs text-gray-500 mt-4">Note: Spend totals do not include PMax categories (cost data not available from Google Ads API).</p>` : ''}
            </div>

            <!-- Tab 2: Search Terms -->
            <div id="tab-terms" class="tab-content p-6">
                <div class="flex justify-between items-center mb-4">
                    <div class="flex gap-2 flex-wrap">
                        <button class="filter-btn active" data-category="all" onclick="filterTerms('all')" style="background: #f3f4f6; color: #374151;">All (${allTerms.length.toLocaleString()})</button>
                        ${filteredCategoryStats.map(cat => `
                            <button class="filter-btn cat-${cat.category}" data-category="${cat.category}" onclick="filterTerms('${cat.category}')">${formatCategoryName(cat.category)} (${cat.count.toLocaleString()})</button>
                        `).join('')}
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-sm text-gray-500">Show:</span>
                        <button class="page-btn active" onclick="setPageSize(10)">10</button>
                        <button class="page-btn" onclick="setPageSize(20)">20</button>
                        <button class="page-btn" onclick="setPageSize(50)">50</button>
                        <button class="page-btn" onclick="setPageSize('all')">All</button>
                    </div>
                </div>
                <p class="text-sm text-gray-500 mb-4">Click a category to change it. Changes are saved to the classification cache.</p>
                <table id="termsTable">
                    <thead>
                        <tr>
                            <th id="term-column-header" onclick="sortTerms('term')" class="cursor-pointer" data-sort="term">${hasMultipleSources ? 'Search Term / Category' : (hasSearch ? 'Search Term' : 'Search Category')}</th>
                            <th onclick="sortTerms('category')" class="cursor-pointer text-right" data-sort="category">Category</th>
                            <th onclick="sortTerms('impressions')" class="cursor-pointer text-right sorted" data-sort="impressions">Impr.<span class="sort-arrow">▼</span></th>
                            <th onclick="sortTerms('clicks')" class="cursor-pointer text-right" data-sort="clicks">Clicks</th>
                            <th onclick="sortTerms('cost')" class="cursor-pointer text-right" data-sort="cost">Spend</th>
                            <th onclick="sortTerms('conversions')" class="cursor-pointer text-right" data-sort="conversions">Conv.</th>
                            <th class="text-right">Method <span class="method-info" onmouseenter="showMethodTooltip(event)" onmouseleave="hideMethodTooltip()">?</span></th>
                        </tr>
                    </thead>
                    <tbody id="termsTableBody"></tbody>
                </table>
                <div class="flex justify-between items-center mt-4 pt-4 border-t">
                    <div id="termsInfo" class="text-sm text-gray-500"></div>
                    <div id="termsPagination" class="flex gap-1"></div>
                </div>
            </div>

            <!-- Tab 3: Insights -->
            <div id="tab-insights" class="tab-content p-6">
                <div class="space-y-4">
                    ${generateInsights(categoryStats, totals, currency, allTerms, brandStrings, competitorStrings)}
                </div>
            </div>

            <!-- Tab 4: Classification Stats -->
            <div id="tab-stats" class="tab-content p-6">
                <div class="grid grid-cols-2 gap-6">
                    <div>
                        <h3 class="font-semibold mb-4">Run Statistics</h3>
                        <dl class="space-y-3">
                            <div class="flex justify-between">
                                <dt class="text-gray-600">Model used</dt>
                                <dd class="font-medium">${runStats?.model || 'No LLM run'}</dd>
                            </div>
                            <div class="flex justify-between">
                                <dt class="text-gray-600">Processing time</dt>
                                <dd class="font-medium">${runStats?.processingTime || 'N/A'}</dd>
                            </div>
                            <div class="flex justify-between">
                                <dt class="text-gray-600">LLM cost</dt>
                                <dd class="font-medium">$${(runStats?.llmCost || 0).toFixed(4)}</dd>
                            </div>
                            <div class="flex justify-between">
                                <dt class="text-gray-600">Input file</dt>
                                <dd class="font-medium text-sm">${inputFile || 'N/A'}</dd>
                            </div>
                        </dl>
                    </div>
                    <div>
                        <h3 class="font-semibold mb-4">Classification Methods</h3>
                        <table class="text-sm">
                            <thead>
                                <tr>
                                    <th>Method</th>
                                    <th class="text-right">Count</th>
                                    <th class="text-right">%</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${methodStats.map(m => `
                                <tr>
                                    <td title="${methodTooltips[m.method] || ''}">${m.method.replace(/_/g, ' ')}</td>
                                    <td class="text-right">${formatNumber(m.count)}</td>
                                    <td class="text-right">${((m.count / totals.terms) * 100).toFixed(1)}%</td>
                                </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="mt-6 pt-6 border-t">
                    <h3 class="font-semibold mb-4">Cache Information</h3>
                    <div class="bg-blue-50 rounded-lg p-4">
                        <p class="text-blue-800 text-sm mb-3">
                            Classifications are cached in <code class="bg-blue-100 px-1 rounded">data/search-term-cache.db</code>.
                            Cached terms are reused instantly on subsequent runs.
                        </p>
                        <div class="grid grid-cols-3 gap-4 text-sm">
                            <div>
                                <div class="font-semibold text-blue-900">${formatNumber(cacheStats?.total || 0)}</div>
                                <div class="text-blue-700">Cached terms</div>
                            </div>
                            <div>
                                <div class="font-semibold text-blue-900">${cacheStats?.categories || 0}</div>
                                <div class="text-blue-700">Categories</div>
                            </div>
                            <div>
                                <div class="font-semibold text-blue-900">${formatCurrency(cacheStats?.cost_micros || 0, currency)}</div>
                                <div class="text-blue-700">Tracked spend</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="text-center text-gray-400 text-xs mt-6">
            © 2025, built by Mike Rhodes. To learn how to build tools like this, join <a href="https://mikerhodes.com.au/ai" target="_blank" class="text-blue-500 hover:underline">Ads2AI</a>.
        </div>
    </div>

    <script>
        // Data
        const allTermsData = ${JSON.stringify(allTerms || [])};
        const categoryColors = ${JSON.stringify(categoryColors)};
        const allCategories = ${JSON.stringify(allCategories)};
        const accountId = '${accountId}';
        const inputFile = '${inputFile || ''}';
        const inputFilePath = '${inputFilePath || ''}';
        const API_BASE = 'http://localhost:3456';

        // Format category name for display (snake_case → Title Case)
        function formatCategoryName(category) {
            if (!category) return 'Unknown';
            if (category === 'pmax_uncategorized') return 'PMax Uncategorized';
            if (category === 'ctr') return 'CTR';
            if (category === 'cpa') return 'CPA';
            if (category === 'cpc') return 'CPC';
            return category.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        }

        // State
        let currentCategory = 'all';
        let currentPageSize = 10;
        let currentPage = 1;
        let currentSort = { field: 'impressions', dir: 'desc' };
        const pendingChanges = new Map();

        // Source filter state
        let currentSource = 'all';

        // Charts - base options
        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
        };

        // Store chart instances for updates
        let termsChart, spendChart, impressionsChart, conversionsChart;

        // Terms chart - whole numbers
        termsChart = new Chart(document.getElementById('termsChart'), {
            type: 'doughnut',
            data: {
                labels: ${JSON.stringify(filteredCategoryStats.map(c => formatCategoryName(c.category)))},
                datasets: [{
                    data: ${JSON.stringify(filteredCategoryStats.map(c => c.count))},
                    backgroundColor: ${JSON.stringify(filteredCategoryStats.map(c => categoryColors[c.category] || '#6b7280'))}
                }]
            },
            options: {
                ...chartOptions,
                plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: ctx => ctx.label + ': ' + ctx.raw.toLocaleString() } }
                }
            }
        });

        // Spend chart - currency, no decimals
        spendChart = new Chart(document.getElementById('spendChart'), {
            type: 'doughnut',
            data: {
                labels: ${JSON.stringify(filteredCategoryStats.map(c => formatCategoryName(c.category)))},
                datasets: [{
                    data: ${JSON.stringify(filteredCategoryStats.map(c => Math.round((c.cost_micros || 0) / 1_000_000)))},
                    backgroundColor: ${JSON.stringify(filteredCategoryStats.map(c => categoryColors[c.category] || '#6b7280'))}
                }]
            },
            options: {
                ...chartOptions,
                plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: ctx => ctx.label + ': $' + ctx.raw.toLocaleString() } }
                }
            }
        });

        // Impressions chart - whole numbers with commas
        impressionsChart = new Chart(document.getElementById('impressionsChart'), {
            type: 'doughnut',
            data: {
                labels: ${JSON.stringify(filteredCategoryStats.map(c => formatCategoryName(c.category)))},
                datasets: [{
                    data: ${JSON.stringify(filteredCategoryStats.map(c => c.impressions || 0))},
                    backgroundColor: ${JSON.stringify(filteredCategoryStats.map(c => categoryColors[c.category] || '#6b7280'))}
                }]
            },
            options: {
                ...chartOptions,
                plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: ctx => ctx.label + ': ' + ctx.raw.toLocaleString() } }
                }
            }
        });

        // Conversions chart - 1 decimal place
        conversionsChart = new Chart(document.getElementById('conversionsChart'), {
            type: 'doughnut',
            data: {
                labels: ${JSON.stringify(filteredCategoryStats.map(c => formatCategoryName(c.category)))},
                datasets: [{
                    data: ${JSON.stringify(filteredCategoryStats.map(c => parseFloat((c.conversions || 0).toFixed(1))))},
                    backgroundColor: ${JSON.stringify(filteredCategoryStats.map(c => categoryColors[c.category] || '#6b7280'))}
                }]
            },
            options: {
                ...chartOptions,
                plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: ctx => ctx.label + ': ' + ctx.raw.toFixed(1) } }
                }
            }
        });

        // Tab switching
        function showTab(tabId) {
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.getElementById('tab-' + tabId).classList.add('active');
            event.target.classList.add('active');
            if (tabId === 'terms') renderTermsTable();
        }

        // Terms table
        function getFilteredTerms() {
            let data = [...allTermsData];
            // Filter by source
            if (currentSource !== 'all') {
                data = data.filter(d => (d.source || 'S') === currentSource);
            }
            // Filter by category
            if (currentCategory !== 'all') {
                data = data.filter(d => d.category === currentCategory);
            }
            data.sort((a, b) => {
                let aVal = a[currentSort.field];
                let bVal = b[currentSort.field];
                if (typeof aVal === 'string') aVal = aVal.toLowerCase();
                if (typeof bVal === 'string') bVal = bVal.toLowerCase();
                return currentSort.dir === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
            });
            return data;
        }

        // Filter by source (S=Search, P=PMax)
        function filterSource(source) {
            currentSource = source;
            currentPage = 1;
            document.querySelectorAll('.source-btn').forEach(btn => {
                if (btn.dataset.source === source) {
                    btn.classList.add('active', 'border-blue-500', 'bg-blue-50', 'text-blue-700');
                    btn.classList.remove('border-transparent', 'bg-gray-100', 'text-gray-600');
                } else {
                    btn.classList.remove('active', 'border-blue-500', 'bg-blue-50', 'text-blue-700');
                    btn.classList.add('border-transparent', 'bg-gray-100', 'text-gray-600');
                }
            });
            // Update table header based on source
            const headerEl = document.getElementById('term-column-header');
            if (headerEl) {
                if (source === 'S') {
                    headerEl.textContent = 'Search Term';
                } else if (source === 'P') {
                    headerEl.textContent = 'Search Category';
                } else {
                    headerEl.textContent = 'Search Term / Category';
                }
            }
            updateDashboard();
            renderTermsTable();
        }

        // Update all dashboard elements based on current source filter
        function updateDashboard() {
            // Filter data by source
            const filteredData = currentSource === 'all'
                ? allTermsData
                : allTermsData.filter(d => (d.source || 'S') === currentSource);

            // Recalculate totals
            const newTotals = filteredData.reduce((acc, t) => ({
                terms: acc.terms + 1,
                impressions: acc.impressions + (t.impressions || 0),
                clicks: acc.clicks + (t.clicks || 0),
                cost_micros: acc.cost_micros + (t.cost || 0),
                conversions: acc.conversions + (t.conversions || 0),
                value: acc.value + (t.value || 0)
            }), { terms: 0, impressions: 0, clicks: 0, cost_micros: 0, conversions: 0, value: 0 });

            // Update scorecards
            document.getElementById('scorecard-terms').textContent = newTotals.terms.toLocaleString();
            document.getElementById('scorecard-impressions').textContent = newTotals.impressions.toLocaleString();
            document.getElementById('scorecard-spend').textContent = '$' + (newTotals.cost_micros / 1_000_000).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
            document.getElementById('scorecard-conversions').textContent = newTotals.conversions.toFixed(1);

            // Recalculate category stats
            const catMap = new Map();
            for (const t of filteredData) {
                const cat = t.category || 'medium_intent';
                if (!catMap.has(cat)) {
                    catMap.set(cat, { category: cat, count: 0, impressions: 0, clicks: 0, cost_micros: 0, conversions: 0 });
                }
                const s = catMap.get(cat);
                s.count++;
                s.impressions += t.impressions || 0;
                s.clicks += t.clicks || 0;
                s.cost_micros += t.cost || 0;
                s.conversions += t.conversions || 0;
            }
            const newCategoryStats = Array.from(catMap.values()).sort((a, b) => b.count - a.count);

            // Update legend
            const legendHtml = newCategoryStats.map(cat => \`
                <div class="flex items-center gap-2">
                    <div class="w-3 h-3 rounded" style="background: \${categoryColors[cat.category] || '#6b7280'}"></div>
                    <span class="text-sm">\${formatCategoryName(cat.category)} (\${cat.count.toLocaleString()})</span>
                </div>
            \`).join('');
            const legendContainer = document.getElementById('legend-container');
            if (legendContainer) legendContainer.innerHTML = legendHtml;

            // Update charts - use formatted names for labels
            const labels = newCategoryStats.map(c => formatCategoryName(c.category));
            const colors = newCategoryStats.map(c => categoryColors[c.category] || '#6b7280');

            termsChart.data.labels = labels;
            termsChart.data.datasets[0].data = newCategoryStats.map(c => c.count);
            termsChart.data.datasets[0].backgroundColor = colors;
            termsChart.update();

            spendChart.data.labels = labels;
            spendChart.data.datasets[0].data = newCategoryStats.map(c => Math.round(c.cost_micros / 1_000_000));
            spendChart.data.datasets[0].backgroundColor = colors;
            spendChart.update();

            impressionsChart.data.labels = labels;
            impressionsChart.data.datasets[0].data = newCategoryStats.map(c => c.impressions);
            impressionsChart.data.datasets[0].backgroundColor = colors;
            impressionsChart.update();

            conversionsChart.data.labels = labels;
            conversionsChart.data.datasets[0].data = newCategoryStats.map(c => parseFloat(c.conversions.toFixed(1)));
            conversionsChart.data.datasets[0].backgroundColor = colors;
            conversionsChart.update();

            // Update Category Performance table
            const catPerfBody = document.getElementById('categoryPerformanceBody');
            if (catPerfBody) {
                let tableHtml = '';
                for (const cat of newCategoryStats) {
                    const ctr = cat.clicks > 0 && cat.impressions > 0
                        ? ((cat.clicks / cat.impressions) * 100).toFixed(2)
                        : '0.00';
                    const cpa = cat.conversions > 0 && cat.cost_micros > 0
                        ? (cat.cost_micros / 1_000_000 / cat.conversions).toFixed(2)
                        : '-';
                    tableHtml += \`
                        <tr>
                            <td><span class="category-pill cat-\${cat.category}">\${formatCategoryName(cat.category)}</span></td>
                            <td class="text-right">\${cat.count.toLocaleString()}</td>
                            <td class="text-right">\${cat.impressions.toLocaleString()}</td>
                            <td class="text-right">\${cat.clicks.toLocaleString()}</td>
                            <td class="text-right">\${ctr}%</td>
                            <td class="text-right">$\${(cat.cost_micros / 1_000_000).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                            <td class="text-right">\${cat.conversions.toFixed(1)}</td>
                            <td class="text-right">\${cpa !== '-' ? '$' + cpa : '-'}</td>
                        </tr>\`;
                }
                // Add totals row
                const totalCtr = newTotals.clicks > 0 && newTotals.impressions > 0
                    ? ((newTotals.clicks / newTotals.impressions) * 100).toFixed(2)
                    : '0.00';
                const totalCpa = newTotals.conversions > 0 && newTotals.cost_micros > 0
                    ? (newTotals.cost_micros / 1_000_000 / newTotals.conversions).toFixed(2)
                    : '-';
                tableHtml += \`
                    <tr class="font-semibold bg-gray-50">
                        <td>Total</td>
                        <td class="text-right">\${newTotals.terms.toLocaleString()}</td>
                        <td class="text-right">\${newTotals.impressions.toLocaleString()}</td>
                        <td class="text-right">\${newTotals.clicks.toLocaleString()}</td>
                        <td class="text-right">\${totalCtr}%</td>
                        <td class="text-right">$\${(newTotals.cost_micros / 1_000_000).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                        <td class="text-right">\${newTotals.conversions.toFixed(1)}</td>
                        <td class="text-right">\${totalCpa !== '-' ? '$' + totalCpa : '-'}</td>
                    </tr>\`;
                catPerfBody.innerHTML = tableHtml;
            }
        }

        function renderTermsTable() {
            const data = getFilteredTerms();
            const pageSize = currentPageSize === 'all' ? data.length : currentPageSize;
            const start = (currentPage - 1) * pageSize;
            const end = Math.min(start + pageSize, data.length);
            const pageData = data.slice(start, end);

            const tbody = document.getElementById('termsTableBody');
            tbody.innerHTML = pageData.map(t => {
                const currentCat = pendingChanges.get(t.term) || t.category;
                const hasChange = pendingChanges.has(t.term);
                const source = t.source || 'S';
                let sourceIcon;
                if (source === 'P') {
                    sourceIcon = '<span class="inline-flex items-center justify-center w-4 h-4 rounded bg-purple-500 text-white text-xs font-bold mr-2" title="PMax Category">P</span>';
                } else if (source === 'Sh') {
                    sourceIcon = '<span class="inline-flex items-center justify-center w-4 h-4 rounded bg-orange-500 text-white text-xs font-bold mr-2" title="Shopping Term">Sh</span>';
                } else {
                    sourceIcon = '<span class="inline-flex items-center justify-center w-4 h-4 rounded bg-emerald-500 text-white text-xs font-bold mr-2" title="Search Term">S</span>';
                }
                return \`
                <tr class="\${hasChange ? 'bg-yellow-50' : ''}">
                    <td>\${sourceIcon}\${t.term}</td>
                    <td class="text-right">
                        <select class="category-select cat-\${currentCat}" onchange="changeCategory('\${t.term.replace(/'/g, "\\\\'")}', this.value)">
                            \${allCategories.map(cat => \`<option value="\${cat}" \${cat === currentCat ? 'selected' : ''}>\${formatCategoryName(cat)}</option>\`).join('')}
                        </select>
                    </td>
                    <td class="text-right">\${t.impressions.toLocaleString()}</td>
                    <td class="text-right">\${t.clicks.toLocaleString()}</td>
                    <td class="text-right">$\${(t.cost / 1000000).toFixed(2)}</td>
                    <td class="text-right">\${t.conversions.toFixed(1)}</td>
                    <td class="text-right text-gray-400 text-xs">\${t.method.replace(/_/g, ' ')}</td>
                </tr>\`;
            }).join('');

            document.getElementById('termsInfo').textContent = \`Showing \${start + 1}-\${end} of \${data.length} terms\`;
            renderPagination(data.length, pageSize);
        }

        function renderPagination(total, pageSize) {
            if (currentPageSize === 'all') {
                document.getElementById('termsPagination').innerHTML = '';
                return;
            }
            const totalPages = Math.ceil(total / pageSize);
            let html = \`<button class="page-btn" onclick="goToPage(1)" \${currentPage === 1 ? 'disabled' : ''}>«</button>\`;
            html += \`<button class="page-btn" onclick="goToPage(\${currentPage - 1})" \${currentPage === 1 ? 'disabled' : ''}>‹</button>\`;
            for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
                html += \`<button class="page-btn \${i === currentPage ? 'active' : ''}" onclick="goToPage(\${i})">\${i}</button>\`;
            }
            html += \`<button class="page-btn" onclick="goToPage(\${currentPage + 1})" \${currentPage >= totalPages ? 'disabled' : ''}>›</button>\`;
            html += \`<button class="page-btn" onclick="goToPage(\${totalPages})" \${currentPage >= totalPages ? 'disabled' : ''}>»</button>\`;
            document.getElementById('termsPagination').innerHTML = html;
        }

        function filterTerms(category) {
            currentCategory = category;
            currentPage = 1;
            document.querySelectorAll('[data-category]').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.category === category);
            });
            renderTermsTable();
        }

        function setPageSize(size) {
            currentPageSize = size;
            currentPage = 1;
            renderTermsTable();
        }

        function goToPage(page) {
            currentPage = page;
            renderTermsTable();
        }

        function sortTerms(field) {
            if (currentSort.field === field) {
                currentSort.dir = currentSort.dir === 'asc' ? 'desc' : 'asc';
            } else {
                currentSort = { field, dir: 'desc' };
            }
            updateSortIndicators();
            renderTermsTable();
        }

        function updateSortIndicators() {
            document.querySelectorAll('#termsTable th[data-sort]').forEach(th => {
                const field = th.dataset.sort;
                const arrow = th.querySelector('.sort-arrow');
                if (arrow) arrow.remove();
                th.classList.remove('sorted');

                if (field === currentSort.field) {
                    th.classList.add('sorted');
                    const arrow = document.createElement('span');
                    arrow.className = 'sort-arrow';
                    arrow.textContent = currentSort.dir === 'desc' ? '▼' : '▲';
                    th.appendChild(arrow);
                }
            });
        }

        // Method tooltip
        const methodDescriptions = ${JSON.stringify(methodTooltips)};

        function showMethodTooltip(event) {
            const tooltip = document.createElement('div');
            tooltip.id = 'methodTooltip';
            tooltip.className = 'method-tooltip';
            tooltip.innerHTML = '<strong>Classification Methods:</strong><br><br>' +
                Object.entries(methodDescriptions).map(([k, v]) =>
                    '<strong>' + k.replace(/_/g, ' ') + '</strong>: ' + v
                ).join('<br><br>');

            const rect = event.target.getBoundingClientRect();
            tooltip.style.position = 'fixed';
            tooltip.style.top = (rect.bottom + 8) + 'px';
            tooltip.style.right = '20px';
            document.body.appendChild(tooltip);
        }

        function hideMethodTooltip() {
            const tooltip = document.getElementById('methodTooltip');
            if (tooltip) tooltip.remove();
        }

        // Category changes
        async function changeCategory(term, newCategory) {
            const original = allTermsData.find(t => t.term === term);
            if (!original) return;

            // Try to save immediately via API
            try {
                const res = await fetch(API_BASE + '/api/update-category', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ accountId, term, category: newCategory })
                });
                const data = await res.json();
                if (data.success) {
                    original.category = newCategory;
                    original.method = 'manual_override';
                    pendingChanges.delete(term);
                    showToast(\`Updated "\${term.substring(0, 30)}..." to \${newCategory}\`);
                }
            } catch (e) {
                // API not available, queue for later
                if (original.category !== newCategory) {
                    pendingChanges.set(term, newCategory);
                } else {
                    pendingChanges.delete(term);
                }
                updateSaveButton();
            }
            renderTermsTable();
        }

        function updateSaveButton() {
            const btn = document.getElementById('saveChangesBtn');
            const count = pendingChanges.size;
            if (count > 0) {
                btn.textContent = \`Save \${count} change\${count > 1 ? 's' : ''}\`;
                btn.disabled = false;
                btn.classList.remove('opacity-50', 'hidden');
            } else {
                btn.classList.add('hidden');
            }
        }

        async function saveChanges() {
            if (pendingChanges.size === 0) return;

            const btn = document.getElementById('saveChangesBtn');
            btn.textContent = 'Saving...';
            btn.disabled = true;

            const updates = Array.from(pendingChanges.entries()).map(([term, category]) => ({ term, category }));

            try {
                const res = await fetch(API_BASE + '/api/update-categories', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ accountId, updates })
                });
                const data = await res.json();
                if (data.success) {
                    showToast(\`Saved \${data.updated} category changes\`);
                    for (const [term, category] of pendingChanges) {
                        const item = allTermsData.find(t => t.term === term);
                        if (item) { item.category = category; item.method = 'manual_override'; }
                    }
                    pendingChanges.clear();
                }
            } catch (e) {
                showToast('Error: Start the server with serve-report.js', true);
            }

            updateSaveButton();
            renderTermsTable();
        }

        // Toast notifications
        function showToast(message, isError = false) {
            const toast = document.createElement('div');
            toast.className = \`fixed bottom-4 right-4 px-4 py-2 rounded shadow-lg text-white \${isError ? 'bg-red-600' : 'bg-gray-800'}\`;
            toast.textContent = message;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        }

        // Initialize
        renderTermsTable();
    </script>
</body>
</html>`;

    return html;
}

// Generate insights
function generateInsights(categoryStats, totals, currency, allTerms = [], brandStrings = [], competitorStrings = []) {
    const insights = [];

    // Brand terms
    const brand = categoryStats.find(c => c.category === 'brand');
    if (brand && brand.count > 0) {
        const pct = ((brand.cost_micros / totals.cost_micros) * 100).toFixed(1);
        insights.push(`
            <div class="flex gap-3 p-4 bg-blue-50 rounded-lg">
                <div class="text-blue-500 text-xl">★</div>
                <div>
                    <div class="font-medium">${brand.count} brand terms (${pct}% of spend)</div>
                    <div class="text-gray-600 text-sm">Matched from brand_strings in accounts.json. Usually convert well.</div>
                </div>
            </div>
        `);
    }

    // Competitor terms
    const competitor = categoryStats.find(c => c.category === 'competitor');
    if (competitor && competitor.count > 0) {
        const pct = ((competitor.cost_micros / totals.cost_micros) * 100).toFixed(1);
        insights.push(`
            <div class="flex gap-3 p-4 bg-orange-50 rounded-lg">
                <div class="text-orange-500 text-xl">⚔</div>
                <div>
                    <div class="font-medium">${competitor.count} competitor terms (${pct}% of spend)</div>
                    <div class="text-gray-600 text-sm">Matched from competitor_strings. Consider negating if not converting.</div>
                </div>
            </div>
        `);
    }

    // Low intent spend
    const lowIntent = categoryStats.find(c => c.category === 'low_intent');
    if (lowIntent && lowIntent.cost_micros > 0) {
        const pct = ((lowIntent.cost_micros / totals.cost_micros) * 100).toFixed(1);
        const convRate = lowIntent.clicks > 0 ? ((lowIntent.conversions || 0) / lowIntent.clicks * 100).toFixed(1) : 0;
        insights.push(`
            <div class="flex gap-3 p-4 bg-amber-50 rounded-lg">
                <div class="text-amber-500 text-xl">⚠</div>
                <div>
                    <div class="font-medium">Low intent queries: ${formatCurrency(lowIntent.cost_micros, currency)} (${pct}%)</div>
                    <div class="text-gray-600 text-sm">Research-stage queries with ${convRate}% conversion rate. Consider lower bids or audience adjustments.</div>
                </div>
            </div>
        `);
    }

    // Negative spend (waste)
    const negative = categoryStats.find(c => c.category === 'negative');
    if (negative && negative.cost_micros > 0) {
        const pct = ((negative.cost_micros / totals.cost_micros) * 100).toFixed(1);
        insights.push(`
            <div class="flex gap-3 p-4 bg-red-50 rounded-lg">
                <div class="text-red-500 text-xl">✕</div>
                <div>
                    <div class="font-medium">Negative query spend: ${formatCurrency(negative.cost_micros, currency)} (${pct}%)</div>
                    <div class="text-gray-600 text-sm">${negative.count} terms that should be negated (jobs, DIY, free, etc). Add to negative keyword lists.</div>
                </div>
            </div>
        `);
    }

    // Sold brand insight
    const soldBrand = categoryStats.find(c => c.category === 'sold_brand');
    if (soldBrand && soldBrand.count > 0) {
        const pct = ((soldBrand.cost_micros / totals.cost_micros) * 100).toFixed(1);
        const convRate = soldBrand.clicks > 0 ? ((soldBrand.conversions || 0) / soldBrand.clicks * 100).toFixed(1) : 0;
        insights.push(`
            <div class="flex gap-3 p-4 bg-indigo-50 rounded-lg">
                <div class="text-indigo-500 text-xl">🏷</div>
                <div>
                    <div class="font-medium">${soldBrand.count} brand product searches (${pct}% of spend)</div>
                    <div class="text-gray-600 text-sm">Searches for brands you stock. ${convRate}% conversion rate. Great for landing pages with that brand.</div>
                </div>
            </div>
        `);
    }

    // Best performing
    const sorted = categoryStats.filter(c => c.clicks > 10).map(c => ({
        ...c, convRate: (c.conversions || 0) / c.clicks
    })).sort((a, b) => b.convRate - a.convRate);

    if (sorted.length > 0) {
        const best = sorted[0];
        insights.push(`
            <div class="flex gap-3 p-4 bg-green-50 rounded-lg">
                <div class="text-green-500 text-xl">✓</div>
                <div>
                    <div class="font-medium">${best.category} converting at ${(best.convRate * 100).toFixed(1)}%</div>
                    <div class="text-gray-600 text-sm">Best performing category. Consider increasing bids here.</div>
                </div>
            </div>
        `);
    }

    // Potential brand/competitor suggestions
    // Look for terms that might be brand names but aren't in brand_strings or competitor_strings
    if (allTerms.length > 0) {
        const lowerBrandStrings = brandStrings.map(s => s.toLowerCase());
        const lowerCompetitorStrings = competitorStrings.map(s => s.toLowerCase());

        // Find potential brand-like terms (proper nouns, company names)
        // that appear multiple times and have significant impressions
        const potentialBrands = new Map();

        // Known retailer/competitor patterns that might appear
        const knownRetailers = ['bunnings', 'amazon', 'ebay', 'kmart', 'big w', 'officeworks', 'jb hi fi'];

        for (const term of allTerms) {
            const lowerTerm = term.term.toLowerCase();

            // Skip if already covered by brand or competitor strings
            const isCoveredByBrand = lowerBrandStrings.some(bs => lowerTerm.includes(bs));
            const isCoveredByCompetitor = lowerCompetitorStrings.some(cs => lowerTerm.includes(cs));

            if (!isCoveredByBrand && !isCoveredByCompetitor) {
                // Check for known retailer patterns
                for (const retailer of knownRetailers) {
                    if (lowerTerm.includes(retailer)) {
                        if (!potentialBrands.has(retailer)) {
                            potentialBrands.set(retailer, {
                                name: retailer,
                                count: 0,
                                impressions: 0,
                                cost: 0,
                                type: 'competitor'
                            });
                        }
                        const data = potentialBrands.get(retailer);
                        data.count++;
                        data.impressions += term.impressions || 0;
                        data.cost += term.cost || 0;
                    }
                }
            }
        }

        // Filter to only suggestions with 3+ occurrences and significant impressions
        const suggestions = Array.from(potentialBrands.values())
            .filter(s => s.count >= 3 && s.impressions >= 100)
            .sort((a, b) => b.cost - a.cost)
            .slice(0, 3);  // Top 3 suggestions only

        if (suggestions.length > 0) {
            const suggestionList = suggestions.map(s =>
                `<li><code>${s.name}</code> (${s.count} terms, ${formatNumber(s.impressions)} impr)</li>`
            ).join('');

            insights.push(`
                <div class="flex gap-3 p-4 bg-purple-50 rounded-lg">
                    <div class="text-purple-500 text-xl">💡</div>
                    <div>
                        <div class="font-medium">Potential competitor_strings to add:</div>
                        <ul class="text-gray-600 text-sm mt-1 list-disc list-inside">${suggestionList}</ul>
                        <div class="text-gray-500 text-xs mt-2">Add to .claude/accounts.json to auto-classify as competitor.</div>
                    </div>
                </div>
            `);
        }
    }

    return insights.join('');
}

// Main function
async function main() {
    const args = parseArgs();

    if (args.help || !args['account-id']) {
        console.log(`
Search Term Classification Report Generator

Usage:
  node report.js --account-id=<id> --input=<file> [options]

Required:
  --account-id      Google Ads account ID
  --input           Input CSV file (classified)

Output (one of):
  --account-name    Account name for auto-folder (saves to data/google-ads/{name}/)
  --output          Explicit output HTML file path

Options:
  --start-date      Start date of data (YYYY-MM-DD)
  --end-date        End date of data (YYYY-MM-DD)
  --days            Number of days in report
  --serve           Start server after generating
  --open            Open report in browser after generating
  --help            Show this help

Example:
  node report.js --account-id=7435598264 --account-name=mpm --input=data/google-ads/mpm/20251128-mpm-classified.csv
`);
        process.exit(0);
    }

    const accountId = args['account-id'];
    const inputFile = args.input;
    const accountName = args['account-name'];

    // Determine output path
    let outputFile;
    if (args.output) {
        outputFile = args.output;
    } else if (accountName) {
        // Auto-folder: data/google-ads/{account-name}/
        const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const accountDir = resolve(process.cwd(), 'data/google-ads', accountName);
        if (!existsSync(accountDir)) {
            mkdirSync(accountDir, { recursive: true });
            console.log(`Created folder: ${accountDir}`);
        }
        outputFile = resolve(accountDir, `${today}-${accountName}-report.html`);
    } else {
        // Default: data/reports/
        outputFile = `data/reports/search-term-report-${new Date().toISOString().slice(0,10)}.html`;
    }
    const startDate = args['start-date'];
    const endDate = args['end-date'];
    const days = args.days ? parseInt(args.days) : null;

    console.log(`Generating report for account ${accountId}...`);

    // Load account info for brand/competitor strings
    const accountsPath = resolve(process.cwd(), '.claude/accounts.json');
    let accountInfo = null;
    let brandStrings = [];
    let competitorStrings = [];

    if (existsSync(accountsPath)) {
        try {
            const accounts = JSON.parse(readFileSync(accountsPath, 'utf8'));
            for (const [key, account] of Object.entries(accounts)) {
                if (account.id === accountId) {
                    accountInfo = { key, ...account };
                    brandStrings = account.brand_strings || [];
                    competitorStrings = account.competitor_strings || [];
                    break;
                }
            }
        } catch (err) {
            console.warn('Warning: Could not load accounts.json:', err.message);
        }
    }

    // Get cache data (cache only contains LLM-classified terms now)
    const cache = new ClassificationCache();
    const cacheStats = cache.getStats(accountId);
    const categoryDist = cache.getCategoryDistribution(accountId);

    // Cache now only stores LLM terms, so method distribution is just "llm"
    const methodDist = cacheStats.total > 0
        ? [{ method: 'llm', count: cacheStats.total }]
        : [];

    let allTerms = [];
    let enrichedCategoryStats = categoryDist;

    if (inputFile && existsSync(inputFile)) {
        console.log(`Reading classified data from ${inputFile}...`);
        const content = readFileSync(inputFile, 'utf8');
        const lines = content.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

        const rows = [];
        for (let i = 1; i < lines.length; i++) {
            const values = [];
            let current = '';
            let inQuotes = false;
            for (const char of lines[i]) {
                if (char === '"') inQuotes = !inQuotes;
                else if (char === ',' && !inQuotes) { values.push(current.trim()); current = ''; }
                else current += char;
            }
            values.push(current.trim());
            const row = {};
            headers.forEach((h, idx) => row[h] = values[idx] || '');
            rows.push(row);
        }

        // Prefer .search_term over .resource_name
        const termCol = headers.find(h => h.endsWith('.search_term') || h === 'search_term' || h === 'Search term')
            || headers.find(h => /search.*term/i.test(h) && !/resource/i.test(h))
            || headers[0];
        const impCol = headers.find(h => /impr/i.test(h)) || 'impressions';
        const clickCol = headers.find(h => /click/i.test(h)) || 'clicks';
        const costCol = headers.find(h => /cost/i.test(h)) || 'cost_micros';
        const convCol = headers.find(h => /conv/i.test(h) && !/value/i.test(h)) || 'conversions';
        const catCol = headers.find(h => h === 'category' || /intent.*cat/i.test(h)) || 'category';
        const methodCol = headers.find(h => h === 'method' || /intent.*method/i.test(h)) || 'method';
        const sourceCol = headers.find(h => h === 'source') || null;

        const byCategory = {};
        for (const row of rows) {
            const cat = row[catCol] || 'unknown';
            if (!byCategory[cat]) {
                byCategory[cat] = { category: cat, count: 0, impressions: 0, clicks: 0, cost_micros: 0, conversions: 0 };
            }
            byCategory[cat].count++;
            byCategory[cat].impressions += parseInt(row[impCol]) || 0;
            byCategory[cat].clicks += parseInt(row[clickCol]) || 0;
            byCategory[cat].cost_micros += parseInt(row[costCol]) || 0;
            byCategory[cat].conversions += parseFloat(row[convCol]) || 0;

            allTerms.push({
                term: row[termCol],
                category: cat,
                impressions: parseInt(row[impCol]) || 0,
                clicks: parseInt(row[clickCol]) || 0,
                cost: parseInt(row[costCol]) || 0,
                conversions: parseFloat(row[convCol]) || 0,
                method: row[methodCol] || 'unknown',
                source: sourceCol ? (row[sourceCol] || 'S') : 'S'
            });
        }

        enrichedCategoryStats = Object.values(byCategory).sort((a, b) => b.count - a.count);
    }

    // Generate report
    const reportData = {
        accountId,
        accountName: accountInfo?.name || 'Account ' + accountId,
        inputFile: inputFile ? inputFile.split('/').pop() : null,
        inputFilePath: inputFile || null,  // Full path for reclassify
        runStats: null,  // No fake stats - only show real data if passed
        dateRange: {
            startDate,
            endDate,
            days
        },
        categoryStats: enrichedCategoryStats,
        methodStats: methodDist,
        cacheStats,
        allTerms,
        brandStrings,
        competitorStrings,
        currency: accountInfo?.currency || 'AUD'
    };

    const html = generateReport(reportData);

    const outputDir = dirname(resolve(outputFile));
    if (!existsSync(outputDir)) {
        execSync(`mkdir -p "${outputDir}"`);
    }

    const fullOutputPath = resolve(outputFile);
    writeFileSync(fullOutputPath, html);
    console.log(`Report written to: ${fullOutputPath}`);

    if (args.serve) {
        console.log('\nStarting server...');
        const { spawn } = await import('child_process');
        spawn('node', ['.claude/skills/search-term-classifier/scripts/serve-report.js', `--report=${fullOutputPath}`], {
            stdio: 'inherit',
            cwd: process.cwd()
        });
    } else if (args.open) {
        const openCmd = process.platform === 'darwin' ? 'open' : 'xdg-open';
        execSync(`${openCmd} "${fullOutputPath}"`);
    }

    cache.close();
}

main().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
