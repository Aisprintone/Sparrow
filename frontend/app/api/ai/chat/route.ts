/**
 * AI Chat API Route Handler
 * 
 * SOLID Principles Applied:
 * - Single Responsibility: Manages AI chat request/response flow
 * - Open/Closed: Configuration-based extension
 * - Interface Segregation: Clean API contract
 * - Dependency Inversion: Depends on fetch abstraction
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'https://sparrow-backend-production.up.railway.app'

/**
 * Chat Message Interface - Interface Segregation
 */
interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface ChatRequest {
  messages: ChatMessage[]
  profileId?: string
  context?: Record<string, any>
}

/**
 * Chat Request Validator - Single Responsibility
 */
class ChatRequestValidator {
  static validate(body: any): { valid: boolean; error?: string } {
    if (!body) {
      return { valid: false, error: 'Request body is required' }
    }

    if (!body.messages || !Array.isArray(body.messages)) {
      return { valid: false, error: 'messages array is required' }
    }

    if (body.messages.length === 0) {
      return { valid: false, error: 'messages array cannot be empty' }
    }

    // Validate message structure
    for (const message of body.messages) {
      if (!message.role || !message.content) {
        return { valid: false, error: 'Each message must have role and content' }
      }
      if (!['user', 'assistant', 'system'].includes(message.role)) {
        return { valid: false, error: 'Invalid message role' }
      }
    }

    return { valid: true }
  }
}

/**
 * Backend AI Service - Dependency Inversion
 */
class BackendAIService {
  private readonly baseUrl: string
  private readonly timeout: number = 30000 // 30 seconds for AI responses

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  async sendChatRequest(request: ChatRequest): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      // Try the streaming endpoint first for better UX
      const response = await fetch(
        `${this.baseUrl}/streaming/ai/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
          signal: controller.signal,
        }
      )
      
      return response
    } finally {
      clearTimeout(timeoutId)
    }
  }

  async sendFallbackRequest(request: ChatRequest): Promise<Response> {
    // Fallback to workflow AI endpoint
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(
        `${this.baseUrl}/workflow/ai/analyze`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            profile_id: request.profileId || '1',
            query: request.messages[request.messages.length - 1].content,
            context: request.context || {}
          }),
          signal: controller.signal,
        }
      )
      
      return response
    } finally {
      clearTimeout(timeoutId)
    }
  }
}

/**
 * POST /api/ai/chat
 * 
 * Handles AI chat requests with enhanced context from simulations
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ChatRequest

    // Validate request
    const validation = ChatRequestValidator.validate(body)
    if (!validation.valid) {
      return NextResponse.json(
        { 
          success: false, 
          error: validation.error,
          message: `Validation failed: ${validation.error}`
        },
        { status: 400 }
      )
    }

    // Initialize AI service
    const aiService = new BackendAIService(BACKEND_URL)

    // Try primary endpoint
    let backendResponse = await aiService.sendChatRequest(body)

    // If primary fails, try fallback
    if (!backendResponse.ok && backendResponse.status === 404) {
      console.log('[AI Chat] Primary endpoint not found, trying fallback')
      backendResponse = await aiService.sendFallbackRequest(body)
    }

    // Handle backend response
    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}))
      return NextResponse.json(
        {
          success: false,
          error: errorData.detail || 'AI chat request failed',
          message: errorData.message || `Backend returned status ${backendResponse.status}`
        },
        { status: backendResponse.status }
      )
    }

    // Check if response is streaming
    const contentType = backendResponse.headers.get('content-type')
    if (contentType?.includes('text/event-stream')) {
      // Forward streaming response
      return new NextResponse(backendResponse.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    }

    // Return JSON response
    const responseData = await backendResponse.json()
    
    // Ensure proper response structure
    const formattedResponse = {
      success: true,
      message: responseData.message || responseData.response || responseData.analysis || '',
      data: responseData.data || {},
      metadata: {
        profileId: body.profileId,
        timestamp: new Date().toISOString(),
        ...responseData.metadata
      }
    }

    return NextResponse.json(formattedResponse)

  } catch (error: any) {
    console.error('[AI Chat API Error]:', error)

    if (error.name === 'AbortError') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Request timeout',
          message: 'The AI request exceeded the 30 second timeout'
        },
        { status: 504 }
      )
    }

    if (error.message?.includes('fetch failed')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'AI service unavailable',
          message: 'Unable to connect to the AI backend service'
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
 * OPTIONS /api/ai/chat
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