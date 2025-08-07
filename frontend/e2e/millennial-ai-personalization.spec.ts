import { test, expect, Page, ConsoleMessage } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

/**
 * VALIDATOR - Elite Frontend Testing Specialist
 * Test Suite: Established Millennial AI Personalization Validation
 * 
 * This test validates that personalized AI insights are working correctly
 * for the Established Millennial profile ($8,500/mo income)
 */

test.describe('🔥 Established Millennial AI Personalization - Complete Flow Validation', () => {
  let consoleMessages: string[] = []
  let apiCallsLog: { endpoint: string; status: number; timestamp: number }[] = []
  let screenshotCount = 0
  
  // Create test results directory
  const resultsDir = path.join(process.cwd(), 'test-results', 'ai-personalization')
  
  test.beforeAll(async () => {
    // Ensure results directory exists
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true })
    }
  })

  test.beforeEach(async ({ page }) => {
    // Clear logs for each test
    consoleMessages = []
    apiCallsLog = []
    screenshotCount = 0

    // Capture console logs
    page.on('console', (msg: ConsoleMessage) => {
      const text = msg.text()
      consoleMessages.push(`[${msg.type()}] ${text}`)
      
      // Log critical messages immediately
      if (text.includes('AI explanations count:') || 
          text.includes('using fallback data') ||
          text.includes('SIMULATION RESULTS') ||
          text.includes('AI-generated') ||
          text.includes('personalized')) {
        console.log(`📊 Console: ${text}`)
      }
    })

    // Intercept API calls
    page.on('response', async response => {
      const url = response.url()
      if (url.includes('/api/')) {
        const logEntry = {
          endpoint: url,
          status: response.status(),
          timestamp: Date.now()
        }
        apiCallsLog.push(logEntry)
        console.log(`🌐 API Call: ${url.split('/api/')[1]} - Status: ${response.status()}`)
      }
    })

    // Capture errors
    page.on('pageerror', error => {
      console.error(`❌ Page Error: ${error.message}`)
      consoleMessages.push(`[ERROR] ${error.message}`)
    })
  })

  async function captureEvidence(page: Page, name: string, fullPage: boolean = false) {
    screenshotCount++
    const filename = `${screenshotCount.toString().padStart(2, '0')}-${name}.png`
    const filepath = path.join(resultsDir, filename)
    
    await page.screenshot({ 
      path: filepath,
      fullPage: fullPage
    })
    
    console.log(`📸 Screenshot saved: ${filename}`)
    return filepath
  }

  async function saveTestReport(testName: string, results: any) {
    const reportPath = path.join(resultsDir, `${testName}-report.json`)
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2))
    console.log(`📝 Report saved: ${reportPath}`)
  }

  test('Complete Established Millennial Flow with Medical Crisis Simulation', async ({ page }) => {
    test.setTimeout(120000) // 2 minutes timeout for complete flow
    
    const testResults = {
      testName: 'established-millennial-medical-crisis',
      startTime: new Date().toISOString(),
      profile: 'Established Millennial',
      monthlyIncome: 8500,
      steps: [] as any[],
      verifications: [] as any[],
      apiCalls: [] as any[],
      consoleHighlights: [] as string[],
      screenshots: [] as string[]
    }

    try {
      // ========== STEP 1: Navigate to Application ==========
      console.log('\n🚀 STEP 1: Navigating to application...')
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle' })
      await page.waitForLoadState('domcontentloaded')
      
      testResults.steps.push({
        step: 1,
        action: 'Navigate to application',
        timestamp: Date.now(),
        success: true
      })
      
      await captureEvidence(page, 'initial-load')
      
      // Verify login screen is visible
      await expect(page.getByRole('button', { name: 'Continue with FaceID' })).toBeVisible()
      
      // ========== STEP 2: Login Flow ==========
      console.log('\n🔐 STEP 2: Executing login flow...')
      await page.getByRole('button', { name: 'Continue with FaceID' }).click()
      
      // Wait for either dashboard or profile selection
      await page.waitForSelector('text=/FinanceAI|Select Your Profile/i', { timeout: 10000 })
      
      await captureEvidence(page, 'after-login')
      
      testResults.steps.push({
        step: 2,
        action: 'Login with FaceID',
        timestamp: Date.now(),
        success: true
      })

      // ========== STEP 3: Select Established Millennial Profile ==========
      console.log('\n👤 STEP 3: Selecting Established Millennial profile...')
      
      // Check if we're on profile selection screen
      const profileSelectionVisible = await page.locator('text="Select Your Profile"').isVisible().catch(() => false)
      
      if (profileSelectionVisible) {
        console.log('   ✓ Profile selection screen detected')
        
        // Find and click the Established Millennial profile
        const millennialCard = page.locator('text="Established Millennial"').first()
        await expect(millennialCard).toBeVisible({ timeout: 5000 })
        
        // Verify the income level is displayed
        const incomeText = await page.locator('text="$8,500"').first()
        await expect(incomeText).toBeVisible()
        
        await captureEvidence(page, 'profile-selection-millennial-visible')
        
        // Click the profile card
        await millennialCard.click()
        
        testResults.steps.push({
          step: 3,
          action: 'Selected Established Millennial profile',
          timestamp: Date.now(),
          success: true,
          details: 'Income: $8,500/mo'
        })
        
        // Wait for dashboard to load
        await page.waitForSelector('text="FinanceAI"', { timeout: 10000 })
        await page.waitForLoadState('networkidle')
      } else {
        console.log('   ℹ️ Already logged in with a profile, checking current profile...')
        
        // Navigate to profile screen to verify
        const profileButton = page.getByRole('button', { name: /User|Profile/i }).first()
        if (await profileButton.isVisible()) {
          await profileButton.click()
          await page.waitForTimeout(1000)
          await captureEvidence(page, 'profile-check')
          
          // Navigate back to dashboard
          await page.getByText('Dashboard').first().click()
        }
      }
      
      await captureEvidence(page, 'dashboard-loaded')

      // ========== STEP 4: Navigate to Simulations ==========
      console.log('\n🎮 STEP 4: Navigating to Simulations...')
      
      // Click on Simulations in navigation
      const simulationsNav = page.getByText('Simulations').first()
      await expect(simulationsNav).toBeVisible({ timeout: 5000 })
      await simulationsNav.click()
      
      // Wait for simulations screen to load
      await page.waitForSelector('text=/Recommended Simulations|Simulation Scenarios/i', { timeout: 10000 })
      
      await captureEvidence(page, 'simulations-screen')
      
      testResults.steps.push({
        step: 4,
        action: 'Navigate to Simulations',
        timestamp: Date.now(),
        success: true
      })

      // ========== STEP 5: Run Medical Crisis Simulation ==========
      console.log('\n🏥 STEP 5: Running Medical Crisis simulation...')
      
      // Find and click Medical Crisis simulation
      const medicalCrisisCard = page.locator('text="Medical Crisis"').first()
      await expect(medicalCrisisCard).toBeVisible({ timeout: 5000 })
      
      await captureEvidence(page, 'medical-crisis-card-visible')
      
      // Click the simulation card
      await medicalCrisisCard.click()
      
      // Wait for simulation to start
      await page.waitForSelector('text=/Simulating|Processing|Running/i', { timeout: 10000 })
      
      await captureEvidence(page, 'simulation-running')
      
      testResults.steps.push({
        step: 5,
        action: 'Started Medical Crisis simulation',
        timestamp: Date.now(),
        success: true
      })
      
      // Wait for simulation to complete (max 30 seconds)
      console.log('   ⏳ Waiting for simulation to complete...')
      await page.waitForSelector('text=/Results|Recommendations|Insights/i', { 
        timeout: 30000 
      }).catch(async () => {
        // If timeout, capture current state
        await captureEvidence(page, 'simulation-timeout-state', true)
      })
      
      await captureEvidence(page, 'simulation-complete')

      // ========== STEP 6: Verify Personalized Results ==========
      console.log('\n✅ STEP 6: Verifying personalized results...')
      
      // Check console logs for AI explanations
      const aiExplanationLogs = consoleMessages.filter(msg => 
        msg.includes('AI explanations count:') || 
        msg.includes('ai_explanations')
      )
      
      const fallbackLogs = consoleMessages.filter(msg => 
        msg.includes('using fallback data') ||
        msg.includes('Using intelligent fallback')
      )
      
      console.log(`   📊 AI Explanation logs found: ${aiExplanationLogs.length}`)
      console.log(`   ⚠️ Fallback logs found: ${fallbackLogs.length}`)
      
      // Extract AI explanations count from console
      let aiCount = 0
      for (const log of aiExplanationLogs) {
        const match = log.match(/AI explanations count:\s*(\d+)/i)
        if (match) {
          aiCount = parseInt(match[1])
          console.log(`   ✓ AI explanations count: ${aiCount}`)
          break
        }
      }
      
      testResults.verifications.push({
        check: 'AI Explanations Count',
        expected: '>= 3',
        actual: aiCount,
        passed: aiCount >= 3,
        critical: true
      })
      
      testResults.verifications.push({
        check: 'No Fallback Data Used',
        expected: 'No fallback logs',
        actual: `${fallbackLogs.length} fallback logs`,
        passed: fallbackLogs.length === 0,
        critical: true
      })
      
      // Verify personalized titles (not generic "Financial Plan 1/2/3")
      const genericTitles = await page.locator('text=/Financial Plan [123]|Financial Insight [123]/i').count()
      
      testResults.verifications.push({
        check: 'Personalized Titles',
        expected: 'No generic titles',
        actual: `${genericTitles} generic titles found`,
        passed: genericTitles === 0,
        critical: true
      })
      
      // Verify dollar amounts are appropriate for $8,500 income
      const dollarAmounts = await page.locator('text=/\\$[0-9,]+/').all()
      const amounts: number[] = []
      
      for (const element of dollarAmounts) {
        const text = await element.textContent()
        if (text) {
          const amount = parseFloat(text.replace(/[$,]/g, ''))
          if (!isNaN(amount) && amount > 0) {
            amounts.push(amount)
          }
        }
      }
      
      console.log(`   💰 Dollar amounts found: ${amounts.length}`)
      console.log(`   💰 Sample amounts: ${amounts.slice(0, 5).join(', ')}`)
      
      // Check if amounts are reasonable for $8,500/mo income
      const reasonableAmounts = amounts.filter(amt => 
        amt >= 100 && amt <= 25000 // Reasonable range for this income level
      )
      
      testResults.verifications.push({
        check: 'Reasonable Dollar Amounts',
        expected: 'Amounts between $100-$25,000',
        actual: `${reasonableAmounts.length}/${amounts.length} amounts in range`,
        passed: reasonableAmounts.length > 0,
        critical: false
      })
      
      // Verify specific action steps are present
      const actionSteps = await page.locator('text=/Step [0-9]|•/').count()
      
      testResults.verifications.push({
        check: 'Action Steps Present',
        expected: '>= 3 steps',
        actual: `${actionSteps} steps found`,
        passed: actionSteps >= 3,
        critical: false
      })
      
      await captureEvidence(page, 'final-results', true)

      // ========== STEP 7: API Call Verification ==========
      console.log('\n🌐 STEP 7: Verifying API calls...')
      
      const simulationAPICalls = apiCallsLog.filter(call => 
        call.endpoint.includes('/simulation/')
      )
      
      const successfulAPICalls = simulationAPICalls.filter(call => 
        call.status === 200
      )
      
      testResults.verifications.push({
        check: 'Simulation API Success',
        expected: 'Status 200',
        actual: `${successfulAPICalls.length}/${simulationAPICalls.length} successful`,
        passed: successfulAPICalls.length > 0,
        critical: true
      })
      
      // Store API calls in report
      testResults.apiCalls = apiCallsLog

      // ========== FINAL VERIFICATION SUMMARY ==========
      console.log('\n' + '='.repeat(60))
      console.log('📋 VERIFICATION SUMMARY')
      console.log('='.repeat(60))
      
      const criticalChecks = testResults.verifications.filter(v => v.critical)
      const passedCritical = criticalChecks.filter(v => v.passed)
      
      console.log(`\n✅ Critical Checks: ${passedCritical.length}/${criticalChecks.length} passed`)
      
      for (const verification of testResults.verifications) {
        const icon = verification.passed ? '✅' : '❌'
        const critical = verification.critical ? '[CRITICAL]' : ''
        console.log(`${icon} ${critical} ${verification.check}: ${verification.actual}`)
      }
      
      // Store console highlights
      testResults.consoleHighlights = consoleMessages.filter(msg =>
        msg.includes('AI explanations') ||
        msg.includes('personalized') ||
        msg.includes('fallback') ||
        msg.includes('ERROR')
      )
      
      // Final assertions
      expect(aiCount).toBeGreaterThanOrEqual(3)
      expect(fallbackLogs.length).toBe(0)
      expect(genericTitles).toBe(0)
      expect(successfulAPICalls.length).toBeGreaterThan(0)
      
      testResults.steps.push({
        step: 7,
        action: 'Verification complete',
        timestamp: Date.now(),
        success: true,
        summary: `${passedCritical.length}/${criticalChecks.length} critical checks passed`
      })

    } catch (error) {
      console.error('❌ Test failed:', error)
      await captureEvidence(page, 'error-state', true)
      
      testResults.steps.push({
        step: 'ERROR',
        action: 'Test failed',
        timestamp: Date.now(),
        success: false,
        error: error.message
      })
      
      throw error
    } finally {
      // Save test report
      testResults.endTime = new Date().toISOString()
      await saveTestReport('millennial-medical-crisis', testResults)
      
      // Save console logs
      const logsPath = path.join(resultsDir, 'console-logs.txt')
      fs.writeFileSync(logsPath, consoleMessages.join('\n'))
      
      console.log('\n' + '='.repeat(60))
      console.log('📊 TEST COMPLETE')
      console.log(`📁 Results saved to: ${resultsDir}`)
      console.log(`📸 Screenshots captured: ${screenshotCount}`)
      console.log(`📝 Console messages logged: ${consoleMessages.length}`)
      console.log(`🌐 API calls tracked: ${apiCallsLog.length}`)
      console.log('='.repeat(60))
    }
  })

  test('Edge Case: Rapid Simulation Switching', async ({ page }) => {
    test.setTimeout(60000)
    
    console.log('\n🔥 Testing rapid simulation switching...')
    
    // Quick login
    await page.goto('http://localhost:3000')
    await page.getByRole('button', { name: 'Continue with FaceID' }).click()
    
    // Navigate to simulations
    await page.getByText('Simulations').first().click()
    await page.waitForSelector('text=/Recommended Simulations/i')
    
    // Rapidly click different simulations
    const simulations = ['Medical Crisis', 'Job Loss Scenario', 'Market Crash Impact']
    
    for (const sim of simulations) {
      const card = page.locator(`text="${sim}"`).first()
      if (await card.isVisible()) {
        await card.click()
        await page.waitForTimeout(500) // Brief wait
        
        // Go back to simulations
        const backButton = page.locator('button:has-text("Back")').first()
        if (await backButton.isVisible()) {
          await backButton.click()
        } else {
          await page.getByText('Simulations').first().click()
        }
      }
    }
    
    // Verify app stability
    await expect(page.getByText('FinanceAI')).toBeVisible()
    
    console.log('   ✅ App remained stable during rapid switching')
  })

  test('Performance: Simulation Response Time', async ({ page }) => {
    test.setTimeout(60000)
    
    console.log('\n⚡ Testing simulation performance...')
    
    // Quick login
    await page.goto('http://localhost:3000')
    await page.getByRole('button', { name: 'Continue with FaceID' }).click()
    
    // Navigate to simulations
    await page.getByText('Simulations').first().click()
    await page.waitForSelector('text=/Recommended Simulations/i')
    
    // Measure simulation execution time
    const startTime = Date.now()
    
    await page.locator('text="Medical Crisis"').first().click()
    
    // Wait for results
    await page.waitForSelector('text=/Results|Recommendations/i', { timeout: 30000 })
    
    const endTime = Date.now()
    const responseTime = (endTime - startTime) / 1000
    
    console.log(`   ⏱️ Simulation completed in ${responseTime.toFixed(2)} seconds`)
    
    // Performance assertion
    expect(responseTime).toBeLessThan(30) // Should complete within 30 seconds
    
    testResults.verifications.push({
      check: 'Simulation Performance',
      expected: '< 30 seconds',
      actual: `${responseTime.toFixed(2)} seconds`,
      passed: responseTime < 30,
      critical: false
    })
  })
})

// Helper test to ensure backend is running
test.describe('Prerequisites', () => {
  test('Backend API is accessible', async ({ request }) => {
    const response = await request.get('http://localhost:8000/health').catch(() => null)
    
    if (!response || response.status() !== 200) {
      console.error('\n❌ Backend API is not accessible at http://localhost:8000')
      console.error('   Please ensure the Python backend is running:')
      console.error('   cd backend/python_engine && python run_server.py')
      throw new Error('Backend API not accessible')
    }
    
    console.log('✅ Backend API is running')
  })
})