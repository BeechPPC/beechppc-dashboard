// Advanced Copywriting Prompts
// Based on principles from: Eugene Schwartz, David Ogilvy, Claude Hopkins,
// Gary Halbert, John Caples, and modern direct response masters

import type {
  CopyGenerationRequest,
  CopywritingFramework,
  AwarenessLevel,
  MarketSophistication,
  BrandVoice,
} from './types'

/**
 * Generate the main system prompt for Claude
 * This incorporates world-class copywriting principles
 */
export function buildSystemPrompt(): string {
  return `You are an elite Google Ads copywriter with deep expertise in direct response marketing and legendary copywriting principles.

# YOUR EXPERTISE

You draw from the greatest copywriters in history:

## Eugene Schwartz - Breakthrough Advertising
- Understand the 5 stages of customer awareness (unaware → most aware)
- Match copy sophistication to market sophistication (5 stages)
- Lead with the prospect's current state of awareness
- Never create desire, only channel existing desire toward your product

## David Ogilvy - Confessions of an Advertising Man
- "The consumer is not a moron, she's your wife"
- Headlines are critical - 5x more people read headlines than body copy
- Specificity sells - use numbers, facts, concrete details
- Research is paramount - understand the product deeply
- Long copy sells better than short (when needed)

## Claude Hopkins - Scientific Advertising
- Salesmanship in print
- Be specific - "Reduced 19% in 3 weeks" beats "Quick results"
- Show the reason why - don't just make claims, prove them
- Tell the full story - people read if it interests them
- Test everything - advertising is science, not art

## Gary Halbert - The Boron Letters
- Find the "starving crowd" first (market > message > media)
- Lead with the strongest benefit
- Use simple, conversational language
- Build believability through specificity
- Create a slippery slide - each sentence leads to the next

## John Caples - Tested Advertising Methods
- Headlines: News, Curiosity, Self-interest
- Appeal to self-interest in every headline
- Test, test, test - track everything
- Use testimonials and social proof
- Make the offer clear and compelling

## Modern Direct Response Principles
- One clear call-to-action
- Remove friction from the conversion path
- Use power words that trigger emotion
- Create urgency without being manipulative
- Address objections preemptively

# GOOGLE ADS SPECIFIC RULES

## Character Limits (CRITICALLY IMPORTANT - NEVER EXCEED)
- **Headlines: EXACTLY 30 characters maximum** - Count every character including spaces
- **Descriptions: EXACTLY 90 characters maximum** - Count every character including spaces
- These limits are ABSOLUTE and NON-NEGOTIABLE
- Google Ads will REJECT any copy that exceeds these limits
- Better to be 1-2 characters under than risk going over
- DO NOT use tricks like "approx 30 chars" - COUNT PRECISELY

## Best Practices
- Use Title Case for headlines
- Include keywords naturally
- Frontload benefits and key information
- Use active voice
- Avoid excessive punctuation
- No all caps (except acronyms)
- Be clear, not clever (unless brand demands it)
- Every word must earn its place

## Responsive Search Ads Strategy
- Create headlines with diverse approaches (feature, benefit, question, social proof, urgency)
- Ensure headlines work in any combination
- Descriptions should complement, not repeat headlines
- Use pinning strategically (position 1 for brand awareness)
- Aim for "Excellent" ad strength rating

# YOUR TASK

Generate high-performing Google Ads copy that:
1. Matches the prospect's awareness level
2. Stands out in the market's sophistication stage
3. Triggers the right emotions for the audience
4. Follows the specified copywriting framework
5. Aligns with the brand voice
6. Respects Google Ads character limits
7. Incorporates keywords naturally
8. Drives measurable action

# COPY SCORING CRITERIA

Evaluate each piece of copy on:
- **Clarity** (0-100): Can a 12-year-old understand it?
- **Relevance** (0-100): Does it match search intent?
- **Uniqueness** (0-100): Does it stand out from competitors?
- **Persuasiveness** (0-100): Will it drive clicks and conversions?
- **Specificity** (0-100): Concrete facts vs vague claims?
- **Emotional Impact** (0-100): Does it trigger the target emotion?

# OUTPUT FORMAT

Return ONLY valid JSON with this exact structure:
{
  "headlines": [/* array of headline objects */],
  "descriptions": [/* array of description objects */],
  "strategy": {/* strategy object */},
  "recommendations": [/* array of strings */],
  "warnings": [/* array of strings */],
  "testingRecommendations": [/* array of testing objects */]
}

Be ruthlessly specific. Be believably unique. Be persuasively clear.
Remember: You're not writing to win awards. You're writing to sell.`
}

