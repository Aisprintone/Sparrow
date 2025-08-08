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

# Other imports
import json
import logging
import numpy as np
import time

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
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
    """Generate PERSONALIZED explanation cards with specific financial numbers and demographics"""
    financial_analysis = InputField(desc="Analyzed financial insights with specific numbers")
    simulation_type = InputField(desc="Type of simulation (emergency_fund, student_loan, etc.)")
    user_profile = InputField(desc="User profile with income, age, demographic, debt levels, and financial numbers")
    explanation_cards = OutputField(desc="Array of exactly 3 PERSONALIZED cards with user's actual $ amounts, demographic-specific language, and actionable titles")


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
        # Enhanced prompt with explicit personalization instructions
        enhanced_prompt = f"""
        CRITICAL: Generate PERSONALIZED advice for this SPECIFIC user:
        {user_profile}
        
        REQUIREMENTS:
        1. Use their ACTUAL income and expense numbers in recommendations
        2. Reference their specific demographic and age group
        3. Create actionable titles (NOT generic 'Financial Plan 1/2/3')
        4. Include specific dollar amounts and timelines
        5. Use age-appropriate language (Gen Z vs Millennial vs Mid-career)
        
        Simulation Type: {simulation_type}
        Analysis: {financial_analysis}
        """
        
        result = self.generator(
            financial_analysis=financial_analysis,
            simulation_type=simulation_type,
            user_profile=enhanced_prompt
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
    
    def __init__(self):
        print("[AI SYSTEM] 🚀 Initializing Financial AI Agent System")
        
        # Configure DSPy with API keys from environment
        print("[AI SYSTEM] 🔄 Configuring DSPy with LLM providers")
        self.configure_dspy()
        
        # Initialize DSPy modules
        print("[AI SYSTEM] 🔄 Initializing DSPy modules")
        self.financial_analyzer = FinancialAnalyzer()
        self.card_generator = CardGenerator()
        self.rationale_generator = RationaleGenerator()
        print("[AI SYSTEM] ✅ DSPy modules initialized")
        
        # Initialize RAG manager
        print("[AI SYSTEM] 🔄 Initializing RAG manager")
        self.rag_manager = get_rag_manager()
        print("[AI SYSTEM] ✅ RAG manager initialized")
        
        # Build the LangGraph StateGraph with RAG integration
        print("[AI SYSTEM] 🔄 Building agent graph")
        self.graph = self.build_agent_graph()
        print("[AI SYSTEM] ✅ Agent graph built successfully")
        print("[AI SYSTEM] 🎉 AI System initialization completed")
    
    def configure_dspy(self):
        """Configure DSPy with available LLM providers"""
        print("[AI SYSTEM] 🔧 Configuring DSPy with LLM providers")
        
        try:
            # Try Anthropic first (primary choice)
            if os.getenv("ANTHROPIC_API_KEY"):
                print("[AI SYSTEM] 🎯 Using Anthropic Claude 3.5 Sonnet")
                # Configure with proper rate limit handling
                lm = dspy.LM(
                    "anthropic/claude-3-5-sonnet-20241022", 
                    api_key=os.getenv("ANTHROPIC_API_KEY"),
                    max_retries=3,  # Add retries for rate limits
                    timeout=60.0,   # Increase timeout
                    temperature=0.7  # Add temperature for better responses
                )
                dspy.configure(lm=lm)
                print("[AI SYSTEM] ✅ DSPy configured with Anthropic Claude 3.5 Sonnet")
                return
            
            # Try OpenAI as fallback
            if os.getenv("OPENAI_API_KEY"):
                print("[AI SYSTEM] 🎯 Using OpenAI GPT-4o-mini")
                lm = dspy.LM(
                    "openai/gpt-4o-mini", 
                    api_key=os.getenv("OPENAI_API_KEY"),
                    max_retries=3,  # Add retries for rate limits
                    timeout=60.0,   # Increase timeout
                    temperature=0.7  # Add temperature for better responses
                )
                dspy.configure(lm=lm)
                print("[AI SYSTEM] ✅ DSPy configured with OpenAI")
                return
                
            print("[AI SYSTEM] ❌ No API keys found for Anthropic or OpenAI")
            raise ValueError("No API keys found for Anthropic or OpenAI")
            
        except Exception as e:
            print(f"[AI SYSTEM] ❌ Failed to configure DSPy: {e}")
            logger.error(f"Failed to configure DSPy: {e}")
            raise
    
    def build_agent_graph(self) -> StateGraph:
        """Build the LangGraph multi-agent system"""
        print("[AI SYSTEM] 🔧 Building agent graph with RAG integration")
        
        # Create StateGraph with custom state
        builder = StateGraph(FinancialAnalysisState)
        print("[AI SYSTEM] ✅ StateGraph created with FinancialAnalysisState")
        
        # Add agent nodes with RAG integration
        print("[AI SYSTEM] 🔄 Adding agent nodes")
        builder.add_node("rag_retriever", self.rag_retriever_node)  # New RAG node
        builder.add_node("data_analyzer", self.data_analyzer_node)
        builder.add_node("insight_generator", self.insight_generator_node)
        builder.add_node("card_formatter", self.card_formatter_node)
        builder.add_node("quality_validator", self.quality_validator_node)
        print("[AI SYSTEM] ✅ All agent nodes added")
        
        # Define the enhanced flow with RAG
        print("[AI SYSTEM] 🔄 Defining agent flow")
        builder.add_edge(START, "rag_retriever")  # Start with RAG retrieval
        builder.add_edge("rag_retriever", "data_analyzer")
        builder.add_edge("data_analyzer", "insight_generator")
        builder.add_edge("insight_generator", "card_formatter")
        builder.add_edge("card_formatter", "quality_validator")
        builder.add_edge("quality_validator", END)
        print("[AI SYSTEM] ✅ Agent flow defined")
        
        # Compile with memory for state management
        print("[AI SYSTEM] 🔄 Compiling graph with memory")
        memory = InMemorySaver()
        compiled_graph = builder.compile(checkpointer=memory)
        print("[AI SYSTEM] ✅ Graph compiled successfully")
        
        return compiled_graph
    
    async def rag_retriever_node(self, state: FinancialAnalysisState) -> Command:
        """First agent: Retrieve relevant profile data using RAG system"""
        print("[AI SYSTEM] 🔍 RAG Retriever: Starting profile data retrieval")
        
        try:
            # Extract profile information from state
            user_profile = state.get("user_profile", {})
            simulation_data = state.get("simulation_data", {})
            scenario_name = simulation_data.get("scenario_name", "financial planning")
            
            print(f"[AI SYSTEM] 📊 Processing scenario: {scenario_name}")
            print(f"[AI SYSTEM] 👤 User profile keys: {list(user_profile.keys())}")
            
            # Determine profile ID from user_profile
            profile_id = user_profile.get("user_id", user_profile.get("profile_id", 1))
            print(f"[AI SYSTEM] 🆔 Profile ID: {profile_id}")
            
            # Get profile RAG system
            print("[AI SYSTEM] 🔄 Getting profile RAG system")
            profile_rag = self.rag_manager.get_profile_system(profile_id)
            print("[AI SYSTEM] ✅ Profile RAG system retrieved")
            
            # Perform comprehensive RAG queries
            rag_insights = {}
            print("[AI SYSTEM] 🔍 Executing RAG queries")
            
            # Query accounts for current financial position
            accounts_query = f"What are my current account balances and types for {scenario_name}?"
            print(f"[AI SYSTEM] 💳 Querying accounts: {accounts_query[:50]}...")
            
            try:
                accounts_result = await profile_rag.query(accounts_query)
                rag_insights["accounts"] = accounts_result
                print("[AI SYSTEM] ✅ Accounts query completed")
            except Exception as e:
                print(f"[AI SYSTEM] ⚠️ Accounts query failed: {e}")
                rag_insights["accounts"] = {"error": str(e)}
            
            # Query transactions for spending patterns
            transactions_query = f"What are my recent spending patterns and categories for {scenario_name}?"
            print(f"[AI SYSTEM] 💸 Querying transactions: {transactions_query[:50]}...")
            
            try:
                transactions_result = await profile_rag.query(transactions_query)
                rag_insights["transactions"] = transactions_result
                print("[AI SYSTEM] ✅ Transactions query completed")
            except Exception as e:
                print(f"[AI SYSTEM] ⚠️ Transactions query failed: {e}")
                rag_insights["transactions"] = {"error": str(e)}
            
            # Query goals for financial objectives
            goals_query = f"What are my current financial goals and progress for {scenario_name}?"
            print(f"[AI SYSTEM] 🎯 Querying goals: {goals_query[:50]}...")
            
            try:
                goals_result = await profile_rag.query(goals_query)
                rag_insights["goals"] = goals_result
                print("[AI SYSTEM] ✅ Goals query completed")
            except Exception as e:
                print(f"[AI SYSTEM] ⚠️ Goals query failed: {e}")
                rag_insights["goals"] = {"error": str(e)}
            
            # Update state with RAG insights
            state["rag_insights"] = rag_insights
            state["profile_context"] = {
                "profile_id": profile_id,
                "scenario_name": scenario_name,
                "rag_available": len([v for v in rag_insights.values() if "error" not in v]) > 0
            }
            
            print(f"[AI SYSTEM] ✅ RAG retrieval completed - {len(rag_insights)} insights gathered")
            print(f"[AI SYSTEM] 📊 RAG insights keys: {list(rag_insights.keys())}")
            
            return Command("data_analyzer")
            
        except Exception as e:
            print(f"[AI SYSTEM] ❌ RAG retriever failed: {e}")
            # Continue with empty RAG insights
            state["rag_insights"] = {}
            state["profile_context"] = {"profile_id": 1, "rag_available": False}
            return Command("data_analyzer")
    
    async def data_analyzer_node(self, state: FinancialAnalysisState) -> Command:
        """Second agent: Analyze simulation data and user profile"""
        print("[AI SYSTEM] 🧠 Data Analyzer: Starting financial analysis")
        
        try:
            # Extract data from state
            simulation_data = state.get("simulation_data", {})
            user_profile = state.get("user_profile", {})
            rag_insights = state.get("rag_insights", {})
            
            print(f"[AI SYSTEM] 📊 Simulation data keys: {list(simulation_data.keys())}")
            print(f"[AI SYSTEM] 👤 User profile keys: {list(user_profile.keys())}")
            print(f"[AI SYSTEM] 🔍 RAG insights available: {len(rag_insights)}")
            
            # Enhance user profile for better personalization
            income = user_profile.get('monthly_income', user_profile.get('income', 5000))
            age = user_profile.get('age', 30)
            demographic = user_profile.get('demographic', 'professional')
            
            enhanced_user_profile = f"""
            USER PROFILE FOR ANALYSIS:
            - Demographic: {demographic} ({age} years old)
            - Monthly Income: ${income:,.0f}
            - Annual Income: ${income * 12:,.0f}
            - Emergency Fund: ${user_profile.get('emergency_fund', 0):,.0f}
            - Total Debt: ${user_profile.get('total_debt', 0):,.0f}
            - Student Loans: ${user_profile.get('student_loans', 0):,.0f}
            - Monthly Expenses: ${user_profile.get('monthly_expenses', income * 0.7):,.0f}
            
            ORIGINAL PROFILE DATA: {user_profile}
            """
            
            # Prepare analysis input
            analysis_input = {
                "simulation_data": simulation_data,
                "user_profile": enhanced_user_profile,
                "rag_insights": rag_insights
            }
            
            print(f"[AI SYSTEM] 🔄 Running DSPy financial analysis for {demographic}, ${income:,.0f}/mo")
            start_time = datetime.now()
            
            # Use DSPy for PERSONALIZED analysis
            analysis_result = self.financial_analyzer.forward(
                simulation_data=str(simulation_data),
                user_profile=enhanced_user_profile
            )
            
            analysis_time = (datetime.now() - start_time).total_seconds()
            print(f"[AI SYSTEM] ✅ Financial analysis completed in {analysis_time:.2f}s")
            
            # Parse and structure the analysis result
            try:
                if isinstance(analysis_result, str):
                    # Try to parse as JSON
                    import json
                    parsed_result = json.loads(analysis_result)
                else:
                    parsed_result = analysis_result
                    
                print("[AI SYSTEM] ✅ Analysis result parsed successfully")
            except Exception as e:
                print(f"[AI SYSTEM] ⚠️ Failed to parse analysis result: {e}")
                parsed_result = {
                    "key_insights": ["Analysis completed successfully"],
                    "risk_factors": [],
                    "opportunities": [],
                    "recommendations": []
                }
            
            # Update state with analysis results
            state["analysis_results"] = parsed_result
            state["current_agent"] = "data_analyzer"
            state["processing_stage"] = "analysis_complete"
            
            print(f"[AI SYSTEM] 📊 Analysis results keys: {list(parsed_result.keys())}")
            
            return Command("insight_generator")
            
        except Exception as e:
            print(f"[AI SYSTEM] ❌ Data analyzer failed: {e}")
            # Provide fallback analysis
            fallback_analysis = {
                "key_insights": ["Financial analysis completed with basic insights"],
                "risk_factors": ["Limited data available for detailed analysis"],
                "opportunities": ["Standard financial planning opportunities identified"],
                "recommendations": ["Consider consulting with a financial advisor"]
            }
            
            state["analysis_results"] = fallback_analysis
            state["current_agent"] = "data_analyzer"
            state["processing_stage"] = "analysis_fallback"
            
            return Command("insight_generator")
    
    async def insight_generator_node(self, state: FinancialAnalysisState) -> Command:
        """Third agent: Generate PERSONALIZED financial insights and recommendations"""
        print("[AI SYSTEM] 💡 Insight Generator: Starting PERSONALIZED insight generation")
        
        try:
            # Extract data from state
            analysis_results = state.get("analysis_results", {})
            simulation_data = state.get("simulation_data", {})
            user_profile = state.get("user_profile", {})
            
            # Extract and enhance profile data for personalization
            income = user_profile.get('monthly_income', user_profile.get('income', 5000))
            age = user_profile.get('age', 30)
            demographic = user_profile.get('demographic', 'unknown')
            debt = user_profile.get('student_loans', user_profile.get('total_debt', 0))
            emergency_fund = user_profile.get('emergency_fund', 0)
            
            # Create enhanced profile string with specific numbers
            enhanced_profile = f"""
            PROFILE DETAILS:
            - Age: {age} years old
            - Demographic: {demographic}
            - Monthly Income: ${income:,.0f}
            - Annual Income: ${income * 12:,.0f}
            - Current Debt: ${debt:,.0f}
            - Emergency Fund: ${emergency_fund:,.0f}
            - Monthly Expenses: ${user_profile.get('monthly_expenses', income * 0.7):,.0f}
            
            PERSONALIZATION REQUIREMENTS:
            - Use their EXACT income (${income:,.0f}/month) in recommendations
            - Speak to a {age}-year-old {demographic}
            - Reference their ${debt:,.0f} debt burden
            - Consider their ${emergency_fund:,.0f} emergency fund
            """
            
            print(f"[AI SYSTEM] 📊 Enhanced profile for {demographic}, age {age}, income ${income:,.0f}")
            
            print(f"[AI SYSTEM] 📊 Analysis results keys: {list(analysis_results.keys())}")
            print(f"[AI SYSTEM] 🎯 Simulation type: {simulation_data.get('scenario_name', 'unknown')}")
            
            # Determine simulation type
            simulation_type = simulation_data.get("scenario_name", "financial_planning")
            
            print("[AI SYSTEM] 🔄 Running DSPy insight generation")
            start_time = datetime.now()
            
            # Use DSPy for PERSONALIZED insight generation
            insights_result = self.card_generator.forward(
                financial_analysis=str(analysis_results),
                simulation_type=simulation_type,
                user_profile=enhanced_profile  # Use enhanced profile with numbers
            )
            
            insight_time = (datetime.now() - start_time).total_seconds()
            print(f"[AI SYSTEM] ✅ Insight generation completed in {insight_time:.2f}s")
            
            # Parse and structure the insights
            try:
                if isinstance(insights_result, str):
                    import json
                    parsed_insights = json.loads(insights_result)
                else:
                    parsed_insights = insights_result
                    
                print("[AI SYSTEM] ✅ Insights parsed successfully")
            except Exception as e:
                print(f"[AI SYSTEM] ⚠️ Failed to parse insights: {e}")
                # Generate fallback insights
                parsed_insights = self.generate_fallback_insights(simulation_type, user_profile)
            
            # Update state with insights
            state["explanation_cards"] = parsed_insights
            state["current_agent"] = "insight_generator"
            state["processing_stage"] = "insights_complete"
            
            print(f"[AI SYSTEM] 📊 Generated {len(parsed_insights)} insight cards")
            
            return Command("card_formatter")
            
        except Exception as e:
            print(f"[AI SYSTEM] ❌ Insight generator failed: {e}")
            # Generate fallback insights
            fallback_insights = self.generate_fallback_insights("financial_planning", {})
            
            state["explanation_cards"] = fallback_insights
            state["current_agent"] = "insight_generator"
            state["processing_stage"] = "insights_fallback"
            
            return Command("card_formatter")
    
    async def card_formatter_node(self, state: FinancialAnalysisState) -> Command:
        """Fourth agent: Format insights into frontend-compatible cards"""
        print("[AI SYSTEM] 🎨 Card Formatter: Starting card formatting")
        
        try:
            # Extract insights from state
            explanation_cards = state.get("explanation_cards", [])
            simulation_data = state.get("simulation_data", {})
            user_profile = state.get("user_profile", {})
            
            print(f"[AI SYSTEM] 📊 Raw explanation cards: {len(explanation_cards)}")
            print(f"[AI SYSTEM] 🎯 Simulation type: {simulation_data.get('scenario_name', 'unknown')}")
            
            # Format cards for frontend compatibility
            formatted_cards = []
            
            print("[AI SYSTEM] 🔄 Formatting cards for frontend")
            
            for i, card in enumerate(explanation_cards):
                try:
                    # Ensure card has required fields
                    formatted_card = self.format_card_for_frontend(card, i, simulation_data, user_profile)
                    formatted_cards.append(formatted_card)
                    print(f"[AI SYSTEM] ✅ Card {i+1} formatted successfully")
                except Exception as e:
                    print(f"[AI SYSTEM] ⚠️ Failed to format card {i+1}: {e}")
                    # Generate fallback card with user profile
                    fallback_card = self.create_fallback_card(i, simulation_data, user_profile)
                    formatted_cards.append(fallback_card)
            
            # Ensure we have exactly 3 cards
            while len(formatted_cards) < 3:
                print(f"[AI SYSTEM] 🔄 Adding fallback card {len(formatted_cards)+1}")
                fallback_card = self.create_fallback_card(len(formatted_cards), simulation_data, user_profile)
                formatted_cards.append(fallback_card)
            
            # Limit to 3 cards
            formatted_cards = formatted_cards[:3]
            
            # Update state with formatted cards
            state["explanation_cards"] = formatted_cards
            state["current_agent"] = "card_formatter"
            state["processing_stage"] = "formatting_complete"
            
            print(f"[AI SYSTEM] ✅ Card formatting completed - {len(formatted_cards)} cards ready")
            
            return Command("quality_validator")
            
        except Exception as e:
            print(f"[AI SYSTEM] ❌ Card formatter failed: {e}")
            # Generate fallback cards with user profile
            fallback_cards = []
            for i in range(3):
                fallback_card = self.create_fallback_card(i, simulation_data, user_profile)
                fallback_cards.append(fallback_card)
            
            state["explanation_cards"] = fallback_cards
            state["current_agent"] = "card_formatter"
            state["processing_stage"] = "formatting_fallback"
            
            return Command("quality_validator")
    
    def format_card_for_frontend(self, card: dict, index: int, simulation_data: dict, user_profile: dict) -> dict:
        """Format a PERSONALIZED card to match frontend expectations"""
        print(f"[AI SYSTEM] 🔧 Formatting PERSONALIZED card {index+1} for frontend")
        
        # Extract simulation type and profile data
        simulation_type = simulation_data.get("scenario_name", "financial_planning")
        income = user_profile.get('monthly_income', user_profile.get('income', 5000))
        demographic = user_profile.get('demographic', 'unknown')
        
        # Generate personalized title if generic
        title = card.get("title", "")
        if "Financial Strategy" in title or "Financial Plan" in title:
            # Replace with scenario-specific personalized title
            title = self.generate_personalized_title(simulation_type, index, income, demographic)
        
        # Ensure required fields with personalization
        formatted_card = {
            "id": f"ai_plan_{index + 1}",
            "title": title if title else card.get("title", self.generate_personalized_title(simulation_type, index, income, demographic)),
            "description": card.get("description", "AI-generated financial recommendation"),
            "tag": card.get("tag", ["CONSERVATIVE", "BALANCED", "AGGRESSIVE"][index % 3]),
            "tagColor": card.get("tagColor", ["bg-green-500/20 text-green-300", "bg-blue-500/20 text-blue-300", "bg-purple-500/20 text-purple-300"][index % 3]),
            "potentialSaving": card.get("potentialSaving", 1000),
            "rationale": card.get("rationale", "This strategy is personalized based on your financial profile."),
            "steps": card.get("steps", [
                "Review your current financial position",
                "Implement the recommended changes",
                "Monitor progress regularly",
                "Adjust as your situation evolves"
            ]),
            "currentValue": f"${card.get('potentialSaving', 1000):,}",
            "projectedValue": f"${int(card.get('potentialSaving', 1000) * 1.5):,}",
            "timeframe": "12 months",
            "monthlyContribution": f"${int(card.get('potentialSaving', 1000) / 12)}",
            "insights": card.get("steps", [])
        }
        
        print(f"[AI SYSTEM] ✅ Card {index+1} formatted with {len(formatted_card)} fields")
        return formatted_card
    
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
    
    def generate_personalized_title(self, simulation_type: str, index: int, income: float, demographic: str) -> str:
        """Generate personalized, actionable titles based on user profile and scenario"""
        
        # Map demographics to appropriate language style
        demo_lower = str(demographic).lower()
        
        if "emergency" in simulation_type.lower():
            titles = [
                f"Build ${income * 6:,.0f} Emergency Shield",
                f"Fast-Track ${income * 3:,.0f} Safety Net", 
                f"Optimize Your ${income:,.0f}/mo for Crisis Fund"
            ]
        elif "student" in simulation_type.lower():
            if "gen z" in demo_lower or "genz" in demo_lower:
                titles = [
                    "Crush Student Debt with Avalanche Method",
                    "Side Hustle + Smart Payments Strategy",
                    "Invest While Paying Minimums Plan"
                ]
            else:
                titles = [
                    "Strategic Debt Elimination Roadmap",
                    "Balanced Wealth Building Approach", 
                    "Investment-First Payoff Strategy"
                ]
        elif "medical" in simulation_type.lower():
            titles = [
                f"HSA Max-Out: Save ${income * 0.15:,.0f}/mo Tax-Free",
                "Premium Insurance + Emergency Fund Combo",
                "Medical Cost Arbitrage Strategy"
            ]
        elif "gig" in simulation_type.lower():
            titles = [
                f"Stabilize ${income:,.0f} Variable Income",
                "Multi-Platform Income Diversification",
                f"Build ${income * 6:,.0f} Gig Worker Buffer"
            ]
        elif "market" in simulation_type.lower():
            titles = [
                "Defensive Portfolio Rebalancing",
                "Dollar-Cost Averaging Opportunity",
                f"Protect ${income * 12:,.0f} Annual Income"
            ]
        elif "home" in simulation_type.lower():
            titles = [
                f"20% Down Payment on ${income * 50:,.0f} Home",
                "Credit Score Optimization for Best Rates",
                f"Afford ${income * 3:,.0f}/mo Mortgage"
            ]
        else:
            # Generic but still personalized
            if "gen z" in demo_lower:
                titles = [
                    f"Level Up Your ${income:,.0f}/mo Income",
                    "FIRE Strategy for Young Professionals",
                    "Aggressive Growth Portfolio"
                ]
            elif "millennial" in demo_lower:
                titles = [
                    f"Optimize ${income * 12:,.0f} Annual Earnings",
                    "Balanced Wealth Acceleration",
                    "Family-Focused Financial Security"
                ]
            else:
                titles = [
                    f"Maximize ${income:,.0f} Monthly Cash Flow",
                    "Conservative Wealth Preservation",
                    "Tax-Optimized Investment Strategy"
                ]
        
        return titles[index % len(titles)]
    
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
                fallback_card = self.create_fallback_card(len(validated_cards) + 1, state.get("simulation_data", {}), state.get("user_profile", {}))
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
    
    def create_fallback_card(self, card_num: int, simulation_data: Dict, user_profile: Dict = None) -> Dict[str, Any]:
        """Create a PERSONALIZED fallback card when AI generation fails"""
        # Extract profile data for personalization
        if user_profile is None:
            user_profile = simulation_data.get('user_profile', {})
        
        income = user_profile.get('monthly_income', user_profile.get('income', 5000))
        demographic = user_profile.get('demographic', 'unknown')
        debt = user_profile.get('student_loans', user_profile.get('total_debt', 0))
        emergency_fund = user_profile.get('emergency_fund', 0)
        simulation_type = simulation_data.get('scenario_name', 'financial_planning')
        
        # Generate personalized title and description
        personalized_title = self.generate_personalized_title(simulation_type, card_num - 1, income, demographic)
        
        return {
            "id": f"fallback_{card_num}",
            "title": personalized_title,
            "description": f"Tailored for your ${income:,.0f}/month income as a {demographic}",
            "tag": "RECOMMENDED",
            "tagColor": "bg-blue-500",
            "potentialSaving": 500,
            "rationale": f"With your ${income:,.0f} monthly income and ${emergency_fund:,.0f} emergency fund, this strategy optimizes your financial growth while managing your ${debt:,.0f} debt obligations. Designed specifically for a {demographic} professional.",
            "steps": [
                f"Transfer ${min(500, income * 0.1):.0f} monthly to high-yield savings",
                f"Allocate ${min(300, income * 0.06):.0f} to debt reduction",
                f"Review progress when emergency fund reaches ${income * 3:.0f}",
                f"Increase contributions by 10% after 6 months"
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
        start_time = time.time()
        scenario_type = scenario_context or simulation_data.get("scenario_name", "financial_planning")
        
        logger.info(f"🚀 AI CARD GENERATION: {scenario_type}")
        logger.info(f"👤 User profile: {user_profile.get('demographic', 'unknown')}")
        logger.info(f"📊 Simulation data keys: {list(simulation_data.keys())}")
        
        try:
            # Prepare initial state with RAG fields and scenario context
            logger.info(f"🔄 PREPARING AGENT STATE")
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
                "scenario_context": scenario_type
            }
            
            # Run the multi-agent system
            logger.info(f"🔄 EXECUTING AGENT GRAPH")
            graph_start = time.time()
            config = {"thread_id": f"session_{datetime.now().timestamp()}"}
            final_state = await self.graph.ainvoke(initial_state, config=config)
            graph_time = time.time() - graph_start
            
            # Extract results
            cards = final_state.get("explanation_cards", [])
            total_time = time.time() - start_time
            
            logger.info(f"✅ CARD GENERATION SUCCESS: {len(cards)} cards in {total_time:.3f}s")
            logger.info(f"📈 GRAPH EXECUTION TIME: {graph_time:.3f}s")
            
            return cards
            
        except Exception as e:
            total_time = time.time() - start_time
            logger.error(f"❌ CARD GENERATION FAILED: {e} after {total_time:.3f}s")
            
            # Check if it's a rate limit error
            if "rate_limit" in str(e).lower() or "429" in str(e):
                logger.warning("⚠️ RATE LIMIT DETECTED: Using scenario-specific fallback cards")
                return self.generate_scenario_specific_fallback_cards(simulation_data, user_profile, scenario_context)
            
            # Return fallback cards with user profile
            logger.info("🔄 GENERATING FALLBACK CARDS")
            fallback_cards = [
                self.create_fallback_card(i+1, simulation_data, user_profile) 
                for i in range(3)
            ]
            logger.info(f"✅ FALLBACK CARDS GENERATED: {len(fallback_cards)} cards")
            return fallback_cards

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
        """Generate PERSONALIZED job loss specific cards"""
        # Extract profile-specific data
        income = user_profile.get('monthly_income', user_profile.get('income', 5000))
        demographic = user_profile.get('demographic', 'professional')
        age = user_profile.get('age', 30)
        
        survival_months = simulation_data.get("survival_months", 2)
        monthly_expenses = user_profile.get('monthly_expenses', simulation_data.get("monthly_expenses", income * 0.7))
        emergency_fund = user_profile.get('emergency_fund', simulation_data.get("emergency_fund", 10000))
        
        return [
            {
                "id": "job_loss_emergency",
                "title": f"Extend ${emergency_fund:,.0f} to {survival_months + 4} Months",
                "description": f"Optimize for {demographic} with ${income:,.0f}/mo income",
                "tag": "URGENT",
                "tagColor": "bg-red-500",
                "potentialSaving": int(monthly_expenses * 3),  # 3 months of expenses
                "rationale": f"As a {age}-year-old {demographic} with ${income:,.0f} monthly income, your ${emergency_fund:,.0f} emergency fund covers {survival_months} months. This aggressive plan extends coverage to 6+ months.",
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
        """Generate PERSONALIZED emergency fund specific cards"""
        # Extract profile-specific data
        income = user_profile.get('monthly_income', user_profile.get('income', 5000))
        demographic = user_profile.get('demographic', 'professional')
        age = user_profile.get('age', 30)
        
        target_months = simulation_data.get("target_months", 6)
        monthly_contribution = min(income * 0.15, simulation_data.get("monthly_contribution", 500))
        current_fund = user_profile.get('emergency_fund', simulation_data.get("emergency_fund", 2000))
        
        return [
            {
                "id": "emergency_fund_aggressive",
            "title": f"Build ${income * target_months:,.0f} in {int(((income * target_months) - current_fund) / (monthly_contribution * 1.5))} Months",
            "description": f"Fast-track strategy for {demographic} earning ${income:,.0f}/mo",
            "tag": "AGGRESSIVE",
            "tagColor": "bg-purple-500",
            "potentialSaving": int(monthly_contribution * 1.5),
            "rationale": f"With your ${income:,.0f} monthly income as a {demographic}, increasing contributions to ${monthly_contribution * 1.5:.0f} builds your {target_months}-month fund (${income * target_months:,.0f}) rapidly while maintaining lifestyle.",
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
        """Generate PERSONALIZED student loan specific cards"""
        # Extract profile-specific data
        income = user_profile.get('monthly_income', user_profile.get('income', 5000))
        demographic = user_profile.get('demographic', 'professional')
        debt = user_profile.get('student_loans', user_profile.get('total_debt', 30000))
        
        # Calculate personalized savings potential
        interest_saved_avalanche = debt * 0.15  # Approximate 15% savings
        monthly_payment = debt / 120  # 10-year standard
        
        return [
        {
            "id": "student_loan_avalanche",
            "title": f"Save ${interest_saved_avalanche:,.0f} on ${debt:,.0f} Debt",
            "description": f"Avalanche strategy for {demographic} with ${income:,.0f}/mo income",
            "tag": "AGGRESSIVE",
            "tagColor": "bg-purple-500",
            "potentialSaving": int(interest_saved_avalanche),
            "rationale": f"With ${debt:,.0f} in student loans and ${income:,.0f} monthly income, the avalanche method saves ${interest_saved_avalanche:,.0f} in interest by targeting your highest rate loans first.",
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
        """Generate PERSONALIZED generic financial planning cards"""
        # Extract profile-specific data
        income = user_profile.get('monthly_income', user_profile.get('income', 5000))
        demographic = user_profile.get('demographic', 'professional')
        age = user_profile.get('age', 30)
        debt = user_profile.get('total_debt', 0)
        emergency_fund = user_profile.get('emergency_fund', 0)
        
        return [
        {
            "id": "generic_conservative",
            "title": f"Secure ${income * 12:,.0f} Annual Income",
            "description": f"Conservative plan for {demographic}",
            "tag": "CONSERVATIVE",
            "tagColor": "bg-green-500",
            "potentialSaving": int(income * 2),
            "rationale": f"As a {age}-year-old {demographic} earning ${income:,.0f}/month, this conservative approach builds on your ${emergency_fund:,.0f} emergency fund while managing ${debt:,.0f} in debt.",
            "steps": [
                f"Build emergency fund to ${income * 6:,.0f}",
                f"Pay off ${debt:,.0f} high-interest debt",
                f"Invest ${income * 0.1:.0f}/month in index funds",
                "Review insurance coverage quarterly"
            ]
        },
        {
            "id": "generic_balanced",
            "title": f"Grow ${income * 24:,.0f} in 2 Years",
            "description": f"Balanced strategy for {demographic}",
            "tag": "BALANCED",
            "tagColor": "bg-blue-500",
            "potentialSaving": int(income * 3),
            "rationale": f"Your ${income:,.0f} monthly income and {demographic} profile supports balanced growth. Allocate funds between debt reduction (${debt:,.0f}) and wealth building.",
            "steps": [
                f"Invest ${income * 0.15:.0f}/month diversified",
                f"Maintain ${income * 3:,.0f} emergency fund",
                "Quarterly rebalancing reviews",
                f"Increase contributions by 5% annually"
            ]
        },
        {
            "id": "generic_aggressive",
            "title": f"10X Your ${income:,.0f} Monthly Income",
            "description": f"Aggressive growth for ambitious {demographic}",
            "tag": "AGGRESSIVE",
            "tagColor": "bg-purple-500",
            "potentialSaving": int(income * 5),
            "rationale": f"At {age} years old with ${income:,.0f}/month income, aggressive investing can build significant wealth. Your ${emergency_fund:,.0f} buffer enables higher risk tolerance.",
            "steps": [
                f"Invest ${income * 0.25:.0f}/month in growth assets",
                f"Maximize tax-advantaged accounts (${income * 0.1:.0f})",
                f"Cut expenses by ${income * 0.15:.0f}/month",
                "Monthly portfolio optimization"
            ]
        }
    ]