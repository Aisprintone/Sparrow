export interface Goal {
  id: number
  title: string
  type: "safety" | "home" | "experience" | "retirement" | "debt" | "investment" | "education" | "business"
  target: number
  current: number
  deadline: string
  icon: string
  color: string
  monthlyContribution: number
  milestones: { name: string; target: number }[]
  // Enhanced properties for simulation integration
  simulationTags?: string[]
  priority?: "high" | "medium" | "low"
  status?: "active" | "paused" | "completed" | "cancelled"
  createdAt?: string
  updatedAt?: string
  userId?: number
  // AI integration properties
  aiInsights?: {
    lastUpdated: string
    recommendations: string[]
    riskAssessment: string
    optimizationOpportunities: string[]
  }
  // Simulation impact tracking
  simulationImpact?: {
    scenarioName: string
    impactOnGoal: number // percentage
    newTargetDate?: string
    adjustedMonthlyContribution?: number
  }[]
}

export interface Simulation {
  id: number
  title: string
  subtitle: string
  icon: string
  category: string
}

export interface AutomationAction {
  title: string
  description: string
  steps: WorkflowStep[]
  potentialSaving?: number
  type?: "optimization" | "simulation"
  rationale?: string
  status?: "suggested" | "in-process" | "completed"
  progress?: number
  workflowStatus?: "running" | "paused" | "completed" | "failed"
  currentStep?: string
  estimatedCompletion?: string
  executionId?: string
  // Enhanced properties for better workflow tracking
  scenario?: string
  profile?: string
  impact?: {
    immediateSavings?: number
    annualProjection?: number
    riskReduction?: number
    goalProgress?: number
    timeToComplete?: string
  }
  metadata?: {
    category: "optimize" | "protect" | "grow" | "emergency"
    difficulty: "easy" | "medium" | "hard"
    confidence: number // 0-100
    dependencies: string[]
    prerequisites: string[]
  }
}

export interface WorkflowStep {
  id: string
  name: string
  description: string
  status: "completed" | "in_progress" | "pending" | "failed" | "waiting_user"
  duration: number // in seconds
  estimatedTime: string
  agent?: string
  agentType?: "automated" | "semi-automated" | "manual"
  userActionRequired?: {
    type: "confirm" | "input" | "choice"
    message: string
    options?: string[]
    timeout?: number
    critical?: boolean
  }
  impact?: {
    savings?: number
    riskReduction?: number
    goalProgress?: number
    timeSaved?: number
  }
  details?: string
  technicalDetails?: {
    apiCalls?: string[]
    externalServices?: string[]
    dataProcessed?: string[]
    validations?: string[]
  }
  progress?: {
    current: number // 0-100
    message: string
    timestamp: string
    duration: number
  }
  errors?: {
    message: string
    code: string
    retryCount: number
    maxRetries: number
  }[]
  rollback?: {
    available: boolean
    steps: string[]
    impact: string
  }
}

export interface ResultCard {
  id: string
  type: "intro" | "individual" | "synergy" | "automation"
  content?: string
  emoji: string
  title?: string
  automations?: AutomationAction[]
  detailedExplanation: string
  detailed_insights?: {
    mechanics_explanation: string
    key_insights: string[]
    scenario_nuances: string
    decision_context: string
  }
}

export interface Bill {
  id: number
  name: string
  amount: number
  dueDate: string
  status: "upcoming" | "paid"
  category: string
}

export interface CreditFactor {
  name: "Payment History" | "Credit Utilization" | "Length of Credit History" | "Credit Mix" | "New Credit"
  status: "excellent" | "good" | "fair" | "poor"
  value: string
  impact: "high" | "medium" | "low"
}

export const creditScore = {
  score: 780,
  factors: [
    { name: "Payment History", status: "excellent", value: "100%", impact: "high" },
    { name: "Credit Utilization", status: "good", value: "22%", impact: "high" },
    { name: "Length of Credit History", status: "good", value: "8 years", impact: "medium" },
    { name: "Credit Mix", status: "excellent", value: "10 accounts", impact: "low" },
    { name: "New Credit", status: "good", value: "1 inquiry", impact: "low" },
  ] as CreditFactor[],
}