/**
 * Build the user prompt with all context
 */
export function buildCopyGenerationPrompt(request: CopyGenerationRequest): string {
  const {
    productOrService,
    targetAudience,
    brandVoice,
    brandName,
    uniqueSellingProposition,
    copywritingFramework,
    awarenessLevel,
    marketSophistication,
    emotionTriggers,
    keyBenefits,
    features,
    painPoints,
    desiredOutcome,
    competitorInfo,
    objections,
    keywords,
    numberOfVariations,
    copyType,
    includeNumbers,
    includeQuestions,
    tone,
    mustInclude,
    avoidWords,
  } = request

  let prompt = `# COPYWRITING ASSIGNMENT

## WHAT YOU'RE SELLING
${productOrService}

## WHO YOU'RE SELLING TO
${targetAudience}

## BRAND VOICE
${brandVoice}${tone ? ` - ${tone}` : ''}
${brandName ? `Brand Name: ${brandName}` : ''}

## UNIQUE SELLING PROPOSITION
${uniqueSellingProposition || 'Not specified - analyze the product to identify the strongest USP'}

`

  // Strategic Framework
  prompt += `## STRATEGIC FRAMEWORK

**Copywriting Framework**: ${copywritingFramework || 'Choose the most effective framework'}
${getFrameworkGuidance(copywritingFramework)}

**Customer Awareness Level**: ${awarenessLevel || 'Assess from context'}
${getAwarenessGuidance(awarenessLevel)}

**Market Sophistication**: ${marketSophistication || 'Assess from context'}
${getSophisticationGuidance(marketSophistication)}

**Emotion Triggers**: ${emotionTriggers?.join(', ') || 'Choose appropriate emotions'}
${emotionTriggers ? getEmotionGuidance(emotionTriggers) : ''}

`

  // Context
  if (keyBenefits?.length) {
    prompt += `## KEY BENEFITS\n${keyBenefits.map((b, i) => `${i + 1}. ${b}`).join('\n')}\n\n`
  }

  if (features?.length) {
    prompt += `## FEATURES\n${features.map((f, i) => `${i + 1}. ${f}`).join('\n')}\n\n`
  }

  if (painPoints?.length) {
    prompt += `## CUSTOMER PAIN POINTS\n${painPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\n`
  }

  if (desiredOutcome) {
    prompt += `## DESIRED CUSTOMER OUTCOME\n${desiredOutcome}\n\n`
  }

  if (competitorInfo) {
    prompt += `## COMPETITIVE CONTEXT\n${competitorInfo}\n\n`
  }

  if (objections?.length) {
    prompt += `## OBJECTIONS TO ADDRESS\n${objections.map((o, i) => `${i + 1}. ${o}`).join('\n')}\n\n`
  }

  if (keywords?.length) {
    prompt += `## KEYWORDS TO INCORPORATE\n${keywords.join(', ')}\n(Use naturally - don't force)\n\n`
  }

  // Copy Requirements
  prompt += `## COPY REQUIREMENTS

**Type**: ${copyType}
**Number of Variations**: ${numberOfVariations}

`

  if (copyType === 'responsive-search-ad') {
    prompt += `Generate a complete Responsive Search Ad:
- 8-15 headlines (**STRICTLY 30 characters or less each - count precisely**)
- 3-4 descriptions (**STRICTLY 90 characters or less each - count precisely**)
- Diverse approaches (ensure variety)
- Headlines must work in any combination
- Aim for "Excellent" ad strength
- **CRITICAL**: Before submitting, count each character. If ANY headline or description exceeds the limit, shorten it immediately.

`
  } else if (copyType === 'headline') {
    prompt += `Generate ${numberOfVariations} unique headlines (**STRICTLY 30 characters or less each**)
**CRITICAL**: Count each character. No headline can exceed 30 characters.\n\n`
  } else if (copyType === 'description') {
    prompt += `Generate ${numberOfVariations} unique descriptions (**STRICTLY 90 characters or less each**)
**CRITICAL**: Count each character. No description can exceed 90 characters.\n\n`
  }

  // Special Instructions
  const instructions: string[] = []

  if (includeNumbers) {
    instructions.push('Include specific numbers, percentages, or statistics where authentic')
  }

  if (includeQuestions) {
    instructions.push('Include some question-based headlines to trigger curiosity')
  }

  if (mustInclude?.length) {
    instructions.push(`MUST include these phrases: ${mustInclude.join(', ')}`)
  }

  if (avoidWords?.length) {
    instructions.push(`AVOID these words: ${avoidWords.join(', ')}`)
  }

  if (instructions.length > 0) {
    prompt += `## SPECIAL INSTRUCTIONS\n${instructions.map((i, idx) => `${idx + 1}. ${i}`).join('\n')}\n\n`
  }

  // Final Instructions
  prompt += `## YOUR DELIVERABLES

For EACH piece of copy you generate, provide:

1. **The copy itself** (within character limits)
2. **Character count** (must be accurate)
3. **Score breakdown** (clarity, relevance, uniqueness, persuasiveness, specificity, emotional impact)
4. **Copy elements** (has number, question, CTA, etc.)
5. **Framework used** (which copywriting principle)
6. **Emotion trigger** (which emotion it targets)

Additionally provide:

- **Overall Strategy**: Explain your strategic approach and why it's effective for this market
- **Key Messages**: The 3-5 core messages you're communicating
- **Differentiators**: What makes this stand out from competitors
- **Recommendations**: 5-7 tactical recommendations for improving performance
- **Warnings**: Any potential Google Ads policy issues or concerns
- **A/B Testing Recommendations**: 2-3 specific tests to run

## COPYWRITING EXCELLENCE CHECKLIST

Before finalizing, ensure each piece:
- [ ] Is within character limit
- [ ] Uses specific, concrete language (not vague)
- [ ] Triggers emotion appropriately
- [ ] Has a clear benefit or hook
- [ ] Matches the brand voice
- [ ] Incorporates keywords naturally (if applicable)
- [ ] Stands out from generic competitors
- [ ] Passes the "So what?" test
- [ ] Is believable (not hyperbolic)
- [ ] Drives action

Remember the cardinal rules:
1. **Clarity beats cleverness** (unless brand is luxury/creative)
2. **Benefits beat features** (always lead with outcome)
3. **Specific beats vague** (19% vs "significant")
4. **Simple beats complex** (unless targeting academics)
5. **Active beats passive** ("Get" vs "Can be gotten")

Generate copy that would make Eugene Schwartz nod in approval and David Ogilvy smile.`

  return prompt
}

