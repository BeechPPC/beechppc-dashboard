'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { ClientDetailsDialog } from './client-details-dialog'

interface ClientListProps {
  accounts: Array<{ id: string; name: string; status: string; currency: string }>
  accountPerformance: Array<{
    id: string
    yesterday: {
      cost: number
      conversions: number
      clicks: number
      impressions: number
    }
  }>
}

export function ClientList({ accounts, accountPerformance }: ClientListProps) {
  const [selectedClient, setSelectedClient] = useState<{
    id: string
    name: string
    currency: string
  } | null>(null)

  return (
    <>
      <div className="space-y-4">
        {accounts.map((account) => {
          const performance = accountPerformance.find((p) => p.id === account.id)

          return (
            <div
              key={account.id}
              className="flex flex-col gap-4 p-4 border border-border rounded-lg hover:bg-primary-light/50 transition-colors"
            >
              {/* Account Info */}
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-semibold">
                    {account.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold truncate">{account.name}</h3>
                  <p className="text-xs sm:text-sm text-muted truncate">ID: {account.id}</p>
                </div>
              </div>

              {/* Metrics Grid - Mobile Layout */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 xl:grid-cols-7 gap-3 lg:gap-4 w-full">
                <div>
                  <p className="text-xs text-muted mb-1">Spend</p>
                  <p className="font-bold text-sm sm:text-base">
                    {performance
                      ? formatCurrency(performance.yesterday.cost, account.currency)
                      : '-'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted mb-1">Conversions</p>
                  <p className="font-bold text-sm sm:text-base">
                    {performance ? Math.round(performance.yesterday.conversions) : '-'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted mb-1">Clicks</p>
                  <p className="font-bold text-sm sm:text-base">
                    {performance ? performance.yesterday.clicks.toLocaleString() : '-'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted mb-1">Impressions</p>
                  <p className="font-bold text-sm sm:text-base">
                    {performance ? performance.yesterday.impressions.toLocaleString() : '-'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted mb-1">CTR</p>
                  <p className="font-bold text-sm sm:text-base">
                    {performance && performance.yesterday.impressions > 0
                      ? ((performance.yesterday.clicks / performance.yesterday.impressions) * 100).toFixed(2) + '%'
                      : '-'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted mb-1">Avg. CPC</p>
                  <p className="font-bold text-sm sm:text-base">
                    {performance && performance.yesterday.clicks > 0
                      ? formatCurrency(performance.yesterday.cost / performance.yesterday.clicks, account.currency)
                      : '-'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted mb-1">Status</p>
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
              </div>

              {/* View Details Button - Full Width on Mobile */}
              <div className="lg:ml-auto">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full lg:w-auto"
                  onClick={() => setSelectedClient({
                    id: account.id,
                    name: account.name,
                    currency: account.currency
                  })}
                >
                  View Details
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Client Details Dialog */}
      {selectedClient && (
        <ClientDetailsDialog
          open={!!selectedClient}
          onClose={() => setSelectedClient(null)}
          accountId={selectedClient.id}
          accountName={selectedClient.name}
          currency={selectedClient.currency}
        />
      )}
    </>
  )
}
