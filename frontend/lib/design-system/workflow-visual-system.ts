/**
 * Workflow Visual Differentiation System
 * ========================================
 * Comprehensive visual design system for workflow type differentiation
 * with accessibility-first approach and delightful micro-interactions
 * 
 * UX ALCHEMIST DESIGN PRINCIPLES:
 * - Visual language that instantly communicates workflow type
 * - Accessibility WCAG AA compliant color system
 * - Micro-interactions that guide understanding
 * - Semantic meaning through color, motion, and iconography
 */

import { WorkflowCategory, Priority } from '@/lib/services/workflow-classifier.service'

// ==================== Color System ====================

export interface ColorPalette {
  primary: string
  secondary: string
  tertiary: string
  background: string
  backgroundGradient: string
  border: string
  borderHover: string
  text: string
  textMuted: string
  accent: string
  shadow: string
  glow: string
  pulse: string
}

export interface WorkflowTheme {
  colors: ColorPalette
  icon: string
  animation: AnimationConfig
  semantics: SemanticConfig
  accessibility: AccessibilityConfig
}

export interface AnimationConfig {
  duration: number
  easing: string
  delay: number
  stagger: number
  hover: {
    scale: number
    rotate: number
    duration: number
  }
  entrance: {
    from: { opacity: number; y: number; scale: number }
    to: { opacity: number; y: number; scale: number }
  }
  pulse: {
    scale: number[]
    opacity: number[]
    duration: number
  }
  success: {
    scale: number[]
    rotate: number[]
    duration: number
  }
}

export interface SemanticConfig {
  priority: Priority
  urgency: 'low' | 'medium' | 'high' | 'critical'
  complexity: 'simple' | 'moderate' | 'complex'
  userAttention: 'passive' | 'active' | 'required'
  emotionalTone: 'calm' | 'energetic' | 'urgent' | 'celebratory'
}

export interface AccessibilityConfig {
  ariaLabel: string
  ariaDescription: string
  role: string
  focusIndicator: string
  contrastRatio: number
  reducedMotion: boolean
  screenReaderPriority: number
}

// ==================== Workflow Type Themes ====================