/**
 * Framework-specific guidance
 */
function getFrameworkGuidance(framework?: CopywritingFramework): string {
  if (!framework) return ''

  const guidance: Record<CopywritingFramework, string> = {
    aida: `
**AIDA Framework**:
- Attention: Grab with hook/curiosity/bold claim
- Interest: Build with specific benefits
- Desire: Show transformation/outcome
- Action: Clear, low-friction CTA`,

    pas: `
**Problem-Agitate-Solution**:
- Problem: State the pain clearly
- Agitate: Make it hurt (emotionally resonate)
- Solution: Present your product as relief`,

    fab: `
**Features-Advantages-Benefits**:
- Features: What it is/does
- Advantages: Why that matters
- Benefits: What customer gains (ultimate outcome)`,

    'before-after-bridge': `
**Before-After-Bridge**:
- Before: Current painful state
- After: Desired future state
- Bridge: Your product as the path`,

    '4ps': `
**4 P's (Picture-Promise-Prove-Push)**:
- Picture: Paint vivid image of outcome
- Promise: Make bold but believable claim
- Prove: Provide evidence/credibility
- Push: Strong CTA with urgency`,

    quest: `
**QUEST Formula**:
- Qualify: Identify the right prospect
- Understand: Show you get their problem
- Educate: Teach something valuable
- Stimulate: Create emotional response
- Transition: Move to action`,
  }

  return guidance[framework] || ''
}

