#!/usr/bin/env python3
"""
Generate images using Fal.ai Seedream v4 text-to-image model.

Usage:
    python3 generate.py "<prompt_text>"
"""

import sys
import os
import fal_client
import requests
from datetime import datetime

def generate_image(prompt):
    """
    Generate a single image using Fal.ai Seedream v4.

    Args:
        prompt (str): Text description for image generation

    Returns:
        dict: Contains image_url, local_path, and seed
    """

    print(f"Generating image with Fal.ai Seedream v4...")
    print(f"Prompt: {prompt[:100]}..." if len(prompt) > 100 else f"Prompt: {prompt}")

    try:
        # Call Fal.ai API
        result = fal_client.subscribe(
            "fal-ai/bytedance/seedream/v4/text-to-image",
            arguments={
                "prompt": prompt,
                "image_size": "landscape_16_9",  # 16:9 aspect ratio
                "num_images": 1,
                "enable_safety_checker": True
            }
        )

        # Extract image URL and seed
        image_url = result["images"][0]["url"]
        seed = result.get("seed", "unknown")

        print(f"✓ Image generated successfully")
        print(f"  URL: {image_url}")
        print(f"  Seed: {seed}")

        # Download image
        print(f"Downloading image...")
        local_path = download_image(image_url, seed)
        print(f"✓ Saved to: {local_path}")

        return {
            "image_url": image_url,
            "local_path": local_path,
            "seed": seed
        }

    except Exception as e:
        print(f"✗ Error generating image: {e}")
        raise

def download_image(url, seed):
    """
    Download image from URL and save locally.

    Args:
        url (str): Image URL
        seed (str|int): Seed value for filename

    Returns:
        str: Local file path
    """
    # Create output directory if it doesn't exist
    output_dir = os.path.join(os.path.dirname(__file__), "..", "output")
    os.makedirs(output_dir, exist_ok=True)

    # Generate filename with timestamp and seed
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    filename = f"generated-{timestamp}-seed{seed}.png"
    filepath = os.path.join(output_dir, filename)

    # Download image
    response = requests.get(url)
    response.raise_for_status()

    with open(filepath, 'wb') as f:
        f.write(response.content)

    return filepath

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 generate.py \"<prompt_text>\"")
        sys.exit(1)

    prompt = sys.argv[1]

    try:
        result = generate_image(prompt)
        print("\n" + "="*60)
        print("SUCCESS")
        print("="*60)
        print(f"Image URL: {result['image_url']}")
        print(f"Local Path: {result['local_path']}")
        print(f"Seed: {result['seed']}")

    except Exception as e:
        print("\n" + "="*60)
        print("FAILED")
        print("="*60)
        print(f"Error: {e}")
        sys.exit(1)
