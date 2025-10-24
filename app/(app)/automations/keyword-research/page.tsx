'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Search, TrendingUp, Target, Lightbulb, BarChart3, Sparkles } from 'lucide-react'

export default function KeywordResearchPage() {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Keyword Research</h1>
          <p className="text-muted mt-2 text-sm sm:text-base">
            AI-powered keyword research and discovery for your Google Ads campaigns
          </p>
        </div>
        <Button
          size="lg"
          disabled
          className="w-full sm:w-auto"
        >
          <Search className="h-4 w-4" />
          Start Research
        </Button>
      </div>

      {/* Coming Soon Banner */}
      <Card className="border-2 border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-lg font-semibold mb-1">Coming Soon</h3>
              <p className="text-sm text-muted">
                We are building powerful AI-driven keyword research tools to help you discover high-performing keywords and optimize your campaigns. Stay tuned!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Planned Features */}
      <Card>
        <CardHeader>
          <CardTitle>Planned Features</CardTitle>
          <CardDescription>
            What to expect from our keyword research automation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex gap-3">
              <div className="p-2 rounded-lg bg-primary/10 h-fit">
                <Search className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Keyword Discovery</p>
                <p className="text-xs text-muted mt-1">
                  AI-powered keyword suggestions based on your industry and target audience
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="p-2 rounded-lg bg-primary/10 h-fit">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Search Volume Analysis</p>
                <p className="text-xs text-muted mt-1">
                  Understand search trends and volume for potential keywords
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="p-2 rounded-lg bg-primary/10 h-fit">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Competition Analysis</p>
                <p className="text-xs text-muted mt-1">
                  Evaluate keyword difficulty and competitive landscape
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="p-2 rounded-lg bg-primary/10 h-fit">
                <Lightbulb className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Long-tail Opportunities</p>
                <p className="text-xs text-muted mt-1">
                  Discover valuable long-tail keyword variations with lower competition
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="p-2 rounded-lg bg-primary/10 h-fit">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Performance Predictions</p>
                <p className="text-xs text-muted mt-1">
                  AI-driven estimates for CPC, CTR, and conversion potential
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="p-2 rounded-lg bg-primary/10 h-fit">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Smart Grouping</p>
                <p className="text-xs text-muted mt-1">
                  Automatically organize keywords into themed ad groups
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How It Will Work */}
      <Card>
        <CardHeader>
          <CardTitle>How It Will Work</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted">
            <p>1. Enter your business details, products, or services</p>
            <p>2. AI analyzes your industry and target market to suggest relevant keywords</p>
            <p>3. Review search volume, competition, and performance metrics for each keyword</p>
            <p>4. Filter and refine keywords based on your campaign goals</p>
            <p>5. Export keyword lists or directly create ad groups in your campaigns</p>
          </div>
        </CardContent>
      </Card>

      {/* Benefits */}
      <Card>
        <CardHeader>
          <CardTitle>Benefits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted">
            <p>• Save hours of manual keyword research time</p>
            <p>• Discover hidden opportunities your competitors might miss</p>
            <p>• Make data-driven decisions with AI-powered insights</p>
            <p>• Stay ahead with automated trend monitoring</p>
            <p>• Improve campaign performance with better keyword targeting</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
