/**
 * PATTERN GUARDIAN ENFORCED: Single Source of Truth for Goal Progress Calculations
 * 
 * This module eliminates the copy-paste disaster of goal progress calculations
 * scattered across 9+ files. All goal progress logic MUST use this module.
 * 
 * VIOLATIONS ELIMINATED:
 * - Division by zero causing NaN
 * - Duplicate progress calculation logic
 * - Inconsistent percentage formatting
 * - Missing edge case handling
 * - Scattered validation logic
 */

export interface GoalProgressInput {
  current: number
  target: number
}

export interface GoalProgressResult {
  percentage: number
  isComplete: boolean
  isValid: boolean
  displayPercentage: string
  status: 'not-started' | 'in-progress' | 'complete' | 'invalid'
  recommendation?: string
}

/**
 * SINGLE SOURCE OF TRUTH for goal progress calculation
 * Handles ALL edge cases including:
 * - Zero targets (division by zero)
 * - Negative values
 * - Overfunding (>100%)
 * - Invalid inputs (null/undefined/NaN)
 */
export class GoalProgressCalculator {
  private static readonly MIN_VALID_TARGET = 0.01
  private static readonly MAX_PERCENTAGE = 999
  
  /**
   * Calculate goal progress with complete edge case handling
   * ENFORCED: This is the ONLY method that should calculate goal progress
   */
  static calculate(input: GoalProgressInput): GoalProgressResult {
    // Validate inputs
    const validation = this.validateInputs(input)
    if (!validation.isValid) {
      return validation.result
    }
    
    const { current, target } = input
    
    // Handle zero or near-zero target
    if (target < this.MIN_VALID_TARGET) {
      return {
        percentage: current > 0 ? 100 : 0,
        isComplete: current > 0,
        isValid: true,
        displayPercentage: current > 0 ? '100%' : '0%',
        status: current > 0 ? 'complete' : 'not-started',
        recommendation: 'Set a valid target amount to track progress'
      }
    }
    
    // Calculate percentage with bounds checking and precision fix
    let percentage = Math.round((current / target) * 1000) / 10 // Round to 1 decimal
    
    // Cap percentage at reasonable maximum
    if (percentage > this.MAX_PERCENTAGE) {
      percentage = this.MAX_PERCENTAGE
    }
    
    // Determine status
    const status = this.determineStatus(percentage)
    
    return {
      percentage,
      isComplete: percentage >= 100,
      isValid: true,
      displayPercentage: this.formatPercentage(percentage),
      status,
      recommendation: this.getRecommendation(percentage, current, target)
    }
  }
  
  /**
   * Validate inputs and handle edge cases
   */
  private static validateInputs(input: GoalProgressInput): {
    isValid: boolean
    result: GoalProgressResult
  } {
    // Check for null/undefined
    if (!input || input.current == null || input.target == null) {
      return {
        isValid: false,
        result: {
          percentage: 0,
          isComplete: false,
          isValid: false,
          displayPercentage: '—',
          status: 'invalid',
          recommendation: 'Invalid goal data'
        }
      }
    }
    
    // Check for NaN or Infinity
    if (isNaN(input.current) || isNaN(input.target) || 
        !isFinite(input.current) || !isFinite(input.target)) {
      return {
        isValid: false,
        result: {
          percentage: 0,
          isComplete: false,
          isValid: false,
          displayPercentage: '—',
          status: 'invalid',
          recommendation: 'Invalid numeric values'
        }
      }
    }
    
    // Check for negative current (debt goals might have negative targets)
    if (input.current < 0) {
      return {
        isValid: false,
        result: {
          percentage: 0,
          isComplete: false,
          isValid: false,
          displayPercentage: '—',
          status: 'invalid',
          recommendation: 'Current amount cannot be negative'
        }
      }
    }
    
    return { isValid: true, result: {} as GoalProgressResult }
  }
  
  /**
   * Determine goal status based on percentage
   */
  private static determineStatus(percentage: number): GoalProgressResult['status'] {
    if (percentage === 0) return 'not-started'
    if (percentage >= 100) return 'complete'
    return 'in-progress'
  }
  
  /**
   * Format percentage for display with consistent formatting
   */
  static formatPercentage(percentage: number): string {
    if (!isFinite(percentage)) return '—'
    
    if (percentage === 0) return '0%'
    if (percentage >= 100 && percentage <= 999) {
      return `${Math.round(percentage)}%`
    }
    if (percentage > 999) {
      return '999+%'
    }
    
    // For progress < 100%, show one decimal if needed
    const rounded = Math.round(percentage * 10) / 10
    return rounded % 1 === 0 ? `${rounded}%` : `${rounded.toFixed(1)}%`
  }
  
