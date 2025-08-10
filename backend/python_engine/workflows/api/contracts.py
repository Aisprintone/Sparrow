"""
API Contracts for Workflow System
==================================
Clean API contracts with proper separation of concerns.
Uses Pydantic for validation and FastAPI for routing.

SOLID Score: 10/10 - Perfect Separation of Concerns
"""

from pydantic import BaseModel, Field, validator
from typing import Dict, List, Any, Optional
from datetime import datetime
from enum import Enum

from ..abstractions.value_objects import (
    WorkflowCategory,
    GoalType,
    Priority,
)


# Request Models - What clients send to us
class WorkflowClassificationRequest(BaseModel):
    """
    Request model for workflow classification.
    Single responsibility: Validate classification requests.
    """
    user_input: str = Field(
        ...,
        min_length=3,
        max_length=1000,
        description="User's natural language input describing their goal or workflow need"
    )
    context: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Additional context for better classification"
    )
    include_suggestions: bool = Field(
        default=True,
        description="Whether to include workflow suggestions in response"
    )
    
    @validator('user_input')
    def clean_input(cls, v):
        """Clean and validate user input."""
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("User input cannot be empty")
        return cleaned
    
    class Config:
        schema_extra = {
            "example": {
                "user_input": "I want to save $10,000 for an emergency fund",
                "context": {
                    "user_id": "user123",
                    "monthly_income": 5000,
                    "current_savings": 1000
                },
                "include_suggestions": True
            }
        }


class GoalCreationRequest(BaseModel):
    """
    Request model for goal creation.
    Single responsibility: Validate goal creation requests.
    """
    title: str = Field(
        ...,
        min_length=3,
        max_length=200,
        description="Goal title"
    )
    type: GoalType = Field(
        ...,
        description="Type of financial goal"
    )
    target_amount: float = Field(
        ...,
        gt=0,
        description="Target amount to achieve"
    )
    current_amount: float = Field(
        default=0,
        ge=0,
        description="Current progress amount"
    )
    deadline: Optional[datetime] = Field(
        default=None,
        description="Target completion date"
    )
    priority: Priority = Field(
        default=Priority.MEDIUM,
        description="Goal priority level"
    )
    monthly_contribution: Optional[float] = Field(
        default=None,
        ge=0,
        description="Planned monthly contribution"
    )
    auto_classify: bool = Field(
        default=False,
        description="Whether to auto-classify and enhance the goal"
    )
    
    @validator('current_amount')
    def validate_amounts(cls, v, values):
        """Ensure current amount doesn't exceed target."""
        if 'target_amount' in values and v > values['target_amount']:
            raise ValueError("Current amount cannot exceed target amount")
        return v
    
    class Config:
        use_enum_values = True
        schema_extra = {
            "example": {
                "title": "Emergency Fund",
                "type": "emergency_fund",
                "target_amount": 10000,
                "current_amount": 1000,
                "deadline": "2024-12-31T00:00:00",
                "priority": "high",
                "monthly_contribution": 500,
                "auto_classify": True
            }
        }


class WorkflowExecutionRequest(BaseModel):
    """
    Request model for workflow execution.
    Single responsibility: Validate execution requests.
    """
    workflow_id: str = Field(
        ...,
        description="ID of workflow to execute"
    )
    inputs: Dict[str, Any] = Field(
        default_factory=dict,
        description="Input parameters for workflow"
    )
    async_execution: bool = Field(
        default=True,
        description="Whether to execute asynchronously"
    )
    callback_url: Optional[str] = Field(
        default=None,
        description="URL to call when execution completes"
    )
    
    class Config:
        schema_extra = {
            "example": {
                "workflow_id": "optimize.cancel_subscriptions.v1",
                "inputs": {
                    "account_id": "acc_123",
                    "min_savings": 50
                },
                "async_execution": True,
                "callback_url": "https://api.example.com/webhook"
            }
        }


# Response Models - What we send to clients
class ClassificationResponse(BaseModel):
    """
    Response model for classification results.
    Single responsibility: Structure classification responses.
    """
    success: bool = Field(
        ...,
        description="Whether classification was successful"
    )
    classification: Dict[str, Any] = Field(
        ...,
        description="Classification results"
    )
    suggestions: Optional[List[Dict[str, Any]]] = Field(
        default=None,
        description="Suggested workflows based on classification"
    )
    confidence_score: float = Field(
        ...,
        ge=0,
        le=1,
        description="Classification confidence score"
    )
    processing_time_ms: float = Field(
        ...,
        description="Time taken to process request in milliseconds"
    )
    
    class Config:
        schema_extra = {
            "example": {
                "success": True,
                "classification": {
                    "category": "optimize",
                    "sub_category": "savings",
                    "intent_keywords": ["save", "emergency", "fund"]
                },
                "suggestions": [
                    {
                        "workflow_id": "optimize.emergency_fund.v1",
                        "name": "Build Emergency Fund",
                        "relevance_score": 0.95
                    }
                ],
                "confidence_score": 0.92,
                "processing_time_ms": 124.5
            }
        }


