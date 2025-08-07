"use client"

import type { AutomationAction, WorkflowStep } from "@/lib/data"
import { 
  Bot, Check, RefreshCw, Clock, AlertCircle, ChevronDown, ChevronUp, 
  Play, Pause, Settings, User, Zap, Shield, TrendingUp, DollarSign,
  Activity, Target, AlertTriangle, Info, ExternalLink, Lock, Unlock,
  Calendar, Timer, BarChart3, Sparkles, ArrowRight, ArrowDown,
  Eye, EyeOff, Star, Award, TrendingDown, Percent, Users, Globe,
  Smartphone, Monitor, CreditCard, PiggyBank, Home, Car, Plane
} from "lucide-react"
import GlassCard from "./glass-card"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { Button } from "./button"
import { Badge } from "./badge"
import { Progress } from "./progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip"

interface AutomationStatusCardProps {
  automation: AutomationAction
  profile?: string
  showDetails?: boolean
  onUserAction?: (stepId: string, action: string) => void
  onPause?: () => void
  onResume?: () => void
  onConfigure?: () => void
  onActivate?: () => void
  onAddAsGoal?: () => void
  isActivated?: boolean
  scenario?: string
}

interface EnhancedWorkflowStep extends WorkflowStep {
  confidence: number
  agentDetails: {
    name: string
    type: "automated" | "semi-automated" | "manual"
    capabilities: string[]
    successRate: number
    avatar?: string
    specializations: string[]
  }
  metrics: {
    timeElapsed: number
    timeRemaining: number
    apiCalls: number
    dataProcessed: string
    successRate: number
    errorRate: number
  }
  risks: {
    level: "low" | "medium" | "high"
    description: string
    mitigation: string
    probability: number
  }
  impact: {
    immediate: number
    projected: number
    goalProgress: number
    riskReduction: number
    timeSaved: number
  }
  dependencies: string[]
  prerequisites: string[]
  rollbackPlan: {
    available: boolean
    steps: string[]
    impact: string
    timeToRollback: string
  }
}

