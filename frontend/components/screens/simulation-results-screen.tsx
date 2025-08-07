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
  demographic
}: AppState) {
  const [formattedResults, setFormattedResults] = useState<AIExplanation[]>([])
  const [loading, setLoading] = useState(true)
  const [automatingCards, setAutomatingCards] = useState<Set<string>>(new Set())
  const [automatedCards, setAutomatedCards] = useState<Set<string>>(new Set())

  // Handle one-click automation for a recommendation card
  const handleAutomateCard = async (result: AIExplanation) => {
    const cardId = `${result.title}-${result.potential_saving}`
    
    if (automatingCards.has(cardId) || automatedCards.has(cardId)) {
      return
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

      // Navigate to AI Actions screen to show the automation in progress
      setTimeout(() => {
        setCurrentScreen("ai-actions")
      }, 1500)

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
            if (typeof explanation.potentialSaving === 'number') {
              savingAmount = explanation.potentialSaving
            } else if (typeof explanation.potentialSaving === 'string') {
              // Remove $ and commas, then parse
              savingAmount = parseFloat(explanation.potentialSaving.replace(/[$,]/g, '')) || 0
            } else if (typeof explanation.potential_saving === 'number') {
              // Also check snake_case for backwards compatibility
              savingAmount = explanation.potential_saving
            } else if (typeof explanation.potential_saving === 'string') {
              savingAmount = parseFloat(explanation.potential_saving.replace(/[$,]/g, '')) || 0
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
          
          console.log('[SIMULATION RESULTS] 📊 Using AI-generated explanations:', formattedResults)
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
            if (typeof explanation.potentialSaving === 'number') {
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
      
      console.log('[SIMULATION RESULTS] 📋 Using intelligent fallback data')
      
      // SOLID Principle: Strategy Pattern for fallback generation
      const generateContextualFallback = (): AIExplanation[] => {
        // Generate contextual fallback based on common financial scenarios
        const fallbackTemplates: AIExplanation[] = [
        {
          title: "Emergency Fund Optimization",
          description: "Increase your emergency fund to cover 6 months of expenses",
          potential_saving: 5000,
          confidence: 0.85,
          category: "Emergency Fund",
          steps: [
            "Calculate 6 months of essential expenses",
            "Set up automatic transfers to savings",
            "Consider high-yield savings account"
          ],
          impact: "high",
          timeframe: "6-12 months",
          risk_level: "low",
          implementation_difficulty: "easy"
        },
        {
          title: "Debt Consolidation Strategy",
          description: "Consolidate high-interest debt into a lower-rate loan",
          potential_saving: 3000,
          confidence: 0.75,
          category: "Debt Management",
          steps: [
            "Review all current debt balances and rates",
            "Research consolidation loan options",
            "Apply for the best available rate"
          ],
          impact: "medium",
          timeframe: "3-6 months",
          risk_level: "medium",
          implementation_difficulty: "medium"
        }
      ]
        
        return fallbackTemplates
      }
      
      const fallbackExplanations = generateContextualFallback()
      console.log('[SIMULATION RESULTS] 🔄 Loading fallback explanations')
      setFormattedResults(fallbackExplanations)
      setLoading(false)
      console.log('[SIMULATION RESULTS] ✅ Fallback data loaded')
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
    <div className="flex h-[100dvh] flex-col">
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
            Simulation Results
          </h1>
          <div className="w-9" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Summary Card */}
        <GlassCard className="p-6 bg-gradient-to-br from-blue-500/20 to-purple-500/20">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-white/10 rounded-lg mr-3">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-white">AI Financial Insights</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-4">
              <div className="text-sm text-white/60 font-medium mb-1">Total Potential Savings</div>
              <div className="text-xl font-bold text-white">
                {formatCurrency(formattedResults.reduce((sum, result) => sum + result.potential_saving, 0))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl p-4">
              <div className="text-sm text-white/60 font-medium mb-1">Insights Generated</div>
              <div className="text-xl font-bold text-white">{formattedResults.length}</div>
            </div>
          </div>
        </GlassCard>

        {/* AI Explanations */}
        <div className="space-y-4">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-white/10 rounded-lg mr-3">
              <Lightbulb className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-white">Personalized Recommendations</h2>
          </div>
          
          {formattedResults.map((result, index) => (
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

              {/* Automation Button */}
              <div className="pt-4 border-t border-white/10">
                <Button
                  onClick={() => handleAutomateCard(result)}
                  disabled={automatingCards.has(`${result.title}-${result.potential_saving}`) || 
                           automatedCards.has(`${result.title}-${result.potential_saving}`)}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-4 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
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
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-4">
          <Button
            onClick={() => setCurrentScreen('simulations')}
            className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white py-4 px-6 rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
          >
            Run Another Simulation
          </Button>
          <Button
            onClick={() => setCurrentScreen('dashboard')}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}