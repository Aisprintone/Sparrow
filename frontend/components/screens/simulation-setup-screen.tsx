"use client"

import { useState, useEffect } from "react"
import type { AppState } from "@/hooks/use-app-state"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Play, Settings, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Helper function to convert demographic to profile ID
const demographicToProfileId = (demographic: string): string => {
  const profileMap: Record<string, string> = {
    'genz': '1',
    'millennial': '2', 
    'genx': '3'
  }
  return profileMap[demographic] || '1'
}

// Define parameter configurations for each simulation type
const SIMULATION_PARAMETERS = {
  'emergency-fund': {
    name: 'Emergency Fund Strategy',
    description: 'Build a robust emergency fund with optimal allocation',
    parameters: [
      {
        id: 'target_months',
        label: 'Target Months of Coverage',
        type: 'slider' as const,
        min: 3,
        max: 12,
        default: 6,
        step: 1,
        description: 'How many months of expenses to save'
      },
      {
        id: 'monthly_contribution',
        label: 'Monthly Contribution ($)',
        type: 'slider' as const,
        min: 100,
        max: 2000,
        default: 500,
        step: 50,
        description: 'Amount to save each month'
      },
      {
        id: 'risk_tolerance',
        label: 'Risk Tolerance',
        type: 'select' as const,
        options: [
          { value: 'conservative', label: 'Conservative' },
          { value: 'moderate', label: 'Moderate' },
          { value: 'aggressive', label: 'Aggressive' }
        ],
        default: 'moderate',
        description: 'Investment strategy for emergency fund'
      }
    ]
  },
  'job-loss': {
    name: 'Job Loss Scenario',
    description: 'How long can you survive without income?',
    parameters: [
      {
        id: 'termination_type',
        label: 'How did you lose your job?',
        type: 'select' as const,
        options: [
          { value: 'fired', label: 'Fired (with severance)' },
          { value: 'quit', label: 'Quit (no severance)' },
          { value: 'layoff', label: 'Layoff (company downsizing)' }
        ],
        default: 'fired',
        description: 'Different termination types have different benefits'
      },
      {
        id: 'severance_weeks',
        label: 'Severance Package (Weeks)',
        type: 'slider' as const,
        min: 0,
        max: 52,
        default: 8,
        step: 1,
        description: 'Weeks of pay in severance (0 if quit)',
        conditional: { field: 'termination_type', values: ['fired', 'layoff'] }
      },
      {
        id: 'unemployment_eligible',
        label: 'Eligible for Unemployment Benefits',
        type: 'toggle' as const,
        default: true,
        description: 'Usually true if fired/laid off, false if quit',
        conditional: { field: 'termination_type', values: ['fired', 'layoff'] }
      },
      {
        id: 'emergency_fund_months',
        label: 'Emergency Fund Coverage (Months)',
        type: 'slider' as const,
        min: 1,
        max: 24,
        default: 6,
        step: 1,
        description: 'How many months of expenses in emergency fund'
      },
      {
        id: 'monthly_expenses',
        label: 'Monthly Expenses ($)',
        type: 'slider' as const,
        min: 1000,
        max: 10000,
        default: 3000,
        step: 100,
        description: 'Essential monthly expenses during job loss'
      },
      {
        id: 'income_reduction',
        label: 'Income Reduction (%)',
        type: 'slider' as const,
        min: 0,
        max: 100,
        default: 100,
        step: 5,
        description: 'Percentage of income lost during job loss'
      }
    ]
  },
  'debt-payoff': {
    name: 'Debt Payoff Strategy',
    description: 'Optimize your path to becoming debt-free',
    parameters: [
      {
        id: 'total_debt',
        label: 'Total Debt ($)',
        type: 'slider' as const,
        min: 1000,
        max: 100000,
        default: 25000,
        step: 1000,
        description: 'Total outstanding debt balance'
      },
      {
        id: 'monthly_payment',
        label: 'Monthly Payment Budget ($)',
        type: 'slider' as const,
        min: 100,
        max: 5000,
        default: 800,
        step: 50,
        description: 'Amount available for debt payments'
      },
      {
        id: 'strategy',
        label: 'Payoff Strategy',
        type: 'select' as const,
        options: [
          { value: 'avalanche', label: 'Avalanche (Highest Interest First)' },
          { value: 'snowball', label: 'Snowball (Lowest Balance First)' },
          { value: 'consolidation', label: 'Debt Consolidation' }
        ],
        default: 'avalanche',
        description: 'Debt payoff strategy to use'
      }
    ]
  },
  'student-loan': {
    name: 'Student Loan Strategy',
    description: 'Optimize student loan payoff vs. investment strategies',
    parameters: [
      {
        id: 'target_payoff_years',
        label: 'Target Payoff Years',
        type: 'slider' as const,
        min: 3,
        max: 15,
        default: 5,
        step: 1,
        description: 'Years to pay off loans'
      },
      {
        id: 'available_for_loan_payment',
        label: 'Monthly Payment Budget ($)',
        type: 'slider' as const,
        min: 200,
        max: 2000,
        default: 500,
        step: 50,
        description: 'Amount available for loan payments'
      },
      {
        id: 'risk_tolerance',
        label: 'Investment Risk Tolerance',
        type: 'select' as const,
        options: [
          { value: 'conservative', label: 'Conservative' },
          { value: 'moderate', label: 'Moderate' },
          { value: 'aggressive', label: 'Aggressive' }
        ],
        default: 'moderate',
        description: 'Risk level for investment strategy'
      }
    ]
  },
  'home-purchase': {
    name: 'Home Purchase Planning',
    description: 'Simulate home purchase and optimize mortgage strategy',
    parameters: [
      {
        id: 'purchase_price',
        label: 'Purchase Price ($)',
        type: 'slider' as const,
        min: 100000,
        max: 1000000,
        default: 400000,
        step: 10000,
        description: 'Target home purchase price'
      },
      {
        id: 'down_payment_percentage',
        label: 'Down Payment (%)',
        type: 'slider' as const,
        min: 3,
        max: 50,
        default: 20,
        step: 1,
        description: 'Percentage of purchase price for down payment'
      },
      {
        id: 'income',
        label: 'Annual Income ($)',
        type: 'slider' as const,
        min: 30000,
        max: 300000,
        default: 80000,
        step: 5000,
        description: 'Annual household income'
      },
      {
        id: 'credit_score',
        label: 'Credit Score',
        type: 'slider' as const,
        min: 500,
        max: 850,
        default: 750,
        step: 10,
        description: 'Credit score for mortgage qualification'
      }
    ]
  },
  'market-crash': {
    name: 'Market Crash Impact',
    description: 'Test portfolio resilience during market downturns',
    parameters: [
      {
        id: 'investment_horizon_years',
        label: 'Investment Horizon (Years)',
        type: 'slider' as const,
        min: 5,
        max: 40,
        default: 20,
        step: 5,
        description: 'Time horizon for investment strategy'
      },
      {
        id: 'monthly_contribution',
        label: 'Monthly Contribution ($)',
        type: 'slider' as const,
        min: 0,
        max: 10000,
        default: 1000,
        step: 100,
        description: 'Monthly investment contribution'
      },
      {
        id: 'emergency_fund_months',
        label: 'Emergency Fund (Months)',
        type: 'slider' as const,
        min: 3,
        max: 24,
        default: 6,
        step: 1,
        description: 'Months of expenses in emergency fund'
      }
    ]
  },
  'medical-crisis': {
    name: 'Medical Crisis Planning',
    description: 'Prepare for unexpected medical expenses',
    parameters: [
      {
        id: 'insurance_coverage',
        label: 'Insurance Coverage Level',
        type: 'select' as const,
        options: [
          { value: 'basic', label: 'Basic Coverage' },
          { value: 'standard', label: 'Standard Coverage' },
          { value: 'premium', label: 'Premium Coverage' }
        ],
        default: 'standard',
        description: 'Health insurance coverage level'
      },
      {
        id: 'emergency_fund_months',
        label: 'Medical Emergency Fund (Months)',
        type: 'slider' as const,
        min: 3,
        max: 12,
        default: 6,
        step: 1,
        description: 'Months of expenses for medical emergencies'
      },
      {
        id: 'health_status',
        label: 'Health Status',
        type: 'select' as const,
        options: [
          { value: 'excellent', label: 'Excellent' },
          { value: 'good', label: 'Good' },
          { value: 'fair', label: 'Fair' },
          { value: 'poor', label: 'Poor' }
        ],
        default: 'good',
        description: 'Current health status assessment'
      }
    ]
  },
  'gig-economy': {
    name: 'Gig Economy Strategy',
    description: 'Optimize income from gig work and side hustles',
    parameters: [
      {
        id: 'monthly_gig_income',
        label: 'Monthly Gig Income ($)',
        type: 'slider' as const,
        min: 500,
        max: 5000,
        default: 2000,
        step: 100,
        description: 'Average monthly income from gig work'
      },
      {
        id: 'income_volatility',
        label: 'Income Volatility',
        type: 'select' as const,
        options: [
          { value: 'low', label: 'Low Volatility' },
          { value: 'moderate', label: 'Moderate Volatility' },
          { value: 'high', label: 'High Volatility' }
        ],
        default: 'moderate',
        description: 'Variability in gig income'
      },
      {
        id: 'tax_setting',
        label: 'Tax Payment Schedule',
        type: 'select' as const,
        options: [
          { value: 'quarterly', label: 'Quarterly' },
          { value: 'monthly', label: 'Monthly' },
          { value: 'annual', label: 'Annual' }
        ],
        default: 'quarterly',
        description: 'How often to pay estimated taxes'
      },
      {
        id: 'emergency_fund_target',
        label: 'Emergency Fund Target ($)',
        type: 'slider' as const,
        min: 3000,
        max: 25000,
        default: 12000,
        step: 1000,
        description: 'Target emergency fund for income volatility'
      }
    ]
  },
  'rent-hike': {
    name: 'Rent Hike Impact',
    description: 'Plan for rent increases and housing cost changes',
    parameters: [
      {
        id: 'current_rent',
        label: 'Current Monthly Rent ($)',
        type: 'slider' as const,
        min: 500,
        max: 5000,
        default: 1500,
        step: 100,
        description: 'Current monthly rent payment'
      },
      {
        id: 'rent_increase_percentage',
        label: 'Expected Rent Increase (%)',
        type: 'slider' as const,
        min: 5,
        max: 50,
        default: 15,
        step: 5,
        description: 'Expected percentage increase in rent'
      },
      {
        id: 'savings_rate',
        label: 'Savings Rate (%)',
        type: 'slider' as const,
        min: 5,
        max: 50,
        default: 20,
        step: 5,
        description: 'Percentage of income saved monthly'
      },
      {
        id: 'alternative_housing_cost',
        label: 'Alternative Housing Cost ($)',
        type: 'slider' as const,
        min: 800,
        max: 6000,
        default: 1800,
        step: 100,
        description: 'Cost of alternative housing options'
      }
    ]
  },
  'auto-repair': {
    name: 'Auto Repair Planning',
    description: 'Prepare for vehicle maintenance and repair costs',
    parameters: [
      {
        id: 'vehicle_age',
        label: 'Vehicle Age (Years)',
        type: 'slider' as const,
        min: 1,
        max: 20,
        default: 8,
        step: 1,
        description: 'Age of your vehicle in years'
      },
      {
        id: 'repair_frequency',
        label: 'Repair Frequency',
        type: 'select' as const,
        options: [
          { value: 'low', label: 'Low Frequency' },
          { value: 'moderate', label: 'Moderate Frequency' },
          { value: 'high', label: 'High Frequency' }
        ],
        default: 'moderate',
        description: 'Expected frequency of repairs'
      },
      {
        id: 'emergency_fund',
        label: 'Auto Emergency Fund ($)',
        type: 'slider' as const,
        min: 1000,
        max: 10000,
        default: 3000,
        step: 500,
        description: 'Emergency fund for auto repairs'
      },
      {
        id: 'replacement_cost',
        label: 'Vehicle Replacement Cost ($)',
        type: 'slider' as const,
        min: 10000,
        max: 50000,
        default: 25000,
        step: 1000,
        description: 'Cost to replace vehicle if needed'
      }
    ]
  }
}

