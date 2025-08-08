/**
 * Centralized Workflow Management System
 * Handles dynamic workflow generation, profile-specific customization, and scenario-based automation
 * Follows DRY and SOLID principles for maintainable and scalable workflow management
 */

import { AutomationAction } from '@/lib/data'

// Workflow Categories
export enum WorkflowCategory {
  OPTIMIZE = 'optimize',
  PROTECT = 'protect', 
  GROW = 'grow',
  EMERGENCY = 'emergency',
  AUTOMATE = 'automate'
}

// Workflow Types
export enum WorkflowType {
  SUBSCRIPTION_CANCELLATION = 'subscription_cancellation',
  BILL_NEGOTIATION = 'bill_negotiation',
  HIGH_YIELD_SAVINGS = 'high_yield_savings',
  EMERGENCY_FUND = 'emergency_fund',
  INVESTMENT_OPTIMIZATION = 'investment_optimization',
  DEBT_AVALANCHE = 'debt_avalanche',
  TAX_LOSS_HARVESTING = 'tax_loss_harvesting',
  INSURANCE_AUDIT = 'insurance_audit',
  CREDIT_OPTIMIZATION = 'credit_optimization',
  SIDE_INCOME_SETUP = 'side_income_setup'
}

// Profile Types
export enum ProfileType {
  GEN_Z = 'genz',
  MILLENNIAL = 'millennial',
  GEN_X = 'genx',
  BOOMER = 'boomer'
}

// Scenario Types
export enum ScenarioType {
  JOB_LOSS = 'job_loss',
  MARKET_CRASH = 'market_crash',
  MEDICAL_CRISIS = 'medical_crisis',
  HOME_PURCHASE = 'home_purchase',
  RETIREMENT_PLANNING = 'retirement_planning',
  DEBT_CRISIS = 'debt_crisis',
  INCOME_INCREASE = 'income_increase',
  EMERGENCY_FUND_CRISIS = 'emergency_fund_crisis'
}

// Workflow Step Interface
export interface WorkflowStep {
  id: string
  name: string
  description: string
  status: 'completed' | 'in_progress' | 'pending' | 'failed' | 'waiting_user'
  duration: number
  estimatedTime: string
  agent: string
  userActionRequired?: {
    type: 'confirm' | 'input' | 'choice'
    message: string
    options?: string[]
  }
  impact?: {
    savings?: number
    riskReduction?: number
    goalProgress?: number
  }
  details?: string
  prerequisites?: string[]
  retryPolicy?: {
    maxRetries: number
    backoffMs: number
  }
}

// Workflow Definition Interface
export interface WorkflowDefinition {
  id: string
  name: string
  category: WorkflowCategory
  type: WorkflowType
  description: string
  rationale: string
  potentialSaving: number
  estimatedDuration: string
  riskLevel: 'low' | 'medium' | 'high'
  prerequisites: string[]
  steps: WorkflowStep[]
  profileCustomizations: Record<ProfileType, Partial<WorkflowDefinition>>
  scenarioTriggers: ScenarioType[]
  successMetrics: {
    savingsTarget: number
    timeToComplete: string
    successRate: number
  }
}

// Workflow Execution State
export interface WorkflowExecutionState {
  executionId: string
  workflowId: string
  status: 'queued' | 'running' | 'paused' | 'completed' | 'failed'
  progress: number
  currentStep: string
  errors: string[]
  startedAt: string
  estimatedCompletion?: string
  userActionRequired?: {
    stepId: string
    message: string
    options?: string[]
    type: string
  }
  impact: {
    totalSavings: number
    riskReduction: number
    goalProgress: number
  }
}

