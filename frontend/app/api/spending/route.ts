// SPENDING API ROUTES - SURGICAL PRECISION SPENDING DATA ENDPOINTS
// Optimized for < 10ms response times with intelligent caching and data aggregation

import { NextRequest, NextResponse } from 'next/server'
import { profileDataService } from '@/lib/services/data-store'
import type { Transaction, Category } from '@/lib/types/csv-data'

// ============================================================================
// PERFORMANCE CACHE LAYER - SUB-10MS RESPONSE TIMES
// ============================================================================
const spendingCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 60000 // 1 minute TTL for spending data

function getCacheKey(customerId: number, year: number, month?: number): string {
  return month !== undefined 
    ? `spending-${customerId}-${year}-${month}`
    : `spending-${customerId}-${year}`
}

// ============================================================================
// DATA AGGREGATION ENGINE - SURGICAL PRECISION CALCULATIONS
// ============================================================================
interface SpendingMetrics {
  total: number
  categories: Array<{
    id: number
    name: string
    spent: number
    budget: number
    icon: string
    isRecurring: boolean
    isOverBudget: boolean
    percentage: number
  }>
  recurringTotal: number
  nonRecurringTotal: number
  comparison: {
    lastPeriod: number
    averagePeriod: number
    bestPeriod: number
    difference: number
    trend: 'up' | 'down' | 'stable'
  }
  dailyAverage: number
  projectedTotal: number
  insights: Array<{
    type: 'alert' | 'success' | 'trend'
    title: string
    description: string
    value?: number
  }>
}

function calculateSpendingMetrics(
  transactions: Transaction[],
  categories: Category[],
  year: number,
  month?: number,
  customerId?: number
): SpendingMetrics {
  const startTime = performance.now()
  
  // Filter transactions for the specified period
  const filteredTransactions = transactions.filter(tx => {
    const txDate = new Date(tx.timestamp)
    const yearMatch = txDate.getFullYear() === year
    const monthMatch = month === undefined || txDate.getMonth() === month - 1
    return yearMatch && monthMatch && tx.is_debit && tx.amount < 0
  })
  
  // Build category map for O(1) lookups
  const categoryMap = new Map(categories.map(cat => [cat.category_id, cat]))
  
  // Aggregate spending by category with surgical precision
  const categorySpending = new Map<number, number>()
  const recurringCategories = new Set<number>()
  
  for (const tx of filteredTransactions) {
    const amount = Math.abs(tx.amount)
    const current = categorySpending.get(tx.category_id) || 0
    categorySpending.set(tx.category_id, current + amount)
    
    if (tx.is_bill || tx.is_subscription) {
      recurringCategories.add(tx.category_id)
    }
  }
  
  // Generate budget targets based on profile (hardcoded for demo)
  const budgetTargets = getBudgetTargets(customerId || 1)
  
  // Build category metrics with icon mapping
  const categoryMetrics = Array.from(categorySpending.entries()).map(([catId, spent]) => {
    const category = categoryMap.get(catId)
    const categoryName = category?.name || 'Other'
    const budget = budgetTargets[categoryName] || spent * 1.1
    const isRecurring = recurringCategories.has(catId)
    
    return {
      id: catId,
      name: categoryName,
      spent: Math.round(spent),
      budget: Math.round(budget),
      icon: getCategoryIcon(categoryName),
      isRecurring,
      isOverBudget: spent > budget,
      percentage: (spent / budget) * 100
    }
  }).sort((a, b) => b.spent - a.spent) // Sort by spending amount
  
  // Calculate totals
  const total = categoryMetrics.reduce((sum, cat) => sum + cat.spent, 0)
  const recurringTotal = categoryMetrics
    .filter(cat => cat.isRecurring)
    .reduce((sum, cat) => sum + cat.spent, 0)
  const nonRecurringTotal = total - recurringTotal
  
  // Calculate comparison metrics (mock data for demo)
  const comparison = calculateComparison(total, year, month)
  
  // Calculate daily average and projection
  const daysInPeriod = month !== undefined ? new Date(year, month, 0).getDate() : 365
  const currentDay = month !== undefined 
    ? new Date().getDate() 
    : Math.floor((new Date().getTime() - new Date(year, 0, 1).getTime()) / (1000 * 60 * 60 * 24))
  const dailyAverage = total / currentDay
  const projectedTotal = dailyAverage * daysInPeriod
  
  // Generate insights with surgical analysis
  const insights = generateInsights(categoryMetrics, total, comparison, customerId || 1)
  
  const computeTime = performance.now() - startTime
  console.log(`[PERFORMANCE] Spending metrics calculated in ${computeTime.toFixed(2)}ms`)
  
  return {
    total,
    categories: categoryMetrics,
    recurringTotal,
    nonRecurringTotal,
    comparison,
    dailyAverage: Math.round(dailyAverage),
    projectedTotal: Math.round(projectedTotal),
    insights
  }
}

