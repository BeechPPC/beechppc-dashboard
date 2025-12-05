#!/usr/bin/env python3
"""
Transform raw Google Ads query results into analysis-ready markdown tables.

Converts:
- Micros to currency (÷ 1,000,000)
- Decimals to percentages (× 100)
- Calculates derived metrics (ROAS, utilization, etc.)
- Formats as markdown tables for LLM analysis
"""

import json
from pathlib import Path
from typing import Dict, List, Any


def load_json(filepath: Path) -> List[Dict]:
    """Load JSON data from file."""
    with open(filepath, 'r') as f:
        return json.load(f)


def micros_to_currency(micros: float, currency: str = "A$") -> str:
    """Convert micros to currency format."""
    if micros == 0:
        return f"{currency}0"
    amount = micros / 1_000_000
    if amount >= 1000:
        return f"{currency}{amount:,.0f}"
    return f"{currency}{amount:,.2f}"


def decimal_to_percent(decimal: float) -> str:
    """Convert decimal to percentage."""
    return f"{decimal * 100:.2f}%"


def format_number(num: float) -> str:
    """Format large numbers with commas."""
    return f"{num:,.0f}"


def calculate_roas(conv_value: float, cost_micros: float) -> float:
    """Calculate ROAS from conversion value and cost."""
    if cost_micros == 0:
        return 0
    cost = cost_micros / 1_000_000
    return conv_value / cost if cost > 0 else 0


def transform_account_scale(data: List[Dict]) -> str:
    """Transform account scale data into summary."""
    total = len(data)
    enabled = sum(1 for row in data if row['campaign.status'] == 'ENABLED')
    paused = sum(1 for row in data if row['campaign.status'] == 'PAUSED')

    return f"""## Account Scale

- **Total campaigns:** {total}
- **Enabled campaigns:** {enabled}
- **Paused campaigns:** {paused}
- **Account classification:** {"SMALL" if enabled < 20 else "MEDIUM" if enabled < 100 else "LARGE"}
"""


def transform_spend_concentration(data: List[Dict], currency: str = "A$") -> str:
    """Transform spend concentration data into markdown table."""

    table = """## Spend Concentration (Top Campaigns)

| Campaign | Spend (30d) | % of Top 5 |
|----------|-------------|------------|
"""

    total_spend = sum(row['metrics.cost_micros'] for row in data)

    for row in data:
        spend = micros_to_currency(row['metrics.cost_micros'], currency)
        pct = (row['metrics.cost_micros'] / total_spend * 100) if total_spend > 0 else 0
        table += f"| {row['campaign.name']} | {spend} | {pct:.1f}% |\n"

    total_spend_formatted = micros_to_currency(total_spend, currency)
    table += f"\n**Total spend (top 5):** {total_spend_formatted}\n"

    return table


def transform_campaign_performance(data: List[Dict], currency: str = "A$") -> str:
    """Transform campaign performance data into markdown table."""

    table = """## Campaign Performance Overview (Last 30 Days)

| Campaign | Type | Status | Budget/day | Bid Strategy | Spend | Impr | Clicks | CTR | Conv | CPA | Conv Value | ROAS |
|----------|------|--------|------------|--------------|-------|------|--------|-----|------|-----|------------|------|
"""

    for row in data:
        name = row['campaign.name']
        camp_type = row['campaign.advertising_channel_type']
        status = row['campaign.status']
        budget = micros_to_currency(row['campaign_budget.amount_micros'], currency)
        bid_strategy = row['campaign.bidding_strategy_type'].replace('_', ' ').title()
        spend = micros_to_currency(row['metrics.cost_micros'], currency)
        impressions = format_number(row['metrics.impressions'])
        clicks = format_number(row['metrics.clicks'])
        ctr = decimal_to_percent(row['metrics.ctr'])
        conversions = f"{row['metrics.conversions']:.1f}"
        cpa = micros_to_currency(row['metrics.cost_per_conversion'], currency)
        conv_value = f"{currency}{row['metrics.conversions_value']:,.2f}"
        roas = calculate_roas(row['metrics.conversions_value'], row['metrics.cost_micros'])

        table += f"| {name} | {camp_type} | {status} | {budget} | {bid_strategy} | {spend} | {impressions} | {clicks} | {ctr} | {conversions} | {cpa} | {conv_value} | {roas:.2f}x |\n"

    # Add totals
    total_spend = sum(row['metrics.cost_micros'] for row in data)
    total_conversions = sum(row['metrics.conversions'] for row in data)
    total_conv_value = sum(row['metrics.conversions_value'] for row in data)
    total_roas = calculate_roas(total_conv_value, total_spend)

    table += f"\n**Totals:**\n"
    table += f"- Total spend: {micros_to_currency(total_spend, currency)}\n"
    table += f"- Total conversions: {total_conversions:,.1f}\n"
    table += f"- Total conversion value: {currency}{total_conv_value:,.2f}\n"
    table += f"- Account ROAS: {total_roas:.2f}x\n"

    return table


