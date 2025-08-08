"""
Behavioral Integration Module - Seamlessly integrates behavioral economics models
with the existing Monte Carlo simulation engine.

This module provides the bridge between mathematical simulations and realistic
human behavior patterns.
"""

import numpy as np
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
import time

# Import behavioral models
from .emergency_behavior import EmergencyBehaviorModel, BehavioralPersonality
from .student_loan_behavior import StudentLoanBehaviorModel
from .cognitive_biases import CognitiveBiasModel, BiasStrength
from .decision_framework import (
    BehavioralDecisionFramework,
    FinancialStressScore,
    DecisionContext,
    BehavioralProfile
)
from .social_cultural import (
    SocialCulturalFactors,
    CulturalBackground,
    GenerationalCohort,
    SocialNetwork
)


@dataclass
class BehavioralParameters:
    """
    Complete set of behavioral parameters for a simulation.
    Allows fine-tuning of behavioral model inputs.
    """
    # Personality and psychology
    personality_type: str = "survivor"  # planner, avoider, survivor, panicker, optimizer
    financial_literacy: float = 0.5  # 0-1 scale
    risk_tolerance: float = 0.5  # 0-1 scale
    self_control: float = 0.5  # 0-1 scale
    
    # Cognitive biases
    loss_aversion: float = 2.1  # Typical 2-2.5x
    present_bias: float = 0.7  # Beta parameter, typical 0.6-0.8
    optimism_level: str = "moderate"  # low, moderate, high
    anchoring_susceptibility: float = 0.5  # 0-1 scale
    
    # Social and cultural
    cultural_background: str = "western_individualist"
    social_network_strength: str = "moderate_mixed"
    peer_influence_level: float = 0.5  # 0-1 scale
    family_obligation_level: float = 0.3  # 0-1 scale
    
    # Stress and adaptation
    initial_stress_level: float = 0.3  # 0-1 scale
    stress_recovery_rate: float = 0.1  # Monthly recovery
    learning_rate: float = 0.1  # How quickly behavior adapts
    
    @classmethod
    def from_demographic(cls, demographic: str) -> 'BehavioralParameters':
        """
        Create behavioral parameters based on demographic profile.
        """
        params = cls()
        
        demographic_profiles = {
            'genz': {
                'personality_type': 'optimizer',
                'financial_literacy': 0.4,
                'risk_tolerance': 0.7,
                'self_control': 0.4,
                'present_bias': 0.6,
                'optimism_level': 'high',
                'peer_influence_level': 0.7,
                'cultural_background': 'western_individualist'
            },
            'millennial': {
                'personality_type': 'survivor',
                'financial_literacy': 0.5,
                'risk_tolerance': 0.6,
                'self_control': 0.5,
                'present_bias': 0.7,
                'optimism_level': 'moderate',
                'peer_influence_level': 0.6,
                'family_obligation_level': 0.4
            },
            'midcareer': {
                'personality_type': 'planner',
                'financial_literacy': 0.6,
                'risk_tolerance': 0.5,
                'self_control': 0.6,
                'present_bias': 0.75,
                'optimism_level': 'moderate',
                'family_obligation_level': 0.5
            },
            'senior': {
                'personality_type': 'planner',
                'financial_literacy': 0.7,
                'risk_tolerance': 0.3,
                'self_control': 0.7,
                'loss_aversion': 2.5,
                'present_bias': 0.8,
                'optimism_level': 'low'
            }
        }
        
        if demographic in demographic_profiles:
            profile = demographic_profiles[demographic]
            for key, value in profile.items():
                if hasattr(params, key):
                    setattr(params, key, value)
        
        return params


