#!/usr/bin/env python3
"""
Generate and validate Google Ads sitelinks from CSV data.

This script helps process sitelink data and ensures character limits are met.
"""

import csv
import sys
from typing import Dict, List, Tuple


def validate_sitelink(link_text: str, desc_line1: str, desc_line2: str) -> Tuple[bool, List[str]]:
    """
    Validate sitelink components against Google Ads character limits.
    
    Args:
        link_text: The sitelink link text
        desc_line1: Description line 1
        desc_line2: Description line 2
    
    Returns:
        Tuple of (is_valid, list_of_errors)
    """
    errors = []
    
    if len(link_text) > 25:
        errors.append(f"Link Text too long: {len(link_text)} chars (max 25): '{link_text}'")
    
    if len(desc_line1) > 35:
        errors.append(f"Description Line 1 too long: {len(desc_line1)} chars (max 35): '{desc_line1}'")
    
    if len(desc_line2) > 35:
        errors.append(f"Description Line 2 too long: {len(desc_line2)} chars (max 35): '{desc_line2}'")
    
    return len(errors) == 0, errors


def process_csv(input_file: str, output_file: str = None) -> None:
    """
    Process a CSV file with sitelink data and validate all entries.
    
    Args:
        input_file: Path to input CSV file
        output_file: Optional path to output CSV file with validation results
    """
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    
    print(f"Processing {len(rows)} sitelinks...\n")
    
    valid_count = 0
    invalid_count = 0
    
    results = []
    
    for i, row in enumerate(rows, 1):
        link_text = row.get('Link Text', '').strip()
        desc_line1 = row.get('Description Line 1', '').strip()
        desc_line2 = row.get('Description Line 2', '').strip()
        url = row.get('Final URL', '').strip()
        
        is_valid, errors = validate_sitelink(link_text, desc_line1, desc_line2)
        
        if is_valid:
            valid_count += 1
            status = "✓ VALID"
        else:
            invalid_count += 1
            status = "✗ INVALID"
        
        results.append({
            'row': i,
            'url': url,
            'status': status,
            'link_text': link_text,
            'link_text_len': len(link_text),
            'desc_line1': desc_line1,
            'desc_line1_len': len(desc_line1),
            'desc_line2': desc_line2,
            'desc_line2_len': len(desc_line2),
            'errors': errors
        })
        
        print(f"Row {i}: {status}")
        if url:
            print(f"  URL: {url}")
        print(f"  Link Text ({len(link_text)}/25): {link_text}")
        print(f"  Desc Line 1 ({len(desc_line1)}/35): {desc_line1}")
        print(f"  Desc Line 2 ({len(desc_line2)}/35): {desc_line2}")
        
        if errors:
            print("  Errors:")
            for error in errors:
                print(f"    - {error}")
        print()
    
    print(f"\n{'='*80}")
    print(f"Summary: {valid_count} valid, {invalid_count} invalid out of {len(rows)} total")
    print(f"{'='*80}\n")
    
    if output_file:
        with open(output_file, 'w', encoding='utf-8', newline='') as f:
            fieldnames = ['row', 'status', 'url', 'link_text', 'link_text_len', 
                         'desc_line1', 'desc_line1_len', 'desc_line2', 'desc_line2_len']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            
            for result in results:
                writer.writerow({k: v for k, v in result.items() if k != 'errors'})
        
        print(f"Validation results written to: {output_file}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python validate_sitelinks.py <input_csv> [output_csv]")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    try:
        process_csv(input_file, output_file)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
