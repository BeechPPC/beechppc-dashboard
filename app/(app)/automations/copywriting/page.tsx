'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PenTool, Sparkles, ArrowLeft, BookOpen } from 'lucide-react'
import CopywritingForm from '@/components/copywriting/copywriting-form'
import CopyResults from '@/components/copywriting/copy-results'
import type { CopyGenerationResult } from '@/lib/copywriting/types'

export default function CopywritingPage() {
  const [results, setResults] = useState<CopyGenerationResult | null>(null)
  const [showGuide, setShowGuide] = useState(false)

  const handleGenerate = (generatedResults: CopyGenerationResult) => {
    setResults(generatedResults)
    // Scroll to results
    setTimeout(() => {
      document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const handleReset = () => {
    setResults(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">AI Copywriting</h1>
          <p className="text-muted mt-2 text-sm sm:text-base">
            Generate world-class Google Ads copy using legendary copywriting frameworks
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowGuide(!showGuide)}
            className="w-full sm:w-auto"
          >
            <BookOpen className="h-4 w-4" />
            {showGuide ? 'Hide' : 'Show'} Guide
          </Button>
          {results && (
            <Button variant="outline" size="lg" onClick={handleReset} className="w-full sm:w-auto">
              <ArrowLeft className="h-4 w-4" />
              New Copy
            </Button>
          )}
        </div>
      </div>

      {/* Guide */}
      {showGuide && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              How to Use This Tool
            </h3>

            <div className="space-y-4 text-sm text-muted">
              <div>
                <h4 className="font-medium text-foreground mb-2">1. Start with the Basics</h4>
                <p>
                  Describe your product/service and target audience. The more specific you are, the
                  better the copy will be.
                </p>
              </div>

              <div>
                <h4 className="font-medium text-foreground mb-2">2. Choose Your Approach</h4>
                <p>
                  Select a preset for common scenarios, or customize your brand voice and copy type.
                  Want the full power? Expand "Advanced Strategy" to use legendary copywriting
                  frameworks.
                </p>
              </div>

              <div>
                <h4 className="font-medium text-foreground mb-2">3. Add Context (Optional)</h4>
                <p>
                  The more context you provide (benefits, pain points, competitors, keywords), the
                  more targeted and effective your copy will be.
                </p>
              </div>

              <div>
                <h4 className="font-medium text-foreground mb-2">4. Generate & Refine</h4>
                <p>
                  Click "Generate Copy" and review the results. Each piece includes scoring,
                  analysis, and recommendations. Copy individual lines or export the entire RSA.
                </p>
              </div>

              <div className="pt-3 border-t">
                <h4 className="font-medium text-foreground mb-2">
                  Copywriting Frameworks Explained
                </h4>
                <ul className="space-y-2">
                  <li>
                    <span className="font-medium">AIDA</span> - Attention → Interest → Desire →
                    Action (Classic, works everywhere)
                  </li>
                  <li>
                    <span className="font-medium">PAS</span> - Problem → Agitate → Solution (High
                    urgency, pain-focused)
                  </li>
                  <li>
                    <span className="font-medium">FAB</span> - Features → Advantages → Benefits
                    (B2B, logical buyers)
                  </li>
                  <li>
                    <span className="font-medium">Before-After-Bridge</span> - Show transformation
                    (Coaching, services)
                  </li>
                  <li>
                    <span className="font-medium">4 P's</span> - Picture → Promise → Prove → Push
                    (High-ticket items)
                  </li>
                  <li>
                    <span className="font-medium">QUEST</span> - Qualify → Understand → Educate →
                    Stimulate → Transition (Complex sales)
                  </li>
                </ul>
              </div>

              <div className="pt-3 border-t">
                <h4 className="font-medium text-foreground mb-2">Customer Awareness Levels</h4>
                <ul className="space-y-1">
                  <li>
                    <span className="font-medium">Unaware</span> - Don't know they have a problem
                  </li>
                  <li>
                    <span className="font-medium">Problem-Aware</span> - Know the problem, not the
                    solution
                  </li>
                  <li>
                    <span className="font-medium">Solution-Aware</span> - Know solutions exist, not
                    yours
                  </li>
                  <li>
                    <span className="font-medium">Product-Aware</span> - Know your product,
                    considering it
                  </li>
                  <li>
                    <span className="font-medium">Most Aware</span> - Ready to buy, need final push
                  </li>
                </ul>
              </div>

              <div className="pt-3 border-t bg-muted/50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
                <p className="text-xs">
                  <span className="font-medium">Based on principles from:</span> Eugene Schwartz
                  (Breakthrough Advertising), David Ogilvy (Confessions of an Advertising Man),
                  Claude Hopkins (Scientific Advertising), Gary Halbert (The Boron Letters), and
                  John Caples (Tested Advertising Methods).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      {!results ? (
        <>
          {/* Introduction */}
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <PenTool className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-lg font-semibold mb-1">
                    Professional Google Ads Copywriting
                  </h3>
                  <p className="text-sm text-muted">
                    Generate high-converting ad copy using proven frameworks from legendary
                    copywriters. Every piece is scored, analyzed, and optimized for Google Ads
                    character limits.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form */}
          <CopywritingForm onGenerate={handleGenerate} />

          {/* Benefits */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">What Makes This Different</h3>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium mb-2">🎯 Strategic, Not Generic</h4>
                  <p className="text-muted">
                    Choose from proven copywriting frameworks (AIDA, PAS, FAB, etc.) based on your
                    market sophistication and customer awareness level.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">📊 Scored & Analyzed</h4>
                  <p className="text-muted">
                    Every piece of copy is scored on clarity, relevance, uniqueness,
                    persuasiveness, specificity, and emotional impact.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">✅ Google Ads Compliant</h4>
                  <p className="text-muted">
                    Automatic character limit validation and policy violation checking. No more
                    manual counting or rejected ads.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">🧪 A/B Testing Ideas</h4>
                  <p className="text-muted">
                    Get specific testing recommendations with hypotheses and what to measure for
                    continuous improvement.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">🎨 Diverse Variations</h4>
                  <p className="text-muted">
                    Generate 3-15 variations with different emotional triggers, structures, and
                    approaches for maximum testing.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">⚡ RSA Optimized</h4>
                  <p className="text-muted">
                    Creates complete Responsive Search Ads with ad strength ratings and diversity
                    scores. Headlines work in any combination.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        /* Results */
        <div id="results">
          <CopyResults results={results} />
        </div>
      )}
    </div>
  )
}