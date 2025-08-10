/**
 * PATTERN GUARDIAN TEST SUITE
 * Comprehensive tests for unified goal progress calculator
 * Ensures NaN issues are eliminated across all edge cases
 */

import { GoalProgressCalculator, calculateGoalProgress, formatGoalProgress } from '@/lib/utils/goal-progress-calculator'

describe('GoalProgressCalculator - NaN Prevention Tests', () => {
  describe('Division by Zero Prevention', () => {
    it('should handle zero target without NaN', () => {
      const result = GoalProgressCalculator.calculate({ current: 100, target: 0 })
      expect(result.percentage).toBe(100)
      expect(result.displayPercentage).toBe('100%')
      expect(result.isComplete).toBe(true)
      expect(result.isValid).toBe(true)
      expect(result.status).toBe('complete')
      expect(isNaN(result.percentage)).toBe(false)
    })

    it('should handle zero target with zero current', () => {
      const result = GoalProgressCalculator.calculate({ current: 0, target: 0 })
      expect(result.percentage).toBe(0)
      expect(result.displayPercentage).toBe('0%')
      expect(result.isComplete).toBe(false)
      expect(result.status).toBe('not-started')
      expect(isNaN(result.percentage)).toBe(false)
    })

    it('should handle negative zero target', () => {
      const result = GoalProgressCalculator.calculate({ current: 50, target: -0 })
      expect(result.percentage).toBe(100)
      expect(isNaN(result.percentage)).toBe(false)
    })

    it('should handle very small target values', () => {
      const result = GoalProgressCalculator.calculate({ current: 1, target: 0.001 })
      expect(result.percentage).toBeGreaterThan(0)
      expect(isNaN(result.percentage)).toBe(false)
    })
  })

  describe('Invalid Input Handling', () => {
    it('should handle null inputs', () => {
      const result = GoalProgressCalculator.calculate(null as any)
      expect(result.percentage).toBe(0)
      expect(result.displayPercentage).toBe('—')
      expect(result.isValid).toBe(false)
      expect(result.status).toBe('invalid')
    })

    it('should handle undefined values', () => {
      const result = GoalProgressCalculator.calculate({ current: undefined as any, target: undefined as any })
      expect(result.percentage).toBe(0)
      expect(result.displayPercentage).toBe('—')
      expect(result.isValid).toBe(false)
    })

    it('should handle NaN inputs', () => {
      const result = GoalProgressCalculator.calculate({ current: NaN, target: NaN })
      expect(result.percentage).toBe(0)
      expect(result.displayPercentage).toBe('—')
      expect(result.isValid).toBe(false)
      expect(isNaN(result.percentage)).toBe(false) // Result should never be NaN
    })

    it('should handle Infinity inputs', () => {
      const result = GoalProgressCalculator.calculate({ current: Infinity, target: Infinity })
      expect(result.isValid).toBe(false)
      expect(isNaN(result.percentage)).toBe(false)
    })

    it('should reject negative current amounts', () => {
      const result = GoalProgressCalculator.calculate({ current: -100, target: 1000 })
      expect(result.isValid).toBe(false)
      expect(result.displayPercentage).toBe('—')
    })
  })

  describe('Normal Progress Calculation', () => {
    it('should calculate 0% progress correctly', () => {
      const result = GoalProgressCalculator.calculate({ current: 0, target: 1000 })
      expect(result.percentage).toBe(0)
      expect(result.displayPercentage).toBe('0%')
      expect(result.status).toBe('not-started')
    })

    it('should calculate 50% progress correctly', () => {
      const result = GoalProgressCalculator.calculate({ current: 500, target: 1000 })
      expect(result.percentage).toBe(50)
      expect(result.displayPercentage).toBe('50%')
      expect(result.status).toBe('in-progress')
    })

    it('should calculate 100% progress correctly', () => {
      const result = GoalProgressCalculator.calculate({ current: 1000, target: 1000 })
      expect(result.percentage).toBe(100)
      expect(result.displayPercentage).toBe('100%')
      expect(result.isComplete).toBe(true)
      expect(result.status).toBe('complete')
    })

    it('should handle decimal percentages', () => {
      const result = GoalProgressCalculator.calculate({ current: 333, target: 1000 })
      expect(result.percentage).toBe(33.3)
      expect(result.displayPercentage).toBe('33.3%')
    })
  })

  describe('Overfunding Scenarios', () => {
    it('should handle 150% completion', () => {
      const result = GoalProgressCalculator.calculate({ current: 1500, target: 1000 })
      expect(result.percentage).toBe(150)
      expect(result.displayPercentage).toBe('150%')
      expect(result.isComplete).toBe(true)
      expect(result.status).toBe('complete')
    })

    it('should cap extreme overfunding', () => {
      const result = GoalProgressCalculator.calculate({ current: 100000, target: 1 })
      expect(result.percentage).toBe(999)
      expect(result.displayPercentage).toBe('999+%')
    })
  })

  describe('Time to Goal Calculations', () => {
    it('should calculate months to goal correctly', () => {
      const result = GoalProgressCalculator.calculateTimeToGoal(0, 12000, 1000)
      expect(result.months).toBe(12)
      expect(result.displayTime).toBe('1 year')
      expect(result.isAchievable).toBe(true)
    })

    it('should handle zero monthly contribution', () => {
      const result = GoalProgressCalculator.calculateTimeToGoal(0, 12000, 0)
      expect(result.months).toBe(0)
      expect(result.displayTime).toBe('Not achievable')
      expect(result.isAchievable).toBe(false)
    })

    it('should handle already completed goals', () => {
      const result = GoalProgressCalculator.calculateTimeToGoal(12000, 12000, 1000)
      expect(result.months).toBe(0)
      expect(result.displayTime).toBe('Complete')
      expect(result.isAchievable).toBe(true)
    })

    it('should format mixed years and months', () => {
      const result = GoalProgressCalculator.calculateTimeToGoal(0, 15000, 1000)
      expect(result.months).toBe(15)
      expect(result.displayTime).toBe('1 year, 3 months')
    })
  })

  describe('Required Monthly Contribution', () => {
    it('should calculate required contribution correctly', () => {
      const deadline = new Date()
      deadline.setMonth(deadline.getMonth() + 12)
      
      const result = GoalProgressCalculator.calculateRequiredMonthlyContribution(0, 12000, deadline)
      expect(result.amount).toBeCloseTo(1000, -2)
      expect(result.isFeasible).toBe(true)
    })

    it('should handle past deadlines', () => {
      const pastDate = new Date('2020-01-01')
      const result = GoalProgressCalculator.calculateRequiredMonthlyContribution(0, 12000, pastDate)
      expect(result.amount).toBe(0)
      expect(result.displayAmount).toBe('Past deadline')
      expect(result.isFeasible).toBe(false)
    })

    it('should handle completed goals', () => {
      const futureDate = new Date()
      futureDate.setMonth(futureDate.getMonth() + 12)
      
      const result = GoalProgressCalculator.calculateRequiredMonthlyContribution(12000, 12000, futureDate)
      expect(result.amount).toBe(0)
      expect(result.displayAmount).toBe('$0')
      expect(result.isFeasible).toBe(true)
    })
  })

  describe('Batch Processing', () => {
    it('should calculate batch progress correctly', () => {
      const goals = [
        { current: 0, target: 1000 },
        { current: 500, target: 1000 },
        { current: 1000, target: 1000 },
        { current: 100, target: 0 }, // Edge case
        { current: -100, target: 1000 } // Invalid
      ]
      
      const result = GoalProgressCalculator.calculateBatch(goals)
      
      expect(result.summary.totalGoals).toBe(5)
      expect(result.summary.completedGoals).toBe(2) // 100% and zero-target
      expect(result.summary.activeGoals).toBe(2) // 0% and 50%
      expect(result.summary.invalidGoals).toBe(1) // Negative current
      expect(result.summary.averageProgress).toBeCloseTo(50, 0) // (0 + 50 + 100 + 100) / 4
    })

    it('should handle empty batch', () => {
      const result = GoalProgressCalculator.calculateBatch([])
      expect(result.summary.totalGoals).toBe(0)
      expect(result.summary.averageProgress).toBe(0)
      expect(result.summary.completedGoals).toBe(0)
    })

    it('should handle all-invalid batch', () => {
      const goals = [
        { current: NaN, target: NaN },
        { current: -100, target: 1000 },
        { current: null as any, target: undefined as any }
      ]
      
      const result = GoalProgressCalculator.calculateBatch(goals)
      expect(result.summary.invalidGoals).toBe(3)
      expect(result.summary.averageProgress).toBe(0)
    })
  })

  describe('Convenience Functions', () => {
    it('calculateGoalProgress should return percentage', () => {
      const percentage = calculateGoalProgress(500, 1000)
      expect(percentage).toBe(50)
      expect(isNaN(percentage)).toBe(false)
    })

    it('calculateGoalProgress should handle zero target', () => {
      const percentage = calculateGoalProgress(100, 0)
      expect(percentage).toBe(100)
      expect(isNaN(percentage)).toBe(false)
    })

    it('formatGoalProgress should return formatted string', () => {
      const display = formatGoalProgress(333, 1000)
      expect(display).toBe('33.3%')
    })

    it('formatGoalProgress should handle zero target', () => {
      const display = formatGoalProgress(100, 0)
      expect(display).toBe('100%')
      expect(display).not.toBe('NaN%')
    })
  })

  describe('Percentage Formatting', () => {
    it('should format whole percentages without decimals', () => {
      expect(GoalProgressCalculator.formatPercentage(50)).toBe('50%')
      expect(GoalProgressCalculator.formatPercentage(100)).toBe('100%')
      expect(GoalProgressCalculator.formatPercentage(0)).toBe('0%')
    })

    it('should format decimal percentages with one decimal', () => {
      expect(GoalProgressCalculator.formatPercentage(33.333)).toBe('33.3%')
      expect(GoalProgressCalculator.formatPercentage(66.666)).toBe('66.7%')
      expect(GoalProgressCalculator.formatPercentage(99.9)).toBe('99.9%')
    })

    it('should handle edge formatting cases', () => {
      expect(GoalProgressCalculator.formatPercentage(999.999)).toBe('999+%')
      expect(GoalProgressCalculator.formatPercentage(1000)).toBe('999+%')
      expect(GoalProgressCalculator.formatPercentage(Infinity)).toBe('—')
      expect(GoalProgressCalculator.formatPercentage(NaN)).toBe('—')
    })
  })
})

describe('Real-world Goal Scenarios', () => {
  it('should handle emergency fund goal', () => {
    const result = GoalProgressCalculator.calculate({ current: 3000, target: 10000 })
    expect(result.percentage).toBe(30)
    expect(result.recommendation).toContain('Keep up the momentum')
  })

  it('should handle debt payoff goal (zero target)', () => {
    const result = GoalProgressCalculator.calculate({ current: 5000, target: 0 })
    expect(result.percentage).toBe(100)
    expect(result.isComplete).toBe(true)
    expect(result.recommendation).toContain('Set a valid target')
  })

  it('should handle investment portfolio goal', () => {
    const result = GoalProgressCalculator.calculate({ current: 75000, target: 100000 })
    expect(result.percentage).toBe(75)
    expect(result.status).toBe('in-progress')
    expect(result.recommendation).toContain('Almost there')
  })

  it('should handle just-started goal', () => {
    const result = GoalProgressCalculator.calculate({ current: 10, target: 50000 })
    expect(result.percentage).toBe(0.02)
    expect(result.displayPercentage).toBe('0%') // Very small percentages round to 0
    expect(result.recommendation).toContain('Start contributing')
  })
})