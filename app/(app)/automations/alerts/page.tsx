'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent } from '@/components/ui/dialog'
import { CreateAlertForm } from '@/components/alerts/create-alert-form'
import { Bell, TrendingUp, TrendingDown, AlertTriangle, DollarSign, Target, Mail, Loader2, Play, Plus } from 'lucide-react'
import type { Alert } from '@/lib/alerts/types'

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  // Load alerts on mount
  useEffect(() => {
    loadAlerts()
  }, [])

  const loadAlerts = async () => {
    try {
      const res = await fetch('/api/alerts')
      const result = await res.json()
      if (result.success) {
        setAlerts(result.alerts)
      }
    } catch (err) {
      console.error('Failed to load alerts:', err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const toggleAlert = async (id: string) => {
    const alertToToggle = alerts.find(a => a.id === id)
    if (!alertToToggle) return

    setTogglingId(id)
    try {
      const res = await fetch('/api/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          enabled: !alertToToggle.enabled,
        }),
      })

      const result = await res.json()
      if (result.success) {
        setAlerts(alerts.map(a => a.id === id ? result.alert : a))
      } else {
        window.alert(`Failed to toggle alert: ${result.error}`)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      console.error('Failed to toggle alert:', errorMsg)
      window.alert(`Failed to toggle alert: ${errorMsg}`)
    } finally {
      setTogglingId(null)
    }
  }

  const checkAlertsNow = async () => {
    setChecking(true)
    try {
      const res = await fetch('/api/alerts/check', {
        method: 'POST',
      })
      const result = await res.json()

      if (result.success) {
        setLastCheck(new Date())
        window.alert(`Checked ${result.checked} alerts. ${result.triggered} triggered, ${result.emailsSent} emails sent.`)
        // Reload alerts to get updated lastTriggered timestamps
        await loadAlerts()
      } else {
        window.alert(`Error: ${result.error}`)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      console.error('Failed to check alerts:', errorMsg)
      window.alert('Failed to check alerts')
    } finally {
      setChecking(false)
    }
  }

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'spend':
        return DollarSign
      case 'conversions':
        return Target
      case 'ctr':
        return TrendingUp
      case 'cpc':
        return TrendingDown
      case 'conversion_rate':
        return Target
      default:
        return Bell
    }
  }

  const getAlertTypeLabel = (type: Alert['type']) => {
    switch (type) {
      case 'spend':
        return 'Daily Spend'
      case 'conversions':
        return 'Conversions'
      case 'ctr':
        return 'Click-Through Rate'
      case 'cpc':
        return 'Cost Per Click'
      case 'conversion_rate':
        return 'Conversion Rate'
    }
  }

  const getConditionLabel = (condition: Alert['condition'], threshold: number, type: Alert['type']) => {
    switch (condition) {
      case 'above':
        return `above ${type === 'spend' ? '$' : ''}${threshold}${type === 'ctr' || type === 'conversion_rate' ? '%' : ''}`
      case 'below':
        return `below ${type === 'spend' ? '$' : ''}${threshold}${type === 'ctr' || type === 'conversion_rate' ? '%' : ''}`
      case 'increases_by':
        return `increases by ${threshold}%`
      case 'decreases_by':
        return `decreases by ${threshold}%`
    }
  }

  const uniqueRecipients = new Set(alerts.flatMap(a => a.recipients))

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Alert Notifications</h1>
          <p className="text-muted mt-2 text-sm sm:text-base">
            Set up automated alerts to monitor your Google Ads performance
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="lg"
            onClick={() => setShowCreateDialog(true)}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Create Alert
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={checkAlertsNow}
            disabled={checking}
            className="w-full sm:w-auto"
          >
            {checking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Check Now
          </Button>
        </div>
      </div>

      {/* Last Check Info */}
      {lastCheck && (
        <div className="text-sm text-muted">
          Last checked: {lastCheck.toLocaleTimeString()}
        </div>
      )}

      {/* Alert Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-sm font-medium">
              Active Alerts
            </CardDescription>
            <Bell className="h-4 w-4 text-muted" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {alerts.filter(a => a.enabled).length}
            </div>
            <p className="text-xs text-muted mt-1">
              {alerts.length} total alerts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-sm font-medium">
              Last Triggered
            </CardDescription>
            <AlertTriangle className="h-4 w-4 text-muted" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {alerts.filter(a => a.lastTriggered).length}
            </div>
            <p className="text-xs text-muted mt-1">
              {alerts.filter(a => a.lastTriggered).length > 0 ? 'Alerts have been triggered' : 'No alerts triggered yet'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-sm font-medium">
              Email Recipients
            </CardDescription>
            <Mail className="h-4 w-4 text-muted" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueRecipients.size}</div>
            <p className="text-xs text-muted mt-1">
              Receiving notifications
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Alerts</CardTitle>
          <CardDescription>
            Manage your automated alert notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-muted">
              No alerts configured yet. Check back soon!
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => {
                const Icon = getAlertIcon(alert.type)
                return (
                  <div
                    key={alert.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${alert.enabled ? 'bg-primary/10' : 'bg-gray-100'}`}>
                        <Icon className={`h-5 w-5 ${alert.enabled ? 'text-primary' : 'text-gray-400'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{alert.name}</p>
                          {!alert.enabled && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                              Disabled
                            </span>
                          )}
                        </div>
                        {alert.description && (
                          <p className="text-xs text-muted mt-0.5">{alert.description}</p>
                        )}
                        <p className="text-sm text-muted mt-1">
                          {getAlertTypeLabel(alert.type)} {getConditionLabel(alert.condition, alert.threshold, alert.type)}
                          {alert.accountId && <span> • Specific account</span>}
                        </p>
                        <p className="text-xs text-muted mt-1">
                          Sends to: {alert.recipients.join(', ')}
                        </p>
                        {alert.lastTriggered && (
                          <p className="text-xs text-success mt-1">
                            Last triggered: {new Date(alert.lastTriggered).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleAlert(alert.id)}
                        disabled={togglingId === alert.id}
                      >
                        {togglingId === alert.id ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            {alert.enabled ? 'Disabling...' : 'Enabling...'}
                          </>
                        ) : (
                          alert.enabled ? 'Disable' : 'Enable'
                        )}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alert Types Info */}
      <Card>
        <CardHeader>
          <CardTitle>Available Alert Types</CardTitle>
          <CardDescription>
            Monitor key performance metrics automatically
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex gap-3">
              <div className="p-2 rounded-lg bg-primary/10 h-fit">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Spend Alerts</p>
                <p className="text-xs text-muted mt-1">
                  Get notified when daily spend exceeds or falls below a threshold
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="p-2 rounded-lg bg-primary/10 h-fit">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Conversion Alerts</p>
                <p className="text-xs text-muted mt-1">
                  Monitor conversion counts and rates for significant changes
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="p-2 rounded-lg bg-primary/10 h-fit">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">CTR Alerts</p>
                <p className="text-xs text-muted mt-1">
                  Track click-through rate changes across campaigns
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="p-2 rounded-lg bg-primary/10 h-fit">
                <TrendingDown className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">CPC Alerts</p>
                <p className="text-xs text-muted mt-1">
                  Stay informed about cost per click fluctuations
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>How Alerts Work</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted">
            <p>• Alerts are checked automatically on a schedule (configurable per alert)</p>
            <p>• You can also manually check alerts using the &quot;Check Now&quot; button</p>
            <p>• When an alert is triggered, an email is sent to all configured recipients</p>
            <p>• Alerts compare today&apos;s data with yesterday&apos;s data for percentage change conditions</p>
            <p>• Configure alerts to monitor all accounts or specific accounts</p>
          </div>
        </CardContent>
      </Card>

      {/* Create Alert Dialog */}
      <Dialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)}>
        <DialogHeader onClose={() => setShowCreateDialog(false)}>
          <DialogTitle>Create New Alert</DialogTitle>
          <DialogDescription>
            Set up a new automated alert to monitor your Google Ads performance
          </DialogDescription>
        </DialogHeader>
        <DialogContent>
          <CreateAlertForm
            onSuccess={() => {
              setShowCreateDialog(false)
              loadAlerts() // Reload alerts list
            }}
            onCancel={() => setShowCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
