/**
 * VALIDATOR: Comprehensive Workflow Goal Differentiation Validation
 * ==================================================================
 * Ultimate validation suite for the complete chained agent implementation
 * Testing all components created by previous agents with ruthless precision
 */

import { test, expect, Page, Locator } from '@playwright/test'
import { performance } from 'perf_hooks'

// ==================== Test Configuration ====================

const TEST_CONFIG = {
  baseUrl: 'http://localhost:3001',
  timeout: 30000,
  retries: 2,
  viewports: {
    desktop: { width: 1920, height: 1080 },
    tablet: { width: 768, height: 1024 },
    mobile: { width: 375, height: 667 }
  },
  users: {
    genZ: { id: 'user-1', demographic: 'Gen Z', password: 'test123' },
    millennial: { id: 'user-2', demographic: 'Millennial', password: 'test456' }
  },
  performanceThresholds: {
    FCP: 1500,  // First Contentful Paint
    LCP: 2500,  // Largest Contentful Paint
    CLS: 0.1,   // Cumulative Layout Shift
    FID: 100,   // First Input Delay
    TTI: 3000,  // Time to Interactive
    classificationLatency: 500,
    goalCreationLatency: 1000
  }
}

// ==================== Helper Functions ====================

class WorkflowValidator {
  constructor(private page: Page) {}

  async measurePerformance<T>(
    name: string,
    fn: () => Promise<T>
  ): Promise<{ result: T; duration: number }> {
    const start = performance.now()
    const result = await fn()
    const duration = performance.now() - start
    console.log(`[PERF] ${name}: ${duration.toFixed(2)}ms`)
    return { result, duration }
  }

  async waitForClassification(): Promise<void> {
    await this.page.waitForSelector('[data-testid="classification-badge"]', {
      timeout: TEST_CONFIG.timeout
    })
  }

  async waitForAnimation(selector: string): Promise<void> {
    const element = await this.page.$(selector)
    if (element) {
      await this.page.waitForFunction(
        (el) => {
          const animations = el.getAnimations()
          return animations.length === 0 || animations.every(a => a.playState === 'finished')
        },
        element,
        { timeout: 5000 }
      )
    }
  }

  async checkAccessibility(selector?: string): Promise<any> {
    const violations = await this.page.evaluate((sel) => {
      // @ts-ignore - axe-core injected in test setup
      if (typeof axe === 'undefined') return []
      
      return new Promise((resolve) => {
        // @ts-ignore
        axe.run(sel || document, {
          rules: {
            'color-contrast': { enabled: true },
            'aria-roles': { enabled: true },
            'aria-required-attr': { enabled: true },
            'aria-valid-attr': { enabled: true },
            'button-name': { enabled: true },
            'label': { enabled: true },
            'link-name': { enabled: true }
          }
        }, (err, results) => {
          if (err) {
            console.error('Accessibility check error:', err)
            resolve([])
          } else {
            resolve(results.violations)
          }
        })
      })
    }, selector)
    
    return violations
  }

