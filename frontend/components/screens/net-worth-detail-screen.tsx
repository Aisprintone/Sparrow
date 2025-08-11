"use client"

import { useState } from "react"
import type { AppState } from "@/hooks/use-app-state"
import { ChevronLeft, TrendingUp, TrendingDown, Plus, User, MapPin, DollarSign, GraduationCap, Home } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import GlassCard from "@/components/ui/glass-card"
import Image from "next/image"

const getAssetDistribution = (accounts: any[], demographic: string) => {
  const assets = accounts.filter((acc) => acc.balance >= 0)
  const total = assets.reduce((sum, acc) => sum + acc.balance, 0)

  if (demographic === "genz") {
    return [
      { name: "Liquid Money", value: 95, color: "#3B82F6" },
      { name: "Investments", value: 5, color: "#8B5CF6" },
    ]
  } else {
    return [
      { name: "Real Estate", value: 66, color: "#10B981" },
      { name: "Retirement", value: 17, color: "#F59E0B" },
      { name: "Investments", value: 9, color: "#8B5CF6" },
      { name: "Liquid Money", value: 8, color: "#3B82F6" },
    ]
  }
}

const getLiabilityDistribution = (accounts: any[], demographic: string) => {
  const liabilities = accounts.filter((acc) => acc.balance < 0)
  const total = Math.abs(liabilities.reduce((sum, acc) => sum + acc.balance, 0))

  if (demographic === "genz") {
    return [
      { name: "Student Loans", value: 96, color: "#EF4444" },
      { name: "Credit Cards", value: 4, color: "#F59E0B" },
    ]
  } else {
    return [
      { name: "Mortgage", value: 98, color: "#EF4444" },
      { name: "Credit Cards", value: 2, color: "#F59E0B" },
    ]
  }
}

