/**
 * Spending API Route Handler
 * 
 * SOLID Principles Applied:
 * - Single Responsibility: Spending data retrieval and analysis
 * - Open/Closed: Extensible spending analysis strategies
 * - Dependency Inversion: Depends on data service abstractions
 */

import { NextRequest, NextResponse } from 'next/server'

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
    startDate?: string,
    endDate?: string,
    category?: string
  ) {
    const params = new URLSearchParams()
    
    if (profileId) params.append('profile_id', profileId)
    if (startDate) params.append('start_date', startDate)
    if (endDate) params.append('end_date', endDate)
    if (category) params.append('category', category)

    const response = await fetch(
      `${this.baseUrl}/api/spending?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch spending data: ${response.status}`)
    }

    return response.json()
  }
}

/**
 * GET /api/spending
 * Retrieve spending data with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const profileId = searchParams.get('profile_id') || '1'
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const category = searchParams.get('category')

    const service = new BackendSpendingDataService()
    
    const data = await service.getSpendingData(
      profileId,
      startDate || undefined,
      endDate || undefined,
      category || undefined
    )
    
    return NextResponse.json({
      success: true,
      data: data,
      source: 'backend'
    })

  } catch (error: any) {
    console.error('[Spending API Error]:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Backend service unavailable',
        message: 'Unable to connect to the spending backend service'
      },
      { status: 503 }
    )
  }
}