def transform_budget_constraints(data: List[Dict], currency: str = "A$") -> str:
    """Transform budget constraints data into markdown table."""

    table = """## Budget Constraints Analysis (Last 7 Days)

| Campaign | Daily Budget | Spend (7d) | Utilization | Lost IS (Budget) | Lost IS (Rank) | IS | Conv | Assessment |
|----------|--------------|------------|-------------|------------------|----------------|----|------|------------|
"""

    for row in data:
        name = row['campaign.name']
        budget = micros_to_currency(row['campaign_budget.amount_micros'], currency)
        spend_7d = micros_to_currency(row['metrics.cost_micros'], currency)

        # Calculate utilization
        budget_amount = row['campaign_budget.amount_micros'] / 1_000_000
        spend_amount = row['metrics.cost_micros'] / 1_000_000
        utilization = (spend_amount / (budget_amount * 7) * 100) if budget_amount > 0 else 0

        lost_is_budget = decimal_to_percent(row['metrics.search_budget_lost_impression_share'])
        lost_is_rank = decimal_to_percent(row['metrics.search_rank_lost_impression_share'])
        impression_share = decimal_to_percent(row['metrics.search_impression_share'])
        conversions = f"{row['metrics.conversions']:.1f}"

        # Determine assessment
        budget_lost = row['metrics.search_budget_lost_impression_share']
        if budget_lost > 0.5:
            assessment = "🔴 Severely constrained"
        elif budget_lost > 0.2:
            assessment = "🟡 Constrained"
        elif utilization < 60:
            assessment = "🟢 Over-budgeted"
        else:
            assessment = "🟢 Optimal"

        table += f"| {name} | {budget} | {spend_7d} | {utilization:.0f}% | {lost_is_budget} | {lost_is_rank} | {impression_share} | {conversions} | {assessment} |\n"

    return table


def transform_campaign_settings(data: List[Dict], currency: str = "A$") -> str:
    """Transform campaign settings data into markdown table."""

    table = """## Campaign Settings Configuration

| Campaign | Status | Type | Bid Strategy | Target | Budget/day | Location | Networks |
|----------|--------|------|--------------|--------|------------|----------|----------|
"""

    for row in data:
        name = row['campaign.name']
        status = row['campaign.status']
        camp_type = row['campaign.advertising_channel_type']
        bid_strategy = row['campaign.bidding_strategy_type'].replace('_', ' ').title()

        # Get target (CPA or ROAS)
        target_cpa = row.get('campaign.target_cpa.target_cpa_micros', 0)
        target_roas = row.get('campaign.target_roas.target_roas', 0)
        if target_cpa > 0:
            target = f"CPA: {micros_to_currency(target_cpa, currency)}"
        elif target_roas > 0:
            target = f"ROAS: {target_roas:.2f}x"
        else:
            target = "None"

        budget = micros_to_currency(row['campaign_budget.amount_micros'], currency)

        # Location setting
        location_type = row.get('campaign.geo_target_type_setting.positive_geo_target_type', 'UNKNOWN')
        location = "In location" if "LOCATION_OF_PRESENCE" in location_type else "Interested in location"

        # Network settings
        networks = []
        if row.get('campaign.network_settings.target_google_search', False):
            networks.append("Google Search")
        if row.get('campaign.network_settings.target_search_network', False):
            networks.append("Search Partners")
        if row.get('campaign.network_settings.target_content_network', False):
            networks.append("Display")
        network_str = ", ".join(networks) if networks else "None"

        table += f"| {name} | {status} | {camp_type} | {bid_strategy} | {target} | {budget} | {location} | {network_str} |\n"

    return table


