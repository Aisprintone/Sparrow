/**
 * Simulation Integration Service
 * Ensures consistent simulation results across Goals and AI Actions screens
 * Handles the "Add" functionality to populate goals or automation screens
 */

import { Goal } from '@/lib/data'
import type { AIAction } from '@/hooks/use-app-state'
import { profileDataService, ProfileGoal, SimulationResult } from './profile-data-service'

export interface UnifiedSimulationResult {
  id: string
  type: 'aggressive' | 'on-track' | 'fall-off'
  title: string
  subtitle: string
  description: string
  impact: {
    monthly: number
    total: number
    percentage?: number
  }
  recommendations: string[]
  canAddToGoals: boolean
  canAddToAutomation: boolean
  sourceGoalId?: string
  sourceActionId?: string
}

export interface SimulationToGoalMapping {
  goalTitle: string
  goalDescription: string
  targetAmount: number
  targetDate: string
  monthlyContribution: number
  priority: 'high' | 'medium' | 'low'
  type: string
  icon: string
  color: string
}

export interface SimulationToActionMapping {
  actionTitle: string
  actionDescription: string
  potentialSaving: number
  category: string
  priority: 'high' | 'medium' | 'low'
  rationale: string
}

class SimulationIntegrationService {
  private static instance: SimulationIntegrationService

  static getInstance(): SimulationIntegrationService {
    if (!SimulationIntegrationService.instance) {
      SimulationIntegrationService.instance = new SimulationIntegrationService()
    }
    return SimulationIntegrationService.instance
  }

  /**
   * Run simulation for a goal and return unified results
   */
  async runGoalSimulation(
    profileId: number,
    goalId: string
  ): Promise<UnifiedSimulationResult[]> {
    const simResults = await profileDataService.runGoalSimulation(profileId, goalId)
    
    return simResults.map(result => this.transformToUnifiedResult(result, goalId))
  }

  /**
   * Run simulation for an AI action
   */
  async runActionSimulation(
    profileId: number,
    action: AIAction
  ): Promise<UnifiedSimulationResult[]> {
    // Generate simulation results based on action type
    const results: UnifiedSimulationResult[] = []
    
    // Aggressive scenario
    results.push({
      id: `${action.id}-aggressive`,
      type: 'aggressive',
      title: 'Maximum Impact',
      subtitle: 'Accelerate this optimization',
      description: `Double down on ${action.title} for maximum savings`,
      impact: {
        monthly: action.potentialSaving * 2,
        total: action.potentialSaving * 24,
        percentage: 200
      },
      recommendations: [
        `Implement ${action.title} immediately`,
        'Set up full automation for consistency',
        'Monitor weekly for first month',
        'Expand to similar opportunities'
      ],
      canAddToGoals: true,
      canAddToAutomation: true,
      sourceActionId: action.id
    })

    // On-track scenario
    results.push({
      id: `${action.id}-on-track`,
      type: 'on-track',
      title: 'Standard Implementation',
      subtitle: 'Follow recommended approach',
      description: action.description,
      impact: {
        monthly: action.potentialSaving,
        total: action.potentialSaving * 12,
        percentage: 100
      },
      recommendations: [
        'Follow the standard implementation plan',
        'Review monthly performance',
        'Adjust as needed based on results'
      ],
      canAddToGoals: false,
      canAddToAutomation: true,
      sourceActionId: action.id
    })

    // Conservative scenario
    results.push({
      id: `${action.id}-conservative`,
      type: 'fall-off',
      title: 'Minimal Approach',
      subtitle: 'Start small and scale',
      description: `Test ${action.title} with minimal commitment`,
      impact: {
        monthly: action.potentialSaving * 0.5,
        total: action.potentialSaving * 6,
        percentage: 50
      },
      recommendations: [
        'Start with a trial period',
        'Measure impact before full commitment',
        'Scale up if successful'
      ],
      canAddToGoals: false,
      canAddToAutomation: true,
      sourceActionId: action.id
    })

    return results
  }