export const WORKFLOW_THEMES: Record<WorkflowCategory, WorkflowTheme> = {
  [WorkflowCategory.OPTIMIZE]: {
    colors: {
      primary: '#10b981', // Emerald 500
      secondary: '#34d399', // Emerald 400
      tertiary: '#6ee7b7', // Emerald 300
      background: 'rgba(16, 185, 129, 0.1)',
      backgroundGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(52, 211, 153, 0.1) 100%)',
      border: 'rgba(16, 185, 129, 0.3)',
      borderHover: 'rgba(16, 185, 129, 0.5)',
      text: '#ecfdf5', // Emerald 50
      textMuted: '#a7f3d0', // Emerald 200
      accent: '#059669', // Emerald 600
      shadow: 'rgba(16, 185, 129, 0.2)',
      glow: 'rgba(52, 211, 153, 0.4)',
      pulse: 'rgba(110, 231, 183, 0.6)'
    },
    icon: 'Zap',
    animation: {
      duration: 600,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      delay: 0,
      stagger: 50,
      hover: {
        scale: 1.05,
        rotate: 5,
        duration: 300
      },
      entrance: {
        from: { opacity: 0, y: 20, scale: 0.9 },
        to: { opacity: 1, y: 0, scale: 1 }
      },
      pulse: {
        scale: [1, 1.02, 1],
        opacity: [0.8, 1, 0.8],
        duration: 2000
      },
      success: {
        scale: [1, 1.2, 1],
        rotate: [0, 5, -5, 0],
        duration: 500
      }
    },
    semantics: {
      priority: Priority.MEDIUM,
      urgency: 'medium',
      complexity: 'simple',
      userAttention: 'passive',
      emotionalTone: 'energetic'
    },
    accessibility: {
      ariaLabel: 'Optimization workflow',
      ariaDescription: 'Workflow to optimize and improve efficiency',
      role: 'button',
      focusIndicator: 'ring-2 ring-emerald-500 ring-offset-2',
      contrastRatio: 4.5,
      reducedMotion: false,
      screenReaderPriority: 2
    }
  },
  
  [WorkflowCategory.PROTECT]: {
    colors: {
      primary: '#3b82f6', // Blue 500
      secondary: '#60a5fa', // Blue 400
      tertiary: '#93c5fd', // Blue 300
      background: 'rgba(59, 130, 246, 0.1)',
      backgroundGradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(96, 165, 250, 0.1) 100%)',
      border: 'rgba(59, 130, 246, 0.3)',
      borderHover: 'rgba(59, 130, 246, 0.5)',
      text: '#eff6ff', // Blue 50
      textMuted: '#bfdbfe', // Blue 200
      accent: '#2563eb', // Blue 600
      shadow: 'rgba(59, 130, 246, 0.2)',
      glow: 'rgba(96, 165, 250, 0.4)',
      pulse: 'rgba(147, 197, 253, 0.6)'
    },
    icon: 'Shield',
    animation: {
      duration: 700,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      delay: 0,
      stagger: 60,
      hover: {
        scale: 1.03,
        rotate: 0,
        duration: 400
      },
      entrance: {
        from: { opacity: 0, y: 30, scale: 0.95 },
        to: { opacity: 1, y: 0, scale: 1 }
      },
      pulse: {
        scale: [1, 1.01, 1],
        opacity: [0.9, 1, 0.9],
        duration: 3000
      },
      success: {
        scale: [1, 1.1, 1],
        rotate: [0, 0, 0],
        duration: 600
      }
    },
    semantics: {
      priority: Priority.HIGH,
      urgency: 'low',
      complexity: 'moderate',
      userAttention: 'active',
      emotionalTone: 'calm'
    },
    accessibility: {
      ariaLabel: 'Protection workflow',
      ariaDescription: 'Workflow to protect and secure your finances',
      role: 'button',
      focusIndicator: 'ring-2 ring-blue-500 ring-offset-2',
      contrastRatio: 4.5,
      reducedMotion: false,
      screenReaderPriority: 1
    }
  },
  
  [WorkflowCategory.GROW]: {
    colors: {
      primary: '#8b5cf6', // Purple 500
      secondary: '#a78bfa', // Purple 400
      tertiary: '#c4b5fd', // Purple 300
      background: 'rgba(139, 92, 246, 0.1)',
      backgroundGradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(167, 139, 250, 0.1) 100%)',
      border: 'rgba(139, 92, 246, 0.3)',
      borderHover: 'rgba(139, 92, 246, 0.5)',
      text: '#f3f4f6', // Purple 50
      textMuted: '#ddd6fe', // Purple 200
      accent: '#7c3aed', // Purple 600
      shadow: 'rgba(139, 92, 246, 0.2)',
      glow: 'rgba(167, 139, 250, 0.4)',
      pulse: 'rgba(196, 181, 253, 0.6)'
    },
    icon: 'TrendingUp',
    animation: {
      duration: 800,
      easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      delay: 0,
      stagger: 70,
      hover: {
        scale: 1.07,
        rotate: 10,
        duration: 350
      },
      entrance: {
        from: { opacity: 0, y: 40, scale: 0.8 },
        to: { opacity: 1, y: 0, scale: 1 }
      },
      pulse: {
        scale: [1, 1.03, 1],
        opacity: [0.7, 1, 0.7],
        duration: 2500
      },
      success: {
        scale: [1, 1.3, 1],
        rotate: [0, 10, -10, 0],
        duration: 700
      }
    },
    semantics: {
      priority: Priority.MEDIUM,
      urgency: 'low',
      complexity: 'complex',
      userAttention: 'active',
      emotionalTone: 'celebratory'
    },
    accessibility: {
      ariaLabel: 'Growth workflow',
      ariaDescription: 'Workflow to grow your wealth and investments',
      role: 'button',
      focusIndicator: 'ring-2 ring-purple-500 ring-offset-2',
      contrastRatio: 4.5,
      reducedMotion: false,
      screenReaderPriority: 3
    }
  },
  
  [WorkflowCategory.EMERGENCY]: {
    colors: {
      primary: '#ef4444', // Red 500
      secondary: '#f87171', // Red 400
      tertiary: '#fca5a5', // Red 300
      background: 'rgba(239, 68, 68, 0.1)',
      backgroundGradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(248, 113, 113, 0.1) 100%)',
      border: 'rgba(239, 68, 68, 0.3)',
      borderHover: 'rgba(239, 68, 68, 0.5)',
      text: '#fef2f2', // Red 50
      textMuted: '#fecaca', // Red 200
      accent: '#dc2626', // Red 600
      shadow: 'rgba(239, 68, 68, 0.2)',
      glow: 'rgba(248, 113, 113, 0.4)',
      pulse: 'rgba(252, 165, 165, 0.6)'
    },
    icon: 'AlertTriangle',
    animation: {
      duration: 400,
      easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      delay: 0,
      stagger: 30,
      hover: {
        scale: 1.1,
        rotate: -5,
        duration: 200
      },
      entrance: {
        from: { opacity: 0, y: -20, scale: 1.2 },
        to: { opacity: 1, y: 0, scale: 1 }
      },
      pulse: {
        scale: [1, 1.05, 1],
        opacity: [0.9, 1, 0.9],
        duration: 1000
      },
      success: {
        scale: [1, 0.9, 1],
        rotate: [0, -5, 5, 0],
        duration: 300
      }
    },
    semantics: {
      priority: Priority.CRITICAL,
      urgency: 'critical',
      complexity: 'simple',
      userAttention: 'required',
      emotionalTone: 'urgent'
    },
    accessibility: {
      ariaLabel: 'Emergency workflow - Immediate attention required',
      ariaDescription: 'Critical workflow requiring immediate action',
      role: 'alert',
      focusIndicator: 'ring-2 ring-red-500 ring-offset-2 animate-pulse',
      contrastRatio: 7,
      reducedMotion: true,
      screenReaderPriority: 0
    }
  },
  
  [WorkflowCategory.AUTOMATE]: {
    colors: {
      primary: '#06b6d4', // Cyan 500
      secondary: '#22d3ee', // Cyan 400
      tertiary: '#67e8f9', // Cyan 300
      background: 'rgba(6, 182, 212, 0.1)',
      backgroundGradient: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(34, 211, 238, 0.1) 100%)',
      border: 'rgba(6, 182, 212, 0.3)',
      borderHover: 'rgba(6, 182, 212, 0.5)',
      text: '#ecfeff', // Cyan 50
      textMuted: '#a5f3fc', // Cyan 200
      accent: '#0891b2', // Cyan 600
      shadow: 'rgba(6, 182, 212, 0.2)',
      glow: 'rgba(34, 211, 238, 0.4)',
      pulse: 'rgba(103, 232, 249, 0.6)'
    },
    icon: 'Activity',
    animation: {
      duration: 500,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      delay: 0,
      stagger: 40,
      hover: {
        scale: 1.04,
        rotate: 360,
        duration: 600
      },
      entrance: {
        from: { opacity: 0, y: 0, scale: 0.5 },
        to: { opacity: 1, y: 0, scale: 1 }
      },
      pulse: {
        scale: [1, 1.02, 1],
        opacity: [0.8, 1, 0.8],
        duration: 1500
      },
      success: {
        scale: [1, 1.15, 1],
        rotate: [0, 360],
        duration: 800
      }
    },
    semantics: {
      priority: Priority.LOW,
      urgency: 'low',
      complexity: 'moderate',
      userAttention: 'passive',
      emotionalTone: 'energetic'
    },
    accessibility: {
      ariaLabel: 'Automation workflow',
      ariaDescription: 'Workflow to automate repetitive tasks',
      role: 'button',
      focusIndicator: 'ring-2 ring-cyan-500 ring-offset-2',
      contrastRatio: 4.5,
      reducedMotion: false,
      screenReaderPriority: 4
    }
  },
  
  [WorkflowCategory.ANALYZE]: {
    colors: {
      primary: '#f59e0b', // Amber 500
      secondary: '#fbbf24', // Amber 400
      tertiary: '#fcd34d', // Amber 300
      background: 'rgba(245, 158, 11, 0.1)',
      backgroundGradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(251, 191, 36, 0.1) 100%)',
      border: 'rgba(245, 158, 11, 0.3)',
      borderHover: 'rgba(245, 158, 11, 0.5)',
      text: '#fefce8', // Amber 50
      textMuted: '#fde68a', // Amber 200
      accent: '#d97706', // Amber 600
      shadow: 'rgba(245, 158, 11, 0.2)',
      glow: 'rgba(251, 191, 36, 0.4)',
      pulse: 'rgba(252, 211, 77, 0.6)'
    },
    icon: 'BarChart3',
    animation: {
      duration: 650,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      delay: 0,
      stagger: 55,
      hover: {
        scale: 1.06,
        rotate: -10,
        duration: 400
      },
      entrance: {
        from: { opacity: 0, y: 30, scale: 0.85 },
        to: { opacity: 1, y: 0, scale: 1 }
      },
      pulse: {
        scale: [1, 1.01, 1],
        opacity: [0.85, 1, 0.85],
        duration: 2200
      },
      success: {
        scale: [1, 1.1, 1],
        rotate: [0, -5, 5, 0],
        duration: 600
      }
    },
    semantics: {
      priority: Priority.LOW,
      urgency: 'low',
      complexity: 'complex',
      userAttention: 'active',
      emotionalTone: 'calm'
    },
    accessibility: {
      ariaLabel: 'Analysis workflow',
      ariaDescription: 'Workflow to analyze and understand your finances',
      role: 'button',
      focusIndicator: 'ring-2 ring-amber-500 ring-offset-2',
      contrastRatio: 4.5,
      reducedMotion: false,
      screenReaderPriority: 5
    }
  }
}

