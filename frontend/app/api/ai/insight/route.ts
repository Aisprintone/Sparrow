import { NextResponse } from "next/server"

const insights = [
  "You're on track to reach $150k by year-end. Consider maximizing your 401k to accelerate growth.",
  "Your spending on subscriptions has increased by 15% this month. It might be a good time to review them.",
  "Great job on your savings rate! At 24%, you're saving more than the average for your income bracket.",
  "Consider setting up a high-yield savings account to make your emergency fund work harder for you.",
]

export async function GET() {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  const randomIndex = Math.floor(Math.random() * insights.length)
  const insight = insights[randomIndex]

  return NextResponse.json({ insight })
}