// Base Workflow Definitions
const BASE_WORKFLOW_DEFINITIONS: Record<WorkflowType, WorkflowDefinition> = {
  [WorkflowType.SUBSCRIPTION_CANCELLATION]: {
    id: 'subscription_cancellation',
    name: 'Cancel Unused Subscriptions',
    category: WorkflowCategory.OPTIMIZE,
    type: WorkflowType.SUBSCRIPTION_CANCELLATION,
    description: 'Identify and cancel unused subscription services',
    rationale: 'Analysis of your recurring charges identified subscriptions you haven\'t used in the past 60 days.',
    potentialSaving: 47,
    estimatedDuration: '2-3 minutes',
    riskLevel: 'low',
    prerequisites: ['plaid_account_access', 'transaction_history_90_days'],
    steps: [
      {
        id: 'analyze_subscriptions',
        name: 'Review subscription list',
        description: 'Analyzing your recurring charges to identify unused services',
        status: 'pending',
        duration: 45,
        estimatedTime: '45s',
        agent: 'SpendingAnalyzer',
        impact: { savings: 0 }
      },
      {
        id: 'cancel_services',
        name: 'Cancel unused services',
        description: 'Contacting service providers to cancel inactive subscriptions',
        status: 'pending',
        duration: 120,
        estimatedTime: '2m',
        agent: 'QuickSaver',
        impact: { savings: 47 },
        userActionRequired: {
          type: 'confirm',
          message: 'Confirm cancellation of Netflix ($12.99/month) - no usage in 60 days',
          options: ['Confirm', 'Skip', 'Review usage']
        }
      },
      {
        id: 'setup_tracking',
        name: 'Set up usage tracking',
        description: 'Implementing monitoring to prevent future waste',
        status: 'pending',
        duration: 30,
        estimatedTime: '30s',
        agent: 'AutomationBuilder',
        impact: { savings: 0 }
      },
      {
        id: 'monthly_review',
        name: 'Monthly review process',
        description: 'Establishing automated review system',
        status: 'pending',
        duration: 15,
        estimatedTime: '15s',
        agent: 'ReviewScheduler',
        impact: { savings: 0 }
      }
    ],
    profileCustomizations: {
      [ProfileType.GEN_Z]: {
        description: 'Cancel unused subscriptions and save money',
        potentialSaving: 35,
        rationale: 'Found 4 unused subscriptions including gym membership, streaming services, and software tools'
      },
      [ProfileType.MILLENNIAL]: {
        description: 'Optimize subscription spending',
        potentialSaving: 47,
        rationale: 'Identified 3 recurring charges with no recent activity, including premium streaming and software subscriptions'
      }
    },
    scenarioTriggers: [ScenarioType.JOB_LOSS, ScenarioType.EMERGENCY_FUND_CRISIS],
    successMetrics: {
      savingsTarget: 47,
      timeToComplete: '2-3 minutes',
      successRate: 0.85
    }
  },
  [WorkflowType.BILL_NEGOTIATION]: {
    id: 'bill_negotiation',
    name: 'Negotiate Bills',
    category: WorkflowCategory.OPTIMIZE,
    type: WorkflowType.BILL_NEGOTIATION,
    description: 'Reduce monthly bills by negotiating with providers',
    rationale: 'Your cable and internet bills have increased 15% this year. We can negotiate with providers to match competitor rates.',
    potentialSaving: 35,
    estimatedDuration: '5-10 minutes',
    riskLevel: 'low',
    prerequisites: ['bill_accounts', 'payment_history'],
    steps: [
      {
        id: 'analyze_bills',
        name: 'Contact service providers',
        description: 'Reaching out to negotiate better rates',
        status: 'pending',
        duration: 180,
        estimatedTime: '3m',
        agent: 'BillNegotiator',
        impact: { savings: 0 }
      },
      {
        id: 'research_competitors',
        name: 'Present competitor offers',
        description: 'Using market research to leverage better deals',
        status: 'pending',
        duration: 60,
        estimatedTime: '1m',
        agent: 'MarketResearcher',
        impact: { savings: 0 }
      },
      {
        id: 'negotiate_rates',
        name: 'Negotiate new rates',
        description: 'Securing improved pricing through retention departments',
        status: 'pending',
        duration: 300,
        estimatedTime: '5m',
        agent: 'RetentionSpecialist',
        impact: { savings: 35 },
        userActionRequired: {
          type: 'choice',
          message: 'Comcast offered $30/month savings. Accept or negotiate further?',
          options: ['Accept offer', 'Negotiate more', 'Decline']
        }
      },
      {
        id: 'confirm_changes',
        name: 'Confirm changes',
        description: 'Verifying all rate changes are properly applied',
        status: 'pending',
        duration: 45,
        estimatedTime: '45s',
        agent: 'VerificationBot',
        impact: { savings: 0 }
      }
    ],
    profileCustomizations: {
      [ProfileType.GEN_Z]: {
        description: 'Get better rates on your bills',
        potentialSaving: 25,
        rationale: 'Your streaming and internet bills can be optimized for better rates'
      },
      [ProfileType.MILLENNIAL]: {
        description: 'Negotiate better rates on utilities and services',
        potentialSaving: 35,
        rationale: 'Your cable and internet bills have increased 15% this year. We can negotiate with providers to match competitor rates.'
      }
    },
    scenarioTriggers: [ScenarioType.JOB_LOSS, ScenarioType.EMERGENCY_FUND_CRISIS],
    successMetrics: {
      savingsTarget: 35,
      timeToComplete: '5-10 minutes',
      successRate: 0.73
    }
  },
  [WorkflowType.HIGH_YIELD_SAVINGS]: {
    id: 'high_yield_savings',
    name: 'Move to High-Yield Savings',
    category: WorkflowCategory.OPTIMIZE,
    type: WorkflowType.HIGH_YIELD_SAVINGS,
    description: 'Earn 4.5% APY on your savings',
    rationale: 'Your current savings account earns only 0.01% APY. Moving to a high-yield savings account with 4.5% APY would generate an additional $234 annually on your current balance.',
    potentialSaving: 20,
    estimatedDuration: '3-5 minutes',
    riskLevel: 'low',
    prerequisites: ['savings_account', 'plaid_access'],
    steps: [
      {
        id: 'research_accounts',
        name: 'Research high-yield accounts',
        description: 'Comparing rates and features across top banks',
        status: 'pending',
        duration: 90,
        estimatedTime: '1.5m',
        agent: 'AccountFinder',
        impact: { savings: 0 }
      },
      {
        id: 'open_account',
        name: 'Open new account',
        description: 'Setting up account with optimal terms',
        status: 'pending',
        duration: 240,
        estimatedTime: '4m',
        agent: 'AccountOpener',
        impact: { savings: 0 },
        userActionRequired: {
          type: 'input',
          message: 'Enter your SSN for account verification',
          options: []
        }
      },
      {
        id: 'setup_transfers',
        name: 'Set up automatic transfers',
        description: 'Configuring recurring deposits for consistent growth',
        status: 'pending',
        duration: 60,
        estimatedTime: '1m',
        agent: 'TransferScheduler',
        impact: { savings: 20 }
      }
    ],
    profileCustomizations: {
      [ProfileType.GEN_Z]: {
        name: 'Open High-Yield Savings',
        description: 'Start earning 4.5% APY on your savings',
        potentialSaving: 15,
        rationale: 'Analysis of your account shows $5,200 in savings earning minimal interest (likely 0.01% APY). By moving to a high-yield savings account with 4.5% APY, you\'d earn an additional $234 annually.'
      },
      [ProfileType.MILLENNIAL]: {
        name: 'Move to High-Yield Savings',
        description: 'Detected excess in checking, earning you +$8/month',
        potentialSaving: 8,
        rationale: 'Our analysis detected $3,200 sitting in your checking account earning 0.01% APY. This excess cash could be moved to a high-yield savings account earning 4.5% APY, generating an additional $144 annually.'
      }
    },
    scenarioTriggers: [ScenarioType.EMERGENCY_FUND_CRISIS, ScenarioType.INCOME_INCREASE],
    successMetrics: {
      savingsTarget: 20,
      timeToComplete: '3-5 minutes',
      successRate: 0.95
    }
  }
}

