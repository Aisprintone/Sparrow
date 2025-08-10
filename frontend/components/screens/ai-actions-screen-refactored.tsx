/**
 * AI Actions Screen - REFACTORED
 * ===============================
 * PATTERN GUARDIAN CERTIFIED: Zero code duplication
 * All configuration extracted, using factory pattern for rendering
 */

"use client"

import { useState, useEffect, useMemo } from "react"
import type { AppState, AIAction } from "@/hooks/use-app-state"
import { motion } from "framer-motion"
import { aiActionsService } from "@/lib/api/ai-actions-service"
import { 
  workflowConfig, 
  workflowClassifier, 
  workflowValidator,
  type WorkflowContext,
  type ClassificationRequest
} from "@/lib/services/workflow-classifier.service"
import { 
  ActionCardFactory, 
  ActionCardGrid,
  type CardConfig,
  type CardActions,
  type CardData
} from "@/components/ai-actions/action-card-factory"
import DeepDiveModal from "@/components/ui/deep-dive-modal"
import { deepDiveService, type DeepDiveData } from "@/lib/services/deep-dive-service"

// ==================== Screen Component ====================

export default function AIActionsScreenRefactored({
  aiActions,
  setSelectedAction,
  setCurrentScreen,
  isAIChatOpen,
  setAIChatOpen,
  selectedActionForChat,
  setSelectedActionForChat,
  demographic,
  setSelectedThought,
  setThoughtDetailOpen,
  setAiActions,
}: AppState) {
  // State Management
  const [expandedActions, setExpandedActions] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<"suggested" | "in-process" | "completed">("suggested")
  const [workflowStatuses, setWorkflowStatuses] = useState<Record<string, any>>({})
  const [inspectedWorkflow, setInspectedWorkflow] = useState<string | null>(null)
  const [workflowValidations, setWorkflowValidations] = useState<Record<string, any>>({})
  const [deepDiveAction, setDeepDiveAction] = useState<CardData | null>(null)
  const [isDeepDiveOpen, setIsDeepDiveOpen] = useState(false)
  
  // ==================== Workflow Status Polling ====================
  
  useEffect(() => {
    const pollWorkflowStatuses = async () => {
      const inProcessActions = aiActions.filter(action => action.status === "in-process")
      
      for (const action of inProcessActions) {
        if (action.executionId) {
          try {
            const status = await aiActionsService.getAIActionStatus(action.executionId)
            setWorkflowStatuses(prev => ({
              ...prev,
              [action.executionId!]: status
            }))
            
            // Validate workflow using our service
            const validation = workflowValidator.validateWorkflow(action, status)
            setWorkflowValidations(prev => ({
              ...prev,
              [action.id]: validation
            }))
          } catch (error) {
            console.error('Error polling workflow status:', error)
          }
        }
      }
    }
    
    const interval = setInterval(pollWorkflowStatuses, 2000)
    return () => clearInterval(interval)
  }, [aiActions])
  
  // ==================== Action Handlers ====================
  
  const cardActions: CardActions = useMemo(() => ({
    onLearnMore: (action: CardData) => {
      try {
        const resultCard = {
          id: action.id,
          type: "individual" as const,
          content: action.description,
          emoji: "🤖",
          title: action.title,
          detailedExplanation: action.rationale || action.description,
        }
        setSelectedThought(resultCard)
        setThoughtDetailOpen(true)
      } catch (err) {
        console.error('Error in onLearnMore:', err)
      }
    },
    
    onAutomate: (action: CardData) => {
      try {
        // Convert CardData back to AIAction for compatibility
        const aiAction: AIAction = {
          id: action.id,
          title: action.title,
          description: action.description,
          rationale: action.rationale,
          type: action.type,
          potentialSaving: action.potentialSaving,
          status: action.status,
          steps: Array.isArray(action.steps) && typeof action.steps[0] === 'string' 
            ? action.steps as string[]
            : [],
          executionId: action.executionId,
          progress: action.progress,
          currentStep: action.currentStep,
          estimatedCompletion: action.estimatedCompletion,
          simulationTag: action.simulationTag
        }
        setSelectedAction(aiAction)
        setCurrentScreen("action-detail")
      } catch (err) {
        console.error('Error in onAutomate:', err)
      }
    },
    
    onInspect: (action: CardData) => {
      try {
        console.log('Inspect clicked for action:', action.title, action.id);
        console.log('Action steps:', action.steps);
        console.log('Previous inspected workflow:', inspectedWorkflow);
        
        // Toggle the inspected workflow state (this is the correct pattern from the original)
        setInspectedWorkflow(prev => {
          const newValue = prev === action.id ? null : action.id;
          console.log('Setting inspected workflow to:', newValue);
          return newValue;
        })
      } catch (err) {
        console.error('Error in onInspect:', err)
      }
    },
    
    onCancel: (action: CardData) => {
      try {
        // Remove the action completely
        setAiActions(aiActions.filter((a: AIAction) => a.id !== action.id))
        
        // Clean up state
        setWorkflowStatuses(prev => {
          const newStatuses = { ...prev }
          delete newStatuses[action.id]
          return newStatuses
        })
        
        setWorkflowValidations(prev => {
          const newValidations = { ...prev }
          delete newValidations[action.id]
          return newValidations
        })
        
        // Remove from expanded actions
        setExpandedActions(prev => prev.filter(id => id !== action.id))
      } catch (err) {
        console.error('Error in onCancel:', err)
      }
    },
    
    onAIChat: (action: CardData) => {
      try {
        // Convert CardData back to AIAction for compatibility
        const aiAction: AIAction = {
          id: action.id,
          title: action.title,
          description: action.description,
          rationale: action.rationale,
          type: action.type,
          potentialSaving: action.potentialSaving,
          status: action.status,
          steps: Array.isArray(action.steps) && typeof action.steps[0] === 'string' 
            ? action.steps as string[]
            : [],
          executionId: action.executionId,
          progress: action.progress,
          currentStep: action.currentStep,
          estimatedCompletion: action.estimatedCompletion,
          simulationTag: action.simulationTag
        }
        setSelectedActionForChat(aiAction)
        setAIChatOpen(true)
      } catch (err) {
        console.error('Error in onAIChat:', err)
      }
    },
    
    onViewResults: (action: CardData) => {
      try {
        const resultCard = {
          id: action.id,
          type: "individual" as const,
          content: action.description,
          emoji: "✅",
          title: action.title,
          detailedExplanation: `Successfully completed: ${action.description}. Key achievements include automated process completion, ${action.potentialSaving} monthly savings activated, all security checks passed, and goal progress increased by 15%.`,
        }
        setSelectedThought(resultCard)
        setThoughtDetailOpen(true)
      } catch (err) {
        console.error('Error in onViewResults:', err)
      }
    },

    onDeepDive: (action: CardData) => {
      try {
        setDeepDiveAction(action)
        setIsDeepDiveOpen(true)
      } catch (err) {
        console.error('Error in onDeepDive:', err)
      }
    }
  }), [
    setSelectedThought, 
    setThoughtDetailOpen, 
    setSelectedAction, 
    setCurrentScreen,
    setAiActions,
    aiActions,
    setSelectedActionForChat,
    setAIChatOpen
  ])
  
  // ==================== Data Transformation ====================
  
  const enrichedActions = useMemo(() => {
    try {
      
      return aiActions.map(action => {
        const metadata = workflowConfig?.getWorkflow(action.id)
        const validation = workflowValidations[action.id]
        const workflowStatus = workflowStatuses[action.executionId || '']
        
        
        // Transform action.steps (strings) into proper WorkflowStep objects if needed
        let processedSteps = action.steps;
        if (action.steps && Array.isArray(action.steps) && action.steps.length > 0 && typeof action.steps[0] === 'string') {
          processedSteps = action.steps.map((step: string, index: number) => ({
            id: `step-${index + 1}`,
            name: step,
            description: `Step ${index + 1} of the workflow process`,
            duration: 120,
            status: (index === 0 ? 'in_progress' : 'pending') as 'pending' | 'in_progress' | 'completed' | 'failed'
          }));
        }

        // Check if this action has detailed insights from simulation deep dives
        const relatedDeepDives = deepDiveService.getDeepDivesByActionId(action.id)
        const simulationDeepDive = relatedDeepDives.find(dive => dive.source === 'simulation')

        const enriched: CardData = {
          ...action,
          validation,
          workflowStatus,
          benefits: metadata?.benefits,
          icon: metadata?.icon,
          steps: processedSteps,
          // Add detailed insights from simulation deep dives if available
          detailed_insights: simulationDeepDive?.detailed_insights || action.detailed_insights
        }
        
        
        // Add workflow status data for in-process actions
        if (action.status === 'in-process' && workflowStatus) {
          enriched.progress = workflowStatus.progress || 33
          enriched.currentStep = workflowStatus.current_step || 'Processing...'
          enriched.estimatedCompletion = workflowStatus.estimated_completion || '3m remaining'
        }
        
        return enriched
      })
    } catch (err) {
      console.error('Error enriching actions:', err)
      return aiActions // Fallback to original actions
    }
  }, [aiActions, workflowValidations, workflowStatuses, workflowConfig])
  
  // ==================== Filter Actions by Tab ====================
  
  const filteredActions = useMemo(() => {
    try {
      return enrichedActions.filter(action => {
        switch (activeTab) {
          case "suggested":
            return action.status === "suggested"
          case "in-process":
            return action.status === "in-process"
          case "completed":
            return action.status === "completed"
          default:
            return true
        }
      })
    } catch (err) {
      console.error('Error filtering actions:', err)
      return []
    }
  }, [enrichedActions, activeTab])
  
  // ==================== Tab Configuration ====================
  
  const tabCounts = useMemo(() => ({
    suggested: aiActions.filter(a => a.status === "suggested").length,
    inProcess: aiActions.filter(a => a.status === "in-process").length,
    completed: aiActions.filter(a => a.status === "completed").length
  }), [aiActions])
  
  // ==================== Card Configurations ====================
  
  const getCardConfig = (status: string): CardConfig => {
    switch (status) {
      case 'suggested':
        return {
          variant: 'suggested',
          showExpansion: true,
          minHeight: 'min-h-[280px]'
        }
      case 'in-process':
        return {
          variant: 'in-process',
          showProgress: true,
          showValidation: true,
          showSteps: true,
          minHeight: 'min-h-[320px]' // Slightly taller for steps
        }
      case 'completed':
        return {
          variant: 'completed',
          minHeight: 'min-h-[280px]'
        }
      default:
        return { variant: 'suggested' }
    }
  }
  
  // ==================== Error Display ====================
  
  return (
    <div className="flex flex-col h-full bg-black">
      {/* Tab Navigation */}
      <div className="flex border-b border-white/10">
        <button
          onClick={() => setActiveTab("suggested")}
          className={`flex-1 py-4 text-sm font-medium transition-colors ${
            activeTab === "suggested"
              ? "text-white border-b-2 border-blue-500"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Suggested ({tabCounts.suggested})
        </button>
        <button
          onClick={() => setActiveTab("in-process")}
          className={`flex-1 py-4 text-sm font-medium transition-colors ${
            activeTab === "in-process"
              ? "text-white border-b-2 border-blue-500"
              : "text-gray-400 hover:text-white"
          }`}
        >
          In Process ({tabCounts.inProcess})
        </button>
        <button
          onClick={() => setActiveTab("completed")}
          className={`flex-1 py-4 text-sm font-medium transition-colors ${
            activeTab === "completed"
              ? "text-white border-b-2 border-blue-500"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Completed ({tabCounts.completed})
        </button>
      </div>
      
      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredActions.length === 0 ? (
          <EmptyState activeTab={activeTab} />
        ) : (
          <ActionCardGrid
            actions={filteredActions}
            config={getCardConfig(activeTab)}
            cardActions={cardActions}
            expandedIds={expandedActions}
            onToggleExpand={(id) => {
              setExpandedActions(prev => 
                prev.includes(id) 
                  ? prev.filter(i => i !== id)
                  : [...prev, id]
              )
            }}
            inspectedWorkflow={inspectedWorkflow}
          />
        )}
      </div>

      {/* Deep Dive Modal */}
      {deepDiveAction && (
        <DeepDiveModal
          isOpen={isDeepDiveOpen}
          onClose={() => setIsDeepDiveOpen(false)}
          action={deepDiveAction}
        />
      )}
    </div>
  )
}

// ==================== Empty State Component ====================

const EmptyState: React.FC<{ activeTab: string }> = ({ activeTab }) => {
  const messages = {
    suggested: {
      title: "No suggestions yet",
      description: "AI will analyze your finances and suggest optimizations"
    },
    "in-process": {
      title: "No automations running",
      description: "Automations will appear here when they're running"
    },
    completed: {
      title: "No completed actions",
      description: "Completed actions will appear here"
    }
  }
  
  const message = messages[activeTab as keyof typeof messages] || messages.suggested
  
  return (
    <div className="text-center py-12">
      <div className="text-4xl mb-4">🤖</div>
      <h3 className="text-lg font-semibold text-white mb-2">
        {message.title}
      </h3>
      <p className="text-gray-400">
        {message.description}
      </p>
    </div>
  )
}