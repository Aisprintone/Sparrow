"""
Data models for the Monte Carlo simulation engine.
Uses Pydantic for robust data validation and serialization.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, date
from pydantic import BaseModel, Field, validator
from enum import Enum


class AccountType(str, Enum):
    """Account type enumeration."""
    CHECKING = "checking"
    SAVINGS = "savings"
    CREDIT = "credit"
    LOAN = "loan"
    INVESTMENT = "investment"
    MORTGAGE = "mortgage"
    STUDENT_LOAN = "student_loan"
    OTHER = "other"


class Demographic(str, Enum):
    """User demographic categories."""
    GENZ = "genz"
    MILLENNIAL = "millennial"
    MIDCAREER = "midcareer"
    SENIOR = "senior"
    RETIRED = "retired"


class ScenarioType(str, Enum):
    """Available simulation scenarios."""
    EMERGENCY_FUND = "emergency_fund"
    STUDENT_LOAN_PAYOFF = "student_loan_payoff"
    RETIREMENT_PLANNING = "retirement_planning"
    HOME_PURCHASE = "home_purchase"
    DEBT_PAYOFF = "debt_payoff"
    INVESTMENT_GROWTH = "investment_growth"


class Account(BaseModel):
    """Financial account model."""
    account_id: str
    customer_id: int
    institution_name: str
    account_type: AccountType
    account_name: str
    balance: float
    credit_limit: Optional[float] = None
    interest_rate: Optional[float] = None
    minimum_payment: Optional[float] = None
    
    @validator('balance')
    def validate_balance(cls, v):
        """Ensure balance is a valid number."""
        if not isinstance(v, (int, float)):
            raise ValueError('Balance must be a number')
        return float(v)


class Transaction(BaseModel):
    """Transaction model."""
    transaction_id: str
    account_id: str
    amount: float
    description: str
    category: Optional[str] = None
    timestamp: datetime
    is_recurring: bool = False
    is_debit: bool = True
    
    @validator('amount')
    def validate_amount(cls, v):
        """Ensure amount is a valid number."""
        return float(v)


class ProfileData(BaseModel):
    """Complete user profile data for simulations."""
    customer_id: int
    demographic: Demographic
    accounts: List[Account]
    transactions: List[Transaction]
    monthly_income: float = Field(gt=0)
    monthly_expenses: float = Field(gt=0)
    credit_score: int = Field(ge=300, le=850)
    age: int = Field(gt=0, le=120)
    location: Optional[str] = None
    
    # Computed fields
    @property
    def net_worth(self) -> float:
        """Calculate total net worth."""
        return sum(acc.balance for acc in self.accounts)
    
    @property
    def total_debt(self) -> float:
        """Calculate total debt (negative balances)."""
        return abs(sum(acc.balance for acc in self.accounts if acc.balance < 0))
    
    @property
    def emergency_fund_balance(self) -> float:
        """Get emergency fund balance."""
        emergency_accounts = [
            acc for acc in self.accounts 
            if 'emergency' in acc.account_name.lower() or 
               acc.account_type == AccountType.SAVINGS
        ]
        return sum(acc.balance for acc in emergency_accounts if acc.balance > 0)
    
    @property
    def student_loan_balance(self) -> float:
        """Get total student loan balance."""
        student_loans = [
            acc for acc in self.accounts 
            if acc.account_type == AccountType.STUDENT_LOAN or
               'student' in acc.account_name.lower()
        ]
        return abs(sum(acc.balance for acc in student_loans if acc.balance < 0))
    
    @property
    def debt_to_income_ratio(self) -> float:
        """Calculate debt-to-income ratio."""
        if self.monthly_income == 0:
            return 0
        monthly_debt_payments = self.calculate_monthly_debt_payments()
        return monthly_debt_payments / self.monthly_income
    
    def calculate_monthly_debt_payments(self) -> float:
        """Calculate total monthly debt payments."""
        total_payments = 0
        
        # Calculate payments for each debt account
        for acc in self.accounts:
            if acc.balance < 0:  # Debt account
                if acc.minimum_payment:
                    total_payments += acc.minimum_payment
                elif acc.interest_rate:
                    # Estimate payment as 2% of balance if no minimum specified
                    total_payments += abs(acc.balance) * 0.02
                else:
                    # Default to 1% of balance
                    total_payments += abs(acc.balance) * 0.01
        
        return total_payments
    
    class Config:
        """Pydantic configuration."""
        use_enum_values = True


class SimulationRequest(BaseModel):
    """Request model for running a simulation."""
    profile_id: int
    scenario_type: ScenarioType
    iterations: int = Field(ge=100, le=100000, default=10000)
    custom_parameters: Optional[Dict[str, Any]] = None
    
    class Config:
        """Pydantic configuration."""
        use_enum_values = True


class ScenarioResult(BaseModel):
    """Standardized result format for all scenarios."""
    scenario_name: str
    iterations: int
    
    # Percentile results
    percentile_10: float
    percentile_25: float
    percentile_50: float  # Median
    percentile_75: float
    percentile_90: float
    
    # Statistical measures
    mean: float
    std_dev: float
    min_value: float
    max_value: float
    
    # Probability metrics
    probability_success: float = Field(ge=0, le=1)
    confidence_interval_95: tuple[float, float]
    
    # Scenario-specific metrics
    metadata: Dict[str, Any] = Field(default_factory=dict)
    
    # Timing information
    processing_time_ms: float
    timestamp: datetime = Field(default_factory=datetime.now)
    
    def to_frontend_format(self) -> Dict[str, Any]:
        """Convert to format expected by frontend."""
        return {
            'scenario': self.scenario_name,
            'results': {
                'percentiles': {
                    'p10': round(self.percentile_10, 2),
                    'p25': round(self.percentile_25, 2),
                    'p50': round(self.percentile_50, 2),
                    'p75': round(self.percentile_75, 2),
                    'p90': round(self.percentile_90, 2)
                },
                'statistics': {
                    'mean': round(self.mean, 2),
                    'std_dev': round(self.std_dev, 2),
                    'min': round(self.min_value, 2),
                    'max': round(self.max_value, 2)
                },
                'probability_success': round(self.probability_success, 3),
                'confidence_interval': [
                    round(self.confidence_interval_95[0], 2),
                    round(self.confidence_interval_95[1], 2)
                ]
            },
            'metadata': self.metadata,
            'performance': {
                'iterations': self.iterations,
                'processing_time_ms': round(self.processing_time_ms, 1)
            }
        }


class SimulationResponse(BaseModel):
    """Response model for simulation results."""
    success: bool
    result: Optional[ScenarioResult] = None
    error: Optional[str] = None
    warnings: List[str] = Field(default_factory=list)