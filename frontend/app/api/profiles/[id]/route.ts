import { NextRequest, NextResponse } from 'next/server'

// Dynamic route for local development
export const dynamic = 'force-dynamic'

// Configuration for backend connection
const BACKEND_CONFIG = {
  url: process.env.RAILWAY_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const profileId = parseInt(id)
    
    console.log('[PROFILES API] 🔄 Fetching profile:', profileId)
    console.log('[PROFILES API] Backend URL:', BACKEND_CONFIG.url)
    
    // Proxy request to backend
    const backendUrl = `${BACKEND_CONFIG.url}/profiles/${profileId}`
    console.log('[PROFILES API] Requesting:', backendUrl)
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: BACKEND_CONFIG.headers,
      signal: AbortSignal.timeout(BACKEND_CONFIG.timeout)
    })
    
    // Add a small delay to prevent rapid successive calls in development
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    console.log('[PROFILES API] Backend response status:', response.status)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.log('[PROFILES API] ❌ Backend error:', errorData)
      return NextResponse.json(
        { 
          success: false,
          error: errorData.detail || 'Profile not found',
          message: `Backend returned status ${response.status}`
        },
        { status: response.status }
      )
    }
    
    const profileData = await response.json()
    console.log('[PROFILES API] ✅ Profile fetched successfully')
    
    return NextResponse.json(profileData)
    
  } catch (error) {
    console.error('[PROFILES API] ❌ Error:', error)
    
    if (error.name === 'TimeoutError') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Request timeout',
          message: 'Profile request took too long'
        },
        { status: 504 }
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
