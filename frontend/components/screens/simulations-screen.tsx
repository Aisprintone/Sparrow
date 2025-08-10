"use client"

import type { AppState } from "@/hooks/use-app-state"
import { Sparkles, Briefcase, Home, TrendingDown, DollarSign, Star, CreditCard, Heart, Car, Building, Zap, Shield, ArrowLeft, Clock, ChevronRight } from "lucide-react"
import { motion } from "framer-motion"
import GlassCard from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"

const recommendedSimulations = [
  {
    id: "job-loss",
    title: "Job Loss Scenario",
    subtitle: "How long can you survive without income?",
    icon: <Briefcase className="h-8 w-8" />,
    color: "from-red-500/20 to-orange-500/20",
    borderColor: "border-red-500/30",
  },
  {
    id: "medical-crisis",
    title: "Medical Crisis",
    subtitle: "Prepare for unexpected healthcare costs",
    icon: <Heart className="h-8 w-8" />,
    color: "from-pink-500/20 to-red-500/20",
    borderColor: "border-pink-500/30",
  },
  {
    id: "gig-economy",
    title: "Gig Economy Volatility",
    subtitle: "Navigate income uncertainty",
    icon: <Zap className="h-8 w-8" />,
    color: "from-yellow-500/20 to-orange-500/20",
    borderColor: "border-yellow-500/30",
  },
  {
    id: "market-crash",
    title: "Market Crash Impact",
    subtitle: "Test portfolio resilience",
    icon: <TrendingDown className="h-8 w-8" />,
    color: "from-purple-500/20 to-red-500/20",
    borderColor: "border-purple-500/30",
  },
]

const housingSimulations = [
  {
    id: "home-purchase",
    title: "Home Purchase Planning",
    subtitle: "Plan your path to homeownership",
    icon: <Home className="h-8 w-8" />,
    color: "from-blue-500/20 to-purple-500/20",
    borderColor: "border-blue-500/30",
  },
  {
    id: "rent-hike",
    title: "Rent Hike Stress Test",
    subtitle: "Prepare for housing cost increases",
    icon: <Building className="h-8 w-8" />,
    color: "from-indigo-500/20 to-blue-500/20",
    borderColor: "border-indigo-500/30",
  },
]

const debtSimulations = [
  {
    id: "debt-payoff",
    title: "Debt Payoff Strategy",
    subtitle: "Optimize your path to becoming debt-free",
    icon: <CreditCard className="h-8 w-8" />,
    color: "from-green-500/20 to-blue-500/20",
    borderColor: "border-green-500/30",
  },
  {
    id: "student-loan",
    title: "Student Loan Strategy",
    subtitle: "Navigate repayment and forgiveness options",
    icon: <Shield className="h-8 w-8" />,
    color: "from-emerald-500/20 to-green-500/20",
    borderColor: "border-emerald-500/30",
  },
]

const emergencySimulations = [
  {
    id: "emergency-fund",
    title: "Emergency Fund Strategy",
    subtitle: "Build your financial safety net",
    icon: <Shield className="h-8 w-8" />,
    color: "from-teal-500/20 to-green-500/20",
    borderColor: "border-teal-500/30",
  },
  {
    id: "auto-repair",
    title: "Auto Repair Crisis",
    subtitle: "Prepare for transportation emergencies",
    icon: <Car className="h-8 w-8" />,
    color: "from-gray-500/20 to-blue-500/20",
    borderColor: "border-gray-500/30",
  },
]

const otherSimulations = [
  {
    id: "salary-increase",
    title: "Salary Increase",
    subtitle: "Optimize your financial strategy with higher income",
    icon: <DollarSign className="h-8 w-8" />,
    color: "from-green-500/20 to-blue-500/20",
    borderColor: "border-green-500/30",
    disabled: true,
  },
]

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export default function SimulationsScreen({ setCurrentScreen, setCurrentSimulation }: AppState) {
  const handleSimulationClick = (simulation: any) => {
    if (simulation.disabled) return
    setCurrentSimulation(simulation)
    setCurrentScreen("simulation-setup")
  }

  const renderSimulationCards = (simulations: any[], title: string, icon: any) => (
    <div>
      <h2 className="mb-3 flex items-center gap-2 font-semibold text-white">
        {icon}
        {title}
      </h2>

      <div className="space-y-4">
        {simulations.map((sim, i) => (
          <motion.div
            key={sim.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, transition: { delay: i * 0.1 } }}
          >
            <GlassCard
              onClick={() => handleSimulationClick(sim)}
              className={`cursor-pointer bg-gradient-to-r ${sim.color} border-2 ${sim.borderColor} hover:scale-[1.02] transition-all duration-200 ${
                sim.disabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white">
                  {sim.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">{sim.title}</h3>
                  <p className="text-sm text-gray-300">{sim.subtitle}</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  )

  // Combine all simulations for the main list
  const allSimulations = [
    ...recommendedSimulations,
    ...housingSimulations,
    ...debtSimulations,
    ...emergencySimulations,
    ...otherSimulations
  ]

  return (
    <div className="flex h-[100dvh] flex-col">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="p-3 text-white">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Financial Simulations</h1>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setCurrentScreen("dashboard")}
            className="rounded-xl bg-white/20 backdrop-blur-lg hover:bg-white/30"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>

      </motion.div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-3">
          {allSimulations.map((sim) => (
            <motion.div key={sim.id} variants={itemVariants}>
              <GlassCard 
                className="cursor-pointer hover:scale-[1.02] transition-all duration-200"
                onClick={() => handleSimulationClick(sim)}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg">
                    {sim.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-white mb-1">{sim.title}</h3>
                    <p className="text-sm text-white/60 mb-2">{sim.subtitle}</p>
                    <div className="flex items-center gap-2 text-xs text-white/40">
                      <Clock className="h-3 w-3" />
                      <span>5-10 min</span>
                      <span>•</span>
                      <span>Medium complexity</span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-white/40" />
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