def transform_device_performance(data: List[Dict], currency: str = "A$") -> str:
    """Transform device performance data into markdown table."""

    table = """## Device Performance Segmentation (Last 30 Days)

| Campaign | Device | Impressions | Clicks | CTR | Spend | Conv | CPA |
|----------|--------|-------------|--------|-----|-------|------|-----|
"""

    for row in data:
        name = row['campaign.name']
        device = row['segments.device']
        impressions = format_number(row['metrics.impressions'])
        clicks = format_number(row['metrics.clicks'])
        ctr = decimal_to_percent(row['metrics.ctr'])
        spend = micros_to_currency(row['metrics.cost_micros'], currency)
        conversions = f"{row['metrics.conversions']:.1f}"
        cpa = micros_to_currency(row['metrics.cost_per_conversion'], currency)

        table += f"| {name} | {device} | {impressions} | {clicks} | {ctr} | {spend} | {conversions} | {cpa} |\n"

    return table


def transform_geographic_performance(data: List[Dict], currency: str = "A$") -> str:
    """Transform geographic performance data into markdown table."""

    table = """## Geographic Performance Analysis (Last 30 Days)

| Campaign | Location ID | Location Type | Impressions | Clicks | Spend | Conv | CPA |
|----------|-------------|---------------|-------------|--------|-------|------|-----|
"""

    for row in data:
        name = row['campaign.name']
        location_id = row['geographic_view.country_criterion_id']
        location_type = row['geographic_view.location_type']
        impressions = format_number(row['metrics.impressions'])
        clicks = format_number(row['metrics.clicks'])
        spend = micros_to_currency(row['metrics.cost_micros'], currency)
        conversions = f"{row['metrics.conversions']:.1f}"
        cpa = micros_to_currency(row['metrics.cost_per_conversion'], currency)

        table += f"| {name} | {location_id} | {location_type} | {impressions} | {clicks} | {spend} | {conversions} | {cpa} |\n"

    return table


def transform_network_performance(data: List[Dict], currency: str = "A$") -> str:
    """Transform network performance data into markdown table."""

    table = """## Network Performance Comparison (Last 30 Days)

| Campaign | Network | Impressions | Clicks | CTR | Spend | Conv | CPA |
|----------|---------|-------------|--------|-----|-------|------|-----|
"""

    for row in data:
        name = row['campaign.name']
        network = row['segments.ad_network_type']
        impressions = format_number(row['metrics.impressions'])
        clicks = format_number(row['metrics.clicks'])
        ctr = decimal_to_percent(row['metrics.ctr'])
        spend = micros_to_currency(row['metrics.cost_micros'], currency)
        conversions = f"{row['metrics.conversions']:.1f}"
        cpa = micros_to_currency(row['metrics.cost_per_conversion'], currency)

        table += f"| {name} | {network} | {impressions} | {clicks} | {ctr} | {spend} | {conversions} | {cpa} |\n"

    return table


def transform_ad_group_structure(data: List[Dict], currency: str = "A$") -> str:
    """Transform ad group structure data into markdown table."""

    table = """## Ad Group Structure Analysis (Last 30 Days)

| Campaign | Ad Group | Status | Spend | Conv |
|----------|----------|--------|-------|------|
"""

    # Group by campaign
    campaign_groups = {}
    for row in data:
        camp_name = row['campaign.name']
        if camp_name not in campaign_groups:
            campaign_groups[camp_name] = []
        campaign_groups[camp_name].append(row)

    for camp_name, ad_groups in sorted(campaign_groups.items()):
        for row in ad_groups:
            ag_name = row['ad_group.name']
            status = row['ad_group.status']
            spend = micros_to_currency(row['metrics.cost_micros'], currency)
            conversions = f"{row['metrics.conversions']:.1f}"

            table += f"| {camp_name} | {ag_name} | {status} | {spend} | {conversions} |\n"

        # Add campaign summary
        total_spend = sum(ag['metrics.cost_micros'] for ag in ad_groups)
        total_conv = sum(ag['metrics.conversions'] for ag in ad_groups)
        table += f"| **{camp_name} Total** | *{len(ad_groups)} ad groups* | | **{micros_to_currency(total_spend, currency)}** | **{total_conv:.1f}** |\n"

    return table


def transform_day_of_week_performance(data: List[Dict], currency: str = "A$") -> str:
    """Transform day-of-week performance data into markdown table."""

    table = """## Day-of-Week Performance Patterns (Last 30 Days)

| Campaign | Day | Impressions | Clicks | Spend | Conv | CPA |
|----------|-----|-------------|--------|-------|------|-----|
"""

    for row in data:
        name = row['campaign.name']
        day = row['segments.day_of_week']
        impressions = format_number(row['metrics.impressions'])
        clicks = format_number(row['metrics.clicks'])
        spend = micros_to_currency(row['metrics.cost_micros'], currency)
        conversions = f"{row['metrics.conversions']:.1f}"
        cpa = micros_to_currency(row['metrics.cost_per_conversion'], currency)

        table += f"| {name} | {day} | {impressions} | {clicks} | {spend} | {conversions} | {cpa} |\n"

    return table


