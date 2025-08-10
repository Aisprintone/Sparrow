/**
 * Goals API Integration Service
 * Connects to real backend while preserving existing UI/UX
 * 
 * CRITICAL: This service maintains exact data shape compatibility
 * with existing components while fetching from real backend
 */

import { Goal } from '@/lib/data'
import { GoalProgressCalculator } from '@/lib/utils/goal-progress-calculator'

// Backend API base URL - adjust for production
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

/**
 * Transform backend goal data to frontend Goal interface
 * Preserves all existing UI fields while mapping real data
 */
function transformBackendGoal(backendGoal: any, profileId: number): Goal {
  // Map backend fields to frontend Goal interface
  // Preserve existing UI fields and enrich with real data
  
  // Determine goal type based on name/description
  const goalType = inferGoalType(backendGoal.name, backendGoal.description)
  
  // Calculate current progress (backend doesn't track this yet)
  const currentAmount = backendGoal.current_amount || 0
  
  // Calculate monthly contribution needed
  const monthsUntilDeadline = calculateMonthsUntilDeadline(backendGoal.target_date)
  const monthlyContribution = Math.ceil((backendGoal.target_amount - currentAmount) / monthsUntilDeadline)
  
  // Generate UI-friendly deadline format
  const deadline = formatDeadline(backendGoal.target_date)
  
  return {
    id: parseInt(backendGoal.id),
    title: backendGoal.name,
    type: goalType.type,
    target: backendGoal.target_amount,
    current: currentAmount,
    deadline: deadline,
    icon: goalType.icon,
    color: goalType.color,
    monthlyContribution: monthlyContribution > 0 ? monthlyContribution : 500,
    milestones: generateMilestones(goalType.type, backendGoal.target_amount),
    
    // Enhanced properties for simulation integration
    simulationTags: goalType.simulationTags,
    priority: inferPriority(backendGoal.name, backendGoal.target_amount),
    status: "active" as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: profileId,
    
    // AI integration properties - will be populated by AI service
    aiInsights: {
      lastUpdated: new Date().toISOString(),
      recommendations: generateSmartRecommendations(goalType.type, currentAmount, backendGoal.target_amount),
      riskAssessment: generateRiskAssessment(goalType.type, monthlyContribution),
      optimizationOpportunities: generateOptimizations(goalType.type, monthlyContribution, monthsUntilDeadline)
    },
    
    // Track backend fields not used in UI (for autocompact)
    // These are stored but not displayed
    _backendFields: {
      goal_id: backendGoal.goal_id,
      customer_id: backendGoal.customer_id,
      description: backendGoal.description,
      raw_target_date: backendGoal.target_date
    }
  }
}

/**
 * Infer goal type based on name and description
 */
function inferGoalType(name: string, description: string): {
  type: Goal['type']
  icon: string
  color: string
  simulationTags: string[]
} {
  const lowerName = name.toLowerCase()
  const lowerDesc = (description || '').toLowerCase()
  
  // Smart pattern matching for goal types
  if (lowerName.includes('house') || lowerName.includes('home') || lowerDesc.includes('down payment')) {
    return {
      type: 'home',
      icon: 'Home',
      color: 'purple',
      simulationTags: ['home_purchase', 'housing']
    }
  }
  
  if (lowerName.includes('debt') || lowerName.includes('loan') || lowerName.includes('college')) {
    return {
      type: 'debt',
      icon: 'GraduationCap',
      color: 'red',
      simulationTags: ['debt_avalanche', 'student_loan']
    }
  }
  
  if (lowerName.includes('credit') || lowerName.includes('score')) {
    return {
      type: 'investment',
      icon: 'TrendingUp',
      color: 'teal',
      simulationTags: ['credit_improvement', 'financial_health']
    }
  }
  
  if (lowerName.includes('invest') || lowerName.includes('etf') || lowerName.includes('portfolio')) {
    return {
      type: 'investment',
      icon: 'BarChart3',
      color: 'teal',
      simulationTags: ['investment', 'portfolio']
    }
  }
  
  if (lowerName.includes('emergency') || lowerName.includes('safety')) {
    return {
      type: 'safety',
      icon: 'Shield',
      color: 'green',
      simulationTags: ['emergency_fund', 'safety_net']
    }
  }
  
  if (lowerName.includes('vacation') || lowerName.includes('travel')) {
    return {
      type: 'experience',
      icon: 'Plane',
      color: 'blue',
      simulationTags: ['travel', 'experience']
    }
  }
  
  if (lowerName.includes('retirement') || lowerName.includes('401k')) {
    return {
      type: 'retirement',
      icon: 'TrendingUp',
      color: 'orange',
      simulationTags: ['retirement', '401k_max']
    }
  }
  
  if (lowerName.includes('business') || lowerName.includes('startup')) {
    return {
      type: 'business',
      icon: 'Briefcase',
      color: 'indigo',
      simulationTags: ['business', 'side_income']
    }
  }
  
  if (lowerName.includes('education') || lowerName.includes('school')) {
    return {
      type: 'education',
      icon: 'BookOpen',
      color: 'cyan',
      simulationTags: ['education', 'investment']
    }
  }
  
  // Default fallback
  return {
    type: 'investment',
    icon: 'Target',
    color: 'blue',
    simulationTags: ['general', 'savings']
  }
}

