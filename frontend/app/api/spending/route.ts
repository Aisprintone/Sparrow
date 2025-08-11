/**
 * Spending API Route Handler
 * 
 * SOLID Principles Applied:
 * - Single Responsibility: Spending data retrieval and analysis
 * - Open/Closed: Extensible spending analysis strategies
 * - Dependency Inversion: Depends on data service abstractions
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

/**
 * Backend Spending Data Service - Single Responsibility
 * Handles communication with Railway backend for spending data
 */
class BackendSpendingDataService {
  private readonly baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl || 'https://sparrow-backend-production.up.railway.app'
  }

  async getSpendingData(
    profileId: string,
    year?: string,
    month?: string,
    category?: string
  ) {
    // Use the NEW dedicated spending endpoint
    const params = new URLSearchParams()
    if (year) params.append('year', year)
    if (month) params.append('month', month)
    
    const url = `${this.baseUrl}/api/spending/${profileId}${params.toString() ? `?${params.toString()}` : ''}`
    
    console.log('[Spending API] Calling backend:', url)
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add timeout for Railway backend
      signal: AbortSignal.timeout(10000) // 10 second timeout
    })

    if (!response.ok) {
      throw new Error(`Backend spending API failed: ${response.status} ${response.statusText}`)
    }

    const backendResponse = await response.json()
    
    if (!backendResponse.success) {
      throw new Error(`Backend spending analysis failed: ${backendResponse.error}`)
    }
    
    console.log('[Spending API] ✅ Backend response received:', {
      totalSpending: backendResponse.data.total,
      categoryCount: backendResponse.data.categories.length,
      source: backendResponse.meta?.data_source
    })
    
    // Return the data directly - no transformation needed since backend matches SpendingData interface
    return backendResponse.data
  }

  // No transformation needed - backend now provides data in correct SpendingData format
}

/**
 * GET /api/spending
 * Retrieve spending data with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const customerId = searchParams.get('customerId') || searchParams.get('profile_id') || '1'
    const year = searchParams.get('year')
    const month = searchParams.get('month')

    console.log('[Spending API] Processing request for:', { customerId, year, month })

    const service = new BackendSpendingDataService(BACKEND_URL)
    
    const data = await service.getSpendingData(
      customerId,
      year || undefined,
      month || undefined
    )
    
    return NextResponse.json({
      success: true,
      data: data,
      source: 'backend',
      meta: {
        customerId,
        year: year ? parseInt(year) : new Date().getFullYear(),
        month: month ? parseInt(month) : undefined,
        cached: false
      }
    })

  } catch (error: any) {
    console.error('[Spending API Error]:', error)
    
    // Return proper error format that matches expected structure
    return NextResponse.json(
      {
        success: false,
        error: 'Backend spending analysis failed',
        message: error.message || 'Unable to connect to the spending backend service',
        details: error.stack
      },
      { status: 503 }
    )
  }
}