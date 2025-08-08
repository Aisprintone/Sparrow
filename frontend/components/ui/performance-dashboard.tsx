"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Activity, 
  Zap, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Database,
  Wifi,
  Cpu,
  Memory
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface PerformanceMetrics {
  apiCalls: number
  cacheHits: number
  cacheMisses: number
  averageResponseTime: number
  p99ResponseTime: number
  lastFetchTime: number
  dataFreshness: number
  memoryUsage: number
  cacheHitRate: number
  systemHealth: 'excellent' | 'good' | 'warning' | 'critical'
  activeConnections: number
  errorRate: number
}

interface PerformanceDashboardProps {
  isOpen: boolean
  onClose: () => void
}

export default function PerformanceDashboard({ isOpen, onClose }: PerformanceDashboardProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    apiCalls: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageResponseTime: 0,
    p99ResponseTime: 0,
    lastFetchTime: 0,
    dataFreshness: 0,
    memoryUsage: 0,
    cacheHitRate: 0,
    systemHealth: 'excellent',
    activeConnections: 0,
    errorRate: 0
  })

  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    const fetchMetrics = async () => {
      setIsRefreshing(true)
      try {
        // Simulate fetching performance metrics
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Mock metrics - in real app, these would come from monitoring service
        setMetrics({
          apiCalls: Math.floor(Math.random() * 1000) + 500,
          cacheHits: Math.floor(Math.random() * 800) + 400,
          cacheMisses: Math.floor(Math.random() * 200) + 50,
          averageResponseTime: Math.random() * 50 + 10,
          p99ResponseTime: Math.random() * 100 + 50,
          lastFetchTime: Date.now() - Math.random() * 60000,
          dataFreshness: Math.random() * 300 + 30,
          memoryUsage: Math.random() * 100 + 20,
          cacheHitRate: Math.random() * 20 + 80,
          systemHealth: ['excellent', 'good', 'warning', 'critical'][Math.floor(Math.random() * 4)] as any,
          activeConnections: Math.floor(Math.random() * 50) + 10,
          errorRate: Math.random() * 5
        })
      } catch (error) {
        console.error('Failed to fetch performance metrics:', error)
      } finally {
        setIsRefreshing(false)
      }
    }

    fetchMetrics()
    const interval = setInterval(fetchMetrics, 10000) // Refresh every 10 seconds

    return () => clearInterval(interval)
  }, [isOpen])

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-500'
      case 'good': return 'text-blue-500'
      case 'warning': return 'text-yellow-500'
      case 'critical': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'excellent': return <CheckCircle className="h-4 w-4" />
      case 'good': return <TrendingUp className="h-4 w-4" />
      case 'warning': return <AlertTriangle className="h-4 w-4" />
      case 'critical': return <AlertTriangle className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 rounded-2xl border border-white/10"
      >
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Performance Dashboard</h2>
                <p className="text-sm text-white/60">Real-time system metrics and health monitoring</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* System Health Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-white/5 border-white/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60">System Health</p>
                  <p className={`text-lg font-semibold ${getHealthColor(metrics.systemHealth)}`}>
                    {metrics.systemHealth.charAt(0).toUpperCase() + metrics.systemHealth.slice(1)}
                  </p>
                </div>
                <div className={`${getHealthColor(metrics.systemHealth)}`}>
                  {getHealthIcon(metrics.systemHealth)}
                </div>
              </div>
            </Card>

            <Card className="bg-white/5 border-white/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60">Cache Hit Rate</p>
                  <p className="text-lg font-semibold text-white">
                    {metrics.cacheHitRate.toFixed(1)}%
                  </p>
                </div>
                <div className="text-blue-500">
                  <Database className="h-5 w-5" />
                </div>
              </div>
            </Card>

            <Card className="bg-white/5 border-white/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60">Error Rate</p>
                  <p className="text-lg font-semibold text-white">
                    {metrics.errorRate.toFixed(2)}%
                  </p>
                </div>
                <div className="text-red-500">
                  <AlertTriangle className="h-5 w-5" />
                </div>
              </div>
            </Card>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-white/5 border-white/10 p-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                API Performance
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-white/60">Total Calls</span>
                  <span className="text-white font-medium">{metrics.apiCalls.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Avg Response Time</span>
                  <span className="text-white font-medium">{metrics.averageResponseTime.toFixed(1)}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">P99 Response Time</span>
                  <span className="text-white font-medium">{metrics.p99ResponseTime.toFixed(1)}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Active Connections</span>
                  <span className="text-white font-medium">{metrics.activeConnections}</span>
                </div>
              </div>
            </Card>

            <Card className="bg-white/5 border-white/10 p-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-500" />
                Cache Performance
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-white/60">Cache Hits</span>
                  <span className="text-white font-medium">{metrics.cacheHits.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Cache Misses</span>
                  <span className="text-white font-medium">{metrics.cacheMisses.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Data Freshness</span>
                  <span className="text-white font-medium">{Math.floor(metrics.dataFreshness / 60)}m ago</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Memory Usage</span>
                  <span className="text-white font-medium">{metrics.memoryUsage.toFixed(1)}%</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Performance Indicators */}
          <Card className="bg-white/5 border-white/10 p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Performance Indicators</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">
                  {metrics.averageResponseTime < 50 ? '✓' : '⚠'}
                </div>
                <p className="text-sm text-white/60">Response Time</p>
                <p className="text-xs text-white/40">
                  {metrics.averageResponseTime < 50 ? 'Optimal' : 'Needs attention'}
                </p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">
                  {metrics.cacheHitRate > 80 ? '✓' : '⚠'}
                </div>
                <p className="text-sm text-white/60">Cache Efficiency</p>
                <p className="text-xs text-white/40">
                  {metrics.cacheHitRate > 80 ? 'Excellent' : 'Could improve'}
                </p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-500">
                  {metrics.errorRate < 1 ? '✓' : '⚠'}
                </div>
                <p className="text-sm text-white/60">Error Rate</p>
                <p className="text-xs text-white/40">
                  {metrics.errorRate < 1 ? 'Low' : 'High'}
                </p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-500">
                  {metrics.memoryUsage < 80 ? '✓' : '⚠'}
                </div>
                <p className="text-sm text-white/60">Memory Usage</p>
                <p className="text-xs text-white/40">
                  {metrics.memoryUsage < 80 ? 'Good' : 'High'}
                </p>
              </div>
            </div>
          </Card>

          {/* Refresh Button */}
          <div className="flex justify-center">
            <button
              onClick={() => {
                setIsRefreshing(true)
                setTimeout(() => setIsRefreshing(false), 1000)
              }}
              disabled={isRefreshing}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50"
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh Metrics'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}