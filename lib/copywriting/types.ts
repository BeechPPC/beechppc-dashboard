// Copywriting Tool Types
// Based on Google Ads specifications and direct response copywriting principles

// Core Copy Types
export type CopyType =
  | 'responsive-search-ad'  // Full RSA with headlines + descriptions
  | 'headline'              // Headlines only
  | 'description'           // Descriptions only
  | 'sitelink'             // Sitelink extensions
  | 'callout'              // Callout extensions
  | 'structured-snippet'   // Structured snippet extensions

// Brand Voice & Tone
export type BrandVoice =
  | 'professional'          // B2B, corporate, authoritative
  | 'casual'                // Friendly, approachable, conversational
  | 'creative'              // Playful, bold, unique
  | 'luxury'                // Premium, exclusive, sophisticated
  | 'urgent'                // Time-sensitive, direct, action-oriented
  | 'educational'           // Informative, helpful, expert

// Copywriting Frameworks (based on legendary copywriters)
export type CopywritingFramework =
  | 'aida'                  // Attention, Interest, Desire, Action (classic)
  | 'pas'                   // Problem, Agitate, Solution
  | 'fab'                   // Features, Advantages, Benefits
  | 'before-after-bridge'   // Current state → desired state → how to get there
  | '4ps'                   // Picture, Promise, Prove, Push
  | 'quest'                 // Qualify, Understand, Educate, Stimulate, Transition

// Customer Awareness Levels (Eugene Schwartz)
export type AwarenessLevel =
  | 'unaware'               // Don't know they have a problem
  | 'problem-aware'         // Know the problem, not the solution
  | 'solution-aware'        // Know solutions exist, not yours specifically
  | 'product-aware'         // Know your product, considering it
  | 'most-aware'            // Ready to buy, need final push

// Market Sophistication (Eugene Schwartz)
export type MarketSophistication =
  | 'stage-1'               // Make the claim (if first to market)
  | 'stage-2'               // Enlarge the claim (competitors exist)
  | 'stage-3'               // Unique mechanism (how it works differently)
  | 'stage-4'               // Enlarge the mechanism (better than others)
  | 'stage-5'               // Identify with prospect (experiential)

// Emotion Triggers
export type EmotionTrigger =
  | 'fear'                  // Fear of loss, missing out
  | 'greed'                 // Desire for gain, profit
  | 'pride'                 // Status, achievement
  | 'guilt'                 // Obligation, responsibility
  | 'love'                  // Care, connection, belonging
  | 'curiosity'             // Mystery, interest
  | 'anger'                 // Frustration, injustice
  | 'trust'                 // Safety, reliability

// CTA Types
export type CTAStyle =
  | 'action-oriented'       // "Get Started", "Try Now"
  | 'benefit-driven'        // "Save 50% Today"
  | 'curiosity-driven'      // "See How", "Discover"
  | 'low-friction'          // "Learn More", "Explore"
  | 'urgency-driven'        // "Limited Time", "Don't Miss Out"

// Main Request Interface
export interface CopyGenerationRequest {
  // Required Core Fields
  productOrService: string          // What you're selling
  targetAudience: string             // Who you're selling to

  // Copy Configuration
  copyType: CopyType
  numberOfVariations: number         // 3-10 variations per type

  // Brand & Voice
  brandVoice: BrandVoice
  brandName?: string
  brandDescription?: string
  uniqueSellingProposition?: string  // Key differentiator

  // Copywriting Strategy
  copywritingFramework?: CopywritingFramework
  awarenessLevel?: AwarenessLevel
  marketSophistication?: MarketSophistication
  emotionTriggers?: EmotionTrigger[]

  // Context & Research
  competitorInfo?: string            // Who you compete with
  keyBenefits?: string[]             // Product benefits
  features?: string[]                // Product features
  painPoints?: string[]              // Customer pain points
  desiredOutcome?: string            // What customer wants to achieve
  objections?: string[]              // Common objections to address

  // Google Ads Specific
  keywords?: string[]                // Keywords to incorporate
  landingPageUrl?: string            // Landing page for context
  accountId?: string                 // Google Ads account
  campaignGoal?: CampaignGoal