// ==================== Hybrid Workflow Theme ====================

export const HYBRID_WORKFLOW_THEME: WorkflowTheme = {
  colors: {
    primary: 'linear-gradient(135deg, #10b981 0%, #8b5cf6 100%)',
    secondary: 'linear-gradient(135deg, #34d399 0%, #a78bfa 100%)',
    tertiary: 'linear-gradient(135deg, #6ee7b7 0%, #c4b5fd 100%)',
    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
    backgroundGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
    border: 'linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(139, 92, 246, 0.3) 100%)',
    borderHover: 'linear-gradient(135deg, rgba(16, 185, 129, 0.5) 0%, rgba(139, 92, 246, 0.5) 100%)',
    text: '#f3f4f6',
    textMuted: '#d1d5db',
    accent: 'linear-gradient(135deg, #059669 0%, #7c3aed 100%)',
    shadow: 'rgba(99, 102, 241, 0.2)',
    glow: 'rgba(99, 102, 241, 0.4)',
    pulse: 'rgba(99, 102, 241, 0.6)'
  },
  icon: 'Sparkles',
  animation: {
    duration: 700,
    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    delay: 0,
    stagger: 60,
    hover: {
      scale: 1.08,
      rotate: 15,
      duration: 400
    },
    entrance: {
      from: { opacity: 0, y: 50, scale: 0.7 },
      to: { opacity: 1, y: 0, scale: 1 }
    },
    pulse: {
      scale: [1, 1.04, 1],
      opacity: [0.7, 1, 0.7],
      duration: 2000
    },
    success: {
      scale: [1, 1.4, 1],
      rotate: [0, 20, -20, 0],
      duration: 900
    }
  },
  semantics: {
    priority: Priority.HIGH,
    urgency: 'medium',
    complexity: 'moderate',
    userAttention: 'active',
    emotionalTone: 'celebratory'
  },
  accessibility: {
    ariaLabel: 'Hybrid smart workflow',
    ariaDescription: 'Intelligent workflow combining automation with goal tracking',
    role: 'button',
    focusIndicator: 'ring-2 ring-purple-500 ring-offset-2',
    contrastRatio: 4.5,
    reducedMotion: false,
    screenReaderPriority: 1
  }
}

