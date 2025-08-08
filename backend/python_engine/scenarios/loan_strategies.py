"""
Advanced Student Loan Repayment Strategies.
Implements real-world loan repayment options with full financial realism.
"""

from abc import ABC, abstractmethod
from typing import Dict, Tuple, Optional
from dataclasses import dataclass
import numpy as np
from enum import Enum
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.config import config
from core.tax_calculator import tax_calculator, FilingStatus


class RepaymentPlanType(str, Enum):
    """Federal and private loan repayment plan types."""
    STANDARD = "standard"
    GRADUATED = "graduated"
    EXTENDED = "extended"
    IBR = "income_based_repayment"
    PAYE = "pay_as_you_earn"
    REPAYE = "revised_pay_as_you_earn"
    ICR = "income_contingent_repayment"
    PSLF = "public_service_loan_forgiveness"
    PRIVATE_REFINANCE = "private_refinance"


@dataclass
class LoanTerms:
    """Comprehensive loan terms and conditions."""
    principal: float
    interest_rate: float
    federal_loan: bool = True
    subsidized: bool = False
    origination_date: Optional[str] = None
    servicer: Optional[str] = None
    

@dataclass
class BorrowerProfile:
    """Borrower financial and employment profile."""
    annual_income: float
    family_size: int
    filing_status: str  # single, married_joint, married_separate
    state: str
    employment_type: str  # private, public, non_profit
    years_in_repayment: int = 0
    credit_score: int = 650
    

class StudentLoanStrategy(ABC):
    """Abstract base class for student loan repayment strategies."""
    
    def __init__(self, terms: LoanTerms, borrower: BorrowerProfile):
        self.terms = terms
        self.borrower = borrower
        self._federal_poverty_line = self._get_poverty_line()
    
    def _get_poverty_line(self) -> float:
        """Get federal poverty line based on family size."""
        # ENFORCED: Use centralized configuration
        poverty_guidelines = config.FEDERAL_POVERTY_GUIDELINES
        if self.borrower.family_size <= 8:
            return poverty_guidelines.get(self.borrower.family_size, 52720)
        else:
            base = poverty_guidelines[8]
            additional_person_amount = 5380
            return base + (self.borrower.family_size - 8) * additional_person_amount
    
    @abstractmethod
    def calculate_payment(self, month: int) -> float:
        """Calculate monthly payment for given month in repayment."""
        pass
    
    @abstractmethod
    def calculate_total_cost(self, iterations: int) -> np.ndarray:
        """Calculate total cost over loan lifetime for Monte Carlo iterations."""
        pass
    
    @abstractmethod
    def get_forgiveness_terms(self) -> Optional[Dict[str, any]]:
        """Get loan forgiveness terms if applicable."""
        pass
    
    def calculate_interest_capitalization(self, unpaid_interest: float) -> float:
        """Calculate interest capitalization for income-driven plans."""
        # Interest capitalizes at specific events (leaving plan, annual recertification)
        return unpaid_interest * 0.1  # 10% of unpaid interest capitalizes annually
    
    def calculate_tax_bomb(self, forgiven_amount: float) -> float:
        """Calculate tax liability on forgiven loans (non-PSLF)."""
        # ENFORCED: Use centralized tax calculator
        filing_status = FilingStatus.SINGLE if self.borrower.filing_status == 'single' else FilingStatus.MARRIED_JOINT
        return tax_calculator.calculate_student_loan_forgiveness_tax(
            forgiven_amount,
            self.borrower.annual_income,
            filing_status,
            self.borrower.state,
            is_pslf=False
        )


class StandardRepaymentStrategy(StudentLoanStrategy):
    """10-year standard repayment plan."""
    
    def calculate_payment(self, month: int) -> float:
        """Fixed payment over 120 months."""
        r = self.terms.interest_rate / 12
        n = 120  # 10 years
        if r == 0:
            return self.terms.principal / n
        
        payment = self.terms.principal * (r * (1 + r)**n) / ((1 + r)**n - 1)
        return max(payment, 50)  # Minimum $50 payment
    
    def calculate_total_cost(self, iterations: int) -> np.ndarray:
        """Total cost is fixed for standard repayment."""
        payment = self.calculate_payment(0)
        total = payment * 120
        return np.full(iterations, total)
    
    def get_forgiveness_terms(self) -> None:
        """No forgiveness in standard plan."""
        return None


