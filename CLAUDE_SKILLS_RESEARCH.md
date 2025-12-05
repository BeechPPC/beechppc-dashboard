# Claude Skills Research Report

## Executive Summary

Claude Skills are a powerful new capability that allows you to create specialized instruction sets that Claude can dynamically load to improve performance on specific tasks. Unlike function calling (which you're currently using), Skills provide comprehensive guidelines, examples, and workflows that teach Claude how to perform specialized tasks more effectively.

## What Are Claude Skills?

### Core Concept

**Skills** are folders containing:
- **Instructions** (in `SKILL.md`): Detailed guidelines, examples, and workflows
- **Scripts**: Supporting code or utilities
- **Resources**: Additional files needed for the skill

Skills are:
- **Self-contained**: Each skill lives in its own folder
- **Composable**: Multiple skills can work together
- **Dynamic**: Claude only loads them when relevant to the task
- **Efficient**: Only minimal information is loaded initially

### Key Differences from Function Calling

| Feature | Function Calling (Current) | Claude Skills |
|---------|---------------------------|---------------|
| **Purpose** | Enable Claude to call specific functions | Teach Claude how to perform specialized tasks |
| **Structure** | Function definitions with schemas | Comprehensive instruction sets with examples |
| **Context** | Limited to function descriptions | Rich guidelines, workflows, and best practices |
| **Use Case** | API integrations, data retrieval | Domain expertise, complex workflows, brand guidelines |

## How Skills Work

1. **Discovery**: Claude scans available skills to find relevant matches
2. **Loading**: Only loads minimal information needed initially
3. **Execution**: Uses the skill's instructions to perform the task
4. **Composition**: Can stack multiple skills together for complex tasks

## Skill Structure

### Basic Skill Format

```markdown
---
name: my-skill-name
description: A clear description of what this skill does and when to use it
---

# My Skill Name

[Instructions, examples, and guidelines here]

## Examples
- Example usage 1
- Example usage 2

## Guidelines
- Guideline 1
- Guideline 2
```

### Required Fields

- **`name`**: Unique identifier (lowercase, hyphens for spaces)
- **`description`**: Complete description of what the skill does and when to use it

## Where Skills Can Be Used

1. **Claude Code**: Install via plugin marketplace
2. **Claude.ai**: Available to paid plans (Claude's own dashboard)
3. **Claude API**: Upload custom skills via the Skills API and use them in your own applications

### ✅ YES - Skills CAN Be Used in Your Custom Dashboard!

**Important**: Skills are available via the Anthropic API, which means you can absolutely use them in your Next.js dashboard application. You're already using the Anthropic SDK (`@anthropic-ai/sdk`), so you can integrate Skills the same way.

**How it works:**
- Skills are uploaded/created via the Skills API
- Skills are referenced by ID in your API calls
- You pass skill IDs in the `messages.create()` call
- Claude automatically uses the relevant skills based on the conversation context

## How We Can Utilize Skills in BeechPPC Agent

### Current State Analysis

Your application currently uses:
- **Function Calling**: 8 functions for Google Ads operations
- **System Prompt**: Large prompt with instructions (334-394 lines)
- **Manual Workflows**: Instructions embedded in code

### Opportunities for Skills Integration

#### 1. **Google Ads Analysis Skill**
Create a skill that teaches Claude:
- How to interpret Google Ads metrics
- Best practices for campaign analysis
- Common patterns and red flags
- Industry benchmarks and standards

**Benefits**:
- Move complex analysis logic out of system prompt
- Reusable across different contexts
- Easier to maintain and update

#### 2. **Report Generation Skill**
Create a skill for:
- Report structure and formatting
- Data visualization guidelines
- Email template best practices
- Client communication standards

**Benefits**:
- Consistent report quality
- Brand-aligned formatting
- Standardized communication

#### 3. **Keyword Research Skill**
Enhance keyword research with:
- Keyword grouping strategies
- Search intent analysis
- Competition assessment
- Long-tail keyword identification

**Benefits**:
- Better keyword organization
- More strategic recommendations
- Improved AI analysis

#### 4. **Account Health Monitoring Skill**
Create a skill for:
- Quality assurance workflows
- Policy violation detection
- Conversion tracking validation
- Performance anomaly detection

**Benefits**:
- Proactive issue identification
- Standardized QA processes
- Consistent monitoring

### Implementation Strategy

#### Phase 1: Create Core Skills (Recommended)

1. **`google-ads-analysis`** skill
   - Move analysis guidelines from system prompt
   - Add industry benchmarks
   - Include example analyses

2. **`report-generation`** skill
   - Document report structure
   - Define formatting standards
   - Include template examples

#### Phase 2: Enhanced Skills

3. **`keyword-research`** skill
   - Enhance current keyword research
   - Add grouping strategies
   - Include competition analysis

4. **`account-health`** skill
   - QA workflows
   - Monitoring guidelines
   - Alert thresholds

#### Phase 3: Advanced Skills

5. **`client-communication`** skill
   - Email tone and style
   - Meeting preparation
   - Client update templates

6. **`budget-optimization`** skill
   - Budget allocation strategies
   - Pacing recommendations
   - ROI optimization

## Example Skill Implementation

### Google Ads Analysis Skill

```markdown
---
name: google-ads-analysis
description: Provides expert guidance for analyzing Google Ads account performance, identifying optimization opportunities, and making data-driven recommendations
---

# Google Ads Analysis Skill

This skill provides comprehensive guidelines for analyzing Google Ads account data and providing actionable insights.

## Analysis Framework

When analyzing Google Ads performance, always consider:

1. **ROAS/ROI Analysis**
   - Target ROAS: > 4:1 for most industries
   - Calculate: Revenue / Cost
   - Flag accounts with ROAS < 2:1

2. **Conversion Rate Trends**
   - Industry average: 2-5%
   - Monitor week-over-week changes
   - Identify declining trends early

3. **CPC Analysis**
   - Compare to industry benchmarks
   - Track CPC trends over time
   - Identify sudden spikes

## Red Flags to Identify

- No conversions in last 7 days
- High spend (>$100/day) with ROAS < 1:1
- Disapproved ads requiring attention
- Quality scores < 5
- Conversion tracking not working
- Budget pacing issues (spending too fast/slow)

## Recommended Actions

Based on analysis, suggest specific actions:

- **Low ROAS**: Pause underperforming campaigns, adjust bids, add negative keywords
- **No Conversions**: Check conversion tracking, review landing pages, adjust targeting
- **High CPC**: Refine keywords, improve ad relevance, test new ad copy
- **Disapproved Ads**: Review policy violations, create compliant alternatives

## Example Analysis Output

When presenting analysis:
1. Start with executive summary (2-3 key findings)
2. Provide detailed metrics in tables
3. Include period-over-period comparisons
4. End with 3-5 specific action items

## Industry Benchmarks

- **Average CTR**: 2-5% (Search), 0.5-2% (Display)
- **Average CPC**: $1-5 (varies by industry)
- **Conversion Rate**: 2-5%
- **Quality Score**: 7+ is good, 5-6 is average, <5 needs improvement
```

## Integration with Your Dashboard

### ✅ Skills Work with Your Current Setup!

Since you're using the Anthropic API via `@anthropic-ai/sdk`, you can absolutely use Skills in your dashboard. Here's how:

### Step 1: Create/Upload Skills via API

```typescript
// In your API route or a setup script
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Create a skill
const skill = await anthropic.skills.create({
  name: 'google-ads-analysis',
  description: 'Expert guidance for analyzing Google Ads performance',
  instructions: skillMarkdownContent // The markdown content from SKILL.md
})

// Store the skill ID (you'll need this for API calls)
const skillId = skill.id
```

### Step 2: Use Skills in Your API Calls

Update your `messages.create()` calls to include skills:

```typescript
// In app/api/chat/route.ts
const response = await client.messages.create({
  model: 'claude-sonnet-4-5',
  max_tokens: 4096,
  system: systemPrompt, // You can still use system prompts
  tools: CHAT_FUNCTIONS, // Function calling still works
  skills: [
    { id: 'skill_google_ads_analysis' }, // Reference by skill ID
    { id: 'skill_report_generation' }
  ],
  messages: messages
})
```

### Option 1: Full API Integration (Recommended)

1. **Create Skills via API**: Upload skills using the Skills API
2. **Store Skill IDs**: Save skill IDs in your database or environment variables
3. **Reference in API Calls**: Pass skill IDs in `messages.create()`

**Benefits:**
- Skills are managed centrally
- Easy to update skills without code changes
- Skills are versioned and tracked

### Option 2: Hybrid Approach (Best of Both Worlds)

- **Skills**: For complex analysis, guidelines, and workflows
- **Function Calling**: For API integrations and data retrieval
- **System Prompt**: For basic context and tone

**Example:**
```typescript
const response = await client.messages.create({
  model: 'claude-sonnet-4-5',
  system: 'You are a helpful Google Ads assistant...', // Basic context
  skills: [
    { id: 'skill_google_ads_analysis' }, // Analysis guidelines
    { id: 'skill_report_generation' }    // Report formatting
  ],
  tools: CHAT_FUNCTIONS, // API integrations
  messages: messages
})
```

### Option 3: Local Skills (Development/Testing)

For development, you can:
1. Create a `skills/` directory in your project
2. Store skill markdown files there
3. Upload them via API when needed
4. Or embed skill content in system prompts (less ideal)

### Important Notes

- **Skills complement function calling**: You can use both together
- **Skills don't replace system prompts**: Use both for different purposes
- **Skills are loaded dynamically**: Claude only uses relevant skills
- **Skills are composable**: Multiple skills can work together

## Benefits for Your Application

### 1. **Improved Code Organization**
- Move complex instructions out of system prompts
- Separate concerns (analysis vs. data retrieval)
- Easier to maintain and update

### 2. **Better Performance**
- Claude can focus on relevant skills
- More efficient context usage
- Faster response times

### 3. **Consistency**
- Standardized analysis approaches
- Consistent report formatting
- Uniform client communication

### 4. **Scalability**
- Easy to add new capabilities
- Reusable across different contexts
- Composable for complex workflows

### 5. **Maintainability**
- Skills can be updated independently
- Version control for instructions
- Easier testing and iteration

## Practical Implementation Example

### Example: Adding Skills to Your Chat Endpoint

Here's how you would modify your existing `app/api/chat/route.ts`:

```typescript
// 1. First, create skills (do this once, or in a setup script)
async function setupSkills() {
  const client = getAnthropicClient()
  
  // Create Google Ads Analysis skill
  const analysisSkill = await client.skills.create({
    name: 'google-ads-analysis',
    description: 'Expert guidance for analyzing Google Ads account performance',
    instructions: `# Google Ads Analysis Skill
    
    [Your skill content here...]
    `
  })
  
  // Store skill IDs in environment variables or database
  process.env.SKILL_GOOGLE_ADS_ANALYSIS = analysisSkill.id
  
  return { analysisSkill }
}

// 2. Update your POST handler to use skills
export async function POST(request: NextRequest) {
  try {
    const { message, history = [] }: ChatRequest = await request.json()
    const client = getAnthropicClient()

    // Get skill IDs (from env vars, database, or config)
    const skillIds = [
      process.env.SKILL_GOOGLE_ADS_ANALYSIS,
      process.env.SKILL_REPORT_GENERATION,
    ].filter(Boolean) // Remove undefined values

    // Build messages...
    const messages: Anthropic.MessageParam[] = [
      ...history.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      {
        role: 'user',
        content: message,
      },
    ]

    // Create request with skills
    let response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 4096,
      system: systemPrompt, // Still useful for basic context
      tools: CHAT_FUNCTIONS, // Function calling still works!
      skills: skillIds.map(id => ({ id })), // Add skills here
      messages,
    })

    // Rest of your function calling loop remains the same...
    // Skills work alongside function calling
  } catch (error) {
    // Error handling...
  }
}
```

### Key Points:

1. **Skills work with your existing code**: You don't need to rewrite anything
2. **Skills + Function Calling**: They work together, not instead of each other
3. **Skills + System Prompts**: All three can be used together
4. **Skills are optional**: You can gradually add them without breaking existing functionality

## Next Steps

### Immediate Actions

1. **Check Skills API Availability**: Verify Skills API is available in your Anthropic API plan
2. **Create First Skill**: Start with `google-ads-analysis` skill
3. **Test Integration**: Add one skill to your chat endpoint and test
4. **Refactor Gradually**: Move instructions from system prompt to skills over time

### Short-term (1-2 weeks)

1. Create 2-3 core skills
2. Integrate with API calls
3. Update chat endpoint to use skills
4. Test with real queries
5. Monitor performance improvements

### Long-term (1-2 months)

1. Build comprehensive skill library
2. Create skill management UI (optional)
3. Allow users to customize skills (optional)
4. Monitor and optimize skill usage
5. Create skill templates for common tasks

## Resources

- **GitHub Repository**: https://github.com/anthropics/skills
- **Blog Post**: https://www.claude.com/blog/skills
- **Documentation**: Check Anthropic's developer docs for Skills API
- **Template**: Use the template-skill in the GitHub repo as a starting point

## Conclusion

Claude Skills represent a significant opportunity to improve your AI assistant's capabilities. By moving from a monolithic system prompt to modular, specialized skills, you can:

- Improve code maintainability
- Enhance AI performance
- Create more consistent outputs
- Scale capabilities more easily

The transition can be gradual - start with one or two skills, test them, and expand based on results. Skills complement (rather than replace) function calling, so you can use both together for maximum effectiveness.

