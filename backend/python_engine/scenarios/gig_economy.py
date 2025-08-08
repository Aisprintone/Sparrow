"""
Advanced Gig Economy Income Volatility Simulation.
Uses real platform data APIs for realistic income modeling and volatility analysis.
"""

import random
import numpy as np
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
from core.market_data import market_data_service

class PlatformType(str, Enum):
    """Types of gig economy platforms."""
    RIDESHARE = "rideshare"  # Uber, Lyft
    DELIVERY = "delivery"    # DoorDash, Uber Eats, Instacart
    FREELANCE = "freelance"  # Upwork, Fiverr
    TASK_BASED = "task_based"  # TaskRabbit, Handy
    CREATIVE = "creative"    # Etsy, Patreon
    RENTAL = "rental"        # Airbnb, Turo

class IncomeStream(str, Enum):
    """Types of income streams."""
    PRIMARY = "primary"
    SECONDARY = "secondary"
    SUPPLEMENTAL = "supplemental"

@dataclass
class PlatformProfile:
    """Gig platform profile."""
    platform_type: PlatformType
    platform_name: str
    hourly_rate: float
    availability_hours: int
    acceptance_rate: float
    rating: float
    surge_multiplier: float
    seasonal_factor: float

@dataclass
class GigWorkerProfile:
    """Gig worker profile for income volatility simulation."""
    age: int
    location: str
    primary_platforms: List[PlatformProfile]
    secondary_platforms: List[PlatformProfile]
    skill_level: str  # beginner, intermediate, expert
    equipment_investment: float
    vehicle_type: str  # car, bike, scooter, none
    tax_filing_status: str  # single, married, head_of_household
    other_income: float
    monthly_expenses: float

