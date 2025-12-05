#!/usr/bin/env python3
"""
Validate Google Ads RSA character limits in CSV files.

This script validates that all headlines, descriptions, and paths meet
Google Ads character limit requirements, accounting for dynamic text insertion.
"""

import csv
import re
import sys
from typing import List, Dict, Tuple


def count_rsa_characters(text: str) -> int:
    """
    Count characters for RSA text, excluding dynamic insertion operators.
    
    {KeyWord:Default}, {LOCATION(City):Default} - only count the default text.
    
    Args:
        text: The RSA text component
        
    Returns:
        Character count
    """
    if not text:
        return 0
    
    # Pattern to match dynamic insertion: {KeyWord:Text} or {LOCATION(X):Text}
    pattern = r'\{[^:]+:([^}]+)\}'
    
    # Replace dynamic insertions with just their default text
    processed = re.sub(pattern, r'\1', text)
    
    return len(processed)


def validate_headline(text: str, position: int) -> Tuple[bool, str]:
    """Validate a headline against RSA requirements."""
    if not text or text.strip() == '':
        return True, ""  # Empty is okay, just won't be used
    
    char_count = count_rsa_characters(text)
    
    if char_count > 30:
        return False, f"Headline {position} exceeds 30 characters: {char_count} chars - '{text}'"
    
    return True, ""


def validate_description(text: str, position: int) -> Tuple[bool, str]:
    """Validate a description against RSA requirements."""
    if not text or text.strip() == '':
        return True, ""  # Empty is okay, just won't be used
    
    char_count = count_rsa_characters(text)
    
    if char_count > 90:
        return False, f"Description {position} exceeds 90 characters: {char_count} chars - '{text}'"
    
    return True, ""


def validate_path(text: str, position: int) -> Tuple[bool, str]:
    """Validate a path against RSA requirements."""
    if not text or text.strip() == '':
        return True, ""  # Empty is okay
    
    char_count = count_rsa_characters(text)
    
    if char_count > 15:
        return False, f"Path {position} exceeds 15 characters: {char_count} chars - '{text}'"
    
    return True, ""


def validate_rsa_row(row: Dict[str, str], row_num: int) -> List[str]:
    """
    Validate all RSA components in a CSV row.
    
    Args:
        row: Dictionary of column values
        row_num: Row number for error reporting
        
    Returns:
        List of error messages (empty if valid)
    """
    errors = []
    
    # Validate headlines (up to 15)
    for i in range(1, 16):
        headline_col = f"Headline {i}"
        if headline_col in row:
            valid, error = validate_headline(row[headline_col], i)
            if not valid:
                errors.append(f"Row {row_num}: {error}")
    
    # Validate descriptions (up to 4)
    for i in range(1, 5):
        desc_col = f"Description {i}"
        if desc_col in row:
            valid, error = validate_description(row[desc_col], i)
            if not valid:
                errors.append(f"Row {row_num}: {error}")
    
    # Validate paths (2)
    for i in range(1, 3):
        path_col = f"Path {i}"
        if path_col in row:
            valid, error = validate_path(row[path_col], i)
            if not valid:
                errors.append(f"Row {row_num}: {error}")
    
    return errors


def validate_csv(input_file: str, output_file: str = None):
    """
    Validate RSA CSV file and optionally write validation report.
    
    Args:
        input_file: Path to input CSV
        output_file: Optional path to write validation report
    """
    errors = []
    row_count = 0
    
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            
            for row_num, row in enumerate(reader, start=2):  # Start at 2 (after header)
                row_count += 1
                row_errors = validate_rsa_row(row, row_num)
                errors.extend(row_errors)
        
        # Print summary
        print(f"\n{'='*60}")
        print(f"Validation Summary")
        print(f"{'='*60}")
        print(f"Total rows validated: {row_count}")
        print(f"Total errors found: {len(errors)}")
        print(f"{'='*60}\n")
        
        if errors:
            print("ERRORS FOUND:\n")
            for error in errors:
                print(f"❌ {error}")
            
            if output_file:
                with open(output_file, 'w', encoding='utf-8') as f:
                    f.write("RSA Validation Report\n")
                    f.write("=" * 60 + "\n\n")
                    f.write(f"Total rows: {row_count}\n")
                    f.write(f"Total errors: {len(errors)}\n\n")
                    f.write("Errors:\n")
                    for error in errors:
                        f.write(f"{error}\n")
                print(f"\n✅ Validation report saved to: {output_file}")
            
            return False
        else:
            print("✅ All RSA components are valid!")
            return True
            
    except FileNotFoundError:
        print(f"❌ Error: File not found: {input_file}")
        return False
    except Exception as e:
        print(f"❌ Error processing file: {str(e)}")
        return False


def main():
    if len(sys.argv) < 2:
        print("Usage: python validate_rsa.py <input_csv> [output_report]")
        print("\nExample:")
        print("  python validate_rsa.py rsa_ads.csv")
        print("  python validate_rsa.py rsa_ads.csv validation_report.txt")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    success = validate_csv(input_file, output_file)
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
