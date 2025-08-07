"""
RAG Query Builder Implementation
Builds structured queries for different scenarios
"""

from typing import List, Dict, Any, Optional
from .abstractions import IRAGQueryBuilder, RAGQuery, QueryType


class ScenarioRAGQueryBuilder(IRAGQueryBuilder):
    """
    Builds RAG queries based on scenario requirements
    Single Responsibility: Create appropriate queries for scenarios
    """
    
    def build_scenario_queries(
        self,
        scenario_name: str,
        profile_context: Dict[str, Any]
    ) -> List[RAGQuery]:
        """
        Build queries specific to a scenario
        Open/Closed: Easy to extend with new scenarios
        """
        scenario_lower = scenario_name.lower()
        
        # Map scenarios to query builders
        if "emergency" in scenario_lower or "fund" in scenario_lower:
            return self._build_emergency_fund_queries(scenario_name)
        elif "student" in scenario_lower or "loan" in scenario_lower:
            return self._build_student_loan_queries(scenario_name)
        elif "medical" in scenario_lower or "crisis" in scenario_lower:
            return self._build_medical_crisis_queries(scenario_name)
        elif "market" in scenario_lower or "crash" in scenario_lower:
            return self._build_market_crash_queries(scenario_name)
        elif "home" in scenario_lower or "purchase" in scenario_lower:
            return self._build_home_purchase_queries(scenario_name)
        elif "gig" in scenario_lower:
            return self._build_gig_economy_queries(scenario_name)
        else:
            return self.build_comprehensive_queries()
    
    def build_comprehensive_queries(self) -> List[RAGQuery]:
        """
        Build comprehensive analysis queries
        """
        return [
            RAGQuery(
                query_text="What are my current account balances and types for financial planning?",
                query_type=QueryType.ACCOUNTS
            ),
            RAGQuery(
                query_text="What are my recent spending patterns and major expenses?",
                query_type=QueryType.TRANSACTIONS
            ),
            RAGQuery(
                query_text="What are my demographic details and risk profile?",
                query_type=QueryType.DEMOGRAPHICS
            ),
            RAGQuery(
                query_text="What are my financial goals and current progress?",
                query_type=QueryType.GOALS
            ),
            RAGQuery(
                query_text="What is my current investment portfolio and performance?",
                query_type=QueryType.INVESTMENTS
            ),
            RAGQuery(
                query_text="Analyze my complete financial situation for comprehensive planning",
                query_type=QueryType.COMPREHENSIVE
            )
        ]
    
    def _build_emergency_fund_queries(self, scenario_name: str) -> List[RAGQuery]:
        """Build emergency fund specific queries"""
        return [
            RAGQuery(
                query_text=f"What are my current liquid account balances for emergency fund planning?",
                query_type=QueryType.ACCOUNTS
            ),
            RAGQuery(
                query_text=f"What are my monthly expenses and spending patterns for emergency fund calculation?",
                query_type=QueryType.TRANSACTIONS
            ),
            RAGQuery(
                query_text=f"What is my risk profile and income stability for emergency planning?",
                query_type=QueryType.DEMOGRAPHICS
            ),
            RAGQuery(
                query_text=f"What are my emergency fund goals and current savings progress?",
                query_type=QueryType.GOALS
            ),
            RAGQuery(
                query_text=f"What liquid investments can support my emergency fund?",
                query_type=QueryType.INVESTMENTS
            ),
            RAGQuery(
                query_text=f"Comprehensive emergency fund analysis based on my financial situation",
                query_type=QueryType.COMPREHENSIVE
            )
        ]
    
    def _build_student_loan_queries(self, scenario_name: str) -> List[RAGQuery]:
        """Build student loan specific queries"""
        return [
            RAGQuery(
                query_text=f"What are my current loan accounts and balances?",
                query_type=QueryType.ACCOUNTS
            ),
            RAGQuery(
                query_text=f"What are my loan payment patterns and available cash flow?",
                query_type=QueryType.TRANSACTIONS
            ),
            RAGQuery(
                query_text=f"What is my income level and career trajectory for loan repayment?",
                query_type=QueryType.DEMOGRAPHICS
            ),
            RAGQuery(
                query_text=f"What are my debt repayment goals and timeline?",
                query_type=QueryType.GOALS
            ),
            RAGQuery(
                query_text=f"Should I prioritize loan repayment or investment based on my portfolio?",
                query_type=QueryType.INVESTMENTS
            ),
            RAGQuery(
                query_text=f"Comprehensive student loan repayment strategy analysis",
                query_type=QueryType.COMPREHENSIVE
            )
        ]
    
    def _build_medical_crisis_queries(self, scenario_name: str) -> List[RAGQuery]:
        """Build medical crisis specific queries"""
        return [
            RAGQuery(
                query_text=f"What are my available liquid assets for medical expenses?",
                query_type=QueryType.ACCOUNTS
            ),
            RAGQuery(
                query_text=f"What are my healthcare spending patterns and insurance coverage?",
                query_type=QueryType.TRANSACTIONS
            ),
            RAGQuery(
                query_text=f"What is my health insurance status and coverage details?",
                query_type=QueryType.DEMOGRAPHICS
            ),
            RAGQuery(
                query_text=f"What are my healthcare savings goals and HSA balance?",
                query_type=QueryType.GOALS
            ),
            RAGQuery(
                query_text=f"What investments can be liquidated for medical expenses?",
                query_type=QueryType.INVESTMENTS
            ),
            RAGQuery(
                query_text=f"Comprehensive medical financial preparedness analysis",
                query_type=QueryType.COMPREHENSIVE
            )
        ]
    
    def _build_market_crash_queries(self, scenario_name: str) -> List[RAGQuery]:
        """Build market crash specific queries"""
        return [
            RAGQuery(
                query_text=f"What is my cash position and emergency fund status?",
                query_type=QueryType.ACCOUNTS
            ),
            RAGQuery(
                query_text=f"What are my fixed expenses and discretionary spending?",
                query_type=QueryType.TRANSACTIONS
            ),
            RAGQuery(
                query_text=f"What is my risk tolerance and time horizon?",
                query_type=QueryType.DEMOGRAPHICS
            ),
            RAGQuery(
                query_text=f"What are my long-term investment goals?",
                query_type=QueryType.GOALS
            ),
            RAGQuery(
                query_text=f"What is my current portfolio allocation and exposure?",
                query_type=QueryType.INVESTMENTS
            ),
            RAGQuery(
                query_text=f"Comprehensive market downturn strategy analysis",
                query_type=QueryType.COMPREHENSIVE
            )
        ]
    
    def _build_home_purchase_queries(self, scenario_name: str) -> List[RAGQuery]:
        """Build home purchase specific queries"""
        return [
            RAGQuery(
                query_text=f"What are my savings and down payment funds?",
                query_type=QueryType.ACCOUNTS
            ),
            RAGQuery(
                query_text=f"What are my monthly expenses and available income for mortgage?",
                query_type=QueryType.TRANSACTIONS
            ),
            RAGQuery(
                query_text=f"What is my credit score and debt-to-income ratio?",
                query_type=QueryType.DEMOGRAPHICS
            ),
            RAGQuery(
                query_text=f"What are my homeownership goals and timeline?",
                query_type=QueryType.GOALS
            ),
            RAGQuery(
                query_text=f"What investments can be used for down payment?",
                query_type=QueryType.INVESTMENTS
            ),
            RAGQuery(
                query_text=f"Comprehensive home affordability analysis",
                query_type=QueryType.COMPREHENSIVE
            )
        ]
    
    def _build_gig_economy_queries(self, scenario_name: str) -> List[RAGQuery]:
        """Build gig economy specific queries"""
        return [
            RAGQuery(
                query_text=f"What are my income sources and account balances?",
                query_type=QueryType.ACCOUNTS
            ),
            RAGQuery(
                query_text=f"What are my income patterns and expense volatility?",
                query_type=QueryType.TRANSACTIONS
            ),
            RAGQuery(
                query_text=f"What is my employment status and income stability?",
                query_type=QueryType.DEMOGRAPHICS
            ),
            RAGQuery(
                query_text=f"What are my income diversification goals?",
                query_type=QueryType.GOALS
            ),
            RAGQuery(
                query_text=f"What investments provide passive income?",
                query_type=QueryType.INVESTMENTS
            ),
            RAGQuery(
                query_text=f"Comprehensive gig economy financial strategy",
                query_type=QueryType.COMPREHENSIVE
            )
        ]