// PERFORMANCE MONITORING UTILITY - SURGICAL PRECISION METRICS
// Tracks API response times, cache hit rates, and data freshness

export interface PerformanceMetrics {
  apiCalls: number
  cacheHits: number
  cacheMisses: number
  averageResponseTime: number
  p99ResponseTime: number
  lastFetchTime: number
  dataFreshness: number
  memoryUsage: number
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    apiCalls: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageResponseTime: 0,
    p99ResponseTime: 0,
    lastFetchTime: 0,
    dataFreshness: 0,
    memoryUsage: 0
  }
  
  private responseTimes: number[] = []
  private readonly MAX_SAMPLES = 100
  
  recordApiCall(responseTime: number, fromCache: boolean) {
    this.metrics.apiCalls++
    
    if (fromCache) {
      this.metrics.cacheHits++
    } else {
      this.metrics.cacheMisses++
    }
    
    this.responseTimes.push(responseTime)
    if (this.responseTimes.length > this.MAX_SAMPLES) {
      this.responseTimes.shift()
    }
    
    this.updateMetrics(responseTime, fromCache)
  }
  
  private updateMetrics(lastResponseTime: number, fromCache: boolean = false) {
    this.metrics.lastFetchTime = lastResponseTime
    
    // Calculate average
    const sum = this.responseTimes.reduce((a, b) => a + b, 0)
    this.metrics.averageResponseTime = sum / this.responseTimes.length
    
    // Calculate p99
    const sorted = [...this.responseTimes].sort((a, b) => a - b)
    const p99Index = Math.floor(sorted.length * 0.99)
    this.metrics.p99ResponseTime = sorted[p99Index] || lastResponseTime
    
    // Update memory usage
    if (typeof window !== 'undefined' && 'memory' in performance) {
      this.metrics.memoryUsage = (performance as any).memory.usedJSHeapSize
    }
    
    // Calculate data freshness (time since last non-cached fetch)
    if (!fromCache) {
      this.metrics.dataFreshness = 0
    }
  }
  
  getCacheHitRate(): number {
    const total = this.metrics.cacheHits + this.metrics.cacheMisses
    return total === 0 ? 0 : (this.metrics.cacheHits / total) * 100
  }
  
  getMetrics(): PerformanceMetrics & { cacheHitRate: number } {
    return {
      ...this.metrics,
      cacheHitRate: this.getCacheHitRate()
    }
  }
  
  reset() {
    this.metrics = {
      apiCalls: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageResponseTime: 0,
      p99ResponseTime: 0,
      lastFetchTime: 0,
      dataFreshness: 0,
      memoryUsage: 0
    }
    this.responseTimes = []
  }
  
  // Performance assertions for testing
  assertPerformance() {
    const metrics = this.getMetrics()
    const assertions = {
      cacheHitRate: metrics.cacheHitRate >= 80,
      averageResponseTime: metrics.averageResponseTime < 50,
      p99ResponseTime: metrics.p99ResponseTime < 100,
      passed: true
    }
    
    assertions.passed = assertions.cacheHitRate && 
                       assertions.averageResponseTime && 
                       assertions.p99ResponseTime
    
    return assertions
  }
  
  logPerformance() {
    const metrics = this.getMetrics()
    console.log(`
╔══════════════════════════════════════════════════════╗
║          CSV DATA INTEGRATION PERFORMANCE           ║
╠══════════════════════════════════════════════════════╣
║ API Calls:          ${String(metrics.apiCalls).padEnd(32)}║
║ Cache Hit Rate:     ${metrics.cacheHitRate.toFixed(1)}%${' '.repeat(31 - metrics.cacheHitRate.toFixed(1).length)}║
║ Avg Response Time:  ${metrics.averageResponseTime.toFixed(2)}ms${' '.repeat(30 - metrics.averageResponseTime.toFixed(2).length)}║
║ P99 Response Time:  ${metrics.p99ResponseTime.toFixed(2)}ms${' '.repeat(30 - metrics.p99ResponseTime.toFixed(2).length)}║
║ Last Fetch Time:    ${metrics.lastFetchTime.toFixed(2)}ms${' '.repeat(30 - metrics.lastFetchTime.toFixed(2).length)}║
║ Memory Usage:       ${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB${' '.repeat(30 - (metrics.memoryUsage / 1024 / 1024).toFixed(2).length)}║
╚══════════════════════════════════════════════════════╝
    `)
  }
}

// Global singleton instance
export const performanceMonitor = new PerformanceMonitor()

// Export for use in development
if (typeof window !== 'undefined') {
  (window as any).__PERF_MONITOR__ = performanceMonitor
}