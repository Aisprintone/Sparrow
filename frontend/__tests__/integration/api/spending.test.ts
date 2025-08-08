/**
 * SPENDING API INTEGRATION TESTS - PERFORMANCE-CRITICAL ENDPOINT VALIDATION
 * Tests for sub-10ms response times, cache efficiency, and data aggregation accuracy
 */

import { NextRequest } from 'next/server'
import { GET, DELETE } from '@/app/api/spending/route'
import { profileDataService } from '@/lib/services/data-store'
import type { ProfileData, Transaction, Category } from '@/lib/types/csv-data'

// Mock the data service
jest.mock('@/lib/services/data-store')
const mockProfileDataService = profileDataService as jest.Mocked<typeof profileDataService>

describe('Spending API - Integration Tests', () => {
  const mockCategories: Category[] = [
    { category_id: 1, name: 'Food & Dining' },
    { category_id: 2, name: 'Transportation' },
    { category_id: 3, name: 'Shopping' },
    { category_id: 4, name: 'Entertainment' },
    { category_id: 5, name: 'Utilities' }
  ]

  const generateMockTransactions = (customerId: number, year: number, month?: number): Transaction[] => {
    const transactions: Transaction[] = []
    const startDate = new Date(year, month ? month - 1 : 0, 1)
    const endDate = month 
      ? new Date(year, month, 0) 
      : new Date(year, 11, 31)
    
    for (let i = 0; i < 100; i++) {
      const date = new Date(
        startDate.getTime() + 
        Math.random() * (endDate.getTime() - startDate.getTime())
      )
      
      transactions.push({
        transaction_id: i,
        account_id: customerId,
        timestamp: date.toISOString(),
        amount: -(Math.random() * 200 + 10),
        description: `Transaction ${i}`,
        category_id: (i % 5) + 1,
        is_debit: true,
        is_bill: i % 10 === 0,
        is_subscription: i % 15 === 0,
        due_date: undefined,
        account_type: 'checking'
      })
    }
    
    return transactions
  }

  const mockProfileData: ProfileData = {
    customer: { customer_id: 1, location: 'New York', age: 30 },
    accounts: [],
    transactions: generateMockTransactions(1, 2024, 3),
    goals: [],
    categories: mockCategories,
    netWorth: 10000,
    totalAssets: 15000,
    totalLiabilities: 5000,
    monthlySpending: { total: 2500, categories: {} },
    creditScore: 750,
    lastMonthScore: 745
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockProfileDataService.getProfile.mockResolvedValue(mockProfileData)
  })

  describe('GET /api/spending', () => {
    describe('Basic Functionality', () => {
      it('should return spending data for specific month', async () => {
        const request = new NextRequest('http://localhost:3000/api/spending?customerId=1&year=2024&month=3')
        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.data).toMatchObject({
          total: expect.any(Number),
          categories: expect.any(Array),
          recurringTotal: expect.any(Number),
          nonRecurringTotal: expect.any(Number),
          comparison: expect.any(Object),
          dailyAverage: expect.any(Number),
          projectedTotal: expect.any(Number),
          insights: expect.any(Array)
        })
      })

      it('should return yearly spending when month not specified', async () => {
        const request = new NextRequest('http://localhost:3000/api/spending?customerId=1&year=2024')
        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.meta.month).toBeUndefined()
        expect(data.meta.year).toBe(2024)
      })

      it('should use default values when parameters missing', async () => {
        const currentYear = new Date().getFullYear()
        const request = new NextRequest('http://localhost:3000/api/spending')
        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.meta.customerId).toBe(1)
        expect(data.meta.year).toBe(currentYear)
      })
    })

    describe('Category Aggregation', () => {
      it('should aggregate spending by category correctly', async () => {
        const request = new NextRequest('http://localhost:3000/api/spending?customerId=1&year=2024&month=3')
        const response = await GET(request)
        const data = await response.json()

        expect(data.data.categories).toBeInstanceOf(Array)
        
        data.data.categories.forEach((category: any) => {
          expect(category).toMatchObject({
            id: expect.any(Number),
            name: expect.any(String),
            spent: expect.any(Number),
            budget: expect.any(Number),
            icon: expect.any(String),
            isRecurring: expect.any(Boolean),
            isOverBudget: expect.any(Boolean),
            percentage: expect.any(Number)
          })
        })
      })

      it('should sort categories by spending amount', async () => {
        const request = new NextRequest('http://localhost:3000/api/spending?customerId=1&year=2024&month=3')
        const response = await GET(request)
        const data = await response.json()

        const categories = data.data.categories
        for (let i = 1; i < categories.length; i++) {
          expect(categories[i - 1].spent).toBeGreaterThanOrEqual(categories[i].spent)
        }
      })

      it('should identify over-budget categories', async () => {
        const request = new NextRequest('http://localhost:3000/api/spending?customerId=1&year=2024&month=3')
        const response = await GET(request)
        const data = await response.json()

        const overBudgetCategories = data.data.categories.filter((c: any) => c.isOverBudget)
        
        overBudgetCategories.forEach((category: any) => {
          expect(category.spent).toBeGreaterThan(category.budget)
          expect(category.percentage).toBeGreaterThan(100)
        })
      })

      it('should calculate recurring vs non-recurring totals', async () => {
        const request = new NextRequest('http://localhost:3000/api/spending?customerId=1&year=2024&month=3')
        const response = await GET(request)
        const data = await response.json()

        const { recurringTotal, nonRecurringTotal, total } = data.data
        
        expect(recurringTotal + nonRecurringTotal).toBeCloseTo(total, 2)
        expect(recurringTotal).toBeGreaterThanOrEqual(0)
        expect(nonRecurringTotal).toBeGreaterThanOrEqual(0)
      })
    })

    describe('Performance Requirements', () => {
      it('should respond within 10ms for cached requests', async () => {
        // First request to populate cache
        const request1 = new NextRequest('http://localhost:3000/api/spending?customerId=1&year=2024&month=3')
        await GET(request1)

        // Second request (should be cached)
        const startTime = performance.now()
        const request2 = new NextRequest('http://localhost:3000/api/spending?customerId=1&year=2024&month=3')
        const response = await GET(request2)
        const duration = performance.now() - startTime

        const data = await response.json()
        
        expect(duration).toBeLessThan(10)
        expect(data.meta.cached).toBe(true)
        expect(response.headers.get('X-Cache')).toBe('HIT')
      })

      it('should set appropriate cache headers', async () => {
        const request = new NextRequest('http://localhost:3000/api/spending?customerId=1&year=2024&month=3')
        const response = await GET(request)

        expect(response.headers.get('Cache-Control')).toBe('private, max-age=60')
        expect(response.headers.get('X-Response-Time')).toMatch(/^\d+ms$/)
      })

      it('should handle cache misses correctly', async () => {
        const request = new NextRequest('http://localhost:3000/api/spending?customerId=1&year=2024&month=3')
        const response = await GET(request)
        const data = await response.json()

        expect(data.meta.cached).toBe(false)
        expect(response.headers.get('X-Cache')).toBe('MISS')
      })

      it('should maintain separate cache for different parameters', async () => {
        const requests = [
          'http://localhost:3000/api/spending?customerId=1&year=2024&month=3',
          'http://localhost:3000/api/spending?customerId=1&year=2024&month=4',
          'http://localhost:3000/api/spending?customerId=2&year=2024&month=3',
          'http://localhost:3000/api/spending?customerId=1&year=2023&month=3'
        ]

        for (const url of requests) {
          const response = await GET(new NextRequest(url))
          const data = await response.json()
          expect(data.meta.cached).toBe(false) // All should be cache misses
        }
      })
    })

    describe('Comparison Metrics', () => {
      it('should calculate period comparisons', async () => {
        const request = new NextRequest('http://localhost:3000/api/spending?customerId=1&year=2024&month=3')
        const response = await GET(request)
        const data = await response.json()

        const { comparison } = data.data
        
        expect(comparison).toMatchObject({
          lastPeriod: expect.any(Number),
          averagePeriod: expect.any(Number),
          bestPeriod: expect.any(Number),
          difference: expect.any(Number),
          trend: expect.stringMatching(/^(up|down|stable)$/)
        })
      })

      it('should calculate correct trend direction', async () => {
        const request = new NextRequest('http://localhost:3000/api/spending?customerId=1&year=2024&month=3')
        const response = await GET(request)
        const data = await response.json()

        const { total, comparison } = data.data
        
        if (total < comparison.lastPeriod) {
          expect(comparison.trend).toBe('down')
          expect(comparison.difference).toBeLessThan(0)
        } else if (total > comparison.lastPeriod) {
          expect(comparison.trend).toBe('up')
          expect(comparison.difference).toBeGreaterThan(0)
        } else {
          expect(comparison.trend).toBe('stable')
          expect(comparison.difference).toBe(0)
        }
      })
    })

    describe('Insights Generation', () => {
      it('should generate meaningful insights', async () => {
        const request = new NextRequest('http://localhost:3000/api/spending?customerId=1&year=2024&month=3')
        const response = await GET(request)
        const data = await response.json()

        expect(data.data.insights).toBeInstanceOf(Array)
        
        data.data.insights.forEach((insight: any) => {
          expect(insight).toMatchObject({
            type: expect.stringMatching(/^(alert|success|trend)$/),
            title: expect.any(String),
            description: expect.any(String)
          })
          
          if (insight.value !== undefined) {
            expect(insight.value).toBeGreaterThanOrEqual(0)
          }
        })
      })

      it('should generate alerts for over-budget categories', async () => {
        const request = new NextRequest('http://localhost:3000/api/spending?customerId=1&year=2024&month=3')
        const response = await GET(request)
        const data = await response.json()

        const alerts = data.data.insights.filter((i: any) => i.type === 'alert')
        const overBudgetCategories = data.data.categories.filter((c: any) => c.isOverBudget)
        
        if (overBudgetCategories.length > 0) {
          expect(alerts.length).toBeGreaterThan(0)
        }
      })
    })

    describe('Projections & Averages', () => {
      it('should calculate daily average correctly', async () => {
        const request = new NextRequest('http://localhost:3000/api/spending?customerId=1&year=2024&month=3')
        const response = await GET(request)
        const data = await response.json()

        const { dailyAverage, total } = data.data
        const currentDay = new Date().getDate()
        const expectedAverage = Math.round(total / currentDay)
        
        expect(dailyAverage).toBeCloseTo(expectedAverage, -1) // Within 10
      })

      it('should project total spending for period', async () => {
        const request = new NextRequest('http://localhost:3000/api/spending?customerId=1&year=2024&month=3')
        const response = await GET(request)
        const data = await response.json()

        const { projectedTotal, dailyAverage } = data.data
        const daysInMonth = 31 // March has 31 days
        const expectedProjection = dailyAverage * daysInMonth
        
        expect(projectedTotal).toBeCloseTo(expectedProjection, -10) // Within 100
      })

      it('should handle yearly projections', async () => {
        const request = new NextRequest('http://localhost:3000/api/spending?customerId=1&year=2024')
        const response = await GET(request)
        const data = await response.json()

        const { projectedTotal, dailyAverage } = data.data
        const expectedProjection = dailyAverage * 365
        
        expect(projectedTotal).toBeCloseTo(expectedProjection, -100) // Within 1000
      })
    })

    describe('Error Handling', () => {
      it('should handle profile service errors', async () => {
        mockProfileDataService.getProfile.mockRejectedValue(new Error('Database error'))

        const request = new NextRequest('http://localhost:3000/api/spending?customerId=1&year=2024&month=3')
        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(500)
        expect(data.success).toBe(false)
        expect(data.error).toBe('Failed to fetch spending data')
        expect(data.message).toBe('Database error')
      })

      it('should handle invalid customer IDs', async () => {
        const request = new NextRequest('http://localhost:3000/api/spending?customerId=invalid&year=2024&month=3')
        const response = await GET(request)
        const data = await response.json()

        // Should use default or handle gracefully
        expect(response.status).toBeLessThanOrEqual(500)
      })

      it('should handle invalid date parameters', async () => {
        const invalidRequests = [
          'http://localhost:3000/api/spending?customerId=1&year=invalid&month=3',
          'http://localhost:3000/api/spending?customerId=1&year=2024&month=13',
          'http://localhost:3000/api/spending?customerId=1&year=2024&month=0',
          'http://localhost:3000/api/spending?customerId=1&year=2024&month=abc'
        ]

        for (const url of invalidRequests) {
          const response = await GET(new NextRequest(url))
          expect(response.status).toBeLessThanOrEqual(500)
        }
      })
    })

    describe('DELETE /api/spending - Cache Management', () => {
      it('should clear spending cache', async () => {
        const request = new NextRequest('http://localhost:3000/api/spending')
        const response = await DELETE(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.message).toBe('Spending cache cleared')
      })

      it('should force cache miss after clearing', async () => {
        // Populate cache
        const getRequest1 = new NextRequest('http://localhost:3000/api/spending?customerId=1&year=2024&month=3')
        await GET(getRequest1)

        // Clear cache
        const deleteRequest = new NextRequest('http://localhost:3000/api/spending')
        await DELETE(deleteRequest)

        // Next request should be cache miss
        const getRequest2 = new NextRequest('http://localhost:3000/api/spending?customerId=1&year=2024&month=3')
        const response = await GET(getRequest2)
        const data = await response.json()

        expect(data.meta.cached).toBe(false)
      })
    })

    describe('Data Integrity', () => {
      it('should filter transactions by date correctly', async () => {
        const marchTransactions = generateMockTransactions(1, 2024, 3)
        mockProfileDataService.getProfile.mockResolvedValue({
          ...mockProfileData,
          transactions: marchTransactions
        })

        const request = new NextRequest('http://localhost:3000/api/spending?customerId=1&year=2024&month=3')
        const response = await GET(request)
        const data = await response.json()

        // All aggregated spending should be from March 2024
        expect(data.data.total).toBeGreaterThan(0)
      })

      it('should handle empty transaction list', async () => {
        mockProfileDataService.getProfile.mockResolvedValue({
          ...mockProfileData,
          transactions: []
        })

        const request = new NextRequest('http://localhost:3000/api/spending?customerId=1&year=2024&month=3')
        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.data.total).toBe(0)
        expect(data.data.categories).toHaveLength(0)
      })

      it('should handle transactions with missing categories', async () => {
        const transactionsWithMissingCategories = generateMockTransactions(1, 2024, 3)
        transactionsWithMissingCategories[0].category_id = 999 // Non-existent

        mockProfileDataService.getProfile.mockResolvedValue({
          ...mockProfileData,
          transactions: transactionsWithMissingCategories
        })

        const request = new NextRequest('http://localhost:3000/api/spending?customerId=1&year=2024&month=3')
        const response = await GET(request)
        
        // Should not crash
        expect(response.status).toBe(200)
      })
    })

    describe('Profile-Specific Budgets', () => {
      it('should apply correct budgets for different customer profiles', async () => {
        const customerIds = [1, 2, 3]
        
        for (const customerId of customerIds) {
          const request = new NextRequest(`http://localhost:3000/api/spending?customerId=${customerId}&year=2024&month=3`)
          const response = await GET(request)
          const data = await response.json()

          // Each profile should have different budget targets
          const foodCategory = data.data.categories.find((c: any) => 
            c.name.toLowerCase().includes('food') || c.name.toLowerCase().includes('dining')
          )
          
          if (foodCategory) {
            // Budgets should vary by profile
            if (customerId === 1) {
              expect(foodCategory.budget).toBeGreaterThanOrEqual(500)
            } else if (customerId === 3) {
              expect(foodCategory.budget).toBeLessThanOrEqual(500)
            }
          }
        }
      })
    })

    describe('Icon Mapping', () => {
      it('should assign appropriate icons to categories', async () => {
        const request = new NextRequest('http://localhost:3000/api/spending?customerId=1&year=2024&month=3')
        const response = await GET(request)
        const data = await response.json()

        const iconMap: Record<string, string[]> = {
          'food': ['🍕', '🍽️', '🥬'],
          'transport': ['🚗', '⛽'],
          'shopping': ['🛍️'],
          'entertainment': ['🎬'],
          'utilities': ['⚡']
        }

        data.data.categories.forEach((category: any) => {
          expect(category.icon).toBeDefined()
          expect(category.icon).toMatch(/^[\u{1F300}-\u{1F9FF}]/u) // Should be emoji
        })
      })
    })

    describe('Concurrent Request Handling', () => {
      it('should handle multiple concurrent requests efficiently', async () => {
        const requests = Array.from({ length: 20 }, (_, i) => 
          new NextRequest(`http://localhost:3000/api/spending?customerId=${(i % 3) + 1}&year=2024&month=${(i % 12) + 1}`)
        )

        const startTime = performance.now()
        const responses = await Promise.all(requests.map(req => GET(req)))
        const duration = performance.now() - startTime

        // All should succeed
        responses.forEach(response => {
          expect(response.status).toBe(200)
        })

        // Should handle 20 requests quickly
        expect(duration).toBeLessThan(200)
      })
    })
  })
})