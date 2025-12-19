'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileBarChart, Sparkles, ArrowLeft, Loader2, Download, ChevronDown, ChevronUp } from 'lucide-react'

interface ReportSection {
  title: string
  content: string
  keyPoints?: string[]
}

interface ReportData {
  metadata: {
    url: string
    analyzedDate: string
    reportType: string
    companyName?: string
  }
  sections: {
    existentialPurpose?: ReportSection
    targetMarket?: ReportSection
    offerings?: ReportSection
    differentiation?: ReportSection
    trustSignals?: ReportSection
    ppcStrategy?: ReportSection
  }
}

type GenerationPhase = 'idle' | 'fetching' | 'analyzing' | 'generating-slides' | 'generating-pdf' | 'complete' | 'error'

export default function BusinessClarityReportPage() {
  const [url, setUrl] = useState('')
  const [phase, setPhase] = useState<GenerationPhase>('idle')
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [slideUrl, setSlideUrl] = useState<string | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!url.trim()) {
      setError('Please enter a website URL')
      return
    }

    setError(null)
    setPhase('fetching')

    try {
      const response = await fetch('/api/tools/business-clarity-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`)
      }

      if (data.success) {
        setReportData(data.reportData)
        setSlideUrl(data.slideUrl)
        setPdfUrl(data.pdfUrl)
        setPhase('complete')

        // Scroll to results
        setTimeout(() => {
          document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
      } else {
        throw new Error(data.error || 'Failed to generate report')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setPhase('error')
    }
  }

  const handleReset = () => {
    setUrl('')
    setPhase('idle')
    setReportData(null)
    setError(null)
    setSlideUrl(null)
    setPdfUrl(null)
    setExpandedSections(new Set())
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggleSection = (sectionKey: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionKey)) {
      newExpanded.delete(sectionKey)
    } else {
      newExpanded.add(sectionKey)
    }
    setExpandedSections(newExpanded)
  }

  const getPhaseMessage = () => {
    switch (phase) {
      case 'fetching':
        return 'Fetching website content...'
      case 'analyzing':
        return 'Analyzing business...'
      case 'generating-slides':
        return 'Generating slide deck...'
      case 'generating-pdf':
        return 'Creating PDF report...'
      case 'complete':
        return 'Report complete!'
      case 'error':
        return 'Error generating report'
      default:
        return ''
    }
  }

  const isGenerating = ['fetching', 'analyzing', 'generating-slides', 'generating-pdf'].includes(phase)

  const sectionTitles: Record<string, string> = {
    existentialPurpose: 'Why They Exist',
    targetMarket: 'Who They Serve',
    offerings: 'What They Do',
    differentiation: 'Their USPs',
    trustSignals: 'Trust Signals',
    ppcStrategy: 'PPC Opportunities'
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Business Clarity Report</h1>
          <p className="text-muted mt-2 text-sm sm:text-base">
            Comprehensive business analysis for PPC client onboarding
          </p>
        </div>
        {phase === 'complete' && (
          <Button variant="outline" size="lg" onClick={handleReset} className="w-full sm:w-auto">
            <ArrowLeft className="h-4 w-4" />
            New Report
          </Button>
        )}
      </div>

      {/* Main Content */}
      {phase === 'idle' || phase === 'error' ? (
        <>
          {/* Introduction */}
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <FileBarChart className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-lg font-semibold mb-1">
                    Automated Business Analysis
                  </h3>
                  <p className="text-sm text-muted">
                    Generate comprehensive reports analyzing a prospect's business, including mission, target market, offerings, USPs, and PPC opportunities. Delivered as both Google Slides and PDF.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="website-url">Website URL</Label>
                  <Input
                    id="website-url"
                    type="url"
                    placeholder="https://example.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !isGenerating) {
                        handleGenerate()
                      }
                    }}
                    disabled={isGenerating}
                  />
                  <p className="text-xs text-muted">
                    Enter the complete URL including https://
                  </p>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <Button
                  size="lg"
                  onClick={handleGenerate}
                  disabled={isGenerating || !url.trim()}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generate Report
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* What's Included */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">What's Included in the Report</h3>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium mb-2">📊 Business Analysis</h4>
                  <p className="text-muted">
                    Six key dimensions: Why they exist, Who they serve, What they do, Their USPs, Trust signals, and PPC opportunities.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">🎨 Google Slides Presentation</h4>
                  <p className="text-muted">
                    Professional slide deck with Beech PPC branding, perfect for client presentations and proposals.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">📄 PDF Report</h4>
                  <p className="text-muted">
                    Comprehensive written report with all findings, ready to share with prospects or keep for reference.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">🎯 PPC Strategy Insights</h4>
                  <p className="text-muted">
                    Keyword themes, audience targeting suggestions, messaging angles, and conversion optimization ideas.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">⚡ Instant Analysis</h4>
                  <p className="text-muted">
                    Automatically fetches and analyzes homepage, about page, services, testimonials, and more.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">💼 Client-Ready</h4>
                  <p className="text-muted">
                    Professional formatting and branding makes these reports ready to use in sales conversations.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : isGenerating ? (
        /* Progress Indicator */
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-1">Generating Your Report</h3>
                <p className="text-sm text-muted">{getPhaseMessage()}</p>
              </div>
              <div className="w-full max-w-md space-y-2 pt-4">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${phase === 'fetching' || phase === 'analyzing' || phase === 'generating-slides' || phase === 'generating-pdf' ? 'bg-primary' : 'bg-gray-300'}`} />
                  <span className="text-sm">Website fetched</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${phase === 'analyzing' || phase === 'generating-slides' || phase === 'generating-pdf' ? 'bg-primary' : 'bg-gray-300'}`} />
                  <span className="text-sm">Business analysis complete</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${phase === 'generating-slides' || phase === 'generating-pdf' ? 'bg-primary' : 'bg-gray-300'}`} />
                  <span className="text-sm">Generating slide deck</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${phase === 'generating-pdf' ? 'bg-primary' : 'bg-gray-300'}`} />
                  <span className="text-sm">Creating PDF report</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : phase === 'complete' && reportData ? (
        /* Results */
        <div id="results" className="space-y-6">
          {/* Download Section */}
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">
                Report Complete: {reportData.metadata.companyName || new URL(reportData.metadata.url).hostname}
              </h3>
              {slideUrl || pdfUrl ? (
                <div className="flex flex-col sm:flex-row gap-3">
                  {slideUrl && (
                    <a href={slideUrl} download className="flex-1">
                      <Button size="lg" className="w-full">
                        <Download className="h-4 w-4" />
                        Download Slides (.pptx)
                      </Button>
                    </a>
                  )}
                  {pdfUrl && (
                    <a href={pdfUrl} download className="flex-1">
                      <Button size="lg" variant="outline" className="w-full">
                        <Download className="h-4 w-4" />
                        Download PDF Report
                      </Button>
                    </a>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                  <p className="text-sm text-muted">
                    📊 Analysis complete! File generation (PowerPoint & PDF) is coming soon.
                    For now, you can preview the complete analysis below.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preview Analysis */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Preview Analysis</h3>
              <div className="space-y-2">
                {Object.entries(reportData.sections).map(([key, section]) => {
                  if (!section) return null
                  const isExpanded = expandedSections.has(key)

                  return (
                    <div key={key} className="border rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleSection(key)}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors text-left"
                      >
                        <span className="font-medium">{sectionTitles[key] || section.title}</span>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted" />
                        )}
                      </button>
                      {isExpanded && (
                        <div className="px-4 py-3 border-t bg-muted/20">
                          <p className="text-sm text-muted mb-3">{section.content}</p>
                          {section.keyPoints && section.keyPoints.length > 0 && (
                            <ul className="space-y-1 text-sm">
                              {section.keyPoints.map((point, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-primary mt-1">•</span>
                                  <span>{point}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  )
}