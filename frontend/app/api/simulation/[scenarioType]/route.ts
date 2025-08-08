/**
 * Simulation API Route Handler
 * 
 * SOLID Principles Applied:
 * - Single Responsibility: This handler only manages HTTP request/response translation
 * - Open/Closed: Extension through configuration, not modification
 * - Dependency Inversion: Depends on abstraction (fetch API), not concrete implementations
 * 
 * Architecture: Clean separation between API gateway (this file) and business logic (backend)
 */

import { NextRequest, NextResponse } from 'next/server'

// Configuration abstraction - follows Open/Closed principle
const BACKEND_CONFIG = {
  url: 'https://sparrow-backend-production.up.railway.app',
  timeout: 60000, // 60 seconds for simulation requests
  headers: {
    'Content-Type': 'application/json',
  }
}

/**
 * Request Validator - Single Responsibility
 */
class SimulationRequestValidator {
  static validate(body: any): { valid: boolean; error?: string } {
    if (!body) {
      return { valid: false, error: 'Request body is required' }
    }

    if (!body.profile_id) {
      return { valid: false, error: 'profile_id is required' }
    }

    if (!body.scenario_type) {
      return { valid: false, error: 'scenario_type is required' }
    }

    return { valid: true }
  }
}

/**
 * Backend Service Abstraction - Dependency Inversion
 */
class BackendSimulationService {
  private readonly baseUrl: string
  private readonly timeout: number
  private readonly headers: Record<string, string>

  constructor(config: typeof BACKEND_CONFIG) {
    this.baseUrl = config.url
    this.timeout = config.timeout
    this.headers = config.headers
  }

  async runSimulation(
    scenarioType: string,
    requestBody: any
  ): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      console.log('[SIMULATION API] 🔄 Sending request to Railway backend:', `${this.baseUrl}/simulation/${scenarioType}`)
      console.log('[SIMULATION API] Request payload:', JSON.stringify(requestBody, null, 2))
      
      // Use Railway backend directly
      const response = await fetch(
        `${this.baseUrl}/simulation/${scenarioType}`,
        {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        }
      )
      
      console.log('[SIMULATION API] Backend response status:', response.status)
      return response
    } finally {
      clearTimeout(timeoutId)
    }
  }
}

/**
 * Error Handler - Single Responsibility
 */
class SimulationErrorHandler {
  static handleError(error: any): NextResponse {
    console.error('[SIMULATION API] ❌ Error:', error)

    if (error.name === 'AbortError') {
      console.log('[SIMULATION API] ⏰ Request timeout - simulation took too long')
      return NextResponse.json(
        { 
          success: false, 
          error: 'Request timeout - simulation took too long',
          message: 'The simulation request exceeded the 60 second timeout'
        },
        { status: 504 }
      )
    }

    if (error.message?.includes('fetch failed')) {
      console.log('[SIMULATION API] 🔌 Backend service unavailable')
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
 * POST /api/simulation/[scenarioType]
 * 
 * Handles simulation requests with enhanced AI explanations
 * Follows Interface Segregation - only exposes necessary methods
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ scenarioType: string }> }
) {
  // Await params to get the actual values
  const { scenarioType } = await params
  
  console.log('[SIMULATION API] 🚀 Simulation request received')
  console.log('[SIMULATION API] Scenario type:', scenarioType)
  console.log('[SIMULATION API] Request URL:', request.url)
  console.log('[SIMULATION API] User Agent:', request.headers.get('user-agent'))
  
  try {
    // Parse request body
    const body = await request.json()
    console.log('[SIMULATION API] Request body parsed successfully')

    // Validate request
    const validation = SimulationRequestValidator.validate(body)
    if (!validation.valid) {
      console.log('[SIMULATION API] ❌ Validation failed:', validation.error)
      return NextResponse.json(
        { 
          success: false, 
          error: validation.error,
          message: `Validation failed: ${validation.error}`
        },
        { status: 400 }
      )
    }

    console.log('[SIMULATION API] ✅ Request validation passed')

    // Ensure scenario_type matches the URL parameter
    body.scenario_type = scenarioType

    // Initialize service with configuration
    const simulationService = new BackendSimulationService(BACKEND_CONFIG)
    console.log('[SIMULATION API] Backend service initialized with URL:', BACKEND_CONFIG.url)

    // Execute simulation
    console.log('[SIMULATION API] 🔄 Starting simulation execution...')
    const startTime = Date.now()
    const backendResponse = await simulationService.runSimulation(
      scenarioType,
      body
    )
    const executionTime = Date.now() - startTime
    console.log('[SIMULATION API] ⏱️ Simulation execution time:', executionTime, 'ms')

    // Handle backend response
    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}))
      console.log('[SIMULATION API] ❌ Backend error response:', errorData)
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

    // Return successful response
    const responseData = await backendResponse.json()
    console.log('[SIMULATION API] ✅ Simulation completed successfully')
    console.log('[SIMULATION API] Response includes AI explanations:', !!responseData.data?.ai_explanations)
    
    // Ensure the response includes AI explanations
    if (!responseData.data?.ai_explanations) {
      console.warn('[SIMULATION API] ⚠️ Response missing AI explanations')
    }

    return NextResponse.json(responseData)

  } catch (error) {
    return SimulationErrorHandler.handleError(error)
  }
}

/**
 * OPTIONS /api/simulation/[scenarioType]
 * 
 * Handles CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  console.log('[SIMULATION API] 🔄 CORS preflight request handled')
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}