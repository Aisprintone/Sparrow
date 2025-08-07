"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Zap, Target, Sparkles, Info, Check, Clock, Shield, 
  TrendingUp, DollarSign, ArrowRight, Play, Plus
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import GlassCard from "@/components/ui/glass-card"

// Action type configuration for consistent visual language
const actionTypeConfig = {
  automation: {
    gradient: "from-blue-500/20 to-cyan-500/20",
    border: "border-blue-500/30",
    icon: Zap,
    iconBg: "from-blue-500/20 to-cyan-500/20",
    badge: { 
      bg: "bg-blue-500/20", 
      text: "text-blue-300", 
      label: "Quick Automation" 
    },
    button: {
      gradient: "from-blue-600 to-cyan-600",
      hoverGradient: "hover:from-blue-700 hover:to-cyan-700",
      label: "Automate Now",
      icon: Play
    },
    glow: "hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]",
    pulse: "hover:animate-pulse"
  },
  goal: {
    gradient: "from-purple-500/20 to-pink-500/20",
    border: "border-purple-500/30",
    icon: Target,
    iconBg: "from-purple-500/20 to-pink-500/20",
    badge: { 
      bg: "bg-purple-500/20", 
      text: "text-purple-300", 
      label: "Financial Goal" 
    },
    button: {
      gradient: "from-purple-600 to-pink-600",
      hoverGradient: "hover:from-purple-700 hover:to-pink-700",
      label: "Set as Goal",
      icon: Plus
    },
    glow: "hover:shadow-[0_0_30px_rgba(168,85,247,0.3)]",
    pulse: ""
  },
  hybrid: {
    gradient: "from-emerald-500/20 to-teal-500/20",
    border: "border-emerald-500/30",
    icon: Sparkles,
    iconBg: "from-emerald-500/20 to-teal-500/20",
    badge: { 
      bg: "bg-emerald-500/20", 
      text: "text-emerald-300", 
      label: "Smart Action" 
    },
    button: {
      gradient: "from-emerald-600 to-teal-600",
      hoverGradient: "hover:from-emerald-700 hover:to-teal-700",
      label: "Smart Setup",
      icon: Sparkles
    },
    glow: "hover:shadow-[0_0_30px_rgba(16,185,129,0.3)]",
    pulse: ""
  }
}

// Educational content for tooltips
const educationalContent = {
  automation: {
    title: "What is Automation?",
    points: [
      "Runs automatically without your input",
      "Completes in 2-5 minutes",
      "Makes immediate changes to optimize finances",
      "You can pause or cancel anytime"
    ],
    timeframe: "Immediate action"
  },
  goal: {
    title: "What is a Financial Goal?",
    points: [
      "Set a target amount to save",
      "Track progress over weeks or months",
      "Get reminders and milestone celebrations",
      "Adjust contributions as needed"
    ],
    timeframe: "Long-term tracking"
  },
  hybrid: {
    title: "What is a Smart Action?",
    points: [
      "Immediate optimization + goal tracking",
      "Automates savings right away",
      "Tracks long-term financial impact",
      "Adapts strategy based on progress"
    ],
    timeframe: "Instant + ongoing"
  }
}

interface ActionTypeCardProps {
  action: {
    id: string
    title: string
    description: string
    type: 'automation' | 'goal' | 'hybrid'
    potentialSaving?: number
    estimatedTime?: string
    targetAmount?: number
    targetDate?: string
    currentProgress?: number
    rationale?: string
    immediateImpact?: string
    longTermImpact?: string
  }
  onPrimaryAction: () => void
  onSecondaryAction?: () => void
  isExpanded?: boolean
  onToggleExpand?: () => void
}

