#!/usr/bin/env python3
"""
General-purpose transformer for Google Ads API JSON data to markdown tables.

Auto-detects field types and applies appropriate formatting:
- *_micros fields → currency (÷ 1,000,000)
- ctr, *_rate, *_share → percentage (× 100)
- conversions_value → currency (NOT micros!)
- ROAS calculation where applicable

Usage:
    python transform_data.py [--currency USD] [--input-dir ./] [--output transformed.md]
"""

import json
import argparse
from pathlib import Path
from typing import Dict, List, Any, Optional


# ============================================================================
# Core Formatting Functions
# ============================================================================

def format_field(field_name: str, value: Any, currency: str = "$") -> str:
    """
    Auto-detect field type and apply appropriate formatting.

    Args:
        field_name: The field name from Google Ads API (e.g., "metrics.cost_micros")
        value: The raw value
        currency: Currency symbol to use

    Returns:
        Formatted string appropriate for the field type
    """
    # Handle None/null values
    if value is None or value == "":
        return "-"

    # Convert to number if string
    if isinstance(value, str):
        try:
            value = float(value)
        except (ValueError, TypeError):
            # Keep as string (e.g., campaign names, statuses)
            return str(value)

    # Micros fields → currency (divide by 1,000,000)
    if "_micros" in field_name and "conversions_value" not in field_name:
        amount = value / 1_000_000
        if amount >= 1000:
            return f"{currency}{amount:,.0f}"
        return f"{currency}{amount:,.2f}"

    # conversions_value is already in currency (NOT micros!)
    if "conversions_value" in field_name:
        if value >= 1000:
            return f"{currency}{value:,.0f}"
        return f"{currency}{value:,.2f}"

    # CTR, conversion rates, impression share → percentage
    if any(keyword in field_name.lower() for keyword in ["ctr", "_rate", "_share"]):
        return f"{value * 100:.2f}%"

    # Status fields → Title case
    if "status" in field_name:
        return str(value).replace("_", " ").title()

    # Type fields → Clean up underscores
    if "type" in field_name:
        return str(value).replace("_", " ").title()

    # Strategy fields → Clean up underscores
    if "strategy" in field_name:
        return str(value).replace("_", " ").title()

    # Large numbers (impressions, clicks) → commas
    if isinstance(value, (int, float)) and value >= 1000 and "." not in str(value):
        return f"{int(value):,}"

    # Conversions → 1 decimal place
    if "conversions" in field_name and "_value" not in field_name:
        return f"{value:.1f}"

    # Default: return as-is
    if isinstance(value, float):
        return f"{value:.2f}"
    return str(value)


def calculate_derived_metrics(row: Dict[str, Any], currency: str = "$") -> Dict[str, str]:
    """
    Calculate derived metrics from raw data.

    Args:
        row: Single row of Google Ads data
        currency: Currency symbol

    Returns:
        Dictionary of derived metric name → formatted value
    """
    derived = {}

    # Calculate ROAS if we have conversions_value and cost_micros
    if "metrics.conversions_value" in row and "metrics.cost_micros" in row:
        conv_value = row["metrics.conversions_value"]
        cost_micros = row["metrics.cost_micros"]

        if cost_micros > 0:
            cost = cost_micros / 1_000_000
            roas = conv_value / cost
            derived["ROAS"] = f"{roas:.2f}x"
        else:
            derived["ROAS"] = "-"

    # Calculate budget utilization (7-day spend vs daily budget)
    if "campaign_budget.amount_micros" in row and "metrics.cost_micros" in row:
        budget_micros = row["campaign_budget.amount_micros"]
        cost_micros = row["metrics.cost_micros"]

        if budget_micros > 0:
            budget_daily = budget_micros / 1_000_000
            cost_7day = cost_micros / 1_000_000
            utilization = (cost_7day / (budget_daily * 7)) * 100
            derived["Budget Utilization"] = f"{utilization:.0f}%"

    return derived


# ============================================================================
# Markdown Table Generation
# ============================================================================