/**
 * Awareness level guidance
 */
function getAwarenessGuidance(awareness?: AwarenessLevel): string {
  if (!awareness) return ''

  const guidance: Record<AwarenessLevel, string> = {
    unaware: `
→ Don't mention your product directly
→ Lead with the problem or desire they don't know they have
→ Educate and create awareness first`,

    'problem-aware': `
→ Agitate the problem they know exists
→ Make the pain concrete and urgent
→ Introduce your category as the solution`,

    'solution-aware': `
→ They know solutions exist - explain why yours is different
→ Focus on unique mechanism or approach
→ Compare to other solutions (subtly)`,

    'product-aware': `
→ They know your product - give them reason to act NOW
→ Address final objections
→ Make the offer irresistible`,

    'most-aware': `
→ Just ask for the sale
→ Remind of core benefit
→ Create urgency or scarcity`,
  }

  return guidance[awareness] || ''
}

/**
 * Market sophistication guidance
 */
function getSophisticationGuidance(sophistication?: MarketSophistication): string {
  if (!sophistication) return ''

  const guidance: Record<MarketSophistication, string> = {
    'stage-1': `→ Make the direct claim (if first to market)
→ "This product does X"
→ Simple, bold, direct`,

    'stage-2': `→ Enlarge the claim (competitors exist)
→ "This does X better/faster/cheaper"
→ Comparative advantage`,

    'stage-3': `→ Introduce unique mechanism
→ "This does X through new method Y"
→ Focus on HOW it works differently`,

    'stage-4': `→ Enlarge the mechanism
→ "Our mechanism is superior because Z"
→ Explain why your way is better`,

    'stage-5': `→ Identify with the prospect
→ Market is saturated - focus on experience/identity
→ "For people like you who value X"
→ Lifestyle and identification`,
  }

  return guidance[sophistication] || ''
}

/**
 * Emotion trigger guidance
 */
function getEmotionGuidance(triggers: string[]): string {
  const guidance: Record<string, string> = {
    fear: 'Tap into loss aversion - what they\'ll miss/lose if they don\'t act',
    greed: 'Promise gain, profit, savings - make it quantifiable',
    pride: 'Appeal to status, achievement, being first/best',
    guilt: 'Highlight responsibility or obligation (ethically)',
    love: 'Connect to care, relationships, belonging',
    curiosity: 'Create information gap - make them want to know more',
    anger: 'Channel frustration at current situation into action',
    trust: 'Build safety, reliability, proven track record',
  }

  return triggers
    .map((t) => `- ${t}: ${guidance[t] || ''}`)
    .join('\n')
}

/**
 * Build a concise prompt for quick generation
 */
export function buildQuickPrompt(
  product: string,
  audience: string,
  copyType: string,
  count: number
): string {
  return `Generate ${count} high-performing Google Ads ${copyType} for:

Product/Service: ${product}
Target Audience: ${audience}

Requirements:
- ${copyType === 'headline' ? '30' : '90'} character limit
- Specific, benefit-driven language
- Natural keyword incorporation
- Diverse approaches
- Score each on clarity, relevance, uniqueness, persuasiveness

Return as JSON with headlines/descriptions array, each with: text, characterCount, score, analysis.`
}

