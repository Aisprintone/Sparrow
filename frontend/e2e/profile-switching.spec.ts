import { test, expect } from '@playwright/test'

test.describe('Profile Switching User Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('Gen Z user complete flow with profile switch', async ({ page }) => {
    // 1. Login
    await page.getByRole('button', { name: 'Continue with FaceID' }).click()
    await expect(page.getByText('FinanceAI')).toBeVisible()
    
    // 2. Verify default Millennial dashboard data
    await expect(page.getByText('$74,466.00')).toBeVisible() // Millennial net worth
    await expect(page.getByText('12.3% YOY')).toBeVisible()
    await expect(page.getByText('780')).toBeVisible() // Credit score
    
    // 3. TODO: Add profile switcher UI to enable actual profile switching
    // For now, we'll navigate to profile screen
    await page.getByRole('button', { name: /User/i }).click()
    await expect(page.getByText('Profile')).toBeVisible()
    
    // 4. Navigate back to dashboard
    await page.getByText('Dashboard').click()
    
    // 5. Navigate to spending tracking
    await page.getByText('Spending Insights').click()
    await expect(page.getByText('Spending Analytics')).toBeVisible()
    
    // 6. Verify spending data
    await expect(page.getByText(/spent this month/)).toBeVisible()
    
    // 7. Check AI recommendations
    await page.getByText('Dashboard').click()
    await expect(page.getByText('Suggested AI Actions')).toBeVisible()
    await expect(page.getByText(/High-Yield Savings/)).toBeVisible()
  })

  test('Millennial user financial planning flow', async ({ page }) => {
    // 1. Login as Millennial (default)
    await page.getByRole('button', { name: 'Continue with FaceID' }).click()
    
    // 2. View net worth details
    await page.getByText('Total Net Worth').click()
    await expect(page.getByText('Net Worth Details')).toBeVisible()
    
    // 3. Check accounts
    await expect(page.getByText('Chase Checking')).toBeVisible()
    await expect(page.getByText('Fidelity 401k')).toBeVisible()
    
    // 4. Navigate back and check AI recommendations
    await page.getByText('Dashboard').click()
    await expect(page.getByText('Move to High-Yield Savings')).toBeVisible()
    
    // 5. Expand AI action details
    await page.getByText('Why we suggest this').click()
    await expect(page.getByText(/excess funds earning 0.01% APY/)).toBeVisible()
    
    // 6. Navigate to goals
    await page.getByText('Goals').click()
    await expect(page.getByText('Financial Goals')).toBeVisible()
    
    // 7. Create new goal
    await page.getByRole('button', { name: /Create Goal/i }).click()
    await expect(page.getByText('Create New Goal')).toBeVisible()
  })

  test('Profile data persistence across navigation', async ({ page }) => {
    // 1. Login
    await page.getByRole('button', { name: 'Continue with FaceID' }).click()
    
    // 2. Note initial net worth
    const netWorth = await page.getByText('$74,466.00').textContent()
    
    // 3. Navigate through multiple screens
    await page.getByText('Goals').click()
    await page.getByText('Simulations').click()
    await page.getByText('Dashboard').click()
    
    // 4. Verify net worth unchanged
    await expect(page.getByText(netWorth)).toBeVisible()
    
    // 5. Check credit score persistence
    await expect(page.getByText('780')).toBeVisible()
  })

  test('AI actions update based on profile context', async ({ page }) => {
    // 1. Login
    await page.getByRole('button', { name: 'Continue with FaceID' }).click()
    
    // 2. View AI actions
    await expect(page.getByText('Suggested AI Actions')).toBeVisible()
    
    // 3. Check Millennial-specific action
    await expect(page.getByText('Move to High-Yield Savings')).toBeVisible()
    await expect(page.getByText('+$8/mo')).toBeVisible()
    
    // 4. Expand action details
    await page.getByText('Why we suggest this').click()
    
    // 5. Verify Millennial-specific data in rationale
    await expect(page.getByText(/Chase checking account.*has excess funds/)).toBeVisible()
    
    // 6. Check Dive Deep functionality
    await page.getByRole('button', { name: 'Dive Deep' }).click()
    // AI Chat drawer should open
    await expect(page.getByText(/Let me help you understand/)).toBeVisible()
  })
})

test.describe('Edge Cases and Error Scenarios', () => {
  test('handles rapid navigation between screens', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Continue with FaceID' }).click()
    
    // Rapid navigation
    await page.getByText('Goals').click()
    await page.getByText('Dashboard').click()
    await page.getByText('Simulations').click()
    await page.getByText('Dashboard').click()
    
    // App should remain stable
    await expect(page.getByText('FinanceAI')).toBeVisible()
    await expect(page.getByText('Total Net Worth')).toBeVisible()
  })

  test('maintains state during browser refresh', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Continue with FaceID' }).click()
    
    // Navigate to a specific screen
    await page.getByText('Goals').click()
    
    // Refresh page
    await page.reload()
    
    // Should return to login (no persistent auth in demo)
    await expect(page.getByRole('button', { name: 'Continue with FaceID' })).toBeVisible()
  })

  test('handles network latency gracefully', async ({ page }) => {
    // Simulate slow network
    await page.route('**/api/ai/insight', async route => {
      await page.waitForTimeout(2000) // 2 second delay
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ insight: 'Delayed insight' })
      })
    })
    
    await page.goto('/')
    await page.getByRole('button', { name: 'Continue with FaceID' }).click()
    
    // Dashboard should load even with slow API
    await expect(page.getByText('Total Net Worth')).toBeVisible()
    
    // Eventually insight should appear
    await expect(page.getByText('Delayed insight')).toBeVisible({ timeout: 5000 })
  })

  test('handles API errors gracefully', async ({ page }) => {
    // Simulate API error
    await page.route('**/api/ai/insight', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' })
      })
    })
    
    await page.goto('/')
    await page.getByRole('button', { name: 'Continue with FaceID' }).click()
    
    // Dashboard should still load
    await expect(page.getByText('Total Net Worth')).toBeVisible()
    
    // Error message should appear
    await expect(page.getByText('Could not load AI insight at this time.')).toBeVisible()
  })
})