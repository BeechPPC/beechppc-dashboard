#!/usr/bin/env node

/**
 * Copy generated image to Desktop with sensible name and provide link to Useful Slides
 *
 * Usage: node create-slide.js <image-path> [image-name]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const USEFUL_SLIDES_URL = 'https://docs.google.com/presentation/d/1X-G5MIV3R5gJYYqr1TaT1SPJ4Nht-RT8CKObQ5U7zCw/edit';
const DESKTOP_PATH = '/Users/mikerhodes/Desktop';

async function main() {
  const imagePath = process.argv[2];
  let imageName = process.argv[3];

  if (!imagePath) {
    console.error('Usage: node create-slide.js <image-path> [image-name]');
    process.exit(1);
  }

  // Resolve to absolute path
  const absImagePath = path.resolve(imagePath);

  if (!fs.existsSync(absImagePath)) {
    console.error(`Image not found: ${absImagePath}`);
    process.exit(1);
  }

  // Extract name from config filename if not provided
  if (!imageName) {
    const basename = path.basename(absImagePath, path.extname(absImagePath));
    // Try to extract meaningful name from filename like "generated-20251121-105128-end-procrastination-poster-seed752258086"
    const match = basename.match(/generated-\d{8}-\d{6}-(.+)-seed\d+/);
    if (match) {
      imageName = match[1];
    } else {
      imageName = basename;
    }
  }

  // Create desktop filename
  const ext = path.extname(absImagePath);
  const desktopFilename = `${imageName}${ext}`;
  const desktopPath = path.join(DESKTOP_PATH, desktopFilename);

  // Copy to desktop
  fs.copyFileSync(absImagePath, desktopPath);
  console.log(`Image saved to Desktop: ${desktopFilename}`);

  console.log('');
  console.log('============================================================');
  console.log('IMAGE READY FOR SLIDES');
  console.log('============================================================');
  console.log('');
  console.log(`Desktop: ${desktopPath}`);
  console.log('');
  console.log(`Useful Slides: ${USEFUL_SLIDES_URL}`);
  console.log('');
  console.log('Add to slide: Insert → Image → Upload from computer → select from Desktop');
}

main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
