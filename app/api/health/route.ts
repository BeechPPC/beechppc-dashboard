import { NextResponse } from 'next/server'

export async function GET() {
  const envCheck = {
    GOOGLE_ADS_CLIENT_ID: !!process.env.GOOGLE_ADS_CLIENT_ID,
    GOOGLE_ADS_CLIENT_SECRET: !!process.env.GOOGLE_ADS_CLIENT_SECRET,
    GOOGLE_ADS_DEVELOPER_TOKEN: !!process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
    GOOGLE_ADS_REFRESH_TOKEN: !!process.env.GOOGLE_ADS_REFRESH_TOKEN,
    GOOGLE_ADS_LOGIN_CUSTOMER_ID: !!process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,
    EMAIL_HOST: !!process.env.EMAIL_HOST,
    EMAIL_PORT: !!process.env.EMAIL_PORT,
    EMAIL_USER: !!process.env.EMAIL_USER,
    EMAIL_PASSWORD: !!process.env.EMAIL_PASSWORD,
    EMAIL_TO: !!process.env.EMAIL_TO,
  }

  const allPresent = Object.values(envCheck).every(v => v === true)

  return NextResponse.json({
    status: allPresent ? 'healthy' : 'missing_env_vars',
    environment: envCheck,
    loginCustomerId: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,
    timestamp: new Date().toISOString(),
  })
}

export const dynamic = 'force-dynamic'
