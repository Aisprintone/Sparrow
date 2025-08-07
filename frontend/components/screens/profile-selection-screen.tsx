"use client"

import { useState, useEffect } from "react"
import type { AppState, Demographic } from "@/hooks/use-app-state"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import GlassCard from "@/components/ui/glass-card"
import { 
  Zap, 
  TrendingUp, 
  GraduationCap, 
  Briefcase, 
  Building2, 
  DollarSign,
  MapPin,
  Calendar,
  ChevronRight,
  Sparkles,
  User,
  Lock,
  Unlock
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ProfileData {
  id: Demographic
  name: string
  age: number
  location: string
  netWorth: number
  income: number
  emoji: string
  gradient: string
  tagline: string
  highlights: string[]
  icon: React.ElementType
  borderGlow: string
  locked?: boolean
}

const profiles: ProfileData[] = [
  {
    id: "genz",
    name: "Gen Z Student",
    age: 23,
    location: "Austin, TX",
    netWorth: -19000, // Student loans minus small savings
    income: 3200,
    emoji: "🎓",
    gradient: "from-purple-500 to-pink-500",
    tagline: "Young Professional",
    highlights: [
      "Building credit history",
      "Managing student loans", 
      "Starting investment journey"
    ],
    icon: GraduationCap,
    borderGlow: "shadow-purple-500/50"
  },
  {
    id: "midcareer",
    name: "Mid-Career Pro",
    age: 33,
    location: "New York, NY", 
    netWorth: 6400, // Small savings minus auto loan
    income: 5800,
    emoji: "💼",
    gradient: "from-blue-500 to-cyan-500",
    tagline: "Mid-Career Professional",
    highlights: [
      "Growing emergency fund",
      "Balancing debt & savings",
      "Career advancement focus"
    ],
    icon: Briefcase,
    borderGlow: "shadow-blue-500/50"
  },
  {
    id: "millennial",
    name: "Established Millennial",
    age: 34,
    location: "New York, NY",
    netWorth: -335000, // Large mortgage but substantial assets
    income: 8500,
    emoji: "🏆", 
    gradient: "from-green-500 to-emerald-500",
    tagline: "Homeowner Investor",
    highlights: [
      "Homeowner with mortgage",
      "Investment portfolio growing", 
      "Tax optimization strategies"
    ],
    icon: Building2,
    borderGlow: "shadow-green-500/50"
  }
]

export default function ProfileSelectionScreen({ 
  setCurrentScreen, 
  demographic,
  setDemographic,
  setProfileData
}: AppState) {
  const [selectedProfile, setSelectedProfile] = useState<Demographic | null>(demographic)
  const [isSwitching, setIsSwitching] = useState(false)
  const [hoveredProfile, setHoveredProfile] = useState<Demographic | null>(null)

  const handleProfileSelect = async (profileId: Demographic) => {
    if (isSwitching) return // Prevent rapid switching
    
    setIsSwitching(true)
    setSelectedProfile(profileId)
    
    // Simulate profile switching delay
    await new Promise(resolve => setTimeout(resolve, 300))
    
    setDemographic(profileId)
    
    // Load profile-specific data
    const profileData = profiles.find(p => p.id === profileId)
    if (profileData) {
      setProfileData({
        netWorth: profileData.netWorth,
        income: profileData.income,
        age: profileData.age,
        location: profileData.location
      })
    }
    
    setIsSwitching(false)
    setCurrentScreen('dashboard')
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { y: 30, opacity: 0, scale: 0.95 },
    visible: { 
      y: 0, 
      opacity: 1, 
      scale: 1,
      transition: { 
        type: "spring",
        stiffness: 100,
        damping: 15
      } 
    }
  }

  const pulseAnimation = {
    scale: [1, 1.02, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }



  return (
    <div className="relative flex h-[100dvh] flex-col p-6 text-white">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-radial from-purple-500/20 to-transparent animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-radial from-blue-500/20 to-transparent animate-pulse delay-1000" />
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative z-10 text-center mb-8"
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 shadow-xl shadow-purple-500/30">
          <Zap className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
          Welcome to FinanceAI
        </h1>
        <p className="text-gray-400 text-sm">Select a profile to explore personalized insights</p>
      </motion.div>

      {/* Profile Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex-1 space-y-4 overflow-y-auto pb-4"
      >
        {profiles.map((profile, index) => {
          const isSelected = selectedProfile === profile.id
          const isHovered = hoveredProfile === profile.id
          const Icon = profile.icon

          return (
            <motion.div
              key={profile.id}
              variants={itemVariants}
              animate={isHovered && !isSwitching ? pulseAnimation : {}}
              onHoverStart={() => setHoveredProfile(profile.id)}
              onHoverEnd={() => setHoveredProfile(null)}
              className="relative"
            >
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute inset-0 bg-gradient-to-r from-purple-500/30 to-blue-500/30 rounded-2xl blur-xl"
                  />
                )}
              </AnimatePresence>

              <GlassCard
                className={cn(
                  "relative cursor-pointer transition-all duration-300",
                  "hover:shadow-xl",
                  profile.borderGlow,
                  isSelected && "ring-2 ring-white/50 scale-[1.02]",
                  profile.locked && "opacity-60",
                  !profile.locked && "hover:scale-[1.01]"
                )}
                onClick={() => !profile.locked && !isSwitching && handleProfileSelect(profile.id)}
              >
                <div className="flex items-start gap-4">
                  {/* Avatar Section */}
                  <div className="relative">
                    <div className={cn(
                      "w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center",
                      profile.gradient,
                      "shadow-lg"
                    )}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    {profile.locked && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center">
                        <Lock className="h-3 w-3 text-gray-400" />
                      </div>
                    )}
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                      >
                        <Sparkles className="h-3 w-3 text-white" />
                      </motion.div>
                    )}
                  </div>

                  {/* Profile Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          {profile.name}
                          <span className="text-base">{profile.emoji}</span>
                        </h3>
                        <p className={cn(
                          "text-xs font-medium",
                          profile.id === "genz" && "text-purple-400",
                          profile.id === "midcareer" && "text-blue-400",
                          profile.id === "millennial" && "text-green-400"
                        )}>
                          {profile.tagline}
                        </p>
                      </div>
                      {!profile.locked && (
                        <ChevronRight className={cn(
                          "h-5 w-5 text-gray-400 transition-transform",
                          isHovered && "translate-x-1"
                        )} />
                      )}
                    </div>

                    {/* Stats Row */}
                    <div className="flex items-center gap-4 mb-3 text-xs">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span className="text-gray-300">Age {profile.age}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        <span className="text-gray-300">{profile.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-gray-400" />
                        <span className="text-gray-300">${(profile.income / 1000).toFixed(2)}k/mo</span>
                      </div>
                    </div>

                    {/* Net Worth Badge */}
                    <div className="mb-3">
                      <div className={cn(
                        "inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium",
                        profile.netWorth >= 0 
                          ? "bg-green-500/20 text-green-300" 
                          : "bg-red-500/20 text-red-300"
                      )}>
                        <TrendingUp className="h-3 w-3" />
                        Net Worth: ${Math.abs(profile.netWorth).toLocaleString()}
                        {profile.netWorth < 0 && " (debt)"}
                      </div>
                    </div>

                    {/* Highlights */}
                    <div className="space-y-1">
                      {profile.highlights.map((highlight, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + idx * 0.1 }}
                          className="flex items-center gap-2 text-xs text-gray-400"
                        >
                          <div className="w-1 h-1 bg-gray-500 rounded-full" />
                          <span>{highlight}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Loading Overlay */}
                <AnimatePresence>
                  {isSelected && isSwitching && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-2xl flex items-center justify-center"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Sparkles className="h-6 w-6 text-white" />
                        </motion.div>
                        <p className="text-sm text-white font-medium">Loading Profile...</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </GlassCard>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Quick Switch Note */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="relative z-10 text-center mt-4"
      >
        <p className="text-xs text-gray-500">
          You can switch profiles anytime from the dashboard
        </p>
      </motion.div>
    </div>
  )
}