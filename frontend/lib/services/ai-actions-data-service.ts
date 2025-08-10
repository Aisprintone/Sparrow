/**
 * AI Actions Data Service
 * Generates personalized AI action recommendations based on real profile data
 */

import { profileDataService, ProfileFinancialData } from './profile-data-service'
import type { AIAction } from '@/hooks/use-app-state'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface PersonalizedAIAction extends AIAction {
  relevanceScore: number
  profileSpecific: boolean
  dataSource: 'real' | 'generated'
}

class AIActionsDataService {
  private static instance: AIActionsDataService
  private cache: Map<number, PersonalizedAIAction[]> = new Map()

  static getInstance(): AIActionsDataService {
    if (!AIActionsDataService.instance) {
      AIActionsDataService.instance = new AIActionsDataService()
    }
    return AIActionsDataService.instance
  }

  /**
   * Get personalized AI actions based on profile data
   */
  async getPersonalizedActions(profileId: number): Promise<PersonalizedAIAction[]> {
    // Check cache first
    if (this.cache.has(profileId)) {
      return this.cache.get(profileId)!
    }

    try {
      // Get profile data
      const profileData = await profileDataService.getProfileData(profileId)
      
      // Try to get AI recommendations from backend
      const response = await fetch(`${BACKEND_URL}/api/ai-actions/profile/${profileId}`)
      if (response.ok) {
        const data = await response.json()
        const actions = this.enhanceActionsWithProfileData(data.actions || [], profileData)
        this.cache.set(profileId, actions)
        return actions
      }
    } catch (error) {
      console.error('Error fetching AI actions:', error)
    }

    // Generate personalized actions based on profile data
    const actions = this.generatePersonalizedActions(profileData)
    this.cache.set(profileId, actions)
    return actions
  }

  /**
   * Generate personalized actions based on profile analysis
   */
  private generatePersonalizedActions(profile: ProfileFinancialData): PersonalizedAIAction[] {
    const actions: PersonalizedAIAction[] = []
    const monthlyIncome = profile.monthlyIncome
    const monthlyExpenses = profile.monthlyExpenses
    const savingsRate = (monthlyIncome - monthlyExpenses) / monthlyIncome
    const hasEmergencyFund = profile.emergencyFundBalance >= (monthlyExpenses * 3)
    const hasStudentDebt = profile.studentLoanBalance > 0
    const creditScoreNeedsWork = profile.creditScore < 700

    // High-priority actions based on financial situation
    if (!hasEmergencyFund) {
      actions.push({
        id: 'build-emergency-fund',
        title: 'Build Emergency Fund',
        description: `You currently have $${profile.emergencyFundBalance.toLocaleString()} saved. Build a 6-month emergency fund of $${(monthlyExpenses * 6).toLocaleString()}`,
        potentialSaving: Math.round(monthlyExpenses * 0.1),
        status: 'suggested',
        priority: 'high',
        category: 'savings',
        rationale: `Based on your monthly expenses of $${monthlyExpenses.toLocaleString()}, you need a larger emergency cushion. This protects against job loss or unexpected expenses.`,
        relevanceScore: 95,
        profileSpecific: true,
        dataSource: 'generated'
      })
    }

    // Debt optimization for high-interest debt
    if (hasStudentDebt) {
      actions.push({
        id: 'optimize-student-loans',
        title: 'Optimize Student Loan Repayment',
        description: `Refinance or consolidate your $${profile.studentLoanBalance.toLocaleString()} in student loans`,
        potentialSaving: Math.round(profile.studentLoanBalance * 0.002), // 0.2% monthly saving estimate
        status: 'suggested',
        priority: 'high',
        category: 'debt',
        rationale: `With ${profile.studentLoanBalance.toLocaleString()} in student debt, refinancing could save you hundreds per month. Your ${profile.creditScore} credit score may qualify you for better rates.`,
        relevanceScore: 90,
        profileSpecific: true,
        dataSource: 'generated'
      })
    }

    // Credit score improvement
    if (creditScoreNeedsWork) {
      actions.push({
        id: 'improve-credit-score',
        title: 'Boost Credit Score',
        description: `Implement strategies to increase your ${profile.creditScore} credit score to 750+`,
        potentialSaving: 50, // Indirect savings from better rates
        status: 'suggested',
        priority: 'medium',
        category: 'credit',
        rationale: `Your current ${profile.creditScore} score is below optimal. Improving it by ${750 - profile.creditScore} points will qualify you for better rates on loans and credit cards.`,
        relevanceScore: 85,
        profileSpecific: true,
        dataSource: 'generated'
      })
    }

    // Savings optimization based on income
    if (savingsRate < 0.2 && monthlyIncome > 3000) {
      actions.push({
        id: 'increase-savings-rate',
        title: 'Optimize Savings Rate',
        description: `Increase your savings from ${Math.round(savingsRate * 100)}% to 20% of income`,
        potentialSaving: Math.round((0.2 - savingsRate) * monthlyIncome),
        status: 'suggested',
        priority: 'medium',
        category: 'savings',
        rationale: `You're currently saving ${Math.round(savingsRate * 100)}% of your income. Increasing to 20% would add $${Math.round((0.2 - savingsRate) * monthlyIncome)} monthly to your wealth.`,
        relevanceScore: 80,
        profileSpecific: true,
        dataSource: 'generated'
      })
    }

    // Investment recommendations based on net worth
    if (profile.netWorth > 50000 && savingsRate > 0.1) {
      actions.push({
        id: 'optimize-investments',
        title: 'Optimize Investment Portfolio',
        description: 'Review and rebalance your investment allocations for better returns',
        potentialSaving: Math.round(profile.netWorth * 0.001), // 0.1% monthly optimization
        status: 'suggested',
        priority: 'medium',
        category: 'investment',
        rationale: `With a net worth of $${profile.netWorth.toLocaleString()}, optimizing your portfolio allocation could increase returns by 2-3% annually.`,
        relevanceScore: 75,
        profileSpecific: true,
        dataSource: 'generated'
      })
    }

    // Subscription audit for everyone
    actions.push({
      id: 'cancel-unused-subscriptions',
      title: 'Cancel Unused Subscriptions',
      description: 'Audit and cancel subscriptions you don\'t actively use',
      potentialSaving: Math.round(monthlyExpenses * 0.03), // 3% of expenses estimate
      status: 'suggested',
      priority: 'low',
      category: 'spending',
      rationale: `The average person wastes $${Math.round(monthlyExpenses * 0.03)} on unused subscriptions. A quick audit could free up this money for your goals.`,
      relevanceScore: 70,
      profileSpecific: true,
      dataSource: 'generated'
    })

    // Bill negotiation
    actions.push({
      id: 'negotiate-bills',
      title: 'Negotiate Monthly Bills',
      description: 'Lower your internet, phone, and insurance bills through negotiation',
      potentialSaving: Math.round(monthlyExpenses * 0.05), // 5% of expenses estimate
      status: 'suggested',
      priority: 'low',
      category: 'spending',
      rationale: `Most people can save 10-20% on recurring bills. Based on your $${monthlyExpenses} monthly expenses, this could save $${Math.round(monthlyExpenses * 0.05)}/month.`,
      relevanceScore: 65,
      profileSpecific: true,
      dataSource: 'generated'
    })

    // High-yield savings account
    if (profile.savingsBalance > 5000) {
      actions.push({
        id: 'high-yield-savings',
        title: 'Move to High-Yield Savings',
        description: `Earn 4.5% APY on your $${profile.savingsBalance.toLocaleString()} savings`,
        potentialSaving: Math.round(profile.savingsBalance * 0.003), // 0.3% monthly
        status: 'suggested',
        priority: 'low',
        category: 'savings',
        rationale: `Your $${profile.savingsBalance.toLocaleString()} could earn an extra $${Math.round(profile.savingsBalance * 0.045 / 12)}/month in a high-yield account.`,
        relevanceScore: 60,
        profileSpecific: true,
        dataSource: 'generated'
      })
    }

    // Sort by relevance score
    return actions.sort((a, b) => b.relevanceScore - a.relevanceScore)
  }

