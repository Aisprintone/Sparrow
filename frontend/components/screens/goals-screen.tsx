"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import GlassCard from '@/components/ui/glass-card'
import { 
  Plus, 
  Target, 
  Shield, 
  Home, 
  Plane, 
  TrendingUp, 
  GraduationCap, 
  Briefcase, 
  BarChart3, 
  BookOpen,
  Trash2,
  Edit,
  Play,
  AlertCircle
} from 'lucide-react'
import { Goal } from '@/lib/data'
import { GoalService } from '@/lib/services/goal-service'
import { profileDataService, ProfileFinancialData, ProfileGoal } from '@/lib/services/profile-data-service'
import { GoalProgressCalculator, formatGoalProgress } from '@/lib/utils/goal-progress-calculator'
import { useToast } from '@/hooks/use-toast'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import type { AppState } from "@/hooks/use-app-state"
import { 
  Briefcase as BriefcaseIcon, 
  Heart, 
  Zap, 
  TrendingDown, 
  Building, 
  CreditCard, 
  Car,
  DollarSign 
} from 'lucide-react'

const goalIcons: Record<string, React.ReactNode> = {
  Target: <Target className="h-5 w-5" />,
  Shield: <Shield className="h-5 w-5" />,
  Home: <Home className="h-5 w-5" />,
  Plane: <Plane className="h-5 w-5" />,
  TrendingUp: <TrendingUp className="h-5 w-5" />,
  GraduationCap: <GraduationCap className="h-5 w-5" />,
  Briefcase: <Briefcase className="h-5 w-5" />,
  BarChart3: <BarChart3 className="h-5 w-5" />,
  BookOpen: <BookOpen className="h-5 w-5" />
}

const goalColors: Record<string, string> = {
  green: 'bg-green-500',
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  indigo: 'bg-indigo-500',
  teal: 'bg-teal-500',
  cyan: 'bg-cyan-500'
}

// Available simulations that goals can be mapped to
const availableSimulations = [
  {
    id: "job-loss",
    title: "Job Loss Scenario",
    subtitle: "How long can you survive without income?",
    icon: <BriefcaseIcon className="h-8 w-8" />,
    color: "from-red-500/20 to-orange-500/20",
    borderColor: "border-red-500/30",
  },
  {
    id: "medical-crisis",
    title: "Medical Crisis",
    subtitle: "Prepare for unexpected healthcare costs",
    icon: <Heart className="h-8 w-8" />,
    color: "from-pink-500/20 to-red-500/20",
    borderColor: "border-pink-500/30",
  },
  {
    id: "gig-economy",
    title: "Gig Economy Volatility",
    subtitle: "Navigate income uncertainty",
    icon: <Zap className="h-8 w-8" />,
    color: "from-yellow-500/20 to-orange-500/20",
    borderColor: "border-yellow-500/30",
  },
  {
    id: "market-crash",
    title: "Market Crash Impact",
    subtitle: "Test portfolio resilience",
    icon: <TrendingDown className="h-8 w-8" />,
    color: "from-purple-500/20 to-red-500/20",
    borderColor: "border-purple-500/30",
  },
  {
    id: "home-purchase",
    title: "Home Purchase Planning",
    subtitle: "Plan your path to homeownership",
    icon: <Home className="h-8 w-8" />,
    color: "from-blue-500/20 to-purple-500/20",
    borderColor: "border-blue-500/30",
  },
  {
    id: "rent-hike",
    title: "Rent Hike Stress Test",
    subtitle: "Prepare for housing cost increases",
    icon: <Building className="h-8 w-8" />,
    color: "from-indigo-500/20 to-blue-500/20",
    borderColor: "border-indigo-500/30",
  },
  {
    id: "debt-payoff",
    title: "Debt Payoff Strategy",
    subtitle: "Optimize your path to becoming debt-free",
    icon: <CreditCard className="h-8 w-8" />,
    color: "from-green-500/20 to-blue-500/20",
    borderColor: "border-green-500/30",
  },
  {
    id: "student-loan",
    title: "Student Loan Strategy",
    subtitle: "Navigate repayment and forgiveness options",
    icon: <Shield className="h-8 w-8" />,
    color: "from-emerald-500/20 to-green-500/20",
    borderColor: "border-emerald-500/30",
  },
  {
    id: "emergency-fund",
    title: "Emergency Fund Strategy",
    subtitle: "Build your financial safety net",
    icon: <Shield className="h-8 w-8" />,
    color: "from-teal-500/20 to-green-500/20",
    borderColor: "border-teal-500/30",
  },
  {
    id: "auto-repair",
    title: "Auto Repair Crisis",
    subtitle: "Prepare for transportation emergencies",
    icon: <Car className="h-8 w-8" />,
    color: "from-gray-500/20 to-blue-500/20",
    borderColor: "border-gray-500/30",
  },
  {
    id: "salary-increase",
    title: "Salary Increase",
    subtitle: "Optimize your financial strategy with higher income",
    icon: <DollarSign className="h-8 w-8" />,
    color: "from-green-500/20 to-blue-500/20",
    borderColor: "border-green-500/30",
    disabled: true,
  },
]

