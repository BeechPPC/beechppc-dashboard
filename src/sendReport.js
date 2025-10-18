#!/usr/bin/env node

/**
 * Interactive CLI Tool for Sending Template Reports
 * Allows users to select accounts, templates, and send reports
 */

import readline from 'readline';
import { getAllTemplates } from './reportTemplates.js';
import { getCustomerAccounts } from './templateReportQueries.js';
import { generateTemplateReport } from './generateTemplateReport.js';

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/**
 * Prompt user for input
 * @param {string} question - Question to ask
 * @returns {Promise<string>} User's answer
 */
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * Display menu and get user selection
 * @param {string} title - Menu title
 * @param {Array} options - Array of option objects with 'label' and 'value'
 * @returns {Promise<string>} Selected value
 */
async function displayMenu(title, options) {
  console.log(`\n${title}`);
  console.log('='.repeat(title.length));

  options.forEach((option, index) => {
    console.log(`${index + 1}. ${option.label}`);
  });

  const answer = await prompt('\nSelect an option (enter number): ');
  const selectedIndex = parseInt(answer) - 1;

  if (selectedIndex < 0 || selectedIndex >= options.length) {
    console.log('Invalid selection. Please try again.');
    return displayMenu(title, options);
  }

  return options[selectedIndex].value;
}

/**
 * Main CLI function
 */
async function main() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   Beech PPC Template Report Sender    ║');
  console.log('╚════════════════════════════════════════╝\n');

  try {
    // Step 1: Select Account
    console.log('Loading accounts...');
    const accounts = await getCustomerAccounts();

    const accountOptions = [
      { label: 'All Accounts', value: null },
      ...accounts.map(acc => ({
        label: `${acc.name} (${acc.id})`,
        value: acc.id,
      })),
    ];

    const selectedAccountId = await displayMenu('SELECT ACCOUNT', accountOptions);

    // Step 2: Select Template
    const templates = getAllTemplates();
    const templateOptions = templates.map(template => ({
      label: template.name,
      value: template.id,
    }));

    const selectedTemplateId = await displayMenu('SELECT REPORT TEMPLATE', templateOptions);

    // Step 3: Confirm and Send
    const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
    const selectedAccount = selectedAccountId
      ? accounts.find(a => a.id === selectedAccountId)
      : null;

    console.log('\n╔════════════════════════════════════════╗');
    console.log('║          REPORT SUMMARY                ║');
    console.log('╚════════════════════════════════════════╝');
    console.log(`\nReport: ${selectedTemplate.name}`);
    console.log(`Description: ${selectedTemplate.description}`);
    console.log(`Account: ${selectedAccount ? selectedAccount.name : 'All Accounts'}`);
    console.log(`Date Range: ${selectedTemplate.dateRange}`);

    const confirm = await prompt('\nSend this report now? (yes/no): ');

    if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
      console.log('\nReport cancelled.');
      rl.close();
      return;
    }

    // Step 4: Generate and Send Report
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║       GENERATING REPORT...             ║');
    console.log('╚════════════════════════════════════════╝\n');

    const result = await generateTemplateReport(selectedTemplateId, selectedAccountId, true);

    // Display results
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║           REPORT SENT!                 ║');
    console.log('╚════════════════════════════════════════╝\n');

    console.log('Summary:');
    console.log(`Template: ${result.template}`);
    console.log(`Accounts Processed: ${result.results.length}`);
    console.log(`Successful: ${result.results.filter(r => r.success).length}`);
    console.log(`Failed: ${result.results.filter(r => !r.success).length}`);

    console.log('\nDetails:');
    result.results.forEach(res => {
      const status = res.success ? '✓' : '✗';
      const count = res.resultCount !== undefined ? ` (${res.resultCount} results)` : '';
      console.log(`${status} ${res.accountName}${count}`);
    });

    console.log('\nReport has been sent via email.');

  } catch (error) {
    console.error('\n✗ Error:', error.message);
    console.error(error);
  } finally {
    rl.close();
  }
}

// Handle SIGINT (Ctrl+C)
rl.on('SIGINT', () => {
  console.log('\n\nReport cancelled.');
  rl.close();
  process.exit(0);
});

// Run the CLI
main().catch((error) => {
  console.error('Fatal error:', error);
  rl.close();
  process.exit(1);
});