def json_to_markdown_table(data: List[Dict],
                          title: str,
                          currency: str = "$",
                          key_fields: Optional[List[str]] = None,
                          calculate_totals: bool = False) -> str:
    """
    Convert Google Ads JSON data to markdown table.

    Args:
        data: List of dictionaries from Google Ads API
        title: Table title
        currency: Currency symbol
        key_fields: Optional list of specific fields to include (in order)
        calculate_totals: Whether to calculate and append totals row

    Returns:
        Markdown-formatted table as string
    """
    if not data:
        return f"## {title}\n\n*No data available*\n"

    # Determine fields to include
    if key_fields:
        fields = key_fields
    else:
        # Use all fields from first row
        fields = list(data[0].keys())

    # Generate header row
    header_labels = [field.split(".")[-1].replace("_", " ").title() for field in fields]

    # Add derived metrics columns if applicable
    derived_metrics = calculate_derived_metrics(data[0], currency)
    header_labels.extend(derived_metrics.keys())

    # Create table header
    table = f"## {title}\n\n"
    table += "| " + " | ".join(header_labels) + " |\n"
    table += "|" + "|".join(["-" * (len(label) + 2) for label in header_labels]) + "|\n"

    # Tracking for totals
    totals = {field: 0 for field in fields if any(metric in field for metric in ["cost_micros", "conversions", "conversions_value", "impressions", "clicks"])}

    # Generate data rows
    for row in data:
        values = []

        # Format each field
        for field in fields:
            value = row.get(field, "-")
            formatted = format_field(field, value, currency)
            values.append(formatted)

            # Track totals
            if field in totals and isinstance(value, (int, float)):
                totals[field] += value

        # Add derived metrics
        derived = calculate_derived_metrics(row, currency)
        values.extend(derived.values())

        table += "| " + " | ".join(values) + " |\n"

    # Add totals row if requested
    if calculate_totals and totals:
        table += "\n**Totals:**\n"
        for field, total in totals.items():
            field_label = field.split(".")[-1].replace("_", " ").title()
            formatted_total = format_field(field, total, currency)
            table += f"- {field_label}: {formatted_total}\n"

        # Calculate total ROAS if applicable
        if "metrics.conversions_value" in totals and "metrics.cost_micros" in totals:
            total_conv_value = totals["metrics.conversions_value"]
            total_cost_micros = totals["metrics.cost_micros"]
            if total_cost_micros > 0:
                total_cost = total_cost_micros / 1_000_000
                total_roas = total_conv_value / total_cost
                table += f"- Account ROAS: {total_roas:.2f}x\n"

    return table + "\n"


# ============================================================================
# Special Transformations
# ============================================================================

def transform_account_scale(data: List[Dict]) -> str:
    """
    Special transformation for account scale data.
    Returns summary stats instead of table.
    """
    if not data:
        return "## Account Scale\n\n*No data available*\n"

    total = len(data)
    enabled = sum(1 for row in data if row.get('campaign.status') == 'ENABLED')
    paused = sum(1 for row in data if row.get('campaign.status') == 'PAUSED')
    removed = sum(1 for row in data if row.get('campaign.status') == 'REMOVED')

    # Classification
    if enabled < 20:
        classification = "SMALL"
    elif enabled < 100:
        classification = "MEDIUM"
    else:
        classification = "LARGE"

    return f"""## Account Scale

- **Total campaigns:** {total}
- **Enabled campaigns:** {enabled}
- **Paused campaigns:** {paused}
- **Removed campaigns:** {removed}
- **Account classification:** {classification}

"""


def transform_spend_concentration(data: List[Dict], currency: str = "$") -> str:
    """
    Special transformation for spend concentration with percentage calculation.
    """
    if not data:
        return "## Spend Concentration\n\n*No data available*\n"

    total_spend = sum(row.get('metrics.cost_micros', 0) for row in data)

    table = "## Spend Concentration (Top Campaigns)\n\n"
    table += "| Rank | Campaign | Spend (30d) | % of Total |\n"
    table += "|------|----------|-------------|------------|\n"

    for idx, row in enumerate(data, 1):
        name = row.get('campaign.name', 'Unknown')
        spend_micros = row.get('metrics.cost_micros', 0)
        spend = format_field('metrics.cost_micros', spend_micros, currency)
        pct = (spend_micros / total_spend * 100) if total_spend > 0 else 0

        table += f"| {idx} | {name} | {spend} | {pct:.1f}% |\n"

    total_formatted = format_field('metrics.cost_micros', total_spend, currency)
    table += f"\n**Total spend (top {len(data)}):** {total_formatted}\n\n"

    return table