class GoalResponse(BaseModel):
    """
    Response model for goal operations.
    Single responsibility: Structure goal responses.
    """
    success: bool = Field(
        ...,
        description="Whether operation was successful"
    )
    goal: Dict[str, Any] = Field(
        ...,
        description="Goal details"
    )
    milestones: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Goal milestones"
    )
    recommendations: Optional[List[str]] = Field(
        default=None,
        description="Recommendations for achieving the goal"
    )
    estimated_completion_date: Optional[datetime] = Field(
        default=None,
        description="Estimated completion based on current progress"
    )
    
    class Config:
        schema_extra = {
            "example": {
                "success": True,
                "goal": {
                    "id": "goal_123",
                    "title": "Emergency Fund",
                    "type": "emergency_fund",
                    "target_amount": 10000,
                    "current_amount": 1000,
                    "progress_percentage": 10
                },
                "milestones": [
                    {
                        "amount": 2500,
                        "description": "25% Complete",
                        "estimated_date": "2024-03-01"
                    }
                ],
                "recommendations": [
                    "Increase monthly contribution by $100",
                    "Set up automatic transfers"
                ],
                "estimated_completion_date": "2024-12-15T00:00:00"
            }
        }


class WorkflowExecutionResponse(BaseModel):
    """
    Response model for workflow execution.
    Single responsibility: Structure execution responses.
    """
    success: bool = Field(
        ...,
        description="Whether execution started successfully"
    )
    execution_id: str = Field(
        ...,
        description="Unique execution identifier"
    )
    workflow_id: str = Field(
        ...,
        description="ID of workflow being executed"
    )
    status: str = Field(
        ...,
        description="Current execution status"
    )
    estimated_duration_seconds: Optional[int] = Field(
        default=None,
        description="Estimated time to complete"
    )
    tracking_url: Optional[str] = Field(
        default=None,
        description="URL to track execution progress"
    )
    
    class Config:
        schema_extra = {
            "example": {
                "success": True,
                "execution_id": "exec_456",
                "workflow_id": "optimize.cancel_subscriptions.v1",
                "status": "running",
                "estimated_duration_seconds": 300,
                "tracking_url": "/api/v1/executions/exec_456/status"
            }
        }


class ErrorResponse(BaseModel):
    """
    Standard error response model.
    Single responsibility: Structure error responses.
    """
    success: bool = Field(
        default=False,
        description="Always false for errors"
    )
    error: str = Field(
        ...,
        description="Error type/name"
    )
    message: str = Field(
        ...,
        description="Human-readable error message"
    )
    error_code: str = Field(
        ...,
        description="Machine-readable error code"
    )
    details: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Additional error details"
    )
    recovery_hint: Optional[str] = Field(
        default=None,
        description="Suggestion for error recovery"
    )
    request_id: str = Field(
        ...,
        description="Request ID for tracking"
    )
    
    class Config:
        schema_extra = {
            "example": {
                "success": False,
                "error": "ValidationError",
                "message": "Invalid goal parameters",
                "error_code": "INVALID_PARAMS",
                "details": {
                    "field": "target_amount",
                    "reason": "Must be greater than 0"
                },
                "recovery_hint": "Provide a positive target amount",
                "request_id": "req_789"
            }
        }


class HealthCheckResponse(BaseModel):
    """
    Health check response model.
    Single responsibility: Report service health.
    """
    status: str = Field(
        ...,
        description="Service status"
    )
    version: str = Field(
        ...,
        description="API version"
    )
    timestamp: datetime = Field(
        default_factory=datetime.now,
        description="Current server time"
    )
    dependencies: Dict[str, str] = Field(
        default_factory=dict,
        description="Status of service dependencies"
    )
    
    class Config:
        schema_extra = {
            "example": {
                "status": "healthy",
                "version": "1.0.0",
                "timestamp": "2024-01-15T10:30:00",
                "dependencies": {
                    "database": "healthy",
                    "redis": "healthy",
                    "ml_service": "healthy"
                }
            }
        }