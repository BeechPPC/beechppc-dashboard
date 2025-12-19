import { google } from 'googleapis'

// Beech PPC Brand Colors (in RGB format for Google Slides)
// Converted from hex to RGB decimal (0-1 range)
const COLORS = {
  primary: { red: 0.96, green: 0.62, blue: 0.04 }, // #f59e0b (amber-500)
  lightYellow: { red: 0.996, green: 0.953, blue: 0.78 }, // #fef3c7 (amber-100)
  cream: { red: 0.996, green: 0.988, blue: 0.91 }, // #fefce8 (yellow-50)
  darkText: { red: 0.067, green: 0.094, blue: 0.153 }, // #111827 (gray-900)
  mediumText: { red: 0.216, green: 0.255, blue: 0.318 }, // #374151 (gray-700)
  mutedText: { red: 0.42, green: 0.447, blue: 0.502 }, // #6b7280 (gray-500)
  white: { red: 1, green: 1, blue: 1 },
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

// Initialize OAuth2 client
function getOAuth2Client() {
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET
  const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN

  console.log('[Slides Generator] OAuth Config Check:', {
    hasClientId: !!clientId,
    hasClientSecret: !!clientSecret,
    hasRefreshToken: !!refreshToken,
    refreshTokenPrefix: refreshToken?.substring(0, 10) + '...',
  })

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      'Google OAuth credentials not configured. Please set GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET, and GOOGLE_ADS_REFRESH_TOKEN'
    )
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    'urn:ietf:wg:oauth:2.0:oob'
  )

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  })

  return oauth2Client
}

/**
 * Generate a professional Google Slides Business Clarity Report
 * and save it to Google Drive
 */
