import { NextRequest, NextResponse } from 'next/server'
import { goals, simulations } from '@/lib/data'

// SOLID: Single Responsibility - Goal-Simulation mapping
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const goalId = parseInt(params.id)
    const goal = goals.find(g => g.id === goalId)

    if (!goal) {
      return NextResponse.json(
        { success: false, error: 'Goal not found' },
        { status: 404 }
      )
    }

    // Map goal type to relevant simulations
    const goalSimulationMap: Record<string, string[]> = {
      safety: ['emergency_fund', 'safety_net'],
      home: ['home_purchase', 'housing'],
      experience: ['travel', 'lifestyle'],
      retirement: ['retirement', '401k_max'],
      debt: ['debt_avalanche', 'student_loan'],
      investment: ['investment', 'portfolio'],
      education: ['education', 'investment'],
      business: ['business', 'side_income']
    }

    // Get relevant simulations based on goal type and tags
    const relevantSimulations = simulations.filter(sim => {
      const goalTags = goal.simulationTags || []
      const mappedTags = goalSimulationMap[goal.type] || []
      
      return goalTags.some(tag => 
        sim.category.toLowerCase().includes(tag.toLowerCase()) ||
        sim.title.toLowerCase().includes(tag.toLowerCase())
      ) || mappedTags.some(tag => 
        sim.category.toLowerCase().includes(tag.toLowerCase()) ||
        sim.title.toLowerCase().includes(tag.toLowerCase())
      )
    })

    // Add simulation impact data if available
    const simulationsWithImpact = relevantSimulations.map(sim => ({
      ...sim,
      impactOnGoal: goal.simulationImpact?.find(impact => 
        impact.scenarioName === sim.title
      )?.impactOnGoal || 0,
      recommendation: getSimulationRecommendation(sim, goal)
    }))

    return NextResponse.json({
      success: true,
      data: {
        goal,
        relevantSimulations: simulationsWithImpact,
        totalSimulations: simulationsWithImpact.length
      }
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch goal simulations' },
      { status: 500 }
    )
  }
}

// Helper function to generate simulation recommendations
function getSimulationRecommendation(simulation: any, goal: any): string {
  const recommendations: Record<string, string> = {
    'Max out 401k': 'This simulation will show how increasing retirement contributions can accelerate your retirement goal.',
    'Buy vs Rent Analysis': 'Perfect for evaluating housing costs and optimizing your home purchase timeline.',
    'Emergency Fund Boost': 'Essential for building financial security and protecting your other goals.',
    'Debt Avalanche': 'Optimize your debt payoff strategy to free up cash flow for other goals.',
    'Side Income Impact': 'Explore how additional income could accelerate all your financial goals.'
  }

  return recommendations[simulation.title] || 
    `This simulation can help optimize your ${goal.title} goal.`
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const goalId = parseInt(params.id)
    const body = await request.json()
    
    const goal = goals.find(g => g.id === goalId)
    
    if (!goal) {
      return NextResponse.json(
        { success: false, error: 'Goal not found' },
        { status: 404 }
      )
    }

    // Update goal with simulation impact data
    const { scenarioName, impactOnGoal, newTargetDate, adjustedMonthlyContribution } = body

    const simulationImpact = {
      scenarioName,
      impactOnGoal,
      newTargetDate,
      adjustedMonthlyContribution
    }

    // Add or update simulation impact
    const goalIndex = goals.findIndex(g => g.id === goalId)
    if (goalIndex !== -1) {
      const existingImpact = goals[goalIndex].simulationImpact || []
      const updatedImpact = existingImpact.filter(impact => 
        impact.scenarioName !== scenarioName
      )
      updatedImpact.push(simulationImpact)
      
      goals[goalIndex] = {
        ...goals[goalIndex],
        simulationImpact: updatedImpact,
        updatedAt: new Date().toISOString()
      }
    }

    return NextResponse.json({
      success: true,
      data: goals[goalIndex],
      message: 'Simulation impact recorded successfully'
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to record simulation impact' },
      { status: 500 }
    )
  }
}
