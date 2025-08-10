// Centralized error handling service following SOLID principles
// Single Responsibility: Error handling and retry logic
// Open/Closed: Extensible for new error types
// Interface Segregation: Specific interfaces for different error types

export interface ApiError {
  message: string
  status?: number
  code?: string
  retryable: boolean
}

export interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  backoffMultiplier: number
}

export class ApiErrorHandler {
  private static instance: ApiErrorHandler
  private readonly defaultRetryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2
  }

  private constructor() {
    // Enhanced logging for local development
    if (process.env.NODE_ENV === 'development') {
      console.log('[API ERROR HANDLER] 🔧 Enhanced error logging enabled for local development')
    }
  }

  public static getInstance(): ApiErrorHandler {
    if (!ApiErrorHandler.instance) {
      ApiErrorHandler.instance = new ApiErrorHandler()
    }
    return ApiErrorHandler.instance
  }

  // Classify error types for appropriate handling
  public classifyError(error: any): ApiError {
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      return {
        message: 'Network connection failed',
        code: 'NETWORK_ERROR',
        retryable: true
      }
    }

    if (error.message?.includes('ERR_TOO_MANY_REDIRECTS')) {
      return {
        message: 'Too many redirects detected',
        code: 'REDIRECT_LOOP',
        retryable: false // Don't retry redirect loops
      }
    }

    if (error.status >= 500) {
      return {
        message: 'Server error occurred',
        status: error.status,
        code: 'SERVER_ERROR',
        retryable: true
      }
    }

    if (error.status === 404) {
      return {
        message: 'Resource not found',
        status: error.status,
        code: 'NOT_FOUND',
        retryable: false
      }
    }

    return {
      message: error.message || 'Unknown error occurred',
      code: 'UNKNOWN_ERROR',
      retryable: false
    }
  }

  // Calculate exponential backoff delay
  public calculateBackoffDelay(attempt: number, config: Partial<RetryConfig> = {}): number {
    const { baseDelay, maxDelay, backoffMultiplier } = { ...this.defaultRetryConfig, ...config }
    const delay = baseDelay * Math.pow(backoffMultiplier, attempt - 1)
    return Math.min(delay, maxDelay)
  }

  // Enhanced retry logic with proper error classification
  public async withRetry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    const retryConfig = { ...this.defaultRetryConfig, ...config }
    let lastError: ApiError | null = null

    for (let attempt = 1; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        const classifiedError = this.classifyError(error)
        lastError = classifiedError

        // Only log errors in production - suppress all retry spam in development
        if (process.env.NODE_ENV === 'production') {
          console.error(`[ERROR HANDLER] Attempt ${attempt}/${retryConfig.maxRetries} failed:`, {
            error: classifiedError.message,
            code: classifiedError.code,
            retryable: classifiedError.retryable
          })
        } else if (attempt === retryConfig.maxRetries) {
          // Only log final failure in development
          console.warn(`[ERROR HANDLER] All ${retryConfig.maxRetries} attempts failed for API call`)
        }

        // Don't retry if error is not retryable
        if (!classifiedError.retryable) {
          throw new Error(classifiedError.message)
        }

        // Don't retry on last attempt
        if (attempt >= retryConfig.maxRetries) {
          throw new Error(`All ${retryConfig.maxRetries} attempts failed. Last error: ${classifiedError.message}`)
        }

        const delay = this.calculateBackoffDelay(attempt, retryConfig)
        // Suppress retry logs in development
        if (process.env.NODE_ENV === 'production') {
          console.log(`[ERROR HANDLER] Retrying in ${delay}ms...`)
        }
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw new Error(`Unexpected retry failure: ${lastError?.message}`)
  }

  // Handle specific error types
  public handleRedirectLoop(): void {
    console.error('[ERROR HANDLER] Redirect loop detected - clearing cache and reloading')
    // Clear any cached data that might be causing redirects
    if (typeof window !== 'undefined') {
      localStorage.removeItem('profile-cache')
      sessionStorage.clear()
    }
  }

  public handleNetworkError(): void {
    console.error('[ERROR HANDLER] Network error detected - check connectivity')
  }

  public handleServerError(status: number): void {
    console.error(`[ERROR HANDLER] Server error ${status} - service may be temporarily unavailable`)
  }
}

// Export singleton instance
export const apiErrorHandler = ApiErrorHandler.getInstance()
