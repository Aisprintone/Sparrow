"use client"

import { useState } from "react"
import type { AppState } from "@/hooks/use-app-state"
import { ChevronLeft, CheckCircle, ArrowRight, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import GlassCard from "@/components/ui/glass-card"
import { aiActionsService } from "@/lib/api/ai-actions-service"

export default function ActionDetailScreen({ 
  selectedAction, 
  setCurrentScreen, 
  setAiActions,
  aiActions,
  demographic 
}: AppState) {
  const [isStartingAutomation, setIsStartingAutomation] = useState(false)
  const [automationStarted, setAutomationStarted] = useState(false)

  if (!selectedAction) {
    return (
      <div className="flex h-[100dvh] items-center justify-center text-white">
        <p>No action selected. Please go back.</p>
        <Button onClick={() => setCurrentScreen("ai-actions")}>Go Back</Button>
      </div>
    )
  }

  const handleStartAutomation = async () => {
    if (!selectedAction) return

    setIsStartingAutomation(true)
    
    try {
      // Start the theatrical workflow
      const result = await aiActionsService.startAIAction(
        selectedAction.id, 
        "demo-user", 
        { demographic }
      )
      
      console.log('Automation started:', result)
      
      // Update the action to show it's in progress
      const updatedActions = aiActions.map(action => {
        if (action.id === selectedAction.id) {
          return {
            ...action,
            status: 'in-process' as const,
            progress: 0,
            workflowStatus: 'running' as const,
            currentStep: 'Initializing...',
            estimatedCompletion: new Date(Date.now() + 120000).toISOString(), // 2 minutes from now
            executionId: result.execution_id // Store the execution ID for tracking
          }
        }
        return action
      })
      
      setAiActions(updatedActions)
      setAutomationStarted(true)
      
      // Navigate back to AI actions screen after a short delay
      setTimeout(() => {
        setCurrentScreen("ai-actions")
      }, 2000)
      
    } catch (error) {
      console.error('Failed to start automation:', error)
    } finally {
      setIsStartingAutomation(false)
    }
  }

  return (
    <div className="pb-28">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 flex items-center justify-between"
      >
        <Button onClick={() => setCurrentScreen("ai-actions")} variant="ghost" className="text-white hover:bg-white/20">
          <ChevronLeft className="mr-2 h-5 w-5" />
          Back
        </Button>
        {selectedAction.simulationTag && (
          <span className="px-3 py-1 text-sm bg-blue-500/20 text-blue-300 rounded-full">
            {selectedAction.simulationTag}
          </span>
        )}
      </motion.header>

      <div className="px-4 space-y-6">
        {/* Action Overview */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard className="bg-gradient-to-r from-purple-500/10 to-blue-500/10">
            <h1 className="text-2xl font-bold text-white mb-2">{selectedAction.title}</h1>
            <p className="text-gray-300 mb-4">{selectedAction.description}</p>
            {selectedAction.potentialSaving > 0 && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 border border-green-500/30">
                <span className="text-green-400 font-semibold">
                  +${selectedAction.potentialSaving}/month potential savings
                </span>
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Why AI Suggests This */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}>
          <GlassCard className="bg-white/5">
            <h2 className="text-xl font-semibold text-white mb-3">Why AI suggests this action</h2>
            <p className="text-gray-300 leading-relaxed">{selectedAction.rationale}</p>
          </GlassCard>
        </motion.div>

        {/* Automation Steps */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}>
          <GlassCard className="bg-white/5">
            <h2 className="text-xl font-semibold text-white mb-4">Step-by-step automation process</h2>
            <div className="space-y-4">
              {selectedAction.steps.map((step, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex-shrink-0 mt-1">
                    <span className="text-blue-300 font-semibold text-sm">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-300">{step}</p>
                    {index < selectedAction.steps.length - 1 && (
                      <div className="flex justify-center mt-3">
                        <ArrowRight className="h-4 w-4 text-gray-500" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Expected Outcome */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.3 } }}>
          <GlassCard className="bg-green-500/10 border border-green-500/20">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-green-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Expected outcome</h3>
                <p className="text-gray-300">
                  Once automated, this action will run continuously in the background, optimizing your finances without
                  requiring manual intervention. You'll receive monthly reports on the progress and savings achieved.
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.4 } }}
          className="flex gap-3 pt-4"
        >
          <Button
            size="lg"
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            onClick={handleStartAutomation}
            disabled={isStartingAutomation || automationStarted}
          >
            {isStartingAutomation ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting Automation...
              </>
            ) : automationStarted ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Automation Started!
              </>
            ) : (
              "Automate This Action"
            )}
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="flex-1 border-white/20 hover:bg-white/10 bg-transparent"
            disabled={isStartingAutomation}
          >
            I'll Do It Myself
          </Button>
        </motion.div>

        {/* Success Message */}
        {automationStarted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-4"
          >
            <p className="text-green-400 text-sm">
              ✅ Automation started! Check the "In Process" tab to track progress.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