// Workflow Manager Class
export class WorkflowManager {
  private static instance: WorkflowManager
  private activeWorkflows = new Map<string, WorkflowExecutionState>()

  private constructor() {}

  static getInstance(): WorkflowManager {
    if (!WorkflowManager.instance) {
      WorkflowManager.instance = new WorkflowManager()
    }
    return WorkflowManager.instance
  }

  /**
   * Generate workflow for specific profile and scenario
   */
  generateWorkflow(
    workflowType: WorkflowType,
    profile: ProfileType,
    scenario?: ScenarioType
  ): AutomationAction {
    const baseDefinition = BASE_WORKFLOW_DEFINITIONS[workflowType]
    if (!baseDefinition) {
      throw new Error(`Workflow type ${workflowType} not found`)
    }

    // Apply profile customizations
    const customizedDefinition = this.applyProfileCustomizations(baseDefinition, profile)
    
    // Apply scenario-specific modifications
    const scenarioModifiedDefinition = scenario 
      ? this.applyScenarioModifications(customizedDefinition, scenario)
      : customizedDefinition

    return this.convertToAutomationAction(scenarioModifiedDefinition, profile)
  }

  /**
   * Apply profile-specific customizations
   */
  private applyProfileCustomizations(
    definition: WorkflowDefinition,
    profile: ProfileType
  ): WorkflowDefinition {
    const customization = definition.profileCustomizations[profile]
    if (!customization) return definition

    return {
      ...definition,
      ...customization,
      steps: definition.steps.map(step => ({
        ...step,
        details: this.getProfileSpecificStepDetails(step.name, profile)
      }))
    }
  }

