'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface PerformanceChartProps {
  accounts: any[]
}

export function PerformanceChart({ accounts }: PerformanceChartProps) {
  const chartData = accounts.slice(0, 5).map((account) => ({
    name: account.name.length > 15 ? account.name.substring(0, 15) + '...' : account.name,
    spend: account.yesterday.cost,
    conversions: account.yesterday.conversions,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Accounts by Spend</CardTitle>
        <CardDescription>Yesterday's performance comparison</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#fde68a" />
            <XAxis
              dataKey="name"
              tick={{ fill: '#4b5563', fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis tick={{ fill: '#4b5563', fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #fde68a',
                borderRadius: '8px',
              }}
            />
            <Bar dataKey="spend" fill="#f59e0b" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