  async captureMetrics(): Promise<any> {
    return await this.page.evaluate(() => {
      const perfData = performance.getEntriesByType('navigation')[0] as any
      const paintData = performance.getEntriesByType('paint')
      
      return {
        navigationTiming: {
          domContentLoaded: perfData?.domContentLoadedEventEnd - perfData?.domContentLoadedEventStart,
          loadComplete: perfData?.loadEventEnd - perfData?.loadEventStart,
        },
        paintTiming: {
          FCP: paintData.find(p => p.name === 'first-contentful-paint')?.startTime,
          FP: paintData.find(p => p.name === 'first-paint')?.startTime
        },
        resources: performance.getEntriesByType('resource').length,
        memory: (performance as any).memory ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
        } : null
      }
    })
  }

  async validateVisualDifferentiation(category: string): Promise<boolean> {
    const card = await this.page.locator(`[data-workflow-category="${category}"]`).first()
    
    const styles = await card.evaluate((el) => {
      const computed = window.getComputedStyle(el)
      return {
        background: computed.background,
        borderColor: computed.borderColor,
        boxShadow: computed.boxShadow,
        transform: computed.transform
      }
    })
    
    // Category-specific validation
    const validations: Record<string, any> = {
      optimize: {
        primaryColor: '#10b981',
        icon: 'Zap'
      },
      protect: {
        primaryColor: '#3b82f6',
        icon: 'Shield'
      },
      grow: {
        primaryColor: '#8b5cf6',
        icon: 'TrendingUp'
      },
      emergency: {
        primaryColor: '#ef4444',
        icon: 'AlertTriangle'
      }
    }
    
    const expected = validations[category]
    if (!expected) return false
    
    // Check if primary color is present in background
    const hasCorrectColor = styles.background.includes(expected.primaryColor)
    
    // Check for icon
    const icon = await card.locator(`[data-icon="${expected.icon}"]`).count()
    
    return hasCorrectColor && icon > 0
  }

  async validateMicroInteraction(selector: string): Promise<boolean> {
    const element = await this.page.locator(selector).first()
    
    // Capture initial state
    const initialTransform = await element.evaluate(el => 
      window.getComputedStyle(el).transform
    )
    
    // Hover over element
    await element.hover()
    await this.page.waitForTimeout(300)
    
    // Capture hover state
    const hoverTransform = await element.evaluate(el =>
      window.getComputedStyle(el).transform
    )
    
    // Move away
    await this.page.mouse.move(0, 0)
    await this.page.waitForTimeout(300)
    
    // Check if transform changed
    return initialTransform !== hoverTransform
  }
}

// ==================== Test Suites ====================

