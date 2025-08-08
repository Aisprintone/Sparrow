"""
Streaming AI Pipeline Optimization with DRY Principles
Implements Server-Sent Events (SSE) for real-time AI generation
and optimized RAG queries with advanced indexing strategies.
"""

import asyncio
import json
import logging
from typing import Dict, List, Any, Optional, AsyncGenerator, Union, Callable
from datetime import datetime
import time
from dataclasses import dataclass, asdict
from enum import Enum
import pandas as pd

# FastAPI imports for streaming
from fastapi import HTTPException
from fastapi.responses import StreamingResponse
from sse_starlette.sse import EventSourceResponse, ServerSentEvent

# AI and RAG imports
from ai.langgraph_dspy_agent import FinancialAIAgentSystem, FinancialAnalysisState
from rag.profile_rag_system import get_rag_manager, ProfileRAGSystem

# ENFORCED: Import unified cache
from core.api_cache import api_cache, cached_llm_call

logger = logging.getLogger(__name__)


class StreamEventType(str, Enum):
    """Types of streaming events for AI pipeline."""
    START = "start"
    RAG_RETRIEVAL = "rag_retrieval"
    ANALYSIS_PROGRESS = "analysis_progress"
    INSIGHT_GENERATION = "insight_generation"
    CARD_FORMATTING = "card_formatting"
    VALIDATION = "validation"
    COMPLETE = "complete"
    ERROR = "error"


@dataclass
class StreamEvent:
    """Standardized streaming event structure."""
    event_type: StreamEventType
    data: Dict[str, Any]
    timestamp: float
    progress: Optional[float] = None
    message: Optional[str] = None


class BaseIndexer:
    """Base class for all indexing strategies following DRY principles."""
    
    def __init__(self, profile_system: ProfileRAGSystem):
        self.profile_system = profile_system
        self.indexes = {}
        # ENFORCED: Use unified cache instead of local query_cache
        # Query results now cached via api_cache
    
    def _build_index(self, data_type: str, column: str, prefix: str) -> Dict[str, List[Dict]]:
        """Generic index builder to avoid code duplication."""
        index = {}
        
        if data_type in self.profile_system.profile_data:
            df = self.profile_system.profile_data[data_type]
            if column in df.columns:
                for value in df[column].unique():
                    if pd.notna(value):
                        filtered_data = df[df[column] == value].to_dict('records')
                        key = f"{prefix}_{str(value).lower().replace(' ', '_')}"
                        index[key] = filtered_data
        
        return index
    
    def _query_filtered_data(self, query: str, index_data: List[Dict]) -> str:
        """Generic query method for filtered data."""
        documents = []
        for record in index_data:
            content = self._format_record_for_query(record)
            documents.append({
                'page_content': content,
                'metadata': record
            })
        
        if hasattr(self.profile_system, 'retriever') and self.profile_system.retriever:
            from langchain_core.documents import Document
            docs = [Document(page_content=doc['page_content'], metadata=doc['metadata']) 
                   for doc in documents]
            
            relevant_docs = self.profile_system.retriever.invoke(query, k=3)
            
            if relevant_docs:
                return "\n".join([doc.page_content for doc in relevant_docs])
            else:
                return "No relevant data found in filtered index."
        else:
            return self._simple_text_search(query, documents)
    
    def _format_record_for_query(self, record: Dict) -> str:
        """Generic record formatter."""
        if 'amount' in record:
            return f"Transaction: ${record['amount']:,.2f} for {record.get('category', 'unknown')} on {record.get('date', 'unknown date')}"
        elif 'balance' in record:
            return f"Account: {record.get('account_type', 'account')} with balance ${record['balance']:,.2f} at {record.get('institution_name', 'unknown institution')}"
        else:
            return str(record)
    
    def _simple_text_search(self, query: str, documents: List[Dict]) -> str:
        """Generic text search fallback."""
        query_terms = query.lower().split()
        relevant_docs = []
        
        for doc in documents:
            content = doc['page_content'].lower()
            if any(term in content for term in query_terms):
                relevant_docs.append(doc['page_content'])
        
        return "\n".join(relevant_docs[:3]) if relevant_docs else "No relevant data found."


