"use client"

import type { Goal } from "@/lib/data"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface GoalMilestoneTrackerProps {
  goal: Goal
}

export default function GoalMilestoneTracker({ goal }: GoalMilestoneTrackerProps) {
  return (
    <div className="relative mt-4 px-4 pb-2">
      {goal.milestones.map((milestone, index) => {
        const isCompleted = goal.current >= milestone.target
        const isCurrent =
          goal.current < milestone.target && (index === 0 || goal.current >= goal.milestones[index - 1].target)

        return (
          <div key={index} className="relative flex items-start pb-6">
            {index !== goal.milestones.length - 1 && (
              <div
                className={cn("absolute left-[11px] top-2 h-full w-0.5", isCompleted ? "bg-blue-500" : "bg-gray-200")}
              />
            )}
            <div
              className={cn(
                "z-10 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full",
                isCompleted && "bg-blue-500 text-white",
                isCurrent && "bg-blue-100 ring-4 ring-blue-200",
                !isCompleted && !isCurrent && "border-2 border-gray-300 bg-white",
              )}
            >
              {isCompleted && <Check className="h-4 w-4" />}
            </div>
            <div className="ml-4">
              <p className={cn("font-semibold", isCurrent ? "text-blue-600" : "text-gray-800")}>{milestone.name}</p>
              <p className="text-sm text-gray-500">Target: ${milestone.target.toLocaleString()}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
