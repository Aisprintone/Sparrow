"""
Advanced Emergency Fund Management Strategies.
Implements sophisticated financial instruments and behavioral patterns.
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from enum import Enum
import numpy as np
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.config import config
from core.tax_calculator import tax_calculator, FilingStatus


class EmergencyType(str, Enum):
    """Types of financial emergencies."""
    JOB_LOSS = "job_loss"
    MEDICAL = "medical_emergency"
    HOME_REPAIR = "home_repair"
    AUTO_REPAIR = "auto_repair"
    FAMILY_CRISIS = "family_crisis"
    NATURAL_DISASTER = "natural_disaster"
    LEGAL = "legal_expenses"


class AccountType(str, Enum):
    """Emergency fund account types."""
    CHECKING = "checking"
    SAVINGS = "savings"
    HIGH_YIELD_SAVINGS = "high_yield_savings"
    MONEY_MARKET = "money_market"
    CD = "certificate_of_deposit"
    CD_LADDER = "cd_ladder"
    TREASURY_LADDER = "treasury_ladder"
    BROKERAGE = "taxable_brokerage"
    ROTH_IRA = "roth_ira"
    HSA = "health_savings_account"


@dataclass
class EmergencyProfile:
    """Emergency characteristics and requirements."""
    emergency_type: EmergencyType
    amount_needed: float
    time_horizon_days: int
    is_recurring: bool = False
    tax_year: int = 2024
    state: str = "CA"


@dataclass
class FundHolder:
    """Individual or family holding emergency funds."""
    age: int
    income: float
    tax_bracket: float
    family_size: int
    risk_tolerance: str  # conservative, moderate, aggressive
    has_other_liquid_assets: bool
    credit_score: int
    state: str


@dataclass
class TaxImplications:
    """Tax consequences of fund withdrawal."""
    ordinary_income_tax: float
    capital_gains_tax: float
    early_withdrawal_penalty: float
    state_tax: float
    total_tax_cost: float


class EmergencyFundStrategy(ABC):
    """Abstract base class for emergency fund management strategies."""
    
    def __init__(self, initial_balance: float, holder: FundHolder):
        self.balance = initial_balance
        self.holder = holder
        self.withdrawal_history = []
    
    @abstractmethod
    def calculate_accessibility(self, amount: float, days_needed: int) -> float:
        """Calculate how quickly funds can be accessed (0-1 score)."""
        pass
    
    @abstractmethod
    def calculate_withdrawal_cost(self, amount: float, emergency: EmergencyProfile) -> float:
        """Calculate total cost of withdrawal including penalties and taxes."""
        pass
    
    @abstractmethod
    def calculate_opportunity_cost(self, amount: float, holding_period_months: int) -> float:
        """Calculate opportunity cost of holding funds in this vehicle."""
        pass
    
    @abstractmethod
    def simulate_returns(self, months: int, iterations: int) -> np.ndarray:
        """Simulate fund growth over time."""
        pass
    
    def calculate_tax_implications(self, amount: float, 
                                  emergency: EmergencyProfile) -> TaxImplications:
        """Calculate tax consequences of withdrawal."""
        # Base implementation - strategies override as needed
        return TaxImplications(
            ordinary_income_tax=0,
            capital_gains_tax=0,
            early_withdrawal_penalty=0,
            state_tax=0,
            total_tax_cost=0
        )
    
    def apply_behavioral_adjustments(self, base_expenses: float, 
                                    emergency_type: EmergencyType) -> float:
        """Model expense reduction during emergencies."""
        reduction_factors = {
            EmergencyType.JOB_LOSS: 0.65,  # 35% expense reduction
            EmergencyType.MEDICAL: 0.85,   # 15% reduction
            EmergencyType.HOME_REPAIR: 0.90,  # 10% reduction
            EmergencyType.AUTO_REPAIR: 0.95,  # 5% reduction
            EmergencyType.FAMILY_CRISIS: 0.80,  # 20% reduction
            EmergencyType.NATURAL_DISASTER: 0.60,  # 40% reduction
            EmergencyType.LEGAL: 0.85  # 15% reduction
        }
        
        return base_expenses * reduction_factors.get(emergency_type, 0.9)


class HighYieldSavingsStrategy(EmergencyFundStrategy):
    """High-yield savings account strategy."""
    
    def __init__(self, initial_balance: float, holder: FundHolder, apy: float = 0.045):
        super().__init__(initial_balance, holder)
        self.apy = apy  # Current market rate ~4.5%
    
    def calculate_accessibility(self, amount: float, days_needed: int) -> float:
        """HYSA offers immediate access."""
        if days_needed <= 1:
            return 1.0  # Same-day access
        return 1.0  # Always fully accessible
    
    def calculate_withdrawal_cost(self, amount: float, emergency: EmergencyProfile) -> float:
        """No penalties or taxes on HYSA withdrawals."""
        # Only consider lost interest
        daily_rate = self.apy / 365
        lost_interest = amount * daily_rate * 30  # Assume 30 days of lost interest
        return lost_interest
    
    def calculate_opportunity_cost(self, amount: float, holding_period_months: int) -> float:
        """Opportunity cost vs market returns."""
        market_return = 0.07  # 7% annual market return
        hysa_return = self.apy
        
        monthly_opportunity = (market_return - hysa_return) / 12
        return amount * monthly_opportunity * holding_period_months
    
    def simulate_returns(self, months: int, iterations: int) -> np.ndarray:
        """Simulate HYSA returns with rate changes."""
        returns = np.zeros((iterations, months))
        
        for i in range(iterations):
            # Simulate rate changes (Fed policy changes)
            rate_changes = np.random.normal(0, 0.002, months)  # ±0.2% monthly volatility
            current_rate = self.apy
            
            for month in range(months):
                current_rate = np.clip(current_rate + rate_changes[month], 0.001, 0.08)
                monthly_return = current_rate / 12
                returns[i, month] = self.balance * (1 + monthly_return) ** (month + 1)
        
        return returns


class CDLadderStrategy(EmergencyFundStrategy):
    """Certificate of Deposit ladder strategy."""
    
    def __init__(self, initial_balance: float, holder: FundHolder, 
                 ladder_rungs: int = 12, avg_rate: float = 0.05):
        super().__init__(initial_balance, holder)
        self.ladder_rungs = ladder_rungs
        self.avg_rate = avg_rate
        self.rung_amount = initial_balance / ladder_rungs
        self.maturity_schedule = self._create_maturity_schedule()
    
    def _create_maturity_schedule(self) -> List[int]:
        """Create CD maturity schedule (days until maturity for each rung)."""
        return [30 * (i + 1) for i in range(self.ladder_rungs)]
    
    def calculate_accessibility(self, amount: float, days_needed: int) -> float:
        """Calculate based on maturity schedule."""
        available_immediately = 0
        
        for i, days_to_maturity in enumerate(self.maturity_schedule):
            if days_to_maturity <= days_needed:
                available_immediately += self.rung_amount
        
        if available_immediately >= amount:
            return 1.0
        elif available_immediately > 0:
            return available_immediately / amount
        return 0.1  # Can break CDs with penalty
    
    def calculate_withdrawal_cost(self, amount: float, emergency: EmergencyProfile) -> float:
        """Calculate early withdrawal penalties."""
        penalty_cost = 0
        remaining_amount = amount
        
        for i, days_to_maturity in enumerate(self.maturity_schedule):
            if remaining_amount <= 0:
                break
            
            if days_to_maturity > emergency.time_horizon_days:
                # Early withdrawal penalty: typically 3-6 months interest
                penalty_months = 3 if days_to_maturity <= 365 else 6
                rung_penalty = self.rung_amount * (self.avg_rate / 12) * penalty_months
                penalty_cost += rung_penalty
                remaining_amount -= self.rung_amount
        
        # Add tax on interest earned
        tax_implications = self.calculate_tax_implications(amount, emergency)
        
        return penalty_cost + tax_implications.total_tax_cost
    
    def calculate_opportunity_cost(self, amount: float, holding_period_months: int) -> float:
        """CD ladder vs market returns."""
        market_return = 0.07
        cd_return = self.avg_rate
        
        monthly_opportunity = (market_return - cd_return) / 12
        return amount * monthly_opportunity * holding_period_months
    
    def calculate_tax_implications(self, amount: float, 
                                  emergency: EmergencyProfile) -> TaxImplications:
        """Interest is taxed as ordinary income."""
        interest_earned = amount * (self.avg_rate / 12) * 6  # Assume 6 months average
        
        # ENFORCED: Use centralized tax calculator
        filing_status = FilingStatus.SINGLE  # Default assumption
        federal_tax, _ = tax_calculator.calculate_federal_tax(
            interest_earned,
            filing_status
        )
        state_tax = tax_calculator.calculate_state_tax(
            interest_earned,
            emergency.state,
            filing_status
        )
        
        return TaxImplications(
            ordinary_income_tax=federal_tax,
            capital_gains_tax=0,
            early_withdrawal_penalty=0,  # Handled separately
            state_tax=state_tax,
            total_tax_cost=federal_tax + state_tax
        )
    
    def simulate_returns(self, months: int, iterations: int) -> np.ndarray:
        """Simulate CD ladder returns."""
        returns = np.zeros((iterations, months))
        
        for i in range(iterations):
            for month in range(months):
                # Fixed return with ladder structure
                monthly_return = self.avg_rate / 12
                returns[i, month] = self.balance * (1 + monthly_return) ** (month + 1)
        
        return returns


class TaxableBrokerageStrategy(EmergencyFundStrategy):
    """Taxable investment account strategy."""
    
    def __init__(self, initial_balance: float, holder: FundHolder,
                 equity_allocation: float = 0.3):
        super().__init__(initial_balance, holder)
        self.equity_allocation = equity_allocation
        self.bond_allocation = 1 - equity_allocation
        self.cost_basis = initial_balance
    
    def calculate_accessibility(self, amount: float, days_needed: int) -> float:
        """Brokerage accounts have T+2 settlement."""
        if days_needed >= 3:
            return 1.0  # Full access after settlement
        elif days_needed >= 1:
            return 0.7  # Margin loan possible
        return 0.3  # Very limited same-day access
    
    def calculate_withdrawal_cost(self, amount: float, emergency: EmergencyProfile) -> float:
        """Calculate capital gains tax and market timing risk."""
        # Estimate gains
        holding_period = 12  # Assume 1 year average holding
        estimated_return = 0.07 * holding_period / 12
        gains = amount * estimated_return
        
        # ENFORCED: Use centralized tax calculator for capital gains
        filing_status = FilingStatus.SINGLE
        federal_tax, state_tax = tax_calculator.calculate_capital_gains_tax(
            gains,
            self.holder.income,
            holding_period,
            filing_status,
            emergency.state
        )
        
        # Market timing cost (selling during downturn)
        market_timing_cost = amount * 0.02  # Assume 2% adverse timing
        
        return federal_tax + state_tax + market_timing_cost
    
    def _get_ltcg_rate(self) -> float:
        """Get long-term capital gains rate based on income."""
        # ENFORCED: Use centralized tax brackets from config
        filing_status = FilingStatus.SINGLE
        brackets = config.LTCG_TAX_BRACKETS.get(filing_status.value, [])
        
        for limit, rate in brackets:
            if self.holder.income <= limit:
                return rate
        return 0.20  # Default to highest rate
    
    def calculate_opportunity_cost(self, amount: float, holding_period_months: int) -> float:
        """No opportunity cost - invested in market."""
        return 0  # Already capturing market returns
    
    def simulate_returns(self, months: int, iterations: int) -> np.ndarray:
        """Simulate investment returns with volatility."""
        returns = np.zeros((iterations, months))
        
        for i in range(iterations):
            # Simulate monthly returns
            equity_returns = np.random.normal(0.07/12, 0.15/np.sqrt(12), months)
            bond_returns = np.random.normal(0.04/12, 0.04/np.sqrt(12), months)
            
            portfolio_returns = (self.equity_allocation * equity_returns + 
                               self.bond_allocation * bond_returns)
            
            current_value = self.balance
            for month in range(months):
                current_value *= (1 + portfolio_returns[month])
                returns[i, month] = current_value
        
        return returns


class RothIRAStrategy(EmergencyFundStrategy):
    """Roth IRA as emergency fund (contributions only)."""
    
    def __init__(self, initial_balance: float, holder: FundHolder,
                 contribution_basis: float = None):
        super().__init__(initial_balance, holder)
        self.contribution_basis = contribution_basis or initial_balance * 0.6
        self.earnings = initial_balance - self.contribution_basis
    
    def calculate_accessibility(self, amount: float, days_needed: int) -> float:
        """Roth contributions accessible, earnings have restrictions."""
        if amount <= self.contribution_basis:
            if days_needed >= 5:
                return 1.0  # Contributions freely accessible
            return 0.5  # Processing time
        else:
            # Would need to tap earnings
            if self.holder.age >= 59.5:
                return 0.9  # No penalty after 59.5
            return 0.3  # Heavy penalties on earnings
    
    def calculate_withdrawal_cost(self, amount: float, emergency: EmergencyProfile) -> float:
        """Calculate penalties for Roth withdrawals."""
        if amount <= self.contribution_basis:
            return 0  # No cost for contribution withdrawals
        
        # Withdrawing earnings
        earnings_withdrawn = amount - self.contribution_basis
        
        if self.holder.age < 59.5:
            # 10% early withdrawal penalty on earnings
            penalty = earnings_withdrawn * 0.10
            
            # Earnings also taxed as ordinary income if not qualified
            tax = earnings_withdrawn * self.holder.tax_bracket
            
            return penalty + tax
        
        return 0  # No penalties after 59.5 with 5-year rule met
    
    def calculate_opportunity_cost(self, amount: float, holding_period_months: int) -> float:
        """Lost tax-free growth opportunity."""
        # Roth grows tax-free, significant opportunity cost
        tax_free_benefit = 0.02  # ~2% annual tax savings
        market_return = 0.07
        
        total_benefit = market_return + tax_free_benefit
        monthly_opportunity = total_benefit / 12
        
        # Higher opportunity cost due to contribution limits
        limit_scarcity_multiplier = 1.5
        
        return amount * monthly_opportunity * holding_period_months * limit_scarcity_multiplier
    
    def simulate_returns(self, months: int, iterations: int) -> np.ndarray:
        """Simulate Roth IRA returns (typically invested)."""
        returns = np.zeros((iterations, months))
        
        for i in range(iterations):
            # Assume moderate portfolio allocation
            monthly_returns = np.random.normal(0.06/12, 0.12/np.sqrt(12), months)
            
            current_value = self.balance
            for month in range(months):
                current_value *= (1 + monthly_returns[month])
                returns[i, month] = current_value
        
        return returns


class HSAStrategy(EmergencyFundStrategy):
    """Health Savings Account for medical emergencies."""
    
    def __init__(self, initial_balance: float, holder: FundHolder):
        super().__init__(initial_balance, holder)
        self.qualified_medical_receipts = initial_balance * 0.3  # Assume some saved receipts
    
    def calculate_accessibility(self, amount: float, days_needed: int) -> float:
        """HSA accessibility depends on medical qualification."""
        # Only fully accessible for medical emergencies
        if days_needed >= 3:
            return 0.8  # Good for medical, restricted otherwise
        return 0.3
    
    def calculate_withdrawal_cost(self, amount: float, emergency: EmergencyProfile) -> float:
        """Calculate HSA withdrawal costs."""
        if emergency.emergency_type == EmergencyType.MEDICAL:
            return 0  # No cost for qualified medical expenses
        
        if amount <= self.qualified_medical_receipts:
            return 0  # Can reimburse old medical expenses
        
        # Non-medical withdrawal
        non_qualified_amount = amount - self.qualified_medical_receipts
        
        if self.holder.age < 65:
            # 20% penalty + ordinary income tax
            penalty = non_qualified_amount * 0.20
            tax = non_qualified_amount * self.holder.tax_bracket
            return penalty + tax
        else:
            # Only ordinary income tax after 65
            return non_qualified_amount * self.holder.tax_bracket
    
    def calculate_opportunity_cost(self, amount: float, holding_period_months: int) -> float:
        """Triple tax advantage opportunity cost."""
        # HSA has triple tax advantage
        tax_benefit = 0.03  # ~3% annual from tax benefits
        market_return = 0.07
        
        total_benefit = market_return + tax_benefit
        monthly_opportunity = total_benefit / 12
        
        # Highest opportunity cost due to contribution limits
        limit_scarcity_multiplier = 2.0
        
        return amount * monthly_opportunity * holding_period_months * limit_scarcity_multiplier
    
    def simulate_returns(self, months: int, iterations: int) -> np.ndarray:
        """Simulate HSA returns."""
        returns = np.zeros((iterations, months))
        
        for i in range(iterations):
            # Conservative investment assumption
            monthly_returns = np.random.normal(0.05/12, 0.08/np.sqrt(12), months)
            
            current_value = self.balance
            for month in range(months):
                current_value *= (1 + monthly_returns[month])
                returns[i, month] = current_value
        
        return returns


class EmergencyFundOptimizer:
    """Optimizes emergency fund allocation across multiple strategies."""
    
    def __init__(self, total_fund: float, holder: FundHolder):
        self.total_fund = total_fund
        self.holder = holder
        self.strategies = []
    
    def optimize_allocation(self, target_months: int = 6) -> Dict[AccountType, float]:
        """Optimize fund allocation across account types."""
        monthly_expenses = self.holder.income / 12 * 0.7  # Assume 30% savings rate
        target_amount = monthly_expenses * target_months
        
        allocation = {}
        
        # Tier 1: Immediate access (1-2 months)
        immediate_need = monthly_expenses * 2
        allocation[AccountType.HIGH_YIELD_SAVINGS] = min(immediate_need, target_amount * 0.33)
        
        # Tier 2: Short-term access (2-4 months)
        if target_amount > immediate_need:
            short_term_need = monthly_expenses * 2
            allocation[AccountType.CD_LADDER] = min(short_term_need, target_amount * 0.33)
        
        # Tier 3: Extended emergency (4-6+ months)
        remaining = target_amount - sum(allocation.values())
        if remaining > 0:
            if self.holder.risk_tolerance == 'aggressive':
                allocation[AccountType.BROKERAGE] = remaining * 0.7
                allocation[AccountType.ROTH_IRA] = remaining * 0.3
            elif self.holder.risk_tolerance == 'moderate':
                allocation[AccountType.CD_LADDER] = allocation.get(AccountType.CD_LADDER, 0) + remaining * 0.5
                allocation[AccountType.BROKERAGE] = remaining * 0.5
            else:  # conservative
                allocation[AccountType.HIGH_YIELD_SAVINGS] = allocation.get(AccountType.HIGH_YIELD_SAVINGS, 0) + remaining
        
        return allocation
    
    def simulate_emergency_scenarios(self, allocation: Dict[AccountType, float],
                                    scenarios: List[EmergencyProfile],
                                    iterations: int = 1000) -> Dict[str, any]:
        """Simulate performance across emergency scenarios."""
        results = {}
        
        for scenario in scenarios:
            costs = []
            accessibility_scores = []
            
            for _ in range(iterations):
                total_cost = 0
                total_accessibility = 0
                
                for account_type, amount in allocation.items():
                    strategy = self._create_strategy(account_type, amount)
                    
                    # Calculate costs
                    withdrawal_cost = strategy.calculate_withdrawal_cost(
                        amount * 0.5, scenario  # Assume 50% withdrawal
                    )
                    total_cost += withdrawal_cost
                    
                    # Calculate accessibility
                    accessibility = strategy.calculate_accessibility(
                        amount * 0.5, scenario.time_horizon_days
                    )
                    total_accessibility += accessibility * (amount / self.total_fund)
                
                costs.append(total_cost)
                accessibility_scores.append(total_accessibility)
            
            results[scenario.emergency_type] = {
                'mean_cost': np.mean(costs),
                'mean_accessibility': np.mean(accessibility_scores),
                'cost_std': np.std(costs),
                'accessibility_std': np.std(accessibility_scores)
            }
        
        return results
    
    def _create_strategy(self, account_type: AccountType, amount: float) -> EmergencyFundStrategy:
        """Factory method for creating strategies."""
        strategies = {
            AccountType.HIGH_YIELD_SAVINGS: HighYieldSavingsStrategy,
            AccountType.CD_LADDER: CDLadderStrategy,
            AccountType.BROKERAGE: TaxableBrokerageStrategy,
            AccountType.ROTH_IRA: RothIRAStrategy,
            AccountType.HSA: HSAStrategy
        }
        
        strategy_class = strategies.get(account_type, HighYieldSavingsStrategy)
        return strategy_class(amount, self.holder)