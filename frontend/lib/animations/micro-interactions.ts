/**
 * Micro-Interactions Animation Library
 * =====================================
 * Delightful, purposeful animations that guide user attention
 * and provide immediate feedback for every interaction
 * 
 * UX ALCHEMIST PRINCIPLES:
 * - Every animation has a purpose
 * - Timing and easing create personality
 * - Subtle effects have big impact
 * - Accessibility always comes first
 */

import { Variants, TargetAndTransition, Transition } from 'framer-motion'

// ==================== Animation Presets ====================

export const TIMING = {
  instant: 150,
  fast: 200,
  normal: 300,
  slow: 500,
  verySlow: 800,
  // Perceived performance optimizations
  enterStagger: 50,
  exitStagger: 30,
  cascadeDelay: 100
} as const

export const EASING = {
  // Natural easings
  easeOut: [0.0, 0.0, 0.2, 1.0],
  easeIn: [0.4, 0.0, 1.0, 1.0],
  easeInOut: [0.4, 0.0, 0.2, 1.0],
  // Character easings
  bouncy: [0.68, -0.55, 0.265, 1.55],
  smooth: [0.25, 0.46, 0.45, 0.94],
  snappy: [0.34, 1.56, 0.64, 1],
  elastic: [0.68, -0.6, 0.32, 1.6],
  // Mechanical easings
  linear: [0, 0, 1, 1],
  sharp: [0.4, 0.0, 0.6, 1.0]
} as const

// ==================== Hover Animations ====================

export const hoverEffects = {
  lift: {
    scale: 1.02,
    y: -2,
    transition: {
      duration: TIMING.fast / 1000,
      ease: EASING.snappy
    }
  },
  
  glow: {
    scale: 1.05,
    filter: 'brightness(1.1)',
    transition: {
      duration: TIMING.normal / 1000,
      ease: EASING.smooth
    }
  },
  
  pulse: {
    scale: [1, 1.05, 1],
    transition: {
      duration: TIMING.slow / 1000,
      ease: EASING.easeInOut,
      repeat: Infinity
    }
  },
  
  tilt: {
    rotateZ: 2,
    scale: 1.02,
    transition: {
      duration: TIMING.fast / 1000,
      ease: EASING.bouncy
    }
  },
  
  squeeze: {
    scale: 0.98,
    transition: {
      duration: TIMING.instant / 1000,
      ease: EASING.easeOut
    }
  }
}

// ==================== Tap Animations ====================

export const tapEffects = {
  scale: {
    scale: 0.95,
    transition: {
      duration: TIMING.instant / 1000,
      ease: EASING.easeOut
    }
  },
  
  press: {
    scale: 0.92,
    y: 2,
    transition: {
      duration: TIMING.instant / 1000,
      ease: EASING.sharp
    }
  },
  
  bounce: {
    scale: [0.9, 1.05, 0.97, 1],
    transition: {
      duration: TIMING.normal / 1000,
      ease: EASING.bouncy
    }
  }
}

// ==================== Entrance Animations ====================

export const entranceVariants: Record<string, Variants> = {
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  },
  
  fadeInDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 }
  },
  
  fadeInLeft: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 }
  },
  
  fadeInRight: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  },
  
  scaleIn: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 }
  },
  
  rotateIn: {
    initial: { opacity: 0, rotate: -10, scale: 0.9 },
    animate: { opacity: 1, rotate: 0, scale: 1 },
    exit: { opacity: 0, rotate: 10, scale: 0.9 }
  },
  
  slideInBottom: {
    initial: { y: '100%' },
    animate: { y: 0 },
    exit: { y: '100%' }
  },
  
  slideInTop: {
    initial: { y: '-100%' },
    animate: { y: 0 },
    exit: { y: '-100%' }
  }
}

// ==================== Success Animations ====================

