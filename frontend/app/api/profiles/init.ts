// SHARED DATA INITIALIZATION MODULE
// Singleton pattern for optimal memory usage and performance

import { profileDataService } from '@/lib/services/data-store'
import { promises as fs } from 'fs'
import path from 'path'

// Singleton state
let isInitialized = false
let initializationPromise: Promise<void> | null = null

export async function initializeDataStore(): Promise<void> {
  // Return existing initialization if in progress
  if (initializationPromise) {
    return initializationPromise
  }
  
  // Return immediately if already initialized
  if (isInitialized) {
    return Promise.resolve()
  }
  
  // Start new initialization
  initializationPromise = performInitialization()
  
  try {
    await initializationPromise
    isInitialized = true
  } catch (error) {
    // Reset on error to allow retry
    initializationPromise = null
    throw error
  }
  
  return initializationPromise
}

async function performInitialization(): Promise<void> {
  const startTime = performance.now()
  
  console.log('Starting data store initialization...')
  
  try {
    // Test that our CSV parser can access the data
    const customers = await profileDataService.getAllCustomers()
    
    const loadTime = performance.now() - startTime
    
    console.log(`✅ Data store initialized successfully in ${loadTime.toFixed(2)}ms`)
    console.log(`   - Customers loaded: ${customers.length}`)
    
  } catch (error) {
    console.error('❌ Failed to initialize data store:', error)
    throw error
  }
}

// Export a function to check initialization status
export function isDataStoreReady(): boolean {
  return isInitialized
}

// Export a function to reset the data store (useful for testing)
export function resetDataStore(): void {
  isInitialized = false
  initializationPromise = null
}