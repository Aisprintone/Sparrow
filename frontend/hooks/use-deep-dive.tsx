"use client"

import { useState, useCallback } from 'react'
import { deepDiveService, type DeepDiveData } from '@/lib/services/deep-dive-service'

export interface UseDeepDiveReturn {
  deepDiveAction: DeepDiveData | null
  isDeepDiveOpen: boolean
  openDeepDive: (data: DeepDiveData) => void
  closeDeepDive: () => void
  createAndOpenSimulationDeepDive: (
    simulationId: string,
    actionId: string,
    title: string,
    description: string,
    potentialSaving: number,
    simulationTag?: string
  ) => void
  createAndOpenDashboardDeepDive: (
    actionId: string,
    title: string,
    description: string,
    potentialSaving: number
  ) => void
  getAllDeepDives: () => DeepDiveData[]
  getDeepDivesBySource: (source: DeepDiveData['source']) => DeepDiveData[]
}

export function useDeepDive(): UseDeepDiveReturn {
  const [deepDiveAction, setDeepDiveAction] = useState<DeepDiveData | null>(null)
  const [isDeepDiveOpen, setIsDeepDiveOpen] = useState(false)

  const openDeepDive = useCallback((data: DeepDiveData) => {
    setDeepDiveAction(data)
    setIsDeepDiveOpen(true)
  }, [])

  const closeDeepDive = useCallback(() => {
    setIsDeepDiveOpen(false)
    // Don't clear the action immediately to avoid flash during modal close animation
    setTimeout(() => setDeepDiveAction(null), 300)
  }, [])

  const createAndOpenSimulationDeepDive = useCallback((
    simulationId: string,
    actionId: string,
    title: string,
    description: string,
    potentialSaving: number,
    simulationTag?: string
  ) => {
    const deepDive = deepDiveService.createSimulationDeepDive(
      simulationId,
      actionId,
      title,
      description,
      potentialSaving,
      simulationTag
    )
    openDeepDive(deepDive)
  }, [openDeepDive])

  const createAndOpenDashboardDeepDive = useCallback((
    actionId: string,
    title: string,
    description: string,
    potentialSaving: number
  ) => {
    const deepDive = deepDiveService.createDashboardDeepDive(
      actionId,
      title,
      description,
      potentialSaving
    )
    openDeepDive(deepDive)
  }, [openDeepDive])

  const getAllDeepDives = useCallback(() => {
    return deepDiveService.getAllDeepDives()
  }, [])

  const getDeepDivesBySource = useCallback((source: DeepDiveData['source']) => {
    return deepDiveService.getDeepDivesBySource(source)
  }, [])

  return {
    deepDiveAction,
    isDeepDiveOpen,
    openDeepDive,
    closeDeepDive,
    createAndOpenSimulationDeepDive,
    createAndOpenDashboardDeepDive,
    getAllDeepDives,
    getDeepDivesBySource
  }
}