"use client"

import { useState } from "react"
import type { AppState } from "@/hooks/use-app-state"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import GlassCard from "@/components/ui/glass-card"
import { ArrowLeft, DollarSign, Calendar, ChevronDown, ChevronUp, CreditCard, TrendingDown, Home } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useMemo } from "react"

const getMockResults = (simulationId: string, demographic: string) => {
  if (simulationId === "debt-payoff") {
    return demographic === "genz"
      ? [
          {
            id: "debt-elimination",
            title: "Debt Elimination Timeline",
            currentValue: "$29,700",
            projectedValue: "$0",
            timeframe: "18 months",
            monthlyContribution: "$600",
            confidence: 92,
            insights: [
              "Using debt avalanche method saves $2,400 in interest",
              "Student loan forgiveness programs could reduce timeline by 6 months",
              "Side income of $200/month accelerates payoff by 4 months",
            ],
          },
        ]
      : [
          {
            id: "debt-elimination",
            title: "Debt Elimination Timeline",
            currentValue: "$16,034",
            projectedValue: "$0",
            timeframe: "14 months",
            monthlyContribution: "$1200",
            confidence: 95,
            insights: [
              "Using debt avalanche method saves $1,800 in interest",
              "Balance transfer to 0% APR card could save additional $800",
              "Current payment capacity allows for aggressive payoff strategy",
            ],
          },
        ]
  } else if (simulationId === "home-purchase") {
    return demographic === "genz"
      ? [
          {
            id: "home-purchase-plan",
            title: "Home Purchase Timeline",
            currentValue: "$8,000",
            projectedValue: "$40,000",
            timeframe: "24 months",
            monthlyContribution: "$1,333",
            confidence: 88,
            insights: [
              "First-time buyer programs could reduce down payment to $20,000",
              "Current savings rate of 20% supports your homeownership goal",
              "Consider FHA loan with 3.5% down payment option",
            ],
          },
        ]
      : [
          {
            id: "home-purchase-plan",
            title: "Home Purchase Timeline",
            currentValue: "$25,000",
            projectedValue: "$60,000",
            timeframe: "18 months",
            monthlyContribution: "$1,944",
            confidence: 94,
            insights: [
              "Your income supports a $400,000 home purchase comfortably",
              "Current interest rates favor buying over renting in your market",
              "Consider 15-year mortgage to save $80,000 in interest over loan term",
            ],
          },
        ]
  }

  // Default results for other simulations
  return [
    {
      id: "retirement",
      title: "Retirement Planning",
      currentValue: "$45,000",
      projectedValue: "$1.2M",
      timeframe: "30 years",
      monthlyContribution: "$500",
      confidence: 85,
      insights: [
        "Increase 401k contribution by 2% to maximize employer match",
        "Consider Roth IRA conversion for tax diversification",
        "Rebalance portfolio quarterly for optimal growth",
      ],
    },
    {
      id: "house",
      title: "Home Purchase",
      currentValue: "$15,000",
      projectedValue: "$80,000",
      timeframe: "5 years",
      monthlyContribution: "$1,200",
      confidence: 92,
      insights: [
        "You're on track to afford a $400k home in your target area",
        "Consider house hacking to reduce living expenses",
        "Lock in current interest rates if planning to buy soon",
      ],
    },
  ]
}

