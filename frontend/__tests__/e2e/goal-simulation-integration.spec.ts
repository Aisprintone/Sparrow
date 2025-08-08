import { test, expect } from '@playwright/test'

test.describe('Goal-Simulation Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000')
    await page.click('text=Continue with FaceID')
    await page.click('text=Gen Z Student')
  })

  test('should suggest relevant simulations for a goal', async ({ page }) => {
    // Create a home purchase goal
    await page.click('text=Goals')
    await page.click('text=Add New Goal')
    await page.fill('[data-testid="goal-title"]', 'Buy a House')
    await page.selectOption('[data-testid="goal-type"]', 'home')
    await page.fill('[data-testid="goal-target"]', '50000')
    await page.fill('[data-testid="goal-deadline"]', '2027-12-31')
    await page.fill('[data-testid="goal-monthly-contribution"]', '1000')
    await page.click('text=Create Goal')
    
    // View goal details
    await page.click('text=Buy a House')
    
    // Verify simulation suggestions
    await expect(page.locator('text=Suggested Simulations')).toBeVisible()
    await expect(page.locator('text=Buy vs Rent Analysis')).toBeVisible()
    await expect(page.locator('text=Emergency Fund Boost')).toBeVisible()
  })

  test('should run simulation from goal context', async ({ page }) => {
    // Create a goal
    await page.click('text=Goals')
    await page.click('text=Add New Goal')
    await page.fill('[data-testid="goal-title"]', 'Emergency Fund')
    await page.selectOption('[data-testid="goal-type"]', 'safety')
    await page.fill('[data-testid="goal-target"]', '15000')
    await page.fill('[data-testid="goal-deadline"]', '2025-12-31')
    await page.fill('[data-testid="goal-monthly-contribution"]', '500')
    await page.click('text=Create Goal')
    
    // Run simulation from goal
    await page.click('text=Emergency Fund')
    await page.click('text=Emergency Fund Boost')
    await page.click('text=Run Simulation')
    
    // Verify simulation runs
    await expect(page.locator('text=Simulating')).toBeVisible()
    await expect(page.locator('text=Simulation Complete')).toBeVisible()
  })

  test('should show goal impact from simulation results', async ({ page }) => {
    // Create goal and run simulation
    await page.click('text=Goals')
    await page.click('text=Add New Goal')
    await page.fill('[data-testid="goal-title"]', 'Retirement Savings')
    await page.selectOption('[data-testid="goal-type"]', 'safety')
    await page.fill('[data-testid="goal-target"]', '100000')
    await page.fill('[data-testid="goal-deadline"]', '2030-12-31')
    await page.fill('[data-testid="goal-monthly-contribution"]', '500')
    await page.click('text=Create Goal')
    
    // Run 401k simulation
    await page.click('text=Retirement Savings')
    await page.click('text=Max out 401k')
    await page.click('text=Run Simulation')
    
    // Wait for simulation to complete
    await page.waitForSelector('text=Simulation Complete')
    
    // Verify goal impact shown
    await expect(page.locator('text=Goal Impact')).toBeVisible()
    await expect(page.locator('text=Timeline Accelerated')).toBeVisible()
  })

  test('should update goal progress from simulation', async ({ page }) => {
    // Create goal
    await page.click('text=Goals')
    await page.click('text=Add New Goal')
    await page.fill('[data-testid="goal-title"]', 'Debt Payoff')
    await page.selectOption('[data-testid="goal-type"]', 'safety')
    await page.fill('[data-testid="goal-target"]', '10000')
    await page.fill('[data-testid="goal-deadline"]', '2026-06-30')
    await page.fill('[data-testid="goal-monthly-contribution"]', '300')
    await page.click('text=Create Goal')
    
    // Run debt avalanche simulation
    await page.click('text=Debt Payoff')
    await page.click('text=Debt Avalanche')
    await page.click('text=Run Simulation')
    
    // Apply simulation results to goal
    await page.waitForSelector('text=Simulation Complete')
    await page.click('text=Apply to Goal')
    
    // Verify goal progress updated
    await expect(page.locator('text=Progress Updated')).toBeVisible()
  })

  test('should show AI actions for goal achievement', async ({ page }) => {
    // Create goal
    await page.click('text=Goals')
    await page.click('text=Add New Goal')
    await page.fill('[data-testid="goal-title"]', 'Vacation Fund')
    await page.selectOption('[data-testid="goal-type"]', 'experience')
    await page.fill('[data-testid="goal-target"]', '5000')
    await page.fill('[data-testid="goal-deadline"]', '2025-06-30')
    await page.fill('[data-testid="goal-monthly-contribution"]', '200')
    await page.click('text=Create Goal')
    
    // View AI actions
    await page.click('text=Vacation Fund')
    await page.click('text=AI Actions')
    
    // Verify AI actions shown
    await expect(page.locator('text=Optimize Savings')).toBeVisible()
    await expect(page.locator('text=Automate Transfers')).toBeVisible()
  })

  test('should execute AI action for goal', async ({ page }) => {
    // Create goal and navigate to AI actions
    await page.click('text=Goals')
    await page.click('text=Add New Goal')
    await page.fill('[data-testid="goal-title"]', 'Investment Portfolio')
    await page.selectOption('[data-testid="goal-type"]', 'safety')
    await page.fill('[data-testid="goal-target"]', '25000')
    await page.fill('[data-testid="goal-deadline"]', '2028-12-31')
    await page.fill('[data-testid="goal-monthly-contribution"]', '400')
    await page.click('text=Create Goal')
    
    await page.click('text=Investment Portfolio')
    await page.click('text=AI Actions')
    
    // Execute AI action
    await page.click('text=Optimize Investment Strategy')
    await page.click('text=Execute Action')
    
    // Verify action executed
    await expect(page.locator('text=Action Executed')).toBeVisible()
    await expect(page.locator('text=Goal Progress Updated')).toBeVisible()
  })
})
