'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp, Eye, BarChart3, AlertCircle, Target, Sparkles } from 'lucide-react'

export default function CompetitorMonitoringPage() {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Competitor Monitoring</h1>
          <p className="text-muted mt-2 text-sm sm:text-base">
            Track competitor strategies and stay ahead in the auction
          </p>
        </div>
        <Button
          size="lg"
          disabled
          className="w-full sm:w-auto"
        >
          <TrendingUp className="h-4 w-4" />
          Start Monitoring
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
                We are building advanced competitor monitoring tools to help you track and analyze your competition. Stay tuned!
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
            What to expect from our competitor monitoring automation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex gap-3">
              <div className="p-2 rounded-lg bg-primary/10 h-fit">
                <Eye className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Ad Copy Tracking</p>
                <p className="text-xs text-muted mt-1">
                  Monitor competitor ad copy, headlines, and descriptions automatically
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="p-2 rounded-lg bg-primary/10 h-fit">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Position Monitoring</p>
                <p className="text-xs text-muted mt-1">
                  Track your ad positions relative to competitors for key terms
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="p-2 rounded-lg bg-primary/10 h-fit">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Auction Insights</p>
                <p className="text-xs text-muted mt-1">
                  Analyze impression share, overlap rate, and position metrics
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="p-2 rounded-lg bg-primary/10 h-fit">
                <AlertCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Change Alerts</p>
                <p className="text-xs text-muted mt-1">
                  Get notified when competitors launch new campaigns or change bids
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="p-2 rounded-lg bg-primary/10 h-fit">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Landing Page Analysis</p>
                <p className="text-xs text-muted mt-1">
                  Track competitor landing pages and identify conversion strategies
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="p-2 rounded-lg bg-primary/10 h-fit">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">AI Recommendations</p>
                <p className="text-xs text-muted mt-1">
                  Receive AI-powered suggestions to outperform competitors
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
            <p>1. Add competitor domains or Google Ads accounts to monitor</p>
            <p>2. Select keywords and campaigns you want to track</p>
            <p>3. AI automatically monitors competitor activity and auction insights</p>
            <p>4. Receive alerts when significant changes are detected</p>
            <p>5. Review detailed reports and AI-powered recommendations</p>
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
            <p>• Stay informed about competitor strategies without manual research</p>
            <p>• Identify opportunities to capture more impression share</p>
            <p>• React quickly to competitive threats and market changes</p>
            <p>• Learn from successful competitor tactics and messaging</p>
            <p>• Make data-driven decisions to outperform your competition</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
