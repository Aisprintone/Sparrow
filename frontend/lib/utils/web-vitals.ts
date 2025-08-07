/**
 * Web Vitals Performance Monitoring
 * Tracks Core Web Vitals and custom metrics for production readiness
 */

import type { NextWebVitalsMetric } from 'next/app'

// Performance thresholds based on Google's recommendations
export const PERFORMANCE_THRESHOLDS = {
  // Core Web Vitals
  LCP: { good: 2500, needsImprovement: 4000 }, // Largest Contentful Paint
  FID: { good: 100, needsImprovement: 300 },    // First Input Delay
  CLS: { good: 0.1, needsImprovement: 0.25 },   // Cumulative Layout Shift
  FCP: { good: 1800, needsImprovement: 3000 },  // First Contentful Paint
  TTFB: { good: 800, needsImprovement: 1800 },  // Time to First Byte
  
  // Custom metrics
  INP: { good: 200, needsImprovement: 500 },    // Interaction to Next Paint
  TBT: { good: 200, needsImprovement: 600 },    // Total Blocking Time
}

// Performance data storage
interface PerformanceData {
  metric: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  timestamp: number
  page: string
  id: string
}

class PerformanceMonitor {
  private metrics: PerformanceData[] = []
  private reportQueue: PerformanceData[] = []
  private reportInterval: NodeJS.Timeout | null = null
  
  constructor() {
    // Start batched reporting
    if (typeof window !== 'undefined') {
      this.startBatchReporting()
      this.initializeObservers()
    }
  }
  
