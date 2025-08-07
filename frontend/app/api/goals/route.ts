import { NextRequest, NextResponse } from 'next/server'
import { goals } from '@/lib/data'

// SOLID: Single Responsibility - Goal CRUD operations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    let filteredGoals = goals

    // Filter by user ID if provided
    if (userId) {
      filteredGoals = filteredGoals.filter(goal => goal.userId === parseInt(userId))
    }

    // Filter by status if provided
    if (status) {
      filteredGoals = filteredGoals.filter(goal => goal.status === status)
    }

    // Filter by type if provided
    if (type) {
      filteredGoals = filteredGoals.filter(goal => goal.type === type)
    }

    return NextResponse.json({
      success: true,
      data: filteredGoals,
      count: filteredGoals.length
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch goals' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const requiredFields = ['title', 'type', 'target', 'deadline', 'monthlyContribution']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Generate new goal with proper structure
    const newGoal = {
      id: Math.max(...goals.map(g => g.id)) + 1,
      title: body.title,
      type: body.type,
      target: parseFloat(body.target),
      current: body.current || 0,
      deadline: body.deadline,
      icon: body.icon || 'Target',
      color: body.color || 'blue',
      monthlyContribution: parseFloat(body.monthlyContribution),
      priority: body.priority || 'medium',
      status: body.status || 'active',
      simulationTags: body.simulationTags || [],
      milestones: body.milestones || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: body.userId || 1,
      aiInsights: {
        lastUpdated: new Date().toISOString(),
        recommendations: [],
        riskAssessment: '',
        optimizationOpportunities: []
      },
      simulationImpact: []
    }

    // In a real implementation, this would be saved to a database
    // For now, we'll simulate persistence by adding to the goals array
    goals.push(newGoal)

    return NextResponse.json({
      success: true,
      data: newGoal,
      message: 'Goal created successfully'
    }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create goal' },
      { status: 500 }
    )
  }
}
