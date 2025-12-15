// Google Ads Copy Validation
// Ensures copy meets Google Ads policies and best practices

import {
  GOOGLE_ADS_LIMITS,
  type GeneratedCopy,
  type CopyScore,
  type ScoreBreakdown,
} from './types'

/**
 * Validate character count for copy type
 */
export function validateCharacterLimit(
  text: string,
  type: 'headline' | 'description' | 'sitelink' | 'callout'
): { isValid: boolean; count: number; limit: number } {
  const count = text.length

  const limits: Record<typeof type, number> = {
    headline: GOOGLE_ADS_LIMITS.headline.max,
    description: GOOGLE_ADS_LIMITS.description.max,
    sitelink: GOOGLE_ADS_LIMITS.sitelinkText.max,
    callout: GOOGLE_ADS_LIMITS.callout.max,
  }

  const limit = limits[type]

  return {
    isValid: count <= limit,
    count,
    limit,
  }
}

/**
 * Check for Google Ads policy violations
 */
export interface PolicyViolation {
  type: 'error' | 'warning'
  message: string
  recommendation?: string
}

export function checkPolicyViolations(text: string): PolicyViolation[] {
  const violations: PolicyViolation[] = []

  // Excessive capitalization
  const uppercaseRatio = (text.match(/[A-Z]/g) || []).length / text.length
  if (uppercaseRatio > 0.5 && text.length > 5) {
    violations.push({
      type: 'error',
      message: 'Excessive capitalization detected',
      recommendation: 'Use normal sentence/title case. Only capitalize proper nouns and acronyms.',
    })
  }

  // Excessive punctuation
  const excessivePunctuation = /[!?]{2,}|\.{4,}/
  if (excessivePunctuation.test(text)) {
    violations.push({
      type: 'error',
      message: 'Excessive punctuation (!!!, ...., etc.)',
      recommendation: 'Use single punctuation marks.',
    })
  }

  // Gimmicky repetition
  const repeatedChars = /(.)\1{3,}/
  if (repeatedChars.test(text)) {
    violations.push({
      type: 'error',
      message: 'Gimmicky repeated characters',
      recommendation: 'Remove repeated characters (e.g., "Woooow" → "Wow").',
    })
  }

  // Unnatural spacing
  const unnaturalSpacing = /\s{2,}|[A-Z]\s[A-Z]\s[A-Z]/
  if (unnaturalSpacing.test(text)) {
    violations.push({
      type: 'warning',
      message: 'Unusual spacing detected',
      recommendation: 'Use normal spacing between words.',
    })
  }

  // Symbols in place of words
  const symbolsAsWords = /\b\d+\s*[@#$%&]/
  if (symbolsAsWords.test(text)) {
    violations.push({
      type: 'warning',
      message: 'Symbols used in place of words',
      recommendation: 'Use full words instead of symbols (e.g., "and" instead of "&" in most cases).',
    })
  }

  // Superlative claims without qualification
  const absoluteSuperlatives = /\b(best|#1|guaranteed|always|never|perfect|only)\b/i
  if (absoluteSuperlatives.test(text)) {
    violations.push({
      type: 'warning',
      message: 'Superlative or absolute claim detected',
      recommendation:
        'Ensure claims like "best", "#1", "guaranteed" can be substantiated. Consider adding qualifiers.',
    })
  }

  // Price/discount without qualification
  const pricePattern = /\b(free|(\d+%?\s*(off|discount|save)))\b/i
  if (pricePattern.test(text) && !text.includes('*') && !text.includes('T&C')) {
    violations.push({
      type: 'warning',
      message: 'Price/discount claim may need qualification',
      recommendation: 'Ensure terms and conditions are clear on landing page.',
    })
  }

  // Prohibited content patterns (basic check)
  const prohibitedPatterns = [
    { pattern: /\bcbd\b/i, message: 'CBD products have restrictions' },
    { pattern: /\bcrypto|bitcoin|blockchain\b/i, message: 'Cryptocurrency has strict policies' },
    { pattern: /\bweight loss|lose weight\b/i, message: 'Weight loss claims are highly regulated' },
    {
      pattern: /\bget rich|make money fast\b/i,
      message: 'Get-rich-quick schemes are prohibited',
    },
    { pattern: /\bclick here|click now\b/i, message: 'Generic "click here" is discouraged' },
  ]

  for (const { pattern, message } of prohibitedPatterns) {
    if (pattern.test(text)) {
      violations.push({
        type: 'warning',
        message,
        recommendation: 'Review Google Ads policies for this category carefully.',
      })
    }
  }

  return violations
}

/**
 * Score copy based on direct response principles
 */
export function scoreCopy(
  text: string,
  context: {
    copyType: 'headline' | 'description'
    keywords?: string[]
    targetAudience?: string
    competitors?: string[]
  }
): CopyScore {
  const scores = {
    clarity: scoreClarity(text),
    relevance: scoreRelevance(text, context.keywords || []),
    uniqueness: scoreUniqueness(text, context.competitors || []),
    persuasiveness: scorePersuasiveness(text, context.copyType),
    specificity: scoreSpecificity(text),
    emotionalImpact: scoreEmotionalImpact(text),
  }

  const overall = Object.values(scores).reduce((sum, score) => sum + score, 0) / 6

  const breakdown = generateScoreBreakdown(text, scores, context)

  return {
    overall: Math.round(overall),
    ...scores,
    breakdown,
  }
}

/**
 * Clarity: How easy is it to understand?
 */
function scoreClarity(text: string): number {
  let score = 100

  // Penalize long words (harder to scan)
  const words = text.split(/\s+/)
  const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length
  if (avgWordLength > 7) score -= 15
  if (avgWordLength > 9) score -= 15

  // Penalize jargon (common business jargon)
  const jargon = [
    'synergy',
    'leverage',
    'utilize',
    'paradigm',
    'innovative',
    'solution',
    'optimize',
    'ecosystem',
  ]
  const hasJargon = jargon.some((j) => text.toLowerCase().includes(j))
  if (hasJargon) score -= 20

  // Reward simple, clear language
  const simpleWords = words.filter((w) => w.length <= 5).length / words.length
  score += simpleWords * 10

  // Penalize passive voice indicators
  const passiveIndicators = ['was', 'were', 'been', 'being']
  const hasPassive = passiveIndicators.some((p) => text.toLowerCase().includes(` ${p} `))
  if (hasPassive) score -= 15

  return Math.max(0, Math.min(100, Math.round(score)))
}

/**
 * Relevance: Does it match search intent and include keywords?
 */
function scoreRelevance(text: string, keywords: string[]): number {
  if (keywords.length === 0) return 70 // Default if no keywords provided

  let score = 60

  // Check keyword inclusion (natural, not stuffed)
  const lowerText = text.toLowerCase()
  const includedKeywords = keywords.filter((k) => lowerText.includes(k.toLowerCase()))

  score += (includedKeywords.length / keywords.length) * 40

  // Penalize if keyword is repeated (stuffing)
  for (const keyword of includedKeywords) {
    const count = (lowerText.match(new RegExp(keyword.toLowerCase(), 'g')) || []).length
    if (count > 1) score -= 15
  }

  return Math.max(0, Math.min(100, Math.round(score)))
}

/**
 * Uniqueness: Does it stand out from competitors?
 */
function scoreUniqueness(text: string, competitors: string[]): number {
  if (competitors.length === 0) return 70 // Default if no competitor data

  let score = 100

  // Check for generic phrases
  const genericPhrases = [
    'best',
    'quality',
    'trusted',
    'leading',
    'top',
    'great',
    'excellent',
    'amazing',
    'professional',
    'expert',
  ]

  const lowerText = text.toLowerCase()
  const genericCount = genericPhrases.filter((p) => lowerText.includes(p)).length

  score -= genericCount * 10

  // Check similarity to competitor copy (simple version)
  // In production, you'd use more sophisticated similarity algorithms
  for (const competitor of competitors) {
    const commonWords = competitor
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => lowerText.includes(w) && w.length > 4).length

    if (commonWords > 2) score -= 15
  }

  return Math.max(0, Math.min(100, Math.round(score)))
}

/**
 * Persuasiveness: Will it drive action?
 */
function scorePersuasiveness(text: string, copyType: 'headline' | 'description'): number {
  let score = 50

  const lowerText = text.toLowerCase()

  // Power words (persuasive language)
  const powerWords = [
    'new',
    'proven',
    'guaranteed',
    'results',
    'save',
    'free',
    'exclusive',
    'limited',
    'now',
    'today',
    'discover',
    'secret',
    'reveal',
  ]
  const powerWordCount = powerWords.filter((w) => lowerText.includes(w)).length
  score += Math.min(30, powerWordCount * 10)

  // Has a number (specificity)
  if (/\d+/.test(text)) score += 15

  // Has a benefit indicator
  const benefitWords = ['get', 'save', 'earn', 'gain', 'achieve', 'reduce', 'increase', 'boost']
  if (benefitWords.some((w) => lowerText.includes(w))) score += 10

  // For headlines: questions and curiosity
  if (copyType === 'headline') {
    if (text.includes('?')) score += 10
    if (lowerText.includes('how') || lowerText.includes('why') || lowerText.includes('what'))
      score += 5
  }

  // For descriptions: calls to action
  if (copyType === 'description') {
    const ctas = ['shop', 'buy', 'get', 'start', 'try', 'learn', 'discover', 'see', 'find']
    if (ctas.some((c) => lowerText.includes(c))) score += 15
  }

  // Active voice (verb at start)
  const firstWord = text.split(/\s+/)[0].toLowerCase()
  const actionVerbs = [
    'get',
    'discover',
    'save',
    'find',
    'learn',
    'start',
    'shop',
    'try',
    'see',
    'boost',
    'grow',
    'achieve',
  ]
  if (actionVerbs.includes(firstWord)) score += 10

  return Math.max(0, Math.min(100, Math.round(score)))
}

/**
 * Specificity: Concrete vs vague
 */
function scoreSpecificity(text: string): number {
  let score = 50

  // Has numbers
  const numberCount = (text.match(/\d+/g) || []).length
  score += Math.min(25, numberCount * 15)

  // Has percentages
  if (text.includes('%')) score += 10

  // Has time frames
  const timeFrames = [
    'today',
    'now',
    'minutes',
    'hours',
    'days',
    'weeks',
    'months',
    '24/7',
    'instant',
  ]
  if (timeFrames.some((t) => text.toLowerCase().includes(t))) score += 10

  // Penalize vague words
  const vagueWords = [
    'many',
    'various',
    'several',
    'multiple',
    'some',
    'quality',
    'great',
    'amazing',
    'excellent',
  ]
  const vagueCount = vagueWords.filter((v) => text.toLowerCase().includes(v)).length
  score -= vagueCount * 10

  // Has specific product/feature names
  const hasProperNouns = /[A-Z][a-z]+/.test(text)
  if (hasProperNouns) score += 5

  return Math.max(0, Math.min(100, Math.round(score)))
}

/**
 * Emotional Impact: Does it trigger emotion?
 */
function scoreEmotionalImpact(text: string): number {
  let score = 50

  const lowerText = text.toLowerCase()

  // Emotion trigger words
  const emotionWords = {
    fear: ['risk', 'danger', 'lose', 'miss', 'avoid', 'protect', 'prevent', 'warning'],
    desire: ['want', 'love', 'dream', 'wish', 'deserve', 'imagine'],
    urgency: ['now', 'today', 'limited', 'hurry', 'fast', 'quick', 'instant', 'immediate'],
    trust: ['proven', 'trusted', 'verified', 'certified', 'guaranteed', 'secure', 'safe'],
    curiosity: ['secret', 'reveal', 'discover', 'unknown', 'hidden', 'surprising'],
  }

  for (const [emotion, words] of Object.entries(emotionWords)) {
    const count = words.filter((w) => lowerText.includes(w)).length
    score += Math.min(15, count * 7)
  }

  // Has question (creates curiosity gap)
  if (text.includes('?')) score += 10

  // Has exclamation (shows excitement)
  if (text.includes('!')) score += 5

  // First-person or second-person (creates connection)
  const personalPronouns = ['you', 'your', "you're", 'we', 'our', 'my', 'i']
  if (personalPronouns.some((p) => lowerText.includes(p))) score += 10

  return Math.max(0, Math.min(100, Math.round(score)))
}

/**
 * Generate detailed breakdown
 */
function generateScoreBreakdown(
  text: string,
  scores: Record<string, number>,
  context: any
): ScoreBreakdown {
  const strengths: string[] = []
  const weaknesses: string[] = []
  const improvements: string[] = []

  // Analyze each dimension
  if (scores.clarity >= 75) {
    strengths.push('Clear, easy-to-understand language')
  } else if (scores.clarity < 50) {
    weaknesses.push('Could be clearer - simplify language')
    improvements.push('Use shorter, simpler words')
  }

  if (scores.relevance >= 75) {
    strengths.push('Highly relevant with good keyword usage')
  } else if (scores.relevance < 50) {
    weaknesses.push('Low keyword relevance')
    improvements.push('Incorporate target keywords naturally')
  }

  if (scores.uniqueness >= 75) {
    strengths.push('Stands out from generic competitors')
  } else if (scores.uniqueness < 50) {
    weaknesses.push('Too generic or similar to competitors')
    improvements.push('Add unique value proposition or differentiator')
  }

  if (scores.persuasiveness >= 75) {
    strengths.push('Highly persuasive and action-oriented')
  } else if (scores.persuasiveness < 50) {
    weaknesses.push('Lacks persuasive elements')
    improvements.push('Add power words, numbers, or clear benefits')
  }

  if (scores.specificity >= 75) {
    strengths.push('Specific and concrete (not vague)')
  } else if (scores.specificity < 50) {
    weaknesses.push('Too vague - lacks specificity')
    improvements.push('Add numbers, timeframes, or specific details')
  }

  if (scores.emotionalImpact >= 75) {
    strengths.push('Strong emotional resonance')
  } else if (scores.emotionalImpact < 50) {
    weaknesses.push('Lacks emotional impact')
    improvements.push('Incorporate emotion triggers or personal connection')
  }

  // Specific text analysis
  if (!/\d/.test(text)) {
    improvements.push('Consider adding specific numbers or percentages')
  }

  if (text.split(' ').length < 3 && context.copyType === 'description') {
    improvements.push('Use more of the available character space')
  }

  if (!text.match(/[!?]/)) {
    improvements.push('Consider adding punctuation for emphasis')
  }

  return {
    strengths: strengths.slice(0, 3),
    weaknesses: weaknesses.slice(0, 2),
    improvements: improvements.slice(0, 3),
  }
}

/**
 * Detect copy elements
 */
export function detectCopyElements(text: string): {
  hasNumber: boolean
  hasQuestion: boolean
  hasCTA: boolean
  hasEmotionalTrigger: boolean
  hasSocialProof: boolean
  hasUrgency: boolean
  hasSpecificity: boolean
} {
  const lowerText = text.toLowerCase()

  return {
    hasNumber: /\d+/.test(text),
    hasQuestion: text.includes('?'),
    hasCTA: /\b(get|shop|buy|try|start|learn|discover|save|find)\b/i.test(text),
    hasEmotionalTrigger:
      /\b(love|hate|fear|excited|frustrated|amazing|terrible)\b/i.test(text),
    hasSocialProof: /\b(trusted|proven|rated|#1|award|certified)\b/i.test(text),
    hasUrgency: /\b(now|today|limited|hurry|fast|quick|immediate|ending)\b/i.test(text),
    hasSpecificity: /\d+(%|\s(minutes|hours|days|years))/.test(text),
  }
}

/**
 * Validate RSA requirements
 */
export function validateRSA(headlines: string[], descriptions: string[]): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  // Check minimum requirements
  if (headlines.length < GOOGLE_ADS_LIMITS.rsa.minHeadlines) {
    errors.push(`Need at least ${GOOGLE_ADS_LIMITS.rsa.minHeadlines} headlines`)
  }

  if (descriptions.length < GOOGLE_ADS_LIMITS.rsa.minDescriptions) {
    errors.push(`Need at least ${GOOGLE_ADS_LIMITS.rsa.minDescriptions} descriptions`)
  }

  // Check maximum
  if (headlines.length > GOOGLE_ADS_LIMITS.rsa.maxHeadlines) {
    errors.push(`Maximum ${GOOGLE_ADS_LIMITS.rsa.maxHeadlines} headlines allowed`)
  }

  if (descriptions.length > GOOGLE_ADS_LIMITS.rsa.maxDescriptions) {
    errors.push(`Maximum ${GOOGLE_ADS_LIMITS.rsa.maxDescriptions} descriptions allowed`)
  }

  // Check character limits
  headlines.forEach((h, i) => {
    if (h.length > GOOGLE_ADS_LIMITS.headline.max) {
      errors.push(`Headline ${i + 1} exceeds ${GOOGLE_ADS_LIMITS.headline.max} characters`)
    }
  })

  descriptions.forEach((d, i) => {
    if (d.length > GOOGLE_ADS_LIMITS.description.max) {
      errors.push(`Description ${i + 1} exceeds ${GOOGLE_ADS_LIMITS.description.max} characters`)
    }
  })

  // Check diversity (simple check for duplicates)
  const uniqueHeadlines = new Set(headlines.map((h) => h.toLowerCase()))
  if (uniqueHeadlines.size < headlines.length) {
    warnings.push('Some headlines are duplicates - ensure variety')
  }

  const uniqueDescriptions = new Set(descriptions.map((d) => d.toLowerCase()))
  if (uniqueDescriptions.size < descriptions.length) {
    warnings.push('Some descriptions are duplicates - ensure variety')
  }

  // Check length diversity
  const headlineLengths = headlines.map((h) => h.length)
  const lengthVariation =
    Math.max(...headlineLengths) - Math.min(...headlineLengths)
  if (lengthVariation < 10) {
    warnings.push('Headlines are similar lengths - vary short and long for better performance')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}