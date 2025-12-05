#!/usr/bin/env python3
"""
Google Ads Ad Group Performance Analysis
Analyzes a Google Ads ad group report CSV with proper data cleaning
"""

import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend
import matplotlib.pyplot as plt
import seaborn as sns

# Set style
sns.set_style('whitegrid')
plt.rcParams['figure.dpi'] = 150

def analyze_google_ads_csv(file_path):
    """Analyze Google Ads ad group report"""

    # Read CSV, skipping header rows
    df = pd.read_csv(file_path, skiprows=2)

    # Remove total rows
    df = df[~df['Ad group status'].str.contains('Total:', na=False)]

    # Clean numeric columns - remove commas and handle '--' values
    numeric_columns = ['Impr.', 'Interactions', 'Avg. cost', 'Cost', 'Clicks',
                      'Conv. value', 'Conversions', 'Avg. CPC']

    for col in numeric_columns:
        if col in df.columns:
            df[col] = (df[col].astype(str)
                       .str.replace(',', '')
                       .str.replace('--', '0')
                       .str.replace(' --', '0')
                       .str.strip())
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

    # Clean percentage columns
    percentage_columns = ['Interaction rate', 'Conv. rate']
    for col in percentage_columns:
        if col in df.columns:
            df[col] = (df[col].astype(str)
                       .str.replace('%', '')
                       .str.replace('--', '0')
                       .str.replace(' --', '0')
                       .str.strip())
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

    # Separate enabled vs paused
    enabled_df = df[df['Ad group status'] == 'Enabled']
    paused_df = df[df['Ad group status'] == 'Paused']

    # Print analysis
    print('=' * 80)
    print('GOOGLE ADS AD GROUP PERFORMANCE ANALYSIS')
    print('Date Range: 1 October 2024 - 30 April 2025')
    print('=' * 80)

    print(f'\n📊 DATASET OVERVIEW')
    print(f'Total Ad Groups: {len(df)}')
    print(f'  • Enabled: {len(enabled_df)} ({len(enabled_df)/len(df)*100:.1f}%)')
    print(f'  • Paused: {len(paused_df)} ({len(paused_df)/len(df)*100:.1f}%)')

    print(f'\n📋 CAMPAIGN DISTRIBUTION')
    campaign_counts = df['Campaign'].value_counts()
    for campaign, count in campaign_counts.items():
        print(f'  • {campaign}: {count} ad groups')

    # Enabled ad groups performance
    print(f'\n' + '=' * 80)
    print('ENABLED AD GROUPS PERFORMANCE')
    print('=' * 80)

    total_cost = enabled_df['Cost'].sum()
    total_clicks = enabled_df['Clicks'].sum()
    total_conversions = enabled_df['Conversions'].sum()
    total_conv_value = enabled_df['Conv. value'].sum()
    total_impr = enabled_df['Impr.'].sum()

    print(f'\n💰 SPEND & VOLUME METRICS')
    print(f'Total Spend: £{total_cost:,.2f}')
    print(f'Total Impressions: {total_impr:,.0f}')
    print(f'Total Clicks: {total_clicks:,.0f}')
    print(f'Total Conversions: {total_conversions:,.2f}')
    print(f'Total Conversion Value: £{total_conv_value:,.2f}')

    print(f'\n📈 EFFICIENCY METRICS')
    if total_clicks > 0:
        avg_cpc = total_cost / total_clicks
        print(f'Average CPC: £{avg_cpc:.2f}')

    if total_conversions > 0:
        cost_per_conv = total_cost / total_conversions
        print(f'Cost per Conversion: £{cost_per_conv:.2f}')

    if total_cost > 0 and total_conv_value > 0:
        roas = total_conv_value / total_cost
        print(f'ROAS: {roas:.2f}x (£{roas:.2f} revenue per £1 spent)')

    if total_impr > 0:
        ctr = (total_clicks / total_impr) * 100
        print(f'CTR: {ctr:.2f}%')

    if total_clicks > 0:
        conv_rate = (total_conversions / total_clicks) * 100
        print(f'Conversion Rate: {conv_rate:.2f}%')

    # Top performers
    print(f'\n🏆 TOP PERFORMING AD GROUPS (by Conversions)')
    top_conv = enabled_df.nlargest(10, 'Conversions')[['Ad group', 'Cost', 'Clicks', 'Conversions', 'Conv. value']]
    for idx, row in top_conv.iterrows():
        if row['Conversions'] > 0:
            local_roas = row['Conv. value'] / row['Cost'] if row['Cost'] > 0 else 0
            print(f"\n  {row['Ad group'][:50]}")
            print(f"    Spend: £{row['Cost']:.2f} | Clicks: {row['Clicks']:.0f} | Conv: {row['Conversions']:.1f} | Value: £{row['Conv. value']:.2f} | ROAS: {local_roas:.2f}x")

    print(f'\n💸 TOP SPENDING AD GROUPS')
    top_spend = enabled_df.nlargest(10, 'Cost')[['Ad group', 'Cost', 'Clicks', 'Conversions', 'Conv. value']]
    for idx, row in top_spend.iterrows():
        if row['Cost'] > 0:
            local_roas = row['Conv. value'] / row['Cost'] if row['Cost'] > 0 else 0
            print(f"\n  {row['Ad group'][:50]}")
            print(f"    Spend: £{row['Cost']:.2f} | Clicks: {row['Clicks']:.0f} | Conv: {row['Conversions']:.1f} | Value: £{row['Conv. value']:.2f} | ROAS: {local_roas:.2f}x")

    # Data quality
    print(f'\n🔍 DATA QUALITY')
    print(f'Enabled ad groups with spend: {len(enabled_df[enabled_df["Cost"] > 0])}')
    print(f'Enabled ad groups with conversions: {len(enabled_df[enabled_df["Conversions"] > 0])}')
    print(f'Enabled ad groups with zero impressions: {len(enabled_df[enabled_df["Impr."] == 0])}')

    # Campaign-level aggregation
    print(f'\n📊 PERFORMANCE BY CAMPAIGN (Enabled Ad Groups)')
    campaign_perf = enabled_df.groupby('Campaign').agg({
        'Cost': 'sum',
        'Clicks': 'sum',
        'Conversions': 'sum',
        'Conv. value': 'sum',
        'Impr.': 'sum'
    })
    campaign_perf['ROAS'] = campaign_perf['Conv. value'] / campaign_perf['Cost']
    campaign_perf['CPC'] = campaign_perf['Cost'] / campaign_perf['Clicks']
    campaign_perf['Cost/Conv'] = campaign_perf['Cost'] / campaign_perf['Conversions']

    for campaign, row in campaign_perf.iterrows():
        print(f"\n  {campaign}")
        print(f"    Spend: £{row['Cost']:.2f} | Clicks: {row['Clicks']:.0f} | Conv: {row['Conversions']:.1f}")
        print(f"    ROAS: {row['ROAS']:.2f}x | CPC: £{row['CPC']:.2f} | Cost/Conv: £{row['Cost/Conv']:.2f}")

    # Create visualizations
    print(f'\n📊 GENERATING VISUALIZATIONS...')

    # 1. Top ad groups by spend (enabled only)
    fig, ax = plt.subplots(figsize=(12, 8))
    top_10_spend = enabled_df.nlargest(15, 'Cost')
    colors = ['#2ecc71' if conv > 0 else '#e74c3c' for conv in top_10_spend['Conversions']]
    ax.barh(range(len(top_10_spend)), top_10_spend['Cost'], color=colors)
    ax.set_yticks(range(len(top_10_spend)))
    ax.set_yticklabels([name[:40] + '...' if len(name) > 40 else name
                        for name in top_10_spend['Ad group']])
    ax.set_xlabel('Cost (£)', fontsize=12)
    ax.set_title('Top 15 Ad Groups by Spend (Enabled Only)\nGreen = Has Conversions | Red = No Conversions',
                 fontsize=14, fontweight='bold')
    ax.grid(True, alpha=0.3, axis='x')
    plt.tight_layout()
    plt.savefig('/Users/mikerhodes/Desktop/ad_groups_by_spend.png', dpi=150, bbox_inches='tight')
    plt.close()
    print('  ✓ ad_groups_by_spend.png')

    # 2. Campaign performance comparison
    fig, axes = plt.subplots(2, 2, figsize=(14, 10))

    # Spend by campaign
    ax = axes[0, 0]
    campaign_perf['Cost'].plot(kind='bar', ax=ax, color='#3498db')
    ax.set_title('Total Spend by Campaign', fontsize=12, fontweight='bold')
    ax.set_xlabel('Campaign')
    ax.set_ylabel('Cost (£)')
    ax.tick_params(axis='x', rotation=45)
    ax.grid(True, alpha=0.3, axis='y')

    # Conversions by campaign
    ax = axes[0, 1]
    campaign_perf['Conversions'].plot(kind='bar', ax=ax, color='#2ecc71')
    ax.set_title('Total Conversions by Campaign', fontsize=12, fontweight='bold')
    ax.set_xlabel('Campaign')
    ax.set_ylabel('Conversions')
    ax.tick_params(axis='x', rotation=45)
    ax.grid(True, alpha=0.3, axis='y')

    # ROAS by campaign
    ax = axes[1, 0]
    campaign_perf['ROAS'].plot(kind='bar', ax=ax, color='#9b59b6')
    ax.set_title('ROAS by Campaign', fontsize=12, fontweight='bold')
    ax.set_xlabel('Campaign')
    ax.set_ylabel('ROAS (x)')
    ax.axhline(y=1.0, color='r', linestyle='--', label='Break-even')
    ax.tick_params(axis='x', rotation=45)
    ax.legend()
    ax.grid(True, alpha=0.3, axis='y')

    # Cost per conversion by campaign
    ax = axes[1, 1]
    campaign_perf['Cost/Conv'].plot(kind='bar', ax=ax, color='#e67e22')
    ax.set_title('Cost per Conversion by Campaign', fontsize=12, fontweight='bold')
    ax.set_xlabel('Campaign')
    ax.set_ylabel('Cost per Conversion (£)')
    ax.tick_params(axis='x', rotation=45)
    ax.grid(True, alpha=0.3, axis='y')

    plt.tight_layout()
    plt.savefig('/Users/mikerhodes/Desktop/campaign_performance.png', dpi=150, bbox_inches='tight')
    plt.close()
    print('  ✓ campaign_performance.png')

    # 3. Enabled vs Paused comparison
    fig, ax = plt.subplots(figsize=(10, 6))
    status_data = [len(enabled_df), len(paused_df)]
    colors = ['#2ecc71', '#95a5a6']
    wedges, texts, autotexts = ax.pie(status_data, labels=['Enabled', 'Paused'],
                                        autopct='%1.1f%%', colors=colors, startangle=90,
                                        textprops={'fontsize': 12, 'fontweight': 'bold'})
    ax.set_title('Ad Group Status Distribution', fontsize=14, fontweight='bold')
    plt.savefig('/Users/mikerhodes/Desktop/status_distribution.png', dpi=150, bbox_inches='tight')
    plt.close()
    print('  ✓ status_distribution.png')

    # 4. Performance scatter: Cost vs Conversions
    fig, ax = plt.subplots(figsize=(12, 8))
    scatter_data = enabled_df[enabled_df['Cost'] > 0]
    scatter = ax.scatter(scatter_data['Cost'], scatter_data['Conversions'],
                        s=scatter_data['Conv. value']*2, alpha=0.6, c=scatter_data['Conv. value'],
                        cmap='viridis', edgecolors='black', linewidth=0.5)

    # Add labels for top performers
    for idx, row in scatter_data.nlargest(5, 'Conversions').iterrows():
        ax.annotate(row['Ad group'][:25],
                   (row['Cost'], row['Conversions']),
                   xytext=(10, 10), textcoords='offset points',
                   fontsize=8, alpha=0.7,
                   bbox=dict(boxstyle='round,pad=0.3', facecolor='yellow', alpha=0.3))

    ax.set_xlabel('Cost (£)', fontsize=12)
    ax.set_ylabel('Conversions', fontsize=12)
    ax.set_title('Ad Group Performance: Cost vs Conversions\n(bubble size = conversion value)',
                fontsize=14, fontweight='bold')
    ax.grid(True, alpha=0.3)
    cbar = plt.colorbar(scatter, ax=ax)
    cbar.set_label('Conversion Value (£)', fontsize=10)
    plt.tight_layout()
    plt.savefig('/Users/mikerhodes/Desktop/cost_vs_conversions.png', dpi=150, bbox_inches='tight')
    plt.close()
    print('  ✓ cost_vs_conversions.png')

    # Summary
    print(f'\n' + '=' * 80)
    print('✅ ANALYSIS COMPLETE')
    print('=' * 80)
    print(f'\nKey Insights:')
    print(f'  • {len(enabled_df)} enabled ad groups driving £{total_cost:,.2f} in spend')
    print(f'  • Overall ROAS: {roas:.2f}x ({"profitable" if roas > 1 else "unprofitable"})')
    print(f'  • Best campaign: {campaign_perf["ROAS"].idxmax()} (ROAS: {campaign_perf["ROAS"].max():.2f}x)')
    print(f'  • {len(enabled_df[enabled_df["Conversions"] == 0])} enabled ad groups with zero conversions')
    print(f'\n📊 Visualizations saved to Desktop:')
    print(f'  • ad_groups_by_spend.png')
    print(f'  • campaign_performance.png')
    print(f'  • status_distribution.png')
    print(f'  • cost_vs_conversions.png')
    print('=' * 80)

if __name__ == "__main__":
    analyze_google_ads_csv('/Users/mikerhodes/Desktop/Ad group report.csv')
