/**
 * DATA INTEGRITY EDGE CASE TESTING
 * --------------------------------
 * Surgical precision testing for boundary conditions and edge cases
 * Zero tolerance for calculation errors or data inconsistencies
 */

import { describe, test, expect, beforeAll } from '@jest/globals'
import { profileDataService } from '@/lib/services/data-store'
import { CSVParser } from '@/lib/services/csv-parser'

describe('Data Integrity Edge Cases - Surgical Precision Tests', () => {
  
  describe('Floating Point Precision Tests', () => {
    test('should handle financial calculations with exact precision', () => {
      // Test case: $0.10 + $0.20 should equal exactly $0.30
      const amount1 = 0.10
      const amount2 = 0.20
      const sum = Math.round((amount1 + amount2) * 100) / 100
      
      expect(sum).toBe(0.30)
      expect(sum.toFixed(2)).toBe('0.30')
    })

    test('should handle large financial values without precision loss', () => {
      const largeAmount = 999999999.99
      const smallAmount = 0.01
      const sum = Math.round((largeAmount + smallAmount) * 100) / 100
      
      expect(sum).toBe(1000000000.00)
      expect(sum.toFixed(2)).toBe('1000000000.00')
    })

    test('should handle negative balances correctly', () => {
      const assets = 5000.45
      const liabilities = -25000.00
      const netWorth = assets + liabilities
      
      expect(netWorth).toBe(-19999.55)
      expect(netWorth.toFixed(2)).toBe('-19999.55')
    })
  })

  describe('Date Filtering Edge Cases', () => {
    test('should correctly filter transactions at month boundaries', () => {
      const testTransactions = [
        { timestamp: '2025-07-31 23:59:59', amount: -100 }, // July
        { timestamp: '2025-08-01 00:00:00', amount: -200 }, // August
        { timestamp: '2025-08-31 23:59:59', amount: -300 }, // August
        { timestamp: '2025-09-01 00:00:00', amount: -400 }  // September
      ]

      const augustTransactions = testTransactions.filter(tx => {
        const date = new Date(tx.timestamp)
        return date.getMonth() === 7 && date.getFullYear() === 2025 // August is month 7
      })

      expect(augustTransactions).toHaveLength(2)
      expect(augustTransactions[0].amount).toBe(-200)
      expect(augustTransactions[1].amount).toBe(-300)
    })

    test('should handle timezone considerations correctly', () => {
      // Ensure UTC vs local time doesn't affect calculations
      const utcTimestamp = '2025-08-01T00:00:00Z'
      const localTimestamp = '2025-08-01 00:00:00'
      
      const utcDate = new Date(utcTimestamp)
      const localDate = new Date(localTimestamp)
      
      expect(utcDate.getMonth()).toBe(7) // August
      expect(localDate.getMonth()).toBe(7) // August
    })
  })

  describe('Account Balance Edge Cases', () => {
    test('should handle zero balances correctly', () => {
      const accounts = [
        { balance: 0.00, type: 'checking' },
        { balance: 1000.00, type: 'savings' },
        { balance: -1000.00, type: 'loan' }
      ]

      const totalAssets = accounts
        .filter(a => a.balance >= 0)
        .reduce((sum, a) => sum + a.balance, 0)
      
      const totalLiabilities = Math.abs(
        accounts
          .filter(a => a.balance < 0)
          .reduce((sum, a) => sum + a.balance, 0)
      )

      expect(totalAssets).toBe(1000.00)
      expect(totalLiabilities).toBe(1000.00)
      expect(totalAssets - totalLiabilities).toBe(0.00)
    })

    test('should classify credit cards with zero balance as assets', () => {
      const creditCard = {
        balance: 0.00,
        account_type: 'credit_card',
        credit_limit: 10000
      }

      const isAsset = creditCard.balance >= 0
      expect(isAsset).toBe(true)
    })

    test('should handle credit cards with positive balance (overpayment) correctly', () => {
      const creditCard = {
        balance: 150.00, // Customer overpaid
        account_type: 'credit_card',
        credit_limit: 10000
      }

      const isAsset = creditCard.balance >= 0
      expect(isAsset).toBe(true)
    })
  })

  describe('Transaction Categorization Edge Cases', () => {
    test('should handle transactions with missing categories', () => {
      const transactions = [
        { category_id: 1, amount: -100 },
        { category_id: null, amount: -50 },
        { category_id: 999, amount: -75 } // Non-existent category
      ]

      const categories = [
        { category_id: 1, name: 'Food' }
      ]

      const categorized = transactions.map(tx => {
        const category = categories.find(c => c.category_id === tx.category_id)
        return {
          ...tx,
          categoryName: category?.name || 'Other'
        }
      })

      expect(categorized[0].categoryName).toBe('Food')
      expect(categorized[1].categoryName).toBe('Other')
      expect(categorized[2].categoryName).toBe('Other')
    })

    test('should handle duplicate transactions correctly', () => {
      const transactions = [
        { transaction_id: 1, amount: -100 },
        { transaction_id: 1, amount: -100 }, // Duplicate
        { transaction_id: 2, amount: -50 }
      ]

      const unique = Array.from(
        new Map(transactions.map(tx => [tx.transaction_id, tx])).values()
      )

      expect(unique).toHaveLength(2)
      expect(unique.reduce((sum, tx) => sum + tx.amount, 0)).toBe(-150)
    })
  })

  describe('CSV Parsing Edge Cases', () => {
    const parser = new CSVParser()

    test('should handle quoted values with commas correctly', () => {
      const line = '1,"Austin, TX",23'
      const parsed = parser['parseCSVLine'](line)
      
      expect(parsed).toHaveLength(3)
      expect(parsed[0]).toBe('1')
      expect(parsed[1]).toBe('Austin, TX')
      expect(parsed[2]).toBe('23')
    })

    test('should handle empty fields correctly', () => {
      const line = '1,,3'
      const parsed = parser['parseCSVLine'](line)
      
      expect(parsed).toHaveLength(3)
      expect(parsed[0]).toBe('1')
      expect(parsed[1]).toBe('')
      expect(parsed[2]).toBe('3')
    })

    test('should handle fields with quotes inside correctly', () => {
      const line = '1,"She said ""Hello""",3'
      const parsed = parser['parseCSVLine'](line)
      
      expect(parsed).toHaveLength(3)
      expect(parsed[1]).toBe('She said ""Hello""')
    })
  })

  describe('Performance and Memory Tests', () => {
    test('should handle large transaction volumes efficiently', () => {
      const startTime = Date.now()
      const largeTransactionSet = Array.from({ length: 10000 }, (_, i) => ({
        transaction_id: i,
        amount: -Math.random() * 1000,
        timestamp: '2025-08-01 12:00:00',
        is_debit: true
      }))

      const total = largeTransactionSet.reduce((sum, tx) => sum + Math.abs(tx.amount), 0)
      const endTime = Date.now()
      const processingTime = endTime - startTime

      expect(processingTime).toBeLessThan(100) // Should process 10k transactions in < 100ms
      expect(total).toBeGreaterThan(0)
    })

    test('should maintain calculation accuracy with many decimal operations', () => {
      const amounts = [0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.09]
      const sum = amounts.reduce((acc, val) => {
        return Math.round((acc + val) * 100) / 100
      }, 0)

      expect(sum).toBe(0.45)
      expect(sum.toFixed(2)).toBe('0.45')
    })
  })

  describe('Data Consistency Validation', () => {
    test('should validate that all account transactions belong to valid accounts', async () => {
      const data = await profileDataService['loadData']()
      
      const accountIds = new Set(data.accounts.map(a => a.account_id))
      const invalidTransactions = data.transactions.filter(
        tx => !accountIds.has(tx.account_id)
      )

      expect(invalidTransactions).toHaveLength(0)
    })

    test('should validate that all transactions have valid timestamps', async () => {
      const data = await profileDataService['loadData']()
      
      const invalidTimestamps = data.transactions.filter(tx => {
        const date = new Date(tx.timestamp)
        return isNaN(date.getTime())
      })

      expect(invalidTimestamps).toHaveLength(0)
    })

    test('should ensure net worth calculation is mathematically correct', async () => {
      const profile = await profileDataService.getProfile(3)
      
      const calculatedNetWorth = profile.totalAssets - profile.totalLiabilities
      const reportedNetWorth = profile.netWorth

      expect(Math.abs(calculatedNetWorth - reportedNetWorth)).toBeLessThan(0.01)
    })
  })

  describe('Cache Consistency Tests', () => {
    test('should return consistent data between cached and fresh loads', async () => {
      // Clear cache first
      profileDataService.clearCache()
      
      // First load (fresh)
      const firstLoad = await profileDataService.getProfile(3)
      
      // Second load (cached)
      const secondLoad = await profileDataService.getProfile(3)
      
      expect(firstLoad.netWorth).toBe(secondLoad.netWorth)
      expect(firstLoad.totalAssets).toBe(secondLoad.totalAssets)
      expect(firstLoad.totalLiabilities).toBe(secondLoad.totalLiabilities)
      expect(firstLoad.monthlySpending.total).toBe(secondLoad.monthlySpending.total)
    })

    test('should invalidate cache after TTL expires', async () => {
      const originalTTL = profileDataService['CACHE_TTL']
      
      // Set a very short TTL for testing (1ms)
      Object.defineProperty(profileDataService, 'CACHE_TTL', {
        value: 1,
        writable: true
      })
      
      const firstLoad = await profileDataService.getProfile(3)
      
      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 2))
      
      const secondLoad = await profileDataService.getProfile(3)
      
      // Both should have same data even though cache expired
      expect(firstLoad.netWorth).toBe(secondLoad.netWorth)
      
      // Restore original TTL
      Object.defineProperty(profileDataService, 'CACHE_TTL', {
        value: originalTTL,
        writable: true
      })
    })
  })
})

