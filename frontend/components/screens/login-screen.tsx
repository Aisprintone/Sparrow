"use client"

import type { AppState } from "@/hooks/use-app-state"
import { Zap } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"

export default function LoginScreen({ setCurrentScreen }: { mousePosition: { x: number; y: number } } & AppState) {
  return (
    <div className="flex h-full flex-col items-center justify-center p-6 text-center text-white">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, type: "spring" }}
        className="mb-12"
      >
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg shadow-purple-500/30">
          <Zap className="h-10 w-10 text-white" />
        </div>
        <h1 className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-3xl font-bold text-transparent">
          FinanceAI
        </h1>
        <p className="text-gray-400">Your autonomous financial co-pilot</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, type: "spring" }}
        className="w-full max-w-sm"
      >
        <Button
          onClick={() => setCurrentScreen("profile-selection")}
          size="lg"
          className="w-full rounded-2xl bg-white py-6 text-lg font-semibold text-gray-900 shadow-lg hover:bg-gray-200"
        >
          Continue with FaceID
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 py-6 text-lg font-semibold text-white backdrop-blur-lg hover:bg-white/10"
        >
          Use Passcode
        </Button>
      </motion.div>

      <p className="mt-12 text-sm text-gray-500">Bank-level encryption • SOC2 compliant</p>
    </div>
  )
}
