"""
Configuration module for Monte Carlo simulation engine.
Centralizes all simulation parameters following DRY principle.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Any


@dataclass
class SimulationConfig:
    """Central configuration for all simulation parameters."""
    
    # Monte Carlo parameters
    DEFAULT_ITERATIONS: int = 10000
    RANDOM_SEED: int = 42
    CONFIDENCE_INTERVALS: List[float] = field(default_factory=lambda: [0.1, 0.25, 0.5, 0.75, 0.9])
    
    # Market assumptions (annual rates)
    MARKET_RETURN_MEAN: float = 0.07  # 7% average market return
    MARKET_RETURN_STD: float = 0.15   # 15% volatility
    
    # Inflation parameters (annual)
    INFLATION_MEAN: float = 0.03      # 3% average inflation
    INFLATION_STD: float = 0.02       # 2% inflation volatility
    
    # Interest rates (annual)
    SAVINGS_RATE: float = 0.045       # 4.5% high-yield savings
    STUDENT_LOAN_RATE: float = 0.068  # 6.8% average student loan
    MORTGAGE_RATE: float = 0.065      # 6.5% current mortgage rate
    CREDIT_CARD_RATE: float = 0.199   # 19.9% average credit card
    
    # Emergency fund targets by demographic (months of expenses)
    EMERGENCY_FUND_TARGETS: Dict[str, int] = field(default_factory=lambda: {
        'genz': 3,         # 3 months expenses
        'millennial': 6,   # 6 months expenses  
        'midcareer': 9,    # 9 months expenses
        'retired': 12      # 12 months expenses
    })
    
    # Job market assumptions
    JOB_SEARCH_DURATION: Dict[str, float] = field(default_factory=lambda: {
        'genz': 3.5,       # 3.5 months average
        'millennial': 4.2,  # 4.2 months average
        'midcareer': 5.8,  # 5.8 months average
        'senior': 7.1      # 7.1 months average
    })
    
    # Income volatility by demographic
    INCOME_VOLATILITY: Dict[str, float] = field(default_factory=lambda: {
        'genz': 0.15,      # 15% income volatility
        'millennial': 0.10, # 10% income volatility
        'midcareer': 0.08,  # 8% income volatility
        'senior': 0.05     # 5% income volatility
    })
    
    # Expense growth rates
    EXPENSE_GROWTH_RATE: float = 0.025  # 2.5% annual expense growth
    HEALTHCARE_GROWTH_RATE: float = 0.055  # 5.5% healthcare cost growth
    EDUCATION_GROWTH_RATE: float = 0.045   # 4.5% education cost growth
    
    # Emergency expense parameters
    EMERGENCY_EXPENSE_PROBABILITY: float = 0.15  # 15% chance per year
    EMERGENCY_EXPENSE_SEVERITY_MIN: float = 0.5  # 0.5x monthly expenses
    EMERGENCY_EXPENSE_SEVERITY_MAX: float = 3.0  # 3x monthly expenses
    
    # Performance thresholds
    MAX_PROCESSING_TIME_MS: int = 5000  # Maximum 5 seconds per simulation
    MIN_ITERATIONS_FOR_CONFIDENCE: int = 1000  # Minimum for statistical validity
    
    # Tax parameters (2024 rates)
    FEDERAL_TAX_BRACKETS: Dict[str, List[tuple]] = field(default_factory=lambda: {
        'single': [
            (11600, 0.10),    # $0 - $11,600: 10%
            (47150, 0.12),    # $11,600 - $47,150: 12%
            (100525, 0.22),   # $47,150 - $100,525: 22%
            (191950, 0.24),   # $100,525 - $191,950: 24%
            (243725, 0.32),   # $191,950 - $243,725: 32%
            (609350, 0.35),   # $243,725 - $609,350: 35%
            (float('inf'), 0.37)  # $609,350+: 37%
        ],
        'married_joint': [
            (23200, 0.10),
            (94300, 0.12),
            (201050, 0.22),
            (383900, 0.24),
            (487450, 0.32),
            (731200, 0.35),
            (float('inf'), 0.37)
        ]
    })
    
    LTCG_TAX_BRACKETS: Dict[str, List[tuple]] = field(default_factory=lambda: {
        'single': [
            (47025, 0.0),     # $0 - $47,025: 0%
            (518900, 0.15),   # $47,025 - $518,900: 15%
            (float('inf'), 0.20)  # $518,900+: 20%
        ],
        'married_joint': [
            (94050, 0.0),
            (583750, 0.15),
            (float('inf'), 0.20)
        ]
    })
    
    STATE_TAX_RATES: Dict[str, float] = field(default_factory=lambda: {
        'CA': 0.133,  # 13.3% top rate
        'NY': 0.109,  # 10.9% top rate
        'TX': 0.0,    # No state income tax
        'FL': 0.0,    # No state income tax
        'WA': 0.0,    # No state income tax (has capital gains tax)
        'NV': 0.0,    # No state income tax
        'IL': 0.0495, # 4.95% flat rate
        'PA': 0.0307, # 3.07% flat rate
        'OH': 0.0399, # 3.99% top rate
        'NC': 0.0475, # 4.75% flat rate
        'MA': 0.05,   # 5% flat rate
        'CO': 0.044,  # 4.4% flat rate
        'AZ': 0.025,  # 2.5% flat rate
        'NJ': 0.1075, # 10.75% top rate
        'VA': 0.0575, # 5.75% top rate
        'DEFAULT': 0.05  # Default 5% for unknown states
    })
    
    # Federal poverty guidelines (2024, 48 contiguous states)
    FEDERAL_POVERTY_GUIDELINES: Dict[int, float] = field(default_factory=lambda: {
        1: 15060,
        2: 20440,
        3: 25820,
        4: 31200,
        5: 36580,
        6: 41960,
        7: 47340,
        8: 52720,
        # Additional person: $5,380
    })
    
    # Student loan specific parameters
    STUDENT_LOAN_PARAMS: Dict[str, Any] = field(default_factory=lambda: {
        'ibr_rate': 0.15,           # 15% of discretionary income
        'paye_rate': 0.10,          # 10% of discretionary income
        'repaye_rate': 0.10,        # 10% of discretionary income
        'icr_rate': 0.20,           # 20% of discretionary income
        'ibr_forgiveness_years': 25,
        'paye_forgiveness_years': 20,
        'repaye_undergrad_forgiveness_years': 20,
        'repaye_grad_forgiveness_years': 25,
        'pslf_payments': 120,       # 10 years of payments
        'discretionary_income_multiplier': 1.5,  # 150% of poverty line
        'interest_subsidy_rate': 0.5,  # REPAYE 50% unpaid interest subsidy
        'capitalization_events': ['annual_recert', 'exit_idr', 'forbearance_end'],
        'deferment_types': ['in_school', 'economic_hardship', 'unemployment'],
        'forbearance_interest_capitalize': True
    })
    
    # Refinancing parameters
    REFINANCING_PARAMS: Dict[str, Any] = field(default_factory=lambda: {
        'base_rates': {
            5: 0.0399,   # 5-year: 3.99% base
            7: 0.0449,   # 7-year: 4.49% base
            10: 0.0499,  # 10-year: 4.99% base
            15: 0.0599,  # 15-year: 5.99% base
            20: 0.0649   # 20-year: 6.49% base
        },
        'credit_score_adjustments': {
            'excellent': -0.0075,  # 750+ score
            'good': -0.0025,       # 700-749 score
            'fair': 0.005,         # 650-699 score
            'poor': 0.015          # <650 score
        },
        'income_adjustments': {
            'high': -0.0025,       # >$100k income
            'medium': 0,           # $50k-$100k
            'low': 0.005           # <$50k
        },
        'origination_fee_range': (0.005, 0.02),  # 0.5-2% fees
        'autopay_discount': 0.0025  # 0.25% rate reduction
    })
    
    # Emergency fund behavioral factors
    EMERGENCY_BEHAVIORAL_FACTORS: Dict[str, Dict[str, float]] = field(default_factory=lambda: {
        'expense_reduction': {  # How much expenses reduce during emergency
            'job_loss': 0.35,          # 35% reduction
            'medical_emergency': 0.15,  # 15% reduction
            'home_repair': 0.10,        # 10% reduction
            'auto_repair': 0.05,        # 5% reduction
            'family_crisis': 0.20,      # 20% reduction
            'natural_disaster': 0.40,   # 40% reduction
            'legal_expenses': 0.15      # 15% reduction
        },
        'emergency_probability': {  # Monthly probability
            'job_loss': 0.02,          # 2% monthly
            'medical_emergency': 0.015, # 1.5% monthly
            'home_repair': 0.01,        # 1% monthly
            'auto_repair': 0.008,       # 0.8% monthly
            'family_crisis': 0.005,     # 0.5% monthly
            'natural_disaster': 0.002,  # 0.2% monthly
            'legal_expenses': 0.003     # 0.3% monthly
        },
        'cost_multipliers': {  # Cost as multiple of monthly expenses
            'job_loss': (0, 0),         # No additional cost
            'medical_emergency': (2, 10),  # 2-10x monthly expenses
            'home_repair': (1, 5),      # 1-5x
            'auto_repair': (0.5, 2),    # 0.5-2x
            'family_crisis': (1, 3),    # 1-3x
            'natural_disaster': (5, 20), # 5-20x
            'legal_expenses': (2, 8)    # 2-8x
        }
    })
    
    # Account liquidity parameters
    ACCOUNT_LIQUIDITY: Dict[str, Dict[str, Any]] = field(default_factory=lambda: {
        'checking': {'days': 0, 'penalty': 0, 'tax_impact': 0},
        'savings': {'days': 1, 'penalty': 0, 'tax_impact': 0},
        'high_yield_savings': {'days': 1, 'penalty': 0, 'tax_impact': 0},
        'money_market': {'days': 1, 'penalty': 0, 'tax_impact': 0},
        'cd': {'days': 0, 'penalty': 0.03, 'tax_impact': 0.01},  # 3 months interest penalty
        'brokerage': {'days': 3, 'penalty': 0, 'tax_impact': 0.15},  # Capital gains
        'roth_ira': {'days': 5, 'penalty': 0.10, 'tax_impact': 0.22},  # Early withdrawal
        '401k': {'days': 7, 'penalty': 0.10, 'tax_impact': 0.32},  # Early withdrawal + tax
        'hsa': {'days': 3, 'penalty': 0.20, 'tax_impact': 0.22}  # Non-medical withdrawal
    })
    
    # Employer benefit parameters
    EMPLOYER_BENEFITS: Dict[str, Any] = field(default_factory=lambda: {
        '401k_match': {
            'typical_match': 0.50,     # 50% match
            'match_limit': 0.06,        # Up to 6% of salary
            'vesting_schedule': [0, 0.2, 0.4, 0.6, 0.8, 1.0]  # 5-year vesting
        },
        'fsa': {
            'max_contribution': 3200,   # 2024 limit
            'use_it_or_lose_it': True,
            'rollover_limit': 640       # Up to $640 can roll over
        },
        'hsa': {
            'individual_limit': 4150,   # 2024 limit
            'family_limit': 8300,
            'catchup_55': 1000,
            'employer_contribution_avg': 600
        },
        'student_loan_assistance': {
            'adoption_rate': 0.17,      # 17% of employers offer
            'typical_amount': 100,       # $100/month typical
            'max_annual': 5250          # Tax-free limit
        }
    })
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert configuration to dictionary for serialization."""
        return {
            'default_iterations': self.DEFAULT_ITERATIONS,
            'random_seed': self.RANDOM_SEED,
            'confidence_intervals': self.CONFIDENCE_INTERVALS,
            'market_assumptions': {
                'return_mean': self.MARKET_RETURN_MEAN,
                'return_std': self.MARKET_RETURN_STD,
                'inflation_mean': self.INFLATION_MEAN,
                'inflation_std': self.INFLATION_STD
            },
            'interest_rates': {
                'savings': self.SAVINGS_RATE,
                'student_loan': self.STUDENT_LOAN_RATE,
                'mortgage': self.MORTGAGE_RATE,
                'credit_card': self.CREDIT_CARD_RATE
            },
            'demographics': {
                'emergency_targets': self.EMERGENCY_FUND_TARGETS,
                'job_search_duration': self.JOB_SEARCH_DURATION,
                'income_volatility': self.INCOME_VOLATILITY
            },
            'tax_parameters': {
                'federal_brackets': self.FEDERAL_TAX_BRACKETS,
                'ltcg_brackets': self.LTCG_TAX_BRACKETS,
                'state_rates': self.STATE_TAX_RATES
            },
            'student_loan_params': self.STUDENT_LOAN_PARAMS,
            'refinancing_params': self.REFINANCING_PARAMS,
            'emergency_behavioral': self.EMERGENCY_BEHAVIORAL_FACTORS,
            'account_liquidity': self.ACCOUNT_LIQUIDITY,
            'employer_benefits': self.EMPLOYER_BENEFITS
        }


# Global configuration instance
config = SimulationConfig()