class IBRStrategy(StudentLoanStrategy):
    """Income-Based Repayment (IBR) - 15% of discretionary income."""
    
    def calculate_payment(self, month: int) -> float:
        """15% of discretionary income, 25-year forgiveness."""
        # ENFORCED: Use centralized tax calculator for discretionary income
        discretionary_income = tax_calculator.get_discretionary_income(
            self.borrower.annual_income,
            self.borrower.family_size,
            1.5  # 150% of poverty line for IBR
        )
        monthly_payment = (0.15 * discretionary_income) / 12
        
        # Cap at standard 10-year payment
        standard_payment = StandardRepaymentStrategy(self.terms, self.borrower).calculate_payment(0)
        
        # Apply partial financial hardship test
        if monthly_payment >= standard_payment:
            return standard_payment
        
        return max(monthly_payment, 0)  # Can be $0 if income is low
    
    def calculate_total_cost(self, iterations: int) -> np.ndarray:
        """Monte Carlo simulation of total cost with income volatility."""
        costs = np.zeros(iterations)
        
        for i in range(iterations):
            balance = self.terms.principal
            total_paid = 0
            months = 0
            max_months = 300  # 25 years
            
            # Simulate income changes
            income_multiplier = np.random.normal(1.0, 0.15, max_months)
            
            while balance > 0 and months < max_months:
                current_income = self.borrower.annual_income * income_multiplier[months]
                
                # Recalculate payment with current income
                discretionary = max(0, current_income - 1.5 * self._federal_poverty_line)
                payment = min((0.15 * discretionary) / 12, balance * 1.1)
                
                # Apply interest
                interest = balance * (self.terms.interest_rate / 12)
                principal_payment = max(0, payment - interest)
                balance -= principal_payment
                
                # Track unpaid interest for capitalization
                if payment < interest:
                    unpaid_interest = interest - payment
                    if months % 12 == 0:  # Annual capitalization
                        balance += self.calculate_interest_capitalization(unpaid_interest)
                
                total_paid += payment
                months += 1
            
            # Add tax bomb if forgiveness occurred
            if balance > 0 and months >= max_months:
                tax_liability = self.calculate_tax_bomb(balance)
                total_paid += tax_liability
            
            costs[i] = total_paid
        
        return costs
    
    def get_forgiveness_terms(self) -> Dict[str, any]:
        """IBR forgiveness after 25 years."""
        return {
            'forgiveness_months': 300,
            'taxable': True,
            'requires_recertification': True,
            'partial_hardship_required': True
        }


