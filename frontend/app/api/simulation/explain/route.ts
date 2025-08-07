import { NextRequest, NextResponse } from 'next/server'

// Python simulation engine endpoint
const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request
    if (!body.profile_id || !body.scenario_type) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required parameters: profile_id and scenario_type' 
        },
        { status: 400 }
      )
    }
    
    // Call Python AI explanation endpoint
    const response = await fetch(`${PYTHON_API_URL}/api/simulation/explain`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        profile_id: body.profile_id,
        scenario_type: body.scenario_type,
        simulation_result: body.simulation_result,
        iterations: body.iterations || 10000
      })
    })
    
    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(
        { 
          success: false, 
          error: error.detail || 'AI explanation generation failed' 
        },
        { status: response.status }
      )
    }
    
    const result = await response.json()
    
    // Transform the response to match frontend expectations
    return NextResponse.json({
      success: true,
      cards: result.cards || [],
      metadata: result.simulation_metadata || {}
    })
    
  } catch (error) {
    console.error('AI explanation API error:', error)
    
    // Check if Python engine is running
    if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'AI explanation engine is not running. Please start the Python server.' 
        },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}