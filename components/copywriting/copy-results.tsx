'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Check,
  Copy,
  AlertTriangle,
  TrendingUp,
  Zap,
  Target,
  Lightbulb,
  BarChart3,
  Star,
  StarOff,
} from 'lucide-react'
import type { CopyGenerationResult, GeneratedCopy, ResponsiveSearchAd } from '@/lib/copywriting/types'

interface CopyResultsProps {
  results: CopyGenerationResult
}

export default function CopyResults({ results }: CopyResultsProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [selectedTab, setSelectedTab] = useState<'all' | 'headlines' | 'descriptions'>('all')

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-success'
    if (score >= 60) return 'text-warning'
    return 'text-destructive'
  }

  const getScoreBg = (score: number): string => {
    if (score >= 80) return 'bg-success/10'
    if (score >= 60) return 'bg-warning/10'
    return 'bg-destructive/10'
  }

  return (
    <div className="space-y-6">
      {/* Strategy Overview */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Strategic Approach
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Copywriting Framework</h4>
            <p className="text-sm text-muted uppercase">{results.strategy.framework}</p>
          </div>

          <div>
            <h4 className="font-medium mb-2">Rationale</h4>
            <p className="text-sm text-muted">{results.strategy.rationale}</p>
          </div>

          {results.strategy.keyMessages.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Key Messages</h4>
              <ul className="text-sm text-muted space-y-1">
                {results.strategy.keyMessages.map((msg, i) => (
                  <li key={i}>• {msg}</li>
                ))}
              </ul>
            </div>
          )}

          {results.strategy.differentiators.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Differentiators</h4>
              <ul className="text-sm text-muted space-y-1">
                {results.strategy.differentiators.map((diff, i) => (
                  <li key={i}>• {diff}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Warnings */}
      {results.warnings && results.warnings.length > 0 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-5 w-5" />
              Warnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {results.warnings.map((warning, i) => (
                <li key={i} className="text-sm text-muted flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* RSA Preview */}
      {results.responsiveSearchAd && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Responsive Search Ad
                </CardTitle>
                <CardDescription>
                  {results.responsiveSearchAd.headlines.length} headlines •{' '}
                  {results.responsiveSearchAd.descriptions.length} descriptions
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">Ad Strength</div>
                <div
                  className={`text-lg font-bold ${
                    results.responsiveSearchAd.strengthRating === 'Excellent'
                      ? 'text-success'
                      : results.responsiveSearchAd.strengthRating === 'Good'
                      ? 'text-primary'
                      : 'text-warning'
                  }`}
                >
                  {results.responsiveSearchAd.strengthRating}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <RSAPreview rsa={results.responsiveSearchAd} onCopy={copyToClipboard} copiedId={copiedId} />
          </CardContent>
        </Card>
      )}

      {/* Copy Variations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            All Copy Variations
          </CardTitle>
          <CardDescription>
            Click to copy individual headlines and descriptions
          </CardDescription>

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            <Button
              variant={selectedTab === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTab('all')}
            >
              All
            </Button>
            {results.headlines && (
              <Button
                variant={selectedTab === 'headlines' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTab('headlines')}
              >
                Headlines ({results.headlines.length})
              </Button>
            )}
            {results.descriptions && (
              <Button
                variant={selectedTab === 'descriptions' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTab('descriptions')}
              >
                Descriptions ({results.descriptions.length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Headlines */}
          {(selectedTab === 'all' || selectedTab === 'headlines') && results.headlines && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted uppercase">Headlines</h4>
              {results.headlines.map((headline) => (
                <CopyItem
                  key={headline.id}
                  copy={headline}
                  isCopied={copiedId === headline.id}
                  onCopy={copyToClipboard}
                />
              ))}
            </div>
          )}

          {/* Descriptions */}
          {(selectedTab === 'all' || selectedTab === 'descriptions') && results.descriptions && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted uppercase mt-6">Descriptions</h4>
              {results.descriptions.map((description) => (
                <CopyItem
                  key={description.id}
                  copy={description}
                  isCopied={copiedId === description.id}
                  onCopy={copyToClipboard}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      {results.recommendations && results.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {results.recommendations.map((rec, i) => (
                <li key={i} className="text-sm text-muted flex items-start gap-2">
                  <TrendingUp className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* A/B Testing Recommendations */}
      {results.testingRecommendations && results.testingRecommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              A/B Testing Ideas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {results.testingRecommendations.map((test, i) => (
              <div key={i} className="p-4 border rounded-lg space-y-2">
                <h4 className="font-medium">{test.hypothesis}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-muted mb-1">Variant A</div>
                    <div className="bg-muted/50 p-2 rounded">{test.variantA}</div>
                  </div>
                  <div>
                    <div className="font-medium text-muted mb-1">Variant B</div>
                    <div className="bg-muted/50 p-2 rounded">{test.variantB}</div>
                  </div>
                </div>
                <div className="text-sm text-muted">
                  <span className="font-medium">Measure:</span> {test.whatToMeasure}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/**
 * Individual copy item with scoring
 */
function CopyItem({
  copy,
  isCopied,
  onCopy,
}: {
  copy: GeneratedCopy
  isCopied: boolean
  onCopy: (text: string, id: string) => void
}) {
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-success'
    if (score >= 60) return 'text-warning'
    return 'text-destructive'
  }

  const getScoreBg = (score: number): string => {
    if (score >= 80) return 'bg-success/10'
    if (score >= 60) return 'bg-warning/10'
    return 'bg-destructive/10'
  }

  return (
    <div className="border rounded-lg p-4 hover:border-primary/50 transition-colors">
      {/* Copy Text */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1">
          <p className="font-medium text-lg">{copy.text}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted">
            <span
              className={copy.isWithinLimit ? 'text-success' : 'text-destructive font-medium'}
            >
              {copy.characterCount} chars
            </span>
            {copy.framework && (
              <span className="uppercase bg-muted px-2 py-0.5 rounded">{copy.framework}</span>
            )}
            {copy.emotionTrigger && (
              <span className="capitalize bg-primary/10 px-2 py-0.5 rounded">
                {copy.emotionTrigger}
              </span>
            )}
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onCopy(copy.text, copy.id)}
          className="flex-shrink-0"
        >
          {isCopied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>

      {/* Overall Score */}
      <div className="flex items-center gap-4 mb-3">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium">Overall Score</span>
            <span className={`text-sm font-bold ${getScoreColor(copy.score.overall)}`}>
              {copy.score.overall}/100
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                copy.score.overall >= 80
                  ? 'bg-success'
                  : copy.score.overall >= 60
                  ? 'bg-warning'
                  : 'bg-destructive'
              }`}
              style={{ width: `${copy.score.overall}%` }}
            />
          </div>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
        {[
          { label: 'Clarity', value: copy.score.clarity },
          { label: 'Relevance', value: copy.score.relevance },
          { label: 'Unique', value: copy.score.uniqueness },
          { label: 'Persuasive', value: copy.score.persuasiveness },
          { label: 'Specific', value: copy.score.specificity },
          { label: 'Emotional', value: copy.score.emotionalImpact },
        ].map((metric) => (
          <div key={metric.label} className={`text-center p-2 rounded ${getScoreBg(metric.value)}`}>
            <div className="text-xs text-muted">{metric.label}</div>
            <div className={`text-sm font-bold ${getScoreColor(metric.value)}`}>{metric.value}</div>
          </div>
        ))}
      </div>

      {/* Copy Elements */}
      <div className="flex flex-wrap gap-2 text-xs">
        {copy.hasNumber && (
          <span className="bg-primary/10 px-2 py-1 rounded flex items-center gap-1">
            <Check className="h-3 w-3" /> Numbers
          </span>
        )}
        {copy.hasQuestion && (
          <span className="bg-primary/10 px-2 py-1 rounded flex items-center gap-1">
            <Check className="h-3 w-3" /> Question
          </span>
        )}
        {copy.hasCTA && (
          <span className="bg-primary/10 px-2 py-1 rounded flex items-center gap-1">
            <Check className="h-3 w-3" /> CTA
          </span>
        )}
        {copy.hasUrgency && (
          <span className="bg-primary/10 px-2 py-1 rounded flex items-center gap-1">
            <Check className="h-3 w-3" /> Urgency
          </span>
        )}
        {copy.hasEmotionalTrigger && (
          <span className="bg-primary/10 px-2 py-1 rounded flex items-center gap-1">
            <Check className="h-3 w-3" /> Emotional
          </span>
        )}
        {copy.hasSocialProof && (
          <span className="bg-primary/10 px-2 py-1 rounded flex items-center gap-1">
            <Check className="h-3 w-3" /> Social Proof
          </span>
        )}
      </div>

      {/* Breakdown */}
      {copy.score.breakdown && (
        <details className="mt-3">
          <summary className="text-sm font-medium cursor-pointer hover:text-primary">
            View Detailed Analysis
          </summary>
          <div className="mt-2 space-y-2 text-sm">
            {copy.score.breakdown.strengths.length > 0 && (
              <div>
                <div className="font-medium text-success mb-1">Strengths</div>
                <ul className="text-muted space-y-1">
                  {copy.score.breakdown.strengths.map((s, i) => (
                    <li key={i}>• {s}</li>
                  ))}
                </ul>
              </div>
            )}
            {copy.score.breakdown.weaknesses.length > 0 && (
              <div>
                <div className="font-medium text-warning mb-1">Weaknesses</div>
                <ul className="text-muted space-y-1">
                  {copy.score.breakdown.weaknesses.map((w, i) => (
                    <li key={i}>• {w}</li>
                  ))}
                </ul>
              </div>
            )}
            {copy.score.breakdown.improvements.length > 0 && (
              <div>
                <div className="font-medium text-primary mb-1">Suggested Improvements</div>
                <ul className="text-muted space-y-1">
                  {copy.score.breakdown.improvements.map((imp, i) => (
                    <li key={i}>• {imp}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </details>
      )}
    </div>
  )
}

/**
 * RSA Preview Component
 */
function RSAPreview({
  rsa,
  onCopy,
  copiedId,
}: {
  rsa: ResponsiveSearchAd
  onCopy: (text: string, id: string) => void
  copiedId: string | null
}) {
  return (
    <div className="space-y-4">
      {/* Ad Preview */}
      <div className="bg-background border-2 border-primary/20 rounded-lg p-4">
        <div className="text-sm text-success mb-1">Ad • example.com</div>
        <div className="text-xl font-medium text-primary mb-2">
          {rsa.headlines[0]?.text || 'Headline 1'} | {rsa.headlines[1]?.text || 'Headline 2'} |{' '}
          {rsa.headlines[2]?.text || 'Headline 3'}
        </div>
        <div className="text-sm text-muted">
          {rsa.descriptions[0]?.text || 'Description 1'}{' '}
          {rsa.descriptions[1]?.text || 'Description 2'}
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-muted rounded-lg">
          <div className="text-2xl font-bold text-primary">{rsa.strengthRating}</div>
          <div className="text-sm text-muted">Ad Strength</div>
        </div>
        <div className="text-center p-3 bg-muted rounded-lg">
          <div className="text-2xl font-bold text-primary">{rsa.diversityScore}%</div>
          <div className="text-sm text-muted">Diversity Score</div>
        </div>
      </div>

      {/* Quick Copy All */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const allHeadlines = rsa.headlines.map((h) => h.text).join('\n')
            onCopy(allHeadlines, 'all-headlines')
          }}
          className="flex-1"
        >
          {copiedId === 'all-headlines' ? (
            <Check className="h-4 w-4 text-success" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          Copy All Headlines
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const allDescriptions = rsa.descriptions.map((d) => d.text).join('\n')
            onCopy(allDescriptions, 'all-descriptions')
          }}
          className="flex-1"
        >
          {copiedId === 'all-descriptions' ? (
            <Check className="h-4 w-4 text-success" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          Copy All Descriptions
        </Button>
      </div>
    </div>
  )
}