// Centralized scenario mapping following DRY principles
const SCENARIO_MAPPING: Record<string, string> = {
  'emergency-fund': 'emergency_fund',
  'student-loan': 'student_loan',
  'home-purchase': 'home_purchase',
  'market-crash': 'market_crash',
  'medical-crisis': 'medical_crisis',
  'gig-economy': 'gig_economy',
  'rent-hike': 'rent_hike',
  'auto-repair': 'auto_repair',
  // Map job-loss to emergency_fund since it's handled by emergency strategies
  'job-loss': 'emergency_fund',
  // Map debt-payoff to student_loan since it's handled by loan strategies
  'debt-payoff': 'student_loan'
}

export default function SimulationSetupScreen({ currentSimulation, setCurrentScreen, demographic, setSimulationResults }: AppState) {
  const [parameters, setParameters] = useState<Record<string, any>>({})
  const [isRunningSimulation, setIsRunningSimulation] = useState(false)
  const { toast } = useToast()

  // Get simulation configuration
  const simulationConfig = SIMULATION_PARAMETERS[currentSimulation?.id as keyof typeof SIMULATION_PARAMETERS]
  
  // Initialize parameters with defaults
  useEffect(() => {
    if (simulationConfig) {
      const defaultParams: Record<string, any> = {}
      simulationConfig.parameters.forEach(param => {
        defaultParams[param.id] = param.default
      })
      setParameters(defaultParams)
    }
  }, [simulationConfig])

  const handleParameterChange = (paramId: string, value: any) => {
    setParameters(prev => ({
      ...prev,
      [paramId]: value
    }))
  }

  // Check if user has modified any parameters from defaults
  const hasModifiedParameters = () => {
    if (!simulationConfig) return false
    
    return simulationConfig.parameters.some(param => {
      const currentValue = parameters[param.id]
      const defaultValue = param.default
      return currentValue !== undefined && currentValue !== defaultValue
    })
  }

  // Unified simulation function that intelligently uses current profile or parameters
  const runSimulation = async () => {
    setIsRunningSimulation(true)
    try {
      const profileId = demographicToProfileId(demographic)
      
      // Use centralized scenario mapping
      const scenarioType = SCENARIO_MAPPING[currentSimulation?.id || 'emergency-fund']
      
      // Determine if we should use current profile based on parameter modifications
      const useCurrentProfile = !hasModifiedParameters()
      
      let finalParameters = {}
      
      if (useCurrentProfile) {
        // Use current profile data without parameter adjustments - same as runSimulationWithCurrentProfile
        if (currentSimulation?.id === 'job-loss') {
          finalParameters = {
            emergency_type: 'job_loss',
            termination_type: 'fired', // Default for current profile
            severance_weeks: 8,
            unemployment_eligible: true
          }
        }
      } else {
        // Use user-adjusted parameters - same as runSimulationWithParameters
        finalParameters = { ...parameters }
        if (currentSimulation?.id === 'job-loss') {
          finalParameters.emergency_type = 'job_loss'
          
          // Set defaults for termination-specific parameters if not provided
          if (!finalParameters.termination_type) finalParameters.termination_type = 'fired'
          if (!finalParameters.severance_weeks) finalParameters.severance_weeks = finalParameters.termination_type === 'quit' ? 0 : 8
          if (finalParameters.unemployment_eligible === undefined) {
            finalParameters.unemployment_eligible = finalParameters.termination_type !== 'quit'
          }
        }
      }
      
      const requestBody = {
        profile_id: profileId,
        use_current_profile: useCurrentProfile,
        parameters: finalParameters,
        scenario_type: scenarioType,
        original_simulation_id: currentSimulation?.id // Pass original ID for context
      }
      
      console.log(`[SIMULATION] Request body (${useCurrentProfile ? 'current profile' : 'custom parameters'}):`, JSON.stringify(requestBody, null, 2))
      
      const response = await fetch(`/api/simulation/${scenarioType}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error('Simulation failed')
      }

      const result = await response.json()
      
      // Store the simulation results in app state
      setSimulationResults(result.data)
      
      // Navigate to results screen
      setCurrentScreen('simulation-results')
      
    } catch (error) {
      toast({
        title: "Simulation Error",
        description: "Failed to run simulation. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsRunningSimulation(false)
    }
  }

  if (!simulationConfig) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh]">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Simulation Not Found</h1>
          <Button onClick={() => setCurrentScreen('simulations')}>
            Back to Simulations
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 flex items-center gap-4"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentScreen("simulations")}
          className="text-white hover:bg-white/10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{simulationConfig.name}</h1>
          <p className="text-gray-300">{simulationConfig.description}</p>
        </div>
      </motion.header>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 space-y-6"
      >
        {/* Unified Simulation Card */}
        <Card className="bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Run Simulation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-gray-300 mb-4">
              Adjust parameters below or leave defaults to use your current profile data.
            </p>
            
            {simulationConfig.parameters.map((param) => (
              <div key={param.id} className="space-y-2">
                <Label className="text-white">{param.label}</Label>
                <p className="text-sm text-gray-400">{param.description}</p>
                
                {param.type === 'slider' && (
                  <div className="space-y-2">
                    <Slider
                      value={[parameters[param.id] || param.default]}
                      onValueChange={(value) => handleParameterChange(param.id, value[0])}
                      min={param.min}
                      max={param.max}
                      step={param.step}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-400">
                      <span>{param.min.toLocaleString()}</span>
                      <span className="font-medium text-white">
                        {param.id.includes('percentage') || param.id.includes('score') 
                          ? `${parameters[param.id] || param.default}${param.id.includes('percentage') ? '%' : ''}`
                          : `$${(parameters[param.id] || param.default).toLocaleString()}`
                        }
                      </span>
                      <span>{param.max.toLocaleString()}</span>
                    </div>
                  </div>
                )}
                
                {param.type === 'select' && (
                  <Select
                    value={parameters[param.id] || param.default}
                    onValueChange={(value) => handleParameterChange(param.id, value)}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {param.options.map((option: { value: string; label: string }) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            ))}
            
            <Button
              onClick={runSimulation}
              disabled={isRunningSimulation}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isRunningSimulation ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Running Simulation...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run Simulation
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
