#!/usr/bin/env python3
import sys
import os
import fal_client
import requests
from datetime import datetime

prompt = sys.argv[1] if len(sys.argv) > 1 else "test"

print(f"Generating image with Fal.ai Reve...")
print(f"Prompt: {prompt[:100]}..." if len(prompt) > 100 else f"Prompt: {prompt}")

try:
    result = fal_client.subscribe(
        "fal-ai/reve/text-to-image",
        arguments={
            "prompt": prompt,
            "aspect_ratio": "16:9",
            "num_images": 1
        }
    )
    
    image_url = result["images"][0]["url"]
    
    print(f"✓ Image generated successfully")
    print(f"  URL: {image_url}")
    
    # Download image
    output_dir = os.path.join(os.path.dirname(__file__), "..", "output")
    os.makedirs(output_dir, exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    filename = f"reve-{timestamp}.png"
    filepath = os.path.join(output_dir, filename)
    
    response = requests.get(image_url)
    response.raise_for_status()
    
    with open(filepath, 'wb') as f:
        f.write(response.content)
    
    print(f"✓ Saved to: {filepath}")
    print(f"\nImage URL: {image_url}")
    print(f"Local Path: {filepath}")
    
except Exception as e:
    print(f"✗ Error: {e}")
    sys.exit(1)
