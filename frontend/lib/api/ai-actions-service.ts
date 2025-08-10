/**
 * AI Actions Service
 * Converts workflows to AI actions for the frontend
 * Enhanced with theatrical workflow execution for demo
 */

import { workflowService, WorkflowDefinition } from './workflow-service';
import { AIAction } from '@/hooks/use-app-state';
import { cacheService } from '../services/cacheService';
import { personalizedWorkflowService } from './personalized-workflow-service';

export interface WorkflowToAIActionMapping {
  [workflowId: string]: {
    title: string;
    description: string;
    rationale: string;
    potentialSaving: number;
    steps: string[];
    type: "optimization" | "simulation";
  };
}

// Mock workflow definitions for theatrical demo
const MOCK_WORKFLOWS = {
  "optimize.cancel_subscriptions.v1": {
    id: "optimize.cancel_subscriptions.v1",
    name: "Cancel Unused Subscriptions",
    category: "optimize",
    description: "Identify and cancel unused subscription services",
    estimated_duration: "2-3 minutes",
    estimated_impact: { monthly_savings: 47, time_to_complete: "2-3 minutes", risk_level: "low" },
    steps_count: 4,
    prerequisites: ["plaid_account_access", "transaction_history_90_days"]
  },
  "optimize.bill_negotiation.v1": {
    id: "optimize.bill_negotiation.v1",
    name: "Negotiate Bills",
    category: "optimize", 
    description: "Reduce monthly bills by negotiating with providers",
    estimated_duration: "5-10 minutes",
    estimated_impact: { monthly_savings: 35, time_to_complete: "5-10 minutes", risk_level: "low" },
    steps_count: 3,
    prerequisites: ["bill_accounts", "payment_history"]
  },
  "optimize.high_yield_savings.v1": {
    id: "optimize.high_yield_savings.v1",
    name: "Move to High-Yield Savings",
    category: "optimize",
    description: "Earn 4.5% APY on your savings",
    estimated_duration: "3-5 minutes", 
    estimated_impact: { monthly_savings: 20, time_to_complete: "3-5 minutes", risk_level: "low" },
    steps_count: 3,
    prerequisites: ["savings_account", "plaid_access"]
  },
  "protect.emergency_fund.v1": {
    id: "protect.emergency_fund.v1",
    name: "Build Emergency Fund",
    category: "protect",
    description: "Create 6-month emergency fund",
    estimated_duration: "1-2 minutes",
    estimated_impact: { monthly_savings: 0, time_to_complete: "1-2 minutes", risk_level: "low" },
    steps_count: 2,
    prerequisites: ["income_verification", "expense_analysis"]
  },
  "grow.investment_optimization.v1": {
    id: "grow.investment_optimization.v1", 
    name: "Optimize Investment Portfolio",
    category: "grow",
    description: "Increase investment returns by 2-3%",
    estimated_duration: "4-6 minutes",
    estimated_impact: { monthly_savings: 50, time_to_complete: "4-6 minutes", risk_level: "medium" },
    steps_count: 4,
    prerequisites: ["investment_accounts", "risk_assessment"]
  },
  "emergency.debt_avalanche.v1": {
    id: "emergency.debt_avalanche.v1",
    name: "Debt Avalanche Strategy", 
    category: "emergency",
    description: "Pay off debt faster and save on interest",
    estimated_duration: "2-3 minutes",
    estimated_impact: { monthly_savings: 200, time_to_complete: "2-3 minutes", risk_level: "low" },
    steps_count: 3,
    prerequisites: ["debt_accounts", "payment_capacity"]
  }
};

// Workflow step definitions with realistic timing
const WORKFLOW_STEPS = {
  "optimize.cancel_subscriptions.v1": [
    { name: "Analyzing subscription spending", duration: 2000 },
    { name: "Identifying unused services", duration: 3000 },
    { name: "Preparing cancellation requests", duration: 1500 },
    { name: "Confirming cancellations", duration: 2500 }
  ],
  "optimize.bill_negotiation.v1": [
    { name: "Analyzing current bills", duration: 3000 },
    { name: "Researching competitor rates", duration: 4000 },
    { name: "Preparing negotiation strategy", duration: 2000 },
    { name: "Contacting service providers", duration: 5000 }
  ],
  "optimize.high_yield_savings.v1": [
    { name: "Calculating optimal transfer amount", duration: 2000 },
    { name: "Opening high-yield account", duration: 4000 },
    { name: "Initiating fund transfer", duration: 3000 }
  ],
  "protect.emergency_fund.v1": [
    { name: "Calculating 6-month expenses", duration: 2000 },
    { name: "Setting up automatic savings", duration: 3000 }
  ],
  "grow.investment_optimization.v1": [
    { name: "Analyzing current allocation", duration: 3000 },
    { name: "Calculating optimal rebalance", duration: 2500 },
    { name: "Executing portfolio changes", duration: 4000 },
    { name: "Setting up automatic rebalancing", duration: 2000 }
  ],
  "emergency.debt_avalanche.v1": [
    { name: "Listing debts by interest rate", duration: 2000 },
    { name: "Calculating payment strategy", duration: 2500 },
    { name: "Setting up automatic payments", duration: 3000 }
  ]
};