  // Advanced Options
  includeNumbers?: boolean           // Include statistics/numbers
  includeQuestions?: boolean         // Use question headlines
  tone?: string                      // Additional tone guidance
  avoidWords?: string[]              // Words to avoid
  mustInclude?: string[]             // Must include phrases

  // A/B Testing
  testingFocus?: TestingFocus        // What to test
}

export type CampaignGoal =
  | 'awareness'
  | 'consideration'
  | 'conversion'
  | 'retention'
  | 'advocacy'

export type TestingFocus =
  | 'emotional-vs-rational'
  | 'feature-vs-benefit'
  | 'short-vs-long'
  | 'question-vs-statement'
  | 'urgency-vs-value'

// Generated Copy Item
export interface GeneratedCopy {
  id: string
  text: string
  type: 'headline' | 'description' | 'sitelink' | 'callout' | 'snippet'

  // Validation
  characterCount: number
  isWithinLimit: boolean

  // Scoring & Analysis
  score: CopyScore

  // Metadata
  framework?: CopywritingFramework
  emotionTrigger?: EmotionTrigger
  ctaStyle?: CTAStyle

  // Google Ads Pinning
  pinPosition?: number               // For RSA pinning

  // Copywriting Elements Present
  hasNumber?: boolean
  hasQuestion?: boolean
  hasCTA?: boolean
  hasEmotionalTrigger?: boolean
  hasSocialProof?: boolean
  hasUrgency?: boolean
  hasSpecificity?: boolean
}

// Copy Scoring (based on direct response principles)
export interface CopyScore {
  overall: number                     // 0-100
  clarity: number                     // Easy to understand
  relevance: number                   // Matches search intent
  uniqueness: number                  // Stands out from competitors
  persuasiveness: number              // Likely to drive action
  specificity: number                 // Concrete vs vague
  emotionalImpact: number             // Emotional resonance
  breakdown: ScoreBreakdown
}

export interface ScoreBreakdown {
  strengths: string[]
  weaknesses: string[]
  improvements: string[]
}

// Responsive Search Ad Structure
export interface ResponsiveSearchAd {
  headlines: GeneratedCopy[]          // 3-15 headlines
  descriptions: GeneratedCopy[]       // 2-4 descriptions
  path1?: string                      // Display URL path
  path2?: string
  finalUrl: string

  // Pinning Strategy
  pinnedHeadlines?: { text: string; position: number }[]
  pinnedDescriptions?: { text: string; position: number }[]

  // Performance Prediction
  strengthRating?: 'Poor' | 'Average' | 'Good' | 'Excellent'
  diversityScore?: number             // How diverse are the combinations
}

// Extension Copy
export interface SitelinkCopy {
  linkText: string                    // 25 chars max
  description1?: string               // 35 chars max
  description2?: string               // 35 chars max
  finalUrl: string
}

export interface CalloutCopy {
  text: string                        // 25 chars max
  category?: string                   // What type of callout
}

export interface StructuredSnippet {
  header: string                      // Predefined by Google
  values: string[]                    // 3-10 values
}

// API Response
export interface CopyGenerationResponse {
  success: boolean
  data?: CopyGenerationResult
  error?: string
  details?: string
}

export interface CopyGenerationResult {
  // Generated Copy
  responsiveSearchAd?: ResponsiveSearchAd
  headlines?: GeneratedCopy[]
  descriptions?: GeneratedCopy[]
  sitelinks?: SitelinkCopy[]
  callouts?: CalloutCopy[]
  structuredSnippets?: StructuredSnippet[]

  // Strategic Insights
  strategy: CopyStrategy

  // Recommendations
  recommendations: string[]
  warnings: string[]                  // Policy violations, etc.

  // A/B Testing Suggestions
  testingRecommendations?: TestingRecommendation[]
}

export interface CopyStrategy {
  framework: CopywritingFramework
  rationale: string                   // Why this approach
  keyMessages: string[]               // Core messages
  differentiators: string[]           // What makes it unique
  emotionalHooks: string[]            // Emotional triggers used
  targetingInsights: string           // Audience insights
}