  /**
   * Initialize performance observers for detailed metrics
   */
  private initializeObservers() {
    // Long Task Observer
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) { // Tasks longer than 50ms
              this.trackMetric({
                name: 'long-task',
                value: entry.duration,
                id: `lt-${Date.now()}`,
                label: 'custom',
                startTime: entry.startTime
              })
            }
          }
        })
        longTaskObserver.observe({ entryTypes: ['longtask'] })
      } catch (e) {
        console.warn('Long Task Observer not supported')
      }
      
      // Resource Timing Observer
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const resourceEntry = entry as PerformanceResourceTiming
            if (resourceEntry.name.includes('.js') || resourceEntry.name.includes('.css')) {
              const loadTime = resourceEntry.responseEnd - resourceEntry.startTime
              if (loadTime > 1000) { // Resources taking more than 1s
                this.trackMetric({
                  name: 'slow-resource',
                  value: loadTime,
                  id: `res-${Date.now()}`,
                  label: 'custom',
                  startTime: resourceEntry.startTime
                })
              }
            }
          }
        })
        resourceObserver.observe({ entryTypes: ['resource'] })
      } catch (e) {
        console.warn('Resource Timing Observer not supported')
      }
    }
  }
  
  /**
   * Track a web vitals metric
   */
  trackMetric(metric: NextWebVitalsMetric) {
    const rating = this.getRating(metric.name, metric.value)
    
    const data: PerformanceData = {
      metric: metric.name,
      value: Math.round(metric.value),
      rating,
      timestamp: Date.now(),
      page: window.location.pathname,
      id: metric.id
    }
    
    this.metrics.push(data)
    this.reportQueue.push(data)
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      const emoji = rating === 'good' ? '✅' : rating === 'needs-improvement' ? '⚠️' : '❌'
      console.log(
        `${emoji} ${metric.name}: ${Math.round(metric.value)}ms (${rating})`,
        {
          page: data.page,
          threshold: PERFORMANCE_THRESHOLDS[metric.name as keyof typeof PERFORMANCE_THRESHOLDS]
        }
      )
    }
    
    // Alert on poor performance
    if (rating === 'poor') {
      this.alertPoorPerformance(data)
    }
  }
  
  /**
   * Get performance rating based on thresholds
   */
  private getRating(metricName: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const threshold = PERFORMANCE_THRESHOLDS[metricName as keyof typeof PERFORMANCE_THRESHOLDS]
    
    if (!threshold) return 'good'
    
    if (value <= threshold.good) return 'good'
    if (value <= threshold.needsImprovement) return 'needs-improvement'
    return 'poor'
  }
  
  /**
   * Alert when performance is poor
   */
  private alertPoorPerformance(data: PerformanceData) {
    console.warn(`⚠️ Poor ${data.metric} performance detected:`, {
      value: `${data.value}ms`,
      page: data.page,
      threshold: PERFORMANCE_THRESHOLDS[data.metric as keyof typeof PERFORMANCE_THRESHOLDS]
    })
    
    // In production, this would send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoring([data])
    }
  }
  
  /**
   * Start batched reporting to reduce network overhead
   */
  private startBatchReporting() {
    this.reportInterval = setInterval(() => {
      if (this.reportQueue.length > 0) {
        this.sendToMonitoring(this.reportQueue)
        this.reportQueue = []
      }
    }, 10000) // Report every 10 seconds
    
    // Report immediately on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        if (this.reportQueue.length > 0) {
          this.sendToMonitoring(this.reportQueue)
        }
      })
    }
  }
  
  /**
   * Send metrics to monitoring service
   */
  private sendToMonitoring(metrics: PerformanceData[]) {
    // In production, send to your monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to analytics endpoint
      fetch('/api/analytics/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics }),
        keepalive: true // Ensure request completes even if page unloads
      }).catch(console.error)
    }
  }
  
  /**
   * Get performance summary
   */
  getSummary() {
    const summary: Record<string, any> = {}
    
    // Group metrics by name
    const grouped = this.metrics.reduce((acc, metric) => {
      if (!acc[metric.metric]) {
        acc[metric.metric] = []
      }
      acc[metric.metric].push(metric.value)
      return acc
    }, {} as Record<string, number[]>)
    
    // Calculate stats for each metric
    Object.entries(grouped).forEach(([name, values]) => {
      const sorted = values.sort((a, b) => a - b)
      summary[name] = {
        count: values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        p50: sorted[Math.floor(sorted.length * 0.5)],
        p75: sorted[Math.floor(sorted.length * 0.75)],
        p95: sorted[Math.floor(sorted.length * 0.95)],
        p99: sorted[Math.floor(sorted.length * 0.99)]
      }
    })
    
    return summary
  }
  
  /**
   * Clear all metrics
   */
  clear() {
    this.metrics = []
    this.reportQueue = []
  }
  
  /**
   * Destroy monitor and clean up
   */
  destroy() {
    if (this.reportInterval) {
      clearInterval(this.reportInterval)
    }
    this.clear()
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor()

/**
 * Report web vitals - to be called from _app.tsx or layout.tsx
 */
export function reportWebVitals(metric: NextWebVitalsMetric) {
  performanceMonitor.trackMetric(metric)
  
  // Also track specific metrics for profile switching
  if (typeof window !== 'undefined') {
    const isProfileSwitch = window.location.pathname.includes('/profile')
    if (isProfileSwitch && metric.name === 'FCP') {
      // Track profile switching performance specifically
      performanceMonitor.trackMetric({
        ...metric,
        name: 'profile-switch-fcp',
        label: 'custom'
      })
    }
  }
}

/**
 * Custom performance marks for profile switching
 */
export function markProfileSwitchStart() {
  if (typeof window !== 'undefined' && 'performance' in window) {
    performance.mark('profile-switch-start')
  }
}

export function markProfileSwitchEnd() {
  if (typeof window !== 'undefined' && 'performance' in window) {
    performance.mark('profile-switch-end')
    performance.measure('profile-switch', 'profile-switch-start', 'profile-switch-end')
    
    const measure = performance.getEntriesByName('profile-switch')[0]
    if (measure) {
      performanceMonitor.trackMetric({
        name: 'profile-switch-time',
        value: measure.duration,
        id: `ps-${Date.now()}`,
        label: 'custom',
        startTime: measure.startTime
      })
    }
  }
}

/**
 * Get current performance metrics
 */
export function getCurrentMetrics() {
  return performanceMonitor.getSummary()
}