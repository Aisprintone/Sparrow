"""
Advanced Student Loan Simulation with Real Market Data.
Uses FMP API for realistic investment returns and comprehensive loan modeling.
"""

import random
import numpy as np
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
from core.market_data import market_data_service

class LoanType(str, Enum):
    """Types of student loans."""
    FEDERAL_SUBSIDIZED = "federal_subsidized"
    FEDERAL_UNSUBSIDIZED = "federal_unsubsidized"
    FEDERAL_PLUS = "federal_plus"
    PRIVATE = "private"
    REFINANCED = "refinanced"

class RepaymentPlan(str, Enum):
    """Student loan repayment plans."""
    STANDARD = "standard"
    INCOME_DRIVEN = "income_driven"
    GRADUATED = "graduated"
    EXTENDED = "extended"
    CONSOLIDATED = "consolidated"

@dataclass
class LoanProfile:
    """Student loan profile."""
    loan_type: LoanType
    interest_rate: float
    balance: float
    monthly_payment: float
    repayment_plan: RepaymentPlan
    remaining_term_months: int

@dataclass
class BorrowerProfile:
    """Student loan borrower profile."""
    monthly_income: float
    monthly_expenses: float
    available_for_loan_payment: float
    risk_tolerance: str  # conservative, moderate, aggressive
    time_horizon_years: int
    target_payoff_years: int

