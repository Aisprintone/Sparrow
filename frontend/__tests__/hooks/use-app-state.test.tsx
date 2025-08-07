import { renderHook, act } from '@testing-library/react'
import useAppState from '@/hooks/use-app-state'

describe('useAppState Hook - Profile Switching', () => {
  describe('Profile Initialization and Switching', () => {
    test('should initialize with millennial profile by default', () => {
      const { result } = renderHook(() => useAppState())
      
      expect(result.current.demographic).toBe('millennial')
      expect(result.current.monthlyIncome).toBe(8500)
      expect(result.current.accounts).toHaveLength(7)
    })

    test('should switch from millennial to genz profile', () => {
      const { result } = renderHook(() => useAppState())
      
      act(() => {
        result.current.setDemographic('genz')
      })
      
      expect(result.current.demographic).toBe('genz')
      expect(result.current.monthlyIncome).toBe(3200)
      expect(result.current.accounts).toHaveLength(4)
    })

    test('should update financial data when profile changes', () => {
      const { result } = renderHook(() => useAppState())
      
      // Start with millennial
      const millennialAccounts = result.current.accounts
      const millennialSpending = result.current.monthlySpending
      
      // Switch to Gen Z
      act(() => {
        result.current.setDemographic('genz')
      })
      
      // Verify data changed
      expect(result.current.accounts).not.toEqual(millennialAccounts)
      expect(result.current.monthlySpending.total).toBe(2100)
      expect(result.current.monthlySpending.topCategory.name).toBe('Food & Dining')
    })

    test('should preserve non-profile state during switch', () => {
      const { result } = renderHook(() => useAppState())
      
      // Set some non-profile state
      act(() => {
        result.current.setCurrentScreen('goals')
        result.current.setChatOpen(true)
      })
      
      const currentScreen = result.current.currentScreen
      const chatState = result.current.isChatOpen
      
      // Switch profile
      act(() => {
        result.current.setDemographic('genz')
      })
      
      // Verify non-profile state preserved
      expect(result.current.currentScreen).toBe(currentScreen)
      expect(result.current.isChatOpen).toBe(chatState)
    })

    test('should update spending categories per profile', () => {
      const { result } = renderHook(() => useAppState())
      
      // Millennial categories
      expect(result.current.spendingCategories).toHaveLength(4)
      expect(result.current.spendingCategories[0].name).toBe('Housing')
      
      // Switch to Gen Z
      act(() => {
        result.current.setDemographic('genz')
      })
      
      // Gen Z categories
      expect(result.current.spendingCategories).toHaveLength(4)
      expect(result.current.spendingCategories[0].name).toBe('Food & Dining')
      expect(result.current.spendingCategories[0].spent).toBe(450)
    })

    test('should update credit score data per profile', () => {
      const { result } = renderHook(() => useAppState())
      
      // Get initial millennial accounts (includes credit info)
      const millennialAccounts = result.current.accounts
      
      // Switch to Gen Z
      act(() => {
        result.current.setDemographic('genz')
      })
      
      // Verify different credit-related data
      const genzAccounts = result.current.accounts
      expect(genzAccounts).not.toEqual(millennialAccounts)
      
      // Gen Z has student loan
      const studentLoan = genzAccounts.find(acc => acc.name === 'Student Loan')
      expect(studentLoan).toBeDefined()
      expect(studentLoan.balance).toBe(-28500)
    })
  })

  describe('Data Integrity', () => {
    test('should maintain correct account balances per profile', () => {
      const { result } = renderHook(() => useAppState())
      
      // Millennial accounts
      const millennialAssets = result.current.accounts
        .filter(acc => acc.type === 'asset')
        .reduce((sum, acc) => sum + acc.balance, 0)
      expect(millennialAssets).toBe(90500)
      
      // Switch to Gen Z
      act(() => {
        result.current.setDemographic('genz')
      })
      
      // Gen Z accounts
      const genzAssets = result.current.accounts
        .filter(acc => acc.type === 'asset')
        .reduce((sum, acc) => sum + acc.balance, 0)
      expect(genzAssets).toBe(8047)
    })

    test('should calculate net worth accurately', () => {
      const { result } = renderHook(() => useAppState())
      
      // Calculate millennial net worth
      const millennialAssets = result.current.accounts
        .filter(acc => acc.type === 'asset')
        .reduce((sum, acc) => sum + acc.balance, 0)
      const millennialLiabilities = Math.abs(
        result.current.accounts
          .filter(acc => acc.type === 'liability')
          .reduce((sum, acc) => sum + acc.balance, 0)
      )
      const millennialNetWorth = millennialAssets - millennialLiabilities
      expect(millennialNetWorth).toBe(74466)
      
      // Switch to Gen Z
      act(() => {
        result.current.setDemographic('genz')
      })
      
      // Calculate Gen Z net worth
      const genzAssets = result.current.accounts
        .filter(acc => acc.type === 'asset')
        .reduce((sum, acc) => sum + acc.balance, 0)
      const genzLiabilities = Math.abs(
        result.current.accounts
          .filter(acc => acc.type === 'liability')
          .reduce((sum, acc) => sum + acc.balance, 0)
      )
      const genzNetWorth = genzAssets - genzLiabilities
      expect(genzNetWorth).toBe(-21653)
    })

    test('should update AI actions based on demographic', () => {
      const { result } = renderHook(() => useAppState())
      
      // Check millennial AI actions
      const millennialAction = result.current.aiActions.find(
        action => action.id === 'high-yield-savings'
      )
      expect(millennialAction.title).toBe('Move to High-Yield Savings')
      expect(millennialAction.potentialSaving).toBe(8)
      
      // Switch to Gen Z
      act(() => {
        result.current.setDemographic('genz')
      })
      
      // Check Gen Z AI actions
      const genzAction = result.current.aiActions.find(
        action => action.id === 'high-yield-savings'
      )
      expect(genzAction.title).toBe('Open High-Yield Savings')
      expect(genzAction.potentialSaving).toBe(15)
    })

    test('should update recurring expenses per profile', () => {
      const { result } = renderHook(() => useAppState())
      
      // Millennial recurring expenses
      expect(result.current.recurringExpenses.total).toBe(1352)
      expect(result.current.recurringExpenses.items[0].name).toBe('Mortgage')
      expect(result.current.recurringExpenses.items[0].amount).toBe(1200)
      
      // Switch to Gen Z
      act(() => {
        result.current.setDemographic('genz')
      })
      
      // Gen Z recurring expenses
      expect(result.current.recurringExpenses.total).toBe(850)
      expect(result.current.recurringExpenses.items[0].name).toBe('Rent')
      expect(result.current.recurringExpenses.items[0].amount).toBe(600)
    })
  })

  describe('Profile State Persistence', () => {
    test('should persist profile selection across component re-renders', () => {
      const { result, rerender } = renderHook(() => useAppState())
      
      // Switch to Gen Z
      act(() => {
        result.current.setDemographic('genz')
      })
      
      // Re-render
      rerender()
      
      // Should still be Gen Z
      expect(result.current.demographic).toBe('genz')
      expect(result.current.monthlyIncome).toBe(3200)
    })

    test('should handle rapid profile switching', () => {
      const { result } = renderHook(() => useAppState())
      
      // Rapid switching
      act(() => {
        result.current.setDemographic('genz')
        result.current.setDemographic('millennial')
        result.current.setDemographic('genz')
        result.current.setDemographic('millennial')
      })
      
      // Should end up with millennial
      expect(result.current.demographic).toBe('millennial')
      expect(result.current.monthlyIncome).toBe(8500)
      expect(result.current.accounts).toHaveLength(7)
    })
  })

  describe('Edge Cases', () => {
    test('should handle profile switch during bill payment', () => {
      const { result } = renderHook(() => useAppState())
      
      const initialCheckingBalance = result.current.accounts.find(
        acc => acc.name === 'Chase Checking'
      ).balance
      
      // Start bill payment
      const billToPay = result.current.bills.find(bill => bill.status === 'due')
      
      // Switch profile
      act(() => {
        result.current.setDemographic('genz')
      })
      
      // Try to pay bill - should use new profile's account
      act(() => {
        result.current.payBill(billToPay.id)
      })
      
      // Check Gen Z checking account was debited
      const genzChecking = result.current.accounts.find(
        acc => acc.name === 'Chase College Checking'
      )
      expect(genzChecking.balance).toBeLessThan(2847)
    })

    test('should handle profile switch with active automations', () => {
      const { result } = renderHook(() => useAppState())
      
      // Add automation
      const automation = {
        title: 'Test Automation',
        description: 'Test',
        schedule: 'Daily',
        action: 'Test Action',
        status: 'active' as const
      }
      
      act(() => {
        result.current.saveAutomation(automation)
      })
      
      expect(result.current.activeAutomations).toHaveLength(1)
      
      // Switch profile
      act(() => {
        result.current.setDemographic('genz')
      })
      
      // Automations should persist
      expect(result.current.activeAutomations).toHaveLength(1)
      expect(result.current.activeAutomations[0].title).toBe('Test Automation')
    })
  })
})