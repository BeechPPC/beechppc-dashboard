#!/usr/bin/env python3
"""
Google Ads Account Audit v1.1

Comprehensive audit with period comparison, forecasting, brand filtering,
and conversion tracking health.
"""

import argparse
import json
import subprocess
import sys
from datetime import datetime, timedelta
from pathlib import Path
from calendar import monthrange

import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
import numpy as np
from zoneinfo import ZoneInfo
from scipy.interpolate import make_interp_spline

# Paths
REPO_ROOT = Path(__file__).parent.parent.parent.parent.parent
ACCOUNTS_FILE = REPO_ROOT / '.claude' / 'accounts.json'
QUERY_SCRIPT = REPO_ROOT / '.claude' / 'skills' / 'google-ads' / 'scripts' / 'query.js'
DATA_BASE = REPO_ROOT / 'data' / 'google-ads'

# Audit queries
AUDIT_QUERIES = {
    'campaigns': {'file': 'campaigns-performance.gaql', 'needs_date': True},
    'campaigns-prev': {'file': 'campaigns-performance.gaql', 'needs_date': True, 'previous': True},
    'keywords': {'file': 'keywords-by-cost.gaql', 'needs_date': True},
    'keywords-7d': {'file': 'keywords-by-cost.gaql', 'needs_date': True, 'days': 7},
    'search-terms': {'file': 'search-terms.gaql', 'needs_date': True},
    'search-terms-7d': {'file': 'search-terms.gaql', 'needs_date': True, 'days': 7},
    'daily-conv': {'file': 'daily-conversions.gaql', 'needs_date': True},
    'daily-conv-91d': {'file': 'daily-conversions.gaql', 'needs_date': True, 'days': 91},  # For forecasting
    'conv-actions-daily': {'file': 'conversion-actions-daily.gaql', 'needs_date': True},
    'assets': {'file': 'asset-performance.gaql', 'needs_date': True},
    'budgets': {'file': 'campaign-budgets-and-targets.gaql', 'needs_date': False},
    'devices': {'file': 'device-performance.gaql', 'needs_date': True},
    'products': {'file': 'shopping-products.gaql', 'needs_date': True},
    'products-prev': {'file': 'shopping-products.gaql', 'needs_date': True, 'previous': True},
}


def load_accounts():
    with open(ACCOUNTS_FILE) as f:
        return json.load(f)


def resolve_account(account_input, accounts):
    account_input_lower = account_input.lower()
    for key, config in accounts.items():
        if key.lower() == account_input_lower:
            return key, config
        if config.get('name', '').lower() == account_input_lower:
            return key, config
        for alias in config.get('aliases', []):
            if alias.lower() == account_input_lower:
                return key, config
    return None, None


def find_account_folder(account_input, account_config, base_path):
    """
    Find existing account folder or determine folder name.

    Checks for folders matching:
    1. The exact account_input (case-insensitive)
    2. Any alias from account_config
    3. The account key

    Returns the folder name to use.
    """
    # Build list of possible folder names (all lowercase, spaces to dashes)
    possible_names = set()
    possible_names.add(account_input.lower().replace(' ', '-'))

    if account_config:
        for alias in account_config.get('aliases', []):
            possible_names.add(alias.lower().replace(' ', '-'))

    # Check for existing folder matching any possible name
    if base_path.exists():
        for folder in base_path.iterdir():
            if folder.is_dir() and folder.name != 'audits':
                folder_lower = folder.name.lower()
                if folder_lower in possible_names:
                    return folder.name

    # No match found - use the input as folder name (normalized)
    return account_input.lower().replace(' ', '-')


def load_gaql(query_name):
    base_name = AUDIT_QUERIES[query_name]['file']
    gaql_path = REPO_ROOT / '.claude' / 'skills' / 'google-ads' / 'references' / base_name
    with open(gaql_path) as f:
        return f.read().strip()


def get_date_range(days, timezone, previous=False):
    """Get date range ending yesterday in account timezone."""
    tz = ZoneInfo(timezone)
    now = datetime.now(tz)
    end_date = (now - timedelta(days=1)).date()  # Yesterday

    if previous:
        # Previous period ends day before current period starts
        start_date = end_date - timedelta(days=days-1)
        end_date = start_date - timedelta(days=1)
        start_date = end_date - timedelta(days=days-1)
    else:
        start_date = end_date - timedelta(days=days-1)

    return start_date.strftime('%Y-%m-%d'), end_date.strftime('%Y-%m-%d')


def run_query(query_name, account_config, days, output_path):
    gaql = load_gaql(query_name)
    config = AUDIT_QUERIES[query_name]
    timezone = account_config.get('timezone', 'Australia/Sydney')

    # Determine date range
    query_days = config.get('days', days)
    is_previous = config.get('previous', False)

    if config['needs_date']:
        start_date, end_date = get_date_range(query_days, timezone, is_previous)
        date_range = f"BETWEEN '{start_date}' AND '{end_date}'"
        gaql = gaql.replace('{DATE_RANGE}', date_range)

    cmd = [
        'node', str(QUERY_SCRIPT),
        f'--customer-id={account_config["id"]}',
        f'--login-customer-id={account_config.get("login_customer_id", account_config["id"])}',
        f'--query={gaql}',
        f'--output={output_path}'
    ]

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        return result.returncode == 0
    except Exception as e:
        print(f"  Exception: {e}")
        return False


def filter_zero_impressions(df):
    if 'metrics.impressions' in df.columns:
        return df[df['metrics.impressions'] > 0]
    return df


def is_brand(text, brand_strings):
    """Check if text contains any brand string."""
    if not brand_strings or not text:
        return False
    text_lower = str(text).lower()
    return any(brand.lower() in text_lower for brand in brand_strings)


def calculate_advanced_forecast(df_91d, forecast_days=30):
    """
    Calculate advanced forecast using:
    1. Day-of-week seasonality (13 weeks of data)
    2. Linear trend detection
    3. Exponential weighted moving average for recency
    """
    from scipy import stats

    df = df_91d.copy()
    df['date'] = pd.to_datetime(df['segments.date'])
    df = df.sort_values('date')
    df['cost'] = df['metrics.cost_micros'] / 1_000_000
    df['conversions'] = df['metrics.conversions']
    df['value'] = df['metrics.conversions_value']
    df['weekday'] = df['date'].dt.dayofweek  # 0=Monday, 6=Sunday

    # 1. Day-of-week seasonality - average by weekday
    weekday_avg_cost = df.groupby('weekday')['cost'].mean().to_dict()
    weekday_avg_conv = df.groupby('weekday')['conversions'].mean().to_dict()
    weekday_avg_value = df.groupby('weekday')['value'].mean().to_dict()

    # 2. Linear trend detection
    x = np.arange(len(df))
    slope_cost, intercept_cost, _, _, _ = stats.linregress(x, df['cost'])
    slope_conv, intercept_conv, _, _, _ = stats.linregress(x, df['conversions'])
    slope_value, intercept_value, _, _, _ = stats.linregress(x, df['value'])

    # Calculate trend multiplier (how much the trend changes per day relative to mean)
    mean_cost = df['cost'].mean()
    trend_multiplier_cost = 1 + (slope_cost / mean_cost) if mean_cost > 0 else 1
    mean_conv = df['conversions'].mean()
    trend_multiplier_conv = 1 + (slope_conv / mean_conv) if mean_conv > 0 else 1
    mean_value = df['value'].mean()
    trend_multiplier_value = 1 + (slope_value / mean_value) if mean_value > 0 else 1

    # 3. Recency weighting using EWMA
    # Calculate recent adjustment factor (last 7 days vs overall average)
    ewma_span = 7
    ewma_cost = df['cost'].ewm(span=ewma_span).mean().iloc[-1]
    ewma_conv = df['conversions'].ewm(span=ewma_span).mean().iloc[-1]
    ewma_value = df['value'].ewm(span=ewma_span).mean().iloc[-1]

    recency_factor_cost = ewma_cost / mean_cost if mean_cost > 0 else 1
    recency_factor_conv = ewma_conv / mean_conv if mean_conv > 0 else 1
    recency_factor_value = ewma_value / mean_value if mean_value > 0 else 1

    # Blend recency with decay (strong for near-term, fades for long-term)
    # Generate forecasts for next N days
    last_date = df['date'].max()
    forecasts = []

    for i in range(1, forecast_days + 1):
        forecast_date = last_date + timedelta(days=i)
        weekday = forecast_date.dayofweek

        # Recency decay - strong influence for first week, fading after
        recency_decay = 0.9 ** (i / 7)  # Halves roughly every 2 weeks

        # Blend weekday average with recency and trend
        base_cost = weekday_avg_cost.get(weekday, mean_cost)
        base_conv = weekday_avg_conv.get(weekday, mean_conv)
        base_value = weekday_avg_value.get(weekday, mean_value)

        # Apply recency factor with decay
        adjusted_recency_cost = 1 + (recency_factor_cost - 1) * recency_decay
        adjusted_recency_conv = 1 + (recency_factor_conv - 1) * recency_decay
        adjusted_recency_value = 1 + (recency_factor_value - 1) * recency_decay

        # Apply trend (cumulative from end of historical data)
        trend_adj_cost = trend_multiplier_cost ** i
        trend_adj_conv = trend_multiplier_conv ** i
        trend_adj_value = trend_multiplier_value ** i

        # Final forecast
        forecast_cost = base_cost * adjusted_recency_cost * trend_adj_cost
        forecast_conv = base_conv * adjusted_recency_conv * trend_adj_conv
        forecast_value = base_value * adjusted_recency_value * trend_adj_value

        forecasts.append({
            'date': forecast_date,
            'cost': forecast_cost,
            'conversions': forecast_conv,
            'value': forecast_value,
            'weekday': weekday
        })

    forecast_df = pd.DataFrame(forecasts)

    return {
        'forecast_df': forecast_df,
        'weekday_avg_cost': weekday_avg_cost,
        'trend_multiplier_cost': trend_multiplier_cost,
        'recency_factor_cost': recency_factor_cost,
        'total_forecast_cost': forecast_df['cost'].sum(),
        'total_forecast_conv': forecast_df['conversions'].sum(),
        'total_forecast_value': forecast_df['value'].sum(),
    }


