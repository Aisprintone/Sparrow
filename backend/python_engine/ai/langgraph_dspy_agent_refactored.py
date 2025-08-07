"""
Refactored LangGraph-DSPy Financial AI Agent System with Batched RAG
SOLID-compliant implementation with proper separation of concerns
"""

import os
import asyncio
import json
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# LangGraph imports
from langgraph.graph import StateGraph, START, END, MessagesState
from langgraph.types import Command
from langgraph.checkpoint.memory import InMemorySaver

# DSPy imports
import dspy
from dspy import Signature, Module, InputField, OutputField

# RAG system imports - Clean architecture
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from rag.abstractions import (
    BatchedRAGRequest,
    BatchedRAGResponse,
    QueryType,
    RAGQuery
)
from rag.batched_service import BatchedRAGService
from rag.query_executor import AsyncProfileRAGQueryExecutor
from rag.query_builder import ScenarioRAGQueryBuilder
from rag.implementations import (
    InMemoryRAGCache,
    SimpleRAGMetrics,
    ExponentialBackoffErrorHandler,
    SmartBatchingStrategy
)
from rag.profile_rag_system import get_rag_manager

# Import original components we're keeping
from langgraph_dspy_agent import (
    NumpyEncoder,
    FinancialAnalysisState,
    FinancialDataAnalysis,
    ExplanationCardGeneration,
    RationaleGeneration,
    FinancialAnalyzer,
    CardGenerator,
    RationaleGenerator
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class RefactoredFinancialAIAgentSystem:
    """
    Refactored AI Agent System with SOLID-compliant batched RAG
    Single Responsibility: Orchestrate the financial analysis pipeline
    """
    
    def __init__(self):
        """Initialize with properly decoupled components"""
        # Configure DSPy
        self._configure_dspy()
        
        # Initialize DSPy modules (keeping existing ones)
        self.financial_analyzer = FinancialAnalyzer()
        self.card_generator = CardGenerator()
        self.rationale_generator = RationaleGenerator()
        
        # Initialize SOLID-compliant RAG components
        self._initialize_rag_components()
        
        # Build the LangGraph StateGraph
        self.graph = self._build_agent_graph()
    
    def _configure_dspy(self):
        """Configure DSPy with available LLM providers"""
        try:
            if os.getenv("ANTHROPIC_API_KEY"):
                lm = dspy.LM(
                    "anthropic/claude-3-5-sonnet-20241022",
                    api_key=os.getenv("ANTHROPIC_API_KEY"),
                    max_retries=3,
                    timeout=60.0,
                    temperature=0.7
                )
                dspy.configure(lm=lm)
                logger.info("DSPy configured with Anthropic Claude")
                return
            
            if os.getenv("OPENAI_API_KEY"):
                lm = dspy.LM(
                    "openai/gpt-4o-mini",
                    api_key=os.getenv("OPENAI_API_KEY"),
                    max_retries=3,
                    timeout=60.0,
                    temperature=0.7
                )
                dspy.configure(lm=lm)
                logger.info("DSPy configured with OpenAI")
                return
            
            raise ValueError("No API keys found for Anthropic or OpenAI")
            
        except Exception as e:
            logger.error(f"Failed to configure DSPy: {e}")
            raise
    
    def _initialize_rag_components(self):
        """
        Initialize RAG components following Dependency Inversion Principle
        Each component has a single responsibility
        """
        # Get RAG manager
        rag_manager = get_rag_manager()
        
        # Initialize components with dependency injection
        self.query_executor = AsyncProfileRAGQueryExecutor(rag_manager)
        self.query_builder = ScenarioRAGQueryBuilder()
        self.cache = InMemoryRAGCache()
        self.metrics = SimpleRAGMetrics()
        self.error_handler = ExponentialBackoffErrorHandler()
        
        # Initialize batched service with dependencies
        self.batched_rag_service = BatchedRAGService(
            query_executor=self.query_executor,
            cache=self.cache,
            metrics=self.metrics,
            error_handler=self.error_handler,
            max_parallel_queries=6
        )
        
        logger.info("Initialized SOLID-compliant RAG components")
    
    def _build_agent_graph(self) -> StateGraph:
        """Build the LangGraph multi-agent system"""
        builder = StateGraph(FinancialAnalysisState)
        
        # Add agent nodes
        builder.add_node("rag_retriever", self.batched_rag_retriever_node)
        builder.add_node("data_analyzer", self.data_analyzer_node)
        builder.add_node("insight_generator", self.insight_generator_node)
        builder.add_node("card_formatter", self.card_formatter_node)
        builder.add_node("quality_validator", self.quality_validator_node)
        
        # Define the flow
        builder.add_edge(START, "rag_retriever")
        builder.add_edge("rag_retriever", "data_analyzer")
        builder.add_edge("data_analyzer", "insight_generator")
        builder.add_edge("insight_generator", "card_formatter")
        builder.add_edge("card_formatter", "quality_validator")
        builder.add_edge("quality_validator", END)
        
        # Compile with memory
        memory = InMemorySaver()
        return builder.compile(checkpointer=memory)
    
    async def batched_rag_retriever_node(self, state: FinancialAnalysisState) -> Command:
        """
        Refactored RAG retriever with batched execution
        Single Responsibility: Coordinate RAG data retrieval
        """
        try:
            logger.info("Batched RAG Retriever: Starting efficient batch processing")
            
            # Extract context from state
            user_profile = state.get("user_profile", {})
            simulation_data = state.get("simulation_data", {})
            scenario_name = simulation_data.get("scenario_name", "financial planning")
            
            # Determine profile ID
            profile_id = user_profile.get("user_id", user_profile.get("profile_id", 1))
            
            # Build queries using query builder (Single Responsibility)
            queries = self.query_builder.build_scenario_queries(
                scenario_name=scenario_name,
                profile_context=user_profile
            )
            
            # Create batched request
            batch_request = BatchedRAGRequest(
                profile_id=profile_id,
                queries=queries,
                scenario_context=scenario_name
            )
            
            # Execute batch with single API call (replacing 6 sequential calls)
            batch_response = await self.batched_rag_service.execute_batch(batch_request)
            
            # Transform response to expected format
            rag_insights = self._transform_batch_response(batch_response)
            
            # Get metrics summary for monitoring
            metrics_summary = self.metrics.get_metrics_summary()
            
            logger.info(
                f"Batched RAG Retriever: Completed with {batch_response.success_rate:.1%} success rate "
                f"in {batch_response.total_execution_time_ms:.1f}ms"
            )
            
            # Prepare update with clean structure
            update = {
                "rag_insights": rag_insights,
                "profile_context": {
                    "profile_id": profile_id,
                    "scenario": scenario_name,
                    "metrics": metrics_summary
                },
                "current_agent": "rag_retriever",
                "processing_stage": "rag_complete"
            }
            
            return Command(update=update)
            
        except Exception as e:
            logger.error(f"Batched RAG Retriever error: {e}")
            return Command(update=self._create_fallback_update(e))
    
    def _transform_batch_response(self, response: BatchedRAGResponse) -> Dict[str, str]:
        """
        Transform batched response to expected format
        Single Responsibility: Data transformation
        """
        insights = {}
        
        # Map query types to insight keys
        type_mapping = {
            QueryType.ACCOUNTS: "accounts",
            QueryType.TRANSACTIONS: "spending_patterns",
            QueryType.DEMOGRAPHICS: "demographics",
            QueryType.GOALS: "goals",
            QueryType.INVESTMENTS: "investments",
            QueryType.COMPREHENSIVE: "comprehensive"
        }
        
        for query_type, key in type_mapping.items():
            result = response.get_result(query_type)
            if result:
                insights[key] = result.result if result.success else f"Data unavailable: {result.error}"
            else:
                insights[key] = "Data not retrieved"
        
        return insights
    
    def _create_fallback_update(self, error: Exception) -> Dict[str, Any]:
        """Create fallback update for error cases"""
        return {
            "rag_insights": {
                "accounts": "Account information not available",
                "spending_patterns": "Spending data not available",
                "demographics": "Profile details not available",
                "goals": "Financial goals not available",
                "investments": "Investment data not available",
                "comprehensive": "Comprehensive analysis not available"
            },
            "profile_context": {"error": str(error)},
            "current_agent": "rag_retriever",
            "processing_stage": "rag_fallback"
        }
    
    async def data_analyzer_node(self, state: FinancialAnalysisState) -> Command:
        """Data analysis node - unchanged but uses batched RAG insights"""
        try:
            logger.info("Data Analyzer: Processing with batched RAG insights")
            
            simulation_data = json.dumps(state.get("simulation_data", {}), cls=NumpyEncoder)
            user_profile = json.dumps(state.get("user_profile", {}), cls=NumpyEncoder)
            rag_insights = state.get("rag_insights", {})
            
            enhanced_context = {
                "simulation_data": state.get("simulation_data", {}),
                "user_profile": state.get("user_profile", {}),
                "rag_insights": rag_insights,
                "profile_context": state.get("profile_context", {})
            }
            
            enhanced_context_json = json.dumps(enhanced_context, cls=NumpyEncoder)
            
            analysis_results = self.financial_analyzer(enhanced_context_json, user_profile)
            
            try:
                parsed_analysis = json.loads(analysis_results)
            except json.JSONDecodeError:
                parsed_analysis = {
                    "key_insights": analysis_results,
                    "risk_assessment": "Moderate",
                    "recommendations": []
                }
            
            return Command(update={
                "analysis_results": parsed_analysis,
                "current_agent": "data_analyzer",
                "processing_stage": "analysis_complete"
            })
            
        except Exception as e:
            logger.error(f"Data Analyzer error: {e}")
            return Command(update={
                "analysis_results": {"error": str(e)},
                "current_agent": "data_analyzer",
                "processing_stage": "error"
            })
    
    async def insight_generator_node(self, state: FinancialAnalysisState) -> Command:
        """Insight generation node - kept from original"""
        try:
            logger.info("Insight Generator: Creating recommendations")
            
            analysis_data = json.dumps(state.get("analysis_results", {}), cls=NumpyEncoder)
            simulation_type = state.get("simulation_data", {}).get("scenario_name", "generic")
            user_profile = json.dumps(state.get("user_profile", {}), cls=NumpyEncoder)
            
            recommendations = state.get("analysis_results", {}).get("recommendations", [])
            enhanced_recommendations = []
            
            for rec in recommendations[:3]:
                rationale = self.rationale_generator(
                    recommendation=json.dumps(rec),
                    analysis_data=analysis_data,
                    user_context=user_profile
                )
                enhanced_recommendations.append({
                    "recommendation": rec,
                    "rationale": rationale
                })
            
            return Command(update={
                "analysis_results": {
                    **state.get("analysis_results", {}),
                    "enhanced_recommendations": enhanced_recommendations
                },
                "current_agent": "insight_generator",
                "processing_stage": "insights_generated"
            })
            
        except Exception as e:
            logger.error(f"Insight Generator error: {e}")
            return Command(update={
                "current_agent": "insight_generator",
                "processing_stage": "error"
            })
    
    async def card_formatter_node(self, state: FinancialAnalysisState) -> Command:
        """Card formatting node - simplified version"""
        try:
            logger.info("Card Formatter: Creating AIActionPlan cards")
            
            simulation_type = state.get("simulation_data", {}).get("scenario_name", "generic")
            recommendations = state.get("analysis_results", {}).get("enhanced_recommendations", [])
            
            explanation_cards = []
            
            for i in range(3):
                if i < len(recommendations):
                    rec = recommendations[i]
                    card = self._create_card_from_recommendation(rec, simulation_type, i)
                else:
                    card = self._create_fallback_card(i, simulation_type)
                
                explanation_cards.append(card)
            
            return Command(update={
                "explanation_cards": explanation_cards,
                "current_agent": "card_formatter",
                "processing_stage": "cards_formatted"
            })
            
        except Exception as e:
            logger.error(f"Card Formatter error: {e}")
            return Command(update={
                "explanation_cards": [],
                "current_agent": "card_formatter",
                "processing_stage": "error"
            })
    
    async def quality_validator_node(self, state: FinancialAnalysisState) -> Command:
        """Quality validation node - ensures exactly 3 cards"""
        try:
            logger.info("Quality Validator: Validating card completeness")
            
            cards = state.get("explanation_cards", [])
            
            # Ensure exactly 3 cards
            while len(cards) < 3:
                cards.append(self._create_fallback_card(len(cards), "generic"))
            
            cards = cards[:3]
            
            # Log metrics summary
            metrics = self.metrics.get_metrics_summary()
            logger.info(f"Pipeline metrics: {json.dumps(metrics, indent=2)}")
            
            return Command(update={
                "explanation_cards": cards,
                "current_agent": "quality_validator",
                "processing_stage": "validation_complete"
            })
            
        except Exception as e:
            logger.error(f"Quality Validator error: {e}")
            return Command(update={
                "current_agent": "quality_validator",
                "processing_stage": "error"
            })
    
    def _create_card_from_recommendation(
        self,
        recommendation: Dict[str, Any],
        simulation_type: str,
        index: int
    ) -> Dict[str, Any]:
        """Create a card from recommendation data"""
        templates = self._get_card_templates(simulation_type)
        template = templates[index] if index < len(templates) else templates[0]
        
        return {
            "id": f"{simulation_type}_{index+1}",
            "title": template["title"],
            "description": recommendation.get("recommendation", {}).get("description", template["description"]),
            "tag": template["tag"],
            "tagColor": template["tagColor"],
            "potentialSaving": 1000,
            "rationale": recommendation.get("rationale", ""),
            "steps": ["Review recommendation", "Implement strategy", "Monitor progress"]
        }
    
    def _create_fallback_card(self, index: int, simulation_type: str) -> Dict[str, Any]:
        """Create a fallback card"""
        templates = self._get_card_templates(simulation_type)
        template = templates[index] if index < len(templates) else templates[0]
        
        return {
            "id": f"fallback_{index+1}",
            "title": template["title"],
            "description": template["description"],
            "tag": template["tag"],
            "tagColor": template["tagColor"],
            "potentialSaving": 500,
            "rationale": "This plan is tailored to your financial situation.",
            "steps": ["Review plan", "Take action", "Monitor progress"]
        }
    
    def _get_card_templates(self, simulation_type: str) -> List[Dict[str, Any]]:
        """Get card templates for consistent structure"""
        return [
            {
                "title": "Conservative Strategy",
                "description": "Low-risk approach with steady returns",
                "tag": "CONSERVATIVE",
                "tagColor": "bg-green-500"
            },
            {
                "title": "Balanced Strategy",
                "description": "Moderate risk with balanced returns",
                "tag": "BALANCED",
                "tagColor": "bg-blue-500"
            },
            {
                "title": "Aggressive Strategy",
                "description": "Higher risk for maximum returns",
                "tag": "AGGRESSIVE",
                "tagColor": "bg-purple-500"
            }
        ]
    
    async def generate_explanation_cards(
        self,
        simulation_data: Dict[str, Any],
        user_profile: Dict[str, Any],
        scenario_context: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Main entry point for generating explanation cards"""
        try:
            logger.info(f"Starting SOLID-compliant card generation for: {scenario_context}")
            
            initial_state = {
                "messages": [],
                "simulation_data": simulation_data,
                "user_profile": user_profile,
                "analysis_results": {},
                "explanation_cards": [],
                "current_agent": "starting",
                "processing_stage": "initialized",
                "rag_insights": {},
                "profile_context": {},
                "scenario_context": scenario_context or simulation_data.get("scenario_name", "financial_planning")
            }
            
            config = {"thread_id": f"session_{datetime.now().timestamp()}"}
            final_state = await self.graph.ainvoke(initial_state, config=config)
            
            return final_state.get("explanation_cards", [])
            
        except Exception as e:
            logger.error(f"Card generation failed: {e}")
            return [self._create_fallback_card(i, "generic") for i in range(3)]