// PROFILE SWITCHING API - INSTANT PROFILE CONTEXT SWITCHING
// Optimized for sub-50ms profile switching with cache warming

import { NextRequest, NextResponse } from 'next/server'
import { dataStore } from '@/lib/data/data-store'
import type { APIResponse } from '@/lib/data/types'
import { initializeDataStore } from '../../init'
import { cookies } from 'next/headers'

// POST /api/profiles/[id]/switch - Switch to a different profile
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = performance.now()
  const profileId = parseInt(params.id, 10)
  
  if (isNaN(profileId) || profileId < 1 || profileId > 3) {
    return NextResponse.json({
      success: false,
      error: 'Invalid profile ID',
      message: 'Profile ID must be 1, 2, or 3'
    }, { status: 400 })
  }
  
  try {
    await initializeDataStore()
    
    // Pre-warm the cache for the new profile
    const profileData = await dataStore.getProfile(profileId)
    
    if (!profileData) {
      return NextResponse.json({
        success: false,
        error: 'Profile not found',
        message: `No profile found with ID ${profileId}`
      }, { status: 404 })
    }
    
    // Set profile cookie for session persistence
    const cookieStore = cookies()
    cookieStore.set('activeProfileId', profileId.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })
    
    const switchTime = performance.now() - startTime
    
    // Return minimal response for fast switching
    const response: APIResponse<{
      profileId: number
      name: string
      switchTime: number
      cacheWarmed: boolean
    }> = {
      success: true,
      data: {
        profileId,
        name: getProfileName(profileId),
        switchTime,
        cacheWarmed: true
      },
      meta: {
        timestamp: Date.now(),
        version: '1.0.0',
        cached: false,
        computeTime: switchTime,
        dataSource: 'computed'
      },
      profile: {
        id: profileId,
        name: getProfileName(profileId),
        lastUpdated: new Date().toISOString(),
        dataQuality: 100
      },
      performance: {
        totalTime: switchTime,
        parseTime: 0,
        computeTime: switchTime,
        cacheHits: 0,
        cacheMisses: 0,
        memoryUsed: process.memoryUsage().heapUsed
      }
    }
    
    // Log profile switch for analytics
    console.log(`Profile switched to ${profileId} in ${switchTime.toFixed(2)}ms`)
    
    return NextResponse.json(response, {
      headers: {
        'X-Response-Time': `${switchTime}ms`,
        'X-Profile-Id': profileId.toString(),
        'Cache-Control': 'no-cache' // Don't cache switch operations
      }
    })
  } catch (error) {
    console.error(`Error switching to profile ${profileId}:`, error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to switch profile',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET /api/profiles/[id]/switch - Get current active profile
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const cookieStore = cookies()
  const activeProfileId = cookieStore.get('activeProfileId')?.value
  
  return NextResponse.json({
    success: true,
    data: {
      activeProfileId: activeProfileId ? parseInt(activeProfileId, 10) : null,
      requestedProfileId: parseInt(params.id, 10)
    }
  })
}

function getProfileName(profileId: number): string {
  const names: Record<number, string> = {
    1: 'Professional (34, NYC)',
    2: 'Family-focused (33, NYC)',
    3: 'Young Professional (23, Austin)'
  }
  return names[profileId] || `Profile ${profileId}`
}