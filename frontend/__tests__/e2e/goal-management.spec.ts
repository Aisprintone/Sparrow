import { test, expect } from '@playwright/test'

test.describe('Goal Management System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000')
    // Login and navigate to goals
    await page.click('text=Continue with FaceID')
    await page.click('text=Gen Z Student')
    await page.click('text=Goals')
  })

  test('should create a new goal', async ({ page }) => {
    await page.click('text=Add New Goal')
    
    // Fill goal form
    await page.fill('[data-testid="goal-title"]', 'Test Goal')
    await page.selectOption('[data-testid="goal-type"]', 'safety')
    await page.fill('[data-testid="goal-target"]', '5000')
    await page.fill('[data-testid="goal-deadline"]', '2025-12-31')
    await page.fill('[data-testid="goal-monthly-contribution"]', '200')
    
    await page.click('text=Create Goal')
    
    // Verify goal was created
    await expect(page.locator('text=Test Goal')).toBeVisible()
    await expect(page.locator('text=$0 / $5,000')).toBeVisible()
  })

  test('should delete a goal', async ({ page }) => {
    // Create a goal first
    await page.click('text=Add New Goal')
    await page.fill('[data-testid="goal-title"]', 'Goal to Delete')
    await page.selectOption('[data-testid="goal-type"]', 'experience')
    await page.fill('[data-testid="goal-target"]', '1000')
    await page.fill('[data-testid="goal-deadline"]', '2025-06-30')
    await page.fill('[data-testid="goal-monthly-contribution"]', '100')
    await page.click('text=Create Goal')
    
    // Delete the goal
    await page.click('text=Goal to Delete')
    await page.click('[data-testid="delete-goal-button"]')
    await page.click('text=Confirm Delete')
    
    // Verify goal was deleted
    await expect(page.locator('text=Goal to Delete')).not.toBeVisible()
  })

  test('should persist goals across sessions', async ({ page }) => {
    // Create a goal
    await page.click('text=Add New Goal')
    await page.fill('[data-testid="goal-title"]', 'Persistent Goal')
    await page.selectOption('[data-testid="goal-type"]', 'home')
    await page.fill('[data-testid="goal-target"]', '10000')
    await page.fill('[data-testid="goal-deadline"]', '2026-01-31')
    await page.fill('[data-testid="goal-monthly-contribution"]', '500')
    await page.click('text=Create Goal')
    
    // Reload page
    await page.reload()
    await page.click('text=Continue with FaceID')
    await page.click('text=Gen Z Student')
    await page.click('text=Goals')
    
    // Verify goal persists
    await expect(page.locator('text=Persistent Goal')).toBeVisible()
  })

  test('should update goal progress', async ({ page }) => {
    // Create a goal
    await page.click('text=Add New Goal')
    await page.fill('[data-testid="goal-title"]', 'Progress Goal')
    await page.selectOption('[data-testid="goal-type"]', 'safety')
    await page.fill('[data-testid="goal-target"]', '2000')
    await page.fill('[data-testid="goal-deadline"]', '2025-10-31')
    await page.fill('[data-testid="goal-monthly-contribution"]', '100')
    await page.click('text=Create Goal')
    
    // Update progress
    await page.click('text=Progress Goal')
    await page.click('[data-testid="update-progress-button"]')
    await page.fill('[data-testid="progress-amount"]', '500')
    await page.click('text=Update Progress')
    
    // Verify progress updated
    await expect(page.locator('text=$500 / $2,000')).toBeVisible()
    await expect(page.locator('text=25.0%')).toBeVisible()
  })

  test('should handle goal validation errors', async ({ page }) => {
    await page.click('text=Add New Goal')
    
    // Try to create goal with invalid data
    await page.click('text=Create Goal')
    
    // Verify validation errors
    await expect(page.locator('text=Title is required')).toBeVisible()
    await expect(page.locator('text=Target amount is required')).toBeVisible()
  })

  test('should show goal analytics', async ({ page }) => {
    // Create multiple goals
    await page.click('text=Add New Goal')
    await page.fill('[data-testid="goal-title"]', 'Goal 1')
    await page.selectOption('[data-testid="goal-type"]', 'safety')
    await page.fill('[data-testid="goal-target"]', '5000')
    await page.fill('[data-testid="goal-deadline"]', '2025-12-31')
    await page.fill('[data-testid="goal-monthly-contribution"]', '200')
    await page.click('text=Create Goal')
    
    await page.click('text=Add New Goal')
    await page.fill('[data-testid="goal-title"]', 'Goal 2')
    await page.selectOption('[data-testid="goal-type"]', 'experience')
    await page.fill('[data-testid="goal-target"]', '3000')
    await page.fill('[data-testid="goal-deadline"]', '2025-06-30')
    await page.fill('[data-testid="goal-monthly-contribution"]', '150')
    await page.click('text=Create Goal')
    
    // Verify analytics
    await expect(page.locator('text=Total Progress')).toBeVisible()
    await expect(page.locator('text=2 goals')).toBeVisible()
  })
})
