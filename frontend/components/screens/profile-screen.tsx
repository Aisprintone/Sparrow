"use client"

import type { AppState } from "@/hooks/use-app-state"
import {
  User,
  CreditCard,
  Bell,
  ShieldCheck,
  HelpCircle,
  FileText,
  LogOut,
  Mail,
  AlertCircle,
  ChevronRight,
  Edit,
} from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import GlassCard from "@/components/ui/glass-card"

export default function ProfileScreen({ setCurrentScreen }: AppState) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring" } },
  }

  return (
    <div className="pb-28">
      <header className="p-6 text-white">
        <h1 className="text-2xl font-bold">Profile</h1>
      </header>

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 p-4">
        {/* Profile Header */}
        <motion.div variants={itemVariants}>
          <GlassCard className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 text-center">
            <div className="relative inline-block mb-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-2xl font-bold text-white">
                JD
              </div>
              <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                <Edit className="h-4 w-4 text-gray-600" />
              </button>
            </div>
            <h2 className="text-xl font-bold text-white">John Doe</h2>
            <p className="text-gray-400">john.doe@email.com</p>
            <p className="text-sm text-gray-500 mt-1">Member since Jan 2024</p>
          </GlassCard>
        </motion.div>

        {/* Account Section */}
        <motion.div variants={itemVariants}>
          <h3 className="text-lg font-semibold text-white mb-3 px-2">Account</h3>
          <GlassCard className="bg-white/5 p-0">
            <div className="divide-y divide-gray-700">
              <button className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-400" />
                  </div>
                  <span className="text-white font-medium">Personal Information</span>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>

              <button
                onClick={() => setCurrentScreen("connect-account")}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-medium">Connected Accounts</p>
                    <p className="text-sm text-gray-400">3 accounts linked</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>
            </div>
          </GlassCard>
        </motion.div>

        {/* Preferences Section */}
        <motion.div variants={itemVariants}>
          <h3 className="text-lg font-semibold text-white mb-3 px-2">Preferences</h3>
          <GlassCard className="bg-white/5 p-0">
            <div className="divide-y divide-gray-700">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <Bell className="h-5 w-5 text-purple-400" />
                  </div>
                  <span className="text-white font-medium">Push Notifications</span>
                </div>
                <Switch defaultChecked={true} />
              </div>

              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
                    <Mail className="h-5 w-5 text-orange-400" />
                  </div>
                  <span className="text-white font-medium">Email Summaries</span>
                </div>
                <Switch defaultChecked={false} />
              </div>

              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <span className="text-white font-medium">Low Balance Alerts</span>
                </div>
                <Switch defaultChecked={true} />
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Security & Support */}
        <motion.div variants={itemVariants}>
          <h3 className="text-lg font-semibold text-white mb-3 px-2">Security & Support</h3>
          <GlassCard className="bg-white/5 p-0">
            <div className="divide-y divide-gray-700">
              <button className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5 text-green-400" />
                  </div>
                  <span className="text-white font-medium">Security Settings</span>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>

              <button className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <HelpCircle className="h-5 w-5 text-blue-400" />
                  </div>
                  <span className="text-white font-medium">Help Center</span>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>

              <button className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-500/20 rounded-xl flex items-center justify-center">
                    <FileText className="h-5 w-5 text-gray-400" />
                  </div>
                  <span className="text-white font-medium">Terms of Service</span>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>
            </div>
          </GlassCard>
        </motion.div>

        {/* Sign Out */}
        <motion.div variants={itemVariants}>
          <Button
            variant="ghost"
            className="w-full justify-center p-4 text-lg font-medium text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-400 border border-red-500/20"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sign Out
          </Button>
        </motion.div>
      </motion.div>
    </div>
  )
}
