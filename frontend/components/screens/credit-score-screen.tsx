"use client"

import type { AppState } from "@/hooks/use-app-state"
import { ChevronLeft, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { creditScore } from "@/lib/data"
import { cn } from "@/lib/utils"

const factorStyles = {
  excellent: { icon: TrendingUp, color: "text-green-400", bg: "bg-green-500/20" },
  good: { icon: TrendingUp, color: "text-green-400", bg: "bg-green-500/20" },
  fair: { icon: Minus, color: "text-yellow-400", bg: "bg-yellow-500/20" },
  poor: { icon: TrendingDown, color: "text-red-400", bg: "bg-red-500/20" },
}

export default function CreditScoreScreen({ setCurrentScreen }: AppState) {
  const score = creditScore.score
  const scorePercentage = ((score - 300) / 550) * 100

  return (
    <div className="pb-24">
      <header className="p-4">
        <Button onClick={() => setCurrentScreen("dashboard")} variant="ghost" className="text-white hover:bg-white/20">
          <ChevronLeft className="mr-2 h-5 w-5" />
          Dashboard
        </Button>
      </header>

      <div className="p-6 text-center">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <div className="relative mx-auto h-48 w-48">
            <svg className="h-full w-full" viewBox="0 0 36 36">
              <path
                className="stroke-current text-white/10"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                strokeWidth="3"
              />
              <path
                className="stroke-current text-green-400"
                strokeDasharray={`${scorePercentage}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                strokeLinecap="round"
                strokeWidth="3"
                transform="rotate(90 18 18)"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-bold text-white">{score}</span>
              <span className="font-semibold text-green-400">Excellent</span>
            </div>
          </div>
        </motion.div>
        <p className="mt-4 text-sm text-gray-400">Updated today</p>
      </div>

      <div className="px-4">
        <h2 className="mb-3 text-lg font-semibold text-white">What's impacting your score</h2>
        <div className="space-y-3">
          {creditScore.factors.map((factor, i) => (
            <motion.div
              key={factor.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0, transition: { delay: 0.2 + i * 0.1 } }}
              className="rounded-2xl border border-white/10 bg-white/5 p-4"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-300">{factor.name}</span>
                <span className={cn("font-semibold", factorStyles[factor.status].color)}>{factor.value}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-gray-400">Impact: {factor.impact}</span>
                <span className={cn("capitalize", factorStyles[factor.status].color)}>{factor.status}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
