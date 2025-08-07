"use client"

import { useState } from "react"
import type { AppState } from "@/hooks/use-app-state"
import { Plus, Sparkles, Shield, Plane, ChevronDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import GlassCard from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import GoalMilestoneTracker from "@/components/ui/goal-milestone-tracker"

const goalColorStyles = {
  green: {
    iconContainer: "bg-green-100 text-green-600",
    progress: "bg-green-500",
  },
  blue: {
    iconContainer: "bg-blue-100 text-blue-600",
    progress: "bg-blue-500",
  },
}

export default function GoalsScreen({ goals, setCurrentScreen, setSelectedGoal, setGoalFeedbackOpen }: AppState) {
  const [expandedGoalId, setExpandedGoalId] = useState<number | null>(null)
  const totalSaved = goals.reduce((sum, goal) => sum + goal.current, 0)
  const totalTarget = goals.reduce((sum, goal) => sum + goal.target, 0)
  const overallProgress = (totalSaved / totalTarget) * 100

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring" } },
  }

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "Shield":
        return <Shield className="h-6 w-6" />
      case "Plane":
        return <Plane className="h-6 w-6" />
      default:
        return <Shield className="h-6 w-6" />
    }
  }

  const handleToggleGoal = (goalId: number) => {
    setExpandedGoalId(expandedGoalId === goalId ? null : goalId)
  }

  return (
    <div className="pb-28">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring" }}
        className="p-6 pb-20 text-white"
      >
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Your Goals</h1>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setCurrentScreen("create-goal")}
            className="rounded-xl bg-white/20 backdrop-blur-lg hover:bg-white/30"
            aria-label="Create new goal"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        {/* Overall Progress */}
        <GlassCard onClick={() => setGoalFeedbackOpen(true)} className="cursor-pointer">
          <p className="mb-1 text-sm text-white/80">Total Progress</p>
          <p className="mb-3 text-3xl font-bold" aria-live="polite">
            ${totalSaved.toLocaleString()}
          </p>
          <Progress
            value={overallProgress}
            className="h-3 bg-white/20 [&>*]:bg-gradient-to-r [&>*]:from-purple-400 [&>*]:to-pink-400"
            aria-label={`Overall goal progress: ${overallProgress.toFixed(1)}%`}
          />
          <p className="mt-2 text-sm text-white/80">
            of ${totalTarget.toLocaleString()} across {goals.length} goals
          </p>
        </GlassCard>
      </motion.div>

      {/* AI Recommendation */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, type: "spring" }}
        className="px-4 -mt-16"
      >
        <div className="rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 p-4 text-white shadow-lg">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            <h3 className="font-semibold">AI Insight</h3>
          </div>
          <p className="mb-3 text-sm">
            You can reach all your goals 3 months faster by optimizing your monthly contributions.
          </p>
          <Button size="sm" className="bg-white/20 text-white backdrop-blur-lg hover:bg-white/30">
            Optimize My Goals
          </Button>
        </div>
      </motion.div>

      {/* Goals List */}
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="px-4 mt-6 space-y-4">
        {goals.map((goal) => {
          const progress = (goal.current / goal.target) * 100
          const styles = goalColorStyles[goal.color] || goalColorStyles.green
          const isExpanded = expandedGoalId === goal.id

          return (
            <motion.div key={goal.id} variants={itemVariants}>
              <GlassCard
                onClick={() => handleToggleGoal(goal.id)}
                className="cursor-pointer bg-white/80 text-foreground"
                aria-label={`View details for ${goal.title}`}
                layout
              >
                <motion.div layout="position" className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-xl text-2xl",
                        styles.iconContainer,
                      )}
                    >
                      {getIcon(goal.icon)}
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold">{goal.title}</h3>
                      <p className="text-sm text-gray-600">
                        ${goal.current.toLocaleString()} / ${goal.target.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-bold">{progress.toFixed(1)}%</p>
                    <ChevronDown
                      className={cn("h-5 w-5 text-gray-400 transition-transform", isExpanded && "rotate-180")}
                    />
                  </div>
                </motion.div>
                <motion.div layout="position">
                  <Progress
                    value={progress}
                    className={cn("h-2 bg-gray-200", "[&>*]:" + styles.progress)}
                    aria-label={`${goal.title} progress: ${progress.toFixed(0)}%`}
                  />
                </motion.div>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <GoalMilestoneTracker goal={goal} />
                      <div className="px-4 pb-2">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedGoal(goal)
                            setCurrentScreen("goal-detail")
                          }}
                          className="w-full"
                        >
                          View Full Details
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </GlassCard>
            </motion.div>
          )
        })}
        <motion.div variants={itemVariants}>
          <GlassCard
            onClick={() => setCurrentScreen("create-goal")}
            className="cursor-pointer border-2 border-dashed border-gray-400/50 bg-white/50 text-center text-foreground"
          >
            <Plus className="mx-auto mb-2 h-8 w-8 text-gray-400" />
            <p className="font-medium text-gray-600">Add New Goal</p>
            <p className="mt-1 text-sm text-gray-500">Start saving for what matters</p>
          </GlassCard>
        </motion.div>
      </motion.div>
    </div>
  )
}
