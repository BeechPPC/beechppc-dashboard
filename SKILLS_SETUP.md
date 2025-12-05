# Claude Skills Setup Guide

This guide explains how to set up and use Claude Skills in the BeechPPC Agent dashboard.

## Overview

Claude Skills enhance your AI assistant by providing specialized knowledge and workflows. Skills work alongside function calling and system prompts to improve Claude's performance on specific tasks.

## Quick Start

### 1. Create Skills

Skills are stored in the `skills/` directory. Each skill has its own folder with a `SKILL.md` file.

Example structure:
```
skills/
  google-ads-analysis/
    SKILL.md
```

### 2. Upload Skills to Anthropic

Run the setup script to create skills via the API:

```bash
npx tsx scripts/setup-skills.ts
```

This script will:
- Read skill files from `skills/` directory
- Create skills via Anthropic API
- Output skill IDs that you need to add to your `.env.local` file

### 3. Configure Environment Variables

Add the skill IDs to your `.env.local` file:

```env
# Claude Skills
SKILL_GOOGLE_ADS_ANALYSIS=skill_abc123xyz...
```

### 4. Use Skills in Your Application

Skills are automatically used in the chat endpoint (`app/api/chat/route.ts`) when skill IDs are configured. The chat endpoint will:

- Load skills from environment variables
- Pass skills to Claude API calls
- Use skills alongside function calling and system prompts

## Current Skills

### Google Ads Analysis Skill

**Purpose**: Provides expert guidance for analyzing Google Ads account performance

**Location**: `skills/google-ads-analysis/SKILL.md`

**What it does**:
- Provides analysis frameworks for ROAS, conversion rates, CPC
- Identifies red flags and issues
- Suggests specific actions based on problems
- Provides industry benchmarks
- Structures analysis output consistently

**When it's used**: Automatically when users ask about account analysis, performance metrics, or optimization recommendations.

## Adding New Skills

### Step 1: Create Skill File

1. Create a new folder in `skills/` directory
2. Create a `SKILL.md` file with this structure:

```markdown
---
name: your-skill-name
description: A clear description of what this skill does
---

# Your Skill Name

[Your instructions, examples, and guidelines here]

## Examples
- Example usage 1
- Example usage 2

## Guidelines
- Guideline 1
- Guideline 2
```

### Step 2: Add to Setup Script

Edit `scripts/setup-skills.ts` and add your skill to the `skillsToCreate` array:

```typescript
const skillsToCreate: SkillConfig[] = [
  {
    name: 'google-ads-analysis',
    description: '...',
    filePath: join(process.cwd(), 'skills', 'google-ads-analysis', 'SKILL.md'),
  },
  {
    name: 'your-new-skill',
    description: 'Description of your skill',
    filePath: join(process.cwd(), 'skills', 'your-new-skill', 'SKILL.md'),
  },
]
```

### Step 3: Update Chat Route

Edit `app/api/chat/route.ts` and add your skill ID to the `getSkillIds()` function:

```typescript
function getSkillIds(): Array<{ id: string }> {
  const skillIds: Array<{ id: string }> = []
  
  const googleAdsAnalysisSkillId = process.env.SKILL_GOOGLE_ADS_ANALYSIS
  if (googleAdsAnalysisSkillId) {
    skillIds.push({ id: googleAdsAnalysisSkillId })
  }
  
  // Add your new skill
  const yourNewSkillId = process.env.SKILL_YOUR_NEW_SKILL
  if (yourNewSkillId) {
    skillIds.push({ id: yourNewSkillId })
  }
  
  return skillIds
}
```

### Step 4: Run Setup and Configure

1. Run `npx tsx scripts/setup-skills.ts`
2. Add the skill ID to `.env.local`
3. Restart your development server

## How Skills Work

### Skills vs Function Calling vs System Prompts

- **Skills**: Provide domain expertise, workflows, and best practices
- **Function Calling**: Enable Claude to call your APIs and retrieve data
- **System Prompts**: Provide basic context and tone

**All three work together!** Skills enhance Claude's knowledge, function calling gives it capabilities, and system prompts provide context.

### When Skills Are Used

Claude automatically uses relevant skills based on:
- The user's question/task
- The skill's description
- The conversation context

You don't need to manually activate skills - Claude loads them dynamically when needed.

## Troubleshooting

### Skills Not Working

1. **Check skill IDs are set**: Verify `.env.local` has skill IDs configured
2. **Verify skills exist**: Run `npx tsx scripts/setup-skills.ts` to check/create skills
3. **Check API key**: Ensure `ANTHROPIC_API_KEY` is valid
4. **Check API support**: Verify your Anthropic API plan supports Skills API

### Skill Creation Fails

- **Already exists**: If a skill with the same name exists, the script will skip it
- **Invalid format**: Ensure your `SKILL.md` has proper YAML frontmatter
- **API errors**: Check your API key and rate limits

### Skills Not Being Used

- Skills are loaded dynamically - Claude decides when to use them
- Ensure skill descriptions clearly indicate when they should be used
- Check that your questions/tasks match the skill's purpose

## Best Practices

1. **Keep skills focused**: Each skill should have a clear, specific purpose
2. **Use descriptive names**: Skill names should clearly indicate their purpose
3. **Write clear descriptions**: The description helps Claude know when to use the skill
4. **Provide examples**: Include examples in your skill to guide Claude
5. **Update skills regularly**: Refine skills based on how Claude uses them

## Example: Creating a Report Generation Skill

```markdown
---
name: report-generation
description: Guidelines for generating professional Google Ads performance reports for BeechPPC clients
---

# Report Generation Skill

## Report Structure
1. Executive Summary
2. Key Metrics
3. Campaign Performance
4. Recommendations

## Formatting Guidelines
- Use tables for metrics
- Include charts for trends
- Highlight key findings
...
```

Then:
1. Add to `scripts/setup-skills.ts`
2. Run setup script
3. Add `SKILL_REPORT_GENERATION=skill_id` to `.env.local`
4. Update `getSkillIds()` in chat route

## Resources

- [Claude Skills Research](./CLAUDE_SKILLS_RESEARCH.md) - Detailed research on Skills
- [Anthropic Skills GitHub](https://github.com/anthropics/skills) - Official Skills repository
- [Anthropic API Docs](https://docs.anthropic.com) - API documentation

