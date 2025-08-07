"""
Workflow Registry
Manages workflow definitions and provides lookup functionality
"""

from typing import Dict, List, Optional
from .workflow_definitions import WorkflowDefinition, WorkflowCategory, get_workflow_by_id, get_workflows_by_category, get_workflows_by_profile

class WorkflowRegistry:
    """Registry for managing workflow definitions"""
    
    def __init__(self):
        self.workflows = {}
        self._load_workflows()
    
    def _load_workflows(self):
        """Load all workflow definitions"""
        # This would load from database or configuration
        # For now, we'll use the definitions from workflow_definitions.py
        pass
    
    def get_workflow(self, workflow_id: str) -> Optional[WorkflowDefinition]:
        """Get workflow by ID"""
        return get_workflow_by_id(workflow_id)
    
    def get_workflows_by_category(self, category: WorkflowCategory) -> List[WorkflowDefinition]:
        """Get workflows by category"""
        return get_workflows_by_category(category)
    
    def get_workflows_by_profile(self, demographic: str, income: int, debt_level: str) -> List[WorkflowDefinition]:
        """Get workflows that match user profile"""
        return get_workflows_by_profile(demographic, income, debt_level)
    
    def list_workflows(self) -> List[str]:
        """List all available workflow IDs"""
        return list(get_workflow_by_id.__defaults__[0].keys()) if hasattr(get_workflow_by_id, '__defaults__') else []
    
    def get_workflow_summary(self, workflow_id: str) -> Optional[Dict]:
        """Get summary information for a workflow"""
        workflow = self.get_workflow(workflow_id)
        if not workflow:
            return None
        
        return {
            "id": workflow.id,
            "name": workflow.name,
            "category": workflow.category.value,
            "description": workflow.description,
            "estimated_duration": workflow.estimated_duration,
            "estimated_impact": workflow.estimated_impact,
            "steps_count": len(workflow.steps)
        }
    
    def get_workflows_for_user(self, user_profile: Dict) -> List[Dict]:
        """Get workflows suitable for a user based on their profile"""
        demographic = user_profile.get("demographic", "millennial")
        income = user_profile.get("income", 50000)
        debt_level = user_profile.get("debt_level", "medium")
        
        matching_workflows = self.get_workflows_by_profile(demographic, income, debt_level)
        
        return [
            {
                "id": wf.id,
                "name": wf.name,
                "category": wf.category.value,
                "description": wf.description,
                "estimated_duration": wf.estimated_duration,
                "estimated_impact": wf.estimated_impact,
                "steps_count": len(wf.steps),
                "prerequisites": wf.prerequisites
            }
            for wf in matching_workflows
        ]
