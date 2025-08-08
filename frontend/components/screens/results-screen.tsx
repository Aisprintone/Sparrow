"use client"

import { motion } from "framer-motion"
import type { AppState } from "@/hooks/use-app-state"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Check, Zap } from "lucide-react"
import AutomationStatusCard from "@/components/ui/automation-status-card"

export default function ResultsScreen({
  setCurrentScreen,
  setSelectedSimulations,
  saveAutomation,
  activeAutomations,
  setSelectedThought,
  setThoughtDetailOpen,
  addGoal,
  demographic = "millennial"
}: AppState) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring" } },
  }

  // Mock simulation results - in a real app, this would come from the simulation engine
  const simulationResults = [
    {
      id: "1",
      type: "automation",
      emoji: "🤖",
      title: "Subscription Optimization",
      automations: [
        {
          title: "Cancel Unused Subscriptions",
          description: "Automatically identify and cancel unused subscriptions to save money",
          steps: [
            {
              id: "step1",
              name: "Review subscription list",
              description: "Analyze all active subscriptions and usage patterns",
              status: "completed",
              duration: 45,
              estimatedTime: "45s"
            },
            {
              id: "step2", 
              name: "Cancel unused services",
              description: "Automatically cancel services with no recent usage",
              status: "in_progress",
              duration: 120,
              estimatedTime: "2m"
            },
            {
              id: "step3",
              name: "Set up usage tracking",
              description: "Configure monitoring for remaining subscriptions",
              status: "pending",
              duration: 30,
              estimatedTime: "30s"
            }
          ],
          potentialSaving: 45,
          status: "in-process",
          progress: 33,
          workflowStatus: "running",
          currentStep: "Cancel unused services",
          estimatedCompletion: "3m remaining"
        }
      ]
    },
    {
      id: "2", 
      type: "automation",
      emoji: "💰",
      title: "High-Yield Savings Setup",
      automations: [
        {
          title: "Open High-Yield Savings Account",
          description: "Automatically research and open the best high-yield savings account",
          steps: [
            {
              id: "step1",
              name: "Research high-yield accounts",
              description: "Compare rates and features across top banks",
              status: "completed",
              duration: 90,
              estimatedTime: "1m 30s"
            },
            {
              id: "step2",
              name: "Open new account",
              description: "Complete application process with selected bank",
              status: "in_progress", 
              duration: 240,
              estimatedTime: "4m"
            },
            {
              id: "step3",
              name: "Set up automatic transfers",
              description: "Configure recurring transfers from checking account",
              status: "pending",
              duration: 60,
              estimatedTime: "1m"
            }
          ],
          potentialSaving: 120,
          status: "in-process",
          progress: 50,
          workflowStatus: "running",
          currentStep: "Open new account",
          estimatedCompletion: "5m remaining"
        }
      ]
    },
    {
      id: "3",
      type: "automation",
      emoji: "🛡️",
      title: "Emergency Fund Strategy",
      canBeGoal: true,
      automations: [
        {
          title: "Build Emergency Fund",
          description: "Build a 6-month emergency fund for financial security",
          steps: [
            {
              id: "step1",
              name: "Calculate target amount",
              description: "Determine 6 months of essential expenses",
              status: "completed",
              duration: 30,
              estimatedTime: "30s"
            },
            {
              id: "step2",
              name: "Set up automatic transfers",
              description: "Configure monthly automatic savings transfers",
              status: "pending",
              duration: 120,
              estimatedTime: "2m"
            }
          ],
          potentialSaving: 0,
          status: "suggested",
          progress: 0,
          workflowStatus: "ready",
          currentStep: "Ready to start",
          estimatedCompletion: "Start anytime",
          goalData: {
            target: 18000,
            timeframe: "12 months",
            monthlyContribution: 1500,
            type: "safety"
          }
        }
      ]
    },
    {
      id: "4",
      type: "individual",
      emoji: "📊",
      title: "Portfolio Rebalancing",
      content: "Your current portfolio allocation shows you're overweight in tech stocks. Consider rebalancing to reduce risk and improve diversification. This could potentially reduce your portfolio volatility by 15% while maintaining similar expected returns."
    }
  ]

  const handleUserAction = (stepId: string, action: string) => {
    console.log(`User action for step ${stepId}: ${action}`)
    // Handle user actions like approve, reject, modify, etc.
  }

  const handlePause = () => {
    console.log("Pausing automation")
    // Pause the current automation
  }

  const handleResume = () => {
    console.log("Resuming automation")
    // Resume the paused automation
  }

  const handleConfigure = () => {
    console.log("Opening configuration")
    // Open configuration modal
  }

  const handleActivate = () => {
    console.log("Activating automation")
    // Activate the automation
  }

  const handleAddAsGoal = (automation: any) => {
    console.log("Adding as goal:", automation.title)
    if (automation.goalData && addGoal) {
      const goal = {
        title: automation.title,
        target: automation.goalData.target,
        current: 0,
        deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
        type: automation.goalData.type,
        monthlyContribution: automation.goalData.monthlyContribution,
        priority: "medium" as const,
        status: "active" as const,
        color: "blue",
        icon: "target"
      }
      addGoal(goal)
      setCurrentScreen("goals")
    }
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between p-6 border-b border-white/10"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">Simulation Results</h1>
          <p className="text-white/60">Your personalized financial pathway</p>
        </div>
        <Button
          onClick={() => setCurrentScreen("dashboard")}
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10"
        >
          Back to Dashboard
        </Button>
      </motion.div>

      {/* Scrollable Story Thread */}
      <div className="flex-1 overflow-y-auto p-6">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
          {simulationResults.map((card) => (
            <motion.div key={card.id} variants={itemVariants} className="relative">
              {card.type === "automation" ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-2xl ring-8 ring-black">
                      {card.emoji}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{card.title}</h3>
                      <p className="text-white/60">
                        {card.canBeGoal ? "Choose your approach" : "Automated financial optimizations"}
                      </p>
                    </div>
                  </div>
                  
                  {card.automations.map((automation, autoIndex) => {
                    const isActivated = activeAutomations.some((a) => a.title === automation.title)
                    return (
                      <AutomationStatusCard
                        key={autoIndex}
                        automation={automation}
                        profile={demographic}
                        showDetails={true}
                        isActivated={isActivated}
                        scenario="optimization"
                        onUserAction={handleUserAction}
                        onPause={handlePause}
                        onResume={handleResume}
                        onConfigure={handleConfigure}
                        onActivate={handleActivate}
                        onAddAsGoal={card.canBeGoal ? () => handleAddAsGoal(automation) : undefined}
                      />
                    )
                  })}
                </div>
              ) : (
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-2xl ring-8 ring-black">
                    {card.emoji}
                  </div>
                  <div className="w-full rounded-2xl bg-gray-900/80 p-4">
                    <div className="flex items-center justify-between">
                      {card.title && <h3 className="text-lg font-bold text-white">{card.title}</h3>}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 flex-shrink-0 text-gray-400 hover:bg-white/10"
                        onClick={() => {
                          setSelectedThought(card)
                          setThoughtDetailOpen(true)
                        }}
                      >
                        <MoreHorizontal className="h-5 w-5" />
                      </Button>
                    </div>
                    <p className="mt-1 whitespace-pre-line text-base leading-relaxed text-gray-300">{card.content}</p>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Sticky Action Buttons */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 150, damping: 25, delay: 0.5 }}
        className="flex gap-3 border-t border-white/10 bg-black/80 p-4 backdrop-blur-lg"
      >
        <Button
          onClick={() => setCurrentScreen("dashboard")}
          size="lg"
          variant="outline"
          className="flex-1 rounded-xl border-white/20 bg-white/10 py-6 text-white backdrop-blur-lg hover:bg-white/20"
        >
          View Dashboard
        </Button>
        <Button
          onClick={() => {
            setCurrentScreen("simulations")
            setSelectedSimulations([])
          }}
          size="lg"
          className="flex-1 rounded-xl bg-white py-6 text-gray-900 hover:bg-gray-200"
        >
          Run New Simulation
        </Button>
      </motion.div>
    </div>
  )
}
