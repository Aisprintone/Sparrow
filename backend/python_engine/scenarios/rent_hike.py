"""
Advanced Rent Hike Simulation with Real Estate Market Data.
Uses real estate APIs for realistic rent increase modeling and moving cost analysis.
"""

import random
import numpy as np
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
from core.market_data import market_data_service

class RentalMarketType(str, Enum):
    """Types of rental markets."""
    URBAN_CORE = "urban_core"
    SUBURBAN = "suburban"
    RURAL = "rural"
    COLLEGE_TOWN = "college_town"
    TOURIST_AREA = "tourist_area"

class LeaseType(str, Enum):
    """Types of lease agreements."""
    MONTH_TO_MONTH = "month_to_month"
    SIX_MONTH = "six_month"
    ONE_YEAR = "one_year"
    TWO_YEAR = "two_year"

@dataclass
class RentalProperty:
    """Rental property profile."""
    current_rent: float
    market_rent: float
    lease_type: LeaseType
    lease_end_date: datetime
    rent_increase_limit: float  # Maximum allowed increase
    security_deposit: float
    utilities_included: bool
    parking_included: bool

@dataclass
class TenantProfile:
    """Tenant profile for rent hike simulation."""
    age: int
    income: float
    credit_score: int
    savings_rate: float
    monthly_debt_payments: float
    location: str
    rental_market_type: RentalMarketType
    rental_property: RentalProperty
    moving_cost_savings: float
    job_stability_score: float

