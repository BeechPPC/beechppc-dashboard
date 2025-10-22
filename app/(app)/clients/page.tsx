import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, TrendingUp, Users, MousePointerClick, Eye, DollarSign, Target, BarChart3 } from 'lucide-react'
import { formatCurrency, calculatePercentageChange } from '@/lib/utils'
import { getCustomerAccounts, getMccReportData } from '@/lib/google-ads/client'
import type { DashboardMetrics } from '@/lib/google-ads/types'
import { ClientList } from '@/components/clients/client-list'

async function getAccountsData() {
  try {
    const [accountsList, accountsData] = await Promise.all([
      getCustomerAccounts(),
      getMccReportData()
    ])

    // Calculate dashboard metrics
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

    const metrics: DashboardMetrics = {
      totalSpend: totals.yesterday.spend,
      totalConversions: totals.yesterday.conversions,
      totalClicks: totals.yesterday.clicks,
      totalImpressions: totals.yesterday.impressions,
      avgCpc: totals.yesterday.clicks > 0 ? totals.yesterday.spend / totals.yesterday.clicks : 0,
      avgCostPerConv: totals.yesterday.conversions > 0 ? totals.yesterday.spend / totals.yesterday.conversions : 0,
      changeVsPrevious: {
        spend: calculatePercentageChange(totals.yesterday.spend, totals.previous.spend),
        conversions: calculatePercentageChange(totals.yesterday.conversions, totals.previous.conversions),
        clicks: calculatePercentageChange(totals.yesterday.clicks, totals.previous.clicks),
        impressions: calculatePercentageChange(totals.yesterday.impressions, totals.previous.impressions),
      },
    }

    return {
      accounts: { success: true, accounts: accountsList },
      dashboard: { success: true, metrics, accounts: accountsData }
    }
  } catch (error) {
    console.error('Error fetching accounts:', error)
    return { accounts: null, dashboard: null }
  }
}

export default async function ClientsPage() {
  const { accounts, dashboard } = await getAccountsData()

  if (!accounts || !accounts.success) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-error mt-2 text-sm sm:text-base">
            Failed to load client accounts. Please check your Google Ads API configuration.
          </p>
        </div>
      </div>
    )
  }

  const accountPerformance = dashboard?.accounts || []

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted mt-2 text-sm sm:text-base">
            Manage your Google Ads MCC client accounts
          </p>
        </div>
        <Button className="w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Add Client
        </Button>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{accounts.accounts.length}</div>
            <p className="text-xs text-muted mt-1">Active accounts in MCC</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
            <DollarSign className="h-4 w-4 text-muted" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {dashboard?.metrics ? formatCurrency(dashboard.metrics.totalSpend) : '-'}
            </div>
            <p className="text-xs text-muted mt-1">
              Yesterday
              {dashboard?.metrics?.changeVsPrevious?.spend !== undefined && (
                <span className={dashboard.metrics.changeVsPrevious.spend >= 0 ? 'text-success' : 'text-error'}>
                  {' '}• {dashboard.metrics.changeVsPrevious.spend >= 0 ? '+' : ''}{dashboard.metrics.changeVsPrevious.spend.toFixed(1)}%
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Conversions</CardTitle>
            <Target className="h-4 w-4 text-muted" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {dashboard?.metrics ? Math.round(dashboard.metrics.totalConversions) : '-'}
            </div>
            <p className="text-xs text-muted mt-1">
              Yesterday
              {dashboard?.metrics?.changeVsPrevious?.conversions !== undefined && (
                <span className={dashboard.metrics.changeVsPrevious.conversions >= 0 ? 'text-success' : 'text-error'}>
                  {' '}• {dashboard.metrics.changeVsPrevious.conversions >= 0 ? '+' : ''}{dashboard.metrics.changeVsPrevious.conversions.toFixed(1)}%
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg. CPC</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {dashboard?.metrics ? formatCurrency(dashboard.metrics.avgCpc) : '-'}
            </div>
            <p className="text-xs text-muted mt-1">Cost per click</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {dashboard?.metrics ? dashboard.metrics.totalClicks.toLocaleString() : '-'}
            </div>
            <p className="text-xs text-muted mt-1">
              Yesterday
              {dashboard?.metrics?.changeVsPrevious?.clicks !== undefined && (
                <span className={dashboard.metrics.changeVsPrevious.clicks >= 0 ? 'text-success' : 'text-error'}>
                  {' '}• {dashboard.metrics.changeVsPrevious.clicks >= 0 ? '+' : ''}{dashboard.metrics.changeVsPrevious.clicks.toFixed(1)}%
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
            <Eye className="h-4 w-4 text-muted" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {dashboard?.metrics ? dashboard.metrics.totalImpressions.toLocaleString() : '-'}
            </div>
            <p className="text-xs text-muted mt-1">
              Yesterday
              {dashboard?.metrics?.changeVsPrevious?.impressions !== undefined && (
                <span className={dashboard.metrics.changeVsPrevious.impressions >= 0 ? 'text-success' : 'text-error'}>
                  {' '}• {dashboard.metrics.changeVsPrevious.impressions >= 0 ? '+' : ''}{dashboard.metrics.changeVsPrevious.impressions.toFixed(1)}%
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg. CTR</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {dashboard?.metrics && dashboard.metrics.totalImpressions > 0
                ? ((dashboard.metrics.totalClicks / dashboard.metrics.totalImpressions) * 100).toFixed(2) + '%'
                : '-'}
            </div>
            <p className="text-xs text-muted mt-1">Click-through rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cost / Conv</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {dashboard?.metrics ? formatCurrency(dashboard.metrics.avgCostPerConv) : '-'}
            </div>
            <p className="text-xs text-muted mt-1">Avg. cost per conversion</p>
          </CardContent>
        </Card>
      </div>

      {/* Clients List */}
      <Card>
        <CardHeader>
          <CardTitle>All Clients</CardTitle>
          <CardDescription>
            View and manage your MCC client accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClientList
            accounts={accounts.accounts}
            accountPerformance={accountPerformance}
          />
        </CardContent>
      </Card>

      {/* Add Client Note */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted text-center">
            To add or remove clients from your MCC, please use the Google Ads interface.
            Changes will be reflected here automatically.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
