'use client'

import { Calendar } from 'lucide-react'

export interface DateRange {
  from: string // YYYY-MM-DD format
  to: string   // YYYY-MM-DD format
}

interface DatePickerProps {
  value: DateRange
  onChange: (range: DateRange) => void
}

export function DatePicker({ value, onChange }: DatePickerProps) {
  const presets = [
    { label: 'Today', days: 0 },
    { label: 'Yesterday', days: 1 },
    { label: 'Last 7 Days', days: 7 },
    { label: 'Last 14 Days', days: 14 },
    { label: 'Last 30 Days', days: 30 },
    { label: 'Last 90 Days', days: 90 },
  ]

  const handlePreset = (days: number) => {
    const today = new Date()
    const to = new Date(today)

    if (days === 0) {
      // Today
      const from = formatDate(to)
      onChange({ from, to: from })
    } else if (days === 1) {
      // Yesterday
      to.setDate(to.getDate() - 1)
      const dateStr = formatDate(to)
      onChange({ from: dateStr, to: dateStr })
    } else {
      // Last N days
      const from = new Date(today)
      from.setDate(from.getDate() - days + 1)
      onChange({
        from: formatDate(from),
        to: formatDate(today),
      })
    }
  }

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0]
  }

  return (
    <div className="space-y-4">
      {/* Preset Buttons */}
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button
            key={preset.label}
            onClick={() => handlePreset(preset.days)}
            className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-primary/10 hover:border-primary transition-colors"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Custom Date Range */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1.5">
            From
          </label>
          <div className="relative">
            <input
              type="date"
              value={value.from}
              onChange={(e) => onChange({ ...value, from: e.target.value })}
              max={value.to || formatDate(new Date())}
              className="w-full px-3 py-2 pl-10 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
            />
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
          </div>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium mb-1.5">
            To
          </label>
          <div className="relative">
            <input
              type="date"
              value={value.to}
              onChange={(e) => onChange({ ...value, to: e.target.value })}
              min={value.from}
              max={formatDate(new Date())}
              className="w-full px-3 py-2 pl-10 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
            />
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  )
}
