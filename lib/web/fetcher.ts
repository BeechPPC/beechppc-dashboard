/**
 * Web fetching utility for extracting website content
 * Used by business clarity report and other skills that need to analyze websites
 */

export interface WebsiteContent {
  url: string
  title: string
  metaDescription: string
  headings: Array<{ level: number; text: string }>
  paragraphs: string[]
  links: Array<{ text: string; href: string }>
  content: string // Full text content
  error?: string
}

/**
 * Fetch and parse website content
 */
export async function fetchWebsiteContent(url: string): Promise<WebsiteContent> {
  // Ensure URL has protocol
  let fullUrl = url
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    fullUrl = `https://${url}`
  }

  // Validate URL format
  try {
    new URL(fullUrl)
  } catch {
    return {
      url,
      title: '',
      metaDescription: '',
      headings: [],
      paragraphs: [],
      links: [],
      content: '',
      error: `Invalid URL format: ${url}`,
    }
  }

  // Create AbortController for timeout (compatible with all Node.js versions)
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15000)

  try {
    // Fetch the page
    const response = await fetch(fullUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BeechPPC-Bot/1.0; +https://beechppc.com)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    // Check content type
    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      throw new Error(`Expected HTML content but got ${contentType}`)
    }

    const html = await response.text()
    
    // Validate we got actual HTML content
    if (!html || html.trim().length === 0) {
      throw new Error('Received empty response')
    }

    // Check if response looks like an error page
    if (html.includes('Internal Server Error') || html.includes('Error 500') || html.includes('500 Internal')) {
      throw new Error('Server returned an error page')
    }

    return parseHtmlContent(fullUrl, html)
  } catch (error) {
    clearTimeout(timeoutId)
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.name === 'AbortError' || error.message.includes('timeout') || error.message.includes('aborted')) {
        return {
          url,
          title: '',
          metaDescription: '',
          headings: [],
          paragraphs: [],
          links: [],
          content: '',
          error: 'Request timed out. The website may be slow or unreachable.',
        }
      }
      if (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
        return {
          url,
          title: '',
          metaDescription: '',
          headings: [],
          paragraphs: [],
          links: [],
          content: '',
          error: 'Could not connect to the website. Please check the URL and try again.',
        }
      }
    }

    return {
      url,
      title: '',
      metaDescription: '',
      headings: [],
      paragraphs: [],
      links: [],
      content: '',
      error: error instanceof Error ? error.message : 'Unknown error fetching website',
    }
  }
}

/**
 * Parse HTML content to extract structured data
 * Uses regex-based parsing (lightweight, no dependencies)
 */
function parseHtmlContent(url: string, html: string): WebsiteContent {
  // Remove script and style tags
  const cleanHtml = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')

  // Extract title
  const titleMatch = cleanHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  const title = titleMatch ? stripHtml(titleMatch[1]).trim() : ''

  // Extract meta description
  const metaDescMatch = cleanHtml.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*?)["']/i)
  const metaDescription = metaDescMatch ? metaDescMatch[1].trim() : ''

  // Extract headings (h1-h6)
  const headings: Array<{ level: number; text: string }> = []
  const headingRegex = /<h([1-6])[^>]*>([\s\S]*?)<\/h[1-6]>/gi
  let headingMatch
  while ((headingMatch = headingRegex.exec(cleanHtml)) !== null) {
    const level = parseInt(headingMatch[1], 10)
    const text = stripHtml(headingMatch[2]).trim()
    if (text) {
      headings.push({ level, text })
    }
  }

  // Extract paragraphs
  const paragraphs: string[] = []
  const paragraphRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi
  let paraMatch
  while ((paraMatch = paragraphRegex.exec(cleanHtml)) !== null) {
    const text = stripHtml(paraMatch[1]).trim()
    if (text && text.length > 20) {
      // Only include substantial paragraphs
      paragraphs.push(text)
    }
  }

  // Extract links
  const links: Array<{ text: string; href: string }> = []
  const linkRegex = /<a[^>]*href=["']([^"']*?)["'][^>]*>([\s\S]*?)<\/a>/gi
  let linkMatch
  while ((linkMatch = linkRegex.exec(cleanHtml)) !== null) {
    let href = linkMatch[1].trim()
    const text = stripHtml(linkMatch[2]).trim()

    // Convert relative URLs to absolute
    if (href && !href.startsWith('http') && !href.startsWith('mailto:') && !href.startsWith('#')) {
      try {
        const baseUrl = new URL(url)
        href = new URL(href, baseUrl).toString()
      } catch {
        // Skip invalid URLs
        continue
      }
    }

    if (href && text && href.startsWith('http')) {
      links.push({ text, href })
    }
  }

  // Extract main content (body text)
  const bodyMatch = cleanHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  const bodyContent = bodyMatch ? bodyMatch[1] : cleanHtml
  const content = stripHtml(bodyContent)
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 10000) // Limit to 10k chars

  return {
    url,
    title,
    metaDescription,
    headings,
    paragraphs,
    links,
    content,
  }
}

/**
 * Strip HTML tags and decode entities
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ') // Remove HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&[#\w]+;/g, ' ') // Remove other entities
    .replace(/\s+/g, ' ')
    .trim()
}

