'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PenTool, Sparkles, Target, TrendingUp, Lightbulb, FileText } from 'lucide-react'

export default function CopywritingPage() {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">AI Copywriting</h1>
          <p className="text-muted mt-2 text-sm sm:text-base">
            Generate high-converting ad copy with AI-powered copywriting
          </p>
        </div>
        <Button
          size="lg"
          disabled
          className="w-full sm:w-auto"
        >
          <PenTool className="h-4 w-4" />
          Generate Copy
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
                We are building advanced AI copywriting tools to help you create compelling ad copy that converts. Stay tuned!
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
            What to expect from our AI copywriting automation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex gap-3">
              <div className="p-2 rounded-lg bg-primary/10 h-fit">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">AI-Powered Generation</p>
                <p className="text-xs text-muted mt-1">
                  Create headlines, descriptions, and CTAs using advanced AI models
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="p-2 rounded-lg bg-primary/10 h-fit">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Brand Voice Matching</p>
                <p className="text-xs text-muted mt-1">
                  Generate copy that matches your brand tone and style
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="p-2 rounded-lg bg-primary/10 h-fit">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Performance Optimization</p>
                <p className="text-xs text-muted mt-1">
                  Learn from top-performing ads to generate better copy
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="p-2 rounded-lg bg-primary/10 h-fit">
                <Lightbulb className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Multiple Variations</p>
                <p className="text-xs text-muted mt-1">
                  Generate multiple ad variations for A/B testing automatically
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="p-2 rounded-lg bg-primary/10 h-fit">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Responsive Search Ads</p>
                <p className="text-xs text-muted mt-1">
                  Create complete RSAs with optimized headline and description combinations
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="p-2 rounded-lg bg-primary/10 h-fit">
                <PenTool className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Extension Copy</p>
                <p className="text-xs text-muted mt-1">
                  Generate sitelinks, callouts, and structured snippets
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
            <p>1. Input your product/service details and target audience</p>
            <p>2. Select your brand voice and messaging preferences</p>
            <p>3. AI generates multiple ad copy variations instantly</p>
            <p>4. Review, edit, and refine the generated copy</p>
            <p>5. Deploy directly to your Google Ads campaigns or save for later</p>
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
            <p>• Save hours on ad copy creation and brainstorming</p>
            <p>• Generate fresh creative ideas and angles</p>
            <p>• Maintain consistent brand voice across all campaigns</p>
            <p>• Test more ad variations to find top performers</p>
            <p>• Improve CTR and conversion rates with optimized copy</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
