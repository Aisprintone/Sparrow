"""
Advanced Market Crash Simulation with Real Market Data.
Uses FMP API for realistic market crash modeling and portfolio stress testing.
"""

import random
import numpy as np
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
from core.market_data import market_data_service

class AssetClass(str, Enum):
    """Types of asset classes."""
    STOCKS = "stocks"
    BONDS = "bonds"
    REAL_ESTATE = "real_estate"
    CASH = "cash"
    COMMODITIES = "commodities"
    CRYPTO = "crypto"
    INTERNATIONAL = "international"

class CrashSeverity(str, Enum):
    """Market crash severity levels."""
    MILD = "mild"      # 10-20% decline
    MODERATE = "moderate"  # 20-35% decline
    SEVERE = "severe"   # 35-50% decline
    CRITICAL = "critical"  # 50%+ decline

@dataclass
class PortfolioAsset:
    """Portfolio asset profile."""
    asset_class: AssetClass
    symbol: str
    allocation_percentage: float
    current_value: float
    volatility: float
    correlation_with_market: float
    beta: float

@dataclass
class InvestorProfile:
    """Investor profile for market crash simulation."""
    age: int
    risk_tolerance: str  # conservative, moderate, aggressive
    investment_horizon_years: int
    monthly_contribution: float
    emergency_fund_months: int
    portfolio_assets: List[PortfolioAsset]
    debt_to_income_ratio: float
    job_stability_score: float

