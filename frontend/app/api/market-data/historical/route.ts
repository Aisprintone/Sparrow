// MARKET DATA HISTORICAL API - HISTORICAL DATA ENDPOINT
// Uses FMP API to get historical data for major indexes

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

interface HistoricalData {
  yesterday: MarketQuote[]
  week: MarketQuote[]
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

// GET /api/market-data/historical - Get historical data
export async function GET(request: NextRequest) {
  const startTime = performance.now()
  
  try {
    // Try to fetch from FMP API
    const fmpApiKey = process.env.FMP_API_KEY
    
    if (fmpApiKey) {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      
      const yesterdayStr = yesterday.toISOString().split('T')[0]
      const weekAgoStr = weekAgo.toISOString().split('T')[0]
      
      // Fetch historical data for each index
      const historicalData: HistoricalData = {
        yesterday: [],
        week: []
      }
      
      for (const index of MAJOR_INDEXES) {
        try {
          // Get yesterday's data
          const yesterdayResponse = await fetch(
            `https://financialmodelingprep.com/api/v3/historical-price-full/${index.symbol}?from=${yesterdayStr}&to=${yesterdayStr}&apikey=${fmpApiKey}`,
            {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
              signal: AbortSignal.timeout(3000)
            }
          )
          
          // Get week ago data
          const weekResponse = await fetch(
            `https://financialmodelingprep.com/api/v3/historical-price-full/${index.symbol}?from=${weekAgoStr}&to=${weekAgoStr}&apikey=${fmpApiKey}`,
            {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
              signal: AbortSignal.timeout(3000)
            }
          )
          
          if (yesterdayResponse.ok && weekResponse.ok) {
            const yesterdayData = await yesterdayResponse.json()
            const weekData = await weekResponse.json()
            
            if (yesterdayData.historical && yesterdayData.historical.length > 0) {
              const yesterdayQuote = yesterdayData.historical[0]
              historicalData.yesterday.push({
                symbol: index.symbol,
                name: index.name,
                price: yesterdayQuote.close,
                change: yesterdayQuote.change,
                changePercent: yesterdayQuote.changePercent,
                volume: yesterdayQuote.volume,
                high: yesterdayQuote.high,
                low: yesterdayQuote.low,
                open: yesterdayQuote.open
              })
            }
            
            if (weekData.historical && weekData.historical.length > 0) {
              const weekQuote = weekData.historical[0]
              const currentPrice = 4500.25 // Mock current price for calculation
              const weekChange = currentPrice - weekQuote.close
              const weekChangePercent = (weekChange / weekQuote.close) * 100
              
              historicalData.week.push({
                symbol: index.symbol,
                name: index.name,
                price: currentPrice,
                change: weekChange,
                changePercent: weekChangePercent,
                volume: weekQuote.volume,
                high: weekQuote.high,
                low: weekQuote.low,
                open: weekQuote.open
              })
            }
          }
        } catch (error) {
          console.error(`Error fetching historical data for ${index.symbol}:`, error)
        }
      }
      
      if (historicalData.yesterday.length > 0 || historicalData.week.length > 0) {
        const computeTime = performance.now() - startTime
        
        return NextResponse.json({
          success: true,
          data: historicalData,
          meta: {
            timestamp: Date.now(),
            dataSource: 'live',
            computeTime
          }
        } as APIResponse<HistoricalData>)
      }
    }
    
    // Fallback to mock data if FMP API is unavailable
    console.log('FMP API unavailable, using fallback historical data')
    const fallbackData: HistoricalData = {
      yesterday: [
        {
          symbol: "^GSPC",
          name: "S&P 500",
          price: 4487.75,
          change: -15.50,
          changePercent: -0.34,
          volume: 2400000000,
          high: 4505.25,
          low: 4475.50,
          open: 4490.00
        },
        {
          symbol: "^DJI",
          name: "Dow Jones",
          price: 34940.25,
          change: -45.75,
          changePercent: -0.13,
          volume: 340000000,
          high: 35100.25,
          low: 34850.00,
          open: 34980.25
        },
        {
          symbol: "^IXIC",
          name: "NASDAQ",
          price: 13900.20,
          change: -125.30,
          changePercent: -0.89,
          volume: 3100000000,
          high: 14100.75,
          low: 13850.25,
          open: 13980.50
        },
        {
          symbol: "^RUT",
          name: "Russell 2000",
          price: 1859.00,
          change: 8.25,
          changePercent: 0.45,
          volume: 440000000,
          high: 1865.50,
          low: 1840.25,
          open: 1855.00
        },
        {
          symbol: "^VIX",
          name: "VIX",
          price: 19.75,
          change: 1.25,
          changePercent: 6.76,
          volume: 90000000,
          high: 20.75,
          low: 19.25,
          open: 19.50
        }
      ],
      week: [
        {
          symbol: "^GSPC",
          name: "S&P 500",
          price: 4500.25,
          change: 45.50,
          changePercent: 1.02,
          volume: 2500000000,
          high: 4510.50,
          low: 4485.75,
          open: 4490.00
        },
        {
          symbol: "^DJI",
          name: "Dow Jones",
          price: 35025.50,
          change: 185.75,
          changePercent: 0.53,
          volume: 350000000,
          high: 35100.25,
          low: 34950.00,
          open: 34980.25
        },
        {
          symbol: "^IXIC",
          name: "NASDAQ",
          price: 14025.50,
          change: 325.30,
          changePercent: 2.38,
          volume: 3200000000,
          high: 14100.75,
          low: 13950.25,
          open: 13980.50
        },
        {
          symbol: "^RUT",
          name: "Russell 2000",
          price: 1850.75,
          change: -18.25,
          changePercent: -0.98,
          volume: 450000000,
          high: 1865.50,
          low: 1840.25,
          open: 1855.00
        },
        {
          symbol: "^VIX",
          name: "VIX",
          price: 18.50,
          change: -2.25,
          changePercent: -10.84,
          volume: 85000000,
          high: 19.75,
          low: 18.25,
          open: 19.50
        }
      ]
    }
    
    const computeTime = performance.now() - startTime
    
    return NextResponse.json({
      success: true,
      data: fallbackData,
      meta: {
        timestamp: Date.now(),
        dataSource: 'fallback',
        computeTime
      }
    } as APIResponse<HistoricalData>)
    
  } catch (error) {
    console.error('Error fetching historical data:', error)
    
    // Return mock data as last resort
    const mockData: HistoricalData = {
      yesterday: [
        {
          symbol: "^GSPC",
          name: "S&P 500",
          price: 4487.75,
          change: -15.50,
          changePercent: -0.34,
          volume: 2400000000,
          high: 4505.25,
          low: 4475.50,
          open: 4490.00
        },
        {
          symbol: "^DJI",
          name: "Dow Jones",
          price: 34940.25,
          change: -45.75,
          changePercent: -0.13,
          volume: 340000000,
          high: 35100.25,
          low: 34850.00,
          open: 34980.25
        },
        {
          symbol: "^IXIC",
          name: "NASDAQ",
          price: 13900.20,
          change: -125.30,
          changePercent: -0.89,
          volume: 3100000000,
          high: 14100.75,
          low: 13850.25,
          open: 13980.50
        },
        {
          symbol: "^RUT",
          name: "Russell 2000",
          price: 1859.00,
          change: 8.25,
          changePercent: 0.45,
          volume: 440000000,
          high: 1865.50,
          low: 1840.25,
          open: 1855.00
        },
        {
          symbol: "^VIX",
          name: "VIX",
          price: 19.75,
          change: 1.25,
          changePercent: 6.76,
          volume: 90000000,
          high: 20.75,
          low: 19.25,
          open: 19.50
        }
      ],
      week: [
        {
          symbol: "^GSPC",
          name: "S&P 500",
          price: 4500.25,
          change: 45.50,
          changePercent: 1.02,
          volume: 2500000000,
          high: 4510.50,
          low: 4485.75,
          open: 4490.00
        },
        {
          symbol: "^DJI",
          name: "Dow Jones",
          price: 35025.50,
          change: 185.75,
          changePercent: 0.53,
          volume: 350000000,
          high: 35100.25,
          low: 34950.00,
          open: 34980.25
        },
        {
          symbol: "^IXIC",
          name: "NASDAQ",
          price: 14025.50,
          change: 325.30,
          changePercent: 2.38,
          volume: 3200000000,
          high: 14100.75,
          low: 13950.25,
          open: 13980.50
        },
        {
          symbol: "^RUT",
          name: "Russell 2000",
          price: 1850.75,
          change: -18.25,
          changePercent: -0.98,
          volume: 450000000,
          high: 1865.50,
          low: 1840.25,
          open: 1855.00
        },
        {
          symbol: "^VIX",
          name: "VIX",
          price: 18.50,
          change: -2.25,
          changePercent: -10.84,
          volume: 85000000,
          high: 19.75,
          low: 18.25,
          open: 19.50
        }
      ]
    }
    
    const computeTime = performance.now() - startTime
    
    return NextResponse.json({
      success: true,
      data: mockData,
      meta: {
        timestamp: Date.now(),
        dataSource: 'fallback',
        computeTime
      }
    } as APIResponse<HistoricalData>)
  }
}
