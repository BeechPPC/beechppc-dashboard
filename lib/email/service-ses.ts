import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2'

interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
}

/**
 * Create SES client
 */
function createSESClient() {
  return new SESv2Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  })
}

/**
 * Send email using AWS SES
 */
export async function sendEmailSES({ to, subject, html }: EmailOptions) {
  try {
    const client = createSESClient()

    const recipients = Array.isArray(to) ? to : [to]

    const command = new SendEmailCommand({
      FromEmailAddress: process.env.EMAIL_FROM || process.env.EMAIL_USER!,
      Destination: {
        ToAddresses: recipients,
      },
      Content: {
        Simple: {
          Subject: {
            Data: subject,
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: html,
              Charset: 'UTF-8',
            },
          },
        },
      },
    })

    const response = await client.send(command)
    console.log('Email sent successfully via AWS SES:', response.MessageId)
    return { success: true, messageId: response.MessageId || 'unknown' }
  } catch (error) {
    console.error('Error sending email via AWS SES:', error)
    throw error
  }
}

/**
 * Send monthly report using AWS SES
 */
export async function sendMonthlyReportSES(
  htmlContent: string,
  accountName: string,
  month: string,
  recipients: string[]
) {
  return sendEmailSES({
    to: recipients,
    subject: `Monthly Report - ${accountName} - ${month}`,
    html: htmlContent,
  })
}
