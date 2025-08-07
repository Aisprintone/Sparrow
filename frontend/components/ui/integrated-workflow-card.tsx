/**
 * Integrated Workflow Card Component
 * ====================================
 * Complete integration of classification, visual differentiation,
 * and goal creation with real-time backend synchronization.
 * 
 * INTEGRATION MAESTRO: The Symphony of Perfect Integration
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { 
  Zap, Shield, TrendingUp, AlertTriangle, Activity, BarChart3,
  Target, Clock, DollarSign, Check, X, Loader2, Sparkles,
  ChevronRight, Play, Pause, CheckCircle2, AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { Card } from './card'
import { Badge } from './badge'
import { Progress } from './progress'
import { toast } from 'sonner'
import { 
  useRealtimeClassification,
  useCreateGoalFromAction,
  useExecuteWorkflow,
  useWorkflowStatus,
  useConnectionStatus,
  usePerformanceMetrics
} from '@/lib/api/integration-hooks'
import { 
  WorkflowCategory,
  Priority,
  type WorkflowClassification,
  type WorkflowContext
} from '@/lib/api/integration'
import { 
  getWorkflowTheme,
  getHybridTheme,
  applyAccessibilityOverrides,
  type WorkflowTheme
} from '@/lib/design-system/workflow-visual-system'
import type { AIAction } from '@/hooks/use-app-state'

// ==================== Types ====================

interface IntegratedWorkflowCardProps {
  action: AIAction
  userId: string
  demographic: string
  onGoalCreated?: (goal: any) => void
  onWorkflowCompleted?: (result: any) => void
  className?: string
}

interface WorkflowState {
  classification: WorkflowClassification | null
  isClassifying: boolean
  executionId: string | null
  executionStatus: 'idle' | 'running' | 'completed' | 'failed'
  goalId: string | null
  theme: WorkflowTheme
  performanceScore: number
}

// ==================== Main Component ====================

export function IntegratedWorkflowCard({
  action,
  userId,
  demographic,
  onGoalCreated,
  onWorkflowCompleted,
  className
}: IntegratedWorkflowCardProps) {
  const reducedMotion = useReducedMotion()
  const { isOnline, apiStatus } = useConnectionStatus()
  const performanceMetrics = usePerformanceMetrics()
  
  // State management
  const [state, setState] = useState<WorkflowState>({
    classification: null,
    isClassifying: false,
    executionId: null,
    executionStatus: 'idle',
    goalId: null,
    theme: getWorkflowTheme(WorkflowCategory.ANALYZE),
    performanceScore: 100
  })

  // Context for classification
  const context: WorkflowContext = useMemo(() => ({
    userId,
    demographic,
    riskTolerance: 'medium',
    incomeLevel: 50000,
    hasEmergencyFund: false,
    debtLevel: 'moderate'
  }), [userId, demographic])

  // Real-time classification
  const {
    data: classification,
    localClassification,
    isDebouncing,
    isLoading: isClassifying
  } = useRealtimeClassification(action.title, context, 300)

  // Goal creation
  const createGoalMutation = useCreateGoalFromAction()
  
  // Workflow execution
  const executeWorkflowMutation = useExecuteWorkflow()
  
  // Workflow status polling
  const { data: executionStatus } = useWorkflowStatus(
    state.executionId || '',
    !!state.executionId
  )

  // Update state when classification changes
  useEffect(() => {
    const activeClassification = classification || localClassification
    if (activeClassification) {
      const theme = applyAccessibilityOverrides(
        getWorkflowTheme(activeClassification.category),
        reducedMotion || false
      )
      
      setState(prev => ({
        ...prev,
        classification: activeClassification,
        isClassifying: false,
        theme
      }))
    }
  }, [classification, localClassification, reducedMotion])

  // Update execution status
  useEffect(() => {
    if (executionStatus) {
      const status = executionStatus.status === 'completed' ? 'completed' :
                     executionStatus.status === 'failed' ? 'failed' :
                     executionStatus.status === 'running' ? 'running' : 'idle'
      
      setState(prev => ({
        ...prev,
        executionStatus: status
      }))

      if (status === 'completed' && onWorkflowCompleted) {
        onWorkflowCompleted(executionStatus)
      }
    }
  }, [executionStatus, onWorkflowCompleted])

  // Calculate performance score
  useEffect(() => {
    const metrics = performanceMetrics.operations.classification
    if (metrics && metrics.average) {
      // Score based on average latency (100ms = 100, 1000ms = 0)
      const score = Math.max(0, Math.min(100, 100 - (metrics.average - 100) / 9))
      setState(prev => ({ ...prev, performanceScore: Math.round(score) }))
    }
  }, [performanceMetrics])

  // ==================== Actions ====================

  const handleCreateGoal = useCallback(async () => {
    if (!state.classification) return

    try {
      const result = await createGoalMutation.mutateAsync({
        action: {
          ...action,
          category: state.classification.category,
          priority: state.classification.priority
        },
        userId
      })

      setState(prev => ({ ...prev, goalId: result.goal.id }))
      
      if (onGoalCreated) {
        onGoalCreated(result.goal)
      }
    } catch (error) {
      console.error('Failed to create goal:', error)
    }
  }, [action, state.classification, userId, createGoalMutation, onGoalCreated])

  const handleExecuteWorkflow = useCallback(async () => {
    if (!action.id) return

    try {
      const result = await executeWorkflowMutation.mutateAsync({
        workflowId: action.id,
        inputs: {
          userId,
          actionId: action.id,
          context
        }
      })

      setState(prev => ({
        ...prev,
        executionId: result.execution_id,
        executionStatus: 'running'
      }))
    } catch (error) {
      console.error('Failed to execute workflow:', error)
    }
  }, [action, userId, context, executeWorkflowMutation])

  // ==================== Render Helpers ====================

  const getStatusIcon = () => {
    if (!isOnline) return <AlertCircle className="w-4 h-4 text-red-500" />
    if (apiStatus === 'offline') return <X className="w-4 h-4 text-red-500" />
    if (apiStatus === 'degraded') return <AlertTriangle className="w-4 h-4 text-yellow-500" />
    return <CheckCircle2 className="w-4 h-4 text-green-500" />
  }

  const getExecutionIcon = () => {
    switch (state.executionStatus) {
      case 'running':
        return <Loader2 className="w-5 h-5 animate-spin" />
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case 'failed':
        return <X className="w-5 h-5 text-red-500" />
      default:
        return <Play className="w-5 h-5" />
    }
  }

  const theme = state.theme
  const isHybrid = action.automationCapability === 'hybrid'
  const finalTheme = isHybrid ? getHybridTheme() : theme

  return (
    <motion.div
      initial={finalTheme.animation.entrance.from}
      animate={finalTheme.animation.entrance.to}
      transition={{
        duration: finalTheme.animation.duration / 1000,
        ease: finalTheme.animation.easing,
        delay: finalTheme.animation.delay / 1000
      }}
      className={cn('relative', className)}
    >
      <Card 
        className={cn(
          'relative overflow-hidden transition-all duration-300',
          'hover:shadow-2xl hover:scale-[1.02]',
          state.executionStatus === 'running' && 'animate-pulse'
        )}
        style={{
          background: finalTheme.colors.backgroundGradient,
          borderColor: finalTheme.colors.border
        }}
      >
        {/* Connection Status Indicator */}
        <div className="absolute top-2 right-2 flex items-center gap-2">
          {getStatusIcon()}
          <Badge 
            variant="outline" 
            className="text-xs"
            style={{ 
              backgroundColor: `${finalTheme.colors.primary}20`,
              color: finalTheme.colors.accent
            }}
          >
            {state.performanceScore}ms
          </Badge>
        </div>

        {/* Classification Indicator */}
        <AnimatePresence mode="wait">
          {(isClassifying || isDebouncing) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-2 left-2"
            >
              <Badge variant="secondary" className="flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Classifying...
              </Badge>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-6">
          {/* Header with Icon */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ 
                  scale: finalTheme.animation.hover.scale,
                  rotate: finalTheme.animation.hover.rotate
                }}
                transition={{ duration: finalTheme.animation.hover.duration / 1000 }}
                className="p-3 rounded-xl"
                style={{ backgroundColor: `${finalTheme.colors.primary}20` }}
              >
                {React.createElement(
                  getIconComponent(finalTheme.icon),
                  { 
                    className: 'w-6 h-6',
                    style: { color: finalTheme.colors.primary }
                  }
                )}
              </motion.div>
              
              <div>
                <h3 className="font-semibold text-lg" style={{ color: finalTheme.colors.text }}>
                  {action.title}
                </h3>
                {state.classification && (
                  <div className="flex items-center gap-2 mt-1">
                    <Badge 
                      variant="secondary"
                      style={{ 
                        backgroundColor: `${finalTheme.colors.primary}30`,
                        color: finalTheme.colors.accent
                      }}
                    >
                      {state.classification.category}
                    </Badge>
                    <Badge 
                      variant="outline"
                      style={{ 
                        borderColor: finalTheme.colors.border,
                        color: finalTheme.colors.textMuted
                      }}
                    >
                      {Math.round(state.classification.confidence * 100)}% confidence
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Execution Status */}
            {state.executionId && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-2"
              >
                {getExecutionIcon()}
                <span className="text-sm" style={{ color: finalTheme.colors.textMuted }}>
                  {state.executionStatus}
                </span>
              </motion.div>
            )}
          </div>

          {/* Description */}
          <p className="text-sm mb-4" style={{ color: finalTheme.colors.textMuted }}>
            {action.description}
          </p>

          {/* Progress Bar for Running Workflows */}
          {state.executionStatus === 'running' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4"
            >
              <Progress 
                value={executionStatus?.progress || 0} 
                className="h-2"
                style={{ backgroundColor: `${finalTheme.colors.primary}20` }}
              />
            </motion.div>
          )}

          {/* Workflow Steps */}
          {action.steps && action.steps.length > 0 && (
            <div className="mb-4 space-y-2">
              {action.steps.slice(0, 3).map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-2 text-sm"
                  style={{ color: finalTheme.colors.textMuted }}
                >
                  <ChevronRight className="w-4 h-4" style={{ color: finalTheme.colors.accent }} />
                  {step.name}
                </motion.div>
              ))}
            </div>
          )}

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <MetricCard
              icon={Clock}
              label="Duration"
              value={action.estimatedDuration || '5 min'}
              theme={finalTheme}
            />
            <MetricCard
              icon={DollarSign}
              label="Savings"
              value={`$${action.estimatedSavings || 0}`}
              theme={finalTheme}
            />
            <MetricCard
              icon={Target}
              label="Priority"
              value={state.classification?.priority || 'Medium'}
              theme={finalTheme}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {!state.goalId && (
              <Button
                onClick={handleCreateGoal}
                disabled={!state.classification || createGoalMutation.isLoading}
                className="flex-1"
                style={{
                  backgroundColor: finalTheme.colors.primary,
                  color: finalTheme.colors.text
                }}
              >
                {createGoalMutation.isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Goal...
                  </>
                ) : (
                  <>
                    <Target className="w-4 h-4 mr-2" />
                    Create Goal
                  </>
                )}
              </Button>
            )}

            {!state.executionId && (
              <Button
                onClick={handleExecuteWorkflow}
                disabled={executeWorkflowMutation.isLoading || !isOnline}
                variant="outline"
                className="flex-1"
                style={{
                  borderColor: finalTheme.colors.border,
                  color: finalTheme.colors.accent
                }}
              >
                {executeWorkflowMutation.isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Execute
                  </>
                )}
              </Button>
            )}

            {state.goalId && (
              <Button
                variant="ghost"
                className="flex-1"
                style={{ color: finalTheme.colors.accent }}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Goal Created
              </Button>
            )}
          </div>
        </div>

        {/* Animated Background Effect */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{
            background: [
              `radial-gradient(circle at 0% 0%, ${finalTheme.colors.glow} 0%, transparent 50%)`,
              `radial-gradient(circle at 100% 100%, ${finalTheme.colors.glow} 0%, transparent 50%)`,
              `radial-gradient(circle at 0% 0%, ${finalTheme.colors.glow} 0%, transparent 50%)`,
            ]
          }}
          transition={{
            duration: finalTheme.animation.pulse.duration / 1000,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </Card>
    </motion.div>
  )
}

// ==================== Helper Components ====================

function MetricCard({ 
  icon: Icon, 
  label, 
  value, 
  theme 
}: { 
  icon: any
  label: string
  value: string
  theme: WorkflowTheme 
}) {
  return (
    <div 
      className="p-2 rounded-lg text-center"
      style={{ backgroundColor: `${theme.colors.primary}10` }}
    >
      <Icon className="w-4 h-4 mx-auto mb-1" style={{ color: theme.colors.accent }} />
      <div className="text-xs" style={{ color: theme.colors.textMuted }}>{label}</div>
      <div className="font-semibold text-sm" style={{ color: theme.colors.text }}>{value}</div>
    </div>
  )
}

function getIconComponent(iconName: string) {
  const icons: Record<string, any> = {
    Zap,
    Shield,
    TrendingUp,
    AlertTriangle,
    Activity,
    BarChart3,
    Target,
    Sparkles
  }
  return icons[iconName] || Zap
}