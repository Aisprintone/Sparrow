import { NextRequest, NextResponse } from 'next/server'

const profiles = {
  1: {
    id: 1,
    demographic: 'millennial',
    name: 'Mid-Career Pro',
    age: 33,
    location: 'New York, NY',
    netWorth: 6400,
    income: 5800,
    highlights: [
      'Growing emergency fund',
      'Balancing debt & savings',
      'Career advancement focus'
    ]
  },
  2: {
    id: 2,
    demographic: 'genx',
    name: 'Established Professional',
    age: 45,
    location: 'San Francisco, CA',
    netWorth: 125000,
    income: 8500,
    highlights: [
      'Investment portfolio',
      'Tax optimization',
      'Retirement planning'
    ]
  },
  3: {
    id: 3,
    demographic: 'genz',
    name: 'Gen Z Student',
    age: 23,
    location: 'Austin, TX',
    netWorth: -19000,
    income: 3200,
    highlights: [
      'Building credit history',
      'Managing student loans',
      'Starting investment journey'
    ]
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (id) {
      const profile = profiles[parseInt(id) as keyof typeof profiles]
      if (!profile) {
        return NextResponse.json(
          { error: 'Profile not found' },
          { status: 404 }
        )
      }
      return NextResponse.json({
        success: true,
        data: profile
      })
    }
    
    // Return all profiles
    return NextResponse.json({
      success: true,
      data: Object.values(profiles)
    })
  } catch (error) {
    console.error('Error fetching profiles:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
