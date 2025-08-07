import { NextRequest, NextResponse } from 'next/server'

// Map frontend simulation IDs to backend scenario types
const SIMULATION_MAP = {
  'emergency_fund': 'emergency_fund',
  'student_loan_payoff': 'student_loan',
  'home_purchase': 'home_purchase', 
  'market_crash': 'market_crash',
  'medical_crisis': 'medical_crisis'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { profile_id, use_current_profile, parameters, scenario_type } = body

    // Determine the scenario type
    const backendScenarioType = scenario_type || SIMULATION_MAP[body.scenario_type as keyof typeof SIMULATION_MAP] || 'emergency_fund'

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

export async function GET() {
  try {
    // Health check for the Python engine
    const response = await fetch(`${PYTHON_API_URL}/health`)
    
    if (!response.ok) {
      return NextResponse.json(
        { 
          success: false, 
          status: 'unhealthy',
          error: 'Python engine is not responding' 
        },
        { status: 503 }
      )
    }
    
    const health = await response.json()
    return NextResponse.json({
      success: true,
      ...health
    })
    
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        status: 'offline',
        error: 'Python engine is not running' 
      },
      { status: 503 }
    )
  }
}