class ComprehensiveStudentLoanSimulator:
    """Advanced student loan simulation with real market data."""
    
    def __init__(self):
        self.scenario_name = "Comprehensive Student Loan Strategy"
        self.description = "Advanced student loan simulation with payoff vs. investment analysis"
    
    def run_simulation(self, profile_data: Dict[str, Any], config: Dict[str, Any]) -> Dict[str, Any]:
        """Run comprehensive student loan simulation."""
        
        # Get real market data
        market_data = self._get_market_data_for_simulation()
        
        # Create borrower profile
        borrower = BorrowerProfile(
            monthly_income=profile_data.get('monthly_income', 5000),
            monthly_expenses=profile_data.get('monthly_expenses', 3000),
            available_for_loan_payment=profile_data.get('available_for_loan_payment', 500),
            risk_tolerance=profile_data.get('risk_tolerance', 'moderate'),
            time_horizon_years=config.get('years', 10),
            target_payoff_years=config.get('target_payoff_years', 5)
        )
        
        # Get loan profiles from profile data
        loan_profiles = self._get_loan_profiles(profile_data)
        
        # Run comprehensive simulation
        simulation_results = self._run_comprehensive_simulation(
            borrower=borrower,
            loan_profiles=loan_profiles,
            market_data=market_data,
            config=config
        )
        
        # Calculate comparison metrics
        comparison_metrics = self._calculate_comparison_metrics(
            simulation_results, borrower, loan_profiles
        )
        
        # Generate recommendations
        recommendations = self._generate_recommendations(
            borrower, loan_profiles, market_data, simulation_results
        )
        
        return {
            'scenario_name': self.scenario_name,
            'description': self.description,
            'market_data': market_data,
            'simulation_results': simulation_results,
            'comparison_metrics': comparison_metrics,
            'recommendations': recommendations,
            'borrower_profile': {
                'monthly_income': borrower.monthly_income,
                'monthly_expenses': borrower.monthly_expenses,
                'available_for_loan_payment': borrower.available_for_loan_payment,
                'risk_tolerance': borrower.risk_tolerance,
                'target_payoff_years': borrower.target_payoff_years
            },
            'loan_profiles': [loan.__dict__ for loan in loan_profiles],
            'config': config
        }
    
    def _get_market_data_for_simulation(self) -> Dict[str, float]:
        """Get real market data for student loan simulation."""
        
        # Get real investment returns
        investment_return = market_data_service.get_historical_return('^GSPC', years=5) / 12  # Monthly return
        bond_return = market_data_service.get_historical_return('BND', years=3) / 12  # Monthly return
        
        # Get current market indexes for context
        market_indexes = market_data_service.get_market_indexes()
        
        return {
            'investment_return': investment_return,
            'bond_return': bond_return,
            'market_indexes': market_indexes,
            'last_updated': datetime.now().isoformat()
        }
    
    def _get_loan_profiles(self, profile_data: Dict[str, Any]) -> List[LoanProfile]:
        """Get loan profiles from profile data."""
        loans = profile_data.get('loans', [])
        
        if not loans:
            # Create default loan profile
            return [LoanProfile(
                loan_type=LoanType.FEDERAL_UNSUBSIDIZED,
                interest_rate=0.055,  # 5.5% federal rate
                balance=profile_data.get('student_loan_balance', 50000),
                monthly_payment=profile_data.get('monthly_payment', 500),
                repayment_plan=RepaymentPlan.STANDARD,
                remaining_term_months=120  # 10 years
            )]
        
        loan_profiles = []
        for loan in loans:
            loan_profiles.append(LoanProfile(
                loan_type=LoanType(loan.get('type', 'federal_unsubsidized')),
                interest_rate=loan.get('interest_rate', 0.055),
                balance=loan.get('balance', 0),
                monthly_payment=loan.get('monthly_payment', 0),
                repayment_plan=RepaymentPlan(loan.get('repayment_plan', 'standard')),
                remaining_term_months=loan.get('remaining_term_months', 120)
            ))
        
        return loan_profiles
    
    def _run_comprehensive_simulation(
        self,
        borrower: BorrowerProfile,
        loan_profiles: List[LoanProfile],
        market_data: Dict[str, float],
        config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Run comprehensive student loan simulation."""
        
        # Get strategy returns based on risk tolerance
        if borrower.risk_tolerance == 'conservative':
            monthly_return = market_data['bond_return']
        elif borrower.risk_tolerance == 'aggressive':
            monthly_return = market_data['investment_return']
        else:  # moderate
            monthly_return = (market_data['bond_return'] + market_data['investment_return']) / 2
        
        # Calculate total loan balance and monthly payment
        total_loan_balance = sum(loan.balance for loan in loan_profiles)
        total_monthly_payment = sum(loan.monthly_payment for loan in loan_profiles)
        
        # Run Monte Carlo simulation
        simulations = config.get('simulations', 1000)
        months = borrower.time_horizon_years * 12
        
        # Simulate aggressive payoff strategy
        payoff_paths = []
        for _ in range(simulations):
            path = self._simulate_repayment_strategy(
                loan_profiles=loan_profiles,
                monthly_payment=borrower.available_for_loan_payment,
                months=months
            )
            payoff_paths.append(path)
        
        # Simulate investment strategy
        investment_paths = []
        for _ in range(simulations):
            path = self._simulate_investment_strategy(
                initial_amount=total_loan_balance,
                monthly_contribution=borrower.available_for_loan_payment - total_monthly_payment,
                monthly_return=monthly_return,
                months=months,
                volatility=0.03  # 3% monthly volatility
            )
            investment_paths.append(path)
        
        return {
            'payoff_paths': payoff_paths,
            'investment_paths': investment_paths,
            'payoff_statistics': self._calculate_path_statistics(payoff_paths),
            'investment_statistics': self._calculate_path_statistics(investment_paths),
            'total_loan_balance': total_loan_balance,
            'total_monthly_payment': total_monthly_payment,
            'monthly_return': monthly_return,
            'risk_tolerance': borrower.risk_tolerance
        }
    
    def _simulate_repayment_strategy(
        self,
        loan_profiles: List[LoanProfile],
        monthly_payment: float,
        months: int
    ) -> List[Dict[str, Any]]:
        """Simulate aggressive loan repayment strategy."""
        
        # Sort loans by interest rate (highest first for avalanche method)
        sorted_loans = sorted(loan_profiles, key=lambda x: x.interest_rate, reverse=True)
        
        path = []
        remaining_payment = monthly_payment
        
        for month in range(months):
            month_data = {
                'month': month,
                'total_balance': 0,
                'total_interest_paid': 0,
                'total_principal_paid': 0,
                'loans': []
            }
            
            # Pay minimum payments first
            for loan in sorted_loans:
                if loan.balance <= 0:
                    continue
                
                # Calculate interest for this month
                monthly_interest = loan.balance * (loan.interest_rate / 12)
                month_data['total_interest_paid'] += monthly_interest
                
                # Apply minimum payment
                principal_payment = max(0, loan.monthly_payment - monthly_interest)
                loan.balance = max(0, loan.balance - principal_payment)
                month_data['total_principal_paid'] += principal_payment
                
                month_data['loans'].append({
                    'balance': loan.balance,
                    'interest_paid': monthly_interest,
                    'principal_paid': principal_payment
                })
            
            # Apply remaining payment to highest interest loan
            if remaining_payment > 0:
                for loan in sorted_loans:
                    if loan.balance > 0 and remaining_payment > 0:
                        extra_payment = min(remaining_payment, loan.balance)
                        loan.balance -= extra_payment
                        month_data['total_principal_paid'] += extra_payment
                        remaining_payment -= extra_payment
            
            month_data['total_balance'] = sum(loan.balance for loan in sorted_loans)
            path.append(month_data)
            
            # If all loans are paid off, break
            if month_data['total_balance'] <= 0:
                break
        
        return path
    
    def _simulate_investment_strategy(
        self,
        initial_amount: float,
        monthly_contribution: float,
        monthly_return: float,
        months: int,
        volatility: float
    ) -> List[Dict[str, Any]]:
        """Simulate investment strategy while paying minimum loan payments."""
        
        path = []
        investment_balance = 0
        
        for month in range(months):
            # Add monthly contribution
            investment_balance += monthly_contribution
            
            # Apply market return with volatility
            monthly_return_with_volatility = monthly_return + random.gauss(0, volatility)
            investment_balance *= (1 + monthly_return_with_volatility)
            
            path.append({
                'month': month,
                'investment_balance': investment_balance,
                'monthly_contribution': monthly_contribution,
                'return_rate': monthly_return_with_volatility
            })
        
        return path
    
    def _calculate_path_statistics(self, paths: List[List[Dict[str, Any]]]) -> Dict[str, Any]:
        """Calculate statistics for simulation paths."""
        
        if not paths:
            return {}
        
        # Get final values from each path
        final_values = []
        for path in paths:
            if path:
                final_values.append(path[-1])
        
        if not final_values:
            return {}
        
        # Extract relevant metrics
        if 'total_balance' in final_values[0]:  # Payoff paths
            final_balances = [v.get('total_balance', 0) for v in final_values]
            final_interest_paid = [v.get('total_interest_paid', 0) for v in final_values]
            
            return {
                'final_balances': final_balances,
                'final_interest_paid': final_interest_paid,
                'statistics': {
                    'mean_final_balance': np.mean(final_balances),
                    'median_final_balance': np.median(final_balances),
                    'mean_interest_paid': np.mean(final_interest_paid),
                    'median_interest_paid': np.median(final_interest_paid)
                }
            }
        else:  # Investment paths
            final_balances = [v.get('investment_balance', 0) for v in final_values]
            
            return {
                'final_balances': final_balances,
                'statistics': {
                    'mean_final_balance': np.mean(final_balances),
                    'median_final_balance': np.median(final_balances),
                    'std_final_balance': np.std(final_balances)
                }
            }
    
    def _calculate_comparison_metrics(
        self,
        simulation_results: Dict[str, Any],
        borrower: BorrowerProfile,
        loan_profiles: List[LoanProfile]
    ) -> Dict[str, Any]:
        """Calculate comparison metrics between payoff and investment strategies."""
        
        payoff_stats = simulation_results['payoff_statistics']
        investment_stats = simulation_results['investment_statistics']
        
        total_loan_balance = simulation_results['total_loan_balance']
        
        # Calculate payoff time for each strategy
        payoff_times = []
        for path in simulation_results['payoff_paths']:
            for month, data in enumerate(path):
                if data.get('total_balance', 0) <= 0:
                    payoff_times.append(month)
                    break
            else:
                payoff_times.append(borrower.time_horizon_years * 12)
        
        avg_payoff_time = np.mean(payoff_times) if payoff_times else borrower.time_horizon_years * 12
        
        # Calculate investment growth potential
        mean_investment_final = investment_stats.get('statistics', {}).get('mean_final_balance', 0)
        investment_growth = mean_investment_final - total_loan_balance
        
        # Calculate break-even analysis
        mean_payoff_interest = payoff_stats.get('statistics', {}).get('mean_interest_paid', 0)
        investment_advantage = investment_growth - mean_payoff_interest
        
        return {
            'avg_payoff_time_months': avg_payoff_time,
            'avg_payoff_time_years': avg_payoff_time / 12,
            'mean_investment_growth': investment_growth,
            'mean_payoff_interest': mean_payoff_interest,
            'investment_advantage': investment_advantage,
            'recommended_strategy': 'investment' if investment_advantage > 0 else 'payoff',
            'break_even_months': self._calculate_break_even(
                payoff_stats, investment_stats, total_loan_balance
            )
        }
    
    def _calculate_break_even(
        self,
        payoff_stats: Dict[str, Any],
        investment_stats: Dict[str, Any],
        total_loan_balance: float
    ) -> float:
        """Calculate break-even point between strategies."""
        
        mean_payoff_interest = payoff_stats.get('statistics', {}).get('mean_interest_paid', 0)
        mean_investment_final = investment_stats.get('statistics', {}).get('mean_final_balance', 0)
        
        if mean_investment_final <= total_loan_balance:
            return float('inf')  # Investment never catches up
        
        # Simplified break-even calculation
        investment_growth = mean_investment_final - total_loan_balance
        if investment_growth > mean_payoff_interest:
            return 0  # Investment is immediately better
        else:
            # Estimate months to break-even
            monthly_investment_growth = investment_growth / (10 * 12)  # Assume 10 years
            monthly_interest_cost = mean_payoff_interest / (10 * 12)
            
            if monthly_investment_growth > monthly_interest_cost:
                return (mean_payoff_interest - investment_growth) / (monthly_investment_growth - monthly_interest_cost)
            else:
                return float('inf')
    
    def _generate_recommendations(
        self,
        borrower: BorrowerProfile,
        loan_profiles: List[LoanProfile],
        market_data: Dict[str, Any],
        simulation_results: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Generate personalized recommendations."""
        
        recommendations = []
        comparison_metrics = simulation_results.get('comparison_metrics', {})
        
        # Strategy recommendation
        recommended_strategy = comparison_metrics.get('recommended_strategy', 'payoff')
        
        if recommended_strategy == 'investment':
            recommendations.append({
                'type': 'strategy',
                'title': 'Invest Instead of Paying Off',
                'description': f'Investing your extra ${borrower.available_for_loan_payment - simulation_results["total_monthly_payment"]:,.0f}/month could yield ${comparison_metrics.get("investment_advantage", 0):,.0f} more than paying off loans.',
                'action': 'Continue minimum payments and invest extra',
                'impact': 'high'
            })
        else:
            recommendations.append({
                'type': 'strategy',
                'title': 'Pay Off High-Interest Loans',
                'description': f'Paying off loans saves ${abs(comparison_metrics.get("investment_advantage", 0)):,.0f} in interest compared to investing.',
                'action': 'Increase loan payments',
                'impact': 'high'
            })
        
        # Loan-specific recommendations
        high_interest_loans = [loan for loan in loan_profiles if loan.interest_rate > 0.06]
        if high_interest_loans:
            recommendations.append({
                'type': 'priority',
                'title': 'Refinance High-Interest Loans',
                'description': f'Consider refinancing {len(high_interest_loans)} loans with rates above 6%.',
                'action': 'Research refinancing options',
                'impact': 'medium'
            })
        
        # Income-based recommendations
        if borrower.monthly_income > 8000:
            recommendations.append({
                'type': 'opportunity',
                'title': 'Income-Driven Repayment',
                'description': 'Consider income-driven repayment plans to free up cash for investments.',
                'action': 'Apply for income-driven repayment',
                'impact': 'medium'
            })
        
        return recommendations

# Create the main scenario class for API compatibility
class StudentLoanScenario(ComprehensiveStudentLoanSimulator):
    """Student loan simulation with real market data integration."""
    
    def __init__(self):
        super().__init__()
        self.scenario_name = "Student Loan Strategy"
        self.description = "Simulate student loan payoff vs. investment strategies"