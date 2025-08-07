// PROFILE API ROUTES - HIGH-PERFORMANCE PROFILE DATA ENDPOINTS
// Optimized for sub-10ms response times with intelligent caching

import { NextRequest, NextResponse } from 'next/server'
import type { APIResponse } from '@/lib/data/types'
import { initializeDataStore } from './init'
import { profileDataService } from '@/lib/services/data-store'

// ============================================================================
// API HANDLERS
// ============================================================================

// GET /api/profiles - List all available profiles
export async function GET(request: NextRequest) {
  const startTime = performance.now()
  
  try {
    // Ensure data is loaded
    await initializeDataStore()
    
    // Get actual customer data from CSV
    const customers = await profileDataService.getAllCustomers()
    const profiles = customers.map(customer => ({
      id: customer.customer_id,
      name: getProfileName(customer.customer_id, customer.age, customer.location),
      location: customer.location,
      age: customer.age
    }))
    
    const computeTime = performance.now() - startTime
    
    const response: APIResponse<typeof profiles> = {
      success: true,
      data: profiles,
      meta: {
        timestamp: Date.now(),
        version: '1.0.0',
        cached: false,
        computeTime,
        dataSource: 'computed'
      },
      profile: {
        id: 0,
        name: 'System',
        lastUpdated: new Date().toISOString(),
        dataQuality: 100
      },
      performance: {
        totalTime: computeTime,
        parseTime: 0,
        computeTime,
        cacheHits: 0,
        cacheMisses: 0,
        memoryUsed: process.memoryUsage().heapUsed
      }
    }
    
    return NextResponse.json(response, {
      headers: {
        'X-Response-Time': `${computeTime}ms`,
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      }
    })
  } catch (error) {
    console.error('Error fetching profiles:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch profiles',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

function getProfileName(id: number, age: number, location: string): string {
  if (id === 1) return `Established Millennial (${age}, ${location})`
  if (id === 2) return `Mid-Career Professional (${age}, ${location})`
  if (id === 3) return `Gen Z Student (${age}, ${location})`
  return `Profile ${id} (${age}, ${location})`
}