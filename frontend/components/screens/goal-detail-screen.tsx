"use client"

import type { AppState } from "@/hooks/use-app-state"
import { ChevronLeft, Settings, Calendar, Sparkles } from "lucide-react"
import { motion } from "framer-motion"
import GlassCard from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

const goalDetailStyles = {
  green: {
    headerBg: "bg-gradient-to-b from-green-600 to-green-500",
    headerText: "text-green-100",
    progressGradient: "[&>*]:bg-gradient-to-r [&>*]:from-green-500 [&>*]:to-green-400",
    statText: "text-green-600",
    boostButton: "bg-green-50 text-green-700 hover:bg-green-100",
  },
  blue: {
    headerBg: "bg-gradient-to-b from-blue-600 to-blue-500",
    headerText: "text-blue-100",
    progressGradient: "[&>*]:bg-gradient-to-r [&>*]:from-blue-500 [&>*]:to-blue-400",
    statText: "text-blue-600",
    boostButton: "bg-blue-50 text-blue-700 hover:bg-blue-100",
  },
}

export default function GoalDetailScreen({ selectedGoal, setCurrentScreen }: AppState) {
  if (!selectedGoal) {
    return (
      <div className="flex h-full items-center justify-center text-white">
        <p>No goal selected. Please go back.</p>
        <Button onClick={() => setCurrentScreen("goals")}>Go Back</Button>
      </div>
    )
  }

  const { title, icon, current, target, monthlyContribution, deadline, color } = selectedGoal
  const progress = (current / target) * 100
  const monthsLeft = Math.ceil((target - current) / monthlyContribution)
  const styles = goalDetailStyles[color] || goalDetailStyles.green

  return (
    <div className="h-full overflow-y-auto pb-24">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("p-6 pb-24 text-white", styles.headerBg)}
      >
        <header className="mb-6 flex items-center justify-between">
          <Button
            onClick={() => setCurrentScreen("goals")}
            variant="ghost"
            size="icon"
            className="hover:bg-white/20"
            aria-label="Back to goals"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button variant="ghost" size="icon" className="hover:bg-white/20" aria-label="Goal settings">
            <Settings className="h-5 w-5" />
          </Button>
        </header>
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 text-4xl backdrop-blur-lg">
            {icon}
          </div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className={cn(styles.headerText)}>You're {progress.toFixed(0)}% there!</p>
        </div>
      </motion.div>

      <div className="px-4 -mt-16">
        <GlassCard className="bg-white/90 text-foreground">
          <div className="mb-6">
            <div className="mb-2 flex items-baseline justify-between">
              <p className="text-3xl font-bold">${current.toLocaleString()}</p>
              <p className="text-gray-600">of ${target.toLocaleString()}</p>
            </div>
            <Progress value={progress} className={cn("h-4 rounded-full bg-gray-200", styles.progressGradient)} />
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className={cn("text-2xl font-bold", styles.statText)}>{monthsLeft}</p>
              <p className="text-xs text-gray-600">months left</p>
            </div>
            <div>
              <p className="text-2xl font-bold">${monthlyContribution}</p>
              <p className="text-xs text-gray-600">per month</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{deadline}</p>
              <p className="text-xs text-gray-600">target date</p>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <Button className={cn("flex-1", styles.boostButton)}>Boost Goal</Button>
            <Button variant="outline" className="flex-1 bg-transparent">
              Pause
            </Button>
          </div>
        </GlassCard>
      </div>

      <div className="px-4 mt-6">
        <GlassCard className="bg-white/80 text-foreground">
          <h3 className="mb-4 flex items-center gap-2 font-semibold">
            <Calendar className="h-5 w-5 text-gray-600" />
            Goal Timeline
          </h3>
          {/* Timeline visualization would go here */}
        </GlassCard>
      </div>

      <div className="px-4 mt-6 mb-8">
        <div className="rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 p-4 text-white">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            <h3 className="font-semibold">AI Analysis</h3>
          </div>
          <p className="text-sm">
            Great progress! If you increase contributions by $50/month, you'll reach your goal 2 months early.
          </p>
        </div>
      </div>
    </div>
  )
}
