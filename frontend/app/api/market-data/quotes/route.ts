import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function GET() {
  try {
    // Return static fallback data for static export
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
  } catch (error) {
    console.error('Error fetching market quotes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
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
