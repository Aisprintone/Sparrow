"use client"

import { useEffect, useState } from "react"
import type { AppState } from "@/hooks/use-app-state"
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Shield, Target, Zap, BarChart3, CreditCard, PiggyBank, Lightbulb, Calculator, TrendingUpIcon, Play, CheckCircle, Loader2 } from "lucide-react"
import GlassCard from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { aiActionsService } from "@/lib/api/ai-actions-service"
import { simulationIntegrationService, UnifiedSimulationResult } from "@/lib/services/simulation-integration-service"
import DeepDiveButton from "@/components/ui/deep-dive-button"
import DeepDiveModal from "@/components/ui/deep-dive-modal"
import { useDeepDive } from "@/hooks/use-deep-dive"

interface SimulationResult {
  scenario_name: string
  description: string
  simulation_results: any
  ai_explanations: AIExplanation[]
  profile_data: any
  config: any
  original_simulation_id?: string
  timestamp: string
}

interface AIExplanation {
  title: string
  description: string
  potential_saving: number
  confidence: number
  category: string
  steps: string[]
  impact: 'high' | 'medium' | 'low'
  timeframe: string
  risk_level: string
  implementation_difficulty: 'easy' | 'medium' | 'hard'
}

export default function SimulationResultsScreen({ 
  setCurrentScreen, 
  simulationResults,
  saveAutomation,
  addGoal,
  demographic,
  aiActions,
  setAiActions,
  selectedProfile
}: AppState) {
  const [formattedResults, setFormattedResults] = useState<AIExplanation[]>([])
  const [loading, setLoading] = useState(true)
  const [automatingCards, setAutomatingCards] = useState<Set<string>>(new Set())
  const [automatedCards, setAutomatedCards] = useState<Set<string>>(new Set())
  const [goalCreatedCards, setGoalCreatedCards] = useState<Set<string>>(new Set())

  const {
    deepDiveAction,
    isDeepDiveOpen,
    openDeepDive,
    closeDeepDive,
    createAndOpenSimulationDeepDive
  } = useDeepDive()

  // Determine the single action type for each result (mutually exclusive)
  const getActionType = (result: AIExplanation): 'goal' | 'automate' => {
    const category = result.category.toLowerCase()
    const title = result.title.toLowerCase()
    
    // Goal categories: Long-term, high-value outcomes that benefit from conscious tracking
    const goalPriorityCategories = [
      'emergency', 'fund', 'debt', 'retirement', 'investment', 'home', 'education'
    ]
    
    // Automation categories: Quick optimizations that can be set-and-forget
    const automationPriorityCategories = [
      'tax', 'credit', 'subscription', 'bill', 'cashback', 'rewards'
    ]
    
    // Priority 1: Explicit automation categories
    if (automationPriorityCategories.some(keyword => 
        category.includes(keyword) || title.includes(keyword))) {
      return 'automate'
    }
    
    // Priority 2: High-value or long-term outcomes → Goals
    if (result.potential_saving >= 3000 || 
        result.timeframe.includes('year') ||
        goalPriorityCategories.some(keyword => 
          category.includes(keyword) || title.includes(keyword))) {
      return 'goal'
    }
    
    // Priority 3: Simple, quick wins → Automation  
    if (result.implementation_difficulty === 'easy' && 
        result.potential_saving < 2000) {
      return 'automate'
    }
    
    // Default: Goals for conscious decision-making
    return 'goal'
  }

  // Get appropriate goal type based on category
  const getGoalType = (result: AIExplanation): string => {
    const category = result.category.toLowerCase()
    const title = result.title.toLowerCase()
    
    if (category.includes('emergency') || title.includes('emergency')) return 'safety'
    if (category.includes('debt') || title.includes('debt')) return 'debt'
    if (category.includes('retirement') || title.includes('retirement')) return 'retirement'
    if (category.includes('investment') || category.includes('portfolio')) return 'investment'
    if (category.includes('home') || category.includes('mortgage')) return 'home'
    if (category.includes('education') || title.includes('education')) return 'education'
    if (category.includes('insurance') || title.includes('insurance')) return 'insurance'
    return 'other'
  }

  // Handle goal creation for a recommendation card using unified service
  const handleAddAsGoal = async (result: AIExplanation) => {
    const cardId = `${result.title}-${result.potential_saving}`
    
    // Prevent duplicate goal creation
    if (goalCreatedCards.has(cardId)) {
      return
    }
    
    // Create unified simulation result
    const unifiedResult: UnifiedSimulationResult = {
      id: cardId,
      type: result.impact === 'high' ? 'aggressive' : 'on-track',
      title: result.title,
      subtitle: result.category,
      description: result.description,
      impact: {
        monthly: Math.round(result.potential_saving / 12),
        total: result.potential_saving,
        percentage: Math.round(result.confidence * 100)
      },
      recommendations: result.steps || [],
      canAddToGoals: true,
      canAddToAutomation: false
    }
    
    // Use unified service
    const success = await simulationIntegrationService.addSimulationToGoals(unifiedResult, addGoal)
    if (success) {
      setGoalCreatedCards(prev => new Set(prev).add(cardId))
      console.log('Goal created via unified service:', result.title)
      return
    }
    
    const goalType = getGoalType(result)
    
    // Calculate a realistic deadline based on timeframe
    const calculateDeadline = (timeframe: string): string => {
      const now = new Date()
      if (timeframe.includes('year')) {
        now.setFullYear(now.getFullYear() + 1)
      } else if (timeframe.includes('month')) {
        const months = parseInt(timeframe) || 12
        now.setMonth(now.getMonth() + months)
      } else {
        now.setMonth(now.getMonth() + 6) // Default 6 months
      }
      return now.toISOString().split('T')[0]
    }
    
    // Get appropriate icon and color based on goal type
    const getGoalDisplay = (type: string) => {
      switch (type) {
        case 'safety': return { icon: '🛡️', color: 'bg-green-500' }
        case 'debt': return { icon: '💳', color: 'bg-red-500' }
        case 'retirement': return { icon: '🏖️', color: 'bg-blue-500' }
        case 'investment': return { icon: '📈', color: 'bg-purple-500' }
        case 'home': return { icon: '🏠', color: 'bg-orange-500' }
        case 'education': return { icon: '🎓', color: 'bg-indigo-500' }
        case 'insurance': return { icon: '☂️', color: 'bg-cyan-500' }
        default: return { icon: '🎯', color: 'bg-gray-500' }
      }
    }
    
    const display = getGoalDisplay(goalType)
    
    const goalData = {
      title: result.title,
      type: goalType as "safety" | "home" | "experience" | "retirement" | "debt" | "investment" | "education" | "business",
      target: result.potential_saving,
      current: 0, // Fixed: use 'current' not 'currentAmount'
      deadline: calculateDeadline(result.timeframe),
      icon: display.icon,
      color: display.color,
      monthlyContribution: Math.round(result.potential_saving / 12),
      milestones: [
        { name: '25% Complete', target: Math.round(result.potential_saving * 0.25) },
        { name: '50% Complete', target: Math.round(result.potential_saving * 0.50) },
        { name: '75% Complete', target: Math.round(result.potential_saving * 0.75) },
        { name: 'Goal Complete', target: result.potential_saving }
      ],
      priority: (result.impact === 'high' ? 'high' : result.impact === 'medium' ? 'medium' : 'low') as "high" | "medium" | "low",
      status: 'active' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: 1,
      aiInsights: {
        lastUpdated: new Date().toISOString(),
        recommendations: result.steps,
        riskAssessment: result.risk_level,
        optimizationOpportunities: [`Confidence: ${Math.round(result.confidence * 100)}%`]
      },
      simulationImpact: []
    }
    
    // Add goal to app state
    addGoal(goalData)
    
    // Mark this card as having goal created (for UI state)
    setGoalCreatedCards(prev => new Set(prev).add(cardId))
    
    console.log('Goal created successfully:', goalData.title)
  }

  // Handle one-click automation for a recommendation card using unified service
  const handleAutomateCard = async (result: AIExplanation) => {
    const cardId = `${result.title}-${result.potential_saving}`
    
    if (automatingCards.has(cardId) || automatedCards.has(cardId)) {
      return
    }
    
    // Create unified simulation result
    const unifiedResult: UnifiedSimulationResult = {
      id: cardId,
      type: result.implementation_difficulty === 'easy' ? 'on-track' : 'aggressive',
      title: result.title,
      subtitle: result.category,
      description: result.description,
      impact: {
        monthly: result.potential_saving,
        total: result.potential_saving * 12,
        percentage: Math.round(result.confidence * 100)
      },
      recommendations: result.steps || [],
      canAddToGoals: false,
      canAddToAutomation: true
    }
    
    // Use unified service first
    const success = await simulationIntegrationService.addSimulationToAutomation(
      unifiedResult,
      setAiActions,
      aiActions
    )
    
    if (success) {
      setAutomatedCards(prev => new Set(prev).add(cardId))
      console.log('Automation added via unified service:', result.title)
    }

    setAutomatingCards(prev => new Set(prev).add(cardId))

    try {
      // Create automation action from the recommendation
      const automationAction = {
        title: result.title,
        description: result.description,
        steps: result.steps.map((step, index) => ({
          id: `step-${index}`,
          name: `Step ${index + 1}`,
          description: step,
          status: "pending" as const,
          duration: 30,
          estimatedTime: "30s",
          agentType: "automated" as const
        })),
        potentialSaving: result.potential_saving,
        type: "optimization" as const,
        rationale: result.description,
        status: "suggested" as const,
        progress: 0,
        workflowStatus: "running" as const,
        currentStep: "Initializing...",
        estimatedCompletion: new Date(Date.now() + 120000).toISOString(),
        executionId: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        scenario: simulationResults?.scenario_name || "Simulation",
        profile: demographic,
        impact: {
          immediateSavings: result.potential_saving,
          annualProjection: result.potential_saving * 12,
          riskReduction: 0,
          goalProgress: 0,
          timeToComplete: result.timeframe
        },
        metadata: {
          category: "optimize" as const,
          difficulty: result.implementation_difficulty,
          confidence: Math.round(result.confidence * 100),
          dependencies: [],
          prerequisites: []
        }
      }

      // Start the automation workflow
      const workflowResult = await aiActionsService.startAIAction(
        automationAction.executionId,
        "demo-user",
        { demographic }
      )

      console.log('Automation started for card:', automationAction.title, workflowResult)

      // Save the automation to the app state
      saveAutomation(automationAction)
      
      // Mark as automated
      setAutomatedCards(prev => new Set(prev).add(cardId))

      console.log('Automation started successfully:', automationAction.title)

    } catch (error) {
      console.error('Failed to start automation for card:', result.title, error)
    } finally {
      setAutomatingCards(prev => {
        const newSet = new Set(prev)
        newSet.delete(cardId)
        return newSet
      })
    }
  }

  useEffect(() => {
    console.log('[SIMULATION RESULTS] 🚀 Screen loaded')
    console.log('[SIMULATION RESULTS] Simulation result available:', !!simulationResults)
    console.log('[SIMULATION RESULTS] Full simulationResults object:', simulationResults)
    
    if (simulationResults) {
      console.log('[SIMULATION RESULTS] 📊 Processing simulation data')
      console.log('[SIMULATION RESULTS] simulationResults keys:', Object.keys(simulationResults))
      console.log('[SIMULATION RESULTS] AI explanations:', simulationResults.ai_explanations)
      console.log('[SIMULATION RESULTS] AI explanations count:', simulationResults.ai_explanations?.length || 0)
      
      const processResults = async () => {
        try {
          // Format AI explanations for display
          const explanations = simulationResults.ai_explanations || []
          console.log('[SIMULATION RESULTS] 🔄 Formatting AI explanations', explanations)
          
          const formatted = explanations.map((explanation: any, index: number) => {
            // Handle both potential_saving formats (number or string like "$1,200")
            // Backend returns camelCase fields
            let savingAmount = 0
            
            // Check both camelCase and snake_case field names
            if (typeof explanation.potential_saving === 'number') {
              savingAmount = explanation.potential_saving
            } else if (typeof explanation.potential_saving === 'string') {
              savingAmount = parseFloat(explanation.potential_saving.replace(/[$,]/g, '')) || 0
            } else if (typeof explanation.potentialSaving === 'number') {
              savingAmount = explanation.potentialSaving
            } else if (typeof explanation.potentialSaving === 'string') {
              // Remove $ and commas, then parse
              savingAmount = parseFloat(explanation.potentialSaving.replace(/[$,]/g, '')) || 0
            }
            
            // Extract detailed insights if available
            const detailedInsights = explanation.detailed_insights || explanation.detailedInsights || {}
            
            return {
              title: explanation.title || `Financial Insight ${index + 1}`,
              description: explanation.description || explanation.rationale || 'No description available',
              potential_saving: savingAmount,
              confidence: explanation.confidence || 0.85,
              category: explanation.tag || explanation.category || 'Optimization',
              steps: explanation.steps || [],
              impact: detailedInsights.impact || explanation.impact || 'high',
              timeframe: detailedInsights.timeframe || explanation.timeframe || '3-6 months',
              risk_level: detailedInsights.risk_level || explanation.risk_level || 'low',
              implementation_difficulty: detailedInsights.implementation_difficulty || explanation.implementation_difficulty || 'easy',
              tagColor: explanation.tagColor || 'bg-blue-500/20 text-blue-300'
            }
          })
          
          console.log('[SIMULATION RESULTS] ✅ AI explanations formatted successfully')
          console.log('[SIMULATION RESULTS] Formatted explanations count:', formatted.length)
          
          setFormattedResults(formatted)
          setLoading(false)
          
          console.log('[SIMULATION RESULTS] 📊 Setting formatted results:', formatted)
        } catch (error) {
          console.error('[SIMULATION RESULTS] ❌ Error processing results:', error)
          setLoading(false)
        }
      }
      
      processResults()
    } else {
      console.log('[SIMULATION RESULTS] ⚠️ No simulation result available')
      console.log('[SIMULATION RESULTS] 🔄 Attempting to recover from localStorage or session')
      
      // DRY Principle: Try to recover data from different sources
      const tryRecoverSimulationData = () => {
        // Try localStorage
        const stored = localStorage.getItem('lastSimulationResult')
        if (stored) {
          try {
            const parsed = JSON.parse(stored)
            console.log('[SIMULATION RESULTS] ✅ Recovered from localStorage')
            return parsed
          } catch (e) {
            console.error('[SIMULATION RESULTS] Failed to parse stored data:', e)
          }
        }
        return null
      }
      
      const recovered = tryRecoverSimulationData()
      if (recovered && recovered.ai_explanations) {
        const processRecovered = async () => {
          const explanations = recovered.ai_explanations
          const formatted = explanations.map((explanation: any, index: number) => {
            let savingAmount = 0
            // Check both camelCase and snake_case field names
            if (typeof explanation.potential_saving === 'number') {
              savingAmount = explanation.potential_saving
            } else if (typeof explanation.potential_saving === 'string') {
              savingAmount = parseFloat(explanation.potential_saving.replace(/[$,]/g, '')) || 0
            } else if (typeof explanation.potentialSaving === 'number') {
              savingAmount = explanation.potentialSaving
            } else if (typeof explanation.potentialSaving === 'string') {
              savingAmount = parseFloat(explanation.potentialSaving.replace(/[$,]/g, '')) || 0
            }
            
            return {
              title: explanation.title || `Financial Insight ${index + 1}`,
              description: explanation.description || explanation.rationale || 'No description available',
              potential_saving: savingAmount,
              confidence: explanation.confidence || 0.85,
              category: explanation.tag || explanation.category || 'Optimization',
              steps: explanation.steps || [],
              impact: explanation.impact || 'high',
              timeframe: explanation.timeframe || '3-6 months',
              risk_level: explanation.risk_level || 'low',
              implementation_difficulty: explanation.implementation_difficulty || 'easy'
            }
          })
          
          setFormattedResults(formatted)
          setLoading(false)
          console.log('[SIMULATION RESULTS] ✅ Using recovered data')
        }
        
        processRecovered()
        return
      }
      
      // If no data can be recovered, show empty state instead of hardcoded fallback
      console.log('[SIMULATION RESULTS] ❌ No data available - showing empty state')
      setFormattedResults([])
      setLoading(false)
    }
  }, [simulationResults])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(0)}%`
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-green-400'
      case 'medium': return 'text-yellow-400'
      case 'low': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400'
      case 'medium': return 'text-yellow-400'
      case 'hard': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  if (loading) {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/70">Processing simulation results...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[100dvh] flex-col pb-24">
      {/* Header */}
      <div className="p-4 text-white">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentScreen('simulations')}
            className="text-white/80 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-semibold text-white">
            {simulationResults?.scenario_name ? `${simulationResults.scenario_name} Results` : 'Emergency Fund Results'}
          </h1>
          <div className="w-9" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* AI Explanations */}
        <div className="space-y-4">
          {formattedResults.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4">
                <BarChart3 className="w-8 h-8 text-white/60" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No Analysis Available</h3>
              <p className="text-white/70 mb-6 max-w-md">
                No simulation data or AI analysis could be loaded. Please try running a new simulation.
              </p>
              <Button
                onClick={() => setCurrentScreen('simulations')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-6 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                Run New Simulation
              </Button>
            </div>
          ) : (
            formattedResults.map((result, index) => (
            <GlassCard key={index} className="p-6 bg-gradient-to-br from-gray-500/20 to-gray-600/20">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">{result.title}</h3>
                  <p className="text-white/70 text-sm leading-relaxed mb-3">{result.description}</p>
                  
                  <div className="flex items-center space-x-4 mb-4">
                    <Badge variant="secondary" className="bg-green-500/20 text-green-300">
                      {result.category}
                    </Badge>
                    <span className={`text-sm ${getImpactColor(result.impact)}`}>
                      Impact: {result.impact}
                    </span>
                    <span className={`text-sm ${getDifficultyColor(result.implementation_difficulty)}`}>
                      Difficulty: {result.implementation_difficulty}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-4">
                  <div className="text-xs text-white/60 font-medium mb-1">Potential Savings</div>
                  <div className="text-lg font-bold text-white">{formatCurrency(result.potential_saving)}</div>
                </div>
                <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl p-4">
                  <div className="text-xs text-white/60 font-medium mb-1">Confidence</div>
                  <div className="text-lg font-bold text-white">{formatPercent(result.confidence)}</div>
                </div>
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="flex items-center">
                  <div className="p-1 bg-white/10 rounded mr-2">
                    <Calculator className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-white">Implementation Steps:</span>
                </div>
                <ul className="space-y-2">
                  {result.steps.map((step, stepIndex) => (
                    <li key={stepIndex} className="text-sm text-white/70 flex items-start">
                      <span className="text-blue-400 mr-3 mt-1">•</span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button - Single button based on action type */}
              <div className="pt-4 border-t border-white/10">
                {getActionType(result) === 'goal' ? (
                  /* Goal-worthy items get green "Set as Goal" button */
                  <Button
                    onClick={() => handleAddAsGoal(result)}
                    disabled={goalCreatedCards.has(`${result.title}-${result.potential_saving}`)}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-3 px-4 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    {goalCreatedCards.has(`${result.title}-${result.potential_saving}`) ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Goal Created!
                      </>
                    ) : (
                      <>
                        <Target className="mr-2 h-4 w-4" />
                        Set as Goal
                      </>
                    )}
                  </Button>
                ) : (
                  /* Automation-worthy items get blue "Automate" button */
                  <Button
                    onClick={() => handleAutomateCard(result)}
                    disabled={automatingCards.has(`${result.title}-${result.potential_saving}`) || 
                             automatedCards.has(`${result.title}-${result.potential_saving}`)}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-4 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    {automatingCards.has(`${result.title}-${result.potential_saving}`) ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Starting Automation...
                      </>
                    ) : automatedCards.has(`${result.title}-${result.potential_saving}`) ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Automation Started!
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Automate This Action
                      </>
                    )}
                  </Button>
                )}
              </div>
              
              {/* Deep Dive Button */}
              <div className="pt-3 border-t border-white/10">
                <DeepDiveButton
                  onClick={() => createAndOpenSimulationDeepDive(
                    'simulation-result',
                    `${result.title}-${result.potential_saving}`,
                    result.title,
                    result.description,
                    result.potential_saving,
                    simulationResults?.scenario_name
                  )}
                  className="w-full"
                />
              </div>
            </GlassCard>
          )))}
        </div>

        {/* Action Buttons - Fixed above navigation footer */}
        <div className="space-y-3 pt-4 pb-6">
          <Button
            onClick={() => setCurrentScreen('simulations')}
            className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white py-4 px-6 rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
          >
            Run Another Simulation
          </Button>
          <Button
            onClick={() => setCurrentScreen('simulation-setup')}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
          >
            Adjust Parameters
          </Button>
        </div>
      </div>

      {/* Deep Dive Modal */}
      {deepDiveAction && (
        <DeepDiveModal
          isOpen={isDeepDiveOpen}
          onClose={closeDeepDive}
          action={deepDiveAction}
        />
      )}
    </div>
  )
}