// Enhanced mock data generator for debt-payoff scenarios
const getEnhancedDebtPayoffPlans = (demographic: string) => {
  const isGenZ = demographic === "genz"
  const loanBalance = isGenZ ? 29700 : 16034
  const monthlyIncome = isGenZ ? 3200 : 5800
  
  return [
    {
      id: "avalanche-strategy",
      title: "Debt Avalanche Strategy",
      description: "Pay highest interest rates first for maximum savings",
      tag: "Mathematically Optimal",
      tagColor: "bg-blue-500/20 text-blue-300",
      potentialSaving: isGenZ ? 2400 : 1800,
      rationale: `Based on your ${monthlyIncome.toLocaleString()} monthly income and $${loanBalance.toLocaleString()} in debt, the avalanche method targets high-interest debt first. Our simulation shows this saves $${(isGenZ ? 2400 : 1800).toLocaleString()} in interest over the repayment period. With disciplined execution, you'll eliminate debt in ${isGenZ ? 18 : 14} months while maintaining financial stability.`,
      steps: [
        "List all debts by interest rate (highest first)",
        "Pay minimums on all debts except highest rate",
        `Allocate $${(monthlyIncome * 0.2).toFixed(0)} extra to highest interest debt`,
        "Track progress monthly and celebrate milestones"
      ]
    },
    {
      id: "snowball-method",
      title: "Debt Snowball Method",
      description: "Build momentum by paying smallest balances first",
      tag: "Psychologically Motivating",
      tagColor: "bg-green-500/20 text-green-300",
      potentialSaving: isGenZ ? 1800 : 1200,
      rationale: `With your current debt load of $${loanBalance.toLocaleString()}, the snowball method provides quick psychological wins. Starting with your smallest balance creates momentum that our behavioral models show increases success rates by 35%. While saving slightly less than avalanche, the improved adherence leads to successful debt elimination for 89% of users with similar profiles.`,
      steps: [
        "Order debts from smallest to largest balance",
        `Pay $${(loanBalance / 60).toFixed(0)} minimum on all except smallest`,
        "Attack smallest debt with all extra funds",
        "Roll payments to next debt after each payoff"
      ]
    },
    {
      id: "hybrid-approach",
      title: "Hybrid Debt Strategy",
      description: "Balance mathematical efficiency with psychological wins",
      tag: "Balanced Approach",
      tagColor: "bg-purple-500/20 text-purple-300",
      potentialSaving: isGenZ ? 2100 : 1500,
      rationale: `This personalized approach for your $${loanBalance.toLocaleString()} debt combines the best of both methods. Start with one small balance for motivation, then switch to avalanche. With your ${monthlyIncome.toLocaleString()} income supporting aggressive payments, you'll save $${(isGenZ ? 2100 : 1500).toLocaleString()} while maintaining 92% completion rates based on similar user profiles.`,
      steps: [
        "Pay off smallest debt first for quick win",
        "Switch to highest interest rate strategy",
        `Maintain $${(monthlyIncome * 0.25).toFixed(0)} monthly debt payments`,
        "Adjust strategy based on motivation levels"
      ]
    }
  ]
}

// Enhanced mock data generator for home purchase scenarios
const getEnhancedHomePurchasePlans = (demographic: string) => {
  const isGenZ = demographic === "genz"
  const currentSavings = isGenZ ? 8000 : 25000
  const targetDownPayment = isGenZ ? 40000 : 60000
  const monthlyIncome = isGenZ ? 3200 : 8500
  
  return [
    {
      id: "aggressive-savings",
      title: "Aggressive Savings Strategy",
      description: "Maximize savings rate for faster homeownership",
      tag: "Fast Track",
      tagColor: "bg-green-500/20 text-green-300",
      potentialSaving: isGenZ ? "6 months faster" : "8 months faster",
      rationale: `With $${currentSavings.toLocaleString()} saved toward your $${targetDownPayment.toLocaleString()} goal, aggressive saving can accelerate your timeline significantly. By increasing your savings rate to 30% of your $${monthlyIncome.toLocaleString()} monthly income and reducing discretionary spending, simulations show you'll reach your down payment ${isGenZ ? 6 : 8} months faster with 88% confidence.`,
      steps: [
        `Save $${(monthlyIncome * 0.3).toFixed(0)} monthly (30% of income)`,
        "Move funds to 4.5% APY savings account",
        "Cut discretionary spending by 40%",
        "Add side income for extra $500/month"
      ]
    },
    {
      id: "first-time-buyer",
      title: "First-Time Buyer Programs",
      description: "Leverage programs and lower down payment options",
      tag: "Smart Financing",
      tagColor: "bg-blue-500/20 text-blue-300",
      potentialSaving: isGenZ ? 15000 : 20000,
      rationale: `Your profile qualifies for first-time buyer programs that can reduce your down payment from $${targetDownPayment.toLocaleString()} to as low as $${(targetDownPayment * 0.35).toFixed(0)}. With current savings of $${currentSavings.toLocaleString()}, you could qualify for homeownership within 12 months. FHA loans with 3.5% down make homeownership accessible while preserving capital for emergencies.`,
      steps: [
        "Research local first-time buyer programs",
        "Get pre-approved for FHA loan (3.5% down)",
        "Apply for down payment assistance grants",
        `Target homes under $${(isGenZ ? 250000 : 400000).toLocaleString()}`
      ]
    },
    {
      id: "investment-backed",
      title: "Investment-Backed Strategy",
      description: "Grow your down payment through strategic investments",
      tag: "Growth Focused",
      tagColor: "bg-purple-500/20 text-purple-300",
      potentialSaving: isGenZ ? 8000 : 12000,
      rationale: `With ${(targetDownPayment - currentSavings) / 1000}k still needed and your $${monthlyIncome.toLocaleString()} income, strategic investing can accelerate growth. Allocating 70% to index funds targeting 8% returns while keeping 30% liquid provides optimal risk-adjusted growth. Simulations show potential for additional $${(isGenZ ? 8000 : 12000).toLocaleString()} in gains over 24 months.`,
      steps: [
        "Invest 70% in low-cost index funds",
        "Keep 30% in high-yield savings (4.5% APY)",
        `Dollar-cost average $${(monthlyIncome * 0.25).toFixed(0)} monthly`,
        "Rebalance quarterly toward safer assets"
      ]
    }
  ]
}

