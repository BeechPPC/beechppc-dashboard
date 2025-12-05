import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
from pathlib import Path
import glob
import sys

def find_csv_file(file_path):
    """
    Robustly finds a CSV file, handling spaces and fuzzy matching.

    Args:
        file_path (str): Path to CSV file (may have spaces or be incomplete)

    Returns:
        str: Resolved file path
    """
    path = Path(file_path).expanduser()

    # If exact path exists, return it
    if path.exists():
        return str(path)

    # Try to find similar files in the same directory
    parent = path.parent
    if parent.exists():
        # Search for CSV files with similar names
        search_pattern = f"{parent}/*.csv"
        matching_files = glob.glob(search_pattern)

        # Case-insensitive partial match
        name_lower = path.stem.lower().replace('-', ' ')
        for candidate in matching_files:
            candidate_name = Path(candidate).stem.lower().replace('-', ' ')
            if name_lower in candidate_name or candidate_name in name_lower:
                print(f"📁 Found file: {candidate}")
                return candidate

    raise FileNotFoundError(f"Could not find CSV file: {file_path}")

def detect_google_ads_format(file_path):
    """
    Detects if this is a Google Ads export and determines rows to skip.

    Returns:
        int: Number of header rows to skip
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        first_line = f.readline().strip()

        # Google Ads exports typically start with report name
        if 'report' in first_line.lower():
            # Check if second line is a date range
            second_line = f.readline().strip()
            if any(month in second_line for month in ['January', 'February', 'March', 'April', 'May', 'June',
                                                       'July', 'August', 'September', 'October', 'November', 'December']):
                print(f"📊 Detected Google Ads export format")
                print(f"   Report: {first_line}")
                print(f"   Date range: {second_line}")
                return 2

    return 0

def clean_numeric_columns(df):
    """
    Cleans numeric columns by removing commas, handling percentages, etc.
    Modifies dataframe in place.
    """
    for col in df.columns:
        if df[col].dtype == 'object':
            # Try to convert columns that look numeric
            sample = df[col].dropna().astype(str).head(100)

            # Check if it contains numbers with commas or currency symbols
            if sample.str.contains(r'[\d,]+\.?\d*', regex=True).any():
                # Remove commas and try to convert
                cleaned = df[col].astype(str).str.replace(',', '').str.replace('£', '').str.replace('$', '')
                try:
                    df[col + '_numeric'] = pd.to_numeric(cleaned, errors='coerce')
                except:
                    pass

def summarize_csv(file_path):
    """
    Comprehensively analyzes a CSV file and generates multiple visualizations.

    Args:
        file_path (str): Path to the CSV file

    Returns:
        str: Formatted comprehensive analysis of the dataset
    """
    # Robustly find the file
    resolved_path = find_csv_file(file_path)

    # Detect Google Ads format
    skiprows = detect_google_ads_format(resolved_path)

    # Load CSV
    df = pd.read_csv(resolved_path, skiprows=skiprows)

    # Clean numeric columns
    clean_numeric_columns(df)
    summary = []
    charts_created = []
    
    # Basic info
    summary.append("=" * 60)
    summary.append("📊 DATA OVERVIEW")
    summary.append("=" * 60)
    summary.append(f"Rows: {df.shape[0]:,} | Columns: {df.shape[1]}")
    summary.append(f"\nColumns: {', '.join(df.columns.tolist())}")
    
    # Data types
    summary.append(f"\n📋 DATA TYPES:")
    for col, dtype in df.dtypes.items():
        summary.append(f"  • {col}: {dtype}")
    
    # Missing data analysis
    missing = df.isnull().sum().sum()
    missing_pct = (missing / (df.shape[0] * df.shape[1])) * 100
    summary.append(f"\n🔍 DATA QUALITY:")
    if missing:
        summary.append(f"Missing values: {missing:,} ({missing_pct:.2f}% of total data)")
        summary.append("Missing by column:")
        for col in df.columns:
            col_missing = df[col].isnull().sum()
            if col_missing > 0:
                col_pct = (col_missing / len(df)) * 100
                summary.append(f"  • {col}: {col_missing:,} ({col_pct:.1f}%)")
    else:
        summary.append("✓ No missing values - dataset is complete!")
    
    # Numeric analysis
    numeric_cols = df.select_dtypes(include='number').columns.tolist()
    if numeric_cols:
        summary.append(f"\n📈 NUMERICAL ANALYSIS:")
        summary.append(str(df[numeric_cols].describe()))
        
        # Correlations if multiple numeric columns
        if len(numeric_cols) > 1:
            summary.append(f"\n🔗 CORRELATIONS:")
            corr_matrix = df[numeric_cols].corr()
            summary.append(str(corr_matrix))
            
            # Create correlation heatmap
            plt.figure(figsize=(10, 8))
            sns.heatmap(corr_matrix, annot=True, cmap='coolwarm', center=0, 
                       square=True, linewidths=1)
            plt.title('Correlation Heatmap')
            plt.tight_layout()
            plt.savefig('correlation_heatmap.png', dpi=150)
            plt.close()
            charts_created.append('correlation_heatmap.png')
    
    # Categorical analysis
    categorical_cols = df.select_dtypes(include=['object']).columns.tolist()
    categorical_cols = [c for c in categorical_cols if 'id' not in c.lower()]
    
    if categorical_cols:
        summary.append(f"\n📊 CATEGORICAL ANALYSIS:")
        for col in categorical_cols[:5]:  # Limit to first 5
            value_counts = df[col].value_counts()
            summary.append(f"\n{col}:")
            for val, count in value_counts.head(10).items():
                pct = (count / len(df)) * 100
                summary.append(f"  • {val}: {count:,} ({pct:.1f}%)")
    
    # Time series analysis
    date_cols = [c for c in df.columns if 'date' in c.lower() or 'time' in c.lower()]
    if date_cols:
        summary.append(f"\n📅 TIME SERIES ANALYSIS:")
        date_col = date_cols[0]
        df[date_col] = pd.to_datetime(df[date_col], errors='coerce')
        
        date_range = df[date_col].max() - df[date_col].min()
        summary.append(f"Date range: {df[date_col].min()} to {df[date_col].max()}")
        summary.append(f"Span: {date_range.days} days")
        
        # Create time-series plots for numeric columns
        if numeric_cols:
            fig, axes = plt.subplots(min(3, len(numeric_cols)), 1, 
                                    figsize=(12, 4 * min(3, len(numeric_cols))))
            if len(numeric_cols) == 1:
                axes = [axes]
            
            for idx, num_col in enumerate(numeric_cols[:3]):
                ax = axes[idx] if len(numeric_cols) > 1 else axes[0]
                daily_data = df.groupby(date_col)[num_col].agg(['mean', 'sum', 'count'])
                daily_data['mean'].plot(ax=ax, label='Average', linewidth=2)
                ax.set_title(f'{num_col} Over Time')
                ax.set_xlabel('Date')
                ax.set_ylabel(num_col)
                ax.legend()
                ax.grid(True, alpha=0.3)
            
            plt.tight_layout()
            plt.savefig('time_series_analysis.png', dpi=150)
            plt.close()
            charts_created.append('time_series_analysis.png')
    
    # Distribution plots for numeric columns
    if numeric_cols:
        n_cols = min(4, len(numeric_cols))
        fig, axes = plt.subplots(2, 2, figsize=(12, 10))
        axes = axes.flatten()
        
        for idx, col in enumerate(numeric_cols[:4]):
            axes[idx].hist(df[col].dropna(), bins=30, edgecolor='black', alpha=0.7)
            axes[idx].set_title(f'Distribution of {col}')
            axes[idx].set_xlabel(col)
            axes[idx].set_ylabel('Frequency')
            axes[idx].grid(True, alpha=0.3)
        
        # Hide unused subplots
        for idx in range(len(numeric_cols[:4]), 4):
            axes[idx].set_visible(False)
        
        plt.tight_layout()
        plt.savefig('distributions.png', dpi=150)
        plt.close()
        charts_created.append('distributions.png')
    
    # Categorical distributions
    if categorical_cols:
        fig, axes = plt.subplots(2, 2, figsize=(14, 10))
        axes = axes.flatten()
        
        for idx, col in enumerate(categorical_cols[:4]):
            value_counts = df[col].value_counts().head(10)
            axes[idx].barh(range(len(value_counts)), value_counts.values)
            axes[idx].set_yticks(range(len(value_counts)))
            axes[idx].set_yticklabels(value_counts.index)
            axes[idx].set_title(f'Top Values in {col}')
            axes[idx].set_xlabel('Count')
            axes[idx].grid(True, alpha=0.3, axis='x')
        
        # Hide unused subplots
        for idx in range(len(categorical_cols[:4]), 4):
            axes[idx].set_visible(False)
        
        plt.tight_layout()
        plt.savefig('categorical_distributions.png', dpi=150)
        plt.close()
        charts_created.append('categorical_distributions.png')
    
    # Summary of visualizations
    if charts_created:
        summary.append(f"\n📊 VISUALIZATIONS CREATED:")
        for chart in charts_created:
            summary.append(f"  ✓ {chart}")
    
    summary.append("\n" + "=" * 60)
    summary.append("✅ COMPREHENSIVE ANALYSIS COMPLETE")
    summary.append("=" * 60)
    
    return "\n".join(summary)


if __name__ == "__main__":
    # Test with sample data
    import sys
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
    else:
        file_path = "resources/sample.csv"
    
    print(summarize_csv(file_path))

