/**
 * Report Types - Shared between frontend and backend
 * Based on Prisma schema
 */

// Re-export Prisma enums
export {
  ReportType,
  ReportFrequency,
  ScopeType,
  TemplateType,
  DateRangeType,
  ReportStatus,
  RecipientFormat,
} from '@prisma/client'

// Frontend-friendly types
export interface ReportSchedule {
  id: string
  name: string
  description?: string | null
  reportType: string
  frequency: string
  enabled: boolean
  cronSchedule: string
  timezone: string
  nextRunAt?: Date | null
  lastRunAt?: Date | null
  lastRunStatus?: string | null
  scopeType: string
  accountIds?: any
  templateType: string
  sections: any
  dateRangeType: string
  recipientEmails: any
  createdBy?: string | null
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
}

export interface ReportHistory {
  id: string
  scheduleId?: string | null
  reportType: string
  reportName: string
  generatedAt: Date
  dateFrom: Date
  dateTo: Date
  accountIds: any
  accountNames: any
  htmlContent?: string | null
  pdfUrl?: string | null
  jsonData?: any
  status: string
  deliveryStatus?: any
  sentTo?: any
  sentAt?: Date | null
  fileSizeBytes?: number | null
  generationTimeMs?: number | null
  errorMessage?: string | null
  createdAt: Date
  expiresAt?: Date | null
}

export interface Recipient {
  id: string
  email: string
  name?: string | null
  enabled: boolean
  timezone?: string | null
  preferredFormat?: string | null
  unsubscribedAt?: Date | null
  unsubscribeToken?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface RecipientGroup {
  id: string
  name: string
  description?: string | null
  createdAt: Date
  updatedAt: Date
}

// API Request/Response types
export interface CreateScheduleRequest {
  name: string
  description?: string
  reportType: string
  frequency: string
  cronSchedule: string
  timezone: string
  scopeType: string
  accountIds?: string[]
  templateType: string
  sections: Record<string, boolean>
  dateRangeType: string
  recipientEmails: string[]
}

export interface UpdateScheduleRequest extends Partial<CreateScheduleRequest> {
  enabled?: boolean
}

export interface ScheduleListResponse {
  success: boolean
  schedules: ReportSchedule[]
  error?: string
}

export interface ScheduleResponse {
  success: boolean
  schedule?: ReportSchedule
  error?: string
}

export interface HistoryListResponse {
  success: boolean
  reports: ReportHistory[]
  total: number
  page: number
  pageSize: number
  error?: string
}