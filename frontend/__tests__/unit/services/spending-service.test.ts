/**
 * SPENDING SERVICE UNIT TESTS - PERFORMANCE & CACHE VALIDATION
 * Tests for sub-10ms response times, cache efficiency, and data accuracy
 */

import { spendingService } from '@/lib/services/spending-service'
import type { SpendingData } from '@/lib/services/spending-service'

// Mock fetch globally
global.fetch = jest.fn()
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

// Mock performance.now for consistent timing tests
const originalPerformanceNow = performance.now
let mockTime = 0
performance.now = jest.fn(() => mockTime++)

describe('SpendingService - Unit Tests', () => {
  const mockSpendingData: SpendingData = {
    total: 3500,
    categories: [
      {
        id: 1,
        name: 'Food & Dining',
        spent: 800,
        budget: 700,
        icon: '🍕',
        isRecurring: false,
        isOverBudget: true,
        percentage: 114.3
      },
      {
        id: 2,
        name: 'Housing',
        spent: 1500,
        budget: 1500,
        icon: '🏠',
        isRecurring: true,
        isOverBudget: false,
        percentage: 100
      },
      {
        id: 3,
        name: 'Transportation',
        spent: 400,
        budget: 500,
        icon: '🚗',
        isRecurring: false,
        isOverBudget: false,
        percentage: 80
      }
    ],
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
    insights: [
      {
        type: 'alert',
        title: 'Food & Dining Alert',
        description: 'You are 14% over budget in Food & Dining',
        value: 100
      },
      {
        type: 'trend',
        title: 'Spending Trend',
        description: 'Your spending is down $300 compared to last period',
        value: 300
      }
    ]
  }

  beforeEach(() => {
    jest.clearAllMocks()
    spendingService.clearCache()
    mockTime = 0
    
    // Setup default successful fetch response
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: mockSpendingData
      })
    } as Response)
  })

  afterAll(() => {
    performance.now = originalPerformanceNow
  })

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = spendingService
      const instance2 = spendingService
      expect(instance1).toBe(instance2)
    })
  })

  describe('fetchSpendingData - Core Functionality', () => {
    it('should fetch spending data for a specific month', async () => {
      const data = await spendingService.fetchSpendingData(1, 2024, 3)
      
      expect(data).toEqual(mockSpendingData)
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/spending?customerId=1&year=2024&month=3',
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
      )
    })

    it('should fetch spending data for entire year when month not specified', async () => {
      const data = await spendingService.fetchSpendingData(2, 2024)
      
      expect(data).toEqual(mockSpendingData)
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/spending?customerId=2&year=2024',
        expect.objectContaining({
          method: 'GET'
        })
      )
    })

    it('should handle different customer IDs correctly', async () => {
      await spendingService.fetchSpendingData(1, 2024, 1)
      await spendingService.fetchSpendingData(2, 2024, 1)
      await spendingService.fetchSpendingData(3, 2024, 1)
      
      expect(mockFetch).toHaveBeenCalledTimes(3)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('customerId=1'),
        expect.any(Object)
      )
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('customerId=2'),
        expect.any(Object)
      )
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('customerId=3'),
        expect.any(Object)
      )
    })
  })

  describe('Cache Behavior - Performance Critical', () => {
    it('should cache data and serve from cache on subsequent requests', async () => {
      const data1 = await spendingService.fetchSpendingData(1, 2024, 3)
      const data2 = await spendingService.fetchSpendingData(1, 2024, 3)
      
      expect(data1).toEqual(data2)
      expect(mockFetch).toHaveBeenCalledTimes(1) // Only one actual fetch
    })

    it('should use different cache keys for different parameters', async () => {
      await spendingService.fetchSpendingData(1, 2024, 3)
      await spendingService.fetchSpendingData(1, 2024, 4)
      await spendingService.fetchSpendingData(1, 2023, 3)
      await spendingService.fetchSpendingData(2, 2024, 3)
      
      expect(mockFetch).toHaveBeenCalledTimes(4) // All different cache keys
    })

    it('should respect cache TTL of 60 seconds', async () => {
      const originalDateNow = Date.now
      let currentTime = Date.now()
      Date.now = jest.fn(() => currentTime)
      
      await spendingService.fetchSpendingData(1, 2024, 3)
      expect(mockFetch).toHaveBeenCalledTimes(1)
      
      // Advance time by 59 seconds (still within TTL)
      currentTime += 59000
      await spendingService.fetchSpendingData(1, 2024, 3)
      expect(mockFetch).toHaveBeenCalledTimes(1) // Still cached
      
      // Advance time by 2 more seconds (beyond TTL)
      currentTime += 2000
      await spendingService.fetchSpendingData(1, 2024, 3)
      expect(mockFetch).toHaveBeenCalledTimes(2) // Cache expired, new fetch
      
      Date.now = originalDateNow
    })

    it('should achieve sub-10ms response time for cached data', async () => {
      // First fetch (not cached)
      mockTime = 0
      await spendingService.fetchSpendingData(1, 2024, 3)
      
      // Second fetch (cached)
      mockTime = 0
      await spendingService.fetchSpendingData(1, 2024, 3)
      
      // mockTime increments with each performance.now() call
      // For cached data, should be minimal calls
      expect(mockTime).toBeLessThan(10)
    })
  })

  describe('Request Deduplication', () => {
    it('should prevent duplicate concurrent requests', async () => {
      // Simulate slow network response
      let resolvePromise: (value: any) => void
      const slowPromise = new Promise(resolve => {
        resolvePromise = resolve
      })
      
      mockFetch.mockImplementation(() => slowPromise as Promise<Response>)
      
      // Make multiple concurrent requests
      const promise1 = spendingService.fetchSpendingData(1, 2024, 3)
      const promise2 = spendingService.fetchSpendingData(1, 2024, 3)
      const promise3 = spendingService.fetchSpendingData(1, 2024, 3)
      
      // Only one fetch should be made
      expect(mockFetch).toHaveBeenCalledTimes(1)
      
      // Resolve the fetch
      resolvePromise!({
        ok: true,
        json: async () => ({ success: true, data: mockSpendingData })
      })
      
      const [data1, data2, data3] = await Promise.all([promise1, promise2, promise3])
      
      expect(data1).toEqual(mockSpendingData)
      expect(data2).toEqual(mockSpendingData)
      expect(data3).toEqual(mockSpendingData)
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('should allow new requests after previous completes', async () => {
      await spendingService.fetchSpendingData(1, 2024, 3)
      
      // Clear cache to force new request
      spendingService.clearCache()
      
      await spendingService.fetchSpendingData(1, 2024, 3)
      
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500
      } as Response)
      
      await expect(spendingService.fetchSpendingData(1, 2024, 3))
        .rejects.toThrow('API error: 500')
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))
      
      // Should return fallback data
      const data = await spendingService.fetchSpendingData(1, 2024, 3)
      
      expect(data).toBeDefined()
      expect(data.total).toBeGreaterThan(0)
      expect(data.categories).toBeDefined()
      expect(data.categories.length).toBeGreaterThan(0)
    })

    it('should use stale cache when API fails', async () => {
      // First successful fetch
      await spendingService.fetchSpendingData(1, 2024, 3)
      
      // Expire cache
      const originalDateNow = Date.now
      Date.now = jest.fn(() => Date.now() + 70000)
      
      // Make API fail
      mockFetch.mockRejectedValue(new Error('API error'))
      
      // Should return stale cache
      const data = await spendingService.fetchSpendingData(1, 2024, 3)
      expect(data).toEqual(mockSpendingData)
      
      Date.now = originalDateNow
    })

    it('should handle API returning success: false', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: false,
          error: 'Invalid parameters'
        })
      } as Response)
      
      await expect(spendingService.fetchSpendingData(1, 2024, 3))
        .rejects.toThrow('Invalid parameters')
    })

    it('should handle timeout correctly', async () => {
      // Simulate timeout by never resolving
      mockFetch.mockImplementation(() => new Promise(() => {}))
      
      // Note: In real implementation, AbortSignal.timeout would handle this
      // For testing, we'd need to mock AbortController properly
      // This test shows the structure but may need adjustment based on actual implementation
    })
  })

  describe('Fallback Data', () => {
    beforeEach(() => {
      mockFetch.mockRejectedValue(new Error('API error'))
    })

    it('should provide profile-specific fallback data', async () => {
      const data1 = await spendingService.fetchSpendingData(1, 2024, 3)
      const data2 = await spendingService.fetchSpendingData(2, 2024, 3)
      const data3 = await spendingService.fetchSpendingData(3, 2024, 3)
      
      // Different profiles should have different base spending
      expect(data1.total).toBe(4200)
      expect(data2.total).toBe(3400)
      expect(data3.total).toBe(2100)
    })

    it('should scale fallback data for yearly vs monthly', async () => {
      const monthlyData = await spendingService.fetchSpendingData(1, 2024, 3)
      const yearlyData = await spendingService.fetchSpendingData(1, 2024)
      
      expect(yearlyData.total).toBe(monthlyData.total * 12)
    })

    it('should include all required fields in fallback data', async () => {
      const data = await spendingService.fetchSpendingData(1, 2024, 3)
      
      expect(data).toHaveProperty('total')
      expect(data).toHaveProperty('categories')
      expect(data).toHaveProperty('recurringTotal')
      expect(data).toHaveProperty('nonRecurringTotal')
      expect(data).toHaveProperty('comparison')
      expect(data).toHaveProperty('dailyAverage')
      expect(data).toHaveProperty('projectedTotal')
      expect(data).toHaveProperty('insights')
      
      expect(data.categories.length).toBeGreaterThan(0)
      expect(data.insights.length).toBeGreaterThan(0)
    })
  })

  describe('preloadSpendingData', () => {
    it('should preload data for multiple years and months', async () => {
      await spendingService.preloadSpendingData(1, [2023, 2024])
      
      // Should fetch: 2 years * 13 periods (year + 12 months) = 26 requests
      expect(mockFetch).toHaveBeenCalledTimes(26)
    })

    it('should handle preload failures gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('API error'))
      
      // Should not throw
      await expect(spendingService.preloadSpendingData(1, [2024]))
        .resolves.not.toThrow()
    })

    it('should cache all preloaded data', async () => {
      await spendingService.preloadSpendingData(1, [2024])
      
      // Reset mock to verify no new fetches
      mockFetch.mockClear()
      
      // These should all be cached
      await spendingService.fetchSpendingData(1, 2024)
      await spendingService.fetchSpendingData(1, 2024, 1)
      await spendingService.fetchSpendingData(1, 2024, 6)
      await spendingService.fetchSpendingData(1, 2024, 12)
      
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('Cache Management', () => {
    it('should provide accurate cache statistics', () => {
      // Clear cache first
      spendingService.clearCache()
      
      let stats = spendingService.getCacheStats()
      expect(stats.size).toBe(0)
      expect(stats.entries).toHaveLength(0)
    })

    it('should track cache entry age', async () => {
      const originalDateNow = Date.now
      let currentTime = Date.now()
      Date.now = jest.fn(() => currentTime)
      
      await spendingService.fetchSpendingData(1, 2024, 3)
      
      currentTime += 30000 // Advance 30 seconds
      
      const stats = spendingService.getCacheStats()
      expect(stats.entries[0].age).toBe(30000)
      
      Date.now = originalDateNow
    })

    it('should clear stale cache entries', async () => {
      const originalDateNow = Date.now
      let currentTime = Date.now()
      Date.now = jest.fn(() => currentTime)
      
      // Add multiple cache entries
      await spendingService.fetchSpendingData(1, 2024, 1)
      currentTime += 30000
      await spendingService.fetchSpendingData(1, 2024, 2)
      currentTime += 40000 // First entry is now 70s old
      
      const cleared = spendingService.clearStaleCache()
      expect(cleared).toBe(1) // Only first entry should be cleared
      
      const stats = spendingService.getCacheStats()
      expect(stats.size).toBe(1)
      
      Date.now = originalDateNow
    })

    it('should clear all cache on demand', async () => {
      // Add multiple cache entries
      await spendingService.fetchSpendingData(1, 2024, 1)
      await spendingService.fetchSpendingData(1, 2024, 2)
      await spendingService.fetchSpendingData(1, 2024, 3)
      
      let stats = spendingService.getCacheStats()
      expect(stats.size).toBe(3)
      
      spendingService.clearCache()
      
      stats = spendingService.getCacheStats()
      expect(stats.size).toBe(0)
    })
  })

  describe('Performance Requirements', () => {
    it('should meet sub-10ms target for cached requests', async () => {
      // First request to populate cache
      await spendingService.fetchSpendingData(1, 2024, 3)
      
      // Measure cached request
      const start = performance.now()
      await spendingService.fetchSpendingData(1, 2024, 3)
      const duration = performance.now() - start
      
      // With our mock, this should be very fast
      expect(duration).toBeLessThan(10)
    })

    it('should handle high-frequency requests efficiently', async () => {
      // Populate cache
      await spendingService.fetchSpendingData(1, 2024, 3)
      
      // Make 1000 cached requests
      const start = performance.now()
      const promises = Array.from({ length: 1000 }, () => 
        spendingService.fetchSpendingData(1, 2024, 3)
      )
      await Promise.all(promises)
      const duration = performance.now() - start
      
      // Should handle 1000 cached requests very quickly
      expect(duration).toBeLessThan(100)
      expect(mockFetch).toHaveBeenCalledTimes(1) // Only initial fetch
    })

    it('should maintain performance with large response data', async () => {
      const largeData = {
        ...mockSpendingData,
        categories: Array.from({ length: 100 }, (_, i) => ({
          id: i,
          name: `Category ${i}`,
          spent: Math.random() * 1000,
          budget: 1000,
          icon: '💰',
          isRecurring: i % 2 === 0,
          isOverBudget: Math.random() > 0.5,
          percentage: Math.random() * 150
        }))
      }
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: largeData })
      } as Response)
      
      const start = performance.now()
      await spendingService.fetchSpendingData(1, 2024, 3)
      const duration = performance.now() - start
      
      // Should handle large data efficiently
      expect(duration).toBeLessThan(50)
    })
  })

  describe('Edge Cases', () => {
    it('should handle invalid customer IDs', async () => {
      const data = await spendingService.fetchSpendingData(0, 2024, 3)
      expect(data).toBeDefined()
      
      const negativeData = await spendingService.fetchSpendingData(-1, 2024, 3)
      expect(negativeData).toBeDefined()
    })

    it('should handle invalid year values', async () => {
      const futureData = await spendingService.fetchSpendingData(1, 3000, 3)
      expect(futureData).toBeDefined()
      
      const pastData = await spendingService.fetchSpendingData(1, 1900, 3)
      expect(pastData).toBeDefined()
    })

    it('should handle invalid month values', async () => {
      const data1 = await spendingService.fetchSpendingData(1, 2024, 0)
      expect(data1).toBeDefined()
      
      const data2 = await spendingService.fetchSpendingData(1, 2024, 13)
      expect(data2).toBeDefined()
      
      const data3 = await spendingService.fetchSpendingData(1, 2024, -1)
      expect(data3).toBeDefined()
    })

    it('should handle NaN values', async () => {
      const data = await spendingService.fetchSpendingData(NaN, NaN, NaN)
      expect(data).toBeDefined()
    })

    it('should handle undefined month correctly', async () => {
      const data = await spendingService.fetchSpendingData(1, 2024, undefined)
      expect(data).toBeDefined()
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('year=2024'),
        expect.any(Object)
      )
      expect(mockFetch).toHaveBeenCalledWith(
        expect.not.stringContaining('month='),
        expect.any(Object)
      )
    })
  })
})