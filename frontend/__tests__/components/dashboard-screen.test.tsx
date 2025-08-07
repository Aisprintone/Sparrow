import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import DashboardScreen from '@/components/screens/dashboard-screen'
import { AppState } from '@/hooks/use-app-state'

// Mock the API call
global.fetch = jest.fn()

const mockGenzProps: AppState = {
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
  accounts: [
    { id: 1, name: 'Chase College Checking', institution: 'Chase', balance: 2847, icon: '/logos/chase.png', type: 'asset' },
    { id: 2, name: 'Savings Account', institution: 'Chase', balance: 5200, icon: '/logos/chase.png', type: 'asset' },
    { id: 3, name: 'Student Loan', institution: 'Federal', balance: -28500, icon: '🎓', type: 'liability' },
    { id: 4, name: 'Credit Card', institution: 'Discover', balance: -1200, icon: '/logos/amex.png', type: 'liability' },
  ],
  isGoalFeedbackOpen: false,
  setGoalFeedbackOpen: jest.fn(),
  monthlyIncome: 3200,
  monthlySpending: { total: 2100, topCategory: { name: 'Food & Dining', amount: 450 } },
  selectedAction: null,
  setSelectedAction: jest.fn(),
  spendingCategories: [
    { id: 'food', name: 'Food & Dining', icon: '🍕', spent: 450, budget: 400, color: 'red' },
    { id: 'transport', name: 'Transportation', icon: '🚗', spent: 180, budget: 200, color: 'green' },
  ],
  recurringExpenses: {
    total: 850,
    items: [
      { name: 'Rent', amount: 600, icon: '🏠' },
      { name: 'Phone', amount: 45, icon: '📱' },
    ],
  },
  aiActions: [
    {
      id: 'high-yield-savings',
      title: 'Open High-Yield Savings',
      description: 'Start earning 4.5% APY on your savings',
      rationale: 'Analysis shows savings opportunity',
      type: 'optimization',
      potentialSaving: 15,
      steps: ['Research accounts', 'Open account'],
      status: 'suggested',
    },
  ],
  demographic: 'genz',
  setDemographic: jest.fn(),
  currentSimulation: null,
  setCurrentSimulation: jest.fn(),
  isAIChatOpen: false,
  setAIChatOpen: jest.fn(),
  selectedActionForChat: null,
  setSelectedActionForChat: jest.fn(),
}

const mockMillennialProps: AppState = {
  ...mockGenzProps,
  demographic: 'millennial',
  monthlyIncome: 8500,
  monthlySpending: { total: 4200, topCategory: { name: 'Housing', amount: 2200 } },
  accounts: [
    { id: 1, name: 'Chase Checking', institution: 'Chase', balance: 8500, icon: '/logos/chase.png', type: 'asset' },
    { id: 2, name: 'Fidelity 401k', institution: 'Fidelity', balance: 45000, icon: '/logos/fidelity.png', type: 'asset' },
    { id: 3, name: 'High-Yield Savings', institution: 'Marcus', balance: 15000, icon: '/logos/chase.png', type: 'asset' },
    { id: 4, name: 'Investment Account', institution: 'Vanguard', balance: 22000, icon: '/logos/vanguard.png', type: 'asset' },
    { id: 5, name: 'Apple Card', institution: 'Goldman Sachs', balance: -2234, icon: '/logos/amex.png', type: 'liability' },
    { id: 6, name: 'Chase Freedom', institution: 'Chase', balance: -1800, icon: '/logos/chase.png', type: 'liability' },
    { id: 7, name: 'Student Loan', institution: 'Federal', balance: -12000, icon: '🎓', type: 'liability' },
  ],
  spendingCategories: [
    { id: 'housing', name: 'Housing', icon: '🏠', spent: 2200, budget: 2500, color: 'green' },
    { id: 'groceries', name: 'Groceries', icon: '🥬', spent: 650, budget: 700, color: 'green' },
  ],
  recurringExpenses: {
    total: 1352,
    items: [
      { name: 'Mortgage', amount: 1200, icon: '🏠' },
      { name: 'Internet', amount: 79, icon: '📶' },
    ],
  },
  aiActions: [
    {
      id: 'high-yield-savings',
      title: 'Move to High-Yield Savings',
      description: 'Detected excess in checking, earning you +$8/month',
      rationale: 'Analysis shows optimization opportunity',
      type: 'optimization',
      potentialSaving: 8,
      steps: ['Transfer funds', 'Monitor monthly'],
      status: 'suggested',
    },
  ],
}

