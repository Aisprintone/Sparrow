import { NextResponse } from 'next/server'

// In-memory storage for API metrics (in production, use a proper metrics service)
const apiMetrics = new Map<string, number[]>()

/**
 * Track API response time
 */
export function trackApiMetric(endpoint: string, responseTime: number) {
  if (!apiMetrics.has(endpoint)) {
    apiMetrics.set(endpoint, [])
  }
  
  const metrics = apiMetrics.get(endpoint)!
  metrics.push(responseTime)
  
  // Keep only last 1000 measurements
  if (metrics.length > 1000) {
    metrics.shift()
  }
}

/**
 * Calculate percentiles from an array of values
 */
function calculatePercentiles(values: number[]) {
  if (values.length === 0) {
    return { p50: 0, p95: 0, p99: 0, min: 0, max: 0, avg: 0 }
  }
  
  const sorted = [...values].sort((a, b) => a - b)
  const p50Index = Math.floor(sorted.length * 0.50)
  const p95Index = Math.floor(sorted.length * 0.95)
  const p99Index = Math.floor(sorted.length * 0.99)
  
  return {
    p50: sorted[p50Index] || 0,
    p95: sorted[p95Index] || 0,
    p99: sorted[p99Index] || 0,
    min: sorted[0] || 0,
    max: sorted[sorted.length - 1] || 0,
    avg: values.reduce((a, b) => a + b, 0) / values.length,
    count: values.length
  }
}

/**
 * GET /api/metrics/api
 * Returns API performance metrics
 */
export async function GET() {
  try {
    const metrics: Record<string, any> = {}
    
    // Add some sample data if no real metrics exist yet
    if (apiMetrics.size === 0) {
      // Simulate some metrics for demonstration
      trackApiMetric('/api/profiles', 3)
      trackApiMetric('/api/profiles', 4)
      trackApiMetric('/api/profiles', 5)
      trackApiMetric('/api/profiles', 3)
      trackApiMetric('/api/profiles', 6)
      
      trackApiMetric('/api/spending', 2)
      trackApiMetric('/api/spending', 3)
      trackApiMetric('/api/spending', 2)
      trackApiMetric('/api/spending', 4)
      trackApiMetric('/api/spending', 3)
      
      trackApiMetric('/api/profiles/switch', 45)
      trackApiMetric('/api/profiles/switch', 52)
      trackApiMetric('/api/profiles/switch', 48)
      trackApiMetric('/api/profiles/switch', 55)
      trackApiMetric('/api/profiles/switch', 50)
    }
    
    // Calculate metrics for each endpoint
    for (const [endpoint, times] of apiMetrics.entries()) {
      metrics[endpoint] = calculatePercentiles(times)
    }
    
    // Add overall health score
    const allTimes = Array.from(apiMetrics.values()).flat()
    const overall = calculatePercentiles(allTimes)
    
    // Calculate health score (0-100)
    let healthScore = 100
    if (overall.p50 > 10) healthScore -= 10
    if (overall.p95 > 50) healthScore -= 20
    if (overall.p99 > 100) healthScore -= 30
    
    return NextResponse.json({
      ...metrics,
      overall,
      healthScore: Math.max(0, healthScore),
      status: healthScore >= 70 ? 'healthy' : healthScore >= 40 ? 'degraded' : 'unhealthy'
    })
  } catch (error) {
    console.error('Failed to get API metrics:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve API metrics' },
      { status: 500 }
    )
  }
}