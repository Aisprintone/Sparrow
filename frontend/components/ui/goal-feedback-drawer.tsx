"use client"

import type { AppState } from "@/hooks/use-app-state"
import { motion, AnimatePresence } from "framer-motion"
import { X, ArrowDown, ArrowRight, PiggyBank, ShoppingCart } from "lucide-react"

export default function GoalFeedbackDrawer({
  isGoalFeedbackOpen,
  setGoalFeedbackOpen,
  bills,
  monthlySpending,
  monthlyIncome,
  goals,
}: AppState) {
  const totalBills = bills.reduce((sum, bill) => sum + bill.amount, 0)
  const totalGoalContributions = goals.reduce((sum, goal) => sum + goal.monthlyContribution, 0)
  const remainingForGoals = monthlyIncome - totalBills - monthlySpending.total
  const potentialIncrease = remainingForGoals - totalGoalContributions

  return (
    <AnimatePresence>
      {isGoalFeedbackOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setGoalFeedbackOpen(false)}
            className="absolute inset-0 z-30 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute bottom-0 left-0 right-0 z-40 max-h-[85vh] rounded-t-3xl bg-gray-900 text-white"
          >
            <div className="relative p-6">
              <div className="absolute top-3 left-1/2 h-1.5 w-12 -translate-x-1/2 rounded-full bg-gray-700" />
              <button
                onClick={() => setGoalFeedbackOpen(false)}
                className="absolute top-4 right-4 rounded-full p-1 text-gray-400 hover:bg-gray-700"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
              <h2 className="text-xl font-bold">Your Goal-Funding Breakdown</h2>
              <p className="text-sm text-gray-400">How your cash flow powers your ambitions.</p>
            </div>
            <div className="h-[1px] bg-white/10" />
            <div className="max-h-[calc(85vh-100px)] overflow-y-auto p-6">
              <div className="space-y-4">
                {/* Income */}
                <div className="flex items-center justify-between rounded-lg bg-green-500/10 p-3">
                  <div className="flex items-center gap-3">
                    <ArrowDown className="h-5 w-5 text-green-400" />
                    <span className="font-medium">Monthly Income</span>
                  </div>
                  <span className="font-bold text-green-400">
                    +${monthlyIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Spending & Bills */}
                <div className="flex items-center justify-between rounded-lg bg-red-500/10 p-3">
                  <div className="flex items-center gap-3">
                    <ArrowRight className="h-5 w-5 text-red-400" />
                    <span className="font-medium">Spending & Bills</span>
                  </div>
                  <span className="font-bold text-red-400">
                    -${(totalBills + monthlySpending.total).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Equals */}
                <div className="flex justify-center">
                  <div className="h-8 w-px bg-gray-600" />
                </div>

                {/* Available for Goals */}
                <div className="rounded-lg bg-blue-500/10 p-4 text-center">
                  <p className="text-sm text-blue-300">Available to Save</p>
                  <p className="text-3xl font-bold text-blue-400">
                    ${remainingForGoals.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="mt-6">
                  <h3 className="mb-3 text-lg font-semibold">Frank Decisioning</h3>
                  <div className="space-y-3">
                    <div className="rounded-lg bg-white/5 p-4">
                      <div className="flex items-start gap-3">
                        <PiggyBank className="h-6 w-6 flex-shrink-0 text-purple-400" />
                        <div>
                          <h4 className="font-semibold">Accelerate Your Goals</h4>
                          <p className="text-sm text-gray-400">
                            You have an extra{" "}
                            <span className="font-bold text-white">
                              ${potentialIncrease.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </span>{" "}
                            available each month.
                          </p>
                          <button className="mt-2 text-sm font-semibold text-purple-400">
                            Auto-invest the difference &rarr;
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg bg-white/5 p-4">
                      <div className="flex items-start gap-3">
                        <ShoppingCart className="h-6 w-6 flex-shrink-0 text-yellow-400" />
                        <div>
                          <h4 className="font-semibold">Review Spending</h4>
                          <p className="text-sm text-gray-400">
                            Your top category was{" "}
                            <span className="font-bold text-white">{monthlySpending.topCategory.name}</span> at $
                            {monthlySpending.topCategory.amount}.
                          </p>
                          <button className="mt-2 text-sm font-semibold text-yellow-400">
                            Analyze spending patterns &rarr;
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
