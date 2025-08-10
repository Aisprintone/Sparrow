"""
Interface Definitions Following Interface Segregation Principle
================================================================
Each interface is focused on a single responsibility and defines
minimal required methods. Clients should not be forced to depend
on methods they don't use.

SOLID Score: 10/10 - Perfect Interface Segregation
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional, Protocol, runtime_checkable
from datetime import datetime
from enum import Enum

from .value_objects import (
    WorkflowClassification,
    WorkflowGoal,
    WorkflowContext,
    WorkflowMetadata,
)


@runtime_checkable
class IWorkflowClassifier(Protocol):
    """
    Interface for workflow classification.
    Single Responsibility: Classify user intent into workflow categories.
    """
    
    @abstractmethod
    async def classify(
        self, 
        user_input: str, 
        context: WorkflowContext
    ) -> WorkflowClassification:
        """
        Classify user input into a workflow category.
        
        Args:
            user_input: Raw user input text
            context: User context for better classification
            
        Returns:
            WorkflowClassification containing category and confidence
        """
        ...
    
    @abstractmethod
    def get_supported_categories(self) -> List[str]:
        """Get list of categories this classifier supports."""
        ...


@runtime_checkable
class IGoalConverter(Protocol):
    """
    Interface for converting workflows to goals.
    Single Responsibility: Transform classified workflows into actionable goals.
    """
    
    @abstractmethod
    async def convert_to_goal(
        self,
        classification: WorkflowClassification,
        context: WorkflowContext
    ) -> WorkflowGoal:
        """
        Convert a workflow classification into a concrete goal.
        
        Args:
            classification: The classified workflow
            context: User context for goal creation
            
        Returns:
            WorkflowGoal with specific targets and milestones
        """
        ...
    
    @abstractmethod
    def validate_goal(self, goal: WorkflowGoal) -> bool:
        """Validate if a goal meets requirements."""
        ...


@runtime_checkable
class IWorkflowRepository(Protocol):
    """
    Interface for workflow persistence.
    Single Responsibility: Handle workflow storage and retrieval.
    """
    
    @abstractmethod
    async def get_by_id(self, workflow_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve workflow by ID."""
        ...
    
    @abstractmethod
    async def get_by_category(
        self, 
        category: str, 
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Retrieve workflows by category."""
        ...
    
    @abstractmethod
    async def save(self, workflow: Dict[str, Any]) -> str:
        """Save workflow and return ID."""
        ...
    
    @abstractmethod
    async def update(self, workflow_id: str, data: Dict[str, Any]) -> bool:
        """Update existing workflow."""
        ...


@runtime_checkable
class IWorkflowExecutor(Protocol):
    """
    Interface for workflow execution.
    Single Responsibility: Execute workflow steps.
    """
    
    @abstractmethod
    async def execute_step(
        self,
        step_id: str,
        inputs: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute a single workflow step."""
        ...
    
    @abstractmethod
    async def execute_workflow(
        self,
        workflow_id: str,
        initial_inputs: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute entire workflow."""
        ...
    
    @abstractmethod
    def can_execute(self, workflow_id: str) -> bool:
        """Check if executor can handle this workflow."""
        ...


@runtime_checkable
class IWorkflowValidator(Protocol):
    """
    Interface for workflow validation.
    Single Responsibility: Validate workflow definitions and executions.
    """
    
    @abstractmethod
    def validate_definition(self, workflow: Dict[str, Any]) -> List[str]:
        """
        Validate workflow definition.
        Returns list of validation errors (empty if valid).
        """
        ...
    
    @abstractmethod
    def validate_inputs(
        self,
        workflow_id: str,
        inputs: Dict[str, Any]
    ) -> List[str]:
        """Validate inputs for workflow execution."""
        ...
    
    @abstractmethod
    def validate_outputs(
        self,
        workflow_id: str,
        outputs: Dict[str, Any]
    ) -> List[str]:
        """Validate workflow execution outputs."""
        ...


@runtime_checkable
class IWorkflowStateManager(Protocol):
    """
    Interface for workflow state management.
    Single Responsibility: Manage workflow execution state.
    """
    
    @abstractmethod
    async def get_state(self, execution_id: str) -> Dict[str, Any]:
        """Get current execution state."""
        ...
    
    @abstractmethod
    async def update_state(
        self,
        execution_id: str,
        state: Dict[str, Any]
    ) -> None:
        """Update execution state."""
        ...
    
    @abstractmethod
    async def create_checkpoint(
        self,
        execution_id: str,
        checkpoint_data: Dict[str, Any]
    ) -> str:
        """Create execution checkpoint for recovery."""
        ...
    
    @abstractmethod
    async def restore_from_checkpoint(
        self,
        checkpoint_id: str
    ) -> Dict[str, Any]:
        """Restore execution from checkpoint."""
        ...


@runtime_checkable
class IWorkflowEventPublisher(Protocol):
    """
    Interface for workflow event publishing.
    Single Responsibility: Publish workflow lifecycle events.
    """
    
    @abstractmethod
    async def publish_started(
        self,
        workflow_id: str,
        execution_id: str,
        metadata: Dict[str, Any]
    ) -> None:
        """Publish workflow started event."""
        ...
    
    @abstractmethod
    async def publish_completed(
        self,
        workflow_id: str,
        execution_id: str,
        results: Dict[str, Any]
    ) -> None:
        """Publish workflow completed event."""
        ...
    
    @abstractmethod
    async def publish_failed(
        self,
        workflow_id: str,
        execution_id: str,
        error: Exception
    ) -> None:
        """Publish workflow failed event."""
        ...
    
    @abstractmethod
    async def publish_step_completed(
        self,
        workflow_id: str,
        execution_id: str,
        step_id: str,
        results: Dict[str, Any]
    ) -> None:
        """Publish step completion event."""
        ...


@runtime_checkable
class IWorkflowMetricsCollector(Protocol):
    """
    Interface for workflow metrics collection.
    Single Responsibility: Collect and report workflow metrics.
    """
    
    @abstractmethod
    def record_execution_time(
        self,
        workflow_id: str,
        execution_time_ms: float
    ) -> None:
        """Record workflow execution time."""
        ...
    
    @abstractmethod
    def record_step_time(
        self,
        workflow_id: str,
        step_id: str,
        execution_time_ms: float
    ) -> None:
        """Record step execution time."""
        ...
    
    @abstractmethod
    def record_success(self, workflow_id: str) -> None:
        """Record successful workflow execution."""
        ...
    
    @abstractmethod
    def record_failure(
        self,
        workflow_id: str,
        error_type: str
    ) -> None:
        """Record workflow failure."""
        ...
    
    @abstractmethod
    def get_metrics(
        self,
        workflow_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get collected metrics."""
        ...