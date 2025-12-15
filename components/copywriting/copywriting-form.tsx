'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import {
  PenTool,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Target,
  Zap,
  Brain,
} from 'lucide-react'
import type {
  BrandVoice,
  CopyType,
  CopywritingFramework,
  AwarenessLevel,
  MarketSophistication,
  EmotionTrigger,
  CopywritingFormState,
  CopyGenerationRequest,
  CopyGenerationResponse,
  CopyGenerationResult,
} from '@/lib/copywriting/types'
import {
  BRAND_VOICE_DESCRIPTIONS,
  FRAMEWORK_DESCRIPTIONS,
  AWARENESS_DESCRIPTIONS,
} from '@/lib/copywriting/prompts'
import { COPYWRITING_PRESETS } from '@/lib/copywriting/types'

interface CopywritingFormProps {
  onGenerate: (result: CopyGenerationResult) => void
}

export default function CopywritingForm({ onGenerate }: CopywritingFormProps) {
  const [loading, setLoading] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const [formState, setFormState] = useState<CopywritingFormState>({
    productOrService: '',
    targetAudience: '',
    brandName: '',
    copyType: 'responsive-search-ad',
    numberOfVariations: 8,
    brandVoice: 'professional',
    tone: '',
    showAdvanced: false,
    copywritingFramework: 'aida',
    awarenessLevel: 'solution-aware',
    marketSophistication: 'stage-3',
    emotionTriggers: [],
    uniqueSellingProposition: '',
    keyBenefits: [],
    painPoints: [],
    competitorInfo: '',
    includeNumbers: true,
    includeQuestions: false,
    keywords: [],
  })

  const [errors, setErrors] = useState<Partial<Record<keyof CopywritingFormState, string>>>({})

  // Array input helpers
  const [benefitInput, setBenefitInput] = useState('')
  const [painPointInput, setPainPointInput] = useState('')
  const [keywordInput, setKeywordInput] = useState('')

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CopywritingFormState, string>> = {}

    if (!formState.productOrService.trim()) {
      newErrors.productOrService = 'Product/service description is required'
    }

    if (!formState.targetAudience.trim()) {
      newErrors.targetAudience = 'Target audience is required'
    }

    if (formState.numberOfVariations < 3 || formState.numberOfVariations > 15) {
      newErrors.numberOfVariations = 'Must be between 3 and 15'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)

    try {
      const request: CopyGenerationRequest = {
        productOrService: formState.productOrService,
        targetAudience: formState.targetAudience,
        brandName: formState.brandName || undefined,
        copyType: formState.copyType,
        numberOfVariations: formState.numberOfVariations,
        brandVoice: formState.brandVoice,
        tone: formState.tone || undefined,
        copywritingFramework: formState.copywritingFramework,
        awarenessLevel: formState.awarenessLevel,
        marketSophistication: formState.marketSophistication,
        emotionTriggers: formState.emotionTriggers.length > 0 ? formState.emotionTriggers : undefined,
        uniqueSellingProposition: formState.uniqueSellingProposition || undefined,
        keyBenefits: formState.keyBenefits.length > 0 ? formState.keyBenefits : undefined,
        painPoints: formState.painPoints.length > 0 ? formState.painPoints : undefined,
        competitorInfo: formState.competitorInfo || undefined,
        includeNumbers: formState.includeNumbers,
        includeQuestions: formState.includeQuestions,
        keywords: formState.keywords.length > 0 ? formState.keywords : undefined,
      }

      const response = await fetch('/api/copywriting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })

      const result: CopyGenerationResponse = await response.json()

      if (result.success && result.data) {
        onGenerate(result.data)
      } else {
        window.alert(`Failed to generate copy: ${result.error}`)
      }
    } catch (error) {
      console.error('Error generating copy:', error)
      window.alert('An error occurred while generating copy. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const loadPreset = (presetName: string) => {
    const preset = COPYWRITING_PRESETS.find((p) => p.name === presetName)
    if (!preset) return

    setFormState((prev) => ({
      ...prev,
      copyType: preset.config.copyType || prev.copyType,
      numberOfVariations: preset.config.numberOfVariations || prev.numberOfVariations,
      brandVoice: preset.config.brandVoice || prev.brandVoice,
      copywritingFramework: preset.config.copywritingFramework || prev.copywritingFramework,
      awarenessLevel: preset.config.awarenessLevel || prev.awarenessLevel,
      marketSophistication: preset.config.marketSophistication || prev.marketSophistication,
      emotionTriggers: (preset.config.emotionTriggers as EmotionTrigger[]) || prev.emotionTriggers,
      includeNumbers: preset.config.includeNumbers ?? prev.includeNumbers,
      includeQuestions: preset.config.includeQuestions ?? prev.includeQuestions,
    }))
  }

  const addBenefit = () => {
    if (benefitInput.trim()) {
      setFormState((prev) => ({
        ...prev,
        keyBenefits: [...prev.keyBenefits, benefitInput.trim()],
      }))
      setBenefitInput('')
    }
  }

  const removeBenefit = (index: number) => {
    setFormState((prev) => ({
      ...prev,
      keyBenefits: prev.keyBenefits.filter((_, i) => i !== index),
    }))
  }

  const addPainPoint = () => {
    if (painPointInput.trim()) {
      setFormState((prev) => ({
        ...prev,
        painPoints: [...prev.painPoints, painPointInput.trim()],
      }))
      setPainPointInput('')
    }
  }

  const removePainPoint = (index: number) => {
    setFormState((prev) => ({
      ...prev,
      painPoints: prev.painPoints.filter((_, i) => i !== index),
    }))
  }

  const addKeyword = () => {
    if (keywordInput.trim()) {
      setFormState((prev) => ({
        ...prev,
        keywords: [...prev.keywords, keywordInput.trim()],
      }))
      setKeywordInput('')
    }
  }

  const removeKeyword = (index: number) => {
    setFormState((prev) => ({
      ...prev,
      keywords: prev.keywords.filter((_, i) => i !== index),
    }))
  }

  const toggleEmotionTrigger = (trigger: EmotionTrigger) => {
    setFormState((prev) => ({
      ...prev,
      emotionTriggers: prev.emotionTriggers.includes(trigger)
        ? prev.emotionTriggers.filter((t) => t !== trigger)
        : [...prev.emotionTriggers, trigger],
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Quick Presets */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Start Presets
          </CardTitle>
          <CardDescription>Load proven configurations for common scenarios</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {COPYWRITING_PRESETS.map((preset) => (
              <Button
                key={preset.name}
                type="button"
                variant="outline"
                className="h-auto p-4 flex flex-col items-start gap-1"
                onClick={() => loadPreset(preset.name)}
              >
                <span className="font-medium text-sm">{preset.name}</span>
                <span className="text-xs text-muted text-left">{preset.description}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Core Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5" />
            Core Information
          </CardTitle>
          <CardDescription>Essential details about what you're selling and who to</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Product/Service */}
          <div>
            <Label htmlFor="productOrService">
              Product or Service <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="productOrService"
              placeholder="E.g., Cloud-based project management software for remote teams"
              value={formState.productOrService}
              onChange={(e) =>
                setFormState((prev) => ({ ...prev, productOrService: e.target.value }))
              }
              rows={3}
              className={errors.productOrService ? 'border-destructive' : ''}
            />
            {errors.productOrService && (
              <p className="text-sm text-destructive mt-1">{errors.productOrService}</p>
            )}
          </div>

          {/* Target Audience */}
          <div>
            <Label htmlFor="targetAudience">
              Target Audience <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="targetAudience"
              placeholder="E.g., Project managers at mid-size tech companies (50-500 employees)"
              value={formState.targetAudience}
              onChange={(e) =>
                setFormState((prev) => ({ ...prev, targetAudience: e.target.value }))
              }
              rows={2}
              className={errors.targetAudience ? 'border-destructive' : ''}
            />
            {errors.targetAudience && (
              <p className="text-sm text-destructive mt-1">{errors.targetAudience}</p>
            )}
          </div>

          {/* Brand Name */}
          <div>
            <Label htmlFor="brandName">Brand Name (Optional)</Label>
            <Input
              id="brandName"
              placeholder="E.g., TaskFlow"
              value={formState.brandName}
              onChange={(e) => setFormState((prev) => ({ ...prev, brandName: e.target.value }))}
            />
          </div>

          {/* USP */}
          <div>
            <Label htmlFor="usp">Unique Selling Proposition</Label>
            <Textarea
              id="usp"
              placeholder="What makes you different? E.g., AI-powered task prioritization that saves 5 hours/week"
              value={formState.uniqueSellingProposition}
              onChange={(e) =>
                setFormState((prev) => ({ ...prev, uniqueSellingProposition: e.target.value }))
              }
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Copy Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <PenTool className="h-5 w-5" />
            Copy Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Copy Type */}
            <div>
              <Label htmlFor="copyType">Copy Type</Label>
              <Select
                id="copyType"
                value={formState.copyType}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, copyType: e.target.value as CopyType }))
                }
              >
                <option value="responsive-search-ad">Full Responsive Search Ad</option>
                <option value="headline">Headlines Only</option>
                <option value="description">Descriptions Only</option>
                <option value="sitelink">Sitelink Extensions</option>
                <option value="callout">Callout Extensions</option>
              </Select>
            </div>

            {/* Number of Variations */}
            <div>
              <Label htmlFor="variations">Number of Variations</Label>
              <Input
                id="variations"
                type="number"
                min={3}
                max={15}
                value={formState.numberOfVariations}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    numberOfVariations: parseInt(e.target.value) || 8,
                  }))
                }
                className={errors.numberOfVariations ? 'border-destructive' : ''}
              />
              {errors.numberOfVariations && (
                <p className="text-sm text-destructive mt-1">{errors.numberOfVariations}</p>
              )}
            </div>

            {/* Brand Voice */}
            <div>
              <Label htmlFor="brandVoice">Brand Voice</Label>
              <Select
                id="brandVoice"
                value={formState.brandVoice}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, brandVoice: e.target.value as BrandVoice }))
                }
              >
                {Object.entries(BRAND_VOICE_DESCRIPTIONS).map(([voice, desc]) => (
                  <option key={voice} value={voice}>
                    {voice.charAt(0).toUpperCase() + voice.slice(1)}
                  </option>
                ))}
              </Select>
            </div>

            {/* Additional Tone */}
            <div>
              <Label htmlFor="tone">Additional Tone (Optional)</Label>
              <Input
                id="tone"
                placeholder="E.g., humorous, serious, empathetic"
                value={formState.tone}
                onChange={(e) => setFormState((prev) => ({ ...prev, tone: e.target.value }))}
              />
            </div>
          </div>

          {/* Options */}
          <div className="flex gap-4 flex-wrap">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formState.includeNumbers}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, includeNumbers: e.target.checked }))
                }
                className="rounded"
              />
              <span className="text-sm">Include numbers/stats</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formState.includeQuestions}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, includeQuestions: e.target.checked }))
                }
                className="rounded"
              />
              <span className="text-sm">Include question headlines</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Strategy */}
      <Card>
        <CardHeader className="cursor-pointer" onClick={() => setShowAdvanced(!showAdvanced)}>
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Advanced Copywriting Strategy
            </div>
            {showAdvanced ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </CardTitle>
          <CardDescription>
            Fine-tune based on legendary copywriting frameworks
          </CardDescription>
        </CardHeader>

        {showAdvanced && (
          <CardContent className="space-y-4">
            {/* Framework */}
            <div>
              <Label htmlFor="framework">Copywriting Framework</Label>
              <Select
                id="framework"
                value={formState.copywritingFramework}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    copywritingFramework: e.target.value as CopywritingFramework,
                  }))
                }
              >
                {Object.keys(FRAMEWORK_DESCRIPTIONS).map((framework) => (
                  <option key={framework} value={framework}>
                    {framework.toUpperCase()}
                  </option>
                ))}
              </Select>
            </div>

            {/* Awareness Level */}
            <div>
              <Label htmlFor="awareness">Customer Awareness Level</Label>
              <Select
                id="awareness"
                value={formState.awarenessLevel}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    awarenessLevel: e.target.value as AwarenessLevel,
                  }))
                }
              >
                {Object.keys(AWARENESS_DESCRIPTIONS).map((level) => (
                  <option key={level} value={level}>
                    {level.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </option>
                ))}
              </Select>
            </div>

            {/* Market Sophistication */}
            <div>
              <Label htmlFor="sophistication">Market Sophistication</Label>
              <Select
                id="sophistication"
                value={formState.marketSophistication}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    marketSophistication: e.target.value as MarketSophistication,
                  }))
                }
              >
                <option value="stage-1">Stage 1 - First to Market</option>
                <option value="stage-2">Stage 2 - Better/Faster Claim</option>
                <option value="stage-3">Stage 3 - Unique Mechanism</option>
                <option value="stage-4">Stage 4 - Superior Mechanism</option>
                <option value="stage-5">Stage 5 - Identity/Experience</option>
              </Select>
            </div>

            {/* Emotion Triggers */}
            <div>
              <Label>Emotion Triggers (Select multiple)</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                {['fear', 'greed', 'pride', 'guilt', 'love', 'curiosity', 'anger', 'trust'].map(
                  (emotion) => (
                    <label
                      key={emotion}
                      className="flex items-center gap-2 cursor-pointer text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={formState.emotionTriggers.includes(emotion as EmotionTrigger)}
                        onChange={() => toggleEmotionTrigger(emotion as EmotionTrigger)}
                        className="rounded"
                      />
                      <span className="capitalize">{emotion}</span>
                    </label>
                  )
                )}
              </div>
            </div>

            {/* Key Benefits */}
            <div>
              <Label>Key Benefits</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  placeholder="Add a benefit"
                  value={benefitInput}
                  onChange={(e) => setBenefitInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addBenefit()
                    }
                  }}
                />
                <Button type="button" onClick={addBenefit} variant="outline" size="sm">
                  Add
                </Button>
              </div>
              {formState.keyBenefits.length > 0 && (
                <div className="mt-2 space-y-1">
                  {formState.keyBenefits.map((benefit, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm bg-muted px-3 py-1 rounded"
                    >
                      <span className="flex-1">{benefit}</span>
                      <button
                        type="button"
                        onClick={() => removeBenefit(index)}
                        className="text-muted hover:text-foreground"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pain Points */}
            <div>
              <Label>Customer Pain Points</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  placeholder="Add a pain point"
                  value={painPointInput}
                  onChange={(e) => setPainPointInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addPainPoint()
                    }
                  }}
                />
                <Button type="button" onClick={addPainPoint} variant="outline" size="sm">
                  Add
                </Button>
              </div>
              {formState.painPoints.length > 0 && (
                <div className="mt-2 space-y-1">
                  {formState.painPoints.map((pain, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm bg-muted px-3 py-1 rounded"
                    >
                      <span className="flex-1">{pain}</span>
                      <button
                        type="button"
                        onClick={() => removePainPoint(index)}
                        className="text-muted hover:text-foreground"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Keywords */}
            <div>
              <Label>Target Keywords (Optional)</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  placeholder="Add a keyword"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addKeyword()
                    }
                  }}
                />
                <Button type="button" onClick={addKeyword} variant="outline" size="sm">
                  Add
                </Button>
              </div>
              {formState.keywords.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {formState.keywords.map((keyword, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm bg-primary/10 px-3 py-1 rounded"
                    >
                      <span>{keyword}</span>
                      <button
                        type="button"
                        onClick={() => removeKeyword(index)}
                        className="text-muted hover:text-foreground"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Competitor Info */}
            <div>
              <Label htmlFor="competitors">Competitor Information (Optional)</Label>
              <Textarea
                id="competitors"
                placeholder="Who do you compete with? What do they claim?"
                value={formState.competitorInfo}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, competitorInfo: e.target.value }))
                }
                rows={2}
              />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Generate Button */}
      <div className="flex justify-center">
        <Button type="submit" size="lg" disabled={loading} className="min-w-[200px]">
          {loading ? (
            <>
              <Sparkles className="h-4 w-4 animate-spin" />
              Generating Copy...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate Copy
            </>
          )}
        </Button>
      </div>
    </form>
  )
}