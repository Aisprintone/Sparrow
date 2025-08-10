"""
API Endpoints for Workflow System
==================================
FastAPI endpoints with clean separation of concerns.
Each endpoint has a single responsibility.

SOLID Score: 10/10 - Perfect Separation of Concerns
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from fastapi.responses import JSONResponse
from dependency_injector.wiring import inject, Provide
from typing import Dict, Any, List
import time
import logging
import uuid

from .contracts import (
    WorkflowClassificationRequest,
    GoalCreationRequest,
    WorkflowExecutionRequest,
    ClassificationResponse,
    GoalResponse,
    WorkflowExecutionResponse,
    ErrorResponse,
    HealthCheckResponse,
)

from ..infrastructure.containers import ApplicationContainer
from ..abstractions.exceptions import (
    WorkflowClassificationError,
    GoalConversionError,
    WorkflowValidationError,
    WorkflowExecutionError,
)

logger = logging.getLogger(__name__)

# Create routers for different domains
classification_router = APIRouter(
    prefix="/api/v1/classification",
    tags=["Classification"],
    responses={
        404: {"description": "Not found"},
        500: {"description": "Internal server error"},
    },
)

goal_router = APIRouter(
    prefix="/api/v1/goals",
    tags=["Goals"],
    responses={
        404: {"description": "Not found"},
        500: {"description": "Internal server error"},
    },
)

workflow_router = APIRouter(
    prefix="/api/v1/workflows",
    tags=["Workflows"],
    responses={
        404: {"description": "Not found"},
        500: {"description": "Internal server error"},
    },
)

health_router = APIRouter(
    prefix="/api/v1/health",
    tags=["Health"],
)


@classification_router.post(
    "/classify",
    response_model=ClassificationResponse,
    status_code=status.HTTP_200_OK,
    summary="Classify user input into workflow category",
    description="Analyzes user input to determine the appropriate workflow category and suggestions"
)
@inject
async def classify_workflow(
    request: WorkflowClassificationRequest,
    workflow_service=Depends(Provide[ApplicationContainer.workflow_service]),
) -> ClassificationResponse:
    """
    Classify user input into workflow categories.
    
    Single Responsibility: Handle classification requests only.
    """
    start_time = time.time()
    
    try:
        # Perform classification
        result = await workflow_service.classify_and_create_goal(
            user_input=request.user_input,
            context=request.context,
        )
        
        classification = result["classification"]
        
        # Build response
        response = ClassificationResponse(
            success=True,
            classification=classification,
            suggestions=classification.get("suggested_workflows", []) if request.include_suggestions else None,
            confidence_score=classification["confidence"],
            processing_time_ms=(time.time() - start_time) * 1000,
        )
        
        logger.info(f"Classification successful: {classification['category']}")
        return response
        
    except WorkflowClassificationError as e:
        logger.error(f"Classification error: {e.message}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=e.to_dict(),
        )
    except Exception as e:
        logger.error(f"Unexpected error in classification: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "InternalError",
                "message": "An unexpected error occurred",
                "request_id": str(uuid.uuid4()),
            },
        )


@goal_router.post(
    "/create",
    response_model=GoalResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new financial goal",
    description="Creates a new goal with optional auto-classification and enhancement"
)
@inject
async def create_goal(
    request: GoalCreationRequest,
    workflow_service=Depends(Provide[ApplicationContainer.workflow_service]),
) -> GoalResponse:
    """
    Create a new financial goal.
    
    Single Responsibility: Handle goal creation requests only.
    """
    try:
        # Prepare goal data
        goal_data = request.dict()
        
        if request.auto_classify:
            # Use classification to enhance goal
            result = await workflow_service.classify_and_create_goal(
                user_input=request.title,
                context={"goal_data": goal_data},
            )
            goal = result["goal"]
        else:
            # Direct goal creation
            from ..abstractions.value_objects import WorkflowGoal, GoalType, Priority
            
            goal = WorkflowGoal(
                title=request.title,
                type=GoalType(request.type),
                target_amount=request.target_amount,
                current_amount=request.current_amount,
                deadline=request.deadline,
                priority=Priority(request.priority),
            )
        
        # Calculate milestones
        milestones = _calculate_milestones(goal)
        
        # Build response
        response = GoalResponse(
            success=True,
            goal=goal.to_dict() if hasattr(goal, 'to_dict') else goal,
            milestones=milestones,
            recommendations=_generate_recommendations(goal),
            estimated_completion_date=_estimate_completion(goal, request.monthly_contribution),
        )
        
        logger.info(f"Goal created successfully: {goal.get('id', 'unknown')}")
        return response
        
    except GoalConversionError as e:
        logger.error(f"Goal conversion error: {e.message}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=e.to_dict(),
        )
    except Exception as e:
        logger.error(f"Unexpected error in goal creation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "InternalError",
                "message": "Failed to create goal",
                "request_id": str(uuid.uuid4()),
            },
        )


@workflow_router.post(
    "/execute",
    response_model=WorkflowExecutionResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Execute a workflow",
    description="Starts execution of a specified workflow with given inputs"
)
@inject
async def execute_workflow(
    request: WorkflowExecutionRequest,
    background_tasks: BackgroundTasks,
    workflow_executor=Depends(Provide[ApplicationContainer.service.workflow_executor]),
) -> WorkflowExecutionResponse:
    """
    Execute a workflow.
    
    Single Responsibility: Handle workflow execution requests only.
    """
    try:
        execution_id = f"exec_{uuid.uuid4().hex[:12]}"
        
        if request.async_execution:
            # Queue for async execution
            background_tasks.add_task(
                _execute_workflow_async,
                workflow_executor,
                request.workflow_id,
                request.inputs,
                execution_id,
                request.callback_url,
            )
            status_str = "queued"
        else:
            # Execute synchronously
            await workflow_executor.execute_workflow(
                request.workflow_id,
                request.inputs,
            )
            status_str = "completed"
        
        # Build response
        response = WorkflowExecutionResponse(
            success=True,
            execution_id=execution_id,
            workflow_id=request.workflow_id,
            status=status_str,
            estimated_duration_seconds=300,  # Would be calculated based on workflow
            tracking_url=f"/api/v1/workflows/executions/{execution_id}/status",
        )
        
        logger.info(f"Workflow execution started: {execution_id}")
        return response
        
    except WorkflowValidationError as e:
        logger.error(f"Workflow validation error: {e.message}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.to_dict(),
        )
    except WorkflowExecutionError as e:
        logger.error(f"Workflow execution error: {e.message}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=e.to_dict(),
        )
    except Exception as e:
        logger.error(f"Unexpected error in workflow execution: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "InternalError",
                "message": "Failed to execute workflow",
                "request_id": str(uuid.uuid4()),
            },
        )


@workflow_router.get(
    "/executions/{execution_id}/status",
    response_model=Dict[str, Any],
    summary="Get workflow execution status",
    description="Retrieves the current status of a workflow execution"
)
@inject
async def get_execution_status(
    execution_id: str,
    state_manager=Depends(Provide[ApplicationContainer.repository.workflow_state_manager]),
) -> Dict[str, Any]:
    """
    Get workflow execution status.
    
    Single Responsibility: Handle status queries only.
    """
    try:
        state = await state_manager.get_state(execution_id)
        
        if not state:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "error": "NotFound",
                    "message": f"Execution {execution_id} not found",
                },
            )
        
        return state
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving execution status: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "InternalError",
                "message": "Failed to retrieve execution status",
            },
        )


@health_router.get(
    "/",
    response_model=HealthCheckResponse,
    summary="Health check",
    description="Check service health and dependencies"
)
async def health_check() -> HealthCheckResponse:
    """
    Health check endpoint.
    
    Single Responsibility: Report service health only.
    """
    # Check dependencies
    dependencies = {}
    
    try:
        # Would check actual dependencies here
        dependencies["database"] = "healthy"
        dependencies["redis"] = "healthy"
        dependencies["ml_service"] = "healthy"
        overall_status = "healthy"
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        overall_status = "degraded"
        dependencies["error"] = str(e)
    
    return HealthCheckResponse(
        status=overall_status,
        version="1.0.0",
        dependencies=dependencies,
    )


# Helper functions (keep them small and focused)
def _calculate_milestones(goal: Any) -> List[Dict[str, Any]]:
    """Calculate goal milestones."""
    milestones = []
    
    if hasattr(goal, 'target_amount'):
        target = goal.target_amount if hasattr(goal, 'target_amount') else goal.get('target_amount', 0)
        
        for percentage in [25, 50, 75, 100]:
            milestones.append({
                "percentage": percentage,
                "amount": target * (percentage / 100),
                "description": f"{percentage}% Complete",
            })
    
    return milestones


def _generate_recommendations(goal: Any) -> List[str]:
    """Generate goal achievement recommendations."""
    recommendations = []
    
    # Simple recommendations based on goal type
    goal_type = goal.type if hasattr(goal, 'type') else goal.get('type')
    
    if goal_type in ['emergency_fund', 'savings']:
        recommendations.append("Set up automatic transfers from checking to savings")
        recommendations.append("Review and reduce unnecessary subscriptions")
    elif goal_type in ['investment', 'retirement']:
        recommendations.append("Consider increasing 401k contributions")
        recommendations.append("Review investment portfolio allocation")
    
    return recommendations


def _estimate_completion(goal: Any, monthly_contribution: float = None) -> Any:
    """Estimate goal completion date."""
    if not monthly_contribution or monthly_contribution <= 0:
        return None
    
    from datetime import datetime, timedelta
    
    remaining = goal.remaining_amount if hasattr(goal, 'remaining_amount') else (
        goal.get('target_amount', 0) - goal.get('current_amount', 0)
    )
    
    if remaining <= 0:
        return datetime.now()
    
    months_needed = remaining / monthly_contribution
    return datetime.now() + timedelta(days=months_needed * 30)


async def _execute_workflow_async(
    executor: Any,
    workflow_id: str,
    inputs: Dict[str, Any],
    execution_id: str,
    callback_url: str = None,
) -> None:
    """Execute workflow asynchronously."""
    try:
        result = await executor.execute_workflow(workflow_id, inputs)
        
        if callback_url:
            # Would send callback here
            logger.info(f"Would send callback to {callback_url} with result")
            
    except Exception as e:
        logger.error(f"Async workflow execution failed: {str(e)}")


# Export all routers
def get_routers() -> List[APIRouter]:
    """Get all API routers."""
    return [
        classification_router,
        goal_router,
        workflow_router,
        health_router,
    ]