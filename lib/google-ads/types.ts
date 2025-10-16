export interface GoogleAdsAccount {
  id: string
  name: string
  status: string
  currency: string
  manager?: boolean
}

export interface AccountMetrics {
  cost: number
  conversions: number
  clicks: number
  impressions: number
  avgCpc: number
  costPerConv: number
}

export interface AccountPerformance {
  id: string
  name: string
  currency: string
  yesterday: AccountMetrics
  previousDay?: AccountMetrics
}

export interface DashboardMetrics {
  totalSpend: number
  totalConversions: number
  totalClicks: number
  totalImpressions: number
  avgCpc: number
  avgCostPerConv: number
  changeVsPrevious: {
    spend: number
    conversions: number
    clicks: number
    impressions: number
  }
}