const getAIActionPlans = (simulationId: string, demographic: string) => {
  if (simulationId === "debt-payoff") {
    return [
      {
        id: "avalanche-plan",
        title: "Debt Avalanche Strategy",
        description: "Pay highest interest rates first for maximum savings",
        tag: "Mathematically Optimal",
        tagColor: "bg-blue-500/20 text-blue-300",
        potentialSaving: demographic === "genz" ? 2400 : 1800,
        rationale:
          "By focusing on high-interest debt first, you'll save the most money in interest payments. This method is mathematically proven to be the most cost-effective debt elimination strategy.",
        steps: [
          "List all debts by interest rate (highest first)",
          "Pay minimums on all debts except highest rate",
          "Put all extra money toward highest interest debt",
          "Repeat process until completely debt-free",
        ],
      },
      {
        id: "snowball-plan",
        title: "Debt Snowball Method",
        description: "Build momentum by paying smallest balances first",
        tag: "Psychologically Motivating",
        tagColor: "bg-green-500/20 text-green-300",
        potentialSaving: demographic === "genz" ? 1800 : 1200,
        rationale:
          "This method provides psychological wins through quick victories. By eliminating smaller debts first, you build momentum and motivation to tackle larger debts, leading to better long-term adherence.",
        steps: [
          "List all debts by balance (smallest first)",
          "Pay minimums on all debts except smallest",
          "Put all extra money toward smallest debt",
          "Celebrate wins and build momentum",
        ],
      },
      {
        id: "hybrid-plan",
        title: "Hybrid Debt Strategy",
        description: "Balance mathematical efficiency with psychological wins",
        tag: "Balanced Approach",
        tagColor: "bg-purple-500/20 text-purple-300",
        potentialSaving: demographic === "genz" ? 2100 : 1500,
        rationale:
          "This approach combines the psychological benefits of early wins with the mathematical efficiency of the avalanche method, providing both motivation and optimal savings for sustained success.",
        steps: [
          "Start with one small debt for quick psychological win",
          "Switch to avalanche method after first payoff",
          "Maintain motivation with milestone rewards",
          "Adjust strategy based on progress and motivation",
        ],
      },
    ]
  } else if (simulationId === "home-purchase") {
    return [
      {
        id: "aggressive-savings-plan",
        title: "Aggressive Savings Strategy",
        description: "Maximize savings rate for faster homeownership",
        tag: "Fast Track",
        tagColor: "bg-green-500/20 text-green-300",
        potentialSaving: demographic === "genz" ? 6 : 8,
        rationale:
          "By dramatically increasing your savings rate and cutting discretionary spending, you can reach your down payment goal months ahead of schedule. This approach requires discipline but gets you into homeownership faster.",
        steps: [
          "Increase savings rate to 30% of income",
          "Move down payment fund to high-yield savings account",
          "Reduce discretionary spending by 40%",
          "Consider side income opportunities for extra savings",
        ],
      },
      {
        id: "first-time-buyer-plan",
        title: "First-Time Buyer Programs",
        description: "Leverage programs and lower down payment options",
        tag: "Smart Financing",
        tagColor: "bg-blue-500/20 text-blue-300",
        potentialSaving: demographic === "genz" ? 15000 : 20000,
        rationale:
          "First-time buyer programs can significantly reduce your down payment requirements and provide additional assistance, making homeownership accessible sooner with less savings required upfront.",
        steps: [
          "Research first-time homebuyer programs in your area",
          "Consider FHA loan with 3.5% down payment option",
          "Look into down payment assistance programs",
          "Get pre-approved to strengthen your offers",
        ],
      },
      {
        id: "investment-plan",
        title: "Investment-Backed Strategy",
        description: "Grow your down payment through strategic investments",
        tag: "Growth Focused",
        tagColor: "bg-purple-500/20 text-purple-300",
        potentialSaving: demographic === "genz" ? 8000 : 12000,
        rationale:
          "By investing a portion of your down payment savings in diversified index funds, you can potentially grow your funds faster than traditional savings accounts, though this comes with market risk.",
        steps: [
          "Invest 70% of down payment savings in index funds",
          "Keep 30% in high-yield savings for stability",
          "Dollar-cost average monthly contributions",
          "Monitor market conditions and adjust allocation as needed",
        ],
      },
    ]
  }

  // Default action plans for other simulations
  return [
    {
      id: "conservative-plan",
      title: "Conservative Approach",
      description: "Low-risk strategies with steady returns",
      tag: "Conservative",
      tagColor: "bg-green-500/20 text-green-300",
      potentialSaving: 180,
      rationale:
        "Focus on guaranteed returns through high-yield savings and conservative investments. This approach minimizes risk while ensuring steady progress toward your goals.",
      steps: [
        "Move to high-yield savings account",
        "Increase 401k contribution by 1%",
        "Set up automated transfers for consistency",
        "Review and adjust quarterly",
      ],
    },
    {
      id: "balanced-plan",
      title: "Balanced Strategy",
      description: "Moderate risk with diversified portfolio",
      tag: "Balanced",
      tagColor: "bg-blue-500/20 text-blue-300",
      potentialSaving: 320,
      rationale:
        "Combine safe investments with moderate-risk options for balanced growth. This strategy offers good returns while maintaining reasonable risk levels.",
      steps: [
        "Diversify investment portfolio",
        "Increase 401k contribution by 3%",
        "Add index fund investments",
        "Monitor performance monthly",
      ],
    },
    {
      id: "aggressive-plan",
      title: "Aggressive Growth",
      description: "Higher risk for maximum potential returns",
      tag: "Aggressive",
      tagColor: "bg-red-500/20 text-red-300",
      potentialSaving: 480,
      rationale:
        "Maximize growth potential through higher-risk investments and aggressive savings rates. Best for those with longer time horizons and higher risk tolerance.",
      steps: [
        "Maximize 401k contributions to limit",
        "Invest in growth stocks and ETFs",
        "Consider real estate investment opportunities",
        "Review and rebalance monthly",
      ],
    },
  ]
}

