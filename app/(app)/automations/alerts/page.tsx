'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bell, Plus, TrendingUp, TrendingDown, AlertTriangle, DollarSign, Target, Mail } from 'lucide-react'

interface Alert {
  id: string
  name: string
  type: 'spend' | 'conversions' | 'ctr' | 'cpc'
  condition: 'above' | 'below' | 'change'
  threshold: number
  enabled: boolean
  recipients: string[]
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: '1',
      name: 'High Spend Alert',
      type: 'spend',
      condition: 'above',
      threshold: 500,
      enabled: true,
      recipients: ['chris@beechppc.com'],
    },
    {
      id: '2',
      name: 'Low Conversion Rate',
      type: 'conversions',
      condition: 'below',
      threshold: 5,
      enabled: true,
      recipients: ['chris@beechppc.com'],
    },
    {
      id: '3',
      name: 'CTR Drop Alert',
      type: 'ctr',
      condition: 'change',
      threshold: 20,
      enabled: false,
      recipients: ['chris@beechppc.com'],
    },
  ])

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
    }
  }

  const getConditionLabel = (condition: Alert['condition'], threshold: number) => {
    switch (condition) {
      case 'above':
        return `above $${threshold}`
      case 'below':
        return `below ${threshold}`
      case 'change':
        return `changes by ${threshold}%`
    }
  }

  const toggleAlert = (id: string) => {
    setAlerts(alerts.map(alert =>
      alert.id === id ? { ...alert, enabled: !alert.enabled } : alert
    ))
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
        <Button size="lg" className="w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          New Alert
        </Button>
      </div>

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
              Triggered Today
            </CardDescription>
            <AlertTriangle className="h-4 w-4 text-muted" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted mt-1">
              No alerts triggered
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
            <div className="text-2xl font-bold">1</div>
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
                      <p className="text-sm text-muted mt-1">
                        {getAlertTypeLabel(alert.type)} {getConditionLabel(alert.condition, alert.threshold)}
                      </p>
                      <p className="text-xs text-muted mt-1">
                        Sends to: {alert.recipients.join(', ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleAlert(alert.id)}
                    >
                      {alert.enabled ? 'Disable' : 'Enable'}
                    </Button>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
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
                  Monitor conversion rates and receive alerts for significant changes
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
    </div>
  )
}