export const successAnimations = {
  checkmark: {
    initial: { pathLength: 0, opacity: 0 },
    animate: { 
      pathLength: 1, 
      opacity: 1,
      transition: {
        pathLength: { duration: 0.5, ease: EASING.easeOut },
        opacity: { duration: 0.1 }
      }
    }
  },
  
  celebration: {
    animate: {
      scale: [1, 1.2, 0.9, 1.1, 1],
      rotate: [0, 5, -5, 3, 0],
      transition: {
        duration: TIMING.slow / 1000,
        ease: EASING.bouncy
      }
    }
  },
  
  confetti: {
    animate: (i: number) => ({
      y: [0, -Math.random() * 200 - 100],
      x: [(Math.random() - 0.5) * 100, (Math.random() - 0.5) * 200],
      opacity: [1, 1, 0],
      scale: [0, 1, 0.5],
      rotate: [0, Math.random() * 360],
      transition: {
        duration: 1.5,
        ease: EASING.easeOut,
        delay: i * 0.02
      }
    })
  },
  
  ripple: {
    animate: {
      scale: [1, 2, 2.5],
      opacity: [0.5, 0.3, 0],
      transition: {
        duration: 1,
        ease: EASING.easeOut,
        repeat: Infinity,
        repeatDelay: 0.5
      }
    }
  }
}

// ==================== Loading Animations ====================

export const loadingAnimations = {
  dots: {
    animate: (i: number) => ({
      y: [0, -10, 0],
      transition: {
        duration: 0.6,
        ease: EASING.easeInOut,
        repeat: Infinity,
        delay: i * 0.1
      }
    })
  },
  
  spinner: {
    animate: {
      rotate: 360,
      transition: {
        duration: 1,
        ease: EASING.linear,
        repeat: Infinity
      }
    }
  },
  
  pulse: {
    animate: {
      scale: [1, 1.05, 1],
      opacity: [1, 0.7, 1],
      transition: {
        duration: 1.5,
        ease: EASING.easeInOut,
        repeat: Infinity
      }
    }
  },
  
  skeleton: {
    animate: {
      backgroundPosition: ['200% 0', '-200% 0'],
      transition: {
        duration: 1.5,
        ease: EASING.linear,
        repeat: Infinity
      }
    }
  }
}

// ==================== Workflow State Animations ====================

export const workflowStateAnimations = {
  pending: {
    animate: {
      opacity: [0.5, 0.7, 0.5],
      transition: {
        duration: 2,
        ease: EASING.easeInOut,
        repeat: Infinity
      }
    }
  },
  
  active: {
    animate: {
      scale: [1, 1.02, 1],
      transition: {
        duration: 1,
        ease: EASING.smooth,
        repeat: Infinity
      }
    }
  },
  
  completed: {
    initial: { scale: 0, rotate: -180 },
    animate: { 
      scale: 1, 
      rotate: 0,
      transition: {
        scale: { type: 'spring', stiffness: 200, damping: 15 },
        rotate: { duration: 0.5, ease: EASING.bouncy }
      }
    }
  },
  
  failed: {
    animate: {
      x: [-2, 2, -2, 2, 0],
      transition: {
        duration: 0.4,
        ease: EASING.linear
      }
    }
  }
}

// ==================== Gesture Animations ====================

export const gestureAnimations = {
  drag: {
    whileDrag: { scale: 1.05 },
    dragElastic: 0.2,
    dragConstraints: { top: 0, left: 0, right: 0, bottom: 0 }
  },
  
  swipe: {
    initial: { x: 0 },
    exit: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      transition: {
        duration: TIMING.normal / 1000,
        ease: EASING.easeIn
      }
    })
  },
  
  pinch: {
    whilePinch: (scale: number) => ({
      scale: scale,
      transition: {
        duration: 0,
        ease: EASING.linear
      }
    })
  }
}

// ==================== Notification Animations ====================

export const notificationAnimations = {
  slideIn: {
    initial: { x: 400, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 400, opacity: 0 },
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 30
    }
  },
  
  bounce: {
    initial: { y: -100, opacity: 0 },
    animate: { 
      y: 0, 
      opacity: 1,
      transition: {
        y: { type: 'spring', stiffness: 300, damping: 20 },
        opacity: { duration: 0.2 }
      }
    },
    exit: { y: -100, opacity: 0 }
  },
  
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: TIMING.fast / 1000 }
  }
}

// ==================== Progress Animations ====================

