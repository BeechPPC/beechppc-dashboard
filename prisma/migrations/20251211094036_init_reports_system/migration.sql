-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ReportFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM_CRON');

-- CreateEnum
CREATE TYPE "ScopeType" AS ENUM ('MCC', 'ACCOUNTS', 'ALL');

-- CreateEnum
CREATE TYPE "TemplateType" AS ENUM ('EXECUTIVE', 'DETAILED', 'KEYWORD', 'AUCTION', 'CUSTOM');

-- CreateEnum
CREATE TYPE "DateRangeType" AS ENUM ('YESTERDAY', 'LAST_7_DAYS', 'LAST_30_DAYS', 'THIS_MONTH', 'LAST_MONTH', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'GENERATING', 'GENERATED', 'SENDING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "RecipientFormat" AS ENUM ('HTML', 'PDF', 'BOTH');

-- CreateTable
CREATE TABLE "ReportSchedule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "reportType" "ReportType" NOT NULL,
    "frequency" "ReportFrequency" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "cronSchedule" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Australia/Melbourne',
    "nextRunAt" TIMESTAMP(3),
    "lastRunAt" TIMESTAMP(3),
    "lastRunStatus" TEXT,
    "scopeType" "ScopeType" NOT NULL,
    "accountIds" JSONB,
    "templateType" "TemplateType" NOT NULL,
    "sections" JSONB NOT NULL,
    "dateRangeType" "DateRangeType" NOT NULL,
    "recipientEmails" JSONB NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ReportSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportHistory" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT,
    "reportType" "ReportType" NOT NULL,
    "reportName" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateFrom" TIMESTAMP(3) NOT NULL,
    "dateTo" TIMESTAMP(3) NOT NULL,
    "accountIds" JSONB NOT NULL,
    "accountNames" JSONB NOT NULL,
    "htmlContent" TEXT,
    "pdfUrl" TEXT,
    "jsonData" JSONB,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "deliveryStatus" JSONB,
    "sentTo" JSONB,
    "sentAt" TIMESTAMP(3),
    "fileSizeBytes" INTEGER,
    "generationTimeMs" INTEGER,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "ReportHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recipient" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "timezone" TEXT,
    "preferredFormat" "RecipientFormat" DEFAULT 'BOTH',
    "unsubscribedAt" TIMESTAMP(3),
    "unsubscribeToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipientGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecipientGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipientGroupMember" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecipientGroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "templateType" TEXT NOT NULL,
    "sections" JSONB NOT NULL,
    "defaultDateRange" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReportSchedule_enabled_idx" ON "ReportSchedule"("enabled");

-- CreateIndex
CREATE INDEX "ReportSchedule_nextRunAt_idx" ON "ReportSchedule"("nextRunAt");

-- CreateIndex
CREATE INDEX "ReportSchedule_createdAt_idx" ON "ReportSchedule"("createdAt");

-- CreateIndex
CREATE INDEX "ReportHistory_scheduleId_idx" ON "ReportHistory"("scheduleId");

-- CreateIndex
CREATE INDEX "ReportHistory_reportType_idx" ON "ReportHistory"("reportType");

-- CreateIndex
CREATE INDEX "ReportHistory_status_idx" ON "ReportHistory"("status");

-- CreateIndex
CREATE INDEX "ReportHistory_generatedAt_idx" ON "ReportHistory"("generatedAt");

-- CreateIndex
CREATE INDEX "ReportHistory_createdAt_idx" ON "ReportHistory"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Recipient_email_key" ON "Recipient"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Recipient_unsubscribeToken_key" ON "Recipient"("unsubscribeToken");

-- CreateIndex
CREATE INDEX "Recipient_email_idx" ON "Recipient"("email");

-- CreateIndex
CREATE INDEX "Recipient_enabled_idx" ON "Recipient"("enabled");

-- CreateIndex
CREATE INDEX "RecipientGroup_name_idx" ON "RecipientGroup"("name");

-- CreateIndex
CREATE INDEX "RecipientGroupMember_recipientId_idx" ON "RecipientGroupMember"("recipientId");

-- CreateIndex
CREATE INDEX "RecipientGroupMember_groupId_idx" ON "RecipientGroupMember"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "RecipientGroupMember_recipientId_groupId_key" ON "RecipientGroupMember"("recipientId", "groupId");

-- CreateIndex
CREATE INDEX "ReportTemplate_isSystem_idx" ON "ReportTemplate"("isSystem");

-- CreateIndex
CREATE INDEX "ReportTemplate_isPublic_idx" ON "ReportTemplate"("isPublic");

-- CreateIndex
CREATE INDEX "ReportTemplate_createdBy_idx" ON "ReportTemplate"("createdBy");

-- AddForeignKey
ALTER TABLE "ReportHistory" ADD CONSTRAINT "ReportHistory_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "ReportSchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipientGroupMember" ADD CONSTRAINT "RecipientGroupMember_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "Recipient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipientGroupMember" ADD CONSTRAINT "RecipientGroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "RecipientGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