export interface TestingRecommendation {
  hypothesis: string
  variantA: string
  variantB: string
  whatToMeasure: string
  expectedOutcome: string
}

// Google Ads Constraints
export const GOOGLE_ADS_LIMITS = {
  headline: {
    min: 1,
    max: 30,
    recommended: 15
  },
  description: {
    min: 1,
    max: 90,
    recommended: 60
  },
  sitelinkText: {
    min: 1,
    max: 25
  },
  sitelinkDescription: {
    min: 1,
    max: 35
  },
  callout: {
    min: 1,
    max: 25
  },
  path: {
    min: 1,
    max: 15
  },
  rsa: {
    minHeadlines: 3,
    maxHeadlines: 15,
    minDescriptions: 2,
    maxDescriptions: 4,
    displayedHeadlines: 3,
    displayedDescriptions: 2
  }
} as const

// Preset Configurations for Quick Start
export interface CopywritingPreset {
  name: string
  description: string
  config: Partial<CopyGenerationRequest>
}

export const COPYWRITING_PRESETS: CopywritingPreset[] = [
  {
    name: 'E-commerce Product Launch',
    description: 'New product announcement with urgency and social proof',
    config: {
      copywritingFramework: 'aida',
      awarenessLevel: 'solution-aware',
      marketSophistication: 'stage-3',
      emotionTriggers: ['curiosity', 'greed', 'fear'],
      brandVoice: 'casual',
      includeNumbers: true,
      includeQuestions: false,
      numberOfVariations: 8
    }
  },
  {
    name: 'B2B SaaS Solution',
    description: 'Professional, benefit-driven copy for business software',
    config: {
      copywritingFramework: 'fab',
      awarenessLevel: 'product-aware',
      marketSophistication: 'stage-4',
      emotionTriggers: ['trust', 'greed'],
      brandVoice: 'professional',
      includeNumbers: true,
      includeQuestions: false,
      numberOfVariations: 6
    }
  },
  {
    name: 'Local Service Business',
    description: 'Urgent, action-oriented copy for local services',
    config: {
      copywritingFramework: 'pas',
      awarenessLevel: 'problem-aware',
      marketSophistication: 'stage-2',
      emotionTriggers: ['fear', 'trust'],
      brandVoice: 'urgent',
      includeNumbers: true,
      includeQuestions: true,
      numberOfVariations: 5
    }
  },
  {
    name: 'Luxury Brand',
    description: 'Sophisticated, exclusive copy for premium products',
    config: {
      copywritingFramework: '4ps',
      awarenessLevel: 'most-aware',
      marketSophistication: 'stage-5',
      emotionTriggers: ['pride', 'love'],
      brandVoice: 'luxury',
      includeNumbers: false,
      includeQuestions: false,
      numberOfVariations: 4
    }
  }
]

// Form State
export interface CopywritingFormState {
  // Basic Info
  productOrService: string
  targetAudience: string
  brandName: string

  // Copy Type
  copyType: CopyType
  numberOfVariations: number

  // Brand Voice
  brandVoice: BrandVoice
  tone: string

  // Strategy (Advanced)
  showAdvanced: boolean
  copywritingFramework: CopywritingFramework
  awarenessLevel: AwarenessLevel
  marketSophistication: MarketSophistication
  emotionTriggers: EmotionTrigger[]

  // Context
  uniqueSellingProposition: string
  keyBenefits: string[]
  painPoints: string[]
  competitorInfo: string

  // Options
  includeNumbers: boolean
  includeQuestions: boolean
  keywords: string[]
}

// Validation Errors
export interface CopyValidationError {
  field: keyof CopywritingFormState
  message: string
}

// Saved Copy (for future Prisma model)
export interface SavedCopy {
  id: string
  userId: string
  accountId?: string

  // Request Data
  request: CopyGenerationRequest

  // Results
  results: CopyGenerationResult

  // Metadata
  favorite: boolean
  deployed: boolean
  deployedAt?: Date

  // Timestamps
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
}