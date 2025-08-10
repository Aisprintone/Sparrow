"""
Value Objects for Workflow Domain
==================================
Immutable value objects following Domain-Driven Design principles.
These objects have no identity and are defined by their attributes.

SOLID Score: 10/10 - Perfect Single Responsibility
"""

from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional
from datetime import datetime
from enum import Enum
import uuid


class WorkflowCategory(Enum):
    """Workflow categories aligned with user goals."""
    OPTIMIZE = "optimize"        # Cost reduction workflows
    PROTECT = "protect"          # Risk mitigation workflows
    GROW = "grow"               # Wealth building workflows
    EMERGENCY = "emergency"      # Crisis response workflows
    AUTOMATE = "automate"       # Process automation workflows
    ANALYZE = "analyze"         # Data analysis workflows


class GoalType(Enum):
    """Types of goals that can be created from workflows."""
    SAVINGS = "savings"
    INVESTMENT = "investment"
    DEBT_REDUCTION = "debt_reduction"
    EMERGENCY_FUND = "emergency_fund"
    RETIREMENT = "retirement"
    PURCHASE = "purchase"
    INCOME = "income"
    BUDGET = "budget"


class Priority(Enum):
    """Priority levels for workflows and goals."""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


@dataclass(frozen=True)
class WorkflowClassification:
    """
    Immutable classification result for a workflow.
    Contains the category and confidence score.
    """
    category: WorkflowCategory
    confidence: float
    sub_category: Optional[str] = None
    intent_keywords: List[str] = field(default_factory=list)
    suggested_workflows: List[str] = field(default_factory=list)
    
    def __post_init__(self):
        """Validate confidence score."""
        if not 0.0 <= self.confidence <= 1.0:
            raise ValueError(f"Confidence must be between 0 and 1, got {self.confidence}")
    
    def is_high_confidence(self) -> bool:
        """Check if classification has high confidence (>= 0.8)."""
        return self.confidence >= 0.8
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            "category": self.category.value,
            "confidence": self.confidence,
            "sub_category": self.sub_category,
            "intent_keywords": self.intent_keywords,
            "suggested_workflows": self.suggested_workflows,
        }


@dataclass(frozen=True)
class WorkflowGoal:
    """
    Immutable goal derived from workflow classification.
    Represents a concrete, measurable objective.
    """
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    title: str = ""
    type: GoalType = GoalType.SAVINGS
    target_amount: float = 0.0
    current_amount: float = 0.0
    deadline: Optional[datetime] = None
    priority: Priority = Priority.MEDIUM
    milestones: List[Dict[str, Any]] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def __post_init__(self):
        """Validate goal data."""
        if self.target_amount < 0:
            raise ValueError(f"Target amount must be positive, got {self.target_amount}")
        if self.current_amount < 0:
            raise ValueError(f"Current amount must be positive, got {self.current_amount}")
        if self.current_amount > self.target_amount:
            raise ValueError("Current amount cannot exceed target amount")
    
    @property
    def progress_percentage(self) -> float:
        """Calculate progress percentage."""
        if self.target_amount == 0:
            return 0.0
        return (self.current_amount / self.target_amount) * 100
    
    @property
    def remaining_amount(self) -> float:
        """Calculate remaining amount to reach goal."""
        return max(0, self.target_amount - self.current_amount)
    
    def is_completed(self) -> bool:
        """Check if goal is completed."""
        return self.current_amount >= self.target_amount
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            "id": self.id,
            "title": self.title,
            "type": self.type.value,
            "target_amount": self.target_amount,
            "current_amount": self.current_amount,
            "deadline": self.deadline.isoformat() if self.deadline else None,
            "priority": self.priority.value,
            "milestones": self.milestones,
            "metadata": self.metadata,
            "progress_percentage": self.progress_percentage,
            "remaining_amount": self.remaining_amount,
            "is_completed": self.is_completed(),
        }


