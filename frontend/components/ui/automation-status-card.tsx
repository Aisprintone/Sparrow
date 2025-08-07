"use client"

import type { AutomationAction } from "@/lib/data"
import { Bot, Check, RefreshCw } from "lucide-react"
import GlassCard from "./glass-card"
import { cn } from "@/lib/utils"

interface AutomationStatusCardProps {
  automation: AutomationAction
}

export default function AutomationStatusCard({ automation }: AutomationStatusCardProps) {
  const getIcon = (status: "completed" | "in_progress" | "pending") => {
    switch (status) {
      case "completed":
        return <Check className="h-4 w-4 text-green-400" />
      case "in_progress":
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-400" style={{ animationDuration: "3s" }} />
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-500" />
    }
  }

  return (
    <GlassCard>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/10">
          <Bot className="h-5 w-5 text-gray-300" />
        </div>
        <div>
          <h3 className="font-semibold text-white">{automation.title}</h3>
          <p className="text-sm text-gray-400">{automation.description}</p>
        </div>
      </div>
      <div className="relative mt-4 pl-5">
        {automation.steps.map((step, index) => (
          <div key={index} className="relative flex items-start pb-4">
            {index !== automation.steps.length - 1 && (
              <div
                className={cn(
                  "absolute left-[7px] top-[18px] h-full w-0.5",
                  step.status === "completed" ? "bg-blue-500" : "bg-gray-700",
                )}
              />
            )}
            <div
              className={cn(
                "z-10 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full ring-4 ring-gray-900",
                step.status === "completed" && "bg-blue-500",
                step.status === "in_progress" && "bg-blue-500",
                step.status === "pending" && "bg-gray-700",
              )}
            >
              {getIcon(step.status)}
            </div>
            <p className={cn("ml-3 text-sm", step.status === "pending" ? "text-gray-500" : "text-gray-300")}>
              {step.name}
            </p>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}
