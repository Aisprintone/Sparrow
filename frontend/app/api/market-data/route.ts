import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('[MARKET DATA API] 🚀 Market data request received')
  console.log('[MARKET DATA API] Request URL:', request.url)
  console.log('[MARKET DATA API] User Agent:', request.headers.get('user-agent'))
  
  try {
    // Try to fetch from external API first
    const externalApiUrl = 'https://api.example.com/market-data' // Replace with actual API
    console.log('[MARKET DATA API] 🔄 Attempting to fetch from external API:', externalApiUrl)
    
    const response = await fetch(externalApiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000) // 5 second timeout
    })
    
    console.log('[MARKET DATA API] External API response status:', response.status)
    
    if (response.ok) {
      const data = await response.json()
      console.log('[MARKET DATA API] ✅ External API data received successfully')
      console.log('[MARKET DATA API] Data source: External API')
      console.log('[MARKET DATA API] Symbols count:', data.length || 'N/A')
      
      return NextResponse.json({
        success: true,
        data: data,
        meta: {
          dataSource: 'External API',
          timestamp: new Date().toISOString(),
          cached: false
        }
      })
    } else {
      console.log('[MARKET DATA API] ⚠️ External API failed, using fallback data')
      throw new Error(`External API returned ${response.status}`)
    }
  } catch (error) {
    console.log('[MARKET DATA API] 🔄 Using fallback market data')
    console.log('[MARKET DATA API] Error details:', error.message)
    
    // Fallback to mock data
    const fallbackData = [
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
        symbol: "AAPL",
        name: "Apple Inc.",
        price: 175.50,
        change: 2.25,
        changePercent: 1.30
      },
      {
        symbol: "MSFT",
        name: "Microsoft Corp.",
        price: 320.75,
        change: 5.50,
        changePercent: 1.75
      }
    ]
    
    console.log('[MARKET DATA API] ✅ Fallback data returned (count:', fallbackData.length, ')')
    
    return NextResponse.json({
      success: true,
      data: fallbackData,
      meta: {
        dataSource: 'Fallback Data',
        timestamp: new Date().toISOString(),
        cached: true
      }
    })
  }
}
