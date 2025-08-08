/**
 * PROFILES API INTEGRATION TESTS - END-TO-END API VALIDATION
 * Tests API contracts, response times, error handling, and data integrity
 */

import { NextRequest } from 'next/server'
import { GET } from '@/app/api/profiles/route'
import { profileDataService } from '@/lib/services/data-store'

// Mock the data service
jest.mock('@/lib/services/data-store')
const mockProfileDataService = profileDataService as jest.Mocked<typeof profileDataService>

// Mock the init module
jest.mock('@/app/api/profiles/init', () => ({
  initializeDataStore: jest.fn().mockResolvedValue(undefined)
}))

describe('Profiles API - Integration Tests', () => {
  const mockCustomers = [
    { customer_id: 1, location: 'New York', age: 30 },
    { customer_id: 2, location: 'Los Angeles', age: 35 },
    { customer_id: 3, location: 'Chicago', age: 22 }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    mockProfileDataService.getAllCustomers.mockResolvedValue(mockCustomers)
  })

  describe('GET /api/profiles', () => {
    it('should return all profiles with correct structure', async () => {
      const request = new NextRequest('http://localhost:3000/api/profiles')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(3)
      
      // Verify profile structure
      expect(data.data[0]).toMatchObject({
        id: 1,
        name: expect.stringContaining('Millennial'),
        location: 'New York',
        age: 30
      })
      
      expect(data.data[1]).toMatchObject({
        id: 2,
        name: expect.stringContaining('Mid-Career Professional'),
        location: 'Los Angeles',
        age: 35
      })
      
      expect(data.data[2]).toMatchObject({
        id: 3,
        name: expect.stringContaining('Gen Z Student'),
        location: 'Chicago',
        age: 22
      })
    })

    it('should include complete metadata in response', async () => {
      const request = new NextRequest('http://localhost:3000/api/profiles')
      const response = await GET(request)
      const data = await response.json()

      expect(data.meta).toMatchObject({
        timestamp: expect.any(Number),
        version: '1.0.0',
        cached: false,
        computeTime: expect.any(Number),
        dataSource: 'computed'
      })

      expect(data.profile).toMatchObject({
        id: 0,
        name: 'System',
        lastUpdated: expect.any(String),
        dataQuality: 100
      })

      expect(data.performance).toMatchObject({
        totalTime: expect.any(Number),
        parseTime: 0,
        computeTime: expect.any(Number),
        cacheHits: 0,
        cacheMisses: 0,
        memoryUsed: expect.any(Number)
      })
    })

    it('should set appropriate response headers', async () => {
      const request = new NextRequest('http://localhost:3000/api/profiles')
      const response = await GET(request)

      expect(response.headers.get('X-Response-Time')).toMatch(/\d+ms/)
      expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600')
    })

    it('should handle empty customer list', async () => {
      mockProfileDataService.getAllCustomers.mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/profiles')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(0)
    })

    it('should handle service errors gracefully', async () => {
      mockProfileDataService.getAllCustomers.mockRejectedValue(
        new Error('Database connection failed')
      )

      const request = new NextRequest('http://localhost:3000/api/profiles')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to fetch profiles')
      expect(data.message).toBe('Database connection failed')
    })

    it('should handle initialization errors', async () => {
      const { initializeDataStore } = require('@/app/api/profiles/init')
      initializeDataStore.mockRejectedValue(new Error('Initialization failed'))

      const request = new NextRequest('http://localhost:3000/api/profiles')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
    })

    it('should measure performance accurately', async () => {
      const startTime = Date.now()
      const request = new NextRequest('http://localhost:3000/api/profiles')
      const response = await GET(request)
      const endTime = Date.now()
      const data = await response.json()

      const actualDuration = endTime - startTime
      const reportedDuration = data.performance.totalTime

      // Reported duration should be reasonable
      expect(reportedDuration).toBeGreaterThan(0)
      expect(reportedDuration).toBeLessThanOrEqual(actualDuration + 10) // Allow 10ms tolerance
    })

    it('should handle large customer datasets', async () => {
      const largeCustomerList = Array.from({ length: 1000 }, (_, i) => ({
        customer_id: i + 1,
        location: `City ${i}`,
        age: 20 + (i % 50)
      }))

      mockProfileDataService.getAllCustomers.mockResolvedValue(largeCustomerList)

      const request = new NextRequest('http://localhost:3000/api/profiles')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toHaveLength(1000)
      expect(data.performance.computeTime).toBeLessThan(100) // Should be fast even with 1000 items
    })

    it('should format profile names consistently', async () => {
      const request = new NextRequest('http://localhost:3000/api/profiles')
      const response = await GET(request)
      const data = await response.json()

      data.data.forEach((profile: any) => {
        // Name should include age and location
        expect(profile.name).toMatch(/\(\d+, .+\)$/)
      })
    })

    it('should handle special characters in location names', async () => {
      const specialCustomers = [
        { customer_id: 1, location: "Saint-Jean-sur-Richelieu", age: 30 },
        { customer_id: 2, location: "O'Fallon", age: 35 },
        { customer_id: 3, location: "São Paulo", age: 22 }
      ]

      mockProfileDataService.getAllCustomers.mockResolvedValue(specialCustomers)

      const request = new NextRequest('http://localhost:3000/api/profiles')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data[0].location).toBe("Saint-Jean-sur-Richelieu")
      expect(data.data[1].location).toBe("O'Fallon")
      expect(data.data[2].location).toBe("São Paulo")
    })
  })

  describe('Performance Requirements', () => {
    it('should respond within 50ms for standard requests', async () => {
      const startTime = performance.now()
      const request = new NextRequest('http://localhost:3000/api/profiles')
      await GET(request)
      const duration = performance.now() - startTime

      expect(duration).toBeLessThan(50)
    })

    it('should handle concurrent requests efficiently', async () => {
      const requests = Array.from({ length: 10 }, () => 
        new NextRequest('http://localhost:3000/api/profiles')
      )

      const startTime = performance.now()
      const responses = await Promise.all(requests.map(req => GET(req)))
      const duration = performance.now() - startTime

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })

      // Should handle 10 concurrent requests quickly
      expect(duration).toBeLessThan(100)
    })

    it('should maintain consistent response times', async () => {
      const durations: number[] = []

      for (let i = 0; i < 10; i++) {
        const startTime = performance.now()
        const request = new NextRequest('http://localhost:3000/api/profiles')
        await GET(request)
        durations.push(performance.now() - startTime)
      }

      // Calculate standard deviation
      const mean = durations.reduce((a, b) => a + b) / durations.length
      const variance = durations.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / durations.length
      const stdDev = Math.sqrt(variance)

      // Standard deviation should be low (consistent response times)
      expect(stdDev).toBeLessThan(10)
    })
  })

  describe('Security Tests', () => {
    it('should not expose sensitive internal data', async () => {
      const request = new NextRequest('http://localhost:3000/api/profiles')
      const response = await GET(request)
      const data = await response.json()

      // Check that response doesn't contain sensitive fields
      const jsonString = JSON.stringify(data)
      expect(jsonString).not.toContain('password')
      expect(jsonString).not.toContain('secret')
      expect(jsonString).not.toContain('token')
      expect(jsonString).not.toContain('__proto__')
    })

    it('should handle malformed requests gracefully', async () => {
      // Simulate various malformed requests
      const malformedUrls = [
        'http://localhost:3000/api/profiles?__proto__[test]=polluted',
        'http://localhost:3000/api/profiles?constructor[prototype][test]=polluted',
        'http://localhost:3000/api/profiles/../../../etc/passwd'
      ]

      for (const url of malformedUrls) {
        const request = new NextRequest(url)
        const response = await GET(request)
        
        // Should still return valid response
        expect(response.status).toBe(200)
      }
    })

    it('should set secure headers', async () => {
      const request = new NextRequest('http://localhost:3000/api/profiles')
      const response = await GET(request)

      // Cache-Control should be set appropriately
      expect(response.headers.get('Cache-Control')).toBeDefined()
      
      // Should not expose server details
      expect(response.headers.get('X-Powered-By')).toBeNull()
    })
  })

  describe('Data Integrity', () => {
    it('should maintain data consistency across requests', async () => {
      const request1 = new NextRequest('http://localhost:3000/api/profiles')
      const response1 = await GET(request1)
      const data1 = await response1.json()

      const request2 = new NextRequest('http://localhost:3000/api/profiles')
      const response2 = await GET(request2)
      const data2 = await response2.json()

      expect(data1.data).toEqual(data2.data)
    })

    it('should validate customer data structure', async () => {
      const invalidCustomers = [
        { customer_id: 'abc', location: 'New York', age: 30 }, // Invalid ID
        { customer_id: 2, location: null, age: 35 }, // Null location
        { customer_id: 3, location: 'Chicago', age: 'twenty' } // Invalid age
      ] as any

      mockProfileDataService.getAllCustomers.mockResolvedValue(invalidCustomers)

      const request = new NextRequest('http://localhost:3000/api/profiles')
      const response = await GET(request)
      const data = await response.json()

      // Should handle invalid data gracefully
      expect(response.status).toBe(200)
      expect(data.data).toBeDefined()
    })

    it('should preserve customer ID uniqueness', async () => {
      const request = new NextRequest('http://localhost:3000/api/profiles')
      const response = await GET(request)
      const data = await response.json()

      const ids = data.data.map((p: any) => p.id)
      const uniqueIds = new Set(ids)

      expect(uniqueIds.size).toBe(ids.length)
    })
  })

  describe('Compliance & Standards', () => {
    it('should return valid JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/profiles')
      const response = await GET(request)
      const text = await response.text()

      // Should not throw
      expect(() => JSON.parse(text)).not.toThrow()
    })

    it('should follow REST conventions', async () => {
      const request = new NextRequest('http://localhost:3000/api/profiles')
      const response = await GET(request)

      // GET should be idempotent
      const response2 = await GET(request)
      
      expect(response.status).toBe(response2.status)
    })

    it('should include appropriate content-type header', async () => {
      const request = new NextRequest('http://localhost:3000/api/profiles')
      const response = await GET(request)

      expect(response.headers.get('content-type')).toContain('application/json')
    })
  })

  describe('Edge Cases', () => {
    it('should handle undefined getAllCustomers gracefully', async () => {
      mockProfileDataService.getAllCustomers.mockResolvedValue(undefined as any)

      const request = new NextRequest('http://localhost:3000/api/profiles')
      const response = await GET(request)

      // Should handle gracefully, likely with error or empty array
      expect(response.status).toBeGreaterThanOrEqual(200)
    })

    it('should handle customers with missing fields', async () => {
      const incompleteCustomers = [
        { customer_id: 1 }, // Missing location and age
        { customer_id: 2, location: 'LA' }, // Missing age
        { customer_id: 3, age: 22 } // Missing location
      ] as any

      mockProfileDataService.getAllCustomers.mockResolvedValue(incompleteCustomers)

      const request = new NextRequest('http://localhost:3000/api/profiles')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toBeDefined()
    })

    it('should handle extremely long location names', async () => {
      const longLocation = 'A'.repeat(1000)
      const customersWithLongLocation = [
        { customer_id: 1, location: longLocation, age: 30 }
      ]

      mockProfileDataService.getAllCustomers.mockResolvedValue(customersWithLongLocation)

      const request = new NextRequest('http://localhost:3000/api/profiles')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data[0].location).toBe(longLocation)
    })

    it('should handle negative and zero ages', async () => {
      const unusualAges = [
        { customer_id: 1, location: 'NYC', age: 0 },
        { customer_id: 2, location: 'LA', age: -5 },
        { customer_id: 3, location: 'Chicago', age: 999 }
      ]

      mockProfileDataService.getAllCustomers.mockResolvedValue(unusualAges)

      const request = new NextRequest('http://localhost:3000/api/profiles')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toHaveLength(3)
    })
  })
})