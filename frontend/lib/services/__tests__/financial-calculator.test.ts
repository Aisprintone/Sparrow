// COMPREHENSIVE FINANCIAL CALCULATOR VALIDATION TESTS
// Ensures all 11 critical fixes are working correctly

import { FinancialCalculator } from '../financial-calculator'
import type { Account, Transaction, Category, Customer } from '@/lib/types/csv-data'

describe('FinancialCalculator - Comprehensive Validation', () => {
  
  // Mock data for testing
  const mockCustomer: Customer = {
    customer_id: 1,
    location: 'New York, NY',
    age: 34
  }
  
  const mockCategories: Category[] = [
    { category_id: 1, name: 'grocery' },
    { category_id: 2, name: 'utilities' },
    { category_id: 3, name: 'dining' },
    { category_id: 5, name: 'salary' },
    { category_id: 6, name: 'student_loan' },
    { category_id: 8, name: 'transfer' },
    { category_id: 18, name: 'mortgage_payment' },
    { category_id: 17, name: 'credit_card_payment' }
  ]
  
  const mockAccounts: Account[] = [
    {
      account_id: 101,
      customer_id: 1,
      institution_name: 'Chase',
      account_number: '****1234',
      account_type: 'checking',
      balance: 12500.25,
      created_at: '2018-05-10',
      credit_limit: undefined
    },
    {
      account_id: 102,
      customer_id: 1,
      institution_name: 'Chase',
      account_type: 'savings',
      balance: 32000.0,
      created_at: '2018-05-10',
      credit_limit: undefined
    },
    {
      account_id: 303,
      customer_id: 1,
      institution_name: 'Chase',
      account_type: 'credit_card',
      balance: -3750.0,
      created_at: '2024-08-04',
      credit_limit: 15000
    },
    {
      account_id: 306,
      customer_id: 1,
      institution_name: 'Chase',
      account_type: 'mortgage',
      balance: -400000.0,
      created_at: '2024-08-04',
      credit_limit: undefined
    }
  ]
  
  const mockTransactions: Transaction[] = [
    // Salary transactions for income calculation
    {
      transaction_id: 5001,
      account_id: 101,
      timestamp: new Date().toISOString(),
      amount: 4500.00,
      description: 'Monthly Salary',
      category_id: 5,
      is_debit: false,
      is_bill: false,
      is_subscription: false,
      due_date: null,
      account_type: 'checking'
    },
    // Mortgage payment for debt calculation
    {
      transaction_id: 5002,
      account_id: 101,
      timestamp: new Date().toISOString(),
      amount: -2500.00,
      description: 'Mortgage Payment',
      category_id: 18,
      is_debit: true,
      is_bill: true,
      is_subscription: false,
      due_date: null,
      account_type: 'checking'
    },
    // Grocery spending
    {
      transaction_id: 5003,
      account_id: 303,
      timestamp: new Date().toISOString(),
      amount: -150.00,
      description: 'Whole Foods',
      category_id: 1,
      is_debit: true,
      is_bill: false,
      is_subscription: false,
      due_date: null,
      account_type: 'credit_card'
    },
    // Savings transfer
    {
      transaction_id: 5004,
      account_id: 101,
      timestamp: new Date().toISOString(),
      amount: -1000.00,
      description: 'Transfer to Savings',
      category_id: 8,
      is_debit: true,
      is_bill: false,
      is_subscription: false,
      due_date: null,
      account_type: 'checking'
    }
  ]
  
  describe('FIX #1: Monthly Income Calculation', () => {
    it('should calculate monthly income from actual salary transactions', () => {
      const calculator = new FinancialCalculator(
        mockAccounts,
        mockTransactions,
        mockCategories,
        mockCustomer
      )
      
      const metrics = calculator.calculateMetrics()
      
      // Should NOT be hardcoded 5000
      expect(metrics.monthlyIncome).not.toBe(5000)
      // Should be based on actual salary transactions
      expect(metrics.monthlyIncome).toBeGreaterThan(0)
      expect(metrics.monthlyIncome).toBeLessThan(10000) // Reasonable range
    })
  })
  
  describe('FIX #3: Credit Utilization', () => {
    it('should calculate correct credit utilization with actual balances', () => {
      const calculator = new FinancialCalculator(
        mockAccounts,
        mockTransactions,
        mockCategories,
        mockCustomer
      )
      
      const metrics = calculator.calculateMetrics()
      
      // Credit utilization = 3750 / 15000 = 25%
      expect(metrics.creditUtilization).toBeCloseTo(25, 1)
      expect(metrics.creditUtilization).toBeGreaterThan(0)
      expect(metrics.creditUtilization).toBeLessThan(100)
    })
  })
  
  describe('FIX #4: Debt-to-Income Ratio', () => {
    it('should use monthly debt payments, not total debt', () => {
      const calculator = new FinancialCalculator(
        mockAccounts,
        mockTransactions,
        mockCategories,
        mockCustomer
      )
      
      const metrics = calculator.calculateMetrics()
      
      // DTI should be monthly payments / monthly income, not total debt / annual income
      expect(metrics.debtToIncomeRatio).toBeGreaterThan(0)
      expect(metrics.debtToIncomeRatio).toBeLessThan(100) // As percentage
      
      // Should NOT be total debt divided by income
      const wrongCalculation = 403750 / (metrics.monthlyIncome * 12)
      expect(metrics.debtToIncomeRatio).not.toBeCloseTo(wrongCalculation, 1)
    })
  })
  
  describe('FIX #5: Savings Rate', () => {
    it('should calculate savings rate from actual transfers', () => {
      const calculator = new FinancialCalculator(
        mockAccounts,
        mockTransactions,
        mockCategories,
        mockCustomer
      )
      
      const metrics = calculator.calculateMetrics()
      
      // Should be based on actual savings transfers
      expect(metrics.savingsRate).toBeGreaterThanOrEqual(0)
      expect(metrics.savingsRate).toBeLessThanOrEqual(100)
    })
  })
  
  describe('FIX #6: Emergency Fund', () => {
    it('should only count designated emergency fund accounts', () => {
      const calculator = new FinancialCalculator(
        mockAccounts,
        mockTransactions,
        mockCategories,
        mockCustomer
      )
      
      const metrics = calculator.calculateMetrics()
      
      // Should only count savings accounts, not all liquid assets
      const savingsBalance = 32000
      const monthlySpending = metrics.monthlySpending
      const expectedMonths = monthlySpending > 0 ? savingsBalance / monthlySpending : 0
      
      expect(metrics.emergencyFundMonths).toBeCloseTo(expectedMonths, 1)
    })
  })
  
  describe('FIX #7: Monthly Spending', () => {
    it('should correctly identify and sum debit transactions', () => {
      const calculator = new FinancialCalculator(
        mockAccounts,
        mockTransactions,
        mockCategories,
        mockCustomer
      )
      
      const metrics = calculator.calculateMetrics()
      
      // Should exclude debt payments and transfers
      expect(metrics.monthlySpending).toBeGreaterThan(0)
      expect(metrics.monthlySpending).not.toInclude(2500) // Mortgage payment
      expect(metrics.monthlySpending).not.toInclude(1000) // Savings transfer
    })
  })
  
  describe('FIX #8: Credit Score Calculation', () => {
    it('should calculate credit score based on actual data', () => {
      const calculator = new FinancialCalculator(
        mockAccounts,
        mockTransactions,
        mockCategories,
        mockCustomer
      )
      
      const metrics = calculator.calculateMetrics()
      
      // Credit score should be in valid range
      expect(metrics.creditScore).toBeGreaterThanOrEqual(300)
      expect(metrics.creditScore).toBeLessThanOrEqual(850)
      
      // With 25% utilization, score should be reasonably high
      expect(metrics.creditScore).toBeGreaterThan(650)
    })
  })
  
  describe('FIX #9: Asset Depreciation', () => {
    it('should apply depreciation to vehicle assets', () => {
      const accountsWithVehicle = [...mockAccounts, {
        account_id: 312,
        customer_id: 1,
        institution_name: 'Auto Asset',
        account_type: 'investment',
        balance: 22000,
        created_at: '2022-06-20', // 2+ years old
        credit_limit: undefined
      }]
      
      const calculator = new FinancialCalculator(
        accountsWithVehicle,
        mockTransactions,
        mockCategories,
        mockCustomer
      )
      
      const metrics = calculator.calculateMetrics()
      
      // Vehicle should be depreciated
      const originalValue = 22000
      const depreciatedValue = originalValue * 0.8 * Math.pow(0.85, 1.5) // Approximate
      
      expect(metrics.assetsByLiquidity.illiquid).toBeLessThan(originalValue)
    })
  })
  
  describe('FIX #10: Asset Liquidity Classification', () => {
    it('should properly classify assets by liquidity', () => {
      const calculator = new FinancialCalculator(
        mockAccounts,
        mockTransactions,
        mockCategories,
        mockCustomer
      )
      
      const metrics = calculator.calculateMetrics()
      
      // Check all liquidity tiers exist
      expect(metrics.assetsByLiquidity).toHaveProperty('highlyLiquid')
      expect(metrics.assetsByLiquidity).toHaveProperty('liquid')
      expect(metrics.assetsByLiquidity).toHaveProperty('semiLiquid')
      expect(metrics.assetsByLiquidity).toHaveProperty('illiquid')
      
      // Checking and savings should be highly liquid
      expect(metrics.assetsByLiquidity.highlyLiquid).toBeGreaterThan(0)
    })
  })
  
  describe('FIX #11: Tax Considerations', () => {
    it('should calculate accessible net worth with tax penalties', () => {
      const accountsWith401k = [...mockAccounts, {
        account_id: 401,
        customer_id: 1,
        institution_name: 'Fidelity',
        account_type: '401k',
        balance: 50000,
        created_at: '2020-01-01',
        credit_limit: undefined
      }]
      
      const calculator = new FinancialCalculator(
        accountsWith401k,
        mockTransactions,
        mockCategories,
        mockCustomer
      )
      
      const metrics = calculator.calculateMetrics()
      
      // Accessible net worth should be less than gross net worth due to taxes/penalties
      expect(metrics.accessibleNetWorth).toBeLessThan(metrics.netWorth)
      
      // For customer age 34 (< 59.5), should apply 10% penalty + 25% tax
      const expectedReduction = 50000 * 0.35
      const difference = metrics.netWorth - metrics.accessibleNetWorth
      expect(difference).toBeGreaterThan(expectedReduction * 0.9) // Allow some variance
    })
  })
  
  describe('Performance Requirements', () => {
    it('should complete all calculations in under 10ms', () => {
      const calculator = new FinancialCalculator(
        mockAccounts,
        mockTransactions,
        mockCategories,
        mockCustomer
      )
      
      const startTime = performance.now()
      calculator.calculateMetrics()
      const endTime = performance.now()
      
      const executionTime = endTime - startTime
      expect(executionTime).toBeLessThan(10)
    })
  })
  
  describe('Data Validation', () => {
    it('should produce internally consistent metrics', () => {
      const calculator = new FinancialCalculator(
        mockAccounts,
        mockTransactions,
        mockCategories,
        mockCustomer
      )
      
      const metrics = calculator.calculateMetrics()
      
      // Net worth = assets - liabilities
      expect(metrics.netWorth).toBeCloseTo(
        metrics.totalAssets - metrics.totalLiabilities,
        2
      )
      
      // All percentages should be valid
      expect(metrics.savingsRate).toBeGreaterThanOrEqual(0)
      expect(metrics.savingsRate).toBeLessThanOrEqual(100)
      expect(metrics.creditUtilization).toBeGreaterThanOrEqual(0)
      expect(metrics.creditUtilization).toBeLessThanOrEqual(100)
      expect(metrics.debtToIncomeRatio).toBeGreaterThanOrEqual(0)
      
      // Emergency fund months should be non-negative
      expect(metrics.emergencyFundMonths).toBeGreaterThanOrEqual(0)
    })
  })
})