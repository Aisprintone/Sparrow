import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { message, action } = await request.json()
    
    // Connect to the backend streaming AI pipeline
    const response = await fetch("http://localhost:8000/streaming/ai-chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        action,
        profile_id: 1, // Default profile
      }),
    })

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json({ response: data.response || data.message || "I'm here to help with your financial questions!" })
    
  } catch (error) {
    console.error("AI Chat API Error:", error)
    
    // Fallback response if backend is unavailable
    return NextResponse.json({ 
      response: "I'm currently experiencing technical difficulties. Please try again in a moment, or contact support if the issue persists." 
    })
  }
}
