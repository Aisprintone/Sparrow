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
from .workflow_registry import WorkflowRegistry, WorkflowMatch

# Import cache manager
from core.cache_manager import cache_manager, cached, CacheCategories

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
    """Main workflow execution engine with evidence-based selection"""
    
    def __init__(self):
        self.agent_manager = WorkflowAgentManager()
        self.execution_graphs = {}
        self.active_workflows = {}
        self.workflow_registry = WorkflowRegistry()
        self.evidence_cache = {}
        
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
    
    async def get_workflow_status(self, execution_id: str) -> Optional[Dict[str, Any]]:
        """Get status of a workflow execution"""
        if execution_id not in self.active_workflows:
            return None
        
        workflow_info = self.active_workflows[execution_id]
        state = workflow_info["state"]
        
        status_data = {
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
        
        # Cache the status
        cache_key = f"workflow_status:{execution_id}"
        await cache_manager.set(cache_key, status_data, ttl=300)
        
        return status_data
    
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
    
    # Evidence-based workflow selection methods
    
    async def get_personalized_workflows(self, user_data: Dict[str, Any]) -> List[WorkflowMatch]:
        """Get personalized workflow recommendations based on evidence analysis"""
        try:
            logger.info(f"Getting personalized workflows for user data")
            
            # Use workflow registry for evidence-based selection
            workflow_matches = await self.workflow_registry.get_evidence_based_workflows(user_data)
            
            # Cache the results for performance
            cache_key = f"personalized_workflows:{hash(str(user_data))}"
            await cache_manager.set(cache_key, [match.__dict__ for match in workflow_matches], ttl=3600)
            
            logger.info(f"Found {len(workflow_matches)} personalized workflow matches")
            return workflow_matches
            
        except Exception as e:
            logger.error(f"Error getting personalized workflows: {str(e)}")
            return []
    
    async def validate_workflow_evidence(self, workflow_id: str, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate evidence requirements for a specific workflow"""
        try:
            workflow_def = get_workflow_by_id(workflow_id)
            if not workflow_def or not workflow_def.evidence_patterns:
                return {"valid": False, "reason": "No evidence patterns defined"}
            
            # Extract evidence from user data
            evidence_list = await self.workflow_registry._extract_evidence(user_data)
            
            # Check evidence requirements
            validation_result = {
                "valid": True,
                "confidence": 0.0,
                "missing_evidence": [],
                "evidence_summary": []
            }
            
            required_sources = workflow_def.trust_requirements.get("evidence_sources", [])
            available_sources = {e.source for e in evidence_list}
            
            missing_sources = set(required_sources) - available_sources
            if missing_sources:
                validation_result["valid"] = False
                validation_result["missing_evidence"] = list(missing_sources)
            
            # Calculate confidence based on evidence patterns
            pattern_match_scores = []
            for pattern_name, pattern in workflow_def.evidence_patterns.items():
                score = self._evaluate_evidence_pattern(pattern, evidence_list)
                pattern_match_scores.append(score)
            
            if pattern_match_scores:
                validation_result["confidence"] = sum(pattern_match_scores) / len(pattern_match_scores)
            
            validation_result["evidence_summary"] = [e.description for e in evidence_list[:5]]
            
            return validation_result
            
        except Exception as e:
            logger.error(f"Error validating workflow evidence: {str(e)}")
            return {"valid": False, "reason": f"Validation error: {str(e)}"}
    
    def _evaluate_evidence_pattern(self, pattern: Dict[str, Any], evidence_list: List) -> float:
        """Evaluate how well evidence matches a pattern"""
        if pattern.get("required", False):
            # Check if required evidence exists
            return 1.0 if any(e for e in evidence_list) else 0.0
        
        # For threshold-based patterns, check if threshold is met
        threshold = pattern.get("threshold")
        metric = pattern.get("metric")
        
        if threshold and metric:
            # Find evidence with matching metric
            for evidence in evidence_list:
                if metric in evidence.data:
                    value = evidence.data[metric]
                    if isinstance(value, (int, float)) and value >= threshold:
                        return 1.0
            return 0.0
        
        return 0.5  # Default partial match
    
    async def get_workflow_execution_plan(self, workflow_id: str, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate detailed execution plan for a workflow with evidence context"""
        try:
            workflow_def = get_workflow_by_id(workflow_id)
            if not workflow_def:
                raise ValueError(f"Workflow {workflow_id} not found")
            
            # Validate evidence
            evidence_validation = await self.validate_workflow_evidence(workflow_id, user_data)
            
            # Generate execution plan
            execution_plan = {
                "workflow_id": workflow_id,
                "workflow_name": workflow_def.name,
                "description": workflow_def.description,
                "estimated_duration": workflow_def.estimated_duration,
                "estimated_impact": workflow_def.estimated_impact,
                "evidence_validation": evidence_validation,
                "steps": [],
                "prerequisites": workflow_def.prerequisites,
                "risk_level": workflow_def.estimated_impact.get("risk_level", "medium"),
                "automation_level": self._determine_automation_level(evidence_validation.get("confidence", 0))
            }
            
            # Add step details with evidence context
            for i, step in enumerate(workflow_def.steps):
                step_info = {
                    "step_number": i + 1,
                    "id": step.id,
                    "name": step.name,
                    "description": step.description,
                    "type": step.type,
                    "agent": step.agent,
                    "estimated_duration": self._estimate_step_duration(step),
                    "user_interaction_required": step.user_interaction is not None,
                    "validation_requirements": step.validations
                }
                execution_plan["steps"].append(step_info)
            
            return execution_plan
            
        except Exception as e:
            logger.error(f"Error generating execution plan: {str(e)}")
            raise
    
    def _determine_automation_level(self, confidence: float) -> str:
        """Determine automation level based on confidence score"""
        if confidence >= 0.90:
            return "full"
        elif confidence >= 0.75:
            return "assisted"
        else:
            return "manual"
    
    def _estimate_step_duration(self, step: WorkflowStep) -> str:
        """Estimate duration for a workflow step"""
        base_durations = {
            "automated": "30-60 seconds",
            "semi-automated": "2-5 minutes", 
            "manual": "5-15 minutes"
        }
        return base_durations.get(step.type, "2-5 minutes")
    
    async def get_workflow_safety_analysis(self, workflow_id: str, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze safety and risk factors for workflow execution"""
        try:
            workflow_def = get_workflow_by_id(workflow_id)
            if not workflow_def:
                raise ValueError(f"Workflow {workflow_id} not found")
            
            safety_analysis = {
                "workflow_id": workflow_id,
                "overall_risk_level": workflow_def.estimated_impact.get("risk_level", "medium"),
                "safety_measures": [],
                "risk_factors": [],
                "mitigation_strategies": [],
                "approval_requirements": []
            }
            
            # Analyze risk factors based on workflow type
            if "cancel_subscriptions" in workflow_id:
                safety_analysis["safety_measures"].extend([
                    "Preview all cancellations before execution",
                    "Account remains active until end of billing cycle", 
                    "Easy reactivation process available",
                    "Backup of subscription data maintained"
                ])
                safety_analysis["risk_factors"].extend([
                    "Accidental cancellation of wanted services",
                    "Loss of promotional pricing"
                ])
            
            elif "high_yield_savings" in workflow_id:
                safety_analysis["safety_measures"].extend([
                    "FDIC insured institutions only",
                    "No lock-in periods required",
                    "Maintain emergency fund buffer",
                    "Gradual transfer option available"
                ])
                safety_analysis["risk_factors"].extend([
                    "Temporary loss of funds access during transfer",
                    "Potential rate changes after opening"
                ])
            
            elif "negotiate_bills" in workflow_id:
                safety_analysis["safety_measures"].extend([
                    "Preview all negotiation communications",
                    "No binding commitments without approval",
                    "Backup plan if negotiation fails",
                    "Service continuity guaranteed"
                ])
                safety_analysis["risk_factors"].extend([
                    "Temporary service disruption if negotiation fails",
                    "Potential for worse terms than current"
                ])
            
            # Add approval requirements based on risk and confidence
            evidence_validation = await self.validate_workflow_evidence(workflow_id, user_data)
            confidence = evidence_validation.get("confidence", 0)
            
            if confidence < 0.85:
                safety_analysis["approval_requirements"].append("Manual review required before execution")
            if workflow_def.estimated_impact.get("risk_level") == "high":
                safety_analysis["approval_requirements"].append("Additional confirmation required for high-risk workflow")
            
            return safety_analysis
            
        except Exception as e:
            logger.error(f"Error analyzing workflow safety: {str(e)}")
            return {"error": str(e)}
