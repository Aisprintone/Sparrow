"""
Centralized tax calculation utilities.
Eliminates duplication and provides consistent tax modeling across all scenarios.
"""

from typing import Dict, Tuple, Optional
from dataclasses import dataclass
from enum import Enum

from .config import config


class FilingStatus(str, Enum):
    """IRS filing status options."""
    SINGLE = "single"
    MARRIED_JOINT = "married_joint"
    MARRIED_SEPARATE = "married_separate"
    HEAD_OF_HOUSEHOLD = "head_of_household"


class TaxType(str, Enum):
    """Types of taxes."""
    ORDINARY_INCOME = "ordinary_income"
    LONG_TERM_CAPITAL_GAINS = "ltcg"
    SHORT_TERM_CAPITAL_GAINS = "stcg"
    QUALIFIED_DIVIDENDS = "qualified_dividends"
    STATE_INCOME = "state_income"


@dataclass
class TaxResult:
    """Comprehensive tax calculation result."""
    federal_tax: float
    state_tax: float
    fica_tax: float
    medicare_tax: float
    total_tax: float
    effective_rate: float
    marginal_rate: float
    after_tax_income: float


class TaxCalculator:
    """
    Centralized tax calculation engine.
    ENFORCED: Single source of truth for all tax calculations.
    """
    
    def __init__(self):
        """Initialize with configuration."""
        self.federal_brackets = config.FEDERAL_TAX_BRACKETS
        self.ltcg_brackets = config.LTCG_TAX_BRACKETS
        self.state_rates = config.STATE_TAX_RATES
        self.poverty_guidelines = config.FEDERAL_POVERTY_GUIDELINES
        
        # FICA/Medicare rates (2024)
        self.social_security_rate = 0.062
        self.social_security_cap = 168600
        self.medicare_rate = 0.0145
        self.medicare_additional_threshold = 200000
        self.medicare_additional_rate = 0.009
    
    def calculate_federal_tax(
        self,
        income: float,
        filing_status: FilingStatus = FilingStatus.SINGLE,
        deductions: float = 0
    ) -> Tuple[float, float]:
        """
        Calculate federal income tax.
        
        Args:
            income: Gross income
            filing_status: Tax filing status
            deductions: Total deductions (standard or itemized)
            
        Returns:
            Tuple of (tax_amount, marginal_rate)
        """
        # Apply standard deduction if no deductions provided
        if deductions == 0:
            standard_deductions = {
                FilingStatus.SINGLE: 14600,
                FilingStatus.MARRIED_JOINT: 29200,
                FilingStatus.MARRIED_SEPARATE: 14600,
                FilingStatus.HEAD_OF_HOUSEHOLD: 21900
            }
            deductions = standard_deductions.get(filing_status, 14600)
        
        taxable_income = max(0, income - deductions)
        
        # Get appropriate brackets
        brackets = self.federal_brackets.get(
            filing_status.value,
            self.federal_brackets['single']
        )
        
        tax = 0
        marginal_rate = 0
        previous_limit = 0
        
        for limit, rate in brackets:
            if taxable_income <= previous_limit:
                break
            
            taxable_in_bracket = min(taxable_income - previous_limit, 
                                    limit - previous_limit if limit != float('inf') else taxable_income)
            tax += taxable_in_bracket * rate
            marginal_rate = rate
            
            if taxable_income <= limit:
                break
            
            previous_limit = limit
        
        return tax, marginal_rate
    
    def calculate_state_tax(
        self,
        income: float,
        state: str,
        filing_status: FilingStatus = FilingStatus.SINGLE
    ) -> float:
        """
        Calculate state income tax.
        
        Args:
            income: Gross income
            state: Two-letter state code
            filing_status: Tax filing status
            
        Returns:
            State tax amount
        """
        # Get state rate (use default if state not found)
        state_rate = self.state_rates.get(
            state.upper(),
            self.state_rates.get('DEFAULT', 0.05)
        )
        
        # Most states use federal AGI as starting point
        # Simplified calculation - in reality each state has its own rules
        if state.upper() in ['CA', 'NY', 'NJ']:
            # Progressive tax states (simplified to top rate)
            return income * state_rate
        else:
            # Flat tax or no tax states
            return income * state_rate
    
    def calculate_fica_taxes(self, income: float) -> Tuple[float, float]:
        """
        Calculate Social Security and Medicare taxes.
        
        Args:
            income: Gross income
            
        Returns:
            Tuple of (social_security_tax, medicare_tax)
        """
        # Social Security (capped)
        ss_taxable = min(income, self.social_security_cap)
        ss_tax = ss_taxable * self.social_security_rate
        
        # Medicare (no cap, additional tax for high earners)
        medicare_tax = income * self.medicare_rate
        
        if income > self.medicare_additional_threshold:
            additional_income = income - self.medicare_additional_threshold
            medicare_tax += additional_income * self.medicare_additional_rate
        
        return ss_tax, medicare_tax
    
    def calculate_capital_gains_tax(
        self,
        gains: float,
        income: float,
        holding_period_months: int,
        filing_status: FilingStatus = FilingStatus.SINGLE,
        state: str = "CA"
    ) -> Tuple[float, float]:
        """
        Calculate capital gains tax.
        
        Args:
            gains: Capital gains amount
            income: Other ordinary income
            holding_period_months: How long asset was held
            filing_status: Tax filing status
            state: State for state tax calculation
            
        Returns:
            Tuple of (federal_tax, state_tax)
        """
        if holding_period_months >= 12:
            # Long-term capital gains
            brackets = self.ltcg_brackets.get(
                filing_status.value,
                self.ltcg_brackets['single']
            )
            
            total_income = income + gains
            federal_tax = 0
            previous_limit = 0
            
            for limit, rate in brackets:
                if total_income <= previous_limit:
                    break
                
                taxable_in_bracket = min(
                    gains,
                    min(total_income - previous_limit, limit - previous_limit)
                    if limit != float('inf') else gains
                )
                federal_tax += taxable_in_bracket * rate
                
                if total_income <= limit:
                    break
                
                previous_limit = limit
        else:
            # Short-term capital gains (taxed as ordinary income)
            federal_tax, _ = self.calculate_federal_tax(
                income + gains,
                filing_status
            )
            base_tax, _ = self.calculate_federal_tax(income, filing_status)
            federal_tax = federal_tax - base_tax
        
        # State tax (most states tax capital gains as ordinary income)
        state_tax = self.calculate_state_tax(gains, state, filing_status)
        
        return federal_tax, state_tax
    
    def calculate_student_loan_forgiveness_tax(
        self,
        forgiven_amount: float,
        income: float,
        filing_status: FilingStatus = FilingStatus.SINGLE,
        state: str = "CA",
        is_pslf: bool = False
    ) -> float:
        """
        Calculate tax on forgiven student loan debt.
        
        Args:
            forgiven_amount: Amount of debt forgiven
            income: Current year income
            filing_status: Tax filing status
            state: State for tax calculation
            is_pslf: Whether Public Service Loan Forgiveness
            
        Returns:
            Total tax liability on forgiveness
        """
        if is_pslf:
            # PSLF forgiveness is tax-free at federal level
            federal_tax = 0
        else:
            # IDR forgiveness is taxable as ordinary income
            total_income = income + forgiven_amount
            total_tax, _ = self.calculate_federal_tax(total_income, filing_status)
            base_tax, _ = self.calculate_federal_tax(income, filing_status)
            federal_tax = total_tax - base_tax
        
        # State tax treatment varies
        state_tax = 0
        if state.upper() not in ['PA', 'MS', 'NC']:  # States that exempt forgiveness
            state_tax = self.calculate_state_tax(forgiven_amount, state, filing_status)
        
        return federal_tax + state_tax
    
    def calculate_retirement_withdrawal_tax(
        self,
        withdrawal_amount: float,
        account_type: str,
        age: int,
        income: float,
        filing_status: FilingStatus = FilingStatus.SINGLE,
        state: str = "CA"
    ) -> Tuple[float, float]:
        """
        Calculate taxes and penalties on retirement account withdrawals.
        
        Args:
            withdrawal_amount: Amount withdrawn
            account_type: Type of retirement account
            age: Age of account holder
            income: Other income for the year
            filing_status: Tax filing status
            state: State for tax calculation
            
        Returns:
            Tuple of (taxes, penalties)
        """
        taxes = 0
        penalties = 0
        
        if account_type == "traditional_401k" or account_type == "traditional_ira":
            # Traditional accounts: withdrawals are ordinary income
            total_income = income + withdrawal_amount
            total_tax, _ = self.calculate_federal_tax(total_income, filing_status)
            base_tax, _ = self.calculate_federal_tax(income, filing_status)
            federal_tax = total_tax - base_tax
            
            state_tax = self.calculate_state_tax(withdrawal_amount, state, filing_status)
            taxes = federal_tax + state_tax
            
            # Early withdrawal penalty
            if age < 59.5:
                penalties = withdrawal_amount * 0.10
        
        elif account_type == "roth_ira":
            # Roth IRA: contributions always tax-free
            # Earnings may be taxable/penalized if not qualified
            if age < 59.5:
                # Assume some portion is earnings (simplified)
                earnings_portion = withdrawal_amount * 0.4  # Assume 40% is earnings
                
                # Tax on earnings
                total_income = income + earnings_portion
                total_tax, _ = self.calculate_federal_tax(total_income, filing_status)
                base_tax, _ = self.calculate_federal_tax(income, filing_status)
                federal_tax = total_tax - base_tax
                
                state_tax = self.calculate_state_tax(earnings_portion, state, filing_status)
                taxes = federal_tax + state_tax
                
                # Penalty on earnings
                penalties = earnings_portion * 0.10
        
        elif account_type == "hsa":
            # HSA: tax-free for medical, otherwise taxed + penalized
            if age < 65:
                # Non-medical withdrawal before 65
                total_income = income + withdrawal_amount
                total_tax, _ = self.calculate_federal_tax(total_income, filing_status)
                base_tax, _ = self.calculate_federal_tax(income, filing_status)
                federal_tax = total_tax - base_tax
                
                state_tax = self.calculate_state_tax(withdrawal_amount, state, filing_status)
                taxes = federal_tax + state_tax
                
                # 20% penalty for non-medical withdrawal
                penalties = withdrawal_amount * 0.20
            else:
                # After 65, only ordinary income tax (no penalty)
                total_income = income + withdrawal_amount
                total_tax, _ = self.calculate_federal_tax(total_income, filing_status)
                base_tax, _ = self.calculate_federal_tax(income, filing_status)
                federal_tax = total_tax - base_tax
                
                state_tax = self.calculate_state_tax(withdrawal_amount, state, filing_status)
                taxes = federal_tax + state_tax
        
        return taxes, penalties
    
    def get_discretionary_income(
        self,
        annual_income: float,
        family_size: int,
        poverty_multiplier: float = 1.5
    ) -> float:
        """
        Calculate discretionary income for student loan calculations.
        
        Args:
            annual_income: Annual gross income
            family_size: Size of family/household
            poverty_multiplier: Multiplier of poverty line (1.5 for most IDR plans)
            
        Returns:
            Discretionary income
        """
        # Get poverty guideline
        if family_size <= 8:
            poverty_line = self.poverty_guidelines.get(family_size, 52720)
        else:
            # For families larger than 8
            base = self.poverty_guidelines[8]
            additional_person_amount = 5380
            poverty_line = base + (family_size - 8) * additional_person_amount
        
        # Calculate discretionary income
        protected_income = poverty_line * poverty_multiplier
        discretionary = max(0, annual_income - protected_income)
        
        return discretionary
    
    def calculate_comprehensive_tax(
        self,
        income: float,
        capital_gains: float = 0,
        qualified_dividends: float = 0,
        filing_status: FilingStatus = FilingStatus.SINGLE,
        state: str = "CA",
        deductions: float = 0
    ) -> TaxResult:
        """
        Comprehensive tax calculation for all income types.
        
        Args:
            income: Ordinary income
            capital_gains: Long-term capital gains
            qualified_dividends: Qualified dividend income
            filing_status: Tax filing status
            state: State for tax calculation
            deductions: Total deductions
            
        Returns:
            Comprehensive tax result
        """
        # Federal ordinary income tax
        federal_ordinary, marginal_rate = self.calculate_federal_tax(
            income, filing_status, deductions
        )
        
        # Capital gains and qualified dividends
        federal_cap_gains = 0
        if capital_gains > 0 or qualified_dividends > 0:
            # Both taxed at LTCG rates
            ltcg_income = capital_gains + qualified_dividends
            federal_cap_gains, _ = self.calculate_capital_gains_tax(
                ltcg_income, income, 12, filing_status, state
            )
        
        # FICA taxes
        ss_tax, medicare_tax = self.calculate_fica_taxes(income)
        
        # State tax (simplified - includes all income)
        total_state_income = income + capital_gains + qualified_dividends
        state_tax = self.calculate_state_tax(total_state_income, state, filing_status)
        
        # Calculate totals
        federal_tax = federal_ordinary + federal_cap_gains
        total_tax = federal_tax + state_tax + ss_tax + medicare_tax
        total_income = income + capital_gains + qualified_dividends
        after_tax = total_income - total_tax
        effective_rate = total_tax / total_income if total_income > 0 else 0
        
        return TaxResult(
            federal_tax=federal_tax,
            state_tax=state_tax,
            fica_tax=ss_tax,
            medicare_tax=medicare_tax,
            total_tax=total_tax,
            effective_rate=effective_rate,
            marginal_rate=marginal_rate,
            after_tax_income=after_tax
        )


# Global tax calculator instance
tax_calculator = TaxCalculator()