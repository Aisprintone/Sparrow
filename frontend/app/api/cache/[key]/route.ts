/**
 * Cache API Route Handler
 * 
 * SOLID Principles Applied:
 * - Single Responsibility: Cache operations only
 * - Open/Closed: Extensible cache strategies
 * - Interface Segregation: Clean cache interface
 * - Dependency Inversion: Abstract cache operations
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

/**
 * Cache Entry Interface - Interface Segregation
 */
interface CacheEntry<T = any> {
  data: T
  timestamp: number
  ttl: number
  metadata?: Record<string, any>
}

/**
 * Cache Service Abstraction - Dependency Inversion
 */
class BackendCacheService {
  private readonly baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl || 'https://sparrow-backend-production.up.railway.app'
  }

  async get(key: string): Promise<CacheEntry | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/cache/get/${encodeURIComponent(key)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (response.ok) {
        return await response.json()
      }

      return null
    } catch (error) {
      console.error(`[Cache] Failed to get key ${key}:`, error)
      return null
    }
  }

  async set(key: string, entry: CacheEntry): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/cache/set/${encodeURIComponent(key)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(entry),
        }
      )

      return response.ok
    } catch (error) {
      console.error(`[Cache] Failed to set key ${key}:`, error)
      return false
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/cache/delete/${encodeURIComponent(key)}`,
        {
          method: 'DELETE',
        }
      )

      return response.ok
    } catch (error) {
      console.error(`[Cache] Failed to delete key ${key}:`, error)
      return false
    }
  }
}

/**
 * In-Memory Cache Store - Single Responsibility
 * Provides fast local caching for frequently accessed data
 */
class InMemoryCacheStore {
  private static instance: InMemoryCacheStore
  private cache: Map<string, CacheEntry>
  private maxSize: number = 100

  private constructor() {
    this.cache = new Map()
  }

  static getInstance(): InMemoryCacheStore {
    if (!InMemoryCacheStore.instance) {
      InMemoryCacheStore.instance = new InMemoryCacheStore()
    }
    return InMemoryCacheStore.instance
  }

  get(key: string): CacheEntry | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    // Check if expired
    if (this.isExpired(entry)) {
      this.cache.delete(key)
      return null
    }

    return entry
  }

  set(key: string, entry: CacheEntry): void {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }

    this.cache.set(key, entry)
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl
  }
}

/**
 * GET /api/cache/[key]
 * Retrieve cached data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params

    // Try in-memory cache first
    const memoryCache = InMemoryCacheStore.getInstance()
    const memoryEntry = memoryCache.get(key)
    
    if (memoryEntry) {
      return NextResponse.json(memoryEntry, {
        headers: {
          'X-Cache-Hit': 'memory',
        },
      })
    }

    // Try backend cache
    const cacheService = new BackendCacheService(BACKEND_URL)
    const backendEntry = await cacheService.get(key)

    if (backendEntry) {
      // Store in memory cache for faster subsequent access
      memoryCache.set(key, backendEntry)
      
      return NextResponse.json(backendEntry, {
        headers: {
          'X-Cache-Hit': 'backend',
        },
      })
    }

    // Cache miss
    return NextResponse.json(
      { error: 'Cache miss' },
      { 
        status: 404,
        headers: {
          'X-Cache-Hit': 'miss',
        },
      }
    )

  } catch (error: any) {
    console.error('[Cache API Error]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/cache/[key]
 * Store data in cache
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params
    const entry: CacheEntry = await request.json()

    // Validate entry structure
    if (!entry.data || typeof entry.timestamp !== 'number' || typeof entry.ttl !== 'number') {
      return NextResponse.json(
        { error: 'Invalid cache entry format' },
        { status: 400 }
      )
    }

    // Store in memory cache
    const memoryCache = InMemoryCacheStore.getInstance()
    memoryCache.set(key, entry)

    // Store in backend cache (async, don't wait)
    const cacheService = new BackendCacheService(BACKEND_URL)
    cacheService.set(key, entry).catch(err => 
      console.error('[Cache] Backend storage failed:', err)
    )

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('[Cache API Error]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/cache/[key]
 * Remove data from cache
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params

    // Delete from memory cache
    const memoryCache = InMemoryCacheStore.getInstance()
    const memoryDeleted = memoryCache.delete(key)

    // Delete from backend cache
    const cacheService = new BackendCacheService(BACKEND_URL)
    const backendDeleted = await cacheService.delete(key)

    return NextResponse.json({ 
      success: memoryDeleted || backendDeleted,
      deleted: {
        memory: memoryDeleted,
        backend: backendDeleted
      }
    })

  } catch (error: any) {
    console.error('[Cache API Error]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}