export async function generateBusinessClaritySlides(
  reportData: ReportData
): Promise<{
  presentationId: string
  presentationUrl: string
  driveFileId: string
  driveFolderId?: string
}> {
  const auth = getOAuth2Client()
  const slides = google.slides({ version: 'v1', auth })
  const drive = google.drive({ version: 'v3', auth })

  const companyName = reportData.metadata.companyName || new URL(reportData.metadata.url).hostname

  // Create a new presentation
  const presentation = await slides.presentations.create({
    requestBody: {
      title: `Business Clarity Report - ${companyName}`,
    },
  })

  const presentationId = presentation.data.presentationId!
  const requests: any[] = []

  // Get the default slide (we'll replace it with our title slide)
  const defaultSlideId = presentation.data.slides?.[0]?.objectId

  // ===== SLIDE 1: TITLE SLIDE =====
  if (defaultSlideId) {
    // Delete elements from default slide
    requests.push({
      deleteObject: {
        objectId: defaultSlideId,
      },
    })
  }

  // Create title slide
  const titleSlideId = 'titleSlide'
  requests.push({
    createSlide: {
      objectId: titleSlideId,
      slideLayoutReference: {
        predefinedLayout: 'BLANK',
      },
    },
  })

  // Title slide background
  requests.push({
    updatePageProperties: {
      objectId: titleSlideId,
      pageProperties: {
        pageBackgroundFill: {
          solidFill: {
            color: {
              rgbColor: COLORS.primary,
            },
          },
        },
      },
      fields: 'pageBackgroundFill',
    },
  })

  // Company name
  requests.push({
    createShape: {
      objectId: `${titleSlideId}_companyName`,
      shapeType: 'TEXT_BOX',
      elementProperties: {
        pageObjectId: titleSlideId,
        size: {
          width: { magnitude: 650, unit: 'PT' },
          height: { magnitude: 100, unit: 'PT' },
        },
        transform: {
          scaleX: 1,
          scaleY: 1,
          translateX: 25,
          translateY: 150,
          unit: 'PT'
        },
      },
    },
  })

  requests.push({
    insertText: {
      objectId: `${titleSlideId}_companyName`,
      text: companyName,
    },
  })

  requests.push({
    updateTextStyle: {
      objectId: `${titleSlideId}_companyName`,
      style: {
        fontSize: { magnitude: 44, unit: 'PT' },
        fontFamily: 'Arial',
        bold: true,
        foregroundColor: {
          opaqueColor: { rgbColor: COLORS.white },
        },
      },
      fields: 'fontSize,fontFamily,bold,foregroundColor',
    },
  })

  // Report title
  requests.push({
    createShape: {
      objectId: `${titleSlideId}_reportTitle`,
      shapeType: 'TEXT_BOX',
      elementProperties: {
        pageObjectId: titleSlideId,
        size: {
          width: { magnitude: 650, unit: 'PT' },
          height: { magnitude: 80, unit: 'PT' },
        },
        transform: {
          scaleX: 1,
          scaleY: 1,
          translateX: 25,
          translateY: 270,
          unit: 'PT'
        },
      },
    },
  })

  requests.push({
    insertText: {
      objectId: `${titleSlideId}_reportTitle`,
      text: 'Business Clarity Report',
    },
  })

  requests.push({
    updateTextStyle: {
      objectId: `${titleSlideId}_reportTitle`,
      style: {
        fontSize: { magnitude: 28, unit: 'PT' },
        fontFamily: 'Arial',
        foregroundColor: {
          opaqueColor: { rgbColor: COLORS.lightYellow },
        },
      },
      fields: 'fontSize,fontFamily,foregroundColor',
    },
  })

  // Date
  const formattedDate = new Date(reportData.metadata.analyzedDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  requests.push({
    createShape: {
      objectId: `${titleSlideId}_date`,
      shapeType: 'TEXT_BOX',
      elementProperties: {
        pageObjectId: titleSlideId,
        size: {
          width: { magnitude: 650, unit: 'PT' },
          height: { magnitude: 40, unit: 'PT' },
        },
        transform: {
          scaleX: 1,
          scaleY: 1,
          translateX: 25,
          translateY: 380,
          unit: 'PT'
        },
      },
    },
  })

  requests.push({
    insertText: {
      objectId: `${titleSlideId}_date`,
      text: formattedDate,
    },
  })

  requests.push({
    updateTextStyle: {
      objectId: `${titleSlideId}_date`,
      style: {
        fontSize: { magnitude: 14, unit: 'PT' },
        fontFamily: 'Arial',
        foregroundColor: {
          opaqueColor: { rgbColor: COLORS.white },
        },
      },
      fields: 'fontSize,fontFamily,foregroundColor',
    },
  })

  // Beech PPC branding footer
  requests.push({
    createShape: {
      objectId: `${titleSlideId}_branding`,
      shapeType: 'TEXT_BOX',
      elementProperties: {
        pageObjectId: titleSlideId,
        size: {
          width: { magnitude: 650, unit: 'PT' },
          height: { magnitude: 40, unit: 'PT' },
        },
        transform: {
          scaleX: 1,
          scaleY: 1,
          translateX: 25,
          translateY: 500,
          unit: 'PT'
        },
      },
    },
  })

  requests.push({
    insertText: {
      objectId: `${titleSlideId}_branding`,
      text: 'Prepared by Beech PPC',
    },
  })

  requests.push({
    updateTextStyle: {
      objectId: `${titleSlideId}_branding`,
      style: {
        fontSize: { magnitude: 12, unit: 'PT' },
        fontFamily: 'Arial',
        italic: true,
        foregroundColor: {
          opaqueColor: { rgbColor: COLORS.lightYellow },
        },
      },
      fields: 'fontSize,fontFamily,italic,foregroundColor',
    },
  })

  // ===== SECTION SLIDES =====
  const sections = [
    { key: 'existentialPurpose', data: reportData.sections.existentialPurpose },
    { key: 'targetMarket', data: reportData.sections.targetMarket },
    { key: 'offerings', data: reportData.sections.offerings },
    { key: 'differentiation', data: reportData.sections.differentiation },
    { key: 'trustSignals', data: reportData.sections.trustSignals },
    { key: 'ppcStrategy', data: reportData.sections.ppcStrategy },
  ]

  sections.forEach((section, index) => {
    if (!section.data) return

    const slideId = `section_${section.key}`

    // Create slide
    requests.push({
      createSlide: {
        objectId: slideId,
        slideLayoutReference: {
          predefinedLayout: 'BLANK',
        },
      },
    })

    // Accent bar at top
    requests.push({
      createShape: {
        objectId: `${slideId}_accentBar`,
        shapeType: 'RECTANGLE',
        elementProperties: {
          pageObjectId: slideId,
          size: {
            width: { magnitude: 720, unit: 'PT' },
            height: { magnitude: 10, unit: 'PT' },
          },
          transform: {
            scaleX: 1,
            scaleY: 1,
            translateX: 0,
            translateY: 0,
            unit: 'PT'
          },
        },
      },
    })

    requests.push({
      updateShapeProperties: {
        objectId: `${slideId}_accentBar`,
        shapeProperties: {
          shapeBackgroundFill: {
            solidFill: {
              color: {
                rgbColor: COLORS.primary,
              },
            },
          },
        },
        fields: 'shapeBackgroundFill',
      },
    })

    // Section title
    requests.push({
      createShape: {
        objectId: `${slideId}_title`,
        shapeType: 'TEXT_BOX',
        elementProperties: {
          pageObjectId: slideId,
          size: {
            width: { magnitude: 660, unit: 'PT' },
            height: { magnitude: 60, unit: 'PT' },
          },
          transform: {
            scaleX: 1,
            scaleY: 1,
            translateX: 30,
            translateY: 30,
            unit: 'PT'
          },
        },
      },
    })

    requests.push({
      insertText: {
        objectId: `${slideId}_title`,
        text: section.data.title,
      },
    })

    requests.push({
      updateTextStyle: {
        objectId: `${slideId}_title`,
        style: {
          fontSize: { magnitude: 32, unit: 'PT' },
          fontFamily: 'Arial',
          bold: true,
          foregroundColor: {
            opaqueColor: { rgbColor: COLORS.primary },
          },
        },
        fields: 'fontSize,fontFamily,bold,foregroundColor',
      },
    })

    // Content description
    requests.push({
      createShape: {
        objectId: `${slideId}_content`,
        shapeType: 'TEXT_BOX',
        elementProperties: {
          pageObjectId: slideId,
          size: {
            width: { magnitude: 660, unit: 'PT' },
            height: { magnitude: 80, unit: 'PT' },
          },
          transform: {
            scaleX: 1,
            scaleY: 1,
            translateX: 30,
            translateY: 100,
            unit: 'PT'
          },
        },
      },
    })

    requests.push({
      insertText: {
        objectId: `${slideId}_content`,
        text: section.data.content,
      },
    })

    requests.push({
      updateTextStyle: {
        objectId: `${slideId}_content`,
        style: {
          fontSize: { magnitude: 14, unit: 'PT' },
          fontFamily: 'Arial',
          foregroundColor: {
            opaqueColor: { rgbColor: COLORS.mediumText },
          },
        },
        fields: 'fontSize,fontFamily,foregroundColor',
      },
    })

    // Key points
    if (section.data.keyPoints && section.data.keyPoints.length > 0) {
      const bulletPoints = section.data.keyPoints.map((point) => `• ${point}`).join('\n\n')

      requests.push({
        createShape: {
          objectId: `${slideId}_keyPoints`,
          shapeType: 'TEXT_BOX',
          elementProperties: {
            pageObjectId: slideId,
            size: {
              width: { magnitude: 660, unit: 'PT' },
              height: { magnitude: 280, unit: 'PT' },
            },
            transform: {
              scaleX: 1,
              scaleY: 1,
              translateX: 30,
              translateY: 200,
              unit: 'PT'
            },
          },
        },
      })

      requests.push({
        insertText: {
          objectId: `${slideId}_keyPoints`,
          text: bulletPoints,
        },
      })

      requests.push({
        updateTextStyle: {
          objectId: `${slideId}_keyPoints`,
          style: {
            fontSize: { magnitude: 13, unit: 'PT' },
            fontFamily: 'Arial',
            foregroundColor: {
              opaqueColor: { rgbColor: COLORS.mediumText },
            },
          },
          fields: 'fontSize,fontFamily,foregroundColor',
        },
      })
    }

    // Page number
    requests.push({
      createShape: {
        objectId: `${slideId}_pageNumber`,
        shapeType: 'TEXT_BOX',
        elementProperties: {
          pageObjectId: slideId,
          size: {
            width: { magnitude: 50, unit: 'PT' },
            height: { magnitude: 30, unit: 'PT' },
          },
          transform: {
            scaleX: 1,
            scaleY: 1,
            translateX: 670,
            translateY: 510,
            unit: 'PT'
          },
        },
      },
    })

    requests.push({
      insertText: {
        objectId: `${slideId}_pageNumber`,
        text: `${index + 2}`,
      },
    })

    requests.push({
      updateTextStyle: {
        objectId: `${slideId}_pageNumber`,
        style: {
          fontSize: { magnitude: 10, unit: 'PT' },
          fontFamily: 'Arial',
          foregroundColor: {
            opaqueColor: { rgbColor: COLORS.mediumText },
          },
        },
        fields: 'fontSize,fontFamily,foregroundColor',
      },
    })
  })

  // Execute all requests
  await slides.presentations.batchUpdate({
    presentationId,
    requestBody: {
      requests,
    },
  })

  // Get the presentation URL
  const presentationUrl = `https://docs.google.com/presentation/d/${presentationId}/edit`

  // ===== ORGANIZE IN GOOGLE DRIVE =====

  // Check if "Business Clarity Reports" folder exists, create if not
  let folderId: string | undefined

  try {
    // Search for existing folder
    const folderSearch = await drive.files.list({
      q: "name='Business Clarity Reports' and mimeType='application/vnd.google-apps.folder' and trashed=false",
      fields: 'files(id, name)',
      spaces: 'drive',
    })

    if (folderSearch.data.files && folderSearch.data.files.length > 0) {
      // Use existing folder
      folderId = folderSearch.data.files[0].id!
      console.log('[Slides Generator] Using existing folder:', folderId)
    } else {
      // Create new folder
      const folder = await drive.files.create({
        requestBody: {
          name: 'Business Clarity Reports',
          mimeType: 'application/vnd.google-apps.folder',
        },
        fields: 'id',
      })
      folderId = folder.data.id!
      console.log('[Slides Generator] Created new folder:', folderId)
    }

    // Move presentation to folder
    if (folderId) {
      await drive.files.update({
        fileId: presentationId,
        addParents: folderId,
        fields: 'id, parents',
      })
      console.log('[Slides Generator] Moved presentation to folder')
    }
  } catch (error) {
    console.error('[Slides Generator] Failed to organize in Drive folder:', error)
    // Continue even if folder organization fails
  }

  // Make the presentation shareable (anyone with link can view)
  await drive.permissions.create({
    fileId: presentationId,
    requestBody: {
      role: 'reader',
      type: 'anyone',
    },
  })

  return {
    presentationId,
    presentationUrl,
    driveFileId: presentationId,
    driveFolderId: folderId,
  }
}