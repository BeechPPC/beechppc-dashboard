---
name: generate-image
description: Generate images using Fal.ai text-to-image models (Seedream v4). Creates abstract illustrations for blog posts, course materials, and presentations. USE WHEN user asks to generate an image, create an illustration, or make visual content.
---

# Generate Image

## Purpose

This skill generates professional abstract illustrations using AI image generation. Useful for creating visual assets for:
- Circle posts and blog content
- Course materials and presentations
- Website imagery
- Social media graphics

## When to Use

**Auto-invoke when:**
- User asks to "generate an image" or "create an illustration"
- User provides an image prompt and asks to generate it
- User says "make an image for [topic]"

**Manual invoke:**
- User explicitly asks to use Fal.ai or Seedream
- User wants to create visual content

## Process

**JSON-based** - Precise control using structured configuration

---

## JSON-Based Workflow (Recommended)

### 1. Determine Requirements

**Check conversation context:**
- What concept should the image represent?
- What's the intended use case? (blog, course, social media)
- Are there specific requirements? (colors, layout, style variations)

**If requirements are clear:**
- Proceed to step 2

**If requirements are NOT clear:**
- Use AskUserQuestion to gather:
  - Core concept/theme
  - Visual metaphor or transformation to show
  - Intended use case
  - Any specific preferences (colors, layout, style)

### 2. Select or Create Configuration

**Option A: Use existing template**
- Browse `configs/` directory for similar use cases:
  - `brand-standard.json` - General purpose baseline
  - `automated-reporting.json` - Transformation/automation themes
  - `knowledge-network.json` - Connections/learning themes
  - `data-flow.json` - Processing/integration themes

**Option B: Create custom config**
- Copy `configs/brand-standard.json` as starting point
- Modify fields based on requirements:
  - `theme.concept` - Core subject matter
  - `theme.visual_metaphor` - How to represent it
  - `theme.flow_direction` - Direction of movement/transformation
  - `elements` - Foreground/midground/background elements
  - `colors.distribution` - How colors are used
  - `metadata` - Name, use case, tags for organization

**Key config sections:**
```json
{
  "theme": {
    "concept": "what the image shows",
    "visual_metaphor": "how it's represented",
    "flow_direction": "left-to-right | center-outward | etc"
  },
  "composition": {
    "layout": "asymmetric | radial | centered",
    "perspective": "atmospheric",
    "depth_technique": "translucent overlapping"
  },
  "colors": {
    "primary": ["cobalt blue", "navy blue"],
    "accents": ["orange", "burnt orange"],
    "distribution": "how colors are used"
  },
  "elements": {
    "foreground": "main elements",
    "midground": "supporting elements",
    "background": "context elements"
  }
}
```

### 3. Generate the Image

Use the JSON-based generator:

```bash
cd /Users/mikerhodes/Projects/brain/.claude/skills/generate-image
python3 scripts/generate_from_json.py configs/<your-config>.json
```

**Validation mode** (test prompt without generating):
```bash
python3 scripts/generate_from_json.py configs/<your-config>.json --validate
```

The script will:
- Load and validate JSON config
- Build detailed prompt from structured parameters
- Call Fal.ai Seedream v4 model
- Download image to `output/` folder
- Save config alongside image for reproducibility

### 4. Prepare Image for Slides

**ALWAYS** copy the image to Desktop and provide link to Useful Slides:

```bash
cd /Users/mikerhodes/Projects/brain/.claude/skills/generate-image
node scripts/create-slide.js <image-path>
```

This will:
- Copy image to Desktop with a sensible name (extracted from config)
- Provide clickable link to Useful Slides presentation
- User can then easily add image to their existing slide deck

### 5. Return Results

Provide the user with:
- Google Slides presentation URL
- Local file path where image was saved
- Image URL (for reference)
- Seed value (for reproducibility)
- Config file path (for future modifications)
- Brief description of the generated image

---

## Requirements

- Fal.ai Python client installed: \`pip3 install fal-client\`
- GitHub authentication: \`fal auth login\` (one-time setup)
- Active Fal.ai account

## Cost

- $0.03 per image generated
- Single image per invocation

## Configuration Files

### Schema
**File:** `references/schema.json`

Defines the complete structure for image generation configs with validation:
- **theme** - Core concept, visual metaphor, flow direction, transformation
- **composition** - Layout, perspective, depth technique, focal point
- **colors** - Palette selection, primary/accent/transition colors, distribution
- **style** - Forms, shapes, texture, overlay, aesthetic, detail level
- **elements** - Foreground/midground/background elements, key objects
- **technical** - Aspect ratio, orientation, exclusions, seed
- **metadata** - Name, use case, tags, notes (optional)

### Example Configs

See `configs/` directory:
- **brand-standard.json** - Baseline template with brand defaults
- **automated-reporting.json** - Assembly line transformation visualization
- **knowledge-network.json** - Interconnected nodes and connections
- **data-flow.json** - Streams converging into processing hub

**To create new config:**
1. Copy `configs/brand-standard.json`
2. Update `metadata.name` and `metadata.use_case`
3. Modify `theme.concept` for your specific subject
4. Adjust `elements` to define what appears where
5. Customize `colors.distribution` if needed
6. Save with descriptive filename in `configs/`

## Best Practices

### JSON Config Tips

**Theme concept:**
- Be specific and visual: describe what's happening, not abstract ideas
- Include transformation or flow if relevant (from X to Y)
- Describe spatial relationships (flowing left to right, radiating outward)
- Use visual metaphors, not literal representations

**Elements distribution:**
- **Foreground:** Main subject, larger and clearer (focal point)
- **Midground:** Supporting elements, connectors, transitions
- **Background:** Context, atmosphere, distant elements

**Color distribution:**
- Describe which colors dominate and which accent
- Example: "blue dominant for data elements, orange for transformation zones"

**Good concept examples:**
- "knowledge network with interconnected nodes spreading outward from center"
- "transformation from scattered puzzle pieces into complete unified picture"
- "data streams flowing and converging into central processing hub"

**Avoid:**
- Generic terms without visual detail ("success", "growth", "innovation")
- Text-heavy concepts that need words to convey meaning
- Too many disconnected elements in one image

### Consistency and Variations

**For consistent series:**
1. Create base config with shared parameters
2. Save with descriptive name (e.g., `automation-series-base.json`)
3. Create variations by copying and modifying only `theme.concept` and `elements`
4. Keep `composition`, `colors`, and `style` identical across series

**For A/B testing:**
1. Start with one config
2. Generate first image and note the seed
3. Create variant config with modified parameter
4. Compare results
5. Refine the better performing config

---

**Version:** 2.0
**Created:** 2025-11-17
**Updated:** 2025-11-18 - JSON schema system with structured configs for precise control
**Model:** fal-ai/bytedance/seedream/v4/text-to-image
