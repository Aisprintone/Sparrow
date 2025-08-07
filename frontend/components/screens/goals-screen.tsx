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
import { useToast } from '@/hooks/use-toast'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import type { AppState } from "@/hooks/use-app-state"

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
  setCurrentScreen
}: AppState) {
  const { toast } = useToast()
  const [goalService] = useState(() => GoalService.getInstance())
  const [selectedGoal, setSelectedGoalLocal] = useState<Goal | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null)

  const getGoalIcon = (iconName: string) => {
    return goalIcons[iconName] || <Target className="h-5 w-5" />
  }

  const getGoalColor = (color: string) => {
    return goalColors[color] || 'bg-blue-500'
  }

  const getPriorityColor = (priority: string | undefined) => {
    return priorityColors[priority || 'medium'] || priorityColors.medium
  }

  const calculateProgress = (goal: Goal) => {
    return (goal.current / goal.target) * 100
  }

  const getGoalStatus = (goal: Goal) => {
    const progress = calculateProgress(goal)
    const status = goalService.getGoalStatus(goal)
    
    return {
      status,
      progress,
      recommendations: goalService.getGoalRecommendations(goal)
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

  const handleRunSimulation = async (goal: Goal) => {
    try {
      const simulations = await goalService.getGoalSimulations(goal.id)
      toast({
        title: 'Simulations found',
        description: `Found ${simulations.totalSimulations} relevant simulations for ${goal.title}`,
      })
      // Navigate to simulations screen with pre-selected simulations
      setCurrentScreen('simulations')
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch simulations. Please try again.',
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

  const totalProgress = goals.length > 0 
    ? goals.reduce((sum, goal) => sum + calculateProgress(goal), 0) / goals.length 
    : 0

  return (
    <div className="h-[100dvh] overflow-y-auto pb-24">
      <motion.div 
        className="p-4 space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Financial Goals</h1>
            <p className="text-white/60">
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
        <GlassCard className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-white" />
            <h2 className="text-lg font-semibold text-white">Overall Progress</h2>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Average completion</span>
              <span className="text-white font-medium">{totalProgress.toFixed(1)}%</span>
            </div>
            <Progress value={totalProgress} className="h-2" />
            <p className="text-xs text-white/40">
              {goals.length} active goals
            </p>
          </div>
        </GlassCard>

        {/* Goals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal) => {
            const { status, progress, recommendations } = getGoalStatus(goal)
            
            return (
              <motion.div
                key={goal.id}
                variants={itemVariants}
                className="group"
              >
                <GlassCard className="p-5 cursor-pointer hover:scale-[1.02] transition-all duration-200 relative">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${getGoalColor(goal.color)} text-white`}>
                        {getGoalIcon(goal.icon)}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{goal.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={`${getPriorityColor(goal.priority)} border`}>
                            {goal.priority}
                          </Badge>
                          <Badge 
                            variant={status === 'behind' ? 'destructive' : 'secondary'}
                            className="bg-white/10 text-white border-white/20"
                          >
                            {status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Menu */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRunSimulation(goal)
                          }}
                          title="Run simulations"
                          className="text-white hover:bg-white/10"
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleGoalClick(goal)
                          }}
                          title="Edit goal"
                          className="text-white hover:bg-white/10"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Quick Delete Button - Always Visible */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setGoalToDelete(goal)
                          }}
                          title="Delete goal"
                          className="text-red-300 hover:bg-red-500/20 hover:text-red-200 p-1"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-gray-900 border-gray-700">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-white">Delete Goal</AlertDialogTitle>
                          <AlertDialogDescription className="text-gray-300">
                            Are you sure you want to delete "{goal.title}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-gray-800 text-white border-gray-600 hover:bg-gray-700">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleConfirmDelete(goal)}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  {/* Progress */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">Progress</span>
                      <span className="text-white font-medium">
                        ${goal.current.toLocaleString()} / ${goal.target.toLocaleString()}
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-white/40">
                      {progress.toFixed(1)}% complete
                    </p>
                  </div>

                  {/* Goal Details */}
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-white/60">Monthly contribution</span>
                      <span className="text-white">${goal.monthlyContribution.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Deadline</span>
                      <span className="text-white">{goal.deadline}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Type</span>
                      <span className="text-white capitalize">{goal.type}</span>
                    </div>
                  </div>

                  {/* AI Insights */}
                  {goal.aiInsights && (
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <AlertCircle className="h-4 w-4 text-blue-400" />
                        <span className="text-white">AI Insights</span>
                      </div>
                      <div className="text-xs text-white/60 space-y-1">
                        {goal.aiInsights.recommendations.slice(0, 2).map((rec, index) => (
                          <div key={index} className="flex items-start gap-1">
                            <span className="text-blue-400">•</span>
                            <span>{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {recommendations.length > 0 && (
                    <div className="space-y-2 mb-4">
                      <div className="text-sm font-medium text-white">Recommendations</div>
                      <div className="text-xs text-white/60 space-y-1">
                        {recommendations.slice(0, 2).map((rec, index) => (
                          <div key={index} className="flex items-start gap-1">
                            <span className="text-green-400">•</span>
                            <span>{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Simulation Impact */}
                  {goal.simulationImpact && goal.simulationImpact.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-white">Simulation Impact</div>
                      <div className="text-xs text-white/60 space-y-1">
                        {goal.simulationImpact.slice(0, 2).map((impact, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span>{impact.scenarioName}</span>
                            <span className="text-blue-400">+{impact.impactOnGoal}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </GlassCard>
              </motion.div>
            )
          })}
        </div>

        {/* Empty State */}
        {goals.length === 0 && (
          <motion.div variants={itemVariants}>
            <GlassCard className="text-center py-12">
              <Target className="h-12 w-12 mx-auto text-white/40 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-white">No goals yet</h3>
              <p className="text-white/60 mb-4">
                Create your first financial goal to start tracking your progress
              </p>
              <Button 
                onClick={handleAddGoal}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Goal
              </Button>
            </GlassCard>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