def calculate_insights(audit_dir, account_config, days):
    insights = {}
    currency = account_config.get('currency', 'AUD')
    cs = {'AUD': 'A$', 'USD': '$', 'GBP': '£'}.get(currency, '$')
    insights['currency_symbol'] = cs
    brand_strings = account_config.get('brand_strings', [])

    # Get date ranges for display
    timezone = account_config.get('timezone', 'Australia/Sydney')
    start_date, end_date = get_date_range(days, timezone)
    prev_start, prev_end = get_date_range(days, timezone, previous=True)
    insights['current_period'] = f"{start_date} to {end_date}"
    insights['previous_period'] = f"{prev_start} to {prev_end}"

    # Current period totals
    try:
        df = pd.read_csv(audit_dir / 'data' / 'campaigns.csv')
        insights['total_cost'] = df['metrics.cost_micros'].sum() / 1_000_000
        insights['total_conversions'] = df['metrics.conversions'].sum()
        insights['total_value'] = df['metrics.conversions_value'].sum()
        insights['roas'] = insights['total_value'] / insights['total_cost'] if insights['total_cost'] > 0 else 0
        insights['total_clicks'] = df['metrics.clicks'].sum()
        insights['total_impressions'] = df['metrics.impressions'].sum()
        insights['ctr'] = (insights['total_clicks'] / insights['total_impressions'] * 100) if insights['total_impressions'] > 0 else 0
        insights['avg_cpc'] = insights['total_cost'] / insights['total_clicks'] if insights['total_clicks'] > 0 else 0
        insights['conv_rate'] = (insights['total_conversions'] / insights['total_clicks'] * 100) if insights['total_clicks'] > 0 else 0
        insights['cpa'] = insights['total_cost'] / insights['total_conversions'] if insights['total_conversions'] > 0 else 0
        insights['campaign_count'] = len(df[df['metrics.impressions'] > 0])
    except:
        pass

    # Previous period comparison
    try:
        df_prev = pd.read_csv(audit_dir / 'data' / 'campaigns-prev.csv')
        insights['prev_cost'] = df_prev['metrics.cost_micros'].sum() / 1_000_000
        insights['prev_conversions'] = df_prev['metrics.conversions'].sum()
        insights['prev_value'] = df_prev['metrics.conversions_value'].sum()
        insights['prev_roas'] = insights['prev_value'] / insights['prev_cost'] if insights['prev_cost'] > 0 else 0
        insights['prev_clicks'] = df_prev['metrics.clicks'].sum()
        insights['prev_impressions'] = df_prev['metrics.impressions'].sum()
        insights['prev_ctr'] = (insights['prev_clicks'] / insights['prev_impressions'] * 100) if insights['prev_impressions'] > 0 else 0
        insights['prev_cpa'] = insights['prev_cost'] / insights['prev_conversions'] if insights['prev_conversions'] > 0 else 0

        # Calculate deltas
        def calc_delta(current, previous):
            if previous > 0:
                return ((current - previous) / previous) * 100
            return None

        insights['cost_delta'] = calc_delta(insights['total_cost'], insights['prev_cost'])
        insights['conv_delta'] = calc_delta(insights['total_conversions'], insights['prev_conversions'])
        insights['value_delta'] = calc_delta(insights['total_value'], insights['prev_value'])
        insights['roas_delta'] = calc_delta(insights['roas'], insights['prev_roas'])
        insights['clicks_delta'] = calc_delta(insights['total_clicks'], insights['prev_clicks'])
        insights['impressions_delta'] = calc_delta(insights['total_impressions'], insights['prev_impressions'])
        insights['ctr_delta'] = calc_delta(insights['ctr'], insights['prev_ctr'])
        insights['cpa_delta'] = calc_delta(insights['cpa'], insights['prev_cpa'])
    except:
        pass

    # Advanced Forecasting using 91-day data
    try:
        df_91d = pd.read_csv(audit_dir / 'data' / 'daily-conv-91d.csv')
        forecast_result = calculate_advanced_forecast(df_91d, forecast_days=30)

        insights['forecast_30d_cost'] = forecast_result['total_forecast_cost']
        insights['forecast_30d_conv'] = forecast_result['total_forecast_conv']
        insights['forecast_30d_value'] = forecast_result['total_forecast_value']
        insights['forecast_df'] = forecast_result['forecast_df']
        insights['trend_multiplier'] = forecast_result['trend_multiplier_cost']
        insights['recency_factor'] = forecast_result['recency_factor_cost']

        tz = ZoneInfo(account_config.get('timezone', 'Australia/Sydney'))
        today = datetime.now(tz)
        days_in_month = monthrange(today.year, today.month)[1]
        days_remaining = days_in_month - today.day

        # Calculate month-end forecast using only remaining days
        month_forecast = forecast_result['forecast_df'].head(days_remaining)
        insights['forecast_month_cost'] = month_forecast['cost'].sum()
        insights['forecast_month_conv'] = month_forecast['conversions'].sum()
        insights['forecast_month_value'] = month_forecast['value'].sum()
        insights['days_remaining'] = days_remaining

        # Keep simple averages for display
        insights['daily_avg_cost'] = insights['total_cost'] / days
        insights['daily_avg_conv'] = insights['total_conversions'] / days
    except Exception as e:
        # Fallback to simple forecast
        try:
            daily_avg_cost = insights['total_cost'] / days
            daily_avg_conv = insights['total_conversions'] / days
            daily_avg_value = insights['total_value'] / days

            insights['forecast_30d_cost'] = daily_avg_cost * 30
            insights['forecast_30d_conv'] = daily_avg_conv * 30
            insights['forecast_30d_value'] = daily_avg_value * 30

            tz = ZoneInfo(account_config.get('timezone', 'Australia/Sydney'))
            today = datetime.now(tz)
            days_in_month = monthrange(today.year, today.month)[1]
            days_remaining = days_in_month - today.day

            insights['forecast_month_cost'] = daily_avg_cost * days_remaining
            insights['forecast_month_conv'] = daily_avg_conv * days_remaining
            insights['forecast_month_value'] = daily_avg_value * days_remaining
            insights['days_remaining'] = days_remaining
            insights['daily_avg_cost'] = daily_avg_cost
            insights['daily_avg_conv'] = daily_avg_conv
        except:
            pass

    # Highest CPC keywords with campaign info
    try:
        df_kw = pd.read_csv(audit_dir / 'data' / 'keywords.csv')
        df_kw['cpc'] = df_kw['metrics.cost_micros'] / df_kw['metrics.clicks'] / 1_000_000
        df_kw = df_kw[df_kw['metrics.clicks'] > 0]
        if len(df_kw) > 0:
            top_cpc = df_kw.nlargest(1, 'cpc').iloc[0]
            insights['highest_cpc_kw_30d'] = top_cpc['ad_group_criterion.keyword.text']
            insights['highest_cpc_kw_30d_value'] = top_cpc['cpc']
            insights['highest_cpc_kw_30d_campaign'] = top_cpc.get('campaign.name', 'N/A')

        df_kw7 = pd.read_csv(audit_dir / 'data' / 'keywords-7d.csv')
        df_kw7['cpc'] = df_kw7['metrics.cost_micros'] / df_kw7['metrics.clicks'] / 1_000_000
        df_kw7 = df_kw7[df_kw7['metrics.clicks'] > 0]
        if len(df_kw7) > 0:
            top_cpc7 = df_kw7.nlargest(1, 'cpc').iloc[0]
            insights['highest_cpc_kw_7d'] = top_cpc7['ad_group_criterion.keyword.text']
            insights['highest_cpc_kw_7d_value'] = top_cpc7['cpc']
            insights['highest_cpc_kw_7d_campaign'] = top_cpc7.get('campaign.name', 'N/A')
    except:
        pass

    # Highest CPC search terms with campaign info
    try:
        df_st = pd.read_csv(audit_dir / 'data' / 'search-terms.csv')
        df_st['cpc'] = df_st['metrics.cost_micros'] / df_st['metrics.clicks'] / 1_000_000
        df_st = df_st[df_st['metrics.clicks'] > 0]
        if len(df_st) > 0:
            top_st = df_st.nlargest(1, 'cpc').iloc[0]
            insights['highest_cpc_st_30d'] = top_st['search_term_view.search_term']
            insights['highest_cpc_st_30d_value'] = top_st['cpc']
            insights['highest_cpc_st_30d_campaign'] = top_st.get('campaign.name', 'N/A')

        df_st7 = pd.read_csv(audit_dir / 'data' / 'search-terms-7d.csv')
        df_st7['cpc'] = df_st7['metrics.cost_micros'] / df_st7['metrics.clicks'] / 1_000_000
        df_st7 = df_st7[df_st7['metrics.clicks'] > 0]
        if len(df_st7) > 0:
            top_st7 = df_st7.nlargest(1, 'cpc').iloc[0]
            insights['highest_cpc_st_7d'] = top_st7['search_term_view.search_term']
            insights['highest_cpc_st_7d_value'] = top_st7['cpc']
            insights['highest_cpc_st_7d_campaign'] = top_st7.get('campaign.name', 'N/A')
    except:
        pass

    # Top 5 zero conversion search terms
    try:
        df_st = pd.read_csv(audit_dir / 'data' / 'search-terms.csv')
        zero_conv = df_st[(df_st['metrics.conversions'] == 0) & (df_st['metrics.cost_micros'] > 0)]
        insights['zero_conv_terms'] = len(zero_conv)
        insights['zero_conv_cost'] = zero_conv['metrics.cost_micros'].sum() / 1_000_000
        insights['zero_conv_pct'] = (insights['zero_conv_cost'] / insights['total_cost'] * 100) if insights.get('total_cost', 0) > 0 else 0

        # Top 5 by cost
        top5_zero = zero_conv.nlargest(5, 'metrics.cost_micros')
        insights['top5_zero_conv'] = []
        for _, row in top5_zero.iterrows():
            insights['top5_zero_conv'].append({
                'term': row['search_term_view.search_term'],
                'cost': row['metrics.cost_micros'] / 1_000_000,
                'clicks': row['metrics.clicks'],
                'campaign': row.get('campaign.name', 'N/A')
            })
    except:
        pass

    # Conversion actions count
    try:
        df_ca = pd.read_csv(audit_dir / 'data' / 'conv-actions-daily.csv')
        insights['conv_action_count'] = df_ca['segments.conversion_action_name'].nunique()
    except:
        pass

    # Asset performance (enum values: 2=GOOD, 3=BEST, 4=EXCELLENT, 5=UNSPECIFIED, 6=LOW)
    try:
        df_assets = pd.read_csv(audit_dir / 'data' / 'assets.csv')
        if 'ad_group_ad_asset_view.performance_label' in df_assets.columns:
            insights['assets_best'] = len(df_assets[df_assets['ad_group_ad_asset_view.performance_label'].isin([3.0, 4.0])])
            insights['assets_good'] = len(df_assets[df_assets['ad_group_ad_asset_view.performance_label'] == 2.0])
            insights['assets_low'] = len(df_assets[df_assets['ad_group_ad_asset_view.performance_label'] == 6.0])

            # Get actual LOW performing assets with text
            low_assets = df_assets[df_assets['ad_group_ad_asset_view.performance_label'] == 6.0]
            insights['low_assets_list'] = []
            for _, row in low_assets.head(10).iterrows():
                asset_text = row.get('asset.text_asset.text', '')
                if asset_text and str(asset_text) != 'nan':
                    insights['low_assets_list'].append({
                        'text': str(asset_text)[:60],
                        'campaign': str(row.get('campaign.name', 'N/A'))[:30],
                        'ad_group': str(row.get('ad_group.name', 'N/A'))[:30]
                    })

            # Get actual BEST performing assets with text
            best_assets = df_assets[df_assets['ad_group_ad_asset_view.performance_label'].isin([3.0, 4.0])]
            insights['best_assets_list'] = []
            for _, row in best_assets.head(10).iterrows():
                asset_text = row.get('asset.text_asset.text', '')
                if asset_text and str(asset_text) != 'nan':
                    insights['best_assets_list'].append({
                        'text': str(asset_text)[:60],
                        'campaign': str(row.get('campaign.name', 'N/A'))[:30],
                        'ad_group': str(row.get('ad_group.name', 'N/A'))[:30]
                    })
    except:
        pass

    # Top non-brand keywords (sorted by cost desc)
    try:
        df_kw = pd.read_csv(audit_dir / 'data' / 'keywords.csv')
        df_kw = df_kw[df_kw['metrics.conversions'] > 0]
        # Filter out brand
        df_kw['is_brand'] = df_kw['ad_group_criterion.keyword.text'].apply(lambda x: is_brand(x, brand_strings))
        df_nonbrand = df_kw[~df_kw['is_brand']].nlargest(5, 'metrics.cost_micros')  # Sort by cost desc
        insights['top_nonbrand_kw'] = []
        for _, row in df_nonbrand.iterrows():
            insights['top_nonbrand_kw'].append({
                'keyword': row['ad_group_criterion.keyword.text'],
                'conversions': row['metrics.conversions'],
                'cost': row['metrics.cost_micros'] / 1_000_000,
                'roas': row['metrics.conversions_value'] / (row['metrics.cost_micros'] / 1_000_000) if row['metrics.cost_micros'] > 0 else 0
            })
    except:
        pass

    # Top products with period comparison
    try:
        df_prod = pd.read_csv(audit_dir / 'data' / 'products.csv')
        df_prod_prev = pd.read_csv(audit_dir / 'data' / 'products-prev.csv')

        # Get top 5 by current spend
        top_products = df_prod.nlargest(5, 'metrics.cost_micros')
        insights['top_products'] = []

        for _, row in top_products.iterrows():
            product_id = row['segments.product_item_id']
            product_title = row['segments.product_title']

            # Find previous period data for this product
            prev_row = df_prod_prev[df_prod_prev['segments.product_item_id'] == product_id]

            current_cost = row['metrics.cost_micros'] / 1_000_000
            current_conv = row['metrics.conversions']
            current_roas = row['metrics.conversions_value'] / current_cost if current_cost > 0 else 0

            if len(prev_row) > 0:
                prev_cost = prev_row['metrics.cost_micros'].values[0] / 1_000_000
                prev_conv = prev_row['metrics.conversions'].values[0]
                cost_change = ((current_cost - prev_cost) / prev_cost * 100) if prev_cost > 0 else None
                conv_change = ((current_conv - prev_conv) / prev_conv * 100) if prev_conv > 0 else None
            else:
                prev_cost = 0
                prev_conv = 0
                cost_change = None
                conv_change = None

            # Get image URL if available
            image_url = row.get('segments.product_image_url', '')
            if str(image_url) == 'nan':
                image_url = ''

            insights['top_products'].append({
                'title': product_title[:50] if product_title else product_id,
                'id': product_id,
                'cost': current_cost,
                'conversions': current_conv,
                'roas': current_roas,
                'cost_change': cost_change,
                'conv_change': conv_change,
                'image_url': str(image_url) if image_url else ''
            })
    except:
        pass

    return insights