  /**
   * Enhance backend actions with profile-specific data
   */
  private enhanceActionsWithProfileData(
    actions: any[],
    profile: ProfileFinancialData
  ): PersonalizedAIAction[] {
    return actions.map(action => ({
      ...action,
      relevanceScore: this.calculateRelevanceScore(action, profile),
      profileSpecific: true,
      dataSource: 'real' as const,
      rationale: this.enhanceRationale(action.rationale || action.description, profile)
    }))
  }

  /**
   * Calculate relevance score based on profile data
   */
  private calculateRelevanceScore(action: any, profile: ProfileFinancialData): number {
    let score = 50 // Base score

    // Adjust based on financial situation
    if (action.category === 'emergency' && profile.emergencyFundBalance < profile.monthlyExpenses * 3) {
      score += 30
    }
    if (action.category === 'debt' && profile.studentLoanBalance > 0) {
      score += 25
    }
    if (action.category === 'credit' && profile.creditScore < 700) {
      score += 20
    }
    if (action.category === 'investment' && profile.netWorth > 100000) {
      score += 15
    }

    // Adjust based on potential savings relative to income
    const savingsRatio = action.potentialSaving / profile.monthlyIncome
    score += Math.min(20, savingsRatio * 100)

    return Math.min(100, score)
  }

  /**
   * Enhance rationale with profile-specific details
   */
  private enhanceRationale(baseRationale: string, profile: ProfileFinancialData): string {
    const enhancements = []
    
    if (profile.creditScore) {
      enhancements.push(`With your ${profile.creditScore} credit score`)
    }
    if (profile.monthlyIncome && profile.monthlyExpenses) {
      const savingsAmount = profile.monthlyIncome - profile.monthlyExpenses
      enhancements.push(`you're currently saving $${savingsAmount.toLocaleString()}/month`)
    }
    if (profile.netWorth) {
      enhancements.push(`your $${profile.netWorth.toLocaleString()} net worth`)
    }

    if (enhancements.length > 0) {
      return `${baseRationale} Based on ${enhancements.join(' and ')}, this action is particularly relevant for you.`
    }

    return baseRationale
  }

  /**
   * Clear cache for a specific profile or all profiles
   */
  clearCache(profileId?: number) {
    if (profileId) {
      this.cache.delete(profileId)
    } else {
      this.cache.clear()
    }
  }
}

export const aiActionsDataService = AIActionsDataService.getInstance()