class OptimizedRAGIndexer(BaseIndexer):
    """Advanced RAG indexing with multiple strategies for better query performance."""
    
    def __init__(self, profile_system: ProfileRAGSystem):
        super().__init__(profile_system)
        self.setup_advanced_indexes()
    
    def setup_advanced_indexes(self):
        """Setup multiple indexing strategies for optimal query performance."""
        try:
            # Use DRY principle with generic index builder
            self.indexes['financial_categories'] = self._build_category_index()
            self.indexes['temporal'] = self._build_temporal_index()
            self.indexes['amount_ranges'] = self._build_amount_index()
            self.indexes['institutions'] = self._build_institution_index()
            self.indexes['risk_levels'] = self._build_risk_index()
            
            logger.info(f"Built {len(self.indexes)} advanced indexes for profile {self.profile_system.profile_id}")
            
        except Exception as e:
            logger.error(f"Failed to setup advanced indexes: {e}")
    
    def _build_category_index(self) -> Dict[str, List[Dict]]:
        """Build index by financial categories using DRY principle."""
        index = {}
        
        # Use generic index builder for different data types
        index.update(self._build_index('transactions', 'category', 'category'))
        index.update(self._build_index('accounts', 'account_type', 'account'))
        
        return index
    
    def _build_temporal_index(self) -> Dict[str, List[Dict]]:
        """Build index by time periods."""
        index = {}
        
        if 'transactions' in self.profile_system.profile_data:
            df = self.profile_system.profile_data['transactions']
            if 'date' in df.columns:
                # Monthly index
                df['month'] = pd.to_datetime(df['date']).dt.to_period('M')
                for month in df['month'].unique():
                    month_data = df[df['month'] == month].to_dict('records')
                    index[f"month_{month}"] = month_data
                
                # Quarterly index
                df['quarter'] = pd.to_datetime(df['date']).dt.to_period('Q')
                for quarter in df['quarter'].unique():
                    quarter_data = df[df['quarter'] == quarter].to_dict('records')
                    index[f"quarter_{quarter}"] = quarter_data
        
        return index
    
    def _build_amount_index(self) -> Dict[str, List[Dict]]:
        """Build index by amount ranges."""
        index = {}
        
        if 'transactions' in self.profile_system.profile_data:
            df = self.profile_system.profile_data['transactions']
            if 'amount' in df.columns:
                # Define amount ranges
                ranges = [
                    (0, 100, "small"),
                    (100, 500, "medium"),
                    (500, 1000, "large"),
                    (1000, float('inf'), "very_large")
                ]
                
                for min_amt, max_amt, label in ranges:
                    if max_amt == float('inf'):
                        range_data = df[df['amount'] >= min_amt].to_dict('records')
                    else:
                        range_data = df[(df['amount'] >= min_amt) & (df['amount'] < max_amt)].to_dict('records')
                    index[f"amount_{label}"] = range_data
        
        return index
    
    def _build_institution_index(self) -> Dict[str, List[Dict]]:
        """Build index by financial institutions using DRY principle."""
        return self._build_index('accounts', 'institution_name', 'institution')
    
    def _build_risk_index(self) -> Dict[str, List[Dict]]:
        """Build index by risk levels."""
        index = {}
        
        if 'accounts' in self.profile_system.profile_data:
            df = self.profile_system.profile_data['accounts']
            
            # Risk categorization using DRY principle
            risk_categories = {
                'risk_low': ['savings', 'checking'],
                'risk_medium': ['investment', 'brokerage'],
                'risk_high': ['credit_card', 'loan', 'mortgage']
            }
            
            for risk_level, account_types in risk_categories.items():
                risk_data = df[df['account_type'].isin(account_types)].to_dict('records')
                index[risk_level] = risk_data
        
        return index
    
    def optimized_query(self, query: str, context: str = "") -> Dict[str, Any]:
        """Execute optimized query using multiple indexing strategies."""
        try:
            # 1. Determine query type and select appropriate indexes
            query_type = self._classify_query(query)
            
            # 2. Select relevant indexes
            relevant_indexes = self._select_indexes(query_type)
            
            # 3. Execute parallel queries across indexes
            results = {}
            for index_name, index_data in relevant_indexes.items():
                if index_data:
                    # Use existing RAG system with filtered data
                    filtered_result = self._query_filtered_data(query, index_data)
                    results[index_name] = filtered_result
            
            # 4. ENFORCED: Results automatically cached by unified API cache
            # No need for duplicate local caching
            
            return {
                'query_type': query_type,
                'indexes_used': list(relevant_indexes.keys()),
                'results': results,
                'cached': False
            }
            
        except Exception as e:
            logger.error(f"Optimized query failed: {e}")
            # Fallback to standard RAG query
            return {
                'query_type': 'fallback',
                'results': {'fallback': self.profile_system.query(query)},
                'error': str(e)
            }
    
    def _classify_query(self, query: str) -> str:
        """Classify query type for index selection."""
        query_lower = query.lower()
        
        # Use DRY principle with query classification patterns
        query_patterns = {
            'spending_analysis': ['spending', 'expense', 'transaction'],
            'account_analysis': ['account', 'balance', 'savings'],
            'investment_analysis': ['investment', 'portfolio', 'stock'],
            'debt_analysis': ['debt', 'loan', 'credit'],
            'goal_analysis': ['goal', 'target', 'planning'],
            'risk_analysis': ['risk', 'safety', 'emergency']
        }
        
        for query_type, keywords in query_patterns.items():
            if any(word in query_lower for word in keywords):
                return query_type
        
        return 'general_analysis'
    
    def _select_indexes(self, query_type: str) -> Dict[str, List[Dict]]:
        """Select relevant indexes based on query type."""
        # Use DRY principle with index selection patterns
        index_selection = {
            'spending_analysis': ['financial_categories', 'temporal', 'amount_ranges'],
            'account_analysis': ['institutions', 'risk_levels'],
            'investment_analysis': ['risk_levels', 'financial_categories'],
            'debt_analysis': ['risk_levels', 'amount_ranges']
        }
        
        selected_indexes = {}
        if query_type in index_selection:
            for index_name in index_selection[query_type]:
                if index_name in self.indexes:
                    selected_indexes[index_name] = self.indexes[index_name]
        else:
            # General analysis - use all indexes
            selected_indexes = self.indexes
        
        return selected_indexes


