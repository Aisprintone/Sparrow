"use client"

import { useState, useEffect } from "react"
import type { AppState } from "@/hooks/use-app-state"
import { ChevronLeft, Shield, Search, Check, RefreshCw, Lock, AlertCircle, ExternalLink } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import GlassCard from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { popularInstitutions } from "@/lib/data"
import Image from "next/image"

// Mock Plaid Link states
type PlaidState = 'idle' | 'connecting' | 'selecting_accounts' | 'success' | 'error'

export default function ConnectAccountScreen({ setCurrentScreen }: AppState) {
  const [selectedInstitution, setSelectedInstitution] = useState(null)
  const [plaidState, setPlaidState] = useState<PlaidState>('idle')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])

  // Mock Plaid Link flow
  const handlePlaidConnect = async (institution) => {
    setSelectedInstitution(institution)
    setPlaidState('connecting')
    
    // Simulate Plaid Link opening
    await new Promise(resolve => setTimeout(resolve, 2000))
    setPlaidState('selecting_accounts')
    
    // Simulate account selection
    await new Promise(resolve => setTimeout(resolve, 3000))
    setSelectedAccounts(['checking', 'savings', 'credit'])
    setPlaidState('success')
    
    // Return to profile after success
    setTimeout(() => {
      setCurrentScreen("profile")
    }, 2000)
  }

  const filteredInstitutions = popularInstitutions.filter(inst => 
    inst.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const renderPlaidFlow = () => {
    switch (plaidState) {
      case 'connecting':
        return (
          <div className="flex h-full items-center justify-center p-4">
            <GlassCard className="w-full max-w-sm bg-white/90 text-center text-foreground">
              <div className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl p-2 ${selectedInstitution.color}`}>
                <Image src={selectedInstitution.logo} alt={selectedInstitution.name} width={48} height={48} />
              </div>
              <h2 className="mb-2 text-xl font-bold">Connecting to {selectedInstitution.name}</h2>
              <p className="mb-6 text-gray-600">Opening secure connection...</p>
              
              <div className="space-y-3 text-left">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center gap-3"
                >
                  <Check className="h-6 w-6 text-green-500" />
                  <span>Secure connection established</span>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.0 }}
                  className="flex items-center gap-3"
                >
                  <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
                  <span>Authenticating with bank</span>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.5 }}
                  className="flex items-center gap-3"
                >
                  <ExternalLink className="h-6 w-6 text-purple-500" />
                  <span>Opening Plaid Link</span>
                </motion.div>
              </div>
            </GlassCard>
          </div>
        )

      case 'selecting_accounts':
        return (
          <div className="flex h-full items-center justify-center p-4">
            <GlassCard className="w-full max-w-sm bg-white/90 text-center text-foreground">
              <div className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl p-2 ${selectedInstitution.color}`}>
                <Image src={selectedInstitution.logo} alt={selectedInstitution.name} width={48} height={48} />
              </div>
              <h2 className="mb-2 text-xl font-bold">Select Accounts</h2>
              <p className="mb-6 text-gray-600">Choose which accounts to connect</p>
              
              <div className="space-y-3 text-left">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <input type="checkbox" checked={selectedAccounts.includes('checking')} readOnly className="rounded" />
                  <div>
                    <div className="font-medium">Chase Checking</div>
                    <div className="text-sm text-gray-500">****1234</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <input type="checkbox" checked={selectedAccounts.includes('savings')} readOnly className="rounded" />
                  <div>
                    <div className="font-medium">Chase Savings</div>
                    <div className="text-sm text-gray-500">****5678</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <input type="checkbox" checked={selectedAccounts.includes('credit')} readOnly className="rounded" />
                  <div>
                    <div className="font-medium">Chase Credit Card</div>
                    <div className="text-sm text-gray-500">****4321</div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        )

      case 'success':
        return (
          <div className="flex h-full items-center justify-center p-4">
            <GlassCard className="w-full max-w-sm bg-white/90 text-center text-foreground">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-500"
              >
                <Check className="h-10 w-10 text-white" />
              </motion.div>
              <h2 className="mb-2 text-xl font-bold text-green-600">Connection Successful!</h2>
              <p className="mb-6 text-gray-600">
                Successfully connected {selectedAccounts.length} accounts from {selectedInstitution.name}
              </p>
              
              <div className="space-y-2 text-left">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Account data synced</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Transaction history imported</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Real-time updates enabled</span>
                </div>
              </div>
            </GlassCard>
          </div>
        )

      default:
        return null
    }
  }

  if (plaidState !== 'idle') {
    return renderPlaidFlow()
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex-shrink-0 p-4 text-white">
        <Button onClick={() => setCurrentScreen("profile")} variant="ghost" className="hover:bg-white/20">
          <ChevronLeft className="mr-2 h-5 w-5" />
          Back to Profile
        </Button>
      </header>
      
      <div className="flex-1 p-4 pb-20">
        <h1 className="mb-4 text-2xl font-bold text-white">Connect Your Accounts</h1>
        <p className="mb-6 text-white/80">Securely connect your financial accounts to get personalized insights</p>
        
        <div className="relative mb-6">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input 
            placeholder="Search for your bank or credit union" 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <h2 className="mb-3 font-semibold text-white">Popular Institutions</h2>
        <motion.div 
          variants={containerVariants} 
          initial="hidden" 
          animate="visible" 
          className="grid grid-cols-2 gap-3"
        >
          {filteredInstitutions.map((inst) => (
            <motion.div key={inst.id} variants={itemVariants}>
              <GlassCard
                onClick={() => handlePlaidConnect(inst)}
                className="cursor-pointer bg-white/80 p-4 text-center text-foreground hover:bg-white/90 transition-colors"
              >
                <div className={`mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl p-1 ${inst.color}`}>
                  <Image src={inst.logo || "/placeholder.svg"} alt={inst.name} width={32} height={32} />
                </div>
                <p className="text-sm font-medium">{inst.name}</p>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>

        <div className="mt-8 space-y-4">
          <GlassCard className="flex items-start gap-3 bg-blue-500/20 text-white">
            <Shield className="h-5 w-5 flex-shrink-0 text-blue-300" />
            <div>
              <h3 className="font-semibold">Bank-level security</h3>
              <p className="text-sm text-white/80">
                We use 256-bit encryption and never store your login credentials.
              </p>
            </div>
          </GlassCard>

          <GlassCard className="flex items-start gap-3 bg-green-500/20 text-white">
            <Check className="h-5 w-5 flex-shrink-0 text-green-300" />
            <div>
              <h3 className="font-semibold">Read-only access</h3>
              <p className="text-sm text-white/80">
                We can only view your account data, never make transactions.
              </p>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
}
