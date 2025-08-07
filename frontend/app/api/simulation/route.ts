/**
 * Legacy Simulation API Route Handler
 * 
 * SOLID Principles Applied:
 * - Single Responsibility: Handles legacy simulation endpoint
 * - Liskov Substitution: Compatible with the parametrized route handler
 * 
 * This route handles POST /api/simulation requests where scenario_type
 * is provided in the request body instead of the URL path
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

/**
 * POST /api/simulation
 * 
 * Legacy endpoint for backward compatibility
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request has scenario_type
    if (!body.scenario_type) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'scenario_type is required in request body',
          message: 'Please provide a scenario_type in the request body'
        },
        { status: 400 }
      )
    }

    // Forward to backend's legacy endpoint
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000)

    try {
      const backendResponse = await fetch(
        `${BACKEND_URL}/simulate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        }
      )

      clearTimeout(timeoutId)

      if (!backendResponse.ok) {
        const errorData = await backendResponse.json().catch(() => ({}))
        return NextResponse.json(
          {
            success: false,
            error: errorData.detail || 'Simulation failed',
            message: errorData.message || `Backend returned status ${backendResponse.status}`,
            data: {}
          },
          { status: backendResponse.status }
        )
      }

      const responseData = await backendResponse.json()
      return NextResponse.json(responseData)

    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      
      if (fetchError.name === 'AbortError') {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Request timeout',
            message: 'The simulation request exceeded the 60 second timeout'
          },
          { status: 504 }
        )
      }

      throw fetchError
    }

  } catch (error: any) {
    console.error('[Legacy Simulation API Error]:', error)

    if (error.message?.includes('fetch failed')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Backend service unavailable',
          message: 'Unable to connect to the simulation backend service'
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: error.message || 'An unexpected error occurred'
      },
      { status: 500 }
    )
  }
}

/**
 * OPTIONS /api/simulation
 * 
 * Handles CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}