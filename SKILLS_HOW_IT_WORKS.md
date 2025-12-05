# How Claude Skills Work on Your Dashboard

## Overview

Claude Skills enhance your AI chat assistant by providing specialized knowledge and workflows. When a user asks a question in your dashboard chat, Claude automatically uses relevant skills to provide better, more structured responses.

## The Flow: How It Works

### 1. User Interaction (Frontend)

```
User types in chat: "Analyze my account performance"
    ↓
Frontend sends request to /api/chat
    ↓
POST /api/chat with message and history
```

### 2. Backend Processing (Your API Route)

```
app/api/chat/route.ts receives request
    ↓
getSkillIds() reads SKILL_GOOGLE_ADS_ANALYSIS from .env.local
    ↓
Claude API call includes:
  - System prompt (basic context)
  - Tools (function calling - your Google Ads API functions)
  - Skills (expert knowledge - the Google Ads Analysis skill)
  - User message
    ↓
Claude processes with all three:
  1. Uses skills for expert analysis guidelines
  2. Calls your functions to get real data
  3. Uses system prompt for tone and basic context
    ↓
Returns enhanced response
```

### 3. What Happens Behind the Scenes

**Without Skills:**
- Claude uses system prompt + function calling
- Responses are good but may lack structure
- Analysis might be inconsistent

**With Skills:**
- Claude uses system prompt + function calling + **skills**
- Skills provide:
  - Industry benchmarks (e.g., "ROAS > 4:1 is good")
  - Analysis frameworks (structured approach)
  - Red flag detection (automatic issue spotting)
  - Action recommendations (specific, prioritized)
  - Output formatting (consistent structure)

## Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    USER DASHBOARD                           │
│  User asks: "What's wrong with my account?"                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              app/api/chat/route.ts                          │
│                                                              │
│  1. getSkillIds()                                           │
│     → Reads SKILL_GOOGLE_ADS_ANALYSIS from .env.local      │
│     → Returns: [{ id: 'skill_abc123...' }]                 │
│                                                              │
│  2. Builds Claude API request:                              │
│     {                                                         │
│       model: 'claude-sonnet-4-5',                           │
│       system: systemPrompt,        ← Basic context          │
│       tools: CHAT_FUNCTIONS,        ← Your Google Ads APIs  │
│       skills: [{ id: 'skill_...' }], ← Expert knowledge    │
│       messages: [...]                                         │
│     }                                                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              ANTHROPIC API (Claude)                         │
│                                                              │
│  Claude receives:                                            │
│  ✓ System prompt (tone, basic instructions)                 │
│  ✓ Skills (expert analysis guidelines)                      │
│  ✓ Tools (function calling capabilities)                     │
│  ✓ User message                                              │
│                                                              │
│  Claude's process:                                           │
│  1. Reads skill → "I should analyze ROAS, conversion rate"  │
│  2. Calls function → get_account_metrics()                  │
│  3. Gets data → { spend: $500, conversions: 25, ... }      │
│  4. Uses skill → "ROAS 4.2:1 is good (>4:1 target)"         │
│  5. Uses skill → "Check for red flags: no conversions..."   │
│  6. Formats response using skill guidelines                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              ENHANCED RESPONSE                               │
│                                                              │
│  Instead of:                                                 │
│  "Your account has a ROAS of 4.2:1 which is good."          │
│                                                              │
│  You get:                                                    │
│  "## Executive Summary                                       │
│   Your account shows strong performance with ROAS 4.2:1,    │
│   exceeding the 4:1 target for e-commerce accounts.         │
│                                                              │
│   ## Key Metrics                                             │
│   - ROAS: 4.2:1 (Target: >4:1) ✓                            │
│   - Conversion Rate: 5% (Industry avg: 2-5%) ✓              │
│   - Quality Score: 7.2 (Good) ✓                             │
│                                                              │
│   ## Action Items                                            │
│   1. Monitor Campaign X - ROAS declining                    │
│   2. Increase budget for Campaign Y - performing well       │
│   ..."                                                       │
└──────────────────────────────────────────────────────────────┘
```

## Step-by-Step Setup

### Prerequisites

- ✅ Anthropic API key configured (`ANTHROPIC_API_KEY` in `.env.local`)
- ✅ Your dashboard is running
- ✅ Skills API access (check your Anthropic plan)

### Step 1: Upload the Skill to Anthropic

The skill file exists locally, but Claude needs it uploaded via the API.

**Run the setup script:**

```bash
npx tsx scripts/setup-skills.ts
```

**What this does:**
1. Reads `skills/google-ads-analysis/SKILL.md`
2. Calls Anthropic API to create the skill
3. Anthropic stores the skill and returns a unique ID
4. Script outputs the skill ID

**Expected output:**
```
🚀 Setting up Claude Skills for BeechPPC Agent
============================================================

📝 Creating skill: google-ads-analysis...
   ✓ Found skill file: /path/to/skills/google-ads-analysis/SKILL.md
   ✅ Skill created successfully!
   📋 Skill ID: skill_abc123xyz789...

============================================================

✅ Skill setup complete!

📋 Add these skill IDs to your .env.local file:

SKILL_GOOGLE_ADS_ANALYSIS=skill_abc123xyz789...
```

### Step 2: Add Skill ID to Environment Variables

Copy the skill ID from Step 1 and add it to your `.env.local` file:

```env
# Existing variables
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_ADS_CLIENT_ID=...

