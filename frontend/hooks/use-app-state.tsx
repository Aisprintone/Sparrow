"use client"

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react"
import {
  goals as initialGoals,
  type Goal,
  type Simulation,
  type AutomationAction,
  type ResultCard,
  bills as initialBills,
  type Bill,
} from "@/lib/data"
import { useToast } from "@/hooks/use-toast"
import { performanceMonitor } from "@/lib/utils/performance-monitor"
import { aiActionsService } from '@/lib/api/ai-actions-service'

export type Screen =
  | "login"
  | "profile-selection"
  | "dashboard"
  | "spend-tracking"
  | "simulations"
  | "simulation-setup"
  | "simulating"
  | "simulation-results"
  | "ai-actions"
  | "action-detail"
  | "profile"
  | "connect-account"
  | "credit-score"
  | "net-worth-detail"
  | "goals"
  | "create-goal"
  | "goal-detail"
  | "bills"

export type Demographic = "genz" | "millennial" | "midcareer"

// ============================================================================
// PERFORMANCE CACHE LAYER - SURGICAL PRECISION DATA MANAGEMENT
// ============================================================================
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class DataCache {
  private cache = new Map<string, CacheEntry<any>>()
  private readonly DEFAULT_TTL = 60000 // 1 minute cache for profile data
  
  set<T>(key: string, data: T, ttl = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }
  
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data
  }
  
  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear()
      console.log('[CACHE] Cleared all memory cache entries')
      return
    }
    
    let clearedCount = 0
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
        clearedCount++
      }
    }
    console.log(`[CACHE] Cleared ${clearedCount} memory cache entries for pattern: ${pattern}`)
  }
  
  getMetrics(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0 // Will be calculated based on actual hits/misses
    }
  }
}

const dataCache = new DataCache()

export interface SpendingCategory {
  id: string
  name: string
  icon: string
  spent: number
  budget: number
  color: string
}

export interface AIAction {
  id: string
  title: string
  description: string
  rationale: string
  type: "optimization" | "simulation"
  simulationTag?: string
  potentialSaving: number
  steps: string[]
  status?: "suggested" | "completed" | "in-process"
  // Workflow tracking properties
  progress?: number
  workflowStatus?: "running" | "paused" | "error" | "completed"
  currentStep?: string
  estimatedCompletion?: string
  userAction?: string
  executionId?: string // Add execution ID for workflow tracking
  detailed_insights?: {
    mechanics_explanation: string
    key_insights: string[]
    scenario_nuances: string
    decision_context: string
  }
}

export interface Account {
  id: number
  name: string
  institution: string
  balance: number
  icon: string
  type: "asset" | "liability"
}

export interface SimulationParameter {
  id: string
  name: string
  value: number
  min: number
  max: number
  unit: string
  description: string
}

export interface SimulationInsight {
  id: string
  title: string
  description: string
  rationale: string
  actionRequired: string
  impact: "high" | "medium" | "low"
}

export interface SelectedSimulation {
  id: string
  title: string
  subtitle: string
  icon: React.ReactNode
  color: string
  borderColor: string
}

// AI-generated action plan interface matching backend exactly
export interface AIActionPlan {
  id: string
  title: string
  description: string
  tag: string
  tagColor: string
  potentialSaving: number | string
  rationale: string
  steps: string[]
  detailed_insights?: {
    mechanics_explanation: string
    key_insights: string[]
    scenario_nuances: string
    decision_context: string
  }
}

export interface AppState {
  currentScreen: Screen
  setCurrentScreen: (screen: Screen) => void
  selectedSimulations: Simulation[]
  toggleSimulation: (sim: Simulation) => void
  runSimulations: () => void
  isSimulating: boolean
  simulationProgress: number
  activeAutomations: AutomationAction[]
  saveAutomation: (automation: AutomationAction) => void
  removeAutomation: (automationTitle: string) => void
  setSelectedSimulations: (sims: Simulation[]) => void
  goals: Goal[]
  addGoal: (goal: Omit<Goal, "id">) => void
  updateGoal: (id: number, updates: Partial<Goal>) => void
  deleteGoal: (id: number) => void
  selectedGoal: Goal | null
  setSelectedGoal: (goal: Goal | null) => void
  isThoughtDetailOpen: boolean
  setThoughtDetailOpen: (isOpen: boolean) => void
  selectedThought: ResultCard | null
  setSelectedThought: (thought: ResultCard | null) => void
  isChatOpen: boolean
  setChatOpen: (isOpen: boolean) => void
  bills: Bill[]
  payBill: (billId: number) => void
  accounts: Account[]
  isGoalFeedbackOpen: boolean
  setGoalFeedbackOpen: (isOpen: boolean) => void
  monthlyIncome: number
  monthlySpending: { total: number; topCategory: { name: string; amount: number } }
  selectedAction: AIAction | null
  setSelectedAction: (action: AIAction | null) => void
  spendingCategories: SpendingCategory[]
  recurringExpenses: {
    total: number
    items: { name: string; amount: number; icon: string; moreCount?: number }[]
  }
  aiActions: AIAction[]
  setAiActions: (actions: AIAction[]) => void
  demographic: Demographic
  setDemographic: (demo: Demographic) => void
  // New simplified simulation state
  currentSimulation: SelectedSimulation | null
  setCurrentSimulation: (sim: SelectedSimulation | null) => void
  isAIChatOpen: boolean
  setAIChatOpen: (isOpen: boolean) => void
  selectedActionForChat: AIAction | null
  setSelectedActionForChat: (action: AIAction | null) => void
  // AI-generated plans state
  aiGeneratedPlans: AIActionPlan[]
  setAIGeneratedPlans: (plans: AIActionPlan[]) => void
  isGeneratingExplanations: boolean
  setIsGeneratingExplanations: (generating: boolean) => void
  // Profile data state
  profileData: any
  setProfileData: (data: any) => void
  // Simulation results state
  simulationResults: any
  setSimulationResults: (results: any) => void
  // Cache management
  clearCache: (pattern?: string) => Promise<void>
}

// ============================================================================
// API INTEGRATION LAYER - REAL CSV DATA FETCHING
// ============================================================================
import { apiErrorHandler } from '@/lib/api/error-handler'

