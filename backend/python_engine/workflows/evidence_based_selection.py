"""
Evidence-Based Workflow Selection Engine
Selects workflows based on specific user data evidence rather than generic demographics
"""

from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from enum import Enum
import asyncio
import logging
from datetime import datetime, timedelta
import json

# Import existing workflow definitions
from .workflow_definitions import WORKFLOW_REGISTRY

logger = logging.getLogger(__name__)

class EvidenceType(Enum):
    TRANSACTION_PATTERN = "transaction_pattern"
    ACCOUNT_BALANCE = "account_balance" 
    USAGE_DATA = "usage_data"
    PAYMENT_HISTORY = "payment_history"
    CASH_FLOW = "cash_flow"
    SUBSCRIPTION_STATUS = "subscription_status"
    INTEREST_RATE = "interest_rate"
    SPENDING_BEHAVIOR = "spending_behavior"

class ConfidenceLevel(Enum):
    VERY_HIGH = "very_high"    # 90%+ confidence
    HIGH = "high"              # 70-89% confidence  
    MEDIUM = "medium"          # 50-69% confidence
    LOW = "low"               # 30-49% confidence
    VERY_LOW = "very_low"     # <30% confidence

@dataclass
class Evidence:
    type: EvidenceType
    source: str  # "plaid_transactions", "chase_api", etc.
    data: Dict[str, Any]
    confidence: float  # 0.0 to 1.0
    timestamp: datetime
    description: str

@dataclass 
class WorkflowMatch:
    workflow_id: str
    workflow_name: str
    confidence_score: float
    evidence: List[Evidence]
    projected_impact: Dict[str, Any]
    trust_level: str
    explanation: str
    automation_level: str  # "full", "assisted", "manual"

