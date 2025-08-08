"use client"

import { useState, useEffect, useMemo } from "react"
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
  Loader2,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { spendingService, type SpendingData } from "@/lib/services/spending-service"
import { useToast } from "@/hooks/use-toast"

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
  average_month: "Average Month",
  best_month: "Best Month",
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

// Map demographic to customer ID for CSV data
const demographicToCustomerId = (demographic: string): number => {
  const mapping: Record<string, number> = {
    millennial: 1,
    midcareer: 2,
    genz: 3
  }
  return mapping[demographic] || 1
}

// Get current day of month and day of year for comparison context
const getCurrentDay = () => {
  const now = new Date()
  return {
    dayOfMonth: now.getDate(),
    dayOfYear: Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)),
    monthName: now.toLocaleString("default", { month: "long" }),
    date: now.getDate(),
  }
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

export default function SpendTrackingScreen({ demographic, monthlySpending }: AppState) {
  const { toast } = useToast()
  const [showAllInsights, setShowAllInsights] = useState(false)
  const [selectedYear, setSelectedYear] = useState<string>("2025")
  const [selectedMonth, setSelectedMonth] = useState<MonthOption>("august")
  const [monthComparison, setMonthComparison] = useState<MonthComparisonOption>("last_month")
  const [yearComparison, setYearComparison] = useState<YearComparisonOption>("last_year")
  const [spendingData, setSpendingData] = useState<SpendingData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadTime, setLoadTime] = useState<number>(0)

  const yearOptions = generateYearOptions()
  const currentYear = new Date().getFullYear()
  const currentMonth = 8 // August (0-indexed would be 7, but we're using 1-indexed)
  const currentDay = getCurrentDay()
  const customerId = demographicToCustomerId(demographic)

  // Check if a month should be disabled (future months in current year)
  const isMonthDisabled = (month: MonthOption) => {
    if (selectedYear !== currentYear.toString()) return false
    if (month === "all") return false

    const monthIndex = monthOrder.indexOf(month)
    return monthIndex > currentMonth // Disable months after August (index 8)
  }

  // Fetch spending data from CSV API with surgical precision
  useEffect(() => {
    const fetchData = async () => {
      const startTime = performance.now()
      
      // Check for cached data first
      const cacheKey = `${customerId}-${selectedYear}-${selectedMonth}`
      const cachedData = sessionStorage.getItem(cacheKey)
      
      if (cachedData) {
        // Use cached data instantly without loading spinner
        const data = JSON.parse(cachedData)
        setSpendingData(data)
        setLoadTime(0) // Instant load
        return
      }
      
      // Only show loading if we don't have cached data
      setIsLoading(true)
      
      try {
        const year = parseInt(selectedYear)
        const month = selectedMonth === "all" ? undefined : monthOrder.indexOf(selectedMonth)
        
        const data = await spendingService.fetchSpendingData(
          customerId,
          year,
          month
        )
        
        setSpendingData(data)
        const fetchTime = performance.now() - startTime
        setLoadTime(fetchTime)
        
        // Cache the data for instant future access
        sessionStorage.setItem(cacheKey, JSON.stringify(data))
        
        // Performance monitoring
        if (fetchTime < 10) {
          console.log(`[PERFORMANCE SUCCESS] Data loaded in ${fetchTime.toFixed(2)}ms - UNDER 10ms target`)
        } else if (fetchTime > 100) {
          console.warn(`[PERFORMANCE WARNING] Data loaded in ${fetchTime.toFixed(2)}ms - EXCEEDS 100ms threshold`)
        }
        
      } catch (error) {
        console.error('Error loading spending data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [selectedYear, selectedMonth, customerId])

  // Preload adjacent months for < 10ms performance
  useEffect(() => {
    const preloadAdjacentData = async () => {
      const year = parseInt(selectedYear)
      const currentMonthIndex = monthOrder.indexOf(selectedMonth)
      
      if (selectedMonth !== "all") {
        // Preload previous and next month for instant switching
        const preloadMonths = [
          currentMonthIndex - 1,
          currentMonthIndex + 1
        ].filter(m => m > 0 && m <= 12)
        
        for (const month of preloadMonths) {
          const cacheKey = `${customerId}-${year}-${monthOrder[month]}`
          if (!sessionStorage.getItem(cacheKey)) {
            spendingService.fetchSpendingData(customerId, year, month)
              .then(data => sessionStorage.setItem(cacheKey, JSON.stringify(data)))
              .catch(() => {}) // Silently fail preloading
          }
        }
      }
      
      // Also preload the current year's data for all months
      const yearCacheKey = `${customerId}-${year}-all`
      if (!sessionStorage.getItem(yearCacheKey)) {
        spendingService.fetchSpendingData(customerId, year, undefined)
          .then(data => sessionStorage.setItem(yearCacheKey, JSON.stringify(data)))
          .catch(() => {}) // Silently fail preloading
      }
    }
    
    preloadAdjacentData()
  }, [selectedYear, selectedMonth, customerId])

  const isAllMonthsView = selectedMonth === "all"

  // Use real comparison data from API with surgical precision
  const comparisonData = useMemo(() => {
    if (spendingData?.comparison) {
      const { comparison } = spendingData
      const comparisonType = isAllMonthsView ? yearComparison : monthComparison
      
      let comparisonSpending = comparison.lastPeriod
      if (comparisonType === "average_month" || comparisonType === "average_year") {
        comparisonSpending = comparison.averagePeriod
      } else if (comparisonType === "best_month" || comparisonType === "best_year") {
        comparisonSpending = comparison.bestPeriod
      }
      
      // Calculate day-adjusted comparison for accurate tracking
      const daysInPeriod = isAllMonthsView ? 365 : 30
      const currentDayOfPeriod = isAllMonthsView ? currentDay.dayOfYear : currentDay.dayOfMonth
      const adjustmentFactor = currentDayOfPeriod / daysInPeriod
      
      const adjustedComparison = comparisonSpending * adjustmentFactor
      const adjustedCurrent = (spendingData.total || 0) * adjustmentFactor
      
      return {
        comparisonSpending: adjustedComparison,
        difference: adjustedCurrent - adjustedComparison,
        isAhead: comparison.trend === 'down'
      }
    }
    
    // Fallback calculation
    return {
      comparisonSpending: 0,
      difference: 0,
      isAhead: false
    }
  }, [spendingData, isAllMonthsView, yearComparison, monthComparison, currentDay])

  // Transform spending data with intelligent categorization
  const transformedSpendingData = useMemo(() => {
    if (!spendingData || !spendingData.categories) {
      return {
        recurringExpenses: { total: 0, categories: [] },
        nonRecurringExpenses: { total: 0, categories: [] }
      }
    }

    const recurring = spendingData.categories
      .filter(cat => cat.isRecurring)
      .slice(0, 3)
      .map(cat => ({
        name: cat.name,
        spent: cat.spent,
        budget: cat.budget,
        icon: cat.icon,
        percentage: cat.percentage,
        isOverBudget: cat.isOverBudget
      }))

    const nonRecurring = spendingData.categories
      .filter(cat => !cat.isRecurring)
      .slice(0, 6)
      .map(cat => ({
        name: cat.name,
        spent: cat.spent,
        budget: cat.budget,
        icon: cat.icon,
        percentage: cat.percentage,
        isOverBudget: cat.isOverBudget
      }))

    return {
      recurringExpenses: {
        total: spendingData.recurringTotal || 0,
        categories: recurring
      },
      nonRecurringExpenses: {
        total: spendingData.nonRecurringTotal || 0,
        categories: nonRecurring
      }
    }
  }, [spendingData])

  // Transform insights from CSV data with intelligent mapping
  const allInsights = useMemo(() => {
    if (spendingData?.insights && spendingData.insights.length > 0) {
      return spendingData.insights.map(insight => ({
        icon: insight.type === 'alert' ? AlertTriangle : 
              insight.type === 'success' ? CheckCircle : TrendingUp,
        iconColor: insight.type === 'alert' ? "text-orange-400" : 
                   insight.type === 'success' ? "text-green-400" : "text-blue-400",
        title: insight.title,
        description: insight.description,
        value: insight.value
      }))
    }
    
    return []
  }, [spendingData])

  const displayedInsights = showAllInsights ? allInsights : allInsights.slice(0, 1)

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }, // Faster animation
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring" as const, damping: 20 } },
  }

  const renderCategoryRow = (category: any) => {
    const progress = category.percentage || ((category.spent / category.budget) * 100)
    const isOverBudget = category.isOverBudget ?? (category.spent > category.budget)

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

  const totalSpending = spendingData?.total || 0

  const getSpendingPeriodText = () => {
    if (isAllMonthsView) {
      return `in ${selectedYear}`
    }
    return `in ${monthNames[selectedMonth]} ${selectedYear}`
  }

  const getOnThisDayText = () => {
    if (isAllMonthsView) {
      return `on this day (${currentDay.monthName} ${currentDay.date})`
    }
    return `on this day (${currentDay.date}${getOrdinalSuffix(currentDay.date)})`
  }

  return (
    <div className="pb-28">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 flex items-center justify-between"
      >
        <h1 className="text-2xl font-bold text-white">Spend Tracking</h1>
        {/* Removed performance stat tag */}
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

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          <span className="ml-3 text-gray-400">Loading data...</span>
        </div>
      ) : (
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
                    ${Math.abs(comparisonData.difference).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className={`text-sm font-medium ${comparisonData.isAhead ? "text-green-400" : "text-red-400"}`}>
                    {comparisonData.isAhead ? "ahead" : "behind"}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Current: ${Math.round(comparisonData.difference + comparisonData.comparisonSpending).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
                  vs Comparison: ${Math.round(comparisonData.comparisonSpending).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </GlassCard>
          </motion.div>

          {/* Spending Insights */}
          {allInsights.length > 0 && (
            <motion.div variants={itemVariants}>
              <GlassCard className="bg-gradient-to-r from-orange-500/10 to-red-500/10">
                <div className="mb-3">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-3">
                    <TrendingUp className="h-4 w-4 text-orange-400" />
                    Spending Insights
                  </h2>
                  <p className="text-2xl font-bold text-white mb-4">
                    ${totalSpending.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} spent {getSpendingPeriodText()}
                  </p>
                  {spendingData && (
                    <div className="flex gap-4 text-xs text-gray-400">
                      <span>Daily avg: ${spendingData.dailyAverage.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      <span>Projected: ${spendingData.projectedTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  )}
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
                          {insight.value && (
                            <p className="text-xs text-gray-400 mt-1">
                              Impact: ${insight.value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
                {allInsights.length > 1 && !showAllInsights && (
                  <div className="mt-4 pt-3 border-t border-white/10">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAllInsights(true)}
                      className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 flex items-center gap-1 text-sm"
                    >
                      View {allInsights.length - 1} More <ChevronDown className="h-3 w-3" />
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
          )}

          {/* Recurring Expenses */}
          {transformedSpendingData.recurringExpenses.categories.length > 0 && (
            <motion.div variants={itemVariants}>
              <GlassCard className="bg-gray-800/50">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Repeat className="h-4 w-4 text-blue-400" />
                    Recurring Expenses
                  </h2>
                  <p className="text-lg font-semibold text-white">${transformedSpendingData.recurringExpenses.total.toLocaleString()}</p>
                </div>
                <div className="space-y-0">{transformedSpendingData.recurringExpenses.categories.map(renderCategoryRow)}</div>
              </GlassCard>
            </motion.div>
          )}

          {/* Non-recurring Expenses */}
          {transformedSpendingData.nonRecurringExpenses.categories.length > 0 && (
            <motion.div variants={itemVariants}>
              <GlassCard className="bg-gray-800/50">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-purple-400" />
                    Non-recurring Expenses
                  </h2>
                  <p className="text-lg font-semibold text-white">${transformedSpendingData.nonRecurringExpenses.total.toLocaleString()}</p>
                </div>
                <div className="space-y-0">{transformedSpendingData.nonRecurringExpenses.categories.map(renderCategoryRow)}</div>
              </GlassCard>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  )
}