# Add this new line:
SKILL_GOOGLE_ADS_ANALYSIS=skill_abc123xyz789...
```

**Important:**
- The skill ID starts with `skill_`
- Copy the entire ID (it's long)
- No quotes needed around the value
- Restart your dev server after adding

### Step 3: Restart Your Development Server

```bash
# Stop your current server (Ctrl+C)
# Then restart:
npm run dev
```

**Why restart?**
- Environment variables are loaded at startup
- The chat route needs to read the new `SKILL_GOOGLE_ADS_ANALYSIS` variable

### Step 4: Test It!

1. Open your dashboard: `http://localhost:3000/chat`
2. Ask a question like:
   - "Analyze my account performance"
   - "What's wrong with my campaigns?"
   - "Give me a performance analysis"
3. You should see:
   - More structured responses
   - Industry benchmarks mentioned
   - Red flags automatically identified
   - Specific action items

## How to Verify It's Working

### Check 1: Environment Variable

```bash
# In your terminal, check if the variable is loaded:
echo $SKILL_GOOGLE_ADS_ANALYSIS

# Or check your .env.local file:
cat .env.local | grep SKILL
```

### Check 2: Server Logs

When you send a chat message, check your server console. You should see:
- The API request being processed
- No errors about missing skill IDs

### Check 3: Response Quality

**Before (without skill):**
```
Your account has a ROAS of 4.2:1. That's pretty good. 
You might want to check some campaigns.
```

**After (with skill):**
```
## Executive Summary
Your account shows strong performance with ROAS 4.2:1, 
exceeding the 4:1 target for e-commerce accounts.

## Key Metrics
| Metric | Value | Benchmark | Status |
|--------|-------|-----------|--------|
| ROAS | 4.2:1 | >4:1 | ✓ Good |
| Conversion Rate | 5% | 2-5% | ✓ Excellent |
| Quality Score | 7.2 | 7+ | ✓ Good |

## Action Items
1. Monitor Campaign X - ROAS declining week-over-week
2. Increase budget for Campaign Y - ROAS 5.1:1, limited by budget
...
```

## Troubleshooting

### Problem: "Skill not found" or no improvement

**Solution:**
1. Verify skill ID in `.env.local` (no typos, full ID)
2. Restart dev server after adding env var
3. Check skill was created: Run setup script again
4. Check API key has Skills API access

### Problem: Setup script fails

**Error: "ANTHROPIC_API_KEY not found"**
- Add `ANTHROPIC_API_KEY` to `.env.local`
- Make sure file is in project root

**Error: "Skill already exists"**
- That's okay! Script will output existing skill ID
- Use that ID in `.env.local`

**Error: "API error" or "Unauthorized"**
- Check your API key is valid
- Verify your Anthropic plan includes Skills API
- Check API key permissions

### Problem: Skills not being used

**Possible causes:**
1. Skill ID not in environment variables
2. Server not restarted after adding env var
3. Skill description doesn't match user queries
4. API doesn't support skills (check your plan)

**Debug:**
- Add console.log in `getSkillIds()` to see if skill ID is found
- Check server logs for errors
- Verify skill ID format (starts with `skill_`)

## How Skills Enhance Responses

### Example: Account Analysis Query

**User asks:** "What's wrong with my account?"

**Without Skill:**
- Claude uses system prompt + function calling
- Gets data: `{ spend: $500, conversions: 0, ROAS: 0 }`
- Response: "Your account has no conversions and is spending $500. This is concerning."

**With Skill:**
- Claude uses system prompt + function calling + **skill**
- Gets same data: `{ spend: $500, conversions: 0, ROAS: 0 }`
- Skill provides:
  - "ROAS < 1:1 is a red flag"
  - "No conversions in 7 days requires immediate attention"
  - "Check conversion tracking first"
  - "Format: Executive Summary → Metrics → Actions"
- Response:
  ```
  ## Executive Summary
  ⚠️ URGENT: Your account shows critical issues with $500/day 
  spend and 0 conversions, resulting in ROAS 0:1.
  
  ## Red Flags Identified
  1. No conversions in last 7 days (check tracking)
  2. ROAS 0:1 (losing money on every click)
  3. High spend with zero return
  
  ## Immediate Actions
  1. **URGENT**: Verify conversion tracking is working
  2. Pause campaigns until tracking is fixed
  3. Review landing pages for conversion issues
  ...
  ```

## Key Points

1. **Skills are automatic**: Once configured, Claude uses them automatically
2. **Skills enhance, don't replace**: They work with function calling and system prompts
3. **Skills are dynamic**: Claude loads them when relevant to the conversation
4. **Skills are optional**: Your chat works without them, but responses are better with them
5. **Skills are composable**: You can add multiple skills for different expertise areas

## Next Steps

1. ✅ Set up the skill (Steps 1-3 above)
2. ✅ Test with real queries
3. 📝 Create more skills (report generation, keyword research, etc.)
4. 🔧 Refine skills based on usage
5. 📊 Monitor response quality improvements

## Summary

**Setup is simple:**
1. Run `npx tsx scripts/setup-skills.ts` → Get skill ID
2. Add `SKILL_GOOGLE_ADS_ANALYSIS=skill_id` to `.env.local`
3. Restart server
4. Done! Skills work automatically

**How it works:**
- User asks question → Chat API → Claude API (with skill) → Enhanced response
- Skill provides expert knowledge, Claude uses it automatically
- No code changes needed for users, works seamlessly

The skill makes your AI assistant smarter by providing it with expert-level knowledge about Google Ads analysis, automatically applied when users ask relevant questions.

