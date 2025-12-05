#!/usr/bin/env python3
"""
Generate images using JSON configuration for precise control and consistency.

Usage:
    python3 generate_from_json.py <config.json>
    python3 generate_from_json.py <config.json> --validate
"""

import sys
import os
import json
import fal_client
import requests
from datetime import datetime
from pathlib import Path

def load_config(config_path):
    """Load and parse JSON configuration file."""
    try:
        with open(config_path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"✗ Config file not found: {config_path}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"✗ Invalid JSON in config file: {e}")
        sys.exit(1)

def validate_config(config):
    """Validate required fields are present."""
    required = ['theme', 'composition', 'colors', 'style', 'technical']
    missing = [field for field in required if field not in config]

    if missing:
        print(f"✗ Missing required fields: {', '.join(missing)}")
        return False

    if 'concept' not in config['theme']:
        print("✗ Missing required field: theme.concept")
        return False

    return True

def build_prompt(config):
    """
    Build detailed prompt from JSON configuration.

    Returns structured prompt with all parameters properly formatted.
    """
    parts = []

    # Theme and concept
    theme = config['theme']
    concept = theme['concept']

    # Start with abstract flowing concept
    if theme.get('visual_metaphor'):
        parts.append(f"Abstract flowing {theme['visual_metaphor']} showing {concept}")
    else:
        parts.append(f"Abstract flowing {concept}")

    # Add flow direction if specified
    if theme.get('flow_direction'):
        flow_map = {
            'left-to-right': 'flowing from left to right',
            'right-to-left': 'flowing from right to left',
            'top-to-bottom': 'flowing from top to bottom',
            'bottom-to-top': 'flowing from bottom to top',
            'diagonal-upper-left-to-lower-right': 'moving diagonally from upper left to lower right',
            'diagonal-upper-right-to-lower-left': 'moving diagonally from upper right to lower left',
            'center-outward': 'radiating outward from center',
            'edges-inward': 'converging inward from edges',
            'circular': 'flowing in circular motion'
        }
        parts.append(flow_map.get(theme['flow_direction'], theme['flow_direction']))

    # Add transformation if specified
    if theme.get('transformation'):
        trans = theme['transformation']
        if trans.get('from') and trans.get('to'):
            parts.append(f"transforming from {trans['from']} to {trans['to']}")
            if trans.get('transition_zone'):
                parts.append(f"with {trans['transition_zone']} in transition zones")

    # Elements (foreground, midground, background)
    if 'elements' in config:
        elem = config['elements']
        if elem.get('background'):
            parts.append(f"{elem['background']} in background")
        if elem.get('midground'):
            parts.append(f"{elem['midground']} in middle layer")
        if elem.get('foreground'):
            parts.append(f"{elem['foreground']} in foreground")
        if elem.get('key_objects'):
            parts.append(f"featuring {', '.join(elem['key_objects'])}")

    # Style elements
    style = config['style']
    parts.append(f"{style.get('shapes', 'soft rounded')} {style.get('forms', 'organic shapes')} throughout")

    # Composition and depth
    comp = config['composition']
    if comp.get('depth_technique'):
        parts.append(f"{comp['depth_technique']} creating depth and dimension")

    if style.get('overlay'):
        parts.append(f"{style['overlay']} surfaces")

    if comp.get('layout'):
        parts.append(f"{comp['layout']} composition")

    if comp.get('visual_flow'):
        parts.append(f"with {comp['visual_flow']}")

    if comp.get('perspective') == 'atmospheric':
        parts.append("atmospheric perspective with foreground elements larger and clearer")

    # Colors
    colors = config['colors']
    primary = colors.get('primary', ['cobalt blue', 'navy blue'])
    accents = colors.get('accents', ['orange', 'burnt orange'])
    transitions = colors.get('transitions', ['purple-gray', 'mauve'])

    parts.append(f"various shades of {' and deeper '.join(primary)}")
    parts.append(f"{' and warm '.join(accents)} accents")
    parts.append(f"{' and '.join(transitions)} transition zones")

    if colors.get('distribution'):
        parts.append(colors['distribution'])

    # Texture
    if style.get('texture') and style['texture'] != 'none':
        parts.append(f"{style['texture']} texture")

    # Aesthetic
    parts.append(f"{style.get('aesthetic', 'contemporary minimalist abstract')} illustration")
    parts.append("professional brand aesthetic")

    # Exclusions
    tech = config['technical']
    exclusions = tech.get('exclusions', ['text', 'numbers', 'letters', 'geometric forms', 'mechanical elements'])

    if 'geometric forms' in exclusions or 'mechanical elements' in exclusions:
        parts.append("no geometric forms or technical mechanical elements")
        parts.append("natural flowing organic forms")

    if any(x in exclusions for x in ['text', 'numbers', 'letters']):
        parts.append("absolutely no text or numbers or letters anywhere in the image")
        parts.append("purely visual abstract representation")

    # Aspect ratio
    aspect = tech.get('aspect_ratio', '16:9')
    orientation = tech.get('orientation', 'landscape')
    parts.append(f"{orientation} orientation {aspect.replace(':', ' by ')} aspect ratio")

    # Join all parts with commas
    prompt = ', '.join(parts)

    return prompt

def get_image_size(config):
    """Map aspect ratio to Fal.ai image_size parameter."""
    tech = config.get('technical', {})

    # Check if explicitly specified
    if 'image_size' in tech:
        return tech['image_size']

    # Map from aspect_ratio and orientation
    aspect = tech.get('aspect_ratio', '16:9')
    orientation = tech.get('orientation', 'landscape')

    size_map = {
        ('landscape', '16:9'): 'landscape_16_9',
        ('landscape', '4:3'): 'landscape_4_3',
        ('portrait', '16:9'): 'portrait_16_9',
        ('portrait', '4:3'): 'portrait_4_3',
        ('square', '1:1'): 'square'
    }

    return size_map.get((orientation, aspect), 'landscape_16_9')

def generate_image(config, prompt):
    """
    Generate image using Fal.ai with built prompt.

    Args:
        config (dict): Full configuration
        prompt (str): Generated prompt text

    Returns:
        dict: Contains image_url, local_path, seed, and config
    """
    print(f"Generating image with Fal.ai Seedream v4...")
    print(f"Prompt: {prompt[:150]}..." if len(prompt) > 150 else f"Prompt: {prompt}")

    try:
        # Prepare API arguments
        api_args = {
            "prompt": prompt,
            "image_size": get_image_size(config),
            "num_images": 1,
            "enable_safety_checker": True
        }

        # Add seed if specified
        if config.get('technical', {}).get('seed'):
            api_args['seed'] = config['technical']['seed']

        # Call Fal.ai API
        result = fal_client.subscribe(
            "fal-ai/bytedance/seedream/v4/text-to-image",
            arguments=api_args
        )

        # Extract results
        image_url = result["images"][0]["url"]
        seed = result.get("seed", "unknown")

        print(f"✓ Image generated successfully")
        print(f"  URL: {image_url}")
        print(f"  Seed: {seed}")

        # Download image
        print(f"Downloading image...")
        local_path = download_image(image_url, seed, config)
        print(f"✓ Saved to: {local_path}")

        # Save config alongside image
        save_config(local_path, config, prompt, seed)

        return {
            "image_url": image_url,
            "local_path": local_path,
            "seed": seed,
            "config": config,
            "prompt": prompt
        }

    except Exception as e:
        print(f"✗ Error generating image: {e}")
        raise

def download_image(url, seed, config):
    """Download image and save with metadata in filename."""
    output_dir = os.path.join(os.path.dirname(__file__), "..", "output")
    os.makedirs(output_dir, exist_ok=True)

    # Build filename
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")

    # Add name from metadata if available
    name_part = ""
    if config.get('metadata', {}).get('name'):
        # Slugify name
        name = config['metadata']['name']
        name_slug = name.lower().replace(' ', '-').replace('_', '-')
        # Keep only alphanumeric and hyphens
        name_slug = ''.join(c for c in name_slug if c.isalnum() or c == '-')
        name_part = f"-{name_slug}"

    filename = f"generated-{timestamp}{name_part}-seed{seed}.png"
    filepath = os.path.join(output_dir, filename)

    # Download
    response = requests.get(url)
    response.raise_for_status()

    with open(filepath, 'wb') as f:
        f.write(response.content)

    return filepath

def save_config(image_path, config, prompt, seed):
    """Save configuration and prompt alongside image for reproducibility."""
    # Create JSON file with same name as image
    config_path = Path(image_path).with_suffix('.json')

    output = {
        "config": config,
        "generated_prompt": prompt,
        "seed": seed,
        "timestamp": datetime.now().isoformat(),
        "model": "fal-ai/bytedance/seedream/v4/text-to-image"
    }

    with open(config_path, 'w') as f:
        json.dump(output, f, indent=2)

    print(f"✓ Config saved to: {config_path}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 generate_from_json.py <config.json>")
        print("       python3 generate_from_json.py <config.json> --validate")
        sys.exit(1)

    config_path = sys.argv[1]
    validate_only = '--validate' in sys.argv

    # Load config
    print(f"Loading config from: {config_path}")
    config = load_config(config_path)

    # Validate
    if not validate_config(config):
        sys.exit(1)

    print("✓ Config validated")

    # Build prompt
    prompt = build_prompt(config)

    if validate_only:
        print("\n" + "="*60)
        print("VALIDATION SUCCESSFUL")
        print("="*60)
        print(f"Generated prompt:\n{prompt}")
        sys.exit(0)

    # Generate image
    try:
        result = generate_image(config, prompt)

        print("\n" + "="*60)
        print("SUCCESS")
        print("="*60)
        print(f"Image URL: {result['image_url']}")
        print(f"Local Path: {result['local_path']}")
        print(f"Seed: {result['seed']}")

        if config.get('metadata'):
            meta = config['metadata']
            if meta.get('name'):
                print(f"Name: {meta['name']}")
            if meta.get('use_case'):
                print(f"Use Case: {meta['use_case']}")

    except Exception as e:
        print("\n" + "="*60)
        print("FAILED")
        print("="*60)
        print(f"Error: {e}")
        sys.exit(1)
