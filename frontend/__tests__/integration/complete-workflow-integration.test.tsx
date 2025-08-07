/**
 * Complete Workflow Integration Tests
 * =====================================
 * End-to-end tests validating the entire integration
 * from classification to goal creation and execution.
 * 
 * INTEGRATION MAESTRO: Testing the Symphony
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import '@testing-library/jest-dom'
import { IntegratedWorkflowCard } from '@/components/ui/integrated-workflow-card'
import { 
  WorkflowCategory,
  Priority,
  type WorkflowClassification
} from '@/lib/api/integration'
import type { AIAction } from '@/hooks/use-app-state'

// ==================== Mock Server Setup ====================

const server = setupServer(
  // Classification endpoint
  rest.post('/api/v1/classification/classify', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        classification: {
          category: 'optimize',
          sub_category: 'savings',
          intent_keywords: ['save', 'money'],
          confidence: 0.92,
          priority: 'high'
        },
        suggestions: [
          {
            workflow_id: 'optimize.cancel_subscriptions.v1',
            name: 'Cancel Unused Subscriptions',
            relevance_score: 0.95
          }
        ],
        confidence_score: 0.92,
        processing_time_ms: 124.5
      })
    )
  }),

  // Goal creation endpoint
  rest.post('/api/v1/goals/create', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        success: true,
        goal: {
          id: 'goal_123',
          title: 'Emergency Fund',
          type: 'emergency_fund',
          target_amount: 10000,
          current_amount: 1000,
          progress_percentage: 10
        },
        milestones: [
          {
            percentage: 25,
            amount: 2500,
            description: '25% Complete'
          }
        ],
        recommendations: [
          'Increase monthly contribution by $100',
          'Set up automatic transfers'
        ],
        estimated_completion_date: '2024-12-15T00:00:00'
      })
    )
  }),

  // Workflow execution endpoint
  rest.post('/api/v1/workflows/execute', (req, res, ctx) => {
    return res(
      ctx.status(202),
      ctx.json({
        success: true,
        execution_id: 'exec_456',
        workflow_id: 'optimize.cancel_subscriptions.v1',
        status: 'running',
        estimated_duration_seconds: 300,
        tracking_url: '/api/v1/workflows/executions/exec_456/status'
      })
    )
  }),

  // Workflow status endpoint
  rest.get('/api/v1/workflows/executions/:executionId/status', (req, res, ctx) => {
    const { executionId } = req.params
    
    return res(
      ctx.json({
        execution_id: executionId,
        status: 'completed',
        progress: 100,
        result: {
          subscriptions_cancelled: 3,
          monthly_savings: 47,
          annual_savings: 564
        }
      })
    )
  }),

  // Health check endpoint
  rest.get('/api/v1/health/', (req, res, ctx) => {
    return res(
      ctx.json({
        status: 'healthy',
        version: '1.0.0',
        dependencies: {
          database: 'healthy',
          redis: 'healthy',
          ml_service: 'healthy'
        }
      })
    )
  })
)

// ==================== Test Setup ====================

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })
}

function renderWithProviders(component: React.ReactElement) {
  const queryClient = createQueryClient()
  
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  )
}

// ==================== Test Data ====================

const mockAction: AIAction = {
  id: 'optimize.cancel_subscriptions.v1',
  title: 'Cancel Unused Subscriptions',
  description: 'Identify and cancel unused subscription services',
  category: 'optimize',
  automationCapability: 'full',
  priority: 'high',
  estimatedDuration: '3 minutes',
  estimatedSavings: 47,
  steps: [
    { id: 's1', name: 'Review subscription list', status: 'pending' },
    { id: 's2', name: 'Cancel unused services', status: 'pending' },
    { id: 's3', name: 'Set up usage tracking', status: 'pending' }
  ]
}

// ==================== Integration Tests ====================

describe('Complete Workflow Integration', () => {
  
  test('should classify workflow and display classification results', async () => {
    renderWithProviders(
      <IntegratedWorkflowCard
        action={mockAction}
        userId="user123"
        demographic="millennial"
      />
    )

    // Check that the card renders
    expect(screen.getByText('Cancel Unused Subscriptions')).toBeInTheDocument()

    // Wait for classification to complete
    await waitFor(() => {
      expect(screen.getByText('optimize')).toBeInTheDocument()
    })

    // Check confidence display
    expect(screen.getByText(/92% confidence/)).toBeInTheDocument()
  })

  test('should create goal from classified action', async () => {
    const onGoalCreated = jest.fn()
    
    renderWithProviders(
      <IntegratedWorkflowCard
        action={mockAction}
        userId="user123"
        demographic="millennial"
        onGoalCreated={onGoalCreated}
      />
    )

    // Wait for classification
    await waitFor(() => {
      expect(screen.getByText('optimize')).toBeInTheDocument()
    })

    // Click create goal button
    const createGoalButton = screen.getByRole('button', { name: /Create Goal/i })
    fireEvent.click(createGoalButton)

    // Wait for goal creation
    await waitFor(() => {
      expect(screen.getByText('Goal Created')).toBeInTheDocument()
    })

    // Check callback was called
    expect(onGoalCreated).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'goal_123',
        title: 'Emergency Fund'
      })
    )
  })

  test('should execute workflow and track status', async () => {
    const onWorkflowCompleted = jest.fn()
    
    renderWithProviders(
      <IntegratedWorkflowCard
        action={mockAction}
        userId="user123"
        demographic="millennial"
        onWorkflowCompleted={onWorkflowCompleted}
      />
    )

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByText('Cancel Unused Subscriptions')).toBeInTheDocument()
    })

    // Click execute button
    const executeButton = screen.getByRole('button', { name: /Execute/i })
    fireEvent.click(executeButton)

    // Wait for execution to start
    await waitFor(() => {
      expect(screen.getByText('running')).toBeInTheDocument()
    })

    // Wait for completion
    await waitFor(() => {
      expect(screen.getByText('completed')).toBeInTheDocument()
    }, { timeout: 5000 })

    // Check callback was called
    expect(onWorkflowCompleted).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'completed',
        progress: 100
      })
    )
  })

  test('should handle API errors gracefully', async () => {
    // Override with error response
    server.use(
      rest.post('/api/v1/classification/classify', (req, res, ctx) => {
        return res(
          ctx.status(500),
          ctx.json({
            error: 'InternalError',
            message: 'Classification service unavailable',
            request_id: 'req_789'
          })
        )
      })
    )

    renderWithProviders(
      <IntegratedWorkflowCard
        action={mockAction}
        userId="user123"
        demographic="millennial"
      />
    )

    // Should still render with local classification
    await waitFor(() => {
      expect(screen.getByText('Cancel Unused Subscriptions')).toBeInTheDocument()
    })

    // Should show fallback UI
    expect(screen.queryByText(/92% confidence/)).not.toBeInTheDocument()
  })

  test('should show performance metrics', async () => {
    renderWithProviders(
      <IntegratedWorkflowCard
        action={mockAction}
        userId="user123"
        demographic="millennial"
      />
    )

    // Wait for metrics to load
    await waitFor(() => {
      const performanceBadge = screen.getByText(/ms/)
      expect(performanceBadge).toBeInTheDocument()
    })
  })

  test('should handle offline mode', async () => {
    // Mock offline state
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false
    })

    renderWithProviders(
      <IntegratedWorkflowCard
        action={mockAction}
        userId="user123"
        demographic="millennial"
      />
    )

    // Execute button should be disabled
    const executeButton = screen.getByRole('button', { name: /Execute/i })
    expect(executeButton).toBeDisabled()

    // Restore online state
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    })
  })

  test('should apply correct visual theme based on category', async () => {
    const { container } = renderWithProviders(
      <IntegratedWorkflowCard
        action={mockAction}
        userId="user123"
        demographic="millennial"
      />
    )

    // Wait for classification
    await waitFor(() => {
      expect(screen.getByText('optimize')).toBeInTheDocument()
    })

    // Check that optimize theme colors are applied
    const card = container.querySelector('[class*="Card"]')
    expect(card).toHaveStyle({
      background: expect.stringContaining('rgba(16, 185, 129')
    })
  })

  test('should handle hybrid workflows differently', async () => {
    const hybridAction: AIAction = {
      ...mockAction,
      automationCapability: 'hybrid'
    }

    renderWithProviders(
      <IntegratedWorkflowCard
        action={hybridAction}
        userId="user123"
        demographic="millennial"
      />
    )

    // Check that hybrid theme is applied
    await waitFor(() => {
      const card = screen.getByText('Cancel Unused Subscriptions').closest('div')
      expect(card).toHaveStyle({
        background: expect.stringContaining('gradient')
      })
    })
  })

  test('should update progress during workflow execution', async () => {
    // Mock progressive status updates
    let callCount = 0
    server.use(
      rest.get('/api/v1/workflows/executions/:executionId/status', (req, res, ctx) => {
        callCount++
        const progress = callCount === 1 ? 30 : callCount === 2 ? 70 : 100
        const status = progress === 100 ? 'completed' : 'running'
        
        return res(
          ctx.json({
            execution_id: req.params.executionId,
            status,
            progress
          })
        )
      })
    )

    renderWithProviders(
      <IntegratedWorkflowCard
        action={mockAction}
        userId="user123"
        demographic="millennial"
      />
    )

    // Execute workflow
    const executeButton = screen.getByRole('button', { name: /Execute/i })
    fireEvent.click(executeButton)

    // Should show progress updates
    await waitFor(() => {
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toBeInTheDocument()
    })
  })

  test('should batch multiple classification requests', async () => {
    const actions = [mockAction, { ...mockAction, id: 'action2', title: 'Save Money' }]
    
    // Render multiple cards
    renderWithProviders(
      <>
        {actions.map(action => (
          <IntegratedWorkflowCard
            key={action.id}
            action={action}
            userId="user123"
            demographic="millennial"
          />
        ))}
      </>
    )

    // Both should classify
    await waitFor(() => {
      const classifications = screen.getAllByText('optimize')
      expect(classifications).toHaveLength(2)
    })
  })

  test('should prefetch common workflows', async () => {
    let prefetchCalled = false
    
    server.use(
      rest.post('/api/v1/classification/classify', (req, res, ctx) => {
        const body = req.body as any
        if (body.user_input === 'I want to save money') {
          prefetchCalled = true
        }
        
        return res(
          ctx.json({
            success: true,
            classification: { category: 'optimize' },
            confidence_score: 0.9,
            processing_time_ms: 50
          })
        )
      })
    )

    renderWithProviders(
      <IntegratedWorkflowCard
        action={mockAction}
        userId="user123"
        demographic="millennial"
      />
    )

    // Wait for prefetch to occur
    await waitFor(() => {
      expect(prefetchCalled).toBe(true)
    }, { timeout: 5000 })
  })
})

// ==================== Performance Tests ====================

describe('Performance Integration', () => {
  
  test('should complete classification within 500ms', async () => {
    const startTime = Date.now()
    
    renderWithProviders(
      <IntegratedWorkflowCard
        action={mockAction}
        userId="user123"
        demographic="millennial"
      />
    )

    await waitFor(() => {
      expect(screen.getByText('optimize')).toBeInTheDocument()
    })

    const duration = Date.now() - startTime
    expect(duration).toBeLessThan(500)
  })

  test('should debounce rapid classification requests', async () => {
    let requestCount = 0
    
    server.use(
      rest.post('/api/v1/classification/classify', (req, res, ctx) => {
        requestCount++
        return res(ctx.json({ success: true }))
      })
    )

    const { rerender } = renderWithProviders(
      <IntegratedWorkflowCard
        action={{ ...mockAction, title: 'Test 1' }}
        userId="user123"
        demographic="millennial"
      />
    )

    // Rapidly change titles
    for (let i = 2; i <= 5; i++) {
      rerender(
        <QueryClientProvider client={createQueryClient()}>
          <IntegratedWorkflowCard
            action={{ ...mockAction, title: `Test ${i}` }}
            userId="user123"
            demographic="millennial"
          />
        </QueryClientProvider>
      )
    }

    // Wait for debounce
    await new Promise(resolve => setTimeout(resolve, 500))

    // Should have made fewer requests than changes
    expect(requestCount).toBeLessThan(5)
  })
})