export const progressAnimations = {
  fill: (progress: number) => ({
    width: `${progress}%`,
    transition: {
      duration: TIMING.slow / 1000,
      ease: EASING.easeOut
    }
  }),
  
  pulse: {
    animate: {
      opacity: [1, 0.6, 1],
      transition: {
        duration: 1.5,
        ease: EASING.easeInOut,
        repeat: Infinity
      }
    }
  },
  
  wave: {
    animate: {
      backgroundPosition: ['0% 0%', '100% 0%'],
      transition: {
        duration: 2,
        ease: EASING.linear,
        repeat: Infinity
      }
    }
  }
}

// ==================== Helper Functions ====================

export function staggerChildren(
  staggerTime: number = TIMING.enterStagger / 1000,
  delayChildren: number = 0
): Transition {
  return {
    staggerChildren: staggerTime,
    delayChildren
  }
}

export function springTransition(
  stiffness: number = 300,
  damping: number = 25
): Transition {
  return {
    type: 'spring',
    stiffness,
    damping
  }
}

export function createPulseAnimation(
  scale: number[] = [1, 1.05, 1],
  duration: number = 2
): TargetAndTransition {
  return {
    scale,
    transition: {
      duration,
      ease: EASING.easeInOut,
      repeat: Infinity
    }
  }
}

export function createShakeAnimation(
  intensity: number = 5,
  duration: number = 0.5
): TargetAndTransition {
  return {
    x: [-intensity, intensity, -intensity, intensity, 0],
    transition: {
      duration,
      ease: EASING.linear
    }
  }
}

// ==================== Accessibility Helpers ====================

export function getReducedMotionVariants(variants: Variants): Variants {
  const reduced: Variants = {}
  
  for (const key in variants) {
    if (key === 'initial' || key === 'animate' || key === 'exit') {
      reduced[key] = {
        opacity: variants[key].opacity || 1,
        // Remove all motion-based properties
        x: 0,
        y: 0,
        scale: 1,
        rotate: 0,
        transition: { duration: 0 }
      }
    } else {
      reduced[key] = variants[key]
    }
  }
  
  return reduced
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// ==================== Compound Animations ====================

export const compoundAnimations = {
  morphAndFade: {
    initial: { opacity: 0, scale: 0.5, borderRadius: '50%' },
    animate: { 
      opacity: 1, 
      scale: 1, 
      borderRadius: '10%',
      transition: {
        duration: TIMING.slow / 1000,
        ease: EASING.smooth
      }
    }
  },
  
  slideAndRotate: {
    initial: { x: -100, rotate: -45, opacity: 0 },
    animate: { 
      x: 0, 
      rotate: 0, 
      opacity: 1,
      transition: {
        duration: TIMING.normal / 1000,
        ease: EASING.snappy
      }
    }
  },
  
  expandAndReveal: {
    initial: { width: 0, opacity: 0 },
    animate: { 
      width: 'auto', 
      opacity: 1,
      transition: {
        width: { duration: TIMING.normal / 1000, ease: EASING.easeOut },
        opacity: { duration: TIMING.fast / 1000, delay: 0.1 }
      }
    }
  }
}

// ==================== Animation Orchestrator ====================

export class AnimationOrchestrator {
  private animations: Map<string, TargetAndTransition> = new Map()
  private reducedMotion: boolean
  
  constructor(respectReducedMotion: boolean = true) {
    this.reducedMotion = respectReducedMotion && prefersReducedMotion()
  }
  
  add(name: string, animation: TargetAndTransition): this {
    this.animations.set(name, this.reducedMotion ? {} : animation)
    return this
  }
  
  sequence(animations: Array<[string, TargetAndTransition, number]>): TargetAndTransition[] {
    if (this.reducedMotion) return []
    
    return animations.map(([name, animation, delay]) => ({
      ...animation,
      transition: {
        ...animation.transition,
        delay: delay / 1000
      }
    }))
  }
  
  parallel(animations: TargetAndTransition[]): TargetAndTransition {
    if (this.reducedMotion) return {}
    
    const combined: TargetAndTransition = {}
    
    animations.forEach(animation => {
      Object.assign(combined, animation)
    })
    
    return combined
  }
  
  get(name: string): TargetAndTransition | undefined {
    return this.animations.get(name)
  }
  
  clear(): void {
    this.animations.clear()
  }
}