// Mapping of workflow IDs to AI action details
const WORKFLOW_TO_AI_ACTION_MAPPING: WorkflowToAIActionMapping = {
  "optimize.cancel_subscriptions.v1": {
    title: "Cancel Unused Subscriptions",
    description: "Found 3 unused subscriptions costing $47/month",
    rationale: "Analysis of your recurring charges identified subscriptions you haven't used in the past 60 days. These include a gym membership ($29/month), streaming service ($12/month), and software subscription ($6/month) that show no recent activity.",
    potentialSaving: 47,
    steps: ["Review subscription list", "Cancel unused services", "Set up usage tracking", "Monthly review process"],
    type: "optimization"
  },
  "optimize.bill_negotiation.v1": {
    title: "Negotiate Bills",
    description: "Reduce monthly bills by $35/month",
    rationale: "Your cable and internet bills have increased 15% this year. We can negotiate with providers to match competitor rates and secure better deals.",
    potentialSaving: 35,
    steps: ["Contact service providers", "Present competitor offers", "Negotiate new rates", "Confirm changes"],
    type: "optimization"
  },
  "optimize.high_yield_savings.v1": {
    title: "Move to High-Yield Savings",
    description: "Earn 4.5% APY on your savings",
    rationale: "Your current savings account earns only 0.01% APY. Moving to a high-yield savings account with 4.5% APY would generate an additional $234 annually on your current balance.",
    potentialSaving: 20,
    steps: ["Research high-yield accounts", "Open new account", "Set up automatic transfers", "Monitor monthly"],
    type: "optimization"
  },
  "protect.emergency_fund.v1": {
    title: "Build Emergency Fund",
    description: "Create 6-month emergency fund",
    rationale: "Your current emergency fund covers only 2 months of expenses. Building a 6-month emergency fund provides financial security and prevents debt accumulation during crises.",
    potentialSaving: 0, // Not a direct saving, but protection
    steps: ["Calculate 6-month expenses", "Set up automatic savings", "Choose high-yield account", "Monitor progress"],
    type: "optimization"
  },
  "grow.investment_optimization.v1": {
    title: "Optimize Investment Portfolio",
    description: "Increase investment returns by 2-3%",
    rationale: "Your current investment allocation is not optimized for your age and risk tolerance. Rebalancing and optimizing your portfolio could increase returns by 2-3% annually.",
    potentialSaving: 50, // Estimated monthly increase
    steps: ["Review current allocation", "Rebalance portfolio", "Set up automatic rebalancing", "Monitor quarterly"],
    type: "optimization"
  },
  "emergency.debt_avalanche.v1": {
    title: "Debt Avalanche Strategy",
    description: "Pay off debt faster and save on interest",
    rationale: "Using the debt avalanche method (paying highest interest rates first) will save you $2,400 in interest over the repayment period while maintaining financial stability.",
    potentialSaving: 200,
    steps: ["List all debts by interest rate", "Pay minimums on all except highest", "Allocate extra to highest rate", "Track progress monthly"],
    type: "optimization"
  }
};

// Workflow execution state management
interface WorkflowExecutionState {
  execution_id: string;
  workflow_id: string;
  status: 'queued' | 'running' | 'paused' | 'completed' | 'failed' | 'error';
  progress: number;
  current_step: string;
  errors: string[];
  started_at: string;
  estimated_completion?: string;
  user_action_required?: {
    step_id: string;
    message: string;
    options?: string[];
    type: string;
  };
}

class AIActionsService {
  private activeWorkflows = new Map<string, WorkflowExecutionState>();

