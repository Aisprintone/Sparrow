/**
 * Client-only utility to prevent hydration mismatches in local development
 */

import { useEffect, useState } from 'react'

/**
 * Hook to detect if component has mounted on client side
 * Prevents hydration mismatches by returning false on server
 */
export function useIsMounted() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  return isMounted
}

/**
 * Component wrapper that only renders children on client side
 * Useful for preventing hydration issues with dynamic content
 */
export function ClientOnly({ 
  children, 
  fallback = null 
}: { 
  children: React.ReactNode
  fallback?: React.ReactNode 
}) {
  const isMounted = useIsMounted()
  
  if (!isMounted) {
    return <>{fallback}</>
  }

  return <>{children}</>
}