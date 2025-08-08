"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import { 
  Target, Sparkles, TrendingUp, DollarSign, Calendar, 
  ChevronRight, ChevronLeft, Check, Info, AlertCircle,
  Zap, Shield, PiggyBank, Home, Car, Plane, GraduationCap,
  Heart, Gift, Briefcase, Trophy, Star, ArrowRight,
  Calculator, BarChart3, Lock, Unlock, Eye, EyeOff
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  getGoalTheme, 
  getHybridTheme,
  WorkflowTheme 
} from '@/lib/design-system/workflow-visual-system'
import type { AIAction } from '@/hooks/use-app-state'

interface GoalCreationFlowProps {
  fromAction?: AIAction
  onComplete: (goal: GoalConfiguration) => void
  onCancel: () => void
  profile?: string
  className?: string
}

interface GoalConfiguration {
  title: string
  category: GoalCategory
  targetAmount: number
  monthlyContribution: number
  timeframe: number // months
  priority: 'low' | 'medium' | 'high'
  automationEnabled: boolean
  milestones: Milestone[]
  linkedWorkflows: string[]
  visualPreferences: VisualPreferences
}

interface Milestone {
  id: string
  title: string
  amount: number
  date: Date
  reward?: string
}

interface VisualPreferences {
  icon: string
  color: string
  celebrationStyle: 'confetti' | 'fireworks' | 'pulse' | 'minimal'
}

type GoalCategory = 
  | 'emergency_fund'
  | 'vacation'
  | 'home'
  | 'car'
  | 'education'
  | 'retirement'
  | 'wedding'
  | 'gift'
  | 'investment'
  | 'custom'

type FlowStep = 
  | 'intro'
  | 'category'
  | 'amount'
  | 'timeline'
  | 'automation'
  | 'milestones'
  | 'review'
  | 'success'

const GOAL_CATEGORIES: Array<{
  id: GoalCategory
  title: string
  description: string
  icon: React.FC<any>
  suggestedAmount: number
  suggestedTimeframe: number
  color: string
}> = [
  {
    id: 'emergency_fund',
    title: 'Emergency Fund',
    description: 'Build financial security',
    icon: Shield,
    suggestedAmount: 10000,
    suggestedTimeframe: 12,
    color: '#3b82f6'
  },
  {
    id: 'vacation',
    title: 'Dream Vacation',
    description: 'Plan your perfect getaway',
    icon: Plane,
    suggestedAmount: 5000,
    suggestedTimeframe: 8,
    color: '#06b6d4'
  },
  {
    id: 'home',
    title: 'Home Down Payment',
    description: 'Save for your dream home',
    icon: Home,
    suggestedAmount: 50000,
    suggestedTimeframe: 36,
    color: '#10b981'
  },
  {
    id: 'car',
    title: 'New Car',
    description: 'Get your dream ride',
    icon: Car,
    suggestedAmount: 20000,
    suggestedTimeframe: 24,
    color: '#f59e0b'
  },
  {
    id: 'education',
    title: 'Education',
    description: 'Invest in learning',
    icon: GraduationCap,
    suggestedAmount: 15000,
    suggestedTimeframe: 18,
    color: '#8b5cf6'
  },
  {
    id: 'retirement',
    title: 'Retirement',
    description: 'Secure your future',
    icon: PiggyBank,
    suggestedAmount: 100000,
    suggestedTimeframe: 120,
    color: '#ec4899'
  },
  {
    id: 'wedding',
    title: 'Wedding',
    description: 'Plan your special day',
    icon: Heart,
    suggestedAmount: 30000,
    suggestedTimeframe: 18,
    color: '#f472b6'
  },
  {
    id: 'gift',
    title: 'Special Gift',
    description: 'Save for something special',
    icon: Gift,
    suggestedAmount: 2000,
    suggestedTimeframe: 6,
    color: '#ef4444'
  },
  {
    id: 'investment',
    title: 'Investment Fund',
    description: 'Build wealth over time',
    icon: TrendingUp,
    suggestedAmount: 25000,
    suggestedTimeframe: 24,
    color: '#84cc16'
  }
]

