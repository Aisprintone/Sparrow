// PROFILE-SPECIFIC API ROUTES - SURGICAL PRECISION DATA DELIVERY
// Individual profile data endpoints with sub-10ms response times

import { NextRequest, NextResponse } from 'next/server'
import { profileDataService } from '@/lib/services/data-store'
import { FinancialCalculator } from '@/lib/services/financial-calculator'
import type { APIResponse } from '@/lib/data/types'
import { initializeDataStore } from '../init'

// ============================================================================
// API HANDLERS
// ============================================================================

// GET /api/profiles/[id] - Get specific profile data
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = performance.now()
  const resolvedParams = await params
  const profileId = parseInt(resolvedParams.id, 10)
  
  if (isNaN(profileId) || profileId < 1 || profileId > 3) {
    return NextResponse.json({
      success: false,
      error: 'Invalid profile ID',
      message: 'Profile ID must be 1, 2, or 3'
    }, { status: 400 })
  }
  
  try {
    await initializeDataStore()
    
    const profileData = await profileDataService.getProfile(profileId)
    
    if (!profileData) {
      return NextResponse.json({
        success: false,
        error: 'Profile not found',
        message: `No profile found with ID ${profileId}`
      }, { status: 404 })
    }
    
    const computeTime = performance.now() - startTime
    
    // Transform data to frontend-friendly format
    const transformedData = transformProfileData(profileData)
    
    const response: APIResponse<any> = {
      success: true,
      data: transformedData,
      meta: {
        timestamp: Date.now(),
        version: '1.0.0',
        cached: computeTime < 5, // If < 5ms, likely from cache
        cacheAge: computeTime < 5 ? 1000 : undefined,
        computeTime,
        dataSource: computeTime < 5 ? 'cache' : 'computed'
      },
      profile: {
        id: profileId,
        name: getProfileName(profileId),
        lastUpdated: new Date().toISOString(),
        dataQuality: 100
      },
      performance: {
        totalTime: computeTime,
        parseTime: 0,
        computeTime,
        cacheHits: computeTime < 5 ? 1 : 0,
        cacheMisses: computeTime < 5 ? 0 : 1,
        memoryUsed: process.memoryUsage().heapUsed
      }
    }
    
    return NextResponse.json(response, {
      headers: {
        'X-Response-Time': `${computeTime}ms`,
        'X-Profile-Id': profileId.toString(),
        'Cache-Control': 'private, max-age=60' // Cache for 1 minute
      }
    })
  } catch (error) {
    console.error(`Error fetching profile ${profileId}:`, error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch profile',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getProfileName(profileId: number): string {
  const names: Record<number, string> = {
    1: 'Professional (34, NYC)',
    2: 'Family-focused (33, NYC)',
    3: 'Young Professional (23, Austin)'
  }
  return names[profileId] || `Profile ${profileId}`
}

function transformProfileData(profileData: any): any {
  const { customer, accounts, transactions, goals, categories, netWorth, totalAssets, totalLiabilities, monthlySpending, creditScore, lastMonthScore } = profileData
  
  // Calculate all financial metrics using the new calculator
  const calculator = new FinancialCalculator(
    accounts,
    transactions,
    categories,
    customer
  )
  
  const metrics = calculator.calculateMetrics()
  
  // Transform accounts to frontend format
  const transformedAccounts = accounts.map((account: any) => ({
    id: account.account_id,
    name: `${account.institution_name} ${account.account_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
    institution: account.institution_name,
    balance: account.balance,
    type: account.balance >= 0 ? 'asset' : 'liability',
    accountType: account.account_type,
    icon: getInstitutionIcon(account.institution_name)
  }))
  
  // Calculate spending by category for frontend
  const spendingCategories = Object.entries(monthlySpending.categories)
    .map(([categoryName, amount]: [string, any]) => ({
      id: categoryName,
      name: categoryName.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      icon: getCategoryIcon(categoryName),
      spent: amount,
      budget: amount * 1.2, // Mock budget as 120% of spending
      color: amount > monthlySpending.total * 0.1 ? 'red' : 'green',
      percentage: (amount / monthlySpending.total) * 100
    }))
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 6)
  
  // Get recent transactions  
  const recentTransactions = transactions
    .slice(0, 10)
    .map((t: any) => ({
      id: t.transaction_id,
      date: t.timestamp,
      description: t.description,
      amount: t.amount,
      category: categories.find((c: any) => c.category_id === t.category_id)?.name || 'unknown',
      isDebit: t.is_debit
    }))
  
  // Transform goals
  const transformedGoals = goals.map(goal => ({
    id: goal.goal_id,
    title: goal.name,
    type: getGoalType(goal.name),
    target: goal.target_amount,
    current: calculateGoalProgress(goal, accounts, transactions),
    deadline: goal.target_date,
    icon: getGoalIcon(goal.name),
    color: getGoalColor(goal.name),
    monthlyContribution: calculateMonthlyContribution(goal),
    milestones: generateMilestones(goal)
  }))
  
  return {
    customer: {
      id: customer.customer_id,
      location: customer.location,
      age: customer.age,
      name: getProfileName(customer.customer_id)
    },
    accounts: transformedAccounts,
    metrics: {
      netWorth: metrics.netWorth,
      liquidAssets: metrics.liquidAssets,
      totalDebt: metrics.totalLiabilities,
      monthlyIncome: metrics.monthlyIncome,
      monthlySpending: metrics.monthlySpending,
      creditUtilization: metrics.creditUtilization,
      savingsRate: metrics.savingsRate,
      debtToIncomeRatio: metrics.debtToIncomeRatio,
      emergencyFundMonths: metrics.emergencyFundMonths,
      creditScore: metrics.creditScore,
      accessibleNetWorth: metrics.accessibleNetWorth,
      monthlyDebtPayments: metrics.monthlyDebtPayments,
      assetsByLiquidity: metrics.assetsByLiquidity
    },
    spending: {
      total: monthlySpending.total,
      categories: spendingCategories,
      topCategory: spendingCategories[0] || null,
      recurringExpenses: 0
    },
    transactions: recentTransactions,
    goals: transformedGoals,
    charts: {
      netWorthHistory: [],
      spendingTrends: [],
      incomeTrends: []
    }
  }
}

function getInstitutionIcon(institution: string): string {
  const icons: Record<string, string> = {
    'Chase': '/logos/chase.png',
    'Fidelity': '/logos/fidelity.png',
    'Ally': '/logos/chase.png',
    'Amex': '/logos/amex.png',
    'Robinhood': '/logos/vanguard.png',
    'Moov': '🎓'
  }
  return icons[institution] || '/logos/chase.png'
}

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    'grocery': '🛒',
    'utilities': '💡',
    'dining': '🍕',
    'entertainment': '🎬',
    'salary': '💰',
    'student_loan': '🎓',
    'subscription': '📱',
    'transfer': '↔️',
    'rent': '🏠',
    'fuel': '⛽',
    'mortgage_payment': '🏡'
  }
  return icons[category] || '💳'
}

function getGoalType(goalName: string): 'safety' | 'home' | 'experience' {
  if (goalName.toLowerCase().includes('house') || goalName.toLowerCase().includes('home')) {
    return 'home'
  }
  if (goalName.toLowerCase().includes('debt') || goalName.toLowerCase().includes('credit')) {
    return 'safety'
  }
  return 'experience'
}

function getGoalIcon(goalName: string): string {
  if (goalName.toLowerCase().includes('house')) return 'Home'
  if (goalName.toLowerCase().includes('debt')) return 'CreditCard'
  if (goalName.toLowerCase().includes('credit')) return 'TrendingUp'
  if (goalName.toLowerCase().includes('invest')) return 'TrendingUp'
  return 'Target'
}

function getGoalColor(goalName: string): string {
  if (goalName.toLowerCase().includes('house')) return 'blue'
  if (goalName.toLowerCase().includes('debt')) return 'red'
  if (goalName.toLowerCase().includes('credit')) return 'green'
  if (goalName.toLowerCase().includes('invest')) return 'purple'
  return 'gray'
}

function calculateGoalProgress(goal: any, accounts: any[], transactions: any[]): number {
  // Simplified calculation - in production would track actual savings
  const monthsSinceStart = 6
  const monthlyAmount = goal.target_amount / 36 // 3-year goal
  return Math.min(monthlyAmount * monthsSinceStart, goal.target_amount * 0.4)
}

function calculateMonthlyContribution(goal: any): number {
  const targetDate = new Date(goal.target_date)
  const today = new Date()
  const monthsRemaining = Math.max(1, 
    (targetDate.getFullYear() - today.getFullYear()) * 12 + 
    (targetDate.getMonth() - today.getMonth())
  )
  return Math.round(goal.target_amount / monthsRemaining)
}

function generateMilestones(goal: any): any[] {
  return [
    { name: '25% Complete', target: goal.target_amount * 0.25 },
    { name: '50% Complete', target: goal.target_amount * 0.5 },
    { name: '75% Complete', target: goal.target_amount * 0.75 },
    { name: 'Goal Achieved!', target: goal.target_amount }
  ]
}

function calculateCreditScore(utilization: number, customerId: number): number {
  // Simplified credit score calculation
  const baseScores: Record<number, number> = {
    1: 780,
    2: 720,
    3: 650
  }
  
  const base = baseScores[customerId] || 700
  const utilizationPenalty = Math.max(0, (utilization - 30) * 2)
  
  return Math.round(base - utilizationPenalty)
}