async function fetchProfileData(profileId: number) {
  const cacheKey = `profile-${profileId}`
  const cached = dataCache.get(cacheKey)
  
  if (cached) {
    console.log(`[CACHE HIT] Profile ${profileId} served from cache`)
    const cacheTime = 1 // Cache hits are near-instant
    performanceMonitor.recordApiCall(cacheTime, true)
    return cached
  }
  
  console.log(`[CACHE MISS] Fetching profile ${profileId} from API`)
  const startTime = performance.now()
  
  try {
    // First try: Direct backend API call
    const result = await apiErrorHandler.withRetry(async () => {
      // Try backend directly first
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const backendResponse = await fetch(`${backendUrl}/profiles/${profileId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (backendResponse.ok) {
        const backendData = await backendResponse.json()
        if (backendData.success) {
          console.log(`[FETCH] ✅ Profile ${profileId} fetched directly from backend`)
          return backendData.profile
        }
      }
      
      // Fallback: Use frontend API route
      const response = await fetch(`/api/profiles/${profileId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      console.log(`[FETCH] Response status: ${response.status}`)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[FETCH] Response error: ${errorText}`)
        throw new Error(`Failed to fetch profile ${profileId}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log(`[FETCH] Response data:`, data)
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch profile data')
      }
      
      return data.data
    })
    
    const fetchTime = performance.now() - startTime
    console.log(`[PERFORMANCE] Profile ${profileId} fetched in ${fetchTime.toFixed(2)}ms`)
    performanceMonitor.recordApiCall(fetchTime, false)
    
    // Log performance every 10 API calls
    if (performanceMonitor.getMetrics().apiCalls % 10 === 0) {
      performanceMonitor.logPerformance()
    }
    
    // Cache the transformed data
    dataCache.set(cacheKey, result)
    
    return result
  } catch (error) {
    console.error(`[FETCH] All attempts failed for profile ${profileId}:`, error)
    
    // Handle specific error types
    const classifiedError = apiErrorHandler.classifyError(error)
    if (classifiedError.code === 'REDIRECT_LOOP') {
      apiErrorHandler.handleRedirectLoop()
    }
    
    // Only use fallback data as last resort when backend is completely unavailable
    console.warn(`[FALLBACK] Using fallback data for profile ${profileId} - backend unavailable`)
    return getFallbackData(profileId)
  }
}

async function fetchAllProfiles() {
  const cacheKey = 'all-profiles'
  const cached = dataCache.get(cacheKey)
  
  if (cached) {
    console.log('[CACHE HIT] All profiles served from cache')
    return cached
  }
  
  console.log('[CACHE MISS] Fetching all profiles from API')
  const startTime = performance.now()
  
  try {
    // Try backend directly first
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    const backendResponse = await fetch(`${backendUrl}/profiles`)
    
    if (backendResponse.ok) {
      const backendData = await backendResponse.json()
      if (backendData.success) {
        console.log('[FETCH] ✅ All profiles fetched directly from backend')
        const fetchTime = performance.now() - startTime
        console.log(`[PERFORMANCE] All profiles fetched in ${fetchTime.toFixed(2)}ms`)
        dataCache.set(cacheKey, backendData.profiles, 300000) // Cache for 5 minutes
        return backendData.profiles
      }
    }
    
    // Fallback: Use frontend API route
    const response = await fetch('/api/profiles')
    if (!response.ok) {
      throw new Error(`Failed to fetch profiles: ${response.statusText}`)
    }
    
    const result = await response.json()
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch profiles')
    }
    
    const fetchTime = performance.now() - startTime
    console.log(`[PERFORMANCE] All profiles fetched in ${fetchTime.toFixed(2)}ms`)
    console.log(`[FETCH] Source: ${result.source || 'unknown'}`)
    
    dataCache.set(cacheKey, result.data, 300000) // Cache for 5 minutes
    
    return result.data
  } catch (error) {
    console.error('Error fetching profiles:', error)
    // Return empty array instead of hardcoded fallback - let UI handle empty state
    return []
  }
}

// Map demographic to profile ID
function demographicToProfileId(demographic: Demographic): number {
  const mapping: Record<Demographic, number> = {
    millennial: 1,
    midcareer: 2,
    genz: 3 // Profile 3 exists and has genz demographic
  }
  return mapping[demographic]
}

function profileIdToDemographic(profileId: number): Demographic {
  const mapping: Record<number, Demographic> = {
    1: 'millennial',
    2: 'midcareer',
    3: 'genz'
  }
  return mapping[profileId] || 'millennial'
}

// Fallback data for when API is unavailable
function getFallbackData(profileId: number) {
  const demographic = profileIdToDemographic(profileId)
  const demographicData = {
  genz: {
    accounts: [
      {
        id: 1,
        name: "Chase College Checking",
        institution: "Chase",
        balance: 2847,
        icon: "/logos/chase.png",
        type: "asset",
      },
      { id: 2, name: "Savings Account", institution: "Chase", balance: 5200, icon: "/logos/chase.png", type: "asset" },
      { id: 3, name: "Student Loan", institution: "Federal", balance: -28500, icon: "GraduationCap", type: "liability" },
      {
        id: 4,
        name: "Credit Card",
        institution: "Discover",
        balance: -1200,
        icon: "/logos/amex.png",
        type: "liability",
      },
    ],
    creditScore: 650,
    monthlyIncome: 3200,
    monthlySpending: { total: 2100, topCategory: { name: "Food & Dining", amount: 450 } },
    spendingCategories: [
      { id: "food", name: "Food & Dining", icon: "Utensils", spent: 450, budget: 400, color: "red" },
      { id: "transport", name: "Transportation", icon: "Car", spent: 180, budget: 200, color: "green" },
      { id: "entertainment", name: "Entertainment", icon: "Film", spent: 220, budget: 250, color: "green" },
      { id: "shopping", name: "Shopping", icon: "ShoppingCart", spent: 320, budget: 300, color: "red" },
    ],
  },
  midcareer: {
    accounts: [
      { id: 1, name: "Chase Checking", institution: "Chase", balance: 3200, icon: "/logos/chase.png", type: "asset" },
      { id: 2, name: "Emergency Fund", institution: "Ally", balance: 8500, icon: "/logos/chase.png", type: "asset" },
      {
        id: 3,
        name: "Fidelity 401k",
        institution: "Fidelity",
        balance: 12000,
        icon: "/logos/fidelity.png",
        type: "asset",
      },
      {
        id: 4,
        name: "Car Loan",
        institution: "Toyota Financial",
        balance: -8300,
        icon: "🚗",
        type: "liability",
      },
      {
        id: 5,
        name: "Credit Card",
        institution: "Capital One",
        balance: -3400,
        icon: "/logos/amex.png",
        type: "liability",
      },
    ],
    creditScore: 720,
    monthlyIncome: 5800,
    monthlySpending: { total: 3400, topCategory: { name: "Housing", amount: 1400 } },
    spendingCategories: [
      { id: "housing", name: "Housing", icon: "Home", spent: 1400, budget: 1500, color: "green" },
      { id: "food", name: "Food & Dining", icon: "Utensils", spent: 520, budget: 500, color: "red" },
      { id: "transport", name: "Transportation", icon: "Car", spent: 380, budget: 400, color: "green" },
      { id: "utilities", name: "Utilities", icon: "Zap", spent: 245, budget: 300, color: "green" },
    ],
  },
  millennial: {
    accounts: [
      { id: 1, name: "Chase Checking", institution: "Chase", balance: 8500, icon: "/logos/chase.png", type: "asset" },
      {
        id: 2,
        name: "Fidelity 401k",
        institution: "Fidelity",
        balance: 45000,
        icon: "/logos/fidelity.png",
        type: "asset",
      },
      {
        id: 3,
        name: "High-Yield Savings",
        institution: "Marcus",
        balance: 15000,
        icon: "/logos/chase.png",
        type: "asset",
      },
      {
        id: 4,
        name: "Investment Account",
        institution: "Vanguard",
        balance: 22000,
        icon: "/logos/vanguard.png",
        type: "asset",
      },
      {
        id: 6,
        name: "Apple Card",
        institution: "Goldman Sachs",
        balance: -2234,
        icon: "/logos/amex.png",
        type: "liability",
      },
      {
        id: 7,
        name: "Chase Freedom",
        institution: "Chase",
        balance: -1800,
        icon: "/logos/chase.png",
        type: "liability",
      },
      {
        id: 8,
        name: "Student Loan",
        institution: "Federal",
        balance: -12000,
        icon: "GraduationCap",
        type: "liability" as const,
      },
    ],
    creditScore: 780,
    monthlyIncome: 8500,
    monthlySpending: { total: 4200, topCategory: { name: "Housing", amount: 2200 } },
    spendingCategories: [
      { id: "housing", name: "Housing", icon: "Home", spent: 2200, budget: 2500, color: "green" },
      { id: "groceries", name: "Groceries", icon: "Utensils", spent: 650, budget: 700, color: "green" },
      { id: "transport", name: "Transportation", icon: "Car", spent: 450, budget: 500, color: "green" },
      { id: "entertainment", name: "Entertainment", icon: "Film", spent: 380, budget: 400, color: "green" },
    ],
  },
}
  
  return demographicData
}

