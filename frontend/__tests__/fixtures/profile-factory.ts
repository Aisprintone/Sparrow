import { AppState, Account, SpendingCategory, AIAction } from '@/hooks/use-app-state'

export const profileFactory = {
  genZ: () => ({
    demographic: 'genz' as const,
    monthlyIncome: 3200,
    monthlySpending: { 
      total: 2100, 
      topCategory: { name: 'Food & Dining', amount: 450 } 
    },
    accounts: [
      { 
        id: 1, 
        name: 'Chase College Checking', 
        institution: 'Chase', 
        balance: 2847, 
        icon: '/logos/chase.png', 
        type: 'asset' as const 
      },
      { 
        id: 2, 
        name: 'Savings Account', 
        institution: 'Chase', 
        balance: 5200, 
        icon: '/logos/chase.png', 
        type: 'asset' as const 
      },
      { 
        id: 3, 
        name: 'Student Loan', 
        institution: 'Federal', 
        balance: -28500, 
        icon: '🎓', 
        type: 'liability' as const 
      },
      { 
        id: 4, 
        name: 'Credit Card', 
        institution: 'Discover', 
        balance: -1200, 
        icon: '/logos/amex.png', 
        type: 'liability' as const 
      },
    ] as Account[],
    spendingCategories: [
      { id: 'food', name: 'Food & Dining', icon: '🍕', spent: 450, budget: 400, color: 'red' },
      { id: 'transport', name: 'Transportation', icon: '🚗', spent: 180, budget: 200, color: 'green' },
      { id: 'entertainment', name: 'Entertainment', icon: '🎬', spent: 220, budget: 250, color: 'green' },
      { id: 'shopping', name: 'Shopping', icon: '🛍️', spent: 320, budget: 300, color: 'red' },
    ] as SpendingCategory[],
    recurringExpenses: {
      total: 850,
      items: [
        { name: 'Rent', amount: 600, icon: '🏠' },
        { name: 'Phone', amount: 45, icon: '📱' },
        { name: 'Streaming', amount: 25, icon: '📺' },
        { moreCount: 3 },
      ],
    },
    creditScore: 650,
    creditInsight: 'Credit utilization decreased from 45% to 38%',
  }),

  millennial: () => ({
    demographic: 'millennial' as const,
    monthlyIncome: 8500,
    monthlySpending: { 
      total: 4200, 
      topCategory: { name: 'Housing', amount: 2200 } 
    },
    accounts: [
      { 
        id: 1, 
        name: 'Chase Checking', 
        institution: 'Chase', 
        balance: 8500, 
        icon: '/logos/chase.png', 
        type: 'asset' as const 
      },
      { 
        id: 2, 
        name: 'Fidelity 401k', 
        institution: 'Fidelity', 
        balance: 45000, 
        icon: '/logos/fidelity.png', 
        type: 'asset' as const 
      },
      { 
        id: 3, 
        name: 'High-Yield Savings', 
        institution: 'Marcus', 
        balance: 15000, 
        icon: '/logos/chase.png', 
        type: 'asset' as const 
      },
      { 
        id: 4, 
        name: 'Investment Account', 
        institution: 'Vanguard', 
        balance: 22000, 
        icon: '/logos/vanguard.png', 
        type: 'asset' as const 
      },
      { 
        id: 6, 
        name: 'Apple Card', 
        institution: 'Goldman Sachs', 
        balance: -2234, 
        icon: '/logos/amex.png', 
        type: 'liability' as const 
      },
      { 
        id: 7, 
        name: 'Chase Freedom', 
        institution: 'Chase', 
        balance: -1800, 
        icon: '/logos/chase.png', 
        type: 'liability' as const 
      },
      { 
        id: 8, 
        name: 'Student Loan', 
        institution: 'Federal', 
        balance: -12000, 
        icon: '🎓', 
        type: 'liability' as const 
      },
    ] as Account[],
    spendingCategories: [
      { id: 'housing', name: 'Housing', icon: '🏠', spent: 2200, budget: 2500, color: 'green' },
      { id: 'groceries', name: 'Groceries', icon: '🥬', spent: 650, budget: 700, color: 'green' },
      { id: 'transport', name: 'Transportation', icon: '🚗', spent: 450, budget: 500, color: 'green' },
      { id: 'entertainment', name: 'Entertainment', icon: '🎬', spent: 380, budget: 400, color: 'green' },
    ] as SpendingCategory[],
    recurringExpenses: {
      total: 1352,
      items: [
        { name: 'Mortgage', amount: 1200, icon: '🏠' },
        { name: 'Internet', amount: 79, icon: '📶' },
        { name: 'Phone', amount: 45, icon: '📱' },
        { moreCount: 2 },
      ],
    },
    creditScore: 780,
    creditInsight: 'Payment history improved with on-time payments',
  }),

  withCustomData: (base: 'genz' | 'millennial', overrides: any) => {
    const baseProfile = base === 'genz' ? profileFactory.genZ() : profileFactory.millennial()
    return {
      ...baseProfile,
      ...overrides,
    }
  },

  createMockAppState: (demographic: 'genz' | 'millennial' = 'millennial'): Partial<AppState> => {
    const profile = demographic === 'genz' ? profileFactory.genZ() : profileFactory.millennial()
    
    return {
      currentScreen: 'dashboard',
      setCurrentScreen: jest.fn(),
      selectedSimulations: [],
      toggleSimulation: jest.fn(),
      runSimulations: jest.fn(),
      isSimulating: false,
      simulationProgress: 0,
      activeAutomations: [],
      saveAutomation: jest.fn(),
      removeAutomation: jest.fn(),
      setSelectedSimulations: jest.fn(),
      goals: [],
      addGoal: jest.fn(),
      selectedGoal: null,
      setSelectedGoal: jest.fn(),
      isThoughtDetailOpen: false,
      setThoughtDetailOpen: jest.fn(),
      selectedThought: null,
      setSelectedThought: jest.fn(),
      isChatOpen: false,
      setChatOpen: jest.fn(),
      bills: [],
      payBill: jest.fn(),
      accounts: profile.accounts,
      isGoalFeedbackOpen: false,
      setGoalFeedbackOpen: jest.fn(),
      monthlyIncome: profile.monthlyIncome,
      monthlySpending: profile.monthlySpending,
      selectedAction: null,
      setSelectedAction: jest.fn(),
      spendingCategories: profile.spendingCategories,
      recurringExpenses: profile.recurringExpenses,
      aiActions: profileFactory.getAIActions(demographic),
      demographic: profile.demographic,
      setDemographic: jest.fn(),
      currentSimulation: null,
      setCurrentSimulation: jest.fn(),
      isAIChatOpen: false,
      setAIChatOpen: jest.fn(),
      selectedActionForChat: null,
      setSelectedActionForChat: jest.fn(),
    }
  },

  getAIActions: (demographic: 'genz' | 'millennial'): AIAction[] => {
    const baseActions: AIAction[] = [
      {
        id: 'high-yield-savings',
        title: demographic === 'genz' ? 'Open High-Yield Savings' : 'Move to High-Yield Savings',
        description: demographic === 'genz' 
          ? 'Start earning 4.5% APY on your savings'
          : 'Detected excess in checking, earning you +$8/month',
        rationale: demographic === 'genz'
          ? 'Your savings account is earning minimal interest. High-yield savings offers 4.5% APY.'
          : 'Excess cash in checking could earn 4.5% APY in high-yield savings.',
        type: 'optimization',
        potentialSaving: demographic === 'genz' ? 15 : 8,
        steps: ['Research accounts', 'Open account', 'Transfer funds', 'Monitor monthly'],
        status: 'suggested',
      },
      {
        id: 'budget-optimization',
        title: demographic === 'genz' ? 'Create First Budget' : 'Optimize Monthly Budget',
        description: demographic === 'genz'
          ? 'Track spending and save $200/month'
          : 'Reduce unnecessary expenses by $150/month',
        rationale: 'Analysis shows overspending in certain categories compared to income.',
        type: 'optimization',
        potentialSaving: demographic === 'genz' ? 200 : 150,
        steps: ['Analyze spending', 'Set budgets', 'Track progress', 'Adjust monthly'],
        status: 'suggested',
      },
    ]
    
    return baseActions
  },

  // Helper to calculate net worth
  calculateNetWorth: (accounts: Account[]): number => {
    const assets = accounts
      .filter(acc => acc.type === 'asset')
      .reduce((sum, acc) => sum + acc.balance, 0)
    const liabilities = Math.abs(
      accounts
        .filter(acc => acc.type === 'liability')
        .reduce((sum, acc) => sum + acc.balance, 0)
    )
    return assets - liabilities
  },

  // Helper to get spending over budget
  getOverBudgetCategories: (categories: SpendingCategory[]): SpendingCategory[] => {
    return categories.filter(cat => cat.spent > cat.budget)
  },

  // Helper to generate transaction data
  generateTransactions: (profile: 'genz' | 'millennial', days: number = 30) => {
    const categories = profile === 'genz' 
      ? ['Food & Dining', 'Transportation', 'Entertainment', 'Shopping']
      : ['Housing', 'Groceries', 'Transportation', 'Entertainment']
    
    const transactions = []
    const now = Date.now()
    
    for (let i = 0; i < days * 3; i++) {
      transactions.push({
        id: `txn-${i}`,
        date: new Date(now - (i * 24 * 60 * 60 * 1000)),
        category: categories[Math.floor(Math.random() * categories.length)],
        amount: Math.random() * 200 + 10,
        merchant: `Merchant ${i}`,
        status: 'completed',
      })
    }
    
    return transactions
  },
}