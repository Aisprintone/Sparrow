"""
Advanced Home Purchase Simulation with Real Estate Data.
Uses real estate APIs for realistic home cost modeling and mortgage analysis.
"""

import random
import numpy as np
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
from core.market_data import market_data_service

class PropertyType(str, Enum):
    """Types of properties."""
    SINGLE_FAMILY = "single_family"
    TOWNHOUSE = "townhouse"
    CONDO = "condo"
    MULTI_FAMILY = "multi_family"
    NEW_CONSTRUCTION = "new_construction"

class MortgageType(str, Enum):
    """Types of mortgages."""
    CONVENTIONAL = "conventional"
    FHA = "fha"
    VA = "va"
    USDA = "usda"
    JUMBO = "jumbo"

@dataclass
class PropertyProfile:
    """Property profile for home purchase simulation."""
    property_type: PropertyType
    purchase_price: float
    down_payment_percentage: float
    property_tax_rate: float
    insurance_rate: float
    hoa_fees: float
    maintenance_rate: float
    appreciation_rate: float
    location: str

@dataclass
class MortgageProfile:
    """Mortgage profile for home purchase simulation."""
    mortgage_type: MortgageType
    interest_rate: float
    loan_term_years: int
    down_payment_amount: float
    closing_costs_percentage: float
    pmi_rate: float
    points_paid: float

@dataclass
class BuyerProfile:
    """Home buyer profile for purchase simulation."""
    age: int
    income: float
    credit_score: int
    debt_to_income_ratio: float
    savings_rate: float
    target_down_payment: float
    monthly_debt_payments: float
    location: str
    property_profile: PropertyProfile
    mortgage_profile: MortgageProfile