class ComprehensiveMarketCrashSimulator:
    """Advanced market crash simulation with real market data."""
    
    def __init__(self):
        self.scenario_name = "Comprehensive Market Crash Strategy"
        self.description = "Advanced market crash simulation with portfolio stress testing and correlation modeling"
        
        # Market data service
        self.market_data = market_data_service
        
        # Historical crash data (real market events)
        self.historical_crashes = {
            '2008_financial_crisis': {
                'duration_months': 17,
                'max_decline': -56.8,
                'recovery_months': 48,
                'asset_correlations': {
                    'stocks': -0.95,
                    'bonds': 0.15,
                    'real_estate': -0.85,
                    'cash': 0.05,
                    'commodities': -0.60,
                    'international': -0.90
                }
            },
            '2020_covid_crash': {
                'duration_months': 2,
                'max_decline': -33.9,
                'recovery_months': 5,
                'asset_correlations': {
                    'stocks': -0.98,
                    'bonds': 0.25,
                    'real_estate': -0.70,
                    'cash': 0.02,
                    'commodities': -0.80,
                    'international': -0.95
                }
            },
            '2000_dot_com_bubble': {
                'duration_months': 31,
                'max_decline': -49.1,
                'recovery_months': 84,
                'asset_correlations': {
                    'stocks': -0.92,
                    'bonds': 0.10,
                    'real_estate': -0.30,
                    'cash': 0.03,
                    'commodities': -0.40,
                    'international': -0.85
                }
            }
        }
    
    def run_simulation(self, profile_data: Dict[str, Any], config: Dict[str, Any]) -> Dict[str, Any]:
        """Run comprehensive market crash simulation."""
        
        # Get real market data
        market_data = self._get_market_data_for_simulation()
        
        # Create investor profile
        investor = self._create_investor_profile(profile_data)
        
        # Generate crash scenarios
        crash_scenarios = self._generate_crash_scenarios(investor, market_data)
        
        # Run comprehensive simulation
        simulation_results = self._run_comprehensive_simulation(
            investor=investor,
            crash_scenarios=crash_scenarios,
            market_data=market_data,
            config=config
        )
        
        # Calculate portfolio resilience metrics
        resilience_metrics = self._calculate_resilience_metrics(
            simulation_results, investor, crash_scenarios
        )
        
        # Generate recommendations
        recommendations = self._generate_recommendations(
            investor, crash_scenarios, market_data, simulation_results
        )
        
        return {
            'scenario_name': self.scenario_name,
            'description': self.description,
            'market_data': market_data,
            'simulation_results': simulation_results,
            'resilience_metrics': resilience_metrics,
            'recommendations': recommendations,
            'investor_profile': investor,
            'crash_scenarios': crash_scenarios
        }
    
    def _get_market_data_for_simulation(self) -> Dict[str, Any]:
        """Get real market data from APIs."""
        try:
            # Get current market data
            current_data = {
                'sp500_price': self.market_data.get_stock_price('^GSPC') or 4500,
                'nasdaq_price': self.market_data.get_stock_price('^IXIC') or 14000,
                'dow_price': self.market_data.get_stock_price('^DJI') or 35000,
                'vix': self.market_data.get_stock_price('^VIX') or 20,
                'gold_price': self.market_data.get_stock_price('GLD') or 180,
                'bond_yield': 4.5,  # 10-year Treasury yield
            }
            
            # Calculate market volatility
            market_volatility = self._calculate_market_volatility()
            
            # Get asset class correlations
            asset_correlations = self._get_asset_correlations()
            
            return {
                'current_data': current_data,
                'market_volatility': market_volatility,
                'asset_correlations': asset_correlations,
                'historical_crashes': self.historical_crashes
            }
        except Exception as e:
            # Fallback to conservative estimates
            return self._get_fallback_market_data()
    
    def _get_fallback_market_data(self) -> Dict[str, Any]:
        """Fallback market data when APIs are unavailable."""
        return {
            'current_data': {
                'sp500_price': 4500,
                'nasdaq_price': 14000,
                'dow_price': 35000,
                'vix': 20,
                'gold_price': 180,
                'bond_yield': 4.5,
            },
            'market_volatility': 0.15,
            'asset_correlations': {
                'stocks': {'bonds': -0.3, 'real_estate': 0.6, 'cash': 0.0, 'commodities': 0.2, 'international': 0.8},
                'bonds': {'stocks': -0.3, 'real_estate': -0.2, 'cash': 0.1, 'commodities': -0.1, 'international': -0.2},
                'real_estate': {'stocks': 0.6, 'bonds': -0.2, 'cash': 0.0, 'commodities': 0.1, 'international': 0.4},
                'cash': {'stocks': 0.0, 'bonds': 0.1, 'real_estate': 0.0, 'commodities': 0.0, 'international': 0.0},
                'commodities': {'stocks': 0.2, 'bonds': -0.1, 'real_estate': 0.1, 'cash': 0.0, 'international': 0.3},
                'international': {'stocks': 0.8, 'bonds': -0.2, 'real_estate': 0.4, 'cash': 0.0, 'commodities': 0.3},
            },
            'historical_crashes': self.historical_crashes
        }
    
    def _calculate_market_volatility(self) -> float:
        """Calculate current market volatility."""
        try:
            # In a real implementation, this would calculate actual volatility
            # For now, using a reasonable estimate
            return 0.15
        except:
            return 0.15
    
    def _get_asset_correlations(self) -> Dict[str, Dict[str, float]]:
        """Get asset class correlations."""
        return {
            'stocks': {'bonds': -0.3, 'real_estate': 0.6, 'cash': 0.0, 'commodities': 0.2, 'international': 0.8},
            'bonds': {'stocks': -0.3, 'real_estate': -0.2, 'cash': 0.1, 'commodities': -0.1, 'international': -0.2},
            'real_estate': {'stocks': 0.6, 'bonds': -0.2, 'cash': 0.0, 'commodities': 0.1, 'international': 0.4},
            'cash': {'stocks': 0.0, 'bonds': 0.1, 'real_estate': 0.0, 'commodities': 0.0, 'international': 0.0},
            'commodities': {'stocks': 0.2, 'bonds': -0.1, 'real_estate': 0.1, 'cash': 0.0, 'international': 0.3},
            'international': {'stocks': 0.8, 'bonds': -0.2, 'real_estate': 0.4, 'cash': 0.0, 'commodities': 0.3},
        }
    
    def _create_investor_profile(self, profile_data: Dict[str, Any]) -> InvestorProfile:
        """Create investor profile from user data."""
        
        # Create portfolio assets
        portfolio_assets = []
        
        for asset_data in profile_data.get('portfolio_assets', []):
            portfolio_assets.append(PortfolioAsset(
                asset_class=AssetClass(asset_data.get('asset_class', 'stocks')),
                symbol=asset_data.get('symbol', 'SPY'),
                allocation_percentage=asset_data.get('allocation_percentage', 60),
                current_value=asset_data.get('current_value', 100000),
                volatility=asset_data.get('volatility', 0.15),
                correlation_with_market=asset_data.get('correlation_with_market', 0.8),
                beta=asset_data.get('beta', 1.0)
            ))
        
        return InvestorProfile(
            age=profile_data.get('age', 35),
            risk_tolerance=profile_data.get('risk_tolerance', 'moderate'),
            investment_horizon_years=profile_data.get('investment_horizon_years', 20),
            monthly_contribution=profile_data.get('monthly_contribution', 1000),
            emergency_fund_months=profile_data.get('emergency_fund_months', 6),
            portfolio_assets=portfolio_assets,
            debt_to_income_ratio=profile_data.get('debt_to_income_ratio', 0.3),
            job_stability_score=profile_data.get('job_stability_score', 0.8)
        )
    
    def _generate_crash_scenarios(self, investor: InvestorProfile, market_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate realistic market crash scenarios."""
        scenarios = []
        
        # Use historical crash data as templates
        for crash_name, crash_data in market_data['historical_crashes'].items():
            # Adjust severity based on current market conditions
            current_volatility = market_data['market_volatility']
            severity_multiplier = current_volatility / 0.15  # Normalize to historical average
            
            adjusted_decline = crash_data['max_decline'] * severity_multiplier
            adjusted_duration = crash_data['duration_months']
            adjusted_recovery = crash_data['recovery_months']
            
            scenarios.append({
                'name': crash_name.replace('_', ' ').title(),
                'max_decline_percentage': adjusted_decline,
                'duration_months': adjusted_duration,
                'recovery_months': adjusted_recovery,
                'asset_correlations': crash_data['asset_correlations'],
                'probability': self._calculate_crash_probability(adjusted_decline, current_volatility),
                'severity': self._classify_crash_severity(adjusted_decline)
            })
        
        # Add synthetic scenarios for different market conditions
        scenarios.extend(self._generate_synthetic_scenarios(market_data))
        
        return scenarios
    
    def _calculate_crash_probability(self, decline_percentage: float, volatility: float) -> float:
        """Calculate probability of a crash scenario."""
        # Higher volatility and larger declines have lower probability
        base_probability = 0.05  # 5% base probability
        volatility_factor = 1 - (volatility - 0.15) * 2  # Reduce probability with higher volatility
        decline_factor = 1 - abs(decline_percentage) / 100  # Reduce probability with larger declines
        
        return max(0.01, min(0.20, base_probability * volatility_factor * decline_factor))
    
    def _classify_crash_severity(self, decline_percentage: float) -> CrashSeverity:
        """Classify crash severity based on decline percentage."""
        if abs(decline_percentage) < 20:
            return CrashSeverity.MILD
        elif abs(decline_percentage) < 35:
            return CrashSeverity.MODERATE
        elif abs(decline_percentage) < 50:
            return CrashSeverity.SEVERE
        else:
            return CrashSeverity.CRITICAL
    
    def _generate_synthetic_scenarios(self, market_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate synthetic crash scenarios for different market conditions."""
        scenarios = []
        
        # Mild correction scenario
        scenarios.append({
            'name': 'Mild Market Correction',
            'max_decline_percentage': -15,
            'duration_months': 3,
            'recovery_months': 6,
            'asset_correlations': market_data['asset_correlations'],
            'probability': 0.15,
            'severity': CrashSeverity.MILD
        })
        
        # Severe crash scenario
        scenarios.append({
            'name': 'Severe Market Crash',
            'max_decline_percentage': -45,
            'duration_months': 12,
            'recovery_months': 36,
            'asset_correlations': market_data['asset_correlations'],
            'probability': 0.03,
            'severity': CrashSeverity.SEVERE
        })
        
        return scenarios
    
    def _run_comprehensive_simulation(
        self,
        investor: InvestorProfile,
        crash_scenarios: List[Dict[str, Any]],
        market_data: Dict[str, Any],
        config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Run comprehensive market crash simulation."""
        
        simulation_years = config.get('years', 10)
        iterations = config.get('iterations', 10000)
        
        # Monte Carlo simulation
        all_paths = []
        portfolio_values = []
        max_drawdowns = []
        recovery_times = []
        
        for _ in range(iterations):
            # Select a crash scenario based on probability
            scenario = self._select_crash_scenario(crash_scenarios)
            
            # Simulate portfolio performance through the crash
            path_results = self._simulate_portfolio_path(
                investor, scenario, market_data, simulation_years
            )
            
            all_paths.append(path_results)
            portfolio_values.append(path_results['final_value'])
            max_drawdowns.append(path_results['max_drawdown'])
            recovery_times.append(path_results['recovery_time'])
        
        # Calculate statistics
        return {
            'portfolio_values': {
                'mean': np.mean(portfolio_values),
                'median': np.median(portfolio_values),
                'std': np.std(portfolio_values),
                'percentiles': {
                    '25': np.percentile(portfolio_values, 25),
                    '50': np.percentile(portfolio_values, 50),
                    '75': np.percentile(portfolio_values, 75),
                    '90': np.percentile(portfolio_values, 90),
                    '95': np.percentile(portfolio_values, 95)
                }
            },
            'max_drawdowns': {
                'mean': np.mean(max_drawdowns),
                'median': np.median(max_drawdowns),
                'std': np.std(max_drawdowns)
            },
            'recovery_times': {
                'mean': np.mean(recovery_times),
                'median': np.median(recovery_times),
                'std': np.std(recovery_times)
            },
            'all_paths': all_paths,
            'iterations': iterations,
            'simulation_years': simulation_years
        }
    
    def _select_crash_scenario(self, crash_scenarios: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Select a crash scenario based on probability."""
        probabilities = [scenario['probability'] for scenario in crash_scenarios]
        total_probability = sum(probabilities)
        
        # Normalize probabilities
        normalized_probabilities = [p / total_probability for p in probabilities]
        
        # Select scenario based on probability
        rand = random.random()
        cumulative_prob = 0
        
        for i, prob in enumerate(normalized_probabilities):
            cumulative_prob += prob
            if rand <= cumulative_prob:
                return crash_scenarios[i]
        
        return crash_scenarios[0]  # Fallback
    
    def _simulate_portfolio_path(
        self,
        investor: InvestorProfile,
        crash_scenario: Dict[str, Any],
        market_data: Dict[str, Any],
        simulation_years: int
    ) -> Dict[str, Any]:
        """Simulate a single portfolio path through a market crash."""
        
        months = simulation_years * 12
        portfolio_values = []
        max_value = 0
        max_drawdown = 0
        recovery_time = 0
        
        # Initial portfolio value
        current_value = sum(asset.current_value for asset in investor.portfolio_assets)
        peak_value = current_value
        
        for month in range(months):
            # Calculate monthly returns for each asset
            monthly_return = 0
            
            for asset in investor.portfolio_assets:
                # Base return (annual return / 12)
                base_monthly_return = 0.08 / 12  # 8% annual return
                
                # Apply crash impact based on scenario
                crash_impact = self._calculate_crash_impact(
                    month, crash_scenario, asset, market_data
                )
                
                # Add random volatility
                volatility_impact = random.normalvariate(0, asset.volatility / np.sqrt(12))
                
                # Calculate asset's monthly return
                asset_return = base_monthly_return + crash_impact + volatility_impact
                
                # Weight by allocation
                weighted_return = asset_return * (asset.allocation_percentage / 100)
                monthly_return += weighted_return
            
            # Add monthly contribution
            contribution_return = investor.monthly_contribution / current_value if current_value > 0 else 0
            
            # Update portfolio value
            current_value *= (1 + monthly_return + contribution_return)
            portfolio_values.append(current_value)
            
            # Track peak and drawdown
            if current_value > peak_value:
                peak_value = current_value
            
            drawdown = (current_value - peak_value) / peak_value if peak_value > 0 else 0
            max_drawdown = min(max_drawdown, drawdown)
            
            # Track recovery time
            if current_value >= peak_value and recovery_time == 0:
                recovery_time = month
        
        return {
            'portfolio_values': portfolio_values,
            'final_value': current_value,
            'max_drawdown': max_drawdown,
            'recovery_time': recovery_time,
            'scenario_name': crash_scenario['name']
        }
    
    def _calculate_crash_impact(
        self,
        month: int,
        crash_scenario: Dict[str, Any],
        asset: PortfolioAsset,
        market_data: Dict[str, Any]
    ) -> float:
        """Calculate crash impact on a specific asset."""
        
        # Determine if we're in crash period
        crash_start = 12  # Start crash after 1 year
        crash_duration = crash_scenario['duration_months']
        
        if crash_start <= month < crash_start + crash_duration:
            # We're in the crash period
            crash_progress = (month - crash_start) / crash_duration
            crash_intensity = crash_scenario['max_decline_percentage'] / 100
            
            # Apply asset-specific correlation
            asset_correlation = crash_scenario['asset_correlations'].get(
                asset.asset_class.value, -0.8
            )
            
            # Calculate crash impact
            crash_impact = crash_intensity * asset_correlation * (1 - crash_progress)
            return crash_impact
        
        elif month >= crash_start + crash_duration:
            # We're in recovery period
            recovery_progress = (month - crash_start - crash_duration) / crash_scenario['recovery_months']
            recovery_intensity = abs(crash_scenario['max_decline_percentage']) / 100 * 0.5  # Partial recovery
            
            asset_correlation = crash_scenario['asset_correlations'].get(
                asset.asset_class.value, -0.8
            )
            
            recovery_impact = recovery_intensity * asset_correlation * recovery_progress
            return recovery_impact
        
        else:
            # Pre-crash period
            return 0
    
    def _calculate_resilience_metrics(
        self,
        simulation_results: Dict[str, Any],
        investor: InvestorProfile,
        crash_scenarios: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Calculate portfolio resilience metrics."""
        
        portfolio_stats = simulation_results['portfolio_values']
        drawdown_stats = simulation_results['max_drawdowns']
        recovery_stats = simulation_results['recovery_times']
        
        # Calculate emergency fund adequacy
        monthly_expenses = investor.monthly_contribution * 3  # Estimate from contribution
        emergency_fund_needed = monthly_expenses * investor.emergency_fund_months
        
        # Calculate portfolio survival probability
        survival_threshold = emergency_fund_needed * 2  # Need 2x emergency fund to survive
        survival_probability = sum(1 for value in simulation_results['all_paths'] 
                                 if value['final_value'] > survival_threshold) / len(simulation_results['all_paths'])
        
        # Calculate risk-adjusted return
        risk_adjusted_return = (portfolio_stats['mean'] / 100000 - 1) / abs(drawdown_stats['mean']) if drawdown_stats['mean'] != 0 else 0
        
        return {
            'emergency_fund_needed': emergency_fund_needed,
            'survival_probability': survival_probability,
            'average_max_drawdown': drawdown_stats['mean'],
            'average_recovery_time': recovery_stats['mean'],
            'risk_adjusted_return': risk_adjusted_return,
            'portfolio_volatility': portfolio_stats['std'] / portfolio_stats['mean'] if portfolio_stats['mean'] > 0 else 0,
            'worst_case_scenario': portfolio_stats['percentiles']['10'],
            'best_case_scenario': portfolio_stats['percentiles']['90']
        }
    
    def _generate_recommendations(
        self,
        investor: InvestorProfile,
        crash_scenarios: List[Dict[str, Any]],
        market_data: Dict[str, Any],
        simulation_results: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Generate recommendations for market crash preparation."""
        
        resilience_metrics = self._calculate_resilience_metrics(simulation_results, investor, crash_scenarios)
        
        recommendations = []
        
        # Emergency fund recommendation
        if resilience_metrics['survival_probability'] < 0.8:
            recommendations.append({
                'type': 'emergency_fund',
                'title': 'Strengthen Emergency Fund',
                'description': f"Increase emergency fund to ${resilience_metrics['emergency_fund_needed']:,.0f} for market crash protection",
                'priority': 'high',
                'estimated_impact': resilience_metrics['emergency_fund_needed'],
                'actions': [
                    'Increase emergency fund to 12 months of expenses',
                    'Move emergency fund to high-yield savings account',
                    'Set up automatic contributions to emergency fund',
                    'Review and reduce monthly expenses'
                ]
            })
        
        # Portfolio diversification
        if resilience_metrics['average_max_drawdown'] < -0.3:
            recommendations.append({
                'type': 'portfolio_diversification',
                'title': 'Diversify Portfolio',
                'description': 'Add defensive assets to reduce crash impact',
                'priority': 'high',
                'estimated_impact': abs(resilience_metrics['average_max_drawdown']) * 100000,
                'actions': [
                    'Increase bond allocation to 20-30%',
                    'Add gold or commodities for inflation protection',
                    'Consider international diversification',
                    'Review and rebalance portfolio quarterly'
                ]
            })
        
        # Dollar-cost averaging
        if investor.monthly_contribution > 0:
            recommendations.append({
                'type': 'dollar_cost_averaging',
                'title': 'Maintain Dollar-Cost Averaging',
                'description': 'Continue regular contributions during market downturns',
                'priority': 'medium',
                'estimated_impact': resilience_metrics['risk_adjusted_return'] * 10000,
                'actions': [
                    'Automate monthly contributions',
                    'Increase contributions during market dips',
                    'Set up automatic rebalancing',
                    'Focus on long-term investment horizon'
                ]
            })
        
        # Risk management
        if resilience_metrics['portfolio_volatility'] > 0.2:
            recommendations.append({
                'type': 'risk_management',
                'title': 'Implement Risk Management',
                'description': 'Add stop-loss and position sizing rules',
                'priority': 'medium',
                'estimated_impact': resilience_metrics['average_max_drawdown'] * 50000,
                'actions': [
                    'Set stop-loss orders for individual positions',
                    'Limit single position to 5% of portfolio',
                    'Use trailing stops for profitable positions',
                    'Consider protective puts for large positions'
                ]
            })
        
        return recommendations


class MarketCrashScenario(ComprehensiveMarketCrashSimulator):
    """Market crash scenario for the simulation engine."""
    
    def __init__(self):
        super().__init__()
        self.scenario_name = "Market Crash Impact"
        self.description = "Simulate market crashes and test portfolio resilience"
    
    def get_scenario_parameters(self) -> Dict[str, Any]:
        """Get scenario parameters for frontend configuration."""
        return {
            'risk_tolerance': {
                'type': 'select',
                'options': ['conservative', 'moderate', 'aggressive'],
                'default': 'moderate',
                'label': 'Risk Tolerance'
            },
            'investment_horizon_years': {
                'type': 'number',
                'min': 5,
                'max': 40,
                'default': 20,
                'label': 'Investment Horizon (Years)'
            },
            'monthly_contribution': {
                'type': 'number',
                'min': 0,
                'max': 10000,
                'default': 1000,
                'label': 'Monthly Contribution ($)'
            },
            'emergency_fund_months': {
                'type': 'number',
                'min': 3,
                'max': 24,
                'default': 6,
                'label': 'Emergency Fund (Months)'
            },
            'debt_to_income_ratio': {
                'type': 'number',
                'min': 0,
                'max': 1,
                'default': 0.3,
                'label': 'Debt-to-Income Ratio'
            },
            'job_stability_score': {
                'type': 'number',
                'min': 0,
                'max': 1,
                'default': 0.8,
                'label': 'Job Stability Score'
            }
        } 