  /**
   * Transform simulation result to unified format
   */
  private transformToUnifiedResult(
    result: SimulationResult,
    sourceId: string
  ): UnifiedSimulationResult {
    const type = result.scenarioType === 'aggressive' ? 'aggressive' :
                 result.scenarioType === 'on-track' ? 'on-track' : 'fall-off'
    
    return {
      id: `${sourceId}-${type}`,
      type,
      title: result.title,
      subtitle: result.description,
      description: result.impactDescription,
      impact: {
        monthly: result.monthlyChange || 0,
        total: result.totalImpact || 0,
        percentage: type === 'aggressive' ? 150 : type === 'on-track' ? 100 : 50
      },
      recommendations: result.recommendations,
      canAddToGoals: type === 'aggressive',
      canAddToAutomation: true,
      sourceGoalId: sourceId
    }
  }

  /**
   * Convert simulation result to goal format for adding to goals screen
   */
  convertSimulationToGoal(result: UnifiedSimulationResult): SimulationToGoalMapping {
    const targetDate = new Date()
    targetDate.setMonth(targetDate.getMonth() + 12) // Default 1 year target
    
    return {
      goalTitle: `${result.title} - Simulation Target`,
      goalDescription: result.description,
      targetAmount: Math.abs(result.impact.total),
      targetDate: targetDate.toISOString().split('T')[0],
      monthlyContribution: Math.abs(result.impact.monthly),
      priority: result.type === 'aggressive' ? 'high' : 'medium',
      type: 'financial',
      icon: 'Target',
      color: result.type === 'aggressive' ? 'red' : 'blue'
    }
  }

  /**
   * Convert simulation result to action format for automation screen
   */
  convertSimulationToAction(result: UnifiedSimulationResult): SimulationToActionMapping {
    return {
      actionTitle: result.title,
      actionDescription: result.description,
      potentialSaving: Math.abs(result.impact.monthly),
      category: 'optimization',
      priority: result.type === 'aggressive' ? 'high' : 'medium',
      rationale: result.recommendations.join(' ')
    }
  }

  /**
   * Handle adding simulation result to goals
   */
  async addSimulationToGoals(
    result: UnifiedSimulationResult,
    addGoal: (goal: Goal) => void
  ): Promise<boolean> {
    if (!result.canAddToGoals) {
      console.warn('This simulation result cannot be added to goals')
      return false
    }

    const goalMapping = this.convertSimulationToGoal(result)
    
    const newGoal: Goal = {
      id: `sim-${Date.now()}`,
      title: goalMapping.goalTitle,
      description: goalMapping.goalDescription,
      target: goalMapping.targetAmount,
      current: 0,
      deadline: goalMapping.targetDate,
      priority: goalMapping.priority,
      type: goalMapping.type,
      icon: goalMapping.icon,
      color: goalMapping.color,
      monthlyContribution: goalMapping.monthlyContribution,
      simulationTags: result.sourceGoalId ? [`goal-${result.sourceGoalId}`] : 
                      result.sourceActionId ? [`action-${result.sourceActionId}`] : []
    }

    addGoal(newGoal)
    return true
  }

  /**
   * Handle adding simulation result to automation
   */
  async addSimulationToAutomation(
    result: UnifiedSimulationResult,
    setAiActions: (actions: AIAction[]) => void,
    currentActions: AIAction[]
  ): Promise<boolean> {
    if (!result.canAddToAutomation) {
      console.warn('This simulation result cannot be added to automation')
      return false
    }

    const actionMapping = this.convertSimulationToAction(result)
    
    const newAction: AIAction = {
      id: `sim-action-${Date.now()}`,
      title: actionMapping.actionTitle,
      description: actionMapping.actionDescription,
      potentialSaving: actionMapping.potentialSaving,
      status: 'suggested',
      priority: actionMapping.priority,
      category: actionMapping.category,
      rationale: actionMapping.rationale
    }

    setAiActions([...currentActions, newAction])
    return true
  }

  /**
   * Check if a simulation result can be added to a specific screen
   */
  canAddToScreen(result: UnifiedSimulationResult, screen: 'goals' | 'automation'): boolean {
    if (screen === 'goals') {
      return result.canAddToGoals
    }
    return result.canAddToAutomation
  }

  /**
   * Get recommended destination screen for a simulation result
   */
  getRecommendedDestination(result: UnifiedSimulationResult): 'goals' | 'automation' {
    // Aggressive scenarios typically go to goals
    if (result.type === 'aggressive' && result.canAddToGoals) {
      return 'goals'
    }
    // Everything else goes to automation
    return 'automation'
  }
}

export const simulationIntegrationService = SimulationIntegrationService.getInstance()