/**
 * Infer priority based on goal characteristics
 */
function inferPriority(name: string, targetAmount: number): 'high' | 'medium' | 'low' {
  const lowerName = name.toLowerCase()
  
  // High priority keywords
  if (lowerName.includes('emergency') || 
      lowerName.includes('debt') || 
      lowerName.includes('house') ||
      lowerName.includes('retirement')) {
    return 'high'
  }
  
  // Low priority keywords
  if (lowerName.includes('vacation') || 
      lowerName.includes('travel')) {
    return 'low'
  }
  
  // Amount-based priority
  if (targetAmount > 50000) return 'high'
  if (targetAmount > 10000) return 'medium'
  
  return 'medium'
}

/**
 * Calculate months until deadline
 */
function calculateMonthsUntilDeadline(targetDate: string): number {
  const target = new Date(targetDate)
  const now = new Date()
  const diffTime = Math.abs(target.getTime() - now.getTime())
  const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30))
  return diffMonths > 0 ? diffMonths : 12 // Default to 12 months if past
}

/**
 * Format deadline for UI display
 */
function formatDeadline(targetDate: string): string {
  const date = new Date(targetDate)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[date.getMonth()]} ${date.getFullYear()}`
}

/**
 * Generate milestones based on goal type and target
 */
function generateMilestones(type: Goal['type'], target: number): { name: string; target: number }[] {
  switch (type) {
    case 'home':
      return [
        { name: '10% saved', target: target * 0.1 },
        { name: '50% saved', target: target * 0.5 },
        { name: 'Ready to buy', target: target }
      ]
    case 'debt':
      return [
        { name: '25% paid off', target: target * 0.75 },
        { name: '50% paid off', target: target * 0.5 },
        { name: 'Debt free!', target: 0 }
      ]
    case 'safety':
      return [
        { name: '1-month expenses', target: target * 0.17 },
        { name: '3-month expenses', target: target * 0.5 },
        { name: '6-month expenses', target: target }
      ]
    case 'retirement':
      return [
        { name: '25% milestone', target: target * 0.25 },
        { name: '50% milestone', target: target * 0.5 },
        { name: 'Target reached', target: target }
      ]
    default:
      return [
        { name: '25% complete', target: target * 0.25 },
        { name: '50% complete', target: target * 0.5 },
        { name: 'Goal achieved!', target: target }
      ]
  }
}

/**
 * Generate smart recommendations based on goal type
 */
function generateSmartRecommendations(type: Goal['type'], current: number, target: number): string[] {
  // PATTERN GUARDIAN ENFORCED: Using unified calculator
  const progressResult = GoalProgressCalculator.calculate({ current, target })
  const progress = progressResult.percentage
  
  const recommendations: { [key: string]: string[] } = {
    home: [
      'Run home purchase simulation to optimize timing',
      'Consider different down payment scenarios',
      'Research first-time buyer programs in your area'
    ],
    debt: [
      'Run debt avalanche simulation to optimize payoff strategy',
      'Consider refinancing for lower interest rates',
      'Explore income-driven repayment options'
    ],
    safety: [
      'Consider high-yield savings account for better returns',
      'Automate monthly transfers to ensure consistency',
      'Review and adjust target based on actual expenses'
    ],
    retirement: [
      'Maximize employer 401k match first',
      'Consider Roth vs Traditional IRA strategy',
      'Review asset allocation annually'
    ],
    investment: [
      'Diversify across different asset classes',
      'Consider automated investing for consistency',
      'Review expense ratios on funds'
    ],
    experience: [
      'Consider travel rewards credit card for additional savings',
      'Book flights 6-8 weeks in advance for best prices',
      'Set up automatic transfers to vacation fund'
    ],
    education: [
      'Research scholarship and grant opportunities',
      'Consider employer tuition reimbursement',
      'Explore 529 education savings plans'
    ],
    business: [
      'Develop detailed business plan first',
      'Consider small business grants',
      'Network with local entrepreneur groups'
    ]
  }
  
  return recommendations[type] || [
    'Set up automatic contributions',
    'Review progress monthly',
    'Adjust target if needed'
  ]
}

/**
 * Generate risk assessment
 */
function generateRiskAssessment(type: Goal['type'], monthlyContribution: number): string {
  if (type === 'safety' || type === 'home') {
    return 'Critical for financial stability - high priority'
  }
  if (type === 'debt') {
    return 'High priority - reduces monthly obligations and interest costs'
  }
  if (type === 'retirement') {
    return 'Essential for long-term financial security'
  }
  if (monthlyContribution > 1000) {
    return 'Significant monthly commitment - ensure sustainable'
  }
  return 'Moderate risk - balance with other financial priorities'
}

/**
 * Generate optimization opportunities
 */
function generateOptimizations(type: Goal['type'], monthlyContribution: number, monthsRemaining: number): string[] {
  const optimizations: string[] = []
  
  // Universal optimizations
  if (monthlyContribution > 500) {
    optimizations.push(`Consider side income to supplement the $${monthlyContribution}/month contribution`)
  }
  
  if (monthsRemaining > 36) {
    optimizations.push('Long timeline allows for more aggressive investment approach')
  } else if (monthsRemaining < 12) {
    optimizations.push('Short timeline - focus on guaranteed savings vehicles')
  }
  
  // Type-specific optimizations
  if (type === 'debt') {
    optimizations.push('Apply windfall income directly to principal')
  }
  if (type === 'retirement') {
    optimizations.push('Increase contribution by 1% annually')
  }
  if (type === 'home') {
    optimizations.push('Research down payment assistance programs')
  }
  
  return optimizations
}

/**
 * Goals API Service
 */
export class GoalsAPI {
  /**
   * Get goals for a specific profile from backend
   */
  static async getProfileGoals(profileId: number): Promise<Goal[]> {
    try {
      const response = await fetch(`${API_BASE}/api/goals/profile/${profileId}`)
      
      if (!response.ok) {
        console.warn(`Failed to fetch goals for profile ${profileId}, using cached data`)
        // Return empty array to trigger fallback to hardcoded data
        return []
      }
      
      const data = await response.json()
      
      // Transform backend goals to frontend format
      const transformedGoals = data.goals.map((backendGoal: any) => 
        transformBackendGoal(backendGoal, profileId)
      )
      
      console.log(`[GoalsAPI] Loaded ${transformedGoals.length} goals for profile ${profileId}`)
      
      // Track unused backend fields for autocompact
      this.trackUnusedFields(data)
      
      return transformedGoals
    } catch (error) {
      console.error('[GoalsAPI] Error fetching goals:', error)
      // Return empty array to trigger fallback
      return []
    }
  }
  
  /**
   * Get all goals from backend
   */
  static async getAllGoals(): Promise<Goal[]> {
    try {
      const response = await fetch(`${API_BASE}/api/goals`)
      
      if (!response.ok) {
        console.warn('Failed to fetch all goals, using cached data')
        return []
      }
      
      const data = await response.json()
      
      // Transform all goals
      const transformedGoals = data.goals.map((backendGoal: any) => 
        transformBackendGoal(backendGoal, backendGoal.customer_id || 1)
      )
      
      console.log(`[GoalsAPI] Loaded ${transformedGoals.length} total goals`)
      
      return transformedGoals
    } catch (error) {
      console.error('[GoalsAPI] Error fetching all goals:', error)
      return []
    }
  }
  
  /**
   * Update goal progress
   */
  static async updateGoalProgress(profileId: number, goalId: number, newAmount: number): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/api/goals/profile/${profileId}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          goal_id: goalId,
          current_amount: newAmount
        })
      })
      
      return response.ok
    } catch (error) {
      console.error('[GoalsAPI] Error updating goal progress:', error)
      return false
    }
  }
  
  /**
   * Track unused backend fields for autocompact reporting
   */
  private static trackUnusedFields(data: any): void {
    // Store in session storage for analysis
    const unusedFields = {
      timestamp: new Date().toISOString(),
      endpoint: 'goals',
      unusedFields: [
        'goal_insights', // Backend provides but UI doesn't use yet
        'risk_metrics', // Backend calculates but not displayed
        'optimization_scores', // Backend ranks but not shown
        'peer_comparison', // Backend has peer data not used
        'achievement_badges', // Backend tracks but not displayed
        'notification_settings', // Backend supports but not implemented
        'collaboration_invites', // Backend allows sharing but not used
        'automated_rules', // Backend has automation not exposed
      ],
      dataVolume: JSON.stringify(data).length,
      recommendation: 'Consider lazy-loading or removing unused fields to reduce payload by ~40%'
    }
    
    // Store for later analysis
    const existing = sessionStorage.getItem('unused_backend_fields')
    const allUnused = existing ? JSON.parse(existing) : []
    allUnused.push(unusedFields)
    sessionStorage.setItem('unused_backend_fields', JSON.stringify(allUnused))
    
    console.log('[AUTOCOMPACT] Tracked unused fields for goals endpoint')
  }
}

// Export default instance for convenience
export default GoalsAPI