import { CSVParser } from './csv-parser'
import { FinancialCalculator } from './financial-calculator'
import type { Customer, Account, Transaction, Category, Goal, ProfileData, DataStore } from '@/lib/types/csv-data'

class ProfileDataService {
  private static instance: ProfileDataService
  private dataStore: DataStore | null = null
  private cache: Map<number, ProfileData> = new Map()
  private cacheTimestamp: number = 0
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes
  private isLoading: boolean = false
  private loadPromise: Promise<DataStore> | null = null

  private constructor() {}

  static getInstance(): ProfileDataService {
    if (!ProfileDataService.instance) {
      ProfileDataService.instance = new ProfileDataService()
    }
    return ProfileDataService.instance
  }

  private async loadData(): Promise<DataStore> {
    // Return cached data if available and fresh
    if (this.dataStore && Date.now() - this.cacheTimestamp < this.CACHE_TTL) {
      return this.dataStore
    }

    // If already loading, wait for the existing promise
    if (this.loadPromise) {
      return this.loadPromise
    }

    // Start new load
    this.isLoading = true
    this.loadPromise = this.performDataLoad()

    try {
      const result = await this.loadPromise
      this.isLoading = false
      this.loadPromise = null
      return result
    } catch (error) {
      this.isLoading = false
      this.loadPromise = null
      throw error
    }
  }

  private async performDataLoad(): Promise<DataStore> {
    const startTime = performance.now()
    console.log('🔄 Loading CSV data...')

    try {
      const parser = new CSVParser()
      const rawData = await parser.parseAllData()

      this.dataStore = {
        customers: rawData.customers,
        accounts: rawData.accounts,
        transactions: rawData.transactions,
        categories: rawData.categories,
        goals: rawData.goals,
        profiles: new Map()
      }

      this.cacheTimestamp = Date.now()
      this.cache.clear() // Clear profile cache when reloading data
      
      const loadTime = performance.now() - startTime
      console.log(`✅ Data loaded successfully in ${loadTime.toFixed(2)}ms`)
      console.log(`   - Customers: ${rawData.customers.length}`)
      console.log(`   - Accounts: ${rawData.accounts.length}`)
      console.log(`   - Transactions: ${rawData.transactions.length}`)
      
      return this.dataStore
    } catch (error) {
      console.error('❌ Failed to load data:', error)
      throw error
    }
  }

  private calculateNetWorth(accounts: Account[]): { netWorth: number; totalAssets: number; totalLiabilities: number } {
    let totalAssets = 0
    let totalLiabilities = 0

    for (const account of accounts) {
      if (account.balance >= 0) {
        totalAssets += account.balance
      } else {
        totalLiabilities += Math.abs(account.balance)
      }
    }

    return {
      netWorth: totalAssets - totalLiabilities,
      totalAssets,
      totalLiabilities
    }
  }

  private calculateMonthlySpending(transactions: Transaction[], categories: Category[]): { total: number; categories: Record<string, number> } {
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth()
    const currentYear = currentDate.getFullYear()

    const monthlyTransactions = transactions.filter(tx => {
      const txDate = new Date(tx.timestamp)
      return txDate.getMonth() === currentMonth && 
             txDate.getFullYear() === currentYear &&
             tx.is_debit && tx.amount < 0
    })

    const spendingByCategory: Record<string, number> = {}
    let total = 0

    for (const tx of monthlyTransactions) {
      const category = categories.find(cat => cat.category_id === tx.category_id)
      const categoryName = category?.name || 'Other'
      const amount = Math.abs(tx.amount)
      
      spendingByCategory[categoryName] = (spendingByCategory[categoryName] || 0) + amount
      total += amount
    }

    return {
      total,
      categories: spendingByCategory
    }
  }

  private getCreditScoreData(customer: Customer, accounts: Account[], transactions: Transaction[]): { creditScore: number; lastMonthScore: number } {
    // Use the new financial calculator for accurate credit score
    const calculator = new FinancialCalculator(
      accounts,
      transactions,
      this.dataStore!.categories,
      customer
    )
    
    const metrics = calculator.calculateMetrics()
    
    // For last month score, apply a small variation
    const lastMonthScore = Math.round(metrics.creditScore - (Math.random() * 30 - 15))
    
    return { 
      creditScore: metrics.creditScore, 
      lastMonthScore: Math.max(300, Math.min(850, lastMonthScore)) 
    }
  }

  private async computeProfileData(customerId: number): Promise<ProfileData> {
    // Check cache first
    if (this.cache.has(customerId)) {
      return this.cache.get(customerId)!
    }

    const data = await this.loadData()
    
    const customer = data.customers.find(c => c.customer_id === customerId)
    if (!customer) {
      throw new Error(`Customer with ID ${customerId} not found`)
    }

    const accounts = data.accounts.filter(a => a.customer_id === customerId)
    const transactions = data.transactions.filter(t => {
      const account = accounts.find(a => a.account_id === t.account_id)
      return !!account
    })
    const goals = data.goals.filter(g => g.customer_id === customerId)

    // Use the new financial calculator for all metrics
    const calculator = new FinancialCalculator(
      accounts,
      transactions,
      data.categories,
      customer
    )
    
    const metrics = calculator.calculateMetrics()
    const { creditScore, lastMonthScore } = this.getCreditScoreData(customer, accounts, transactions)
    
    const { netWorth, totalAssets, totalLiabilities } = this.calculateNetWorth(accounts)
    const monthlySpending = this.calculateMonthlySpending(transactions, data.categories)

    const profile: ProfileData = {
      customer,
      accounts,
      transactions,
      goals,
      categories: data.categories,
      netWorth,
      totalAssets,
      totalLiabilities,
      monthlySpending,
      creditScore,
      lastMonthScore
    }

    // Cache the computed profile
    this.cache.set(customerId, profile)
    
    return profile
  }

  async getProfile(customerId: number): Promise<ProfileData> {
    try {
      return await this.computeProfileData(customerId)
    } catch (error) {
      console.error(`Error getting profile for customer ${customerId}:`, error)
      throw error
    }
  }

  async getAllCustomers(): Promise<Customer[]> {
    const data = await this.loadData()
    return data.customers
  }

  async getProfileMetrics(customerId: number) {
    const profile = await this.getProfile(customerId)
    
    return {
      netWorth: profile.netWorth,
      totalAssets: profile.totalAssets,
      totalLiabilities: profile.totalLiabilities,
      monthlySpending: profile.monthlySpending,
      creditScore: profile.creditScore,
      lastMonthScore: profile.lastMonthScore,
      accountsCount: profile.accounts.length,
      goalsCount: profile.goals.length,
      transactionsThisMonth: profile.transactions.filter(tx => {
        const txDate = new Date(tx.timestamp)
        const now = new Date()
        return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear()
      }).length
    }
  }

  // Clear cache manually if needed
  clearCache(): void {
    this.cache.clear()
    this.cacheTimestamp = 0
  }
}

export const profileDataService = ProfileDataService.getInstance()