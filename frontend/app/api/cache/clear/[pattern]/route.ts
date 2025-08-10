/**
 * Cache Clear Pattern API Route Handler
 * 
 * SOLID Principles Applied:
 * - Single Responsibility: Pattern-based cache clearing only
 * - Open/Closed: Extensible pattern matching strategies
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

/**
 * DELETE /api/cache/clear/[pattern]
 * Clear cache entries matching pattern
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ pattern: string }> }
) {
  try {
    const { pattern } = await params

    // Clear from backend cache
    const response = await fetch(
      `${BACKEND_URL}/cache/cache/clear`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pattern: pattern,
          clear_all: pattern === '*'
        }),
      }
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      return NextResponse.json(
        { 
          success: false,
          error: error.detail || 'Failed to clear cache'
        },
        { status: response.status }
      )
    }

    const result = await response.json()
    
    // Clear frontend memory cache if clearing all
    if (pattern === '*') {
      // Clear service worker cache
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.getRegistration()
          if (registration && registration.active) {
            registration.active.postMessage({ type: 'CLEAR_CACHE' })
          }
        } catch (swError) {
          console.warn('Service worker cache clear failed:', swError)
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      pattern: pattern,
      cleared: result.cleared_count || 0,
      message: `Cache cleared for pattern: ${pattern}`,
      frontend_cleared: pattern === '*'
    })

  } catch (error: any) {
    console.error('[Cache Clear API Error]:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Internal server error'
      },
      { status: 500 }
    )
  }
}