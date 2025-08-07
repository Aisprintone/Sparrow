// MARKET DATA API - LIVE MARKET DATA ENDPOINT
// Connects to backend market data service for real-time stock prices

import { NextRequest, NextResponse } from 'next/server'

interface MarketData {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
}

interface APIResponse<T> {
  success: boolean
  data: T
  meta: {
    timestamp: number
    cached: boolean
    computeTime: number
    dataSource: 'live' | 'cache' | 'fallback'
  }
}

// GET /api/market-data - Get live market data
export async function GET(request: NextRequest) {
  const startTime = performance.now()
  
  try {
    // Try to fetch from backend market data service
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000'
    
    const response = await fetch(`${backendUrl}/api/market-data`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(3000) // 3 second timeout
    })
    
    if (response.ok) {
      const backendData = await response.json()
      const computeTime = performance.now() - startTime
      
      // Check if we got valid data from backend
      if (backendData.success && backendData.data && Object.keys(backendData.data).length > 0) {
        // Transform backend data to frontend format
        const marketData: MarketData[] = Object.entries(backendData.data || {}).map(([symbol, data]: [string, any]) => ({
          symbol,
          name: getMarketName(symbol),
          price: data.price || 0,
          change: data.change || 0,
          changePercent: data.changePercent || 0
        }))
        
        return NextResponse.json({
          success: true,
          data: marketData,
          meta: {
            timestamp: Date.now(),
            cached: false,
            computeTime,
            dataSource: 'live'
          }
        } as APIResponse<MarketData[]>)
      } else {
        // Backend returned empty data, use fallback
        console.log('Backend returned empty data, using fallback')
      }
    }
    
    // Fallback to mock data if backend is unavailable or returns empty data
    console.log('Backend market data unavailable, using fallback data')
    const fallbackData: MarketData[] = [
      {
        symbol: "^GSPC",
        name: "S&P 500",
        price: 4500.25,
        change: 12.50,
        changePercent: 0.28
      },
      {
        symbol: "^IXIC",
        name: "NASDAQ",
        price: 14025.50,
        change: 85.75,
        changePercent: 0.61
      },
      {
        symbol: "^RUT",
        name: "Russell 2000",
        price: 1850.75,
        change: -8.25,
        changePercent: -0.44
      }
    ]
    
    const computeTime = performance.now() - startTime
    
    return NextResponse.json({
      success: true,
      data: fallbackData,
      meta: {
        timestamp: Date.now(),
        cached: false,
        computeTime,
        dataSource: 'fallback'
      }
    } as APIResponse<MarketData[]>)
    
  } catch (error) {
    console.error('Error fetching market data:', error)
    
    // Return mock data as last resort
    const mockData: MarketData[] = [
      {
        symbol: "^GSPC",
        name: "S&P 500",
        price: 4500.25,
        change: 12.50,
        changePercent: 0.28
      },
      {
        symbol: "^IXIC",
        name: "NASDAQ",
        price: 14025.50,
        change: 85.75,
        changePercent: 0.61
      },
      {
        symbol: "^RUT",
        name: "Russell 2000",
        price: 1850.75,
        change: -8.25,
        changePercent: -0.44
      }
    ]
    
    const computeTime = performance.now() - startTime
    
    return NextResponse.json({
      success: true,
      data: mockData,
      meta: {
        timestamp: Date.now(),
        cached: false,
        computeTime,
        dataSource: 'fallback'
      }
    } as APIResponse<MarketData[]>)
  }
}

function getMarketName(symbol: string): string {
  const names: Record<string, string> = {
    '^GSPC': 'S&P 500',
    '^DJI': 'Dow Jones',
    '^IXIC': 'NASDAQ',
    '^RUT': 'Russell 2000',
    'SPY': 'S&P 500 ETF',
    'VTI': 'Vanguard Total Market',
    'VXUS': 'Vanguard International',
    'BND': 'Vanguard Total Bond',
    'AGG': 'iShares Core Bond',
    'TLT': 'iShares 20+ Year Treasury',
    'AAPL': 'Apple',
    'MSFT': 'Microsoft',
    'GOOGL': 'Google',
    'AMZN': 'Amazon',
    'TSLA': 'Tesla'
  }
  
  return names[symbol] || symbol
}