  /**
   * Get contextual recommendation based on progress
   */
  private static getRecommendation(
    percentage: number, 
    current: number, 
    target: number
  ): string {
    if (percentage === 0) {
      return 'Start contributing to begin progress'
    }
    if (percentage < 25) {
      return `Contribute $${Math.round((target - current) / 12)}/month to reach goal in a year`
    }
    if (percentage < 50) {
      return 'Good start! Keep up the momentum'
    }
    if (percentage < 75) {
      return 'Over halfway there! Stay consistent'
    }
    if (percentage < 100) {
      return 'Almost there! Final push to reach your goal'
    }
    if (percentage === 100) {
      return 'Goal achieved! Consider setting a new target'
    }
    return 'Goal exceeded! Great job going above and beyond'
  }
  
  /**
   * Calculate time to goal completion
   */
  static calculateTimeToGoal(
    current: number,
    target: number,
    monthlyContribution: number
  ): {
    months: number
    displayTime: string
    isAchievable: boolean
  } {
    if (monthlyContribution <= 0 || current >= target) {
      return {
        months: 0,
        displayTime: current >= target ? 'Complete' : 'Not achievable',
        isAchievable: current >= target
      }
    }
    
    const remaining = target - current
    const months = Math.ceil(remaining / monthlyContribution)
    
    if (months === 1) {
      return { months: 1, displayTime: '1 month', isAchievable: true }
    }
    if (months < 1) {
      return { months: 1, displayTime: 'Less than 1 month', isAchievable: true }
    }
    if (months < 12) {
      return { months, displayTime: `${months} months`, isAchievable: true }
    }
    
    const years = Math.floor(months / 12)
    const remainingMonths = months % 12
    
    if (remainingMonths === 0) {
      return { 
        months, 
        displayTime: years === 1 ? '1 year' : `${years} years`,
        isAchievable: true 
      }
    }
    
    return {
      months,
      displayTime: `${years} year${years > 1 ? 's' : ''}, ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`,
      isAchievable: true
    }
  }
  
  /**
   * Calculate required monthly contribution to meet deadline
   */
  static calculateRequiredMonthlyContribution(
    current: number,
    target: number,
    deadlineDate: Date | string
  ): {
    amount: number
    displayAmount: string
    isFeasible: boolean
  } {
    const deadline = typeof deadlineDate === 'string' ? new Date(deadlineDate) : deadlineDate
    const now = new Date()
    
    if (deadline <= now || current >= target) {
      return {
        amount: 0,
        displayAmount: current >= target ? '$0' : 'Past deadline',
        isFeasible: current >= target
      }
    }
    
    const monthsRemaining = Math.max(
      1,
      (deadline.getFullYear() - now.getFullYear()) * 12 + 
      (deadline.getMonth() - now.getMonth())
    )
    
    const remaining = target - current
    const required = remaining / monthsRemaining
    
    return {
      amount: required,
      displayAmount: `$${Math.ceil(required).toLocaleString()}`,
      isFeasible: required < 10000 // Arbitrary feasibility threshold
    }
  }
  
  /**
   * Batch calculate progress for multiple goals
   * Useful for dashboard summaries
   */
  static calculateBatch(goals: GoalProgressInput[]): {
    results: GoalProgressResult[]
    summary: {
      averageProgress: number
      totalGoals: number
      completedGoals: number
      activeGoals: number
      invalidGoals: number
    }
  } {
    const results = goals.map(goal => this.calculate(goal))
    
    const validResults = results.filter(r => r.isValid)
    const averageProgress = validResults.length > 0
      ? validResults.reduce((sum, r) => sum + r.percentage, 0) / validResults.length
      : 0
    
    return {
      results,
      summary: {
        averageProgress,
        totalGoals: goals.length,
        completedGoals: results.filter(r => r.isComplete).length,
        activeGoals: results.filter(r => r.status === 'in-progress').length,
        invalidGoals: results.filter(r => !r.isValid).length
      }
    }
  }
}

/**
 * ENFORCED: Convenience function for simple progress calculation
 * Use this for quick inline calculations
 */
export function calculateGoalProgress(current: number, target: number): number {
  const result = GoalProgressCalculator.calculate({ current, target })
  return result.percentage
}

/**
 * ENFORCED: Convenience function for formatted percentage display
 * Use this for UI display
 */
export function formatGoalProgress(current: number, target: number): string {
  const result = GoalProgressCalculator.calculate({ current, target })
  return result.displayPercentage
}

// Export type for use in components
export type { GoalProgressCalculator }