export default function GoalCreationFlow({
  fromAction,
  onComplete,
  onCancel,
  profile = 'millennial',
  className
}: GoalCreationFlowProps) {
  const [currentStep, setCurrentStep] = useState<FlowStep>('intro')
  const [goalConfig, setGoalConfig] = useState<Partial<GoalConfiguration>>({
    title: fromAction?.title || '',
    targetAmount: fromAction?.potentialSaving ? fromAction.potentialSaving * 12 : 5000,
    monthlyContribution: fromAction?.potentialSaving || 500,
    timeframe: 12,
    priority: 'medium',
    automationEnabled: true,
    milestones: [],
    linkedWorkflows: fromAction?.id ? [fromAction.id] : [],
    visualPreferences: {
      icon: 'Target',
      color: '#ec4899',
      celebrationStyle: 'confetti'
    }
  })
  
  const [animationPhase, setAnimationPhase] = useState<'entering' | 'active' | 'exiting'>('entering')
  const theme = fromAction ? getHybridTheme() : getGoalTheme()
  
  // Progress through flow
  const flowSteps: FlowStep[] = ['intro', 'category', 'amount', 'timeline', 'automation', 'milestones', 'review', 'success']
  const currentStepIndex = flowSteps.indexOf(currentStep)
  const progress = ((currentStepIndex + 1) / flowSteps.length) * 100
  
  // Handle step navigation
  const goToNextStep = () => {
    const nextIndex = currentStepIndex + 1
    if (nextIndex < flowSteps.length) {
      setAnimationPhase('exiting')
      setTimeout(() => {
        setCurrentStep(flowSteps[nextIndex])
        setAnimationPhase('entering')
        setTimeout(() => setAnimationPhase('active'), 50)
      }, 300)
    }
  }
  
  const goToPreviousStep = () => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setAnimationPhase('exiting')
      setTimeout(() => {
        setCurrentStep(flowSteps[prevIndex])
        setAnimationPhase('entering')
        setTimeout(() => setAnimationPhase('active'), 50)
      }, 300)
    }
  }
  
  // Auto-generate milestones
  const generateMilestones = () => {
    const totalMonths = goalConfig.timeframe || 12
    const targetAmount = goalConfig.targetAmount || 5000
    const milestones: Milestone[] = []
    
    // 25% milestone
    if (totalMonths >= 3) {
      milestones.push({
        id: 'milestone-25',
        title: 'Quarter Way There!',
        amount: targetAmount * 0.25,
        date: new Date(Date.now() + (totalMonths * 0.25 * 30 * 24 * 60 * 60 * 1000)),
        reward: 'Celebrate with a small treat'
      })
    }
    
    // 50% milestone
    if (totalMonths >= 6) {
      milestones.push({
        id: 'milestone-50',
        title: 'Halfway to Your Goal!',
        amount: targetAmount * 0.5,
        date: new Date(Date.now() + (totalMonths * 0.5 * 30 * 24 * 60 * 60 * 1000)),
        reward: 'Share your progress with friends'
      })
    }
    
    // 75% milestone
    if (totalMonths >= 9) {
      milestones.push({
        id: 'milestone-75',
        title: 'Almost There!',
        amount: targetAmount * 0.75,
        date: new Date(Date.now() + (totalMonths * 0.75 * 30 * 24 * 60 * 60 * 1000)),
        reward: 'Plan for goal completion'
      })
    }
    
    // 100% milestone
    milestones.push({
      id: 'milestone-100',
      title: 'Goal Achieved!',
      amount: targetAmount,
      date: new Date(Date.now() + (totalMonths * 30 * 24 * 60 * 60 * 1000)),
      reward: 'Enjoy your accomplishment!'
    })
    
    setGoalConfig(prev => ({ ...prev, milestones }))
  }
  
  // Initialize milestones
  useEffect(() => {
    if (currentStep === 'milestones' && (!goalConfig.milestones || goalConfig.milestones.length === 0)) {
      generateMilestones()
    }
  }, [currentStep])
  
  // Complete goal creation
  const handleComplete = () => {
    if (!goalConfig.title || !goalConfig.category) return
    
    const completeGoal: GoalConfiguration = {
      title: goalConfig.title,
      category: goalConfig.category as GoalCategory,
      targetAmount: goalConfig.targetAmount || 5000,
      monthlyContribution: goalConfig.monthlyContribution || 500,
      timeframe: goalConfig.timeframe || 12,
      priority: goalConfig.priority || 'medium',
      automationEnabled: goalConfig.automationEnabled || false,
      milestones: goalConfig.milestones || [],
      linkedWorkflows: goalConfig.linkedWorkflows || [],
      visualPreferences: goalConfig.visualPreferences || {
        icon: 'Target',
        color: '#ec4899',
        celebrationStyle: 'confetti'
      }
    }
    
    setCurrentStep('success')
    setTimeout(() => {
      onComplete(completeGoal)
    }, 3000)
  }
  
  return (
    <div className={cn("w-full max-w-2xl mx-auto", className)}>
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold text-white">
            {fromAction ? 'Convert to Smart Goal' : 'Create Your Goal'}
          </h2>
          <Badge variant="outline" className="text-xs">
            Step {currentStepIndex + 1} of {flowSteps.length}
          </Badge>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
      
      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: animationPhase === 'active' ? 1 : 0,
            y: animationPhase === 'active' ? 0 : 20
          }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="min-h-[400px]"
        >
          {/* Intro Step */}
          {currentStep === 'intro' && (
            <IntroStep 
              theme={theme}
              fromAction={fromAction}
              onNext={goToNextStep}
              onCancel={onCancel}
            />
          )}
          
          {/* Category Selection */}
          {currentStep === 'category' && (
            <CategoryStep
              theme={theme}
              selectedCategory={goalConfig.category as GoalCategory}
              onSelect={(category) => {
                const categoryData = GOAL_CATEGORIES.find(c => c.id === category)
                setGoalConfig(prev => ({
                  ...prev,
                  category,
                  title: prev.title || categoryData?.title || '',
                  targetAmount: categoryData?.suggestedAmount || prev.targetAmount,
                  timeframe: categoryData?.suggestedTimeframe || prev.timeframe,
                  visualPreferences: {
                    ...prev.visualPreferences!,
                    color: categoryData?.color || prev.visualPreferences?.color || '#ec4899'
                  }
                }))
                goToNextStep()
              }}
              onBack={goToPreviousStep}
            />
          )}
          
          {/* Amount Configuration */}
          {currentStep === 'amount' && (
            <AmountStep
              theme={theme}
              targetAmount={goalConfig.targetAmount || 5000}
              monthlyContribution={goalConfig.monthlyContribution || 500}
              onUpdate={(amount, monthly) => {
                setGoalConfig(prev => ({
                  ...prev,
                  targetAmount: amount,
                  monthlyContribution: monthly,
                  timeframe: Math.ceil(amount / monthly)
                }))
              }}
              onNext={goToNextStep}
              onBack={goToPreviousStep}
            />
          )}
          
          {/* Timeline Configuration */}
          {currentStep === 'timeline' && (
            <TimelineStep
              theme={theme}
              timeframe={goalConfig.timeframe || 12}
              targetAmount={goalConfig.targetAmount || 5000}
              monthlyContribution={goalConfig.monthlyContribution || 500}
              onUpdate={(timeframe) => {
                setGoalConfig(prev => ({
                  ...prev,
                  timeframe,
                  monthlyContribution: Math.ceil((prev.targetAmount || 5000) / timeframe)
                }))
              }}
              onNext={goToNextStep}
              onBack={goToPreviousStep}
            />
          )}
          
          {/* Automation Settings */}
          {currentStep === 'automation' && (
            <AutomationStep
              theme={theme}
              enabled={goalConfig.automationEnabled || false}
              linkedWorkflows={goalConfig.linkedWorkflows || []}
              fromAction={fromAction}
              onUpdate={(enabled, workflows) => {
                setGoalConfig(prev => ({
                  ...prev,
                  automationEnabled: enabled,
                  linkedWorkflows: workflows
                }))
              }}
              onNext={goToNextStep}
              onBack={goToPreviousStep}
            />
          )}
          
          {/* Milestones */}
          {currentStep === 'milestones' && (
            <MilestonesStep
              theme={theme}
              milestones={goalConfig.milestones || []}
              onUpdate={(milestones) => {
                setGoalConfig(prev => ({ ...prev, milestones }))
              }}
              onNext={goToNextStep}
              onBack={goToPreviousStep}
            />
          )}
          
          {/* Review */}
          {currentStep === 'review' && (
            <ReviewStep
              theme={theme}
              goalConfig={goalConfig as GoalConfiguration}
              onConfirm={handleComplete}
              onBack={goToPreviousStep}
            />
          )}
          
          {/* Success */}
          {currentStep === 'success' && (
            <SuccessStep
              theme={theme}
              goalConfig={goalConfig as GoalConfiguration}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// Step Components
function IntroStep({ 
  theme, 
  fromAction, 
  onNext, 
  onCancel 
}: { 
  theme: WorkflowTheme
  fromAction?: AIAction
  onNext: () => void
  onCancel: () => void
}) {
  return (
    <div className="text-center py-12">
      <motion.div
        className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 100%)`
        }}
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      >
        <Target className="w-12 h-12 text-white" />
      </motion.div>
      
      <h3 className="text-2xl font-bold text-white mb-4">
        {fromAction 
          ? `Transform "${fromAction.title}" into a Goal`
          : 'Set Your Financial Goal'
        }
      </h3>
      
      <p className="text-gray-400 mb-8 max-w-md mx-auto">
        {fromAction
          ? `Let's convert your workflow into a trackable goal with milestones and celebrations. Your monthly savings of $${fromAction.potentialSaving} will help you reach your target.`
          : 'Create a personalized savings goal with smart automation, milestones, and rewards to keep you motivated.'
        }
      </p>
      
      {fromAction && (
        <div className="bg-gradient-to-br from-emerald-500/10 to-purple-500/10 border border-emerald-500/30 rounded-lg p-4 mb-8 max-w-md mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">From Workflow</span>
            <Badge className="text-xs bg-emerald-600">
              +${fromAction.potentialSaving}/mo
            </Badge>
          </div>
          <p className="text-left text-white font-medium">{fromAction.title}</p>
        </div>
      )}
      
      <div className="flex gap-4 max-w-xs mx-auto">
        <Button
          variant="outline"
          onClick={onCancel}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          onClick={onNext}
          className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
        >
          Get Started
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function CategoryStep({
  theme,
  selectedCategory,
  onSelect,
  onBack
}: {
  theme: WorkflowTheme
  selectedCategory?: GoalCategory
  onSelect: (category: GoalCategory) => void
  onBack: () => void
}) {
  return (
    <div>
      <h3 className="text-xl font-semibold text-white mb-6">
        What are you saving for?
      </h3>
      
      <div className="grid grid-cols-3 gap-4 mb-8">
        {GOAL_CATEGORIES.map((category) => {
          const Icon = category.icon
          const isSelected = selectedCategory === category.id
          
          return (
            <motion.button
              key={category.id}
              className={cn(
                "p-4 rounded-lg border-2 transition-all",
                isSelected
                  ? "border-pink-500 bg-pink-500/20"
                  : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(category.id)}
            >
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3"
                style={{ background: category.color + '20' }}
              >
                <Icon className="w-6 h-6" style={{ color: category.color }} />
              </div>
              <h4 className="font-medium text-white text-sm mb-1">
                {category.title}
              </h4>
              <p className="text-xs text-gray-400">
                {category.description}
              </p>
              <div className="mt-2 text-xs text-gray-500">
                Suggested: ${category.suggestedAmount.toLocaleString()}
              </div>
            </motion.button>
          )
        })}
      </div>
      
      <div className="flex gap-4">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>
    </div>
  )
}

function AmountStep({
  theme,
  targetAmount,
  monthlyContribution,
  onUpdate,
  onNext,
  onBack
}: {
  theme: WorkflowTheme
  targetAmount: number
  monthlyContribution: number
  onUpdate: (amount: number, monthly: number) => void
  onNext: () => void
  onBack: () => void
}) {
  const [amount, setAmount] = useState(targetAmount)
  const [monthly, setMonthly] = useState(monthlyContribution)
  const timeToGoal = Math.ceil(amount / monthly)
  
  return (
    <div>
      <h3 className="text-xl font-semibold text-white mb-6">
        Set your target amount
      </h3>
      
      <div className="space-y-6 mb-8">
        {/* Target Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Goal Amount
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
            <Input
              type="number"
              value={amount}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 0
                setAmount(val)
                onUpdate(val, monthly)
              }}
              className="pl-10 text-lg"
              min={100}
              max={1000000}
            />
          </div>
          <Slider
            value={[amount]}
            onValueChange={([val]) => {
              setAmount(val)
              onUpdate(val, monthly)
            }}
            min={100}
            max={100000}
            step={100}
            className="mt-3"
          />
        </div>
        
        {/* Monthly Contribution */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Monthly Contribution
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
            <Input
              type="number"
              value={monthly}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 0
                setMonthly(val)
                onUpdate(amount, val)
              }}
              className="pl-10 text-lg"
              min={10}
              max={10000}
            />
          </div>
          <Slider
            value={[monthly]}
            onValueChange={([val]) => {
              setMonthly(val)
              onUpdate(amount, val)
            }}
            min={10}
            max={5000}
            step={10}
            className="mt-3"
          />
        </div>
        
        {/* Projection */}
        <div className="bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-pink-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Time to Goal</span>
            <span className="text-2xl font-bold text-pink-400">
              {timeToGoal} {timeToGoal === 1 ? 'month' : 'months'}
            </span>
          </div>
          <div className="text-xs text-gray-500">
            {timeToGoal < 12 
              ? 'Great! You\'ll reach your goal in less than a year'
              : timeToGoal < 24
              ? 'Nice! A steady pace to your goal'
              : 'Long-term goals build lasting habits'
            }
          </div>
        </div>
      </div>
      
      <div className="flex gap-4">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={onNext}
          className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
        >
          Continue
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function TimelineStep({
  theme,
  timeframe,
  targetAmount,
  monthlyContribution,
  onUpdate,
  onNext,
  onBack
}: {
  theme: WorkflowTheme
  timeframe: number
  targetAmount: number
  monthlyContribution: number
  onUpdate: (timeframe: number) => void
  onNext: () => void
  onBack: () => void
}) {
  const [months, setMonths] = useState(timeframe)
  const adjustedMonthly = Math.ceil(targetAmount / months)
  
  return (
    <div>
      <h3 className="text-xl font-semibold text-white mb-6">
        When do you want to achieve this goal?
      </h3>
      
      <div className="space-y-6 mb-8">
        {/* Timeline Slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-400">
              Timeline
            </label>
            <span className="text-lg font-semibold text-white">
              {months} months
            </span>
          </div>
          <Slider
            value={[months]}
            onValueChange={([val]) => {
              setMonths(val)
              onUpdate(val)
            }}
            min={1}
            max={60}
            step={1}
            className="mb-3"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>1 month</span>
            <span>1 year</span>
            <span>2 years</span>
            <span>3 years</span>
            <span>5 years</span>
          </div>
        </div>
        
        {/* Visual Timeline */}
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="text-center">
              <Calendar className="h-8 w-8 text-pink-400 mx-auto mb-2" />
              <div className="text-xs text-gray-400">Start</div>
              <div className="text-sm font-medium text-white">Today</div>
            </div>
            
            <div className="flex-1 mx-4">
              <div className="h-1 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full" />
            </div>
            
            <div className="text-center">
              <Trophy className="h-8 w-8 text-purple-400 mx-auto mb-2" />
              <div className="text-xs text-gray-400">Goal</div>
              <div className="text-sm font-medium text-white">
                {new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
                  month: 'short', 
                  year: 'numeric' 
                })}
              </div>
            </div>
          </div>
          
          {/* Monthly Contribution Update */}
          <div className="border-t border-gray-700 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Adjusted Monthly Contribution</span>
              <span className="text-xl font-bold text-green-400">
                ${adjustedMonthly}/mo
              </span>
            </div>
            {adjustedMonthly !== monthlyContribution && (
              <div className="text-xs text-yellow-400 mt-1">
                Updated from ${monthlyContribution}/mo to meet timeline
              </div>
            )}
          </div>
        </div>
        
        {/* Quick Options */}
        <div className="grid grid-cols-4 gap-2">
          {[3, 6, 12, 24].map((m) => (
            <Button
              key={m}
              variant={months === m ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setMonths(m)
                onUpdate(m)
              }}
            >
              {m < 12 ? `${m} mo` : `${m/12} yr`}
            </Button>
          ))}
        </div>
      </div>
      
      <div className="flex gap-4">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={onNext}
          className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
        >
          Continue
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function AutomationStep({
  theme,
  enabled,
  linkedWorkflows,
  fromAction,
  onUpdate,
  onNext,
  onBack
}: {
  theme: WorkflowTheme
  enabled: boolean
  linkedWorkflows: string[]
  fromAction?: AIAction
  onUpdate: (enabled: boolean, workflows: string[]) => void
  onNext: () => void
  onBack: () => void
}) {
  const [isEnabled, setIsEnabled] = useState(enabled)
  
  return (
    <div>
      <h3 className="text-xl font-semibold text-white mb-6">
        Automate your savings
      </h3>
      
      <div className="space-y-6 mb-8">
        {/* Automation Toggle */}
        <motion.div
          className={cn(
            "p-6 rounded-lg border-2 cursor-pointer transition-all",
            isEnabled
              ? "border-emerald-500 bg-emerald-500/10"
              : "border-gray-700 bg-gray-800/50"
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setIsEnabled(!isEnabled)
            onUpdate(!isEnabled, linkedWorkflows)
          }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{
                  background: isEnabled 
                    ? 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)'
                    : '#374151'
                }}
              >
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-medium text-white mb-1">
                  Smart Automation
                </h4>
                <p className="text-sm text-gray-400 mb-3">
                  Automatically save money from optimizations and workflows
                </p>
                {isEnabled && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-emerald-400">
                      <Check className="w-3 h-3" />
                      <span>Auto-transfer savings to goal</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-emerald-400">
                      <Check className="w-3 h-3" />
                      <span>Round-up transactions</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-emerald-400">
                      <Check className="w-3 h-3" />
                      <span>Sweep excess funds</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div
              className={cn(
                "w-12 h-6 rounded-full relative transition-all",
                isEnabled ? "bg-emerald-600" : "bg-gray-600"
              )}
            >
              <motion.div
                className="w-5 h-5 bg-white rounded-full absolute top-0.5"
                animate={{ x: isEnabled ? 24 : 2 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </div>
          </div>
        </motion.div>
        
        {/* Linked Workflow */}
        {fromAction && (
          <div className="bg-gradient-to-br from-emerald-500/10 to-purple-500/10 border border-emerald-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Linked Workflow</span>
              <Badge className="text-xs bg-emerald-600">
                +${fromAction.potentialSaving}/mo
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="font-medium text-white">{fromAction.title}</p>
                <p className="text-xs text-gray-400">
                  Savings will automatically contribute to this goal
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Automation Benefits */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800/50 rounded-lg p-4 text-center">
            <TrendingUp className="h-8 w-8 text-blue-400 mx-auto mb-2" />
            <div className="text-sm font-medium text-white mb-1">23% Faster</div>
            <div className="text-xs text-gray-400">Average time saved</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4 text-center">
            <Shield className="h-8 w-8 text-green-400 mx-auto mb-2" />
            <div className="text-sm font-medium text-white mb-1">87% Success</div>
            <div className="text-xs text-gray-400">Completion rate</div>
          </div>
        </div>
      </div>
      
      <div className="flex gap-4">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={onNext}
          className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
        >
          Continue
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function MilestonesStep({
  theme,
  milestones,
  onUpdate,
  onNext,
  onBack
}: {
  theme: WorkflowTheme
  milestones: Milestone[]
  onUpdate: (milestones: Milestone[]) => void
  onNext: () => void
  onBack: () => void
}) {
  return (
    <div>
      <h3 className="text-xl font-semibold text-white mb-6">
        Set milestones to celebrate
      </h3>
      
      <div className="space-y-4 mb-8">
        {milestones.map((milestone, index) => (
          <motion.div
            key={milestone.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-800/50 rounded-lg p-4"
          >
            <div className="flex items-start gap-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 100%)`,
                  opacity: milestone.amount === milestones[milestones.length - 1].amount ? 1 : 0.7
                }}
              >
                {milestone.amount === milestones[milestones.length - 1].amount ? (
                  <Trophy className="w-5 h-5 text-white" />
                ) : (
                  <Star className="w-5 h-5 text-white" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium text-white">{milestone.title}</h4>
                  <span className="text-sm font-semibold text-green-400">
                    ${milestone.amount.toLocaleString()}
                  </span>
                </div>
                <div className="text-xs text-gray-400 mb-2">
                  {milestone.date.toLocaleDateString('en-US', { 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </div>
                {milestone.reward && (
                  <div className="flex items-center gap-2 text-xs text-purple-400">
                    <Gift className="w-3 h-3" />
                    <span>{milestone.reward}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="flex gap-4">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={onNext}
          className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
        >
          Continue
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function ReviewStep({
  theme,
  goalConfig,
  onConfirm,
  onBack
}: {
  theme: WorkflowTheme
  goalConfig: GoalConfiguration
  onConfirm: () => void
  onBack: () => void
}) {
  const category = GOAL_CATEGORIES.find(c => c.id === goalConfig.category)
  const Icon = category?.icon || Target
  
  return (
    <div>
      <h3 className="text-xl font-semibold text-white mb-6">
        Review your goal
      </h3>
      
      <div className="bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-pink-500/30 rounded-lg p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div
            className="w-16 h-16 rounded-lg flex items-center justify-center"
            style={{ background: category?.color || theme.colors.primary }}
          >
            <Icon className="w-8 h-8 text-white" />
          </div>
          <div>
            <h4 className="text-xl font-bold text-white">{goalConfig.title}</h4>
            <p className="text-sm text-gray-400">{category?.description}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-xs text-gray-400 mb-1">Target Amount</div>
            <div className="text-lg font-semibold text-white">
              ${goalConfig.targetAmount.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">Monthly Contribution</div>
            <div className="text-lg font-semibold text-green-400">
              ${goalConfig.monthlyContribution}/mo
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">Timeline</div>
            <div className="text-lg font-semibold text-white">
              {goalConfig.timeframe} months
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">Automation</div>
            <div className="text-lg font-semibold text-white">
              {goalConfig.automationEnabled ? (
                <span className="text-emerald-400">Enabled</span>
              ) : (
                <span className="text-gray-400">Disabled</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-700 pt-4">
          <div className="text-xs text-gray-400 mb-2">Milestones</div>
          <div className="flex gap-2">
            {goalConfig.milestones.map((milestone, index) => (
              <div
                key={milestone.id}
                className="flex-1 h-2 rounded-full"
                style={{
                  background: index === goalConfig.milestones.length - 1
                    ? `linear-gradient(90deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 100%)`
                    : theme.colors.background
                }}
              />
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex gap-4">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={onConfirm}
          className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
        >
          Create Goal
          <Check className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function SuccessStep({
  theme,
  goalConfig
}: {
  theme: WorkflowTheme
  goalConfig: GoalConfiguration
}) {
  return (
    <div className="text-center py-12">
      <motion.div
        className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 100%)`
        }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20
        }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Check className="w-12 h-12 text-white" />
        </motion.div>
      </motion.div>
      
      <motion.h3
        className="text-2xl font-bold text-white mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        Goal Created Successfully!
      </motion.h3>
      
      <motion.p
        className="text-gray-400 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        Your journey to ${goalConfig.targetAmount.toLocaleString()} begins now
      </motion.p>
      
      {/* Celebration Animation */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              background: theme.colors.primary,
              left: '50%',
              top: '50%'
            }}
            animate={{
              x: [0, Math.cos(i * 30 * Math.PI / 180) * 200],
              y: [0, Math.sin(i * 30 * Math.PI / 180) * 200],
              opacity: [1, 0],
              scale: [0, 2]
            }}
            transition={{
              duration: 1.5,
              ease: 'easeOut',
              delay: 0.5 + i * 0.05
            }}
          />
        ))}
      </motion.div>
    </div>
  )
}