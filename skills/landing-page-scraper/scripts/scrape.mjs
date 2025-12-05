#!/usr/bin/env node

/**
 * Landing Page Scraper
 *
 * Extracts metadata from landing pages for Google Ads RSA/sitelinks generation.
 * Uses Chrome DevTools Protocol via puppeteer-core.
 *
 * Usage:
 *   node scrape.mjs <url1> <url2> ... [--output <path>]
 *   node scrape.mjs --urls-file <file.txt> [--output <path>]
 *
 * Requirements:
 *   - Chrome running with CDP on port 9222
 *   - Start Chrome: /Users/mikerhodes/Projects/brain/code/tools/start.js
 */

import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const urls = [];
  let outputPath = null;
  let urlsFile = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--output' && args[i + 1]) {
      outputPath = args[++i];
    } else if (args[i] === '--urls-file' && args[i + 1]) {
      urlsFile = args[++i];
    } else if (args[i].startsWith('http')) {
      urls.push(args[i]);
    }
  }

  // If urls-file provided, read URLs from file
  if (urlsFile) {
    const content = fs.readFileSync(urlsFile, 'utf-8');
    urls.push(...content.split('\n').map(u => u.trim()).filter(u => u && u.startsWith('http')));
  }

  // Default output path
  if (!outputPath) {
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    outputPath = `/tmp/landing-pages-${timestamp}.csv`;
  }

  return { urls, outputPath };
}

async function scrapePage(page, url) {
  console.log(`Scraping: ${url}`);

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    const data = await page.evaluate(() => {
      return {
        title: document.title || '',
        metaDescription: document.querySelector('meta[name="description"]')?.content || '',
        h1: document.querySelector('h1')?.innerText || '',
        content: Array.from(document.querySelectorAll('p, li'))
          .map(el => el.innerText)
          .filter(text => text && text.length > 20)
          .slice(0, 10)
          .join(' ')
          .substring(0, 500)
      };
    });

    console.log(`  Title: ${data.title.substring(0, 60)}...`);
    return { url, ...data };
  } catch (error) {
    console.error(`  Error: ${error.message}`);
    return {
      url,
      title: 'ERROR',
      metaDescription: 'ERROR',
      h1: 'ERROR',
      content: 'ERROR'
    };
  }
}

async function main() {
  const { urls, outputPath } = parseArgs();

  if (urls.length === 0) {
    console.error('Usage: node scrape.mjs <url1> <url2> ... [--output <path>]');
    console.error('       node scrape.mjs --urls-file <file.txt> [--output <path>]');
    process.exit(1);
  }

  const browser = await puppeteer.connect({
    browserURL: "http://localhost:9222",
    defaultViewport: null,
  });

  console.log(`Connected to Chrome. Scraping ${urls.length} URLs...\n`);

  const page = await browser.newPage();
  const results = [];

  for (const url of urls) {
    const data = await scrapePage(page, url);
    results.push(data);
  }

  await page.close();
  await browser.disconnect();

  // Build CSV
  const escapeCsv = (str) => {
    if (!str) return '';
    str = str.replace(/[\r\n]+/g, ' ').replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvHeader = 'Final URL,Title Tag,Meta Description,H1,Content\n';
  const csvRows = results.map(row => {
    return [
      escapeCsv(row.url),
      escapeCsv(row.title),
      escapeCsv(row.metaDescription),
      escapeCsv(row.h1),
      escapeCsv(row.content)
    ].join(',');
  }).join('\n');

  const csv = csvHeader + csvRows;
  fs.writeFileSync(outputPath, csv);

  console.log(`\nCSV saved to: ${outputPath}`);
  console.log(`Scraped ${results.length} pages`);
}

main().catch(console.error);
