import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, DollarSign, MousePointerClick, Eye, Target } from 'lucide-react'
import { formatCurrency, formatNumber, formatPercentage, calculatePercentageChange } from '@/lib/utils'
import { PerformanceChart } from '@/components/dashboard/performance-chart'
import { getMccReportData } from '@/lib/google-ads/client'
import type { DashboardMetrics } from '@/lib/google-ads/types'

async function getDashboardData() {
  try {
    const accountsData = await getMccReportData()

    // Aggregate metrics across all accounts
    const totals = accountsData.reduce(
      (acc, account) => {
        acc.yesterday.spend += account.yesterday.cost
        acc.yesterday.conversions += account.yesterday.conversions
        acc.yesterday.clicks += account.yesterday.clicks
        acc.yesterday.impressions += account.yesterday.impressions

        if (account.previousDay) {
          acc.previous.spend += account.previousDay.cost
          acc.previous.conversions += account.previousDay.conversions
          acc.previous.clicks += account.previousDay.clicks
          acc.previous.impressions += account.previousDay.impressions
        }

        return acc
      },
      {
        yesterday: { spend: 0, conversions: 0, clicks: 0, impressions: 0 },
        previous: { spend: 0, conversions: 0, clicks: 0, impressions: 0 },
      }
    )

    const avgCpc = totals.yesterday.clicks > 0
      ? totals.yesterday.spend / totals.yesterday.clicks
      : 0

    const avgCostPerConv = totals.yesterday.conversions > 0
      ? totals.yesterday.spend / totals.yesterday.conversions
      : 0

    const metrics: DashboardMetrics = {
      totalSpend: totals.yesterday.spend,
      totalConversions: totals.yesterday.conversions,
      totalClicks: totals.yesterday.clicks,
      totalImpressions: totals.yesterday.impressions,
      avgCpc,
      avgCostPerConv,
      changeVsPrevious: {
        spend: calculatePercentageChange(totals.yesterday.spend, totals.previous.spend),
        conversions: calculatePercentageChange(totals.yesterday.conversions, totals.previous.conversions),
        clicks: calculatePercentageChange(totals.yesterday.clicks, totals.previous.clicks),
        impressions: calculatePercentageChange(totals.yesterday.impressions, totals.previous.impressions),
      },
    }

    return {
      success: true,
      metrics,
      accountCount: accountsData.length,
      accounts: accountsData
    }
  } catch (error) {
    console.error('Error fetching dashboard:', error)
    return null
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData()

  if (!data || !data.success) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-error mt-2">
            Failed to load dashboard data. Please check your Google Ads API configuration.
          </p>
        </div>
      </div>
    )
  }

  const { metrics, accountCount } = data

  const metricsCards = [
    {
      title: 'Total Spend',
      value: formatCurrency(metrics.totalSpend),
      change: formatPercentage(metrics.changeVsPrevious.spend),
      trend: metrics.changeVsPrevious.spend >= 0 ? 'up' as const : 'down' as const,
      icon: DollarSign,
    },
    {
      title: 'Conversions',
      value: formatNumber(Math.round(metrics.totalConversions)),
      change: formatPercentage(metrics.changeVsPrevious.conversions),
      trend: metrics.changeVsPrevious.conversions >= 0 ? 'up' as const : 'down' as const,
      icon: Target,
    },
    {
      title: 'Clicks',
      value: formatNumber(metrics.totalClicks),
      change: formatPercentage(metrics.changeVsPrevious.clicks),
      trend: metrics.changeVsPrevious.clicks >= 0 ? 'up' as const : 'down' as const,
      icon: MousePointerClick,
    },
    {
      title: 'Impressions',
      value: formatNumber(metrics.totalImpressions),
      change: formatPercentage(metrics.changeVsPrevious.impressions),
      trend: metrics.changeVsPrevious.impressions >= 0 ? 'up' as const : 'down' as const,
      icon: Eye,
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted mt-2">
          Welcome back! Here&apos;s an overview of your Google Ads performance for yesterday.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {metricsCards.map((metric) => {
          const Icon = metric.icon
          const TrendIcon = metric.trend === 'up' ? TrendingUp : TrendingDown
          const trendColor = metric.trend === 'up' ? 'text-success' : 'text-error'

          return (
            <Card key={metric.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="text-sm font-medium">
                  {metric.title}
                </CardDescription>
                <Icon className="h-4 w-4 text-muted" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <div className={`flex items-center gap-1 text-xs ${trendColor} mt-1`}>
                  <TrendIcon className="h-3 w-3" />
                  <span>{metric.change} from previous period</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Additional Metrics */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Avg. CPC</CardTitle>
            <CardDescription>Average cost per click</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.avgCpc)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Avg. Cost/Conv</CardTitle>
            <CardDescription>Average cost per conversion</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.avgCostPerConv)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Accounts</CardTitle>
            <CardDescription>Managed Google Ads accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{accountCount}</div>
                <p className="text-xs text-muted mt-1">Total accounts</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Target className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart */}
      <PerformanceChart accounts={data.accounts} />

      {/* Account Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Account Performance</CardTitle>
          <CardDescription>Yesterday&apos;s performance by account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.accounts.slice(0, 5).map((account: { id: string; name: string; yesterday: { cost: number; conversions: number }; currency: string }) => (
              <div key={account.id} className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0">
                <div className="flex-1">
                  <p className="font-medium">{account.name}</p>
                  <p className="text-sm text-muted">ID: {account.id}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatCurrency(account.yesterday.cost, account.currency)}</p>
                  <p className="text-sm text-muted">{Math.round(account.yesterday.conversions)} conversions</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
