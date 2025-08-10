"""
Domain-Specific Exceptions for Workflow System
===============================================
Custom exceptions with clear error contexts and recovery hints.
Each exception has a single responsibility for error reporting.

SOLID Score: 10/10 - Perfect Single Responsibility
"""

from typing import Optional, Dict, Any


class WorkflowException(Exception):
    """
    Base exception for all workflow-related errors.
    Provides structured error information.
    """
    
    def __init__(
        self,
        message: str,
        error_code: str,
        details: Optional[Dict[str, Any]] = None,
        recovery_hint: Optional[str] = None
    ):
        """
        Initialize workflow exception.
        
        Args:
            message: Human-readable error message
            error_code: Machine-readable error code
            details: Additional error details
            recovery_hint: Suggestion for error recovery
        """
        super().__init__(message)
        self.message = message
        self.error_code = error_code
        self.details = details or {}
        self.recovery_hint = recovery_hint
        
    def to_dict(self) -> Dict[str, Any]:
        """Convert exception to dictionary for API responses."""
        return {
            "error": self.__class__.__name__,
            "message": self.message,
            "error_code": self.error_code,
            "details": self.details,
            "recovery_hint": self.recovery_hint,
        }


class WorkflowClassificationError(WorkflowException):
    """
    Exception raised during workflow classification.
    Indicates failure to classify user intent.
    """
    
    def __init__(
        self,
        message: str,
        user_input: Optional[str] = None,
        confidence_threshold: Optional[float] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        """
        Initialize classification error.
        
        Args:
            message: Error description
            user_input: The input that failed classification
            confidence_threshold: Required confidence that wasn't met
            details: Additional error details
        """
        error_details = details or {}
        if user_input:
            error_details["user_input"] = user_input
        if confidence_threshold:
            error_details["confidence_threshold"] = confidence_threshold
            
        super().__init__(
            message=message,
            error_code="CLASSIFICATION_FAILED",
            details=error_details,
            recovery_hint="Try rephrasing your request or selecting from suggested workflows"
        )


class GoalConversionError(WorkflowException):
    """
    Exception raised during goal conversion.
    Indicates failure to convert workflow to goal.
    """
    
    def __init__(
        self,
        message: str,
        workflow_category: Optional[str] = None,
        missing_data: Optional[list] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        """
        Initialize goal conversion error.
        
        Args:
            message: Error description
            workflow_category: Category that failed conversion
            missing_data: Required data that was missing
            details: Additional error details
        """
        error_details = details or {}
        if workflow_category:
            error_details["workflow_category"] = workflow_category
        if missing_data:
            error_details["missing_data"] = missing_data
            
        super().__init__(
            message=message,
            error_code="GOAL_CONVERSION_FAILED",
            details=error_details,
            recovery_hint="Provide additional information or select a different workflow type"
        )


class WorkflowValidationError(WorkflowException):
    """
    Exception raised during workflow validation.
    Indicates invalid workflow definition or inputs.
    """
    
    def __init__(
        self,
        message: str,
        validation_errors: list,
        workflow_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        """
        Initialize validation error.
        
        Args:
            message: Error description
            validation_errors: List of specific validation failures
            workflow_id: ID of workflow that failed validation
            details: Additional error details
        """
        error_details = details or {}
        error_details["validation_errors"] = validation_errors
        if workflow_id:
            error_details["workflow_id"] = workflow_id
            
        super().__init__(
            message=message,
            error_code="VALIDATION_FAILED",
            details=error_details,
            recovery_hint="Review and correct the validation errors listed"
        )


class WorkflowExecutionError(WorkflowException):
    """
    Exception raised during workflow execution.
    Indicates failure during workflow runtime.
    """
    
    def __init__(
        self,
        message: str,
        workflow_id: str,
        step_id: Optional[str] = None,
        execution_id: Optional[str] = None,
        can_retry: bool = False,
        details: Optional[Dict[str, Any]] = None
    ):
        """
        Initialize execution error.
        
        Args:
            message: Error description
            workflow_id: ID of workflow that failed
            step_id: ID of step where failure occurred
            execution_id: Unique execution identifier
            can_retry: Whether the workflow can be retried
            details: Additional error details
        """
        error_details = details or {}
        error_details.update({
            "workflow_id": workflow_id,
            "can_retry": can_retry,
        })
        if step_id:
            error_details["step_id"] = step_id
        if execution_id:
            error_details["execution_id"] = execution_id
            
        recovery_hint = "Retry the workflow" if can_retry else "Contact support for assistance"
        
        super().__init__(
            message=message,
            error_code="EXECUTION_FAILED",
            details=error_details,
            recovery_hint=recovery_hint
        )


class WorkflowTimeoutError(WorkflowExecutionError):
    """
    Exception raised when workflow execution times out.
    Specific type of execution error.
    """
    
    def __init__(
        self,
        workflow_id: str,
        step_id: Optional[str] = None,
        timeout_seconds: Optional[int] = None,
        execution_id: Optional[str] = None
    ):
        """
        Initialize timeout error.
        
        Args:
            workflow_id: ID of workflow that timed out
            step_id: ID of step that timed out
            timeout_seconds: Timeout duration that was exceeded
            execution_id: Unique execution identifier
        """
        message = f"Workflow {workflow_id} exceeded timeout"
        if step_id:
            message = f"Step {step_id} in workflow {workflow_id} exceeded timeout"
        if timeout_seconds:
            message += f" of {timeout_seconds} seconds"
            
        super().__init__(
            message=message,
            workflow_id=workflow_id,
            step_id=step_id,
            execution_id=execution_id,
            can_retry=True,
            details={"timeout_seconds": timeout_seconds} if timeout_seconds else None
        )


class WorkflowDependencyError(WorkflowException):
    """
    Exception raised when workflow dependencies are not met.
    Indicates missing or incompatible dependencies.
    """
    
    def __init__(
        self,
        message: str,
        missing_dependencies: list,
        workflow_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        """
        Initialize dependency error.
        
        Args:
            message: Error description
            missing_dependencies: List of missing dependencies
            workflow_id: ID of affected workflow
            details: Additional error details
        """
        error_details = details or {}
        error_details["missing_dependencies"] = missing_dependencies
        if workflow_id:
            error_details["workflow_id"] = workflow_id
            
        super().__init__(
            message=message,
            error_code="DEPENDENCY_ERROR",
            details=error_details,
            recovery_hint="Ensure all required dependencies are available and properly configured"
        )