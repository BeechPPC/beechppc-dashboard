/**
 * Authentication helper utilities for API routes
 */

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

/**
 * Get the authenticated user's ID from Clerk
 * Returns null if not authenticated
 */
export async function getAuthUserId(): Promise<string | null> {
  const { userId } = await auth()
  return userId
}

/**
 * Require authentication for an API route
 * Returns user ID if authenticated, or returns an error response
 *
 * Usage:
 * ```typescript
 * const userId = await requireAuth()
 * if (userId instanceof NextResponse) return userId // Error response
 * // Continue with authenticated logic
 * ```
 */
export async function requireAuth(): Promise<string | NextResponse> {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized - Please sign in' },
      { status: 401 }
    )
  }

  return userId
}

/**
 * Get user's organization/tenant ID (for multi-tenant support)
 * Returns null if user is not in an organization
 */
export async function getUserOrgId(): Promise<string | null> {
  const { orgId } = await auth()
  return orgId
}

/**
 * Check if user has a specific permission in their organization
 * Useful for role-based access control
 */
export async function hasPermission(permission: string): Promise<boolean> {
  const { has } = await auth()
  return has ? has({ permission }) : false
}
