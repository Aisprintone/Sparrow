export interface Goal {
  id: number
  title: string
  type: "safety" | "home" | "experience"
  target: number
  current: number
  deadline: string
  icon: string
  color: string
  monthlyContribution: number
  milestones: { name: string; target: number }[]
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
  steps: { name: string; status: "completed" | "in_progress" | "pending" }[]
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
    milestones: [
      { name: "3-month expenses", target: 7500 },
      { name: "6-month expenses", target: 15000 },
      { name: "Fully funded", target: 15000 },
    ],
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
    milestones: [
      { name: "Flights Booked", target: 1500 },
      { name: "Accommodation Paid", target: 2500 },
      { name: "Ready to Go!", target: 3000 },
    ],
  },
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
          { name: "Contribution increased", status: "completed" },
          { name: "Next increase Q3 2025", status: "in_progress" },
          { name: "Auto-adjust for raises", status: "pending" },
        ],
      },
      {
        title: "Emergency Fund Builder",
        description: "Auto-save $300/mo until 6-month target",
        steps: [
          { name: "High-yield account opened", status: "completed" },
          { name: "Weekly transfers active", status: "in_progress" },
          { name: "Pause at $15k target", status: "pending" },
        ],
      },
    ],
    emoji: "⚡",
    detailedExplanation:
      "Based on the simulation, the most effective path forward is to automate these actions. This plan ensures consistent progress without requiring constant manual intervention. By setting up automatic transfers and contribution increases, you put your financial growth on autopilot, ensuring you stay on the accelerated path we've identified.",
  },
]
