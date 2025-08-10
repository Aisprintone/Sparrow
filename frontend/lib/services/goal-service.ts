import { Goal } from '@/lib/data'
import { GoalProgressCalculator } from '@/lib/utils/goal-progress-calculator'

// SOLID: Single Responsibility - Goal management operations
export class GoalService {
  private static instance: GoalService
  private goals: Goal[] = []

  private constructor() {}

  // Singleton pattern for DRY principle
  public static getInstance(): GoalService {
    if (!GoalService.instance) {
      GoalService.instance = new GoalService()
    }
    return GoalService.instance
  }

  // CRUD Operations
  async getGoals(filters?: {
    userId?: number
    status?: string
    type?: string
  }): Promise<Goal[]> {
    try {
      const response = await fetch('/api/goals?' + new URLSearchParams(filters as any))
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error)
      }
      
      this.goals = data.data
      return this.goals
    } catch (error) {
      console.error('Failed to fetch goals:', error)
      throw error
    }
  }

  async getGoal(id: number): Promise<Goal> {
    try {
      const response = await fetch(`/api/goals/${id}`)
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error)
      }
      
      return data.data
    } catch (error) {
      console.error('Failed to fetch goal:', error)
      throw error
    }
  }

  async createGoal(goalData: Omit<Goal, 'id'>): Promise<Goal> {
    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(goalData),
      })
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error)
      }
      
      return data.data
    } catch (error) {
      console.error('Failed to create goal:', error)
      throw error
    }
  }

  async updateGoal(id: number, updates: Partial<Goal>): Promise<Goal> {
    try {
      const response = await fetch(`/api/goals/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error)
      }
      
      return data.data
    } catch (error) {
      console.error('Failed to update goal:', error)
      throw error
    }
  }

  async deleteGoal(id: number): Promise<void> {
    try {
      const response = await fetch(`/api/goals/${id}`, {
        method: 'DELETE',
      })
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Failed to delete goal:', error)
      throw error
    }
  }

  // Goal-Simulation Integration
  async getGoalSimulations(goalId: number): Promise<{
    goal: Goal
    relevantSimulations: any[]
    totalSimulations: number
  }> {
    try {
      const response = await fetch(`/api/goals/${goalId}/simulations`)
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error)
      }
      
      return data.data
    } catch (error) {
      console.error('Failed to fetch goal simulations:', error)
      throw error
    }
  }

  async recordSimulationImpact(
    goalId: number, 
    simulationData: {
      scenarioName: string
      impactOnGoal: number
      newTargetDate?: string
      adjustedMonthlyContribution?: number
    }
  ): Promise<Goal> {
    try {
      const response = await fetch(`/api/goals/${goalId}/simulations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(simulationData),
      })
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error)
      }
      
      return data.data
    } catch (error) {
      console.error('Failed to record simulation impact:', error)
      throw error
    }
  }

  // Goal Analytics
  getGoalProgress(goal: Goal): number {
    // PATTERN GUARDIAN ENFORCED: Using unified calculator
    const result = GoalProgressCalculator.calculate({
      current: goal.current,
      target: goal.target
    })
    return result.percentage
  }

  getGoalStatus(goal: Goal): 'on-track' | 'behind' | 'ahead' {
    const progress = this.getGoalProgress(goal)
    const deadline = new Date(goal.deadline)
    const now = new Date()
    const timeRemaining = deadline.getTime() - now.getTime()
    const monthsRemaining = timeRemaining / (1000 * 60 * 60 * 24 * 30)
    
    const requiredMonthlyContribution = (goal.target - goal.current) / monthsRemaining
    
    if (requiredMonthlyContribution <= goal.monthlyContribution) {
      return 'on-track'
    } else if (progress > 50) {
      return 'ahead'
    } else {
      return 'behind'
    }
  }

  getGoalRecommendations(goal: Goal): string[] {
    const status = this.getGoalStatus(goal)
    const recommendations: string[] = []

    switch (status) {
      case 'behind':
        recommendations.push('Consider increasing your monthly contribution')
        recommendations.push('Look for ways to reduce expenses')
        recommendations.push('Explore side income opportunities')
        break
      case 'on-track':
        recommendations.push('Great progress! Keep up the momentum')
        recommendations.push('Consider automating your contributions')
        break
      case 'ahead':
        recommendations.push('Excellent progress! You might reach your goal early')
        recommendations.push('Consider setting a stretch goal')
        break
    }

    return recommendations
  }

  // Goal Templates
  getGoalTemplates(): Partial<Goal>[] {
    return [
      {
        title: 'Emergency Fund',
        type: 'safety',
        icon: 'Shield',
        color: 'green',
        priority: 'high',
        simulationTags: ['emergency_fund', 'safety_net'],
        milestones: [
          { name: '3-month expenses', target: 7500 },
          { name: '6-month expenses', target: 15000 },
          { name: 'Fully funded', target: 15000 },
        ]
      },
      {
        title: 'Home Down Payment',
        type: 'home',
        icon: 'Home',
        color: 'purple',
        priority: 'high',
        simulationTags: ['home_purchase', 'housing'],
        milestones: [
          { name: '10% saved', target: 5000 },
          { name: '20% saved', target: 10000 },
          { name: 'Ready to buy', target: 50000 },
        ]
      },
      {
        title: 'Retirement Fund',
        type: 'retirement',
        icon: 'TrendingUp',
        color: 'orange',
        priority: 'high',
        simulationTags: ['retirement', '401k_max'],
        milestones: [
          { name: '100k milestone', target: 100000 },
          { name: '500k milestone', target: 500000 },
          { name: 'Millionaire!', target: 1000000 },
        ]
      },
      {
        title: 'Vacation Fund',
        type: 'experience',
        icon: 'Plane',
        color: 'blue',
        priority: 'medium',
        simulationTags: ['travel', 'experience'],
        milestones: [
          { name: 'Flights booked', target: 1500 },
          { name: 'Accommodation paid', target: 2500 },
          { name: 'Ready to go!', target: 3000 },
        ]
      },
      {
        title: 'Student Loan Payoff',
        type: 'debt',
        icon: 'GraduationCap',
        color: 'red',
        priority: 'high',
        simulationTags: ['debt_avalanche', 'student_loan'],
        milestones: [
          { name: '25% paid off', target: 18750 },
          { name: '50% paid off', target: 12500 },
          { name: 'Debt free!', target: 0 },
        ]
      },
      {
        title: 'Investment Portfolio',
        type: 'investment',
        icon: 'BarChart3',
        color: 'teal',
        priority: 'medium',
        simulationTags: ['investment', 'portfolio'],
        milestones: [
          { name: '25k milestone', target: 25000 },
          { name: '40k milestone', target: 40000 },
          { name: 'Target reached', target: 50000 },
        ]
      },
      {
        title: 'Business Fund',
        type: 'business',
        icon: 'Briefcase',
        color: 'indigo',
        priority: 'medium',
        simulationTags: ['business', 'side_income'],
        milestones: [
          { name: 'Business plan', target: 5000 },
          { name: 'Legal setup', target: 10000 },
          { name: 'Launch ready', target: 15000 },
        ]
      },
      {
        title: 'Education Fund',
        type: 'education',
        icon: 'BookOpen',
        color: 'cyan',
        priority: 'medium',
        simulationTags: ['education', 'investment'],
        milestones: [
          { name: 'Application fees', target: 15000 },
          { name: 'First semester', target: 25000 },
          { name: 'Fully funded', target: 30000 },
        ]
      }
    ]
  }
}
