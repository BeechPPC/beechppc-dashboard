import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, TrendingUp, Users } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

async function getAccountsData() {
  try {
    const [accountsRes, dashboardRes] = await Promise.all([
      fetch(`http://localhost:3000/api/google-ads/accounts`, { cache: 'no-store' }),
      fetch(`http://localhost:3000/api/google-ads/dashboard`, { cache: 'no-store' }),
    ])

    const accounts = accountsRes.ok ? await accountsRes.json() : null
    const dashboard = dashboardRes.ok ? await dashboardRes.json() : null

    return { accounts, dashboard }
  } catch (error) {
    console.error('Error fetching accounts:', error)
    return { accounts: null, dashboard: null }
  }
}

export default async function ClientsPage() {
  const { accounts, dashboard } = await getAccountsData()

  if (!accounts || !accounts.success) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-error mt-2">
            Failed to load client accounts. Please check your Google Ads API configuration.
          </p>
        </div>
      </div>
    )
  }

  const accountPerformance = dashboard?.accounts || []

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted mt-2">
            Manage your Google Ads MCC client accounts
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4" />
          Add Client
        </Button>
      </div>

      {/* Summary */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accounts.accounts.length}</div>
            <p className="text-xs text-muted mt-1">Active accounts in MCC</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Spend (Yesterday)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboard?.metrics ? formatCurrency(dashboard.metrics.totalSpend) : '-'}
            </div>
            <p className="text-xs text-muted mt-1">Across all accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg. Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">Good</div>
            <p className="text-xs text-muted mt-1">Overall account health</p>
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
          <div className="space-y-4">
            {accounts.accounts.map((account: { id: string; name: string; status: string; currency: string }) => {
              const performance = accountPerformance.find((p: { id: string }) => p.id === account.id)

              return (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-primary-light/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-semibold">
                          {account.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold">{account.name}</h3>
                        <p className="text-sm text-muted">ID: {account.id}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <p className="text-sm text-muted">Yesterday&apos;s Spend</p>
                      <p className="font-bold">
                        {performance
                          ? formatCurrency(performance.yesterday.cost, account.currency)
                          : '-'}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-muted">Conversions</p>
                      <p className="font-bold">
                        {performance ? Math.round(performance.yesterday.conversions) : '-'}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-muted">Status</p>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        account.status === 'ENABLED'
                          ? 'bg-success/10 text-success'
                          : 'bg-muted/10 text-muted'
                      }`}>
                        <div className={`h-1.5 w-1.5 rounded-full ${
                          account.status === 'ENABLED' ? 'bg-success' : 'bg-muted'
                        }`} />
                        {account.status}
                      </span>
                    </div>

                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
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
