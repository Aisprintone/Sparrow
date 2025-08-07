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
 * Spending Data Service - Dependency Inversion
 */
class SpendingDataService {
  private readonly baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
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

    const service = new SpendingDataService(BACKEND_URL)
    
    // Try to get from backend first
    try {
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
    } catch (backendError) {
      console.warn('[Spending API] Backend unavailable, using mock data:', backendError)
      
      // Fallback to mock data for development
      const mockData = generateMockSpendingData(profileId)
      
      return NextResponse.json({
        success: true,
        data: mockData,
        source: 'mock',
        warning: 'Using mock data - backend unavailable'
      })
    }

  } catch (error: any) {
    console.error('[Spending API Error]:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error'
      },
      { status: 500 }
    )
  }
}

/**
 * Generate mock spending data for development/fallback
 */
function generateMockSpendingData(profileId: string) {
  const categories = [
    'Housing', 'Food', 'Transportation', 'Healthcare', 
    'Entertainment', 'Utilities', 'Insurance', 'Other'
  ]

  const currentDate = new Date()
  const transactions = []

  // Generate 30 days of mock transactions
  for (let i = 0; i < 30; i++) {
    const date = new Date(currentDate)
    date.setDate(date.getDate() - i)

    // Generate 1-5 transactions per day
    const transactionsPerDay = Math.floor(Math.random() * 5) + 1
    
    for (let j = 0; j < transactionsPerDay; j++) {
      const category = categories[Math.floor(Math.random() * categories.length)]
      const amount = getRandomAmount(category)
      
      transactions.push({
        id: `${i}-${j}`,
        date: date.toISOString(),
        amount: amount,
        category: category,
        description: `${category} expense`,
        merchant: `${category} Provider`,
        profile_id: profileId
      })
    }
  }

  // Calculate spending by category
  const spendingByCategory = categories.reduce((acc, category) => {
    const categoryTransactions = transactions.filter(t => t.category === category)
    acc[category] = categoryTransactions.reduce((sum, t) => sum + t.amount, 0)
    return acc
  }, {} as Record<string, number>)

  // Calculate daily spending
  const dailySpending = transactions.reduce((acc, transaction) => {
    const date = transaction.date.split('T')[0]
    if (!acc[date]) acc[date] = 0
    acc[date] += transaction.amount
    return acc
  }, {} as Record<string, number>)

  return {
    transactions: transactions.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    ),
    summary: {
      total_spending: transactions.reduce((sum, t) => sum + t.amount, 0),
      average_daily: transactions.reduce((sum, t) => sum + t.amount, 0) / 30,
      by_category: spendingByCategory,
      by_day: dailySpending,
      highest_category: Object.entries(spendingByCategory)
        .sort(([, a], [, b]) => b - a)[0][0],
      transaction_count: transactions.length
    },
    profile_id: profileId,
    date_range: {
      start: transactions[transactions.length - 1].date,
      end: transactions[0].date
    }
  }
}

/**
 * Get random amount based on category
 */
function getRandomAmount(category: string): number {
  const ranges: Record<string, [number, number]> = {
    'Housing': [1500, 3000],
    'Food': [50, 200],
    'Transportation': [30, 150],
    'Healthcare': [50, 500],
    'Entertainment': [20, 100],
    'Utilities': [100, 300],
    'Insurance': [200, 500],
    'Other': [10, 200]
  }

  const [min, max] = ranges[category] || [10, 100]
  return Math.round((Math.random() * (max - min) + min) * 100) / 100
}