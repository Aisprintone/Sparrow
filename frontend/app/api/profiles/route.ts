import { NextRequest, NextResponse } from 'next/server'

/**
 * Backend Profiles Service - Single Responsibility
 * Handles communication with Railway backend for profile data
 */
class BackendProfilesService {
  private readonly baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl || 'https://sparrow-backend-production.up.railway.app'
  }

  async getProfiles(): Promise<any[]> {
    const response = await fetch(
      `${this.baseUrl}/profiles`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch profiles: ${response.status}`)
    }

    const data = await response.json()
    return data.profiles || []
  }

  async getProfile(profileId: string): Promise<any> {
    const response = await fetch(
      `${this.baseUrl}/profiles/${profileId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch profile ${profileId}: ${response.status}`)
    }

    return await response.json()
  }
}

export async function GET(request: NextRequest) {
  console.log('[PROFILES API] 🚀 Profile request received')
  console.log('[PROFILES API] Request URL:', request.url)
  console.log('[PROFILES API] User Agent:', request.headers.get('user-agent'))
  
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    console.log('[PROFILES API] Profile ID requested:', id || 'ALL')
    
    const backendService = new BackendProfilesService()
    
    if (id) {
      const profile = await backendService.getProfile(id)
      console.log('[PROFILES API] ✅ Single profile from backend for ID:', id)
      return NextResponse.json({
        success: true,
        data: profile,
        source: 'backend'
      })
    } else {
      const profiles = await backendService.getProfiles()
      console.log('[PROFILES API] ✅ All profiles from backend (count:', profiles.length, ')')
      return NextResponse.json({
        success: true,
        data: profiles,
        source: 'backend'
      })
    }
  } catch (error) {
    console.error('[PROFILES API] ❌ Backend error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Backend service unavailable',
        message: 'Unable to connect to the profiles backend service'
      },
      { status: 503 }
    )
  }
}
