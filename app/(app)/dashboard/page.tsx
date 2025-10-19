'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DatePicker, type DateRange } from '@/components/ui/date-picker'
import { TrendingUp, TrendingDown, DollarSign, MousePointerClick, Eye, Target, Loader2 } from 'lucide-react'
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils'
import { PerformanceChart } from '@/components/dashboard/performance-chart'
import type { DashboardMetrics, AccountPerformance } from '@/lib/google-ads/types'

interface DashboardData {
  success: boolean
  metrics: DashboardMetrics
  accountCount: number
  accounts: AccountPerformance[]
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [availableAccounts, setAvailableAccounts] = useState<Array<{ id: string; name: string }>>([])
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all')

  // Initialize with Yesterday as default
  const getYesterday = () => {
    const date = new Date()
    date.setDate(date.getDate() - 1)
    return date.toISOString().split('T')[0]
  }

  const [dateRange, setDateRange] = useState<DateRange>({
    from: getYesterday(),
    to: getYesterday(),
  })

  // Load available accounts on mount
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const res = await fetch('/api/google-ads/accounts')
        const result = await res.json()
        if (result.success) {
          setAvailableAccounts(result.accounts)
        }
      } catch (err) {
        console.error('Failed to load accounts:', err)
      }
    }
    loadAccounts()
  }, [])

  // Calculate comparison period (same number of days, ending before the selected period)
  const getComparisonPeriod = (from: string, to: string) => {
    const fromDate = new Date(from)
    const toDate = new Date(to)
    const daysDiff = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24))

    const comparisonTo = new Date(fromDate)
    comparisonTo.setDate(comparisonTo.getDate() - 1)

    const comparisonFrom = new Date(comparisonTo)
    comparisonFrom.setDate(comparisonFrom.getDate() - daysDiff)

    return {
      from: comparisonFrom.toISOString().split('T')[0],
      to: comparisonTo.toISOString().split('T')[0],
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        const comparison = getComparisonPeriod(dateRange.from, dateRange.to)
        const params = new URLSearchParams({
          dateFrom: dateRange.from,
          dateTo: dateRange.to,
          comparisonDateFrom: comparison.from,
          comparisonDateTo: comparison.to,
        })

        // Add account filter if specific account is selected
        if (selectedAccountId !== 'all') {
          params.append('accountId', selectedAccountId)
        }

        const res = await fetch(`/api/google-ads/dashboard?${params}`)
        const result = await res.json()

        if (result.success) {
          setData(result)
        } else {
          setError(result.error || 'Failed to load dashboard data')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [dateRange, selectedAccountId])

  const formatDateRangeLabel = (from: string, to: string) => {
    const fromDate = new Date(from)
    const toDate = new Date(to)

    if (from === to) {
      return fromDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }

    return `${fromDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${toDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-error mt-2">
            {error}
          </p>
        </div>
      </div>
    )
  }

  const metricsCards = data ? [
    {
      title: 'Total Spend',
      value: formatCurrency(data.metrics.totalSpend),
      change: formatPercentage(data.metrics.changeVsPrevious.spend),
      trend: data.metrics.changeVsPrevious.spend >= 0 ? 'up' as const : 'down' as const,
      icon: DollarSign,
    },
    {
      title: 'Conversions',
      value: formatNumber(Math.round(data.metrics.totalConversions)),
      change: formatPercentage(data.metrics.changeVsPrevious.conversions),
      trend: data.metrics.changeVsPrevious.conversions >= 0 ? 'up' as const : 'down' as const,
      icon: Target,
    },
    {
      title: 'Clicks',
      value: formatNumber(data.metrics.totalClicks),
      change: formatPercentage(data.metrics.changeVsPrevious.clicks),
      trend: data.metrics.changeVsPrevious.clicks >= 0 ? 'up' as const : 'down' as const,
      icon: MousePointerClick,
    },
    {
      title: 'Impressions',
      value: formatNumber(data.metrics.totalImpressions),
      change: formatPercentage(data.metrics.changeVsPrevious.impressions),
      trend: data.metrics.changeVsPrevious.impressions >= 0 ? 'up' as const : 'down' as const,
      icon: Eye,
    },
  ] : []

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted mt-2 text-sm sm:text-base">
          Welcome back! Here&apos;s an overview of your Google Ads performance.
        </p>
      </div>

      {/* Filters */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Date Range Picker */}
        <Card>
          <CardHeader>
            <CardTitle>Date Range</CardTitle>
            <CardDescription>
              Select a date range to view performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DatePicker value={dateRange} onChange={setDateRange} />
          </CardContent>
        </Card>

        {/* Account Filter */}
        <Card>
          <CardHeader>
            <CardTitle>Account Filter</CardTitle>
            <CardDescription>
              View data for all accounts or a specific account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <label className="block text-sm font-medium mb-2">
                Select Account
              </label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
              >
                <option value="all">All Accounts</option>
                {availableAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted mt-2">
                {selectedAccountId === 'all'
                  ? `Showing aggregated data from ${availableAccounts.length} account${availableAccounts.length !== 1 ? 's' : ''}`
                  : 'Showing data for selected account only'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : data ? (
        <>
          {/* Current Period Label */}
          <div className="text-sm text-muted">
            Showing data for <span className="font-medium text-gray-900">{formatDateRangeLabel(dateRange.from, dateRange.to)}</span>
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
                    <div className="text-xl sm:text-2xl font-bold">{metric.value}</div>
                    <div className={`flex items-center gap-1 text-xs ${trendColor} mt-1`}>
                      <TrendIcon className="h-3 w-3" />
                      <span className="truncate">{metric.change} from previous</span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Additional Metrics */}
          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Avg. CPC</CardTitle>
                <CardDescription>Average cost per click</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{formatCurrency(data.metrics.avgCpc)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Avg. Cost/Conv</CardTitle>
                <CardDescription>Average cost per conversion</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{formatCurrency(data.metrics.avgCostPerConv)}</div>
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
                    <div className="text-xl sm:text-2xl font-bold">{data.accountCount}</div>
                    <p className="text-xs text-muted mt-1">Total accounts</p>
                  </div>
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Target className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
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
              <CardDescription>Performance by account for selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.accounts.slice(0, 5).map((account) => (
                  <div key={account.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 border-b border-border pb-4 last:border-0 last:pb-0">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{account.name}</p>
                      <p className="text-xs sm:text-sm text-muted truncate">ID: {account.id}</p>
                    </div>
                    <div className="sm:text-right flex sm:flex-col gap-3 sm:gap-0">
                      <div className="flex-1 sm:flex-none">
                        <p className="text-xs sm:hidden text-muted mb-1">Spend</p>
                        <p className="font-bold text-sm sm:text-base">{formatCurrency(account.yesterday.cost, account.currency)}</p>
                      </div>
                      <div className="flex-1 sm:flex-none">
                        <p className="text-xs sm:hidden text-muted mb-1">Conversions</p>
                        <p className="text-xs sm:text-sm text-muted sm:mt-1">{Math.round(account.yesterday.conversions)} conversions</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}
