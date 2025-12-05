/**
 * Email Reading Service
 * Reads emails from IMAP server to extract meeting information
 */

import Imap from 'imap'
import { simpleParser, ParsedMail } from 'mailparser'
import { Readable } from 'stream'

export interface EmailMessage {
  uid: number
  subject: string
  from: string
  date: Date
  text: string
  html: string
  attachments: Array<{
    filename: string
    contentType: string
    content: Buffer
  }>
}

/**
 * Create IMAP connection
 */
function createImapConnection(): Imap {
  const emailUser = process.env.EMAIL_USER
  const emailPassword = process.env.EMAIL_PASSWORD
  const emailHost = process.env.EMAIL_HOST || 'imap.gmail.com'
  const emailPort = parseInt(process.env.EMAIL_IMAP_PORT || '993')

  if (!emailUser || !emailPassword) {
    throw new Error('EMAIL_USER and EMAIL_PASSWORD must be configured for email reading')
  }

  return new Imap({
    user: emailUser,
    password: emailPassword,
    host: emailHost,
    port: emailPort,
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
  })
}

/**
 * Connect to IMAP server
 */
function connectImap(): Promise<Imap> {
  return new Promise((resolve, reject) => {
    const imap = createImapConnection()

    imap.once('ready', () => {
      resolve(imap)
    })

    imap.once('error', (err: Error) => {
      reject(err)
    })

    imap.connect()
  })
}

/**
 * Fetch emails from inbox
 */
export async function fetchEmails(
  options: {
    since?: Date
    limit?: number
    searchCriteria?: string[]
  } = {}
): Promise<EmailMessage[]> {
  const { since, limit = 50, searchCriteria = ['UNSEEN'] } = options

  const imap = await connectImap()

  return new Promise((resolve, reject) => {
    imap.openBox('INBOX', false, (err) => {
      if (err) {
        imap.end()
        reject(err)
        return
      }

      // Build search criteria
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const criteria: any[] = [...searchCriteria]
      if (since) {
        criteria.push(['SINCE', since])
      }

      imap.search(criteria, (err, results) => {
        if (err) {
          imap.end()
          reject(err)
          return
        }

        if (!results || results.length === 0) {
          imap.end()
          resolve([])
          return
        }

        // Limit results
        const uids = results.slice(-limit).reverse() // Most recent first

        const fetch = imap.fetch(uids, {
          bodies: '',
          struct: true,
        })

        const emails: EmailMessage[] = []
        let processedCount = 0

        fetch.on('message', (msg, seqno) => {
          let emailData: ParsedMail | null = null

          msg.on('body', (stream) => {
            simpleParser(stream as Readable, (err, parsed) => {
              if (err) {
                console.error('Error parsing email:', err)
                processedCount++
                if (processedCount === uids.length) {
                  imap.end()
                  resolve(emails)
                }
                return
              }
              emailData = parsed
            })
          })

          msg.once('end', () => {
            if (emailData) {
              emails.push({
                uid: seqno,
                subject: emailData.subject || '',
                from: emailData.from?.text || '',
                date: emailData.date || new Date(),
                text: emailData.text || '',
                html: emailData.html || emailData.textAsHtml || '',
                attachments: (emailData.attachments || []).map((att) => ({
                  filename: att.filename || 'attachment',
                  contentType: att.contentType || 'application/octet-stream',
                  content: att.content as Buffer,
                })),
              })
            }
            processedCount++
            if (processedCount === uids.length) {
              imap.end()
              resolve(emails)
            }
          })
        })

        fetch.once('error', (err) => {
          imap.end()
          reject(err)
        })

        fetch.once('end', () => {
          // Only end if all messages processed
          if (processedCount === uids.length) {
            imap.end()
            resolve(emails)
          }
        })
      })
    })
  })
}

/**
 * Search emails by subject or content
 */
export async function searchEmails(
  query: string,
  options: { limit?: number; since?: Date } = {}
): Promise<EmailMessage[]> {
  const { limit = 50, since } = options

  const imap = await connectImap()

  return new Promise((resolve, reject) => {
    imap.openBox('INBOX', false, (err) => {
      if (err) {
        imap.end()
        reject(err)
        return
      }

      // Build search criteria
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const criteria: any[] = [['SUBJECT', query], ['OR', ['BODY', query], ['TEXT', query]]]
      if (since) {
        criteria.push(['SINCE', since])
      }

      imap.search(criteria, (err, results) => {
        if (err) {
          imap.end()
          reject(err)
          return
        }

        if (!results || results.length === 0) {
          imap.end()
          resolve([])
          return
        }

        const uids = results.slice(-limit).reverse()

        const fetch = imap.fetch(uids, {
          bodies: '',
          struct: true,
        })

        const emails: EmailMessage[] = []
        let processedCount = 0

        fetch.on('message', (msg, seqno) => {
          let emailData: ParsedMail | null = null

          msg.on('body', (stream) => {
            simpleParser(stream as Readable, (err, parsed) => {
              if (err) {
                console.error('Error parsing email:', err)
                processedCount++
                if (processedCount === uids.length) {
                  imap.end()
                  resolve(emails)
                }
                return
              }
              emailData = parsed
            })
          })

          msg.once('end', () => {
            if (emailData) {
              emails.push({
                uid: seqno,
                subject: emailData.subject || '',
                from: emailData.from?.text || '',
                date: emailData.date || new Date(),
                text: emailData.text || '',
                html: emailData.html || emailData.textAsHtml || '',
                attachments: (emailData.attachments || []).map((att) => ({
                  filename: att.filename || 'attachment',
                  contentType: att.contentType || 'application/octet-stream',
                  content: att.content as Buffer,
                })),
              })
            }
            processedCount++
            if (processedCount === uids.length) {
              imap.end()
              resolve(emails)
            }
          })
        })

        fetch.once('error', (err) => {
          imap.end()
          reject(err)
        })

        fetch.once('end', () => {
          // Only end if all messages processed
          if (processedCount === uids.length) {
            imap.end()
            resolve(emails)
          }
        })
      })
    })
  })
}

/**
 * Get recent emails (last 24 hours)
 */
export async function getRecentEmails(limit: number = 20): Promise<EmailMessage[]> {
  const since = new Date()
  since.setDate(since.getDate() - 1) // Last 24 hours

  return fetchEmails({ since, limit })
}

