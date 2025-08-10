"""
Workflow Registry
Manages workflow definitions and provides lookup functionality
"""

from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from enum import Enum
from datetime import datetime
import logging
from .workflow_definitions import WorkflowDefinition, WorkflowCategory, get_workflow_by_id, get_workflows_by_category, get_workflows_by_profile

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

class WorkflowRegistry:
    """Registry for managing workflow definitions with evidence-based selection"""
    
    def __init__(self):
        self.workflows = {}
        self._load_workflows()
        self._init_evidence_patterns()
    
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
    
    def _init_evidence_patterns(self):
        """Initialize evidence patterns for workflow selection"""
        self.evidence_patterns = {
            # Netflix cancellation patterns
            "netflix_unused": {
                "workflow_id": "optimize.cancel_subscriptions.v1",
                "required_evidence": [EvidenceType.TRANSACTION_PATTERN, EvidenceType.USAGE_DATA],
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
                "workflow_id": "optimize.high_yield_savings.v1",
                "required_evidence": [EvidenceType.ACCOUNT_BALANCE, EvidenceType.INTEREST_RATE],
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
            },
            
            # Bill negotiation patterns
            "bill_negotiation_opportunity": {
                "workflow_id": "optimize.negotiate_bills.v1",
                "required_evidence": [EvidenceType.PAYMENT_HISTORY, EvidenceType.SPENDING_BEHAVIOR],
                "triggers": {
                    "high_bills_present": True,
                    "rate_increase_detected": True,
                    "competitor_rates_better": True
                },
                "confidence_factors": {
                    "bill_amount": 0.4,
                    "rate_increase": 0.3,
                    "negotiation_history": 0.3
                }
            }
        }
    
    async def get_evidence_based_workflows(self, user_data: Dict[str, Any], max_recommendations: int = 4) -> List[WorkflowMatch]:
        """Get workflows based on evidence analysis from user data"""
        logger.info(f"Starting evidence-based workflow selection")
        
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
        
        # Rank by confidence score
        workflow_matches.sort(key=lambda x: x.confidence_score, reverse=True)
        
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
        """Extract evidence from transaction data"""
        evidence = []
        
        # Netflix usage analysis
        netflix_transactions = [t for t in transactions if 'netflix' in t.get('merchant_name', '').lower()]
        if netflix_transactions:
            last_charge = max(netflix_transactions, key=lambda x: x['date'])
            monthly_cost = abs(float(last_charge['amount']))
            
            evidence.append(Evidence(
                type=EvidenceType.TRANSACTION_PATTERN,
                source="plaid_transactions",
                data={
                    "netflix_charges_present": True,
                    "monthly_cost": monthly_cost,
                    "usage_hours_last_60_days": 1.3,  # Simulated for demo
                    "cost_per_hour": monthly_cost / 1.3,
                    "last_login_days_ago": 67
                },
                confidence=0.95,
                timestamp=datetime.now(),
                description=f"Netflix charges detected: ${monthly_cost}/month with minimal usage"
            ))
        
        return evidence
    
    async def _extract_account_evidence(self, accounts: List[Dict]) -> List[Evidence]:
        """Extract evidence from account data"""
        evidence = []
        
        # Find savings accounts with low APY
        savings_accounts = [acc for acc in accounts if acc.get('subtype') == 'savings']
        
        for account in savings_accounts:
            balance = float(account.get('balance', 0))
            current_apy = 0.01  # Assume low APY for demo
            
            if balance > 5000:  # Only consider accounts with significant balance
                evidence.append(Evidence(
                    type=EvidenceType.ACCOUNT_BALANCE,
                    source="plaid_accounts",
                    data={
                        "savings_balance": balance,
                        "current_apy": current_apy,
                        "available_hysa_apy": 4.5,
                        "annual_opportunity": balance * (0.045 - current_apy)
                    },
                    confidence=0.99,
                    timestamp=datetime.now(),
                    description=f"Savings account: ${balance:,.0f} at {current_apy*100:.2f}% APY"
                ))
        
        return evidence
    
    async def _extract_profile_evidence(self, user_profile: Dict) -> List[Evidence]:
        """Extract evidence from user profile"""
        evidence = []
        
        income = user_profile.get('income', 50000)
        monthly_income = income / 12
        
        evidence.append(Evidence(
            type=EvidenceType.CASH_FLOW,
            source="user_profile",
            data={
                "annual_income": income,
                "monthly_income": monthly_income,
                "demographic": user_profile.get('demographic', 'millennial'),
                "debt_level": user_profile.get('debt_level', 'medium'),
                "monthly_surplus": monthly_income * 0.3  # Estimated surplus
            },
            confidence=0.80,
            timestamp=datetime.now(),
            description=f"Income: ${income:,}/year, {user_profile.get('demographic', 'unknown')} demographic"
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
        
        # Get workflow definition
        workflow_def = self.get_workflow(pattern['workflow_id'])
        if not workflow_def:
            return None
        
        # Calculate final confidence using pattern factors
        confidence_factors = pattern.get('confidence_factors', {})
        final_confidence = min(trigger_confidence * 1.2, 1.0)  # Boost valid matches
        
        # Generate explanation
        explanation = self._generate_evidence_explanation(pattern['workflow_id'], matching_evidence, evidence_data)
        
        # Determine automation level based on confidence
        automation_level = self._determine_automation_level(final_confidence, evidence_data)
        
        return WorkflowMatch(
            workflow_id=pattern['workflow_id'],
            workflow_name=workflow_def.name,
            confidence_score=final_confidence,
            evidence=matching_evidence,
            projected_impact=workflow_def.estimated_impact,
            trust_level=self._get_trust_level(final_confidence),
            explanation=explanation,
            automation_level=automation_level
        )
    
    def _generate_evidence_explanation(self, workflow_id: str, evidence: List[Evidence], evidence_data: Dict) -> str:
        """Generate contextual explanation for why this workflow was selected"""
        
        if "cancel_subscriptions" in workflow_id:
            monthly_cost = evidence_data.get('monthly_cost', 15.99)
            usage_hours = evidence_data.get('usage_hours_last_60_days', 1.3)
            cost_per_hour = evidence_data.get('cost_per_hour', monthly_cost / max(usage_hours, 0.1))
            
            return f"Netflix: Used only {usage_hours:.1f} hours in 60 days. Costing ${cost_per_hour:.2f}/hour. Cancel to save ${monthly_cost * 12:.0f}/year."
        
        elif "high_yield_savings" in workflow_id:
            balance = evidence_data.get('savings_balance', 8000)
            annual_opportunity = evidence_data.get('annual_opportunity', balance * 0.044)
            
            return f"Move ${balance:,.0f} to high-yield savings. Earn an extra ${annual_opportunity:.0f}/year with 4.5% APY vs current low rate."
        
        elif "negotiate_bills" in workflow_id:
            return f"Analysis shows bill negotiation opportunities. Average savings of $35/month possible with competitive rate research."
        
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
