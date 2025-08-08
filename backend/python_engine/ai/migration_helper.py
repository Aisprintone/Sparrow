"""
Migration Helper for Integrating Refactored RAG System
Provides seamless transition from old to new implementation
"""

import logging
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)


class RAGSystemMigration:
    """
    Helper class to migrate from sequential to batched RAG system
    Follows Adapter pattern for smooth transition
    """
    
    @staticmethod
    def use_refactored_system() -> bool:
        """
        Feature flag to control rollout of refactored system
        Can be controlled via environment variable for gradual rollout
        """
        import os
        return os.getenv("USE_REFACTORED_RAG", "true").lower() == "true"
    
    @staticmethod
    async def get_agent_system():
        """
        Factory method to get appropriate agent system
        Returns refactored or original based on configuration
        """
        if RAGSystemMigration.use_refactored_system():
            logger.info("Using refactored SOLID-compliant RAG system")
            from .langgraph_dspy_agent_refactored import RefactoredFinancialAIAgentSystem
            return RefactoredFinancialAIAgentSystem()
        else:
            logger.info("Using original RAG system")
            from .langgraph_dspy_agent import FinancialAIAgentSystem
            return FinancialAIAgentSystem()
    
    @staticmethod
    def get_performance_comparison(
        original_metrics: Dict[str, Any],
        refactored_metrics: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Compare performance between original and refactored systems
        """
        comparison = {
            "execution_time_improvement": None,
            "success_rate_delta": None,
            "api_calls_reduction": None
        }
        
        # Calculate execution time improvement
        if "total_duration_ms" in original_metrics and "total_duration_ms" in refactored_metrics:
            original_time = original_metrics["total_duration_ms"]
            refactored_time = refactored_metrics["total_duration_ms"]
            improvement_pct = ((original_time - refactored_time) / original_time) * 100
            comparison["execution_time_improvement"] = f"{improvement_pct:.1f}%"
        
        # Calculate success rate delta
        if "success_rate" in original_metrics and "success_rate" in refactored_metrics:
            delta = refactored_metrics["success_rate"] - original_metrics["success_rate"]
            comparison["success_rate_delta"] = f"{delta:+.1%}"
        
        # API calls reduction (6 sequential to 1 batch)
        comparison["api_calls_reduction"] = "83.3% (6 to 1)"
        
        return comparison


class RAGSystemAdapter:
    """
    Adapter to make refactored system compatible with existing interfaces
    Ensures backward compatibility during migration
    """
    
    def __init__(self, refactored_system):
        self._system = refactored_system
    
    async def generate_explanation_cards(
        self,
        simulation_data: Dict[str, Any],
        user_profile: Dict[str, Any],
        scenario_context: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Adapter method maintaining original interface
        """
        return await self._system.generate_explanation_cards(
            simulation_data=simulation_data,
            user_profile=user_profile,
            scenario_context=scenario_context
        )
    
    def get_metrics_summary(self) -> Dict[str, Any]:
        """
        Get metrics from the refactored system
        """
        if hasattr(self._system, 'metrics'):
            return self._system.metrics.get_metrics_summary()
        return {}


def migrate_to_batched_rag():
    """
    Main migration function to update imports and usage
    This should be called from the main application
    """
    logger.info("Starting migration to batched RAG system")
    
    # Update the main agent import
    import sys
    
    # Replace the old system with the new one in the module cache
    if 'ai.langgraph_dspy_agent' in sys.modules:
        old_module = sys.modules['ai.langgraph_dspy_agent']
        
        # Import the refactored system
        from .langgraph_dspy_agent_refactored import RefactoredFinancialAIAgentSystem
        
        # Replace the class in the old module
        old_module.FinancialAIAgentSystem = RefactoredFinancialAIAgentSystem
        
        logger.info("Successfully replaced FinancialAIAgentSystem with refactored version")
    
    return True