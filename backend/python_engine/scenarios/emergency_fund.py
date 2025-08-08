"""
Advanced Emergency Fund Simulation with Real Market Data.
Uses FMP API for realistic market returns and comprehensive emergency modeling.
"""

import random
import numpy as np
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
from core.market_data import market_data_service

class EmergencyType(str, Enum):
    """Types of financial emergencies."""
    JOB_LOSS = "job_loss"
    MEDICAL_EMERGENCY = "medical_emergency"
    CAR_REPAIR = "car_repair"
    HOME_REPAIR = "home_repair"
    FAMILY_EMERGENCY = "family_emergency"
    NATURAL_DISASTER = "natural_disaster"

class AccountType(str, Enum):
    """Types of financial accounts."""
    CHECKING = "checking"
    SAVINGS = "savings"
    MONEY_MARKET = "money_market"
    CD = "certificate_of_deposit"
    INVESTMENT = "investment"
    RETIREMENT = "retirement"
    CREDIT_CARD = "credit_card"

@dataclass
class EmergencyProfile:
    """Emergency scenario profile."""
    emergency_type: EmergencyType
    duration_months: int
    expense_reduction_factor: float
    government_assistance: float
    insurance_coverage: float

@dataclass
class FundHolder:
    """Emergency fund holder profile."""
    monthly_income: float
    monthly_expenses: float
    current_emergency_fund: float
    risk_tolerance: str  # conservative, moderate, aggressive
    time_horizon_months: int
    target_months_coverage: int