export const bills: Bill[] = [
  { id: 1, name: "Netflix", amount: 15.49, dueDate: "2025-08-10", status: "upcoming", category: "Entertainment" },
  { id: 2, name: "AT&T Internet", amount: 79.99, dueDate: "2025-08-15", status: "upcoming", category: "Utilities" },
  { id: 3, name: "Geico Insurance", amount: 120.5, dueDate: "2025-08-20", status: "upcoming", category: "Insurance" },
  { id: 4, name: "Spotify", amount: 10.99, dueDate: "2025-08-01", status: "paid", category: "Entertainment" },
]

export const goals: Goal[] = [
  {
    id: 1,
    title: "Emergency Fund",
    type: "safety",
    target: 15000,
    current: 6800,
    deadline: "Dec 2025",
    icon: "Shield",
    color: "green",
    monthlyContribution: 400,
    priority: "high",
    status: "active",
    simulationTags: ["emergency_fund", "safety_net"],
    milestones: [
      { name: "3-month expenses", target: 7500 },
      { name: "6-month expenses", target: 15000 },
      { name: "Fully funded", target: 15000 },
    ],
    aiInsights: {
      lastUpdated: "2024-01-15",
      recommendations: [
        "Consider high-yield savings account for better returns",
        "Automate monthly transfers to ensure consistency"
      ],
      riskAssessment: "Low risk, high priority for financial stability",
      optimizationOpportunities: [
        "Increase contribution by $100/month to reach target 3 months earlier",
        "Use windfall income to accelerate progress"
      ]
    }
  },
  {
    id: 2,
    title: "Bali Vacation",
    type: "experience",
    target: 3000,
    current: 1290,
    deadline: "Jun 2025",
    icon: "Plane",
    color: "blue",
    monthlyContribution: 285,
    priority: "medium",
    status: "active",
    simulationTags: ["travel", "experience"],
    milestones: [
      { name: "Flights Booked", target: 1500 },
      { name: "Accommodation Paid", target: 2500 },
      { name: "Ready to Go!", target: 3000 },
    ],
    aiInsights: {
      lastUpdated: "2024-01-15",
      recommendations: [
        "Consider travel rewards credit card for additional savings",
        "Book flights 6-8 months in advance for best prices"
      ],
      riskAssessment: "Medium risk - dependent on stable income",
      optimizationOpportunities: [
        "Use side hustle income to accelerate savings",
        "Consider travel insurance for protection"
      ]
    }
  },
  {
    id: 3,
    title: "Home Down Payment",
    type: "home",
    target: 50000,
    current: 12000,
    deadline: "Dec 2027",
    icon: "Home",
    color: "purple",
    monthlyContribution: 800,
    priority: "high",
    status: "active",
    simulationTags: ["home_purchase", "housing"],
    milestones: [
      { name: "10% saved", target: 5000 },
      { name: "20% saved", target: 10000 },
      { name: "Ready to buy", target: 50000 },
    ],
    aiInsights: {
      lastUpdated: "2024-01-15",
      recommendations: [
        "Run home purchase simulation to optimize timing",
        "Consider different down payment scenarios"
      ],
      riskAssessment: "High impact on long-term wealth building",
      optimizationOpportunities: [
        "Increase monthly contribution by $200 to buy 6 months earlier",
        "Consider FHA loan for lower down payment requirement"
      ]
    }
  },
  {
    id: 4,
    title: "Student Loan Payoff",
    type: "debt",
    target: 25000,
    current: 25000,
    deadline: "Dec 2026",
    icon: "GraduationCap",
    color: "red",
    monthlyContribution: 500,
    priority: "high",
    status: "active",
    simulationTags: ["debt_avalanche", "student_loan"],
    milestones: [
      { name: "25% paid off", target: 18750 },
      { name: "50% paid off", target: 12500 },
      { name: "Debt free!", target: 0 },
    ],
    aiInsights: {
      lastUpdated: "2024-01-15",
      recommendations: [
        "Run debt avalanche simulation to optimize payoff strategy",
        "Consider refinancing for lower interest rates"
      ],
      riskAssessment: "High priority - reduces monthly obligations",
      optimizationOpportunities: [
        "Use debt avalanche method to save $2,400 in interest",
        "Apply windfall income to highest interest loans first"
      ]
    }
  },
  {
    id: 5,
    title: "Retirement Fund",
    type: "retirement",
    target: 1000000,
    current: 87000,
    deadline: "Dec 2045",
    icon: "TrendingUp",
    color: "orange",
    monthlyContribution: 1200,
    priority: "high",
    status: "active",
    simulationTags: ["retirement", "401k_max"],
    milestones: [
      { name: "100k milestone", target: 100000 },
      { name: "500k milestone", target: 500000 },
      { name: "Millionaire!", target: 1000000 },
    ],
    aiInsights: {
      lastUpdated: "2024-01-15",
      recommendations: [
        "Run 401k maximization simulation",
        "Consider Roth vs Traditional IRA strategy"
      ],
      riskAssessment: "Critical for long-term financial security",
      optimizationOpportunities: [
        "Increase 401k contribution by 1% annually",
        "Consider side hustle income for additional retirement savings"
      ]
    }
  },
  {
    id: 6,
    title: "Start Business Fund",
    type: "business",
    target: 15000,
    current: 3000,
    deadline: "Dec 2025",
    icon: "Briefcase",
    color: "indigo",
    monthlyContribution: 400,
    priority: "medium",
    status: "active",
    simulationTags: ["business", "side_income"],
    milestones: [
      { name: "Business plan", target: 5000 },
      { name: "Legal setup", target: 10000 },
      { name: "Launch ready", target: 15000 },
    ],
    aiInsights: {
      lastUpdated: "2024-01-15",
      recommendations: [
        "Run side income simulation to accelerate funding",
        "Consider business credit options"
      ],
      riskAssessment: "Medium risk - requires market validation",
      optimizationOpportunities: [
        "Use side hustle to double monthly contribution",
        "Consider crowdfunding for additional capital"
      ]
    }
  },
  {
    id: 7,
    title: "Investment Portfolio",
    type: "investment",
    target: 50000,
    current: 15000,
    deadline: "Dec 2028",
    icon: "BarChart3",
    color: "teal",
    monthlyContribution: 600,
    priority: "medium",
    status: "active",
    simulationTags: ["investment", "portfolio"],
    milestones: [
      { name: "25k milestone", target: 25000 },
      { name: "40k milestone", target: 40000 },
      { name: "Target reached", target: 50000 },
    ],
    aiInsights: {
      lastUpdated: "2024-01-15",
      recommendations: [
        "Diversify across different asset classes",
        "Consider automated investing for consistency"
      ],
      riskAssessment: "Medium risk with potential for high returns",
      optimizationOpportunities: [
        "Increase monthly contribution by $200 for faster growth",
        "Consider tax-loss harvesting strategies"
      ]
    }
  },
  {
    id: 8,
    title: "Grad School Fund",
    type: "education",
    target: 30000,
    current: 8000,
    deadline: "Dec 2026",
    icon: "BookOpen",
    color: "cyan",
    monthlyContribution: 500,
    priority: "medium",
    status: "active",
    simulationTags: ["education", "investment"],
    milestones: [
      { name: "Application fees", target: 15000 },
      { name: "First semester", target: 25000 },
      { name: "Fully funded", target: 30000 },
    ],
    aiInsights: {
      lastUpdated: "2024-01-15",
      recommendations: [
        "Research scholarship and grant opportunities",
        "Consider employer tuition reimbursement"
      ],
      riskAssessment: "High ROI potential but requires career planning",
      optimizationOpportunities: [
        "Apply for scholarships to reduce target amount",
        "Consider part-time program to reduce costs"
      ]
    }
  }
]

