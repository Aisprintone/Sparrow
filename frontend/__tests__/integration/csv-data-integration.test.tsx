// CSV DATA INTEGRATION TEST SUITE
// Validates real-time CSV data fetching and profile switching

import { renderHook, act, waitFor } from '@testing-library/react'
import useAppState, { dataCache } from '@/hooks/use-app-state'
import fetchMock from 'jest-fetch-mock'

describe('CSV Data Integration - Phase 3', () => {
  beforeEach(() => {
    fetchMock.resetMocks()
    dataCache.invalidate()
  })

  describe('Profile Data Fetching', () => {
    it('should fetch real CSV data when profile changes', async () => {
      const mockProfileData = {
        success: true,
        data: {
          customer: { customer_id: 1, location: 'NYC', age: 34 },
          accounts: [
            {
              id: 1,
              name: 'Chase Checking',
              balance: 5000,
              type: 'asset',
              accountType: 'checking'
            }
          ],
          metrics: {
            netWorth: 10000,
            monthlyIncome: 8500,
            monthlySpending: 4200,
            creditScore: 780
          },
          spending: {
            total: 4200,
            categories: [
              { id: 'food', name: 'Food', spent: 800, budget: 1000, color: 'green' }
            ],
            topCategory: { name: 'Food', amount: 800 }
          },
          transactions: [],
          goals: []
        }
      }

      fetchMock.mockResponseOnce(JSON.stringify(mockProfileData))

      const { result } = renderHook(() => useAppState())

      await act(async () => {
        result.current.setDemographic('millennial')
      })

      await waitFor(() => {
        expect(result.current.accounts.length).toBeGreaterThan(0)
        expect(result.current.monthlyIncome).toBe(8500)
        expect(result.current.monthlySpending.total).toBe(4200)
      })

      expect(fetchMock).toHaveBeenCalledWith('/api/profiles/1')
    })

    it('should use cache for subsequent fetches', async () => {
      const mockProfileData = {
        success: true,
        data: {
          customer: { customer_id: 2, location: 'NYC', age: 33 },
          accounts: [],
          metrics: { netWorth: 5000, monthlyIncome: 5800 },
          spending: { total: 3400, categories: [], topCategory: null }
        }
      }

      fetchMock.mockResponseOnce(JSON.stringify(mockProfileData))

      const { result } = renderHook(() => useAppState())

      // First fetch
      await act(async () => {
        result.current.setDemographic('midcareer')
      })

      await waitFor(() => {
        expect(result.current.monthlyIncome).toBe(5800)
      })

      // Second fetch should use cache
      await act(async () => {
        result.current.setDemographic('millennial')
        result.current.setDemographic('midcareer')
      })

      // Only one API call should be made
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    it('should fallback to hardcoded data on API failure', async () => {
      fetchMock.mockRejectOnce(new Error('API Error'))

      const { result } = renderHook(() => useAppState())

      await act(async () => {
        result.current.setDemographic('genz')
      })

      await waitFor(() => {
        expect(result.current.accounts.length).toBeGreaterThan(0)
        expect(result.current.monthlyIncome).toBe(3200) // Fallback value
      })
    })
  })

  describe('Performance Optimization', () => {
    it('should fetch data within 100ms from cache', async () => {
      const mockData = {
        success: true,
        data: { 
          accounts: [],
          metrics: {},
          spending: { total: 0, categories: [] }
        }
      }

      fetchMock.mockResponseOnce(JSON.stringify(mockData))

      const { result } = renderHook(() => useAppState())

      const startTime = performance.now()
      
      await act(async () => {
        result.current.setDemographic('millennial')
      })

      await waitFor(() => {
        expect(result.current.demographic).toBe('millennial')
      })

      // Second fetch from cache
      const cacheStartTime = performance.now()
      
      await act(async () => {
        result.current.setDemographic('genz')
        result.current.setDemographic('millennial')
      })

      const cacheTime = performance.now() - cacheStartTime
      expect(cacheTime).toBeLessThan(100)
    })
  })

  describe('AI Actions Generation', () => {
    it('should generate personalized AI actions based on profile data', async () => {
      const mockProfileData = {
        success: true,
        data: {
          accounts: [
            { accountType: 'savings', balance: 5000 }
          ],
          metrics: { creditScore: 650 },
          spending: {
            total: 2000,
            categories: [
              { name: 'Food', spent: 800, percentage: 40 }
            ]
          }
        }
      }

      fetchMock.mockResponseOnce(JSON.stringify(mockProfileData))

      const { result } = renderHook(() => useAppState())

      await act(async () => {
        result.current.setDemographic('genz')
      })

      await waitFor(() => {
        const actions = result.current.aiActions
        expect(actions.length).toBeGreaterThan(0)
        
        // Should have high-yield savings action
        expect(actions.some(a => a.id === 'high-yield-savings')).toBe(true)
        
        // Should have credit optimization action (score < 750)
        expect(actions.some(a => a.id === 'credit-optimization')).toBe(true)
        
        // Should have budget optimization for high spending category
        expect(actions.some(a => a.id === 'budget-optimization')).toBe(true)
      })
    })
  })

  describe('Profile Switching', () => {
    it('should update all dashboard components on profile switch', async () => {
      const profiles = {
        1: {
          success: true,
          data: {
            customer: { customer_id: 1 },
            accounts: [{ id: 1, balance: 8500 }],
            metrics: { monthlyIncome: 8500, creditScore: 780 },
            spending: { 
              total: 4200,
              categories: [{ id: 'housing', spent: 2200 }],
              topCategory: { name: 'Housing', amount: 2200 }
            }
          }
        },
        3: {
          success: true,
          data: {
            customer: { customer_id: 3 },
            accounts: [{ id: 3, balance: 2847 }],
            metrics: { monthlyIncome: 3200, creditScore: 650 },
            spending: {
              total: 2100,
              categories: [{ id: 'food', spent: 450 }],
              topCategory: { name: 'Food', amount: 450 }
            }
          }
        }
      }

      fetchMock
        .mockResponseOnce(JSON.stringify(profiles[1]))
        .mockResponseOnce(JSON.stringify(profiles[3]))

      const { result } = renderHook(() => useAppState())

      // Start with millennial
      await act(async () => {
        result.current.setDemographic('millennial')
      })

      await waitFor(() => {
        expect(result.current.monthlyIncome).toBe(8500)
        expect(result.current.monthlySpending.topCategory.name).toBe('Housing')
      })

      // Switch to Gen Z
      await act(async () => {
        result.current.setDemographic('genz')
      })

      await waitFor(() => {
        expect(result.current.monthlyIncome).toBe(3200)
        expect(result.current.monthlySpending.topCategory.name).toBe('Food')
      })
    })
  })

  describe('Cache Management', () => {
    it('should invalidate cache correctly', async () => {
      const mockData = {
        success: true,
        data: {
          accounts: [],
          metrics: {},
          spending: { total: 0, categories: [] }
        }
      }

      fetchMock.mockResponse(JSON.stringify(mockData))

      const { result } = renderHook(() => useAppState())

      await act(async () => {
        result.current.setDemographic('millennial')
      })

      // Invalidate cache
      dataCache.invalidate('profile')

      await act(async () => {
        result.current.setDemographic('midcareer')
        result.current.setDemographic('millennial')
      })

      // Should make 2 API calls after cache invalidation
      expect(fetchMock).toHaveBeenCalledTimes(2)
    })

    it('should respect TTL for cached data', async () => {
      jest.useFakeTimers()

      const mockData = {
        success: true,
        data: {
          accounts: [],
          metrics: {},
          spending: { total: 0, categories: [] }
        }
      }

      fetchMock.mockResponse(JSON.stringify(mockData))

      const { result } = renderHook(() => useAppState())

      await act(async () => {
        result.current.setDemographic('millennial')
      })

      // Advance time beyond TTL (1 minute)
      jest.advanceTimersByTime(61000)

      await act(async () => {
        result.current.setDemographic('genz')
        result.current.setDemographic('millennial')
      })

      // Should make 2 API calls as cache expired
      expect(fetchMock).toHaveBeenCalledTimes(2)

      jest.useRealTimers()
    })
  })
})