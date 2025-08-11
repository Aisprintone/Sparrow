"use client"

import { AnimatePresence, motion } from "framer-motion"
import useAppState from "@/hooks/use-app-state"

import LoginScreen from "@/components/screens/login-screen"
import DashboardScreen from "@/components/screens/dashboard-screen"
import GoalsScreen from "@/components/screens/goals-screen"
import CreateGoalScreen from "@/components/screens/create-goal-screen"
import GoalDetailScreen from "@/components/screens/goal-detail-screen"
import SimulationsScreen from "@/components/screens/simulations-screen"
import SimulationSetupScreen from "@/components/screens/simulation-setup-screen"
import SimulatingScreen from "@/components/screens/simulating-screen"
import SimulationResultsScreen from "@/components/screens/simulation-results-screen"
import ProfileScreen from "@/components/screens/profile-screen"
import ProfileSelectionScreen from "@/components/screens/profile-selection-screen"
import ConnectAccountScreen from "@/components/screens/connect-account-screen"
import CreditScoreScreen from "@/components/screens/credit-score-screen"
import BillsScreen from "@/components/screens/bills-screen"
import NetWorthDetailScreen from "@/components/screens/net-worth-detail-screen"
import ChatScreen from "@/components/screens/chat-screen"
import GoalFeedbackDrawer from "@/components/ui/goal-feedback-drawer"
import AIChatDrawer from "@/components/ui/ai-chat-drawer"
import SpendTrackingScreen from "@/components/screens/spend-tracking-screen-v2"
import AIActionsScreen from "@/components/screens/ai-actions-screen-refactored"
import ActionDetailScreen from "@/components/screens/action-detail-screen"

import BottomNav from "@/components/nav/bottom-nav"
import ThoughtDetailDrawer from "@/components/ui/thought-detail-drawer"

export default function FinanceAppUI() {
  const appState = useAppState()
  const { currentScreen, selectedSimulations, isChatOpen } = appState

  const screens = {
    login: <LoginScreen {...appState} />,
    "profile-selection": <ProfileSelectionScreen {...appState} />,
    dashboard: <DashboardScreen {...appState} />,
    goals: <GoalsScreen {...appState} />,
    "create-goal": <CreateGoalScreen {...appState} />,
    "goal-detail": <GoalDetailScreen {...appState} />,
    simulations: <SimulationsScreen {...appState} />,
    "simulation-setup": <SimulationSetupScreen {...appState} />,
    simulating: <SimulatingScreen {...appState} />,
    "simulation-results": <SimulationResultsScreen {...appState} />,
    profile: <ProfileScreen {...appState} />,
    "connect-account": <ConnectAccountScreen {...appState} />,
    "credit-score": <CreditScoreScreen {...appState} />,
    bills: <BillsScreen {...appState} />,
    "net-worth-detail": <NetWorthDetailScreen {...appState} />,
    "spend-tracking": <SpendTrackingScreen {...appState} />,
    "ai-actions": <AIActionsScreen {...appState} />,
    "action-detail": <ActionDetailScreen {...appState} />,
  }

  const screenVariants = {
    initial: { opacity: 0, scale: 0.98 },
    in: { opacity: 1, scale: 1 },
    out: { opacity: 0, scale: 1.02 },
  }

  const transition = {
    type: "spring",
    stiffness: 300,
    damping: 30,
  }

  const showSimulationsButton = currentScreen === "simulations" && selectedSimulations.length > 0
  const showNav =
    currentScreen !== "login" && currentScreen !== "profile-selection" &&
    currentScreen !== "simulating" &&
    !showSimulationsButton

  return (
    <main className="relative mx-auto flex h-[100dvh] max-h-[896px] w-full max-w-[414px] flex-col overflow-x-hidden overflow-y-auto rounded-3xl bg-black font-sans text-white shadow-2xl ring-1 ring-white/10">
      <div className="aurora-bg" />
      <div className="relative z-10 flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScreen}
            initial="initial"
            animate="in"
            exit="out"
            variants={screenVariants}
            transition={transition}
            className="h-full"
          >
            {screens[currentScreen]}
          </motion.div>
        </AnimatePresence>
      </div>
      <AnimatePresence>{showNav && <BottomNav {...appState} />}</AnimatePresence>
      <ThoughtDetailDrawer {...appState} />
      <GoalFeedbackDrawer {...appState} />
      <AIChatDrawer 
        isOpen={appState.isAIChatOpen}
        onClose={() => appState.setAIChatOpen(false)}
        selectedAction={appState.selectedActionForChat}
      />
      <ChatScreen {...appState} />
    </main>
  )
}
