/**
 * Cache Health API Route Handler
 * 
 * SOLID Principles Applied:
 * - Single Responsibility: Cache health monitoring only
 * - Open/Closed: Extensible health checks
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

/**
 * GET /api/cache/health
 * Check cache system health
 */
export async function GET(request: NextRequest) {
  try {
    // Check backend cache health
    const backendResponse = await fetch(`${BACKEND_URL}/cache/cache/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!backendResponse.ok) {
      return NextResponse.json(
        { 
          status: 'degraded',
          error: 'Backend cache health check failed',
          timestamp: new Date().toISOString()
        },
        { status: 503 }
      )
    }

    const backendHealth = await backendResponse.json()
    
    // Check frontend memory cache (if available)
    const frontendCacheHealthy = true // Placeholder for frontend cache health
    
    return NextResponse.json({
      status: backendHealth.status === 'healthy' && frontendCacheHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      backend: backendHealth,
      frontend: {
        status: frontendCacheHealthy ? 'healthy' : 'degraded',
        type: 'memory'
      }
    })

  } catch (error: any) {
    console.error('[Cache Health API Error]:', error)
    return NextResponse.json(
      { 
        status: 'unhealthy',
        error: error.message || 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
