'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DollarSign, TrendingUp, Calendar, Target, PieChart, Sparkles } from 'lucide-react'

export default function BudgetManagementPage() {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Budget Management</h1>
          <p className="text-muted mt-2 text-sm sm:text-base">
            AI-powered budget optimization and pacing for your campaigns
          </p>
        </div>
        <Button
          size="lg"
          disabled
          className="w-full sm:w-auto"
        >
          <DollarSign className="h-4 w-4" />
          Optimize Budgets
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
                We are building intelligent budget management tools to help you maximize ROI and prevent overspending. Stay tuned!
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
            What to expect from our budget management automation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex gap-3">
              <div className="p-2 rounded-lg bg-primary/10 h-fit">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Smart Budget Pacing</p>
                <p className="text-xs text-muted mt-1">
                  Automatically adjust daily budgets to pace spending throughout the month
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="p-2 rounded-lg bg-primary/10 h-fit">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Performance-Based Allocation</p>
                <p className="text-xs text-muted mt-1">
                  Shift budget to high-performing campaigns automatically
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="p-2 rounded-lg bg-primary/10 h-fit">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Overspend Prevention</p>
                <p className="text-xs text-muted mt-1">
                  Set hard limits and receive alerts before exceeding budgets
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="p-2 rounded-lg bg-primary/10 h-fit">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Goal-Based Optimization</p>
                <p className="text-xs text-muted mt-1">
                  Optimize budget allocation based on CPA, ROAS, or conversion goals
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="p-2 rounded-lg bg-primary/10 h-fit">
                <PieChart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Budget Distribution</p>
                <p className="text-xs text-muted mt-1">
                  Visualize budget allocation across campaigns and accounts
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
                  Get intelligent suggestions for budget adjustments and reallocation
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
            <p>1. Set your monthly budget targets and performance goals</p>
            <p>2. Configure automation rules for budget allocation and pacing</p>
            <p>3. AI monitors spending patterns and campaign performance daily</p>
            <p>4. Budgets are automatically adjusted to maximize ROI</p>
            <p>5. Receive reports and alerts on budget utilization and opportunities</p>
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
            <p>• Prevent budget overspend with automated controls</p>
            <p>• Maximize ROI by shifting spend to top performers</p>
            <p>• Save time on manual budget adjustments</p>
            <p>• Ensure consistent spend pacing throughout the month</p>
            <p>• Make data-driven budget decisions with AI insights</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
