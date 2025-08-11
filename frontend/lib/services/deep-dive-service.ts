"use client"

// Deep Dive Data Service - Single Source of Truth
// Manages deep dive insights across Dashboard, AI Actions, and Simulations

export interface DeepDiveData {
  id: string
  source: 'simulation' | 'dashboard' | 'ai_action'
  actionId: string
  title: string
  description: string
  potentialSaving: number
  detailed_insights: {
    mechanics_explanation: string
    key_insights: string[]
    scenario_nuances: string
    decision_context: string
  }
  createdAt: string
  simulationTag?: string
}

export interface SimulationAIAction {
  id: string
  title: string
  description: string
  rationale: string
  type: 'optimization'
  potentialSaving: number
  steps: string[]
  status: 'suggested'
  simulationTag?: string
  detailed_insights?: DeepDiveData['detailed_insights']
}

class DeepDiveService {
  private static instance: DeepDiveService
  private deepDives: Map<string, DeepDiveData> = new Map()
  private simulationAIActions: Map<string, SimulationAIAction> = new Map()

  public static getInstance(): DeepDiveService {
    if (!DeepDiveService.instance) {
      DeepDiveService.instance = new DeepDiveService()
    }
    return DeepDiveService.instance
  }

  // Store deep dive data
  public saveDeepDive(data: DeepDiveData): void {
    this.deepDives.set(data.id, data)
  }

  // Retrieve deep dive by ID
  public getDeepDive(id: string): DeepDiveData | undefined {
    return this.deepDives.get(id)
  }

  // Get all deep dives
  public getAllDeepDives(): DeepDiveData[] {
    return Array.from(this.deepDives.values())
  }

  // Get deep dives by source
  public getDeepDivesBySource(source: DeepDiveData['source']): DeepDiveData[] {
    return this.getAllDeepDives().filter(dive => dive.source === source)
  }

  // Get deep dives by action ID
  public getDeepDivesByActionId(actionId: string): DeepDiveData[] {
    return this.getAllDeepDives().filter(dive => dive.actionId === actionId)
  }

  // Add a simulation-generated AI action that can be displayed on AI Actions page
  public addSimulationAIAction(action: SimulationAIAction): void {
    this.simulationAIActions.set(action.id, action)
  }

  // Get all simulation-generated AI actions
  public getAllSimulationAIActions(): SimulationAIAction[] {
    return Array.from(this.simulationAIActions.values())
  }

  // Get simulation AI action by ID
  public getSimulationAIAction(id: string): SimulationAIAction | undefined {
    return this.simulationAIActions.get(id)
  }

  // Remove deep dive
  public removeDeepDive(id: string): boolean {
    return this.deepDives.delete(id)
  }

  // Clear all deep dives
  public clearAll(): void {
    this.deepDives.clear()
  }

  // Generate mock detailed insights for dashboard/simulation cards
  public generateMockInsights(title: string, description: string, potentialSaving: number): DeepDiveData['detailed_insights'] {
    return {
      mechanics_explanation: `This ${title.toLowerCase()} recommendation is based on analysis of your spending patterns, account balances, and financial goals. The system identified this opportunity by comparing your current financial behavior against optimized patterns from similar demographic profiles.`,
      key_insights: [
        `Your current financial profile strongly supports this ${title.toLowerCase()} strategy`,
        `This action aligns perfectly with your demographic financial priorities and risk tolerance`,
        `The estimated $${potentialSaving}/month saving is conservative and achievable based on your spending patterns`,
        `Implementation requires minimal risk and can be automated with proper safeguards in place`
      ],
      scenario_nuances: `This recommendation assumes your current income stability and spending patterns continue. The analysis factors in your demographic profile and typical financial behavior patterns. Any major changes to your financial situation (job change, major expenses, etc.) may require strategy adjustment.`,
      decision_context: `This action is prioritized based on your current financial health, goals, and risk profile. The recommendation engine weighted factors including liquidity needs, investment timeline, and financial stability indicators. Monitor your progress and adjust if your priorities or circumstances change significantly.`
    }
  }

  // Create deep dive from simulation results
  public createSimulationDeepDive(
    simulationId: string,
    actionId: string,
    title: string,
    description: string,
    potentialSaving: number,
    simulationTag?: string
  ): DeepDiveData {
    const deepDive: DeepDiveData = {
      id: `deep-dive-${simulationId}-${Date.now()}`,
      source: 'simulation',
      actionId,
      title,
      description,
      potentialSaving,
      detailed_insights: this.generateMockInsights(title, description, potentialSaving),
      createdAt: new Date().toISOString(),
      simulationTag
    }

    // Also create a corresponding AI action that can be displayed on AI Actions page
    const simulationAIAction: SimulationAIAction = {
      id: actionId,
      title,
      description,
      rationale: description,
      type: 'optimization',
      potentialSaving,
      steps: [
        `Analyze ${title.toLowerCase()} opportunity`,
        'Implement optimization strategy',
        'Monitor results and adjust'
      ],
      status: 'suggested',
      simulationTag,
      detailed_insights: deepDive.detailed_insights
    }

    this.saveDeepDive(deepDive)
    this.addSimulationAIAction(simulationAIAction)
    return deepDive
  }

  // Create deep dive from dashboard action
  public createDashboardDeepDive(
    actionId: string,
    title: string,
    description: string,
    potentialSaving: number
  ): DeepDiveData {
    const deepDive: DeepDiveData = {
      id: `deep-dive-dashboard-${actionId}-${Date.now()}`,
      source: 'dashboard',
      actionId,
      title,
      description,
      potentialSaving,
      detailed_insights: this.generateMockInsights(title, description, potentialSaving),
      createdAt: new Date().toISOString()
    }

    this.saveDeepDive(deepDive)
    return deepDive
  }
}

export const deepDiveService = DeepDiveService.getInstance()