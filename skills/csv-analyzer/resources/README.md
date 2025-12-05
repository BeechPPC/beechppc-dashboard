# CSV Analyzer - Resources

## Recent Improvements (2025-10-22)

**Automatic error handling added:**
- **File path resolution** - Handles spaces in filenames, searches for similar files if exact match not found
- **Google Ads format detection** - Auto-detects Google Ads exports and skips header rows (report name + date range)
- **Numeric data cleaning** - Automatically removes commas, currency symbols (£, $) from numeric columns
- **Dependency management** - `run_analysis.sh` wrapper automatically sets up venv and installs dependencies
- **Robust execution** - No more manual skiprows or file path errors

**Usage:**
```bash
# New wrapper script handles everything automatically
./run_analysis.sh "/path/to/Ad group report.csv"

# Or use check_deps.py to verify setup
python check_deps.py
```

---

## Example Data

The `examples/ad-group-report.csv` file contains a Google Ads ad group performance report with columns including:

- **Ad group status**: Status of the ad group (Enabled, Paused, etc.)
- **Ad group**: Name of the ad group
- **Campaign**: Campaign name
- **Currency code**: GBP, USD, etc.
- **Impr.**: Impressions
- **Clicks**: Number of clicks
- **Cost**: Total cost
- **Conversions**: Total conversions
- **Conv. value**: Conversion value
- **Avg. CPC**: Average cost per click
- Plus many other Google Ads metrics

## Usage Examples

### Basic Analysis
```
Analyze this Google Ads ad group report.
```

### With Custom CSV
```
Here's my campaign performance CSV. Can you analyze it?
```

### Automatic Insights
```
I've uploaded an ad group report - analyze it.
```

## Testing the Skill

You can test the skill locally:

```bash
# Install dependencies
pip install -r ../requirements.txt

# Run the analysis on the example Google Ads report
python ../analyze.py ../examples/ad-group-report.csv
```

## Expected Output

The analysis will provide:

1. **Dataset dimensions** - Row and column counts
2. **Column information** - Names and data types
3. **Summary statistics** - Mean, median, std dev, min/max for numeric columns
4. **Correlation analysis** - Relationships between metrics (e.g., cost vs. conversions)
5. **Data quality** - Missing value detection and counts
6. **Categorical distributions** - Campaign types, ad group status, etc.
7. **Visualizations** - Correlation heatmaps, distributions, categorical charts

## Notes

This skill is particularly useful for:
- Google Ads performance analysis
- Campaign optimization insights
- Budget allocation analysis
- Conversion pattern detection
- Multi-account performance comparison

