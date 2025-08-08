"""
Workflow Definitions for Financial Automation
Defines specific workflows that can be executed by the workflow engine
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from enum import Enum

class WorkflowCategory(Enum):
    OPTIMIZE = "optimize"
    PROTECT = "protect" 
    GROW = "grow"
    EMERGENCY = "emergency"

class WorkflowStatus(Enum):
    QUEUED = "queued"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"
    FAILED = "failed"
    ERROR = "error"

@dataclass
class WorkflowStep:
    id: str
    name: str
    description: str
    type: str  # "automated", "semi-automated", "manual"
    agent: str  # "plaid", "chase", "user", etc.
    inputs: List[str]
    actions: List[str]
    outputs: List[str]
    validations: List[str]
    retry_policy: Dict[str, Any]
    timeout: int
    user_interaction: Optional[Dict[str, Any]] = None

@dataclass
class WorkflowDefinition:
    id: str
    name: str
    category: WorkflowCategory
    description: str
    
    # Profile-specific customization
    profile_filters: Dict[str, Any]
    
    # Execution requirements
    prerequisites: List[str]
    steps: List[WorkflowStep]
    estimated_duration: str
    estimated_impact: Dict[str, Any]
    
    # Dependencies
    agents: List[str]
    external_dependencies: List[str]

# Workflow Registry
WORKFLOW_REGISTRY = {
    "optimize.cancel_subscriptions.v1": WorkflowDefinition(
        id="optimize.cancel_subscriptions.v1",
        name="Cancel Unused Subscriptions",
        category=WorkflowCategory.OPTIMIZE,
        description="Identify and cancel unused subscription services",
        profile_filters={
            "demographics": ["genz", "millennial"],
            "income_ranges": [20000, 100000],
            "debt_levels": ["low", "medium", "high"]
        },
        prerequisites=[
            "plaid_account_access",
            "transaction_history_90_days"
        ],
        steps=[
            WorkflowStep(
                id="analyze_subscriptions",
                name="Analyze Subscription Spending",
                description="Scan transaction history for recurring charges",
                type="automated",
                agent="plaid",
                inputs=["access_token", "account_ids"],
                actions=["get_transactions", "categorize_recurring"],
                outputs=["subscription_list", "usage_analysis"],
                validations=["min_transactions_30", "recurring_patterns"],
                retry_policy={"max_attempts": 3, "backoff": "exponential"},
                timeout=300
            ),
            WorkflowStep(
                id="identify_unused",
                name="Identify Unused Services",
                description="Cross-reference with usage data to find unused subscriptions",
                type="automated", 
                agent="subscription_analyzer",
                inputs=["subscription_list", "usage_analysis"],
                actions=["check_usage_patterns", "identify_candidates"],
                outputs=["unused_subscriptions", "savings_potential"],
                validations=["usage_threshold_met", "savings_minimum"],
                retry_policy={"max_attempts": 2, "backoff": "linear"},
                timeout=120
            ),
            WorkflowStep(
                id="user_approval",
                name="Get User Approval",
                description="Present findings and get user approval for cancellations",
                type="semi-automated",
                agent="user",
                inputs=["unused_subscriptions", "savings_potential"],
                actions=["present_findings", "get_approval"],
                outputs=["approved_cancellations"],
                validations=["user_approved"],
                retry_policy={"max_attempts": 1},
                timeout=3600,
                user_interaction={
                    "type": "approval",
                    "message": "We found {count} unused subscriptions costing ${amount}/month. Cancel them?",
                    "options": ["Approve All", "Review Individually", "Skip"]
                }
            ),
            WorkflowStep(
                id="execute_cancellations",
                name="Execute Cancellations",
                description="Cancel approved subscriptions via vendor APIs",
                type="automated",
                agent="subscription_manager",
                inputs=["approved_cancellations"],
                actions=["cancel_subscriptions", "confirm_cancellations"],
                outputs=["cancellation_results", "savings_achieved"],
                validations=["cancellations_confirmed"],
                retry_policy={"max_attempts": 3, "backoff": "exponential"},
                timeout=600
            )
        ],
        estimated_duration="5-15 minutes",
        estimated_impact={
            "monthly_savings": 47,
            "time_to_complete": "5-15 minutes",
            "risk_level": "low"
        },
        agents=["plaid", "subscription_analyzer", "subscription_manager"],
        external_dependencies=["plaid_api", "vendor_apis"]
    ),

    "optimize.negotiate_bills.v1": WorkflowDefinition(
        id="optimize.negotiate_bills.v1", 
        name="Negotiate Bills",
        category=WorkflowCategory.OPTIMIZE,
        description="Negotiate better rates with service providers",
        profile_filters={
            "demographics": ["genz", "millennial"],
            "income_ranges": [20000, 150000],
            "debt_levels": ["low", "medium", "high"]
        },
        prerequisites=[
            "plaid_account_access",
            "bill_payment_history"
        ],
        steps=[
            WorkflowStep(
                id="identify_bills",
                name="Identify Negotiable Bills",
                description="Find bills that are good candidates for negotiation",
                type="automated",
                agent="bill_analyzer",
                inputs=["transaction_history", "bill_patterns"],
                actions=["identify_recurring_bills", "calculate_negotiation_potential"],
                outputs=["negotiable_bills", "savings_estimates"],
                validations=["min_bills_found", "savings_threshold"],
                retry_policy={"max_attempts": 2, "backoff": "linear"},
                timeout=300
            ),
            WorkflowStep(
                id="research_competitors",
                name="Research Competitor Rates",
                description="Find competitive rates for negotiation leverage",
                type="automated",
                agent="rate_researcher",
                inputs=["negotiable_bills", "user_location"],
                actions=["find_competitor_rates", "calculate_savings"],
                outputs=["competitor_rates", "negotiation_strategy"],
                validations=["rates_found", "savings_potential"],
                retry_policy={"max_attempts": 3, "backoff": "exponential"},
                timeout=600
            ),
            WorkflowStep(
                id="initiate_negotiation",
                name="Initiate Negotiation",
                description="Contact service providers to negotiate better rates",
                type="semi-automated",
                agent="bill_negotiator",
                inputs=["negotiable_bills", "competitor_rates", "negotiation_strategy"],
                actions=["contact_provider", "present_case", "negotiate_rate"],
                outputs=["negotiation_results", "new_rates"],
                validations=["negotiation_complete", "rate_improvement"],
                retry_policy={"max_attempts": 2, "backoff": "linear"},
                timeout=1800,
                user_interaction={
                    "type": "approval",
                    "message": "We've negotiated a better rate for {service}. Accept the new rate of ${new_rate}/month?",
                    "options": ["Accept", "Decline", "Request Changes"]
                }
            ),
            WorkflowStep(
                id="confirm_changes",
                name="Confirm Rate Changes",
                description="Verify and confirm the new rates are active",
                type="automated",
                agent="bill_negotiator",
                inputs=["negotiation_results", "new_rates"],
                actions=["verify_rate_changes", "confirm_billing"],
                outputs=["confirmed_savings", "billing_confirmation"],
                validations=["rates_confirmed", "billing_updated"],
                retry_policy={"max_attempts": 2, "backoff": "linear"},
                timeout=300
            )
        ],
        estimated_duration="15-45 minutes",
        estimated_impact={
            "monthly_savings": 35,
            "time_to_complete": "15-45 minutes", 
            "risk_level": "low"
        },
        agents=["bill_analyzer", "rate_researcher", "bill_negotiator"],
        external_dependencies=["plaid_api", "provider_apis"]
    ),

    "optimize.high_yield_savings.v1": WorkflowDefinition(
        id="optimize.high_yield_savings.v1",
        name="Move to High-Yield Savings",
        category=WorkflowCategory.OPTIMIZE,
        description="Transfer funds to high-yield savings accounts",
        profile_filters={
            "demographics": ["genz", "millennial"],
            "income_ranges": [20000, 200000],
            "debt_levels": ["low", "medium"]
        },
        prerequisites=[
            "plaid_account_access",
            "savings_account_balance"
        ],
        steps=[
            WorkflowStep(
                id="analyze_savings",
                name="Analyze Current Savings",
                description="Review current savings accounts and interest rates",
                type="automated",
                agent="plaid",
                inputs=["access_token", "account_ids"],
                actions=["get_accounts", "analyze_interest_rates"],
                outputs=["savings_accounts", "current_rates"],
                validations=["savings_found", "rate_analysis_complete"],
                retry_policy={"max_attempts": 3, "backoff": "exponential"},
                timeout=300
            ),
            WorkflowStep(
                id="find_better_rates",
                name="Find High-Yield Options",
                description="Research high-yield savings accounts with better rates",
                type="automated",
                agent="rate_finder",
                inputs=["savings_accounts", "current_rates"],
                actions=["research_rates", "compare_options"],
                outputs=["high_yield_options", "rate_comparison"],
                validations=["better_rates_found", "minimum_improvement"],
                retry_policy={"max_attempts": 2, "backoff": "linear"},
                timeout=600
            ),
            WorkflowStep(
                id="user_approval",
                name="Get User Approval",
                description="Present high-yield options and get user approval",
                type="semi-automated",
                agent="user",
                inputs=["high_yield_options", "rate_comparison"],
                actions=["present_options", "get_approval"],
                outputs=["selected_account", "transfer_amount"],
                validations=["user_approved", "amount_valid"],
                retry_policy={"max_attempts": 1},
                timeout=3600,
                user_interaction={
                    "type": "selection",
                    "message": "We found {count} high-yield accounts with rates up to {rate}% APY. Which would you like to open?",
                    "options": ["Marcus (4.5% APY)", "Ally (4.25% APY)", "Discover (4.35% APY)", "Skip"]
                }
            ),
            WorkflowStep(
                id="initiate_transfer",
                name="Initiate Transfer",
                description="Open new account and initiate fund transfer",
                type="automated",
                agent="account_manager",
                inputs=["selected_account", "transfer_amount"],
                actions=["open_account", "initiate_transfer"],
                outputs=["account_opened", "transfer_initiated"],
                validations=["account_created", "transfer_started"],
                retry_policy={"max_attempts": 3, "backoff": "exponential"},
                timeout=1200
            )
        ],
        estimated_duration="1-2 business days",
        estimated_impact={
            "monthly_savings": 20,
            "time_to_complete": "1-2 business days",
            "risk_level": "low"
        },
        agents=["plaid", "rate_finder", "account_manager"],
        external_dependencies=["plaid_api", "bank_apis"]
    ),

    "chase-ach-automation": WorkflowDefinition(
        id="chase-ach-automation",
        name="Automate ACH Transfers",
        category=WorkflowCategory.OPTIMIZE,
        description="Automate recurring ACH transfers using Chase APIs",
        profile_filters={
            "demographics": ["millennial", "gen_x"],
            "income_ranges": [50000, 200000],
            "debt_levels": ["low", "medium"]
        },
        prerequisites=["chase_account", "recurring_transfers"],
        steps=[
            WorkflowStep(
                id="get_chase_balance",
                name="Get Chase Account Balance",
                description="Retrieve current balance from Chase checking account",
                type="automated",
                agent="chase",
                inputs=["account_id"],
                actions=["get_account_balance"],
                outputs=["current_balance", "available_balance"],
                validations=["balance_sufficient"],
                retry_policy={"max_attempts": 3, "backoff": "exponential"},
                timeout=30
            ),
            WorkflowStep(
                id="initiate_ach_transfer",
                name="Initiate ACH Transfer",
                description="Set up automated ACH transfer to savings account",
                type="semi-automated",
                agent="chase",
                inputs={
                    "from_account": "chase_checking",
                    "to_account": "high_yield_savings",
                    "amount": 1000,
                    "description": "Monthly savings transfer"
                },
                actions=["initiate_ach_transfer"],
                outputs=["transfer_id", "status"],
                validations=["transfer_successful"],
                retry_policy={"max_attempts": 2, "backoff": "linear"},
                timeout=60,
                user_interaction={
                    "type": "confirmation",
                    "message": "Confirm $1,000 transfer to high-yield savings?",
                    "options": ["confirm", "modify_amount", "cancel"]
                }
            ),
            WorkflowStep(
                id="verify_transfer",
                name="Verify Transfer Status",
                description="Confirm transfer was processed successfully",
                type="automated",
                agent="chase",
                inputs=["transfer_id"],
                actions=["get_transaction_history"],
                outputs=["transfer_status", "confirmation"],
                validations=["transfer_completed"],
                retry_policy={"max_attempts": 5, "backoff": "exponential"},
                timeout=120
            )
        ],
        estimated_duration="5-10 minutes",
        estimated_impact={
            "monthly_savings": 1000,
            "time_to_complete": "5-10 minutes",
            "risk_level": "low"
        },
        agents=["chase"],
        external_dependencies=["chase_api"]
    )
}

def get_workflow_by_id(workflow_id: str) -> Optional[WorkflowDefinition]:
    """Get workflow definition by ID"""
    return WORKFLOW_REGISTRY.get(workflow_id)

def get_workflows_by_category(category: WorkflowCategory) -> List[WorkflowDefinition]:
    """Get all workflows in a category"""
    return [wf for wf in WORKFLOW_REGISTRY.values() if wf.category == category]

def get_workflows_by_profile(demographic: str, income: int, debt_level: str) -> List[WorkflowDefinition]:
    """Get workflows that match user profile"""
    matching_workflows = []
    
    for workflow in WORKFLOW_REGISTRY.values():
        filters = workflow.profile_filters
        
        # Check demographic match
        if demographic not in filters.get("demographics", []):
            continue
            
        # Check income range
        income_ranges = filters.get("income_ranges", [])
        if income_ranges and not (income_ranges[0] <= income <= income_ranges[1]):
            continue
            
        # Check debt level
        if debt_level not in filters.get("debt_levels", []):
            continue
            
        matching_workflows.append(workflow)
    
    return matching_workflows
