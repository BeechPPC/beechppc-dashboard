import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getCustomerAccounts, getAccountMetrics } from '@/lib/google-ads/client'
import { formatCurrency, calculatePercentageChange } from '@/lib/utils'
import { Building2, TrendingUp, MousePointerClick, Eye, DollarSign, Target, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ClientDetailsSection } from '@/components/accounts/client-details-section'
import { MeetingNotes } from '@/components/accounts/meeting-notes'

async function getAccountData(accountId: string) {
  try {
    const accounts = await getCustomerAccounts()
    const account = accounts.find(acc => acc.id === accountId)

    if (!account) {
      return null
    }

    // Get performance metrics
    const [yesterdayMetrics, previousDayMetrics] = await Promise.all([
      getAccountMetrics(accountId, 'YESTERDAY'),
      getAccountMetrics(accountId, 'LAST_7_DAYS'),
    ])

    return {
      account,
      yesterday: yesterdayMetrics,
      previousDay: previousDayMetrics,
    }
  } catch (error) {
    console.error('Error fetching account data:', error)
    return null
  }
}

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await getAccountData(id)

  if (!data || !data.account) {
    notFound()
  }

  const { account, yesterday, previousDay } = data

  const spendChange = previousDay && yesterday
    ? calculatePercentageChange(yesterday.cost, previousDay.cost)
    : null
  const conversionsChange = previousDay && yesterday
    ? calculatePercentageChange(yesterday.conversions, previousDay.conversions)
    : null
  const clicksChange = previousDay && yesterday
    ? calculatePercentageChange(yesterday.clicks, previousDay.clicks)
    : null
  const impressionsChange = previousDay && yesterday
    ? calculatePercentageChange(yesterday.impressions, previousDay.impressions)
    : null

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/accounts">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to All Accounts
          </Button>
        </Link>
      </div>

      <div>
        <div className="flex items-center gap-3">
          <Building2 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{account.name}</h1>
            <p className="text-muted mt-1 text-sm sm:text-base">
              Account ID: {account.id} • {account.status} • {account.currency}
            </p>
          </div>
        </div>
      </div>

      {/* Client Information Section */}
      <ClientDetailsSection
        accountId={account.id}
        accountName={account.name}
        currency={account.currency}
      />

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
          <CardDescription>
            Yesterday&apos;s performance compared to previous period
          </CardDescription>
        </CardHeader>
        <CardContent>
          {yesterday ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-sm font-medium">
                Spend
              </CardDescription>
              <DollarSign className="h-4 w-4 text-muted" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(yesterday.cost, account.currency)}
              </div>
              {spendChange !== null && (
                <p className={`text-xs mt-1 ${
                  spendChange >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {spendChange >= 0 ? '+' : ''}{spendChange.toFixed(1)}% vs previous
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-sm font-medium">
                Conversions
              </CardDescription>
              <Target className="h-4 w-4 text-muted" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{yesterday.conversions}</div>
              {conversionsChange !== null && (
                <p className={`text-xs mt-1 ${
                  conversionsChange >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {conversionsChange >= 0 ? '+' : ''}{conversionsChange.toFixed(1)}% vs previous
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-sm font-medium">
                Clicks
              </CardDescription>
              <MousePointerClick className="h-4 w-4 text-muted" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{yesterday.clicks.toLocaleString()}</div>
              {clicksChange !== null && (
                <p className={`text-xs mt-1 ${
                  clicksChange >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {clicksChange >= 0 ? '+' : ''}{clicksChange.toFixed(1)}% vs previous
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-sm font-medium">
                Impressions
              </CardDescription>
              <Eye className="h-4 w-4 text-muted" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{yesterday.impressions.toLocaleString()}</div>
              {impressionsChange !== null && (
                <p className={`text-xs mt-1 ${
                  impressionsChange >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {impressionsChange >= 0 ? '+' : ''}{impressionsChange.toFixed(1)}% vs previous
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-sm font-medium">
                Avg CPC
              </CardDescription>
              <TrendingUp className="h-4 w-4 text-muted" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(yesterday.avgCpc, account.currency)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-sm font-medium">
                Cost per Conversion
              </CardDescription>
              <DollarSign className="h-4 w-4 text-muted" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(yesterday.costPerConv, account.currency)}
              </div>
            </CardContent>
          </Card>
            </div>
          ) : (
            <div className="text-center py-12 text-muted">
              <p>No performance data available for this account</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Meeting Notes Section */}
      <MeetingNotes accountId={account.id} />
    </div>
  )
}