  /**
   * Get AI actions from available workflows
   */
  async getAIActions(userId: string, demographic: string): Promise<AIAction[]> {
    try {
      // Get available workflows
      const availableWorkflows = await this.getAvailableWorkflows();
      
      // Convert workflows to AI actions
      const aiActions: AIAction[] = [];
      
      for (const workflowId of availableWorkflows) {
        const mapping = WORKFLOW_TO_AI_ACTION_MAPPING[workflowId];
        if (mapping) {
          // Customize based on demographic
          const customizedMapping = this.customizeForDemographic(mapping, demographic);
          
          aiActions.push({
            id: workflowId,
            title: customizedMapping.title,
            description: customizedMapping.description,
            rationale: customizedMapping.rationale,
            type: customizedMapping.type,
            potentialSaving: customizedMapping.potentialSaving,
            steps: customizedMapping.steps,
            status: "suggested"
          });
        }
      }
      
      // Add some completed and in-process actions for demonstration
      aiActions.push(
        {
          id: "emergency-fund-completed",
          title: "Emergency Fund Optimization",
          description: "Successfully moved $5,000 to high-yield savings",
          rationale: "Completed action that moved emergency fund to Marcus savings account earning 4.5% APY instead of 0.01%.",
          type: "optimization",
          potentialSaving: 18,
          steps: ["Account opened", "Funds transferred", "Auto-transfer setup", "Monthly monitoring active"],
          status: "completed"
        },
        {
          id: "bill-negotiation-in-progress",
          title: "Negotiate Cable Bill",
          description: "Currently negotiating with Comcast for better rates",
          rationale: "Your cable bill has increased 15% this year. We're negotiating with Comcast to match competitor rates and secure a better deal.",
          type: "optimization",
          potentialSaving: 35,
          steps: ["Contact Comcast retention", "Present competitor offers", "Negotiate new rate", "Confirm changes"],
          status: "in-process",
          progress: 65,
          workflowStatus: 'running',
          currentStep: 'Contacting service providers',
          estimatedCompletion: '2024-01-15T14:30:00Z'
        }
      );
      
      return aiActions;
    } catch (error) {
      console.error('Error getting AI actions:', error);
      // Return fallback actions if API fails
      return this.getFallbackAIActions(demographic);
    }
  }
  
  /**
   * Start a workflow for an AI action (theatrical demo)
   */
  async startAIAction(workflowId: string, userId: string, parameters: Record<string, any> = {}): Promise<{ execution_id: string; status: string }> {
    try {
      const result = await this.startMockWorkflow(workflowId, userId, parameters);
      return {
        execution_id: result.execution_id,
        status: result.status
      };
    } catch (error) {
      console.error('Error starting AI action:', error);
      throw error;
    }
  }
  
  /**
   * Get workflow status for an AI action
   */
  async getAIActionStatus(executionId: string): Promise<any> {
    try {
      return await this.getMockWorkflowStatus(executionId);
    } catch (error) {
      console.error('Error getting AI action status:', error);
      throw error;
    }
  }

  /**
   * Start a mock workflow execution with theatrical timing
   */
  private async startMockWorkflow(workflowId: string, userId: string, parameters: Record<string, any> = {}): Promise<{ execution_id: string; workflow_id: string; status: string }> {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create initial status
    const status: WorkflowExecutionState = {
      execution_id: executionId,
      workflow_id: workflowId,
      status: 'queued',
      progress: 0,
      current_step: 'Initializing...',
      errors: [],
      started_at: new Date().toISOString(),
      estimated_completion: this.calculateEstimatedCompletion(workflowId)
    };

    // Store the workflow
    this.activeWorkflows.set(executionId, status);
    
    // Cache the initial status
    await cacheService.set(`workflow_status:${executionId}`, status, 30 * 1000);
    
    // Start the theatrical execution
    this.simulateWorkflowExecution(executionId, workflowId);
    
    return {
      execution_id: executionId,
      workflow_id: workflowId,
      status: 'started'
    };
  }

  /**
   * Get mock workflow status with realistic progress
   */
  private async getMockWorkflowStatus(executionId: string): Promise<WorkflowExecutionState> {
    // Try cache first
    const cacheKey = `workflow_status:${executionId}`;
    const cachedStatus = await cacheService.get<WorkflowExecutionState>(cacheKey);
    
    if (cachedStatus) {
      return cachedStatus;
    }

    // Return from active workflows
    const status = this.activeWorkflows.get(executionId);
    if (!status) {
      throw new Error(`Workflow execution ${executionId} not found`);
    }

    return status;
  }

