"use client"

import { useState } from "react"
import type { AppState } from "@/hooks/use-app-state"
import { ChevronLeft, Shield, Home, Plane } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"

const goalTypes = [
  { id: "safety", title: "Emergency Fund", icon: <Shield />, color: "green" },
  { id: "home", title: "Buy a Home", icon: <Home />, color: "purple" },
  { id: "experience", title: "Dream Vacation", icon: <Plane />, color: "blue" },
]

export default function CreateGoalScreen({ setCurrentScreen, addGoal }: AppState) {
  const [step, setStep] = useState(1)
  const [goal, setGoal] = useState({
    type: "safety",
    title: "Emergency Fund",
    target: 5000,
    deadline: "",
    monthlyContribution: 250,
    icon: "Shield",
    color: "green",
    current: 0,
    milestones: [],
  })

  const handleNext = () => setStep((s) => s + 1)
  const handleBack = () => {
    if (step === 1) {
      setCurrentScreen("goals")
    } else {
      setStep((s) => s - 1)
    }
  }

  const screenVariants = {
    initial: { opacity: 0, x: 300 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: -300 },
    transition: { type: "spring", stiffness: 300, damping: 30 },
  }

  const Step1_Category = (
    <motion.div key="step1" initial="initial" animate="in" exit="out" variants={screenVariants}>
      <h1 className="mb-4 text-2xl font-bold text-white">What are you saving for?</h1>
      <div className="space-y-3">
        {goalTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => {
              setGoal({
                ...goal,
                type: type.id,
                title: type.title,
                icon: type.icon.type.displayName,
                color: type.color,
              })
              handleNext()
            }}
            className="w-full rounded-2xl border border-white/20 bg-white/10 p-4 text-left text-white transition-colors hover:bg-white/20"
          >
            <div className="flex items-center gap-4">
              <div className="text-2xl">{type.icon}</div>
              <span className="font-semibold">{type.title}</span>
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  )

  const Step2_Target = (
    <motion.div key="step2" initial="initial" animate="in" exit="out" variants={screenVariants}>
      <h1 className="mb-2 text-2xl font-bold text-white">Set your target</h1>
      <p className="mb-8 text-gray-400">How much do you need to save for your {goal.title}?</p>
      <div className="relative text-center">
        <p className="mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-6xl font-bold text-transparent">
          ${goal.target.toLocaleString()}
        </p>
        <Slider
          defaultValue={[goal.target]}
          max={goal.type === "home" ? 100000 : 20000}
          min={1000}
          step={500}
          onValueChange={(value) => setGoal({ ...goal, target: value[0] })}
        />
      </div>
      <Button onClick={handleNext} size="lg" className="mt-12 w-full">
        Continue
      </Button>
    </motion.div>
  )

  const Step3_Timeline = (
    <motion.div key="step3" initial="initial" animate="in" exit="out" variants={screenVariants}>
      <h1 className="mb-2 text-2xl font-bold text-white">When do you need it?</h1>
      <p className="mb-8 text-gray-400">Enter your target date to see your required monthly savings.</p>
      <Input
        type="date"
        className="bg-white/10 text-white"
        onChange={(e) => setGoal({ ...goal, deadline: e.target.value })}
      />
      {goal.deadline && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 rounded-2xl bg-white/10 p-4">
          <p className="text-gray-300">To reach your goal by this date, you'll need to save:</p>
          <p className="text-2xl font-bold text-white">
            $
            {(
              goal.target /
              Math.max(
                1,
                new Date(goal.deadline).getMonth() -
                  new Date().getMonth() +
                  12 * (new Date(goal.deadline).getFullYear() - new Date().getFullYear()),
              )
            ).toFixed(0)}
            /month
          </p>
        </motion.div>
      )}
      <Button onClick={() => addGoal(goal)} size="lg" className="mt-8 w-full">
        Create Goal
      </Button>
    </motion.div>
  )

  const steps = [Step1_Category, Step2_Target, Step3_Timeline]

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="p-4 text-white">
        <Button onClick={handleBack} variant="ghost" className="hover:bg-white/20">
          <ChevronLeft className="mr-2 h-5 w-5" />
          Back
        </Button>
      </header>
      <div className="flex-1 p-4">
        <AnimatePresence mode="wait">{steps[step - 1]}</AnimatePresence>
      </div>
    </div>
  )
}