export default function NetWorthDetailScreen({ setCurrentScreen, accounts, demographic, profileData }: AppState) {
  const [activeTab, setActiveTab] = useState<"assets" | "liabilities">("assets")

  // Calculate real financial values using CORRECT method (balance-based, not type-based)
  // This matches the dashboard calculation method
  let totalAssets = 0
  let totalLiabilities = 0
  
  const assets: any[] = []
  const liabilities: any[] = []

  accounts.forEach((account) => {
    const balance = account.balance
    
    if (balance >= 0) {
      totalAssets += balance          // Positive balances = assets
      assets.push(account)
    } else {
      totalLiabilities += Math.abs(balance)  // Negative balances = liabilities
      liabilities.push(account)
    }
  })

  const netWorth = totalAssets - totalLiabilities

  const currentData = activeTab === "assets" ? assets : liabilities
  const assetDistribution = getAssetDistribution(accounts, demographic)
  const liabilityDistribution = getLiabilityDistribution(accounts, demographic)
  const currentDistribution = activeTab === "assets" ? assetDistribution : liabilityDistribution

  // Get demographic-specific profile info
  const getProfileInfo = () => {
    switch (demographic) {
      case "genz":
        return {
          name: "Gen Z Student",
          age: 23,
          location: "Austin, TX",
          income: profileData?.metrics?.monthlyIncome * 12 || 38400,
          education: "Bachelor's Degree",
          housing: "Renting"
        }
      case "millennial":
        return {
          name: "Established Millennial", 
          age: 34,
          location: "New York, NY",
          income: profileData?.metrics?.monthlyIncome * 12 || 102000,
          education: "Bachelor's Degree",
          housing: "Homeowner"
        }
      case "midcareer":
        return {
          name: "Mid-Career Professional",
          age: 42,
          location: "San Francisco, CA", 
          income: profileData?.metrics?.monthlyIncome * 12 || 69600,
          education: "Master's Degree",
          housing: "Homeowner"
        }
      default:
        return {
          name: "User",
          age: 30,
          location: "Unknown",
          income: profileData?.metrics?.monthlyIncome * 12 || 60000,
          education: "Bachelor's Degree",
          housing: "Renting"
        }
    }
  }

  const profileInfo = getProfileInfo()

  return (
    <div className="pb-24">
      <header className="p-4">
        <Button onClick={() => setCurrentScreen("dashboard")} variant="ghost" className="text-white hover:bg-white/20">
          <ChevronLeft className="mr-2 h-5 w-5" />
          Dashboard
        </Button>
      </header>

      {/* Profile Information Section */}
      <div className="px-4 mb-6">
        <GlassCard className="p-4 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">{profileInfo.name}</h2>
              <p className="text-white/60 text-sm">{profileInfo.age} years old • {profileInfo.location}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-400" />
              <div>
                <p className="text-white/60 text-xs">Annual Income</p>
                <p className="text-white text-sm font-medium">${profileInfo.income.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Home className="h-4 w-4 text-blue-400" />
              <div>
                <p className="text-white/60 text-xs">Housing</p>
                <p className="text-white text-sm font-medium">{profileInfo.housing}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-purple-400" />
              <div>
                <p className="text-white/60 text-xs">Education</p>
                <p className="text-white text-sm font-medium">{profileInfo.education}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-orange-400" />
              <div>
                <p className="text-white/60 text-xs">Location</p>
                <p className="text-white text-sm font-medium">{profileInfo.location}</p>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="p-6 text-center">
        <p className="text-sm text-gray-400">Total Net Worth</p>
        <p className="mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-5xl font-bold text-transparent">
          ${netWorth.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="px-4 mb-6">
        <div className="flex bg-gray-800/50 rounded-xl p-1">
          <button
            onClick={() => setActiveTab("assets")}
            className={`flex-1 py-3 px-4 rounded-lg text-center font-medium transition-all ${
              activeTab === "assets" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            Assets
          </button>
          <button
            onClick={() => setActiveTab("liabilities")}
            className={`flex-1 py-3 px-4 rounded-lg text-center font-medium transition-all ${
              activeTab === "liabilities" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            Liabilities
          </button>
        </div>
      </div>

      <div className="px-4 space-y-6">
        {/* Summary Card */}
        <GlassCard className="bg-white/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              {activeTab === "assets" ? (
                <>
                  <TrendingUp className="h-5 w-5 text-green-400" />
                  Assets
                </>
              ) : (
                <>
                  <TrendingDown className="h-5 w-5 text-red-400" />
                  Liabilities
                </>
              )}
            </h2>
            <p className={`text-2xl font-bold ${activeTab === "assets" ? "text-green-400" : "text-red-400"}`}>
              $
              {(activeTab === "assets" ? totalAssets : totalLiabilities).toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </p>
          </div>

          <div className="mb-4">
            {/* Horizontal Bar Chart */}
            <div className="h-8 bg-gray-700 rounded-full overflow-hidden flex mb-4">
              {currentDistribution.map((segment, index) => (
                <div
                  key={segment.name}
                  style={{
                    width: `${segment.value}%`,
                    backgroundColor: segment.color,
                  }}
                  className="h-full"
                />
              ))}
            </div>
            {/* Legend */}
            <div className="grid grid-cols-2 gap-2">
              {currentDistribution.map((segment) => (
                <div key={segment.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: segment.color }} />
                  <span className="text-sm text-gray-300">
                    {segment.name} ({segment.value}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Account List */}
        <div className="space-y-3">
          {currentData.map((acc, i) => (
            <motion.div
              key={acc.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0, transition: { delay: 0.1 * i } }}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white p-1">
                  {acc.icon && acc.icon.startsWith("/") ? (
                    <Image src={acc.icon || "/placeholder.svg"} alt={acc.institution} width={32} height={32} />
                  ) : (
                    <span className="text-2xl">{acc.icon || "💰"}</span>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-200">{acc.name}</p>
                  <p className="text-sm text-gray-400">{acc.institution}</p>
                </div>
              </div>
              <p className={`font-semibold ${acc.balance >= 0 ? "text-white" : "text-red-400"}`}>
                ${Math.abs(acc.balance).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
            </motion.div>
          ))}

          {/* Add More Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0, transition: { delay: 0.1 * currentData.length } }}
            className="flex items-center justify-center rounded-2xl border-2 border-dashed border-white/20 bg-white/5 p-4 cursor-pointer hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center gap-3 text-gray-400">
              <Plus className="h-6 w-6" />
              <span className="font-medium">Add {activeTab === "assets" ? "Asset" : "Liability"}</span>
            </div>
          </motion.div>
        </div>

        {/* Action Button for Liabilities */}
        {activeTab === "liabilities" && (
          <Button
            onClick={() => setCurrentScreen("spend-tracking")}
            variant="outline"
            className="w-full border-white/20 bg-transparent hover:bg-white/10 text-gray-300"
          >
            Analyze Spending Patterns
          </Button>
        )}
      </div>
    </div>
  )
}
