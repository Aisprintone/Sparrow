"use client"

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
  retryCount: number
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, retryCount: 0 }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, retryCount: 0 }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // Call the onError callback if provided
    this.props.onError?.(error, errorInfo)
    
    // Log to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // In production, you would send this to your error tracking service
      // Example: Sentry.captureException(error, { extra: errorInfo })
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: prevState.retryCount + 1
    }))
  }

  handleGoHome = () => {
    // Reset to home screen
    window.location.href = '/'
  }

  handleGoBack = () => {
    window.history.back()
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="min-h-[100dvh] bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4"
        >
          <div className="max-w-md w-full">
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 text-center"
            >
              {/* Error Icon */}
              <motion.div
                initial={{ rotate: -10 }}
                animate={{ rotate: 0 }}
                className="flex justify-center mb-6"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 border border-red-500/30">
                  <AlertTriangle className="h-8 w-8 text-red-400" />
                </div>
              </motion.div>

              {/* Error Message */}
              <h1 className="text-2xl font-bold text-white mb-2">
                Oops! Something went wrong
              </h1>
              <p className="text-white/60 mb-6">
                We encountered an unexpected error. Don't worry, your data is safe.
              </p>

              {/* Error Details (Development Only) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mb-6 text-left">
                  <summary className="text-white/80 cursor-pointer mb-2">
                    Error Details (Development)
                  </summary>
                  <div className="bg-black/20 rounded-lg p-4 text-xs text-white/60 font-mono overflow-auto">
                    <div className="mb-2">
                      <strong>Error:</strong> {this.state.error.message}
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <strong>Stack:</strong>
                        <pre className="mt-1 text-xs overflow-auto">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={this.handleRetry}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                  disabled={this.state.retryCount >= 3}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {this.state.retryCount >= 3 ? 'Too many retries' : 'Try Again'}
                </Button>

                <div className="flex gap-2">
                  <Button
                    onClick={this.handleGoBack}
                    variant="outline"
                    className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Go Back
                  </Button>
                  <Button
                    onClick={this.handleGoHome}
                    variant="outline"
                    className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Home
                  </Button>
                </div>
              </div>

              {/* Retry Count */}
              {this.state.retryCount > 0 && (
                <p className="text-xs text-white/40 mt-4">
                  Retry attempt {this.state.retryCount} of 3
                </p>
              )}
            </motion.div>
          </div>
        </motion.div>
      )
    }

    return this.props.children
  }
}

// Hook for functional components
export function useErrorHandler() {
  const handleError = (error: Error, context?: string) => {
    console.error(`Error in ${context || 'component'}:`, error)
    
    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { tags: { context } })
    }
  }

  return { handleError }
}

// Higher-order component for error handling
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
} 