def transform_hour_of_day_performance(data: List[Dict], currency: str = "A$") -> str:
    """Transform hour-of-day performance data into markdown table."""

    table = """## Hour-of-Day Performance Patterns (Last 30 Days)

| Campaign | Hour | Impressions | Clicks | Spend | Conv |
|----------|------|-------------|--------|-------|------|
"""

    for row in data:
        name = row['campaign.name']
        hour = row['segments.hour']
        impressions = format_number(row['metrics.impressions'])
        clicks = format_number(row['metrics.clicks'])
        spend = micros_to_currency(row['metrics.cost_micros'], currency)
        conversions = f"{row['metrics.conversions']:.1f}"

        table += f"| {name} | {hour:02d}:00 | {impressions} | {clicks} | {spend} | {conversions} |\n"

    return table


def main():
    """Main transformation function."""

    # Set paths
    data_dir = Path(__file__).parent
    output_file = data_dir / "transformed-analysis-ready.md"

    # Load all data files
    print("Loading data files...")
    account_scale = load_json(data_dir / "01-account-scale.json")
    spend_concentration = load_json(data_dir / "02-spend-concentration.json")
    campaign_performance = load_json(data_dir / "03-campaign-performance.json")
    budget_constraints = load_json(data_dir / "04-budget-constraints.json")
    campaign_settings = load_json(data_dir / "05-campaign-settings.json")
    device_performance = load_json(data_dir / "06-device-performance.json")
    geographic_performance = load_json(data_dir / "07-geographic-performance.json")
    network_performance = load_json(data_dir / "08-network-performance.json")
    ad_group_structure = load_json(data_dir / "09-ad-group-structure.json")
    day_of_week_performance = load_json(data_dir / "10-day-of-week-performance.json")
    hour_of_day_performance = load_json(data_dir / "11-hour-of-day-performance.json")

    # Determine currency from account (TODO: make this dynamic)
    currency = "A$"

    # Transform data
    print("Transforming data to analysis-ready markdown...")
    output = "# Google Ads Campaign Audit - Transformed Data\n\n"
    output += "**Period:** Last 30 days (7 days for budget analysis)\n"
    output += "**Currency:** AUD\n\n"
    output += "---\n\n"

    output += transform_account_scale(account_scale)
    output += "\n---\n\n"

    output += transform_spend_concentration(spend_concentration, currency)
    output += "\n---\n\n"

    output += transform_campaign_performance(campaign_performance, currency)
    output += "\n---\n\n"

    output += transform_budget_constraints(budget_constraints, currency)
    output += "\n---\n\n"

    output += transform_campaign_settings(campaign_settings, currency)
    output += "\n---\n\n"

    output += transform_device_performance(device_performance, currency)
    output += "\n---\n\n"

    output += transform_geographic_performance(geographic_performance, currency)
    output += "\n---\n\n"

    output += transform_network_performance(network_performance, currency)
    output += "\n---\n\n"

    output += transform_ad_group_structure(ad_group_structure, currency)
    output += "\n---\n\n"

    output += transform_day_of_week_performance(day_of_week_performance, currency)
    output += "\n---\n\n"

    output += transform_hour_of_day_performance(hour_of_day_performance, currency)

    # Write output
    with open(output_file, 'w') as f:
        f.write(output)

    print(f"\n✅ Transformation complete!")
    print(f"📄 Output saved to: {output_file}")
    print(f"\n📊 Summary:")
    print(f"   - Account scale: {len(account_scale)} campaigns")
    print(f"   - Campaign performance: {len(campaign_performance)} campaigns")
    print(f"   - Budget constraints: {len(budget_constraints)} campaigns")
    print(f"   - Campaign settings: {len(campaign_settings)} campaigns")
    print(f"   - Device segments: {len(device_performance)} rows")
    print(f"   - Geographic segments: {len(geographic_performance)} rows")
    print(f"   - Network segments: {len(network_performance)} rows")
    print(f"   - Ad groups: {len(ad_group_structure)} ad groups")
    print(f"   - Day-of-week data: {len(day_of_week_performance)} rows")
    print(f"   - Hour-of-day data: {len(hour_of_day_performance)} rows")


if __name__ == "__main__":
    main()
