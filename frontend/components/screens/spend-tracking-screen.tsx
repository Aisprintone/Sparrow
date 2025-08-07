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
  return {
    dayOfMonth: now.getDate(),
    dayOfYear: Math.floor((now - new Date(now.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24)),
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
    <div className="pb-28">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 flex items-center justify-between"
      >
        <h1 className="text-2xl font-bold text-white">Spend Tracking</h1>
      </motion.header>

      {/* View Controls */}
      <div className="px-4 mb-6">
        <div className="flex gap-3">
          {/* Year Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="bg-white/10 text-white hover:bg-white/20 flex items-center gap-2">
                {selectedYear}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-gray-800 border-gray-700 z-50 max-h-60 overflow-y-auto">
              {yearOptions.map((year) => (
                <DropdownMenuItem
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className="text-white hover:bg-gray-700 cursor-pointer"
                >
                  {year}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Month Selection Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="bg-white/10 text-white hover:bg-white/20 flex items-center gap-2">
                {monthNames[selectedMonth]}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-gray-800 border-gray-700 z-50 max-h-60 overflow-y-auto">
              {monthOrder.map((month) => {
                const disabled = isMonthDisabled(month as MonthOption)
                return (
                  <DropdownMenuItem
                    key={month}
                    onClick={() => !disabled && setSelectedMonth(month as MonthOption)}
                    className={cn(
                      "cursor-pointer",
                      disabled ? "text-gray-500 hover:bg-gray-800 cursor-not-allowed" : "text-white hover:bg-gray-700",
                    )}
                    disabled={disabled}
                  >
                    {monthNames[month as MonthOption]}
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="px-4 space-y-5">
        {/* Spending Comparison Card */}
        <motion.div variants={itemVariants}>
          <GlassCard className="bg-gradient-to-r from-blue-500/10 to-purple-500/10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-blue-400" />
                Spending Comparison
              </h2>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="bg-white/10 text-white hover:bg-white/20 flex items-center gap-2"
                  >
                    {isAllMonthsView ? yearComparisonLabels[yearComparison] : monthComparisonLabels[monthComparison]}
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-gray-800 border-gray-700 z-50">
                  {isAllMonthsView
                    ? Object.entries(yearComparisonLabels).map(([key, label]) => (
                        <DropdownMenuItem
                          key={key}
                          onClick={() => setYearComparison(key as YearComparisonOption)}
                          className="text-white hover:bg-gray-700 cursor-pointer"
                        >
                          {label}
                        </DropdownMenuItem>
                      ))
                    : Object.entries(monthComparisonLabels).map(([key, label]) => (
                        <DropdownMenuItem
                          key={key}
                          onClick={() => setMonthComparison(key as MonthComparisonOption)}
                          className="text-white hover:bg-gray-700 cursor-pointer"
                        >
                          {label}
                        </DropdownMenuItem>
                      ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-400 mb-2">
                Relative to{" "}
                {isAllMonthsView ? yearComparisonLabels[yearComparison] : monthComparisonLabels[monthComparison]}{" "}
                {getOnThisDayText()}
              </p>
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-sm text-gray-400">You are</span>
                <span className={`text-2xl font-bold ${comparisonData.isAhead ? "text-green-400" : "text-red-400"}`}>
                  ${Math.abs(comparisonData.difference).toLocaleString()}
                </span>
                <span className={`text-sm font-medium ${comparisonData.isAhead ? "text-green-400" : "text-red-400"}`}>
                  {comparisonData.isAhead ? "ahead" : "behind"}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Current: ${Math.round(comparisonData.difference + comparisonData.comparisonSpending).toLocaleString()}{" "}
                vs Comparison: ${Math.round(comparisonData.comparisonSpending).toLocaleString()}
              </p>
            </div>
          </GlassCard>
        </motion.div>

        {/* Spending Insights - First */}
        <motion.div variants={itemVariants}>
          <GlassCard className="bg-gradient-to-r from-orange-500/10 to-red-500/10">
            <div className="mb-3">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-orange-400" />
                Spending Insights
              </h2>
              <p className="text-2xl font-bold text-white mb-4">
                ${totalSpending.toLocaleString()} spent {getSpendingPeriodText()}
              </p>
            </div>
            <div className="space-y-3">
              {displayedInsights.map((insight, index) => {
                const IconComponent = insight.icon
                return (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-xl bg-white/5">
                    <IconComponent className={`h-4 w-4 ${insight.iconColor} flex-shrink-0 mt-0.5`} />
                    <div>
                      <p className="text-white font-medium text-sm">{insight.title}</p>
                      <p className="text-xs text-gray-300">{insight.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
            {!showAllInsights && (
              <div className="mt-4 pt-3 border-t border-white/10">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllInsights(true)}
                  className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 flex items-center gap-1 text-sm"
                >
                  View More <ChevronDown className="h-3 w-3" />
                </Button>
              </div>
            )}
            {showAllInsights && (
              <div className="mt-4 pt-3 border-t border-white/10">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllInsights(false)}
                  className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 flex items-center gap-1 text-sm"
                >
                  View Less <ChevronUp className="h-3 w-3" />
                </Button>
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Recurring Expenses */}
        <motion.div variants={itemVariants}>
          <GlassCard className="bg-gray-800/50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Repeat className="h-4 w-4 text-blue-400" />
                Recurring Expenses
              </h2>
              <p className="text-lg font-semibold text-white">${recurringExpenses.total.toLocaleString()}</p>
            </div>
            <div className="space-y-0">{recurringExpenses.categories.map(renderCategoryRow)}</div>
          </GlassCard>
        </motion.div>

        {/* Non-recurring Expenses */}
        <motion.div variants={itemVariants}>
          <GlassCard className="bg-gray-800/50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-purple-400" />
                Non-recurring Expenses
              </h2>
              <p className="text-lg font-semibold text-white">${nonRecurringExpenses.total.toLocaleString()}</p>
            </div>
            <div className="space-y-0">{nonRecurringExpenses.categories.map(renderCategoryRow)}</div>
          </GlassCard>
        </motion.div>
      </motion.div>
    </div>
  )
}