export const simulations: Simulation[] = [
  {
    id: 1,
    title: "Max out 401k",
    subtitle: "Impact of increasing retirement contributions",
    icon: "📈",
    category: "retirement",
  },
  { id: 2, title: "Buy vs Rent Analysis", subtitle: "5-year housing cost comparison", icon: "🏠", category: "housing" },
  { id: 3, title: "Emergency Fund Boost", subtitle: "Path to 6-month safety net", icon: "🛡️", category: "safety" },
  { id: 4, title: "Debt Avalanche", subtitle: "Optimize debt payoff strategy", icon: "💳", category: "debt" },
  { id: 5, title: "Side Income Impact", subtitle: "$1000/mo additional income", icon: "💼", category: "income" },
]

export const connectedAccounts = [
  { id: 1, name: "Chase Checking", institution: "Chase", balance: "$12,847", icon: "/logos/chase.png" },
  { id: 2, name: "Fidelity 401k", institution: "Fidelity", balance: "$87,234", icon: "/logos/fidelity.png" },
  { id: 3, name: "Apple Card", institution: "Goldman Sachs", balance: "-$1,234", icon: "/logos/amex.png" },
]

export const alertSettings = [
  { id: 1, title: "Low Balance Alerts", enabled: true, icon: "AlertCircle" },
  { id: 2, title: "Large Transactions", enabled: true, icon: "CreditCard" },
  { id: 3, title: "Weekly Summary", enabled: false, icon: "Mail" },
]

