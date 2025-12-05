# Claude Skills - Quick Start Guide

## What Was Created

✅ **Sample Skill**: `skills/google-ads-analysis/SKILL.md`
- Comprehensive Google Ads analysis guidelines
- Red flags identification
- Action recommendations
- Industry benchmarks

✅ **Setup Script**: `scripts/setup-skills.ts`
- Uploads skills to Anthropic API
- Outputs skill IDs for configuration

✅ **Chat Integration**: Updated `app/api/chat/route.ts`
- Automatically uses skills when configured
- Works alongside function calling

✅ **Documentation**: 
- `SKILLS_SETUP.md` - Complete setup guide
- `CLAUDE_SKILLS_RESEARCH.md` - Research and background

## Quick Setup (3 Steps)

### Step 1: Upload the Skill

```bash
npx tsx scripts/setup-skills.ts
```

This will output something like:
```
✅ Skill created successfully!
📋 Skill ID: skill_abc123xyz...
```

### Step 2: Add Skill ID to Environment

Add to your `.env.local` file:

```env
SKILL_GOOGLE_ADS_ANALYSIS=skill_abc123xyz...
```

### Step 3: Restart Your Server

```bash
npm run dev
```

That's it! Skills are now active in your chat endpoint.

## How to Test

1. Open your dashboard chat interface
2. Ask a question like: "Analyze my account performance"
3. Claude will use the Google Ads Analysis skill automatically
4. You should see more structured, expert-level analysis

## What Skills Do

Skills enhance Claude's responses by providing:
- **Expert knowledge**: Industry benchmarks, best practices
- **Structured analysis**: Consistent output format
- **Actionable recommendations**: Specific, prioritized actions
- **Red flag detection**: Automatic issue identification

## Next Steps

1. **Test the skill** with real queries
2. **Create more skills** (see `SKILLS_SETUP.md`)
3. **Refine the skill** based on usage
4. **Monitor performance** improvements

## Troubleshooting

**Skill not working?**
- Check `.env.local` has the skill ID
- Verify skill was created (run setup script again)
- Check browser console for errors

**Setup script fails?**
- Ensure `ANTHROPIC_API_KEY` is set in `.env.local`
- Check your API plan supports Skills API
- Verify skill file exists at `skills/google-ads-analysis/SKILL.md`

## Need Help?

- See `SKILLS_SETUP.md` for detailed instructions
- See `CLAUDE_SKILLS_RESEARCH.md` for background information
- Check Anthropic API docs for Skills API details