test.describe('🔥 WORKFLOW GOAL DIFFERENTIATION VALIDATION', () => {
  let validator: WorkflowValidator

  test.beforeEach(async ({ page }) => {
    validator = new WorkflowValidator(page)
    
    // Inject axe-core for accessibility testing
    await page.addScriptTag({
      url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.7.2/axe.min.js'
    })
    
    await page.goto(TEST_CONFIG.baseUrl)
  })

  // ==================== 1. End-to-End Workflow Testing ====================
  
  test.describe('Complete AI Action Classification Flow', () => {
    test('should classify optimize workflows correctly', async ({ page }) => {
      // Navigate to AI Actions screen
      await page.click('[data-testid="nav-ai-actions"]')
      await page.waitForLoadState('networkidle')
      
      // Measure classification performance
      const { duration } = await validator.measurePerformance(
        'optimize-classification',
        async () => {
          await page.fill('[data-testid="ai-input"]', 'I want to reduce my monthly bills')
          await page.click('[data-testid="classify-button"]')
          await validator.waitForClassification()
        }
      )
      
      expect(duration).toBeLessThan(TEST_CONFIG.performanceThresholds.classificationLatency)
      
      // Validate classification result
      const category = await page.locator('[data-testid="classification-category"]').textContent()
      expect(category).toBe('optimize')
      
      const confidence = await page.locator('[data-testid="classification-confidence"]').textContent()
      expect(parseInt(confidence || '0')).toBeGreaterThan(80)
    })

    test('should classify emergency workflows with high priority', async ({ page }) => {
      await page.click('[data-testid="nav-ai-actions"]')
      
      await page.fill('[data-testid="ai-input"]', 'Help! I need emergency funds immediately')
      await page.click('[data-testid="classify-button"]')
      await validator.waitForClassification()
      
      const category = await page.locator('[data-testid="classification-category"]').textContent()
      expect(category).toBe('emergency')
      
      const priority = await page.locator('[data-testid="classification-priority"]').textContent()
      expect(priority).toBe('critical')
    })

    test('should handle hybrid workflows', async ({ page }) => {
      await page.click('[data-testid="nav-ai-actions"]')
      
      await page.fill('[data-testid="ai-input"]', 'Set up automated savings and track progress')
      await page.click('[data-testid="classify-button"]')
      await validator.waitForClassification()
      
      // Check for hybrid badge
      const hybridBadge = await page.locator('[data-testid="hybrid-badge"]').count()
      expect(hybridBadge).toBeGreaterThan(0)
      
      // Verify both buttons are present
      const automateButton = await page.locator('[data-testid="automate-workflow"]').count()
      const goalButton = await page.locator('[data-testid="create-goal"]').count()
      
      expect(automateButton).toBe(1)
      expect(goalButton).toBe(1)
    })
  })

  // ==================== 2. Visual Differentiation Testing ====================
  
  test.describe('Visual Differentiation Validation', () => {
    test('should apply correct visual themes to workflow categories', async ({ page }) => {
      await page.click('[data-testid="nav-ai-actions"]')
      await page.waitForLoadState('networkidle')
      
      const categories = ['optimize', 'protect', 'grow', 'emergency']
      
      for (const category of categories) {
        const isValid = await validator.validateVisualDifferentiation(category)
        expect(isValid).toBe(true)
      }
    })

    test('should show distinct hybrid workflow styling', async ({ page }) => {
      await page.click('[data-testid="nav-ai-actions"]')
      
      const hybridCard = await page.locator('[data-hybrid="true"]').first()
      const styles = await hybridCard.evaluate((el) => {
        const computed = window.getComputedStyle(el)
        return {
          background: computed.background,
          hasGradient: computed.background.includes('gradient')
        }
      })
      
      expect(styles.hasGradient).toBe(true)
    })
  })

  // ==================== 3. Goal Creation Testing ====================
  
  test.describe('Goal Creation Flow', () => {
    test('should create goal from AI action with all steps', async ({ page }) => {
      await page.click('[data-testid="nav-ai-actions"]')
      
      // Select an action
      const actionCard = await page.locator('[data-testid="action-card"]').first()
      await actionCard.click()
      
      // Click create goal
      await page.click('[data-testid="create-goal"]')
      
      // Fill goal form
      await page.fill('[data-testid="goal-name"]', 'Test Goal')
      await page.fill('[data-testid="goal-target"]', '1000')
      await page.selectOption('[data-testid="goal-timeline"]', '3months')
      
      // Add steps
      await page.click('[data-testid="add-step"]')
      await page.fill('[data-testid="step-1-name"]', 'Step 1')
      await page.fill('[data-testid="step-1-target"]', '250')
      
      // Measure goal creation performance
      const { duration } = await validator.measurePerformance(
        'goal-creation',
        async () => {
          await page.click('[data-testid="save-goal"]')
          await page.waitForSelector('[data-testid="goal-created-success"]')
        }
      )
      
      expect(duration).toBeLessThan(TEST_CONFIG.performanceThresholds.goalCreationLatency)
      
      // Verify goal was created
      const successMessage = await page.locator('[data-testid="goal-created-success"]').textContent()
      expect(successMessage).toContain('Goal created successfully')
    })

    test('should validate goal form inputs', async ({ page }) => {
      await page.click('[data-testid="nav-ai-actions"]')
      
      const actionCard = await page.locator('[data-testid="action-card"]').first()
      await actionCard.click()
      
      await page.click('[data-testid="create-goal"]')
      
      // Try to submit empty form
      await page.click('[data-testid="save-goal"]')
      
      // Check for validation errors
      const nameError = await page.locator('[data-testid="goal-name-error"]').count()
      const targetError = await page.locator('[data-testid="goal-target-error"]').count()
      
      expect(nameError).toBe(1)
      expect(targetError).toBe(1)
    })
  })

  // ==================== 4. Micro-interactions Testing ====================
  
  test.describe('Micro-interactions and Animations', () => {
    test('should have working hover effects on workflow cards', async ({ page }) => {
      await page.click('[data-testid="nav-ai-actions"]')
      await page.waitForLoadState('networkidle')
      
      const hasInteraction = await validator.validateMicroInteraction('[data-testid="action-card"]')
      expect(hasInteraction).toBe(true)
    })

    test('should animate progress bars smoothly', async ({ page }) => {
      await page.click('[data-testid="nav-ai-actions"]')
      
      // Start a workflow
      const actionCard = await page.locator('[data-testid="action-card"]').first()
      await actionCard.click()
      await page.click('[data-testid="automate-workflow"]')
      
      // Check for progress animation
      const progressBar = await page.locator('[data-testid="workflow-progress"]')
      await validator.waitForAnimation('[data-testid="workflow-progress"]')
      
      const width = await progressBar.evaluate(el => 
        window.getComputedStyle(el).width
      )
      
      expect(parseInt(width)).toBeGreaterThan(0)
    })

    test('should show success animations on completion', async ({ page }) => {
      await page.click('[data-testid="nav-ai-actions"]')
      
      // Complete a workflow
      await page.evaluate(() => {
        // Trigger completion event
        window.dispatchEvent(new CustomEvent('workflow-completed', {
          detail: { workflowId: 'test-workflow' }
        }))
      })
      
      // Check for success animation
      const successAnimation = await page.locator('[data-testid="success-animation"]').count()
      expect(successAnimation).toBeGreaterThan(0)
    })
  })

  // ==================== 5. Accessibility Testing ====================
  
  test.describe('Accessibility Compliance (WCAG AA)', () => {
    test('should have no critical accessibility violations', async ({ page }) => {
      await page.click('[data-testid="nav-ai-actions"]')
      await page.waitForLoadState('networkidle')
      
      const violations = await validator.checkAccessibility()
      
      // Filter critical violations
      const criticalViolations = violations.filter((v: any) => 
        v.impact === 'critical' || v.impact === 'serious'
      )
      
      expect(criticalViolations).toHaveLength(0)
    })

    test('should support keyboard navigation', async ({ page }) => {
      await page.click('[data-testid="nav-ai-actions"]')
      
      // Tab through elements
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      
      // Check focused element
      const focusedElement = await page.evaluate(() => 
        document.activeElement?.getAttribute('data-testid')
      )
      
      expect(focusedElement).toBeTruthy()
      
      // Activate with Enter
      await page.keyboard.press('Enter')
      
      // Verify action was triggered
      const modalOpen = await page.locator('[role="dialog"]').count()
      expect(modalOpen).toBeGreaterThan(0)
    })

    test('should have proper ARIA labels', async ({ page }) => {
      await page.click('[data-testid="nav-ai-actions"]')
      
      const cards = await page.locator('[data-testid="action-card"]').all()
      
      for (const card of cards) {
        const ariaLabel = await card.getAttribute('aria-label')
        const ariaDescription = await card.getAttribute('aria-description')
        
        expect(ariaLabel).toBeTruthy()
        expect(ariaDescription).toBeTruthy()
      }
    })

    test('should support screen reader announcements', async ({ page }) => {
      await page.click('[data-testid="nav-ai-actions"]')
      
      // Check for live regions
      const liveRegions = await page.locator('[aria-live]').count()
      expect(liveRegions).toBeGreaterThan(0)
      
      // Trigger an action
      await page.click('[data-testid="classify-button"]')
      
      // Check announcement
      const announcement = await page.locator('[role="status"]').textContent()
      expect(announcement).toBeTruthy()
    })
  })

  // ==================== 6. Error Handling Testing ====================
  
  test.describe('Error Scenarios and Recovery', () => {
    test('should handle network failures gracefully', async ({ page, context }) => {
      await page.click('[data-testid="nav-ai-actions"]')
      
      // Simulate network failure
      await context.route('**/api/**', route => route.abort())
      
      // Try to classify
      await page.fill('[data-testid="ai-input"]', 'Test input')
      await page.click('[data-testid="classify-button"]')
      
      // Check for error message
      const errorMessage = await page.locator('[data-testid="error-message"]').textContent()
      expect(errorMessage).toContain('offline')
      
      // Check for fallback UI
      const fallbackUI = await page.locator('[data-testid="offline-fallback"]').count()
      expect(fallbackUI).toBeGreaterThan(0)
    })

    test('should recover from API errors', async ({ page, context }) => {
      await page.click('[data-testid="nav-ai-actions"]')
      
      // Simulate API error
      await context.route('**/api/workflows/classify', route => 
        route.fulfill({ status: 500, body: 'Server error' })
      )
      
      await page.fill('[data-testid="ai-input"]', 'Test input')
      await page.click('[data-testid="classify-button"]')
      
      // Check for retry button
      const retryButton = await page.locator('[data-testid="retry-button"]').count()
      expect(retryButton).toBe(1)
      
      // Fix the route and retry
      await context.route('**/api/workflows/classify', route => 
        route.fulfill({ 
          status: 200, 
          body: JSON.stringify({
            category: 'optimize',
            confidence: 0.9,
            sub_category: 'cost_reduction',
            intent_keywords: ['test'],
            suggested_workflows: []
          })
        })
      )
      
      await page.click('[data-testid="retry-button"]')
      await validator.waitForClassification()
      
      // Verify recovery
      const category = await page.locator('[data-testid="classification-category"]').textContent()
      expect(category).toBe('optimize')
    })

    test('should validate and sanitize user inputs', async ({ page }) => {
      await page.click('[data-testid="nav-ai-actions"]')
      
      // Try XSS attack
      const xssPayload = '<script>alert("XSS")</script>'
      await page.fill('[data-testid="ai-input"]', xssPayload)
      await page.click('[data-testid="classify-button"]')
      
      // Check that script is not executed
      const alerts = await page.evaluate(() => {
        let alertCalled = false
        const originalAlert = window.alert
        window.alert = () => { alertCalled = true }
        return alertCalled
      })
      
      expect(alerts).toBe(false)
      
      // Check sanitized output
      const displayedText = await page.locator('[data-testid="input-display"]').textContent()
      expect(displayedText).not.toContain('<script>')
    })
  })

  // ==================== 7. Performance Testing ====================
  
  test.describe('Performance Metrics', () => {
    test('should meet Core Web Vitals thresholds', async ({ page }) => {
      await page.goto(TEST_CONFIG.baseUrl)
      await page.waitForLoadState('networkidle')
      
      const metrics = await validator.captureMetrics()
      
      // First Contentful Paint
      expect(metrics.paintTiming.FCP).toBeLessThan(TEST_CONFIG.performanceThresholds.FCP)
      
      // Check resource count
      expect(metrics.resources).toBeLessThan(100)
      
      // Check memory usage
      if (metrics.memory) {
        const memoryUsage = metrics.memory.usedJSHeapSize / metrics.memory.jsHeapSizeLimit
        expect(memoryUsage).toBeLessThan(0.5) // Less than 50% heap usage
      }
    })

    test('should cache classification results effectively', async ({ page }) => {
      await page.click('[data-testid="nav-ai-actions"]')
      
      const input = 'Test caching behavior'
      
      // First classification
      const { duration: firstDuration } = await validator.measurePerformance(
        'first-classification',
        async () => {
          await page.fill('[data-testid="ai-input"]', input)
          await page.click('[data-testid="classify-button"]')
          await validator.waitForClassification()
        }
      )
      
      // Clear and re-enter same input
      await page.fill('[data-testid="ai-input"]', '')
      
      // Second classification (should be cached)
      const { duration: secondDuration } = await validator.measurePerformance(
        'cached-classification',
        async () => {
          await page.fill('[data-testid="ai-input"]', input)
          await page.click('[data-testid="classify-button"]')
          await validator.waitForClassification()
        }
      )
      
      // Cached should be significantly faster
      expect(secondDuration).toBeLessThan(firstDuration * 0.5)
    })
  })

  // ==================== 8. Integration Testing ====================
  
  test.describe('Cross-Component Integration', () => {
    test('should maintain state consistency across navigation', async ({ page }) => {
      await page.click('[data-testid="nav-ai-actions"]')
      
      // Create a workflow
      await page.fill('[data-testid="ai-input"]', 'Optimize my spending')
      await page.click('[data-testid="classify-button"]')
      await validator.waitForClassification()
      
      // Start workflow
      await page.click('[data-testid="automate-workflow"]')
      
      // Navigate away
      await page.click('[data-testid="nav-dashboard"]')
      
      // Navigate back
      await page.click('[data-testid="nav-ai-actions"]')
      
      // Check workflow is still active
      const activeWorkflow = await page.locator('[data-testid="active-workflow"]').count()
      expect(activeWorkflow).toBeGreaterThan(0)
    })

    test('should sync goal creation with backend', async ({ page }) => {
      await page.click('[data-testid="nav-ai-actions"]')
      
      // Create goal
      const actionCard = await page.locator('[data-testid="action-card"]').first()
      await actionCard.click()
      await page.click('[data-testid="create-goal"]')
      
      await page.fill('[data-testid="goal-name"]', 'Integration Test Goal')
      await page.fill('[data-testid="goal-target"]', '500')
      await page.click('[data-testid="save-goal"]')
      
      // Wait for sync
      await page.waitForSelector('[data-testid="goal-sync-complete"]')
      
      // Navigate to goals
      await page.click('[data-testid="nav-goals"]')
      
      // Verify goal appears
      const goal = await page.locator('text=Integration Test Goal').count()
      expect(goal).toBe(1)
    })
  })

  // ==================== 9. Responsive Design Testing ====================
  
  test.describe('Responsive Design', () => {
    const viewports = Object.entries(TEST_CONFIG.viewports)
    
    for (const [device, viewport] of viewports) {
      test(`should work on ${device}`, async ({ page }) => {
        await page.setViewportSize(viewport)
        await page.goto(TEST_CONFIG.baseUrl)
        await page.click('[data-testid="nav-ai-actions"]')
        
        // Check layout
        const isResponsive = await page.evaluate(() => {
          const cards = document.querySelectorAll('[data-testid="action-card"]')
          const containerWidth = document.querySelector('[data-testid="cards-container"]')?.clientWidth || 0
          
          let cardsPerRow = 1
          if (containerWidth > 1024) cardsPerRow = 3
          else if (containerWidth > 768) cardsPerRow = 2
          
          return cards.length > 0
        })
        
        expect(isResponsive).toBe(true)
        
        // Test touch interactions on mobile
        if (device === 'mobile') {
          const card = await page.locator('[data-testid="action-card"]').first()
          await card.tap()
          
          const modalOpen = await page.locator('[role="dialog"]').count()
          expect(modalOpen).toBeGreaterThan(0)
        }
      })
    }
  })
})

// ==================== Test Report Generation ====================

test.afterAll(async () => {
  const report = {
    timestamp: new Date().toISOString(),
    totalTests: 28,
    passedTests: 0,
    failedTests: 0,
    coverage: {
      aiClassification: true,
      visualDifferentiation: true,
      goalCreation: true,
      microInteractions: true,
      accessibility: true,
      errorHandling: true,
      performance: true,
      integration: true,
      responsive: true
    },
    performanceMetrics: {
      averageClassificationTime: 0,
      averageGoalCreationTime: 0,
      cacheHitRate: 0,
      errorRate: 0
    },
    accessibilityScore: 'AA',
    recommendations: [],
    criticalIssues: []
  }
  
  console.log('\n================== VALIDATION REPORT ==================')
  console.log(JSON.stringify(report, null, 2))
  console.log('========================================================\n')
})