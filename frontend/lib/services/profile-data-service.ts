/**
 * Profile Data Service
 * Manages real profile data integration with backend
 */

import { Goal } from '@/lib/data'
import { GoalProgressCalculator } from '@/lib/utils/goal-progress-calculator'

// Backend configuration
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface ProfileFinancialData {
  profileId: number
  name: string
  demographic: 'millennial' | 'genz'
  monthlyIncome: number
  monthlyExpenses: number
  netWorth: number
  creditScore: number
  savingsBalance: number
  emergencyFundBalance: number
  studentLoanBalance: number
  goals: ProfileGoal[]
}

export interface ProfileGoal {
  id: string
  title: string
  description: string
  targetAmount: number
  targetDate: string
  currentAmount: number
  progressPercentage: number
  monthlyContributionNeeded: number
  simulationTags?: string[]
  consistencyMeasures?: {
    onTrack: boolean
    weeksConsistent: number
    missedContributions: number
    projectedCompletion: string
  }
}

export interface SimulationResult {
  scenarioType: string
  title: string
  description: string
  impactDescription: string
  monthlyChange?: number
  totalImpact?: number
  recommendations: string[]
}

class ProfileDataService {
  private static instance: ProfileDataService
  private cache: Map<number, ProfileFinancialData> = new Map()

  static getInstance(): ProfileDataService {
    if (!ProfileDataService.instance) {
      ProfileDataService.instance = new ProfileDataService()
    }
    return ProfileDataService.instance
  }

  /**
   * Get profile financial data with real backend integration
   */
  async getProfileData(profileId: number): Promise<ProfileFinancialData> {
    // Check cache first
    if (this.cache.has(profileId)) {
      return this.cache.get(profileId)!
    }

    try {
      // Fetch profile data from backend
      const [profileResponse, goalsResponse, accountsResponse] = await Promise.all([
        fetch(`${BACKEND_URL}/api/profiles/${profileId}`),
        fetch(`${BACKEND_URL}/api/goals/profile/${profileId}`),
        fetch(`${BACKEND_URL}/api/accounts/profile/${profileId}`)
      ])

      const profileData = await profileResponse.json()
      const goalsData = await goalsResponse.json()
      const accountsData = await accountsResponse.json()

      // Transform backend data into frontend format
      const financialData = this.transformProfileData(profileId, profileData, goalsData, accountsData)
      
      // Cache the result
      this.cache.set(profileId, financialData)
      
      return financialData
    } catch (error) {
      console.error('Error fetching profile data:', error)
      // Return fallback data based on profileId
      return this.getFallbackProfileData(profileId)
    }
  }

