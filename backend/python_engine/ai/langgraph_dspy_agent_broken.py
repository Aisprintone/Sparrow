"""
LangGraph-DSPy Financial AI Agent System with RAG Integration
Replaces simple HTTP approach with sophisticated multi-agent architecture
Enhanced with profile-specific RAG query capabilities
"""

import os
import asyncio
from typing import Dict, List, Any, Literal, TypedDict, Optional
from datetime import datetime

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

# LangGraph imports
from langgraph.graph import StateGraph, START, END, MessagesState
from langgraph.types import Command
from langgraph.checkpoint.memory import InMemorySaver

# DSPy imports
import dspy
from dspy import Signature, Module, InputField, OutputField

# RAG system imports
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))
from rag.profile_rag_system import get_rag_manager

# ENFORCED: Import unified cache for all API calls
from core.api_cache import api_cache, APIProvider, cached_llm_call

# Other imports
import json
import logging
import numpy as np

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class NumpyEncoder(json.JSONEncoder):
    """Custom JSON encoder to handle numpy types"""
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        elif isinstance(obj, np.floating):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        return super(NumpyEncoder, self).default(obj)


class FinancialAnalysisState(MessagesState):
    """Extended state for financial analysis multi-agent system"""
    simulation_data: Dict[str, Any]
    user_profile: Dict[str, Any]
    analysis_results: Dict[str, Any]
    explanation_cards: List[Dict[str, Any]]
    current_agent: str
    processing_stage: str
    rag_insights: Dict[str, Any]  # RAG-retrieved insights
    profile_context: Dict[str, Any]  # Profile-specific context from RAG


# DSPy Signatures for Financial Analysis
class FinancialDataAnalysis(Signature):
    """Analyze simulation data and user profile for financial insights"""
    simulation_data = InputField(desc="Raw simulation results from Monte Carlo analysis")
    user_profile = InputField(desc="User demographic and financial profile data")
    analysis_results = OutputField(desc="Structured financial analysis with key insights")


class ExplanationCardGeneration(Signature):
    """Generate explanation cards matching exact frontend format with constrained structure"""
    financial_analysis = InputField(desc="Analyzed financial insights")
    simulation_type = InputField(desc="Type of simulation (emergency_fund, student_loan, etc.)")
    user_profile = InputField(desc="User profile for personalization")
    explanation_cards = OutputField(desc="Array of exactly 3 AIActionPlan cards with constrained format")


class RationaleGeneration(Signature):
    """Generate detailed rationale for financial recommendations with constrained length"""
    recommendation = InputField(desc="Financial recommendation to explain")
    analysis_data = InputField(desc="Supporting financial analysis data")
    user_context = InputField(desc="User-specific context and constraints")
    rationale = OutputField(desc="Detailed explanation of why this recommendation is optimal (max 200 words)")


# DSPy Modules
class FinancialAnalyzer(Module):
    """DSPy module for analyzing simulation data"""
    
    def __init__(self):
        super().__init__()
        self.analyzer = dspy.ChainOfThought(FinancialDataAnalysis)
    
    def forward(self, simulation_data: str, user_profile: str) -> str:
        result = self.analyzer(
            simulation_data=simulation_data,
            user_profile=user_profile
        )
        return result.analysis_results


class CardGenerator(Module):
    """DSPy module for generating explanation cards with constrained format"""
    
    def __init__(self):
        super().__init__()
        self.generator = dspy.ChainOfThought(ExplanationCardGeneration)
    
    def forward(self, financial_analysis: str, simulation_type: str, user_profile: str) -> str:
        result = self.generator(
            financial_analysis=financial_analysis,
            simulation_type=simulation_type,
            user_profile=user_profile
        )
        return result.explanation_cards


class RationaleGenerator(Module):
    """DSPy module for generating detailed rationales with constrained length"""
    
    def __init__(self):
        super().__init__()
        self.generator = dspy.ChainOfThought(RationaleGeneration)
    
    def forward(self, recommendation: str, analysis_data: str, user_context: str) -> str:
        result = self.generator(
            recommendation=recommendation,
            analysis_data=analysis_data,
            user_context=user_context
        )
        return result.rationale


