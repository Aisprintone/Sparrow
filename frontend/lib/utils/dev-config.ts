/**
 * Development configuration to suppress common local dev warnings
 */

// Suppress common console warnings in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Store original console methods
  const originalWarn = console.warn
  const originalError = console.error

  // Filter out common development warnings
  console.warn = (...args) => {
    const message = args.join(' ')
    
    // Skip hydration warnings
    if (message.includes('useLayoutEffect does nothing on the server')) return
    if (message.includes('Text content did not match')) return
    if (message.includes('Hydration failed')) return
    if (message.includes('There was an error while hydrating')) return
    
    // Skip framer-motion warnings
    if (message.includes('framer-motion')) return
    
    // Skip React warnings that are safe in development
    if (message.includes('validateDOMNesting')) return
    if (message.includes('React does not recognize')) return
    
    originalWarn(...args)
  }

  console.error = (...args) => {
    const message = args.join(' ')
    
    // Skip non-critical errors in development
    if (message.includes('Hydration failed')) return
    if (message.includes('There was an error while hydrating')) return
    if (message.includes('Text content did not match')) return
    
    // Skip API retry errors during development
    if (message.includes('[ERROR HANDLER] Attempt')) return
    if (message.includes('Network connection failed') && message.includes('attempts failed')) return
    
    originalError(...args)
  }
}

export const isDevelopment = process.env.NODE_ENV === 'development'
export const isClient = typeof window !== 'undefined'