// ==================== Goal Workflow Theme ====================

export const GOAL_WORKFLOW_THEME: WorkflowTheme = {
  colors: {
    primary: '#ec4899', // Pink 500
    secondary: '#f472b6', // Pink 400
    tertiary: '#f9a8d4', // Pink 300
    background: 'rgba(236, 72, 153, 0.1)',
    backgroundGradient: 'linear-gradient(135deg, rgba(236, 72, 153, 0.2) 0%, rgba(244, 114, 182, 0.1) 100%)',
    border: 'rgba(236, 72, 153, 0.3)',
    borderHover: 'rgba(236, 72, 153, 0.5)',
    text: '#fdf2f8', // Pink 50
    textMuted: '#fbcfe8', // Pink 200
    accent: '#db2777', // Pink 600
    shadow: 'rgba(236, 72, 153, 0.2)',
    glow: 'rgba(244, 114, 182, 0.4)',
    pulse: 'rgba(249, 168, 212, 0.6)'
  },
  icon: 'Target',
  animation: {
    duration: 900,
    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    delay: 0,
    stagger: 80,
    hover: {
      scale: 1.1,
      rotate: 20,
      duration: 500
    },
    entrance: {
      from: { opacity: 0, y: 60, scale: 0.6 },
      to: { opacity: 1, y: 0, scale: 1 }
    },
    pulse: {
      scale: [1, 1.05, 1],
      opacity: [0.6, 1, 0.6],
      duration: 3000
    },
    success: {
      scale: [1, 1.5, 1],
      rotate: [0, 30, -30, 0],
      duration: 1000
    }
  },
  semantics: {
    priority: Priority.MEDIUM,
    urgency: 'low',
    complexity: 'simple',
    userAttention: 'active',
    emotionalTone: 'celebratory'
  },
  accessibility: {
    ariaLabel: 'Goal-based workflow',
    ariaDescription: 'Workflow focused on achieving financial goals',
    role: 'button',
    focusIndicator: 'ring-2 ring-pink-500 ring-offset-2',
    contrastRatio: 4.5,
    reducedMotion: false,
    screenReaderPriority: 2
  }
}

