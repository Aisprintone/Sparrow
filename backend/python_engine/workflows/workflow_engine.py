"""
Workflow Execution Engine using LangGraph
Handles the execution of financial automation workflows
"""

import asyncio
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import json

# LangGraph imports
from langgraph.graph import StateGraph, START, END
from langgraph.types import Command
from langgraph.checkpoint.memory import InMemorySaver

# Local imports
from .workflow_definitions import WorkflowDefinition, WorkflowStep, WorkflowStatus, get_workflow_by_id
from .workflow_agents import WorkflowAgentManager

logger = logging.getLogger(__name__)

class WorkflowExecutionState:
    """State for workflow execution"""
    def __init__(self, workflow_id: str, user_id: str):
        self.workflow_id = workflow_id
        self.user_id = user_id
        self.current_step = 0
        self.step_results = {}
        self.status = WorkflowStatus.QUEUED
        self.progress = 0.0
        self.errors = []
        self.user_inputs = {}
        self.started_at = datetime.now()
        self.estimated_completion = None
        self.current_step_name = ""
        self.user_action_required = None

class WorkflowEngine:
    """Main workflow execution engine"""
    
    def __init__(self):
        self.agent_manager = WorkflowAgentManager()
        self.execution_graphs = {}
        self.active_workflows = {}
        
    def build_workflow_graph(self, workflow_id: str) -> StateGraph:
        """Build LangGraph for specific workflow"""
        workflow = get_workflow_by_id(workflow_id)
        if not workflow:
            raise ValueError(f"Workflow {workflow_id} not found")
        
        # Create state graph
        workflow_graph = StateGraph(WorkflowExecutionState)
        
        # Add nodes for each step
        for i, step in enumerate(workflow.steps):
            node_name = f"step_{i}"
            workflow_graph.add_node(node_name, self.create_step_node(step))
            
            # Add conditional edges
            if i == 0:
                workflow_graph.add_edge(START, node_name)
            else:
                workflow_graph.add_edge(f"step_{i-1}", node_name)
                
        # Add final edge to END
        workflow_graph.add_edge(f"step_{len(workflow.steps)-1}", END)
        
        return workflow_graph.compile()
    
    def create_step_node(self, step: WorkflowStep):
        """Create a LangGraph node for a workflow step"""
        
        async def step_node(state: WorkflowExecutionState) -> Command:
            try:
                logger.info(f"Executing step: {step.name}")
                
                # Update state
                state.current_step_name = step.name
                state.status = WorkflowStatus.RUNNING
                
                # Calculate progress
                total_steps = len(get_workflow_by_id(state.workflow_id).steps)
                state.progress = (state.current_step / total_steps) * 100
                
                # Execute step based on type
                if step.type == "automated":
                    result = await self.execute_automated_step(step, state)
                elif step.type == "semi-automated":
                    result = await self.execute_semi_automated_step(step, state)
                else:  # manual
                    result = await self.execute_manual_step(step, state)
                
                # Store step result
                state.step_results[step.id] = result
                state.current_step += 1
                
                # Update progress
                state.progress = (state.current_step / total_steps) * 100
                
                logger.info(f"Step {step.name} completed successfully")
                return Command("continue")
                
            except Exception as e:
                logger.error(f"Error in step {step.name}: {str(e)}")
                state.errors.append(f"Step {step.name}: {str(e)}")
                state.status = WorkflowStatus.ERROR
                return Command("stop")
        
        return step_node
    
    async def execute_automated_step(self, step: WorkflowStep, state: WorkflowExecutionState) -> Dict[str, Any]:
        """Execute an automated step"""
        logger.info(f"Executing automated step: {step.name}")
        
        # Get agent for this step
        agent = self.agent_manager.get_agent(step.agent)
        
        # Prepare inputs
        inputs = self.prepare_step_inputs(step, state)
        
        # Execute actions
        results = {}
        for action in step.actions:
            try:
                result = await agent.execute_action(action, inputs)
                results[action] = result
            except Exception as e:
                logger.error(f"Error executing action {action}: {str(e)}")
                raise
        
        # Validate outputs
        self.validate_step_outputs(step, results)
        
        return results
    
    async def execute_semi_automated_step(self, step: WorkflowStep, state: WorkflowExecutionState) -> Dict[str, Any]:
        """Execute a semi-automated step requiring user input"""
        logger.info(f"Executing semi-automated step: {step.name}")
        
        if step.user_interaction:
            # Set user action required
            state.user_action_required = {
                "step_id": step.id,
                "message": step.user_interaction["message"],
                "options": step.user_interaction["options"],
                "type": step.user_interaction["type"]
            }
            
            # Pause workflow until user responds
            state.status = WorkflowStatus.PAUSED
            return {"status": "waiting_for_user_input"}
        
        # If no user interaction, execute as automated
        return await self.execute_automated_step(step, state)
    
    async def execute_manual_step(self, step: WorkflowStep, state: WorkflowExecutionState) -> Dict[str, Any]:
        """Execute a manual step requiring user action"""
        logger.info(f"Executing manual step: {step.name}")
        
        # Set user action required
        state.user_action_required = {
            "step_id": step.id,
            "message": step.description,
            "type": "manual_action"
        }
        
        # Pause workflow
        state.status = WorkflowStatus.PAUSED
        return {"status": "waiting_for_user_action"}
    
    def prepare_step_inputs(self, step: WorkflowStep, state: WorkflowExecutionState) -> Dict[str, Any]:
        """Prepare inputs for a workflow step"""
        inputs = {}
        
        for input_name in step.inputs:
            if input_name in state.step_results:
                inputs[input_name] = state.step_results[input_name]
            elif input_name in state.user_inputs:
                inputs[input_name] = state.user_inputs[input_name]
            else:
                # Get from user profile or external source
                inputs[input_name] = self.get_input_value(input_name, state)
        
        return inputs
    
    def get_input_value(self, input_name: str, state: WorkflowExecutionState) -> Any:
        """Get input value from various sources"""
        # This would integrate with user profile, Plaid, etc.
        # For now, return mock values
        mock_inputs = {
            "access_token": "mock_access_token",
            "account_ids": ["mock_account_1", "mock_account_2"],
            "transaction_history": [],
            "bill_patterns": [],
            "user_location": "New York, NY"
        }
        
        return mock_inputs.get(input_name, None)
    
    def validate_step_outputs(self, step: WorkflowStep, results: Dict[str, Any]) -> bool:
        """Validate step outputs against requirements"""
        for validation in step.validations:
            if not self.check_validation(validation, results):
                raise ValueError(f"Validation failed: {validation}")
        return True
    
    def check_validation(self, validation: str, results: Dict[str, Any]) -> bool:
        """Check if a validation passes"""
        # Simple validation checks
        if validation == "min_transactions_30":
            return len(results.get("transaction_list", [])) >= 30
        elif validation == "recurring_patterns":
            return len(results.get("subscription_list", [])) > 0
        elif validation == "user_approved":
            return results.get("user_approved", False)
        elif validation == "savings_minimum":
            return results.get("savings_potential", 0) >= 10
        else:
            return True  # Default to passing
    
    async def start_workflow(self, workflow_id: str, user_id: str) -> str:
        """Start a workflow execution"""
        logger.info(f"Starting workflow {workflow_id} for user {user_id}")
        
        # Create execution state
        state = WorkflowExecutionState(workflow_id, user_id)
        
        # Build or get workflow graph
        if workflow_id not in self.execution_graphs:
            self.execution_graphs[workflow_id] = self.build_workflow_graph(workflow_id)
        
        workflow_graph = self.execution_graphs[workflow_id]
        
        # Store active workflow
        execution_id = f"{workflow_id}_{user_id}_{datetime.now().timestamp()}"
        self.active_workflows[execution_id] = {
            "state": state,
            "graph": workflow_graph,
            "started_at": datetime.now()
        }
        
        # Start execution in background
        asyncio.create_task(self.execute_workflow(execution_id))
        
        return execution_id
    
    async def execute_workflow(self, execution_id: str):
        """Execute a workflow"""
        workflow_info = self.active_workflows[execution_id]
        state = workflow_info["state"]
        graph = workflow_info["graph"]
        
        try:
            logger.info(f"Executing workflow {execution_id}")
            
            # Run the workflow graph
            config = {"configurable": {"thread_id": execution_id}}
            async for event in graph.astream(state, config):
                # Update state from event
                if hasattr(event, 'state'):
                    state = event.state
                    workflow_info["state"] = state
                
                # Log progress
                logger.info(f"Workflow {execution_id} progress: {state.progress}%")
                
                # Check if workflow is complete
                if state.current_step >= len(get_workflow_by_id(state.workflow_id).steps):
                    state.status = WorkflowStatus.COMPLETED
                    state.progress = 100.0
                    logger.info(f"Workflow {execution_id} completed successfully")
                    break
                    
        except Exception as e:
            logger.error(f"Error executing workflow {execution_id}: {str(e)}")
            state.status = WorkflowStatus.FAILED
            state.errors.append(str(e))
    
    async def pause_workflow(self, execution_id: str):
        """Pause a workflow execution"""
        if execution_id in self.active_workflows:
            workflow_info = self.active_workflows[execution_id]
            workflow_info["state"].status = WorkflowStatus.PAUSED
            logger.info(f"Workflow {execution_id} paused")
    
    async def resume_workflow(self, execution_id: str):
        """Resume a paused workflow"""
        if execution_id in self.active_workflows:
            workflow_info = self.active_workflows[execution_id]
            workflow_info["state"].status = WorkflowStatus.RUNNING
            logger.info(f"Workflow {execution_id} resumed")
    
    async def cancel_workflow(self, execution_id: str):
        """Cancel a workflow execution"""
        if execution_id in self.active_workflows:
            workflow_info = self.active_workflows[execution_id]
            workflow_info["state"].status = WorkflowStatus.FAILED
            logger.info(f"Workflow {execution_id} cancelled")
    
    def get_workflow_status(self, execution_id: str) -> Optional[Dict[str, Any]]:
        """Get status of a workflow execution"""
        if execution_id not in self.active_workflows:
            return None
        
        workflow_info = self.active_workflows[execution_id]
        state = workflow_info["state"]
        
        return {
            "execution_id": execution_id,
            "workflow_id": state.workflow_id,
            "status": state.status.value,
            "progress": state.progress,
            "current_step": state.current_step_name,
            "errors": state.errors,
            "started_at": state.started_at.isoformat(),
            "estimated_completion": state.estimated_completion.isoformat() if state.estimated_completion else None,
            "user_action_required": state.user_action_required
        }
    
    def get_user_workflows(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all workflows for a user"""
        user_workflows = []
        
        for execution_id, workflow_info in self.active_workflows.items():
            if workflow_info["state"].user_id == user_id:
                status = self.get_workflow_status(execution_id)
                if status:
                    user_workflows.append(status)
        
        return user_workflows
    
    async def handle_user_input(self, execution_id: str, user_input: Dict[str, Any]):
        """Handle user input for a paused workflow"""
        if execution_id not in self.active_workflows:
            raise ValueError(f"Workflow {execution_id} not found")
        
        workflow_info = self.active_workflows[execution_id]
        state = workflow_info["state"]
        
        # Store user input
        state.user_inputs.update(user_input)
        
        # Resume workflow
        state.status = WorkflowStatus.RUNNING
        state.user_action_required = None
        
        logger.info(f"User input received for workflow {execution_id}, resuming execution")
        
        # Continue execution
        asyncio.create_task(self.execute_workflow(execution_id))