const priorityColors: Record<string, string> = {
  high: 'bg-red-500/20 text-red-300 border-red-500/30',
  medium: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  low: 'bg-green-500/20 text-green-300 border-green-500/30'
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export default function GoalsScreen({ 
  goals, 
  addGoal, 
  updateGoal, 
  deleteGoal, 
  setSelectedGoal,
  setCurrentScreen,
  setCurrentSimulation,
  runSimulations,
  selectedProfile
}: AppState) {
  const { toast } = useToast()
  const [goalService] = useState(() => GoalService.getInstance())
  const [selectedGoal, setSelectedGoalLocal] = useState<Goal | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null)
  const [profileData, setProfileData] = useState<ProfileFinancialData | null>(null)
  const [realGoals, setRealGoals] = useState<ProfileGoal[]>([])
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)

  // Load real profile data when profile changes
  useEffect(() => {
    const loadProfileData = async () => {
      if (!selectedProfile?.id) {
        setIsLoadingProfile(false)
        return
      }

      setIsLoadingProfile(true)
      try {
        const data = await profileDataService.getProfileData(selectedProfile.id)
        setProfileData(data)
        setRealGoals(data.goals)
      } catch (error) {
        console.error('Failed to load profile data:', error)
        // Fall back to existing goals
        setRealGoals([])
      } finally {
        setIsLoadingProfile(false)
      }
    }

    loadProfileData()
  }, [selectedProfile])

  const getGoalIcon = (goal: Goal | ProfileGoal) => {
    // For real goals, determine icon based on title
    if ('title' in goal) {
      const title = goal.title.toLowerCase()
      if (title.includes('house') || title.includes('home')) return <Home className="h-5 w-5" />
      if (title.includes('debt') || title.includes('loan')) return <Shield className="h-5 w-5" />
      if (title.includes('invest')) return <TrendingUp className="h-5 w-5" />
      if (title.includes('credit')) return <BarChart3 className="h-5 w-5" />
      if (title.includes('emergency')) return <Shield className="h-5 w-5" />
      return <Target className="h-5 w-5" />
    }
    // For legacy goals
    const iconName = (goal as Goal).icon
    return goalIcons[iconName] || <Target className="h-5 w-5" />
  }

  const getGoalColor = (goal: Goal | ProfileGoal) => {
    // For real goals, determine color based on type
    if ('title' in goal) {
      const title = goal.title.toLowerCase()
      if (title.includes('house') || title.includes('home')) return 'bg-blue-500'
      if (title.includes('debt') || title.includes('loan')) return 'bg-red-500'
      if (title.includes('invest')) return 'bg-green-500'
      if (title.includes('credit')) return 'bg-purple-500'
      if (title.includes('emergency')) return 'bg-orange-500'
      return 'bg-blue-500'
    }
    // For legacy goals
    const color = (goal as Goal).color
    return goalColors[color] || 'bg-blue-500'
  }

  const getPriorityColor = (priority: string | undefined) => {
    return priorityColors[priority || 'medium'] || priorityColors.medium
  }

  const calculateProgress = (goal: Goal | ProfileGoal) => {
    if ('progressPercentage' in goal) {
      return goal.progressPercentage
    }
    // PATTERN GUARDIAN ENFORCED: Using unified calculator
    const result = GoalProgressCalculator.calculate({
      current: (goal as Goal).current,
      target: (goal as Goal).target
    })
    return result.percentage
  }

  const getGoalStatus = (goal: Goal | ProfileGoal) => {
    const progress = calculateProgress(goal)
    let status = 'on-track'
    let recommendations: string[] = []
    
    if ('consistencyMeasures' in goal) {
      // Real goal with consistency measures
      status = goal.consistencyMeasures?.onTrack ? 'on-track' : 'behind'
      if (goal.monthlyContributionNeeded > 0) {
        recommendations.push(`Contribute $${goal.monthlyContributionNeeded}/month to stay on track`)
      }
      if (goal.consistencyMeasures?.missedContributions > 0) {
        recommendations.push(`Make up for ${goal.consistencyMeasures.missedContributions} missed contributions`)
      }
    } else {
      // Legacy goal
      status = goalService.getGoalStatus(goal as Goal)
      recommendations = goalService.getGoalRecommendations(goal as Goal)
    }
    
    return {
      status,
      progress,
      recommendations
    }
  }

  const handleDeleteGoal = async (goal: Goal) => {
    try {
      // First try to delete from the backend
      await goalService.deleteGoal(goal.id)
      
      // If successful, remove from local state
      deleteGoal(goal.id)
      
      // Removed toast notification for cleaner UX
    } catch (error) {
      console.error('Failed to delete goal:', error)
      
      // If backend fails, still remove from local state for better UX
      deleteGoal(goal.id)
      
      // Removed toast notification for cleaner UX
    }
  }

  const handleConfirmDelete = (goal: Goal) => {
    handleDeleteGoal(goal)
  }

  const handleRunSimulation = async (goal: Goal | ProfileGoal) => {
    try {
      // Get simulation tags from the goal
      const simulationTags = 'simulationTags' in goal ? goal.simulationTags : (goal as Goal).simulationTags || []
      
      if (simulationTags.length === 0) {
        toast({
          title: 'No simulations available',
          description: `No simulations are mapped to "${goal.title}". Please check the goal configuration.`,
          variant: 'destructive',
        })
        return
      }

      // Find matching simulations from available simulations
      const matchingSimulations = availableSimulations.filter(sim => 
        simulationTags.includes(sim.id) && !sim.disabled
      )

      if (matchingSimulations.length === 0) {
        toast({
          title: 'No matching simulations',
          description: `No available simulations match the tags for "${goal.title}": ${simulationTags.join(', ')}`,
          variant: 'destructive',
        })
        return
      }

      // Take the first matching simulation and set it as current
      const primarySimulation = matchingSimulations[0]
      setCurrentSimulation({
        id: primarySimulation.id,
        title: primarySimulation.title,
        subtitle: primarySimulation.subtitle,
        icon: primarySimulation.icon,
        color: primarySimulation.color,
        borderColor: primarySimulation.borderColor
      })

      toast({
        title: 'Opening simulation',
        description: `Configuring "${primarySimulation.title}" simulation for ${goal.title}`,
      })

      // Navigate to simulation setup screen instead of running directly
      setCurrentScreen('simulation-setup')

    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to run simulation. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleGoalClick = (goal: Goal) => {
    setSelectedGoal(goal)
    setCurrentScreen('goal-detail')
  }

  const handleAddGoal = () => {
    setCurrentScreen('create-goal')
  }

  // Merge real goals with existing goals, combining both sources
  // Convert app state goals to compatible format and combine with profile goals
  const appStateGoals = goals.map(goal => ({
    id: goal.id.toString(),
    title: goal.title,
    description: goal.description || `${goal.type} goal`,
    targetAmount: goal.target,
    targetDate: goal.deadline,
    currentAmount: goal.current,
    progressPercentage: calculateProgress(goal),
    monthlyContributionNeeded: goal.monthlyContribution,
    simulationTags: goal.simulationTags,
    // Add aiInsights from Goal interface for simulation goals
    aiInsights: goal.aiInsights,
    // Add basic consistency measures for compatibility
    consistencyMeasures: {
      onTrack: true,
      weeksConsistent: 4,
      missedContributions: 0,
      projectedCompletion: goal.deadline
    }
  }))
  
  const displayGoals = [...realGoals, ...appStateGoals]
  const totalProgress = displayGoals.length > 0 
    ? displayGoals.reduce((sum, goal) => sum + calculateProgress(goal), 0) / displayGoals.length 
    : 0

  return (
    <div className="h-[100dvh] overflow-y-auto pb-24">
      <div className="mx-auto max-w-7xl">
        <motion.div 
          className="p-4 space-y-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-white">Financial Goals</h1>
            <p className="text-sm text-white/60">
              Track your progress and stay motivated
            </p>
          </div>
          <Button 
            onClick={handleAddGoal}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Goal
          </Button>
        </div>

        {/* Overall Progress */}
        <GlassCard className="p-4 sm:p-5 lg:p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-white" />
              <h2 className="text-lg font-semibold tracking-tight text-white">Overall Progress</h2>
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-4 items-center">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Average completion</span>
                  <span className="tabular-nums whitespace-nowrap font-medium text-white">{GoalProgressCalculator.formatPercentage(totalProgress)}</span>
                </div>
                <Progress value={totalProgress} className="h-2" />
              </div>
            </div>
            <p className="text-sm text-white/60">
              <span className="tabular-nums">{displayGoals.length}</span> active goals
              {profileData && ` • ${profileData.name}`}
            </p>
          </div>
        </GlassCard>

        {/* Goals Grid */}
        <div className="grid grid-cols-1 gap-4 max-w-2xl mx-auto">
          {displayGoals.map((goal: Goal | ProfileGoal) => {
            const { status, progress, recommendations } = getGoalStatus(goal)
            
            return (
              <motion.div
                key={goal.id}
                variants={itemVariants}
                className="h-full"
              >
                <GlassCard className="p-4 sm:p-5 cursor-pointer hover:scale-[1.02] transition-all duration-200 relative group h-full flex flex-col">
                  {/* Header */}
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col gap-1 flex-1 min-w-0">
                        {/* Icon + Title + Badges */}
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Icon */}
                          <div className="flex-shrink-0">
                            <div className={`p-2 rounded-lg ${getGoalColor(goal)} text-white`}>
                              {getGoalIcon(goal)}
                            </div>
                          </div>

                          {/* Title */}
                          <h2 className="text-base font-semibold text-white">
                            {'title' in goal ? goal.title : (goal as Goal).title}
                          </h2>

                          {/* Badges */}
                          <div className="flex flex-wrap gap-1">
                            {'priority' in goal ? (
                              <Badge 
                                variant={(goal as Goal).priority === 'high' ? 'destructive' : (goal as Goal).priority === 'medium' ? 'default' : 'secondary'} 
                                className="text-xs px-2 py-0.5"
                              >
                                {(goal as Goal).priority}
                              </Badge>
                            ) : (
                              <Badge 
                                variant={status === 'behind' ? 'destructive' : 'default'} 
                                className="text-xs px-2 py-0.5"
                              >
                                {goal.consistencyMeasures?.onTrack ? 'on-track' : 'needs-attention'}
                              </Badge>
                            )}
                            <Badge 
                              variant={status === 'behind' ? 'destructive' : 'secondary'} 
                              className="text-xs px-2 py-0.5"
                            >
                              {status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Menu */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRunSimulation(goal)
                          }}
                          title="Run simulations"
                          className="text-white hover:bg-white/10 h-8 w-8 p-0"
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleGoalClick(goal as Goal)
                          }}
                          title="Edit goal"
                          className="text-white hover:bg-white/10 h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                setGoalToDelete(goal as Goal)
                              }}
                              title="Delete goal"
                              className="text-red-300 hover:bg-red-500/20 hover:text-red-200 h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-gray-900 border-gray-700">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-white">Delete Goal</AlertDialogTitle>
                              <AlertDialogDescription className="text-gray-300">
                                Are you sure you want to delete "{'title' in goal ? goal.title : (goal as Goal).title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-gray-800 text-white border-gray-600 hover:bg-gray-700">
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleConfirmDelete(goal as Goal)}
                                className="bg-red-600 hover:bg-red-700 text-white"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {/* Progress Section */}
                    <div className="space-y-2">
                      <div className="grid grid-cols-[1fr_auto] gap-4 items-baseline">
                        <span className="text-sm font-medium text-white/80">Progress</span>
                        <span className="text-sm font-semibold text-white tabular-nums whitespace-nowrap">
                          {'currentAmount' in goal 
                            ? `$${goal.currentAmount.toLocaleString()} / $${goal.targetAmount.toLocaleString()}`
                            : `$${(goal as Goal).current.toLocaleString()} / $${(goal as Goal).target.toLocaleString()}`
                          }
                        </span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <div className="text-right">
                        <span className="text-sm text-white/60">
                          <span className="tabular-nums font-medium">{GoalProgressCalculator.formatPercentage(progress)}</span> complete
                        </span>
                      </div>
                    </div>

                    {/* Goal Details Section */}
                    <div className="space-y-1.5 pt-2 border-t border-white/10">
                      <div className="grid grid-cols-[1fr_auto] gap-4 items-baseline">
                        <span className="text-sm text-white/60">Monthly contribution</span>
                        <span className="text-sm font-medium text-white tabular-nums whitespace-nowrap">
                          ${'monthlyContributionNeeded' in goal 
                            ? goal.monthlyContributionNeeded.toLocaleString()
                            : (goal as Goal).monthlyContribution.toLocaleString()
                          }
                        </span>
                      </div>
                      <div className="grid grid-cols-[1fr_auto] gap-4 items-baseline">
                        <span className="text-sm text-white/60">Deadline</span>
                        <span className="text-sm font-medium text-white whitespace-nowrap">
                          {'targetDate' in goal 
                            ? new Date(goal.targetDate).toLocaleDateString()
                            : (goal as Goal).deadline
                          }
                        </span>
                      </div>
                      <div className="grid grid-cols-[1fr_auto] gap-4 items-baseline">
                        <span className="text-sm text-white/60">Type</span>
                        <span className="text-sm font-medium text-white capitalize whitespace-nowrap">
                          {'type' in goal ? (goal as Goal).type : 'financial'}
                        </span>
                      </div>
                    </div>

                    {/* Consistency Measures Section for Real Goals */}
                    {'consistencyMeasures' in goal && goal.consistencyMeasures && (
                      <div className="space-y-2 pt-2 border-t border-white/10">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-blue-400 flex-shrink-0" />
                          <span className="text-sm font-medium text-white">Consistency Tracking</span>
                        </div>
                        <div className="space-y-1.5 pl-6">
                          <div className="flex items-start gap-2">
                            <span className="text-blue-400 flex-shrink-0 mt-0.5">•</span>
                            <span className="text-sm leading-snug text-white/60">
                              {goal.consistencyMeasures.weeksConsistent} weeks of consistent contributions
                            </span>
                          </div>
                          {goal.consistencyMeasures.missedContributions > 0 && (
                            <div className="flex items-start gap-2">
                              <span className="text-yellow-400 flex-shrink-0 mt-0.5">•</span>
                              <span className="text-sm leading-snug text-white/60">
                                {goal.consistencyMeasures.missedContributions} missed contributions to make up
                              </span>
                            </div>
                          )}
                          <div className="flex items-start gap-2">
                            <span className="text-green-400 flex-shrink-0 mt-0.5">•</span>
                            <span className="text-sm leading-snug text-white/60">
                              Projected completion: {new Date(goal.consistencyMeasures.projectedCompletion).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* AI Insights Section */}
                    {(('aiInsights' in goal && goal.aiInsights) || (goal as any).aiInsights) && (
                      <div className="space-y-2 pt-2 border-t border-white/10">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-blue-400 flex-shrink-0" />
                          <span className="text-sm font-medium text-white">AI Insights</span>
                        </div>
                        <div className="space-y-1.5 pl-6">
                          {((goal as any).aiInsights?.recommendations || []).slice(0, 2).map((rec: string, index: number) => (
                            <div key={index} className="flex items-start gap-2">
                              <span className="text-blue-400 flex-shrink-0 mt-0.5">•</span>
                              <span className="text-sm leading-snug text-white/60">{rec}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommendations Section */}
                    {recommendations.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-white/10">
                        <div className="text-sm font-medium text-white">Recommendations</div>
                        <div className="space-y-1.5 pl-6">
                          {recommendations.slice(0, 2).map((rec, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <span className="text-green-400 flex-shrink-0 mt-0.5">•</span>
                              <span className="text-sm leading-snug text-white/60">{rec}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Simulation Impact Section */}
                    {'simulationImpact' in goal && (goal as Goal).simulationImpact && (goal as Goal).simulationImpact.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-white/10 mt-auto">
                        <div className="text-sm font-medium text-white">Simulation Impact</div>
                        <div className="space-y-1.5">
                          {(goal as Goal).simulationImpact.slice(0, 2).map((impact, index) => (
                            <div key={index} className="grid grid-cols-[1fr_auto] gap-4 items-baseline">
                              <span className="text-sm text-white/60 truncate">{impact.scenarioName}</span>
                              <span className="text-sm font-medium text-blue-400 tabular-nums whitespace-nowrap">+{impact.impactOnGoal}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </GlassCard>
              </motion.div>
            )
          })}
        </div>

        {/* Empty State */}
        {displayGoals.length === 0 && !isLoadingProfile && (
          <motion.div variants={itemVariants}>
            <GlassCard className="text-center p-4 sm:p-5 lg:p-6">
              <div className="py-8">
                <Target className="h-12 w-12 mx-auto text-white/40 mb-4" />
                <h3 className="text-lg font-semibold tracking-tight mb-2 text-white">No goals yet</h3>
                <p className="text-sm text-white/60 mb-6 leading-relaxed">
                  Create your first financial goal to start tracking your progress
                </p>
                <Button 
                  onClick={handleAddGoal}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Goal
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        )}
        </motion.div>
      </div>
    </div>
  )
}