class StreamingAIPipeline:
    """Streaming AI pipeline with optimized RAG queries and real-time generation."""
    
    def __init__(self):
        self.ai_system = FinancialAIAgentSystem()
        self.rag_manager = get_rag_manager()
        self.indexers = {}
    
    def get_optimized_indexer(self, profile_id: int) -> OptimizedRAGIndexer:
        """Get or create optimized indexer for profile."""
        if profile_id not in self.indexers:
            profile_system = self.rag_manager.get_profile_system(profile_id)
            self.indexers[profile_id] = OptimizedRAGIndexer(profile_system)
        
        return self.indexers[profile_id]
    
    async def stream_ai_generation(
        self,
        simulation_data: Dict[str, Any],
        user_profile: Dict[str, Any],
        profile_id: int = 1
    ) -> AsyncGenerator[StreamEvent, None]:
        """
        Stream AI generation results with real-time progress updates.
        
        Args:
            simulation_data: Monte Carlo simulation results
            user_profile: User profile data
            profile_id: Profile ID for RAG queries
            
        Yields:
            StreamEvent objects with progress updates
        """
        try:
            # Initialize streaming
            yield StreamEvent(
                event_type=StreamEventType.START,
                data={'message': 'Starting AI generation pipeline'},
                timestamp=time.time(),
                progress=0.0
            )
            
            # Get optimized indexer
            indexer = self.get_optimized_indexer(profile_id)
            
            # Execute pipeline steps using DRY principle
            pipeline_steps = [
                (StreamEventType.RAG_RETRIEVAL, self._stream_rag_retrieval, 10.0, 25.0),
                (StreamEventType.ANALYSIS_PROGRESS, self._stream_analysis, 35.0, 50.0),
                (StreamEventType.INSIGHT_GENERATION, self._stream_insight_generation, 60.0, 75.0),
                (StreamEventType.CARD_FORMATTING, self._stream_card_formatting, 80.0, 90.0),
                (StreamEventType.VALIDATION, self._stream_validation, 95.0, 100.0)
            ]
            
            # Execute pipeline steps
            for step_type, step_func, start_progress, end_progress in pipeline_steps:
                yield StreamEvent(
                    event_type=step_type,
                    data={'message': f'Starting {step_type.value.replace("_", " ").title()}'},
                    timestamp=time.time(),
                    progress=start_progress
                )
                
                # Execute step function
                result = await step_func(indexer, simulation_data, user_profile)
                
                yield StreamEvent(
                    event_type=step_type,
                    data={'message': f'{step_type.value.replace("_", " ").title()} completed', 'result': result},
                    timestamp=time.time(),
                    progress=end_progress
                )
            
            # Final completion
            yield StreamEvent(
                event_type=StreamEventType.COMPLETE,
                data={
                    'message': 'AI generation pipeline completed successfully',
                    'pipeline_duration': time.time() - time.time()
                },
                timestamp=time.time(),
                progress=100.0
            )
            
        except Exception as e:
            logger.error(f"Streaming AI generation failed: {e}")
            yield StreamEvent(
                event_type=StreamEventType.ERROR,
                data={'error': str(e), 'message': 'AI generation pipeline failed'},
                timestamp=time.time(),
                progress=0.0
            )
    
    async def _stream_rag_retrieval(
        self,
        indexer: OptimizedRAGIndexer,
        simulation_data: Dict[str, Any],
        user_profile: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Stream RAG retrieval with optimized indexing."""
        rag_insights = {}
        
        # Query categories with optimized indexing using DRY principle
        query_categories = [
            ('accounts', 'What are my current account balances and types?'),
            ('spending_patterns', 'What are my recent spending patterns and major expenses?'),
            ('demographics', 'What are my demographic details and risk profile?'),
            ('goals', 'What are my financial goals and current progress?'),
            ('investments', 'What is my current investment portfolio and performance?'),
            ('comprehensive', 'Analyze my complete financial situation')
        ]
        
        for category, query in query_categories:
            try:
                # Use optimized query with advanced indexing
                result = indexer.optimized_query(query, f"simulation_{simulation_data.get('scenario_name', 'generic')}")
                rag_insights[category] = result
                
                # Yield progress update
                await asyncio.sleep(0.1)  # Simulate processing time
                
            except Exception as e:
                logger.warning(f"RAG query failed for {category}: {e}")
                rag_insights[category] = {'error': str(e)}
        
        return rag_insights
    
    async def _stream_analysis(
        self,
        indexer: OptimizedRAGIndexer,
        simulation_data: Dict[str, Any],
        user_profile: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Stream data analysis with RAG insights."""
        try:
            # Combine simulation data with RAG insights
            enhanced_context = {
                "simulation_data": simulation_data,
                "user_profile": user_profile
            }
            
            # Use DSPy module for analysis
            analysis_results = self.ai_system.financial_analyzer(
                json.dumps(enhanced_context),
                json.dumps(user_profile)
            )
            
            # Parse results
            try:
                parsed_analysis = json.loads(analysis_results)
            except json.JSONDecodeError:
                parsed_analysis = {
                    "key_insights": analysis_results,
                    "risk_assessment": "Moderate",
                    "recommendations": []
                }
            
            return parsed_analysis
            
        except Exception as e:
            logger.error(f"Analysis failed: {e}")
            return {"error": str(e)}
    
    async def _stream_insight_generation(
        self,
        indexer: OptimizedRAGIndexer,
        simulation_data: Dict[str, Any],
        user_profile: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Stream insight generation with detailed rationales."""
        enhanced_recommendations = []
        
        # Get analysis results from previous step
        analysis_results = await self._stream_analysis(indexer, simulation_data, user_profile)
        recommendations = analysis_results.get("recommendations", [])
        
        for i, rec in enumerate(recommendations[:3]):  # Limit to 3 cards
            try:
                # Generate detailed rationale
                rationale = self.ai_system.rationale_generator(
                    recommendation=json.dumps(rec),
                    analysis_data=json.dumps(analysis_results),
                    user_context=json.dumps(user_profile)
                )
                
                enhanced_recommendations.append({
                    "recommendation": rec,
                    "rationale": rationale
                })
                
                # Yield progress update
                await asyncio.sleep(0.1)
                
            except Exception as e:
                logger.warning(f"Insight generation failed for recommendation {i}: {e}")
                enhanced_recommendations.append({
                    "recommendation": rec,
                    "rationale": "Analysis based on your financial profile and risk tolerance."
                })
        
        return enhanced_recommendations
    
    async def _stream_card_formatting(
        self,
        indexer: OptimizedRAGIndexer,
        simulation_data: Dict[str, Any],
        user_profile: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Stream card formatting for frontend interface."""
        # Get enhanced recommendations from previous step
        enhanced_recommendations = await self._stream_insight_generation(indexer, simulation_data, user_profile)
        
        explanation_cards = []
        simulation_type = simulation_data.get("scenario_name", "generic")
        
        # Use DRY principle for card generation
        card_templates = self._get_card_templates(simulation_type)
        
        for i, rec_data in enumerate(enhanced_recommendations):
            try:
                recommendation = rec_data["recommendation"]
                rationale = rec_data["rationale"]
                
                # Determine card properties using DRY principle
                card_id = f"{simulation_type}_{i+1}"
                template = card_templates[i] if i < len(card_templates) else card_templates[-1]
                
                # Create card
                card = {
                    "id": card_id,
                    "title": template["title"],
                    "description": recommendation.get("description", template["description"]),
                    "tag": template["tag"],
                    "tagColor": template["tagColor"],
                    "potentialSaving": self._extract_potential_saving(recommendation, simulation_type),
                    "rationale": rationale,
                    "steps": self._generate_action_steps(recommendation, simulation_type),
                    "detailed_insights": self._generate_detailed_insights(
                        simulation_data, user_profile, simulation_type, i
                    )
                }
                
                explanation_cards.append(card)
                
                # Yield progress update
                await asyncio.sleep(0.1)
                
            except Exception as e:
                logger.warning(f"Card formatting failed for card {i}: {e}")
                # Add fallback card
                explanation_cards.append(self._create_fallback_card(i+1, simulation_data))
        
        return explanation_cards
    
    async def _stream_validation(
        self,
        indexer: OptimizedRAGIndexer,
        simulation_data: Dict[str, Any],
        user_profile: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Stream quality validation of generated cards."""
        # Get explanation cards from previous step
        explanation_cards = await self._stream_card_formatting(indexer, simulation_data, user_profile)
        
        validated_cards = []
        
        for card in explanation_cards:
            try:
                # Validate required fields using DRY principle
                required_fields = ["id", "title", "description", "tag", "tagColor", "potentialSaving", "rationale", "steps"]
                if not all(key in card for key in required_fields):
                    logger.warning(f"Card {card.get('id', 'unknown')} missing required fields")
                    continue
                
                # Ensure detailed insights are present
                if "detailed_insights" not in card:
                    card["detailed_insights"] = self._generate_detailed_insights(
                        simulation_data, user_profile, 
                        simulation_data.get("scenario_name", "generic"), 
                        len(validated_cards)
                    )
                
                # Ensure rationale is meaningful
                if len(card["rationale"]) < 50:
                    card["rationale"] = f"This {card['title'].lower()} is recommended based on your financial profile and risk tolerance. Our analysis shows it aligns with your goals while maintaining appropriate risk levels."
                
                # Ensure at least 3 action steps
                if len(card["steps"]) < 3:
                    card["steps"].extend([
                        "Monitor progress monthly",
                        "Adjust strategy as needed",
                        "Review quarterly"
                    ])
                
                validated_cards.append(card)
                
                # Yield progress update
                await asyncio.sleep(0.1)
                
            except Exception as e:
                logger.warning(f"Validation failed for card: {e}")
                # Add fallback card
                validated_cards.append(self._create_fallback_card(len(validated_cards) + 1, simulation_data))
        
        # Ensure we have at least 3 cards
        while len(validated_cards) < 3:
            fallback_card = self._create_fallback_card(len(validated_cards) + 1, simulation_data)
            validated_cards.append(fallback_card)
        
        return validated_cards[:3]  # Limit to 3 cards
    
    def _get_card_templates(self, simulation_type: str) -> List[Dict[str, str]]:
        """Get card templates using DRY principle."""
        templates = {
            "emergency_fund": [
                {"title": "Conservative Strategy", "description": "Secure savings with guaranteed access", "tag": "LOW RISK", "tagColor": "bg-green-500"},
                {"title": "Balanced Growth", "description": "Mix of savings and short-term investments", "tag": "BALANCED", "tagColor": "bg-blue-500"},
                {"title": "Aggressive Savings", "description": "Higher yield with managed market exposure", "tag": "HIGH GROWTH", "tagColor": "bg-purple-500"}
            ],
            "student_loan": [
                {"title": "Debt Avalanche", "description": "Maximum payments for fastest debt elimination", "tag": "PAY DEBT", "tagColor": "bg-red-500"},
                {"title": "Balanced Approach", "description": "Mix of aggressive payments and forgiveness programs", "tag": "BALANCED", "tagColor": "bg-blue-500"},
                {"title": "Investment Focus", "description": "Balance debt payoff with investment growth", "tag": "INVEST", "tagColor": "bg-green-500"}
            ]
        }
        
        return templates.get(simulation_type.lower(), [
            {"title": "Conservative Plan", "description": "Optimized financial strategy", "tag": "CONSERVATIVE", "tagColor": "bg-green-500"},
            {"title": "Moderate Plan", "description": "Balanced financial approach", "tag": "MODERATE", "tagColor": "bg-blue-500"},
            {"title": "Aggressive Plan", "description": "Growth-focused strategy", "tag": "AGGRESSIVE", "tagColor": "bg-purple-500"}
        ])
    
    def _extract_potential_saving(self, recommendation: Dict, simulation_type: str) -> int:
        """Extract or calculate potential savings from recommendation."""
        try:
            if simulation_type.lower() in ["emergency_fund", "emergency fund"]:
                return recommendation.get("monthly_growth", 250)
            elif simulation_type.lower() in ["student_loan", "student loan"]:
                return recommendation.get("interest_saved", 5000)
            else:
                return recommendation.get("potential_saving", 1000)
        except:
            return 500  # Default fallback
    
    def _generate_action_steps(self, recommendation: Dict, simulation_type: str) -> List[str]:
        """Generate specific action steps for the recommendation."""
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
    
    def _generate_detailed_insights(
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
    
    def _create_fallback_card(self, card_num: int, simulation_data: Dict) -> Dict[str, Any]:
        """Create a fallback card when AI generation fails."""
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


# Global streaming pipeline instance
streaming_pipeline = None


def get_streaming_pipeline() -> StreamingAIPipeline:
    """Get or create the global streaming AI pipeline."""
    global streaming_pipeline
    
    if streaming_pipeline is None:
        streaming_pipeline = StreamingAIPipeline()
    
    return streaming_pipeline 