def transform_budget_constraints(data: List[Dict], currency: str = "$") -> str:
    """
    Special transformation for budget constraints with assessment.
    """
    if not data:
        return "## Budget Constraints\n\n*No data available*\n"

    table = "## Budget Constraints Analysis (Last 7 Days)\n\n"
    table += "| Campaign | Budget/day | Spend (7d) | Util % | Lost IS (Budget) | Lost IS (Rank) | IS | Conv | Assessment |\n"
    table += "|----------|------------|------------|--------|------------------|----------------|----|------|------------|\n"

    for row in data:
        name = row.get('campaign.name', 'Unknown')
        budget_micros = row.get('campaign_budget.amount_micros', 0)
        spend_micros = row.get('metrics.cost_micros', 0)
        lost_is_budget = row.get('metrics.search_budget_lost_impression_share', 0)
        lost_is_rank = row.get('metrics.search_rank_lost_impression_share', 0)
        impression_share = row.get('metrics.search_impression_share', 0)
        conversions = row.get('metrics.conversions', 0)

        # Format fields
        budget = format_field('campaign_budget.amount_micros', budget_micros, currency)
        spend = format_field('metrics.cost_micros', spend_micros, currency)

        # Calculate utilization
        budget_amount = budget_micros / 1_000_000 if budget_micros > 0 else 0
        spend_amount = spend_micros / 1_000_000 if spend_micros > 0 else 0
        utilization = (spend_amount / (budget_amount * 7) * 100) if budget_amount > 0 else 0

        lost_is_budget_fmt = format_field('metrics.search_budget_lost_impression_share', lost_is_budget, currency)
        lost_is_rank_fmt = format_field('metrics.search_rank_lost_impression_share', lost_is_rank, currency)
        impression_share_fmt = format_field('metrics.search_impression_share', impression_share, currency)
        conversions_fmt = f"{conversions:.1f}"

        # Assessment
        if lost_is_budget > 0.5:
            assessment = "🔴 Severely constrained"
        elif lost_is_budget > 0.1:
            assessment = "🟡 Constrained"
        elif utilization < 60:
            assessment = "🟢 Over-budgeted"
        else:
            assessment = "🟢 Optimal"

        table += f"| {name} | {budget} | {spend} | {utilization:.0f}% | {lost_is_budget_fmt} | {lost_is_rank_fmt} | {impression_share_fmt} | {conversions_fmt} | {assessment} |\n"

    return table + "\n"


# ============================================================================
# Main Transformation Logic
# ============================================================================

def transform_file(filepath: Path, currency: str = "$") -> str:
    """
    Transform a single JSON file to markdown based on filename.

    Args:
        filepath: Path to JSON file
        currency: Currency symbol

    Returns:
        Markdown-formatted output
    """
    # Load data
    with open(filepath, 'r') as f:
        data = json.load(f)

    if not data:
        return f"## {filepath.stem}\n\n*No data available*\n\n"

    # Determine transformation based on filename
    filename = filepath.stem.lower()

    # Special transformations
    if "account-scale" in filename or "01-" in filename:
        return transform_account_scale(data)

    if "spend-concentration" in filename or "02-" in filename:
        return transform_spend_concentration(data, currency)

    if "budget-constraint" in filename or "04-" in filename:
        return transform_budget_constraints(data, currency)

    # Generic table transformation
    if "campaign-performance" in filename or "03-" in filename:
        return json_to_markdown_table(
            data,
            title="Campaign Performance Overview (Last 30 Days)",
            currency=currency,
            calculate_totals=True
        )

    if "campaign-setting" in filename or "05-" in filename:
        return json_to_markdown_table(
            data,
            title="Campaign Settings Configuration",
            currency=currency
        )

    if "device-performance" in filename or "06-" in filename:
        return json_to_markdown_table(
            data,
            title="Device Performance Segmentation",
            currency=currency
        )

    if "geographic-performance" in filename or "07-" in filename:
        return json_to_markdown_table(
            data,
            title="Geographic Performance Analysis",
            currency=currency
        )

    if "network-performance" in filename or "08-" in filename:
        return json_to_markdown_table(
            data,
            title="Network Performance Comparison",
            currency=currency
        )

    # Fallback: generic transformation
    return json_to_markdown_table(
        data,
        title=filename.replace("-", " ").replace("_", " ").title(),
        currency=currency
    )


def main():
    """Main transformation function."""
    parser = argparse.ArgumentParser(description="Transform Google Ads JSON to markdown tables")
    parser.add_argument("--currency", default="$", help="Currency symbol (default: $)")
    parser.add_argument("--input-dir", default="./", help="Directory containing JSON files")
    parser.add_argument("--output", default="transformed-analysis-ready.md", help="Output markdown file")

    args = parser.parse_args()

    input_dir = Path(args.input_dir)
    output_file = input_dir / args.output

    # Find all JSON files (numbered or named)
    json_files = sorted(input_dir.glob("*.json"))

    if not json_files:
        print(f"❌ No JSON files found in {input_dir}")
        return

    # Transform all files
    output = "# Google Ads Campaign Audit - Transformed Data\n\n"
    output += f"**Currency:** {args.currency}\n"
    output += f"**Files processed:** {len(json_files)}\n\n"
    output += "---\n\n"

    for json_file in json_files:
        print(f"Transforming {json_file.name}...")
        output += transform_file(json_file, args.currency)
        output += "---\n\n"

    # Write output
    with open(output_file, 'w') as f:
        f.write(output)

    print(f"\n✅ Transformation complete!")
    print(f"📄 Output saved to: {output_file}")
    print(f"\n📊 Summary:")
    print(f"   - Files transformed: {len(json_files)}")
    print(f"   - Output size: {len(output):,} characters")


if __name__ == "__main__":
    main()
