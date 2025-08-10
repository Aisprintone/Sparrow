// Centralized profile data service following DRY/SOLID principles
// Single Responsibility: Profile data management
// Open/Closed: Extensible for new profiles
// Dependency Inversion: Abstract interface for data access

export interface Profile {
  id: number
  demographic: 'genz' | 'millennial' | 'midcareer'
  name: string
  age: number
  location: string
  accounts: Account[]
  metrics: {
    creditScore: number
    monthlyIncome: number
    netWorth: number
  }
  spending: {
    total: number
    topCategory: { name: string; amount: number }
    categories: SpendingCategory[]
  }
  highlights: string[]
}

export interface Account {
  id: number
  name: string
  institution: string
  balance: number
  icon: string
  type: "asset" | "liability"
}

export interface SpendingCategory {
  id: string
  name: string
  icon: string
  spent: number
  budget: number
  color: string
}

// Single source of truth for profile data
const PROFILES_DATA: Record<number, Profile> = {
  1: {
    id: 1,
    demographic: 'genz',
    name: 'Gen Z Student',
    age: 23,
    location: 'Austin, TX',
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
    metrics: {
      creditScore: 650,
      monthlyIncome: 3200,
      netWorth: -19000
    },
    spending: {
      total: 2100,
      topCategory: { name: "Food & Dining", amount: 450 },
      categories: [
        { id: "food", name: "Food & Dining", icon: "Utensils", spent: 450, budget: 400, color: "red" },
        { id: "transport", name: "Transportation", icon: "Car", spent: 180, budget: 200, color: "green" },
        { id: "entertainment", name: "Entertainment", icon: "Film", spent: 220, budget: 250, color: "green" },
        { id: "shopping", name: "Shopping", icon: "ShoppingCart", spent: 320, budget: 300, color: "red" },
      ]
    },
    highlights: [
      'Building credit history',
      'Managing student loans',
      'Starting investment journey'
    ]
  },
  2: {
    id: 2,
    demographic: 'millennial',
    name: 'Established Millennial',
    age: 34,
    location: 'New York, NY',
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
    metrics: {
      creditScore: 780,
      monthlyIncome: 8500,
      netWorth: 335000
    },
    spending: {
      total: 4200,
      topCategory: { name: "Housing", amount: 2200 },
      categories: [
        { id: "housing", name: "Housing", icon: "Home", spent: 2200, budget: 2500, color: "green" },
        { id: "groceries", name: "Groceries", icon: "Utensils", spent: 650, budget: 700, color: "green" },
        { id: "transport", name: "Transportation", icon: "Car", spent: 450, budget: 500, color: "green" },
        { id: "entertainment", name: "Entertainment", icon: "Film", spent: 380, budget: 400, color: "green" },
      ]
    },
    highlights: [
      'Homeowner with mortgage',
      'Investment portfolio growing',
      'Tax optimization strategies'
    ]
  },
  3: {
    id: 3,
    demographic: 'midcareer',
    name: 'Established Professional',
    age: 45,
    location: 'San Francisco, CA',
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
    metrics: {
      creditScore: 720,
      monthlyIncome: 5800,
      netWorth: 125000
    },
    spending: {
      total: 3400,
      topCategory: { name: "Housing", amount: 1400 },
      categories: [
        { id: "housing", name: "Housing", icon: "Home", spent: 1400, budget: 1500, color: "green" },
        { id: "food", name: "Food & Dining", icon: "Utensils", spent: 520, budget: 500, color: "red" },
        { id: "transport", name: "Transportation", icon: "Car", spent: 380, budget: 400, color: "green" },
        { id: "utilities", name: "Utilities", icon: "Zap", spent: 245, budget: 300, color: "green" },
      ]
    },
    highlights: [
      'Investment portfolio',
      'Tax optimization',
      'Retirement planning'
    ]
  }
}

// Service class following Single Responsibility Principle
export class ProfilesService {
  private static instance: ProfilesService

  private constructor() {}

  // Singleton pattern for consistent data access
  public static getInstance(): ProfilesService {
    if (!ProfilesService.instance) {
      ProfilesService.instance = new ProfilesService()
    }
    return ProfilesService.instance
  }

  // Get all profiles
  public getAllProfiles(): Profile[] {
    return Object.values(PROFILES_DATA)
  }

  // Get profile by ID
  public getProfileById(id: number): Profile | null {
    return PROFILES_DATA[id] || null
  }

  // Get profile by demographic
  public getProfileByDemographic(demographic: Profile['demographic']): Profile | null {
    return Object.values(PROFILES_DATA).find(profile => profile.demographic === demographic) || null
  }

  // Get available demographics
  public getAvailableDemographics(): Profile['demographic'][] {
    return [...new Set(Object.values(PROFILES_DATA).map(profile => profile.demographic))]
  }

  // Get profile IDs
  public getProfileIds(): number[] {
    return Object.keys(PROFILES_DATA).map(Number)
  }

  // Validate profile exists
  public profileExists(id: number): boolean {
    return id in PROFILES_DATA
  }
}

// Export singleton instance
export const profilesService = ProfilesService.getInstance()
