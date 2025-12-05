# CSV Analyzer Skill

Analyzes CSV files (including Google Ads reports) with automated statistics, insights, and visualizations.

## Features

- **Automatic file resolution** - Handles spaces in filenames and fuzzy matching
- **Google Ads format detection** - Auto-detects and skips header rows in Google Ads CSV exports
- **Smart numeric cleaning** - Removes commas, currency symbols, handles percentages
- **Dependency auto-setup** - Creates venv and installs requirements on first run
- **Adaptive analysis** - Adjusts analysis based on data type (Google Ads, sales, financial, etc.)
- **Rich visualizations** - Automatic charts for distributions, correlations, trends, and performance

## For Claude Code

When analyzing a CSV file, use the wrapper script for automatic setup:

```bash
cd /path/to/csv-analyzer
./run_analysis.sh "/path/to/file.csv"
```

The wrapper:
1. Creates venv if needed
2. Installs dependencies
3. Handles file path resolution (spaces, fuzzy matching)
4. Detects Google Ads format (skips header rows)
5. Cleans numeric data (commas, currency)
6. Runs comprehensive analysis

## Files

- **analyze.py** - Main analysis script with robust error handling
- **run_analysis.sh** - Wrapper script that handles setup automatically
- **check_deps.py** - Dependency checker and installer
- **requirements.txt** - Python dependencies
- **resources/README.md** - Detailed documentation

## Example Usage

```bash
# Analyze a Google Ads export with spaces in filename
./run_analysis.sh "~/Desktop/Ad group report.csv"

# Check if dependencies are installed
python check_deps.py

# Direct Python usage (requires manual venv activation)
source venv/bin/activate
python analyze.py "~/Desktop/campaign-data.csv"
```

## Improvements (2025-10-22)

Previously, the skill had issues with:
- File paths containing spaces
- Google Ads CSV header rows
- Missing pandas/matplotlib dependencies

Now all of these are handled automatically by the improved `analyze.py` and new `run_analysis.sh` wrapper.
