"use client"

import type { AppState } from "@/hooks/use-app-state"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"

export default function ThoughtDetailDrawer({ isThoughtDetailOpen, setThoughtDetailOpen, selectedThought }: AppState) {
  return (
    <AnimatePresence>
      {isThoughtDetailOpen && selectedThought && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setThoughtDetailOpen(false)}
            className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-40 max-h-[85vh] min-h-[50vh] rounded-t-3xl bg-gray-900 text-white mx-auto max-w-[414px] w-full"
          >
            <div className="relative p-4 sm:p-6">
              <div className="absolute top-3 left-1/2 h-1.5 w-12 -translate-x-1/2 rounded-full bg-gray-700" />
              <button
                onClick={() => setThoughtDetailOpen(false)}
                className="absolute top-4 right-4 rounded-full p-1 text-gray-400 hover:bg-gray-700"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mt-6 flex items-center gap-3 sm:gap-4">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white/10 text-xl sm:text-2xl">
                  {selectedThought.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg sm:text-xl font-bold truncate">{selectedThought.title || `Thought ${selectedThought.id}`}</h2>
                  <p className="text-xs sm:text-sm text-gray-400">AI Analysis</p>
                </div>
              </div>
            </div>
            <div className="h-[1px] bg-white/10" />
            <div className="max-h-[calc(85vh-140px)] overflow-y-auto p-4 sm:p-6">
              {selectedThought.detailed_insights ? (
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-2">
                      Simulation Mechanics Explained
                    </h3>
                    <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
                      {selectedThought.detailed_insights.mechanics_explanation}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-2">
                      Key Insights from Your Data
                    </h3>
                    <ul className="space-y-2">
                      {selectedThought.detailed_insights.key_insights.map((insight, index) => (
                        <li key={index} className="text-sm sm:text-base text-gray-300 flex items-start gap-2">
                          <span className="text-blue-400 mt-1 flex-shrink-0">•</span>
                          <span className="min-w-0">{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-2">
                      Scenario-Specific Nuances
                    </h3>
                    <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
                      {selectedThought.detailed_insights.scenario_nuances}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-2">
                      Decision-Making Context
                    </h3>
                    <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
                      {selectedThought.detailed_insights.decision_context}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="whitespace-pre-line text-sm sm:text-base leading-relaxed text-gray-300">
                  {selectedThought.detailedExplanation}
                </p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
