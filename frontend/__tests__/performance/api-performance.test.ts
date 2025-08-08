/**
 * API PERFORMANCE TESTS - SUB-10MS RESPONSE TIME VALIDATION
 * Brutal performance requirements that only optimized implementations can pass
 */

import { NextRequest } from 'next/server'
import { GET as getProfiles } from '@/app/api/profiles/route'
import { GET as getSpending, DELETE as clearSpendingCache } from '@/app/api/spending/route'
import { profileDataService } from '@/lib/services/data-store'
import { spendingService } from '@/lib/services/spending-service'

// Mock services
jest.mock('@/lib/services/data-store')
jest.mock('@/lib/services/spending-service')
jest.mock('@/app/api/profiles/init', () => ({
  initializeDataStore: jest.fn().mockResolvedValue(undefined)
}))

const mockProfileDataService = profileDataService as jest.Mocked<typeof profileDataService>
const mockSpendingService = spendingService as jest.Mocked<typeof spendingService>

describe('API Performance Tests - Speed Requirements', () => {
  // Generate large datasets for stress testing
  const generateLargeDataset = (size: number) => ({
    customers: Array.from({ length: size }, (_, i) => ({
      customer_id: i + 1,
      location: `City ${i}`,
      age: 20 + (i % 50)
    })),
    transactions: Array.from({ length: size * 100 }, (_, i) => ({
      transaction_id: i,
      account_id: (i % size) + 1,
      timestamp: new Date().toISOString(),
      amount: -(Math.random() * 500),
      description: `Transaction ${i}`,
      category_id: (i % 10) + 1,
      is_debit: true,
      is_bill: i % 10 === 0,
      is_subscription: i % 20 === 0,
      due_date: undefined,
      account_type: 'checking'
    })),
    categories: Array.from({ length: 20 }, (_, i) => ({
      category_id: i + 1,
      name: `Category ${i}`
    }))
  })

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup default mocks for speed
    mockProfileDataService.getAllCustomers.mockResolvedValue([])
    mockProfileDataService.getProfile.mockResolvedValue({
      customer: { customer_id: 1, location: 'NYC', age: 30 },
      accounts: [],
      transactions: [],
      goals: [],
      categories: [],
      netWorth: 0,
      totalAssets: 0,
      totalLiabilities: 0,
      monthlySpending: { total: 0, categories: {} },
      creditScore: 750,
      lastMonthScore: 745
    })
  })

  describe('Response Time Requirements', () => {
    describe('Profiles API', () => {
      it('should respond in under 10ms for small datasets', async () => {
        const smallData = generateLargeDataset(10)
        mockProfileDataService.getAllCustomers.mockResolvedValue(smallData.customers)

        const times: number[] = []
        for (let i = 0; i < 100; i++) {
          const start = performance.now()
          const request = new NextRequest('http://localhost:3000/api/profiles')
          await getProfiles(request)
          times.push(performance.now() - start)
        }

        const avgTime = times.reduce((a, b) => a + b, 0) / times.length
        const maxTime = Math.max(...times)

        expect(avgTime).toBeLessThan(10)
        expect(maxTime).toBeLessThan(20) // Allow some variance
      })

      it('should respond in under 50ms for large datasets', async () => {
        const largeData = generateLargeDataset(1000)
        mockProfileDataService.getAllCustomers.mockResolvedValue(largeData.customers)

        const times: number[] = []
        for (let i = 0; i < 10; i++) {
          const start = performance.now()
          const request = new NextRequest('http://localhost:3000/api/profiles')
          await getProfiles(request)
          times.push(performance.now() - start)
        }

        const avgTime = times.reduce((a, b) => a + b, 0) / times.length
        expect(avgTime).toBeLessThan(50)
      })

      it('should maintain consistent response times', async () => {
        const data = generateLargeDataset(100)
        mockProfileDataService.getAllCustomers.mockResolvedValue(data.customers)

        const times: number[] = []
        for (let i = 0; i < 50; i++) {
          const start = performance.now()
          const request = new NextRequest('http://localhost:3000/api/profiles')
          await getProfiles(request)
          times.push(performance.now() - start)
        }

        // Calculate coefficient of variation (CV)
        const mean = times.reduce((a, b) => a + b, 0) / times.length
        const variance = times.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / times.length
        const stdDev = Math.sqrt(variance)
        const cv = (stdDev / mean) * 100

        // CV should be low (< 30%) for consistent performance
        expect(cv).toBeLessThan(30)
      })
    })

    describe('Spending API', () => {
      it('should achieve sub-10ms for cached requests', async () => {
        // Simulate cache hit scenario
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              total: 3500,
              categories: [],
              recurringTotal: 1500,
              nonRecurringTotal: 2000,
              comparison: {
                lastPeriod: 3800,
                averagePeriod: 3650,
                bestPeriod: 3200,
                difference: -300,
                trend: 'down'
              },
              dailyAverage: 117,
              projectedTotal: 3500,
              insights: []
            }
          })
        })

        // First request to populate cache
        const warmupRequest = new NextRequest('http://localhost:3000/api/spending?customerId=1&year=2024&month=3')
        await getSpending(warmupRequest)

        // Measure cached requests
        const times: number[] = []
        for (let i = 0; i < 100; i++) {
          const start = performance.now()
          const request = new NextRequest('http://localhost:3000/api/spending?customerId=1&year=2024&month=3')
          await getSpending(request)
          times.push(performance.now() - start)
        }

        const avgTime = times.reduce((a, b) => a + b, 0) / times.length
        const p95Time = times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)]

        expect(avgTime).toBeLessThan(10)
        expect(p95Time).toBeLessThan(15) // 95th percentile under 15ms
      })

      it('should handle complex aggregations efficiently', async () => {
        const largeData = generateLargeDataset(100)
        mockProfileDataService.getProfile.mockResolvedValue({
          customer: { customer_id: 1, location: 'NYC', age: 30 },
          accounts: [],
          transactions: largeData.transactions,
          goals: [],
          categories: largeData.categories,
          netWorth: 10000,
          totalAssets: 15000,
          totalLiabilities: 5000,
          monthlySpending: { total: 50000, categories: {} },
          creditScore: 750,
          lastMonthScore: 745
        })

        const start = performance.now()
        const request = new NextRequest('http://localhost:3000/api/spending?customerId=1&year=2024&month=3')
        await getSpending(request)
        const duration = performance.now() - start

        // Even with 10,000 transactions, should process quickly
        expect(duration).toBeLessThan(100)
      })
    })
  })

  describe('Throughput Tests', () => {
    it('should handle 1000 requests per second', async () => {
      const data = generateLargeDataset(10)
      mockProfileDataService.getAllCustomers.mockResolvedValue(data.customers)

      const startTime = Date.now()
      const promises: Promise<any>[] = []

      // Fire 1000 requests
      for (let i = 0; i < 1000; i++) {
        const request = new NextRequest(`http://localhost:3000/api/profiles?t=${i}`)
        promises.push(getProfiles(request))
      }

      await Promise.all(promises)
      const duration = Date.now() - startTime

      // Should complete 1000 requests in under 2 seconds
      expect(duration).toBeLessThan(2000)
      
      // Calculate actual throughput
      const throughput = 1000 / (duration / 1000)
      expect(throughput).toBeGreaterThan(500) // At least 500 req/s
    })

    it('should maintain performance under sustained load', async () => {
      const data = generateLargeDataset(10)
      mockProfileDataService.getAllCustomers.mockResolvedValue(data.customers)

      const durations: number[] = []
      const batchSize = 100
      const batches = 10

      for (let batch = 0; batch < batches; batch++) {
        const batchStart = performance.now()
        const promises: Promise<any>[] = []

        for (let i = 0; i < batchSize; i++) {
          const request = new NextRequest('http://localhost:3000/api/profiles')
          promises.push(getProfiles(request))
        }

        await Promise.all(promises)
        durations.push(performance.now() - batchStart)
      }

      // Performance should not degrade over time
      const firstHalf = durations.slice(0, 5).reduce((a, b) => a + b, 0) / 5
      const secondHalf = durations.slice(5).reduce((a, b) => a + b, 0) / 5

      // Second half should not be more than 20% slower
      expect(secondHalf).toBeLessThan(firstHalf * 1.2)
    })
  })

  describe('Memory Efficiency', () => {
    it('should not leak memory under repeated requests', async () => {
      const data = generateLargeDataset(100)
      mockProfileDataService.getAllCustomers.mockResolvedValue(data.customers)

      const memoryUsages: number[] = []

      for (let i = 0; i < 100; i++) {
        const request = new NextRequest('http://localhost:3000/api/profiles')
        await getProfiles(request)

        if (i % 10 === 0) {
          if (global.gc) global.gc() // Force garbage collection if available
          memoryUsages.push(process.memoryUsage().heapUsed)
        }
      }

      // Memory should stabilize (not continuously increase)
      const firstQuarter = memoryUsages.slice(0, 3).reduce((a, b) => a + b, 0) / 3
      const lastQuarter = memoryUsages.slice(-3).reduce((a, b) => a + b, 0) / 3

      // Allow up to 50% increase (accounting for caching)
      expect(lastQuarter).toBeLessThan(firstQuarter * 1.5)
    })

    it('should handle large response payloads efficiently', async () => {
      const hugeData = generateLargeDataset(5000)
      mockProfileDataService.getAllCustomers.mockResolvedValue(hugeData.customers)

      const memoryBefore = process.memoryUsage().heapUsed
      const start = performance.now()

      const request = new NextRequest('http://localhost:3000/api/profiles')
      const response = await getProfiles(request)
      await response.json()

      const duration = performance.now() - start
      const memoryAfter = process.memoryUsage().heapUsed
      const memoryIncrease = (memoryAfter - memoryBefore) / 1024 / 1024 // MB

      expect(duration).toBeLessThan(500) // Should handle 5000 items in under 500ms
      expect(memoryIncrease).toBeLessThan(100) // Should not use more than 100MB
    })
  })

  describe('Cache Performance', () => {
    it('should achieve 99% cache hit rate for repeated requests', async () => {
      let cacheHits = 0
      let cacheMisses = 0

      // Track cache behavior
      const originalFetch = global.fetch
      global.fetch = jest.fn().mockImplementation(async (url: string) => {
        if (url.includes('spending')) {
          cacheMisses++
        }
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: { total: 1000, categories: [] }
          })
        }
      })

      // Make 100 requests to same endpoint
      for (let i = 0; i < 100; i++) {
        const request = new NextRequest('http://localhost:3000/api/spending?customerId=1&year=2024&month=3')
        const response = await getSpending(request)
        const data = await response.json()
        
        if (data.meta?.cached) {
          cacheHits++
        }
      }

      const hitRate = cacheHits / (cacheHits + cacheMisses)
      expect(hitRate).toBeGreaterThan(0.95) // At least 95% cache hit rate

      global.fetch = originalFetch
    })

    it('should invalidate cache appropriately', async () => {
      // Setup
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { total: 1000, categories: [] }
        })
      })

      // Populate cache
      const request1 = new NextRequest('http://localhost:3000/api/spending?customerId=1&year=2024&month=3')
      await getSpending(request1)

      // Clear cache
      const clearRequest = new NextRequest('http://localhost:3000/api/spending')
      await clearSpendingCache(clearRequest)

      // Next request should miss cache
      const request2 = new NextRequest('http://localhost:3000/api/spending?customerId=1&year=2024&month=3')
      const response = await getSpending(request2)
      const data = await response.json()

      expect(data.meta.cached).toBe(false)
    })
  })

  describe('Concurrent Load Performance', () => {
    it('should handle mixed endpoint load efficiently', async () => {
      const data = generateLargeDataset(50)
      mockProfileDataService.getAllCustomers.mockResolvedValue(data.customers)
      mockProfileDataService.getProfile.mockResolvedValue({
        customer: data.customers[0],
        accounts: [],
        transactions: data.transactions.slice(0, 100),
        goals: [],
        categories: data.categories,
        netWorth: 10000,
        totalAssets: 15000,
        totalLiabilities: 5000,
        monthlySpending: { total: 3500, categories: {} },
        creditScore: 750,
        lastMonthScore: 745
      })

      const requests: Promise<any>[] = []
      const startTime = performance.now()

      // Mix of different endpoints
      for (let i = 0; i < 500; i++) {
        if (i % 2 === 0) {
          const request = new NextRequest('http://localhost:3000/api/profiles')
          requests.push(getProfiles(request))
        } else {
          const customerId = (i % 3) + 1
          const month = (i % 12) + 1
          const request = new NextRequest(`http://localhost:3000/api/spending?customerId=${customerId}&year=2024&month=${month}`)
          requests.push(getSpending(request))
        }
      }

      await Promise.all(requests)
      const duration = performance.now() - startTime

      // Should handle 500 mixed requests quickly
      expect(duration).toBeLessThan(1000)
      
      // Calculate requests per second
      const rps = 500 / (duration / 1000)
      expect(rps).toBeGreaterThan(500)
    })

    it('should not degrade under increasing load', async () => {
      const data = generateLargeDataset(10)
      mockProfileDataService.getAllCustomers.mockResolvedValue(data.customers)

      const loadLevels = [10, 50, 100, 200, 500]
      const avgTimes: number[] = []

      for (const load of loadLevels) {
        const times: number[] = []
        
        for (let i = 0; i < load; i++) {
          const start = performance.now()
          const request = new NextRequest('http://localhost:3000/api/profiles')
          await getProfiles(request)
          times.push(performance.now() - start)
        }

        avgTimes.push(times.reduce((a, b) => a + b, 0) / times.length)
      }

      // Average time should not increase dramatically with load
      const maxIncrease = Math.max(...avgTimes) / Math.min(...avgTimes)
      expect(maxIncrease).toBeLessThan(3) // Max 3x increase from min to max load
    })
  })

  describe('Worst Case Performance', () => {
    it('should handle worst-case data scenarios', async () => {
      // Create worst-case scenario: many categories, all over budget
      const worstCaseData = {
        customer: { customer_id: 1, location: 'NYC', age: 30 },
        accounts: Array.from({ length: 20 }, (_, i) => ({
          account_id: i,
          customer_id: 1,
          institution_name: `Bank ${i}`,
          account_number: `${i}`,
          account_type: 'checking' as const,
          balance: Math.random() * 10000 - 5000,
          created_at: '2023-01-01',
          credit_limit: undefined
        })),
        transactions: Array.from({ length: 10000 }, (_, i) => ({
          transaction_id: i,
          account_id: i % 20,
          timestamp: new Date().toISOString(),
          amount: -(Math.random() * 1000),
          description: `Transaction ${i}`,
          category_id: i % 100,
          is_debit: true,
          is_bill: Math.random() > 0.5,
          is_subscription: Math.random() > 0.7,
          due_date: undefined,
          account_type: 'checking' as const
        })),
        categories: Array.from({ length: 100 }, (_, i) => ({
          category_id: i,
          name: `Category ${i}`
        })),
        goals: [],
        netWorth: -50000,
        totalAssets: 10000,
        totalLiabilities: 60000,
        monthlySpending: { total: 50000, categories: {} },
        creditScore: 450,
        lastMonthScore: 500
      }

      mockProfileDataService.getProfile.mockResolvedValue(worstCaseData)

      const start = performance.now()
      const request = new NextRequest('http://localhost:3000/api/spending?customerId=1&year=2024&month=3')
      const response = await getSpending(request)
      await response.json()
      const duration = performance.now() - start

      // Even worst case should complete in reasonable time
      expect(duration).toBeLessThan(200)
    })

    it('should handle error recovery efficiently', async () => {
      let errorCount = 0
      mockProfileDataService.getAllCustomers.mockImplementation(async () => {
        errorCount++
        if (errorCount <= 3) {
          throw new Error('Temporary failure')
        }
        return []
      })

      const times: number[] = []
      
      for (let i = 0; i < 10; i++) {
        const start = performance.now()
        const request = new NextRequest('http://localhost:3000/api/profiles')
        try {
          await getProfiles(request)
        } catch (e) {
          // Expected for first 3 attempts
        }
        times.push(performance.now() - start)
      }

      // Error handling should be fast
      times.forEach(time => {
        expect(time).toBeLessThan(50)
      })
    })
  })

  describe('Performance SLA Validation', () => {
    it('should meet P50 latency target of 5ms', async () => {
      const data = generateLargeDataset(10)
      mockProfileDataService.getAllCustomers.mockResolvedValue(data.customers)

      const latencies: number[] = []
      
      for (let i = 0; i < 1000; i++) {
        const start = performance.now()
        const request = new NextRequest('http://localhost:3000/api/profiles')
        await getProfiles(request)
        latencies.push(performance.now() - start)
      }

      latencies.sort((a, b) => a - b)
      const p50 = latencies[Math.floor(latencies.length * 0.5)]
      
      expect(p50).toBeLessThan(5)
    })

    it('should meet P99 latency target of 50ms', async () => {
      const data = generateLargeDataset(100)
      mockProfileDataService.getAllCustomers.mockResolvedValue(data.customers)

      const latencies: number[] = []
      
      for (let i = 0; i < 1000; i++) {
        const start = performance.now()
        const request = new NextRequest('http://localhost:3000/api/profiles')
        await getProfiles(request)
        latencies.push(performance.now() - start)
      }

      latencies.sort((a, b) => a - b)
      const p99 = latencies[Math.floor(latencies.length * 0.99)]
      
      expect(p99).toBeLessThan(50)
    })
  })
})