/**
 * WorkflowClassifier Service Tests
 * =================================
 * Comprehensive test coverage for classification logic
 */

import { 
  workflowConfig,
  workflowClassifier,
  workflowValidator,
  WorkflowCategory,
  Priority,
  type WorkflowContext,
  type ClassificationRequest
} from '@/lib/services/workflow-classifier.service';

describe('WorkflowConfiguration', () => {
  it('should return workflow metadata by ID', () => {
    const workflow = workflowConfig.getWorkflow('optimize.cancel_subscriptions.v1');
    expect(workflow).toBeDefined();
    expect(workflow?.title).toBe('Cancel Unused Subscriptions');
    expect(workflow?.category).toBe(WorkflowCategory.OPTIMIZE);
    expect(workflow?.steps).toHaveLength(4);
  });
  
  it('should return workflows by category', () => {
    const optimizeWorkflows = workflowConfig.getWorkflowsByCategory(WorkflowCategory.OPTIMIZE);
    expect(optimizeWorkflows).toHaveLength(3);
    expect(optimizeWorkflows.every(w => w.category === WorkflowCategory.OPTIMIZE)).toBe(true);
  });
  
  it('should calculate estimated duration correctly', () => {
    const duration = workflowConfig.getEstimatedDuration('optimize.cancel_subscriptions.v1');
    expect(duration).toBe(150); // Sum of all step durations
  });
  
  it('should return workflow requirements', () => {
    const requirements = workflowConfig.getWorkflowRequirements('optimize.bill_negotiation.v1');
    expect(requirements).toContain('negotiation');
    expect(requirements).toContain('provider');
    expect(requirements).toContain('rate');
  });
  
  it('should return empty array for unknown workflow', () => {
    const steps = workflowConfig.getWorkflowSteps('unknown.workflow.v1');
    expect(steps).toEqual([]);
  });
});

describe('WorkflowClassifierService', () => {
  const mockContext: WorkflowContext = {
    userId: 'test-user-123',
    demographic: 'millennial',
    riskTolerance: 'medium',
    incomeLevel: 5000,
    hasEmergencyFund: true,
    debtLevel: 'low',
    investmentExperience: 'intermediate'
  };
  
  beforeEach(() => {
    workflowClassifier.resetMetrics();
  });
  
  it('should classify emergency requests with high confidence', async () => {
    const request: ClassificationRequest = {
      input: 'I have an emergency and need help immediately',
      context: mockContext
    };
    
    const result = await workflowClassifier.classify(request);
    
    expect(result.category).toBe(WorkflowCategory.EMERGENCY);
    expect(result.confidence).toBeGreaterThanOrEqual(0.9);
    expect(result.priority).toBe(Priority.CRITICAL);
    expect(result.intentKeywords).toContain('emergency');
  });
  
  it('should classify optimization requests correctly', async () => {
    const request: ClassificationRequest = {
      input: 'I want to save money and reduce my monthly expenses',
      context: mockContext
    };
    
    const result = await workflowClassifier.classify(request);
    
    expect(result.category).toBe(WorkflowCategory.OPTIMIZE);
    expect(result.confidence).toBeGreaterThanOrEqual(0.8);
    expect(result.intentKeywords).toContain('save');
    expect(result.suggestedWorkflows.length).toBeGreaterThan(0);
  });
  
  it('should classify investment requests for growth category', async () => {
    const request: ClassificationRequest = {
      input: 'Help me invest and grow my portfolio',
      context: mockContext
    };
    
    const result = await workflowClassifier.classify(request);
    
    expect(result.category).toBe(WorkflowCategory.GROW);
    expect(result.intentKeywords).toContain('invest');
    expect(result.suggestedWorkflows.some(w => w.includes('investment'))).toBe(true);
  });
  
  it('should use cache for repeated requests', async () => {
    const request: ClassificationRequest = {
      input: 'I need to automate my savings',
      context: mockContext,
      useCache: true
    };
    
    // First call
    const result1 = await workflowClassifier.classify(request);
    expect(result1.category).toBe(WorkflowCategory.AUTOMATE);
    
    // Second call should hit cache
    const result2 = await workflowClassifier.classify(request);
    expect(result2).toEqual(result1);
    
    const metrics = workflowClassifier.getMetrics();
    expect(metrics.cacheHits).toBe(1);
    expect(metrics.totalClassifications).toBe(2);
  });
  
  it('should skip cache when useCache is false', async () => {
    const request: ClassificationRequest = {
      input: 'Analyze my spending patterns',
      context: mockContext,
      useCache: false
    };
    
    await workflowClassifier.classify(request);
    await workflowClassifier.classify(request);
    
    const metrics = workflowClassifier.getMetrics();
    expect(metrics.cacheHits).toBe(0);
  });
  
  it('should return fallback classification on error', async () => {
    const request: ClassificationRequest = {
      input: '',
      context: mockContext
    };
    
    const result = await workflowClassifier.classify(request);
    
    expect(result.category).toBe(WorkflowCategory.ANALYZE);
    expect(result.confidence).toBeLessThan(0.5);
    expect(result.priority).toBe(Priority.LOW);
  });
  
  it('should track metrics correctly', async () => {
    const requests = [
      { input: 'emergency help', context: mockContext },
      { input: 'save money', context: mockContext },
      { input: 'invest funds', context: mockContext }
    ];
    
    for (const request of requests) {
      await workflowClassifier.classify(request);
    }
    
    const metrics = workflowClassifier.getMetrics();
    expect(metrics.totalClassifications).toBe(3);
    expect(metrics.categoryDistribution[WorkflowCategory.EMERGENCY]).toBe(1);
    expect(metrics.categoryDistribution[WorkflowCategory.OPTIMIZE]).toBe(1);
    expect(metrics.categoryDistribution[WorkflowCategory.GROW]).toBe(1);
    expect(metrics.averageLatency).toBeGreaterThan(0);
  });
});

