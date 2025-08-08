"use client"

import { useState } from "react"
import type { AppState } from "@/hooks/use-app-state"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import GlassCard from "@/components/ui/glass-card"
import { cn } from "@/lib/utils"
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Repeat,
  CreditCard,
  BarChart3,
  Calendar,
  PieChart,
  Receipt,
  Lightbulb,
  TrendingDown,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

type MonthOption =
  | "all"
  | "january"
  | "february"
  | "march"
  | "april"
  | "may"
  | "june"
  | "july"
  | "august"
  | "september"
  | "october"
  | "november"
  | "december"

type MonthComparisonOption = "last_month" | "average_month" | "best_month"
type YearComparisonOption = "last_year" | "average_year" | "best_year"

const monthNames = {
  all: "All Months",
  january: "January",
  february: "February",
  march: "March",
  april: "April",
  may: "May",
  june: "June",
  july: "July",
  august: "August",
  september: "September",
  october: "October",
  november: "November",
  december: "December",
}

const monthComparisonLabels = {
  last_month: "Last Month",
  average_month: "Average Month in 2025",
  best_month: "Best Month in 2025",
}

const yearComparisonLabels = {
  last_year: "Last Year",
  average_year: "Average Year",
  best_year: "Best Year",
}

const monthOrder = [
  "all",
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
]

const generateYearOptions = () => {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let year = currentYear; year >= 2015; year--) {
    years.push(year.toString())
  }
  return years
}

// Get current day of month and day of year for comparison context
const getCurrentDay = () => {
  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 0)
  const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24))
  
  return {
    dayOfMonth: now.getDate(),
    dayOfYear: dayOfYear,
    monthName: now.toLocaleString("default", { month: "long" }),
    date: now.getDate(),
  }
}

// Mock data for comparisons with day-based calculations
const getComparisonData = (
  demographic: string,
  selectedYear: string,
  selectedMonth: MonthOption,
  comparisonType: MonthComparisonOption | YearComparisonOption,
) => {
  const baseSpending = demographic === "genz" ? 2100 : 4200
  const currentDay = getCurrentDay()

  if (selectedMonth === "all") {
    // Yearly comparisons - spending up to this day of year
    const dailySpending = (baseSpending * 12) / 365
    const spendingToDate = dailySpending * currentDay.dayOfYear

    switch (comparisonType as YearComparisonOption) {
      case "last_year":
        const lastYearSpendingToDate = spendingToDate * 1.08 // 8% higher last year
        return {
          comparisonSpending: lastYearSpendingToDate,
          difference: spendingToDate - lastYearSpendingToDate,
          isAhead: spendingToDate < lastYearSpendingToDate,
        }
      case "average_year":
        const averageYearSpendingToDate = spendingToDate * 1.05 // 5% higher on average
        return {
          comparisonSpending: averageYearSpendingToDate,
          difference: spendingToDate - averageYearSpendingToDate,
          isAhead: spendingToDate < averageYearSpendingToDate,
        }
      case "best_year":
        const bestYearSpendingToDate = spendingToDate * 0.92 // 8% lower in best year
        return {
          comparisonSpending: bestYearSpendingToDate,
          difference: spendingToDate - bestYearSpendingToDate,
          isAhead: spendingToDate < bestYearSpendingToDate,
        }
      default:
        return { comparisonSpending: spendingToDate, difference: 0, isAhead: false }
    }
  } else {
    // Monthly comparisons - spending up to this day of month
    const dailySpending = baseSpending / 30 // Approximate daily spending
    const spendingToDate = dailySpending * currentDay.dayOfMonth

    switch (comparisonType as MonthComparisonOption) {
      case "last_month":
        const lastMonthSpendingToDate = spendingToDate * 1.12 // 12% higher last month
        return {
          comparisonSpending: lastMonthSpendingToDate,
          difference: spendingToDate - lastMonthSpendingToDate,
          isAhead: spendingToDate < lastMonthSpendingToDate,
        }
      case "average_month":
        const averageMonthSpendingToDate = spendingToDate * 1.06 // 6% higher on average
        return {
          comparisonSpending: averageMonthSpendingToDate,
          difference: spendingToDate - averageMonthSpendingToDate,
          isAhead: spendingToDate < averageMonthSpendingToDate,
        }
      case "best_month":
        const bestMonthSpendingToDate = spendingToDate * 0.88 // 12% lower in best month
        return {
          comparisonSpending: bestMonthSpendingToDate,
          difference: spendingToDate - bestMonthSpendingToDate,
          isAhead: spendingToDate < bestMonthSpendingToDate,
        }
      default:
        return { comparisonSpending: spendingToDate, difference: 0, isAhead: false }
    }
  }
}