class PAYEStrategy(StudentLoanStrategy):
    """Pay As You Earn (PAYE) - 10% of discretionary income."""
    
    def calculate_payment(self, month: int) -> float:
        """10% of discretionary income, 20-year forgiveness."""
        # ENFORCED: Use centralized tax calculator
        discretionary_income = tax_calculator.get_discretionary_income(
            self.borrower.annual_income,
            self.borrower.family_size,
            1.5
        )
        monthly_payment = (0.10 * discretionary_income) / 12
        
        # Cap at standard 10-year payment
        standard_payment = StandardRepaymentStrategy(self.terms, self.borrower).calculate_payment(0)
        
        return min(monthly_payment, standard_payment)
    
    def calculate_total_cost(self, iterations: int) -> np.ndarray:
        """Monte Carlo simulation with 20-year forgiveness."""
        costs = np.zeros(iterations)
        
        for i in range(iterations):
            balance = self.terms.principal
            total_paid = 0
            months = 0
            max_months = 240  # 20 years
            
            # Income volatility simulation
            income_growth = np.random.normal(1.03, 0.02, max_months // 12)  # 3% annual growth
            
            while balance > 0 and months < max_months:
                year = months // 12
                current_income = self.borrower.annual_income * np.prod(income_growth[:year+1])
                
                discretionary = max(0, current_income - 1.5 * self._federal_poverty_line)
                payment = min((0.10 * discretionary) / 12, balance * 1.1)
                
                interest = balance * (self.terms.interest_rate / 12)
                principal_payment = max(0, payment - interest)
                balance -= principal_payment
                
                total_paid += payment
                months += 1
            
            # Tax on forgiveness
            if balance > 0:
                total_paid += self.calculate_tax_bomb(balance)
            
            costs[i] = total_paid
        
        return costs
    
    def get_forgiveness_terms(self) -> Dict[str, any]:
        """PAYE forgiveness after 20 years."""
        return {
            'forgiveness_months': 240,
            'taxable': True,
            'requires_recertification': True,
            'new_borrower_requirement': True  # Must be new borrower as of Oct 1, 2007
        }


class REPAYEStrategy(StudentLoanStrategy):
    """Revised Pay As You Earn (REPAYE) - 10% of discretionary income."""
    
    def calculate_payment(self, month: int) -> float:
        """10% of discretionary income, no payment cap."""
        # ENFORCED: Use centralized tax calculator
        discretionary_income = tax_calculator.get_discretionary_income(
            self.borrower.annual_income,
            self.borrower.family_size,
            1.5
        )
        
        # REPAYE has no cap - payment can exceed standard
        monthly_payment = (0.10 * discretionary_income) / 12
        
        return max(monthly_payment, 0)
    
    def calculate_total_cost(self, iterations: int) -> np.ndarray:
        """Monte Carlo with interest subsidy benefit."""
        costs = np.zeros(iterations)
        
        for i in range(iterations):
            balance = self.terms.principal
            total_paid = 0
            months = 0
            max_months = 240 if self.borrower.employment_type != 'graduate' else 300
            
            while balance > 0 and months < max_months:
                payment = self.calculate_payment(months)
                interest = balance * (self.terms.interest_rate / 12)
                
                # REPAYE interest subsidy: government pays 50% of unpaid interest
                if payment < interest:
                    unpaid_interest = interest - payment
                    interest_subsidy = unpaid_interest * 0.5
                    effective_interest = interest - interest_subsidy
                else:
                    effective_interest = interest
                
                principal_payment = max(0, payment - effective_interest)
                balance -= principal_payment
                
                total_paid += payment
                months += 1
            
            if balance > 0:
                total_paid += self.calculate_tax_bomb(balance)
            
            costs[i] = total_paid
        
        return costs
    
    def get_forgiveness_terms(self) -> Dict[str, any]:
        """REPAYE forgiveness: 20 years undergraduate, 25 years graduate."""
        return {
            'forgiveness_months': 240 if self.borrower.employment_type != 'graduate' else 300,
            'taxable': True,
            'interest_subsidy': True,
            'no_payment_cap': True
        }


class PSLFStrategy(StudentLoanStrategy):
    """Public Service Loan Forgiveness - IDR payment with 10-year tax-free forgiveness."""
    
    def __init__(self, terms: LoanTerms, borrower: BorrowerProfile, base_idr_plan: str = 'PAYE'):
        super().__init__(terms, borrower)
        self.base_idr_plan = base_idr_plan
        
        # Verify eligibility
        if borrower.employment_type not in ['public', 'non_profit']:
            raise ValueError("PSLF requires qualifying employment")
        
        if not terms.federal_loan:
            raise ValueError("PSLF only available for federal loans")
    
    def calculate_payment(self, month: int) -> float:
        """Use underlying IDR plan payment calculation."""
        if self.base_idr_plan == 'IBR':
            return IBRStrategy(self.terms, self.borrower).calculate_payment(month)
        elif self.base_idr_plan == 'PAYE':
            return PAYEStrategy(self.terms, self.borrower).calculate_payment(month)
        else:
            return REPAYEStrategy(self.terms, self.borrower).calculate_payment(month)
    
    def calculate_total_cost(self, iterations: int) -> np.ndarray:
        """PSLF: 120 qualifying payments, tax-free forgiveness."""
        costs = np.zeros(iterations)
        
        for i in range(iterations):
            total_paid = 0
            qualifying_payments = 0
            months = 0
            
            # Simulate employment changes (risk of leaving qualifying employment)
            employment_continuity = np.random.random() > 0.2  # 80% stay in qualifying job
            
            while qualifying_payments < 120 and months < 360:  # Max 30 years
                if employment_continuity or months < 60:  # At least 5 years
                    payment = self.calculate_payment(months)
                    total_paid += payment
                    qualifying_payments += 1
                else:
                    # Lost qualifying employment - switch to standard
                    remaining_balance = self.terms.principal - (total_paid * 0.7)  # Rough estimate
                    standard = StandardRepaymentStrategy(self.terms, self.borrower)
                    remaining_cost = standard.calculate_total_cost(1)[0]
                    total_paid += remaining_cost
                    break
                
                months += 1
            
            costs[i] = total_paid
        
        return costs
    
    def get_forgiveness_terms(self) -> Dict[str, any]:
        """PSLF: 120 payments, tax-free forgiveness."""
        return {
            'forgiveness_months': 120,
            'taxable': False,
            'qualifying_employment_required': True,
            'requires_direct_loans': True,
            'payment_tracking_critical': True
        }


class RefinanceStrategy(StudentLoanStrategy):
    """Private refinancing with optimized rates based on credit."""
    
    def __init__(self, terms: LoanTerms, borrower: BorrowerProfile, 
                 new_term_years: int = 10):
        super().__init__(terms, borrower)
        self.new_term_years = new_term_years
        self.new_rate = self._calculate_refinance_rate()
    
    def _calculate_refinance_rate(self) -> float:
        """Calculate refinance rate based on credit score and market conditions."""
        base_rates = {
            5: 0.0399,   # 5-year: 3.99%
            10: 0.0499,  # 10-year: 4.99%
            15: 0.0599,  # 15-year: 5.99%
            20: 0.0649   # 20-year: 6.49%
        }
        
        base_rate = base_rates.get(self.new_term_years, 0.0599)
        
        # Credit score adjustment
        if self.borrower.credit_score >= 750:
            rate_adjustment = -0.005
        elif self.borrower.credit_score >= 700:
            rate_adjustment = 0
        elif self.borrower.credit_score >= 650:
            rate_adjustment = 0.01
        else:
            rate_adjustment = 0.02
        
        # Income adjustment
        if self.borrower.annual_income > 100000:
            rate_adjustment -= 0.0025
        
        return max(0.0299, base_rate + rate_adjustment)  # Minimum 2.99%
    
    def calculate_payment(self, month: int) -> float:
        """Calculate refinanced loan payment."""
        r = self.new_rate / 12
        n = self.new_term_years * 12
        
        if r == 0:
            return self.terms.principal / n
        
        payment = self.terms.principal * (r * (1 + r)**n) / ((1 + r)**n - 1)
        return payment
    
    def calculate_total_cost(self, iterations: int) -> np.ndarray:
        """Calculate total cost with refinancing."""
        payment = self.calculate_payment(0)
        total = payment * (self.new_term_years * 12)
        
        # Add refinancing fees (typically 0.5-1% of loan balance)
        fees = self.terms.principal * np.random.uniform(0.005, 0.01, iterations)
        
        return np.full(iterations, total) + fees
    
    def get_forgiveness_terms(self) -> None:
        """No forgiveness with private refinancing."""
        return None


class LoanStrategyFactory:
    """Factory pattern for creating loan repayment strategies."""
    
    @staticmethod
    def create_strategy(plan_type: RepaymentPlanType, 
                       terms: LoanTerms, 
                       borrower: BorrowerProfile,
                       **kwargs) -> StudentLoanStrategy:
        """Create appropriate strategy based on plan type."""
        
        strategies = {
            RepaymentPlanType.STANDARD: StandardRepaymentStrategy,
            RepaymentPlanType.IBR: IBRStrategy,
            RepaymentPlanType.PAYE: PAYEStrategy,
            RepaymentPlanType.REPAYE: REPAYEStrategy,
            RepaymentPlanType.PSLF: PSLFStrategy,
            RepaymentPlanType.PRIVATE_REFINANCE: RefinanceStrategy
        }
        
        strategy_class = strategies.get(plan_type)
        if not strategy_class:
            raise ValueError(f"Unknown repayment plan: {plan_type}")
        
        if plan_type == RepaymentPlanType.PSLF:
            return strategy_class(terms, borrower, kwargs.get('base_idr_plan', 'PAYE'))
        elif plan_type == RepaymentPlanType.PRIVATE_REFINANCE:
            return strategy_class(terms, borrower, kwargs.get('new_term_years', 10))
        else:
            return strategy_class(terms, borrower)


class OptimalStrategySelector:
    """Selects optimal repayment strategy based on borrower profile."""
    
    @staticmethod
    def select_optimal_strategy(terms: LoanTerms, 
                               borrower: BorrowerProfile,
                               iterations: int = 1000) -> Tuple[RepaymentPlanType, Dict[str, float]]:
        """Run simulations to find optimal strategy."""
        
        results = {}
        
        # Test eligible strategies
        strategies_to_test = [RepaymentPlanType.STANDARD]
        
        # Add IDR plans if federal loan
        if terms.federal_loan:
            strategies_to_test.extend([
                RepaymentPlanType.IBR,
                RepaymentPlanType.PAYE,
                RepaymentPlanType.REPAYE
            ])
            
            # Add PSLF if eligible
            if borrower.employment_type in ['public', 'non_profit']:
                strategies_to_test.append(RepaymentPlanType.PSLF)
        
        # Add refinancing if good credit
        if borrower.credit_score >= 650:
            strategies_to_test.append(RepaymentPlanType.PRIVATE_REFINANCE)
        
        # Run simulations
        for plan_type in strategies_to_test:
            try:
                strategy = LoanStrategyFactory.create_strategy(plan_type, terms, borrower)
                costs = strategy.calculate_total_cost(iterations)
                results[plan_type] = {
                    'mean_cost': np.mean(costs),
                    'median_cost': np.median(costs),
                    'std_dev': np.std(costs),
                    'min_cost': np.min(costs),
                    'max_cost': np.max(costs)
                }
            except (ValueError, Exception):
                continue  # Skip ineligible strategies
        
        # Find optimal by lowest mean cost
        if results:
            optimal = min(results.items(), key=lambda x: x[1]['mean_cost'])
            return optimal[0], results
        
        return RepaymentPlanType.STANDARD, {RepaymentPlanType.STANDARD: {'mean_cost': 0}}