export default function SimulationResultsScreen({ currentSimulation, simulationResults, setCurrentScreen }: AppState) {
  const { toast } = useToast()

  // Use actual simulation results if available, otherwise fall back to mock data
  const results = useMemo(() => {
    if (!simulationResults || !simulationResults.simulation_results) {
      // Fallback to mock data if no simulation results
      return getMockResults(currentSimulation?.id || 'emergency-fund', 'genz')
    }

    // Extract actual simulation results
    const actualResults = simulationResults.simulation_results
    const aiExplanations = simulationResults.ai_explanations || []
    
    // Convert AI explanations to the format expected by the frontend
    const convertedResults = aiExplanations.map((explanation: any, index: number) => ({
      id: explanation.id || `result-${index + 1}`,
      title: explanation.title || `Plan ${index + 1}`,
      currentValue: explanation.potentialSaving ? `$${explanation.potentialSaving.toLocaleString()}` : '$0',
      projectedValue: explanation.potentialSaving ? `$${(explanation.potentialSaving * 1.2).toLocaleString()}` : '$0',
      timeframe: '12 months',
      monthlyContribution: explanation.potentialSaving ? `$${Math.round(explanation.potentialSaving / 12)}` : '$0',
      insights: explanation.steps || [],
      tag: explanation.tag || ['CONSERVATIVE', 'BALANCED', 'AGGRESSIVE'][index],
      tagColor: explanation.tagColor || ['bg-green-500', 'bg-blue-500', 'bg-purple-500'][index],
      rationale: explanation.rationale || 'Strategic financial planning approach',
      potentialSaving: explanation.potentialSaving || 1000,
      steps: explanation.steps || [
        'Review your current financial position',
        'Implement the recommended changes',
        'Monitor progress regularly',
        'Adjust as your situation evolves'
      ]
    }))

    return convertedResults.length > 0 ? convertedResults : getMockResults(currentSimulation?.id || 'emergency-fund', 'genz')
  }, [simulationResults, currentSimulation])

  // Get scenario-specific data
  const scenarioData = useMemo(() => {
    if (!simulationResults || !simulationResults.simulation_results) {
      return {
        currentAmount: 2000,
        targetAmount: 15000,
        monthlyContribution: 500,
        timeframe: '36 months'
      }
    }

    const actualResults = simulationResults.simulation_results
    return {
      currentAmount: actualResults.current_emergency_fund || 2000,
      targetAmount: actualResults.target_emergency_fund || 15000,
      monthlyContribution: actualResults.monthly_contribution || 500,
      timeframe: `${Math.ceil((actualResults.target_emergency_fund - actualResults.current_emergency_fund) / actualResults.monthly_contribution)} months`
    }
  }, [simulationResults])

  const handleBackToSimulations = () => {
    setCurrentScreen('simulations')
  }

  const handleViewDetails = (resultId: string) => {
    // Navigate to detailed view
    toast({
      title: "Details View",
      description: "Detailed analysis coming soon",
    })
  }

  if (!currentSimulation) {
    return (
      <div className="flex h-[100dvh] flex-col">
        <div className="p-4 text-white">
          <h2 className="text-xl font-semibold text-white mb-4">No Simulation Selected</h2>
          <button
            onClick={handleBackToSimulations}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-semibold"
          >
            Back to Simulations
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[100dvh] flex-col">
      {/* Header */}
      <div className="p-4 text-white">
        <div className="flex items-center justify-between">
          <button
            onClick={handleBackToSimulations}
            className="text-white/80 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-semibold text-white">
            {currentSimulation.id} Results
          </h1>
          <div className="w-9" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Summary Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <GlassCard className="p-6 bg-gradient-to-br from-blue-500/20 to-purple-500/20">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-white/10 rounded-lg mr-3">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-white">Simulation Summary</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-4">
                <div className="text-sm text-white/60 font-medium mb-1">Current Amount</div>
                <div className="text-xl font-bold text-white">${scenarioData.currentAmount.toLocaleString()}</div>
              </div>
              <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl p-4">
                <div className="text-sm text-white/60 font-medium mb-1">Target Amount</div>
                <div className="text-xl font-bold text-white">${scenarioData.targetAmount.toLocaleString()}</div>
              </div>
              <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-4">
                <div className="text-sm text-white/60 font-medium mb-1">Monthly Contribution</div>
                <div className="text-xl font-bold text-white">${scenarioData.monthlyContribution.toLocaleString()}</div>
              </div>
              <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl p-4">
                <div className="text-sm text-white/60 font-medium mb-1">Time to Target</div>
                <div className="text-xl font-bold text-white">{scenarioData.timeframe}</div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* AI Action Plans */}
        <div className="space-y-4">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-white/10 rounded-lg mr-3">
              <TrendingDown className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-white">AI Action Plans</h2>
          </div>
          
          {results.map((result: any, index: number) => (
            <motion.div
              key={result.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <GlassCard
                className="cursor-pointer bg-gradient-to-br from-gray-500/20 to-gray-600/20 hover:scale-[1.02] transition-all duration-300 border border-white/10"
                onClick={() => handleViewDetails(result.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">{result.title}</h3>
                    <p className="text-white/70 text-sm leading-relaxed">{result.rationale}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${result.tagColor} shadow-sm`}>
                    {result.tag}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-4">
                    <div className="text-xs text-white/60 font-medium mb-1">Potential Savings</div>
                    <div className="text-lg font-bold text-white">${(result.potentialSaving || 0).toLocaleString()}</div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl p-4">
                    <div className="text-xs text-white/60 font-medium mb-1">Monthly Contribution</div>
                    <div className="text-lg font-bold text-white">{result.monthlyContribution}</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center">
                    <div className="p-1 bg-white/10 rounded mr-2">
                      <CreditCard className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-white">Key Steps:</span>
                  </div>
                  <ul className="space-y-2">
                    {(result.steps || []).slice(0, 3).map((step: string, stepIndex: number) => (
                      <li key={stepIndex} className="text-sm text-white/70 flex items-start">
                        <span className="text-blue-400 mr-3 mt-1">•</span>
                        <span className="leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Action Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="space-y-3 pt-4"
        >
          <button
            onClick={handleBackToSimulations}
            className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white py-4 px-6 rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
          >
            Run Another Simulation
          </button>
          <button
            onClick={() => setCurrentScreen('dashboard')}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
          >
            Back to Dashboard
          </button>
        </motion.div>
      </div>
    </div>
  )
}
