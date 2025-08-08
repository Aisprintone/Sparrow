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
  { params }: { params: { pattern: string } }
) {
  try {
    const pattern = params.pattern

    // Clear from backend cache
    const response = await fetch(
      `${BACKEND_URL}/cache/clear`,
      {
        method: 'POST',
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
    
    return NextResponse.json({
      success: true,
      pattern: pattern,
      cleared: result.cleared_count || 0,
      message: `Cache cleared for pattern: ${pattern}`
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