class ComprehensiveHomePurchaseSimulator:
    """Advanced home purchase simulation with real estate data."""
    
    def __init__(self):
        self.scenario_name = "Comprehensive Home Purchase Strategy"
        self.description = "Advanced home purchase simulation with hidden costs and mortgage optimization"
        
        # Real estate API endpoints (would need real API keys)
        self.real_estate_apis = {
            'zillow': 'https://api.zillow.com/v1',
            'redfin': 'https://api.redfin.com/v1',
            'realtor': 'https://api.realtor.com/v1',
            'freddie_mac': 'https://api.freddiemac.com/v1',
            'fannie_mae': 'https://api.fanniemae.com/v1',
        }
    
    def run_simulation(self, profile_data: Dict[str, Any], config: Dict[str, Any]) -> Dict[str, Any]:
        """Run comprehensive home purchase simulation."""
        
        # Get real estate data
        real_estate_data = self._get_real_estate_data_for_simulation()
        
        # Create buyer profile
        buyer = self._create_buyer_profile(profile_data)
        
        # Generate purchase scenarios
        purchase_scenarios = self._generate_purchase_scenarios(buyer, real_estate_data)
        
        # Run comprehensive simulation
        simulation_results = self._run_comprehensive_simulation(
            buyer=buyer,
            purchase_scenarios=purchase_scenarios,
            real_estate_data=real_estate_data,
            config=config
        )
        
        # Calculate affordability metrics
        affordability_metrics = self._calculate_affordability_metrics(
            simulation_results, buyer, purchase_scenarios
        )
        
        # Generate recommendations
        recommendations = self._generate_recommendations(
            buyer, purchase_scenarios, real_estate_data, simulation_results
        )
        
        return {
            'scenario_name': self.scenario_name,
            'description': self.description,
            'real_estate_data': real_estate_data,
            'simulation_results': simulation_results,
            'affordability_metrics': affordability_metrics,
            'recommendations': recommendations,
            'buyer_profile': buyer,
            'purchase_scenarios': purchase_scenarios
        }
    
    def _get_real_estate_data_for_simulation(self) -> Dict[str, Any]:
        """Get real estate data from APIs."""
        try:
            # In a real implementation, this would call actual real estate APIs
            # For now, using realistic mock data based on real estate statistics
            
            return {
                'mortgage_rates': {
                    'conventional': {'rate_30yr': 6.5, 'rate_15yr': 6.0, 'rate_arm': 5.5},
                    'fha': {'rate_30yr': 6.3, 'rate_15yr': 5.8, 'rate_arm': 5.3},
                    'va': {'rate_30yr': 6.2, 'rate_15yr': 5.7, 'rate_arm': 5.2},
                    'usda': {'rate_30yr': 6.4, 'rate_15yr': 5.9, 'rate_arm': 5.4},
                    'jumbo': {'rate_30yr': 7.0, 'rate_15yr': 6.5, 'rate_arm': 6.0},
                },
                'location_multipliers': {
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
                'property_tax_rates': {
                    'new_york': 0.012,
                    'los_angeles': 0.008,
                    'chicago': 0.015,
                    'houston': 0.020,
                    'phoenix': 0.006,
                    'philadelphia': 0.014,
                    'san_antonio': 0.018,
                    'san_diego': 0.007,
                    'dallas': 0.016,
                    'san_jose': 0.009,
                },
                'insurance_rates': {
                    'single_family': 0.003,
                    'townhouse': 0.0035,
                    'condo': 0.004,
                    'multi_family': 0.0045,
                    'new_construction': 0.0025,
                },
                'maintenance_rates': {
                    'single_family': 0.015,
                    'townhouse': 0.012,
                    'condo': 0.008,
                    'multi_family': 0.020,
                    'new_construction': 0.010,
                },
                'appreciation_rates': {
                    'new_york': 0.04,
                    'los_angeles': 0.035,
                    'chicago': 0.025,
                    'houston': 0.02,
                    'phoenix': 0.03,
                    'philadelphia': 0.025,
                    'san_antonio': 0.02,
                    'san_diego': 0.035,
                    'dallas': 0.025,
                    'san_jose': 0.04,
                },
                'closing_costs': {
                    'conventional': 0.025,
                    'fha': 0.035,
                    'va': 0.030,
                    'usda': 0.032,
                    'jumbo': 0.028,
                },
                'pmi_rates': {
                    'conventional': 0.005,
                    'fha': 0.0085,
                    'va': 0.0,
                    'usda': 0.0035,
                    'jumbo': 0.006,
                }
            }
        except Exception as e:
            # Fallback to conservative estimates
            return self._get_fallback_real_estate_data()
    
    def _get_fallback_real_estate_data(self) -> Dict[str, Any]:
        """Fallback real estate data when APIs are unavailable."""
        return {
            'mortgage_rates': {
                'conventional': {'rate_30yr': 6.0, 'rate_15yr': 5.5, 'rate_arm': 5.0},
                'fha': {'rate_30yr': 5.8, 'rate_15yr': 5.3, 'rate_arm': 4.8},
                'va': {'rate_30yr': 5.7, 'rate_15yr': 5.2, 'rate_arm': 4.7},
                'usda': {'rate_30yr': 5.9, 'rate_15yr': 5.4, 'rate_arm': 4.9},
                'jumbo': {'rate_30yr': 6.5, 'rate_15yr': 6.0, 'rate_arm': 5.5},
            },
            'location_multipliers': {
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
            'property_tax_rates': {
                'new_york': 0.011,
                'los_angeles': 0.007,
                'chicago': 0.014,
                'houston': 0.019,
                'phoenix': 0.005,
                'philadelphia': 0.013,
                'san_antonio': 0.017,
                'san_diego': 0.006,
                'dallas': 0.015,
                'san_jose': 0.008,
            },
            'insurance_rates': {
                'single_family': 0.0025,
                'townhouse': 0.003,
                'condo': 0.0035,
                'multi_family': 0.004,
                'new_construction': 0.002,
            },
            'maintenance_rates': {
                'single_family': 0.014,
                'townhouse': 0.011,
                'condo': 0.007,
                'multi_family': 0.018,
                'new_construction': 0.009,
            },
            'appreciation_rates': {
                'new_york': 0.035,
                'los_angeles': 0.03,
                'chicago': 0.02,
                'houston': 0.015,
                'phoenix': 0.025,
                'philadelphia': 0.02,
                'san_antonio': 0.015,
                'san_diego': 0.03,
                'dallas': 0.02,
                'san_jose': 0.035,
            },
            'closing_costs': {
                'conventional': 0.023,
                'fha': 0.033,
                'va': 0.028,
                'usda': 0.030,
                'jumbo': 0.026,
            },
            'pmi_rates': {
                'conventional': 0.0045,
                'fha': 0.008,
                'va': 0.0,
                'usda': 0.003,
                'jumbo': 0.0055,
            }
        }
    
    def _create_buyer_profile(self, profile_data: Dict[str, Any]) -> BuyerProfile:
        """Create buyer profile from user data."""
        
        # Create property profile
        property_profile = PropertyProfile(
            property_type=PropertyType(profile_data.get('property_type', 'single_family')),
            purchase_price=profile_data.get('purchase_price', 400000),
            down_payment_percentage=profile_data.get('down_payment_percentage', 20),
            property_tax_rate=profile_data.get('property_tax_rate', 0.012),
            insurance_rate=profile_data.get('insurance_rate', 0.003),
            hoa_fees=profile_data.get('hoa_fees', 0),
            maintenance_rate=profile_data.get('maintenance_rate', 0.015),
            appreciation_rate=profile_data.get('appreciation_rate', 0.025),
            location=profile_data.get('location', 'chicago')
        )
        
        # Create mortgage profile
        mortgage_profile = MortgageProfile(
            mortgage_type=MortgageType(profile_data.get('mortgage_type', 'conventional')),
            interest_rate=profile_data.get('interest_rate', 6.5),
            loan_term_years=profile_data.get('loan_term_years', 30),
            down_payment_amount=property_profile.purchase_price * (property_profile.down_payment_percentage / 100),
            closing_costs_percentage=profile_data.get('closing_costs_percentage', 0.025),
            pmi_rate=profile_data.get('pmi_rate', 0.005),
            points_paid=profile_data.get('points_paid', 0)
        )
        
        return BuyerProfile(
            age=profile_data.get('age', 30),
            income=profile_data.get('income', 80000),
            credit_score=profile_data.get('credit_score', 750),
            debt_to_income_ratio=profile_data.get('debt_to_income_ratio', 0.3),
            savings_rate=profile_data.get('savings_rate', 0.15),
            target_down_payment=profile_data.get('target_down_payment', 80000),
            monthly_debt_payments=profile_data.get('monthly_debt_payments', 500),
            location=profile_data.get('location', 'chicago'),
            property_profile=property_profile,
            mortgage_profile=mortgage_profile
        )
    
    def _generate_purchase_scenarios(self, buyer: BuyerProfile, real_estate_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate realistic home purchase scenarios."""
        scenarios = []
        
        # Base scenario with current parameters
        scenarios.append(self._create_base_scenario(buyer, real_estate_data))
        
        # Optimistic scenario (lower rates, higher appreciation)
        scenarios.append(self._create_optimistic_scenario(buyer, real_estate_data))
        
        # Conservative scenario (higher rates, lower appreciation)
        scenarios.append(self._create_conservative_scenario(buyer, real_estate_data))
        
        # Different down payment scenarios
        scenarios.extend(self._create_down_payment_scenarios(buyer, real_estate_data))
        
        # Different mortgage type scenarios
        scenarios.extend(self._create_mortgage_type_scenarios(buyer, real_estate_data))
        
        return scenarios
    
    def _create_base_scenario(self, buyer: BuyerProfile, real_estate_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create base purchase scenario."""
        return {
            'name': 'Base Scenario',
            'purchase_price': buyer.property_profile.purchase_price,
            'down_payment_percentage': buyer.property_profile.down_payment_percentage,
            'interest_rate': buyer.mortgage_profile.interest_rate,
            'mortgage_type': buyer.mortgage_profile.mortgage_type.value,
            'loan_amount': buyer.property_profile.purchase_price * (1 - buyer.property_profile.down_payment_percentage / 100),
            'monthly_payment': self._calculate_monthly_payment(buyer),
            'total_cost': self._calculate_total_cost(buyer),
            'affordability_score': self._calculate_affordability_score(buyer),
            'appreciation_rate': buyer.property_profile.appreciation_rate
        }
    
    def _create_optimistic_scenario(self, buyer: BuyerProfile, real_estate_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create optimistic purchase scenario."""
        optimistic_buyer = self._copy_buyer_with_modifications(buyer, {
            'interest_rate': buyer.mortgage_profile.interest_rate * 0.9,  # 10% lower rate
            'appreciation_rate': buyer.property_profile.appreciation_rate * 1.2,  # 20% higher appreciation
            'purchase_price': buyer.property_profile.purchase_price * 0.95  # 5% lower price
        })
        
        return {
            'name': 'Optimistic Scenario',
            'purchase_price': optimistic_buyer.property_profile.purchase_price,
            'down_payment_percentage': optimistic_buyer.property_profile.down_payment_percentage,
            'interest_rate': optimistic_buyer.mortgage_profile.interest_rate,
            'mortgage_type': optimistic_buyer.mortgage_profile.mortgage_type.value,
            'loan_amount': optimistic_buyer.property_profile.purchase_price * (1 - optimistic_buyer.property_profile.down_payment_percentage / 100),
            'monthly_payment': self._calculate_monthly_payment(optimistic_buyer),
            'total_cost': self._calculate_total_cost(optimistic_buyer),
            'affordability_score': self._calculate_affordability_score(optimistic_buyer),
            'appreciation_rate': optimistic_buyer.property_profile.appreciation_rate
        }
    
    def _create_conservative_scenario(self, buyer: BuyerProfile, real_estate_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create conservative purchase scenario."""
        conservative_buyer = self._copy_buyer_with_modifications(buyer, {
            'interest_rate': buyer.mortgage_profile.interest_rate * 1.1,  # 10% higher rate
            'appreciation_rate': buyer.property_profile.appreciation_rate * 0.8,  # 20% lower appreciation
            'purchase_price': buyer.property_profile.purchase_price * 1.05  # 5% higher price
        })
        
        return {
            'name': 'Conservative Scenario',
            'purchase_price': conservative_buyer.property_profile.purchase_price,
            'down_payment_percentage': conservative_buyer.property_profile.down_payment_percentage,
            'interest_rate': conservative_buyer.mortgage_profile.interest_rate,
            'mortgage_type': conservative_buyer.mortgage_profile.mortgage_type.value,
            'loan_amount': conservative_buyer.property_profile.purchase_price * (1 - conservative_buyer.property_profile.down_payment_percentage / 100),
            'monthly_payment': self._calculate_monthly_payment(conservative_buyer),
            'total_cost': self._calculate_total_cost(conservative_buyer),
            'affordability_score': self._calculate_affordability_score(conservative_buyer),
            'appreciation_rate': conservative_buyer.property_profile.appreciation_rate
        }
    
    def _create_down_payment_scenarios(self, buyer: BuyerProfile, real_estate_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Create scenarios with different down payment amounts."""
        scenarios = []
        
        for down_payment_pct in [10, 15, 25, 30]:
            if down_payment_pct != buyer.property_profile.down_payment_percentage:
                modified_buyer = self._copy_buyer_with_modifications(buyer, {
                    'down_payment_percentage': down_payment_pct
                })
                
                scenarios.append({
                    'name': f'{down_payment_pct}% Down Payment',
                    'purchase_price': modified_buyer.property_profile.purchase_price,
                    'down_payment_percentage': modified_buyer.property_profile.down_payment_percentage,
                    'interest_rate': modified_buyer.mortgage_profile.interest_rate,
                    'mortgage_type': modified_buyer.mortgage_profile.mortgage_type.value,
                    'loan_amount': modified_buyer.property_profile.purchase_price * (1 - modified_buyer.property_profile.down_payment_percentage / 100),
                    'monthly_payment': self._calculate_monthly_payment(modified_buyer),
                    'total_cost': self._calculate_total_cost(modified_buyer),
                    'affordability_score': self._calculate_affordability_score(modified_buyer),
                    'appreciation_rate': modified_buyer.property_profile.appreciation_rate
                })
        
        return scenarios
    
    def _create_mortgage_type_scenarios(self, buyer: BuyerProfile, real_estate_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Create scenarios with different mortgage types."""
        scenarios = []
        
        mortgage_types = ['conventional', 'fha', 'va']
        if buyer.mortgage_profile.mortgage_type.value not in mortgage_types:
            mortgage_types.append(buyer.mortgage_profile.mortgage_type.value)
        
        for mortgage_type in mortgage_types:
            if mortgage_type != buyer.mortgage_profile.mortgage_type.value:
                # Get rates for this mortgage type
                rates = real_estate_data['mortgage_rates'].get(mortgage_type, {'rate_30yr': 6.5})
                modified_buyer = self._copy_buyer_with_modifications(buyer, {
                    'mortgage_type': mortgage_type,
                    'interest_rate': rates['rate_30yr']
                })
                
                scenarios.append({
                    'name': f'{mortgage_type.title()} Mortgage',
                    'purchase_price': modified_buyer.property_profile.purchase_price,
                    'down_payment_percentage': modified_buyer.property_profile.down_payment_percentage,
                    'interest_rate': modified_buyer.mortgage_profile.interest_rate,
                    'mortgage_type': modified_buyer.mortgage_profile.mortgage_type.value,
                    'loan_amount': modified_buyer.property_profile.purchase_price * (1 - modified_buyer.property_profile.down_payment_percentage / 100),
                    'monthly_payment': self._calculate_monthly_payment(modified_buyer),
                    'total_cost': self._calculate_total_cost(modified_buyer),
                    'affordability_score': self._calculate_affordability_score(modified_buyer),
                    'appreciation_rate': modified_buyer.property_profile.appreciation_rate
                })
        
        return scenarios
    
    def _copy_buyer_with_modifications(self, buyer: BuyerProfile, modifications: Dict[str, Any]) -> BuyerProfile:
        """Create a copy of buyer profile with modifications."""
        # Create new property profile
        property_profile = PropertyProfile(
            property_type=buyer.property_profile.property_type,
            purchase_price=modifications.get('purchase_price', buyer.property_profile.purchase_price),
            down_payment_percentage=modifications.get('down_payment_percentage', buyer.property_profile.down_payment_percentage),
            property_tax_rate=buyer.property_profile.property_tax_rate,
            insurance_rate=buyer.property_profile.insurance_rate,
            hoa_fees=buyer.property_profile.hoa_fees,
            maintenance_rate=buyer.property_profile.maintenance_rate,
            appreciation_rate=modifications.get('appreciation_rate', buyer.property_profile.appreciation_rate),
            location=buyer.property_profile.location
        )
        
        # Create new mortgage profile
        mortgage_profile = MortgageProfile(
            mortgage_type=MortgageType(modifications.get('mortgage_type', buyer.mortgage_profile.mortgage_type.value)),
            interest_rate=modifications.get('interest_rate', buyer.mortgage_profile.interest_rate),
            loan_term_years=buyer.mortgage_profile.loan_term_years,
            down_payment_amount=property_profile.purchase_price * (property_profile.down_payment_percentage / 100),
            closing_costs_percentage=buyer.mortgage_profile.closing_costs_percentage,
            pmi_rate=buyer.mortgage_profile.pmi_rate,
            points_paid=buyer.mortgage_profile.points_paid
        )
        
        return BuyerProfile(
            age=buyer.age,
            income=buyer.income,
            credit_score=buyer.credit_score,
            debt_to_income_ratio=buyer.debt_to_income_ratio,
            savings_rate=buyer.savings_rate,
            target_down_payment=buyer.target_down_payment,
            monthly_debt_payments=buyer.monthly_debt_payments,
            location=buyer.location,
            property_profile=property_profile,
            mortgage_profile=mortgage_profile
        )
    
    def _calculate_monthly_payment(self, buyer: BuyerProfile) -> float:
        """Calculate monthly mortgage payment."""
        loan_amount = buyer.property_profile.purchase_price * (1 - buyer.property_profile.down_payment_percentage / 100)
        monthly_rate = buyer.mortgage_profile.interest_rate / 100 / 12
        num_payments = buyer.mortgage_profile.loan_term_years * 12
        
        if monthly_rate == 0:
            return loan_amount / num_payments
        
        monthly_payment = loan_amount * (monthly_rate * (1 + monthly_rate) ** num_payments) / ((1 + monthly_rate) ** num_payments - 1)
        
        # Add property tax
        property_tax_monthly = buyer.property_profile.purchase_price * buyer.property_profile.property_tax_rate / 12
        
        # Add insurance
        insurance_monthly = buyer.property_profile.purchase_price * buyer.property_profile.insurance_rate / 12
        
        # Add PMI if down payment < 20%
        pmi_monthly = 0
        if buyer.property_profile.down_payment_percentage < 20:
            pmi_monthly = loan_amount * buyer.mortgage_profile.pmi_rate / 12
        
        # Add HOA fees
        hoa_monthly = buyer.property_profile.hoa_fees
        
        return monthly_payment + property_tax_monthly + insurance_monthly + pmi_monthly + hoa_monthly
    
    def _calculate_total_cost(self, buyer: BuyerProfile) -> float:
        """Calculate total cost of homeownership."""
        # Down payment
        down_payment = buyer.property_profile.purchase_price * (buyer.property_profile.down_payment_percentage / 100)
        
        # Closing costs
        closing_costs = buyer.property_profile.purchase_price * buyer.mortgage_profile.closing_costs_percentage
        
        # Points
        points_cost = buyer.property_profile.purchase_price * (buyer.mortgage_profile.points_paid / 100)
        
        # Total upfront costs
        upfront_costs = down_payment + closing_costs + points_cost
        
        # Monthly costs for first year
        monthly_payment = self._calculate_monthly_payment(buyer)
        first_year_costs = monthly_payment * 12
        
        # Maintenance costs
        maintenance_costs = buyer.property_profile.purchase_price * buyer.property_profile.maintenance_rate
        
        return upfront_costs + first_year_costs + maintenance_costs
    
    def _calculate_affordability_score(self, buyer: BuyerProfile) -> float:
        """Calculate affordability score (0-100)."""
        monthly_payment = self._calculate_monthly_payment(buyer)
        monthly_income = buyer.income / 12
        
        # Housing expense ratio (should be < 28%)
        housing_ratio = monthly_payment / monthly_income
        
        # Total debt ratio (should be < 36%)
        total_debt_ratio = (monthly_payment + buyer.monthly_debt_payments) / monthly_income
        
        # Calculate score based on ratios
        housing_score = max(0, 100 - (housing_ratio * 100))
        debt_score = max(0, 100 - (total_debt_ratio * 100))
        
        # Credit score factor
        credit_factor = min(1.0, buyer.credit_score / 800)
        
        # Savings rate factor
        savings_factor = min(1.0, buyer.savings_rate / 0.2)
        
        return (housing_score * 0.4 + debt_score * 0.4 + credit_factor * 10 + savings_factor * 10)
    
    def _run_comprehensive_simulation(
        self,
        buyer: BuyerProfile,
        purchase_scenarios: List[Dict[str, Any]],
        real_estate_data: Dict[str, Any],
        config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Run comprehensive home purchase simulation."""
        
        simulation_years = config.get('years', 30)
        iterations = config.get('iterations', 10000)
        
        # Monte Carlo simulation
        all_paths = []
        total_costs = []
        equity_build_up = []
        affordability_scores = []
        
        for _ in range(iterations):
            # Select a purchase scenario
            scenario = random.choice(purchase_scenarios)
            
            # Simulate homeownership path
            path_results = self._simulate_homeownership_path(
                buyer, scenario, real_estate_data, simulation_years
            )
            
            all_paths.append(path_results)
            total_costs.append(path_results['total_cost'])
            equity_build_up.append(path_results['equity_build_up'])
            affordability_scores.append(path_results['affordability_score'])
        
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
            'equity_build_up': {
                'mean': np.mean(equity_build_up),
                'median': np.median(equity_build_up),
                'std': np.std(equity_build_up)
            },
            'affordability_scores': {
                'mean': np.mean(affordability_scores),
                'median': np.median(affordability_scores),
                'std': np.std(affordability_scores)
            },
            'all_paths': all_paths,
            'iterations': iterations,
            'simulation_years': simulation_years
        }
    
    def _simulate_homeownership_path(
        self,
        buyer: BuyerProfile,
        scenario: Dict[str, Any],
        real_estate_data: Dict[str, Any],
        simulation_years: int
    ) -> Dict[str, Any]:
        """Simulate a single homeownership path."""
        
        months = simulation_years * 12
        property_value = scenario['purchase_price']
        loan_balance = scenario['loan_amount']
        monthly_payment = scenario['monthly_payment']
        
        total_interest_paid = 0
        total_principal_paid = 0
        
        for month in range(months):
            # Property appreciation
            monthly_appreciation = scenario['appreciation_rate'] / 12
            property_value *= (1 + monthly_appreciation)
            
            # Mortgage payment breakdown
            monthly_rate = scenario['interest_rate'] / 100 / 12
            interest_payment = loan_balance * monthly_rate
            principal_payment = monthly_payment - interest_payment
            
            if principal_payment > loan_balance:
                principal_payment = loan_balance
            
            loan_balance -= principal_payment
            total_interest_paid += interest_payment
            total_principal_paid += principal_payment
            
            if loan_balance <= 0:
                break
        
        equity_build_up = property_value - loan_balance
        total_cost = scenario['total_cost'] + total_interest_paid
        
        return {
            'property_value': property_value,
            'loan_balance': loan_balance,
            'equity_build_up': equity_build_up,
            'total_interest_paid': total_interest_paid,
            'total_principal_paid': total_principal_paid,
            'total_cost': total_cost,
            'affordability_score': scenario['affordability_score'],
            'scenario_name': scenario['name']
        }
    
    def _calculate_affordability_metrics(
        self,
        simulation_results: Dict[str, Any],
        buyer: BuyerProfile,
        purchase_scenarios: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Calculate home affordability metrics."""
        
        total_cost_stats = simulation_results['total_costs']
        equity_stats = simulation_results['equity_build_up']
        affordability_stats = simulation_results['affordability_scores']
        
        # Calculate down payment adequacy
        down_payment_needed = buyer.property_profile.purchase_price * (buyer.property_profile.down_payment_percentage / 100)
        down_payment_adequacy = buyer.target_down_payment / down_payment_needed if down_payment_needed > 0 else 1.0
        
        # Calculate monthly payment affordability
        monthly_payment = self._calculate_monthly_payment(buyer)
        monthly_income = buyer.income / 12
        payment_to_income_ratio = monthly_payment / monthly_income
        
        # Calculate total debt ratio
        total_debt_ratio = (monthly_payment + buyer.monthly_debt_payments) / monthly_income
        
        return {
            'down_payment_adequacy': down_payment_adequacy,
            'payment_to_income_ratio': payment_to_income_ratio,
            'total_debt_ratio': total_debt_ratio,
            'average_affordability_score': affordability_stats['mean'],
            'total_cost_mean': total_cost_stats['mean'],
            'equity_build_up_mean': equity_stats['mean'],
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
        buyer: BuyerProfile,
        purchase_scenarios: List[Dict[str, Any]],
        real_estate_data: Dict[str, Any],
        simulation_results: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Generate recommendations for home purchase optimization."""
        
        affordability_metrics = self._calculate_affordability_metrics(simulation_results, buyer, purchase_scenarios)
        
        recommendations = []
        
        # Down payment optimization
        if affordability_metrics['down_payment_adequacy'] < 1.0:
            recommendations.append({
                'type': 'down_payment',
                'title': 'Increase Down Payment',
                'description': f"Save additional ${buyer.target_down_payment - (buyer.property_profile.purchase_price * buyer.property_profile.down_payment_percentage / 100):,.0f} for better terms",
                'priority': 'high',
                'estimated_impact': 5000,
                'actions': [
                    'Increase savings rate to reach 20% down payment',
                    'Consider down payment assistance programs',
                    'Look for properties in lower price ranges',
                    'Delay purchase to save more'
                ]
            })
        
        # Mortgage optimization
        if affordability_metrics['payment_to_income_ratio'] > 0.28:
            recommendations.append({
                'type': 'mortgage_optimization',
                'title': 'Optimize Mortgage Terms',
                'description': 'Consider different mortgage types and terms',
                'priority': 'high',
                'estimated_impact': 200,
                'actions': [
                    'Compare FHA vs conventional loans',
                    'Consider 15-year vs 30-year terms',
                    'Shop around for better rates',
                    'Negotiate closing costs'
                ]
            })
        
        # Debt reduction
        if affordability_metrics['total_debt_ratio'] > 0.36:
            recommendations.append({
                'type': 'debt_reduction',
                'title': 'Reduce Existing Debt',
                'description': 'Pay down debt to improve debt-to-income ratio',
                'priority': 'medium',
                'estimated_impact': 300,
                'actions': [
                    'Pay off high-interest credit cards',
                    'Consolidate student loans',
                    'Reduce car payments',
                    'Increase income through side hustles'
                ]
            })
        
        # Credit improvement
        if buyer.credit_score < 750:
            recommendations.append({
                'type': 'credit_improvement',
                'title': 'Improve Credit Score',
                'description': 'Higher credit score can secure better rates',
                'priority': 'medium',
                'estimated_impact': 100,
                'actions': [
                    'Pay all bills on time',
                    'Reduce credit card utilization',
                    'Don\'t open new credit accounts',
                    'Dispute any credit report errors'
                ]
            })
        
        return recommendations


class HomePurchaseScenario(ComprehensiveHomePurchaseSimulator):
    """Home purchase scenario for the simulation engine."""
    
    def __init__(self):
        super().__init__()
        self.scenario_name = "Home Purchase Planning"
        self.description = "Simulate home purchase and optimize mortgage strategy"
    
    def get_scenario_parameters(self) -> Dict[str, Any]:
        """Get scenario parameters for frontend configuration."""
        return {
            'purchase_price': {
                'type': 'number',
                'min': 100000,
                'max': 2000000,
                'default': 400000,
                'label': 'Purchase Price ($)'
            },
            'down_payment_percentage': {
                'type': 'number',
                'min': 3,
                'max': 50,
                'default': 20,
                'label': 'Down Payment (%)'
            },
            'income': {
                'type': 'number',
                'min': 30000,
                'max': 500000,
                'default': 80000,
                'label': 'Annual Income ($)'
            },
            'credit_score': {
                'type': 'number',
                'min': 500,
                'max': 850,
                'default': 750,
                'label': 'Credit Score'
            },
            'mortgage_type': {
                'type': 'select',
                'options': ['conventional', 'fha', 'va', 'usda'],
                'default': 'conventional',
                'label': 'Mortgage Type'
            },
            'property_type': {
                'type': 'select',
                'options': ['single_family', 'townhouse', 'condo', 'multi_family'],
                'default': 'single_family',
                'label': 'Property Type'
            }
        } 