class ComprehensiveRentHikeSimulator:
    """Advanced rent hike simulation with real estate market data."""
    
    def __init__(self):
        self.scenario_name = "Comprehensive Rent Hike Strategy"
        self.description = "Advanced rent hike simulation with moving cost analysis and affordability modeling"
        
        # Real estate API endpoints (would need real API keys)
        self.real_estate_apis = {
            'zillow': 'https://api.zillow.com/v1',
            'apartments': 'https://api.apartments.com/v1',
            'rentdata': 'https://api.rentdata.org/v1',
            'realtor': 'https://api.realtor.com/v1',
        }
    
    def run_simulation(self, profile_data: Dict[str, Any], config: Dict[str, Any]) -> Dict[str, Any]:
        """Run comprehensive rent hike simulation."""
        
        # Get real estate market data
        market_data = self._get_market_data_for_simulation()
        
        # Create tenant profile
        tenant = self._create_tenant_profile(profile_data)
        
        # Generate rent hike scenarios
        rent_hike_scenarios = self._generate_rent_hike_scenarios(tenant, market_data)
        
        # Run comprehensive simulation
        simulation_results = self._run_comprehensive_simulation(
            tenant=tenant,
            rent_hike_scenarios=rent_hike_scenarios,
            market_data=market_data,
            config=config
        )
        
        # Calculate affordability metrics
        affordability_metrics = self._calculate_affordability_metrics(
            simulation_results, tenant, rent_hike_scenarios
        )
        
        # Generate recommendations
        recommendations = self._generate_recommendations(
            tenant, rent_hike_scenarios, market_data, simulation_results
        )
        
        return {
            'scenario_name': self.scenario_name,
            'description': self.description,
            'market_data': market_data,
            'simulation_results': simulation_results,
            'affordability_metrics': affordability_metrics,
            'recommendations': recommendations,
            'tenant_profile': tenant,
            'rent_hike_scenarios': rent_hike_scenarios
        }
    
    def _get_market_data_for_simulation(self) -> Dict[str, Any]:
        """Get real estate market data from APIs."""
        try:
            # In a real implementation, this would call actual real estate APIs
            # For now, using realistic mock data based on real estate statistics
            
            return {
                'rent_increase_rates': {
                    'urban_core': 0.08,
                    'suburban': 0.06,
                    'rural': 0.04,
                    'college_town': 0.07,
                    'tourist_area': 0.09,
                },
                'market_rent_multipliers': {
                    'new_york': 2.5,
                    'los_angeles': 2.2,
                    'chicago': 1.3,
                    'houston': 0.9,
                    'phoenix': 1.1,
                    'philadelphia': 1.2,
                    'san_antonio': 0.8,
                    'san_diego': 2.0,
                    'dallas': 1.0,
                    'san_jose': 2.8,
                },
                'moving_costs': {
                    'local_move': 500,
                    'same_city_move': 1500,
                    'same_state_move': 3000,
                    'cross_country_move': 8000,
                },
                'rent_control_policies': {
                    'new_york': {'max_increase': 0.03, 'frequency': 'annual'},
                    'los_angeles': {'max_increase': 0.04, 'frequency': 'annual'},
                    'chicago': {'max_increase': 0.05, 'frequency': 'annual'},
                    'houston': {'max_increase': 0.10, 'frequency': 'annual'},
                    'phoenix': {'max_increase': 0.08, 'frequency': 'annual'},
                    'philadelphia': {'max_increase': 0.06, 'frequency': 'annual'},
                    'san_antonio': {'max_increase': 0.10, 'frequency': 'annual'},
                    'san_diego': {'max_increase': 0.05, 'frequency': 'annual'},
                    'dallas': {'max_increase': 0.10, 'frequency': 'annual'},
                    'san_jose': {'max_increase': 0.03, 'frequency': 'annual'},
                },
                'alternative_rental_options': {
                    'roommate_shared': 0.6,
                    'smaller_unit': 0.8,
                    'different_neighborhood': 0.9,
                    'different_city': 0.7,
                },
                'eviction_risk_factors': {
                    'rent_control': 0.1,
                    'no_rent_control': 0.3,
                    'month_to_month': 0.4,
                    'long_term_lease': 0.2,
                }
            }
        except Exception as e:
            # Fallback to conservative estimates
            return self._get_fallback_market_data()
    
    def _get_fallback_market_data(self) -> Dict[str, Any]:
        """Fallback market data when APIs are unavailable."""
        return {
            'rent_increase_rates': {
                'urban_core': 0.07,
                'suburban': 0.05,
                'rural': 0.03,
                'college_town': 0.06,
                'tourist_area': 0.08,
            },
            'market_rent_multipliers': {
                'new_york': 2.3,
                'los_angeles': 2.0,
                'chicago': 1.2,
                'houston': 0.85,
                'phoenix': 1.0,
                'philadelphia': 1.1,
                'san_antonio': 0.75,
                'san_diego': 1.8,
                'dallas': 0.95,
                'san_jose': 2.5,
            },
            'moving_costs': {
                'local_move': 400,
                'same_city_move': 1200,
                'same_state_move': 2500,
                'cross_country_move': 7000,
            },
            'rent_control_policies': {
                'new_york': {'max_increase': 0.025, 'frequency': 'annual'},
                'los_angeles': {'max_increase': 0.035, 'frequency': 'annual'},
                'chicago': {'max_increase': 0.045, 'frequency': 'annual'},
                'houston': {'max_increase': 0.09, 'frequency': 'annual'},
                'phoenix': {'max_increase': 0.07, 'frequency': 'annual'},
                'philadelphia': {'max_increase': 0.055, 'frequency': 'annual'},
                'san_antonio': {'max_increase': 0.09, 'frequency': 'annual'},
                'san_diego': {'max_increase': 0.045, 'frequency': 'annual'},
                'dallas': {'max_increase': 0.09, 'frequency': 'annual'},
                'san_jose': {'max_increase': 0.025, 'frequency': 'annual'},
            },
            'alternative_rental_options': {
                'roommate_shared': 0.65,
                'smaller_unit': 0.85,
                'different_neighborhood': 0.95,
                'different_city': 0.75,
            },
            'eviction_risk_factors': {
                'rent_control': 0.08,
                'no_rent_control': 0.25,
                'month_to_month': 0.35,
                'long_term_lease': 0.15,
            }
        }
    
    def _create_tenant_profile(self, profile_data: Dict[str, Any]) -> TenantProfile:
        """Create tenant profile from user data."""
        
        # Create rental property profile
        rental_property = RentalProperty(
            current_rent=profile_data.get('current_rent', 1500),
            market_rent=profile_data.get('market_rent', 1600),
            lease_type=LeaseType(profile_data.get('lease_type', 'one_year')),
            lease_end_date=datetime.now() + timedelta(days=profile_data.get('days_until_lease_end', 180)),
            rent_increase_limit=profile_data.get('rent_increase_limit', 0.05),
            security_deposit=profile_data.get('security_deposit', 1500),
            utilities_included=profile_data.get('utilities_included', False),
            parking_included=profile_data.get('parking_included', True)
        )
        
        return TenantProfile(
            age=profile_data.get('age', 28),
            income=profile_data.get('income', 60000),
            credit_score=profile_data.get('credit_score', 720),
            savings_rate=profile_data.get('savings_rate', 0.10),
            monthly_debt_payments=profile_data.get('monthly_debt_payments', 400),
            location=profile_data.get('location', 'chicago'),
            rental_market_type=RentalMarketType(profile_data.get('rental_market_type', 'urban_core')),
            rental_property=rental_property,
            moving_cost_savings=profile_data.get('moving_cost_savings', 2000),
            job_stability_score=profile_data.get('job_stability_score', 0.8)
        )
    
    def _generate_rent_hike_scenarios(self, tenant: TenantProfile, market_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate realistic rent hike scenarios."""
        scenarios = []
        
        # Base scenario (current rent)
        scenarios.append(self._create_base_scenario(tenant, market_data))
        
        # Moderate rent hike scenario
        scenarios.append(self._create_moderate_hike_scenario(tenant, market_data))
        
        # Severe rent hike scenario
        scenarios.append(self._create_severe_hike_scenario(tenant, market_data))
        
        # Market rate scenario
        scenarios.append(self._create_market_rate_scenario(tenant, market_data))
        
        # Alternative housing scenarios
        scenarios.extend(self._create_alternative_housing_scenarios(tenant, market_data))
        
        return scenarios
    
    def _create_base_scenario(self, tenant: TenantProfile, market_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create base scenario with current rent."""
        return {
            'name': 'Current Rent',
            'monthly_rent': tenant.rental_property.current_rent,
            'annual_cost': tenant.rental_property.current_rent * 12,
            'affordability_score': self._calculate_rent_affordability_score(tenant, tenant.rental_property.current_rent),
            'moving_cost': 0,
            'risk_level': 'low',
            'description': 'Continue with current rent'
        }
    
    def _create_moderate_hike_scenario(self, tenant: TenantProfile, market_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create moderate rent hike scenario."""
        rent_increase_rate = market_data['rent_increase_rates'].get(tenant.rental_market_type.value, 0.06)
        new_rent = tenant.rental_property.current_rent * (1 + rent_increase_rate)
        
        return {
            'name': 'Moderate Rent Hike',
            'monthly_rent': new_rent,
            'annual_cost': new_rent * 12,
            'affordability_score': self._calculate_rent_affordability_score(tenant, new_rent),
            'moving_cost': 0,
            'risk_level': 'medium',
            'description': f'Rent increases by {rent_increase_rate*100:.1f}%'
        }
    
    def _create_severe_hike_scenario(self, tenant: TenantProfile, market_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create severe rent hike scenario."""
        severe_increase_rate = market_data['rent_increase_rates'].get(tenant.rental_market_type.value, 0.06) * 1.5
        new_rent = tenant.rental_property.current_rent * (1 + severe_increase_rate)
        
        return {
            'name': 'Severe Rent Hike',
            'monthly_rent': new_rent,
            'annual_cost': new_rent * 12,
            'affordability_score': self._calculate_rent_affordability_score(tenant, new_rent),
            'moving_cost': 0,
            'risk_level': 'high',
            'description': f'Rent increases by {severe_increase_rate*100:.1f}%'
        }
    
    def _create_market_rate_scenario(self, tenant: TenantProfile, market_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create market rate scenario."""
        market_rent = tenant.rental_property.market_rent
        location_multiplier = market_data['market_rent_multipliers'].get(tenant.location, 1.0)
        adjusted_market_rent = market_rent * location_multiplier
        
        return {
            'name': 'Market Rate',
            'monthly_rent': adjusted_market_rent,
            'annual_cost': adjusted_market_rent * 12,
            'affordability_score': self._calculate_rent_affordability_score(tenant, adjusted_market_rent),
            'moving_cost': 0,
            'risk_level': 'medium',
            'description': 'Rent adjusted to market rate'
        }
    
    def _create_alternative_housing_scenarios(self, tenant: TenantProfile, market_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Create alternative housing scenarios."""
        scenarios = []
        
        # Roommate scenario
        roommate_rent = tenant.rental_property.current_rent * market_data['alternative_rental_options']['roommate_shared']
        scenarios.append({
            'name': 'Roommate Shared',
            'monthly_rent': roommate_rent,
            'annual_cost': roommate_rent * 12,
            'affordability_score': self._calculate_rent_affordability_score(tenant, roommate_rent),
            'moving_cost': market_data['moving_costs']['same_city_move'],
            'risk_level': 'low',
            'description': 'Share apartment with roommate'
        })
        
        # Smaller unit scenario
        smaller_unit_rent = tenant.rental_property.current_rent * market_data['alternative_rental_options']['smaller_unit']
        scenarios.append({
            'name': 'Smaller Unit',
            'monthly_rent': smaller_unit_rent,
            'annual_cost': smaller_unit_rent * 12,
            'affordability_score': self._calculate_rent_affordability_score(tenant, smaller_unit_rent),
            'moving_cost': market_data['moving_costs']['local_move'],
            'risk_level': 'low',
            'description': 'Move to smaller apartment'
        })
        
        # Different neighborhood scenario
        different_neighborhood_rent = tenant.rental_property.current_rent * market_data['alternative_rental_options']['different_neighborhood']
        scenarios.append({
            'name': 'Different Neighborhood',
            'monthly_rent': different_neighborhood_rent,
            'annual_cost': different_neighborhood_rent * 12,
            'affordability_score': self._calculate_rent_affordability_score(tenant, different_neighborhood_rent),
            'moving_cost': market_data['moving_costs']['same_city_move'],
            'risk_level': 'medium',
            'description': 'Move to different neighborhood'
        })
        
        # Different city scenario
        different_city_rent = tenant.rental_property.current_rent * market_data['alternative_rental_options']['different_city']
        scenarios.append({
            'name': 'Different City',
            'monthly_rent': different_city_rent,
            'annual_cost': different_city_rent * 12,
            'affordability_score': self._calculate_rent_affordability_score(tenant, different_city_rent),
            'moving_cost': market_data['moving_costs']['cross_country_move'],
            'risk_level': 'high',
            'description': 'Move to different city'
        })
        
        return scenarios
    
    def _calculate_rent_affordability_score(self, tenant: TenantProfile, monthly_rent: float) -> float:
        """Calculate rent affordability score (0-100)."""
        monthly_income = tenant.income / 12
        
        # Rent-to-income ratio (should be < 30%)
        rent_ratio = monthly_rent / monthly_income
        
        # Total debt ratio (should be < 40%)
        total_debt_ratio = (monthly_rent + tenant.monthly_debt_payments) / monthly_income
        
        # Calculate score based on ratios
        rent_score = max(0, 100 - (rent_ratio * 100))
        debt_score = max(0, 100 - (total_debt_ratio * 100))
        
        # Credit score factor
        credit_factor = min(1.0, tenant.credit_score / 800)
        
        # Savings rate factor
        savings_factor = min(1.0, tenant.savings_rate / 0.2)
        
        # Job stability factor
        job_stability_factor = tenant.job_stability_score
        
        return (rent_score * 0.4 + debt_score * 0.3 + credit_factor * 10 + savings_factor * 10 + job_stability_factor * 10)
    
    def _run_comprehensive_simulation(
        self,
        tenant: TenantProfile,
        rent_hike_scenarios: List[Dict[str, Any]],
        market_data: Dict[str, Any],
        config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Run comprehensive rent hike simulation."""
        
        simulation_years = config.get('years', 5)
        iterations = config.get('iterations', 10000)
        
        # Monte Carlo simulation
        all_paths = []
        total_costs = []
        affordability_scores = []
        moving_frequencies = []
        
        for _ in range(iterations):
            # Select a rent hike scenario
            scenario = random.choice(rent_hike_scenarios)
            
            # Simulate rental path
            path_results = self._simulate_rental_path(
                tenant, scenario, market_data, simulation_years
            )
            
            all_paths.append(path_results)
            total_costs.append(path_results['total_cost'])
            affordability_scores.append(path_results['average_affordability_score'])
            moving_frequencies.append(path_results['moving_frequency'])
        
        # Calculate statistics
        return {
            'total_costs': {
                'mean': np.mean(total_costs),
                'median': np.median(total_costs),
                'std': np.std(total_costs),
                'percentiles': {
                    '25': np.percentile(total_costs, 25),
                    '50': np.percentile(total_costs, 50),
                    '75': np.percentile(total_costs, 75),
                    '90': np.percentile(total_costs, 90),
                    '95': np.percentile(total_costs, 95)
                }
            },
            'affordability_scores': {
                'mean': np.mean(affordability_scores),
                'median': np.median(affordability_scores),
                'std': np.std(affordability_scores)
            },
            'moving_frequencies': {
                'mean': np.mean(moving_frequencies),
                'median': np.median(moving_frequencies),
                'std': np.std(moving_frequencies)
            },
            'all_paths': all_paths,
            'iterations': iterations,
            'simulation_years': simulation_years
        }
    
    def _simulate_rental_path(
        self,
        tenant: TenantProfile,
        scenario: Dict[str, Any],
        market_data: Dict[str, Any],
        simulation_years: int
    ) -> Dict[str, Any]:
        """Simulate a single rental path."""
        
        months = simulation_years * 12
        current_rent = scenario['monthly_rent']
        total_cost = 0
        moving_cost = scenario['moving_cost']
        moving_frequency = 0
        affordability_scores = []
        
        for month in range(months):
            # Apply rent increases based on market conditions
            rent_increase_rate = market_data['rent_increase_rates'].get(tenant.rental_market_type.value, 0.06)
            
            # Apply rent control if applicable
            rent_control = market_data['rent_control_policies'].get(tenant.location, {'max_increase': 0.10, 'frequency': 'annual'})
            if month % 12 == 0:  # Annual increase
                max_increase = rent_control['max_increase']
                actual_increase = min(rent_increase_rate, max_increase)
                current_rent *= (1 + actual_increase)
            
            # Calculate monthly cost
            monthly_cost = current_rent
            if not tenant.rental_property.utilities_included:
                monthly_cost += 150  # Estimated utilities
            if not tenant.rental_property.parking_included:
                monthly_cost += 100  # Estimated parking
            
            total_cost += monthly_cost
            
            # Calculate affordability score
            affordability_score = self._calculate_rent_affordability_score(tenant, current_rent)
            affordability_scores.append(affordability_score)
            
            # Simulate moving decision based on affordability
            if affordability_score < 30 and random.random() < 0.1:  # 10% chance of moving if unaffordable
                moving_frequency += 1
                moving_cost += market_data['moving_costs']['same_city_move']
        
        return {
            'total_cost': total_cost + moving_cost,
            'average_affordability_score': np.mean(affordability_scores),
            'moving_frequency': moving_frequency,
            'final_monthly_rent': current_rent,
            'scenario_name': scenario['name']
        }
    
    def _calculate_affordability_metrics(
        self,
        simulation_results: Dict[str, Any],
        tenant: TenantProfile,
        rent_hike_scenarios: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Calculate rent affordability metrics."""
        
        total_cost_stats = simulation_results['total_costs']
        affordability_stats = simulation_results['affordability_scores']
        moving_stats = simulation_results['moving_frequencies']
        
        # Calculate rent-to-income ratio
        monthly_income = tenant.income / 12
        current_rent_ratio = tenant.rental_property.current_rent / monthly_income
        
        # Calculate emergency fund needs
        emergency_fund_needed = tenant.rental_property.current_rent * 3  # 3 months rent
        
        # Calculate moving cost buffer
        moving_cost_buffer = tenant.moving_cost_savings
        
        return {
            'current_rent_ratio': current_rent_ratio,
            'emergency_fund_needed': emergency_fund_needed,
            'moving_cost_buffer': moving_cost_buffer,
            'average_affordability_score': affordability_stats['mean'],
            'average_moving_frequency': moving_stats['mean'],
            'total_cost_mean': total_cost_stats['mean'],
            'affordability_grade': self._calculate_affordability_grade(affordability_stats['mean'])
        }
    
    def _calculate_affordability_grade(self, score: float) -> str:
        """Calculate affordability grade based on score."""
        if score >= 80:
            return 'A'
        elif score >= 60:
            return 'B'
        elif score >= 40:
            return 'C'
        elif score >= 20:
            return 'D'
        else:
            return 'F'
    
    def _generate_recommendations(
        self,
        tenant: TenantProfile,
        rent_hike_scenarios: List[Dict[str, Any]],
        market_data: Dict[str, Any],
        simulation_results: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Generate recommendations for rent hike preparation."""
        
        affordability_metrics = self._calculate_affordability_metrics(simulation_results, tenant, rent_hike_scenarios)
        
        recommendations = []
        
        # Emergency fund recommendation
        if affordability_metrics['emergency_fund_needed'] > tenant.moving_cost_savings:
            recommendations.append({
                'type': 'emergency_fund',
                'title': 'Build Rent Emergency Fund',
                'description': f"Set aside ${affordability_metrics['emergency_fund_needed']:,.0f} for rent emergencies",
                'priority': 'high',
                'estimated_impact': affordability_metrics['emergency_fund_needed'],
                'actions': [
                    'Open high-yield savings account for rent buffer',
                    f'Save ${tenant.rental_property.current_rent/4:,.0f}/month for emergency fund',
                    'Set up automatic transfers to rent emergency fund',
                    'Review and reduce monthly expenses'
                ]
            })
        
        # Income increase
        if affordability_metrics['current_rent_ratio'] > 0.3:
            recommendations.append({
                'type': 'income_increase',
                'title': 'Increase Income',
                'description': 'Consider ways to increase income to improve rent affordability',
                'priority': 'high',
                'estimated_impact': 200,
                'actions': [
                    'Ask for a raise at current job',
                    'Look for higher-paying job opportunities',
                    'Start a side hustle or freelance work',
                    'Develop new skills for career advancement'
                ]
            })
        
        # Moving preparation
        if affordability_metrics['average_moving_frequency'] > 0.5:
            recommendations.append({
                'type': 'moving_preparation',
                'title': 'Prepare for Potential Move',
                'description': 'Build moving cost buffer and research alternative housing',
                'priority': 'medium',
                'estimated_impact': 1000,
                'actions': [
                    'Research alternative neighborhoods and cities',
                    'Build moving cost savings fund',
                    'Network for potential roommate situations',
                    'Improve credit score for better rental options'
                ]
            })
        
        # Lease negotiation
        if tenant.rental_property.lease_type.value == 'month_to_month':
            recommendations.append({
                'type': 'lease_negotiation',
                'title': 'Negotiate Longer Lease',
                'description': 'Consider signing a longer lease for rent stability',
                'priority': 'medium',
                'estimated_impact': 150,
                'actions': [
                    'Negotiate with landlord for longer lease term',
                    'Offer to pay rent early for discount',
                    'Improve credit score for better terms',
                    'Research rent control policies in your area'
                ]
            })
        
        return recommendations


class RentHikeScenario(ComprehensiveRentHikeSimulator):
    """Rent hike scenario for the simulation engine."""
    
    def __init__(self):
        super().__init__()
        self.scenario_name = "Rent Hike Stress Test"
        self.description = "Simulate rent increases and prepare for housing cost changes"
    
    def get_scenario_parameters(self) -> Dict[str, Any]:
        """Get scenario parameters for frontend configuration."""
        return {
            'current_rent': {
                'type': 'number',
                'min': 500,
                'max': 5000,
                'default': 1500,
                'label': 'Current Monthly Rent ($)'
            },
            'income': {
                'type': 'number',
                'min': 20000,
                'max': 300000,
                'default': 60000,
                'label': 'Annual Income ($)'
            },
            'credit_score': {
                'type': 'number',
                'min': 500,
                'max': 850,
                'default': 720,
                'label': 'Credit Score'
            },
            'lease_type': {
                'type': 'select',
                'options': ['month_to_month', 'six_month', 'one_year', 'two_year'],
                'default': 'one_year',
                'label': 'Lease Type'
            },
            'rental_market_type': {
                'type': 'select',
                'options': ['urban_core', 'suburban', 'rural', 'college_town', 'tourist_area'],
                'default': 'urban_core',
                'label': 'Rental Market Type'
            },
            'moving_cost_savings': {
                'type': 'number',
                'min': 0,
                'max': 10000,
                'default': 2000,
                'label': 'Moving Cost Savings ($)'
            }
        } 