import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

interface KeywordData {
  keyword: string
  avgMonthlySearches: number
  competition: string
  competitionIndex: number
  lowTopOfPageBid: number
  highTopOfPageBid: number
  theme?: string
  searchIntent?: string
  aiInsights?: string
}

export async function POST(request: NextRequest) {
  try {
    const { keywords } = await request.json()

    if (!keywords || keywords.length === 0) {
      return NextResponse.json(
        { error: 'No keywords provided' },
        { status: 400 }
      )
    }

    // Initialize Google Ads OAuth2 client (reuse existing credentials)
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_ADS_CLIENT_ID!,
      process.env.GOOGLE_ADS_CLIENT_SECRET!,
    )

    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!,
    })

    const sheets = google.sheets({ version: 'v4', auth: oauth2Client })

    // Create a new spreadsheet
    const spreadsheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: `Keyword Research - ${new Date().toLocaleDateString()}`,
        },
        sheets: [
          {
            properties: {
              title: 'Keywords',
            },
          },
        ],
      },
    })

    const spreadsheetId = spreadsheet.data.spreadsheetId!

    // Prepare data for the sheet
    const headers = [
      'Keyword',
      'Avg Monthly Searches',
      'Competition',
      'Competition Index',
      'Low Bid ($)',
      'High Bid ($)',
      'Theme',
      'Search Intent',
      'AI Insights',
    ]

    const rows = keywords.map((k: KeywordData) => [
      k.keyword,
      k.avgMonthlySearches,
      k.competition,
      k.competitionIndex,
      k.lowTopOfPageBid.toFixed(2),
      k.highTopOfPageBid.toFixed(2),
      k.theme || '',
      k.searchIntent || '',
      k.aiInsights || '',
    ])

    // Write data to the sheet
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Keywords!A1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [headers, ...rows],
      },
    })

    // Format the header row
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 0,
                endRowIndex: 1,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: {
                    red: 0.2,
                    green: 0.5,
                    blue: 0.8,
                  },
                  textFormat: {
                    foregroundColor: {
                      red: 1,
                      green: 1,
                      blue: 1,
                    },
                    bold: true,
                  },
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)',
            },
          },
          {
            autoResizeDimensions: {
              dimensions: {
                sheetId: 0,
                dimension: 'COLUMNS',
                startIndex: 0,
                endIndex: 9,
              },
            },
          },
        ],
      },
    })

    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`

    return NextResponse.json({
      success: true,
      spreadsheetId,
      spreadsheetUrl,
    })

  } catch (error) {
    console.error('Google Sheets export error:', error)
    const message = error instanceof Error ? error.message : 'Failed to export to Google Sheets'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