describe('DashboardScreen Component', () => {
  beforeEach(() => {
    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ insight: 'Test AI insight' }),
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Gen Z Profile Rendering', () => {
    test('renders Gen Z profile data correctly', async () => {
      render(<DashboardScreen {...mockGenzProps} />)
      
      // Wait for AI insight to load
      await waitFor(() => {
        expect(screen.queryByText('Test AI insight')).toBeInTheDocument()
      })
      
      // Check net worth calculation
      const netWorth = 8047 - 29700 // assets - liabilities
      expect(screen.getByText('Total Net Worth')).toBeInTheDocument()
      expect(screen.getByText('$-21,653.00')).toBeInTheDocument()
      
      // Check YOY growth for Gen Z
      expect(screen.getByText('8.5% YOY')).toBeInTheDocument()
    })

    test('displays Gen Z specific spending insights', () => {
      render(<DashboardScreen {...mockGenzProps} />)
      
      // Check spending total
      expect(screen.getByText('$2,100 spent this month')).toBeInTheDocument()
      
      // Check Gen Z specific alert
      expect(screen.getByText('Food & Dining Alert')).toBeInTheDocument()
      expect(screen.getByText("You're spending 12% more on food this month.")).toBeInTheDocument()
    })

    test('shows Gen Z credit score', () => {
      render(<DashboardScreen {...mockGenzProps} />)
      
      expect(screen.getByText('650')).toBeInTheDocument()
      expect(screen.getByText(/Credit utilization decreased/)).toBeInTheDocument()
    })
  })

  describe('Millennial Profile Rendering', () => {
    test('renders Millennial profile data correctly', async () => {
      render(<DashboardScreen {...mockMillennialProps} />)
      
      // Wait for AI insight to load
      await waitFor(() => {
        expect(screen.queryByText('Test AI insight')).toBeInTheDocument()
      })
      
      // Check net worth calculation
      const netWorth = 90500 - 16034 // assets - liabilities
      expect(screen.getByText('Total Net Worth')).toBeInTheDocument()
      expect(screen.getByText('$74,466.00')).toBeInTheDocument()
      
      // Check YOY growth for Millennial
      expect(screen.getByText('12.3% YOY')).toBeInTheDocument()
    })

    test('displays Millennial specific spending insights', () => {
      render(<DashboardScreen {...mockMillennialProps} />)
      
      // Check spending total
      expect(screen.getByText('$4,200 spent this month')).toBeInTheDocument()
      
      // Check Millennial specific alert
      expect(screen.getByText('Shopping Alert')).toBeInTheDocument()
      expect(screen.getByText("You're spending 17% more on shopping this month.")).toBeInTheDocument()
    })

    test('shows Millennial credit score', () => {
      render(<DashboardScreen {...mockMillennialProps} />)
      
      expect(screen.getByText('780')).toBeInTheDocument()
      expect(screen.getByText(/Payment history improved/)).toBeInTheDocument()
    })
  })

  describe('Profile-Specific AI Recommendations', () => {
    test('shows Gen Z specific AI actions', () => {
      render(<DashboardScreen {...mockGenzProps} />)
      
      expect(screen.getByText('Open High-Yield Savings')).toBeInTheDocument()
      expect(screen.getByText('Start earning 4.5% APY on your savings')).toBeInTheDocument()
      expect(screen.getByText('+$15/mo')).toBeInTheDocument()
    })

    test('shows Millennial specific AI actions', () => {
      render(<DashboardScreen {...mockMillennialProps} />)
      
      expect(screen.getByText('Move to High-Yield Savings')).toBeInTheDocument()
      expect(screen.getByText('Detected excess in checking, earning you +$8/month')).toBeInTheDocument()
      expect(screen.getByText('+$8/mo')).toBeInTheDocument()
    })

    test('expands AI action rationale on click', () => {
      render(<DashboardScreen {...mockGenzProps} />)
      
      // Click to expand rationale
      const expandButton = screen.getByText('Why we suggest this')
      fireEvent.click(expandButton)
      
      // Check Gen Z specific rationale appears
      expect(screen.getByText(/Your Chase savings account.*is earning 0.01% APY/)).toBeInTheDocument()
      expect(screen.getByText(/Chase savings balance: \$5,200/)).toBeInTheDocument()
    })
  })

  describe('Net Worth Calculation', () => {
    test('calculates Gen Z net worth correctly', () => {
      render(<DashboardScreen {...mockGenzProps} />)
      
      // Assets: 2847 + 5200 = 8047
      expect(screen.getByText('$8,047')).toBeInTheDocument()
      
      // Liabilities: 28500 + 1200 = 29700
      expect(screen.getByText('$29,700')).toBeInTheDocument()
      
      // Net Worth: 8047 - 29700 = -21653
      expect(screen.getByText('$-21,653.00')).toBeInTheDocument()
    })

    test('calculates Millennial net worth correctly', () => {
      render(<DashboardScreen {...mockMillennialProps} />)
      
      // Assets: 8500 + 45000 + 15000 + 22000 = 90500
      expect(screen.getByText('$90,500')).toBeInTheDocument()
      
      // Liabilities: 2234 + 1800 + 12000 = 16034
      expect(screen.getByText('$16,034')).toBeInTheDocument()
      
      // Net Worth: 90500 - 16034 = 74466
      expect(screen.getByText('$74,466.00')).toBeInTheDocument()
    })
  })

  describe('Navigation and Interactions', () => {
    test('navigates to profile screen on profile button click', () => {
      render(<DashboardScreen {...mockGenzProps} />)
      
      const profileButton = screen.getByRole('button', { name: /User/i })
      fireEvent.click(profileButton)
      
      expect(mockGenzProps.setCurrentScreen).toHaveBeenCalledWith('profile')
    })

    test('navigates to net worth detail on card click', () => {
      render(<DashboardScreen {...mockGenzProps} />)
      
      const netWorthCard = screen.getByText('Total Net Worth').closest('div')
      fireEvent.click(netWorthCard)
      
      expect(mockGenzProps.setCurrentScreen).toHaveBeenCalledWith('net-worth-detail')
    })

    test('navigates to spend tracking on insights card click', () => {
      render(<DashboardScreen {...mockGenzProps} />)
      
      const spendingCard = screen.getByText('Spending Insights').closest('div')
      fireEvent.click(spendingCard)
      
      expect(mockGenzProps.setCurrentScreen).toHaveBeenCalledWith('spend-tracking')
    })

    test('opens AI chat when clicking Dive Deep', () => {
      render(<DashboardScreen {...mockGenzProps} />)
      
      // Expand action first
      const expandButton = screen.getByText('Why we suggest this')
      fireEvent.click(expandButton)
      
      // Click Dive Deep
      const diveDeepButton = screen.getByText('Dive Deep')
      fireEvent.click(diveDeepButton)
      
      expect(mockGenzProps.setSelectedActionForChat).toHaveBeenCalledWith(mockGenzProps.aiActions[0])
      expect(mockGenzProps.setAIChatOpen).toHaveBeenCalledWith(true)
    })
  })

  describe('Loading and Error States', () => {
    test('handles AI insight loading state', () => {
      render(<DashboardScreen {...mockGenzProps} />)
      
      // AI Insights section should exist even while loading
      expect(screen.getByText('AI Insights')).toBeInTheDocument()
    })

    test('handles AI insight fetch error', async () => {
      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))
      
      render(<DashboardScreen {...mockGenzProps} />)
      
      await waitFor(() => {
        expect(screen.queryByText('Could not load AI insight at this time.')).toBeInTheDocument()
      })
    })
  })
})