def generate_charts(audit_dir, account_name, account_config, insights):
    charts_dir = audit_dir / 'charts'
    charts_dir.mkdir(exist_ok=True)

    currency = account_config.get('currency', 'AUD')
    cs = {'AUD': 'A$', 'USD': '$', 'GBP': '£'}.get(currency, '$')
    target_roas = account_config.get('target_roas', 3)
    primary_color = account_config.get('brand_color_primary', '#1a73e8')
    secondary_color = account_config.get('brand_color_secondary', '#f5a623')

    # Chart styling - clean axes, grid, no box
    plt.rcParams.update({
        'axes.facecolor': 'white',
        'axes.edgecolor': '#333333',
        'axes.linewidth': 1.5,
        'axes.spines.top': False,
        'axes.spines.right': False,
        'grid.color': '#e0e0e0',
        'grid.linewidth': 0.5,
        'grid.alpha': 0.7,
        'font.family': 'sans-serif',
    })

    # 1. Daily Conversions Trend (curved, thicker lines)
    try:
        df = pd.read_csv(audit_dir / 'data' / 'daily-conv.csv')
        if len(df) > 0:
            df['date'] = pd.to_datetime(df['segments.date'])
            df = df.sort_values('date')
            df['cost'] = df['metrics.cost_micros'] / 1_000_000

            fig, ax1 = plt.subplots(figsize=(12, 5))
            ax1.set_xlabel('Date')
            ax1.set_ylabel('Conversions', color=primary_color)
            ax1.grid(True, alpha=0.3)

            # Smooth interpolation for conversions
            if len(df) > 3:
                x_num = mdates.date2num(df['date'])
                x_smooth = np.linspace(x_num.min(), x_num.max(), 200)
                spl = make_interp_spline(x_num, df['metrics.conversions'], k=3)
                y_smooth = spl(x_smooth)
                ax1.plot(mdates.num2date(x_smooth), y_smooth, color=primary_color, linewidth=2.5)
                ax1.scatter(df['date'], df['metrics.conversions'], color=primary_color, s=30, zorder=5)
            else:
                ax1.plot(df['date'], df['metrics.conversions'], color=primary_color, linewidth=2.5, marker='o', markersize=4)

            ax1.tick_params(axis='y', labelcolor=primary_color)

            ax2 = ax1.twinx()
            ax2.set_ylabel(f'Cost ({cs})', color=secondary_color)

            # Smooth interpolation for cost
            if len(df) > 3:
                spl2 = make_interp_spline(x_num, df['cost'], k=3)
                y_smooth2 = spl2(x_smooth)
                ax2.plot(mdates.num2date(x_smooth), y_smooth2, color=secondary_color, linewidth=2.5, alpha=0.8)
                ax2.scatter(df['date'], df['cost'], color=secondary_color, s=30, zorder=5, alpha=0.8)
            else:
                ax2.plot(df['date'], df['cost'], color=secondary_color, linewidth=2.5, alpha=0.8, marker='o', markersize=4)

            ax2.tick_params(axis='y', labelcolor=secondary_color)
            ax2.spines['right'].set_visible(True)

            ax1.xaxis.set_major_formatter(mdates.DateFormatter('%b %d'))
            plt.title(f'Daily Performance - {account_name}', fontweight='bold', fontsize=14)
            fig.tight_layout()
            plt.savefig(charts_dir / 'daily-conversions.png', dpi=150, facecolor='white')
            plt.close()
            print("  - daily-conversions.png")
    except Exception as e:
        print(f"  - daily-conversions.png (failed: {e})")

    # 2. Conversion Actions Over Time (multi-line, curved)
    try:
        df = pd.read_csv(audit_dir / 'data' / 'conv-actions-daily.csv')
        if len(df) > 0 and 'segments.conversion_action_name' in df.columns:
            df['date'] = pd.to_datetime(df['segments.date'])

            fig, ax = plt.subplots(figsize=(12, 6))

            actions = df['segments.conversion_action_name'].unique()
            colors = plt.cm.tab10(np.linspace(0, 1, len(actions)))

            ax.grid(True, alpha=0.3)
            for action, color in zip(actions, colors):
                action_df = df[df['segments.conversion_action_name'] == action].sort_values('date')
                label = action[:30] if len(action) > 30 else action
                # Smooth line
                if len(action_df) > 3:
                    x_num = mdates.date2num(action_df['date'])
                    x_smooth = np.linspace(x_num.min(), x_num.max(), 100)
                    try:
                        spl = make_interp_spline(x_num, action_df['metrics.conversions'], k=3)
                        y_smooth = spl(x_smooth)
                        ax.plot(mdates.num2date(x_smooth), y_smooth, linewidth=2, label=label, color=color)
                        ax.scatter(action_df['date'], action_df['metrics.conversions'], color=color, s=20, zorder=5)
                    except:
                        ax.plot(action_df['date'], action_df['metrics.conversions'], linewidth=2, label=label, color=color, marker='o', markersize=3)
                else:
                    ax.plot(action_df['date'], action_df['metrics.conversions'], linewidth=2, label=label, color=color, marker='o', markersize=3)

            ax.set_xlabel('Date')
            ax.set_ylabel('Conversions')
            ax.set_title(f'Conversion Actions Over Time - {account_name}', fontweight='bold', fontsize=14)
            ax.xaxis.set_major_formatter(mdates.DateFormatter('%b %d'))

            if len(actions) <= 10:
                ax.legend(loc='upper left', fontsize=8, framealpha=0.9)

            fig.tight_layout()
            plt.savefig(charts_dir / 'conversion-actions.png', dpi=150, facecolor='white')
            plt.close()
            print("  - conversion-actions.png")
    except Exception as e:
        print(f"  - conversion-actions.png (failed: {e})")

    # 3. Campaign Spend Distribution
    try:
        df = pd.read_csv(audit_dir / 'data' / 'campaigns.csv')
        df = df[df['metrics.cost_micros'] > 0].head(10)
        if len(df) > 0:
            df['cost'] = df['metrics.cost_micros'] / 1_000_000
            df['name'] = df['campaign.name'].str[:30]

            fig, ax = plt.subplots(figsize=(12, 6))
            ax.grid(True, alpha=0.3, axis='x')
            bars = ax.barh(df['name'], df['cost'], color=primary_color, edgecolor='white', linewidth=0.5)
            ax.set_xlabel(f'Cost ({cs})')
            ax.set_title(f'Top Campaigns by Spend - {account_name}', fontweight='bold', fontsize=14)
            ax.invert_yaxis()

            for bar, val in zip(bars, df['cost']):
                ax.text(bar.get_width() + max(df['cost']) * 0.01, bar.get_y() + bar.get_height()/2,
                       f'{cs}{val:,.0f}', va='center', fontsize=9)

            plt.tight_layout()
            plt.savefig(charts_dir / 'campaign-spend.png', dpi=150, facecolor='white')
            plt.close()
            print("  - campaign-spend.png")
    except Exception as e:
        print(f"  - campaign-spend.png (failed: {e})")

    # 4. ROAS by Campaign (using account target)
    try:
        df = pd.read_csv(audit_dir / 'data' / 'campaigns.csv')
        df = df[df['metrics.cost_micros'] > 0].copy()
        df['roas'] = df['metrics.conversions_value'] / (df['metrics.cost_micros'] / 1_000_000)
        df = df.nlargest(10, 'metrics.cost_micros')

        if len(df) > 0:
            df['name'] = df['campaign.name'].str[:30]

            fig, ax = plt.subplots(figsize=(12, 6))
            ax.grid(True, alpha=0.3, axis='x')
            # More subtle colors matching table styling
            colors = ['#5cb85c' if r >= target_roas else '#f0ad4e' if r >= target_roas * 0.7 else '#d9534f' for r in df['roas']]
            bars = ax.barh(df['name'], df['roas'], color=colors, edgecolor='white', linewidth=0.5, alpha=0.85)
            ax.set_xlabel('ROAS')
            ax.set_title(f'ROAS by Campaign - {account_name}', fontweight='bold', fontsize=14)
            ax.axvline(x=target_roas, color='#dc3545', linestyle='--', alpha=0.7, linewidth=2, label=f'Target ({target_roas}x)')
            ax.invert_yaxis()
            ax.legend(loc='lower right')

            for bar, val in zip(bars, df['roas']):
                ax.text(bar.get_width() + 0.1, bar.get_y() + bar.get_height()/2,
                       f'{val:.1f}x', va='center', fontsize=9)

            plt.tight_layout()
            plt.savefig(charts_dir / 'roas-by-campaign.png', dpi=150, facecolor='white')
            plt.close()
            print("  - roas-by-campaign.png")
    except Exception as e:
        print(f"  - roas-by-campaign.png (failed: {e})")

    # 5. Forecast charts (cumulative + daily bar) with advanced forecasting
    try:
        df = pd.read_csv(audit_dir / 'data' / 'daily-conv.csv')
        if len(df) > 0:
            df['date'] = pd.to_datetime(df['segments.date'])
            df = df.sort_values('date')
            df['cost'] = df['metrics.cost_micros'] / 1_000_000
            df['cumulative_cost'] = df['cost'].cumsum()

            # Get advanced forecast data if available
            forecast_df = insights.get('forecast_df')
            if forecast_df is not None and len(forecast_df) > 0:
                forecast_dates = list(forecast_df['date'])
                forecast_costs = list(forecast_df['cost'])
                forecast_cumulative = [df['cumulative_cost'].iloc[-1] + forecast_df['cost'].iloc[:i+1].sum() for i in range(len(forecast_df))]
            else:
                # Fallback to simple average
                daily_avg = insights.get('daily_avg_cost', df['cost'].mean())
                last_date = df['date'].max()
                forecast_dates = [last_date + timedelta(days=i) for i in range(1, 31)]
                forecast_costs = [daily_avg] * 30
                forecast_cumulative = [df['cumulative_cost'].iloc[-1] + daily_avg * i for i in range(1, 31)]

            fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

            # Cumulative line chart - smooth the actual, keep forecast wiggly
            ax1.grid(True, alpha=0.3)

            # Smooth actual cumulative
            if len(df) > 3:
                x_num = mdates.date2num(df['date'])
                x_smooth = np.linspace(x_num.min(), x_num.max(), 100)
                spl = make_interp_spline(x_num, df['cumulative_cost'], k=3)
                y_smooth = spl(x_smooth)
                ax1.plot(mdates.num2date(x_smooth), y_smooth, color=primary_color, linewidth=2.5, label='Actual')
                ax1.scatter(df['date'], df['cumulative_cost'], color=primary_color, s=20, zorder=5)
            else:
                ax1.plot(df['date'], df['cumulative_cost'], color=primary_color, linewidth=2.5, marker='o', markersize=4, label='Actual')

            # Forecast cumulative - show the wiggly pattern from daily forecasts
            ax1.plot(forecast_dates, forecast_cumulative, color=secondary_color, linewidth=2, marker='o', markersize=3, alpha=0.8, label='Forecast')
            ax1.set_xlabel('Date')
            ax1.set_ylabel(f'Cumulative Cost ({cs})')
            ax1.set_title('Cumulative Spend + Forecast', fontweight='bold')
            ax1.xaxis.set_major_formatter(mdates.DateFormatter('%b %d'))
            ax1.legend()

            # Daily bar chart with variable forecast heights
            colors = [primary_color] * len(df) + [secondary_color] * min(10, len(forecast_costs))
            all_dates = list(df['date']) + forecast_dates[:10]
            all_costs = list(df['cost']) + forecast_costs[:10]

            ax2.grid(True, alpha=0.3, axis='y')
            ax2.bar(all_dates, all_costs, color=colors[:len(all_dates)], edgecolor='white', linewidth=0.5)
            ax2.set_xlabel('Date')
            ax2.set_ylabel(f'Daily Cost ({cs})')
            ax2.set_title('Daily Spend + Forecast', fontweight='bold')
            ax2.xaxis.set_major_formatter(mdates.DateFormatter('%b %d'))
            plt.setp(ax2.xaxis.get_majorticklabels(), rotation=45, ha='right')

            fig.tight_layout()
            plt.savefig(charts_dir / 'forecast.png', dpi=150, facecolor='white')
            plt.close()
            print("  - forecast.png")
    except Exception as e:
        print(f"  - forecast.png (failed: {e})")

    # 6. Period comparison chart
    try:
        metrics = ['Spend', 'Conversions', 'Value', 'ROAS']
        current_values = [
            insights.get('total_cost', 0),
            insights.get('total_conversions', 0),
            insights.get('total_value', 0),
            insights.get('roas', 0)
        ]
        previous_values = [
            insights.get('prev_cost', 0),
            insights.get('prev_conversions', 0),
            insights.get('prev_value', 0),
            insights.get('prev_roas', 0)
        ]

        # Normalize for display (different scales)
        fig, axes = plt.subplots(1, 4, figsize=(14, 4))

        for i, (metric, current, previous) in enumerate(zip(metrics, current_values, previous_values)):
            ax = axes[i]
            ax.grid(True, alpha=0.3, axis='y')

            x = [0, 1]
            heights = [previous, current]
            colors_bar = [secondary_color, primary_color]
            labels = ['Previous', 'Current']

            bars = ax.bar(x, heights, color=colors_bar, width=0.6, edgecolor='white')
            ax.set_xticks(x)
            ax.set_xticklabels(labels, fontsize=9)
            ax.set_title(metric, fontweight='bold', fontsize=11)

            # Add value labels on bars
            for bar, val in zip(bars, heights):
                if metric == 'ROAS':
                    label = f'{val:.1f}x'
                elif metric == 'Conversions':
                    label = f'{val:,.0f}'
                else:
                    label = f'{cs}{val:,.0f}'
                ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + max(heights)*0.02,
                       label, ha='center', va='bottom', fontsize=8)

            # Calculate and show delta
            if previous > 0:
                delta = ((current - previous) / previous) * 100
                delta_color = '#28a745' if delta >= 0 else '#dc3545'
                arrow = '↑' if delta >= 0 else '↓'
                ax.text(0.5, -0.15, f'{arrow} {abs(delta):.1f}%', transform=ax.transAxes,
                       ha='center', fontsize=9, color=delta_color, fontweight='bold')

        plt.tight_layout()
        plt.savefig(charts_dir / 'period-comparison.png', dpi=150, facecolor='white')
        plt.close()
        print("  - period-comparison.png")
    except Exception as e:
        print(f"  - period-comparison.png (failed: {e})")


