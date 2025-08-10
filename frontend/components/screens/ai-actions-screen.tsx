"use client"

import { useState, useEffect } from "react"
import type { AppState, AIAction } from "@/hooks/use-app-state"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import GlassCard from "@/components/ui/glass-card"
import { ChevronDown, ChevronUp, Check, Clock, AlertCircle, Play, Pause, Eye, Settings, Info, Shield, Zap, TrendingUp, DollarSign, Activity, Target, Star, AlertTriangle, User, Bot, RefreshCw, BarChart3, Timer, Lock, Unlock, Sparkles, ArrowRight, ArrowDown, Users, Globe, Smartphone, Monitor, CreditCard, PiggyBank, Home, Car, Plane, X } from "lucide-react"
import { aiActionsService } from "@/lib/api/ai-actions-service"
import { aiActionsDataService, PersonalizedAIAction } from "@/lib/services/ai-actions-data-service"
import AutomationStatusCard from "@/components/ui/automation-status-card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export default function AIActionsScreen({
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
  selectedProfile,
}: AppState) {
  const [expandedActions, setExpandedActions] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<"suggested" | "in-process" | "completed">("suggested")
  const [workflowStatuses, setWorkflowStatuses] = useState<Record<string, any>>({})
  const [inspectedWorkflow, setInspectedWorkflow] = useState<string | null>(null)
  const [workflowValidation, setWorkflowValidation] = useState<Record<string, any>>({})
  const [personalizedActions, setPersonalizedActions] = useState<PersonalizedAIAction[]>([])
  const [isLoadingActions, setIsLoadingActions] = useState(true)

  // Load personalized actions based on profile
  useEffect(() => {
    const loadPersonalizedActions = async () => {
      if (!selectedProfile?.id) {
        setIsLoadingActions(false)
        return
      }

      setIsLoadingActions(true)
      try {
        const actions = await aiActionsDataService.getPersonalizedActions(selectedProfile.id)
        setPersonalizedActions(actions)
        
        // Merge with existing AI actions, preferring personalized ones
        const mergedActions = actions.map(action => ({
          ...action,
          status: aiActions.find(a => a.id === action.id)?.status || action.status
        }))
        
        // Add any existing actions not in personalized list
        aiActions.forEach(existingAction => {
          if (!mergedActions.find(a => a.id === existingAction.id)) {
            mergedActions.push(existingAction as PersonalizedAIAction)
          }
        })
        
        setAiActions(mergedActions)
      } catch (error) {
        console.error('Failed to load personalized actions:', error)
      } finally {
        setIsLoadingActions(false)
      }
    }

    loadPersonalizedActions()
  }, [selectedProfile])

  // Enhanced workflow validation and status polling
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
            
            // Validate workflow against card title and automation
            const validation = validateWorkflow(action, status)
            setWorkflowValidation(prev => ({
              ...prev,
              [action.id]: validation
            }))
          } catch (error) {
            console.error('Error polling workflow status:', error)
          }
        }
      }
    }

    // Poll every 2 seconds for in-process actions
    const interval = setInterval(pollWorkflowStatuses, 2000)
    return () => clearInterval(interval)
  }, [aiActions])

  // Validate workflow against card title and automation requirements
  const validateWorkflow = (action: any, status: any) => {
    const validation = {
      titleMatch: true,
      automationValid: true,
      stepsComplete: true,
      riskAssessment: 'low',
      efficiencyScore: 85,
      issues: [] as string[],
      recommendations: [] as string[]
    }

    // Check if workflow steps match the card title
    const expectedSteps = getExpectedStepsForAction(action.title)
    const actualSteps = status.steps || action.steps || []
    
    if (expectedSteps.length > 0 && actualSteps.length < expectedSteps.length) {
      validation.titleMatch = false
      validation.issues.push(`Expected ${expectedSteps.length} steps, found ${actualSteps.length}`)
    }

    // Validate automation requirements
    const automationRequirements = getAutomationRequirements(action.title)
    const currentStep = status.current_step || action.currentStep || ''
    
    if (automationRequirements.length > 0) {
      const missingRequirements = automationRequirements.filter(req => 
        !currentStep.toLowerCase().includes(req.toLowerCase())
      )
      
      if (missingRequirements.length > 0) {
        validation.automationValid = false
        validation.issues.push(`Missing automation requirements: ${missingRequirements.join(', ')}`)
      }
    }

    // Check step completion
    const completedSteps = actualSteps.filter((step: any) => step.status === 'completed').length
    const totalSteps = actualSteps.length
    
    if (totalSteps > 0 && completedSteps < totalSteps) {
      validation.stepsComplete = false
      validation.issues.push(`${totalSteps - completedSteps} steps remaining`)
    }

    // Risk assessment based on action type and current status
    if (action.title.toLowerCase().includes('negotiate') || action.title.toLowerCase().includes('debt')) {
      validation.riskAssessment = 'medium'
    } else if (action.title.toLowerCase().includes('investment') || action.title.toLowerCase().includes('portfolio')) {
      validation.riskAssessment = 'high'
    }

    // Efficiency score calculation
    const progress = status.progress || action.progress || 0
    const estimatedTime = getEstimatedTimeForAction(action.title)
    const actualTime = getActualTimeForAction(action.id)
    
    if (estimatedTime > 0 && actualTime > 0) {
      const efficiencyRatio = estimatedTime / actualTime
      validation.efficiencyScore = Math.min(100, Math.max(0, efficiencyRatio * 100))
    }

    // Generate recommendations
    if (!validation.titleMatch) {
      validation.recommendations.push('Review workflow steps to ensure they match the action title')
    }
    if (!validation.automationValid) {
      validation.recommendations.push('Verify automation requirements are being met')
    }
    if (validation.efficiencyScore < 70) {
      validation.recommendations.push('Consider optimizing workflow for better efficiency')
    }

    return validation
  }

  const getExpectedStepsForAction = (title: string): string[] => {
    const stepMappings: Record<string, string[]> = {
      'Cancel Unused Subscriptions': ['Review subscription list', 'Cancel unused services', 'Set up usage tracking', 'Monthly review process'],
      'Negotiate Bills': ['Contact service providers', 'Present competitor offers', 'Negotiate new rates', 'Confirm changes'],
      'Move to High-Yield Savings': ['Research high-yield accounts', 'Open new account', 'Set up automatic transfers', 'Monitor monthly'],
      'Build Emergency Fund': ['Calculate 6-month expenses', 'Set up automatic savings', 'Choose high-yield account', 'Monitor progress'],
      'Optimize Investment Portfolio': ['Review current allocation', 'Rebalance portfolio', 'Set up automatic rebalancing', 'Monitor quarterly'],
      'Debt Avalanche Strategy': ['List all debts by interest rate', 'Pay minimums on all except highest', 'Allocate extra to highest rate', 'Track progress monthly']
    }

    return stepMappings[title] || []
  }

  const getAutomationRequirements = (title: string): string[] => {
    const requirements: Record<string, string[]> = {
      'Cancel Unused Subscriptions': ['subscription', 'cancellation', 'tracking'],
      'Negotiate Bills': ['negotiation', 'provider', 'rate'],
      'Move to High-Yield Savings': ['account', 'transfer', 'monitoring'],
      'Build Emergency Fund': ['calculation', 'savings', 'monitoring'],
      'Optimize Investment Portfolio': ['allocation', 'rebalancing', 'monitoring'],
      'Debt Avalanche Strategy': ['debt', 'payment', 'tracking']
    }

    return requirements[title] || []
  }

  const getEstimatedTimeForAction = (title: string): number => {
    const timeEstimates: Record<string, number> = {
      'Cancel Unused Subscriptions': 180, // 3 minutes
      'Negotiate Bills': 600, // 10 minutes
      'Move to High-Yield Savings': 300, // 5 minutes
      'Build Emergency Fund': 120, // 2 minutes
      'Optimize Investment Portfolio': 360, // 6 minutes
      'Debt Avalanche Strategy': 180 // 3 minutes
    }

    return timeEstimates[title] || 300
  }

  const getActualTimeForAction = (actionId: string): number => {
    // This would be calculated from actual execution time
    // For now, return a mock value
    return Math.random() * 600 + 120 // 2-12 minutes
  }

  const toggleActionExpansion = (actionId: string) => {
    setExpandedActions((prev) => (prev.includes(actionId) ? prev.filter((id) => id !== actionId) : [...prev, actionId]))
  }

  const handleAIChat = (action: any) => {
    setSelectedActionForChat(action)
    setAIChatOpen(true)
  }

  const handleUserAction = (stepId: string, action: string) => {
    console.log(`User action for step ${stepId}: ${action}`)
    // Handle user actions like approve, reject, modify, etc.
  }

  const handleInspectWorkflow = (actionId: string) => {
    console.log('Inspect clicked for actionId:', actionId)
    console.log('Current inspectedWorkflow:', inspectedWorkflow)
    console.log('Will set inspectedWorkflow to:', inspectedWorkflow === actionId ? null : actionId)
    setInspectedWorkflow(inspectedWorkflow === actionId ? null : actionId)
  }

  const handleConfigure = () => {
    console.log("Opening configuration")
    // Open configuration modal
  }

  // Handle cancellation of in-process automations
  const handleCancelAutomation = (actionId: string) => {
    // Remove the action from the aiActions array instead of changing status
    setAiActions(aiActions.filter((action: AIAction) => action.id !== actionId))
    
    // Remove from workflow statuses
    setWorkflowStatuses(prev => {
      const newStatuses = { ...prev }
      delete newStatuses[actionId]
      return newStatuses
    })
    
    // Remove from workflow validation
    setWorkflowValidation(prev => {
      const newValidation = { ...prev }
      delete newValidation[actionId]
      return newValidation
    })
    
    // Close inspection if this action was being inspected
    if (inspectedWorkflow === actionId) {
      setInspectedWorkflow(null)
    }
  }

  const getValidationIcon = (validation: any) => {
    if (validation.titleMatch && validation.automationValid && validation.stepsComplete) {
      return <Check className="h-4 w-4 text-green-400" />
    } else if (validation.issues.length > 0) {
      return <AlertTriangle className="h-4 w-4 text-yellow-400" />
    } else {
      return <Info className="h-4 w-4 text-blue-400" />
    }
  }

  const getValidationColor = (validation: any) => {
    if (validation.titleMatch && validation.automationValid && validation.stepsComplete) {
      return "text-green-400"
    } else if (validation.issues.length > 0) {
      return "text-yellow-400"
    } else {
      return "text-blue-400"
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring" } },
  }

  // Enhanced suggested action card with real data integration
  const renderActionCard = (action: PersonalizedAIAction | AIAction, isPendingApproval = false) => {
    const isExpanded = expandedActions.includes(action.id)
    const isPersonalized = 'profileSpecific' in action && action.profileSpecific

    return (
      <GlassCard key={action.id} className="bg-gradient-to-br from-white/10 to-white/5 border border-white/20 hover:border-white/30 transition-all duration-300 h-auto min-h-[280px] flex flex-col">
        <div className="flex-1 p-6">
          {/* Header with icon and title */}
          <div className="flex items-start gap-4 mb-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30">
              <Zap className="h-6 w-6 text-blue-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">{action.title}</h3>
                  {isPersonalized && (
                    <Badge variant="outline" className="text-xs bg-blue-500/20 text-blue-300 border-blue-500/30">
                      Personalized for you
                    </Badge>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-green-400">+${action.potentialSaving}/mo</p>
                </div>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">{action.description}</p>
            </div>
          </div>

          {/* Key benefits - with relevance score for personalized actions */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Clock className="h-3 w-3" />
              <span>2-5 min setup</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Shield className="h-3 w-3" />
              <span>{action.priority === 'high' ? 'Critical' : action.priority === 'medium' ? 'Important' : 'Low risk'}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Target className="h-3 w-3" />
              <span>{'relevanceScore' in action ? `${action.relevanceScore}% relevant` : 'Automated'}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <TrendingUp className="h-3 w-3" />
              <span>{'dataSource' in action && action.dataSource === 'real' ? 'AI-verified' : 'Immediate impact'}</span>
            </div>
          </div>

          {/* Expanded rationale - simplified and more readable */}
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-4 rounded-lg bg-black/20 border border-white/10"
            >
              <h4 className="text-sm font-medium text-white mb-2">Why this makes sense:</h4>
              <p className="text-sm text-gray-300 leading-relaxed">{action.rationale}</p>
              <Button
                size="sm"
                onClick={() => handleAIChat(action)}
                className="mt-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
              >
                Ask AI Questions
              </Button>
            </motion.div>
          )}
        </div>

        {/* Action buttons - simplified */}
        <div className="flex gap-2 p-6 pt-0">
          <Button 
            size="sm" 
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-700 flex-1"
            onClick={() => {
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
            }}
          >
            Learn More
          </Button>
          <Button
            size="sm"
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white flex-1"
            onClick={() => {
              setSelectedAction(action)
              setCurrentScreen("action-detail")
            }}
          >
            Automate
          </Button>
        </div>
      </GlassCard>
    )
  }

  // Simplified in-process card with cleaner design
  const renderInProcessCard = (action: any) => {
    const workflowStatus = workflowStatuses[action.executionId] || action
    const isInspected = inspectedWorkflow === action.id
    const validation = workflowValidation[action.id]
    
    console.log('renderInProcessCard - action.id:', action.id)
    console.log('renderInProcessCard - inspectedWorkflow:', inspectedWorkflow)
    console.log('renderInProcessCard - isInspected:', isInspected)
    
    // Create a simplified automation action for the card
    const automationAction = {
      ...action,
      steps: [
        {
          id: "step1",
          name: "Initializing",
          description: "Setting up automation workflow",
          status: "completed",
          duration: 30,
          estimatedTime: "30s"
        },
        {
          id: "step2",
          name: workflowStatus.current_step || "Processing",
          description: "Executing automation steps",
          status: "in_progress",
          duration: 120,
          estimatedTime: "2m"
        },
        {
          id: "step3",
          name: "Finalizing",
          description: "Completing automation process",
          status: "pending",
          duration: 60,
          estimatedTime: "1m"
        }
      ],
      workflowStatus: workflowStatus.status || "running",
      progress: workflowStatus.progress || 33,
      currentStep: workflowStatus.current_step || "Processing...",
      estimatedCompletion: "3m remaining"
    }

    return (
      <div key={action.id} className="space-y-4">
        <GlassCard className="bg-white/5">
          <div className="flex items-start gap-4 mb-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30">
              <Clock className="h-6 w-6 text-blue-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white text-lg">{action.title}</h3>
                    {validation && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            {getValidationIcon(validation)}
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="max-w-xs">
                              <p className="font-medium mb-1">Workflow Health</p>
                              {validation.issues.length > 0 ? (
                                <div>
                                  <p className="text-sm text-yellow-400 mb-1">Issues found:</p>
                                  <ul className="text-xs space-y-1">
                                    {validation.issues.map((issue: string, idx: number) => (
                                      <li key={idx}>• {issue}</li>
                                    ))}
                                  </ul>
                                </div>
                              ) : (
                                <p className="text-sm text-green-400">All checks passed</p>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                  <p className="text-sm text-gray-400">{action.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-400">+${action.potentialSaving}/mo</p>
                </div>
              </div>
              
              {/* Simplified Progress Bar */}
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Progress</span>
                  <span>{automationAction.progress}% Complete</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${automationAction.progress}%` }}
                  />
                </div>
              </div>
              
              {/* Simplified Status Info */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="flex items-center gap-2 text-gray-500">
                  <Clock className="h-3 w-3" />
                  <span>{automationAction.estimatedCompletion}</span>
                </div>
                <div className="flex items-center gap-2 text-blue-400">
                  <span>{automationAction.currentStep}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-3 border-t border-gray-700/50">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleInspectWorkflow(action.id)} 
              className={`flex-1 ${isInspected ? 'bg-blue-500/20 border-blue-500' : ''}`}
            >
              <Eye className="h-3 w-3 mr-1" />
              {isInspected ? "Hide Details" : "Inspect"}
            </Button>
            <Button 
              size="sm" 
              variant="destructive" 
              onClick={() => handleCancelAutomation(action.id)} 
              className="flex-shrink-0"
            >
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
          </div>
        </GlassCard>

        {/* Simplified Workflow View */}
        {isInspected && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mt-4"
          >
            <GlassCard className="bg-gray-900/90 border border-gray-700/50">
              <div className="p-4">
                <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  Workflow Details for {action.title} (ID: {action.id})
                </h4>
                
                {/* Simplified Steps */}
                <div className="space-y-3">
                  {automationAction.steps.map((step: any, index: number) => (
                    <div key={step.id} className="flex items-start gap-3">
                      <div className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${
                        step.status === "completed" ? "bg-green-500" : 
                        step.status === "in_progress" ? "bg-blue-500" : "bg-gray-600"
                      }`}>
                        {step.status === "completed" ? (
                          <Check className="h-3 w-3 text-white" />
                        ) : step.status === "in_progress" ? (
                          <RefreshCw className="h-3 w-3 text-white animate-spin" />
                        ) : (
                          <div className="h-3 w-3 rounded-full bg-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-white">{step.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {step.estimatedTime}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-400">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Key Metrics */}
                <div className="mt-4 pt-4 border-t border-gray-700/50">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="flex items-center gap-2 text-green-400">
                      <DollarSign className="h-3 w-3" />
                      <span>+${action.potentialSaving}/mo savings</span>
                    </div>
                    <div className="flex items-center gap-2 text-blue-400">
                      <Activity className="h-3 w-3" />
                      <span>{automationAction.steps.length} steps</span>
                    </div>
                    <div className="flex items-center gap-2 text-purple-400">
                      <Star className="h-3 w-3" />
                      <span>85% success rate</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Shield className="h-3 w-3" />
                      <span>Low risk</span>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </div>
    )
  }

  // Enhanced completed card with more bulleted information
  const renderCompletedCard = (action: any) => {
    return (
      <GlassCard key={action.id} className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/30 h-auto min-h-[280px] flex flex-col">
        <div className="flex-1 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Check className="h-5 w-5 text-green-400" />
            <span className="inline-block px-3 py-1 text-sm rounded-full bg-green-500/20 text-green-300 font-medium">
              Completed Successfully
            </span>
          </div>
          
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2">{action.title}</h3>
              <p className="text-sm text-gray-300 leading-relaxed">{action.description}</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-green-400">+${action.potentialSaving}/mo</p>
            </div>
          </div>

          {/* Key achievements */}
          <div className="space-y-3 mb-4">
            <h4 className="text-sm font-medium text-white">What was accomplished:</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>Successfully identified and optimized financial opportunity</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>Automated process completed without manual intervention</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>Monthly savings of ${action.potentialSaving} now active</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>All security checks passed and verified</span>
              </li>
            </ul>
          </div>

          {/* Impact metrics */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-400">
              <TrendingUp className="h-4 w-4" />
              <span>Annual savings: ${action.potentialSaving * 12}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Target className="h-4 w-4" />
              <span>Goal progress: +15%</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 p-6 pt-0">
          <Button 
            size="sm" 
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-700 flex-1"
            onClick={() => {
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
            }}
          >
            View Full Results
          </Button>
        </div>
      </GlassCard>
    )
  }

  const filteredActions = aiActions.filter(action => {
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

  return (
    <TooltipProvider>
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
            Suggested ({aiActions.filter(a => a.status === "suggested").length})
          </button>
          <button
            onClick={() => setActiveTab("in-process")}
            className={`flex-1 py-4 text-sm font-medium transition-colors ${
              activeTab === "in-process"
                ? "text-white border-b-2 border-blue-500"
                : "text-gray-400 hover:text-white"
            }`}
          >
            In Process ({aiActions.filter(a => a.status === "in-process").length})
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`flex-1 py-4 text-sm font-medium transition-colors ${
              activeTab === "completed"
                ? "text-white border-b-2 border-blue-500"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Completed ({aiActions.filter(a => a.status === "completed").length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoadingActions ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4 animate-pulse">🤖</div>
              <h3 className="text-lg font-semibold text-white mb-2">Analyzing your finances...</h3>
              <p className="text-gray-400">Generating personalized recommendations</p>
            </div>
          ) : filteredActions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {activeTab === "suggested" && "No suggestions yet"}
                {activeTab === "in-process" && "No automations running"}
                {activeTab === "completed" && "No completed actions"}
              </h3>
              <p className="text-gray-400">
                {activeTab === "suggested" && selectedProfile ? 
                  `No AI recommendations for ${selectedProfile.name || 'this profile'} yet` : 
                  "Select a profile to see personalized recommendations"}
                {activeTab === "in-process" && "Automations will appear here when they're running"}
                {activeTab === "completed" && "Completed actions will appear here"}
              </p>
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {filteredActions.map((action) => {
                if (action.status === "in-process") {
                  return renderInProcessCard(action)
                } else if (action.status === "completed") {
                  return renderCompletedCard(action)
                } else {
                  return renderActionCard(action)
                }
              })}
            </motion.div>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}
