"use client"

import { useEffect, useState } from "react"
import type { AppState } from "@/hooks/use-app-state"
import { TrendingUp, TrendingDown, Calendar, BarChart3, ArrowLeft, ArrowRight, Clock, DollarSign } from "lucide-react"
import GlassCard from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"

interface MarketQuote {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume?: number
  high?: number
  low?: number
  open?: number
}

interface MarketData {
  today: MarketQuote[]
  yesterday: MarketQuote[]
  week: MarketQuote[]
  loading: boolean
  error?: string
}

const MAJOR_INDEXES = [
  { symbol: "^GSPC", name: "S&P 500" },
  { symbol: "^DJI", name: "Dow Jones" },
  { symbol: "^IXIC", name: "NASDAQ" },
  { symbol: "^RUT", name: "Russell 2000" },
  { symbol: "^VIX", name: "VIX" }
]

export default function MarketDataScreen({ setCurrentScreen }: AppState) {
  const [marketData, setMarketData] = useState<MarketData>({
    today: [],
    yesterday: [],
    week: [],
    loading: true
  })
  const [currentView, setCurrentView] = useState<'today' | 'yesterday' | 'week'>('today')

  useEffect(() => {
    loadMarketData()
  }, [])

  const loadMarketData = async () => {
    try {
      setMarketData(prev => ({ ...prev, loading: true, error: undefined }))
      
      // Fetch real-time quotes
      const quotesResponse = await fetch('/api/market-data/quotes')
      const quotesData = await quotesResponse.json()
      
      // Fetch historical data
      const historicalResponse = await fetch('/api/market-data/historical')
      const historicalData = await historicalResponse.json()
      
      if (quotesData.success && historicalData.success) {
        setMarketData({
          today: quotesData.data,
          yesterday: historicalData.data.yesterday,
          week: historicalData.data.week,
          loading: false
        })
      } else {
        throw new Error('Failed to fetch market data')
      }
    } catch (error) {
      console.error('Error loading market data:', error)
      setMarketData(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'Unable to load market data'
      }))
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value)
  }

  const getViewTitle = () => {
    switch (currentView) {
      case 'today': return 'Today\'s Market'
      case 'yesterday': return 'Yesterday\'s Performance'
      case 'week': return 'Weekly Overview'
      default: return 'Market Data'
    }
  }

  const getViewData = () => {
    return marketData[currentView] || []
  }

  const nextView = () => {
    const views: ('today' | 'yesterday' | 'week')[] = ['today', 'yesterday', 'week']
    const currentIndex = views.indexOf(currentView)
    const nextIndex = (currentIndex + 1) % views.length
    setCurrentView(views[nextIndex])
  }

  const prevView = () => {
    const views: ('today' | 'yesterday' | 'week')[] = ['today', 'yesterday', 'week']
    const currentIndex = views.indexOf(currentView)
    const prevIndex = (currentIndex - 1 + views.length) % views.length
    setCurrentView(views[prevIndex])
  }

  return (
    <div className="flex h-[100dvh] flex-col">
      <header className="p-3 text-white">
        <h1 className="text-xl font-bold">Market Overview</h1>
        <p className="text-white/80">Real-time market insights</p>
      </header>

      <div className="flex-1 overflow-y-auto p-3 space-y-5 pb-20">
        {/* View Toggle */}
        <div className="flex items-center justify-center gap-3 mt-2">
          <button
            onClick={() => setCurrentView("today")}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentView === "today"
                ? "bg-blue-500 text-white"
                : "bg-white/10 text-white/60 hover:text-white"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setCurrentView("yesterday")}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentView === "yesterday"
                ? "bg-blue-500 text-white"
                : "bg-white/10 text-white/60 hover:text-white"
            }`}
          >
            Detailed
          </button>
        </div>

        {/* Market Summary */}
        <div>
          <h2 className="text-base font-semibold text-white">{getViewTitle()}</h2>
          <GlassCard className="p-5 text-center">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-white/60">Market Sentiment</p>
                <p className="text-lg font-semibold text-green-400">
                  Bullish
                </p>
              </div>
              <div>
                <p className="text-sm text-white/60">Volatility</p>
                <p className="text-lg font-semibold text-yellow-400">
                  Moderate
                </p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Market Performance */}
        <div>
          <GlassCard className="p-5 bg-gradient-to-br from-blue-500/20 to-purple-500/20">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="h-4 w-4 text-blue-400" />
              <h3 className="text-base font-semibold text-white">Market Performance</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-3">
                <p className="text-sm text-white/60">S&P 500</p>
                <p className="text-lg font-semibold text-green-400">
                  +1.2%
                </p>
              </div>
              <div className="bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-xl p-3">
                <p className="text-sm text-white/60">NASDAQ</p>
                <p className="text-lg font-semibold text-red-400">
                  -0.8%
                </p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Stock Quotes */}
        <div>
          <h3 className="text-base font-semibold text-white mb-2">Top Movers</h3>
          <div className="space-y-2">
            {getViewData().map((quote) => (
              <GlassCard key={quote.symbol} className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{quote.name}</p>
                    <p className="text-xs text-white/60">{quote.symbol}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">${quote.price}</p>
                    <p className={`text-xs ${
                      quote.change >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {quote.change >= 0 ? '+' : ''}{quote.change}%
                    </p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* Market Insights */}
        <div>
          <h3 className="text-base font-semibold text-white mb-2">Market Insights</h3>
          <GlassCard className="p-3">
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-white">Tech stocks showing resilience</p>
                  <p className="text-xs text-white/60">Despite market volatility, tech sector maintains strong fundamentals</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-white">Energy sector gains</p>
                  <p className="text-xs text-white/60">Oil prices stabilize, benefiting energy companies</p>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
