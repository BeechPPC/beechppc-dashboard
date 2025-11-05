import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getCustomerAccounts, getMccReportData } from '@/lib/google-ads/client'
import { formatCurrency } from '@/lib/utils'
import { Building2, TrendingUp, MousePointerClick, Eye, DollarSign, Target } from 'lucide-react'
import Link from 'next/link'

async function getAccountsData() {
  try {
    const [accountsList, accountsData] = await Promise.all([
      getCustomerAccounts(),
      getMccReportData()
    ])

    // Create a map of account data for quick lookup
    const accountsMap = new Map(accountsData.map(acc => [acc.id, acc]))

    // Combine account list with performance data
    return accountsList.map(account => ({
      ...account,
      performance: accountsMap.get(account.id),
    }))
  } catch (error) {
    console.error('Error fetching accounts:', error)
    return []
  }
}

export default async function AccountsPage() {
  const accounts = await getAccountsData()

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">All Accounts</h1>
        <p className="text-muted mt-2 text-sm sm:text-base">
          View and manage all Google Ads accounts under your MCC
        </p>
      </div>

      {/* Accounts Grid */}
      {accounts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted mb-4" />
            <p className="text-muted">No accounts found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <Link key={account.id} href={`/accounts/${account.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">{account.name}</CardTitle>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      account.status === 'ENABLED'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {account.status}
                    </span>
                  </div>
                  <CardDescription>Account ID: {account.id}</CardDescription>
                </CardHeader>
                <CardContent>
                  {account.performance ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted">
                          <DollarSign className="h-4 w-4" />
                          <span>Spend</span>
                        </div>
                        <span className="font-semibold">
                          {formatCurrency(account.performance.yesterday.cost, account.currency)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted">
                          <Target className="h-4 w-4" />
                          <span>Conversions</span>
                        </div>
                        <span className="font-semibold">
                          {account.performance.yesterday.conversions}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted">
                          <MousePointerClick className="h-4 w-4" />
                          <span>Clicks</span>
                        </div>
                        <span className="font-semibold">
                          {account.performance.yesterday.clicks}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted">
                          <Eye className="h-4 w-4" />
                          <span>Impressions</span>
                        </div>
                        <span className="font-semibold">
                          {account.performance.yesterday.impressions.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted text-center py-4">
                      No performance data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

