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
    // Use the profiles endpoint since spending endpoint doesn't exist
    const response = await fetch(
      `${this.baseUrl}/profiles/${profileId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch profile data: ${response.status}`)
    }

    const profileData = await response.json()
    
    // Transform profile data to spending data format
    return this.transformProfileToSpendingData(profileData, category)
  }

  private transformProfileToSpendingData(profileData: any, category?: string) {
    // Extract spending information from profile data
    const accounts = profileData.accounts || []
    const transactions = profileData.transactions || []
    
    // Calculate spending by category
    const spendingByCategory = new Map<string, number>()
    
    transactions.forEach((transaction: any) => {
      const cat = transaction.category || 'Other'
      if (!category || cat === category) {
        spendingByCategory.set(cat, (spendingByCategory.get(cat) || 0) + Math.abs(transaction.amount || 0))
      }
    })
    
    const categories = Array.from(spendingByCategory.entries()).map(([name, spent], index) => ({
      id: index + 1,
      name,
      spent,
      budget: this.getBudgetForCategory(name),
      icon: this.getIconForCategory(name),
      isRecurring: this.isRecurringCategory(name),
      isOverBudget: spent > this.getBudgetForCategory(name),
      percentage: Math.min((spent / this.getBudgetForCategory(name)) * 100, 100)
    }))
    
    const total = categories.reduce((sum, cat) => sum + cat.spent, 0)
    
    return {
      total,
      categories,
      recurringTotal: categories.filter(cat => cat.isRecurring).reduce((sum, cat) => sum + cat.spent, 0),
      nonRecurringTotal: categories.filter(cat => !cat.isRecurring).reduce((sum, cat) => sum + cat.spent, 0),
      comparison: {
        lastPeriod: total * 0.95, // Mock data
        averagePeriod: total,
        bestPeriod: total * 0.85,
        difference: total * 0.05,
        trend: 'up' as const
      },
      dailyAverage: total / 30,
      projectedTotal: total * 1.1,
      insights: this.generateInsights(categories, total)
    }
  }

  private getBudgetForCategory(categoryName: string): number {
    const budgets: Record<string, number> = {
      'Housing': 1500,
      'Food & Dining': 500,
      'Transportation': 400,
      'Utilities': 300,
      'Entertainment': 200,
      'Healthcare': 300,
      'Other': 200
    }
    return budgets[categoryName] || 200
  }

  private isRecurringCategory(categoryName: string): boolean {
    const recurringCategories = ['Housing', 'Utilities', 'Transportation']
    return recurringCategories.includes(categoryName)
  }

  private getIconForCategory(categoryName: string): string {
    const icons: Record<string, string> = {
      'Housing': '🏠',
      'Food & Dining': '🍽️',
      'Transportation': '🚗',
      'Utilities': '⚡',
      'Entertainment': '🎬',
      'Healthcare': '🏥',
      'Other': '📦'
    }
    return icons[categoryName] || '📦'
  }

  private generateInsights(categories: any[], total: number) {
    const insights = []
    
    // Check for over-budget categories
    const overBudgetCategories = categories.filter(cat => cat.isOverBudget)
    if (overBudgetCategories.length > 0) {
      insights.push({
        type: 'alert',
        title: 'Over Budget Categories',
        description: `${overBudgetCategories.length} categories are over budget`,
        value: overBudgetCategories.length
      })
    }
    
    // Check for high spending
    if (total > 3000) {
      insights.push({
        type: 'alert',
        title: 'High Monthly Spending',
        description: 'Your spending is above average',
        value: total
      })
    }
    
    return insights
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

    const service = new BackendSpendingDataService(BACKEND_URL)
    
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