  /**
   * Apply scenario-specific modifications
   */
  private applyScenarioModifications(
    definition: WorkflowDefinition,
    scenario: ScenarioType
  ): WorkflowDefinition {
    const scenarioModifiers: Record<ScenarioType, Partial<WorkflowDefinition>> = {
      [ScenarioType.JOB_LOSS]: {
        potentialSaving: Math.round(definition.potentialSaving * 1.2),
        rationale: `${definition.rationale} This is especially important during job loss scenarios to maximize savings.`
      },
      [ScenarioType.EMERGENCY_FUND_CRISIS]: {
        potentialSaving: Math.round(definition.potentialSaving * 1.5),
        rationale: `${definition.rationale} Critical for building emergency fund quickly.`
      },
      [ScenarioType.MARKET_CRASH]: {
        potentialSaving: Math.round(definition.potentialSaving * 0.8),
        rationale: `${definition.rationale} Conservative approach during market volatility.`
      },
      [ScenarioType.MEDICAL_CRISIS]: {
        potentialSaving: Math.round(definition.potentialSaving * 1.3),
        rationale: `${definition.rationale} Essential for managing medical expenses.`
      },
      [ScenarioType.HOME_PURCHASE]: {
        potentialSaving: Math.round(definition.potentialSaving * 0.9),
        rationale: `${definition.rationale} Important for home purchase preparation.`
      },
      [ScenarioType.RETIREMENT_PLANNING]: {
        potentialSaving: Math.round(definition.potentialSaving * 1.1),
        rationale: `${definition.rationale} Supports long-term retirement goals.`
      },
      [ScenarioType.DEBT_CRISIS]: {
        potentialSaving: Math.round(definition.potentialSaving * 1.4),
        rationale: `${definition.rationale} Critical for debt reduction strategy.`
      },
      [ScenarioType.INCOME_INCREASE]: {
        potentialSaving: Math.round(definition.potentialSaving * 1.1),
        rationale: `${definition.rationale} Leverage increased income for better financial position.`
      }
    }

    const modifier = scenarioModifiers[scenario]
    if (!modifier) return definition

    return {
      ...definition,
      ...modifier
    }
  }

  /**
   * Get profile-specific step details
   */
  private getProfileSpecificStepDetails(stepName: string, profile: ProfileType): string {
    const details: Record<string, Record<ProfileType, string>> = {
      'Review subscription list': {
        [ProfileType.GEN_Z]: 'Found 4 unused subscriptions including gym membership, streaming services, and software tools',
        [ProfileType.MILLENNIAL]: 'Identified 3 recurring charges with no recent activity, including premium streaming and software subscriptions',
        [ProfileType.GEN_X]: 'Located 2 unused subscriptions and 1 underutilized service',
        [ProfileType.BOOMER]: 'Found 1 unused subscription service'
      },
      'Cancel unused services': {
        [ProfileType.GEN_Z]: 'Successfully cancelled 4 services, saving $35/month. Set up usage alerts to prevent future waste.',
        [ProfileType.MILLENNIAL]: 'Successfully cancelled 3 services, saving $47/month. Set up usage alerts to prevent future waste.',
        [ProfileType.GEN_X]: 'Successfully cancelled 2 services, saving $28/month. Set up usage alerts to prevent future waste.',
        [ProfileType.BOOMER]: 'Successfully cancelled 1 service, saving $12/month. Set up usage alerts to prevent future waste.'
      }
    }

    return details[stepName]?.[profile] || 'Processing step details...'
  }