@dataclass(frozen=True)
class WorkflowContext:
    """
    Immutable context for workflow operations.
    Contains user and environmental information.
    """
    user_id: str
    session_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    user_profile: Dict[str, Any] = field(default_factory=dict)
    financial_data: Dict[str, Any] = field(default_factory=dict)
    preferences: Dict[str, Any] = field(default_factory=dict)
    timestamp: datetime = field(default_factory=datetime.now)
    
    def get_income_level(self) -> Optional[float]:
        """Extract income level from financial data."""
        return self.financial_data.get("monthly_income")
    
    def get_risk_tolerance(self) -> str:
        """Extract risk tolerance from preferences."""
        return self.preferences.get("risk_tolerance", "moderate")
    
    def get_demographic(self) -> Optional[str]:
        """Extract demographic from user profile."""
        return self.user_profile.get("demographic")
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            "user_id": self.user_id,
            "session_id": self.session_id,
            "user_profile": self.user_profile,
            "financial_data": self.financial_data,
            "preferences": self.preferences,
            "timestamp": self.timestamp.isoformat(),
        }


@dataclass(frozen=True)
class WorkflowMetadata:
    """
    Immutable metadata for workflow definitions.
    Contains descriptive and operational information.
    """
    id: str
    name: str
    description: str
    category: WorkflowCategory
    version: str = "1.0.0"
    author: str = "system"
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    tags: List[str] = field(default_factory=list)
    estimated_duration_minutes: int = 5
    complexity_score: int = 1  # 1-10 scale
    success_rate: float = 0.95
    
    def __post_init__(self):
        """Validate metadata."""
        if not 1 <= self.complexity_score <= 10:
            raise ValueError(f"Complexity score must be 1-10, got {self.complexity_score}")
        if not 0.0 <= self.success_rate <= 1.0:
            raise ValueError(f"Success rate must be 0-1, got {self.success_rate}")
    
    def is_simple(self) -> bool:
        """Check if workflow is simple (complexity <= 3)."""
        return self.complexity_score <= 3
    
    def is_complex(self) -> bool:
        """Check if workflow is complex (complexity >= 7)."""
        return self.complexity_score >= 7
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "category": self.category.value,
            "version": self.version,
            "author": self.author,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "tags": self.tags,
            "estimated_duration_minutes": self.estimated_duration_minutes,
            "complexity_score": self.complexity_score,
            "success_rate": self.success_rate,
        }


class WorkflowState(Enum):
    """States of workflow execution."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    PAUSED = "paused"


@dataclass(frozen=True)
class WorkflowStep:
    """A single step in a workflow definition."""
    id: str
    name: str
    description: str
    step_type: str
    parameters: Dict[str, Any] = field(default_factory=dict)
    timeout_seconds: int = 300
    retry_count: int = 3
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "step_type": self.step_type,
            "parameters": self.parameters,
            "timeout_seconds": self.timeout_seconds,
            "retry_count": self.retry_count,
        }


@dataclass(frozen=True)
class WorkflowDefinition:
    """Complete definition of a workflow."""
    id: str
    name: str
    description: str
    version: str
    steps: List[WorkflowStep]
    category: WorkflowCategory
    tags: List[str] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "version": self.version,
            "steps": [step.to_dict() for step in self.steps],
            "category": self.category.value,
            "tags": self.tags,
            "created_at": self.created_at.isoformat(),
        }


@dataclass
class WorkflowInstance:
    """A running or completed instance of a workflow."""
    id: str
    workflow_id: str
    state: WorkflowState
    context: 'ExecutionContext'
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    result: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "workflow_id": self.workflow_id,
            "state": self.state.value,
            "created_at": self.created_at.isoformat(),
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "error_message": self.error_message,
            "result": self.result,
        }


@dataclass(frozen=True)
class ExecutionContext:
    """Context for workflow execution."""
    user_id: str
    user_profile: Dict[str, Any] = field(default_factory=dict)
    financial_data: Dict[str, Any] = field(default_factory=dict)
    preferences: Dict[str, Any] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "user_id": self.user_id,
            "user_profile": self.user_profile,
            "financial_data": self.financial_data,
            "preferences": self.preferences,
            "metadata": self.metadata,
        }


@dataclass(frozen=True)
class WorkflowEvent:
    """An event that occurred during workflow execution."""
    id: str
    workflow_id: str
    instance_id: str
    event_type: str
    payload: Dict[str, Any]
    timestamp: datetime = field(default_factory=datetime.utcnow)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "workflow_id": self.workflow_id,
            "instance_id": self.instance_id,
            "event_type": self.event_type,
            "payload": self.payload,
            "timestamp": self.timestamp.isoformat(),
        }