export default function AutomationStatusCard({ 
  automation, 
  profile = "millennial", 
  showDetails = false,
  onUserAction,
  onPause,
  onResume,
  onConfigure,
  onActivate,
  onAddAsGoal,
  isActivated = false,
  scenario = "general"
}: AutomationStatusCardProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set())
  const [showAllDetails, setShowAllDetails] = useState(showDetails)
  const [realTimeProgress, setRealTimeProgress] = useState<Record<string, number>>({})
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false)
  const [selectedStep, setSelectedStep] = useState<string | null>(null)

  // Enhanced step data with realistic workflow information
  const getEnhancedSteps = (): EnhancedWorkflowStep[] => {
    const baseSteps = automation.steps.map((step, index) => ({
      ...step,
      confidence: getStepConfidence(step.name, automation.title, profile, scenario),
      agentDetails: getAgentDetails(step.name, automation.title, profile, scenario),
      metrics: getStepMetrics(step.name, step.status, index, profile),
      risks: getStepRisks(step.name, automation.title, profile, scenario),
      impact: getStepImpact(step.name, automation.title, profile, scenario),
      dependencies: getStepDependencies(step.name, automation.title),
      prerequisites: getStepPrerequisites(step.name, automation.title),
      rollbackPlan: getRollbackPlan(step.name, automation.title)
    }))

    return baseSteps
  }

  const getStepConfidence = (stepName: string, automationTitle: string, profile: string, scenario: string): number => {
    const baseConfidence = {
      "Review subscription list": 95,
      "Cancel unused services": 88,
      "Set up usage tracking": 92,
      "Monthly review process": 85,
      "Contact service providers": 78,
      "Present competitor offers": 82,
      "Negotiate new rates": 75,
      "Confirm changes": 90,
      "Research high-yield accounts": 88,
      "Open new account": 85,
      "Set up automatic transfers": 92,
      "Monitor monthly": 95,
      "Calculate 6-month expenses": 98,
      "Set up automatic savings": 90,
      "Review current allocation": 85,
      "Rebalance portfolio": 80,
      "Set up automatic rebalancing": 88,
      "List debts by interest rate": 95,
      "Calculate payment strategy": 90,
      "Set up automatic payments": 92
    }

    let confidence = baseConfidence[stepName as keyof typeof baseConfidence] || 80

    // Adjust based on profile
    if (profile === "genz") {
      confidence += 5 // Gen Z tends to be more tech-savvy
    } else if (profile === "boomer") {
      confidence -= 10 // Older users may need more assistance
    } else if (profile === "millennial") {
      confidence += 2 // Millennials are generally tech-comfortable
    }

    // Adjust based on scenario
    if (scenario === "emergency") {
      confidence -= 5 // Emergency scenarios may have more urgency and complexity
    } else if (scenario === "optimization") {
      confidence += 3 // Optimization scenarios are typically well-defined
    }

    return Math.min(100, Math.max(0, confidence))
  }

  const getAgentDetails = (stepName: string, automationTitle: string, profile: string, scenario: string) => {
    const agents = {
      "Review subscription list": {
        name: "SpendingAnalyzer",
        type: "automated" as const,
        capabilities: ["Transaction analysis", "Pattern recognition", "Waste detection"],
        successRate: 94,
        avatar: "🤖",
        specializations: ["Subscription optimization", "Spending analysis", "Cost reduction"]
      },
      "Cancel unused services": {
        name: "QuickSaver",
        type: "semi-automated" as const,
        capabilities: ["Provider communication", "Cancellation automation", "Refund tracking"],
        successRate: 87,
        avatar: "⚡",
        specializations: ["Service cancellation", "Provider negotiation", "Refund recovery"]
      },
      "Set up usage tracking": {
        name: "AutomationBuilder",
        type: "automated" as const,
        capabilities: ["Alert configuration", "Monitoring setup", "Threshold management"],
        successRate: 96,
        avatar: "🔧",
        specializations: ["Automation setup", "Monitoring configuration", "Alert management"]
      },
      "Contact service providers": {
        name: "BillNegotiator",
        type: "semi-automated" as const,
        capabilities: ["Provider research", "Rate comparison", "Negotiation scripts"],
        successRate: 73,
        avatar: "📞",
        specializations: ["Provider communication", "Rate negotiation", "Customer service"]
      },
      "Negotiate new rates": {
        name: "RetentionSpecialist",
        type: "manual" as const,
        capabilities: ["Human negotiation", "Escalation handling", "Rate verification"],
        successRate: 68,
        avatar: "👤",
        specializations: ["Human negotiation", "Escalation management", "Rate optimization"]
      },
      "Research high-yield accounts": {
        name: "AccountFinder",
        type: "automated" as const,
        capabilities: ["Rate comparison", "Feature analysis", "Risk assessment"],
        successRate: 91,
        avatar: "🔍",
        specializations: ["Account research", "Rate comparison", "Feature analysis"]
      },
      "Open new account": {
        name: "AccountOpener",
        type: "semi-automated" as const,
        capabilities: ["Application automation", "Document collection", "Verification assistance"],
        successRate: 82,
        avatar: "📋",
        specializations: ["Account opening", "Documentation", "Verification"]
      },
      "Set up automatic transfers": {
        name: "TransferScheduler",
        type: "automated" as const,
        capabilities: ["ACH setup", "Recurring transfers", "Balance monitoring"],
        successRate: 94,
        avatar: "💸",
        specializations: ["Transfer automation", "ACH setup", "Recurring payments"]
      },
      "Calculate 6-month expenses": {
        name: "ExpenseCalculator",
        type: "automated" as const,
        capabilities: ["Expense analysis", "Category aggregation", "Emergency fund calculation"],
        successRate: 97,
        avatar: "🧮",
        specializations: ["Expense analysis", "Emergency fund planning", "Budget calculation"]
      },
      "Set up automatic savings": {
        name: "SavingsBuilder",
        type: "automated" as const,
        capabilities: ["Rule creation", "Goal tracking", "Progress monitoring"],
        successRate: 93,
        avatar: "🏦",
        specializations: ["Savings automation", "Goal tracking", "Progress monitoring"]
      },
      "Review current allocation": {
        name: "PortfolioAnalyzer",
        type: "automated" as const,
        capabilities: ["Asset allocation analysis", "Risk assessment", "Performance tracking"],
        successRate: 89,
        avatar: "📊",
        specializations: ["Portfolio analysis", "Risk assessment", "Performance tracking"]
      },
      "Rebalance portfolio": {
        name: "Rebalancer",
        type: "semi-automated" as const,
        capabilities: ["Trade execution", "Allocation adjustment", "Cost optimization"],
        successRate: 85,
        avatar: "⚖️",
        specializations: ["Portfolio rebalancing", "Trade execution", "Cost optimization"]
      },
      "List debts by interest rate": {
        name: "DebtOrganizer",
        type: "automated" as const,
        capabilities: ["Debt aggregation", "Interest rate analysis", "Payment optimization"],
        successRate: 96,
        avatar: "📋",
        specializations: ["Debt organization", "Interest rate analysis", "Payment optimization"]
      },
      "Calculate payment strategy": {
        name: "PaymentOptimizer",
        type: "automated" as const,
        capabilities: ["Avalanche vs snowball", "Payment scheduling", "Interest savings calculation"],
        successRate: 92,
        avatar: "🎯",
        specializations: ["Payment strategy", "Debt optimization", "Interest savings"]
      },
      "Set up automatic payments": {
        name: "PaymentScheduler",
        type: "automated" as const,
        capabilities: ["Payment automation", "Extra payment setup", "Progress tracking"],
        successRate: 94,
        avatar: "⏰",
        specializations: ["Payment automation", "Scheduling", "Progress tracking"]
      }
    }

    return agents[stepName as keyof typeof agents] || {
      name: "GeneralAgent",
      type: "automated" as const,
      capabilities: ["General automation"],
      successRate: 80,
      avatar: "🤖",
      specializations: ["General automation"]
    }
  }

  const getStepMetrics = (stepName: string, status: string, index: number, profile: string) => {
    const baseMetrics = {
      timeElapsed: status === "completed" ? getStepDuration(stepName) : 
                   status === "in_progress" ? Math.floor(getStepDuration(stepName) * 0.6) : 0,
      timeRemaining: status === "completed" ? 0 : 
                     status === "in_progress" ? Math.floor(getStepDuration(stepName) * 0.4) : getStepDuration(stepName),
      apiCalls: Math.floor(Math.random() * 5) + 1,
      dataProcessed: `${Math.floor(Math.random() * 1000) + 100}KB`,
      successRate: getAgentDetails(stepName, "", profile, "").successRate,
      errorRate: Math.max(0, 100 - getAgentDetails(stepName, "", profile, "").successRate)
    }

    return baseMetrics
  }

  const getStepRisks = (stepName: string, automationTitle: string, profile: string, scenario: string) => {
    const risks = {
      "Cancel unused services": {
        level: "medium" as const,
        description: "Risk of cancelling services you might need later",
        mitigation: "30-day grace period and easy reactivation",
        probability: 15
      },
      "Negotiate new rates": {
        level: "high" as const,
        description: "Potential for service interruption during negotiation",
        mitigation: "Backup plan and service continuity guarantee",
        probability: 25
      },
      "Open new account": {
        level: "medium" as const,
        description: "Credit check and potential fees",
        mitigation: "Pre-qualification and fee-free account options",
        probability: 20
      },
      "Rebalance portfolio": {
        level: "medium" as const,
        description: "Market timing and transaction costs",
        mitigation: "Gradual rebalancing and cost optimization",
        probability: 18
      }
    }

    const baseRisk = risks[stepName as keyof typeof risks] || {
      level: "low" as const,
      description: "Standard automation risk",
      mitigation: "Rollback capability and monitoring",
      probability: 5
    }

    // Adjust risk based on profile
    if (profile === "boomer") {
      baseRisk.probability += 5 // Higher risk for older users
    } else if (profile === "genz") {
      baseRisk.probability -= 3 // Lower risk for tech-savvy users
    }

    return baseRisk
  }

  const getStepImpact = (stepName: string, automationTitle: string, profile: string, scenario: string) => {
    const impacts = {
      "Cancel unused services": {
        immediate: 25,
        projected: 300,
        goalProgress: 5,
        riskReduction: 2,
        timeSaved: 120
      },
      "Negotiate new rates": {
        immediate: 0,
        projected: 480,
        goalProgress: 8,
        riskReduction: 3,
        timeSaved: 180
      },
      "Set up automatic transfers": {
        immediate: 0,
        projected: 1200,
        goalProgress: 15,
        riskReduction: 5,
        timeSaved: 60
      },
      "Rebalance portfolio": {
        immediate: 0,
        projected: 600,
        goalProgress: 12,
        riskReduction: 8,
        timeSaved: 240
      }
    }

    return impacts[stepName as keyof typeof impacts] || {
      immediate: 0,
      projected: 100,
      goalProgress: 3,
      riskReduction: 1,
      timeSaved: 60
    }
  }

  const getStepDependencies = (stepName: string, automationTitle: string): string[] => {
    const dependencies = {
      "Cancel unused services": ["Review subscription list"],
      "Negotiate new rates": ["Contact service providers", "Present competitor offers"],
      "Set up automatic transfers": ["Open new account"],
      "Rebalance portfolio": ["Review current allocation"]
    }

    return dependencies[stepName as keyof typeof dependencies] || []
  }

  const getStepPrerequisites = (stepName: string, automationTitle: string): string[] => {
    const prerequisites = {
      "Cancel unused services": ["Account access", "Service list"],
      "Negotiate new rates": ["Current rates", "Competitor offers"],
      "Open new account": ["Identity verification", "Initial deposit"],
      "Rebalance portfolio": ["Current allocation", "Target allocation"]
    }

    return prerequisites[stepName as keyof typeof prerequisites] || []
  }

  const getRollbackPlan = (stepName: string, automationTitle: string) => {
    const rollbackPlans = {
      "Cancel unused services": {
        available: true,
        steps: ["Contact provider", "Request reactivation", "Verify service restored"],
        impact: "Service interruption for 24-48 hours",
        timeToRollback: "2-4 hours"
      },
      "Negotiate new rates": {
        available: true,
        steps: ["Contact provider", "Request rate restoration", "Verify billing"],
        impact: "Potential rate increase",
        timeToRollback: "1-2 hours"
      },
      "Open new account": {
        available: false,
        steps: ["Contact bank", "Close account", "Transfer funds"],
        impact: "Account closure fees and time",
        timeToRollback: "24-48 hours"
      }
    }

    return rollbackPlans[stepName as keyof typeof rollbackPlans] || {
      available: true,
      steps: ["Contact support", "Request reversal", "Verify changes"],
      impact: "Minimal impact",
      timeToRollback: "1-2 hours"
    }
  }

  const getStepDuration = (stepName: string): number => {
    const durations: Record<string, number> = {
      "Review subscription list": 45,
      "Cancel unused services": 120,
      "Set up usage tracking": 30,
      "Monthly review process": 15,
      "Contact service providers": 180,
      "Present competitor offers": 60,
      "Negotiate new rates": 300,
      "Confirm changes": 45,
      "Research high-yield accounts": 90,
      "Open new account": 240,
      "Set up automatic transfers": 60,
      "Monitor monthly": 30,
      "Calculate 6-month expenses": 60,
      "Set up automatic savings": 90,
      "Review current allocation": 120,
      "Rebalance portfolio": 180,
      "Set up automatic rebalancing": 60,
      "List debts by interest rate": 45,
      "Calculate payment strategy": 90,
      "Set up automatic payments": 120
    }
    return durations[stepName] || 60
  }

  const getEstimatedTime = (stepName: string): string => {
    const duration = getStepDuration(stepName)
    if (duration < 60) return `${duration}s`
    if (duration < 3600) return `${Math.round(duration / 60)}m`
    return `${Math.round(duration / 3600)}h`
  }

  const getIcon = (status: WorkflowStep["status"]) => {
    switch (status) {
      case "completed":
        return <Check className="h-4 w-4 text-green-400" />
      case "in_progress":
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-400" style={{ animationDuration: "2s" }} />
      case "waiting_user":
        return <User className="h-4 w-4 text-yellow-400" />
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-400" />
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-500" />
    }
  }

  const getStatusColor = (status: WorkflowStep["status"]) => {
    switch (status) {
      case "completed": return "text-green-400"
      case "in_progress": return "text-blue-400"
      case "waiting_user": return "text-yellow-400"
      case "failed": return "text-red-400"
      default: return "text-gray-500"
    }
  }

  const getProgressPercentage = () => {
    const steps = getEnhancedSteps()
    const completed = steps.filter(step => step.status === "completed").length
    return Math.round((completed / steps.length) * 100)
  }

  const getEstimatedCompletion = () => {
    const steps = getEnhancedSteps()
    const remainingSteps = steps.filter(step => step.status !== "completed")
    const totalRemainingTime = remainingSteps.reduce((sum, step) => sum + step.duration, 0)
    const minutes = Math.round(totalRemainingTime / 60)
    return minutes < 60 ? `${minutes}m remaining` : `${Math.round(minutes / 60)}h ${minutes % 60}m remaining`
  }

  const getOverallConfidence = () => {
    const steps = getEnhancedSteps()
    const totalConfidence = steps.reduce((sum, step) => sum + step.confidence, 0)
    return Math.round(totalConfidence / steps.length)
  }

  const getRiskLevel = () => {
    const steps = getEnhancedSteps()
    const riskCounts = { low: 0, medium: 0, high: 0 }
    steps.forEach(step => {
      riskCounts[step.risks.level]++
    })
    
    if (riskCounts.high > 0) return "high"
    if (riskCounts.medium > 0) return "medium"
    return "low"
  }

  const getProfileIcon = (profile: string) => {
    switch (profile) {
      case "genz": return <Smartphone className="h-4 w-4" />
      case "millennial": return <Monitor className="h-4 w-4" />
      case "boomer": return <Home className="h-4 w-4" />
      default: return <Users className="h-4 w-4" />
    }
  }

  const getScenarioIcon = (scenario: string) => {
    switch (scenario) {
      case "emergency": return <AlertTriangle className="h-4 w-4" />
      case "optimization": return <TrendingUp className="h-4 w-4" />
      case "growth": return <TrendingUp className="h-4 w-4" />
      case "protection": return <Shield className="h-4 w-4" />
      default: return <Target className="h-4 w-4" />
    }
  }

  const toggleStepExpansion = (stepId: string) => {
    const newExpanded = new Set(expandedSteps)
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId)
    } else {
      newExpanded.add(stepId)
    }
    setExpandedSteps(newExpanded)
  }

  const handleUserAction = (stepId: string, action: string) => {
    console.log(`User action for ${stepId}: ${action}`)
    onUserAction?.(stepId, action)
  }

  // Simulate real-time progress updates
  useEffect(() => {
    const steps = getEnhancedSteps()
    const inProgressSteps = steps.filter(step => step.status === "in_progress")
    
    if (inProgressSteps.length > 0) {
      const interval = setInterval(() => {
        setRealTimeProgress(prev => {
          const newProgress = { ...prev }
          inProgressSteps.forEach(step => {
            const current = newProgress[step.id] || 0
            const increment = Math.random() * 5 + 1
            newProgress[step.id] = Math.min(100, current + increment)
          })
          return newProgress
        })
      }, 2000)

      return () => clearInterval(interval)
    }
  }, [automation.steps])

  const steps = getEnhancedSteps()
  const progressPercentage = getProgressPercentage()
  const estimatedCompletion = getEstimatedCompletion()
  const overallConfidence = getOverallConfidence()
  const riskLevel = getRiskLevel()

  return (
    <TooltipProvider>
      <GlassCard className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border border-gray-700/50">
        {/* Enhanced Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30">
            <Bot className="h-7 w-7 text-blue-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-semibold text-white text-lg">{automation.title}</h3>
                  <Badge variant={riskLevel === "high" ? "destructive" : riskLevel === "medium" ? "secondary" : "default"}>
                    {riskLevel} risk
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {overallConfidence}% confidence
                  </Badge>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        {getProfileIcon(profile)}
                        <span>{profile}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Optimized for {profile} profile</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        {getScenarioIcon(scenario)}
                        <span>{scenario}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{scenario} scenario</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-sm text-gray-400 mb-3">{automation.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllDetails(!showAllDetails)}
                  className="text-gray-400 hover:text-white"
                >
                  {showAllDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            {/* Enhanced Progress Bar */}
            <div className="space-y-2 mb-3">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Progress</span>
                <span>{progressPercentage}% Complete</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
            
            {/* Enhanced Metrics */}
            <div className="grid grid-cols-4 gap-4 text-xs">
              <div className="flex items-center gap-2 text-gray-500">
                <Clock className="h-3 w-3" />
                <span>{estimatedCompletion}</span>
              </div>
              {automation.potentialSaving && automation.potentialSaving > 0 && (
                <div className="flex items-center gap-2 text-green-400">
                  <DollarSign className="h-3 w-3" />
                  <span>+${automation.potentialSaving}/mo</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-blue-400">
                <Activity className="h-3 w-3" />
                <span>{steps.length} steps</span>
              </div>
              <div className="flex items-center gap-2 text-purple-400">
                <Star className="h-3 w-3" />
                <span>{overallConfidence}% success</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Steps */}
        <div className="relative pl-6">
          {steps.map((step, index) => (
            <div key={step.id} className="relative">
              {/* Connection Line */}
              {index !== steps.length - 1 && (
                <div
                  className={cn(
                    "absolute left-[7px] top-[18px] h-full w-0.5 transition-colors duration-300",
                    step.status === "completed" ? "bg-gradient-to-b from-green-500 to-blue-500" : 
                    step.status === "in_progress" ? "bg-gradient-to-b from-blue-500 to-gray-700" : "bg-gray-700",
                  )}
                />
              )}
              
              {/* Step Circle */}
              <div
                className={cn(
                  "z-10 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full ring-4 ring-gray-900 transition-all duration-300",
                  step.status === "completed" && "bg-green-500 ring-green-500/30",
                  step.status === "in_progress" && "bg-blue-500 ring-blue-500/30",
                  step.status === "waiting_user" && "bg-yellow-500 ring-yellow-500/30",
                  step.status === "failed" && "bg-red-500 ring-red-500/30",
                  step.status === "pending" && "bg-gray-700 ring-gray-700/30",
                )}
              >
                {getIcon(step.status)}
              </div>
              
              {/* Enhanced Step Content */}
              <div className="ml-4 pb-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className={cn("text-sm font-medium transition-colors duration-300", 
                        step.status === "pending" ? "text-gray-500" : "text-gray-300"
                      )}>
                        {step.name}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {step.estimatedTime}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {step.confidence}% confidence
                      </Badge>
                      {step.agentDetails.avatar && (
                        <span className="text-xs">{step.agentDetails.avatar}</span>
                      )}
                    </div>
                    
                    <p className="text-xs text-gray-500 mb-3">{step.description}</p>
                    
                    {/* Agent Information */}
                    {showAllDetails && (
                      <div className="bg-gray-800/50 rounded-lg p-3 mb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Bot className="h-3 w-3 text-gray-600" />
                          <span className="text-xs text-gray-600 font-medium">{step.agentDetails.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {step.agentDetails.type}
                          </Badge>
                          <span className="text-xs text-gray-600">({step.agentDetails.successRate}% success rate)</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {step.agentDetails.capabilities.map((capability, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {capability}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {step.agentDetails.specializations.map((specialization, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {specialization}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Real-time Progress */}
                    {step.status === "in_progress" && (
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Progress</span>
                          <span className="text-blue-400">{Math.round(realTimeProgress[step.id] || 0)}%</span>
                        </div>
                        <Progress value={realTimeProgress[step.id] || 0} className="h-1" />
                        <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Timer className="h-3 w-3" />
                            {step.metrics.timeElapsed}s elapsed
                          </span>
                          <span className="flex items-center gap-1">
                            <BarChart3 className="h-3 w-3" />
                            {step.metrics.apiCalls} API calls
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* Risk Information */}
                    {step.risks.level !== "low" && (
                      <div className={cn("rounded-lg p-3 mb-3", 
                        step.risks.level === "high" ? "bg-red-500/10 border border-red-500/30" :
                        "bg-yellow-500/10 border border-yellow-500/30"
                      )}>
                        <div className="flex items-start gap-2">
                          <AlertTriangle className={cn("h-4 w-4 mt-0.5", 
                            step.risks.level === "high" ? "text-red-400" : "text-yellow-400"
                          )} />
                          <div className="flex-1">
                            <p className={cn("text-xs font-medium mb-1", 
                              step.risks.level === "high" ? "text-red-400" : "text-yellow-400"
                            )}>
                              {step.risks.level.toUpperCase()} RISK ({step.risks.probability}% probability)
                            </p>
                            <p className="text-xs text-gray-300 mb-1">{step.risks.description}</p>
                            <p className="text-xs text-gray-500">Mitigation: {step.risks.mitigation}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* User Action Required */}
                    {step.userActionRequired && step.status === "waiting_user" && (
                      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-3">
                        <div className="flex items-start gap-2 mb-3">
                          <User className="h-4 w-4 text-yellow-400 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs text-yellow-400 font-medium mb-1">Action Required</p>
                            <p className="text-xs text-gray-300">{step.userActionRequired.message}</p>
                          </div>
                        </div>
                        {step.userActionRequired.options && (
                          <div className="flex gap-2">
                            {step.userActionRequired.options.map((option, idx) => (
                              <Button
                                key={idx}
                                size="sm"
                                variant="outline"
                                onClick={() => handleUserAction(step.id, option)}
                                className="text-xs h-7 px-2 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20"
                              >
                                {option}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Impact Display */}
                    {step.impact && (step.status === "completed" || step.status === "in_progress") && (
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        {step.impact.immediate > 0 && (
                          <span className="text-xs text-green-400 flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            +${step.impact.immediate}/mo immediate
                          </span>
                        )}
                        {step.impact.projected > 0 && (
                          <span className="text-xs text-blue-400 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            +${step.impact.projected}/yr projected
                          </span>
                        )}
                        {step.impact.goalProgress > 0 && (
                          <span className="text-xs text-purple-400 flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            +{step.impact.goalProgress}% goal progress
                          </span>
                        )}
                        {step.impact.riskReduction > 0 && (
                          <span className="text-xs text-orange-400 flex items-center gap-1">
                            <Shield className="h-3 w-3" />
                            -{step.impact.riskReduction}% risk
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* Dependencies and Prerequisites */}
                    {showAllDetails && (step.dependencies.length > 0 || step.prerequisites.length > 0) && (
                      <div className="bg-gray-800/50 rounded-lg p-3 mb-3">
                        {step.dependencies.length > 0 && (
                          <div className="mb-2">
                            <p className="text-xs text-gray-600 font-medium mb-1">Dependencies:</p>
                            <div className="flex flex-wrap gap-1">
                              {step.dependencies.map((dep, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {dep}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {step.prerequisites.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-600 font-medium mb-1">Prerequisites:</p>
                            <div className="flex flex-wrap gap-1">
                              {step.prerequisites.map((prereq, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {prereq}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Rollback Plan */}
                    {showAllDetails && step.rollbackPlan && (
                      <div className="bg-gray-800/50 rounded-lg p-3 mb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <ArrowDown className="h-3 w-3 text-gray-600" />
                          <span className="text-xs text-gray-600 font-medium">Rollback Plan</span>
                          <Badge variant={step.rollbackPlan.available ? "default" : "destructive"} className="text-xs">
                            {step.rollbackPlan.available ? "Available" : "Not Available"}
                          </Badge>
                        </div>
                        {step.rollbackPlan.available && (
                          <div className="space-y-1">
                            <p className="text-xs text-gray-500">Time to rollback: {step.rollbackPlan.timeToRollback}</p>
                            <p className="text-xs text-gray-500">Impact: {step.rollbackPlan.impact}</p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Step Details */}
                    {showAllDetails && step.details && (
                      <div className="bg-gray-800/50 rounded-lg p-3 mb-3">
                        <p className="text-xs text-gray-400 leading-relaxed">{step.details}</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Expand/Collapse Button */}
                  {showAllDetails && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleStepExpansion(step.id)}
                      className="text-gray-400 hover:text-white ml-2"
                    >
                      {expandedSteps.has(step.id) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Enhanced Footer Actions */}
        <div className="mt-6 pt-4 border-t border-gray-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Lock className="h-3 w-3" />
                Secure execution
              </span>
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Real-time updates
              </span>
              <span className="flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                AI-powered
              </span>
            </div>
            <div className="flex gap-2">
              {!isActivated ? (
                <>
                  <Button size="sm" onClick={onActivate} className="text-xs h-8 px-3 bg-gradient-to-r from-blue-500 to-purple-500">
                    <Zap className="h-3 w-3 mr-1" />
                    Activate
                  </Button>
                  {onAddAsGoal && (
                    <Button size="sm" onClick={onAddAsGoal} className="text-xs h-8 px-3 bg-gradient-to-r from-green-500 to-emerald-500">
                      <Target className="h-3 w-3 mr-1" />
                      Set as Goal
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button size="sm" variant="outline" onClick={onConfigure} className="text-xs h-8 px-3">
                    <Settings className="h-3 w-3 mr-1" />
                    Configure
                  </Button>
                  {automation.workflowStatus === "running" ? (
                    <Button size="sm" variant="outline" onClick={onPause} className="text-xs h-8 px-3">
                      <Pause className="h-3 w-3 mr-1" />
                      Pause
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={onResume} className="text-xs h-8 px-3">
                      <Play className="h-3 w-3 mr-1" />
                      Resume
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </GlassCard>
    </TooltipProvider>
  )
}
