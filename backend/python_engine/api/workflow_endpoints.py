"""
Workflow API Endpoints
Handles workflow execution and status tracking
"""

import asyncio
import logging
from typing import Dict, List, Any, Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel

# Local imports
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from workflows.workflow_engine import WorkflowEngine
from workflows.workflow_registry import WorkflowRegistry
from core.cache_manager import cache_manager

logger = logging.getLogger(__name__)

# Initialize workflow engine and registry
workflow_engine = WorkflowEngine()
workflow_registry = WorkflowRegistry()

# Pydantic models for API
class StartWorkflowRequest(BaseModel):
    workflow_id: str
    user_id: str
    parameters: Dict[str, Any] = {}

class UserInputRequest(BaseModel):
    execution_id: str
    user_input: Dict[str, Any]

class WorkflowStatusResponse(BaseModel):
    execution_id: str
    workflow_id: str
    status: str
    progress: float
    current_step: str
    errors: List[str]
    started_at: str
    estimated_completion: Optional[str] = None
    user_action_required: Optional[Dict[str, Any]] = None

# Create router
router = APIRouter(prefix="/workflows", tags=["workflows"])

@router.post("/start")
async def start_workflow(request: StartWorkflowRequest, background_tasks: BackgroundTasks):
    """Start a workflow execution"""
    try:
        # Validate workflow exists
        workflow = workflow_registry.get_workflow(request.workflow_id)
        if not workflow:
            raise HTTPException(status_code=404, detail=f"Workflow {request.workflow_id} not found")
        
        # Start workflow
        execution_id = await workflow_engine.start_workflow(request.workflow_id, request.user_id)
        
        logger.info(f"Started workflow {request.workflow_id} for user {request.user_id}")
        
        return {
            "execution_id": execution_id,
            "workflow_id": request.workflow_id,
            "status": "started"
        }
        
    except Exception as e:
        logger.error(f"Error starting workflow: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status/{execution_id}")
async def get_workflow_status(execution_id: str):
    """Get status of a workflow execution"""
    try:
        # Try to get from cache first
        cache_key = f"workflow_status:{execution_id}"
        cached_status = await cache_manager.get(cache_key)
        
        if cached_status:
            logger.info(f"Cache hit for workflow status: {execution_id}")
            return WorkflowStatusResponse(**cached_status)
        
        # Get from workflow engine
        status = await workflow_engine.get_workflow_status(execution_id)
        if not status:
            raise HTTPException(status_code=404, detail=f"Workflow execution {execution_id} not found")
        
        return WorkflowStatusResponse(**status)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting workflow status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/user/{user_id}")
async def get_user_workflows(user_id: str):
    """Get all workflows for a user"""
    try:
        workflows = workflow_engine.get_user_workflows(user_id)
        return {"workflows": workflows}
        
    except Exception as e:
        logger.error(f"Error getting user workflows: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{execution_id}/pause")
async def pause_workflow(execution_id: str):
    """Pause a workflow execution"""
    try:
        await workflow_engine.pause_workflow(execution_id)
        return {"status": "paused"}
        
    except Exception as e:
        logger.error(f"Error pausing workflow: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{execution_id}/resume")
async def resume_workflow(execution_id: str):
    """Resume a paused workflow"""
    try:
        await workflow_engine.resume_workflow(execution_id)
        return {"status": "resumed"}
        
    except Exception as e:
        logger.error(f"Error resuming workflow: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{execution_id}/cancel")
async def cancel_workflow(execution_id: str):
    """Cancel a workflow execution"""
    try:
        await workflow_engine.cancel_workflow(execution_id)
        return {"status": "cancelled"}
        
    except Exception as e:
        logger.error(f"Error cancelling workflow: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{execution_id}/input")
async def handle_user_input(execution_id: str, request: UserInputRequest):
    """Handle user input for a paused workflow"""
    try:
        await workflow_engine.handle_user_input(execution_id, request.user_input)
        return {"status": "input_processed"}
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error handling user input: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/available")
async def get_available_workflows():
    """Get all available workflows"""
    try:
        workflows = workflow_registry.list_workflows()
        return {"workflows": workflows}
        
    except Exception as e:
        logger.error(f"Error getting available workflows: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/available/{workflow_id}")
async def get_workflow_details(workflow_id: str):
    """Get details of a specific workflow"""
    try:
        summary = workflow_registry.get_workflow_summary(workflow_id)
        if not summary:
            raise HTTPException(status_code=404, detail=f"Workflow {workflow_id} not found")
        
        return summary
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting workflow details: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/recommendations")
async def get_workflow_recommendations(user_profile: Dict[str, Any]):
    """Get workflow recommendations for a user"""
    try:
        recommendations = workflow_registry.get_workflows_for_user(user_profile)
        return {"recommendations": recommendations}
        
    except Exception as e:
        logger.error(f"Error getting workflow recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/categories/{category}")
async def get_workflows_by_category(category: str):
    """Get workflows by category"""
    try:
        from ..workflows.workflow_definitions import WorkflowCategory
        
        try:
            category_enum = WorkflowCategory(category)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid category: {category}")
        
        workflows = workflow_registry.get_workflows_by_category(category_enum)
        
        return {
            "category": category,
            "workflows": [
                {
                    "id": wf.id,
                    "name": wf.name,
                    "description": wf.description,
                    "estimated_duration": wf.estimated_duration,
                    "estimated_impact": wf.estimated_impact
                }
                for wf in workflows
            ]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting workflows by category: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
