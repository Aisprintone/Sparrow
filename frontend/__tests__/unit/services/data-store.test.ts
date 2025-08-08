/**
 * DATA STORE UNIT TESTS - CACHE INTEGRITY & PERFORMANCE VALIDATION
 * Ensures data consistency, cache behavior, and performance requirements
 */

import { profileDataService } from '@/lib/services/data-store'
import { CSVParser } from '@/lib/services/csv-parser'
import type { Customer, Account, Transaction, Category, Goal } from '@/lib/types/csv-data'

// Mock the CSV Parser
jest.mock('@/lib/services/csv-parser')
const MockCSVParser = CSVParser as jest.MockedClass<typeof CSVParser>

describe('ProfileDataService - Unit Tests', () => {
  let mockParser: jest.Mocked<CSVParser>
  
  // Test data fixtures
  const mockCustomers: Customer[] = [
    { customer_id: 1, location: 'New York', age: 30 },
    { customer_id: 2, location: 'Los Angeles', age: 35 },
    { customer_id: 3, location: 'Chicago', age: 22 }
  ]

  const mockAccounts: Account[] = [
    { 
      account_id: 1, 
      customer_id: 1, 
      institution_name: 'Bank A',
      account_number: '12345',
      account_type: 'checking',
      balance: 5000,
      created_at: '2023-01-01',
      credit_limit: undefined
    },
    { 
      account_id: 2, 
      customer_id: 1, 
      institution_name: 'Bank B',
      account_number: '67890',
      account_type: 'savings',
      balance: 10000,
      created_at: '2023-01-01',
      credit_limit: undefined
    },
    { 
      account_id: 3, 
      customer_id: 1, 
      institution_name: 'Credit Card Co',
      account_number: '11111',
      account_type: 'credit',
      balance: -2000,
      created_at: '2023-01-01',
      credit_limit: 5000
    },
    { 
      account_id: 4, 
      customer_id: 2, 
      institution_name: 'Bank C',
      account_number: '22222',
      account_type: 'checking',
      balance: 3000,
      created_at: '2023-01-01',
      credit_limit: undefined
    }
  ]

  const mockTransactions: Transaction[] = [
    {
      transaction_id: 1,
      account_id: 1,
      timestamp: new Date().toISOString(),
      amount: -100,
      description: 'Grocery Store',
      category_id: 1,
      is_debit: true,
      is_bill: false,
      is_subscription: false,
      due_date: undefined,
      account_type: 'checking'
    },
    {
      transaction_id: 2,
      account_id: 1,
      timestamp: new Date().toISOString(),
      amount: -50,
      description: 'Restaurant',
      category_id: 2,
      is_debit: true,
      is_bill: false,
      is_subscription: false,
      due_date: undefined,
      account_type: 'checking'
    },
    {
      transaction_id: 3,
      account_id: 1,
      timestamp: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(), // 35 days ago
      amount: -200,
      description: 'Old Transaction',
      category_id: 1,
      is_debit: true,
      is_bill: false,
      is_subscription: false,
      due_date: undefined,
      account_type: 'checking'
    }
  ]

  const mockCategories: Category[] = [
    { category_id: 1, name: 'Groceries' },
    { category_id: 2, name: 'Food & Dining' },
    { category_id: 3, name: 'Transportation' }
  ]

  const mockGoals: Goal[] = [
    {
      goal_id: 1,
      customer_id: 1,
      name: 'Emergency Fund',
      description: 'Build emergency savings',
      target_amount: 10000,
      target_date: '2024-12-31'
    },
    {
      goal_id: 2,
      customer_id: 1,
      name: 'Vacation',
      description: 'Trip to Europe',
      target_amount: 5000,
      target_date: '2024-06-30'
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Clear singleton cache
    profileDataService.clearCache()
    
    // Setup mock parser
    mockParser = new CSVParser() as jest.Mocked<CSVParser>
    MockCSVParser.mockImplementation(() => mockParser)
    
    mockParser.parseAllData.mockResolvedValue({
      customers: mockCustomers,
      accounts: mockAccounts,
      transactions: mockTransactions,
      categories: mockCategories,
      goals: mockGoals
    })
  })

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = profileDataService
      const instance2 = profileDataService
      expect(instance1).toBe(instance2)
    })
  })

  describe('getProfile - Core Functionality', () => {
    it('should return complete profile data for valid customer', async () => {
      const profile = await profileDataService.getProfile(1)
      
      expect(profile.customer).toEqual(mockCustomers[0])
      expect(profile.accounts).toHaveLength(3)
      expect(profile.transactions).toHaveLength(3)
      expect(profile.goals).toHaveLength(2)
      expect(profile.categories).toEqual(mockCategories)
    })

    it('should calculate net worth correctly', async () => {
      const profile = await profileDataService.getProfile(1)
      
      // Assets: 5000 + 10000 = 15000
      // Liabilities: 2000
      // Net Worth: 15000 - 2000 = 13000
      expect(profile.netWorth).toBe(13000)
      expect(profile.totalAssets).toBe(15000)
      expect(profile.totalLiabilities).toBe(2000)
    })

    it('should handle accounts with zero balance', async () => {
      const accountsWithZero = [...mockAccounts]
      accountsWithZero[0].balance = 0
      
      mockParser.parseAllData.mockResolvedValue({
        customers: mockCustomers,
        accounts: accountsWithZero,
        transactions: mockTransactions,
        categories: mockCategories,
        goals: mockGoals
      })
      
      const profile = await profileDataService.getProfile(1)
      
      expect(profile.totalAssets).toBe(10000)
      expect(profile.totalLiabilities).toBe(2000)
      expect(profile.netWorth).toBe(8000)
    })

    it('should calculate monthly spending correctly', async () => {
      const profile = await profileDataService.getProfile(1)
      
      // Only current month transactions: -100 and -50
      expect(profile.monthlySpending.total).toBe(150)
      expect(profile.monthlySpending.categories['Groceries']).toBe(100)
      expect(profile.monthlySpending.categories['Food & Dining']).toBe(50)
    })

    it('should filter transactions by current month', async () => {
      const profile = await profileDataService.getProfile(1)
      
      // Old transaction should not be included in monthly spending
      expect(profile.monthlySpending.categories['Groceries']).toBe(100) // Not 300
    })

    it('should handle transactions with no category', async () => {
      const transactionsWithNoCategory = [...mockTransactions]
      transactionsWithNoCategory[0].category_id = 999 // Non-existent category
      
      mockParser.parseAllData.mockResolvedValue({
        customers: mockCustomers,
        accounts: mockAccounts,
        transactions: transactionsWithNoCategory,
        categories: mockCategories,
        goals: mockGoals
      })
      
      const profile = await profileDataService.getProfile(1)
      
      expect(profile.monthlySpending.categories['Other']).toBe(100)
    })

    it('should return correct credit score data', async () => {
      const profile1 = await profileDataService.getProfile(1)
      expect(profile1.creditScore).toBe(780)
      expect(profile1.lastMonthScore).toBe(757)
      
      const profile2 = await profileDataService.getProfile(2)
      expect(profile2.creditScore).toBe(720)
      expect(profile2.lastMonthScore).toBe(710)
      
      const profile3 = await profileDataService.getProfile(3)
      expect(profile3.creditScore).toBe(650)
      expect(profile3.lastMonthScore).toBe(627)
    })

    it('should handle non-existent customer ID', async () => {
      await expect(profileDataService.getProfile(999)).rejects.toThrow('Customer with ID 999 not found')
    })

    it('should handle empty accounts', async () => {
      mockParser.parseAllData.mockResolvedValue({
        customers: mockCustomers,
        accounts: [],
        transactions: [],
        categories: mockCategories,
        goals: mockGoals
      })
      
      const profile = await profileDataService.getProfile(1)
      
      expect(profile.accounts).toHaveLength(0)
      expect(profile.transactions).toHaveLength(0)
      expect(profile.netWorth).toBe(0)
      expect(profile.totalAssets).toBe(0)
      expect(profile.totalLiabilities).toBe(0)
    })

    it('should handle negative net worth', async () => {
      const negativeAccounts = [
        { ...mockAccounts[2], balance: -10000, customer_id: 1 }
      ]
      
      mockParser.parseAllData.mockResolvedValue({
        customers: mockCustomers,
        accounts: negativeAccounts,
        transactions: [],
        categories: mockCategories,
        goals: mockGoals
      })
      
      const profile = await profileDataService.getProfile(1)
      
      expect(profile.netWorth).toBe(-10000)
      expect(profile.totalAssets).toBe(0)
      expect(profile.totalLiabilities).toBe(10000)
    })
  })

  describe('Caching Behavior', () => {
    it('should cache profile data after first fetch', async () => {
      const profile1 = await profileDataService.getProfile(1)
      const profile2 = await profileDataService.getProfile(1)
      
      // Parser should only be called once due to caching
      expect(mockParser.parseAllData).toHaveBeenCalledTimes(1)
      expect(profile1).toEqual(profile2)
    })

    it('should use separate cache for different customers', async () => {
      await profileDataService.getProfile(1)
      await profileDataService.getProfile(2)
      await profileDataService.getProfile(1) // Should use cache
      
      // Parser called only once (data cached), profiles computed separately
      expect(mockParser.parseAllData).toHaveBeenCalledTimes(1)
    })

    it('should respect cache TTL', async () => {
      const originalDateNow = Date.now
      let currentTime = Date.now()
      Date.now = jest.fn(() => currentTime)
      
      await profileDataService.getProfile(1)
      expect(mockParser.parseAllData).toHaveBeenCalledTimes(1)
      
      // Advance time beyond cache TTL (5 minutes)
      currentTime += 6 * 60 * 1000
      
      await profileDataService.getProfile(1)
      expect(mockParser.parseAllData).toHaveBeenCalledTimes(2)
      
      Date.now = originalDateNow
    })

    it('should clear profile cache when data is reloaded', async () => {
      await profileDataService.getProfile(1)
      
      // Simulate cache expiry and reload
      const originalDateNow = Date.now
      Date.now = jest.fn(() => Date.now() + 6 * 60 * 1000)
      
      // Change mock data for second load
      const updatedCustomers = [...mockCustomers]
      updatedCustomers[0].age = 31
      
      mockParser.parseAllData.mockResolvedValue({
        customers: updatedCustomers,
        accounts: mockAccounts,
        transactions: mockTransactions,
        categories: mockCategories,
        goals: mockGoals
      })
      
      const profile = await profileDataService.getProfile(1)
      expect(profile.customer.age).toBe(31)
      
      Date.now = originalDateNow
    })

    it('should handle cache clear correctly', async () => {
      await profileDataService.getProfile(1)
      expect(mockParser.parseAllData).toHaveBeenCalledTimes(1)
      
      profileDataService.clearCache()
      
      await profileDataService.getProfile(1)
      expect(mockParser.parseAllData).toHaveBeenCalledTimes(2)
    })
  })

  describe('getAllCustomers', () => {
    it('should return all customers', async () => {
      const customers = await profileDataService.getAllCustomers()
      
      expect(customers).toEqual(mockCustomers)
      expect(customers).toHaveLength(3)
    })

    it('should use cached data', async () => {
      await profileDataService.getAllCustomers()
      await profileDataService.getAllCustomers()
      
      expect(mockParser.parseAllData).toHaveBeenCalledTimes(1)
    })

    it('should handle empty customer list', async () => {
      mockParser.parseAllData.mockResolvedValue({
        customers: [],
        accounts: [],
        transactions: [],
        categories: [],
        goals: []
      })
      
      const customers = await profileDataService.getAllCustomers()
      expect(customers).toEqual([])
    })
  })

  describe('getProfileMetrics', () => {
    it('should return comprehensive metrics', async () => {
      const metrics = await profileDataService.getProfileMetrics(1)
      
      expect(metrics).toMatchObject({
        netWorth: 13000,
        totalAssets: 15000,
        totalLiabilities: 2000,
        monthlySpending: {
          total: 150,
          categories: expect.any(Object)
        },
        creditScore: 780,
        lastMonthScore: 757,
        accountsCount: 3,
        goalsCount: 2,
        transactionsThisMonth: 2
      })
    })

    it('should count transactions for current month only', async () => {
      const metrics = await profileDataService.getProfileMetrics(1)
      
      // Only 2 transactions are in current month
      expect(metrics.transactionsThisMonth).toBe(2)
    })

    it('should handle customer with no data', async () => {
      mockParser.parseAllData.mockResolvedValue({
        customers: [mockCustomers[0]],
        accounts: [],
        transactions: [],
        categories: [],
        goals: []
      })
      
      const metrics = await profileDataService.getProfileMetrics(1)
      
      expect(metrics).toMatchObject({
        netWorth: 0,
        totalAssets: 0,
        totalLiabilities: 0,
        accountsCount: 0,
        goalsCount: 0,
        transactionsThisMonth: 0
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle CSV parser errors gracefully', async () => {
      mockParser.parseAllData.mockRejectedValue(new Error('CSV parse error'))
      
      await expect(profileDataService.getProfile(1)).rejects.toThrow('CSV parse error')
    })

    it('should handle invalid customer ID types', async () => {
      await expect(profileDataService.getProfile(NaN)).rejects.toThrow()
      await expect(profileDataService.getProfile(-1)).rejects.toThrow()
    })

    it('should handle corrupted transaction data', async () => {
      const corruptedTransactions = [
        {
          ...mockTransactions[0],
          amount: NaN
        }
      ]
      
      mockParser.parseAllData.mockResolvedValue({
        customers: mockCustomers,
        accounts: mockAccounts,
        transactions: corruptedTransactions as any,
        categories: mockCategories,
        goals: mockGoals
      })
      
      const profile = await profileDataService.getProfile(1)
      
      // Should handle NaN gracefully
      expect(profile.monthlySpending.total).toBe(0)
    })
  })

  describe('Performance Tests', () => {
    it('should handle large datasets efficiently', async () => {
      // Generate large dataset
      const largeTransactions = Array.from({ length: 10000 }, (_, i) => ({
        transaction_id: i,
        account_id: 1,
        timestamp: new Date().toISOString(),
        amount: -Math.random() * 100,
        description: `Transaction ${i}`,
        category_id: (i % 3) + 1,
        is_debit: true,
        is_bill: false,
        is_subscription: false,
        due_date: undefined,
        account_type: 'checking' as const
      }))
      
      mockParser.parseAllData.mockResolvedValue({
        customers: mockCustomers,
        accounts: mockAccounts,
        transactions: largeTransactions,
        categories: mockCategories,
        goals: mockGoals
      })
      
      const startTime = Date.now()
      await profileDataService.getProfile(1)
      const duration = Date.now() - startTime
      
      expect(duration).toBeLessThan(100) // Should process in under 100ms
    })

    it('should cache computation results efficiently', async () => {
      const startTime1 = Date.now()
      await profileDataService.getProfile(1)
      const duration1 = Date.now() - startTime1
      
      const startTime2 = Date.now()
      await profileDataService.getProfile(1) // Cached
      const duration2 = Date.now() - startTime2
      
      // Cached call should be much faster
      expect(duration2).toBeLessThan(duration1 / 10)
    })

    it('should handle concurrent requests efficiently', async () => {
      const promises = Array.from({ length: 100 }, (_, i) => 
        profileDataService.getProfile((i % 3) + 1)
      )
      
      const startTime = Date.now()
      await Promise.all(promises)
      const duration = Date.now() - startTime
      
      expect(duration).toBeLessThan(200) // Should handle 100 requests in under 200ms
      expect(mockParser.parseAllData).toHaveBeenCalledTimes(1) // Data loaded only once
    })
  })

  describe('Data Integrity', () => {
    it('should maintain referential integrity', async () => {
      const profile = await profileDataService.getProfile(1)
      
      // All transactions should belong to customer's accounts
      profile.transactions.forEach(tx => {
        const accountExists = profile.accounts.some(acc => acc.account_id === tx.account_id)
        expect(accountExists).toBe(true)
      })
      
      // All goals should belong to the customer
      profile.goals.forEach(goal => {
        expect(goal.customer_id).toBe(1)
      })
    })

    it('should filter out orphaned transactions', async () => {
      const orphanedTransactions = [
        ...mockTransactions,
        {
          transaction_id: 999,
          account_id: 999, // Non-existent account
          timestamp: new Date().toISOString(),
          amount: -500,
          description: 'Orphaned',
          category_id: 1,
          is_debit: true,
          is_bill: false,
          is_subscription: false,
          due_date: undefined,
          account_type: 'checking'
        }
      ]
      
      mockParser.parseAllData.mockResolvedValue({
        customers: mockCustomers,
        accounts: mockAccounts,
        transactions: orphanedTransactions,
        categories: mockCategories,
        goals: mockGoals
      })
      
      const profile = await profileDataService.getProfile(1)
      
      // Orphaned transaction should be filtered out
      expect(profile.transactions).toHaveLength(3)
      expect(profile.transactions.find(tx => tx.transaction_id === 999)).toBeUndefined()
    })

    it('should handle circular references safely', async () => {
      // Create a scenario that could cause circular references
      const profile1 = await profileDataService.getProfile(1)
      const profile2 = await profileDataService.getProfile(1)
      
      // Modifying one should not affect the other
      profile1.customer.age = 999
      expect(profile2.customer.age).toBe(30)
    })
  })
})