// ==================== Helper Functions ====================

export function getWorkflowTheme(category: WorkflowCategory): WorkflowTheme {
  return WORKFLOW_THEMES[category] || WORKFLOW_THEMES[WorkflowCategory.ANALYZE]
}

export function getHybridTheme(): WorkflowTheme {
  return HYBRID_WORKFLOW_THEME
}

export function getGoalTheme(): WorkflowTheme {
  return GOAL_WORKFLOW_THEME
}

export function applyAccessibilityOverrides(
  theme: WorkflowTheme, 
  reducedMotion: boolean
): WorkflowTheme {
  if (!reducedMotion) return theme
  
  return {
    ...theme,
    animation: {
      ...theme.animation,
      duration: 0,
      delay: 0,
      stagger: 0,
      hover: {
        ...theme.animation.hover,
        duration: 0
      },
      entrance: {
        from: { opacity: 1, y: 0, scale: 1 },
        to: { opacity: 1, y: 0, scale: 1 }
      },
      pulse: {
        scale: [1, 1, 1],
        opacity: [1, 1, 1],
        duration: 0
      },
      success: {
        scale: [1, 1, 1],
        rotate: [0, 0, 0],
        duration: 0
      }
    },
    accessibility: {
      ...theme.accessibility,
      reducedMotion: true
    }
  }
}

export function generateContrastSafeColors(
  foreground: string,
  background: string,
  targetRatio: number = 4.5
): { foreground: string; background: string } {
  // Implementation would include WCAG contrast calculation
  // This is a simplified placeholder
  return { foreground, background }
}

export function interpolateThemes(
  theme1: WorkflowTheme,
  theme2: WorkflowTheme,
  progress: number
): WorkflowTheme {
  // Implementation would blend two themes based on progress
  // Useful for transitions between workflow states
  return progress < 0.5 ? theme1 : theme2
}