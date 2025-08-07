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
    <div className="flex h-full flex-col">
      <header className="p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Market Overview</h1>
            <p className="text-white/80">Real-time market data & analysis</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentScreen("dashboard")}
            className="text-white/60 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Navigation Controls */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={prevView}
            className="text-white/60 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <div className="text-center">
            <h2 className="text-lg font-semibold text-white">{getViewTitle()}</h2>
            <div className="flex items-center justify-center gap-4 mt-2">
              {(['today', 'yesterday', 'week'] as const).map((view) => (
                <button
                  key={view}
                  onClick={() => setCurrentView(view)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    currentView === view
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/10 text-white/60 hover:text-white'
                  }`}
                >
                  {view.charAt(0).toUpperCase() + view.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={nextView}
            className="text-white/60 hover:text-white"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Market Data Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {marketData.loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
                <p className="text-white/60">Loading market data...</p>
              </div>
            ) : marketData.error ? (
              <GlassCard className="p-6 text-center">
                <p className="text-red-400 mb-4">{marketData.error}</p>
                <Button onClick={loadMarketData} variant="outline">
                  Retry
                </Button>
              </GlassCard>
            ) : (
              <>
                {/* Market Summary */}
                <GlassCard className="p-6 bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                  <div className="flex items-center gap-3 mb-4">
                    <BarChart3 className="h-6 w-6 text-blue-400" />
                    <div>
                      <h3 className="text-lg font-semibold text-white">Market Summary</h3>
                      <p className="text-white/60 text-sm">
                        {currentView === 'today' && 'Real-time market performance'}
                        {currentView === 'yesterday' && 'Previous trading session'}
                        {currentView === 'week' && '5-day performance overview'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-white/60">Advancing</p>
                      <p className="text-lg font-semibold text-green-400">
                        {getViewData().filter(q => q.change > 0).length}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-white/60">Declining</p>
                      <p className="text-lg font-semibold text-red-400">
                        {getViewData().filter(q => q.change < 0).length}
                      </p>
                    </div>
                  </div>
                </GlassCard>

                {/* Market Indexes */}
                <div className="space-y-3">
                  {getViewData().map((quote) => (
                    <GlassCard key={quote.symbol} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-white">{quote.name}</h4>
                            <span className="text-xs text-white/60">{quote.symbol}</span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm">
                            <div>
                              <p className="text-white/60">Price</p>
                              <p className="font-semibold text-white">{formatCurrency(quote.price)}</p>
                            </div>
                            
                            {quote.open && (
                              <div>
                                <p className="text-white/60">Open</p>
                                <p className="font-semibold text-white">{formatCurrency(quote.open)}</p>
                              </div>
                            )}
                            
                            {quote.high && quote.low && (
                              <div>
                                <p className="text-white/60">Range</p>
                                <p className="font-semibold text-white">
                                  {formatCurrency(quote.low)} - {formatCurrency(quote.high)}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className={`flex items-center gap-1 mb-1 ${
                            quote.change >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {quote.change >= 0 ? (
                              <TrendingUp className="h-4 w-4" />
                            ) : (
                              <TrendingDown className="h-4 w-4" />
                            )}
                            <span className="font-semibold">{formatCurrency(Math.abs(quote.change))}</span>
                          </div>
                          <p className={`text-sm ${
                            quote.change >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {formatPercent(quote.changePercent)}
                          </p>
                        </div>
                      </div>
                    </GlassCard>
                  ))}
                </div>

                {/* Market Insights */}
                <GlassCard className="p-6 bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                  <div className="flex items-center gap-3 mb-4">
                    <Clock className="h-5 w-5 text-green-400" />
                    <h3 className="text-lg font-semibold text-white">Market Insights</h3>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    {currentView === 'today' && (
                      <>
                        <p className="text-white/80">
                          Markets are {getViewData().filter(q => q.change > 0).length > getViewData().filter(q => q.change < 0).length ? 'advancing' : 'declining'} today.
                        </p>
                        <p className="text-white/60">
                          {getViewData().length > 0 && 
                            `The ${getViewData().reduce((max, q) => Math.abs(q.changePercent) > Math.abs(max.changePercent) ? q : max).name} is showing the most movement.`
                          }
                        </p>
                      </>
                    )}
                    
                    {currentView === 'yesterday' && (
                      <>
                        <p className="text-white/80">
                          Yesterday's session saw mixed performance across major indexes.
                        </p>
                        <p className="text-white/60">
                          {getViewData().length > 0 && 
                            `The ${getViewData().reduce((max, q) => Math.abs(q.changePercent) > Math.abs(max.changePercent) ? q : max).name} had the largest move.`
                          }
                        </p>
                      </>
                    )}
                    
                    {currentView === 'week' && (
                      <>
                        <p className="text-white/80">
                          Weekly performance shows the broader market trends.
                        </p>
                        <p className="text-white/60">
                          {getViewData().length > 0 && 
                            `The ${getViewData().reduce((max, q) => Math.abs(q.changePercent) > Math.abs(max.changePercent) ? q : max).name} led weekly gains.`
                          }
                        </p>
                      </>
                    )}
                  </div>
                </GlassCard>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
