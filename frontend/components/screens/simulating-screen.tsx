"use client"

import type { AppState } from "@/hooks/use-app-state"
import { RefreshCw, Brain, TrendingUp, Calculator, Zap } from "lucide-react"
import { motion } from "framer-motion"
import { Progress } from "@/components/ui/progress"

export default function SimulatingScreen({ selectedSimulations, simulationProgress, isGeneratingExplanations }: AppState) {
  // Get dynamic loading message based on progress
  const getLoadingMessage = () => {
    if (simulationProgress < 20) {
      return "Analyzing your financial profile..."
    } else if (simulationProgress < 40) {
      return "Running Monte Carlo simulations..."
    } else if (simulationProgress < 60) {
      return "Calculating risk scenarios..."
    } else if (simulationProgress < 80) {
      return "Generating personalized recommendations..."
    } else if (isGeneratingExplanations) {
      return "Creating AI-powered action plans..."
    } else {
      return "Finalizing results..."
    }
  }

  // Get appropriate icon based on stage
  const getLoadingIcon = () => {
    if (simulationProgress < 20) {
      return <Calculator className="h-12 w-12 animate-pulse text-blue-400" />
    } else if (simulationProgress < 40) {
      return <RefreshCw className="h-12 w-12 animate-spin text-purple-400" style={{ animationDuration: "2s" }} />
    } else if (simulationProgress < 60) {
      return <TrendingUp className="h-12 w-12 animate-pulse text-green-400" />
    } else if (isGeneratingExplanations) {
      return <Brain className="h-12 w-12 animate-pulse text-yellow-400" />
    } else {
      return <Zap className="h-12 w-12 animate-pulse text-orange-400" />
    }
  }

  return (
    <div className="flex h-[100dvh] flex-col items-center justify-center p-6 text-white">
      {/* 3D Animation Container */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative mb-8 h-48 w-48"
      >
        <motion.div
          className="absolute inset-0 rounded-full bg-white/20"
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
        ></motion.div>
        <motion.div
          className="absolute inset-4 rounded-full bg-white/30"
          animate={{ scale: [1, 0.9, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, delay: 0.5 }}
        ></motion.div>
        <motion.div
          className="absolute inset-8 rounded-full bg-white/40"
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, delay: 1 }}
        ></motion.div>
        
        {/* Central Icon */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        >
          {getLoadingIcon()}
        </motion.div>
      </motion.div>

      {/* Progress Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-6"
      >
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-300">Progress</span>
            <span className="text-white font-semibold">{simulationProgress}%</span>
          </div>
          <Progress 
            value={simulationProgress} 
            className="h-3 bg-white/10"
          />
        </div>

        {/* Loading Message */}
        <motion.div
          key={getLoadingMessage()}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h2 className="text-xl font-semibold text-white mb-2">
            {getLoadingMessage()}
          </h2>
          <p className="text-gray-400 text-sm">
            This may take a few moments...
          </p>
        </motion.div>

        {/* Stage Indicators */}
        <div className="flex justify-center space-x-2">
          {[
            { stage: "Profile", active: simulationProgress >= 10 },
            { stage: "Simulation", active: simulationProgress >= 30 },
            { stage: "Analysis", active: simulationProgress >= 50 },
            { stage: "AI", active: simulationProgress >= 70 },
            { stage: "Complete", active: simulationProgress >= 90 }
          ].map((indicator, index) => (
            <motion.div
              key={indicator.stage}
              className={`w-2 h-2 rounded-full ${
                indicator.active ? 'bg-blue-400' : 'bg-gray-600'
              }`}
              initial={{ scale: 0 }}
              animate={{ scale: indicator.active ? 1 : 0.8 }}
              transition={{ delay: index * 0.1 }}
            />
          ))}
        </div>
      </motion.div>

      {/* Floating Particles */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-blue-400 rounded-full"
            style={{
              left: `${20 + (i * 15)}%`,
              top: `${30 + (i * 10)}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 2 + i * 0.5,
              repeat: Number.POSITIVE_INFINITY,
              delay: i * 0.3,
            }}
          />
        ))}
      </motion.div>
    </div>
  )
}