class BehavioralMonteCarloEnhancer:
    """
    Enhances Monte Carlo simulations with behavioral economics models.
    Maintains compatibility with existing engine while adding realism.
    """
    
    def __init__(
        self,
        behavioral_params: Optional[BehavioralParameters] = None,
        demographic: Optional[str] = None
    ):
        """
        Initialize behavioral enhancer.
        
        Args:
            behavioral_params: Custom behavioral parameters
            demographic: Use demographic-based defaults
        """
        if behavioral_params:
            self.params = behavioral_params
        elif demographic:
            self.params = BehavioralParameters.from_demographic(demographic)
        else:
            self.params = BehavioralParameters()
        
        # Initialize behavioral models
        self._initialize_models()
        
        # Track simulation state
        self.simulation_history = []
        self.behavioral_adjustments = []
    
    def _initialize_models(self):
        """Initialize all behavioral model components."""
        # Emergency behavior
        self.emergency_model = EmergencyBehaviorModel(
            personality_type=self.params.personality_type
        )
        
        # Student loan behavior
        self.loan_model = StudentLoanBehaviorModel(
            financial_literacy=self.params.financial_literacy,
            debt_shame=0.5,  # Default
            future_orientation=1 - self.params.present_bias,
            risk_tolerance=self.params.risk_tolerance
        )
        
        # Cognitive biases
        bias_strength = BiasStrength[self.params.optimism_level.upper()]
        self.bias_model = CognitiveBiasModel(
            loss_aversion_strength=self.params.loss_aversion,
            present_bias_beta=self.params.present_bias,
            optimism_level=bias_strength,
            anchoring_susceptibility=self.params.anchoring_susceptibility
        )
        
        # Decision framework
        self.decision_framework = BehavioralDecisionFramework(
            demographic='millennial',  # Default
            personality_type=self.params.personality_type,
            initial_stress=self.params.initial_stress_level
        )
        
        # Social and cultural factors
        cultural_bg = CulturalBackground[self.params.cultural_background.upper()]
        social_net = SocialNetwork[self.params.social_network_strength.upper()]
        
        self.social_model = SocialCulturalFactors(
            cultural_background=cultural_bg,
            generational_cohort=GenerationalCohort.MILLENNIAL,  # Default
            social_network=social_net
        )
    
    def enhance_emergency_fund_simulation(
        self,
        base_outcomes: np.ndarray,
        profile_data: Dict[str, Any],
        random_factors: Dict[str, np.ndarray]
    ) -> Tuple[np.ndarray, Dict[str, Any]]:
        """
        Apply behavioral adjustments to emergency fund simulations.
        
        Args:
            base_outcomes: Original Monte Carlo outcomes
            profile_data: User profile information
            random_factors: Random factors from Monte Carlo
            
        Returns:
            Tuple of (adjusted_outcomes, behavioral_metrics)
        """
        iterations = len(base_outcomes)
        adjusted_outcomes = np.zeros(iterations)
        
        # Extract profile information
        monthly_expenses = profile_data.get('monthly_expenses', 3000)
        emergency_fund = profile_data.get('emergency_fund_balance', 10000)
        demographic = profile_data.get('demographic', 'millennial')
        
        # Behavioral metrics to track
        expense_reductions = []
        help_seeking_events = []
        stress_levels = []
        
        for i in range(iterations):
            # Calculate financial stress for this iteration
            months_remaining = base_outcomes[i]
            stress_score = FinancialStressScore.from_financial_metrics(
                debt_to_income=0.3,  # Example
                months_emergency_fund=months_remaining,
                income_volatility=random_factors['income_volatility'][i],
                expense_coverage_ratio=1.0
            )
            
            current_stress = stress_score.calculate_overall_stress()
            stress_levels.append(current_stress)
            
            # Apply expense reduction behavior
            if months_remaining < 12:  # Emergency situation
                months_in_crisis = int(12 - months_remaining)
                reduction = self.emergency_model.calculate_expense_reduction(
                    months_in_crisis,
                    self.params.personality_type
                )
                
                # Adjust expenses based on behavioral reduction
                behavioral_expenses = monthly_expenses * (1 - reduction)
                
                # Recalculate runway with behavioral expenses
                adjusted_outcomes[i] = emergency_fund / behavioral_expenses
                expense_reductions.append(reduction)
            else:
                adjusted_outcomes[i] = base_outcomes[i]
                expense_reductions.append(0)
            
            # Model help-seeking behavior
            if months_remaining < 3:
                savings_ratio = months_remaining
                threshold_months = self.emergency_model.determine_help_seeking_threshold(
                    savings_ratio,
                    self.params.social_network_strength,
                    demographic
                )
                
                if threshold_months == 0:  # Seeks help immediately
                    # Add help to extend runway
                    help_months = np.random.uniform(1, 3)
                    adjusted_outcomes[i] += help_months
                    help_seeking_events.append(i)
        
        # Calculate behavioral metrics
        behavioral_metrics = {
            'mean_expense_reduction': np.mean(expense_reductions),
            'max_expense_reduction': np.max(expense_reductions),
            'help_seeking_rate': len(help_seeking_events) / iterations,
            'mean_stress_level': np.mean(stress_levels),
            'behavioral_impact': np.mean(adjusted_outcomes - base_outcomes),
            'behavior_improved_outcomes': np.sum(adjusted_outcomes > base_outcomes) / iterations
        }
        
        return adjusted_outcomes, behavioral_metrics
    
    def enhance_student_loan_simulation(
        self,
        base_outcomes: np.ndarray,
        profile_data: Dict[str, Any],
        random_factors: Dict[str, np.ndarray]
    ) -> Tuple[np.ndarray, Dict[str, Any]]:
        """
        Apply behavioral adjustments to student loan simulations.
        
        Args:
            base_outcomes: Original Monte Carlo outcomes (months to payoff)
            profile_data: User profile information
            random_factors: Random factors from Monte Carlo
            
        Returns:
            Tuple of (adjusted_outcomes, behavioral_metrics)
        """
        iterations = len(base_outcomes)
        adjusted_outcomes = np.zeros(iterations)
        
        # Extract profile information
        loan_balance = profile_data.get('student_loan_balance', 30000)
        monthly_income = profile_data.get('monthly_income', 5000)
        career_type = profile_data.get('career_type', 'private')
        
        # Calculate debt-to-income ratio
        annual_income = monthly_income * 12
        debt_to_income = loan_balance / annual_income if annual_income > 0 else 1.0
        
        # Behavioral events to track
        forbearance_uses = []
        refinancing_events = []
        plan_changes = []
        
        for i in range(iterations):
            base_months = base_outcomes[i]
            
            # Model repayment plan choice based on psychology
            chosen_plan = self.loan_model.calculate_repayment_plan_preference(
                annual_income,
                debt_to_income,
                career_type,
                years_since_graduation=2  # Example
            )
            
            # Adjust timeline based on plan choice
            plan_multipliers = {
                'standard': 1.0,
                'income_driven': 1.3,  # Takes longer
                'aggressive': 0.8,  # Pays off faster
                'refinance': 0.9  # Better rate
            }
            
            plan_multiplier = plan_multipliers.get(chosen_plan, 1.0)
            
            # Model forbearance likelihood
            financial_stress = random_factors['income_volatility'][i]
            forbearance_prob = self.loan_model.model_forbearance_likelihood(
                financial_stress,
                months_since_graduation=24,
                payment_to_income_ratio=0.15,
                emergency_fund_months=2.0
            )
            
            # Apply forbearance if triggered
            if np.random.random() < forbearance_prob:
                # Forbearance adds time to payoff
                forbearance_months = np.random.randint(3, 12)
                adjusted_outcomes[i] = base_months * plan_multiplier + forbearance_months
                forbearance_uses.append(i)
            else:
                adjusted_outcomes[i] = base_months * plan_multiplier
            
            # Model refinancing behavior
            if i % 100 == 0:  # Check periodically
                will_refi, _ = self.loan_model.refinancing.will_refinance(
                    current_rate=0.06,
                    market_rate=0.045,
                    credit_score=700,
                    years_since_graduation=3,
                    federal_loan=True
                )
                
                if will_refi:
                    # Refinancing reduces payoff time
                    adjusted_outcomes[i] *= 0.85
                    refinancing_events.append(i)
            
            # Track plan changes
            if chosen_plan != 'standard':
                plan_changes.append(chosen_plan)
        
        # Calculate behavioral metrics
        behavioral_metrics = {
            'forbearance_usage_rate': len(forbearance_uses) / iterations,
            'refinancing_rate': len(refinancing_events) / iterations,
            'most_common_plan': max(set(plan_changes), key=plan_changes.count) if plan_changes else 'standard',
            'behavioral_impact_months': np.mean(adjusted_outcomes - base_outcomes),
            'procrastination_factor': np.mean(adjusted_outcomes / base_outcomes) if np.mean(base_outcomes) > 0 else 1.0
        }
        
        return adjusted_outcomes, behavioral_metrics
    
    def apply_cognitive_biases_to_decisions(
        self,
        decision_context: Dict[str, Any],
        iterations: int
    ) -> np.ndarray:
        """
        Apply cognitive biases to financial decisions across iterations.
        
        Returns array of behavioral adjustment factors.
        """
        adjustments = np.ones(iterations)
        
        for i in range(iterations):
            # Apply all relevant biases
            biased_decision = self.bias_model.apply_all_biases(decision_context)
            
            # Extract adjustment factor
            if 'loss_aversion' in biased_decision:
                if not biased_decision['loss_aversion']['actual_decision']:
                    adjustments[i] *= 0.8  # Reduced participation due to loss aversion
            
            if 'present_bias' in biased_decision:
                actual_savings_rate = biased_decision['present_bias']['actual_savings_rate']
                optimal_rate = biased_decision['present_bias']['optimal_savings_rate']
                adjustments[i] *= actual_savings_rate / optimal_rate if optimal_rate > 0 else 1.0
            
            if 'optimism_bias' in biased_decision:
                # Optimism leads to under-preparation
                adjustments[i] *= 0.9
            
            # Add random noise for individual variation
            adjustments[i] *= np.random.normal(1.0, 0.05)
        
        return adjustments
    
    def calculate_social_influence_adjustments(
        self,
        base_behavior: np.ndarray,
        profile_data: Dict[str, Any]
    ) -> np.ndarray:
        """
        Adjust behavior based on social and cultural influences.
        """
        iterations = len(base_behavior)
        adjustments = np.ones(iterations)
        
        # Calculate social pressure
        individual_income = profile_data.get('monthly_income', 5000) * 12
        peer_median_income = individual_income * 1.1  # Assume slightly higher peer income
        
        social_pressure = self.social_model.calculate_social_financial_pressure(
            individual_income,
            peer_median_income,
            family_expectations=True
        )
        
        # Apply pressure to behavior
        for i in range(iterations):
            # Social pressure affects spending and saving
            if social_pressure > 0.7:
                # High pressure leads to overspending
                adjustments[i] *= (1 + social_pressure * 0.2)
            elif social_pressure > 0.5:
                # Moderate pressure
                adjustments[i] *= (1 + social_pressure * 0.1)
            
            # Add cultural influence
            if self.params.cultural_background == 'eastern_collectivist':
                # Higher savings rate
                adjustments[i] *= 0.85  # Lower spending
            elif self.params.cultural_background == 'western_individualist':
                # More comfortable with debt
                adjustments[i] *= 1.05
        
        return adjustments
    
    def generate_behavioral_report(self) -> Dict[str, Any]:
        """
        Generate comprehensive report on behavioral influences.
        """
        report = {
            'behavioral_profile': {
                'personality_type': self.params.personality_type,
                'financial_literacy': self.params.financial_literacy,
                'risk_tolerance': self.params.risk_tolerance,
                'primary_biases': self._identify_primary_biases(),
                'cultural_influences': self.params.cultural_background,
                'social_network': self.params.social_network_strength
            },
            'behavioral_recommendations': self._generate_recommendations(),
            'bias_mitigation_strategies': self._suggest_bias_mitigation(),
            'behavioral_score': self._calculate_behavioral_score()
        }
        
        return report
    
    def _identify_primary_biases(self) -> List[str]:
        """Identify the most impactful biases for this profile."""
        biases = []
        
        if self.params.loss_aversion > 2.2:
            biases.append('high_loss_aversion')
        if self.params.present_bias < 0.7:
            biases.append('strong_present_bias')
        if self.params.optimism_level == 'high':
            biases.append('optimism_bias')
        if self.params.anchoring_susceptibility > 0.6:
            biases.append('anchoring_effect')
        
        return biases
    
    def _generate_recommendations(self) -> List[str]:
        """Generate personalized behavioral recommendations."""
        recommendations = []
        
        if self.params.financial_literacy < 0.5:
            recommendations.append('Invest in financial education to improve decision-making')
        
        if self.params.present_bias < 0.7:
            recommendations.append('Set up automatic savings to overcome present bias')
        
        if self.params.personality_type == 'avoider':
            recommendations.append('Schedule regular financial check-ins to avoid procrastination')
        
        if self.params.peer_influence_level > 0.6:
            recommendations.append('Create spending rules to resist peer pressure')
        
        return recommendations
    
    def _suggest_bias_mitigation(self) -> Dict[str, str]:
        """Suggest strategies to mitigate cognitive biases."""
        strategies = {}
        
        if self.params.loss_aversion > 2.2:
            strategies['loss_aversion'] = 'Reframe investments as long-term gains rather than potential losses'
        
        if self.params.present_bias < 0.7:
            strategies['present_bias'] = 'Use commitment devices like automatic transfers and penalties'
        
        if self.params.optimism_level == 'high':
            strategies['optimism_bias'] = 'Use conservative estimates and plan for worst-case scenarios'
        
        return strategies
    
    def _calculate_behavioral_score(self) -> float:
        """
        Calculate overall behavioral finance score (0-100).
        Higher scores indicate better financial behavior potential.
        """
        score = 50.0  # Base score
        
        # Positive factors
        score += self.params.financial_literacy * 20
        score += self.params.self_control * 15
        score += (1 - (self.params.loss_aversion - 1) / 2) * 10  # Less loss aversion is better
        score += self.params.present_bias * 10  # Higher beta is better
        
        # Negative factors
        score -= (1 - self.params.risk_tolerance) * 5 if self.params.risk_tolerance < 0.3 else 0
        score -= self.params.peer_influence_level * 5 if self.params.peer_influence_level > 0.7 else 0
        
        return max(0, min(100, score))