# Claude Skills Directory

This directory contains Claude Skills that enhance the AI assistant's capabilities in the BeechPPC Agent dashboard.

## Structure

Each skill is stored in its own folder with a `SKILL.md` file:

```
skills/
  skill-name/
    SKILL.md
```

## Current Skills

### `google-ads-analysis`

Expert guidance for analyzing Google Ads account performance, identifying optimization opportunities, and making data-driven recommendations.

**Location**: `google-ads-analysis/SKILL.md`

## Creating New Skills

1. Create a new folder: `skills/your-skill-name/`
2. Create `SKILL.md` with YAML frontmatter and instructions
3. Add to `scripts/setup-skills.ts`
4. Run setup script to upload
5. Add skill ID to `.env.local`
6. Update `getSkillIds()` in `app/api/chat/route.ts`

See [SKILLS_SETUP.md](../SKILLS_SETUP.md) for detailed instructions.

