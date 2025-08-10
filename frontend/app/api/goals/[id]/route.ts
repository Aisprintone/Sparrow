import { NextRequest, NextResponse } from 'next/server'
import { goals } from '@/lib/data'

// SOLID: Single Responsibility - Individual goal operations
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    const goalId = parseInt(id)
    const goal = goals.find(g => g.id === goalId)

    if (!goal) {
      return NextResponse.json(
        { success: false, error: 'Goal not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: goal
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch goal' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    const goalId = parseInt(id)
    const body = await request.json()
    
    const goalIndex = goals.findIndex(g => g.id === goalId)
    
    if (goalIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Goal not found' },
        { status: 404 }
      )
    }

    // Update goal with new data while preserving existing fields
    const updatedGoal = {
      ...goals[goalIndex],
      ...body,
      updatedAt: new Date().toISOString()
    }

    goals[goalIndex] = updatedGoal

    return NextResponse.json({
      success: true,
      data: updatedGoal,
      message: 'Goal updated successfully'
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update goal' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    const goalId = parseInt(id)
    const goalIndex = goals.findIndex(g => g.id === goalId)
    
    if (goalIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Goal not found' },
        { status: 404 }
      )
    }

    // Remove goal from array
    const deletedGoal = goals.splice(goalIndex, 1)[0]

    return NextResponse.json({
      success: true,
      data: deletedGoal,
      message: 'Goal deleted successfully'
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete goal' },
      { status: 500 }
    )
  }
}
