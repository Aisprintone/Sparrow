import { NextRequest, NextResponse } from 'next/server'

const marketData = [
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
  },
  {
    symbol: "^DJI",
    name: "Dow Jones",
    price: 34500.25,
    change: 45.75,
    changePercent: 0.13
  },
  {
    symbol: "^VIX",
    name: "VIX",
    price: 18.50,
    change: -0.75,
    changePercent: -3.90
  }
]

export async function GET(request: NextRequest) {
  try {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100))
    
    return NextResponse.json({
      success: true,
      data: marketData,
      meta: {
        dataSource: 'Mock API',
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error fetching market data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch market data' },
      { status: 500 }
    )
  }
}