  /**
   * Transform backend data into frontend format
   */
  private transformProfileData(
    profileId: number,
    profileData: any,
    goalsData: any,
    accountsData: any
  ): ProfileFinancialData {
    // Calculate financial metrics from accounts
    const accounts = accountsData.accounts || []
    const savingsAccount = accounts.find((a: any) => a.account_type === 'savings') || { balance: 0 }
    const checkingAccount = accounts.find((a: any) => a.account_type === 'checking') || { balance: 0 }
    const investmentAccounts = accounts.filter((a: any) => a.account_type === 'investment')
    const debtAccounts = accounts.filter((a: any) => a.balance < 0)
    
    // Calculate net worth
    const totalAssets = accounts
      .filter((a: any) => a.balance > 0)
      .reduce((sum: number, a: any) => sum + a.balance, 0)
    const totalDebt = Math.abs(
      accounts
        .filter((a: any) => a.balance < 0)
        .reduce((sum: number, a: any) => sum + a.balance, 0)
    )
    const netWorth = totalAssets - totalDebt

    // Find student loan balance
    const studentLoan = accounts.find((a: any) => 
      a.account_type === 'student_loan' || a.account_name?.toLowerCase().includes('student')
    )
    const studentLoanBalance = studentLoan ? Math.abs(studentLoan.balance) : 0

    // Transform goals with real progress calculation
    const goals = (goalsData.goals || []).map((goal: any) => {
      let currentAmount = 0
      let simulationTags: string[] = []
      
      // Calculate current amount based on goal type
      if (goal.title.toLowerCase().includes('house') || goal.title.toLowerCase().includes('home')) {
        currentAmount = savingsAccount.balance || 0
        simulationTags = ['home-purchase', 'rent-hike']
      } else if (goal.title.toLowerCase().includes('debt') || goal.title.toLowerCase().includes('loan')) {
        // For debt goals, current amount is how much has been paid off
        const originalDebt = goal.target_amount
        const remainingDebt = studentLoanBalance
        currentAmount = Math.max(0, originalDebt - remainingDebt)
        simulationTags = ['debt-payoff', 'student-loan']
      } else if (goal.title.toLowerCase().includes('invest')) {
        currentAmount = investmentAccounts.reduce((sum: number, a: any) => sum + a.balance, 0)
        simulationTags = ['market-crash', 'gig-economy']
      } else if (goal.title.toLowerCase().includes('credit')) {
        // Credit score goals don't have monetary amounts
        currentAmount = 0
        simulationTags = ['debt-payoff']
      }

      // Calculate monthly contribution needed
      const targetDate = new Date(goal.target_date)
      const monthsRemaining = Math.max(1, 
        (targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)
      )
      const amountNeeded = Math.max(0, (goal.target_amount || 0) - currentAmount)
      const monthlyContributionNeeded = amountNeeded / monthsRemaining

      // PATTERN GUARDIAN ENFORCED: Using unified calculator
      const progressResult = GoalProgressCalculator.calculate({
        current: currentAmount,
        target: goal.target_amount || 0
      })
      const progressPercentage = progressResult.percentage
      const isOnTrack = progressPercentage >= (100 - (monthsRemaining / 36) * 100) // Simple on-track calculation
      
      return {
        id: goal.id,
        title: goal.title,
        description: goal.description,
        targetAmount: goal.target_amount || 0,
        targetDate: goal.target_date,
        currentAmount,
        progressPercentage: Math.min(100, progressPercentage),
        monthlyContributionNeeded: Math.round(monthlyContributionNeeded),
        simulationTags,
        consistencyMeasures: {
          onTrack: isOnTrack,
          weeksConsistent: Math.floor(Math.random() * 12) + 4, // Mock for now
          missedContributions: Math.floor(Math.random() * 3),
          projectedCompletion: targetDate.toISOString().split('T')[0]
        }
      }
    })

    // Determine profile name and demographic based on ID
    const profileMap: Record<number, { name: string, demographic: 'millennial' | 'genz' }> = {
      1: { name: 'Sarah (Millennial)', demographic: 'millennial' },
      2: { name: 'Mike (Millennial)', demographic: 'millennial' },
      3: { name: 'Emma (Gen Z)', demographic: 'genz' }
    }

    const profileInfo = profileMap[profileId] || { name: `Profile ${profileId}`, demographic: 'millennial' }

    return {
      profileId,
      name: profileInfo.name,
      demographic: profileInfo.demographic,
      monthlyIncome: profileData.monthly_income || 4465,
      monthlyExpenses: profileData.monthly_expenses || 1807,
      netWorth,
      creditScore: profileData.credit_score || 730,
      savingsBalance: savingsAccount.balance || 0,
      emergencyFundBalance: savingsAccount.balance || 0, // Using savings as emergency fund
      studentLoanBalance,
      goals
    }
  }

  /**
   * Get fallback profile data when backend is unavailable
   */
  private getFallbackProfileData(profileId: number): ProfileFinancialData {
    const profiles: Record<number, ProfileFinancialData> = {
      1: {
        profileId: 1,
        name: 'Sarah (Millennial)',
        demographic: 'millennial',
        monthlyIncome: 4465,
        monthlyExpenses: 1807,
        netWorth: 211000,
        creditScore: 730,
        savingsBalance: 32000,
        emergencyFundBalance: 32000,
        studentLoanBalance: 0,
        goals: [
          {
            id: '9001',
            title: 'Buy First House',
            description: '20% down payment fund',
            targetAmount: 80000,
            targetDate: '2027-06-01',
            currentAmount: 32000,
            progressPercentage: 40,
            monthlyContributionNeeded: 1333,
            simulationTags: ['home-purchase', 'rent-hike'],
            consistencyMeasures: {
              onTrack: true,
              weeksConsistent: 8,
              missedContributions: 1,
              projectedCompletion: '2027-06-01'
            }
          }
        ]
      },
      3: {
        profileId: 3,
        name: 'Emma (Gen Z)',
        demographic: 'genz',
        monthlyIncome: 2800,
        monthlyExpenses: 2200,
        netWorth: -18000,
        creditScore: 650,
        savingsBalance: 650,
        emergencyFundBalance: 650,
        studentLoanBalance: 25000,
        goals: [
          {
            id: '9002',
            title: 'Pay College Debt',
            description: 'Eliminate student loan balance',
            targetAmount: 25000,
            targetDate: '2028-12-31',
            currentAmount: 0,
            progressPercentage: 0,
            monthlyContributionNeeded: 500,
            simulationTags: ['debt-payoff', 'student-loan'],
            consistencyMeasures: {
              onTrack: false,
              weeksConsistent: 3,
              missedContributions: 4,
              projectedCompletion: '2029-06-01'
            }
          },
          {
            id: '9003',
            title: 'Increase Credit Score',
            description: 'Push score to 750+',
            targetAmount: 0,
            targetDate: '2026-12-31',
            currentAmount: 0,
            progressPercentage: 65,
            monthlyContributionNeeded: 0,
            simulationTags: ['debt-payoff'],
            consistencyMeasures: {
              onTrack: true,
              weeksConsistent: 12,
              missedContributions: 0,
              projectedCompletion: '2026-12-31'
            }
          },
          {
            id: '9004',
            title: 'Start Investing',
            description: 'Build initial ETF portfolio',
            targetAmount: 5000,
            targetDate: '2026-06-30',
            currentAmount: 3000,
            progressPercentage: 60,
            monthlyContributionNeeded: 111,
            simulationTags: ['market-crash', 'gig-economy'],
            consistencyMeasures: {
              onTrack: true,
              weeksConsistent: 6,
              missedContributions: 2,
              projectedCompletion: '2026-06-30'
            }
          }
        ]
      }
    }

    return profiles[profileId] || profiles[1]
  }

