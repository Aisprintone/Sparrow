"use client"

import type { AppState } from "@/hooks/use-app-state"
import { ChevronLeft, Bookmark, Zap, Check, MoreHorizontal } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { simulationResults } from "@/lib/data"

export default function ResultsScreen({
  setCurrentScreen,
  setSelectedSimulations,
  saveAutomation,
  activeAutomations,
  setSelectedThought,
  setThoughtDetailOpen,
}: AppState) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring" } },
  }

  return (
    <div className="flex h-[100dvh] flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between bg-black/50 p-4 backdrop-blur-lg"
      >
        <Button
          onClick={() => setCurrentScreen("simulations")}
          variant="ghost"
          className="text-white hover:bg-white/20"
        >
          <ChevronLeft className="mr-1 h-5 w-5" />
          Back
        </Button>
        <Button size="icon" variant="ghost" className="text-white hover:bg-white/20">
          <Bookmark className="h-5 w-5" />
        </Button>
      </motion.div>

      {/* Scrollable Story Thread */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-8 text-center text-white">
          <h2 className="text-2xl font-bold">Simulation Results</h2>
          <p className="text-white/80">Your personalized financial pathway</p>
        </div>

        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="relative">
          {/* Connector Line */}
          <div className="absolute left-6 top-2 h-full w-0.5 bg-white/10"></div>

          {simulationResults.map((card) => (
            <motion.div key={card.id} variants={itemVariants} className="relative z-10 mb-6 flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-2xl ring-8 ring-black">
                {card.emoji}
              </div>
              <div className="w-full rounded-2xl bg-gray-900/80 p-4">
                <div className="flex items-center justify-between">
                  {card.title && <h3 className="text-lg font-bold text-white">{card.title}</h3>}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 flex-shrink-0 text-gray-400 hover:bg-white/10"
                    onClick={() => {
                      setSelectedThought(card)
                      setThoughtDetailOpen(true)
                    }}
                  >
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </div>

                {card.type === "automation" ? (
                  <div className="mt-2 space-y-3">
                    {card.automations.map((automation, autoIndex) => {
                      const isActivated = activeAutomations.some((a) => a.title === automation.title)
                      return (
                        <div key={autoIndex} className="rounded-xl bg-black/50 p-3">
                          <h4 className="font-semibold text-white">{automation.title}</h4>
                          <p className="mb-3 text-sm text-gray-400">{automation.description}</p>
                          <Button
                            onClick={() => saveAutomation(automation)}
                            disabled={isActivated}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white disabled:from-gray-500 disabled:to-gray-600 disabled:opacity-70"
                          >
                            {isActivated ? (
                              <>
                                <Check className="mr-2 h-4 w-4" /> Activated
                              </>
                            ) : (
                              <>
                                <Zap className="mr-2 h-4 w-4" /> Activate with 1-Click
                              </>
                            )}
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="mt-1 whitespace-pre-line text-base leading-relaxed text-gray-300">{card.content}</p>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Sticky Action Buttons */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 150, damping: 25, delay: 0.5 }}
        className="flex gap-3 border-t border-white/10 bg-black/80 p-4 backdrop-blur-lg"
      >
        <Button
          onClick={() => setCurrentScreen("dashboard")}
          size="lg"
          variant="outline"
          className="flex-1 rounded-xl border-white/20 bg-white/10 py-6 text-white backdrop-blur-lg hover:bg-white/20"
        >
          View Dashboard
        </Button>
        <Button
          onClick={() => {
            setCurrentScreen("simulations")
            setSelectedSimulations([])
          }}
          size="lg"
          className="flex-1 rounded-xl bg-white py-6 text-gray-900 hover:bg-gray-200"
        >
          Run New Simulation
        </Button>
      </motion.div>
    </div>
  )
}
