---
name: gemini-flash
description: Uses Google's Gemini 2.5 Flash model when Mike explicitly requests it. ONLY invoke when Mike says "use Gemini", "ask Gemini", or similar explicit requests. Do not invoke for any other reason.
---

# Gemini Flash

Call Google's Gemini 2.5 Flash model for fast, cheap inference.

## When to Use

**Invoke when Mike says**:
- "Use Gemini for..."
- "Ask Gemini..."
- "Try this with Gemini"
- "/gemini [prompt]"

**Do NOT invoke otherwise** - Gemini is another LLM with similar capabilities to Claude.

## Usage

Run the bundled script:

```bash
node /Users/mikerhodes/Projects/brain/.claude/skills/gemini-flash/scripts/gemini.js "your prompt here"
```

The script:
- Loads API key from `$GEMINI_API_KEY` environment variable
- Calls Gemini 2.5 Flash Preview API
- Returns response text with token usage and timing

## List Available Models

```bash
node /Users/mikerhodes/Projects/brain/.claude/skills/gemini-flash/scripts/list-models.js
```

## Output Format

The script outputs:
```
[Gemini's response text]

---
Duration: Xms | Tokens: X in / X out
```

## Error Handling

- **API Key Error**: Ensure `GEMINI_API_KEY` is set in environment
- **404 Model Not Found**: Run list-models.js to check available models
- **Rate Limits**: Gemini has generous free tier but can throttle

## Good For

- Testing Gemini's responses vs Claude
- Fast, cheap inference tasks
- Getting alternative perspectives
- Quick one-shot questions

## Not Ideal For

- Tasks requiring tool use (stateless API calls)
- Multi-turn conversations
- File operations (use Claude directly)