export default function ActionTypeCard({ 
  action, 
  onPrimaryAction, 
  onSecondaryAction,
  isExpanded = false,
  onToggleExpand
}: ActionTypeCardProps) {
  const [showEducation, setShowEducation] = useState(false)
  const config = actionTypeConfig[action.type]
  const education = educationalContent[action.type]
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <GlassCard 
        className={`
          relative overflow-hidden
          bg-gradient-to-br ${config.gradient} 
          border ${config.border}
          ${config.glow} ${config.pulse}
          transition-all duration-300
          h-auto min-h-[320px] flex flex-col
        `}
      >
        {/* Type Badge - Top Right */}
        <div className="absolute top-4 right-4 z-10">
          <Badge 
            className={`
              ${config.badge.bg} ${config.badge.text}
              backdrop-blur-sm border border-white/10
              flex items-center gap-1.5 px-2.5 py-1
            `}
          >
            <Icon className="h-3 w-3" />
            {config.badge.label}
          </Badge>
        </div>

        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-gradient-to-br from-white/20 to-transparent blur-2xl" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-gradient-to-tr from-white/20 to-transparent blur-2xl" />
        </div>

        <div className="relative flex-1 p-6">
          {/* Header with Icon */}
          <div className="flex items-start gap-4 mb-4">
            <motion.div 
              className={`
                flex h-12 w-12 flex-shrink-0 items-center justify-center 
                rounded-xl bg-gradient-to-br ${config.iconBg} 
                border border-white/20 backdrop-blur-sm
              `}
              whileHover={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 0.5 }}
            >
              <Icon className="h-6 w-6 text-white" />
            </motion.div>
            
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold text-white">{action.title}</h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setShowEducation(!showEducation)}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs bg-gray-900 border border-gray-700">
                      <div className="space-y-3 p-1">
                        <p className="font-medium text-white">{education.title}</p>
                        <ul className="text-xs space-y-1.5 text-gray-300">
                          {education.points.map((point, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <Check className="h-3 w-3 text-green-400 mt-0.5 flex-shrink-0" />
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="pt-2 border-t border-gray-700">
                          <p className="text-xs text-gray-400">
                            <Clock className="inline h-3 w-3 mr-1" />
                            {education.timeframe}
                          </p>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">{action.description}</p>
            </div>
          </div>

          {/* Impact Metrics */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {action.potentialSaving && (
              <div className="flex items-center gap-2 text-xs text-gray-300">
                <DollarSign className="h-3.5 w-3.5 text-green-400" />
                <span className="font-medium">+${action.potentialSaving}/mo</span>
              </div>
            )}
            
            {action.estimatedTime && (
              <div className="flex items-center gap-2 text-xs text-gray-300">
                <Clock className="h-3.5 w-3.5 text-blue-400" />
                <span>{action.estimatedTime}</span>
              </div>
            )}
            
            {action.targetAmount && (
              <div className="flex items-center gap-2 text-xs text-gray-300">
                <Target className="h-3.5 w-3.5 text-purple-400" />
                <span>${action.targetAmount} goal</span>
              </div>
            )}
            
            <div className="flex items-center gap-2 text-xs text-gray-300">
              <Shield className="h-3.5 w-3.5 text-emerald-400" />
              <span>Low risk</span>
            </div>
          </div>

          {/* Type-Specific Content */}
          {action.type === 'automation' && (
            <div className="mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center gap-2 text-xs text-blue-300">
                <Zap className="h-3.5 w-3.5" />
                <span>Immediate automation in 3 steps</span>
              </div>
            </div>
          )}

          {action.type === 'goal' && action.currentProgress !== undefined && (
            <div className="mb-4 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-purple-300">Progress to goal</span>
                  <span className="text-purple-400 font-medium">{action.currentProgress}%</span>
                </div>
                <div className="w-full bg-purple-900/50 rounded-full h-1.5">
                  <motion.div
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-1.5 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${action.currentProgress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>
            </div>
          )}

          {action.type === 'hybrid' && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-emerald-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>2-in-1 Smart Action</span>
                </div>
                <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
              </div>
            </div>
          )}

          {/* Expanded Content */}
          <AnimatePresence>
            {isExpanded && action.rationale && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 p-4 rounded-lg bg-black/20 border border-white/10"
              >
                <h4 className="text-sm font-medium text-white mb-2">Why this makes sense:</h4>
                <p className="text-sm text-gray-300 leading-relaxed">{action.rationale}</p>
                
                {action.immediateImpact && (
                  <div className="mt-3 flex items-start gap-2">
                    <Zap className="h-4 w-4 text-blue-400 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-blue-300">Immediate Impact</p>
                      <p className="text-xs text-gray-400">{action.immediateImpact}</p>
                    </div>
                  </div>
                )}
                
                {action.longTermImpact && (
                  <div className="mt-2 flex items-start gap-2">
                    <Target className="h-4 w-4 text-purple-400 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-purple-300">Long-term Impact</p>
                      <p className="text-xs text-gray-400">{action.longTermImpact}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 p-6 pt-0">
          <Button 
            size="sm" 
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-800/50 backdrop-blur-sm"
            onClick={onToggleExpand || onSecondaryAction}
          >
            {onToggleExpand ? (isExpanded ? "Hide Details" : "Learn More") : "Maybe Later"}
          </Button>
          
          <Button
            size="sm"
            className={`
              flex-1 text-white font-medium
              bg-gradient-to-r ${config.button.gradient} 
              ${config.button.hoverGradient}
              transition-all duration-200
              hover:scale-[1.02] active:scale-[0.98]
            `}
            onClick={onPrimaryAction}
          >
            <config.button.icon className="mr-2 h-4 w-4" />
            {config.button.label}
          </Button>
        </div>
      </GlassCard>
    </motion.div>
  )
}