"use client"

import { useEffect, useState } from "react"
import type { AppState } from "@/hooks/use-app-state"
import { TrendingUp, TrendingDown, DollarSign, Shield, Target, Zap, BarChart3, CreditCard, PiggyBank, ChevronRight, CheckCircle, AlertTriangle, Loader2, Play, X } from "lucide-react"
import GlassCard from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { creditScore } from "@/lib/data"
import { motion, AnimatePresence } from "framer-motion"
import { aiActionsService } from "@/lib/api/ai-actions-service"
import { formatGoalProgress, GoalProgressCalculator } from '@/lib/utils/goal-progress-calculator'
import DeepDiveModal from "@/components/ui/deep-dive-modal"
import DeepDiveButton from "@/components/ui/deep-dive-button"
import { useDeepDive } from "@/hooks/use-deep-dive"

// Interface for AIExplanation to match simulation results
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

export default function DashboardScreen({ 
  setCurrentScreen, 
  goals, 
  aiActions, 
  saveAutomation, 
  setAiActions, 
  demographic,
  accounts 
}: AppState) {
  // Calculate real financial values using CORRECT method (balance-based, not type-based)
  let totalAssets = 0
  let totalLiabilities = 0
  
  console.log('Dashboard accounts:', accounts)
  console.log('Accounts length:', accounts?.length || 0)
  
  for (const account of accounts || []) {
    const balance = account.balance
    console.log(`Account ${account.name}: $${balance}`)
    
    if (balance >= 0) {
      totalAssets += balance          // Positive balances = assets
    } else {
      totalLiabilities += Math.abs(balance)  // Negative balances = liabilities
    }
  }
  
  const netWorth = totalAssets - totalLiabilities
  console.log('Calculated - Assets:', totalAssets, 'Liabilities:', totalLiabilities, 'Net Worth:', netWorth)
  
  // Add fallback values if accounts is empty or loading
  const displayNetWorth = (accounts?.length > 0) ? netWorth : (demographic === 'genz' ? -21653 : 0)
  const displayAssets = (accounts?.length > 0) ? totalAssets : (demographic === 'genz' ? 8047 : 0)  
  const displayLiabilities = (accounts?.length > 0) ? totalLiabilities : (demographic === 'genz' ? 29700 : 0)

  // Get first few goals and AI actions for the feed
  const recentGoals = goals.slice(0, 2)
  const [recentAIActions, setRecentAIActions] = useState(aiActions?.slice(0, 2) || [])
  const [automatingCards, setAutomatingCards] = useState<Set<string>>(new Set())
  const [automatedCards, setAutomatedCards] = useState<Set<string>>(new Set())
  const [cancelledCards, setCancelledCards] = useState<Set<string>>(new Set())
  const [processingCards, setProcessingCards] = useState<Set<string>>(new Set())
  const [exitingCards, setExitingCards] = useState<Set<string>>(new Set())
  const {
    deepDiveAction,
    isDeepDiveOpen,
    openDeepDive,
    closeDeepDive,
    createAndOpenDashboardDeepDive
  } = useDeepDive()

  // Generate new AI action to replace processed ones
  const generateNewAIAction = (): any => {
    const newActions = [
      {
        id: `new-action-${Date.now()}`,
        title: "Optimize Credit Card Rewards",
        description: "Maximize your cashback and points earning potential",
        rationale: "Analysis shows you're not maximizing credit card rewards. We can help you earn more on every purchase.",
        type: "optimization" as const,
        potentialSaving: 45,
        steps: ["Review current cards", "Identify spending patterns", "Apply for better cards", "Set up automatic payments"],
        status: "suggested" as const
      },
      {
        id: `new-action-${Date.now() + 1}`,
        title: "Negotiate Insurance Rates",
        description: "Reduce your insurance premiums by comparing rates",
        rationale: "Your insurance rates haven't been reviewed in 2 years. We can help you find better rates.",
        type: "optimization" as const,
        potentialSaving: 120,
        steps: ["Review current policies", "Compare rates online", "Contact providers", "Switch to better rates"],
        status: "suggested" as const
      },
      {
        id: `new-action-${Date.now() + 2}`,
        title: "Set Up Emergency Fund",
        description: "Build a 6-month emergency fund for financial security",
        rationale: "You have 2 months of expenses saved. Let's build this to 6 months for better security.",
        type: "optimization" as const,
        potentialSaving: 0,
        steps: ["Calculate target amount", "Set up automatic transfers", "Choose high-yield account", "Monitor progress"],
        status: "suggested" as const
      }
    ]
    
    return newActions[Math.floor(Math.random() * newActions.length)]
  }

  // Smooth card replacement function
  const replaceCard = (cardId: string, isAutomated: boolean) => {
    // Mark card as exiting
    setExitingCards(prev => new Set(prev).add(cardId))
    
    // Remove from processing states
    setAutomatingCards(prev => {
      const newSet = new Set(prev)
      newSet.delete(cardId)
      return newSet
    })
    setProcessingCards(prev => {
      const newSet = new Set(prev)
      newSet.delete(cardId)
      return newSet
    })

    // Replace card after animation completes
    setTimeout(() => {
      setRecentAIActions(prev => {
        const newActions = prev.filter(a => a.id !== cardId)
        const newAction = generateNewAIAction()
        return [...newActions, newAction]
      })
      
      // Clear all states for this card
      setAutomatedCards(prev => {
        const newSet = new Set(prev)
        newSet.delete(cardId)
        return newSet
      })
      setCancelledCards(prev => {
        const newSet = new Set(prev)
        newSet.delete(cardId)
        return newSet
      })
      setExitingCards(prev => {
        const newSet = new Set(prev)
        newSet.delete(cardId)
        return newSet
      })
    }, 400) // Reduced from 2000ms to 400ms for smoother flow
  }

  // Handle automation for dashboard AI actions
  const handleDashboardAutomate = async (action: any) => {
    const cardId = action.id
    
    if (automatingCards.has(cardId) || automatedCards.has(cardId)) {
      return
    }

    setAutomatingCards(prev => new Set(prev).add(cardId))

    try {
      // Convert AIAction to AIExplanation format
      const aiExplanation: AIExplanation = {
        title: action.title,
        description: action.description,
        potential_saving: action.potentialSaving,
        confidence: 0.85,
        category: "optimization",
        steps: action.steps,
        impact: "high" as const,
        timeframe: "1-2 months",
        risk_level: "low",
        implementation_difficulty: "easy" as const
      }

      // Create automation action from the recommendation
      const automationAction = {
        title: aiExplanation.title,
        description: aiExplanation.description,
        steps: aiExplanation.steps.map((step, index) => ({
          id: `step-${index}`,
          name: `Step ${index + 1}`,
          description: step,
          status: "pending" as const,
          duration: 30,
          estimatedTime: "30s",
          agentType: "automated" as const
        })),
        potentialSaving: aiExplanation.potential_saving,
        type: "optimization" as const,
        rationale: aiExplanation.description,
        status: "suggested" as const,
        progress: 0,
        workflowStatus: "running" as const,
        currentStep: "Initializing...",
        estimatedCompletion: new Date(Date.now() + 120000).toISOString(),
        executionId: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        scenario: "Dashboard",
        profile: demographic,
        impact: {
          immediateSavings: aiExplanation.potential_saving,
          annualProjection: aiExplanation.potential_saving * 12,
          riskReduction: 0,
          goalProgress: 0,
          timeToComplete: aiExplanation.timeframe
        },
        metadata: {
          category: "optimize" as const,
          difficulty: aiExplanation.implementation_difficulty,
          confidence: Math.round(aiExplanation.confidence * 100),
          dependencies: [],
          prerequisites: []
        }
      }

      // Start the automation workflow (non-blocking)
      aiActionsService.startAIAction(
        automationAction.executionId,
        "demo-user",
        { demographic }
      ).then(workflowResult => {
        console.log('Automation started for card:', automationAction.title, workflowResult)
        // Save the automation to the app state
        saveAutomation(automationAction)
      }).catch(error => {
        console.error('Failed to start automation for card:', action.title, error)
      })
      
      // Mark as automated immediately for better UX
      setAutomatedCards(prev => new Set(prev).add(cardId))

      // Replace the card with shorter delay
      setTimeout(() => {
        replaceCard(cardId, true)
      }, 800) // Reduced from 2000ms to 800ms

      console.log('Automation started successfully:', automationAction.title)

    } catch (error) {
      console.error('Failed to start automation for card:', action.title, error)
      setAutomatingCards(prev => {
        const newSet = new Set(prev)
        newSet.delete(cardId)
        return newSet
      })
    }
  }

  // Handle cancel for dashboard AI actions
  const handleDashboardCancel = async (action: any) => {
    const cardId = action.id
    
    if (processingCards.has(cardId) || cancelledCards.has(cardId)) {
      return
    }

    setProcessingCards(prev => new Set(prev).add(cardId))

    try {
      // Simulate processing time (reduced)
      await new Promise(resolve => setTimeout(resolve, 300)) // Reduced from 1000ms to 300ms
      
      // Mark as cancelled
      setCancelledCards(prev => new Set(prev).add(cardId))

      // Replace the card with shorter delay
      setTimeout(() => {
        replaceCard(cardId, false)
      }, 600) // Reduced from 2000ms to 600ms

    } catch (error) {
      console.error('Failed to cancel action:', action.title, error)
      setProcessingCards(prev => {
        const newSet = new Set(prev)
        newSet.delete(cardId)
        return newSet
      })
    }
  }

  // Handle deep dive for dashboard AI actions
  const handleDashboardDeepDive = (action: any) => {
    createAndOpenDashboardDeepDive(
      action.id,
      action.title,
      action.description,
      action.potentialSaving
    )
  }

  return (
    <div className="flex h-[100dvh] flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">FinanceAI</h1>
          </div>
          <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
            <div className="w-6 h-6 bg-white/20 rounded-full"></div>
          </div>
        </div>

        {/* Net Worth Card - Enhanced aesthetic layout */}
        <GlassCard 
          className="p-5 cursor-pointer hover:scale-[1.02] transition-all duration-200"
          onClick={() => setCurrentScreen("net-worth-detail")}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-5 w-5 text-green-400" />
                <p className="text-white/60 text-sm font-medium">Net Worth</p>
              </div>
              <p className="text-white text-3xl font-bold">
                {displayNetWorth < 0 ? '-' : ''}${Math.abs(displayNetWorth).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-2 text-white/40">
              <span className="text-xs">View Details</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6 pt-4 border-t border-white/10">
            <div className="space-y-1">
              <p className="text-white/60 text-xs font-medium">Assets</p>
              <p className="text-green-400 text-lg font-semibold">${displayAssets.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-white/60 text-xs font-medium">Liabilities</p>
              <p className="text-red-400 text-lg font-semibold">${displayLiabilities.toLocaleString()}</p>
            </div>
          </div>
        </GlassCard>

        {/* AI Actions Feed */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-purple-400" />
              <h2 className="text-base font-semibold text-white">Suggested AI Actions</h2>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setCurrentScreen("ai-actions")}
              className="text-blue-400 hover:text-blue-300 p-0 h-auto"
            >
              View all
            </Button>
          </div>
          <div className="space-y-3">
            <AnimatePresence>
              {recentAIActions.length > 0 ? (
                recentAIActions.map((action, index) => (
                  <motion.div
                    key={action.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ 
                      opacity: exitingCards.has(action.id) ? 0 : 1,
                      y: exitingCards.has(action.id) ? (automatedCards.has(action.id) ? 50 : -50) : 0,
                      scale: exitingCards.has(action.id) ? 0.9 : 1,
                      x: exitingCards.has(action.id) ? (automatedCards.has(action.id) ? 100 : -100) : 0
                    }}
                    exit={{ 
                      opacity: 0, 
                      x: automatedCards.has(action.id) ? 100 : -100, 
                      y: automatedCards.has(action.id) ? 50 : -50,
                      scale: 0.8,
                      transition: { duration: 0.3, ease: "easeInOut" }
                    }}
                    transition={{ 
                      duration: 0.2, 
                      ease: "easeOut",
                      type: "spring",
                      stiffness: 300,
                      damping: 30
                    }}
                  >
                    <GlassCard className="p-4 relative overflow-hidden">
                      {/* Success overlay for automated cards */}
                      {automatedCards.has(action.id) && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="absolute inset-0 bg-green-500/20 flex items-center justify-center z-10 backdrop-blur-sm"
                        >
                          <div className="flex items-center gap-2 text-green-400 font-semibold">
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.1, type: "spring", stiffness: 500 }}
                            >
                              <CheckCircle className="h-5 w-5" />
                            </motion.div>
                            <motion.span
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.2 }}
                            >
                              Automation Started!
                            </motion.span>
                          </div>
                        </motion.div>
                      )}

                      {/* Success overlay for cancelled cards */}
                      {cancelledCards.has(action.id) && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="absolute inset-0 bg-gray-500/20 flex items-center justify-center z-10 backdrop-blur-sm"
                        >
                          <div className="flex items-center gap-2 text-gray-400 font-semibold">
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.1, type: "spring", stiffness: 500 }}
                            >
                              <X className="h-5 w-5" />
                            </motion.div>
                            <motion.span
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.2 }}
                            >
                              Action Cancelled
                            </motion.span>
                          </div>
                        </motion.div>
                      )}

                      <div className="flex items-start justify-between mb-3">
                        <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">
                          Pending Approval
                        </Badge>
                      </div>
                      <div className="mb-3">
                        <h3 className="text-white font-semibold mb-1">{action.title}</h3>
                        <p className="text-green-400 text-sm font-medium">+${action.potentialSaving}/mo</p>
                        <p className="text-white/60 text-sm mt-1">{action.description}</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Button 
                            size="sm"
                            onClick={() => handleDashboardAutomate(action)}
                            disabled={automatingCards.has(action.id) || automatedCards.has(action.id) || cancelledCards.has(action.id) || exitingCards.has(action.id)}
                            className="bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50 transition-all duration-200"
                          >
                            {automatingCards.has(action.id) ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Starting...
                              </>
                            ) : automatedCards.has(action.id) ? (
                              <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Automated!
                              </>
                            ) : (
                              <>
                                <Play className="mr-2 h-4 w-4" />
                                Automate
                              </>
                            )}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDashboardCancel(action)}
                            disabled={processingCards.has(action.id) || automatedCards.has(action.id) || cancelledCards.has(action.id) || exitingCards.has(action.id)}
                            className="text-red-400 hover:text-red-300 disabled:opacity-50 transition-all duration-200"
                          >
                            {processingCards.has(action.id) ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Cancelling...
                              </>
                            ) : cancelledCards.has(action.id) ? (
                              <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Cancelled!
                              </>
                            ) : (
                              <>
                                <X className="mr-2 h-4 w-4" />
                                Cancel
                              </>
                            )}
                          </Button>
                        </div>
                        <DeepDiveButton
                          onClick={() => handleDashboardDeepDive(action)}
                          className="w-full"
                        />
                      </div>
                    </GlassCard>
                  </motion.div>
                ))
              ) : (
                <GlassCard className="p-4">
                  <div className="text-center py-4">
                    <Zap className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                    <p className="text-white/60 text-sm">No AI actions yet</p>
                    <p className="text-white/40 text-xs">AI will analyze your finances and suggest optimizations</p>
                  </div>
                </GlassCard>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Goals Feed */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-green-400" />
              <h2 className="text-base font-semibold text-white">Goals</h2>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setCurrentScreen("goals")}
              className="text-blue-400 hover:text-blue-300 p-0 h-auto"
            >
              View all
            </Button>
          </div>
          <div className="space-y-3">
            {recentGoals.length > 0 ? (
              recentGoals.map((goal) => (
                <GlassCard key={goal.id} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        goal.color === 'green' ? 'bg-green-500/20' :
                        goal.color === 'blue' ? 'bg-blue-500/20' :
                        goal.color === 'purple' ? 'bg-purple-500/20' :
                        goal.color === 'red' ? 'bg-red-500/20' :
                        goal.color === 'orange' ? 'bg-orange-500/20' :
                        'bg-blue-500/20'
                      }`}>
                        <Target className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">{goal.title}</h3>
                        <p className="text-white/60 text-sm">${goal.current.toLocaleString()} / ${goal.target.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white text-sm font-medium">
                        {formatGoalProgress(goal.current, goal.target)}
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                    <div 
                      className="bg-gradient-to-r from-green-400 to-blue-400 h-2 rounded-full" 
                      style={{ width: `${Math.min(100, GoalProgressCalculator.calculate({ current: goal.current, target: goal.target }).percentage)}%` }}
                    ></div>
                  </div>
                </GlassCard>
              ))
            ) : (
              <GlassCard className="p-4">
                <div className="text-center py-4">
                  <Target className="h-8 w-8 text-green-400 mx-auto mb-2" />
                  <p className="text-white/60 text-sm">No goals yet</p>
                  <p className="text-white/40 text-xs">Create your first financial goal to start tracking</p>
                </div>
              </GlassCard>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-base font-semibold text-white mb-3">Recent Activity</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <div>
                  <p className="text-white text-sm">Salary deposited</p>
                  <p className="text-white/60 text-xs">2 hours ago</p>
                </div>
              </div>
              <span className="text-green-400 text-sm">+$4,500</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <div>
                  <p className="text-white text-sm">Investment contribution</p>
                  <p className="text-white/60 text-xs">1 day ago</p>
                </div>
              </div>
              <span className="text-blue-400 text-sm">+$500</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                <div>
                  <p className="text-white text-sm">Netflix subscription</p>
                  <p className="text-white/60 text-xs">2 days ago</p>
                </div>
              </div>
              <span className="text-red-400 text-sm">-$15.49</span>
            </div>
          </div>
        </div>

        {/* Credit Score Card - Moved to bottom */}
        <div>
          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-sm">Credit Score</p>
                <p className="text-green-400 text-2xl font-bold">{creditScore.score}</p>
                <p className="text-white/60 text-xs">+23 this month, Payment history improved with on-time payments</p>
              </div>
            </div>
          </GlassCard>
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