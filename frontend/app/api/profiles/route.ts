import { NextRequest, NextResponse } from 'next/server'

// Configuration for backend connection
const BACKEND_CONFIG = {
  url: process.env.RAILWAY_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
}

// Handle GET requests to /api/profiles (list all profiles)
export async function GET(request: NextRequest) {
  console.log('[PROFILES API] 🚀 All profiles request received')
  console.log('[PROFILES API] Request URL:', request.url)
  console.log('[PROFILES API] Backend URL:', BACKEND_CONFIG.url)
  
  try {
    // Fetch profiles from backend
    console.log('[PROFILES API] 🔄 Fetching profiles from backend...')
    const backendResponse = await fetch(`${BACKEND_CONFIG.url}/profiles`, {
      method: 'GET',
      headers: BACKEND_CONFIG.headers,
      signal: AbortSignal.timeout(BACKEND_CONFIG.timeout)
    })

    if (!backendResponse.ok) {
      throw new Error(`Backend responded with ${backendResponse.status}: ${backendResponse.statusText}`)
    }

    const backendData = await backendResponse.json()
    
    if (!backendData.success) {
      throw new Error(backendData.error || 'Backend returned unsuccessful response')
    }

    console.log('[PROFILES API] ✅ Profiles fetched from backend (count:', backendData.profiles?.length || 0, ')')
    
    return NextResponse.json({
      success: true,
      data: backendData.profiles || [],
      source: 'backend'
    })
  } catch (error) {
    console.error('[PROFILES API] ❌ Backend error:', error)
    
    // Only use fallback as true fallback when backend completely fails
    console.log('[PROFILES API] 🔄 Backend unavailable, using fallback profiles')
    const fallbackProfiles = [
      { id: 1, name: 'Profile 1', demographic: 'millennial' },
      { id: 2, name: 'Profile 2', demographic: 'millennial' }, 
      { id: 3, name: 'Profile 3', demographic: 'genz' }
    ]
    
    return NextResponse.json({
      success: true,
      data: fallbackProfiles,
      source: 'fallback',
      warning: 'Backend unavailable, using fallback data'
    })
  }
}
