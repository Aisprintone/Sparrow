// MARKET DATA QUOTES API - REAL-TIME QUOTES ENDPOINT
// Uses FMP API to get real-time quotes for major indexes

import { NextRequest, NextResponse } from 'next/server'

interface MarketQuote {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume?: number
  high?: number
  low?: number
  open?: number
}

interface APIResponse<T> {
  success: boolean
  data: T
  meta: {
    timestamp: number
    dataSource: 'live' | 'fallback'
    computeTime: number
  }
}

const MAJOR_INDEXES = [
  { symbol: "^GSPC", name: "S&P 500" },
  { symbol: "^DJI", name: "Dow Jones" },
  { symbol: "^IXIC", name: "NASDAQ" },
  { symbol: "^RUT", name: "Russell 2000" },
  { symbol: "^VIX", name: "VIX" }
]

// GET /api/market-data/quotes - Get real-time quotes
export async function GET(request: NextRequest) {
  const startTime = performance.now()
  
  try {
    // Try to fetch from FMP API
    const fmpApiKey = process.env.FMP_API_KEY
    const symbols = MAJOR_INDEXES.map(index => index.symbol).join(',')
    
    if (fmpApiKey) {
      const response = await fetch(
        `https://financialmodelingprep.com/api/v3/quote/${symbols}?apikey=${fmpApiKey}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(5000)
        }
      )
      
      if (response.ok) {
        const fmpData = await response.json()
        const computeTime = performance.now() - startTime
        
        // Transform FMP data to our format
        const quotes: MarketQuote[] = fmpData.map((item: any) => ({
          symbol: item.symbol,
          name: MAJOR_INDEXES.find(index => index.symbol === item.symbol)?.name || item.symbol,
          price: item.price || 0,
          change: item.change || 0,
          changePercent: item.changesPercentage || 0,
          volume: item.volume,
          high: item.dayHigh,
          low: item.dayLow,
          open: item.open
        }))
        
        return NextResponse.json({
          success: true,
          data: quotes,
          meta: {
            timestamp: Date.now(),
            dataSource: 'live',
            computeTime
          }
        } as APIResponse<MarketQuote[]>)
      }
    }
    
    // Fallback to mock data if FMP API is unavailable
    console.log('FMP API unavailable, using fallback quotes')
    const fallbackQuotes: MarketQuote[] = [
      {
        symbol: "^GSPC",
        name: "S&P 500",
        price: 4500.25,
        change: 12.50,
        changePercent: 0.28,
        volume: 2500000000,
        high: 4510.50,
        low: 4485.75,
        open: 4490.00
      },
      {
        symbol: "^DJI",
        name: "Dow Jones",
        price: 35025.50,
        change: 85.75,
        changePercent: 0.25,
        volume: 350000000,
        high: 35100.25,
        low: 34950.00,
        open: 34980.25
      },
      {
        symbol: "^IXIC",
        name: "NASDAQ",
        price: 14025.50,
        change: 125.30,
        changePercent: 0.90,
        volume: 3200000000,
        high: 14100.75,
        low: 13950.25,
        open: 13980.50
      },
      {
        symbol: "^RUT",
        name: "Russell 2000",
        price: 1850.75,
        change: -8.25,
        changePercent: -0.44,
        volume: 450000000,
        high: 1865.50,
        low: 1840.25,
        open: 1855.00
      },
      {
        symbol: "^VIX",
        name: "VIX",
        price: 18.50,
        change: -1.25,
        changePercent: -6.33,
        volume: 85000000,
        high: 19.75,
        low: 18.25,
        open: 19.50
      }
    ]
    
    const computeTime = performance.now() - startTime
    
    return NextResponse.json({
      success: true,
      data: fallbackQuotes,
      meta: {
        timestamp: Date.now(),
        dataSource: 'fallback',
        computeTime
      }
    } as APIResponse<MarketQuote[]>)
    
  } catch (error) {
    console.error('Error fetching quotes:', error)
    
    // Return mock data as last resort
    const mockQuotes: MarketQuote[] = [
      {
        symbol: "^GSPC",
        name: "S&P 500",
        price: 4500.25,
        change: 12.50,
        changePercent: 0.28,
        volume: 2500000000,
        high: 4510.50,
        low: 4485.75,
        open: 4490.00
      },
      {
        symbol: "^DJI",
        name: "Dow Jones",
        price: 35025.50,
        change: 85.75,
        changePercent: 0.25,
        volume: 350000000,
        high: 35100.25,
        low: 34950.00,
        open: 34980.25
      },
      {
        symbol: "^IXIC",
        name: "NASDAQ",
        price: 14025.50,
        change: 125.30,
        changePercent: 0.90,
        volume: 3200000000,
        high: 14100.75,
        low: 13950.25,
        open: 13980.50
      },
      {
        symbol: "^RUT",
        name: "Russell 2000",
        price: 1850.75,
        change: -8.25,
        changePercent: -0.44,
        volume: 450000000,
        high: 1865.50,
        low: 1840.25,
        open: 1855.00
      },
      {
        symbol: "^VIX",
        name: "VIX",
        price: 18.50,
        change: -1.25,
        changePercent: -6.33,
        volume: 85000000,
        high: 19.75,
        low: 18.25,
        open: 19.50
      }
    ]
    
    const computeTime = performance.now() - startTime
    
    return NextResponse.json({
      success: true,
      data: mockQuotes,
      meta: {
        timestamp: Date.now(),
        dataSource: 'fallback',
        computeTime
      }
    } as APIResponse<MarketQuote[]>)
  }
}
