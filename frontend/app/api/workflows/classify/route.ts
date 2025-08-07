/**
 * Workflow Classification API Endpoint
 * =====================================
 * Connects frontend to backend classification engine
 */

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'https://sparrow-backend-production.up.railway.app';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Forward request to backend classification service
    const response = await fetch(`${BACKEND_URL}/api/workflows/classify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      throw new Error(`Backend classification failed: ${response.status}`)
    }
    
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Classification API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Backend service unavailable',
        message: 'Unable to connect to the classification backend service'
      },
      { status: 503 }
    )
  }
}