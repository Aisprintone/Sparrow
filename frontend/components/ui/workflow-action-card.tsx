"use client"

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion'
import { 
  Zap, Shield, TrendingUp, AlertTriangle, Activity, BarChart3, 
  Sparkles, Target, Clock, DollarSign, Check, ChevronRight,
  Play, Pause, Settings, Info, Star, Lock, Unlock, 
  ArrowRight, Eye, EyeOff, Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  WorkflowCategory, 
  Priority, 
  WorkflowMetadata 
} from '@/lib/services/workflow-classifier.service'
import { 
  getWorkflowTheme, 
  getHybridTheme, 
  getGoalTheme,
  WorkflowTheme,
  applyAccessibilityOverrides
} from '@/lib/design-system/workflow-visual-system'

interface WorkflowActionCardProps {
  workflow: WorkflowMetadata
  category: WorkflowCategory
  isHybrid?: boolean
  isGoal?: boolean
  priority?: Priority
  confidence?: number
  isActive?: boolean
  isCompleted?: boolean
  progress?: number
  onActivate?: () => void
  onConfigure?: () => void
  onPause?: () => void
  onResume?: () => void
  onViewDetails?: () => void
  className?: string
  reducedMotion?: boolean
  showMicroInteractions?: boolean
}

export default function WorkflowActionCard({
  workflow,
  category,
  isHybrid = false,
  isGoal = false,
  priority = Priority.MEDIUM,
  confidence = 85,
  isActive = false,
  isCompleted = false,
  progress = 0,
  onActivate,
  onConfigure,
  onPause,
  onResume,
  onViewDetails,
  className,
  reducedMotion = false,
  showMicroInteractions = true
}: WorkflowActionCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [pulseAnimation, setPulseAnimation] = useState(true)
  const cardRef = useRef<HTMLDivElement>(null)
  
  // Motion values for advanced interactions
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const rotateX = useTransform(mouseY, [-100, 100], [10, -10])
  const rotateY = useTransform(mouseX, [-100, 100], [-10, 10])
  const springConfig = { stiffness: 300, damping: 30 }
  const rotateXSpring = useSpring(rotateX, springConfig)
  const rotateYSpring = useSpring(rotateY, springConfig)
  
  // Get theme based on workflow type
  const theme = isHybrid 
    ? getHybridTheme() 
    : isGoal 
      ? getGoalTheme() 
      : getWorkflowTheme(category)
  
  // Apply accessibility overrides if needed
  const finalTheme = applyAccessibilityOverrides(theme, reducedMotion)
  
  // Get icon component
  const IconComponent = getIconComponent(theme.icon)
  
  // Handle mouse movement for 3D effect
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!showMicroInteractions || reducedMotion) return
    
    const rect = cardRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const x = (e.clientX - centerX) / (rect.width / 2)
    const y = (e.clientY - centerY) / (rect.height / 2)
    
    mouseX.set(x * 100)
    mouseY.set(y * 100)
  }
  
  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }
  
  // Calculate visual priority
  const visualPriority = getVisualPriority(priority, isActive, isCompleted)
  
  // Success animation trigger
  useEffect(() => {
    if (isCompleted && showMicroInteractions) {
      setPulseAnimation(false)
      setTimeout(() => setPulseAnimation(true), 100)
    }
  }, [isCompleted, showMicroInteractions])
  
  return (
    <motion.div
      ref={cardRef}
      className={cn(
        "relative overflow-hidden rounded-xl transition-all duration-300",
        className
      )}
      initial={finalTheme.animation.entrance.from}
      animate={finalTheme.animation.entrance.to}
      transition={{
        duration: finalTheme.animation.duration / 1000,
        ease: finalTheme.animation.easing,
        delay: finalTheme.animation.delay / 1000
      }}
      whileHover={
        showMicroInteractions && !reducedMotion
          ? {
              scale: finalTheme.animation.hover.scale,
              rotate: finalTheme.animation.hover.rotate
            }
          : {}
      }
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      style={{
        background: finalTheme.colors.backgroundGradient,
        border: `1px solid ${isHovered ? finalTheme.colors.borderHover : finalTheme.colors.border}`,
        boxShadow: isHovered 
          ? `0 20px 40px ${finalTheme.colors.shadow}, 0 0 60px ${finalTheme.colors.glow}`
          : `0 10px 20px ${finalTheme.colors.shadow}`,
        transform: showMicroInteractions && !reducedMotion ? 'perspective(1000px)' : undefined,
        rotateX: showMicroInteractions && !reducedMotion ? rotateXSpring : 0,
        rotateY: showMicroInteractions && !reducedMotion ? rotateYSpring : 0
      }}
      role={finalTheme.accessibility.role}
      aria-label={finalTheme.accessibility.ariaLabel}
      aria-description={finalTheme.accessibility.ariaDescription}
      tabIndex={0}
    >
      {/* Animated Background Pattern */}
      {showMicroInteractions && !reducedMotion && (
        <div className="absolute inset-0 opacity-20">
          <motion.div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at ${isHovered ? '50%' : '100%'} ${isHovered ? '50%' : '100%'}, ${finalTheme.colors.primary} 0%, transparent 70%)`
            }}
            animate={{
              scale: isHovered ? 1.5 : 1,
              opacity: isHovered ? 0.3 : 0.1
            }}
            transition={{ duration: 0.6 }}
          />
        </div>
      )}
      
      {/* Priority Indicator */}
      {priority === Priority.CRITICAL && (
        <motion.div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ background: finalTheme.colors.accent }}
          animate={
            showMicroInteractions && !reducedMotion
              ? { scaleX: [0, 1, 0] }
              : {}
          }
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      )}
      
      {/* Card Content */}
      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Animated Icon Container */}
            <motion.div
              className="relative"
              animate={
                pulseAnimation && showMicroInteractions && !reducedMotion
                  ? {
                      scale: finalTheme.animation.pulse.scale,
                      opacity: finalTheme.animation.pulse.opacity
                    }
                  : {}
              }
              transition={{
                duration: finalTheme.animation.pulse.duration / 1000,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            >
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${finalTheme.colors.primary} 0%, ${finalTheme.colors.secondary} 100%)`
                }}
              >
                <IconComponent className="w-6 h-6" style={{ color: finalTheme.colors.text }} />
              </div>
              
              {/* Status Indicator */}
              {isActive && (
                <motion.div
                  className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
                  style={{ background: '#10b981' }}
                  animate={
                    showMicroInteractions && !reducedMotion
                      ? { scale: [1, 1.2, 1] }
                      : {}
                  }
                  transition={{
                    duration: 1,
                    repeat: Infinity
                  }}
                />
              )}
            </motion.div>
            
            <div className="flex-1">
              <h3 className="font-semibold text-lg" style={{ color: finalTheme.colors.text }}>
                {workflow.title}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant="outline"
                  className="text-xs"
                  style={{
                    color: finalTheme.colors.textMuted,
                    borderColor: finalTheme.colors.border
                  }}
                >
                  {confidence}% confidence
                </Badge>
                {isHybrid && (
                  <Badge
                    className="text-xs"
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #8b5cf6 100%)',
                      color: '#fff'
                    }}
                  >
                    Smart Action
                  </Badge>
                )}
                {isGoal && (
                  <Badge
                    className="text-xs"
                    style={{
                      background: finalTheme.colors.primary,
                      color: finalTheme.colors.text
                    }}
                  >
                    Goal-based
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <motion.button
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
              style={{
                background: isHovered ? finalTheme.colors.background : 'transparent',
                color: finalTheme.colors.textMuted
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </motion.button>
          </div>
        </div>
        
        {/* Description */}
        <p className="text-sm mb-4" style={{ color: finalTheme.colors.textMuted }}>
          {workflow.description}
        </p>
        
        {/* Metrics */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <MetricItem
            icon={<DollarSign className="w-3 h-3" />}
            label="Savings"
            value={`$${workflow.estimatedSavings}/mo`}
            color={finalTheme.colors.primary}
          />
          <MetricItem
            icon={<Clock className="w-3 h-3" />}
            label="Duration"
            value={workflow.estimatedDuration}
            color={finalTheme.colors.secondary}
          />
          <MetricItem
            icon={<Shield className="w-3 h-3" />}
            label="Risk"
            value={workflow.riskLevel}
            color={finalTheme.colors.tertiary}
          />
          <MetricItem
            icon={<Star className="w-3 h-3" />}
            label="Priority"
            value={priority}
            color={finalTheme.colors.accent}
          />
        </div>
        
        {/* Progress Bar */}
        {(isActive || isCompleted) && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-1">
              <span style={{ color: finalTheme.colors.textMuted }}>Progress</span>
              <span style={{ color: finalTheme.colors.text }}>{progress}%</span>
            </div>
            <div className="relative h-2 rounded-full overflow-hidden" style={{ background: finalTheme.colors.background }}>
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${finalTheme.colors.primary} 0%, ${finalTheme.colors.secondary} 100%)`
                }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}
        
        {/* Expanded Details */}
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="pt-4 border-t" style={{ borderColor: finalTheme.colors.border }}>
                {/* Benefits */}
                <div className="mb-4">
                  <h4 className="text-xs font-semibold mb-2" style={{ color: finalTheme.colors.text }}>
                    Benefits
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {workflow.benefits.map((benefit, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center gap-2 text-xs"
                        style={{ color: finalTheme.colors.textMuted }}
                      >
                        <Check className="w-3 h-3" style={{ color: finalTheme.colors.primary }} />
                        <span>{benefit.label}</span>
                        {benefit.value && (
                          <span style={{ color: finalTheme.colors.text }}>
                            {benefit.value}
                          </span>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
                
                {/* Steps Preview */}
                <div className="mb-4">
                  <h4 className="text-xs font-semibold mb-2" style={{ color: finalTheme.colors.text }}>
                    Steps ({workflow.steps.length})
                  </h4>
                  <div className="space-y-1">
                    {workflow.steps.slice(0, 3).map((step, index) => (
                      <motion.div
                        key={step.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center gap-2 text-xs"
                        style={{ color: finalTheme.colors.textMuted }}
                      >
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
                          style={{
                            background: finalTheme.colors.background,
                            color: finalTheme.colors.primary
                          }}
                        >
                          {index + 1}
                        </div>
                        <span>{step.name}</span>
                        <span className="text-xs opacity-60">({step.duration}s)</span>
                      </motion.div>
                    ))}
                    {workflow.steps.length > 3 && (
                      <div className="text-xs opacity-60" style={{ color: finalTheme.colors.textMuted }}>
                        +{workflow.steps.length - 3} more steps
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          {!isActive && !isCompleted ? (
            <motion.button
              className="flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2"
              style={{
                background: `linear-gradient(135deg, ${finalTheme.colors.primary} 0%, ${finalTheme.colors.secondary} 100%)`,
                color: finalTheme.colors.text
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onActivate}
            >
              <Zap className="w-4 h-4" />
              Activate Workflow
            </motion.button>
          ) : isActive ? (
            <>
              <motion.button
                className="flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2"
                style={{
                  background: finalTheme.colors.background,
                  color: finalTheme.colors.text,
                  border: `1px solid ${finalTheme.colors.border}`
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onPause}
              >
                <Pause className="w-4 h-4" />
                Pause
              </motion.button>
              <motion.button
                className="py-2 px-4 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2"
                style={{
                  background: finalTheme.colors.background,
                  color: finalTheme.colors.text,
                  border: `1px solid ${finalTheme.colors.border}`
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onConfigure}
              >
                <Settings className="w-4 h-4" />
              </motion.button>
            </>
          ) : (
            <motion.button
              className="flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2"
              style={{
                background: `linear-gradient(135deg, ${finalTheme.colors.primary} 0%, ${finalTheme.colors.secondary} 100%)`,
                color: finalTheme.colors.text
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onViewDetails}
            >
              <Check className="w-4 h-4" />
              View Results
            </motion.button>
          )}
        </div>
      </div>
      
      {/* Success Animation Overlay */}
      <AnimatePresence>
        {isCompleted && showMicroInteractions && !reducedMotion && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="absolute inset-0"
              style={{
                background: `radial-gradient(circle at center, ${finalTheme.colors.primary}33 0%, transparent 70%)`
              }}
              animate={{
                scale: [1, 1.5, 2],
                opacity: [0.5, 0.3, 0]
              }}
              transition={{
                duration: 1.5,
                ease: 'easeOut'
              }}
            />
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  background: finalTheme.colors.primary,
                  left: '50%',
                  top: '50%'
                }}
                animate={{
                  x: [0, Math.cos(i * 60 * Math.PI / 180) * 100],
                  y: [0, Math.sin(i * 60 * Math.PI / 180) * 100],
                  opacity: [1, 0],
                  scale: [0, 1]
                }}
                transition={{
                  duration: 1,
                  ease: 'easeOut',
                  delay: i * 0.05
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Helper Components
function MetricItem({ 
  icon, 
  label, 
  value, 
  color 
}: { 
  icon: React.ReactNode
  label: string
  value: string
  color: string 
}) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center mb-1" style={{ color }}>
        {icon}
      </div>
      <div className="text-xs opacity-60">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  )
}

// Icon mapping
function getIconComponent(iconName: string) {
  const icons: Record<string, React.FC<any>> = {
    Zap,
    Shield,
    TrendingUp,
    AlertTriangle,
    Activity,
    BarChart3,
    Sparkles,
    Target
  }
  return icons[iconName] || Zap
}

// Visual priority calculation
function getVisualPriority(
  priority: Priority,
  isActive: boolean,
  isCompleted: boolean
): number {
  let score = 0
  
  switch (priority) {
    case Priority.CRITICAL: score = 100; break
    case Priority.HIGH: score = 75; break
    case Priority.MEDIUM: score = 50; break
    case Priority.LOW: score = 25; break
  }
  
  if (isActive) score += 20
  if (isCompleted) score -= 10
  
  return Math.min(100, Math.max(0, score))
}