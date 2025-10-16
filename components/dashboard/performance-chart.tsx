'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface Account {
  name: string
  yesterday: {
    cost: number
    conversions: number
  }
}

interface PerformanceChartProps {
  accounts: Account[]
}

export function PerformanceChart({ accounts }: PerformanceChartProps) {
  const chartData = accounts.slice(0, 5).map((account) => ({
    name: account.name.length > 12 ? account.name.substring(0, 12) + '...' : account.name,
    fullName: account.name,
    spend: account.yesterday.cost,
    conversions: account.yesterday.conversions,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Accounts by Spend</CardTitle>
        <CardDescription>Yesterday&apos;s performance comparison</CardDescription>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#fde68a" />
            <XAxis
              dataKey="name"
              tick={{ fill: '#4b5563', fontSize: 10 }}
              angle={-45}
              textAnchor="end"
              height={70}
              interval={0}
            />
            <YAxis
              tick={{ fill: '#4b5563', fontSize: 10 }}
              width={40}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #fde68a',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              labelFormatter={(label, payload) => {
                if (payload && payload.length > 0) {
                  return payload[0].payload.fullName
                }
                return label
              }}
            />
            <Bar dataKey="spend" fill="#f59e0b" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