  /**
   * Convert workflow definition to automation action
   */
  private convertToAutomationAction(
    definition: WorkflowDefinition,
    profile: ProfileType
  ): AutomationAction {
    return {
      title: definition.name,
      description: definition.description,
      rationale: definition.rationale,
      type: 'optimization',
      potentialSaving: definition.potentialSaving,
      status: 'suggested',
      steps: definition.steps.map(step => ({
        name: step.name,
        status: step.status,
        duration: step.duration,
        agent: step.agent,
        userActionRequired: step.userActionRequired,
        impact: step.impact,
        details: step.details
      }))
    }
  }

  /**
   * Get available workflows for profile and scenario
   */
  getAvailableWorkflows(profile: ProfileType, scenario?: ScenarioType): AutomationAction[] {
    const availableTypes = Object.values(WorkflowType)
    const workflows: AutomationAction[] = []

    for (const workflowType of availableTypes) {
      try {
        const workflow = this.generateWorkflow(workflowType, profile, scenario)
        workflows.push(workflow)
      } catch (error) {
        console.warn(`Failed to generate workflow ${workflowType}:`, error)
      }
    }

    return workflows
  }

  /**
   * Start workflow execution
   */
  async startWorkflow(
    workflowType: WorkflowType,
    profile: ProfileType,
    scenario?: ScenarioType
  ): Promise<{ executionId: string; status: string }> {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const workflow = this.generateWorkflow(workflowType, profile, scenario)
    
    const executionState: WorkflowExecutionState = {
      executionId,
      workflowId: workflowType,
      status: 'queued',
      progress: 0,
      currentStep: 'Initializing...',
      errors: [],
      startedAt: new Date().toISOString(),
      estimatedCompletion: this.calculateEstimatedCompletion(workflow),
      impact: {
        totalSavings: 0,
        riskReduction: 0,
        goalProgress: 0
      }
    }

    this.activeWorkflows.set(executionId, executionState)
    
    // Start execution simulation
    this.simulateWorkflowExecution(executionId, workflow)
    
    return {
      executionId,
      status: 'started'
    }
  }

  /**
   * Get workflow execution status
   */
  getWorkflowStatus(executionId: string): WorkflowExecutionState | null {
    return this.activeWorkflows.get(executionId) || null
  }

  /**
   * Calculate estimated completion time
   */
  private calculateEstimatedCompletion(workflow: AutomationAction): string {
    const totalDuration = workflow.steps.reduce((sum, step) => sum + (step.duration || 60), 0)
    const completionTime = new Date(Date.now() + totalDuration * 1000 + 2000)
    return completionTime.toISOString()
  }

  /**
   * Simulate workflow execution (for demo purposes)
   */
  private simulateWorkflowExecution(executionId: string, workflow: AutomationAction): void {
    const steps = workflow.steps
    let currentStepIndex = 0

    const executeStep = () => {
      if (currentStepIndex >= steps.length) {
        // Workflow completed
        const state = this.activeWorkflows.get(executionId)
        if (state) {
          state.status = 'completed'
          state.progress = 100
          state.currentStep = 'Workflow completed'
        }
        return
      }

      const step = steps[currentStepIndex]
      const progress = Math.round(((currentStepIndex + 1) / steps.length) * 100)

      // Update state
      const state = this.activeWorkflows.get(executionId)
      if (state) {
        state.status = 'running'
        state.progress = progress
        state.currentStep = step.name
        
        // Update step status
        if (step.status === 'pending') {
          step.status = 'in_progress'
        }
      }

      // Simulate step duration
      setTimeout(() => {
        // Mark step as completed
        if (state && step) {
          step.status = 'completed'
        }
        
        currentStepIndex++
        executeStep()
      }, (step.duration || 60) * 1000)
    }

    // Start execution after a short delay
    setTimeout(executeStep, 1000)
  }
}

// Export singleton instance
export const workflowManager = WorkflowManager.getInstance()
