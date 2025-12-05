# Email & Meetings Integration Setup

This document explains how to set up email reading and meeting detection capabilities in Beech PPC AI Agent.

## Overview

The system can now:
- **Read emails** from your IMAP email server
- **Extract meeting information** from calendar invites (ICS files)
- **Display upcoming meetings** in a dedicated meetings page
- **Query meetings via Claude AI** chat assistant

## Features

### 1. Email Reading
- Connects to IMAP server (Gmail, Outlook, etc.)
- Fetches recent emails
- Parses email content and attachments
- Extracts calendar invites

### 2. Meeting Detection
- Parses ICS calendar files from email attachments
- Extracts meeting details:
  - Title, start/end time
  - Location
  - Organizer and attendees
  - Description
- Falls back to text parsing for non-calendar emails

### 3. Claude AI Integration
- New function: `get_upcoming_meetings`
- Ask Claude: "What meetings do I have coming up?"
- Claude can query meetings for specific date ranges

## Setup Instructions

### 1. Environment Variables

Add the following to your `.env.local` file:

```env
# Email Configuration (for sending - already configured)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# IMAP Configuration (for reading emails)
EMAIL_IMAP_PORT=993
```

**Note:** For Gmail, you'll need to:
1. Enable "Less secure app access" OR
2. Use an App Password (recommended)
3. IMAP must be enabled in Gmail settings

### 2. Gmail Setup (Recommended)

1. Go to your Google Account settings
2. Enable 2-Step Verification
3. Generate an App Password:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Enter "Beech PPC AI Agent"
   - Copy the generated password
4. Use this password in `EMAIL_PASSWORD`

### 3. Other Email Providers

#### Outlook/Office 365
```env
EMAIL_HOST=outlook.office365.com
EMAIL_IMAP_PORT=993
```

#### Custom IMAP Server
```env
EMAIL_HOST=imap.yourdomain.com
EMAIL_IMAP_PORT=993
EMAIL_SECURE=true
```

### 4. Install Dependencies

The following packages have been added:
- `imap` - IMAP client for reading emails
- `mailparser` - Email parsing library
- `@types/imap` - TypeScript types
- `@types/mailparser` - TypeScript types

These should be installed automatically when you run `npm install`.

## Usage

### Via Web Interface

1. Navigate to **Meetings** in the sidebar
2. View upcoming meetings extracted from your emails
3. Filter by number of days (1, 7, 14, 30)
4. Meetings are automatically categorized as "Upcoming" or "Past"

### Via Claude AI Chat

Ask questions like:
- "What meetings do I have this week?"
- "Show me my meetings for the next 7 days"
- "Do I have any meetings today?"
- "What meetings are scheduled for next Monday?"

Claude will use the `get_upcoming_meetings` function to fetch and display your meetings.

### API Endpoints

#### GET /api/meetings
Fetch upcoming meetings:
```bash
GET /api/meetings?days=7&limit=50
```

#### POST /api/meetings
Search meetings with custom criteria:
```json
{
  "days": 7,
  "startDate": "2025-01-15",
  "endDate": "2025-01-22",
  "limit": 50
}
```

## How It Works

1. **Email Fetching**: System connects to IMAP and fetches recent emails
2. **Calendar Parsing**: Looks for `.ics` attachments (calendar invites)
3. **Text Parsing**: Falls back to parsing meeting info from email text
4. **Meeting Extraction**: Extracts structured meeting data
5. **Storage**: Meetings are displayed in real-time (not stored in database)

## Limitations

- **No persistent storage**: Meetings are fetched fresh each time
- **IMAP only**: Currently supports IMAP, not Gmail API (can be added)
- **Text parsing**: Basic regex patterns for non-calendar emails
- **Rate limiting**: Be mindful of IMAP rate limits

## Troubleshooting

### "Failed to fetch meetings"

1. Check your email credentials in `.env.local`
2. Verify IMAP is enabled for your email account
3. For Gmail, ensure App Password is used (not regular password)
4. Check firewall/network allows IMAP connections

### "No meetings found"

1. Ensure you have calendar invites in your inbox
2. Try increasing the `days` parameter
3. Check that emails contain `.ics` attachments
4. Verify emails are in the INBOX folder

### Connection Timeout

1. Check `EMAIL_IMAP_PORT` is correct (993 for Gmail)
2. Verify `EMAIL_HOST` is correct
3. Check firewall settings
4. Try using `EMAIL_SECURE=true` if using TLS

## Future Enhancements

Potential improvements:
- [ ] Gmail API integration (more reliable than IMAP)
- [ ] Calendar sync (Google Calendar, Outlook Calendar)
- [ ] Meeting reminders and notifications
- [ ] Meeting notes integration
- [ ] Recurring meeting detection
- [ ] Meeting conflict detection
- [ ] Database storage for meeting history
- [ ] Meeting search and filtering
- [ ] Integration with client accounts

## Security Notes

- Email credentials are stored in environment variables
- IMAP connections use TLS encryption
- App passwords are recommended over regular passwords
- Consider using OAuth2 for production (future enhancement)

## Support

For issues or questions:
1. Check the error logs in the browser console
2. Check server logs for IMAP connection errors
3. Verify environment variables are set correctly
4. Test IMAP connection with a mail client first

