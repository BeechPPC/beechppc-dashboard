import nodemailer from 'nodemailer'

interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
}

/**
 * Create email transporter
 */
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  })
}

/**
 * Get business name from settings
 */
async function getBusinessName(): Promise<string> {
  try {
    const { getSettings } = await import('@/lib/settings/storage')
    const settings = await getSettings()
    return settings.companyName || 'PPC AI Agent'
  } catch (error) {
    console.error('Error loading business name for email:', error)
    return 'PPC AI Agent'
  }
}

/**
 * Send email
 */
export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    const transporter = createTransporter()
    const businessName = await getBusinessName()

    const mailOptions = {
      from: {
        name: businessName,
        address: process.env.EMAIL_USER!,
      },
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('Email sent successfully:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Error sending email:', error)
    throw error
  }
}

/**
 * Send daily MCC report email
 */
export async function sendDailyReport(htmlContent: string, reportDate: Date, recipients: string[]) {
  const formattedDate = reportDate.toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return sendEmail({
    to: recipients,
    subject: `Daily MCC Report - ${formattedDate}`,
    html: htmlContent,
  })
}

/**
 * Verify email configuration
 */
export async function verifyEmailConfig() {
  try {
    const transporter = createTransporter()
    await transporter.verify()
    console.log('Email configuration verified successfully')
    return true
  } catch (error) {
    console.error('Email configuration verification failed:', error)
    return false
  }
}
