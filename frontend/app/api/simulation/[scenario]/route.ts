import { NextRequest, NextResponse } from 'next/server'

// Map frontend simulation IDs to backend scenario types
const SIMULATION_MAP = {
  'emergency_fund': 'emergency_fund',
  'student_loan_payoff': 'student_loan',
  'home_purchase': 'home_purchase', 
  'market_crash': 'market_crash',
  'medical_crisis': 'medical_crisis'
}

export async function POST(
  request: NextRequest,
  { params }: { params: { scenario: string } }
) {
  try {
    const body = await request.json()
    const { profile_id, use_current_profile, parameters } = body

    // Get the scenario from the URL parameter
    const scenario = params.scenario

    // Determine the scenario type for the backend
    const backendScenarioType = SIMULATION_MAP[scenario as keyof typeof SIMULATION_MAP] || scenario

    // Prepare the request payload for the backend
    const backendPayload = {
      profile_id,
      use_current_profile: use_current_profile || false,
      parameters: parameters || {},
      scenario_type: backendScenarioType
    }

    // Call the backend Python API
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000'
    const response = await fetch(`${backendUrl}/simulation/${backendScenarioType}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(backendPayload)
    })

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`)
    }

    const result = await response.json()

    // Return structured response
    return NextResponse.json({
      success: true,
      data: result,
      message: 'Simulation completed successfully'
    })

  } catch (error) {
    console.error('Simulation API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to run simulation',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
