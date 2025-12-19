import { jsPDF } from 'jspdf'

// Beech PPC Brand Colors (from Design System)
const COLORS = {
  primary: '#f59e0b', // amber-500 (primary yellow)
  lightYellow: '#fef3c7', // amber-100
  cream: '#fefce8', // yellow-50
  darkText: '#111827', // gray-900
  mediumText: '#374151', // gray-700
  mutedText: '#6b7280', // gray-500
  border: '#fde68a', // amber-200
  success: '#10b981', // green-500
}

interface ReportSection {
  title: string
  content: string
  keyPoints?: string[]
}

interface ReportMetadata {
  url: string
  companyName?: string
  analyzedDate: string
  reportType: string
}

interface ReportData {
  metadata: ReportMetadata
  sections: {
    existentialPurpose?: ReportSection
    targetMarket?: ReportSection
    offerings?: ReportSection
    differentiation?: ReportSection
    trustSignals?: ReportSection
    ppcStrategy?: ReportSection
  }
}

/**
 * Generate a professional PDF Business Clarity Report
 */
export async function generateBusinessClarityPDF(reportData: ReportData): Promise<Buffer> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const contentWidth = pageWidth - margin * 2
  let yPosition = margin

  // Helper function to add a new page if needed
  const checkPageBreak = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      doc.addPage()
      yPosition = margin
      return true
    }
    return false
  }

  // Helper function to wrap text
  const wrapText = (text: string, maxWidth: number): string[] => {
    return doc.splitTextToSize(text, maxWidth)
  }

  // ===== COVER PAGE =====
  // Header with brand color
  doc.setFillColor(COLORS.primary)
  doc.rect(0, 0, pageWidth, 60, 'F')

  // Beech PPC Logo/Title
  doc.setTextColor('#FFFFFF')
  doc.setFontSize(28)
  doc.setFont('helvetica', 'bold')
  doc.text('Beech PPC', margin, 25)

  // Report Title
  doc.setFontSize(20)
  doc.setFont('helvetica', 'normal')
  doc.text('Business Clarity Report', margin, 40)

  yPosition = 80

  // Company Name
  doc.setTextColor(COLORS.primary)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  const companyName = reportData.metadata.companyName || new URL(reportData.metadata.url).hostname
  doc.text(companyName, margin, yPosition)
  yPosition += 15

  // URL
  doc.setTextColor(COLORS.mediumText)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(reportData.metadata.url, margin, yPosition)
  yPosition += 20

  // Date
  doc.setTextColor(COLORS.mutedText)
  doc.setFontSize(11)
  const formattedDate = new Date(reportData.metadata.analyzedDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  doc.text(`Analysis Date: ${formattedDate}`, margin, yPosition)
  yPosition += 40

  // Disclaimer / Introduction
  doc.setFillColor(COLORS.cream)
  doc.rect(margin, yPosition, contentWidth, 45, 'F')
  yPosition += 10

  doc.setTextColor(COLORS.mediumText)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'italic')
  const disclaimer = wrapText(
    'This report provides a comprehensive analysis of the business across six key dimensions: purpose, target market, offerings, differentiation, trust signals, and PPC strategy opportunities. The insights are based on publicly available information from the company website.',
    contentWidth - 10
  )
  disclaimer.forEach((line) => {
    doc.text(line, margin + 5, yPosition)
    yPosition += 5
  })

  // Add page footer
  const addFooter = (pageNum: number) => {
    doc.setTextColor(COLORS.mutedText)
    doc.setFontSize(9)
    doc.text(
      `Business Clarity Report - ${companyName}`,
      margin,
      pageHeight - 10
    )
    doc.text(
      `Page ${pageNum}`,
      pageWidth - margin - 20,
      pageHeight - 10
    )
  }

  addFooter(1)

  // ===== SECTIONS =====
  const sections = [
    { key: 'existentialPurpose', data: reportData.sections.existentialPurpose },
    { key: 'targetMarket', data: reportData.sections.targetMarket },
    { key: 'offerings', data: reportData.sections.offerings },
    { key: 'differentiation', data: reportData.sections.differentiation },
    { key: 'trustSignals', data: reportData.sections.trustSignals },
    { key: 'ppcStrategy', data: reportData.sections.ppcStrategy },
  ]

  let pageNumber = 2

  for (const section of sections) {
    if (!section.data) continue

    // Start new page for each section
    doc.addPage()
    yPosition = margin

    // Section Header with accent color bar
    doc.setFillColor(COLORS.primary)
    doc.rect(margin, yPosition, 5, 12, 'F')

    doc.setTextColor(COLORS.darkText)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text(section.data.title, margin + 10, yPosition + 9)
    yPosition += 20

    // Section Content
    doc.setTextColor(COLORS.mediumText)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    const contentLines = wrapText(section.data.content, contentWidth)
    contentLines.forEach((line) => {
      checkPageBreak(10)
      doc.text(line, margin, yPosition)
      yPosition += 6
    })

    yPosition += 10

    // Key Points
    if (section.data.keyPoints && section.data.keyPoints.length > 0) {
      doc.setTextColor(COLORS.primary)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      checkPageBreak(10)
      doc.text('Key Insights:', margin, yPosition)
      yPosition += 8

      doc.setTextColor(COLORS.mediumText)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')

      section.data.keyPoints.forEach((point) => {
        checkPageBreak(15)

        // Bullet point
        doc.setFillColor(COLORS.primary)
        doc.circle(margin + 2, yPosition - 1.5, 1.5, 'F')

        // Point text
        const pointLines = wrapText(point, contentWidth - 10)
        pointLines.forEach((line, index) => {
          if (index > 0) checkPageBreak(6)
          doc.text(line, margin + 8, yPosition)
          yPosition += 6
        })

        yPosition += 2
      })
    }

    addFooter(pageNumber)
    pageNumber++
  }

  // ===== FINAL PAGE - NEXT STEPS =====
  doc.addPage()
  yPosition = margin

  doc.setFillColor(COLORS.primary)
  doc.rect(margin, yPosition, 5, 12, 'F')

  doc.setTextColor(COLORS.darkText)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('Next Steps', margin + 10, yPosition + 9)
  yPosition += 20

  doc.setTextColor(COLORS.mediumText)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')

  const nextSteps = [
    'Review the PPC Strategy Opportunities section for immediate campaign ideas',
    'Identify gaps in messaging that can be addressed in ad copy',
    'Use the target market insights to refine audience targeting',
    'Leverage trust signals in ad extensions and landing pages',
    'Schedule a strategy session to discuss campaign implementation',
  ]

  nextSteps.forEach((step, index) => {
    checkPageBreak(15)

    // Number
    doc.setFillColor(COLORS.primary)
    doc.circle(margin + 3, yPosition - 1.5, 3, 'F')
    doc.setTextColor('#FFFFFF')
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text(`${index + 1}`, margin + 1.5, yPosition + 1)

    // Step text
    doc.setTextColor(COLORS.mediumText)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const stepLines = wrapText(step, contentWidth - 15)
    stepLines.forEach((line, lineIndex) => {
      if (lineIndex > 0) checkPageBreak(6)
      doc.text(line, margin + 10, yPosition)
      yPosition += 6
    })

    yPosition += 4
  })

  yPosition += 20

  // Contact footer
  doc.setFillColor(COLORS.lightYellow)
  doc.rect(margin, yPosition, contentWidth, 30, 'F')
  yPosition += 10

  doc.setTextColor(COLORS.darkText)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Prepared by Beech PPC', margin + 5, yPosition)
  yPosition += 8

  doc.setTextColor(COLORS.mediumText)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Professional PPC Management & Strategy', margin + 5, yPosition)

  addFooter(pageNumber)

  // Convert to buffer
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
  return pdfBuffer
}