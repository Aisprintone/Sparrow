"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Target, Calendar, DollarSign, TrendingUp, Sparkles, 
  Check, ArrowRight, Info, AlertCircle, Zap, Shield,
  Milestone, Clock, Calculator, ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format, addMonths } from "date-fns"

interface GoalConfig {
  title: string
  target: number
  current: number
  deadline: string
  monthlyContribution: number
  automateContributions: boolean
  milestones: { name: string; target: number; date: string }[]
  category: string
  priority: 'high' | 'medium' | 'low'
}

interface GoalCreationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (goalConfig: GoalConfig) => void
  action: {
    title: string
    description: string
    suggestedTarget?: number
    suggestedDeadline?: string
    suggestedContribution?: number
    suggestedMilestones?: { name: string; target: number }[]
    potentialSaving?: number
  }
}

export default function GoalCreationModal({
  isOpen,
  onClose,
  onConfirm,
  action
}: GoalCreationModalProps) {
  const [activeTab, setActiveTab] = useState("customize")
  const [goalConfig, setGoalConfig] = useState<GoalConfig>({
    title: action.title,
    target: action.suggestedTarget || 10000,
    current: 0,
    deadline: action.suggestedDeadline || format(addMonths(new Date(), 12), 'yyyy-MM-dd'),
    monthlyContribution: action.suggestedContribution || 500,
    automateContributions: true,
    milestones: [],
    category: 'savings',
    priority: 'high'
  })

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [showProjection, setShowProjection] = useState(false)

  // Calculate projections
  const monthsToGoal = Math.ceil(
    (goalConfig.target - goalConfig.current) / goalConfig.monthlyContribution
  )
  const projectedCompletionDate = addMonths(new Date(), monthsToGoal)
  const totalContributions = monthsToGoal * goalConfig.monthlyContribution
  const progressPercentage = (goalConfig.current / goalConfig.target) * 100

  // Generate automatic milestones
  useEffect(() => {
    const generateMilestones = () => {
      const milestones = []
      const quarters = [0.25, 0.5, 0.75, 1]
      
      quarters.forEach((fraction, index) => {
        const targetAmount = Math.round(goalConfig.target * fraction)
        const monthsToMilestone = Math.ceil(
          (targetAmount - goalConfig.current) / goalConfig.monthlyContribution
        )
        
        milestones.push({
          name: fraction === 1 ? 'Goal Achieved!' : `${fraction * 100}% Milestone`,
          target: targetAmount,
          date: format(addMonths(new Date(), monthsToMilestone), 'yyyy-MM-dd')
        })
      })
      
      setGoalConfig(prev => ({ ...prev, milestones }))
    }
    
    if (goalConfig.target > 0 && goalConfig.monthlyContribution > 0) {
      generateMilestones()
    }
  }, [goalConfig.target, goalConfig.monthlyContribution, goalConfig.current])

  const handleSliderChange = (field: keyof GoalConfig, value: number[]) => {
    setGoalConfig(prev => ({ ...prev, [field]: value[0] }))
  }

  const validateAndConfirm = () => {
    const errors: Record<string, string> = {}
    
    if (!goalConfig.title.trim()) {
      errors.title = "Goal title is required"
    }
    if (goalConfig.target <= 0) {
      errors.target = "Target amount must be greater than 0"
    }
    if (goalConfig.monthlyContribution <= 0) {
      errors.contribution = "Monthly contribution must be greater than 0"
    }
    
    setValidationErrors(errors)
    
    if (Object.keys(errors).length === 0) {
      onConfirm(goalConfig)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gray-900 border border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
              <Target className="h-6 w-6 text-purple-400" />
            </div>
            Create Financial Goal
          </DialogTitle>
        </DialogHeader>

        {/* AI Suggestion Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30"
        >
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-purple-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-purple-300 mb-1">
                AI-Powered Recommendation
              </p>
              <p className="text-xs text-gray-300">
                Based on your financial profile, we've pre-filled optimal values for this goal. 
                Feel free to adjust them to match your preferences.
              </p>
            </div>
          </div>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800">
            <TabsTrigger value="customize">Customize</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="automation">Automation</TabsTrigger>
          </TabsList>

          {/* Customize Tab */}
          <TabsContent value="customize" className="space-y-4 mt-4">
            <div className="space-y-4">
              {/* Goal Title */}
              <div>
                <Label htmlFor="title" className="text-white mb-2">Goal Title</Label>
                <Input
                  id="title"
                  value={goalConfig.title}
                  onChange={(e) => setGoalConfig({...goalConfig, title: e.target.value})}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="e.g., Emergency Fund"
                />
                {validationErrors.title && (
                  <p className="text-xs text-red-400 mt-1">{validationErrors.title}</p>
                )}
              </div>

              {/* Target Amount */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="target" className="text-white">Target Amount</Label>
                  <span className="text-2xl font-bold text-green-400">
                    ${goalConfig.target.toLocaleString()}
                  </span>
                </div>
                <Slider
                  id="target"
                  min={1000}
                  max={100000}
                  step={1000}
                  value={[goalConfig.target]}
                  onValueChange={(value) => handleSliderChange('target', value)}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>$1,000</span>
                  <span>$100,000</span>
                </div>
              </div>

              {/* Monthly Contribution */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="contribution" className="text-white">Monthly Contribution</Label>
                  <span className="text-xl font-semibold text-blue-400">
                    ${goalConfig.monthlyContribution}/mo
                  </span>
                </div>
                <Slider
                  id="contribution"
                  min={50}
                  max={5000}
                  step={50}
                  value={[goalConfig.monthlyContribution]}
                  onValueChange={(value) => handleSliderChange('monthlyContribution', value)}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>$50</span>
                  <span>$5,000</span>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-gray-800/50">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-blue-400" />
                  <div>
                    <p className="text-xs text-gray-400">Time to Goal</p>
                    <p className="text-sm font-semibold text-white">
                      {monthsToGoal} months
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-purple-400" />
                  <div>
                    <p className="text-xs text-gray-400">Completion Date</p>
                    <p className="text-sm font-semibold text-white">
                      {format(projectedCompletionDate, 'MMM yyyy')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="space-y-4 mt-4">
            <div className="space-y-4">
              {/* Visual Timeline */}
              <div className="p-4 rounded-lg bg-gray-800/50">
                <h3 className="text-sm font-medium text-white mb-4">Projected Timeline</h3>
                
                {/* Progress Bar */}
                <div className="relative mb-6">
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <motion.div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercentage}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                  <div className="absolute -top-6 left-0 text-xs text-gray-400">
                    Current: ${goalConfig.current}
                  </div>
                  <div className="absolute -top-6 right-0 text-xs text-gray-400">
                    Goal: ${goalConfig.target}
                  </div>
                </div>

                {/* Milestones */}
                <div className="space-y-3">
                  {goalConfig.milestones.map((milestone, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-3 p-3 rounded-lg bg-gray-900/50 border border-gray-700"
                    >
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center
                        ${index === goalConfig.milestones.length - 1 
                          ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
                          : 'bg-gray-700'}
                      `}>
                        {index === goalConfig.milestones.length - 1 
                          ? <Check className="h-5 w-5 text-white" />
                          : <span className="text-sm font-semibold text-gray-300">
                              {index + 1}
                            </span>
                        }
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{milestone.name}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span>${milestone.target.toLocaleString()}</span>
                          <span>{format(new Date(milestone.date), 'MMM yyyy')}</span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Projection Chart */}
              <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-5 w-5 text-blue-400" />
                  <h3 className="text-sm font-medium text-white">Growth Projection</h3>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-green-400">
                      ${totalContributions.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400">Total Contributions</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-400">
                      {monthsToGoal}
                    </p>
                    <p className="text-xs text-gray-400">Months to Goal</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-400">
                      ${goalConfig.monthlyContribution}
                    </p>
                    <p className="text-xs text-gray-400">Monthly Amount</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Automation Tab */}
          <TabsContent value="automation" className="space-y-4 mt-4">
            <div className="space-y-4">
              {/* Automation Toggle */}
              <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/20">
                      <Zap className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">Automate Contributions</p>
                      <p className="text-sm text-gray-400">
                        Automatically save ${goalConfig.monthlyContribution} every month
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={goalConfig.automateContributions}
                    onCheckedChange={(checked) => 
                      setGoalConfig({...goalConfig, automateContributions: checked})
                    }
                  />
                </div>
              </div>

              {/* Automation Benefits */}
              {goalConfig.automateContributions && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-3"
                >
                  <h3 className="text-sm font-medium text-white">Automation Benefits</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                      <Shield className="h-4 w-4 text-green-400 mb-2" />
                      <p className="text-xs font-medium text-white">Set & Forget</p>
                      <p className="text-xs text-gray-400">No manual transfers needed</p>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                      <TrendingUp className="h-4 w-4 text-blue-400 mb-2" />
                      <p className="text-xs font-medium text-white">Consistent Growth</p>
                      <p className="text-xs text-gray-400">Build wealth steadily</p>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                      <Calendar className="h-4 w-4 text-purple-400 mb-2" />
                      <p className="text-xs font-medium text-white">On Schedule</p>
                      <p className="text-xs text-gray-400">Never miss a contribution</p>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                      <Calculator className="h-4 w-4 text-orange-400 mb-2" />
                      <p className="text-xs font-medium text-white">Smart Timing</p>
                      <p className="text-xs text-gray-400">Optimize for payday</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Connection Impact */}
              {action.potentialSaving && (
                <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-300 mb-1">
                        Connected Optimization
                      </p>
                      <p className="text-xs text-gray-300">
                        This goal connects to your ${action.potentialSaving}/month savings from {action.title}. 
                        These savings can automatically contribute to your goal!
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            Maybe Later
          </Button>
          <Button 
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            onClick={validateAndConfirm}
          >
            <Check className="mr-2 h-4 w-4" />
            Create Goal
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}