/**
 * Voice/tone descriptions for UI
 */
export const BRAND_VOICE_DESCRIPTIONS: Record<BrandVoice, string> = {
  professional: 'Corporate, authoritative, B2B-focused. Think IBM, McKinsey, Salesforce.',
  casual: 'Friendly, conversational, approachable. Think Mailchimp, Slack, Dropbox.',
  creative: 'Bold, playful, unique. Think Oatly, Dollar Shave Club, Cards Against Humanity.',
  luxury: 'Sophisticated, exclusive, premium. Think Rolex, Louis Vuitton, Tesla.',
  urgent: 'Action-oriented, direct, time-sensitive. Think Booking.com, limited offers, events.',
  educational: 'Helpful, informative, expert. Think HubSpot, Coursera, MasterClass.',
}

/**
 * Framework descriptions for UI
 */
export const FRAMEWORK_DESCRIPTIONS: Record<CopywritingFramework, string> = {
  aida: 'Attention → Interest → Desire → Action (Classic, versatile)',
  pas: 'Problem → Agitate → Solution (High urgency, pain-focused)',
  fab: 'Features → Advantages → Benefits (B2B, logical buyers)',
  'before-after-bridge': 'Current state → Desired state → How to get there (Transformation)',
  '4ps': 'Picture → Promise → Prove → Push (High-ticket, considered purchase)',
  quest: 'Qualify → Understand → Educate → Stimulate → Transition (Complex sale)',
}

/**
 * Awareness level descriptions
 */
export const AWARENESS_DESCRIPTIONS: Record<AwarenessLevel, string> = {
  unaware: "Don't know they have a problem (education first)",
  'problem-aware': 'Know the problem, not the solution (agitate pain)',
  'solution-aware': 'Know solutions exist, not yours (differentiate)',
  'product-aware': 'Considering your product (address objections)',
  'most-aware': 'Ready to buy (just ask for sale)',
}

/**
 * Example prompts for testing
 */
export const EXAMPLE_REQUESTS = {
  saas: {
    productOrService: 'Cloud-based project management software for remote teams',
    targetAudience: 'Project managers at mid-size tech companies (50-500 employees)',
    brandVoice: 'professional' as BrandVoice,
    uniqueSellingProposition: 'AI-powered task prioritization that saves 5 hours/week',
    keyBenefits: [
      'Automatic task prioritization based on deadlines and dependencies',
      'Real-time collaboration with async updates',
      'Integrates with 50+ tools',
    ],
    painPoints: [
      'Team members missing deadlines',
      'Unclear task priorities',
      'Scattered communication across multiple tools',
    ],
  },

  ecommerce: {
    productOrService: 'Organic skincare products for sensitive skin',
    targetAudience: 'Women 25-45 with sensitive or acne-prone skin',
    brandVoice: 'casual' as BrandVoice,
    uniqueSellingProposition: 'Dermatologist-formulated with 0 harsh chemicals',
    keyBenefits: [
      'Visible results in 2 weeks',
      'No irritation guaranteed',
      'Cruelty-free and sustainable',
    ],
    painPoints: [
      'Products that irritate skin',
      'Expensive treatments that don\'t work',
      'Complicated skincare routines',
    ],
  },

  local: {
    productOrService: 'Emergency plumbing services',
    targetAudience: 'Homeowners in [City] with urgent plumbing issues',
    brandVoice: 'urgent' as BrandVoice,
    uniqueSellingProposition: '24/7 emergency response - at your door in 60 minutes',
    keyBenefits: [
      'Licensed & insured technicians',
      'Upfront pricing - no hidden fees',
      'Same-day repairs guaranteed',
    ],
    painPoints: [
      'Burst pipes causing water damage',
      'Unreliable plumbers who don\'t show up',
      'Price gouging during emergencies',
    ],
  },
}