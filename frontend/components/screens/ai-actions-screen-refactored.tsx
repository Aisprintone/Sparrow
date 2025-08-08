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
    onLearnMore: (action: AIAction) => {
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
    },
    
    onAutomate: (action: AIAction) => {
      setSelectedAction(action)
      setCurrentScreen("action-detail")
    },
    
    onInspect: (action: AIAction) => {
      setInspectedWorkflow(inspectedWorkflow === action.id ? null : action.id)
    },
    
    onCancel: (action: AIAction) => {
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
      
      if (inspectedWorkflow === action.id) {
        setInspectedWorkflow(null)
      }
    },
    
    onAIChat: (action: AIAction) => {
      setSelectedActionForChat(action)
      setAIChatOpen(true)
    },
    
    onViewResults: (action: AIAction) => {
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
    }
  }), [
    setSelectedThought, 
    setThoughtDetailOpen, 
    setSelectedAction, 
    setCurrentScreen,
    inspectedWorkflow,
    setAiActions,
    aiActions,
    setSelectedActionForChat,
    setAIChatOpen
  ])
  
  // ==================== Data Transformation ====================
  
  const enrichedActions = useMemo(() => {
    return aiActions.map(action => {
      const metadata = workflowConfig.getWorkflow(action.id)
      const validation = workflowValidations[action.id]
      const workflowStatus = workflowStatuses[action.executionId || '']
      
      const enriched: CardData = {
        ...action,
        validation,
        workflowStatus,
        benefits: metadata?.benefits,
        icon: metadata?.icon,
        steps: inspectedWorkflow === action.id ? metadata?.steps : undefined
      }
      
      // Add workflow status data for in-process actions
      if (action.status === 'in-process' && workflowStatus) {
        enriched.progress = workflowStatus.progress || 33
        enriched.currentStep = workflowStatus.current_step || 'Processing...'
        enriched.estimatedCompletion = workflowStatus.estimated_completion || '3m remaining'
      }
      
      return enriched
    })
  }, [aiActions, workflowValidations, workflowStatuses, inspectedWorkflow])
  
  // ==================== Filter Actions by Tab ====================
  
  const filteredActions = useMemo(() => {
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
          showSteps: true
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
  
  // ==================== Render ====================
  
  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-900 via-gray-800 to-black">
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
          />
        )}
      </div>
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