export default function SpendTrackingScreen({ demographic, monthlySpending }: AppState) {
  const [showAllInsights, setShowAllInsights] = useState(false)
  const [selectedYear, setSelectedYear] = useState<string>("2025")
  const [selectedMonth, setSelectedMonth] = useState<MonthOption>("august")
  const [monthComparison, setMonthComparison] = useState<MonthComparisonOption>("last_month")
  const [yearComparison, setYearComparison] = useState<YearComparisonOption>("last_year")

  const yearOptions = generateYearOptions()
  const currentYear = new Date().getFullYear()
  const currentMonth = 8 // August (0-indexed would be 7, but we're using 1-indexed)
  const currentDay = getCurrentDay()

  // Check if a month should be disabled (future months in current year)
  const isMonthDisabled = (month: MonthOption) => {
    if (selectedYear !== currentYear.toString()) return false
    if (month === "all") return false

    const monthIndex = monthOrder.indexOf(month)
    return monthIndex > currentMonth // Disable months after August (index 8)
  }

  // Calculate multiplier based on selection
  const getMultiplier = () => {
    if (selectedMonth === "all") return 12
    return 1
  }

  const multiplier = getMultiplier()
  const isAllMonthsView = selectedMonth === "all"

  // Get comparison data
  const comparisonData = getComparisonData(
    demographic,
    selectedYear,
    selectedMonth,
    isAllMonthsView ? yearComparison : monthComparison,
  )

  // Recurring expenses data with dynamic calculation
  const recurringExpenses = {
    total: (demographic === "genz" ? 850 : 1352) * multiplier,
    categories:
      demographic === "genz"
        ? [
            { name: "Rent", spent: 600 * multiplier, budget: 650 * multiplier, icon: "Home" },
            { name: "Subscriptions", spent: 45 * multiplier, budget: 50 * multiplier, icon: "Monitor" },
            { name: "Bills", spent: 205 * multiplier, budget: 250 * multiplier, icon: "Zap" },
          ]
        : [
            { name: "Rent", spent: 1200 * multiplier, budget: 1300 * multiplier, icon: "Home" },
            { name: "Subscriptions", spent: 89 * multiplier, budget: 100 * multiplier, icon: "Monitor" },
            { name: "Bills", spent: 63 * multiplier, budget: 80 * multiplier, icon: "Zap" },
          ],
  }

  // Non-recurring expenses data with dynamic calculation
  const nonRecurringExpenses = {
    total: (demographic === "genz" ? 1250 : 2848) * multiplier,
    categories:
      demographic === "genz"
        ? [
            { name: "Grocery", spent: 387 * multiplier, budget: 500 * multiplier, icon: "Leaf" },
            { name: "Shopping", spent: 350 * multiplier, budget: 300 * multiplier, icon: "ShoppingCart" },
            { name: "Transportation", spent: 89 * multiplier, budget: 200 * multiplier, icon: "Car" },
            { name: "Food Delivery", spent: 180 * multiplier, budget: 150 * multiplier, icon: "Pizza" },
            { name: "Restaurants & Bars", spent: 194 * multiplier, budget: 200 * multiplier, icon: "Beer" },
            { name: "Miscellaneous", spent: 50 * multiplier, budget: 100 * multiplier, icon: "Briefcase" },
          ]
        : [
            { name: "Grocery", spent: 650 * multiplier, budget: 700 * multiplier, icon: "Leaf" },
            { name: "Shopping", spent: 580 * multiplier, budget: 500 * multiplier, icon: "ShoppingCart" },
            { name: "Transportation", spent: 450 * multiplier, budget: 500 * multiplier, icon: "Car" },
            { name: "Food Delivery", spent: 320 * multiplier, budget: 250 * multiplier, icon: "Pizza" },
            { name: "Restaurants & Bars", spent: 680 * multiplier, budget: 600 * multiplier, icon: "Beer" },
            { name: "Miscellaneous", spent: 168 * multiplier, budget: 200 * multiplier, icon: "Briefcase" },
          ],
  }

  // Dynamic insights based on view type
  const getDynamicInsights = () => {
    const timeframe = isAllMonthsView ? "year" : "month"
    const savingsAmount = demographic === "genz" ? 113 * multiplier : 50 * multiplier

    return [
      {
        icon: AlertTriangle,
        iconColor: "text-orange-400",
        title: demographic === "genz" ? "Food Delivery Alert" : "Shopping Alert",
        description:
          demographic === "genz"
            ? `You're spending 20% more on food delivery this ${timeframe}.`
            : `You're spending 16% more on shopping this ${timeframe}.`,
      },
      {
        icon: CheckCircle,
        iconColor: "text-green-400",
        title: "Grocery Savings",
        description: `Great job staying under budget on groceries! You've saved $${savingsAmount.toLocaleString()} this ${timeframe}.`,
      },
      {
        icon: TrendingUp,
        iconColor: "text-blue-400",
        title: `${isAllMonthsView ? "Annual" : "Monthly"} Trend`,
        description: `Your overall spending is down 3% compared to last ${timeframe}. Keep it up!`,
      },
    ]
  }

  const allInsights = getDynamicInsights()
  const displayedInsights = showAllInsights ? allInsights : [allInsights[0]]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring" } },
  }

  const renderCategoryRow = (category: any) => {
    const progress = (category.spent / category.budget) * 100
    const isOverBudget = category.spent > category.budget

    return (
      <div
        key={category.name}
        className="flex items-center justify-between py-2.5 border-b border-gray-700/30 last:border-b-0"
      >
        <div className="flex items-center gap-3 flex-1">
          <span className="text-base">{category.icon}</span>
          <div className="flex-1">
            <h4 className="text-white font-medium text-sm mb-1">{category.name}</h4>
            <Progress
              value={Math.min(progress, 100)}
              className={cn("h-1.5 bg-gray-700", isOverBudget ? "[&>*]:bg-red-500" : "[&>*]:bg-green-500")}
            />
          </div>
        </div>
        <div className="text-right ml-4">
          <p className={cn("text-base font-semibold", isOverBudget ? "text-red-400" : "text-white")}>
            ${category.spent.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400">/ ${category.budget.toLocaleString()}</p>
        </div>
      </div>
    )
  }

  const totalSpending = monthlySpending.total * multiplier

  const getSpendingPeriodText = () => {
    if (isAllMonthsView) {
      return `in ${selectedYear}`
    }
    return `in ${monthNames[selectedMonth]} ${selectedYear}`
  }

  // Get the appropriate "on this day" text
  const getOnThisDayText = () => {
    if (isAllMonthsView) {
      return `on this day (${currentDay.monthName} ${currentDay.date})`
    }
    return `on this day (${currentDay.date}${getOrdinalSuffix(currentDay.date)})`
  }

  const getOrdinalSuffix = (day: number) => {
    if (day > 3 && day < 21) return "th"
    switch (day % 10) {
      case 1:
        return "st"
      case 2:
        return "nd"
      case 3:
        return "rd"
      default:
        return "th"
    }
  }

  return (
    <div className="flex h-[100dvh] flex-col">
      <header className="p-3 text-white">
        <h1 className="text-xl font-bold">Spend Tracking</h1>
        <p className="text-white/80">Monitor your spending patterns</p>
      </header>

      <div className="flex-1 overflow-y-auto p-3 space-y-5">
        {/* Monthly Overview */}
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4" />
            This Month
          </h2>
          <GlassCard className="p-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-white/60">Total Spent</p>
                <p className="text-2xl font-bold text-white mb-4">
                  ${(recurringExpenses.total + nonRecurringExpenses.total).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-green-400">
                  <TrendingDown className="h-4 w-4" />
                  <span className="text-sm">-12%</span>
                </div>
                <p className="text-xs text-white/60">vs last month</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <p className="text-sm text-white/60">Budget</p>
                <p className="text-base font-semibold text-white">$3,500</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-white/60">Remaining</p>
                <p className="text-base font-semibold text-green-400">$1,200</p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Spending Categories */}
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2 mb-2">
            <PieChart className="h-4 w-4" />
            Top Categories
          </h2>
          <div className="space-y-2">
            {nonRecurringExpenses.categories.slice(0, 4).map((category) => (
              <div key={category.name} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ 
                    backgroundColor: category.icon === "Leaf" ? "#65a30d" : 
                    category.icon === "ShoppingCart" ? "#4f46e5" : 
                    category.icon === "Car" ? "#10b981" : "#9333ea" 
                  }}></div>
                  <div>
                    <p className="text-sm font-medium text-white">{category.name}</p>
                    <p className="text-xs text-white/60">${category.spent.toLocaleString()} / ${category.budget.toLocaleString()}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-white">${category.spent.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2 mb-2">
            <Receipt className="h-4 w-4" />
            Recent Transactions
          </h2>
          <div className="space-y-2">
            {recurringExpenses.categories.map((category) => (
              <div key={category.name} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center">
                    <div className="text-white text-sm">{category.icon}</div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{category.name}</p>
                    <p className="text-xs text-white/60">${category.spent.toLocaleString()}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-white">${category.spent.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Spending Insights */}
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2 mb-2">
            <Lightbulb className="h-4 w-4" />
            Insights
          </h2>
          <GlassCard className="p-3">
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-white">You're 15% under budget this month</p>
                  <p className="text-xs text-white/60">Great job staying on track!</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-white">Dining out is your highest category</p>
                  <p className="text-xs text-white/60">Consider meal planning to save more</p>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