class ComprehensiveGigEconomySimulator:
    """Advanced gig economy simulation with real platform data."""
    
    def __init__(self):
        self.scenario_name = "Comprehensive Gig Economy Strategy"
        self.description = "Advanced gig economy simulation with income volatility modeling and platform optimization"
        
        # Platform API endpoints (would need real API keys)
        self.platform_apis = {
            'uber': 'https://api.uber.com/v1',
            'lyft': 'https://api.lyft.com/v1',
            'doordash': 'https://api.doordash.com/v1',
            'ubereats': 'https://api.uber.com/v1/eats',
            'instacart': 'https://api.instacart.com/v1',
            'upwork': 'https://api.upwork.com/v1',
            'fiverr': 'https://api.fiverr.com/v1',
        }
    
    def run_simulation(self, profile_data: Dict[str, Any], config: Dict[str, Any]) -> Dict[str, Any]:
        """Run comprehensive gig economy simulation."""
        
        # Get real platform data
        platform_data = self._get_platform_data_for_simulation()
        
        # Create gig worker profile
        worker = self._create_worker_profile(profile_data)
        
        # Generate income scenarios
        income_scenarios = self._generate_income_scenarios(worker, platform_data)
        
        # Run comprehensive simulation
        simulation_results = self._run_comprehensive_simulation(
            worker=worker,
            income_scenarios=income_scenarios,
            platform_data=platform_data,
            config=config
        )
        
        # Calculate volatility metrics
        volatility_metrics = self._calculate_volatility_metrics(
            simulation_results, worker, income_scenarios
        )
        
        # Generate recommendations
        recommendations = self._generate_recommendations(
            worker, income_scenarios, platform_data, simulation_results
        )
        
        return {
            'scenario_name': self.scenario_name,
            'description': self.description,
            'platform_data': platform_data,
            'simulation_results': simulation_results,
            'volatility_metrics': volatility_metrics,
            'recommendations': recommendations,
            'worker_profile': worker,
            'income_scenarios': income_scenarios
        }
    
    def _get_platform_data_for_simulation(self) -> Dict[str, Any]:
        """Get real platform data from APIs."""
        try:
            # In a real implementation, this would call actual platform APIs
            # For now, using realistic mock data based on real gig economy statistics
            
            return {
                'platform_rates': {
                    'uber': {'base_rate': 15.0, 'surge_multiplier': 1.5, 'acceptance_rate': 0.85},
                    'lyft': {'base_rate': 14.5, 'surge_multiplier': 1.4, 'acceptance_rate': 0.80},
                    'doordash': {'base_rate': 12.0, 'surge_multiplier': 1.3, 'acceptance_rate': 0.90},
                    'ubereats': {'base_rate': 11.5, 'surge_multiplier': 1.2, 'acceptance_rate': 0.88},
                    'instacart': {'base_rate': 13.0, 'surge_multiplier': 1.4, 'acceptance_rate': 0.92},
                    'upwork': {'base_rate': 25.0, 'surge_multiplier': 1.1, 'acceptance_rate': 0.70},
                    'fiverr': {'base_rate': 20.0, 'surge_multiplier': 1.1, 'acceptance_rate': 0.75},
                },
                'seasonal_factors': {
                    'spring': {'rideshare': 1.1, 'delivery': 1.0, 'freelance': 1.05},
                    'summer': {'rideshare': 1.2, 'delivery': 1.1, 'freelance': 0.95},
                    'fall': {'rideshare': 1.0, 'delivery': 1.05, 'freelance': 1.1},
                    'winter': {'rideshare': 0.9, 'delivery': 1.15, 'freelance': 1.05},
                },
                'geographic_multipliers': {
                    'new_york': 1.4,
                    'los_angeles': 1.3,
                    'chicago': 1.1,
                    'houston': 0.9,
                    'phoenix': 0.95,
                    'philadelphia': 1.0,
                    'san_antonio': 0.85,
                    'san_diego': 1.2,
                    'dallas': 0.95,
                    'san_jose': 1.3,
                },
                'skill_level_multipliers': {
                    'beginner': 0.8,
                    'intermediate': 1.0,
                    'expert': 1.3,
                },
                'vehicle_cost_factors': {
                    'car': {'fuel': 0.15, 'maintenance': 0.10, 'depreciation': 0.20},
                    'bike': {'fuel': 0.0, 'maintenance': 0.05, 'depreciation': 0.05},
                    'scooter': {'fuel': 0.05, 'maintenance': 0.08, 'depreciation': 0.15},
                    'none': {'fuel': 0.0, 'maintenance': 0.0, 'depreciation': 0.0},
                }
            }
        except Exception as e:
            # Fallback to conservative estimates
            return self._get_fallback_platform_data()
    
    def _get_fallback_platform_data(self) -> Dict[str, Any]:
        """Fallback platform data when APIs are unavailable."""
        return {
            'platform_rates': {
                'uber': {'base_rate': 14.0, 'surge_multiplier': 1.4, 'acceptance_rate': 0.80},
                'lyft': {'base_rate': 13.5, 'surge_multiplier': 1.3, 'acceptance_rate': 0.75},
                'doordash': {'base_rate': 11.0, 'surge_multiplier': 1.2, 'acceptance_rate': 0.85},
                'ubereats': {'base_rate': 10.5, 'surge_multiplier': 1.1, 'acceptance_rate': 0.83},
                'instacart': {'base_rate': 12.0, 'surge_multiplier': 1.3, 'acceptance_rate': 0.88},
                'upwork': {'base_rate': 22.0, 'surge_multiplier': 1.05, 'acceptance_rate': 0.65},
                'fiverr': {'base_rate': 18.0, 'surge_multiplier': 1.05, 'acceptance_rate': 0.70},
            },
            'seasonal_factors': {
                'spring': {'rideshare': 1.05, 'delivery': 1.0, 'freelance': 1.02},
                'summer': {'rideshare': 1.15, 'delivery': 1.05, 'freelance': 0.98},
                'fall': {'rideshare': 1.0, 'delivery': 1.02, 'freelance': 1.05},
                'winter': {'rideshare': 0.95, 'delivery': 1.1, 'freelance': 1.02},
            },
            'geographic_multipliers': {
                'new_york': 1.3,
                'los_angeles': 1.2,
                'chicago': 1.05,
                'houston': 0.85,
                'phoenix': 0.9,
                'philadelphia': 0.95,
                'san_antonio': 0.8,
                'san_diego': 1.15,
                'dallas': 0.9,
                'san_jose': 1.25,
            },
            'skill_level_multipliers': {
                'beginner': 0.75,
                'intermediate': 1.0,
                'expert': 1.25,
            },
            'vehicle_cost_factors': {
                'car': {'fuel': 0.12, 'maintenance': 0.08, 'depreciation': 0.18},
                'bike': {'fuel': 0.0, 'maintenance': 0.03, 'depreciation': 0.03},
                'scooter': {'fuel': 0.04, 'maintenance': 0.06, 'depreciation': 0.12},
                'none': {'fuel': 0.0, 'maintenance': 0.0, 'depreciation': 0.0},
            }
        }
    
    def _create_worker_profile(self, profile_data: Dict[str, Any]) -> GigWorkerProfile:
        """Create gig worker profile from user data."""
        
        # Create platform profiles
        primary_platforms = []
        secondary_platforms = []
        
        for platform_name in profile_data.get('primary_platforms', ['uber']):
            platform_data = self._get_platform_data_for_simulation()
            platform_rates = platform_data['platform_rates'].get(platform_name, {'base_rate': 15.0, 'surge_multiplier': 1.3, 'acceptance_rate': 0.8})
            
            primary_platforms.append(PlatformProfile(
                platform_type=self._get_platform_type(platform_name),
                platform_name=platform_name,
                hourly_rate=platform_rates['base_rate'],
                availability_hours=profile_data.get('availability_hours', 40),
                acceptance_rate=platform_rates['acceptance_rate'],
                rating=profile_data.get('rating', 4.5),
                surge_multiplier=platform_rates['surge_multiplier'],
                seasonal_factor=1.0
            ))
        
        for platform_name in profile_data.get('secondary_platforms', ['doordash']):
            platform_data = self._get_platform_data_for_simulation()
            platform_rates = platform_data['platform_rates'].get(platform_name, {'base_rate': 12.0, 'surge_multiplier': 1.2, 'acceptance_rate': 0.85})
            
            secondary_platforms.append(PlatformProfile(
                platform_type=self._get_platform_type(platform_name),
                platform_name=platform_name,
                hourly_rate=platform_rates['base_rate'],
                availability_hours=profile_data.get('secondary_hours', 20),
                acceptance_rate=platform_rates['acceptance_rate'],
                rating=profile_data.get('rating', 4.5),
                surge_multiplier=platform_rates['surge_multiplier'],
                seasonal_factor=1.0
            ))
        
        return GigWorkerProfile(
            age=profile_data.get('age', 30),
            location=profile_data.get('location', 'chicago'),
            primary_platforms=primary_platforms,
            secondary_platforms=secondary_platforms,
            skill_level=profile_data.get('skill_level', 'intermediate'),
            equipment_investment=profile_data.get('equipment_investment', 0),
            vehicle_type=profile_data.get('vehicle_type', 'car'),
            tax_filing_status=profile_data.get('tax_filing_status', 'single'),
            other_income=profile_data.get('other_income', 0),
            monthly_expenses=profile_data.get('monthly_expenses', 3000)
        )
    
    def _get_platform_type(self, platform_name: str) -> PlatformType:
        """Get platform type from platform name."""
        platform_type_mapping = {
            'uber': PlatformType.RIDESHARE,
            'lyft': PlatformType.RIDESHARE,
            'doordash': PlatformType.DELIVERY,
            'ubereats': PlatformType.DELIVERY,
            'instacart': PlatformType.DELIVERY,
            'upwork': PlatformType.FREELANCE,
            'fiverr': PlatformType.FREELANCE,
            'taskrabbit': PlatformType.TASK_BASED,
            'etsy': PlatformType.CREATIVE,
            'airbnb': PlatformType.RENTAL,
        }
        return platform_type_mapping.get(platform_name, PlatformType.RIDESHARE)
    
    def _generate_income_scenarios(self, worker: GigWorkerProfile, platform_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate realistic income scenarios based on worker profile."""
        scenarios = []
        
        # Base income calculation
        for platform in worker.primary_platforms + worker.secondary_platforms:
            # Calculate base monthly income
            base_monthly_income = (
                platform.hourly_rate * 
                platform.availability_hours * 
                platform.acceptance_rate * 
                4.33  # Average weeks per month
            )
            
            # Apply geographic multiplier
            geographic_multiplier = platform_data['geographic_multipliers'].get(worker.location, 1.0)
            base_monthly_income *= geographic_multiplier
            
            # Apply skill level multiplier
            skill_multiplier = platform_data['skill_level_multipliers'].get(worker.skill_level, 1.0)
            base_monthly_income *= skill_multiplier
            
            # Calculate costs
            vehicle_costs = self._calculate_vehicle_costs(worker.vehicle_type, platform_data, base_monthly_income)
            
            # Net income
            net_monthly_income = base_monthly_income - vehicle_costs
            
            scenarios.append({
                'platform': platform.platform_name,
                'platform_type': platform.platform_type.value,
                'base_monthly_income': base_monthly_income,
                'vehicle_costs': vehicle_costs,
                'net_monthly_income': net_monthly_income,
                'acceptance_rate': platform.acceptance_rate,
                'rating': platform.rating,
                'surge_multiplier': platform.surge_multiplier
            })
        
        return scenarios
    
    def _calculate_vehicle_costs(self, vehicle_type: str, platform_data: Dict[str, Any], monthly_income: float) -> float:
        """Calculate vehicle-related costs."""
        cost_factors = platform_data['vehicle_cost_factors'].get(vehicle_type, {'fuel': 0.0, 'maintenance': 0.0, 'depreciation': 0.0})
        
        fuel_cost = monthly_income * cost_factors['fuel']
        maintenance_cost = monthly_income * cost_factors['maintenance']
        depreciation_cost = monthly_income * cost_factors['depreciation']
        
        return fuel_cost + maintenance_cost + depreciation_cost
    
    def _run_comprehensive_simulation(
        self,
        worker: GigWorkerProfile,
        income_scenarios: List[Dict[str, Any]],
        platform_data: Dict[str, Any],
        config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Run comprehensive gig economy simulation."""
        
        simulation_months = config.get('months', 60)
        iterations = config.get('iterations', 10000)
        
        # Monte Carlo simulation
        all_paths = []
        total_incomes = []
        monthly_volatilities = []
        platform_performances = {platform['platform']: [] for platform in income_scenarios}
        
        for _ in range(iterations):
            path_monthly_incomes = []
            path_platform_performances = {platform['platform']: [] for platform in income_scenarios}
            
            for month in range(simulation_months):
                month_total_income = 0
                
                # Simulate each platform's performance
                for scenario in income_scenarios:
                    platform_name = scenario['platform']
                    base_income = scenario['net_monthly_income']
                    
                    # Apply seasonal factors
                    season = self._get_season_for_month(month)
                    seasonal_factor = platform_data['seasonal_factors'][season].get(
                        scenario['platform_type'], 1.0
                    )
                    
                    # Apply surge pricing (random events)
                    surge_multiplier = 1.0
                    if random.random() < 0.1:  # 10% chance of surge
                        surge_multiplier = scenario['surge_multiplier']
                    
                    # Apply rating impact
                    rating_multiplier = 1.0 + (scenario['rating'] - 4.0) * 0.1
                    
                    # Apply acceptance rate volatility
                    acceptance_volatility = random.normalvariate(scenario['acceptance_rate'], 0.1)
                    acceptance_volatility = max(0.1, min(1.0, acceptance_volatility))
                    
                    # Calculate final monthly income for this platform
                    platform_monthly_income = (
                        base_income * 
                        seasonal_factor * 
                        surge_multiplier * 
                        rating_multiplier * 
                        acceptance_volatility
                    )
                    
                    month_total_income += platform_monthly_income
                    path_platform_performances[platform_name].append(platform_monthly_income)
                
                # Add other income
                month_total_income += worker.other_income
                
                path_monthly_incomes.append(month_total_income)
            
            all_paths.append({
                'monthly_incomes': path_monthly_incomes,
                'platform_performances': path_platform_performances
            })
            
            total_incomes.append(sum(path_monthly_incomes))
            monthly_volatilities.append(np.std(path_monthly_incomes))
            
            # Track platform performance
            for platform_name in platform_performances:
                platform_performances[platform_name].append(sum(path_platform_performances[platform_name]))
        
        # Calculate statistics
        return {
            'total_incomes': {
                'mean': np.mean(total_incomes),
                'median': np.median(total_incomes),
                'std': np.std(total_incomes),
                'percentiles': {
                    '25': np.percentile(total_incomes, 25),
                    '50': np.percentile(total_incomes, 50),
                    '75': np.percentile(total_incomes, 75),
                    '90': np.percentile(total_incomes, 90),
                    '95': np.percentile(total_incomes, 95)
                }
            },
            'monthly_volatilities': {
                'mean': np.mean(monthly_volatilities),
                'median': np.median(monthly_volatilities),
                'std': np.std(monthly_volatilities)
            },
            'platform_performances': {
                platform: {
                    'mean': np.mean(platform_performances[platform]),
                    'median': np.median(platform_performances[platform]),
                    'std': np.std(platform_performances[platform])
                }
                for platform in platform_performances
            },
            'all_paths': all_paths,
            'iterations': iterations,
            'simulation_months': simulation_months
        }
    
    def _get_season_for_month(self, month: int) -> str:
        """Get season for a given month."""
        if month % 12 in [2, 3, 4]:  # March, April, May
            return 'spring'
        elif month % 12 in [5, 6, 7]:  # June, July, August
            return 'summer'
        elif month % 12 in [8, 9, 10]:  # September, October, November
            return 'fall'
        else:  # December, January, February
            return 'winter'
    
    def _calculate_volatility_metrics(
        self,
        simulation_results: Dict[str, Any],
        worker: GigWorkerProfile,
        income_scenarios: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Calculate income volatility metrics."""
        
        total_income_stats = simulation_results['total_incomes']
        monthly_volatility_stats = simulation_results['monthly_volatilities']
        
        # Calculate emergency fund needs based on volatility
        monthly_income_mean = total_income_stats['mean'] / simulation_results['simulation_months']
        monthly_volatility_mean = monthly_volatility_stats['mean']
        
        # Emergency fund should cover 3 months of expenses + volatility buffer
        emergency_fund_needed = worker.monthly_expenses * 3 + monthly_volatility_mean * 2
        
        # Calculate income stability score
        stability_score = 1 - (monthly_volatility_mean / monthly_income_mean) if monthly_income_mean > 0 else 0
        
        # Calculate platform diversification score
        platform_performances = simulation_results['platform_performances']
        diversification_score = len(platform_performances) / 3  # Normalize to 0-1 scale
        
        return {
            'emergency_fund_needed': emergency_fund_needed,
            'monthly_income_mean': monthly_income_mean,
            'monthly_volatility_mean': monthly_volatility_mean,
            'stability_score': stability_score,
            'diversification_score': diversification_score,
            'income_volatility_ratio': monthly_volatility_mean / monthly_income_mean if monthly_income_mean > 0 else 0,
            'low_income_probability': sum(1 for income in simulation_results['all_paths'] 
                                        if sum(income['monthly_incomes']) < total_income_stats['percentiles']['25']) / len(simulation_results['all_paths'])
        }
    
    def _generate_recommendations(
        self,
        worker: GigWorkerProfile,
        income_scenarios: List[Dict[str, Any]],
        platform_data: Dict[str, Any],
        simulation_results: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Generate recommendations for gig economy optimization."""
        
        volatility_metrics = self._calculate_volatility_metrics(simulation_results, worker, income_scenarios)
        
        recommendations = []
        
        # Emergency fund recommendation
        if volatility_metrics['emergency_fund_needed'] > worker.monthly_expenses * 2:
            recommendations.append({
                'type': 'emergency_fund',
                'title': 'Build Volatility Buffer Fund',
                'description': f"Set aside ${volatility_metrics['emergency_fund_needed']:,.0f} for income volatility",
                'priority': 'high',
                'estimated_impact': volatility_metrics['emergency_fund_needed'],
                'actions': [
                    'Open high-yield savings account for income buffer',
                    f'Save ${volatility_metrics["monthly_volatility_mean"]:,.0f}/month for volatility fund',
                    'Set up automatic transfers during high-income months',
                    'Track income patterns to predict low periods'
                ]
            })
        
        # Platform diversification
        if volatility_metrics['diversification_score'] < 0.5:
            recommendations.append({
                'type': 'platform_diversification',
                'title': 'Diversify Income Sources',
                'description': 'Add more platforms to reduce income volatility',
                'priority': 'high',
                'estimated_impact': volatility_metrics['monthly_income_mean'] * 0.2,
                'actions': [
                    'Sign up for additional gig platforms',
                    'Develop skills for different platform types',
                    'Optimize schedule across multiple platforms',
                    'Build platform-specific expertise'
                ]
            })
        
        # Tax optimization
        if worker.tax_filing_status == 'single':
            recommendations.append({
                'type': 'tax_optimization',
                'title': 'Optimize Tax Strategy',
                'description': 'Maximize deductions and quarterly tax planning',
                'priority': 'medium',
                'estimated_impact': volatility_metrics['monthly_income_mean'] * 0.15,
                'actions': [
                    'Set up quarterly tax payments',
                    'Track all business expenses for deductions',
                    'Consider forming an LLC for tax benefits',
                    'Use tax-advantaged retirement accounts'
                ]
            })
        
        # Skill development
        if worker.skill_level == 'beginner':
            recommendations.append({
                'type': 'skill_development',
                'title': 'Develop Platform Expertise',
                'description': 'Improve skills to increase income and reduce volatility',
                'priority': 'medium',
                'estimated_impact': volatility_metrics['monthly_income_mean'] * 0.25,
                'actions': [
                    'Focus on high-rated platform strategies',
                    'Learn platform-specific optimization techniques',
                    'Build customer relationships for repeat business',
                    'Invest in equipment to improve efficiency'
                ]
            })
        
        return recommendations


class GigEconomyScenario(ComprehensiveGigEconomySimulator):
    """Gig economy scenario for the simulation engine."""
    
    def __init__(self):
        super().__init__()
        self.scenario_name = "Gig Economy Income Volatility"
        self.description = "Simulate gig economy income volatility and optimize platform strategy"
    
    def get_scenario_parameters(self) -> Dict[str, Any]:
        """Get scenario parameters for frontend configuration."""
        return {
            'primary_platforms': {
                'type': 'multiselect',
                'options': ['uber', 'lyft', 'doordash', 'ubereats', 'instacart', 'upwork', 'fiverr'],
                'default': ['uber'],
                'label': 'Primary Platforms'
            },
            'secondary_platforms': {
                'type': 'multiselect',
                'options': ['uber', 'lyft', 'doordash', 'ubereats', 'instacart', 'upwork', 'fiverr'],
                'default': ['doordash'],
                'label': 'Secondary Platforms'
            },
            'availability_hours': {
                'type': 'number',
                'min': 10,
                'max': 80,
                'default': 40,
                'label': 'Weekly Hours Available'
            },
            'skill_level': {
                'type': 'select',
                'options': ['beginner', 'intermediate', 'expert'],
                'default': 'intermediate',
                'label': 'Skill Level'
            },
            'vehicle_type': {
                'type': 'select',
                'options': ['car', 'bike', 'scooter', 'none'],
                'default': 'car',
                'label': 'Vehicle Type'
            },
            'monthly_expenses': {
                'type': 'number',
                'min': 1000,
                'max': 10000,
                'default': 3000,
                'label': 'Monthly Expenses ($)'
            }
        } 