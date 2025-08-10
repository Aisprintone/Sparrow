"""
Workflow Abstractions Module
============================
This module defines abstract base classes and interfaces following SOLID principles.
Each interface has a single, clear responsibility.

Architectural Principles:
- Single Responsibility: Each interface has one reason to change
- Open/Closed: Interfaces are open for extension via inheritance
- Liskov Substitution: All implementations must be substitutable
- Interface Segregation: Fine-grained interfaces for specific needs
- Dependency Inversion: Depend on abstractions, not concretions
"""

from .interfaces import (
    IWorkflowClassifier,
    IGoalConverter,
    IWorkflowRepository,
    IWorkflowExecutor,
    IWorkflowValidator,
    IWorkflowStateManager,
    IWorkflowEventPublisher,
    IWorkflowMetricsCollector,
)

from .base_classes import (
    AbstractWorkflow,
    AbstractWorkflowStep,
    AbstractWorkflowClassificationEngine,
    AbstractGoalDifferentiator,
    AbstractWorkflowFactory,
)

from .value_objects import (
    WorkflowClassification,
    WorkflowGoal,
    WorkflowContext,
    WorkflowMetadata,
)

from .exceptions import (
    WorkflowClassificationError,
    GoalConversionError,
    WorkflowValidationError,
    WorkflowExecutionError,
)

__all__ = [
    # Interfaces
    'IWorkflowClassifier',
    'IGoalConverter',
    'IWorkflowRepository',
    'IWorkflowExecutor',
    'IWorkflowValidator',
    'IWorkflowStateManager',
    'IWorkflowEventPublisher',
    'IWorkflowMetricsCollector',
    
    # Base Classes
    'AbstractWorkflow',
    'AbstractWorkflowStep',
    'AbstractWorkflowClassificationEngine',
    'AbstractGoalDifferentiator',
    'AbstractWorkflowFactory',
    
    # Value Objects
    'WorkflowClassification',
    'WorkflowGoal',
    'WorkflowContext',
    'WorkflowMetadata',
    
    # Exceptions
    'WorkflowClassificationError',
    'GoalConversionError',
    'WorkflowValidationError',
    'WorkflowExecutionError',
]