function getBudgetTargets(customerId: number): Record<string, number> {
  // Profile-specific budget targets
  const budgets: Record<number, Record<string, number>> = {
    1: { // Millennial
      'Food & Dining': 700,
      'Shopping': 500,
      'Transportation': 500,
      'Entertainment': 400,
      'Groceries': 700,
      'Utilities': 300,
      'Healthcare': 200,
      'Other': 200
    },
    2: { // Mid-career
      'Food & Dining': 500,
      'Shopping': 400,
      'Transportation': 400,
      'Entertainment': 300,
      'Groceries': 600,
      'Utilities': 300,
      'Healthcare': 250,
      'Other': 250
    },
    3: { // Gen Z
      'Food & Dining': 400,
      'Shopping': 300,
      'Transportation': 200,
      'Entertainment': 250,
      'Groceries': 500,
      'Utilities': 200,
      'Healthcare': 100,
      'Other': 150
    }
  }
  
  return budgets[customerId] || budgets[1]
}

function getCategoryIcon(categoryName: string): string {
  const iconMap: Record<string, string> = {
    'food_delivery': '🍕',
    'restaurant': '🍽️',
    'grocery': '🥬',
    'shopping': '🛍️',
    'transportation': '🚗',
    'gas': '⛽',
    'entertainment': '🎬',
    'utilities': '⚡',
    'healthcare': '🏥',
    'rent': '🏠',
    'mortgage_payment': '🏡',
    'education': '🎓',
    'student_loan': '🎓',
    'travel': '✈️',
    'subscription': '📺',
    'insurance': '🛡️',
    'credit_card_payment': '💳',
    'transfer': '💸',
    'atm_withdrawal': '🏧',
    'deposit': '💰',
    'Other': '💼'
  }
  
  // Try exact match first, then partial match
  if (iconMap[categoryName]) {
    return iconMap[categoryName]
  }
  
  // Try partial match
  const lowerName = categoryName.toLowerCase()
  for (const [key, icon] of Object.entries(iconMap)) {
    if (lowerName.includes(key) || key.includes(lowerName)) {
      return icon
    }
  }
  
  return '💼'
}

function calculateComparison(
  currentTotal: number,
  year: number,
  month?: number
): SpendingMetrics['comparison'] {
  // Mock comparison data (in production, this would query historical data)
  const isYearly = month === undefined
  const lastPeriod = currentTotal * 1.08 // 8% higher last period
  const averagePeriod = currentTotal * 1.05 // 5% higher on average
  const bestPeriod = currentTotal * 0.92 // 8% lower in best period
  
  return {
    lastPeriod: Math.round(lastPeriod),
    averagePeriod: Math.round(averagePeriod),
    bestPeriod: Math.round(bestPeriod),
    difference: Math.round(currentTotal - lastPeriod),
    trend: currentTotal < lastPeriod ? 'down' : currentTotal > lastPeriod ? 'up' : 'stable'
  }
}