  /**
   * Simulate realistic workflow execution
   */
  private simulateWorkflowExecution(executionId: string, workflowId: string): void {
    const steps = WORKFLOW_STEPS[workflowId as keyof typeof WORKFLOW_STEPS] || [];
    const totalSteps = steps.length;

    const updateStatus = async (stepIndex: number, stepName: string, progress: number, status: WorkflowExecutionState['status']) => {
      const workflow = this.activeWorkflows.get(executionId);
      if (!workflow) return;

      workflow.current_step = stepName;
      workflow.progress = progress;
      workflow.status = status;

      // Update cache
      await cacheService.set(`workflow_status:${executionId}`, workflow, 30 * 1000);
      
      console.log(`[MOCK WORKFLOW] ${workflowId} - Step ${stepIndex + 1}/${totalSteps}: ${stepName} (${progress}%)`);
    };

    const executeStep = async (stepIndex: number) => {
      if (stepIndex >= steps.length) {
        // Workflow completed
        await updateStatus(stepIndex, 'Workflow completed', 100, 'completed');
        return;
      }

      const step = steps[stepIndex];
      const progress = Math.round(((stepIndex + 1) / totalSteps) * 100);

      // Update to running status
      await updateStatus(stepIndex, step.name, progress, 'running');

      // Simulate step execution time
      setTimeout(async () => {
        await executeStep(stepIndex + 1);
      }, step.duration);
    };

    // Start execution after a short delay
    setTimeout(() => {
      executeStep(0);
    }, 1000);
  }

  /**
   * Calculate realistic completion time
   */
  private calculateEstimatedCompletion(workflowId: string): string {
    const steps = WORKFLOW_STEPS[workflowId as keyof typeof WORKFLOW_STEPS] || [];
    const totalDuration = steps.reduce((sum, step) => sum + step.duration, 0);
    const completionTime = new Date(Date.now() + totalDuration + 2000); // Add 2s buffer
    return completionTime.toISOString();
  }

  /**
   * Get available workflows
   */
  private async getAvailableWorkflows(): Promise<string[]> {
    return Object.keys(MOCK_WORKFLOWS);
  }
  
  /**
   * Customize workflow mapping for demographic
   */
  private customizeForDemographic(mapping: any, demographic: string): any {
    const customized = { ...mapping };
    
    if (demographic === "genz") {
      // Customize for Gen Z
      if (mapping.title.includes("High-Yield Savings")) {
        customized.title = "Open High-Yield Savings";
        customized.description = "Start earning 4.5% APY on your savings";
        customized.potentialSaving = 15;
      }
    } else if (demographic === "millennial") {
      // Customize for Millennials
      if (mapping.title.includes("High-Yield Savings")) {
        customized.title = "Move to High-Yield Savings";
        customized.description = "Detected excess in checking, earning you +$8/month";
        customized.potentialSaving = 8;
      }
    }
    
    return customized;
  }
  
  /**
   * Get fallback AI actions if API fails
   */
  private getFallbackAIActions(demographic: string): AIAction[] {
    return [
      {
        id: "high-yield-savings",
        title: demographic === "genz" ? "Open High-Yield Savings" : "Move to High-Yield Savings",
        description: demographic === "genz" ? "Start earning 4.5% APY on your savings" : "Detected excess in checking, earning you +$8/month",
        rationale: demographic === "genz" 
          ? "Analysis of your account shows $5,200 in savings earning minimal interest (likely 0.01% APY). By moving to a high-yield savings account with 4.5% APY, you'd earn an additional $234 annually."
          : "Our analysis detected $3,200 sitting in your checking account earning 0.01% APY. This excess cash could be moved to a high-yield savings account earning 4.5% APY, generating an additional $144 annually.",
        type: "optimization",
        potentialSaving: demographic === "genz" ? 15 : 8,
        steps: ["Research high-yield savings accounts", "Open account with partner bank", "Set up automatic transfer", "Monitor and adjust monthly"],
        status: "suggested"
      },
      {
        id: "budget-optimization",
        title: demographic === "genz" ? "Create First Budget" : "Optimize Monthly Budget",
        description: demographic === "genz" ? "Track spending and save $200/month" : "Reduce unnecessary expenses by $150/month",
        rationale: demographic === "genz"
          ? "Transaction analysis reveals you're spending $450/month on food & dining (21% of income) and $220 on entertainment (10% of income). A structured budget could reduce spending by $200/month."
          : "Our spending analysis identified $380/month on entertainment and multiple subscription services totaling $89/month. By optimizing subscriptions and reducing dining out, you could save $150/month.",
        type: "optimization",
        potentialSaving: demographic === "genz" ? 200 : 150,
        steps: ["Analyze spending patterns", "Set category budgets", "Set up spending alerts", "Review monthly progress"],
        status: "suggested"
      }
    ];
  }
}

// Export singleton instance
export const aiActionsService = new AIActionsService();