# LangGraph Agent Nodes
class FinancialAIAgentSystem:
    """LangGraph multi-agent system for financial explanation generation with RAG"""
    
    def __init__(self, batched_rag_service=None):
        # Configure DSPy with API keys from environment
        self.configure_dspy()
        
        # Initialize DSPy modules
        self.financial_analyzer = FinancialAnalyzer()
        self.card_generator = CardGenerator()
        self.rationale_generator = RationaleGenerator()
        
        # Initialize RAG manager
        self.rag_manager = get_rag_manager()
        
        # Use batched RAG service for optimized queries if available
        self.batched_rag_service = batched_rag_service
        
        # Build the LangGraph StateGraph with RAG integration
        self.graph = self.build_agent_graph()
    
    def configure_dspy(self):
        """ENFORCED: Configure DSPy with unified cached LLM provider"""
        try:
            # Use unified cache to select best provider
            provider = api_cache._select_best_provider()
            config = api_cache.configs[provider.value]
            
            # Create a cache-aware LM wrapper
            class CachedLM:
                def __init__(self, provider, config):
                    self.provider = provider
                    self.config = config
                
                def __call__(self, prompt, **kwargs):
                    # Use unified cache for all calls
                    return api_cache.cached_api_call_sync(
                        operation="dspy_completion",
                        provider=self.provider,
                        prompt=prompt,
                        **kwargs
                    )
            
            # Configure DSPy with cached wrapper
            lm = CachedLM(provider, config)
            dspy.configure(lm=lm)
            logger.info(f"DSPy configured with cached {provider.value} provider")
            
        except Exception as e:
            logger.error(f"Failed to configure DSPy: {e}")
            raise
    
    def build_agent_graph(self) -> StateGraph:
        """Build the LangGraph multi-agent system"""
        
        # Create StateGraph with custom state
        builder = StateGraph(FinancialAnalysisState)
        
        # Add agent nodes with RAG integration
        builder.add_node("rag_retriever", self.rag_retriever_node)  # New RAG node
        builder.add_node("data_analyzer", self.data_analyzer_node)
        builder.add_node("insight_generator", self.insight_generator_node)
        builder.add_node("card_formatter", self.card_formatter_node)
        builder.add_node("quality_validator", self.quality_validator_node)
        
        # Define the enhanced flow with RAG
        builder.add_edge(START, "rag_retriever")  # Start with RAG retrieval
        builder.add_edge("rag_retriever", "data_analyzer")
        builder.add_edge("data_analyzer", "insight_generator")
        builder.add_edge("insight_generator", "card_formatter")
        builder.add_edge("card_formatter", "quality_validator")
        builder.add_edge("quality_validator", END)
        
        # Compile with memory for state management
        memory = InMemorySaver()
        return builder.compile(checkpointer=memory)
    
    async def rag_retriever_node(self, state: FinancialAnalysisState) -> Command:
        """First agent: Retrieve relevant profile data using RAG system"""
        try:
            logger.info("RAG Retriever: Gathering profile-specific data")
            
            # Extract profile information from state
            user_profile = state.get("user_profile", {})
            simulation_data = state.get("simulation_data", {})
            scenario_name = simulation_data.get("scenario_name", "financial planning")
            
            # Determine profile ID from user_profile
            profile_id = user_profile.get("user_id", user_profile.get("profile_id", 1))
            
            # Use batched RAG service if available for optimized parallel queries
            if self.batched_rag_service:
                logger.info("Using batched RAG service for optimized queries")
                from rag.abstractions import BatchedRAGRequest, RAGQuery, QueryType
                
                # Create batch request with all queries
                queries = [
                    RAGQuery(
                        query_text=f"What are my current account balances and types for {scenario_name}?",
                        query_type=QueryType.ACCOUNTS
                    ),
                    RAGQuery(
                        query_text=f"What are my recent spending patterns and major expenses for {scenario_name}?",
                        query_type=QueryType.TRANSACTIONS
                    ),
                    RAGQuery(
                        query_text="What are my demographic details and risk profile for financial planning?",
                        query_type=QueryType.DEMOGRAPHICS
                    ),
                    RAGQuery(
                        query_text=f"What are my financial goals and current progress relevant to {scenario_name}?",
                        query_type=QueryType.GOALS
                    ),
                    RAGQuery(
                        query_text="What is my current investment portfolio and performance?",
                        query_type=QueryType.INVESTMENTS
                    ),
                    RAGQuery(
                        query_text=f"Analyze my complete financial situation for {scenario_name} planning",
                        query_type=QueryType.COMPREHENSIVE
                    )
                ]
                
                batch_request = BatchedRAGRequest(
                    profile_id=profile_id,
                    queries=queries,
                    scenario_context=scenario_name
                )
                
                # Execute batched queries in parallel
                batch_response = await self.batched_rag_service.execute_batch(batch_request)
                
                # Extract results from batch response
                rag_insights = {}
                rag_insights["accounts"] = batch_response.get_result(QueryType.ACCOUNTS).result if batch_response.get_result(QueryType.ACCOUNTS) else "N/A"
                rag_insights["spending_patterns"] = batch_response.get_result(QueryType.TRANSACTIONS).result if batch_response.get_result(QueryType.TRANSACTIONS) else "N/A"
                rag_insights["demographics"] = batch_response.get_result(QueryType.DEMOGRAPHICS).result if batch_response.get_result(QueryType.DEMOGRAPHICS) else "N/A"
                rag_insights["goals"] = batch_response.get_result(QueryType.GOALS).result if batch_response.get_result(QueryType.GOALS) else "N/A"
                rag_insights["investments"] = batch_response.get_result(QueryType.INVESTMENTS).result if batch_response.get_result(QueryType.INVESTMENTS) else "N/A"
                rag_insights["comprehensive"] = batch_response.get_result(QueryType.COMPREHENSIVE).result if batch_response.get_result(QueryType.COMPREHENSIVE) else "N/A"
                
                logger.info(f"Batched RAG queries completed in {batch_response.total_execution_time_ms:.2f}ms with {batch_response.success_rate:.2%} success rate")
                
            else:
                # Fallback to sequential queries if batched service not available
                logger.info("Using sequential RAG queries (batched service not available)")
                # Get profile RAG system
                profile_rag = self.rag_manager.get_profile_system(profile_id)
                
                # Perform comprehensive RAG queries
                rag_insights = {}
                
                # Query accounts for current financial position
                accounts_query = f"What are my current account balances and types for {scenario_name}?"
                rag_insights["accounts"] = profile_rag.query(accounts_query, "query_accounts")
                
                # Query spending patterns for expense analysis
                spending_query = f"What are my recent spending patterns and major expenses for {scenario_name}?"
                rag_insights["spending_patterns"] = profile_rag.query(spending_query, "query_transactions")
                
                # Query demographics for personalization
                demographics_query = f"What are my demographic details and risk profile for financial planning?"
                rag_insights["demographics"] = profile_rag.query(demographics_query, "query_demographics")
                
                # Query financial goals for alignment
                goals_query = f"What are my financial goals and current progress relevant to {scenario_name}?"
                rag_insights["goals"] = profile_rag.query(goals_query, "query_goals")
                
                # Query investments for portfolio context
                investments_query = f"What is my current investment portfolio and performance?"
                rag_insights["investments"] = profile_rag.query(investments_query, "query_investments")
                
                # Comprehensive financial analysis query
                comprehensive_query = f"Analyze my complete financial situation for {scenario_name} planning"
                rag_insights["comprehensive"] = profile_rag.query(comprehensive_query, "query_all_data")
            
            # Get profile context
            profile_rag = self.rag_manager.get_profile_system(profile_id) if not self.batched_rag_service else self.rag_manager.get_profile_system(profile_id)
            profile_context = {
                "profile_summary": profile_rag.get_profile_summary(),
                "available_tools": list(profile_rag.tools_registry.keys()),
                "data_sources": list(profile_rag.profile_data.keys())
            }
            
            logger.info(f"RAG Retriever: Retrieved {len(rag_insights)} insight categories")
            
            update = {
                "rag_insights": rag_insights,
                "profile_context": profile_context,
                "current_agent": "rag_retriever",
                "processing_stage": "rag_complete"
            }
            
            return Command(update=update)
            
        except Exception as e:
            logger.error(f"RAG Retriever error: {e}")
            # Provide fallback context if RAG fails
            fallback_insights = {
                "accounts": "Account information not available",
                "spending_patterns": "Spending data not available",
                "demographics": "Profile details not available",
                "goals": "Financial goals not available", 
                "investments": "Investment data not available",
                "comprehensive": "Comprehensive analysis not available"
            }
            
            update = {
                "rag_insights": fallback_insights,
                "profile_context": {"error": str(e)},
                "current_agent": "rag_retriever",
                "processing_stage": "rag_fallback"
            }
            
            return Command(update=update)
    
    async def data_analyzer_node(self, state: FinancialAnalysisState) -> Command:
        """Second agent: Analyze simulation data with RAG-enhanced context"""
        try:
            logger.info("Data Analyzer: Processing simulation data with RAG insights")
            
            # Extract data from state including RAG insights
            simulation_data = json.dumps(state.get("simulation_data", {}), cls=NumpyEncoder)
            user_profile = json.dumps(state.get("user_profile", {}), cls=NumpyEncoder)
            rag_insights = state.get("rag_insights", {})
            
            # Combine simulation data with RAG insights for enhanced analysis
            enhanced_context = {
                "simulation_data": state.get("simulation_data", {}),
                "user_profile": state.get("user_profile", {}),
                "rag_insights": rag_insights,
                "profile_context": state.get("profile_context", {})
            }
            
            enhanced_context_json = json.dumps(enhanced_context)
            
            # Use DSPy module for enhanced analysis
            analysis_results = self.financial_analyzer(enhanced_context_json, user_profile)
            
            # Parse the analysis results
            try:
                parsed_analysis = json.loads(analysis_results)
            except json.JSONDecodeError:
                # If not JSON, structure it
                parsed_analysis = {
                    "key_insights": analysis_results,
                    "risk_assessment": "Moderate",
                    "recommendations": []
                }
            
            update = {
                "analysis_results": parsed_analysis,
                "current_agent": "data_analyzer",
                "processing_stage": "analysis_complete"
            }
            
            return Command(update=update)
            
        except Exception as e:
            logger.error(f"Data Analyzer error: {e}")
            return Command(update={
                "analysis_results": {"error": str(e)},
                "current_agent": "data_analyzer",
                "processing_stage": "error"
            })
    
    async def insight_generator_node(self, state: FinancialAnalysisState) -> Command:
        """Second agent: Generate financial insights and recommendations"""
        try:
            logger.info("Insight Generator: Creating recommendations")
            
            # Use analysis results to generate insights
            analysis_data = json.dumps(state.get("analysis_results", {}), cls=NumpyEncoder)
            simulation_type = state.get("simulation_data", {}).get("scenario_name", "generic")
            user_profile = json.dumps(state.get("user_profile", {}), cls=NumpyEncoder)
            
            # Generate detailed rationales for each recommendation
            recommendations = state.get("analysis_results", {}).get("recommendations", [])
            enhanced_recommendations = []
            
            for rec in recommendations[:3]:  # Limit to 3 cards as per UI
                rationale = self.rationale_generator(
                    recommendation=json.dumps(rec),
                    analysis_data=analysis_data,
                    user_context=user_profile
                )
                enhanced_recommendations.append({
                    "recommendation": rec,
                    "rationale": rationale
                })
            
            update = {
                "analysis_results": {
                    **state.get("analysis_results", {}),
                    "enhanced_recommendations": enhanced_recommendations
                },
                "current_agent": "insight_generator",
                "processing_stage": "insights_generated"
            }
            
            return Command(update=update)
            
        except Exception as e:
            logger.error(f"Insight Generator error: {e}")
            return Command(update={
                "current_agent": "insight_generator",
                "processing_stage": "error"
            })
    
    async def card_formatter_node(self, state: FinancialAnalysisState) -> Command:
        """Third agent: Format cards to exact frontend specification with constrained structure"""
        try:
            logger.info("Card Formatter: Creating AIActionPlan cards with constrained format")
            
            simulation_type = state.get("simulation_data", {}).get("scenario_name", "generic")
            enhanced_recommendations = state.get("analysis_results", {}).get("enhanced_recommendations", [])
            
            # Create exactly 3 cards matching exact AIActionPlan interface
            explanation_cards = []
            
            # Define card templates based on simulation type
            card_templates = self.get_card_templates(simulation_type)
            
            for i in range(3):  # Always generate exactly 3 cards
                if i < len(enhanced_recommendations):
                    recommendation = enhanced_recommendations[i]["recommendation"]
                    rationale = enhanced_recommendations[i]["rationale"]
                else:
                    # Generate fallback recommendation
                    recommendation = self.generate_fallback_recommendation(simulation_type, i)
                    rationale = self.generate_fallback_rationale(simulation_type, i)
                
                # Use template for consistent structure
                template = card_templates[i] if i < len(card_templates) else card_templates[0]
                
                # Create card matching exact interface
                card = {
                    "id": f"{simulation_type}_{i+1}",
                    "title": template["title"],
                    "description": recommendation.get("description", template["description"]),
                    "tag": template["tag"],
                    "tagColor": template["tagColor"],
                    "potentialSaving": self.extract_potential_saving(recommendation, simulation_type),
                    "rationale": self.constrain_rationale(rationale, 200),  # Constrain to 200 words
                    "steps": self.generate_action_steps(recommendation, simulation_type),
                    "detailed_insights": self.generate_detailed_insights(
                        simulation_data=state.get("simulation_data", {}),
                        user_profile=state.get("user_profile", {}),
                        simulation_type=simulation_type,
                        strategy_type=i
                    )
                }
                
                explanation_cards.append(card)
            
            update = {
                "explanation_cards": explanation_cards,
                "current_agent": "card_formatter",
                "processing_stage": "cards_formatted"
            }
            
            return Command(update=update)
            
        except Exception as e:
            logger.error(f"Card Formatter error: {e}")
            return Command(update={
                "explanation_cards": [],
                "current_agent": "card_formatter",
                "processing_stage": "error"
            })
    
    def get_card_templates(self, simulation_type: str) -> list:
        """Get card templates for consistent structure"""
        if simulation_type.lower() in ["emergency_fund", "emergency fund"]:
            return [
                {
                    "title": "Conservative Strategy",
                    "description": "Build emergency fund with low-risk approach",
                    "tag": "LOW RISK",
                    "tagColor": "bg-green-500/20 text-green-300"
                },
                {
                    "title": "Balanced Growth",
                    "description": "Optimize savings with moderate risk",
                    "tag": "BALANCED",
                    "tagColor": "bg-blue-500/20 text-blue-300"
                },
                {
                    "title": "Aggressive Savings",
                    "description": "Maximize growth with higher risk tolerance",
                    "tag": "HIGH GROWTH",
                    "tagColor": "bg-purple-500/20 text-purple-300"
                }
            ]
        elif simulation_type.lower() in ["student_loan", "student loan"]:
            return [
                {
                    "title": "Debt Avalanche",
                    "description": "Pay highest interest rates first",
                    "tag": "PAY DEBT",
                    "tagColor": "bg-red-500/20 text-red-300"
                },
                {
                    "title": "Balanced Approach",
                    "description": "Balance debt payoff with other goals",
                    "tag": "BALANCED",
                    "tagColor": "bg-blue-500/20 text-blue-300"
                },
                {
                    "title": "Investment Focus",
                    "description": "Invest while paying minimum debt",
                    "tag": "INVEST",
                    "tagColor": "bg-green-500/20 text-green-300"
                }
            ]
        else:
            return [
                {
                    "title": "Conservative Plan",
                    "description": "Low-risk strategy with steady returns",
                    "tag": "CONSERVATIVE",
                    "tagColor": "bg-green-500/20 text-green-300"
                },
                {
                    "title": "Moderate Plan",
                    "description": "Balanced approach with moderate risk",
                    "tag": "MODERATE",
                    "tagColor": "bg-blue-500/20 text-blue-300"
                },
                {
                    "title": "Aggressive Plan",
                    "description": "Higher risk for maximum potential returns",
                    "tag": "AGGRESSIVE",
                    "tagColor": "bg-purple-500/20 text-purple-300"
                }
            ]
    
    def constrain_rationale(self, rationale: str, max_words: int) -> str:
        """Constrain rationale to specified word count"""
        words = rationale.split()
        if len(words) <= max_words:
            return rationale
        
        # Truncate to max_words and add ellipsis
        return " ".join(words[:max_words]) + "..."
    
    def generate_fallback_recommendation(self, simulation_type: str, index: int) -> dict:
        """Generate fallback recommendation when AI fails"""
        if simulation_type.lower() in ["emergency_fund", "emergency fund"]:
            strategies = [
                {"description": "Build emergency fund with high-yield savings"},
                {"description": "Optimize savings rate and reduce expenses"},
                {"description": "Consider side income to accelerate savings"}
            ]
        elif simulation_type.lower() in ["student_loan", "student loan"]:
            strategies = [
                {"description": "Focus on highest interest debt first"},
                {"description": "Balance debt payoff with other financial goals"},
                {"description": "Consider refinancing for lower rates"}
            ]
        else:
            strategies = [
                {"description": "Conservative approach with guaranteed returns"},
                {"description": "Balanced strategy with moderate risk"},
                {"description": "Aggressive growth with higher risk tolerance"}
            ]
        
        return strategies[index] if index < len(strategies) else strategies[0]
    
    def generate_fallback_rationale(self, simulation_type: str, index: int) -> str:
        """Generate fallback rationale when AI fails"""
        if simulation_type.lower() in ["emergency_fund", "emergency fund"]:
            rationales = [
                "This conservative approach ensures you build a solid emergency fund while maintaining financial stability. It's ideal for those who prioritize security over growth.",
                "This balanced strategy optimizes your savings rate while allowing for some growth potential. It provides a good middle ground between safety and returns.",
                "This aggressive approach maximizes your savings potential but requires discipline and risk tolerance. It's best for those with stable income and low expenses."
            ]
        elif simulation_type.lower() in ["student_loan", "student loan"]:
            rationales = [
                "The avalanche method minimizes total interest paid by targeting your highest interest debt first. This is mathematically optimal for debt reduction.",
                "This balanced approach allows you to pay down debt while still investing for the future. It's ideal for those who want to build wealth while reducing debt.",
                "This strategy focuses on investing while making minimum debt payments. It's best for those with low interest rates who can earn more through investments."
            ]
        else:
            rationales = [
                "This conservative approach prioritizes capital preservation and guaranteed returns. It's ideal for those who need stability and can't afford to lose money.",
                "This moderate strategy balances growth potential with risk management. It's suitable for most investors with a medium-term time horizon.",
                "This aggressive approach maximizes growth potential but comes with higher risk. It's best for those with long time horizons and high risk tolerance."
            ]
        
        return rationales[index] if index < len(rationales) else rationales[0]
    
    async def quality_validator_node(self, state: FinancialAnalysisState) -> Command:
        """Fourth agent: Validate card quality and ensure exactly 3 cards"""
        try:
            logger.info("Quality Validator: Validating card completeness")
            
            cards = state.get("explanation_cards", [])
            validated_cards = []
            
            for card in cards:
                # Validate required fields
                if not all(key in card for key in ["id", "title", "description", "tag", "tagColor", "potentialSaving", "rationale", "steps"]):
                    logger.warning(f"Card {card.get('id', 'unknown')} missing required fields")
                    continue
                
                # Ensure detailed insights are present
                if "detailed_insights" not in card:
                    card["detailed_insights"] = self.generate_detailed_insights(
                        simulation_data=state.get("simulation_data", {}),
                        user_profile=state.get("user_profile", {}),
                        simulation_type=state.get("simulation_data", {}).get("scenario_name", "generic"),
                        strategy_type=len(validated_cards)
                    )
                
                # Ensure rationale is meaningful and constrained
                if len(card["rationale"]) < 50:
                    card["rationale"] = f"This {card['title'].lower()} is recommended based on your financial profile and risk tolerance. Our analysis shows it aligns with your goals while maintaining appropriate risk levels."
                elif len(card["rationale"]) > 200:
                    card["rationale"] = self.constrain_rationale(card["rationale"], 200)
                
                # Ensure at least 3 action steps
                if len(card["steps"]) < 3:
                    card["steps"].extend([
                        "Monitor progress monthly",
                        "Adjust strategy as needed",
                        "Review quarterly"
                    ])
                
                validated_cards.append(card)
            
            # Ensure we have exactly 3 cards
            while len(validated_cards) < 3:
                simulation_type = state.get("simulation_data", {}).get("scenario_name", "generic")
                fallback_card = self.create_fallback_card(len(validated_cards) + 1, state.get("simulation_data", {}))
                validated_cards.append(fallback_card)
            
            # Limit to exactly 3 cards
            validated_cards = validated_cards[:3]
            
            update = {
                "explanation_cards": validated_cards,
                "current_agent": "quality_validator",
                "processing_stage": "validation_complete"
            }
            
            return Command(update=update)
            
        except Exception as e:
            logger.error(f"Quality Validator error: {e}")
            return Command(update={
                "current_agent": "quality_validator",
                "processing_stage": "error"
            })
    
    def extract_potential_saving(self, recommendation: Dict, simulation_type: str) -> int:
        """Extract or calculate potential savings from recommendation"""
        try:
            if simulation_type.lower() in ["emergency_fund", "emergency fund"]:
                return recommendation.get("monthly_growth", 250)
            elif simulation_type.lower() in ["student_loan", "student loan"]:
                return recommendation.get("interest_saved", 5000)
            else:
                return recommendation.get("potential_saving", 1000)
        except:
            return 500  # Default fallback
    
    def generate_action_steps(self, recommendation: Dict, simulation_type: str) -> List[str]:
        """Generate specific action steps for the recommendation"""
        try:
            if simulation_type.lower() in ["emergency_fund", "emergency fund"]:
                return [
                    "Open high-yield savings account with 4%+ APY",
                    "Set up automatic transfer of $500/month",
                    "Track progress toward 6-month expense goal"
                ]
            elif simulation_type.lower() in ["student_loan", "student loan"]:
                return [
                    "List all loans by interest rate (highest first)",
                    "Make minimum payments on all loans",
                    "Apply extra payments to highest-rate loan"
                ]
            else:
                return [
                    "Review current financial position",
                    "Implement recommended strategy",
                    "Monitor and adjust monthly"
                ]
        except:
            return ["Review recommendation", "Take appropriate action", "Monitor progress"]
    
    def create_fallback_card(self, card_num: int, simulation_data: Dict) -> Dict[str, Any]:
        """Create a fallback card when AI generation fails"""
        return {
            "id": f"fallback_{card_num}",
            "title": f"Financial Plan {card_num}",
            "description": "Optimized strategy based on your profile",
            "tag": "RECOMMENDED",
            "tagColor": "bg-blue-500",
            "potentialSaving": 500,
            "rationale": "This plan is tailored to your financial situation and risk tolerance. Our analysis shows it provides a good balance of growth and stability.",
            "steps": [
                "Review your current financial situation",
                "Set up automatic transfers",
                "Monitor progress monthly",
                "Adjust as needed"
            ],
            "detailed_insights": {
                "mechanics_explanation": "The simulation models your financial strategy using your current profile data and market assumptions. It accounts for various risk factors and competing priorities.",
                "key_insights": [
                    "Your income provides a stable foundation for this strategy",
                    "Your current debt level affects your financial flexibility",
                    "Your emergency fund coverage impacts your risk tolerance",
                    "Your spending patterns support this approach"
                ],
                "scenario_nuances": "The simulation assumes stable income and manageable expenses. Your current financial profile supports this approach, but any significant changes to income or expenses would require strategy adjustment.",
                "decision_context": "Monitor your key financial metrics and adjust the strategy if your income, expenses, or financial priorities change significantly. Success indicators include consistent progress toward your goals and maintaining financial stability."
            }
        }
    
    def generate_detailed_insights(
        self,
        simulation_data: Dict[str, Any],
        user_profile: Dict[str, Any],
        simulation_type: str,
        strategy_type: int
    ) -> Dict[str, Any]:
        """Generate detailed insights for a specific strategy."""
        
        # Extract key data
        income = user_profile.get('income', 0)
        debt = user_profile.get('total_debt', 0)
        emergency_fund = user_profile.get('emergency_fund', 0)
        monthly_expenses = user_profile.get('monthly_expenses', 0)
        
        # Get simulation results
        result = simulation_data.get("result", {})
        percentiles = result.get("percentiles", {})
        probability_success = result.get("probability_success", 0)
        
        # Strategy-specific insights
        strategy_names = ["Conservative", "Balanced", "Aggressive"]
        strategy_name = strategy_names[strategy_type] if strategy_type < len(strategy_names) else "Custom"
        
        if simulation_type.lower() in ["emergency_fund", "emergency fund"]:
            return {
                "mechanics_explanation": f"The simulation models your path to a 6-month emergency fund using your current ${emergency_fund:,.0f} balance and monthly expenses. It accounts for potential income disruptions and competing financial priorities.",
                "key_insights": [
                    f"Your current emergency fund covers {emergency_fund/monthly_expenses:.1f} months of expenses",
                    f"Your monthly income of ${income:,.0f} supports consistent savings",
                    f"Your debt-to-income ratio of {debt/income*12:.1%} affects your savings capacity",
                    f"Your current savings rate can be increased to accelerate the timeline"
                ],
                "scenario_nuances": f"The {strategy_name.lower()} strategy assumes you can redirect discretionary spending to emergency fund building. Your income stability supports this approach, but any disruption would significantly impact the timeline and potentially force you to dip into the emergency fund before it's fully established.",
                "decision_context": f"Monitor your monthly savings rate and emergency fund balance. If your income drops significantly or emergency fund falls below 2 months of expenses, pause the strategy and rebuild your safety net first. Success indicators include emergency fund growing consistently and maintaining 2+ months of expenses."
            }
        elif simulation_type.lower() in ["student_loan", "student loan"]:
            return {
                "mechanics_explanation": f"The simulation models your debt payoff timeline using your ${income:,.0f} monthly income, ${debt:,.0f} current debt, and {strategy_name.lower()} payment strategy. It accounts for potential income increases, emergency expenses, and market volatility.",
                "key_insights": [
                    f"Your debt-to-income ratio of {debt/income*12:.1%} allows for {strategy_name.lower()} payoff strategy",
                    f"Your student loan rate of 6.8% is higher than typical investment returns",
                    f"Your emergency fund covers {emergency_fund/income*12:.1f} months of income",
                    f"Your income stability supports consistent debt payments"
                ],
                "scenario_nuances": f"Your timeline is most sensitive to maintaining {strategy_name.lower()} monthly payments. If you reduce payments, the payoff extends significantly. The simulation assumes no major emergencies, but your current emergency fund provides limited coverage, creating risk if unexpected expenses arise.",
                "decision_context": f"Monitor your ability to maintain {strategy_name.lower()} monthly payments and your emergency fund balance. If your emergency fund drops below 1 month of expenses, consider reducing debt payments temporarily. Success indicators include debt balance decreasing consistently and emergency fund staying above minimum threshold."
            }
        else:
            return {
                "mechanics_explanation": f"The simulation models your financial strategy using your current profile data and market assumptions. It accounts for various risk factors and competing priorities.",
                "key_insights": [
                    f"Your income of ${income:,.0f}/month provides stable foundation",
                    f"Your debt level of ${debt:,.0f} affects your financial flexibility",
                    f"Your emergency fund covers {emergency_fund/income*12:.1f} months of income",
                    f"Your current financial position supports this {strategy_name.lower()} strategy"
                ],
                "scenario_nuances": f"The {strategy_name.lower()} strategy assumes stable income and manageable expenses. Your current financial profile supports this approach, but any significant changes to income or expenses would require strategy adjustment.",
                "decision_context": f"Monitor your key financial metrics and adjust the strategy if your income, expenses, or financial priorities change significantly. Success indicators include consistent progress toward your goals and maintaining financial stability."
            }
    
    async def generate_explanation_cards(
        self, 
        simulation_data: Dict[str, Any], 
        user_profile: Dict[str, Any],
        scenario_context: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Main entry point for generating explanation cards"""
        try:
            logger.info(f"Starting LangGraph-DSPy card generation for scenario: {scenario_context}")
            
            # Prepare initial state with RAG fields and scenario context
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
            
            # Run the multi-agent system
            config = {"thread_id": f"session_{datetime.now().timestamp()}"}
            final_state = await self.graph.ainvoke(initial_state, config=config)
            
            # Return the generated cards
            return final_state.get("explanation_cards", [])
            
        except Exception as e:
            logger.error(f"Card generation failed: {e}")
            
            # Check if it's a rate limit error
            if "rate_limit" in str(e).lower() or "429" in str(e):
                logger.warning("Rate limit detected, using scenario-specific fallback cards")
                return self.generate_scenario_specific_fallback_cards(simulation_data, user_profile, scenario_context)
            
            # Return fallback cards
            return [
                self.create_fallback_card(i+1, simulation_data) 
                for i in range(3)
            ]

    def generate_scenario_specific_fallback_cards(
        self, 
        simulation_data: Dict[str, Any], 
        user_profile: Dict[str, Any],
        scenario_context: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Generate scenario-specific fallback cards when LLM fails"""
        try:
            scenario_type = scenario_context or simulation_data.get("scenario_name", "financial_planning")
            
            # Map scenario types to specific generators
            if "job-loss" in scenario_type.lower() or "emergency" in scenario_type.lower():
                return self.generate_job_loss_cards(simulation_data, user_profile)
            elif "student" in scenario_type.lower() or "loan" in scenario_type.lower():
                return self.generate_student_loan_cards(simulation_data, user_profile)
            elif "medical" in scenario_type.lower() or "crisis" in scenario_type.lower():
                return self.generate_medical_crisis_cards(simulation_data, user_profile)
            elif "market" in scenario_type.lower() or "crash" in scenario_type.lower():
                return self.generate_market_crash_cards(simulation_data, user_profile)
            elif "home" in scenario_type.lower() or "purchase" in scenario_type.lower():
                return self.generate_home_purchase_cards(simulation_data, user_profile)
            elif "gig" in scenario_type.lower() or "economy" in scenario_type.lower():
                return self.generate_gig_economy_cards(simulation_data, user_profile)
            else:
                return self.generate_emergency_fund_cards(simulation_data, user_profile)
                
        except Exception as e:
            logger.error(f"Failed to generate scenario-specific fallback cards: {e}")
            return self.generate_generic_cards(simulation_data, user_profile)

    def generate_job_loss_cards(self, simulation_data: Dict[str, Any], user_profile: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate job loss specific cards"""
        survival_months = simulation_data.get("survival_months", 2)
    monthly_expenses = simulation_data.get("monthly_expenses", 3000)
    emergency_fund = simulation_data.get("emergency_fund", 10000)
    
    return [
        {
            "id": "job_loss_emergency",
            "title": "Emergency Fund Optimization",
            "description": "Maximize your job loss survival time",
            "tag": "URGENT",
            "tagColor": "bg-red-500",
            "potentialSaving": int(monthly_expenses * 3),  # 3 months of expenses
            "rationale": f"Your current emergency fund covers {survival_months} months of expenses. This plan focuses on extending your survival time to 6 months.",
            "steps": [
                f"Cut non-essential expenses by ${monthly_expenses * 0.3:.0f}/month",
                "Build emergency fund to cover 6 months of expenses",
                "Explore unemployment benefits and side income",
                "Review and reduce monthly bills"
            ]
        },
        {
            "id": "job_loss_income",
            "title": "Income Diversification Strategy",
            "description": "Create multiple income streams",
            "tag": "STRATEGIC",
            "tagColor": "bg-blue-500",
            "potentialSaving": int(monthly_expenses * 2),
            "rationale": "Diversifying income sources reduces dependency on a single job and provides financial resilience during job loss.",
            "steps": [
                "Develop freelance or consulting skills",
                "Start a side business or gig work",
                "Build passive income streams",
                "Network for job opportunities"
            ]
        },
        {
            "id": "job_loss_expenses",
            "title": "Expense Reduction Plan",
            "description": "Minimize monthly expenses during job loss",
            "tag": "CONSERVATIVE",
            "tagColor": "bg-green-500",
            "potentialSaving": int(monthly_expenses * 0.4),
            "rationale": "Reducing expenses by 40% can extend your emergency fund coverage and provide more time to find new employment.",
            "steps": [
                "Create a bare-bones budget",
                "Negotiate lower rates on bills",
                "Cancel non-essential subscriptions",
                "Use public transportation"
            ]
        }
    ]

def generate_emergency_fund_cards(self, simulation_data: Dict[str, Any], user_profile: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Generate emergency fund specific cards"""
    target_months = simulation_data.get("target_months", 6)
    monthly_contribution = simulation_data.get("monthly_contribution", 500)
    current_fund = simulation_data.get("emergency_fund", 2000)
    
    return [
        {
            "id": "emergency_fund_aggressive",
            "title": "Aggressive Emergency Fund Build",
            "description": "Reach your emergency fund goal faster",
            "tag": "AGGRESSIVE",
            "tagColor": "bg-purple-500",
            "potentialSaving": int(monthly_contribution * 1.5),
            "rationale": f"By increasing your monthly contribution by 50%, you can reach your {target_months}-month emergency fund goal faster.",
            "steps": [
                "Increase monthly contribution to $750",
                "Cut discretionary spending",
                "Use windfalls for emergency fund",
                "Automate transfers"
            ]
        },
        {
            "id": "emergency_fund_balanced",
            "title": "Balanced Emergency Fund Strategy",
            "description": "Steady progress toward your goal",
            "tag": "BALANCED",
            "tagColor": "bg-blue-500",
            "potentialSaving": monthly_contribution,
            "rationale": f"Maintaining your current contribution rate will build your emergency fund to cover {target_months} months of expenses.",
            "steps": [
                "Maintain current contribution rate",
                "Review and optimize expenses",
                "Set up automatic transfers",
                "Monitor progress monthly"
            ]
        },
        {
            "id": "emergency_fund_conservative",
            "title": "Conservative Emergency Fund Approach",
            "description": "Build emergency fund while maintaining lifestyle",
            "tag": "CONSERVATIVE",
            "tagColor": "bg-green-500",
            "potentialSaving": int(monthly_contribution * 0.8),
            "rationale": "A slightly reduced contribution rate allows for lifestyle maintenance while still building emergency savings.",
            "steps": [
                "Start with smaller contributions",
                "Gradually increase over time",
                "Focus on consistency",
                "Build sustainable habits"
            ]
        }
    ]

def generate_student_loan_cards(self, simulation_data: Dict[str, Any], user_profile: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Generate student loan specific cards"""
    return [
        {
            "id": "student_loan_avalanche",
            "title": "Debt Avalanche Method",
            "description": "Pay off highest interest loans first",
            "tag": "AGGRESSIVE",
            "tagColor": "bg-purple-500",
            "potentialSaving": 5000,
            "rationale": "Focusing on high-interest loans first minimizes total interest paid and accelerates debt freedom.",
            "steps": [
                "List all loans by interest rate",
                "Pay minimum on all except highest rate",
                "Apply extra payments to highest rate loan",
                "Repeat until all loans are paid"
            ]
        },
        {
            "id": "student_loan_snowball",
            "title": "Debt Snowball Method",
            "description": "Pay off smallest balances first",
            "tag": "MOTIVATIONAL",
            "tagColor": "bg-blue-500",
            "potentialSaving": 4000,
            "rationale": "Paying off smaller loans first provides quick wins and motivation to continue debt payoff.",
            "steps": [
                "List all loans by balance size",
                "Pay minimum on all except smallest",
                "Apply extra payments to smallest loan",
                "Celebrate each loan payoff"
            ]
        },
        {
            "id": "student_loan_refinance",
            "title": "Loan Refinancing Strategy",
            "description": "Lower interest rates through refinancing",
            "tag": "STRATEGIC",
            "tagColor": "bg-green-500",
            "potentialSaving": 3000,
            "rationale": "Refinancing to lower rates can significantly reduce total interest paid and monthly payments.",
            "steps": [
                "Check current credit score",
                "Compare refinancing options",
                "Calculate total savings",
                "Apply for best rate available"
            ]
        }
    ]

def generate_medical_crisis_cards(self, simulation_data: Dict[str, Any], user_profile: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Generate medical crisis specific cards"""
    return [
        {
            "id": "medical_insurance",
            "title": "Insurance Optimization",
            "description": "Maximize health insurance coverage",
            "tag": "URGENT",
            "tagColor": "bg-red-500",
            "potentialSaving": 8000,
            "rationale": "Proper health insurance coverage is critical for managing medical costs and protecting your finances.",
            "steps": [
                "Review current health insurance",
                "Compare coverage options",
                "Consider HSA contributions",
                "Understand deductibles and copays"
            ]
        },
        {
            "id": "medical_emergency_fund",
            "title": "Medical Emergency Fund",
            "description": "Build dedicated medical savings",
            "tag": "PREVENTIVE",
            "tagColor": "bg-blue-500",
            "potentialSaving": 5000,
            "rationale": "A dedicated medical emergency fund provides financial protection against unexpected healthcare costs.",
            "steps": [
                "Calculate typical medical costs",
                "Set aside monthly medical savings",
                "Consider HSA for tax advantages",
                "Review and adjust annually"
            ]
        },
        {
            "id": "medical_cost_reduction",
            "title": "Medical Cost Reduction",
            "description": "Minimize healthcare expenses",
            "tag": "STRATEGIC",
            "tagColor": "bg-green-500",
            "potentialSaving": 3000,
            "rationale": "Proactive health management and cost-conscious healthcare choices can significantly reduce medical expenses.",
            "steps": [
                "Use in-network providers",
                "Negotiate medical bills",
                "Preventive care focus",
                "Shop for prescriptions"
            ]
        }
    ]

def generate_market_crash_cards(self, simulation_data: Dict[str, Any], user_profile: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Generate market crash specific cards"""
    return [
        {
            "id": "market_diversification",
            "title": "Portfolio Diversification",
            "description": "Protect against market volatility",
            "tag": "DEFENSIVE",
            "tagColor": "bg-blue-500",
            "potentialSaving": 10000,
            "rationale": "A well-diversified portfolio reduces risk and provides stability during market downturns.",
            "steps": [
                "Review current asset allocation",
                "Increase bond allocation",
                "Add international exposure",
                "Consider defensive sectors"
            ]
        },
        {
            "id": "market_dollar_cost",
            "title": "Dollar-Cost Averaging",
            "description": "Continue investing during downturns",
            "tag": "OPPORTUNISTIC",
            "tagColor": "bg-purple-500",
            "potentialSaving": 15000,
            "rationale": "Continuing to invest during market downturns allows you to buy assets at lower prices.",
            "steps": [
                "Maintain regular investment schedule",
                "Increase contributions if possible",
                "Focus on long-term goals",
                "Avoid emotional decisions"
            ]
        },
        {
            "id": "market_emergency_prep",
            "title": "Emergency Fund Protection",
            "description": "Ensure emergency fund adequacy",
            "tag": "CONSERVATIVE",
            "tagColor": "bg-green-500",
            "potentialSaving": 6000,
            "rationale": "Adequate emergency funds prevent the need to sell investments during market downturns.",
            "steps": [
                "Increase emergency fund to 12 months",
                "Keep emergency funds in cash",
                "Review expenses and reduce debt",
                "Maintain stable income sources"
            ]
        }
    ]

def generate_home_purchase_cards(self, simulation_data: Dict[str, Any], user_profile: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Generate home purchase specific cards"""
    return [
        {
            "id": "home_down_payment",
            "title": "Down Payment Acceleration",
            "description": "Save for home purchase faster",
            "tag": "AGGRESSIVE",
            "tagColor": "bg-purple-500",
            "potentialSaving": 50000,
            "rationale": "A larger down payment reduces monthly mortgage payments and eliminates PMI costs.",
            "steps": [
                "Set aggressive savings goal",
                "Cut discretionary spending",
                "Use windfalls for down payment",
                "Consider down payment assistance"
            ]
        },
        {
            "id": "home_credit_optimization",
            "title": "Credit Score Optimization",
            "description": "Improve mortgage eligibility",
            "tag": "STRATEGIC",
            "tagColor": "bg-blue-500",
            "potentialSaving": 20000,
            "rationale": "A higher credit score qualifies you for better mortgage rates, saving thousands over the loan term.",
            "steps": [
                "Check and dispute credit errors",
                "Pay bills on time consistently",
                "Reduce credit utilization",
                "Avoid new credit applications"
            ]
        },
        {
            "id": "home_affordability",
            "title": "Home Affordability Analysis",
            "description": "Determine realistic home budget",
            "tag": "CONSERVATIVE",
            "tagColor": "bg-green-500",
            "potentialSaving": 15000,
            "rationale": "Understanding true home affordability prevents overextension and financial stress.",
            "steps": [
                "Calculate debt-to-income ratio",
                "Factor in all homeownership costs",
                "Maintain emergency fund",
                "Consider future expenses"
            ]
        }
    ]

    def generate_gig_economy_cards(self, simulation_data: Dict[str, Any], user_profile: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate gig economy specific cards"""
        try:
            # Extract simulation results
            survival_months = simulation_data.get("survival_months", 2)
            monthly_expenses = simulation_data.get("monthly_expenses", 3000)
            emergency_fund = simulation_data.get("emergency_fund", 5000)
            
            return [
                {
                    "id": "gig_income_diversification",
                    "title": "Income Diversification Strategy",
                    "description": "Build multiple income streams to reduce volatility",
                    "tag": "CONSERVATIVE",
                    "tagColor": "bg-green-500",
                    "potentialSaving": 2000,
                    "rationale": f"Your current emergency fund covers {survival_months} months. Diversify income sources to reduce reliance on single gig platform.",
                    "steps": [
                        "Identify 3-5 different gig platforms",
                        "Develop complementary skills (driving, delivery, virtual assistance)",
                        "Set up automatic savings from each income stream",
                        "Track income patterns to optimize earnings"
                    ]
                },
                {
                    "id": "gig_expense_optimization", 
                    "title": "Expense Optimization Plan",
                    "description": "Reduce monthly expenses to extend financial runway",
                    "tag": "BALANCED",
                    "tagColor": "bg-blue-500",
                    "potentialSaving": 1500,
                    "rationale": f"Your monthly expenses of ${monthly_expenses:,} can be optimized. Focus on essential spending and flexible housing options.",
                    "steps": [
                        "Review and categorize all monthly expenses",
                        "Negotiate better rates for utilities and services",
                        "Consider shared housing or flexible lease options",
                        "Build emergency fund to cover 6 months of expenses"
                    ]
                },
                {
                    "id": "gig_skill_development",
                    "title": "Skill Development Investment",
                    "description": "Invest in skills that command higher rates",
                    "tag": "AGGRESSIVE", 
                    "tagColor": "bg-purple-500",
                    "potentialSaving": 3000,
                    "rationale": "Focus on high-value skills like programming, design, or specialized services that command premium rates.",
                    "steps": [
                        "Identify high-paying gig opportunities in your area",
                        "Invest in online courses for in-demand skills",
                        "Build portfolio and testimonials for premium pricing",
                        "Network with other gig workers for opportunities"
                    ]
                }
            ]
        except Exception as e:
            logger.error(f"Error generating gig economy cards: {e}")
            return self.generate_generic_cards(simulation_data, user_profile)

    def generate_generic_cards(self, simulation_data: Dict[str, Any], user_profile: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate generic financial planning cards"""
        return [
            {
                "id": "generic_conservative",
                "title": "Conservative Financial Plan",
                "description": "Focus on stability and security",
                "tag": "CONSERVATIVE",
                "tagColor": "bg-green-500",
                "potentialSaving": 1000,
                "rationale": "A conservative approach prioritizes financial stability and risk management.",
                "steps": [
                    "Build emergency fund",
                    "Pay off high-interest debt",
                    "Invest in stable assets",
                    "Review insurance coverage"
                ]
            },
            {
                "id": "generic_balanced",
                "title": "Balanced Financial Strategy",
                "description": "Balance growth and stability",
                "tag": "BALANCED",
                "tagColor": "bg-blue-500",
                "potentialSaving": 1500,
                "rationale": "A balanced approach provides moderate growth while maintaining financial security.",
                "steps": [
                    "Diversify investments",
                    "Maintain emergency fund",
                    "Regular financial reviews",
                    "Adjust strategy as needed"
                ]
            },
            {
                "id": "generic_aggressive",
                "title": "Aggressive Growth Plan",
                "description": "Maximize long-term growth potential",
                "tag": "AGGRESSIVE",
                "tagColor": "bg-purple-500",
                "potentialSaving": 2000,
                "rationale": "An aggressive strategy focuses on maximizing long-term wealth building potential.",
                "steps": [
                    "Increase investment contributions",
                    "Focus on growth assets",
                    "Minimize unnecessary expenses",
                    "Regular portfolio rebalancing"
                ]
            }
        ]

    async def generate_explanations(
        self,
        simulation_result: Dict[str, Any],
        profile_data: Dict[str, Any],
        scenario_type: str
    ) -> List[Dict[str, Any]]:
        """
        Main API entry point for generating AI explanations using Anthropic/OpenAI.
        This method is called from the API endpoint and uses the enhanced AI layer.
        
        Args:
            simulation_result: The Monte Carlo simulation results
            profile_data: User profile information
            scenario_type: Type of financial scenario (e.g., 'medical_crisis')
            
        Returns:
            List of AI-generated action plan cards with personalized insights
        """
        try:
            logger.info(f"Generating AI explanations for scenario: {scenario_type}")
            
            # Use the unified API cache to ensure we're using Anthropic/OpenAI
            provider = api_cache._select_best_provider()
            logger.info(f"Using {provider.value} for AI explanation generation")
            
            # Generate personalized insights using the Anthropic API
            cards = await self._generate_ai_powered_cards(
                simulation_result, profile_data, scenario_type, provider
            )
            
            # Ensure we have exactly 3 cards with proper formatting
            validated_cards = self._validate_and_format_cards(cards, simulation_result, profile_data)
            
            return validated_cards
            
        except Exception as e:
            logger.error(f"Failed to generate AI explanations: {e}")
            # Fall back to the explanation cards method which has more robust handling
            return await self.generate_explanation_cards(
                simulation_data=simulation_result,
                user_profile=profile_data,
                scenario_context=scenario_type
            )
    
    async def _generate_ai_powered_cards(
        self,
        simulation_result: Dict[str, Any],
        profile_data: Dict[str, Any],
        scenario_type: str,
        provider: APIProvider
    ) -> List[Dict[str, Any]]:
        """Generate cards using direct AI API calls for maximum personalization"""
        
        # Extract key metrics from simulation
        result = simulation_result.get("result", {})
        percentiles = result.get("percentiles", {})
        probability_success = result.get("probability_success", 0)
        
        # Extract profile metrics
        monthly_income = profile_data.get("monthly_income", 5000)
        monthly_expenses = profile_data.get("monthly_expenses", 3000)
        emergency_fund = profile_data.get("emergency_fund", 10000)
        total_debt = profile_data.get("student_loan_balance", 0) + profile_data.get("credit_card_debt", 0)
        
        # Build comprehensive prompt for AI
        prompt = f"""
        Generate exactly 3 personalized financial action plans for a {scenario_type.replace('_', ' ')} scenario.
        
        User Profile:
        - Monthly Income: ${monthly_income:,.0f}
        - Monthly Expenses: ${monthly_expenses:,.0f}
        - Emergency Fund: ${emergency_fund:,.0f}
        - Total Debt: ${total_debt:,.0f}
        - Age: {profile_data.get('age', 30)}
        - Risk Tolerance: {profile_data.get('risk_tolerance', 'moderate')}
        
        Simulation Results:
        - Success Probability: {probability_success:.1%}
        - Median Timeline: {percentiles.get('p50', 12):.1f} months
        - Best Case (90th percentile): {percentiles.get('p90', 6):.1f} months
        - Worst Case (10th percentile): {percentiles.get('p10', 24):.1f} months
        
        Generate 3 action plans (Conservative, Balanced, Aggressive) with this EXACT JSON structure:
        [
            {{
                "id": "conservative_plan",
                "title": "Conservative Strategy Name",
                "description": "Brief description of the conservative approach",
                "tag": "CONSERVATIVE",
                "tagColor": "bg-green-500/20 text-green-300",
                "potentialSaving": <numeric_value_or_months>,
                "rationale": "150-200 word personalized explanation using specific numbers from the user's profile and simulation results. Explain why this approach makes sense for their situation.",
                "steps": [
                    "Specific action step 1 with numbers",
                    "Specific action step 2 with timeline",
                    "Specific action step 3 with target amounts",
                    "Specific action step 4 with monitoring cadence"
                ]
            }},
            {{
                "id": "balanced_plan",
                "title": "Balanced Strategy Name",
                "description": "Brief description of the balanced approach",
                "tag": "BALANCED",
                "tagColor": "bg-blue-500/20 text-blue-300",
                "potentialSaving": <numeric_value_or_months>,
                "rationale": "150-200 word personalized explanation...",
                "steps": [...]
            }},
            {{
                "id": "aggressive_plan",
                "title": "Aggressive Strategy Name",
                "description": "Brief description of the aggressive approach",
                "tag": "AGGRESSIVE",
                "tagColor": "bg-purple-500/20 text-purple-300",
                "potentialSaving": <numeric_value_or_months>,
                "rationale": "150-200 word personalized explanation...",
                "steps": [...]
            }}
        ]
        
        Make the advice specific to a {scenario_type.replace('_', ' ')} situation.
        Use actual numbers from their profile in the rationale and steps.
        Ensure each strategy is meaningfully different and appropriate for the risk level.
        """
        
        try:
            # Call the AI API through unified cache
            response = await api_cache.cached_api_call(
                operation="explanation_generation",
                provider=provider,
                prompt=prompt,
                temperature=0.7,
                max_tokens=2000
            )
            
            # Parse the AI response
            import json
            import re
            
            # Try to extract JSON from the response
            json_match = re.search(r'\[.*\]', response, re.DOTALL)
            if json_match:
                cards = json.loads(json_match.group())
                return cards
            else:
                # If no JSON found, try to parse the entire response
                cards = json.loads(response)
                return cards
                
        except Exception as e:
            logger.error(f"Failed to parse AI response: {e}")
            # Fall back to scenario-specific cards
            return self.generate_scenario_specific_fallback_cards(
                simulation_result, profile_data, scenario_type
            )
    
    def _validate_and_format_cards(
        self,
        cards: List[Dict[str, Any]],
        simulation_result: Dict[str, Any],
        profile_data: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Validate and format AI-generated cards to ensure consistency"""
        
        validated_cards = []
        required_fields = ["id", "title", "description", "tag", "tagColor", "potentialSaving", "rationale", "steps"]
        
        for i, card in enumerate(cards[:3]):  # Ensure only 3 cards
            # Validate required fields
            if not all(field in card for field in required_fields):
                logger.warning(f"Card {i} missing required fields, using fallback")
                card = self.create_fallback_card(i + 1, simulation_result)
            
            # Ensure rationale length is appropriate
            if len(card.get("rationale", "")) < 50:
                card["rationale"] = self._enhance_rationale(card, simulation_result, profile_data)
            
            # Ensure we have at least 4 steps
            if len(card.get("steps", [])) < 4:
                card["steps"] = self._enhance_steps(card, simulation_result, profile_data)
            
            # Add detailed insights if not present
            if "detailed_insights" not in card:
                card["detailed_insights"] = self.generate_detailed_insights(
                    simulation_result, profile_data,
                    simulation_result.get("scenario_name", "financial_planning"),
                    i
                )
            
            validated_cards.append(card)
        
        # Ensure we have exactly 3 cards
        while len(validated_cards) < 3:
            validated_cards.append(self.create_fallback_card(len(validated_cards) + 1, simulation_result))
        
        return validated_cards[:3]
    
    def _enhance_rationale(
        self,
        card: Dict[str, Any],
        simulation_result: Dict[str, Any],
        profile_data: Dict[str, Any]
    ) -> str:
        """Enhance a short rationale with more detail"""
        
        monthly_income = profile_data.get("monthly_income", 5000)
        emergency_fund = profile_data.get("emergency_fund", 10000)
        
        base_rationale = card.get("rationale", "")
        enhancement = f" Based on your ${monthly_income:,.0f} monthly income and ${emergency_fund:,.0f} emergency fund, " \
                      f"this {card.get('tag', 'strategy').lower()} approach aligns with your financial profile and goals."
        
        return base_rationale + enhancement
    
    def _enhance_steps(
        self,
        card: Dict[str, Any],
        simulation_result: Dict[str, Any],
        profile_data: Dict[str, Any]
    ) -> List[str]:
        """Enhance steps with more specific actions"""
        
        steps = card.get("steps", [])
        
        # Add generic steps if needed
        generic_steps = [
            "Review and adjust strategy monthly",
            "Track progress against targets",
            "Maintain emergency fund coverage",
            "Reassess risk tolerance quarterly"
        ]
        
        while len(steps) < 4:
            if generic_steps:
                steps.append(generic_steps.pop(0))
            else:
                steps.append("Monitor financial metrics regularly")
        
        return steps[:4]