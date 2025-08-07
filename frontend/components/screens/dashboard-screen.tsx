"use client"

import { useEffect, useState } from "react"
import type { AppState } from "@/hooks/use-app-state"
import { TrendingUp, TrendingDown, DollarSign, Shield, Target, Zap, BarChart3, CreditCard, PiggyBank } from "lucide-react"
import GlassCard from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface MarketData {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
}

export default function DashboardScreen({ setCurrentScreen }: AppState) {
  const [marketData, setMarketData] = useState<MarketData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch live market data from API
    const loadMarketData = async () => {
      console.log('[MARKET DATA] Starting to load market data...')
      try {
        const response = await fetch('/api/market-data', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(5000) // 5 second timeout
        })
        
        console.log('[MARKET DATA] Response status:', response.status)
        
        if (response.ok) {
          const result = await response.json()
          console.log('[MARKET DATA] API response:', result)
          
          if (result.success && result.data && result.data.length > 0) {
            setMarketData(result.data)
            console.log(`[MARKET DATA] Loaded ${result.data.length} symbols from ${result.meta.dataSource}`)
          } else {
            console.error('[MARKET DATA] API returned empty or invalid data:', result)
            throw new Error('API returned empty data')
          }
        } else {
          console.error('[MARKET DATA] API error status:', response.status)
          throw new Error(`API error: ${response.status}`)
        }
        
        setLoading(false)
      } catch (error) {
        console.error("[MARKET DATA] Error loading market data:", error)
        
        // Fallback to mock data if API fails
        const fallbackData: MarketData[] = [
          {
            symbol: "^GSPC",
            name: "S&P 500",
            price: 4500.25,
            change: 12.50,
            changePercent: 0.28
          },
          {
            symbol: "^IXIC",
            name: "NASDAQ",
            price: 14025.50,
            change: 85.75,
            changePercent: 0.61
          },
          {
            symbol: "^RUT",
            name: "Russell 2000",
            price: 1850.75,
            change: -8.25,
            changePercent: -0.44
          }
        ]
        
        console.log('[MARKET DATA] Using fallback data')
        setMarketData(fallbackData)
        setLoading(false)
      }
    }

    loadMarketData()
  }, [])

  // Monitor market data state changes
  useEffect(() => {
    console.log('[MARKET DATA] State changed - loading:', loading, 'data length:', marketData.length)
  }, [loading, marketData])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  return (
    <div className="flex h-[100dvh] flex-col">
      <header className="p-4 text-white">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-white/80">Your financial overview</p>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Net Worth - Primary Focus */}
        <div>
          <GlassCard 
            className="p-6 cursor-pointer hover:scale-[1.02] transition-all duration-200 bg-gradient-to-br from-blue-500/20 to-purple-500/20"
            onClick={() => setCurrentScreen("net-worth-detail")}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-3xl font-bold text-white">$125,450</h2>
                <p className="text-white/60">Net Worth</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 text-green-400">
                  <TrendingUp className="h-5 w-5" />
                  <div>
                    <p className="font-semibold">+$2,340</p>
                    <p className="text-sm text-white/60">+1.9% this month</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
              <div className="text-center">
                <p className="text-sm text-white/60">Assets</p>
                <p className="text-lg font-semibold text-white">$145,200</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-white/60">Liabilities</p>
                <p className="text-lg font-semibold text-white">$19,750</p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Financial Health - Simplified and Useful */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">Financial Health</h2>
          <div className="grid grid-cols-2 gap-3">
            {/* Emergency Fund */}
            <GlassCard className="p-4 bg-gradient-to-br from-green-500/20 to-emerald-500/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Shield className="h-5 w-5 text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white/60">Emergency Fund</p>
                  <p className="text-lg font-semibold text-white">$8,500</p>
                  <p className="text-xs text-green-400">2.8 months coverage</p>
                </div>
              </div>
            </GlassCard>

            {/* Debt-to-Income */}
            <GlassCard className="p-4 bg-gradient-to-br from-yellow-500/20 to-orange-500/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <CreditCard className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white/60">Debt-to-Income</p>
                  <p className="text-lg font-semibold text-white">18%</p>
                  <p className="text-xs text-green-400">Excellent</p>
                </div>
              </div>
            </GlassCard>

            {/* Savings Rate */}
            <GlassCard className="p-4 bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <PiggyBank className="h-5 w-5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white/60">Savings Rate</p>
                  <p className="text-lg font-semibold text-white">25%</p>
                  <p className="text-xs text-green-400">Above average</p>
                </div>
              </div>
            </GlassCard>

            {/* Investment Growth */}
            <GlassCard className="p-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white/60">Investment Growth</p>
                  <p className="text-lg font-semibold text-white">12.4%</p>
                  <p className="text-xs text-green-400">YTD return</p>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Market Overview - Simplified */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">Market Overview</h2>
          <GlassCard 
            className="p-4 cursor-pointer hover:scale-[1.02] transition-all duration-200"
            onClick={() => setCurrentScreen("market-data")}
          >
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400 mx-auto mb-2"></div>
                <div className="text-white/60 text-sm">Loading market data...</div>
              </div>
            ) : marketData.length > 0 ? (
              <div className="space-y-3">
                {marketData.map((market) => (
                  <div key={market.symbol} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">{market.name}</p>
                      <p className="text-xs text-white/60">{market.symbol}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-white">{formatCurrency(market.price)}</p>
                      <div className="flex items-center gap-1">
                        {market.change >= 0 ? (
                          <TrendingUp className="h-3 w-3 text-green-400" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-400" />
                        )}
                        <span className={`text-xs ${
                          market.change >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {formatPercent(market.changePercent)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="text-white/60 text-sm">No market data available</div>
              </div>
            )}
            <div className="mt-3 pt-3 border-t border-white/10">
              <p className="text-xs text-white/60 text-center">Tap for detailed market analysis</p>
            </div>
          </GlassCard>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Button 
              onClick={() => setCurrentScreen("ai-actions")}
              className="h-16 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              <div className="text-center">
                <Zap className="h-6 w-6 mx-auto mb-1" />
                <span className="text-sm">AI Actions</span>
              </div>
            </Button>
            
            <Button 
              onClick={() => setCurrentScreen("goals")}
              className="h-16 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              <div className="text-center">
                <Target className="h-6 w-6 mx-auto mb-1" />
                <span className="text-sm">Goals</span>
              </div>
            </Button>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">Recent Activity</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <div>
                  <p className="text-white text-sm">Salary deposited</p>
                  <p className="text-white/60 text-xs">2 hours ago</p>
                </div>
              </div>
              <span className="text-green-400 text-sm">+$4,500</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <div>
                  <p className="text-white text-sm">Investment contribution</p>
                  <p className="text-white/60 text-xs">1 day ago</p>
                </div>
              </div>
              <span className="text-blue-400 text-sm">+$500</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                <div>
                  <p className="text-white text-sm">Student loan payment</p>
                  <p className="text-white/60 text-xs">3 days ago</p>
                </div>
              </div>
              <span className="text-red-400 text-sm">-$350</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}