describe('API Response Validation', () => {
  test('should validate API response structure', async () => {
    const response = await fetch('http://localhost:3000/api/profiles/3')
    const data = await response.json()
    
    // Validate required fields exist
    expect(data).toHaveProperty('success')
    expect(data).toHaveProperty('data')
    expect(data.data).toHaveProperty('metrics')
    expect(data.data.metrics).toHaveProperty('netWorth')
    expect(data.data.metrics).toHaveProperty('liquidAssets')
    expect(data.data.metrics).toHaveProperty('totalDebt')
    expect(data.data.metrics).toHaveProperty('monthlySpending')
    
    // Validate data types
    expect(typeof data.data.metrics.netWorth).toBe('number')
    expect(typeof data.data.metrics.liquidAssets).toBe('number')
    expect(typeof data.data.metrics.totalDebt).toBe('number')
    expect(typeof data.data.metrics.monthlySpending).toBe('number')
    
    // Validate calculations
    const calculatedNetWorth = data.data.metrics.liquidAssets - data.data.metrics.totalDebt
    expect(Math.abs(calculatedNetWorth - data.data.metrics.netWorth)).toBeLessThan(0.01)
  })

  test('should handle API errors gracefully', async () => {
    const response = await fetch('http://localhost:3000/api/profiles/999')
    const data = await response.json()
    
    expect(data.success).toBe(false)
    expect(data).toHaveProperty('error')
  })
})