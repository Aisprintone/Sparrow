"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Sparkles, Zap, Target, Check, ArrowRight, Clock, 
  DollarSign, Shield, TrendingUp, Activity, ChevronRight,
  Play, Settings, Info, CheckCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import GlassCard from "@/components/ui/glass-card"

interface HybridActionFlowProps {
  action: {
    id: string
    title: string
    description: string
    immediateSteps: string[]
    goalSteps: string[]
    potentialSaving: number
    targetAmount: number
    estimatedTime: string
    automationBenefits: string[]
    goalBenefits: string[]
  }
  onComplete: (config: any) => void
  onCancel: () => void
}

export default function HybridActionFlow({ 
  action, 
  onComplete, 
  onCancel 
}: HybridActionFlowProps) {
  const [currentStep, setCurrentStep] = useState<'overview' | 'automation' | 'goal' | 'confirmation'>('overview')
  const [automationConfig, setAutomationConfig] = useState({
    enabled: true,
    schedule: 'immediate',
    notifications: true
  })
  const [goalConfig, setGoalConfig] = useState({
    enabled: true,
    target: action.targetAmount,
    monthlyContribution: action.potentialSaving,
    autoContribute: true
  })
  const [isProcessing, setIsProcessing] = useState(false)

  const steps = [
    { id: 'overview', label: 'Overview', icon: Sparkles },
    { id: 'automation', label: 'Automation', icon: Zap },
    { id: 'goal', label: 'Goal Setup', icon: Target },
    { id: 'confirmation', label: 'Confirm', icon: Check }
  ]

  const currentStepIndex = steps.findIndex(s => s.id === currentStep)

  const handleNext = () => {
    const stepOrder = ['overview', 'automation', 'goal', 'confirmation']
    const currentIndex = stepOrder.indexOf(currentStep)
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1] as any)
    }
  }

  const handleBack = () => {
    const stepOrder = ['overview', 'automation', 'goal', 'confirmation']
    const currentIndex = stepOrder.indexOf(currentStep)
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1] as any)
    }
  }

  const handleConfirm = async () => {
    setIsProcessing(true)
    
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    onComplete({
      automationConfig,
      goalConfig,
      actionId: action.id
    })
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
            <Sparkles className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Smart Action Setup</h2>
            <p className="text-sm text-gray-400">
              Combine immediate automation with long-term goal tracking
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = step.id === currentStep
            const isCompleted = index < currentStepIndex
            
            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex items-center">
                  <motion.div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      transition-all duration-300
                      ${isActive 
                        ? 'bg-emerald-500 text-white' 
                        : isCompleted 
                          ? 'bg-emerald-500/20 text-emerald-400' 
                          : 'bg-gray-700 text-gray-400'}
                    `}
                    animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </motion.div>
                  <span className={`
                    ml-2 text-sm font-medium hidden sm:block
                    ${isActive ? 'text-white' : 'text-gray-400'}
                  `}>
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`
                    flex-1 h-0.5 mx-4 transition-all duration-300
                    ${index < currentStepIndex ? 'bg-emerald-500' : 'bg-gray-700'}
                  `} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {currentStep === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <GlassCard className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">{action.title}</h3>
                <p className="text-gray-300 mb-6">{action.description}</p>
                
                {/* Two-Part Action Explanation */}
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Immediate Action */}
                  <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="h-5 w-5 text-blue-400" />
                      <h4 className="font-medium text-blue-300">Immediate Action</h4>
                    </div>
                    <ul className="space-y-2">
                      {action.immediateSteps.slice(0, 3).map((step, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                          <CheckCircle className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 flex items-center gap-2 text-xs text-blue-300">
                      <Clock className="h-3 w-3" />
                      <span>Completes in {action.estimatedTime}</span>
                    </div>
                  </div>

                  {/* Long-term Goal */}
                  <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="h-5 w-5 text-purple-400" />
                      <h4 className="font-medium text-purple-300">Long-term Goal</h4>
                    </div>
                    <ul className="space-y-2">
                      {action.goalSteps.slice(0, 3).map((step, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                          <CheckCircle className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 flex items-center gap-2 text-xs text-purple-300">
                      <TrendingUp className="h-3 w-3" />
                      <span>Track progress over time</span>
                    </div>
                  </div>
                </div>

                {/* Combined Benefits */}
                <div className="mt-6 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-5 w-5 text-emerald-400" />
                    <h4 className="font-medium text-emerald-300">Smart Benefits</h4>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                    <div className="flex items-center gap-2 text-xs text-gray-300">
                      <DollarSign className="h-3.5 w-3.5 text-green-400" />
                      <span>+${action.potentialSaving}/mo</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-300">
                      <Activity className="h-3.5 w-3.5 text-blue-400" />
                      <span>Auto-optimized</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-300">
                      <Shield className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Secure & safe</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-300">
                      <TrendingUp className="h-3.5 w-3.5 text-purple-400" />
                      <span>Goal tracking</span>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {currentStep === 'automation' && (
          <motion.div
            key="automation"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <GlassCard className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Zap className="h-6 w-6 text-blue-400" />
                  <h3 className="text-lg font-semibold text-white">Automation Settings</h3>
                </div>

                {/* Automation Steps */}
                <div className="space-y-3 mb-6">
                  <p className="text-sm text-gray-400">What will happen automatically:</p>
                  {action.immediateSteps.map((step, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700"
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold text-blue-400">{i + 1}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-300">{step}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    </motion.div>
                  ))}
                </div>

                {/* Automation Options */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                    <div>
                      <p className="font-medium text-white">Enable Automation</p>
                      <p className="text-xs text-gray-400">Run this workflow automatically</p>
                    </div>
                    <Button
                      variant={automationConfig.enabled ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAutomationConfig({...automationConfig, enabled: !automationConfig.enabled})}
                    >
                      {automationConfig.enabled ? "Enabled" : "Disabled"}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                    <div>
                      <p className="font-medium text-white">Schedule</p>
                      <p className="text-xs text-gray-400">When to run the automation</p>
                    </div>
                    <select 
                      className="bg-gray-700 text-white text-sm rounded px-3 py-1"
                      value={automationConfig.schedule}
                      onChange={(e) => setAutomationConfig({...automationConfig, schedule: e.target.value})}
                    >
                      <option value="immediate">Immediately</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                    <div>
                      <p className="font-medium text-white">Notifications</p>
                      <p className="text-xs text-gray-400">Get updates on automation progress</p>
                    </div>
                    <Button
                      variant={automationConfig.notifications ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAutomationConfig({...automationConfig, notifications: !automationConfig.notifications})}
                    >
                      {automationConfig.notifications ? "On" : "Off"}
                    </Button>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {currentStep === 'goal' && (
          <motion.div
            key="goal"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <GlassCard className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Target className="h-6 w-6 text-purple-400" />
                  <h3 className="text-lg font-semibold text-white">Goal Configuration</h3>
                </div>

                {/* Goal Details */}
                <div className="space-y-4 mb-6">
                  <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-400">Target Amount</span>
                      <span className="text-2xl font-bold text-green-400">
                        ${goalConfig.target.toLocaleString()}
                      </span>
                    </div>
                    <Progress value={30} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                      <p className="text-xs text-gray-400 mb-1">Monthly Contribution</p>
                      <p className="text-lg font-semibold text-blue-400">
                        ${goalConfig.monthlyContribution}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                      <p className="text-xs text-gray-400 mb-1">Time to Goal</p>
                      <p className="text-lg font-semibold text-purple-400">
                        {Math.ceil(goalConfig.target / goalConfig.monthlyContribution)} months
                      </p>
                    </div>
                  </div>
                </div>

                {/* Goal Options */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                    <div>
                      <p className="font-medium text-white">Enable Goal Tracking</p>
                      <p className="text-xs text-gray-400">Track progress toward your target</p>
                    </div>
                    <Button
                      variant={goalConfig.enabled ? "default" : "outline"}
                      size="sm"
                      onClick={() => setGoalConfig({...goalConfig, enabled: !goalConfig.enabled})}
                    >
                      {goalConfig.enabled ? "Enabled" : "Disabled"}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                    <div>
                      <p className="font-medium text-emerald-300">Auto-contribute Savings</p>
                      <p className="text-xs text-gray-400">
                        Automatically add ${action.potentialSaving}/mo from optimizations
                      </p>
                    </div>
                    <Button
                      variant={goalConfig.autoContribute ? "default" : "outline"}
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => setGoalConfig({...goalConfig, autoContribute: !goalConfig.autoContribute})}
                    >
                      {goalConfig.autoContribute ? "Active" : "Inactive"}
                    </Button>
                  </div>
                </div>

                {/* Goal Benefits */}
                <div className="mt-6 grid grid-cols-2 gap-3">
                  {action.goalBenefits.map((benefit, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-gray-300">
                      <Check className="h-3.5 w-3.5 text-purple-400" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {currentStep === 'confirmation' && (
          <motion.div
            key="confirmation"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <GlassCard className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="h-6 w-6 text-emerald-400" />
                  <h3 className="text-lg font-semibold text-white">Review & Confirm</h3>
                </div>

                {/* Summary */}
                <div className="space-y-4">
                  {/* Automation Summary */}
                  {automationConfig.enabled && (
                    <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="h-5 w-5 text-blue-400" />
                        <h4 className="font-medium text-blue-300">Automation Ready</h4>
                      </div>
                      <ul className="space-y-1 text-xs text-gray-300">
                        <li>• Will run {automationConfig.schedule}</li>
                        <li>• Notifications {automationConfig.notifications ? 'enabled' : 'disabled'}</li>
                        <li>• Estimated completion: {action.estimatedTime}</li>
                      </ul>
                    </div>
                  )}

                  {/* Goal Summary */}
                  {goalConfig.enabled && (
                    <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-5 w-5 text-purple-400" />
                        <h4 className="font-medium text-purple-300">Goal Configured</h4>
                      </div>
                      <ul className="space-y-1 text-xs text-gray-300">
                        <li>• Target: ${goalConfig.target.toLocaleString()}</li>
                        <li>• Monthly: ${goalConfig.monthlyContribution}</li>
                        <li>• Auto-contribute: {goalConfig.autoContribute ? 'Yes' : 'No'}</li>
                      </ul>
                    </div>
                  )}

                  {/* Total Impact */}
                  <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="h-5 w-5 text-emerald-400" />
                      <h4 className="font-medium text-emerald-300">Total Impact</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-2xl font-bold text-green-400">
                          +${action.potentialSaving}
                        </p>
                        <p className="text-xs text-gray-400">Monthly savings</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-purple-400">
                          ${goalConfig.target.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-400">Goal target</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <div className="flex gap-3 mt-6">
        {currentStep !== 'overview' && (
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={isProcessing}
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            Back
          </Button>
        )}
        
        {currentStep === 'overview' && (
          <Button
            variant="outline"
            onClick={onCancel}
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            Cancel
          </Button>
        )}

        {currentStep !== 'confirmation' ? (
          <Button
            className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
            onClick={handleNext}
          >
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
            onClick={handleConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Activity className="mr-2 h-4 w-4 animate-spin" />
                Activating Smart Action...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Activate Smart Action
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}