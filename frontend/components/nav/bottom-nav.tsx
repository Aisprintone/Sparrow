"use client"

import type React from "react"

import type { AppState, Screen } from "@/hooks/use-app-state"
import { Home, Zap, Lightbulb, Receipt } from "lucide-react"
import { motion } from "framer-motion"

const navItems: { screen: Screen; label: string; icon: React.ElementType }[] = [
  { screen: "dashboard", label: "Home", icon: Home },
  { screen: "ai-actions", label: "AI Actions", icon: Zap },
  { screen: "simulations", label: "Simulations", icon: Lightbulb },
  { screen: "spend-tracking", label: "Spending", icon: Receipt },
]

export default function BottomNav({ currentScreen, setCurrentScreen }: AppState) {
  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="absolute bottom-0 left-0 right-0 z-20 border-t border-white/10 bg-black/80 backdrop-blur-xl"
    >
      <div className="flex justify-around py-2">
        {navItems.map(({ screen, label, icon: Icon }) => {
          const isActive = currentScreen === screen
          return (
            <button
              key={screen}
              onClick={() => setCurrentScreen(screen)}
              className="flex flex-col items-center rounded-xl p-2 transition-colors hover:bg-white/5"
              aria-label={label}
            >
              <div
                className={`mb-1 flex h-8 w-12 items-center justify-center rounded-xl transition-all ${
                  isActive ? "bg-gradient-to-br from-purple-500 to-blue-500" : "bg-white/10"
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span className={`text-xs transition-colors ${isActive ? "text-purple-400" : "text-gray-400"}`}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </motion.div>
  )
}
