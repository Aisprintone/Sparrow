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
  Phone,
  DollarSign,
  Home,
  GraduationCap,
  MapPin,
  Shield,
  Download,
  MessageSquare,
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
    <div className="flex h-[100dvh] flex-col">
      <header className="p-3 text-white">
        <h1 className="text-xl font-bold">Profile</h1>
        <p className="text-white/80">Manage your account settings</p>
      </header>

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-5 p-3">
        {/* Personal Information */}
        <div>
          <h2 className="text-base font-semibold text-white mb-3">Personal Information</h2>
          <div className="space-y-2">
            <button className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-blue-400" />
                <div>
                  <p className="text-sm font-medium text-white">Name</p>
                  <p className="text-xs text-white/60">John Doe</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-white/40" />
            </button>
            
            <button className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-green-400" />
                <div>
                  <p className="text-sm font-medium text-white">Email</p>
                  <p className="text-xs text-white/60">john.doe@example.com</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-white/40" />
            </button>
            
            <button className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-purple-400" />
                <div>
                  <p className="text-sm font-medium text-white">Phone</p>
                  <p className="text-xs text-white/60">+1 (555) 123-4567</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-white/40" />
            </button>
          </div>
        </div>

        {/* Financial Profile */}
        <div>
          <h2 className="text-base font-semibold text-white mb-3">Financial Profile</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-400" />
                <div>
                  <p className="text-sm font-medium text-white">Annual Income</p>
                  <p className="text-xs text-white/60">$85,000</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-white/40" />
            </div>
            
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-blue-400" />
                <div>
                  <p className="text-sm font-medium text-white">Housing Status</p>
                  <p className="text-xs text-white/60">Renting</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-white/40" />
            </div>
            
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-purple-400" />
                <div>
                  <p className="text-sm font-medium text-white">Education Level</p>
                  <p className="text-xs text-white/60">Bachelor's Degree</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-white/40" />
            </div>
            
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-orange-400" />
                <div>
                  <p className="text-sm font-medium text-white">Location</p>
                  <p className="text-xs text-white/60">San Francisco, CA</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-white/40" />
            </div>
          </div>
        </div>

        {/* Account Settings */}
        <div>
          <h2 className="text-base font-semibold text-white mb-3">Account Settings</h2>
          <div className="space-y-2">
            <button className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-red-400" />
                <div>
                  <p className="text-sm font-medium text-white">Privacy & Security</p>
                  <p className="text-xs text-white/60">Manage your privacy settings</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-white/40" />
            </button>
            
            <button className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-yellow-400" />
                <div>
                  <p className="text-sm font-medium text-white">Notifications</p>
                  <p className="text-xs text-white/60">Configure alerts and reminders</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-white/40" />
            </button>
            
            <button className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4 text-blue-400" />
                <div>
                  <p className="text-sm font-medium text-white">Export Data</p>
                  <p className="text-xs text-white/60">Download your financial data</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-white/40" />
            </button>
          </div>
        </div>

        {/* Support & Help */}
        <div>
          <h2 className="text-base font-semibold text-white mb-3">Support & Help</h2>
          <div className="space-y-2">
            <button className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-green-400" />
                <div>
                  <p className="text-sm font-medium text-white">Help Center</p>
                  <p className="text-xs text-white/60">Find answers to common questions</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-white/40" />
            </button>
            
            <button className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-purple-400" />
                <div>
                  <p className="text-sm font-medium text-white">Contact Support</p>
                  <p className="text-xs text-white/60">Get help from our team</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-white/40" />
            </button>
          </div>
        </div>

        {/* Logout */}
        <div className="pt-4">
          <button 
            onClick={() => setCurrentScreen("login")}
            className="w-full justify-center p-3 text-base font-medium text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-400 border border-red-500/20 rounded-lg"
          >
            Sign Out
          </button>
        </div>
      </motion.div>
    </div>
  )
}