def generate_html_report(audit_dir, account_name, account_config, days, insights):
    import base64

    cs = insights.get('currency_symbol', '$')
    primary_color = account_config.get('brand_color_primary', '#1a73e8')
    secondary_color = account_config.get('brand_color_secondary', '#f5a623')
    logo_url = account_config.get('logo_url', '')
    target_roas = account_config.get('target_roas', 3)

    # Load chart images
    charts_html = {}
    charts_dir = audit_dir / 'charts'
    for chart_name in ['daily-conversions', 'conversion-actions', 'campaign-spend', 'roas-by-campaign', 'forecast', 'period-comparison']:
        chart_path = charts_dir / f'{chart_name}.png'
        if chart_path.exists():
            with open(chart_path, 'rb') as f:
                charts_html[chart_name] = base64.b64encode(f.read()).decode()

    def format_delta(value, suffix='%', invert=False):
        if value is None:
            return ''
        is_good = value >= 0 if not invert else value <= 0
        color = '#28a745' if is_good else '#dc3545'
        arrow = '↑' if value >= 0 else '↓'
        return f'<span style="color:{color};font-weight:bold">{arrow} {abs(value):.1f}{suffix}</span>'

    # Top 5 zero conversion terms HTML
    zero_conv_html = ''
    for term in insights.get('top5_zero_conv', []):
        zero_conv_html += f'''<tr>
            <td>{term['term'][:50]}</td>
            <td>{cs}{term['cost']:.2f}</td>
            <td>{term['clicks']}</td>
            <td>{term['campaign'][:30]}</td>
        </tr>'''

    # Top non-brand keywords HTML with ROAS color-coding
    nonbrand_kw_html = ''
    for kw in insights.get('top_nonbrand_kw', []):
        roas_val = kw['roas']
        roas_color = '#28a745' if roas_val >= target_roas else '#ffc107' if roas_val >= target_roas * 0.7 else '#dc3545'
        nonbrand_kw_html += f'''<tr>
            <td>{kw['keyword'][:40]}</td>
            <td>{kw['conversions']:.0f}</td>
            <td>{cs}{kw['cost']:.0f}</td>
            <td style="color:{roas_color};font-weight:bold">{kw['roas']:.1f}x</td>
        </tr>'''

    # Top products HTML with period comparison and images
    products_html = ''
    for prod in insights.get('top_products', []):
        roas_val = prod['roas']
        roas_color = '#28a745' if roas_val >= target_roas else '#ffc107' if roas_val >= target_roas * 0.7 else '#dc3545'
        cost_delta = format_delta(prod['cost_change']) if prod['cost_change'] is not None else '-'
        conv_delta = format_delta(prod['conv_change']) if prod['conv_change'] is not None else '-'
        image_html = f'<img src="{prod.get("image_url", "")}" style="width:50px;height:50px;object-fit:cover;border-radius:4px;margin-right:10px;vertical-align:middle;">' if prod.get('image_url') else ''
        products_html += f'''<tr>
            <td>{image_html}{prod['title']}</td>
            <td>{cs}{prod['cost']:.0f} {cost_delta}</td>
            <td>{prod['conversions']:.0f} {conv_delta}</td>
            <td style="color:{roas_color};font-weight:bold">{prod['roas']:.1f}x</td>
        </tr>'''

    # LOW and BEST assets HTML
    low_assets_html = ''
    for asset in insights.get('low_assets_list', [])[:5]:
        low_assets_html += f'''<tr>
            <td style="color:#dc3545;">{asset['text']}</td>
            <td>{asset['campaign']}</td>
        </tr>'''

    best_assets_html = ''
    for asset in insights.get('best_assets_list', [])[:5]:
        best_assets_html += f'''<tr>
            <td style="color:#28a745;">{asset['text']}</td>
            <td>{asset['campaign']}</td>
        </tr>'''

    # Generate automated insights
    def generate_insights():
        ins = {}

        # Performance Summary insight
        cost_delta = insights.get('cost_delta', 0)
        conv_delta = insights.get('conv_delta', 0)
        roas_delta = insights.get('roas_delta', 0)
        if cost_delta and conv_delta:
            if conv_delta > cost_delta:
                ins['performance'] = f"Efficiency improving: conversions up {conv_delta:.1f}% while spend only up {cost_delta:.1f}%."
            elif cost_delta > conv_delta + 10:
                ins['performance'] = f"Watch efficiency: spend up {cost_delta:.1f}% but conversions only up {conv_delta:.1f}%."
            else:
                ins['performance'] = f"Performance stable with {cost_delta:.1f}% more spend driving {conv_delta:.1f}% more conversions."

        # Budget Pacing insight
        forecast_cost = insights.get('forecast_30d_cost', 0)
        current_cost = insights.get('total_cost', 0)
        recency = insights.get('recency_factor', 1)
        if recency > 1.2:
            ins['budget'] = f"Recent spend is {((recency-1)*100):.0f}% above average - likely seasonal spike. Forecast accounts for this elevated activity."
        elif recency < 0.8:
            ins['budget'] = f"Recent spend is {((1-recency)*100):.0f}% below average. Consider investigating if this is intentional."
        else:
            ins['budget'] = f"Spend patterns are consistent. Forecast projects {cs}{forecast_cost:,.0f} over next 30 days."

        # CPC insight
        highest_cpc_7d = insights.get('highest_cpc_kw_7d_value', 0)
        highest_cpc_30d = insights.get('highest_cpc_kw_30d_value', 0)
        avg_conv_value = insights.get('total_value', 0) / insights.get('total_conversions', 1) if insights.get('total_conversions', 0) > 0 else 0
        if highest_cpc_7d > avg_conv_value and avg_conv_value > 0:
            ins['cpc'] = f"Highest CPC ({cs}{highest_cpc_7d:.2f}) exceeds average conversion value ({cs}{avg_conv_value:.2f}). Review this keyword's performance."
        elif highest_cpc_7d > highest_cpc_30d * 1.5:
            ins['cpc'] = f"7-day highest CPC ({cs}{highest_cpc_7d:.2f}) is significantly higher than 30-day ({cs}{highest_cpc_30d:.2f}). Recent bid pressure detected."
        else:
            ins['cpc'] = f"CPC levels are stable. Average conversion value is {cs}{avg_conv_value:.2f}."

        # Conversion Tracking insight
        conv_action_count = insights.get('conv_action_count', 0)
        if conv_action_count == 1:
            ins['tracking'] = "Only 1 conversion action active. Consider if additional conversion types should be tracked."
        elif conv_action_count > 5:
            ins['tracking'] = f"{conv_action_count} conversion actions recording. Review for any that have dropped to zero recently."
        else:
            ins['tracking'] = f"{conv_action_count} conversion actions are tracking properly."

        # Zero-conversion insight
        zero_conv_pct = insights.get('zero_conv_pct', 0)
        if zero_conv_pct > 20:
            ins['wasted'] = f"{zero_conv_pct:.1f}% of spend on zero-conversion terms is high. Review top terms for negative keyword opportunities."
        elif zero_conv_pct > 10:
            ins['wasted'] = f"{zero_conv_pct:.1f}% spend on zero-conversion terms is moderate. Normal for broad match expansion."
        else:
            ins['wasted'] = f"Low waste at {zero_conv_pct:.1f}%. Search term coverage is efficient."

        # Products insight
        top_products = insights.get('top_products', [])
        if top_products:
            above_target = sum(1 for p in top_products if p['roas'] >= target_roas)
            if above_target == len(top_products):
                ins['products'] = f"All top 5 products are meeting the {target_roas}x ROAS target."
            elif above_target == 0:
                ins['products'] = f"None of the top 5 products are meeting the {target_roas}x ROAS target. Review product-level bids."
            else:
                ins['products'] = f"{above_target} of 5 top products meeting {target_roas}x ROAS target."

        # Campaign insight
        current_roas = insights.get('roas', 0)
        if current_roas >= target_roas:
            ins['campaigns'] = f"Account ROAS of {current_roas:.1f}x exceeds target of {target_roas}x. Consider increasing budget on top performers."
        elif current_roas >= target_roas * 0.7:
            ins['campaigns'] = f"Account ROAS of {current_roas:.1f}x is approaching target of {target_roas}x."
        else:
            ins['campaigns'] = f"Account ROAS of {current_roas:.1f}x is below target of {target_roas}x. Review underperforming campaigns."

        # Non-brand keywords insight
        nonbrand_kw = insights.get('top_nonbrand_kw', [])
        if nonbrand_kw:
            above_target = sum(1 for k in nonbrand_kw if k['roas'] >= target_roas)
            total_cost = sum(k['cost'] for k in nonbrand_kw)
            if above_target == len(nonbrand_kw):
                ins['keywords'] = f"All top non-brand keywords meeting {target_roas}x target. Strong generic performance."
            elif above_target == 0:
                ins['keywords'] = f"No top non-brand keywords meeting {target_roas}x target. Review bids or pause underperformers."
            else:
                ins['keywords'] = f"{above_target} of {len(nonbrand_kw)} top non-brand keywords meeting {target_roas}x target."

        # Asset performance insight
        assets_best = insights.get('assets_best', 0)
        assets_good = insights.get('assets_good', 0)
        assets_low = insights.get('assets_low', 0)
        if assets_low > assets_best:
            ins['assets'] = f"More LOW ({assets_low}) than BEST ({assets_best}) performing assets. Replace low performers to improve ad strength."
        elif assets_best > 0:
            ins['assets'] = f"{assets_best} BEST and {assets_good} GOOD performing assets. {assets_low} LOW performers need replacement."
        else:
            ins['assets'] = f"{assets_good} GOOD performing assets. Consider testing more variations to find BEST performers."

        return ins

    auto_insights = generate_insights()

    html = f"""<!DOCTYPE html>
<html>
<head>
    <title>Account Audit - {account_name}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Oxanium:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body {{
            font-family: 'Oxanium', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 1000px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
            background: #f5f5f5;
        }}
        .header {{
            background: white;
            padding: 20px 30px;
            border-radius: 2px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }}
        .header img {{ max-height: 40px; max-width: 120px; }}
        .header h1 {{ color: {primary_color}; margin: 0; }}
        .container {{ background: white; padding: 30px; border-radius: 2px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
        h2 {{ color: #333; border-bottom: 3px solid {primary_color}; padding-bottom: 10px; margin-top: 0; }}
        .period-info {{ background: #f8f9fa; padding: 10px 15px; border-radius: 2px; font-size: 13px; margin-bottom: 15px; }}
        .summary-grid {{
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin: 20px 0;
        }}
        .summary-card {{
            background: #f8f9fa;
            padding: 15px;
            border-radius: 2px;
            text-align: center;
        }}
        .summary-card label {{ display: block; color: #5f6368; font-size: 11px; text-transform: uppercase; }}
        .summary-card .value {{ font-size: 24px; font-weight: bold; color: {primary_color}; margin: 5px 0; }}
        .summary-card .delta {{ font-size: 12px; }}
        .alert {{
            padding: 15px;
            margin: 10px 0;
            border-radius: 2px;
            border-left: 4px solid;
        }}
        .alert-warning {{ background: #fff3cd; border-color: #ffc107; }}
        .alert-info {{ background: #d1ecf1; border-color: #17a2b8; }}
        table {{
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }}
        th, td {{
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }}
        th {{ background: #f8f9fa; font-weight: 600; }}
        img.chart {{ max-width: 100%; width: 800px; border-radius: 2px; margin: 10px 0; }}
        .forecast-grid {{
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
        }}
        .forecast-card {{
            background: #f8f9fa;
            padding: 15px;
            border-radius: 2px;
            border-left: 4px solid {primary_color};
        }}
        .forecast-card h4 {{ margin: 0 0 10px 0; color: {primary_color}; }}
        .cpc-highlight {{
            font-size: 18px;
            font-weight: bold;
            color: #dc3545;
        }}
        .footer {{
            text-align: center;
            padding: 20px;
            color: #666;
            font-size: 12px;
        }}
        .footer a {{ color: {primary_color}; }}
        .insight {{
            background: #e8f4f8;
            padding: 12px 15px;
            border-radius: 2px;
            border-left: 4px solid {primary_color};
            margin: 15px 0;
            font-size: 14px;
        }}
    </style>
</head>
<body>
    <div class="header">
        <div>
            <h1>Account Audit - {account_name}</h1>
            <p style="margin:5px 0 0 0;color:#666;">Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}</p>
            <p style="margin:3px 0 0 0;color:#666;font-size:12px;">
                <strong>Current:</strong> {insights.get('current_period', 'N/A')} ({days} days) |
                <strong>Previous:</strong> {insights.get('previous_period', 'N/A')}
            </p>
        </div>
        {f'<img src="{logo_url}" alt="Logo">' if logo_url else ''}
    </div>

    <div class="container">
        <h2>Performance Summary</h2>
        <div class="insight">{auto_insights.get('performance', '')}</div>
        <table>
            <tr>
                <th>Metric</th>
                <th>Spend</th>
                <th>Conversions</th>
                <th>Value</th>
                <th>ROAS</th>
                <th>Clicks</th>
                <th>Impressions</th>
                <th>CTR</th>
                <th>CPA</th>
            </tr>
            <tr>
                <td><strong>Current</strong></td>
                <td>{cs}{insights.get('total_cost', 0):,.0f}</td>
                <td>{insights.get('total_conversions', 0):,.0f}</td>
                <td>{cs}{insights.get('total_value', 0):,.0f}</td>
                <td>{insights.get('roas', 0):.1f}x</td>
                <td>{insights.get('total_clicks', 0):,}</td>
                <td>{insights.get('total_impressions', 0):,}</td>
                <td>{insights.get('ctr', 0):.2f}%</td>
                <td>{cs}{insights.get('cpa', 0):.2f}</td>
            </tr>
            <tr>
                <td><strong>Change</strong></td>
                <td>{format_delta(insights.get('cost_delta'))}</td>
                <td>{format_delta(insights.get('conv_delta'))}</td>
                <td>{format_delta(insights.get('value_delta'))}</td>
                <td>{format_delta(insights.get('roas_delta'))}</td>
                <td>{format_delta(insights.get('clicks_delta'))}</td>
                <td>{format_delta(insights.get('impressions_delta'))}</td>
                <td>{format_delta(insights.get('ctr_delta'))}</td>
                <td>{format_delta(insights.get('cpa_delta'), invert=True)}</td>
            </tr>
        </table>
        {'<img class="chart" src="data:image/png;base64,' + charts_html.get('period-comparison', '') + '">' if 'period-comparison' in charts_html else ''}
    </div>

    <div class="container">
        <h2>Budget Pacing & Forecast</h2>
        <div class="insight">{auto_insights.get('budget', '')}</div>
        <div class="forecast-grid">
            <div class="forecast-card">
                <h4>Next 30 Days Projection</h4>
                <p><strong>Spend:</strong> {cs}{insights.get('forecast_30d_cost', 0):,.0f}</p>
                <p><strong>Conversions:</strong> {insights.get('forecast_30d_conv', 0):,.0f}</p>
                <p><strong>Value:</strong> {cs}{insights.get('forecast_30d_value', 0):,.0f}</p>
            </div>
            <div class="forecast-card">
                <h4>Rest of Month ({insights.get('days_remaining', 0)} days)</h4>
                <p><strong>Spend:</strong> {cs}{insights.get('forecast_month_cost', 0):,.0f}</p>
                <p><strong>Conversions:</strong> {insights.get('forecast_month_conv', 0):,.0f}</p>
                <p><strong>Value:</strong> {cs}{insights.get('forecast_month_value', 0):,.0f}</p>
            </div>
        </div>
        {'<img class="chart" src="data:image/png;base64,' + charts_html.get('forecast', '') + '">' if 'forecast' in charts_html else ''}
    </div>

    <div class="container">
        <h2>Bid Management Insights</h2>
        <div class="insight">{auto_insights.get('cpc', '')}</div>
        <h3>Highest CPC Analysis</h3>
        <table>
            <tr>
                <th>Period</th>
                <th>Highest CPC Keyword</th>
                <th>Highest CPC Search Term</th>
            </tr>
            <tr>
                <td><strong>Last 7 Days</strong></td>
                <td>
                    <span class="cpc-highlight">{cs}{insights.get('highest_cpc_kw_7d_value', 0):.2f}</span><br>
                    <small>{str(insights.get('highest_cpc_kw_7d', 'N/A'))[:40]}</small><br>
                    <small style="color:#666">Campaign: {str(insights.get('highest_cpc_kw_7d_campaign', 'N/A'))[:30]}</small>
                </td>
                <td>
                    <span class="cpc-highlight">{cs}{insights.get('highest_cpc_st_7d_value', 0):.2f}</span><br>
                    <small>{str(insights.get('highest_cpc_st_7d', 'N/A'))[:40]}</small><br>
                    <small style="color:#666">Campaign: {str(insights.get('highest_cpc_st_7d_campaign', 'N/A'))[:30]}</small>
                </td>
            </tr>
            <tr>
                <td><strong>Last 30 Days</strong></td>
                <td>
                    <span class="cpc-highlight">{cs}{insights.get('highest_cpc_kw_30d_value', 0):.2f}</span><br>
                    <small>{str(insights.get('highest_cpc_kw_30d', 'N/A'))[:40]}</small><br>
                    <small style="color:#666">Campaign: {str(insights.get('highest_cpc_kw_30d_campaign', 'N/A'))[:30]}</small>
                </td>
                <td>
                    <span class="cpc-highlight">{cs}{insights.get('highest_cpc_st_30d_value', 0):.2f}</span><br>
                    <small>{str(insights.get('highest_cpc_st_30d', 'N/A'))[:40]}</small><br>
                    <small style="color:#666">Campaign: {str(insights.get('highest_cpc_st_30d_campaign', 'N/A'))[:30]}</small>
                </td>
            </tr>
        </table>
    </div>

    <div class="container">
        <h2>Conversion Tracking Health</h2>
        <div class="insight">{auto_insights.get('tracking', '')}</div>
        {'<img class="chart" src="data:image/png;base64,' + charts_html.get('conversion-actions', '') + '">' if 'conversion-actions' in charts_html else '<p>Chart not available</p>'}
        <p><small>Look for lines that suddenly drop to zero - this indicates broken conversion tracking.</small></p>
    </div>

    <div class="container">
        <h2>Zero-Conversion Search Terms</h2>
        <div class="insight">{auto_insights.get('wasted', '')}</div>
        <div class="alert alert-warning">
            <strong>{insights.get('zero_conv_terms', 0):,} search terms</strong> with {cs}{insights.get('zero_conv_cost', 0):,.0f} spend and zero conversions
            ({insights.get('zero_conv_pct', 0):.1f}% of total spend).
        </div>
        <h4>Top 5 by Spend</h4>
        <table>
            <tr><th>Search Term</th><th>Cost</th><th>Clicks</th><th>Campaign</th></tr>
            {zero_conv_html}
        </table>
    </div>

    <div class="container">
        <h2>Daily Performance Trend</h2>
        {'<img class="chart" src="data:image/png;base64,' + charts_html.get('daily-conversions', '') + '">' if 'daily-conversions' in charts_html else '<p>Chart not available</p>'}
    </div>

    <div class="container">
        <h2>Campaign Performance</h2>
        <div class="insight">{auto_insights.get('campaigns', '')}</div>
        <p><small>Target ROAS: {target_roas}x (green ≥ target, yellow ≥ 70% target, red &lt; 70% target)</small></p>
        {'<img class="chart" src="data:image/png;base64,' + charts_html.get('campaign-spend', '') + '">' if 'campaign-spend' in charts_html else ''}
        {'<img class="chart" src="data:image/png;base64,' + charts_html.get('roas-by-campaign', '') + '">' if 'roas-by-campaign' in charts_html else ''}
    </div>

    <div class="container">
        <h2>Top Products</h2>
        <div class="insight">{auto_insights.get('products', '')}</div>
        <p><small>Top 5 products by spend with period comparison</small></p>
        <table>
            <tr><th>Product</th><th>Cost</th><th>Conversions</th><th>ROAS</th></tr>
            {products_html if products_html else '<tr><td colspan="4">No product data available</td></tr>'}
        </table>
    </div>

    <div class="container">
        <h2>Top Non-Brand Keywords</h2>
        <div class="insight">{auto_insights.get('keywords', '')}</div>
        <p><small>Sorted by cost descending, excluding keywords containing brand terms</small></p>
        <table>
            <tr><th>Keyword</th><th>Conversions</th><th>Cost</th><th>ROAS</th></tr>
            {nonbrand_kw_html}
        </table>
    </div>

    <div class="container">
        <h2>Asset Performance</h2>
        <div class="insight">{auto_insights.get('assets', '')}</div>
        <div class="summary-grid" style="grid-template-columns: repeat(3, 1fr);">
            <div class="summary-card" style="background: #d4edda;">
                <label>Best Performing</label>
                <div class="value" style="color: #5cb85c;">{insights.get('assets_best', 0)}</div>
            </div>
            <div class="summary-card" style="background: #fcf8e3;">
                <label>Good Performing</label>
                <div class="value" style="color: #f0ad4e;">{insights.get('assets_good', 0)}</div>
            </div>
            <div class="summary-card" style="background: #f8d7da;">
                <label>Low Performing</label>
                <div class="value" style="color: #d9534f;">{insights.get('assets_low', 0)}</div>
            </div>
        </div>

        <h4 style="color:#dc3545;margin-top:20px;">LOW Performers - Replace These</h4>
        <table>
            <tr><th>Asset Text</th><th>Campaign</th></tr>
            {low_assets_html if low_assets_html else '<tr><td colspan="2">No LOW performing assets</td></tr>'}
        </table>

        <h4 style="color:#28a745;margin-top:20px;">BEST Performers - Replicate These</h4>
        <table>
            <tr><th>Asset Text</th><th>Campaign</th></tr>
            {best_assets_html if best_assets_html else '<tr><td colspan="2">No BEST performing assets yet</td></tr>'}
        </table>
    </div>

    <div class="footer">
        This report was generated by <strong>Mike Rhodes</strong>, 8020 Brain.<br>
        For more details, visit <a href="https://adstoai.com">adstoai.com</a>
    </div>

</body>
</html>
"""

    with open(audit_dir / 'report.html', 'w') as f:
        f.write(html)

    # Generate PDF using headless Chrome
    try:
        pdf_path = audit_dir / 'report.pdf'
        html_path = audit_dir / 'report.html'
        chrome_path = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
        cmd = [
            chrome_path,
            '--headless',
            '--disable-gpu',
            '--no-pdf-header-footer',
            f'--print-to-pdf={pdf_path}',
            f'file://{html_path}'
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if result.returncode == 0 or pdf_path.exists():
            print(f"  - report.pdf")
        else:
            print(f"  - report.pdf (failed)")
    except Exception as e:
        print(f"  - report.pdf (failed: {e})")

    return audit_dir / 'report.html'


def generate_json_output(audit_dir, account_name, account_config, days, insights):
    """Generate JSON file for Google Slides population."""
    import json

    currency = account_config.get('currency', 'AUD')
    timezone = account_config.get('timezone', 'Australia/Sydney')
    start_date, end_date = get_date_range(days, timezone)
    prev_start, prev_end = get_date_range(days, timezone, previous=True)

    # Build the JSON structure expected by create-audit-deck.js
    output = {
        "metadata": {
            "account_name": account_name,
            "account_id": account_config.get('id', ''),
            "audit_date": datetime.now().strftime('%Y-%m-%d'),
            "period": {
                "current": {"start": start_date, "end": end_date},
                "previous": {"start": prev_start, "end": prev_end}
            },
            "currency": currency,
            "your_business": "8020agent.com"
        },
        "executive_summary": {
            "health_score": 75,  # TODO: Calculate actual health score
            "key_findings": [
                f"ROAS at {insights.get('roas', 0):.1f}x {'above' if insights.get('roas', 0) >= account_config.get('target_roas', 3) else 'below'} target",
                f"{insights.get('zero_conv_pct', 0):.1f}% of spend on zero-conversion terms",
                f"{insights.get('conv_action_count', 0)} conversion actions tracking"
            ],
            "priority_actions": [
                f"Review {insights.get('zero_conv_terms', 0)} zero-conversion search terms",
                "Replace LOW performing assets",
                "Optimize highest CPC keywords"
            ]
        },
        "performance_summary": {
            "current": {
                "spend": insights.get('total_cost', 0),
                "clicks": insights.get('total_clicks', 0),
                "impressions": insights.get('total_impressions', 0),
                "conversions": insights.get('total_conversions', 0),
                "value": insights.get('total_value', 0),
                "roas": insights.get('roas', 0),
                "ctr": insights.get('ctr', 0),
                "cpc": insights.get('avg_cpc', 0) if 'avg_cpc' in insights else (insights.get('total_cost', 0) / insights.get('total_clicks', 1) if insights.get('total_clicks', 0) > 0 else 0)
            },
            "previous": {
                "spend": insights.get('prev_cost', 0),
                "clicks": insights.get('prev_clicks', 0),
                "impressions": insights.get('prev_impressions', 0),
                "conversions": insights.get('prev_conversions', 0),
                "value": insights.get('prev_value', 0),
                "roas": insights.get('prev_roas', 0),
                "ctr": insights.get('prev_ctr', 0),
                "cpc": insights.get('prev_cost', 0) / insights.get('prev_clicks', 1) if insights.get('prev_clicks', 0) > 0 else 0
            },
            "change": {
                "spend": {"value": insights.get('total_cost', 0) - insights.get('prev_cost', 0), "percent": insights.get('cost_delta', 0) or 0},
                "conversions": {"value": insights.get('total_conversions', 0) - insights.get('prev_conversions', 0), "percent": insights.get('conv_delta', 0) or 0},
                "roas": {"value": insights.get('roas', 0) - insights.get('prev_roas', 0), "percent": insights.get('roas_delta', 0) or 0}
            }
        },
        "budget_pacing": {
            "projected_30d_spend": insights.get('forecast_30d_cost', 0),
            "projected_month_end_spend": insights.get('forecast_month_cost', 0),
            "daily_average": insights.get('daily_avg_cost', 0),
            "budget_limited_campaigns": []  # TODO: Parse from budgets.csv
        },
        "bid_management": {
            "highest_cpc_keywords_7d": [
                {
                    "keyword": insights.get('highest_cpc_kw_7d', 'N/A'),
                    "cpc": insights.get('highest_cpc_kw_7d_value', 0),
                    "conversions": 0
                }
            ],
            "highest_cpc_keywords_30d": [
                {
                    "keyword": insights.get('highest_cpc_kw_30d', 'N/A'),
                    "cpc": insights.get('highest_cpc_kw_30d_value', 0),
                    "conversions": 0
                }
            ],
            "highest_cpc_search_terms_7d": [
                {
                    "term": insights.get('highest_cpc_st_7d', 'N/A'),
                    "cpc": insights.get('highest_cpc_st_7d_value', 0),
                    "conversions": 0
                }
            ],
            "highest_cpc_search_terms_30d": [
                {
                    "term": insights.get('highest_cpc_st_30d', 'N/A'),
                    "cpc": insights.get('highest_cpc_st_30d_value', 0),
                    "conversions": 0
                }
            ],
            "avg_conversion_value": insights.get('total_value', 0) / insights.get('total_conversions', 1) if insights.get('total_conversions', 0) > 0 else 0,
            "alerts": []
        },
        "campaign_performance": [],  # TODO: Parse from campaigns.csv
        "keywords": {
            "top_non_brand": [
                {
                    "keyword": kw.get('keyword', ''),
                    "campaign": "N/A",
                    "spend": kw.get('cost', 0),
                    "conversions": kw.get('conversions', 0),
                    "cpc": kw.get('cost', 0) / max(1, kw.get('conversions', 1)),
                    "roas": kw.get('roas', 0)
                }
                for kw in insights.get('top_nonbrand_kw', [])
            ],
            "zero_conversion": []
        },
        "search_terms": {
            "wasted_spend": [
                {
                    "term": term.get('term', ''),
                    "campaign": term.get('campaign', 'N/A'),
                    "spend": term.get('cost', 0),
                    "clicks": term.get('clicks', 0),
                    "conversions": 0,
                    "action": "add as negative"
                }
                for term in insights.get('top5_zero_conv', [])
            ],
            "total_wasted": insights.get('zero_conv_cost', 0),
            "opportunities": []
        },
        "conversion_tracking": {
            "actions": [],  # TODO: Parse from conv-actions-daily.csv
            "total_actions": insights.get('conv_action_count', 0),
            "healthy": insights.get('conv_action_count', 0),
            "warnings": 0
        },
        "daily_trends": {
            "data": [],  # TODO: Parse from daily-conv.csv
            "anomalies": []
        },
        "asset_performance": {
            "summary": {
                "BEST": insights.get('assets_best', 0),
                "GOOD": insights.get('assets_good', 0),
                "LOW": insights.get('assets_low', 0),
                "LEARNING": 0
            },
            "low_performers": [],
            "top_performers": []
        },
        "recommendations": {
            "high_priority": [
                {
                    "title": "Review Zero-Conversion Terms",
                    "description": f"Add {insights.get('zero_conv_terms', 0)} search terms as negatives",
                    "impact": f"Save {insights.get('currency_symbol', '$')}{insights.get('zero_conv_cost', 0):,.0f}",
                    "effort": "low"
                },
                {
                    "title": "Replace LOW Assets",
                    "description": f"Replace {insights.get('assets_low', 0)} low-performing assets",
                    "impact": "Improve ad strength",
                    "effort": "medium"
                }
            ],
            "medium_priority": [],
            "quick_wins": [
                f"Review top 5 zero-conversion terms ({insights.get('currency_symbol', '$')}{insights.get('zero_conv_cost', 0):,.0f} wasted)",
                "Test variations of BEST performing assets",
                "Check highest CPC keywords for bid adjustments"
            ]
        }
    }

    # Write JSON file
    json_path = audit_dir / 'audit-data.json'
    with open(json_path, 'w') as f:
        json.dump(output, f, indent=2, default=str)

    print(f"  - audit-data.json")
    return json_path


def main():
    parser = argparse.ArgumentParser(description='Run Google Ads account audit')
    parser.add_argument('--account', required=True, help='Account name or alias from accounts.json')
    parser.add_argument('--account-name', dest='account_name', help='Folder name in data/google-ads/ (auto-detected if not provided)')
    parser.add_argument('--days', type=int, default=30, help='Number of days (default: 30)')
    args = parser.parse_args()

    accounts = load_accounts()
    account_key, account_config = resolve_account(args.account, accounts)

    if not account_config:
        print(f"Error: Account '{args.account}' not found in accounts.json")
        print(f"Available accounts: {', '.join(accounts.keys())}")
        sys.exit(1)

    account_name = account_config.get('name', account_key)
    timezone = account_config.get('timezone', 'Australia/Sydney')

    # Determine folder name: explicit --account-name, or auto-detect from aliases
    if args.account_name:
        folder_name = args.account_name
    else:
        folder_name = find_account_folder(args.account, account_config, DATA_BASE)

    print(f"\n{'='*60}")
    print(f"Google Ads Account Audit v1.1")
    print(f"{'='*60}")
    print(f"Account: {account_name}")
    print(f"Folder: {folder_name}")
    print(f"Period: {args.days} days (ending yesterday in {timezone})")
    print(f"{'='*60}\n")

    # Output directory: data/google-ads/{folder}/{date}-audit/
    date_str = datetime.now().strftime('%Y%m%d')
    account_folder = DATA_BASE / folder_name
    audit_dir = account_folder / f"{date_str}-audit"
    data_dir = audit_dir / 'data'

    account_folder.mkdir(parents=True, exist_ok=True)
    audit_dir.mkdir(parents=True, exist_ok=True)
    data_dir.mkdir(exist_ok=True)

    print(f"Output: {audit_dir}\n")

    # Run queries
    print("Running queries...")
    for query_name in AUDIT_QUERIES:
        print(f"  - {query_name}...", end=' ')
        output_path = data_dir / f"{query_name}.csv"

        success = run_query(query_name, account_config, args.days, output_path)

        if success:
            try:
                df = pd.read_csv(output_path, low_memory=False)
                if query_name not in ['budgets', 'campaigns-prev']:
                    df = filter_zero_impressions(df)
                    df.to_csv(output_path, index=False)
                print(f"{len(df)} rows")
            except:
                print("done")
        else:
            print("failed")

    # Calculate insights first (needed for charts)
    print("\nCalculating insights...")
    insights = calculate_insights(audit_dir, account_config, args.days)

    # Generate charts
    print("\nGenerating charts...")
    generate_charts(audit_dir, account_name, account_config, insights)

    # Generate report
    print("\nGenerating report...")
    html_path = generate_html_report(audit_dir, account_name, account_config, args.days, insights)
    print(f"  - report.html")

    # Generate JSON for slides
    json_path = generate_json_output(audit_dir, account_name, account_config, args.days, insights)

    # Summary
    cs = insights.get('currency_symbol', '$')
    print(f"\n{'='*60}")
    print("Audit Complete!")
    print(f"{'='*60}")
    print(f"\nSummary:")
    print(f"  Spend: {cs}{insights.get('total_cost', 0):,.2f}")
    print(f"  Conversions: {insights.get('total_conversions', 0):,.0f}")
    print(f"  ROAS: {insights.get('roas', 0):.1f}x")
    if 'cost_delta' in insights:
        print(f"  vs Previous: Cost {insights['cost_delta']:+.1f}%, Conv {insights.get('conv_delta', 0):+.1f}%")
    print(f"\nFiles: {audit_dir}")
    print(f"\nOpen report: file://{html_path}\n")


if __name__ == '__main__':
    main()