function generateInsights(
  categories: SpendingMetrics['categories'],
  total: number,
  comparison: SpendingMetrics['comparison'],
  customerId: number
): SpendingMetrics['insights'] {
  const insights: SpendingMetrics['insights'] = []
  
  // Find overspending categories
  const overBudget = categories.filter(cat => cat.isOverBudget)
  if (overBudget.length > 0) {
    const worst = overBudget[0]
    insights.push({
      type: 'alert',
      title: `${worst.name} Alert`,
      description: `You're ${Math.round(worst.percentage - 100)}% over budget in ${worst.name}`,
      value: worst.spent - worst.budget
    })
  }
  
  // Find savings opportunities
  const underBudget = categories.filter(cat => !cat.isOverBudget && cat.percentage < 80)
  if (underBudget.length > 0) {
    const best = underBudget[0]
    insights.push({
      type: 'success',
      title: `${best.name} Savings`,
      description: `Great job! You're ${Math.round(100 - best.percentage)}% under budget`,
      value: best.budget - best.spent
    })
  }
  
  // Add trend insight
  if (comparison.trend === 'down') {
    insights.push({
      type: 'trend',
      title: 'Spending Trend',
      description: `Your spending is down ${Math.abs(comparison.difference)} compared to last period`,
      value: Math.abs(comparison.difference)
    })
  } else if (comparison.trend === 'up') {
    insights.push({
      type: 'alert',
      title: 'Spending Increase',
      description: `Your spending is up ${comparison.difference} compared to last period`,
      value: comparison.difference
    })
  }
  
  return insights
}

// ============================================================================
// API HANDLERS - SURGICAL PRECISION ENDPOINTS
// ============================================================================

export async function GET(request: NextRequest) {
  const startTime = performance.now()
  
  try {
    const { searchParams } = new URL(request.url)
    const customerId = parseInt(searchParams.get('customerId') || '1')
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined
    
    // Check cache first
    const cacheKey = getCacheKey(customerId, year, month)
    const cached = spendingCache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      const cacheTime = performance.now() - startTime
      console.log(`[CACHE HIT] Spending data served in ${cacheTime.toFixed(2)}ms`)
      
      return NextResponse.json({
        success: true,
        data: cached.data,
        meta: {
          cached: true,
          computeTime: cacheTime,
          timestamp: cached.timestamp
        }
      }, {
        headers: {
          'X-Response-Time': `${cacheTime}ms`,
          'X-Cache': 'HIT',
          'Cache-Control': 'private, max-age=60'
        }
      })
    }
    
    // Fetch profile data
    const profile = await profileDataService.getProfile(customerId)
    
    // Calculate spending metrics with surgical precision
    const metrics = calculateSpendingMetrics(
      profile.transactions,
      profile.categories,
      year,
      month,
      customerId
    )
    
    // Cache the result
    spendingCache.set(cacheKey, {
      data: metrics,
      timestamp: Date.now()
    })
    
    const computeTime = performance.now() - startTime
    console.log(`[PERFORMANCE] Spending data computed in ${computeTime.toFixed(2)}ms`)
    
    // Ensure we meet our < 10ms target for cached requests
    if (computeTime > 10) {
      console.warn(`[PERFORMANCE WARNING] Response time ${computeTime.toFixed(2)}ms exceeds 10ms target`)
    }
    
    return NextResponse.json({
      success: true,
      data: metrics,
      meta: {
        cached: false,
        computeTime,
        timestamp: Date.now(),
        customerId,
        year,
        month
      }
    }, {
      headers: {
        'X-Response-Time': `${computeTime}ms`,
        'X-Cache': 'MISS',
        'Cache-Control': 'private, max-age=60'
      }
    })
    
  } catch (error) {
    console.error('Error fetching spending data:', error)
    const errorTime = performance.now() - startTime
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch spending data',
      message: error instanceof Error ? error.message : 'Unknown error',
      meta: {
        computeTime: errorTime
      }
    }, { 
      status: 500,
      headers: {
        'X-Response-Time': `${errorTime}ms`
      }
    })
  }
}

// Clear cache endpoint for testing
export async function DELETE(request: NextRequest) {
  spendingCache.clear()
  return NextResponse.json({
    success: true,
    message: 'Spending cache cleared'
  })
}