export default function useAppState(): AppState {
  const { toast } = useToast()
  const [currentScreen, setCurrentScreen] = useState<Screen>("login")
  const [selectedSimulations, setSelectedSimulations] = useState<Simulation[]>([])
  const [isSimulating, setIsSimulating] = useState(false)
  const [simulationProgress, setSimulationProgress] = useState(0)
  const [activeAutomations, setActiveAutomations] = useState<AutomationAction[]>([])
  // Goals with localStorage persistence
  const [goals, setGoalsInternal] = useState<Goal[]>([])
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)

  // Enhanced setGoals with localStorage persistence
  const setGoals = useCallback((newGoals: Goal[]) => {
    setGoalsInternal(newGoals)
    try {
      localStorage.setItem('simulation-goals', JSON.stringify(newGoals))
      console.log(`[GOALS PERSISTENCE] Saved ${newGoals.length} goals to localStorage`)
    } catch (error) {
      console.error('[GOALS PERSISTENCE] Failed to save goals to localStorage:', error)
    }
  }, [])

  // Generate profile-specific goals based on user data
  const generateProfileSpecificGoals = useCallback((profileData: any, demographic: Demographic): Goal[] => {
    const generatedGoals: Goal[] = []
    
    if (!profileData || !profileData.accounts) {
      return []
    }

    const accounts = profileData.accounts
    const metrics = profileData.metrics || {}
    const currentDate = new Date()

    // Calculate key financial metrics
    const liquidAssets = accounts
      .filter((acc: any) => ['checking', 'savings'].includes(acc.account_type))
      .reduce((sum: number, acc: any) => sum + Math.max(0, acc.balance), 0)
    
    const totalDebt = accounts
      .filter((acc: any) => acc.balance < 0 || ['credit_card', 'student_loan', 'auto_loan', 'mortgage'].includes(acc.account_type))
      .reduce((sum: number, acc: any) => sum + Math.abs(Math.min(0, acc.balance)), 0)
    
    const monthlyIncome = metrics.monthlyIncome || 0
    const monthlySpending = metrics.monthlySpending?.total || 0
    const emergencyFundMonths = monthlySpending > 0 ? liquidAssets / monthlySpending : 0

    // Goal 1: Emergency Fund (if needed)
    if (emergencyFundMonths < 6) {
      const targetAmount = monthlySpending * 6
      const currentAmount = liquidAssets
      const monthsToTarget = 18 // 1.5 years target
      const monthlyContribution = Math.max(100, (targetAmount - currentAmount) / monthsToTarget)
      
      const deadline = new Date(currentDate)
      deadline.setMonth(deadline.getMonth() + monthsToTarget)
      
      generatedGoals.push({
        id: 1,
        title: "Emergency Fund",
        type: "safety",
        target: Math.round(targetAmount),
        current: Math.round(currentAmount),
        deadline: deadline.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        icon: "Shield",
        color: "green",
        monthlyContribution: Math.round(monthlyContribution),
        priority: "high",
        status: "active",
        simulationTags: ["emergency-fund"],
        milestones: [
          { name: "3-month expenses", target: Math.round(monthlySpending * 3) },
          { name: "6-month expenses", target: Math.round(targetAmount) },
          { name: "Fully funded", target: Math.round(targetAmount) }
        ],
        aiInsights: {
          lastUpdated: new Date().toISOString(),
          recommendations: [
            "Consider high-yield savings account for better returns",
            "Automate monthly transfers to ensure consistency"
          ],
          riskAssessment: "Critical for financial stability - highest priority",
          optimizationOpportunities: [
            `Increase contribution by $${Math.round(monthlyContribution * 0.25)}/month to reach target ${Math.round(monthsToTarget * 0.2)} months earlier`,
            "Use windfall income to accelerate progress"
          ]
        }
      })
    }

    // Goal 2: Debt Payoff (if significant debt exists)
    if (totalDebt > 1000) {
      const studentLoans = accounts.filter((acc: any) => acc.account_type === 'student_loan')
      const creditCards = accounts.filter((acc: any) => acc.account_type === 'credit_card')
      
      if (studentLoans.length > 0) {
        const studentDebt = studentLoans.reduce((sum: number, acc: any) => sum + Math.abs(acc.balance), 0)
        const monthsToPayoff = Math.min(60, Math.max(24, studentDebt / 500)) // 2-5 years
        const monthlyPayment = Math.round(studentDebt / monthsToPayoff)
        
        const deadline = new Date(currentDate)
        deadline.setMonth(deadline.getMonth() + monthsToPayoff)
        
        generatedGoals.push({
          id: 2,
          title: "Student Loan Payoff",
          type: "debt",
          target: Math.round(studentDebt),
          current: Math.round(studentDebt), // Start at full amount, work towards 0
          deadline: deadline.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          icon: "GraduationCap",
          color: "red",
          monthlyContribution: monthlyPayment,
          priority: "high",
          status: "active",
          simulationTags: ["student-loan", "debt-payoff"],
          milestones: [
            { name: "25% paid off", target: Math.round(studentDebt * 0.75) },
            { name: "50% paid off", target: Math.round(studentDebt * 0.5) },
            { name: "Debt free!", target: 0 }
          ],
          aiInsights: {
            lastUpdated: new Date().toISOString(),
            recommendations: [
              "Run debt avalanche simulation to optimize payoff strategy",
              "Consider refinancing for lower interest rates"
            ],
            riskAssessment: "High priority - reduces monthly obligations and interest costs",
            optimizationOpportunities: [
              "Use debt avalanche method to save on interest",
              "Apply windfall income to highest interest loans first"
            ]
          }
        })
      }
    }

    // Goal 3: Investment/Retirement (based on demographic and income)
    if (monthlyIncome > 0) {
      let targetAmount: number
      let timeHorizon: number
      let goalTitle: string
      let goalType: "retirement" | "investment" | "home"
      let simulationTags: string[]
      
      if (demographic === "genz") {
        targetAmount = 100000
        timeHorizon = 120 // 10 years
        goalTitle = "Investment Portfolio"
        goalType = "investment"
        simulationTags = ["market-crash"] // Gen Z focuses on market volatility awareness
      } else if (demographic === "midcareer") {
        targetAmount = 50000
        timeHorizon = 36 // 3 years
        goalTitle = "Home Down Payment"
        goalType = "home"
        simulationTags = ["home-purchase"]
      } else { // millennial
        targetAmount = 500000
        timeHorizon = 180 // 15 years
        goalTitle = "Retirement Fund"
        goalType = "retirement"
        simulationTags = ["salary-increase", "market-crash"] // Millennials focus on income optimization and portfolio protection
      }
      
      const currentInvestments = accounts
        .filter((acc: any) => ['investment', '401k', 'ira'].includes(acc.account_type))
        .reduce((sum: number, acc: any) => sum + Math.max(0, acc.balance), 0)
      
      const monthlyContribution = Math.max(200, (targetAmount - currentInvestments) / timeHorizon)
      
      const deadline = new Date(currentDate)
      deadline.setMonth(deadline.getMonth() + timeHorizon)
      
      generatedGoals.push({
        id: 3,
        title: goalTitle,
        type: goalType,
        target: Math.round(targetAmount),
        current: Math.round(currentInvestments),
        deadline: deadline.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        icon: goalType === "home" ? "Home" : goalType === "retirement" ? "TrendingUp" : "BarChart3",
        color: goalType === "home" ? "purple" : goalType === "retirement" ? "orange" : "teal",
        monthlyContribution: Math.round(monthlyContribution),
        priority: "high",
        status: "active",
        simulationTags,
        milestones: [
          { name: "25% milestone", target: Math.round(targetAmount * 0.25) },
          { name: "50% milestone", target: Math.round(targetAmount * 0.5) },
          { name: "Target reached", target: Math.round(targetAmount) }
        ],
        aiInsights: {
          lastUpdated: new Date().toISOString(),
          recommendations: goalType === "home" 
            ? ["Run home purchase simulation to optimize timing", "Consider different down payment scenarios"]
            : goalType === "retirement"
            ? ["Run 401k maximization simulation", "Consider Roth vs Traditional IRA strategy"]
            : ["Diversify across different asset classes", "Consider automated investing for consistency"],
          riskAssessment: goalType === "home" 
            ? "High impact on long-term wealth building"
            : goalType === "retirement"
            ? "Critical for long-term financial security"
            : "Medium risk with potential for high returns",
          optimizationOpportunities: [
            `Increase monthly contribution by $${Math.round(monthlyContribution * 0.3)} for faster progress`,
            goalType === "retirement" ? "Consider side hustle income for additional savings" : "Consider tax-advantaged investment strategies"
          ]
        }
      })
    }

    console.log(`[GOALS] Generated ${generatedGoals.length} profile-specific goals for ${demographic}:`, generatedGoals.map(g => g.title))
    return generatedGoals
  }, [])

  const [isThoughtDetailOpen, setThoughtDetailOpen] = useState(false)
  const [selectedThought, setSelectedThought] = useState<ResultCard | null>(null)
  const [isChatOpen, setChatOpen] = useState(false)
  const [bills, setBills] = useState<Bill[]>(initialBills)
  const [isGoalFeedbackOpen, setGoalFeedbackOpen] = useState(false)
  const [selectedAction, setSelectedAction] = useState<AIAction | null>(null)
  const [demographic, setDemographic] = useState<Demographic>("millennial")

  // New simplified simulation state
  const [currentSimulation, setCurrentSimulation] = useState<SelectedSimulation | null>(null)

  // AI Chat state
  const [isAIChatOpen, setAIChatOpen] = useState(false)
  const [selectedActionForChat, setSelectedActionForChat] = useState<AIAction | null>(null)
  
  // AI-generated plans state
  const [aiGeneratedPlans, setAIGeneratedPlans] = useState<AIActionPlan[]>([])
  const [isGeneratingExplanations, setIsGeneratingExplanations] = useState(false)

  // Simulation results state
  const [simulationResults, setSimulationResults] = useState<any>(null)

  // ============================================================================
  // REAL-TIME DATA STATE MANAGEMENT
  // ============================================================================
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [profileData, setProfileData] = useState<any>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [monthlyIncome, setMonthlyIncome] = useState(0)
  const [monthlySpending, setMonthlySpending] = useState({ total: 0, topCategory: { name: '', amount: 0 } })
  const [spendingCategories, setSpendingCategories] = useState<SpendingCategory[]>([])
  const [creditScore, setCreditScore] = useState(0)
  const [netWorth, setNetWorth] = useState(0)
  
  // Performance tracking
  const fetchMetrics = useRef({ hits: 0, misses: 0, totalTime: 0 })
  const lastFetchTime = useRef<number>(0)

  // Compute recurring expenses from profile data
  const recurringExpenses = useMemo(() => {
    if (!profileData?.transactions) {
      // Fallback data while loading
      return {
        total: demographic === "genz" ? 850 : 1352,
        items: demographic === "genz"
          ? [
              { name: "Rent", amount: 600, icon: "Home" },
              { name: "Phone", amount: 45, icon: "Phone" },
              { name: "Streaming", amount: 25, icon: "Monitor" },
              { moreCount: 3 },
            ]
          : [
              { name: "Mortgage", amount: 1200, icon: "Home" },
              { name: "Internet", amount: 79, icon: "Wifi" },
              { name: "Phone", amount: 45, icon: "Phone" },
              { moreCount: 2 },
            ],
      }
    }
    
    // Extract recurring expenses from real transaction data
    const recurring = profileData.transactions
      .filter((t: any) => t.category === 'subscription' || t.category === 'rent' || t.category === 'mortgage_payment')
      .slice(0, 3)
      .map((t: any) => ({
        name: t.description.split(' ')[0],
        amount: Math.abs(t.amount),
        icon: t.category === 'rent' || t.category === 'mortgage_payment' ? 'Home' : 'Phone'
      }))
    
    const total = recurring.reduce((sum: number, item: any) => sum + item.amount, 0)
    
    return {
      total: total || 850,
      items: recurring.length ? [...recurring, { moreCount: 2 }] : [
        { name: "Rent", amount: 600, icon: "Home" },
        { name: "Phone", amount: 45, icon: "Phone" },
        { moreCount: 3 }
      ]
    }
  }, [profileData, demographic])

  // Generate AI actions based on real profile data
  const [aiActions, setAiActions] = useState<AIAction[]>([])

  // Load AI actions when profile data changes
  useEffect(() => {
    if (!profileData) {
      // Set default actions while loading
      setAiActions([
        {
          id: "high-yield-savings",
          title: demographic === "genz" ? "Open High-Yield Savings" : "Move to High-Yield Savings",
          description:
            demographic === "genz"
              ? "Start earning 4.5% APY on your savings"
              : "Detected excess in checking, earning you +$8/month",
          rationale:
            demographic === "genz"
              ? "Analysis of your account shows $5,200 in savings earning minimal interest (likely 0.01% APY). By moving to a high-yield savings account with 4.5% APY, you'd earn an additional $234 annually. This is a risk-free way to optimize your money while maintaining liquidity for emergencies."
              : "Our analysis detected $3,200 sitting in your checking account earning 0.01% APY. This excess cash (beyond your typical monthly expenses) could be moved to a high-yield savings account earning 4.5% APY, generating an additional $144 annually with zero risk and full liquidity.",
          type: "optimization" as const,
          potentialSaving: demographic === "genz" ? 15 : 8,
          steps: [
            "Research high-yield savings accounts",
            "Open account with partner bank",
            "Set up automatic transfer",
            "Monitor and adjust monthly",
          ],
          status: "suggested" as const,
        },
        {
          id: "budget-optimization",
          title: demographic === "genz" ? "Create First Budget" : "Optimize Monthly Budget",
          description:
            demographic === "genz" ? "Track spending and save $200/month" : "Reduce unnecessary expenses by $150/month",
          rationale:
            demographic === "genz"
              ? "Transaction analysis reveals you're spending $450/month on food & dining (21% of income) and $220 on entertainment (10% of income). Compared to peers in your income bracket, this is 35% higher than average. A structured budget with meal planning and entertainment limits could reduce spending by $200/month while maintaining your lifestyle quality."
              : "Our spending analysis identified $380/month on entertainment and multiple subscription services totaling $89/month. By optimizing subscriptions (canceling unused services) and reducing dining out by 2 meals per week, you could save $150/month without significantly impacting your lifestyle. This represents a 3.6% reduction in total spending.",
          type: "optimization" as const,
          potentialSaving: demographic === "genz" ? 200 : 150,
          steps: ["Analyze spending patterns", "Set category budgets", "Set up spending alerts", "Review monthly progress"],
          status: "suggested" as const,
        },
        {
          id: "subscription-audit",
          title: "Cancel Unused Subscriptions",
          description: "Found 3 unused subscriptions costing $47/month",
          rationale:
            "Analysis of your recurring charges identified subscriptions you haven't used in the past 60 days. These include a gym membership ($29/month), streaming service ($12/month), and software subscription ($6/month) that show no recent activity.",
          type: "optimization" as const,
          potentialSaving: 47,
          steps: ["Review subscription list", "Cancel unused services", "Set up usage tracking", "Monthly review process"],
          status: "suggested" as const,
        },
        {
          id: "cashback-optimization",
          title: "Optimize Credit Card Rewards",
          description: "Switch to better cashback card for +$23/month",
          rationale:
            "Your current spending patterns show 40% on groceries and gas. A cashback card with 3% on these categories vs your current 1% would generate an additional $276 annually based on your spending history.",
          type: "optimization" as const,
          potentialSaving: 23,
          steps: ["Compare cashback cards", "Apply for optimal card", "Update payment methods", "Track rewards earned"],
          status: "suggested" as const,
        },
        {
          id: "emergency-fund-completed",
          title: "Emergency Fund Optimization",
          description: "Successfully moved $5,000 to high-yield savings",
          rationale:
            "Completed action that moved emergency fund to Marcus savings account earning 4.5% APY instead of 0.01%.",
          type: "optimization" as const,
          potentialSaving: 18,
          steps: ["Account opened", "Funds transferred", "Auto-transfer setup", "Monthly monitoring active"],
          status: "completed" as const,
        },
        {
          id: "bill-negotiation-completed",
          title: "Negotiated Internet Bill",
          description: "Reduced monthly internet cost by $15/month",
          rationale:
            "Successfully negotiated with internet provider to reduce monthly bill from $79 to $64 by switching to a promotional rate.",
          type: "optimization" as const,
          potentialSaving: 15,
          steps: ["Called provider", "Negotiated rate", "Confirmed new billing", "Set calendar reminder"],
          status: "completed" as const,
        },
        {
          id: "bill-negotiation-in-progress",
          title: "Negotiate Cable Bill",
          description: "Currently negotiating with Comcast for better rates",
          rationale:
            "Your cable bill has increased 15% this year. We're negotiating with Comcast to match competitor rates and secure a better deal.",
          type: "optimization" as const,
          potentialSaving: 35,
          steps: ["Contact Comcast retention", "Present competitor offers", "Negotiate new rate", "Confirm changes"],
          status: "in-process" as const,
        },
      ])
      return
    }

    // Use the AI actions service to get workflows-based actions
    aiActionsService.getAIActions("1", demographic)
      .then(actions => {
        setAiActions(actions)
      })
      .catch(() => {
        // Fallback to hardcoded actions if service fails
        setAiActions([
          {
            id: "high-yield-savings",
            title: demographic === "genz" ? "Open High-Yield Savings" : "Move to High-Yield Savings",
            description:
              demographic === "genz"
                ? "Start earning 4.5% APY on your savings"
                : "Detected excess in checking, earning you +$8/month",
            rationale:
              demographic === "genz"
                ? "Analysis of your account shows $5,200 in savings earning minimal interest (likely 0.01% APY). By moving to a high-yield savings account with 4.5% APY, you'd earn an additional $234 annually. This is a risk-free way to optimize your money while maintaining liquidity for emergencies."
                : "Our analysis detected $3,200 sitting in your checking account earning 0.01% APY. This excess cash (beyond your typical monthly expenses) could be moved to a high-yield savings account earning 4.5% APY, generating an additional $144 annually with zero risk and full liquidity.",
            type: "optimization" as const,
            potentialSaving: demographic === "genz" ? 15 : 8,
            steps: [
              "Research high-yield savings accounts",
              "Open account with partner bank",
              "Set up automatic transfer",
              "Monitor and adjust monthly",
            ],
            status: "suggested" as const,
          },
          {
            id: "budget-optimization",
            title: demographic === "genz" ? "Create First Budget" : "Optimize Monthly Budget",
            description:
              demographic === "genz" ? "Track spending and save $200/month" : "Reduce unnecessary expenses by $150/month",
            rationale:
              demographic === "genz"
                ? "Transaction analysis reveals you're spending $450/month on food & dining (21% of income) and $220 on entertainment (10% of income). Compared to peers in your income bracket, this is 35% higher than average. A structured budget with meal planning and entertainment limits could reduce spending by $200/month while maintaining your lifestyle quality."
                : "Our spending analysis identified $380/month on entertainment and multiple subscription services totaling $89/month. By optimizing subscriptions (canceling unused services) and reducing dining out by 2 meals per week, you could save $150/month without significantly impacting your lifestyle. This represents a 3.6% reduction in total spending.",
            type: "optimization" as const,
            potentialSaving: demographic === "genz" ? 200 : 150,
            steps: ["Analyze spending patterns", "Set category budgets", "Set up spending alerts", "Review monthly progress"],
            status: "suggested" as const,
          },
          {
            id: "subscription-audit",
            title: "Cancel Unused Subscriptions",
            description: "Found 3 unused subscriptions costing $47/month",
            rationale:
              "Analysis of your recurring charges identified subscriptions you haven't used in the past 60 days. These include a gym membership ($29/month), streaming service ($12/month), and software subscription ($6/month) that show no recent activity.",
            type: "optimization" as const,
            potentialSaving: 47,
            steps: ["Review subscription list", "Cancel unused services", "Set up usage tracking", "Monthly review process"],
            status: "suggested" as const,
          },
          {
            id: "cashback-optimization",
            title: "Optimize Credit Card Rewards",
            description: "Switch to better cashback card for +$23/month",
            rationale:
              "Your current spending patterns show 40% on groceries and gas. A cashback card with 3% on these categories vs your current 1% would generate an additional $276 annually based on your spending history.",
            type: "optimization" as const,
            potentialSaving: 23,
            steps: ["Compare cashback cards", "Apply for optimal card", "Update payment methods", "Track rewards earned"],
            status: "suggested" as const,
          },
          {
            id: "emergency-fund-completed",
            title: "Emergency Fund Optimization",
            description: "Successfully moved $5,000 to high-yield savings",
            rationale:
              "Completed action that moved emergency fund to Marcus savings account earning 4.5% APY instead of 0.01%.",
            type: "optimization" as const,
            potentialSaving: 18,
            steps: ["Account opened", "Funds transferred", "Auto-transfer setup", "Monthly monitoring active"],
            status: "completed" as const,
          },
          {
            id: "bill-negotiation-completed",
            title: "Negotiated Internet Bill",
            description: "Reduced monthly internet cost by $15/month",
            rationale:
              "Successfully negotiated with internet provider to reduce monthly bill from $79 to $64 by switching to a promotional rate.",
            type: "optimization" as const,
            potentialSaving: 15,
            steps: ["Called provider", "Negotiated rate", "Confirmed new billing", "Set calendar reminder"],
            status: "completed" as const,
          },
          {
            id: "bill-negotiation-in-progress",
            title: "Negotiate Cable Bill",
            description: "Currently negotiating with Comcast for better rates",
            rationale:
              "Your cable bill has increased 15% this year. We're negotiating with Comcast to match competitor rates and secure a better deal.",
            type: "optimization" as const,
            potentialSaving: 35,
            steps: ["Contact Comcast retention", "Present competitor offers", "Negotiate new rate", "Confirm changes"],
            status: "in-process" as const,
          },
        ])
      })
  }, [profileData, demographic])

  // Load goals from localStorage on initialization
  useEffect(() => {
    try {
      const storedGoals = localStorage.getItem('simulation-goals')
      if (storedGoals) {
        const parsedGoals = JSON.parse(storedGoals)
        console.log(`[GOALS PERSISTENCE] Loaded ${parsedGoals.length} goals from localStorage:`, parsedGoals.map((g: Goal) => g.title))
        setGoalsInternal(parsedGoals)
      }
    } catch (error) {
      console.error('[GOALS PERSISTENCE] Failed to load goals from localStorage:', error)
    }
  }, [])

  // Update goals when profile data changes (merge with stored goals)
  useEffect(() => {
    if (profileData && profileData.accounts) {
      const profileSpecificGoals = generateProfileSpecificGoals(profileData, demographic)
      
      // Load existing goals from localStorage
      let existingGoals: Goal[] = []
      try {
        const storedGoals = localStorage.getItem('simulation-goals')
        if (storedGoals) {
          existingGoals = JSON.parse(storedGoals)
        }
      } catch (error) {
        console.error('[GOALS PERSISTENCE] Failed to load existing goals:', error)
      }
      
      // Merge profile-specific goals with simulation-generated goals
      // Keep simulation goals (identify by title containing "Simulation", sourceActionId/sourceGoalId tags, or recent creation)
      const simulationGoals = existingGoals.filter(goal => {
        // Check if goal has simulation-related title
        if (goal.title.includes('Simulation')) return true
        
        // Check if goal has simulation-related tags (goal-*, action-*)
        if (goal.simulationTags && goal.simulationTags.some(tag => 
          tag.startsWith('goal-') || tag.startsWith('action-')
        )) return true
        
        // Check if goal was created very recently (within last hour) - likely from simulation
        if (goal.createdAt) {
          const goalCreated = new Date(goal.createdAt)
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
          if (goalCreated > oneHourAgo) return true
        }
        
        // Don't include if it matches profile-specific goals by title
        return !profileSpecificGoals.some(pGoal => pGoal.title === goal.title)
      })
      
      const mergedGoals = [...profileSpecificGoals, ...simulationGoals]
      setGoals(mergedGoals)
      console.log(`[GOALS] Updated goals: ${profileSpecificGoals.length} profile + ${simulationGoals.length} simulation = ${mergedGoals.length} total`)
    }
  }, [profileData, demographic, generateProfileSpecificGoals, setGoals])

  // ============================================================================
  // APP INITIALIZATION - CLEAR CACHE AND LOAD FRESH DATA
  // ============================================================================
  useEffect(() => {
    let cancelled = false
    
    async function initializeApp() {
      console.log('[INIT] Starting app initialization...')
      
      try {
        // Step 0: Wait for Next.js server to be ready
        console.log('[INIT] Waiting for server to be ready...')
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        if (cancelled) return
        
        // Step 1: Clear any old cache residue
        console.log('[INIT] Clearing old cache...')
        await clearCache('*')
        
        if (cancelled) return
        
        // Step 2: Load fresh profile data
        console.log('[INIT] Loading fresh profile data...')
        await loadProfileData()
        
        console.log('[INIT] App initialization complete')
      } catch (error) {
        console.error('[INIT] App initialization failed:', error)
        // Continue with fallback data
        await loadProfileData()
      }
    }
    
    // Only initialize when user is past login screen
    if (currentScreen !== 'login') {
      initializeApp()
    }
    
    return () => {
      cancelled = true
    }
  }, [currentScreen]) // Run when screen changes from login
  
  // ============================================================================
  // LOAD PROFILE DATA FUNCTION (shared between initialization and demographic changes)
  // ============================================================================
  const loadProfileData = useCallback(async () => {
    const profileId = demographicToProfileId(demographic)
    console.log(`[PROFILE LOAD] Loading profile ${profileId} for demographic: ${demographic}`)
    
    setIsLoadingProfile(true)
    const startTime = performance.now()
    
    try {
      const data = await fetchProfileData(profileId)
      
      // Update all state with real CSV data
      setProfileData(data)
      
      // Transform and set accounts
      if (data.accounts) {
        setAccounts(data.accounts as Account[])
      }
      
      // Set financial metrics
      if (data.metrics) {
        setMonthlyIncome(data.metrics.monthlyIncome || 0)
        setCreditScore(data.metrics.creditScore || 0)
        setNetWorth(data.metrics.netWorth || 0)
      }
      
      // Set spending data
      if (data.spending) {
        setMonthlySpending({
          total: data.spending.total,
          topCategory: data.spending.topCategory || { name: 'Unknown', amount: 0 }
        })
        setSpendingCategories(data.spending.categories || [])
      }
      
      const loadTime = performance.now() - startTime
      console.log(`[PERFORMANCE] Profile data loaded in ${loadTime.toFixed(2)}ms`)
      
      // Track performance metrics
      fetchMetrics.current.totalTime += loadTime
      lastFetchTime.current = loadTime
      
      // Removed profile loaded toast notification
    } catch (error) {
      console.error('Error loading profile data:', error)
      
      // Fall back to hardcoded data
      const fallbackData = getFallbackData(demographicToProfileId(demographic))
      const currentData = fallbackData[demographic]
      setAccounts(currentData.accounts as Account[])
      setMonthlyIncome(currentData.monthlyIncome)
      setMonthlySpending(currentData.monthlySpending)
      setSpendingCategories(currentData.spendingCategories)
      
      // Removed cached data notification
    } finally {
      setIsLoadingProfile(false)
    }
  }, [demographic, setProfileData, setAccounts, setMonthlyIncome, setCreditScore, setNetWorth, setMonthlySpending, setSpendingCategories, setIsLoadingProfile])

  // ============================================================================
  // LOAD PROFILE DATA WHEN DEMOGRAPHIC CHANGES
  // ============================================================================
  useEffect(() => {
    let cancelled = false
    
    const loadProfileDataWithCancellation = async () => {
      await loadProfileData()
      if (cancelled) return
    }
    
    loadProfileDataWithCancellation()
    
    return () => {
      cancelled = true
    }
  }, [loadProfileData]) // Run when loadProfileData changes (which depends on demographic)

  const toggleSimulation = (sim: Simulation) => {
    if (selectedSimulations.find((s) => s.id === sim.id)) {
      setSelectedSimulations(selectedSimulations.filter((s) => s.id !== sim.id))
    } else if (selectedSimulations.length < 3) {
      setSelectedSimulations([...selectedSimulations, sim])
    }
  }

  const runSimulations = async () => {
    setIsSimulating(true)
    setIsGeneratingExplanations(false)
    setCurrentScreen("simulating")
    
    try {
      // Stage 1: Profile analysis (0-20%)
      setSimulationProgress(10)
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Stage 2: Monte Carlo simulation (20-60%)
      setSimulationProgress(30)
      const profileId = demographicToProfileId(demographic)
      
      // SOLID Principle: Single Responsibility - Centralized scenario mapping
      const SCENARIO_MAPPING: Record<string, string> = {
        'emergency-fund': 'emergency_fund',
        'student-loan': 'student_loan',
        'home-purchase': 'home_purchase',
        'market-crash': 'market_crash',
        'medical-crisis': 'medical_crisis',
        'gig-economy': 'gig_economy',
        'rent-hike': 'rent_hike',
        'auto-repair': 'auto_repair'
      }
      
      // DRY Principle: Reusable scenario type resolution
      const resolveScenarioType = (simulation: SelectedSimulation | null): string => {
        if (!simulation) {
          console.warn('[USE-APP-STATE] ⚠️ No simulation selected, defaulting to emergency_fund')
          return 'emergency_fund'
        }
        
        const scenarioType = SCENARIO_MAPPING[simulation.id]
        if (!scenarioType) {
          console.error(`[USE-APP-STATE] ❌ Unknown scenario: ${simulation.id}`)
          console.log('[USE-APP-STATE] Available scenarios:', Object.keys(SCENARIO_MAPPING))
          return 'emergency_fund'
        }
        
        console.log(`[USE-APP-STATE] ✅ Mapped ${simulation.id} -> ${scenarioType}`)
        return scenarioType
      }
      
      const scenarioType = resolveScenarioType(currentSimulation)
      
      // Stage 3: Risk analysis (60-80%)
      setSimulationProgress(70)
      
      // Stage 4: AI explanation generation (80-100%)
      setSimulationProgress(85)
      setIsGeneratingExplanations(true)
      
      // SOLID Principle: Open/Closed - Easy to extend without modifying
      const buildSimulationEndpoint = (scenarioType: string): string => {
        return `/simulation/${scenarioType}`
      }
      
      const endpoint = buildSimulationEndpoint(scenarioType)
      console.log(`[USE-APP-STATE] 🔗 API Endpoint: ${endpoint}`)
      
      // Call backend API with simulation and explanation generation
      const requestBody = {
        profile_id: profileId.toString(), // Backend expects string
        scenario_type: scenarioType,
        iterations: 10000,
        include_advanced_metrics: true,
        generate_explanations: true
      }
      
      console.log(`[USE-APP-STATE] 📤 API Request:`)
      console.log(`  URL: https://sparrow-backend-production.up.railway.app${endpoint}`)
      console.log(`  Body:`, requestBody)
      
      const response = await fetch(`https://sparrow-backend-production.up.railway.app${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })
      
      console.log(`[USE-APP-STATE] 📥 API Response: ${response.status} ${response.statusText}`)
      
      if (!response.ok) {
        let errorMessage = 'Simulation failed'
        try {
          const errorBody = await response.text()
          console.error(`[USE-APP-STATE] ❌ API Error Response:`, errorBody)
          errorMessage = `API Error ${response.status}: ${errorBody}`
        } catch (e) {
          console.error(`[USE-APP-STATE] ❌ Failed to read error response:`, e)
        }
        throw new Error(errorMessage)
      }
      
      const result = await response.json()
      
      // Store the entire simulation result including AI explanations
      if (result.data) {
        console.log('[USE-APP-STATE] 📦 Full API response structure:', result)
        console.log('[USE-APP-STATE] 📊 Simulation data received:', result.data)
        console.log('[USE-APP-STATE] 🤖 AI explanations:', result.data.ai_explanations)
        console.log('[USE-APP-STATE] 🔢 AI explanations count:', result.data.ai_explanations?.length || 0)
        
        // Store the complete data object
        setSimulationResults(result.data)
        
        // SOLID Principle: Single Responsibility - Persist to localStorage for recovery
        try {
          localStorage.setItem('lastSimulationResult', JSON.stringify(result.data))
          console.log('[USE-APP-STATE] 💾 Saved to localStorage for recovery')
        } catch (e) {
          console.error('[USE-APP-STATE] Failed to save to localStorage:', e)
        }
        
        // Log what was stored
        console.log('[USE-APP-STATE] ✅ Stored simulationResults with ai_explanations')
      } else {
        console.log('[USE-APP-STATE] ⚠️ No data in API response')
        console.log('[USE-APP-STATE] Full response:', result)
      }
      
      // Check if we have AI-generated plans
      if (result.data && result.data.ai_explanations && result.data.ai_explanations.length > 0) {
        console.log('AI-generated plans received:', result.data.ai_explanations)
        setAIGeneratedPlans(result.data.ai_explanations)
      } else {
        console.log('No AI-generated plans, using fallback')
        // Generate fallback plans if AI generation failed
        setAIGeneratedPlans([])
      }
      
      setSimulationProgress(100)
      
      // Navigate to results after a brief delay
      setTimeout(() => {
        setCurrentScreen("simulation-results")
        setIsSimulating(false)
        setIsGeneratingExplanations(false)
        setSimulationProgress(0)
      }, 500)
      
    } catch (error) {
      console.error('Simulation failed:', error)
      
      // Fallback: show results with mock AI action plans data
      const mockAIPlans: AIActionPlan[] = [
        {
          id: "avalanche-method",
          title: "Avalanche Method",
          description: "Focus on paying off your highest interest rate debt first while making minimum payments on all other debts.",
          tag: "6-12 months",
          tagColor: "bg-blue-500/20 text-blue-300",
          potentialSaving: "$2,450",
          rationale: "This method minimizes total interest paid over time by targeting the most expensive debt first.",
          steps: [
            "List all debts by interest rate",
            "Pay minimums on all",
            "Extra payments to highest rate",
            "Track progress monthly"
          ],
          detailed_insights: {
            mechanics_explanation: "The avalanche method works by mathematically minimizing your total interest payments. By targeting your highest interest rate debt first, you reduce the amount of interest that compounds over time.",
            key_insights: [
              "Reduces total interest paid by $2,450 over 10 years",
              "Frees up cash flow faster than snowball method",
              "Requires discipline but provides optimal mathematical outcome"
            ],
            scenario_nuances: "Given your $25,000 student loan balance at 6.8% interest, this method will save you significantly more than the snowball approach.",
            decision_context: "This strategy is ideal for disciplined borrowers who want to minimize total cost and don't need psychological wins from paying off smaller balances first."
          }
        },
        {
          id: "refinance-loans",
          title: "Refinance High-Interest Loans",
          description: "Explore refinancing options to secure lower interest rates on your student loans.",
          tag: "4 steps",
          tagColor: "bg-green-500/20 text-green-300",
          potentialSaving: "$1,800",
          rationale: "Refinancing can reduce your interest rate from 6.8% to potentially 4.5%, saving significant money over the loan term.",
          steps: [
            "Check current rates",
            "Compare lenders",
            "Apply for refinancing",
            "Monitor new terms"
          ],
          detailed_insights: {
            mechanics_explanation: "Refinancing replaces your existing loan with a new one at a lower interest rate, reducing your monthly payment and total interest cost.",
            key_insights: [
              "Potential 2.3% rate reduction",
              "Lower monthly payments",
              "Faster debt payoff timeline"
            ],
            scenario_nuances: "With your good credit score and stable income, you're likely to qualify for competitive refinancing rates.",
            decision_context: "This is a smart move if you can secure a rate significantly lower than your current 6.8%, but consider the trade-off of losing federal loan protections."
          }
        },
        {
          id: "balanced-approach",
          title: "Balanced Debt Strategy",
          description: "Combine debt payoff with investment growth for optimal financial outcomes.",
          tag: "BALANCED",
          tagColor: "bg-purple-500/20 text-purple-300",
          potentialSaving: "$1,200",
          rationale: "This approach balances debt reduction with investment growth, allowing you to build wealth while reducing debt.",
          steps: [
            "Pay minimums on all debts",
            "Invest 50% of extra funds",
            "Apply 50% to highest interest debt",
            "Monitor and adjust quarterly"
          ],
          detailed_insights: {
            mechanics_explanation: "This strategy allocates extra funds between debt payoff and investments, optimizing for both debt reduction and wealth building.",
            key_insights: [
              "Balances debt reduction with investment growth",
              "Reduces total interest paid by $1,200",
              "Builds investment portfolio simultaneously"
            ],
            scenario_nuances: "This approach works well when your investment returns can exceed your debt interest rates, creating a net positive outcome.",
            decision_context: "Ideal for those who want to build wealth while reducing debt, but requires careful monitoring of investment performance vs. debt costs."
          }
        }
      ]
      
      setAIGeneratedPlans(mockAIPlans)
      setSimulationProgress(100)
      
      setTimeout(() => {
        setCurrentScreen("simulation-results")
        setIsSimulating(false)
        setIsGeneratingExplanations(false)
        setSimulationProgress(0)
      }, 500)
    }
  }

  const removeAutomation = useCallback((automationTitle: string) => {
    setActiveAutomations((prev) => prev.filter((a) => a.title !== automationTitle))
  }, [])

  const saveAutomation = (automation: AutomationAction) => {
    // Check if automation with same execution ID already exists (instead of just title)
    if (!activeAutomations.find((a) => a.executionId === automation.executionId)) {
      setActiveAutomations((prev) => [...prev, automation])
      
      // Also add to aiActions state so it appears in the AI Actions screen
      const aiAction: AIAction = {
        id: automation.executionId || `automation-${Date.now()}`,
        title: automation.title,
        description: automation.description,
        rationale: automation.rationale || `Automated action: ${automation.title}`,
        type: "optimization" as const,
        potentialSaving: automation.potentialSaving || 0,
        steps: automation.steps.map(step => step.name),
        status: "in-process" as const,
        progress: 0,
        workflowStatus: "running" as const,
        currentStep: "Initializing",
        estimatedCompletion: "3m remaining",
        executionId: automation.executionId
      }
      
      setAiActions((prev) => [...prev, aiAction])
      // Removed automation activated toast
    }
  }

  const addGoal = useCallback((goal: Omit<Goal, "id">) => {
    const newGoal = {
      ...goal,
      id: Math.max(...goals.map(g => g.id), 0) + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: 1,
      aiInsights: goal.aiInsights || {
        lastUpdated: new Date().toISOString(),
        recommendations: [],
        riskAssessment: '',
        optimizationOpportunities: []
      },
      simulationImpact: goal.simulationImpact || []
    }
    
    const updatedGoals = [...goals, newGoal]
    setGoals(updatedGoals)
    console.log(`[GOALS] Added goal "${newGoal.title}" with ID ${newGoal.id}`, newGoal.simulationTags)
  }, [goals, setGoals])

  const updateGoal = useCallback((id: number, updates: Partial<Goal>) => {
    const updatedGoals = goals.map(goal => 
      goal.id === id 
        ? { ...goal, ...updates, updatedAt: new Date().toISOString() }
        : goal
    )
    setGoals(updatedGoals)
  }, [goals, setGoals])

  const deleteGoal = useCallback((id: number) => {
    const updatedGoals = goals.filter(goal => goal.id !== id)
    setGoals(updatedGoals)
    console.log(`[GOALS] Deleted goal with ID ${id}`)
  }, [goals, setGoals])

  const payBill = (billId: number) => {
    const bill = bills.find((b) => b.id === billId)
    if (!bill || bill.status === "paid") return

    setAccounts((prevAccounts) =>
      prevAccounts.map((acc) => {
        if (acc.name === "Chase Checking") {
          return { ...acc, balance: acc.balance - bill.amount }
        }
        return acc
      }),
    )

    setBills((prevBills) =>
      prevBills.map((b) => {
        if (b.id === billId) {
          return { ...b, status: "paid" }
        }
        return b
      }),
    )

    // Removed bill paid toast
  }

  const clearCache = useCallback(async (pattern?: string) => {
    try {
      console.log(`[CACHE] Clearing cache with pattern: ${pattern || 'all'}`)
      
      // Clear memory cache
      dataCache.invalidate(pattern)
      
      // Clear backend cache
      console.log(`[CACHE] Calling cache clear API...`)
      const response = await fetch(`/api/cache/clear/${pattern || '*'}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      console.log(`[CACHE] Cache clear response status: ${response.status}`)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[CACHE] Cache clear error: ${errorText}`)
        throw new Error(`Failed to clear cache: ${response.statusText}`)
      }
      
      const result = await response.json()
      console.log('[CACHE] Cache clear result:', result)
      
      // Force refresh of current data
      if (pattern === '*' || !pattern) {
        // Clear all cached data and refetch
        setProfileData(null)
        // Don't clear simulation results during cache clearing - they should persist until explicitly cleared
        // setSimulationResults(null)
      }
      
    } catch (error) {
      console.error('[CACHE] Cache clear failed:', error)
      // Don't throw - allow app to continue with fallback data
    }
  }, [])

  // Remove the automatic progress simulation since we now handle it in runSimulations
  // The progress is now controlled by actual API calls and stages

  return {
    currentScreen,
    setCurrentScreen,
    selectedSimulations,
    toggleSimulation,
    runSimulations,
    isSimulating,
    simulationProgress,
    activeAutomations,
    saveAutomation,
    removeAutomation,
    setSelectedSimulations,
    goals,
    addGoal,
    updateGoal,
    deleteGoal,
    selectedGoal,
    setSelectedGoal,
    isThoughtDetailOpen,
    setThoughtDetailOpen,
    selectedThought,
    setSelectedThought,
    isChatOpen,
    setChatOpen,
    bills,
    payBill,
    accounts,
    isGoalFeedbackOpen,
    setGoalFeedbackOpen,
    monthlyIncome,
    monthlySpending,
    selectedAction,
    setSelectedAction,
    spendingCategories,
    recurringExpenses,
    aiActions,
    setAiActions,
    demographic,
    setDemographic,
    currentSimulation,
    setCurrentSimulation,
    isAIChatOpen,
    setAIChatOpen,
    selectedActionForChat,
    setSelectedActionForChat,
    aiGeneratedPlans,
    setAIGeneratedPlans,
    isGeneratingExplanations,
    setIsGeneratingExplanations,
    profileData,
    setProfileData,
    simulationResults,
    setSimulationResults,
    clearCache,
  }
}

// Export cache utilities for testing and monitoring
export { dataCache }
