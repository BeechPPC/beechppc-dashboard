/**
 * In-memory storage for generated reports
 * In production, this should be replaced with a database (Supabase, Redis, etc.)
 */

interface StoredReport {
  id: string
  accountName: string
  month: string
  html: string
  createdAt: Date
}

// In-memory storage (will be lost on server restart)
const reportStorage = new Map<string, StoredReport>()

export function storeReport(id: string, accountName: string, month: string, html: string): void {
  reportStorage.set(id, {
    id,
    accountName,
    month,
    html,
    createdAt: new Date(),
  })

  // Clean up old reports (keep last 100)
  if (reportStorage.size > 100) {
    const entries = Array.from(reportStorage.entries())
    entries.sort((a, b) => b[1].createdAt.getTime() - a[1].createdAt.getTime())
    const toDelete = entries.slice(100)
    toDelete.forEach(([id]) => reportStorage.delete(id))
  }
}

export function getReport(id: string): StoredReport | undefined {
  return reportStorage.get(id)
}

export function getAllReports(): StoredReport[] {
  return Array.from(reportStorage.values()).sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  )
}

export function deleteReport(id: string): boolean {
  return reportStorage.delete(id)
}