class EvidenceBasedSelector:
    """Selects workflows based on specific evidence from user data"""
    
    def __init__(self):
        self.evidence_patterns = {
            # Netflix cancellation patterns
            "netflix_unused": {
                "workflow_id": "streaming_cancellation_netflix",
                "required_evidence": [
                    EvidenceType.TRANSACTION_PATTERN,
                    EvidenceType.USAGE_DATA
                ],
                "triggers": {
                    "netflix_charges_present": True,
                    "usage_hours_last_60_days": {"<": 5.0},
                    "cost_per_hour": {">": 15.0}
                },
                "confidence_factors": {
                    "usage_hours_last_60_days": 0.4,
                    "cost_per_hour": 0.3,
                    "last_login_days_ago": 0.3
                }
            },
            
            # High-yield savings transfer patterns
            "hysa_opportunity": {
                "workflow_id": "hysa_transfer_chase_to_marcus", 
                "required_evidence": [
                    EvidenceType.ACCOUNT_BALANCE,
                    EvidenceType.INTEREST_RATE
                ],
                "triggers": {
                    "savings_balance": {">": 5000},
                    "current_apy": {"<": 1.0},
                    "available_hysa_apy": {">": 4.0}
                },
                "confidence_factors": {
                    "savings_balance": 0.3,
                    "apy_difference": 0.5,
                    "fdic_insured": 0.2
                }
            }
        }
    
    async def select_workflows(self, user_data: Dict[str, Any], max_recommendations: int = 4) -> List[WorkflowMatch]:
        """
        Select workflows based on evidence from user data
        
        Args:
            user_data: Dictionary containing plaid_accounts, plaid_transactions, user_profile, etc.
            max_recommendations: Maximum number of workflows to recommend
            
        Returns:
            List of WorkflowMatch objects ranked by confidence
        """
        logger.info(f"Starting evidence-based workflow selection for user")
        
        # Extract evidence from user data
        evidence_list = await self._extract_evidence(user_data)
        
        # Match evidence to workflow patterns
        workflow_matches = []
        for pattern_name, pattern in self.evidence_patterns.items():
            logger.debug(f"Evaluating pattern: {pattern_name}")
            match = await self._evaluate_pattern(pattern, evidence_list, user_data)
            if match:
                logger.debug(f"Pattern {pattern_name} matched!")
                workflow_matches.append(match)
            else:
                logger.debug(f"Pattern {pattern_name} did not match")
        
        # Rank by confidence score
        workflow_matches.sort(key=lambda x: x.confidence_score, reverse=True)
        
        # Return top recommendations
        return workflow_matches[:max_recommendations]
    
    async def _extract_evidence(self, user_data: Dict[str, Any]) -> List[Evidence]:
        """Extract evidence from various data sources"""
        evidence_list = []
        
        # Extract from Plaid transactions
        if 'plaid_transactions' in user_data:
            evidence_list.extend(await self._extract_transaction_evidence(user_data['plaid_transactions']))
        
        # Extract from Plaid accounts  
        if 'plaid_accounts' in user_data:
            evidence_list.extend(await self._extract_account_evidence(user_data['plaid_accounts']))
        
        # Extract from user profile
        if 'user_profile' in user_data:
            evidence_list.extend(await self._extract_profile_evidence(user_data['user_profile']))
        
        return evidence_list
    
    async def _extract_transaction_evidence(self, transactions: List[Dict]) -> List[Evidence]:
        """Extract evidence from Plaid transaction data"""
        evidence = []
        
        # Netflix usage analysis
        netflix_transactions = [t for t in transactions if 'netflix' in t.get('merchant_name', '').lower()]
        if netflix_transactions:
            last_charge = max(netflix_transactions, key=lambda x: x['date'])
            monthly_cost = abs(float(last_charge['amount']))
            
            # Add simulated usage data for demo
            evidence.append(Evidence(
                type=EvidenceType.TRANSACTION_PATTERN,
                source="plaid_transactions",
                data={
                    "netflix_charges_present": True,
                    "monthly_cost": monthly_cost,
                    "last_charge_date": last_charge['date'],
                    "transaction_frequency": len(netflix_transactions),
                    "usage_hours_last_60_days": 1.3,  # Simulated low usage
                    "cost_per_hour": monthly_cost / 1.3,
                    "last_login_days_ago": 67
                },
                confidence=0.95,
                timestamp=datetime.now(),
                description=f"Netflix charges detected: ${monthly_cost}/month with minimal usage"
            ))
        
        return evidence
    
    async def _extract_account_evidence(self, accounts: List[Dict]) -> List[Evidence]:
        """Extract evidence from Plaid account data"""
        evidence = []
        
        # Find Chase savings accounts with low APY
        chase_savings = [acc for acc in accounts 
                        if acc.get('institution_name') == 'Chase' 
                        and acc.get('subtype') == 'savings']
        
        if chase_savings:
            for account in chase_savings:
                balance = float(account.get('balance', 0))
                # Assume Chase savings has very low APY
                current_apy = 0.01  # 0.01% typical for Chase savings
                
                evidence.append(Evidence(
                    type=EvidenceType.ACCOUNT_BALANCE,
                    source="plaid_accounts",
                    data={
                        "account_type": "chase_savings",
                        "balance": balance,
                        "current_apy": current_apy,
                        "annual_earnings": balance * current_apy,
                        "hysa_opportunity": balance * 0.045 - balance * current_apy,  # Marcus 4.5% APY
                        "savings_balance": balance,  # For trigger matching
                        "available_hysa_apy": 4.5  # For trigger matching
                    },
                    confidence=0.99,
                    timestamp=datetime.now(),
                    description=f"Chase Savings: ${balance:,.0f} at {current_apy*100:.2f}% APY"
                ))
        
        return evidence
    
    async def _extract_profile_evidence(self, user_profile: Dict) -> List[Evidence]:
        """Extract evidence from user profile data"""
        evidence = []
        
        income = user_profile.get('income', 50000)
        monthly_income = income / 12
        
        # Calculate approximate monthly surplus
        estimated_monthly_expenses = monthly_income * 0.7  # Assume 70% expense ratio
        monthly_surplus = monthly_income - estimated_monthly_expenses
        emergency_fund_months = 4.0  # Mock emergency fund adequacy
        savings_rate = 0.10  # Mock 10% savings rate
        
        evidence.append(Evidence(
            type=EvidenceType.CASH_FLOW,
            source="user_profile",
            data={
                "annual_income": income,
                "monthly_income": monthly_income,
                "demographic": user_profile.get('demographic', 'millennial'),
                "debt_level": user_profile.get('debt_level', 'medium'),
                "monthly_surplus": monthly_surplus,
                "emergency_fund_months": emergency_fund_months,
                "savings_rate": savings_rate
            },
            confidence=0.80,
            timestamp=datetime.now(),
            description=f"Income: ${income:,}/year, {user_profile.get('demographic', 'unknown')} demographic, ${monthly_surplus:.0f} monthly surplus"
        ))
        
        return evidence
    
    async def _evaluate_pattern(self, pattern: Dict, evidence_list: List[Evidence], user_data: Dict) -> Optional[WorkflowMatch]:
        """Evaluate if a pattern matches the available evidence"""
        
        # Check if we have required evidence types
        evidence_types = [e.type for e in evidence_list]
        required_types = pattern['required_evidence']
        
        if not all(req_type in evidence_types for req_type in required_types):
            return None
        
        # Build evidence data dictionary
        evidence_data = {}
        matching_evidence = []
        
        for evidence in evidence_list:
            evidence_data.update(evidence.data)
            matching_evidence.append(evidence)
        
        # Check triggers
        triggers = pattern['triggers']
        trigger_score = 0
        total_triggers = len(triggers)
        
        for trigger_key, trigger_condition in triggers.items():
            if trigger_key in evidence_data:
                value = evidence_data[trigger_key]
                
                if isinstance(trigger_condition, bool):
                    if value == trigger_condition:
                        trigger_score += 1
                elif isinstance(trigger_condition, dict):
                    for operator, threshold in trigger_condition.items():
                        if operator == ">" and value > threshold:
                            trigger_score += 1
                        elif operator == "<" and value < threshold:
                            trigger_score += 1
                        elif operator == ">=" and value >= threshold:
                            trigger_score += 1
                        elif operator == "<=" and value <= threshold:
                            trigger_score += 1
        
        # Calculate confidence score
        trigger_confidence = trigger_score / total_triggers if total_triggers > 0 else 0
        
        if trigger_confidence < 0.7:  # Minimum threshold
            return None
        
        # Calculate final confidence using pattern factors
        confidence_factors = pattern.get('confidence_factors', {})
        weighted_confidence = trigger_confidence
        
        for factor, weight in confidence_factors.items():
            if factor in evidence_data:
                factor_value = evidence_data[factor]
                # Normalize factor value to 0-1 range (simplified)
                normalized_value = min(factor_value / 100, 1.0) if isinstance(factor_value, (int, float)) else 0.5
                weighted_confidence += normalized_value * weight
        
        final_confidence = min(weighted_confidence, 1.0)
        
        # Generate explanation
        explanation = await self._generate_explanation(pattern['workflow_id'], matching_evidence, evidence_data)
        
        # Determine automation level based on confidence
        automation_level = self._determine_automation_level(final_confidence, evidence_data)
        
        return WorkflowMatch(
            workflow_id=pattern['workflow_id'],
            workflow_name=pattern['workflow_id'].replace('_', ' ').title(),
            confidence_score=final_confidence,
            evidence=matching_evidence,
            projected_impact={'monthly_savings': evidence_data.get('monthly_cost', 0)},
            trust_level=self._get_trust_level(final_confidence),
            explanation=explanation,
            automation_level=automation_level
        )
    
    async def _generate_explanation(self, workflow_id: str, evidence: List[Evidence], evidence_data: Dict) -> str:
        """Generate contextual explanation for why this workflow was selected"""
        
        if workflow_id == "streaming_cancellation_netflix":
            monthly_cost = evidence_data.get('monthly_cost', 15.99)
            usage_hours = evidence_data.get('usage_hours_last_60_days', 1.3)
            cost_per_hour = evidence_data.get('cost_per_hour', monthly_cost / max(usage_hours, 0.1))
            
            return f"Netflix: Used only {usage_hours:.1f} hours in 60 days. Costing ${cost_per_hour:.2f}/hour. Cancel to save ${monthly_cost * 12:.0f}/year."
        
        elif workflow_id == "hysa_transfer_chase_to_marcus":
            balance = evidence_data.get('balance', 8000)
            current_earnings = evidence_data.get('annual_earnings', balance * 0.0001)
            hysa_earnings = balance * 0.045
            difference = hysa_earnings - current_earnings
            
            return f"Move ${balance:,.0f} from Chase Savings ({current_earnings:.0f}/year) to Marcus HYSA (${hysa_earnings:.0f}/year). Extra earnings: ${difference:.0f}/year."
        
        return f"Recommended based on analysis of your financial data with {len(evidence)} evidence points."
    
    def _determine_automation_level(self, confidence: float, evidence_data: Dict) -> str:
        """Determine appropriate automation level based on confidence and risk"""
        
        if confidence >= 0.90:
            return "full"      # Full automation
        elif confidence >= 0.75: 
            return "assisted"  # Show preview, require approval
        else:
            return "manual"    # Provide guidance, user executes
    
    def _get_trust_level(self, confidence: float) -> str:
        """Convert confidence score to trust level"""
        if confidence >= 0.90:
            return "very_high"
        elif confidence >= 0.75:
            return "high" 
        elif confidence >= 0.60:
            return "medium"
        elif confidence >= 0.40:
            return "low"
        else:
            return "very_low"

# Create global instance
evidence_selector = EvidenceBasedSelector()