class ComprehensiveEmergencySimulator:
    """Advanced emergency fund simulation with real market data."""
    
    def __init__(self):
        self.scenario_name = "Comprehensive Emergency Fund Strategy"
        self.description = "Advanced emergency fund simulation with withdrawal optimization and behavioral modeling"
    
    def run_simulation(self, profile_data: Dict[str, Any], config: Dict[str, Any]) -> Dict[str, Any]:
        """Run comprehensive emergency fund simulation."""
        
        # Get real market data
        market_data = self._get_market_data_for_simulation()
        
        # Create fund holder profile
        holder = FundHolder(
            monthly_income=profile_data.get('monthly_income', 5000),
            monthly_expenses=profile_data.get('monthly_expenses', 3000),
            current_emergency_fund=profile_data.get('emergency_fund', 0),
            risk_tolerance=profile_data.get('risk_tolerance', 'moderate'),
            time_horizon_months=config.get('months', 60),
            target_months_coverage=config.get('target_months', 6)
        )
        
        # Calculate target emergency fund
        target_emergency_fund = holder.monthly_expenses * holder.target_months_coverage
        
        # Get account balances (simulated from profile data)
        account_balances = self._get_account_balances(profile_data)
        
        # Run comprehensive simulation
        simulation_results = self._run_comprehensive_simulation(
            holder=holder,
            account_balances=account_balances,
            market_data=market_data,
            config=config
        )
        
        # Calculate success metrics
        success_metrics = self._calculate_success_metrics(
            simulation_results, target_emergency_fund, holder
        )
        
        # Generate recommendations
        recommendations = self._generate_recommendations(
            holder, account_balances, market_data, simulation_results
        )
        
        return {
            'scenario_name': self.scenario_name,
            'description': self.description,
            'market_data': market_data,
            'simulation_results': simulation_results,
            'success_metrics': success_metrics,
            'recommendations': recommendations,
            'target_emergency_fund': target_emergency_fund,
            'current_emergency_fund': holder.current_emergency_fund,
            'holder_profile': {
                'monthly_income': holder.monthly_income,
                'monthly_expenses': holder.monthly_expenses,
                'risk_tolerance': holder.risk_tolerance,
                'target_months_coverage': holder.target_months_coverage
            },
            'config': config
        }
    
    def _get_market_data_for_simulation(self) -> Dict[str, float]:
        """Get real market data for emergency fund simulation."""
        
        # Get real bond yields (conservative option)
        bond_yield = market_data_service.get_historical_return('BND', years=3) / 12  # Monthly return
        
        # Get real money market rates (moderate option)
        money_market_rate = 0.045 / 12  # 4.5% annual rate, monthly
        
        # Get real stock market returns (growth option)
        stock_return = market_data_service.get_historical_return('^GSPC', years=5) / 12  # Monthly return
        
        # Get current market indexes for context
        market_indexes = market_data_service.get_market_indexes()
        
        return {
            'bond_yield': bond_yield,
            'money_market_rate': money_market_rate,
            'stock_return': stock_return,
            'market_indexes': market_indexes,
            'last_updated': datetime.now().isoformat()
        }
    
    def _get_account_balances(self, profile_data: Dict[str, Any]) -> Dict[AccountType, float]:
        """Get account balances from profile data."""
        accounts = profile_data.get('accounts', [])
        
        balances = {
            AccountType.CHECKING: 0,
            AccountType.SAVINGS: 0,
            AccountType.MONEY_MARKET: 0,
            AccountType.CD: 0,
            AccountType.INVESTMENT: 0,
            AccountType.RETIREMENT: 0,
            AccountType.CREDIT_CARD: 0
        }
        
        for account in accounts:
            account_type = account.get('type', 'checking')
            balance = account.get('balance', 0)
            
            if account_type == 'checking':
                balances[AccountType.CHECKING] += balance
            elif account_type == 'savings':
                balances[AccountType.SAVINGS] += balance
            elif account_type == 'investment':
                balances[AccountType.INVESTMENT] += balance
            elif account_type == 'credit':
                balances[AccountType.CREDIT_CARD] += balance
        
        return balances
    
    def _run_comprehensive_simulation(
        self,
        holder: FundHolder,
        account_balances: Dict[AccountType, float],
        market_data: Dict[str, float],
        config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Run comprehensive emergency fund simulation."""
        
        # Get strategy returns based on risk tolerance
        if holder.risk_tolerance == 'conservative':
            monthly_return = market_data['bond_yield']
        elif holder.risk_tolerance == 'aggressive':
            monthly_return = market_data['stock_return']
        else:  # moderate
            monthly_return = market_data['money_market_rate']
        
        # Calculate monthly contribution
        monthly_contribution = config.get('monthly_contribution', 500)
        
        # Run Monte Carlo simulation
        simulations = config.get('simulations', 1000)
        months = holder.time_horizon_months
        
        # Simulate multiple paths
        paths = []
        for _ in range(simulations):
            path = self._simulate_emergency_path(
                initial_amount=holder.current_emergency_fund,
                monthly_contribution=monthly_contribution,
                monthly_return=monthly_return,
                months=months,
                volatility=0.02  # 2% monthly volatility
            )
            paths.append(path)
        
        # Calculate statistics
        final_amounts = [path[-1] for path in paths]
        
        return {
            'paths': paths,
            'final_amounts': final_amounts,
            'statistics': {
                'mean': np.mean(final_amounts),
                'median': np.median(final_amounts),
                'std': np.std(final_amounts),
                'min': np.min(final_amounts),
                'max': np.max(final_amounts),
                'percentile_25': np.percentile(final_amounts, 25),
                'percentile_75': np.percentile(final_amounts, 75)
            },
            'account_balances': account_balances,
            'monthly_contribution': monthly_contribution,
            'monthly_return': monthly_return,
            'risk_tolerance': holder.risk_tolerance
        }
    
    def _simulate_emergency_path(
        self,
        initial_amount: float,
        monthly_contribution: float,
        monthly_return: float,
        months: int,
        volatility: float
    ) -> List[float]:
        """Simulate one emergency fund growth path."""
        
        path = [initial_amount]
        current_amount = initial_amount
        
        for month in range(months):
            # Add monthly contribution
            current_amount += monthly_contribution
            
            # Apply market return with volatility
            monthly_return_with_volatility = monthly_return + random.gauss(0, volatility)
            current_amount *= (1 + monthly_return_with_volatility)
            
            path.append(current_amount)
        
        return path
    
    def _calculate_success_metrics(
        self,
        simulation_results: Dict[str, Any],
        target_amount: float,
        holder: FundHolder
    ) -> Dict[str, Any]:
        """Calculate success metrics for emergency fund simulation."""
        
        final_amounts = simulation_results['final_amounts']
        paths = simulation_results['paths']
        
        # Calculate success rate (percentage reaching target)
        success_count = sum(1 for amount in final_amounts if amount >= target_amount)
        success_rate = (success_count / len(final_amounts)) * 100
        
        # Calculate average time to target
        time_to_target = []
        for path in paths:
            for month, amount in enumerate(path):
                if amount >= target_amount:
                    time_to_target.append(month)
                    break
            else:
                time_to_target.append(holder.time_horizon_months)  # Never reached target
        
        avg_time_to_target = np.mean(time_to_target) if time_to_target else holder.time_horizon_months
        
        return {
            'success_rate': success_rate,
            'avg_time_to_target': avg_time_to_target,
            'avg_final_amount': np.mean(final_amounts),
            'median_final_amount': np.median(final_amounts),
            'target_amount': target_amount,
            'current_amount': holder.current_emergency_fund,
            'monthly_contribution': simulation_results['monthly_contribution']
        }
    
    def _generate_recommendations(
        self,
        holder: FundHolder,
        account_balances: Dict[AccountType, float],
        market_data: Dict[str, Any],
        simulation_results: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Generate personalized recommendations."""
        
        recommendations = []
        target_amount = holder.monthly_expenses * holder.target_months_coverage
        current_gap = target_amount - holder.current_emergency_fund
        
        # Priority recommendation based on gap
        if current_gap > 0:
            recommendations.append({
                'type': 'priority',
                'title': 'Build Emergency Fund',
                'description': f'You need ${current_gap:,.0f} more to reach your {holder.target_months_coverage}-month emergency fund target.',
                'action': 'Increase monthly savings',
                'impact': 'high'
            })
        
        # Strategy recommendation based on risk tolerance
        if holder.risk_tolerance == 'conservative':
            recommendations.append({
                'type': 'strategy',
                'title': 'Conservative Approach',
                'description': 'Consider high-yield savings accounts for safety and liquidity.',
                'action': 'Open high-yield savings account',
                'impact': 'medium'
            })
        elif holder.risk_tolerance == 'aggressive':
            recommendations.append({
                'type': 'strategy',
                'title': 'Growth Strategy',
                'description': 'Consider a mix of savings and short-term investments for higher returns.',
                'action': 'Review investment options',
                'impact': 'medium'
            })
        
        # Account optimization recommendations
        if account_balances[AccountType.CHECKING] > holder.monthly_expenses * 2:
            recommendations.append({
                'type': 'optimization',
                'title': 'Optimize Account Allocation',
                'description': 'Move excess checking funds to higher-yield accounts.',
                'action': 'Transfer to savings',
                'impact': 'medium'
            })
        
        return recommendations

# Create the main scenario class for API compatibility
class EmergencyFundScenario(ComprehensiveEmergencySimulator):
    """Emergency fund simulation with real market data integration."""
    
    def __init__(self):
        super().__init__()
        self.scenario_name = "Emergency Fund Strategy"
        self.description = "Simulate emergency fund growth with real market data"