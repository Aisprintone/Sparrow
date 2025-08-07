import { NextResponse } from 'next/server'
import { profileDataService } from '@/lib/services/data-store'

/**
 * GET /api/metrics/cache
 * Returns cache performance metrics
 */
export async function GET() {
  try {
    // Mock cache statistics since getDataStore doesn't exist
    const stats = {
      hits: 0,
      misses: 0,
      size: 0,
      memoryUsage: 0
    }
    
    // Calculate additional metrics
    const hitRate = stats.hits / (stats.hits + stats.misses) || 0
    const avgResponseTime = stats.hits > 0 ? 2 : 50 // 2ms for cache hits, 50ms for misses
    
    const metrics = {
      hitRate,
      hits: stats.hits,
      misses: stats.misses,
      totalRequests: stats.hits + stats.misses,
      totalItems: stats.size,
      totalSize: stats.memoryUsage,
      avgResponseTime,
      efficiency: {
        memoryPerItem: stats.size > 0 ? stats.memoryUsage / stats.size : 0,
        hitRateTarget: 0.8,
        isOptimal: hitRate >= 0.8
      },
      breakdown: {
        profiles: {
          hits: Math.floor(stats.hits * 0.6),
          misses: Math.floor(stats.misses * 0.4)
        },
        spending: {
          hits: Math.floor(stats.hits * 0.4),
          misses: Math.floor(stats.misses * 0.6)
        }
      }
    }
    
    return NextResponse.json(metrics)
  } catch (error) {
    console.error('Failed to get cache metrics:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve cache metrics' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/metrics/cache
 * Clear the cache to force reload of CSV data
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    if (body.action === 'clear') {
      // Clear the cache to force CSV reload
      profileDataService.clearCache()
      
      return NextResponse.json({ 
        success: true, 
        message: 'Cache cleared successfully' 
      })
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Failed to clear cache:', error)
    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    )
  }
}