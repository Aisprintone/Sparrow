/**
 * Workflow Service
 * Handles communication with the workflow automation API
 */

export interface WorkflowStatus {
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

export interface WorkflowDefinition {
  id: string;
  name: string;
  category: string;
  description: string;
  estimated_duration: string;
  estimated_impact: {
    monthly_savings: number;
    time_to_complete: string;
    risk_level: string;
  };
  steps_count: number;
  prerequisites: string[];
}

export interface StartWorkflowRequest {
  workflow_id: string;
  user_id: string;
  parameters?: Record<string, any>;
}

export interface UserInputRequest {
  execution_id: string;
  user_input: Record<string, any>;
}

class WorkflowService {
  private baseUrl = '/api/workflows';

  /**
   * Start a workflow execution
   */
  async startWorkflow(request: StartWorkflowRequest): Promise<{ execution_id: string; workflow_id: string; status: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Failed to start workflow: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error starting workflow:', error);
      throw error;
    }
  }

  /**
   * Get status of a workflow execution
   */
  async getWorkflowStatus(executionId: string): Promise<WorkflowStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/status/${executionId}`);

      if (!response.ok) {
        throw new Error(`Failed to get workflow status: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting workflow status:', error);
      throw error;
    }
  }

  /**
   * Get all workflows for a user
   */
  async getUserWorkflows(userId: string): Promise<WorkflowStatus[]> {
    try {
      const response = await fetch(`${this.baseUrl}/user/${userId}`);

      if (!response.ok) {
        throw new Error(`Failed to get user workflows: ${response.statusText}`);
      }

      const data = await response.json();
      return data.workflows || [];
    } catch (error) {
      console.error('Error getting user workflows:', error);
      throw error;
    }
  }

  /**
   * Pause a workflow execution
   */
  async pauseWorkflow(executionId: string): Promise<{ status: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${executionId}/pause`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Failed to pause workflow: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error pausing workflow:', error);
      throw error;
    }
  }

  /**
   * Resume a paused workflow
   */
  async resumeWorkflow(executionId: string): Promise<{ status: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${executionId}/resume`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Failed to resume workflow: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error resuming workflow:', error);
      throw error;
    }
  }

  /**
   * Cancel a workflow execution
   */
  async cancelWorkflow(executionId: string): Promise<{ status: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${executionId}/cancel`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Failed to cancel workflow: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error cancelling workflow:', error);
      throw error;
    }
  }

  /**
   * Handle user input for a paused workflow
   */
  async handleUserInput(executionId: string, userInput: Record<string, any>): Promise<{ status: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${executionId}/input`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ execution_id: executionId, user_input: userInput }),
      });

      if (!response.ok) {
        throw new Error(`Failed to handle user input: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error handling user input:', error);
      throw error;
    }
  }

  /**
   * Get all available workflows
   */
  async getAvailableWorkflows(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/available`);

      if (!response.ok) {
        throw new Error(`Failed to get available workflows: ${response.statusText}`);
      }

      const data = await response.json();
      return data.workflows || [];
    } catch (error) {
      console.error('Error getting available workflows:', error);
      throw error;
    }
  }

  /**
   * Get details of a specific workflow
   */
  async getWorkflowDetails(workflowId: string): Promise<WorkflowDefinition> {
    try {
      const response = await fetch(`${this.baseUrl}/available/${workflowId}`);

      if (!response.ok) {
        throw new Error(`Failed to get workflow details: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting workflow details:', error);
      throw error;
    }
  }

  /**
   * Get workflow recommendations for a user
   */
  async getWorkflowRecommendations(userProfile: Record<string, any>): Promise<WorkflowDefinition[]> {
    try {
      const response = await fetch(`${this.baseUrl}/recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userProfile),
      });

      if (!response.ok) {
        throw new Error(`Failed to get workflow recommendations: ${response.statusText}`);
      }

      const data = await response.json();
      return data.recommendations || [];
    } catch (error) {
      console.error('Error getting workflow recommendations:', error);
      throw error;
    }
  }

  /**
   * Get workflows by category
   */
  async getWorkflowsByCategory(category: string): Promise<{ category: string; workflows: WorkflowDefinition[] }> {
    try {
      const response = await fetch(`${this.baseUrl}/categories/${category}`);

      if (!response.ok) {
        throw new Error(`Failed to get workflows by category: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting workflows by category:', error);
      throw error;
    }
  }

  /**
   * Poll workflow status with exponential backoff
   */
  async pollWorkflowStatus(executionId: string, onUpdate?: (status: WorkflowStatus) => void): Promise<WorkflowStatus> {
    let attempts = 0;
    const maxAttempts = 10;
    const baseDelay = 1000; // 1 second

    while (attempts < maxAttempts) {
      try {
        const status = await this.getWorkflowStatus(executionId);
        
        if (onUpdate) {
          onUpdate(status);
        }

        // If workflow is completed, failed, or error, stop polling
        if (['completed', 'failed', 'error'].includes(status.status)) {
          return status;
        }

        // Wait before next poll with exponential backoff
        const delay = baseDelay * Math.pow(2, attempts);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        attempts++;
      } catch (error) {
        console.error(`Error polling workflow status (attempt ${attempts + 1}):`, error);
        attempts++;
        
        if (attempts >= maxAttempts) {
          throw error;
        }
      }
    }

    throw new Error('Max polling attempts reached');
  }
}

// Export singleton instance
export const workflowService = new WorkflowService();