export const popularInstitutions = [
  { id: 1, name: "Chase", logo: "/logos/chase.svg", color: "bg-blue-600/20" },
  { id: 2, name: "Bank of America", logo: "/logos/boa.svg", color: "bg-red-600/20" },
  { id: 3, name: "Wells Fargo", logo: "/logos/wellsfargo.svg", color: "bg-red-700/20" },
  { id: 4, name: "Fidelity", logo: "/logos/fidelity.svg", color: "bg-green-600/20" },
  { id: 5, name: "Vanguard", logo: "/logos/vanguard.svg", color: "bg-blue-800/20" },
  { id: 6, name: "Amex", logo: "/logos/amex.svg", color: "bg-blue-500/20" },
]

export const simulationResults: ResultCard[] = [
  {
    id: "intro",
    type: "intro",
    content: "Running all 3 scenarios together creates a powerful wealth-building strategy.",
    emoji: "🎯",
    detailedExplanation:
      "By analyzing the combined effects of your selected scenarios, we can identify synergies that wouldn't be apparent when looking at each in isolation. This holistic view allows for a more optimized financial plan that aligns with your long-term goals.",
  },
  {
    id: "individual",
    type: "individual",
    content:
      "Max 401k alone: +$487k in 20 years\nEmergency fund: -2% portfolio risk\nDebt payoff: +$34k saved interest",
    emoji: "📊",
    detailedExplanation:
      "Each action has a significant individual impact. Maximizing your 401k leverages compound growth over two decades. A fully-funded emergency fund acts as a buffer against market volatility, reducing the risk of having to sell investments at a loss. Aggressively paying down high-interest debt frees up cash flow and saves you a substantial amount in interest payments over the life of the loan.",
  },
  {
    id: "synergy",
    type: "synergy",
    content:
      "Combined effect: Your retirement date moves up by 7 years! The emergency fund provides stability to maintain 401k contributions even during market downturns.",
    emoji: "🚀",
    detailedExplanation:
      "This is where the magic happens. The stability from your emergency fund means you can continue investing in your 401k without interruption, even if you face an unexpected expense or market dip. This uninterrupted compounding, combined with the cash flow freed up from debt repayment, dramatically accelerates your retirement timeline. The whole is truly greater than the sum of its parts.",
  },
  {
    id: "automation",
    type: "automation",
    title: "Optimal Execution Plan",
    automations: [
      {
        title: "Smart 401k Maximizer",
        description: "Gradually increase contributions by 1% quarterly",
        steps: [
          { 
            id: "step-1",
            name: "Contribution increased", 
            description: "Increased 401k contribution by 1%",
            status: "completed",
            duration: 300,
            estimatedTime: "5 minutes"
          },
          { 
            id: "step-2",
            name: "Next increase Q3 2025", 
            description: "Schedule next contribution increase",
            status: "in_progress",
            duration: 600,
            estimatedTime: "10 minutes"
          },
          { 
            id: "step-3",
            name: "Auto-adjust for raises", 
            description: "Set up automatic adjustment for salary increases",
            status: "pending",
            duration: 900,
            estimatedTime: "15 minutes"
          },
        ],
      },
      {
        title: "Emergency Fund Builder",
        description: "Auto-save $300/mo until 6-month target",
        steps: [
          { 
            id: "step-4",
            name: "High-yield account opened", 
            description: "Opened high-yield savings account",
            status: "completed",
            duration: 1200,
            estimatedTime: "20 minutes"
          },
          { 
            id: "step-5",
            name: "Weekly transfers active", 
            description: "Set up automatic weekly transfers",
            status: "in_progress",
            duration: 300,
            estimatedTime: "5 minutes"
          },
          { 
            id: "step-6",
            name: "Pause at $15k target", 
            description: "Configure automatic pause at target amount",
            status: "pending",
            duration: 600,
            estimatedTime: "10 minutes"
          },
        ],
      },
    ],
    emoji: "⚡",
    detailedExplanation:
      "Based on the simulation, the most effective path forward is to automate these actions. This plan ensures consistent progress without requiring constant manual intervention. By setting up automatic transfers and contribution increases, you put your financial growth on autopilot, ensuring you stay on the accelerated path we've identified.",
  },
]
