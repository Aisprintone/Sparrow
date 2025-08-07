"use client"

import { useState } from "react"
import type { AppState } from "@/hooks/use-app-state"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import GlassCard from "@/components/ui/glass-card"
import { ChevronDown, ChevronUp, Check } from "lucide-react"

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
}: AppState) {
  const [expandedActions, setExpandedActions] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<"suggested" | "completed">("suggested")

  const toggleActionExpansion = (actionId: string) => {
    setExpandedActions((prev) => (prev.includes(actionId) ? prev.filter((id) => id !== actionId) : [...prev, actionId]))
  }

  const handleAIChat = (action: any) => {
    setSelectedActionForChat(action)
    setAIChatOpen(true)
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring" } },
  }

  const suggestedActions = aiActions.filter((action) => action.status === "suggested")
  const completedActions = aiActions.filter((action) => action.status === "completed")
  const totalPotentialSavings = suggestedActions.reduce((sum, action) => sum + action.potentialSaving, 0)

  // Separate pending approval actions (first 2) from recommended actions (rest)
  const pendingApprovalActions = suggestedActions.slice(0, 2)
  const recommendedActions = suggestedActions.slice(2)

  const renderActionCard = (action: any, isPendingApproval = false) => {
    const isExpanded = expandedActions.includes(action.id)
    return (
      <GlassCard key={action.id} className="bg-white/5">
        <div className="mb-3">
          <span
            className={`inline-block px-2 py-1 text-xs rounded-full mb-2 ${
              isPendingApproval ? "bg-orange-500/20 text-orange-300" : "bg-blue-500/20 text-blue-300"
            }`}
          >
            {isPendingApproval ? "Pending Approval" : "Recommended"}
          </span>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white">{action.title}</h3>
              <p className="text-sm text-gray-400 mt-1">{action.description}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-green-400">+${action.potentialSaving}/mo</p>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="p-4 rounded-xl bg-black/20">
            <button
              onClick={() => toggleActionExpansion(action.id)}
              className="flex items-center justify-between w-full text-left"
            >
              <span className="text-sm text-gray-400 hover:text-white transition-colors">Why we suggest this</span>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </button>

            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 space-y-4"
              >
                <div>
                  <h4 className="text-purple-400 text-sm font-medium mb-2">Why This Recommendation</h4>
                  <p className="text-sm text-gray-300">{action.rationale}</p>
                </div>

                <div>
                  <h4 className="text-purple-400 text-sm font-medium mb-2">Expected Results</h4>
                  <p className="text-sm text-gray-300">
                    +${action.potentialSaving}/month additional savings with minimal effort
                  </p>
                </div>

                <Button
                  size="sm"
                  onClick={() => handleAIChat(action)}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
                >
                  Dive Deep
                </Button>
              </motion.div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
            onClick={() => {
              // Convert action to ResultCard format for modal
              const resultCard = {
                id: action.id,
                type: "individual" as const,
                emoji: "📊",
                title: action.title,
                detailedExplanation: action.rationale || action.description,
                detailed_insights: action.detailed_insights || {
                  mechanics_explanation: `This ${action.title.toLowerCase()} strategy operates by ${(action.rationale || action.description).split('.')[0].toLowerCase()}.`,
                  key_insights: action.steps?.slice(0, 3) || ["Analyzed your spending patterns", "Identified optimization opportunities", "Calculated potential savings"],
                  scenario_nuances: `In your specific financial situation, this approach ${(action.rationale || action.description).split('.')[1] || 'provides a balanced strategy that aligns with your goals.'}`,
                  decision_context: `Given your current financial profile, this strategy offers the optimal balance of risk and reward.`
                }
              };
              setSelectedThought(resultCard);
              setThoughtDetailOpen(true);
            }}
          >
            Learn More
          </Button>
          <Button 
            size="sm" 
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
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

  return (
    <div className="pb-28">
      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="p-6">
        <h1 className="text-2xl font-bold text-white mb-2">AI Actions</h1>
        <p className="text-gray-400">Personalized recommendations to optimize your finances</p>
      </motion.header>

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="px-4 space-y-6">
        {/* Summary Stats */}
        <motion.div variants={itemVariants}>
          <GlassCard className="bg-gradient-to-r from-purple-500/10 to-blue-500/10">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-3xl font-bold text-white">47</p>
                <p className="text-sm text-gray-400">Transactions Analyzed</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{suggestedActions.length}</p>
                <p className="text-sm text-gray-400">Opportunities Found</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-green-400">${totalPotentialSavings}</p>
                <p className="text-sm text-gray-400">Potential Monthly Savings</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div variants={itemVariants}>
          <div className="flex bg-gray-800/50 rounded-xl p-1">
            <button
              onClick={() => setActiveTab("suggested")}
              className={`flex-1 py-3 px-4 rounded-lg text-center font-medium transition-all ${
                activeTab === "suggested" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              Suggested Actions
            </button>
            <button
              onClick={() => setActiveTab("completed")}
              className={`flex-1 py-3 px-4 rounded-lg text-center font-medium transition-all ${
                activeTab === "completed" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              Completed Actions
            </button>
          </div>
        </motion.div>

        {/* Actions Content */}
        {activeTab === "suggested" ? (
          <motion.div variants={itemVariants}>
            <div className="space-y-4">
              {/* Pending Approval Actions First */}
              {pendingApprovalActions.map((action) => renderActionCard(action, true))}

              {/* Recommended Actions */}
              {recommendedActions.map((action) => renderActionCard(action, false))}
            </div>
          </motion.div>
        ) : (
          <motion.div variants={itemVariants}>
            <div className="space-y-4">
              {completedActions.length > 0 ? (
                completedActions.map((action) => (
                  <GlassCard key={action.id} className="bg-white/5">
                    <div className="mb-3">
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-500/20 text-green-300 rounded-full mb-2">
                        <Check className="h-3 w-3" />
                        Completed
                      </span>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white">{action.title}</h3>
                          <p className="text-sm text-gray-400 mt-1">{action.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-400">+${action.potentialSaving}/mo</p>
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-400">No completed actions yet.</p>
                  <p className="text-sm text-gray-500 mt-2">Actions you complete will appear here.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