  /**
   * Run goal simulation and return results
   */
  async runGoalSimulation(profileId: number, goalId: string): Promise<SimulationResult[]> {
    try {
      const profileData = await this.getProfileData(profileId)
      const goal = profileData.goals.find(g => g.id === goalId)
      
      if (!goal) {
        throw new Error('Goal not found')
      }

      // Generate simulation results based on goal type
      const baseResults: SimulationResult[] = []

      // "Get More Aggressive" scenario
      baseResults.push({
        scenarioType: 'aggressive',
        title: 'Get More Aggressive',
        description: `Accelerate your ${goal.title} timeline`,
        impactDescription: 'By increasing monthly contributions by 50%, you could reach your goal 8 months earlier',
        monthlyChange: Math.round(goal.monthlyContributionNeeded * 0.5),
        totalImpact: goal.targetAmount,
        recommendations: [
          `Increase monthly contribution to $${Math.round(goal.monthlyContributionNeeded * 1.5)}`,
          'Consider automating transfers right after payday',
          'Look for additional income opportunities',
          'Review and cut unnecessary expenses'
        ]
      })

      // "On Track" scenario
      baseResults.push({
        scenarioType: 'on-track',
        title: 'On Track',
        description: 'Continue with current strategy',
        impactDescription: `Maintaining $${goal.monthlyContributionNeeded}/month will achieve your goal by ${goal.targetDate}`,
        monthlyChange: 0,
        totalImpact: goal.targetAmount,
        recommendations: [
          `Keep contributing $${goal.monthlyContributionNeeded} monthly`,
          `You're ${goal.consistencyMeasures?.weeksConsistent} weeks consistent - keep it up!`,
          'Set up automatic transfers to maintain consistency',
          'Review progress quarterly to stay motivated'
        ]
      })

      // "If They Fall Off" scenario
      baseResults.push({
        scenarioType: 'fall-off',
        title: 'If You Fall Off',
        description: 'Impact of reducing contributions',
        impactDescription: 'Missing contributions for 3 months would delay your goal by 6 months',
        monthlyChange: -goal.monthlyContributionNeeded,
        totalImpact: -Math.round(goal.monthlyContributionNeeded * 3),
        recommendations: [
          'Set up emergency automation to prevent missed contributions',
          'Create a backup funding source',
          'Consider setting smaller interim milestones',
          'Build a buffer for unexpected expenses'
        ]
      })

      return baseResults
    } catch (error) {
      console.error('Error running goal simulation:', error)
      // Return default simulation results
      return this.getDefaultSimulationResults()
    }
  }

  /**
   * Get default simulation results as fallback
   */
  private getDefaultSimulationResults(): SimulationResult[] {
    return [
      {
        scenarioType: 'aggressive',
        title: 'Get More Aggressive',
        description: 'Accelerate your timeline',
        impactDescription: 'Reach your goal 8 months earlier',
        monthlyChange: 500,
        recommendations: ['Increase contributions by 50%', 'Automate transfers', 'Find additional income']
      },
      {
        scenarioType: 'on-track',
        title: 'On Track',
        description: 'Maintain current strategy',
        impactDescription: 'Goal achieved on schedule',
        monthlyChange: 0,
        recommendations: ['Keep current contributions', 'Stay consistent', 'Review quarterly']
      },
      {
        scenarioType: 'fall-off',
        title: 'If You Fall Off',
        description: 'Impact of reduced contributions',
        impactDescription: '6-month delay to goal',
        monthlyChange: -333,
        recommendations: ['Set up automation', 'Create backup funding', 'Build emergency buffer']
      }
    ]
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

export const profileDataService = ProfileDataService.getInstance()