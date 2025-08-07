#!/usr/bin/env tsx
// VALIDATION SCRIPT - TESTS ALL FINANCIAL CALCULATION FIXES
// Run with: npx tsx scripts/validate-calculations.ts

async function validateCalculations() {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000'
  
  console.log('🔬 FINANCIAL CALCULATION ENGINE VALIDATION')
  console.log('==========================================\n')
  
  const profileTests = [
    { id: 1, name: 'Millennial Professional (34, NYC)', expectedIncome: [7000, 9000] },
    { id: 2, name: 'Family-focused (33, NYC)', expectedIncome: [5500, 7500] },
    { id: 3, name: 'Young Professional (23, Austin)', expectedIncome: [2800, 4200] }
  ]
  
  for (const profile of profileTests) {
    console.log(`\n📊 Testing Profile ${profile.id}: ${profile.name}`)
    console.log('─'.repeat(50))
    
    try {
      const response = await fetch(`${baseUrl}/api/profiles/${profile.id}`)
      const data = await response.json()
      
      if (!data.success) {
        console.error(`❌ Failed to fetch profile ${profile.id}: ${data.error}`)
        continue
      }
      
      const metrics = data.data.metrics
      
      // Validation checks
      const validations = [
        {
          name: 'FIX #1: Monthly Income',
          check: () => {
            const income = metrics.monthlyIncome
            const inRange = income >= profile.expectedIncome[0] && income <= profile.expectedIncome[1]
            return {
              passed: income !== 5000 && inRange,
              value: `$${income.toFixed(2)}`,
              message: income === 5000 ? 'Still hardcoded to $5000!' : 
                      !inRange ? `Out of expected range ${profile.expectedIncome}` : 'Calculated from transactions'
            }
          }
        },
        {
          name: 'FIX #3: Credit Utilization',
          check: () => {
            const util = metrics.creditUtilization
            return {
              passed: util > 0 && util < 100,
              value: `${util.toFixed(1)}%`,
              message: util === 0 ? 'No balances on credit cards!' : 
                      util > 30 ? 'High utilization (affects credit score)' : 'Healthy utilization'
            }
          }
        },
        {
          name: 'FIX #4: Debt-to-Income Ratio',
          check: () => {
            const dti = metrics.debtToIncomeRatio
            const monthlyDebt = metrics.monthlyDebtPayments || 0
            return {
              passed: dti > 0 && dti < 100,
              value: `${dti.toFixed(1)}%`,
              message: `Monthly debt payments: $${monthlyDebt.toFixed(2)}`
            }
          }
        },
        {
          name: 'FIX #5: Savings Rate',
          check: () => {
            const rate = metrics.savingsRate
            return {
              passed: rate >= 0 && rate <= 100,
              value: `${rate.toFixed(1)}%`,
              message: rate === 0 ? 'No savings detected' : 'Based on actual transfers'
            }
          }
        },
        {
          name: 'FIX #6: Emergency Fund',
          check: () => {
            const months = metrics.emergencyFundMonths
            return {
              passed: months >= 0,
              value: `${months.toFixed(1)} months`,
              message: months < 3 ? 'Below recommended 3-6 months' : 'Adequate emergency fund'
            }
          }
        },
        {
          name: 'FIX #7: Monthly Spending',
          check: () => {
            const spending = metrics.monthlySpending
            return {
              passed: spending > 0 && spending < metrics.monthlyIncome * 2,
              value: `$${spending.toFixed(2)}`,
              message: 'Excludes debt payments and transfers'
            }
          }
        },
        {
          name: 'FIX #8: Credit Score',
          check: () => {
            const score = metrics.creditScore
            return {
              passed: score >= 300 && score <= 850,
              value: score.toString(),
              message: score > 720 ? 'Excellent' : score > 650 ? 'Good' : 'Fair'
            }
          }
        },
        {
          name: 'FIX #9-10: Asset Classification',
          check: () => {
            const liquidity = metrics.assetsByLiquidity
            return {
              passed: liquidity && typeof liquidity === 'object',
              value: liquidity ? `Liquid: $${(liquidity.highlyLiquid || 0).toFixed(0)}` : 'N/A',
              message: liquidity ? 'Assets classified by liquidity' : 'Missing liquidity data'
            }
          }
        },
        {
          name: 'FIX #11: Accessible Net Worth',
          check: () => {
            const accessible = metrics.accessibleNetWorth
            const gross = metrics.netWorth
            return {
              passed: accessible !== undefined && accessible <= gross,
              value: accessible ? `$${accessible.toFixed(0)}` : 'N/A',
              message: accessible ? `After tax: ${((accessible/gross)*100).toFixed(0)}% of gross` : 'Not calculated'
            }
          }
        }
      ]
      
      // Run validations
      let passed = 0
      let failed = 0
      
      for (const validation of validations) {
        const result = validation.check()
        const icon = result.passed ? '✅' : '❌'
        const status = result.passed ? 'PASS' : 'FAIL'
        
        console.log(`${icon} ${validation.name}: ${status}`)
        console.log(`   Value: ${result.value}`)
        console.log(`   ${result.message}`)
        
        if (result.passed) passed++
        else failed++
      }
      
      // Performance check
      const computeTime = data.meta?.computeTime || 0
      const perfIcon = computeTime < 10 ? '⚡' : '🐌'
      console.log(`\n${perfIcon} Performance: ${computeTime.toFixed(2)}ms`)
      
      // Summary
      console.log(`\n📈 Summary: ${passed}/${validations.length} checks passed`)
      
      if (failed > 0) {
        console.log(`⚠️  ${failed} issues need attention`)
      } else {
        console.log('🎉 All calculations validated successfully!')
      }
      
    } catch (error) {
      console.error(`❌ Error testing profile ${profile.id}:`, error)
    }
  }
  
  console.log('\n' + '='.repeat(50))
  console.log('VALIDATION COMPLETE')
}

// Run validation
validateCalculations().catch(console.error)