describe('WorkflowValidationService', () => {
  const mockAction = {
    id: 'optimize.cancel_subscriptions.v1',
    title: 'Cancel Unused Subscriptions',
    description: 'Test action',
    type: 'optimization' as const,
    potentialSaving: 47,
    steps: [],
    status: 'in-process' as const
  };
  
  it('should validate workflow with matching steps', () => {
    const status = {
      steps: [
        { status: 'completed' },
        { status: 'completed' },
        { status: 'completed' },
        { status: 'completed' }
      ],
      current_step: 'subscription cancellation tracking',
      progress: 100
    };
    
    const validation = workflowValidator.validateWorkflow(mockAction, status);
    
    expect(validation.titleMatch).toBe(true);
    expect(validation.stepsComplete).toBe(true);
    expect(validation.issues).toHaveLength(0);
  });
  
  it('should detect missing steps', () => {
    const status = {
      steps: [
        { status: 'completed' },
        { status: 'in_progress' }
      ],
      current_step: 'processing',
      progress: 50
    };
    
    const validation = workflowValidator.validateWorkflow(mockAction, status);
    
    expect(validation.titleMatch).toBe(false);
    expect(validation.issues).toContain('Expected 4 steps, found 2');
    expect(validation.recommendations).toContain('Review workflow steps');
  });
  
  it('should validate automation requirements', () => {
    const status = {
      steps: [
        { status: 'completed' },
        { status: 'completed' },
        { status: 'completed' },
        { status: 'completed' }
      ],
      current_step: 'unrelated process',
      progress: 100
    };
    
    const validation = workflowValidator.validateWorkflow(mockAction, status);
    
    expect(validation.automationValid).toBe(false);
    expect(validation.issues.some(i => i.includes('Missing requirements'))).toBe(true);
    expect(validation.recommendations).toContain('Verify automation requirements');
  });
  
  it('should calculate efficiency score', () => {
    const status = {
      steps: [],
      current_step: 'processing',
      progress: 50
    };
    
    const validation = workflowValidator.validateWorkflow(mockAction, status);
    
    expect(validation.efficiencyScore).toBeGreaterThanOrEqual(0);
    expect(validation.efficiencyScore).toBeLessThanOrEqual(100);
  });
  
  it('should handle unknown workflow gracefully', () => {
    const unknownAction = {
      ...mockAction,
      id: 'unknown.workflow.v1'
    };
    
    const validation = workflowValidator.validateWorkflow(unknownAction, {});
    
    expect(validation.issues).toContain('Workflow metadata not found');
    expect(validation.titleMatch).toBe(true);
  });
});

describe('Integration Tests', () => {
  it('should classify and validate a complete workflow', async () => {
    const context: WorkflowContext = {
      userId: 'integration-test',
      demographic: 'genz',
      riskTolerance: 'high',
      incomeLevel: 3000
    };
    
    // Classify user intent
    const classification = await workflowClassifier.classify({
      input: 'I want to cancel my unused subscriptions to save money',
      context
    });
    
    expect(classification.category).toBe(WorkflowCategory.OPTIMIZE);
    expect(classification.suggestedWorkflows).toContain('optimize.cancel_subscriptions.v1');
    
    // Get workflow metadata
    const workflowId = classification.suggestedWorkflows[0];
    const metadata = workflowConfig.getWorkflow(workflowId);
    expect(metadata).toBeDefined();
    expect(metadata?.estimatedSavings).toBe(47);
    
    // Validate workflow execution
    const mockAction = {
      id: workflowId,
      title: metadata!.title,
      description: metadata!.description,
      type: 'optimization' as const,
      potentialSaving: metadata!.estimatedSavings,
      steps: [],
      status: 'in-process' as const
    };
    
    const validation = workflowValidator.validateWorkflow(mockAction, {
      steps: metadata!.steps.map(s => ({ status: 'completed' })),
      current_step: 'subscription cancellation tracking',
      progress: 100
    });
    
    expect(validation.stepsComplete).toBe(true);
    expect(validation.issues).toHaveLength(0);
  });
});

describe('Cache Key Generation', () => {
  it('should generate consistent cache keys', async () => {
    const context: WorkflowContext = {
      userId: 'cache-test',
      demographic: 'millennial'
    };
    
    const request1: ClassificationRequest = {
      input: 'save money',
      context
    };
    
    const request2: ClassificationRequest = {
      input: 'save money',
      context
    };
    
    // Both requests should produce the same result due to caching
    const result1 = await workflowClassifier.classify(request1);
    const result2 = await workflowClassifier.classify(request2);
    
    expect(result1).toEqual(result2);
    
    const metrics = workflowClassifier.getMetrics();
    expect(metrics.cacheHits).toBe(1);
  });
  
  it('should generate different keys for different contexts', async () => {
    const request1: ClassificationRequest = {
      input: 'invest money',
      context: {
        userId: 'user1',
        demographic: 'genz'
      }
    };
    
    const request2: ClassificationRequest = {
      input: 'invest money',
      context: {
        userId: 'user2',
        demographic: 'millennial'
      }
    };
    
    await workflowClassifier.classify(request1);
    await workflowClassifier.classify(request2);
    
    const metrics = workflowClassifier.getMetrics();
    expect(metrics.cacheHits).toBe(0); // Different contexts, no cache hit
  });
});