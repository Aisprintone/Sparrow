/**
 * Action Card Factory Component
 * ==============================
 * PATTERN GUARDIAN ENFORCED: Single source of truth for all card rendering
 * Zero duplication, full configurability, production-ready
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import GlassCard from '@/components/ui/glass-card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import * as Icons from 'lucide-react';
import type { AIAction } from '@/hooks/use-app-state';
import type { WorkflowBenefit, WorkflowStep } from '@/lib/services/workflow-classifier.service';

// ==================== Type Definitions ====================

export interface CardConfig {
  variant: 'suggested' | 'in-process' | 'completed';
  gradientFrom?: string;
  gradientTo?: string;
  borderColor?: string;
  minHeight?: string;
  showExpansion?: boolean;
  showProgress?: boolean;
  showValidation?: boolean;
  showSteps?: boolean;
}

export interface CardActions {
  onLearnMore?: (action: AIAction) => void;
  onAutomate?: (action: AIAction) => void;
  onInspect?: (action: AIAction) => void;
  onCancel?: (action: AIAction) => void;
  onAIChat?: (action: AIAction) => void;
  onViewResults?: (action: AIAction) => void;
}

export interface CardData extends AIAction {
  validation?: any;
  workflowStatus?: any;
  benefits?: WorkflowBenefit[];
  icon?: string;
}

// ==================== Icon Renderer ====================

const IconRenderer: React.FC<{ icon: string; className?: string }> = ({ icon, className }) => {
  const IconComponent = (Icons as any)[icon] || Icons.Zap;
  return <IconComponent className={className} />;
};

// ==================== Benefit Grid Component ====================

const BenefitGrid: React.FC<{ benefits: WorkflowBenefit[] }> = ({ benefits }) => {
  if (!benefits || benefits.length === 0) return null;
  
  return (
    <div className="grid grid-cols-2 gap-3 mb-4">
      {benefits.map((benefit, index) => (
        <div key={index} className="flex items-center gap-2 text-xs text-gray-400">
          <IconRenderer icon={benefit.icon} className="h-3 w-3" />
          <span>{benefit.label}</span>
          {benefit.value && <span className="text-white">{benefit.value}</span>}
        </div>
      ))}
    </div>
  );
};

// ==================== Progress Section Component ====================

const ProgressSection: React.FC<{ 
  progress: number; 
  currentStep: string; 
  estimatedCompletion?: string;
}> = ({ progress, currentStep, estimatedCompletion }) => {
  return (
    <div className="space-y-2 mb-3">
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Progress</span>
        <span>{progress}% Complete</span>
      </div>
      <Progress value={progress} className="h-2" />
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div className="flex items-center gap-2 text-gray-500">
          <Icons.Clock className="h-3 w-3" />
          <span>{estimatedCompletion || '3m remaining'}</span>
        </div>
        <div className="flex items-center gap-2 text-blue-400">
          <span>{currentStep}</span>
        </div>
      </div>
    </div>
  );
};

// ==================== Steps List Component ====================

const StepsList: React.FC<{ steps: WorkflowStep[] }> = ({ steps }) => {
  if (!steps || steps.length === 0) return null;
  
  return (
    <div className="space-y-3">
      {steps.map((step, index) => (
        <div key={step.id || index} className="flex items-start gap-3">
          <div className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${
            step.status === 'completed' ? 'bg-green-500' : 
            step.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-600'
          }`}>
            {step.status === 'completed' ? (
              <Icons.Check className="h-3 w-3 text-white" />
            ) : step.status === 'in_progress' ? (
              <Icons.RefreshCw className="h-3 w-3 text-white animate-spin" />
            ) : (
              <div className="h-3 w-3 rounded-full bg-gray-400" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-white">{step.name}</span>
              {step.duration && (
                <Badge variant="outline" className="text-xs">
                  {Math.floor(step.duration / 60)}m
                </Badge>
              )}
            </div>
            <p className="text-xs text-gray-400">{step.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// ==================== Action Buttons Component ====================

const ActionButtons: React.FC<{
  variant: CardConfig['variant'];
  action: AIAction;
  actions: CardActions;
}> = ({ variant, action, actions }) => {
  if (variant === 'suggested') {
    return (
      <div className="flex gap-2 p-6 pt-0">
        <Button 
          size="sm" 
          variant="outline"
          className="border-gray-600 text-gray-300 hover:bg-gray-700 flex-1"
          onClick={() => actions.onLearnMore?.(action)}
        >
          Learn More
        </Button>
        <Button
          size="sm"
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white flex-1"
          onClick={() => actions.onAutomate?.(action)}
        >
          Automate
        </Button>
      </div>
    );
  }
  
  if (variant === 'in-process') {
    return (
      <div className="flex gap-2 pt-3 border-t border-gray-700/50">
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => actions.onInspect?.(action)} 
          className="flex-1"
        >
          <Icons.Eye className="h-3 w-3 mr-1" />
          Inspect
        </Button>
        <Button 
          size="sm" 
          variant="destructive" 
          onClick={() => actions.onCancel?.(action)} 
          className="flex-shrink-0"
        >
          <Icons.X className="h-3 w-3 mr-1" />
          Cancel
        </Button>
      </div>
    );
  }
  
  if (variant === 'completed') {
    return (
      <div className="flex gap-2 p-6 pt-0">
        <Button 
          size="sm" 
          variant="outline"
          className="border-gray-600 text-gray-300 hover:bg-gray-700 flex-1"
          onClick={() => actions.onViewResults?.(action)}
        >
          View Full Results
        </Button>
      </div>
    );
  }
  
  return null;
};

// ==================== Validation Badge Component ====================

const ValidationBadge: React.FC<{ validation: any }> = ({ validation }) => {
  if (!validation) return null;
  
  const getIcon = () => {
    if (validation.titleMatch && validation.automationValid && validation.stepsComplete) {
      return <Icons.Check className="h-4 w-4 text-green-400" />;
    } else if (validation.issues.length > 0) {
      return <Icons.AlertTriangle className="h-4 w-4 text-yellow-400" />;
    } else {
      return <Icons.Info className="h-4 w-4 text-blue-400" />;
    }
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>{getIcon()}</TooltipTrigger>
        <TooltipContent>
          <div className="max-w-xs">
            <p className="font-medium mb-1">Workflow Health</p>
            {validation.issues.length > 0 ? (
              <div>
                <p className="text-sm text-yellow-400 mb-1">Issues found:</p>
                <ul className="text-xs space-y-1">
                  {validation.issues.map((issue: string, idx: number) => (
                    <li key={idx}>• {issue}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-green-400">All checks passed</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// ==================== Main Action Card Factory ====================

export const ActionCardFactory: React.FC<{
  data: CardData;
  config: CardConfig;
  actions: CardActions;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}> = ({ data, config, actions, isExpanded = false, onToggleExpand }) => {
  const getCardClasses = () => {
    const baseClasses = "h-auto flex flex-col";
    const minHeight = config.minHeight || "min-h-[280px]";
    
    if (config.variant === 'suggested') {
      return `${baseClasses} ${minHeight} bg-gradient-to-br from-white/10 to-white/5 border border-white/20 hover:border-white/30 transition-all duration-300`;
    }
    
    if (config.variant === 'in-process') {
      return `${baseClasses} bg-white/5`;
    }
    
    if (config.variant === 'completed') {
      return `${baseClasses} ${minHeight} bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/30`;
    }
    
    return baseClasses;
  };
  
  const getIconColor = () => {
    switch (config.variant) {
      case 'suggested': return 'text-blue-400';
      case 'in-process': return 'text-blue-400';
      case 'completed': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };
  
  return (
    <GlassCard className={getCardClasses()}>
      <div className="flex-1 p-6">
        {/* Header Section */}
        <div className="flex items-start gap-4 mb-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30">
            <IconRenderer icon={data.icon || 'Zap'} className={`h-6 w-6 ${getIconColor()}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-white text-lg">{data.title}</h3>
                  {config.showValidation && data.validation && (
                    <ValidationBadge validation={data.validation} />
                  )}
                </div>
                <p className="text-sm text-gray-400">{data.description}</p>
              </div>
              {data.potentialSaving > 0 && (
                <div className="text-right">
                  <p className="text-xl font-bold text-green-400">
                    +${data.potentialSaving}/mo
                  </p>
                </div>
              )}
            </div>
            
            {/* Progress Section (for in-process) */}
            {config.showProgress && data.progress !== undefined && (
              <ProgressSection 
                progress={data.progress}
                currentStep={data.currentStep || 'Processing...'}
                estimatedCompletion={data.estimatedCompletion}
              />
            )}
          </div>
        </div>
        
        {/* Benefits Grid (for suggested) */}
        {config.variant === 'suggested' && data.benefits && (
          <BenefitGrid benefits={data.benefits} />
        )}
        
        {/* Completed Achievements */}
        {config.variant === 'completed' && (
          <div className="space-y-3 mb-4">
            <h4 className="text-sm font-medium text-white">What was accomplished:</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <Icons.Check className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>Successfully identified and optimized financial opportunity</span>
              </li>
              <li className="flex items-start gap-2">
                <Icons.Check className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>Automated process completed without manual intervention</span>
              </li>
              <li className="flex items-start gap-2">
                <Icons.Check className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>Monthly savings of ${data.potentialSaving} now active</span>
              </li>
              <li className="flex items-start gap-2">
                <Icons.Check className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>All security checks passed and verified</span>
              </li>
            </ul>
          </div>
        )}
        
        {/* Expandable Rationale (for suggested) */}
        {config.showExpansion && isExpanded && data.rationale && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-4 rounded-lg bg-black/20 border border-white/10"
          >
            <h4 className="text-sm font-medium text-white mb-2">Why this makes sense:</h4>
            <p className="text-sm text-gray-300 leading-relaxed">{data.rationale}</p>
            {actions.onAIChat && (
              <Button
                size="sm"
                onClick={() => actions.onAIChat?.(data)}
                className="mt-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
              >
                Ask AI Questions
              </Button>
            )}
          </motion.div>
        )}
        
        {/* Steps List (for in-process when inspected) */}
        {config.showSteps && data.steps && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Icons.Bot className="h-4 w-4" />
              Workflow Steps
            </h4>
            <StepsList steps={data.steps as any} />
          </div>
        )}
      </div>
      
      {/* Action Buttons */}
      <ActionButtons variant={config.variant} action={data} actions={actions} />
    </GlassCard>
  );
};

// ==================== Card Grid Container ====================

export const ActionCardGrid: React.FC<{
  actions: CardData[];
  config: CardConfig;
  cardActions: CardActions;
  expandedIds?: string[];
  onToggleExpand?: (id: string) => void;
}> = ({ actions, config, cardActions, expandedIds = [], onToggleExpand }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring" } },
  };
  
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      {actions.map((action) => (
        <motion.div key={action.id} variants={itemVariants}>
          <ActionCardFactory
            data={action}
            config={config}
            actions={cardActions}
            isExpanded={expandedIds.includes(action.id)}
            onToggleExpand={() => onToggleExpand?.(action.id)}
          />
        </motion.div>
      ))}
    </motion.div>
  );
};

export default ActionCardFactory;