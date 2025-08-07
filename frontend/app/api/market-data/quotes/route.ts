import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function GET(request: NextRequest) {
  try {
    // Fetch market data from backend
    const response = await fetch(`${BACKEND_URL}/api/market-data`, {
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`)
    }

    const data = await response.json()
    
    // Transform backend data to frontend format
    const quotes = Object.entries(data.data).map(([symbol, quoteData]: [string, any]) => ({
      symbol,
      name: getIndexName(symbol),
      price: quoteData.price || 0,
      change: quoteData.change || 0,
      changePercent: quoteData.changePercent || 0,
      volume: quoteData.volume,
      high: quoteData.high,
      low: quoteData.low,
      open: quoteData.open
    }))

    return NextResponse.json({
      success: true,
      data: quotes
    })
  } catch (error) {
    console.error('Error fetching market quotes:', error)
    
    // Return fallback data
    const fallbackQuotes = [
      {
        symbol: "^GSPC",
        name: "S&P 500",
        price: 4500.0,
        change: 12.5,
        changePercent: 0.28,
        volume: 2500000000,
        high: 4510.0,
        low: 4485.0,
        open: 4490.0
      },
      {
        symbol: "^DJI",
        name: "Dow Jones",
        price: 35000.0,
        change: 85.75,
        changePercent: 0.25,
        volume: 350000000,
        high: 35100.0,
        low: 34900.0,
        open: 34950.0
      },
      {
        symbol: "^IXIC",
        name: "NASDAQ",
        price: 14025.5,
        change: 85.75,
        changePercent: 0.61,
        volume: 1800000000,
        high: 14050.0,
        low: 13980.0,
        open: 13990.0
      },
      {
        symbol: "^RUT",
        name: "Russell 2000",
        price: 1850.75,
        change: -8.25,
        changePercent: -0.44,
        volume: 450000000,
        high: 1860.0,
        low: 1845.0,
        open: 1855.0
      },
      {
        symbol: "^VIX",
        name: "VIX",
        price: 15.25,
        change: -0.75,
        changePercent: -4.69,
        volume: 85000000,
        high: 16.0,
        low: 15.0,
        open: 16.0
      }
    ]

    return NextResponse.json({
      success: true,
      data: fallbackQuotes
    })
  }
}

function getIndexName(symbol: string): string {
  const names: { [key: string]: string } = {
    "^GSPC": "S&P 500",
    "^DJI": "Dow Jones",
    "^IXIC": "NASDAQ",
    "^RUT": "Russell 2000",
    "^VIX": "VIX"
  }
  return names[symbol] || symbol
}
