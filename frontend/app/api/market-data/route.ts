import { NextRequest, NextResponse } from 'next/server'

/**
 * Backend Market Data Service - Single Responsibility
 * Handles communication with Railway backend for market data
 */
class BackendMarketDataService {
  private readonly baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl || 'https://sparrow-backend-production.up.railway.app'
  }

  async getMarketData(): Promise<any> {
    const response = await fetch(
      `${this.baseUrl}/api/market-data`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch market data: ${response.status}`)
    }

    return await response.json()
  }
}

export async function GET(request: NextRequest) {
  console.log('[MARKET DATA API] 🚀 Market data request received')
  console.log('[MARKET DATA API] Request URL:', request.url)
  console.log('[MARKET DATA API] User Agent:', request.headers.get('user-agent'))
  
  try {
    const backendService = new BackendMarketDataService()
    const data = await backendService.getMarketData()
    
    console.log('[MARKET DATA API] ✅ Backend data received successfully')
    console.log('[MARKET DATA API] Data source: Backend API')
    
    return NextResponse.json({
      success: true,
      data: data,
      meta: {
        dataSource: 'Backend API',
        timestamp: new Date().toISOString(),
        cached: false
      }
    })
  } catch (error) {
    console.error('[MARKET DATA API] ❌ Backend error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Backend service unavailable',
        message: 'Unable to connect to the market data backend service'
      },
      { status: 503 }
    )
  }
}
